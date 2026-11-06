// チェック記録の同期（GAS の states）。偽の GAS に届いた putStates の中身を確かめる
const { test, expect, receiveManual, addSite, markCheck, syncIdle } = require("../fixtures/app");

const putStates = (gas) => gas.calls.filter((c) => c.action === "putStates").flatMap((c) => c.states.map((s) => ({ ...s, body: JSON.parse(s.state) })));

// 2026-10-30 の不具合：チェックの直後に工事番号を入れると、番号なしの古い記録が GAS に生きたまま残った（送信が前後して「移った」印を上書き）。
// 直し：移った印に movedAt、送る記録に site.keyAt（番号を変えた時刻）を付け、GAS は movedAt より前に作った中身で古い記録を生き返らせない
test("工事番号を後から入れると、古い記録に移った時刻の印を送り、新しい記録には番号を変えた時刻が付く", async ({ app, gas, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", ""); // 番号なしで登録（確認の窓は OK で進む）
  await markCheck(app, "m902", 0);
  await syncIdle(app); // 裏の同期（チェックの6秒後）が終わってから
  const siteId = await app.evaluate(() => currentSiteId);
  await app.evaluate(() => pushStates(true));
  const before = putStates(gas).filter((s) => s.key === `s:${siteId}`);
  expect(before.length).toBeGreaterThan(0);
  expect(before[0].body.site.keyAt).toBe(""); // まだ番号を変えていない

  // 現場の管理から工事番号を入れる
  app.evaluate(async () => editSiteInfo((await getSites()).find((s) => s.id === currentSiteId)));
  const sheet = app.locator(".sheet").last();
  await sheet.getByPlaceholder("例：S26492").fill("T26002");
  await sheet.getByRole("button", { name: "変更する" }).click();
  await expect(app.locator(".toast, #toast").filter({ hasText: "現場の情報を変更しました" }).first()).toBeVisible();

  // 移った印は待たずに送られるので、届くまで待つ
  await expect.poll(() => putStates(gas).some((s) => s.key === `s:${siteId}` && s.body.deleted)).toBe(true);
  const moved = putStates(gas).find((s) => s.key === `s:${siteId}` && s.body.deleted);
  expect(moved, "古い番号なしの記録に移った印").toBeTruthy();
  expect(moved.body.moved).toBe("k:T26002");
  expect(moved.body.movedAt).toBeTruthy();

  await syncIdle(app);
  await app.evaluate(() => pushStates(true));
  const now = putStates(gas).filter((s) => s.key === "k:T26002").pop();
  expect(now.body.site.keyAt >= moved.body.movedAt).toBe(true); // GAS はこれで「番号を変えた後の中身」と分かる
  expect(Object.keys(now.body.items)).toContain("m902");
  expect(errors).toEqual([]);
});
