// 写真なしで送る（2026-11-06）：写真が無い週も、工程の様子か来週の予定を1つ書けば送れる。何も書いていなければ送らない
const { test, expect, receiveManual, addSite } = require("../fixtures/app");

async function openReport(app) {
  await app.locator('.tabBtn[data-tab="report"]').click();
  await expect(app.locator("#reportSendBtn")).toHaveText("写真なしで送る");
}

test("何も書いていなければ、写真なしでは送らない", async ({ app, gas }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await openReport(app);
  await app.locator("#reportSendBtn").click();
  await expect(app.locator(".toast, #toast").filter({ hasText: "1つは書いてください" }).first()).toBeVisible();
  expect(gas.box.sent).toHaveLength(0);
});

test("工程の様子を書けば、写真なしで送れて、報告済みになる", async ({ app, gas, errors }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await app.evaluate(async () => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    site.processes = ["p02"];
    site.procNotes = { p02: { status: "done", text: "テストの作業が終わりました" } };
    await dbPut("sites", site);
    await refreshSites();
  });
  await openReport(app);
  await app.locator("#reportSendBtn").click(); // 「写真なしで送りますか？」は OK で進む
  const sheet = app.locator(".sheet").last();
  await sheet.getByRole("button", { name: "送信する" }).click();
  await expect(app.locator(".toast, #toast").filter({ hasText: "報告済みにしました" }).first()).toBeVisible({ timeout: 15000 });

  expect(gas.box.sent).toHaveLength(1);
  const files = gas.box.sent[0].files;
  expect(files).toHaveLength(1); // 報告の JSON だけ
  const r = JSON.parse(files[0].data.toString("utf8"));
  expect(r.photos).toEqual([]);
  expect(r.processes.find((p) => p.no === 2)).toMatchObject({ status: "完了", note: "テストの作業が終わりました" });
  expect(r.period.end).toBeTruthy();
  const reports = await app.evaluate(async () => (await dbGetAll("reports", "siteId", currentSiteId)).length);
  expect(reports).toBe(1);
  expect(errors).toEqual([]);
});
