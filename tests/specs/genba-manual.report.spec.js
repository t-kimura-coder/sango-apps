// 現場ナビの週の報告：報告タブ（写真を入れる → 工程ごとの様子 → 送る）→ 偽の Box に届いた報告 JSON の中身を確かめる
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
  await addSite(app, "テスト様邸 新築", "T26001");
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
  expect(r.schema).toBe(8);
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

test("工程を選んでまとめて取り込むと、その工程に入り、最初から全部送る写真になる", async ({ app, gas, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  const name = await app.evaluate(() => shortProcessName(processOf("p02")));
  await app.locator("#reportImportBtn").click();
  const sheet = app.locator(".sheet").last();
  await expect(sheet).toContainText("写真を入れる");
  // 工程を先に選ぶ（今週の工程はまだ無いので「ほかの工程を探す」から）
  await sheet.getByRole("button", { name: "ほかの工程を探す" }).click();
  await sheet.locator('.intakeMore .pickItem[data-pid="p02"]').click();
  await expect(sheet.locator(".intakeGuide")).toContainText(name); // 撮影メモの小さな案内
  await app.locator("#libraryInput").setInputFiles(jpegs(3));
  await sheet.getByRole("button", { name: `${name}に3枚入れる` }).click();
  await expect(toastOf(app, "3枚入れました")).toBeVisible();

  // その工程に3枚入り、報告タブの工程ごとの様子にも並ぶ。送る写真は最初から3枚
  const photos = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).map((p) => ({ pid: p.processId, kind: p.kind, pick: p.sendPick })));
  expect(photos).toEqual([1, 2, 3].map(() => ({ pid: "p02", kind: "report", pick: true })));
  await expect(app.locator('.flowProc[data-pid="p02"] .photoCard')).toHaveCount(3);
  await expect(app.locator("#reportSendBtn")).toHaveText("3 枚を送る");

  // 何も外さず送ると、3枚とも届く（お客様にも）
  await sendReport(app);
  const r = JSON.parse(gas.box.sent[0].files.find((f) => f.name.endsWith(".json")).data.toString("utf8"));
  expect(r.photos.map((p) => [p.process_no, p.customer])).toEqual([[2, true], [2, true], [2, true]]);
  expect(errors).toEqual([]);
});

test("次に開いた時は、前回入れた工程が最初から選ばれている", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReportTab(app);
  await app.locator("#reportImportBtn").click();
  let sheet = app.locator(".sheet").last();
  await sheet.getByRole("button", { name: "ほかの工程を探す" }).click();
  await sheet.locator('.intakeMore .pickItem[data-pid="p04"]').click();
  await app.locator("#libraryInput").setInputFiles(jpegs(1));
  await sheet.getByRole("button", { name: /に1枚入れる$/ }).click();
  await expect(toastOf(app, "1枚入れました")).toBeVisible();
  await app.locator("#reportShootBtn").click();
  sheet = app.locator(".sheet").last();
  await expect(sheet.locator(".intakeList .pickItem.picked")).toHaveAttribute("data-pid", "p04");
  await expect(sheet.getByRole("button", { name: "撮影する" })).toBeVisible();
});

test("項目ページの入口から入れると、その工程が選ばれ、項目が写真に残る", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await app.evaluate(() => openIntake({ pid: "p02", itemId: "m902" }));
  const sheet = app.locator(".sheet").last();
  await expect(sheet.locator(".pickItem.picked").first()).toHaveAttribute("data-pid", "p02");
  await expect(sheet.locator(".procHeroItem")).toContainText("テスト配筋");
  await app.locator("#libraryInput").setInputFiles(jpegs(2));
  await sheet.getByRole("button", { name: /に2枚入れる$/ }).click();
  await expect(toastOf(app, "2枚入れました")).toBeVisible();
  const photos = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).map((p) => [p.processId, p.itemId]));
  expect(photos).toEqual([["p02", "m902"], ["p02", "m902"]]);
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
  await app.locator("#reportSkipBtn").click();
  await app.locator(".sheet").last().getByRole("button", { name: "記録する" }).click();
  await expect(toastOf(app, "今週は報告なしにしました")).toBeVisible();
  const reps = await app.evaluate(async () => (await dbGetAll("reports", "siteId", currentSiteId)).map((r) => r.kind));
  expect(reps).toEqual(["skip"]);
});
