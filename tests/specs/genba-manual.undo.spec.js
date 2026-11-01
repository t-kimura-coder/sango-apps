// 報告の取り消し（2026-11-01 のバグチェックで見つかったもの）
const { test, expect, receiveManual, addSite, addPhoto } = require("../fixtures/app");

// 取り消した週は、同期で受け取った「別の端末で報告した週」に残っていても、報告済みに数えない。
// 「アプリ外で報告」を取り消すと、写真は「送る写真」に戻る（undoReport と同じ）
test("アプリ外で報告を取り消すと、写真は送る写真に戻り、その週は報告済みでなくなる", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  const photoId = await addPhoto(app, { processId: "p02" });
  const res = await app.evaluate(async (photoId) => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    const reports = await dbGetAll("reports", "siteId", site.id);
    const week = tagWeek(site, reports).mon;
    const p = await dbGet("photos", photoId);
    const r = { id: "test-ext", siteId: site.id, week, kind: "external", start: week, end: addDays(week, 5), createdAt: new Date().toISOString() };
    await dbPut("reports", r);
    p.reportId = r.id;
    p.sendPick = false;
    await dbPut("photos", p);
    site.remoteWeeks = [week]; // 自分の報告が置き場所を通って戻ってきた状態
    await dbPut("sites", site);
    await refreshSites();
    await cancelWeekOther(r);
    const after = (await getSites()).find((s) => s.id === currentSiteId);
    return { week, photo: await dbGet("photos", photoId), remote: after.remoteWeeks, done: reportWeek(after, await dbGetAll("reports", "siteId", site.id)).mon === week && reportWeek(after, []).state === "done" };
  }, photoId);
  expect(res.photo.reportId).toBeNull();
  expect(res.photo.sendPick).toBe(true);
  expect(res.remote).not.toContain(res.week);
  expect(res.done).toBe(false);
});
