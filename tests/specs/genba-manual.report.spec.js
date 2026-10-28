// 現場ナビの週の報告：写真とチェック → 「Boxへ送信」→ 偽の Box に届いた報告 JSON の中身を確かめる
const { test, expect, receiveManual, addSite, addPhoto, markCheck } = require("../fixtures/app");

async function sendReport(app, { doneOther = "", next = "", memo = "" } = {}) {
  await app.evaluate(() => sendToBox());
  const sheet = app.locator(".sheet").last();
  await expect(sheet).toContainText("Boxへ送信");
  if (doneOther) await sheet.getByPlaceholder(/ガスボンベ/).fill(doneOther);
  if (next) await sheet.getByPlaceholder(/塗り壁の材料/).fill(next);
  if (memo) await sheet.locator("textarea").nth(2).fill(memo);
  await sheet.getByRole("button", { name: "送信する" }).click();
  await expect(app.locator(".toast, #toast").filter({ hasText: "報告済みにしました" }).first()).toBeVisible({ timeout: 15000 });
}

test("報告を送ると、報告 JSON と写真が Box に届き、中身が正しい", async ({ app, gas, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p02", itemId: "m902", color: "#c00" }); // お客様にも
  await addPhoto(app, { processId: "p04", itemId: "m903", custOff: true, color: "#00c" }); // 上司だけ
  await markCheck(app, "m902", 0);
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
  await expect(app.locator(".toast, #toast").filter({ hasText: "報告を取り消しました" }).first()).toBeVisible();
  await app.evaluate(() => sendToBox());
  const sheet = app.locator(".sheet").last();
  await expect(sheet.locator("textarea").nth(2)).toHaveValue("1回目のメモ");
  await sheet.getByRole("button", { name: "送信する" }).click();
  await expect(app.locator(".toast, #toast").filter({ hasText: "報告済みにしました" }).first()).toBeVisible({ timeout: 15000 });
  const sent = gas.box.sent.map((s) => JSON.parse(s.files.find((f) => f.name.endsWith(".json")).data.toString("utf8")));
  expect(sent).toHaveLength(2);
  expect(sent[1].report_id).toBe(sent[0].report_id);
  expect(sent[1].week).toBe(sent[0].week);
});