// 2026-11-06 のバグチェックで見つかったもの
const { test, expect, receiveManual, addSite, addPhoto } = require("../fixtures/app");

test("未振り分けの写真は「報告済みにする」で報告済みにならない", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await addPhoto(app, { processId: "p02" });
  const un = await addPhoto(app, { processId: "" });
  const res = await app.evaluate(async (un) => {
    await markReported(""); // 確認の窓（未振り分けがあります）は自動で OK
    return { reports: (await dbGetAll("reports", "siteId", currentSiteId)).length, un: (await dbGet("photos", un)).reportId || null };
  }, un);
  expect(res.reports).toBe(0);
  expect(res.un).toBeNull();
});

test("写真なしで送った報告は、過去の報告で「写真なし」と出て、取り消せる", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  const r = await app.evaluate(async () => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    site.reportDraft = { next: "来週もテスト" };
    await dbPut("sites", site);
    await refreshSites();
    await markReported("", { photoIds: [], textOnly: true });
    const rep = (await dbGetAll("reports", "siteId", currentSiteId))[0];
    await openReportPast(rep.id);
    return { textOnly: rep.textOnly, undoHidden: $("undoReportBtn").hidden };
  });
  expect(r.textOnly).toBe(true);
  expect(r.undoHidden).toBe(false);
});

test("お客様名の欄は「任意」と出る", async ({ app }) => {
  await app.evaluate(() => goDash());
  await app.locator("#dashSiteCard").getByText("担当現場を登録しましょう").click();
  const label = app.locator(".sheet").last().locator("label", { hasText: "お客様名" });
  await expect(label).toContainText("任意");
  await expect(label).not.toContainText("必須");
});
