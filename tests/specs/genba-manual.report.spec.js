// 現場ナビの週の報告：報告タブ（①工程を選んで写真を入れる・振り分ける → ②工程ごとの様子 → ③送る）→ 偽の Box に届いた報告 JSON の中身を確かめる
const { test, expect, receiveManual, addSite, addPhoto, markCheck } = require("../fixtures/app");
const { fakeManualPack } = require("../fixtures/fake-manual");

const toastOf = (app, text) => app.locator(".toast, #toast").filter({ hasText: text }).first();

// 報告タブを開く（今週の報告の1枚の流れ）
async function openReportTab(app) {
  await app.evaluate(() => goReport());
  await expect(app.locator("#reportSendBtn")).toBeVisible();
}

// 報告タブに来週の予定などを書く。写真以外・上司へのメモは「＋ 書き足す」を押して開く
async function writeDraft(app, { doneOther = "", next = "", memo = "" } = {}) {
  if (next) await app.locator("#draftNext").fill(next);
  if (doneOther || memo) {
    if (await app.locator("#reportMoreBtn").isVisible()) await app.locator("#reportMoreBtn").click();
    if (doneOther) await app.locator("#draftDoneOther").fill(doneOther);
    if (memo) await app.locator("#draftMemo").fill(memo);
  }
}

// 「N 枚を送る」→ 確認の画面で「送信する」
async function sendReport(app, draft = {}) {
  await openReportTab(app);
  await writeDraft(app, draft);
  await app.locator("#reportSendBtn").click();
  const sheet = app.locator(".sheet").last();
  await expect(sheet).toContainText("Boxへ送信");
  await sheet.getByRole("button", { name: "送信する" }).click();
  await expect(toastOf(app, "報告済みにしました")).toBeVisible({ timeout: 15000 });
}

// ファイル選択（setInputFiles）に渡す小さな JPEG（カメラの代わりに画面の中で作る addPhoto とは別の道）
const JPEG = Buffer.from(Object.values(fakeManualPack().pages)[0].split(",")[1], "base64");
const jpegs = (n) => Array.from({ length: n }, (_, i) => ({ name: `t${i + 1}.jpg`, mimeType: "image/jpeg", buffer: JPEG }));

test("報告を送ると、報告 JSON と写真が Box に届き、中身が正しい", async ({ app, gas, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001", "テスト様");
  await addPhoto(app, { processId: "p02", itemId: "m902", color: "#c00" }); // お客様にも
  await addPhoto(app, { processId: "p04", itemId: "m903", custOff: true, color: "#00c" }); // 上司だけ
  await markCheck(app, "m902", 0);
  await openReportTab(app);
  // 工程ごとの様子：基礎（p02）に「完了」と一言
  const p02 = app.locator('.flowProc[data-pid="p02"]');
  await p02.getByRole("button", { name: "完了", exact: true }).click();
  await p02.locator("textarea").fill("配筋のテスト検査 合格");
  await p02.locator("textarea").blur();
  await sendReport(app, { doneOther: "テストの作業をしました", next: "来週もテスト", memo: "上司へのテストメモ" });

  expect(gas.box.sent).toHaveLength(1);
  const files = gas.box.sent[0].files;
  const json = files.find((f) => f.name.endsWith(".json"));
  expect(json.name).toMatch(/^報告_テスト_テスト様邸新築_\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}\.json$/);
  expect(files.filter((f) => f.name.endsWith(".jpg"))).toHaveLength(2);

  const r = JSON.parse(json.data.toString("utf8"));
  expect(r.kind).toBe("genba-photo-report");
  expect(r.schema).toBe(9);
  expect(r.customer_name).toBe("テスト様"); // お客様名（メールの宛名の目安）
  expect(r.site).toBe("テスト様邸 新築");
  expect(r.kouji_no).toBe("T26001");
  expect(r.sender).toBe("テスト");
  expect(r.manual_version).toBe("test");
  expect(r.customer).toEqual({ done_other: "テストの作業をしました", next: "来週もテスト" });
  expect(r.memo).toBe("上司へのテストメモ");
  expect(r.processes.find((p) => p.no === 2)).toMatchObject({ status: "完了", note: "配筋のテスト検査 合格", taken_count: 1, selected_count: 1 });
  // 写真：お客様向けかどうか・項目名・ファイル名が届いた写真とそろっている
  expect(r.photos.map((p) => [p.process_no, p.item, p.customer, p.kind])).toEqual([
    [2, "テスト配筋", true, "report"],
    [4, "テスト建て方", false, "report"],
  ]);
  const jpgNames = files.filter((f) => f.name.endsWith(".jpg")).map((f) => f.name).sort();
  expect(r.photos.map((p) => p.file).sort()).toEqual(jpgNames);
  // チェック：付けたチェックが固定番号つきで入っている
  const c = r.checks.find((x) => x.item_id === "m902");
  expect(c.checked.map((x) => x.id)).toEqual(["m902.c01"]);
  expect(c.checks_done).toBe(1);
  expect(c.checks_total).toBe(2);
  expect(errors).toEqual([]);
});

test("送ったあと、写真は報告済みになり、お客様向けの番号が付く", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p04", itemId: "m903", color: "#0c0" });
  await addPhoto(app, { processId: "p02", itemId: "m902", color: "#c00" });
  await addPhoto(app, { processId: "p02", custOff: true, color: "#00c" });
  await sendReport(app);

  const photos = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).map((p) => ({ pid: p.processId, reported: !!p.reportId, no: p.sentCustNo, pick: !!p.sendPick })));
  expect(photos.every((p) => p.reported && !p.pick)).toBe(true);
  // 番号はお客様向けだけ、工程の順（基礎 p02 → 建方 p04）
  const nos = photos.filter((p) => p.no).sort((a, b) => a.no - b.no).map((p) => p.pid);
  expect(nos).toEqual(["p02", "p04"]);
  expect(photos.filter((p) => !p.no)).toHaveLength(1);
});

test("取り消して送り直すと、同じ report_id・同じ週で届き、メモも戻る（見守りで二重に数えない）", async ({ app, gas }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p02" });
  await sendReport(app, { memo: "1回目のメモ" });
  await app.evaluate(async () => {
    const r = (await dbGetAll("reports", "siteId", currentSiteId))[0];
    await undoReport(r);
  });
  await expect(toastOf(app, "報告を取り消しました")).toBeVisible();
  // 取り消すと報告タブに戻り、書きかけの上司へのメモも戻っている（書きかけがあるので最初から開いている）
  await expect(app.locator("#draftMemo")).toHaveValue("1回目のメモ");
  await app.locator("#reportSendBtn").click();
  await app.locator(".sheet").last().getByRole("button", { name: "送信する" }).click();
  await expect(toastOf(app, "報告済みにしました")).toBeVisible({ timeout: 15000 });
  const sent = gas.box.sent.map((s) => JSON.parse(s.files.find((f) => f.name.endsWith(".json")).data.toString("utf8")));
  expect(sent).toHaveLength(2);
  expect(sent[1].report_id).toBe(sent[0].report_id);
  expect(sent[1].week).toBe(sent[0].week);
});

// 「＋ 工程を追加」から、その工程のボタン（チップ）を出して選ぶ
async function addChip(app, pid) {
  const name = await app.evaluate((id) => processOf(id).name, pid);
  await app.locator("#procAddBtn").click();
  await app.locator(".sheet").last().locator(".pickItem").filter({ hasText: name }).click();
  await expect(app.locator(`.procChip[data-pid="${pid}"]`)).toHaveClass(/active/);
}
// 「取り込む」を押して、カメラロールから写真をまとめて選ぶ（本物の iPhone と同じく、ボタンから選ぶ窓を開く）
async function importFiles(app, files) {
  const [chooser] = await Promise.all([app.waitForEvent("filechooser"), app.locator("#reportImportBtn").click()]);
  await chooser.setFiles(files);
}
const photosOf = (app) => app.evaluate(async () => (await getSitePhotos(currentSiteId)).map((p) => ({ pid: p.processId, kind: p.kind, pick: p.sendPick, item: p.itemId || "" })));

test("工程を選ばなくても、撮る・取り込むが押せて、選ばずに取り込むと未振り分けに入る", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  // 工程がまだ無くても、案内で止めない。撮る・取り込むが押せて、最初に選ばれているのは「未振り分け」
  await expect(app.locator("#procGate")).toHaveCount(0);
  await expect(app.locator("#reportShootBtn")).toBeEnabled();
  await expect(app.locator("#reportImportBtn")).toBeEnabled();
  await expect(app.locator(".procChip")).toHaveCount(1);
  await expect(app.locator(".procChip.active")).toHaveAttribute("data-pid", "");
  await importFiles(app, jpegs(2));
  await expect(toastOf(app, "未振り分けで2枚入れました")).toBeVisible();
  expect((await photosOf(app)).map((p) => p.pid)).toEqual(["", ""]);
  await expect(app.locator("#sortGrid .sortCell.unsorted")).toHaveCount(2);
  // 工程を足すと、足した工程が選ばれる。「未振り分け」のボタンは最後に並ぶ
  await addChip(app, "p02");
  await expect(app.locator(".procChip").last()).toHaveText(/未振り分け/);
});

test("①の並び：撮る・取り込む → 工程を追加 → 工程のボタンと写真の一覧（すき間なし）。撮影メモは畳まれている", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p02" });
  await openReportTab(app);
  const y = (sel) => app.locator(sel).evaluate((e) => e.getBoundingClientRect().top);
  const ys = [await y("#reportShootBtn"), await y("#procAddBtn"), await y("#reportMemoFold"), await y(".sortWrap")];
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  // 工程のボタンと写真の一覧は、同じ枠の中でくっついている
  await expect(app.locator(".sortWrap > #procChips")).toHaveCount(1);
  await expect(app.locator(".sortWrap > #sortGrid")).toHaveCount(1);
  // 撮影メモは1行に畳まれていて、押すと開く。開け閉めは次も覚えている
  const memo = app.locator("#reportMemoFold");
  await expect(memo).toContainText("撮影メモ");
  expect(await memo.evaluate((e) => e.open)).toBe(false);
  await app.locator('.procChip[data-pid="p02"]').click();
  expect(await memo.evaluate((e) => e.open)).toBe(false); // 工程を選び替えても閉じたまま
  await memo.locator("summary").click();
  expect(await memo.evaluate((e) => e.open)).toBe(true);
  await expect(memo.locator(".intakeGuide")).toContainText("基礎");
  await app.evaluate(() => goReport());
  await expect(app.locator("#reportSendBtn")).toBeVisible();
  expect(await app.locator("#reportMemoFold").evaluate((e) => e.open)).toBe(true);
});

test("工程を選んでまとめて取り込むと、その工程に入り、最初から全部送る写真になる", async ({ app, gas, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  await addChip(app, "p02");
  await importFiles(app, jpegs(3));
  await expect(toastOf(app, "3枚入れました")).toBeVisible();

  // その工程に3枚入り、①の一覧と②の工程ごとの様子に並ぶ。送る写真は最初から3枚
  expect(await photosOf(app)).toEqual([1, 2, 3].map(() => ({ pid: "p02", kind: "report", pick: true, item: "" })));
  await expect(app.locator("#sortGrid .sortCell")).toHaveCount(3);
  await expect(app.locator('.flowProc[data-pid="p02"] .photoCard')).toHaveCount(3);
  await expect(app.locator("#reportSendBtn")).toHaveText("3 枚を送る");
  await expect(app.locator("#reportPhotoStat")).toContainText("すべて振り分け済み");

  // 何も外さず送ると、3枚とも届く（お客様にも）
  await sendReport(app);
  const r = JSON.parse(gas.box.sent[0].files.find((f) => f.name.endsWith(".json")).data.toString("utf8"));
  expect(r.photos.map((p) => [p.process_no, p.customer])).toEqual([[2, true], [2, true], [2, true]]);
  expect(errors).toEqual([]);
});

test("工程を選んで撮ると、その工程に入る。未振り分けで撮ると工程なしで入る", async ({ app, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  await addChip(app, "p02");
  const shoot = async () => {
    const [chooser] = await Promise.all([app.waitForEvent("filechooser"), app.locator("#reportShootBtn").click()]);
    await chooser.setFiles(jpegs(1));
    await expect(app.locator("#shotView")).toBeVisible();
  };
  await shoot();
  await expect(app.locator("#shotTitle")).toHaveText("地盤・基礎工事");
  await app.locator("#shotDoneBtn").click();
  await expect(app.locator("#reportSendBtn")).toBeVisible();
  await app.locator('.procChip[data-pid=""]').click(); // 未振り分けで撮る
  await shoot();
  await expect(app.locator("#shotTitle")).toHaveText("未振り分け");
  await app.locator("#shotDoneBtn").click();
  expect((await photosOf(app)).map((p) => p.pid).sort()).toEqual(["", "p02"]);
  await expect(app.locator('.procChip[data-pid=""]')).toHaveClass(/active/); // 撮ったあとも、選んでいたボタンのまま
  await expect(app.locator("#sortGrid .sortCell.unsorted")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("未振り分けで取り込み、工程のボタンを選んで写真を押すと振り分けられる", async ({ app, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  await addChip(app, "p02");
  await app.locator('.procChip[data-pid=""]').click();
  await importFiles(app, jpegs(3));
  await expect(toastOf(app, "未振り分けで3枚入れました")).toBeVisible();
  expect((await photosOf(app)).map((p) => p.pid)).toEqual(["", "", ""]);
  await expect(app.locator("#sortGrid .sortCell.unsorted")).toHaveCount(3);
  await expect(app.locator("#reportPhotoStat")).toContainText("未振り分け 3 枚");
  await expect(app.locator("#sortGrid .sortTag").first()).toHaveText("未振り分け");
  await expect(app.locator('.flowProc[data-pid="p02"] .photoCard')).toHaveCount(0); // ②には出ない

  // 基礎のボタンを選んで写真を押すと、その写真が基礎に入る
  await app.locator('.procChip[data-pid="p02"]').click();
  await app.locator("#sortGrid .sortCell .sortPhoto").first().click();
  await expect(app.locator("#sortGrid .sortCell.unsorted")).toHaveCount(2);
  await expect(app.locator("#sortGrid .sortTag").first()).toHaveText("基礎");
  await expect(app.locator('.flowProc[data-pid="p02"] .photoCard')).toHaveCount(1);
  await expect(app.locator("#reportPhotoStat")).toContainText("未振り分け 2 枚");
  expect((await photosOf(app)).map((p) => p.pid).sort()).toEqual(["", "", "p02"]);

  // 残りも押して振り分けると「すべて振り分け済み」。「未振り分け」のボタンを選んで押すと、未振り分けに戻る
  await app.locator("#sortGrid .sortCell.unsorted .sortPhoto").first().click();
  await app.locator("#sortGrid .sortCell.unsorted .sortPhoto").first().click();
  await expect(app.locator("#reportPhotoStat")).toContainText("すべて振り分け済み");
  await app.locator('.procChip[data-pid=""]').click();
  await app.locator("#sortGrid .sortCell .sortPhoto").nth(1).click();
  await expect(app.locator("#sortGrid .sortCell.unsorted")).toHaveCount(1);
  expect((await photosOf(app)).map((p) => p.pid).sort()).toEqual(["", "p02", "p02"]);

  // 虫めがねで拡大できる（押しても振り分けは変わらない）
  await app.locator("#sortGrid .sortZoom").first().click();
  await expect(app.locator("#lightbox")).toBeVisible();
  await app.locator("#lightbox").getByRole("button", { name: "閉じる" }).click();
  expect((await photosOf(app)).map((p) => p.pid).sort()).toEqual(["", "p02", "p02"]);
  expect(errors).toEqual([]);
});

test("未振り分けの写真が残っていると送れない。振り分けると送れる", async ({ app, gas }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p02", color: "#c00" });
  await addPhoto(app, { processId: "", color: "#00c" }); // 未振り分け
  const messages = [];
  app.on("dialog", (d) => messages.push(d.message()));
  await openReportTab(app);
  await expect(app.locator("#reportUnsortedWarn")).toContainText("まだ振り分けていない写真が1枚あります。①で工程を選んでから送ってください");
  await app.locator("#reportSendBtn").click();
  await expect.poll(() => messages.length).toBeGreaterThan(0);
  expect(messages[0]).toContain("まだ振り分けていない写真が1枚あります。①で工程を選んでから送ってください");
  await expect(app.locator(".sheet").last()).not.toContainText("Boxへ送信");
  expect(gas.box.sent).toHaveLength(0);

  // 基礎のボタンを選んで押して振り分けると、警告が消えて送れる（未振り分けの印は Box に届かない）
  await app.locator('.procChip[data-pid="p02"]').click();
  await app.locator("#sortGrid .sortCell.unsorted .sortPhoto").click();
  await expect(app.locator("#reportUnsortedWarn")).toBeHidden();
  await sendReport(app);
  const r = JSON.parse(gas.box.sent[0].files.find((f) => f.name.endsWith(".json")).data.toString("utf8"));
  expect(r.photos.map((p) => p.process_no)).toEqual([2, 2]);
  expect(r.processes.map((p) => p.no)).toEqual([2]);
});

test("次に開いた時は、前回入れた工程のボタンは並ぶが、選ばれているのは未振り分け", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  await addChip(app, "p04");
  await importFiles(app, jpegs(1));
  await expect(toastOf(app, "1枚入れました")).toBeVisible();
  // 別の工程のボタンを押してから開き直しても、前回入れた建方が選ばれている（アプリを閉じて開いた時と同じ）
  await app.evaluate(() => {
    reportSel = null;
    return goReport();
  });
  await expect(app.locator(".procChip.active")).toHaveAttribute("data-pid", "");
  await expect(app.locator('.procChip[data-pid="p04"]')).toBeVisible();
});

test("項目ページの入口から入れると、その工程が選ばれ、項目が写真に残る", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await app.evaluate(() => openIntake({ pid: "p02", itemId: "m902" }));
  await expect(app.locator("#reportSendBtn")).toBeVisible(); // 報告タブが開く
  await expect(app.locator(".procChip.active")).toHaveAttribute("data-pid", "p02");
  await expect(app.locator(".procHeroItem")).toContainText("テスト配筋");
  await importFiles(app, jpegs(2));
  await expect(toastOf(app, "2枚入れました")).toBeVisible();
  expect((await photosOf(app)).map((p) => [p.pid, p.item])).toEqual([["p02", "m902"], ["p02", "m902"]]);
});

test("送らない写真を外すと、その写真は送られず、次の報告に残る", async ({ app, gas }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p02", color: "#c00" });
  await addPhoto(app, { processId: "p02", color: "#0c0" });
  await addPhoto(app, { processId: "p04", color: "#00c" });
  await openReportTab(app);
  await expect(app.locator("#reportSendBtn")).toHaveText("3 枚を送る");
  const card = app.locator('.flowProc[data-pid="p02"] .photoCard').first();
  const outId = await card.getAttribute("data-id");
  await card.locator(".photoCardImg").click();
  await expect(card).toHaveClass(/unsent/);
  await expect(app.locator("#reportSendBtn")).toHaveText("2 枚を送る");
  await expect(app.locator('.flowProc[data-pid="p02"] .procStat')).toContainText("送る 1 枚");
  await app.locator("#reportSendBtn").click();
  await app.locator(".sheet").last().getByRole("button", { name: "送信する" }).click();
  await expect(toastOf(app, "報告済みにしました")).toBeVisible({ timeout: 15000 });

  const files = gas.box.sent[0].files;
  const r = JSON.parse(files.find((f) => f.name.endsWith(".json")).data.toString("utf8"));
  expect(r.photos).toHaveLength(2);
  expect(r.photos.map((p) => p.id)).not.toContain(outId);
  expect(files.filter((f) => f.name.endsWith(".jpg"))).toHaveLength(2);
  expect(r.processes.find((p) => p.no === 2)).toMatchObject({ taken_count: 2, selected_count: 1 });
  const left = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).filter((p) => !p.reportId).map((p) => [p.id, !!p.sendPick]));
  expect(left).toEqual([[outId, false]]);
  // もう一度押すと送る写真に戻る
  await openReportTab(app);
  await app.locator(`.photoCard[data-id="${outId}"] .photoCardImg`).click();
  await expect(app.locator("#reportSendBtn")).toHaveText("1 枚を送る");
});

test("今週は報告なしを押すと、報告なしの記録になる", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  // 一番下の2つは、リンク文字ではなく、枠のあるボタン
  for (const id of ["#reportSkipBtn", "#reportOtherBtn"]) {
    const st = await app.locator(id).evaluate((e) => ({ border: getComputedStyle(e).borderTopWidth, h: e.getBoundingClientRect().height, tag: e.tagName }));
    expect(st.tag).toBe("BUTTON");
    expect(parseFloat(st.border)).toBeGreaterThan(0);
    expect(st.h).toBeGreaterThanOrEqual(44);
  }
  await app.locator("#reportSkipBtn").click();
  await app.locator(".sheet").last().getByRole("button", { name: "記録する" }).click();
  await expect(toastOf(app, "今週は報告なしにしました")).toBeVisible();
  const reps = await app.evaluate(async () => (await dbGetAll("reports", "siteId", currentSiteId)).map((r) => r.kind));
  expect(reps).toEqual(["skip"]);
});
