// 項目のチェックが全部済んだら、はっきり「COMPLETE！」と出る（2026-11-06：小さな「完了」だけでは気づかなかった）
const { test, expect, receiveManual, addSite } = require("../fixtures/app");

test("チェックを全部付けると COMPLETE！の帯が出て、項目のボタンにも済みの印が付く", async ({ app, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await app.evaluate(async () => {
    const it = allManualItems().find((x) => x.id === "m902");
    currentMTab = "check";
    await openGroup(groupOfProcess(it.cat).id, it.id);
  });
  const banner = app.locator("#checkDoneBanner");
  await expect(banner).toBeHidden();
  const rows = app.locator(".checkList .checkRow, .checkList [data-key]");
  await app.evaluate(async () => {
    const it = allManualItems().find((x) => x.id === "m902");
    for (const c of it.text.checks) await toggleMark(it, checkKey("checks", c));
  });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("COMPLETE！");
  await app.evaluate(() => renderItemStrip());
  await expect(app.locator(".itemChip.done")).toHaveCount(1);
  expect(errors).toEqual([]);
});
