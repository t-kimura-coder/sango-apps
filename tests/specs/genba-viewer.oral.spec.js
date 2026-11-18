// 見守り：疑問に「口頭で回答済み」（2026-11-18）。返信欄の横のボタン → 一言（空でもよい）→ 口頭の印つきの返信が送られる。
// 監督が現場ナビに書く「答えのメモ」は、見守りには一切出ない。
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const { useFakeGas, TEST_TOKEN } = require("../fixtures/fake-gas");

const DIR = path.join(__dirname, "..", "..", "genba-viewer");

// PC の見守りの画面で試す（スマホの画面は、スマホのテストで画面の表示を「スマホ用」にして試す）
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
const QUESTION = "demo-s8-n0-4"; // サンプルデータの疑問（作りもの）

// 偽の GAS（上司の合言葉のふり）を立て、入口を通ってから、サンプルデータを開き、疑問の詳細（返信の画面）を出す
const BOSS_ME = { name: "試験の上司", role: "上司", team: "全員" };
async function openQuestion(page, { mobile = false } = {}) {
  const gas = await useFakeGas(page, { me: BOSS_ME, handlers: { myTeam: () => ({ all: true, team: "全員", members: [] }) } });
  await page.addInitScript(([token, mode]) => {
    if (sessionStorage.getItem("test-ready")) return;
    sessionStorage.setItem("test-ready", "1");
    localStorage.setItem("genba-viewer-gasToken", token);
    localStorage.setItem("genba-viewer-viewMode", mode);
  }, [TEST_TOKEN, mobile ? "mobile" : "pc"]);
  await page.goto("genba-viewer/");
  await expect(page.locator("#gate")).toHaveCount(0); // 入口は合言葉で通る
  await page.evaluate(() => loadDemo());
  await page.evaluate((id) => openNote(id), QUESTION);
  await expect(page.locator("#drawer")).toBeVisible();
}
const replyOf = (page) => page.evaluate((id) => (data.replies.get(id) || []).slice(-1)[0] || null, QUESTION);

test("疑問の返信欄の横に『口頭で回答済み』が出る（気づきには出ない）", async ({ page }) => {
  await openQuestion(page);
  await expect(page.locator("#oralBtn")).toBeVisible();
  await expect(page.locator("#oralBtn")).toContainText("口頭で回答済み");
  await expect(page.locator("#oralBox")).toBeHidden(); // 押すまで一言の欄は出さない
  // 気づきには出さない（返信不要のため）
  await page.evaluate(() => openNote("demo-s5-n0-0.5"));
  await expect(page.locator("#oralBtn")).toHaveCount(0);
});

test("口頭で回答済みを押し、一言を書いて確定すると、口頭の印つきの返信になり、状態は返信済みになる", async ({ page }) => {
  await openQuestion(page);
  await page.locator("#oralBtn").click();
  await expect(page.locator("#oralBox")).toBeVisible();
  await page.locator("#oralNote").fill("梁の下を通してよい（テスト）");
  await page.locator("#oralSend").click();
  const r = await replyOf(page);
  expect(r).toMatchObject({ oral: true, oral_note: "梁の下を通してよい（テスト）", text: "口頭で回答しました：梁の下を通してよい（テスト）", from_role: "上司", note_id: QUESTION });
  expect(await page.evaluate((id) => noteStatus(data.notes.get(id)), QUESTION)).toBe("replied");
  await expect(page.locator("#drawerBody .pastReply.oral")).toContainText("口頭で回答済み：梁の下を通してよい（テスト）");
});

test("一言が空でもよい（本文は『口頭で回答しました』だけ）", async ({ page }) => {
  await openQuestion(page);
  await page.locator("#oralBtn").click();
  await page.locator("#oralSend").click();
  const r = await replyOf(page);
  expect(r).toMatchObject({ oral: true, oral_note: "", text: "口頭で回答しました" });
  await expect(page.locator("#drawerBody .pastReply.oral")).toContainText("口頭で回答済み");
  await expect(page.locator("#drawerBody .pastReply.oral")).not.toContainText("口頭で回答済み：");
});

test("やめるを押すと、返信は送られない", async ({ page }) => {
  await openQuestion(page);
  await page.locator("#oralBtn").click();
  await page.locator("#oralNote").fill("書きかけ");
  await page.locator("#oralCancel").click();
  await expect(page.locator("#oralBox")).toBeHidden();
  expect(await replyOf(page)).toBeNull();
});

test("スマホの画面でも、ボタンと一言の欄が使える", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openQuestion(page, { mobile: true });
  expect(await page.evaluate(() => MOBILE)).toBe(true); // スマホ用の画面
  await expect(page.locator("#oralBtn")).toBeVisible();
  await page.locator("#oralBtn").click();
  await expect(page.locator("#oralNote")).toBeVisible();
  await expect(page.locator("#oralSend")).toBeVisible();
  const box = await page.locator("#oralBox").boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390); // 横にはみ出さない
  await page.locator("#oralSend").click();
  expect((await replyOf(page)).oral).toBe(true);
});

test("GAS 経由の疑問への返信は、口頭の印（oral）つきで窓口に送られる", async ({ page }) => {
  const gas = await useFakeGas(page, { me: BOSS_ME, handlers: { myTeam: () => ({ all: true, team: "全員", members: [] }) } });
  await page.addInitScript((token) => {
    if (sessionStorage.getItem("test-ready")) return;
    sessionStorage.setItem("test-ready", "1");
    localStorage.setItem("genba-viewer-gasToken", token);
  }, TEST_TOKEN);
  await page.goto("genba-viewer/");
  await expect(page.locator("#gate")).toHaveCount(0);
  const ok = await page.evaluate(async () => {
    const n = { id: "q-oral-viewer-1", type: "question", text: "テストの疑問", itemId: "m902", item: "テスト配筋", siteId: "s1", siteKey: "kouji:T26001", siteName: "テスト様邸", personKey: "name:テスト監督", personName: "テスト監督", gasFrom: "テスト監督", viaGas: true };
    data.notes.set(n.id, n);
    return sendReply(n, oralReplyText("一言（テスト）"), false, { note: "一言（テスト）" });
  });
  expect(ok).toBe(true);
  const post = gas.calls.find((c) => c.action === "post" && c.msg.kind === "reply");
  expect(post, "窓口に返信が届く").toBeTruthy();
  expect(post.msg.thread).toBe("q-oral-viewer-1");
  expect(post.msg.to).toBe("テスト監督");
  expect(post.msg.payload).toMatchObject({ oral: true, oral_note: "一言（テスト）", text: "口頭で回答しました：一言（テスト）", from_role: "上司", note_id: "q-oral-viewer-1" });
  // ふつうの返信には印を付けない
  await page.evaluate(() => sendReply(data.notes.get("q-oral-viewer-1"), "ふつうの返信（テスト）"));
  const normal = gas.calls.filter((c) => c.action === "post" && c.msg.kind === "reply").pop();
  expect(normal.msg.payload.oral).toBeUndefined();
});

test("監督の答えのメモは、見守りのどの画面にも出ない（疑問の詳細・一覧・設定・スマホ）", async ({ page }) => {
  await openQuestion(page);
  // 万一メモの欄が混ざって届いても、見守りは描かない（欄の名前は GAS と現場ナビの決まりのもの）
  await page.evaluate((id) => {
    const n = data.notes.get(id);
    n.answerMemos = [{ ver: 1, text: "ひみつの答えのメモ（テスト）", at: new Date().toISOString() }];
    n.answer_memo = "ひみつの答えのメモ（テスト）";
    (data.replies.get(id) || []).forEach((r) => (r.memo = "ひみつの答えのメモ（テスト）"));
  }, QUESTION);
  const seen = [];
  for (const hash of ["#/home", "#/notes", "#/sites", "#/weeks", "#/settings"]) {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(150);
    seen.push(await page.locator("body").innerText());
  }
  await page.evaluate((id) => openNote(id), QUESTION);
  seen.push(await page.locator("#drawer").innerText());
  seen.forEach((t) => expect(t).not.toContain("ひみつの答えのメモ"));
});

test("見守りのコードは、答えのメモを読み出さない（GAS の答えのメモ・メモ欄の名前を一度も使っていない）", async () => {
  for (const f of fs.readdirSync(DIR).filter((x) => /\.(js|html)$/.test(x))) {
    const text = fs.readFileSync(path.join(DIR, f), "utf8");
    expect(text, f).not.toMatch(/answerMemo|answer_memo|getAnswerMemos|答えのメモ/);
  }
});

test("スマホの画面でも、答えのメモは出ない", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openQuestion(page, { mobile: true });
  await page.evaluate((id) => {
    const n = data.notes.get(id);
    n.answerMemos = [{ ver: 1, text: "ひみつの答えのメモ（テスト）", at: new Date().toISOString() }];
    n.answer_memo = "ひみつの答えのメモ（テスト）";
  }, QUESTION);
  const seen = [await page.locator("#drawer").innerText()];
  for (const hash of ["#/home", "#/notes", "#/settings"]) {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.waitForTimeout(150);
    seen.push(await page.locator("body").innerText());
  }
  seen.forEach((t) => expect(t).not.toContain("ひみつの答えのメモ"));
});