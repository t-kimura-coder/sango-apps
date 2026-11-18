// 口頭で答えてもらった疑問（2026-11-18）：見守りの「口頭で回答済み」の返信が来る → 現場ナビに「口頭で回答済み」と出て、
// ホームの「やること」に「答えのメモ待ち」が1行出る。メモする／「今回はメモしない」で減る。閉じるだけでは減らない。メモは GAS に送る。
const { test: base, expect, receiveManual, addSite } = require("../fixtures/app");
const { useFakeGas } = require("../fixtures/fake-gas");

const NOTE_ID = "q-oral-test-1";
const BOSS = "試験の上司"; // 作りものの名前

// 偽の GAS の sync が、上司の口頭の返信を1通だけ返す
const test = base.extend({
  gas: async ({ page }, use) => {
    const state = { msgs: [] };
    const gas = await useFakeGas(page, {
      handlers: {
        sync: (body) => {
          const list = state.msgs.filter((m) => m.seq > (body.since || 0));
          return { messages: list, cursor: Math.max(body.since || 0, ...state.msgs.map((m) => m.seq), 0), more: false };
        },
        postMany: (body) => ({ results: (body.msgs || []).map((m) => ({ kind: m.kind, id: m.id, ok: true, seq: 1 })) }),
      },
    });
    gas.state = state;
    await use(gas);
  },
});

const oralReply = (note = "テストの答え") => ({
  seq: 1,
  id: "r-oral-1",
  at: "2026-11-05T01:00:00.000Z",
  kind: "reply",
  thread: NOTE_ID,
  to: "テスト",
  from: BOSS,
  payload: { note_id: NOTE_ID, text: note ? `口頭で回答しました：${note}` : "口頭で回答しました", oral: true, oral_note: note, from_role: "上司" },
});

// 現場と疑問を用意して、返信を受け取る
async function setup(app, gas, { reply = oralReply() } = {}) {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await app.waitForFunction(() => !!currentSiteId); // 登録した現場が「今の現場」になるのを待つ（待たないと、疑問が現場に結びつかない）
  await app.evaluate(async (id) => {
    await loadSiteChecks();
    const it = allManualItems().find((x) => x.id === "m902");
    const rec = checkRecOf(it.id);
    rec.notes = [{ id, type: "question", text: "テストの疑問：排水の向きは？", at: new Date().toISOString(), by: "テスト", status: "open" }];
    await saveCheckRec(rec);
  }, NOTE_ID);
  if (reply) gas.state.msgs.push(reply);
  await app.waitForFunction(() => !gasSyncing); // 開いた時の裏の受け取りと重ならないように
  await app.evaluate(() => syncGas(true));
  await app.waitForFunction(async (id) => {
    const rs = await dbGetAll("checks");
    return !gasSyncing && rs.some((r) => (r.notes || []).some((n) => n.id === id && (n.replies || []).length));
  }, NOTE_ID);
}

const todoRow = (app) => app.locator("#dashTodo .dashRow").filter({ hasText: "答えのメモ待ち" });
async function goHome(app) {
  await app.evaluate(() => goDash());
  await expect(app.locator("#dashTodo")).toBeVisible();
}
async function openItem(app) {
  await app.evaluate(async () => {
    await loadSiteChecks();
    const it = allManualItems().find((x) => x.id === "m902");
    currentMTab = "check";
    await openGroup(groupOfProcess(it.cat).id, it.id);
  });
  await expect(app.locator("#memoSection")).toBeVisible();
}
const memoCalls = (gas) => gas.calls.filter((c) => c.action === "postMany").flatMap((c) => c.msgs).filter((m) => m.kind === "memo");

test("口頭の返信が来ると『口頭で回答済み』と出て、やることに答えのメモ待ちが1行出る", async ({ app, gas, errors }) => {
  await setup(app, gas);
  await goHome(app);
  await expect(todoRow(app)).toHaveCount(1);
  await expect(todoRow(app)).toContainText("口頭で答えてもらった疑問：答えのメモ待ち");
  await expect(todoRow(app)).toContainText("1件");
  await openItem(app);
  const reply = app.locator("#memoSection .noteReply.oral");
  await expect(reply).toContainText(`${BOSS}さんが口頭で回答済み`);
  await expect(reply).toContainText("テストの答え"); // 一言を添える
  await expect(app.locator("#memoSection .ansMemo.need")).toContainText("答えをメモする");
  await expect(app.locator("#memoSection .ansMemo.need")).toContainText("今回はメモしない");
  expect(errors).toEqual([]);
});

test("一言が無い口頭の返信は、『口頭で回答済み』だけを出す", async ({ app, gas }) => {
  await setup(app, gas, { reply: oralReply("") });
  await openItem(app);
  const reply = app.locator("#memoSection .noteReply.oral");
  await expect(reply).toContainText(`${BOSS}さんが口頭で回答済み`);
  await expect(reply).not.toContainText("口頭で回答しました"); // 返信の本文（印の文）をそのまま出さない
});

test("返信を開いて閉じるだけでは、答えのメモ待ちは消えない", async ({ app, gas }) => {
  await setup(app, gas);
  await openItem(app); // 開くと返信は既読になる
  await app.evaluate(() => goDash());
  await expect(todoRow(app)).toContainText("1件");
  await app.evaluate(() => goDash());
  await expect(todoRow(app)).toHaveCount(1);
});

test("口頭でない返信では、答えのメモ待ちは出ない", async ({ app, gas }) => {
  const r = oralReply();
  r.payload = { note_id: NOTE_ID, text: "ふつうの返信です", from_role: "上司" };
  await setup(app, gas, { reply: r });
  await goHome(app);
  await expect(todoRow(app)).toHaveCount(0);
  await openItem(app);
  await expect(app.locator("#memoSection .ansMemo")).toHaveCount(0);
});

test("答えをメモすると件数が減り、GAS に答えのメモが送られる。直すと新しい版が追記される", async ({ app, gas, errors }) => {
  await setup(app, gas);
  await openItem(app);
  await app.locator("#memoSection [data-ansmemo]").click();
  const sheet = app.locator(".sheet").last();
  await sheet.locator("#ansMemoInput").fill("排水は梁の下を通す（テスト）");
  await sheet.getByRole("button", { name: "保存する" }).click();
  await expect(app.locator("#memoSection .ansMemo.done")).toContainText("排水は梁の下を通す（テスト）");
  await expect(app.locator("#memoSection .ansMemo.done")).toContainText("自分だけに見えます");

  await expect.poll(() => memoCalls(gas).length).toBe(1);
  const m = memoCalls(gas)[0];
  expect(m.id).toBe(`${NOTE_ID}.m1`);
  expect(m.thread).toBe(NOTE_ID);
  const p = m.payload;
  expect(p).toMatchObject({ note_id: NOTE_ID, state: "memo", ver: 1, memo: "排水は梁の下を通す（テスト）", question: "テストの疑問：排水の向きは？", item_id: "m902", kouji_no: "T26001", site: "テスト様邸 新築", process: expect.any(String), manual_version: "test", by: "テスト" });
  expect(p.memo_at).toBeTruthy();
  expect(p.boss_answers).toHaveLength(1);
  expect(p.boss_answers[0]).toMatchObject({ from: BOSS, oral: true, text: "テストの答え", source: "口頭（上司の一言）" });

  await goHome(app);
  await expect(todoRow(app)).toHaveCount(0); // 0件で消える

  // 直す：新しい版として追記（前の版は消えない）
  await openItem(app);
  await app.locator("#memoSection [data-ansmemo]").click();
  const sheet2 = app.locator(".sheet").last();
  await expect(sheet2.locator("#ansMemoInput")).toHaveValue("排水は梁の下を通す（テスト）");
  await sheet2.locator("#ansMemoInput").fill("排水は梁の下を通す。勾配は1/50（テスト）");
  await sheet2.getByRole("button", { name: "保存する" }).click();
  await expect.poll(() => memoCalls(gas).length).toBe(2);
  expect(memoCalls(gas)[1].id).toBe(`${NOTE_ID}.m2`);
  expect(memoCalls(gas)[1].payload).toMatchObject({ ver: 2, memo: "排水は梁の下を通す。勾配は1/50（テスト）" });
  const memos = await app.evaluate(async (id) => (await dbGetAll("checks")).flatMap((r) => r.notes || []).find((n) => n.id === id).answerMemos.map((x) => x.ver), NOTE_ID);
  expect(memos).toEqual([1, 2]);
  expect(errors).toEqual([]);
});

test("今回はメモしないを選ぶと件数が減り、GAS にもその選択が残る", async ({ app, gas }) => {
  await setup(app, gas);
  await goHome(app);
  await expect(todoRow(app)).toContainText("1件");
  await openItem(app);
  await app.locator("#memoSection [data-anskip]").click();
  await expect(app.locator("#memoSection .ansMemoSkipped")).toBeVisible();
  await expect.poll(() => memoCalls(gas).length).toBe(1);
  expect(memoCalls(gas)[0].id).toBe(`${NOTE_ID}.skip`);
  expect(memoCalls(gas)[0].payload).toMatchObject({ state: "skip", note_id: NOTE_ID, memo: "" });
  await goHome(app);
  await expect(todoRow(app)).toHaveCount(0);
  // 後から気が変わったらメモできる
  await openItem(app);
  await expect(app.locator("#memoSection [data-ansmemo]")).toBeVisible();
});

test("答えのメモ待ちの行を押すと、その疑問の項目に飛ぶ", async ({ app, gas }) => {
  await setup(app, gas);
  await goHome(app);
  await todoRow(app).click();
  await expect(app.locator("#memoSection .ansMemo.need")).toBeVisible();
});

test("監督の答えのメモは、上司に届く疑問の形にも週の報告にも入らない", async ({ app, gas }) => {
  await setup(app, gas);
  await app.evaluate(async (id) => {
    const rec = (await dbGetAll("checks")).find((r) => (r.notes || []).some((n) => n.id === id));
    rec.notes.find((n) => n.id === id).answerMemos = [{ ver: 1, text: "ひみつの答えのメモ", at: new Date().toISOString() }];
    await dbPut("checks", rec);
  }, NOTE_ID);
  const out = await app.evaluate(async () => {
    const it = allManualItems().find((x) => x.id === "m902");
    const rec = (await dbGetAll("checks")).find((r) => r.itemId === it.id);
    const n = rec.notes[0];
    return {
      notePayload: JSON.stringify(notePayload(it, n)),
      report: JSON.stringify(await buildCheckSummary(currentSiteId, "2026-11-01", "2026-11-30")),
    };
  });
  expect(out.report).toContain("テストの疑問"); // 疑問そのものは今までどおり報告に入る
  expect(out.report).not.toContain("ひみつの答えのメモ");
  expect(out.notePayload).not.toContain("ひみつの答えのメモ");
});
