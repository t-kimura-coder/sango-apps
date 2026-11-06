// 別の端末（iPhone）で報告した週を、この端末（PC など）でも「報告済み」に数える
const { test, expect, receiveManual, addSite, syncIdle } = require("../fixtures/app");
const { useFakeGas } = require("../fixtures/fake-gas");

// 2026-11-01 の不具合：PC で開くと、iPhone から報告済みの現場がほとんど「3週遅れ」と出た（報告の記録は送った端末にしか無いため）。
// 直し：同期の記録に報告した週の一覧（weeks）を入れ、受け取った側は site.remoteWeeks として数える
test("別の端末で報告した週は、同期すると遅れに数えない", async ({ app, page }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await syncIdle(app); // 裏の同期が終わってから（競り合うと届く中身が前後する）
  // 4週前に登録した現場にする（この端末には報告の記録が無い）
  const mons = await app.evaluate(async () => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    site.createdAt = new Date(Date.now() - 35 * 864e5).toISOString();
    await dbPut("sites", site);
    const thisMon = weekMon(todayKey());
    return [-7, -14, -21, -28, -35].map((d) => addDays(thisMon, d));
  });
  const missed = () => app.evaluate(async () => reportWeek((await getSites()).find((s) => s.id === currentSiteId), []).missed);
  expect(await missed()).toBeGreaterThan(0);

  const siteInfo = await app.evaluate(async () => (await getSites()).find((s) => s.id === currentSiteId));
  await useFakeGas(page, {
    handlers: {
      getStates: () => ({ states: [{ key: "k:T26001", mine: true, state: JSON.stringify({ v: 1, site: { id: siteInfo.id, name: siteInfo.name, koujiNo: "T26001" }, items: {}, weeks: mons, reports: [] }) }] }),
    },
  });
  await app.evaluate(() => syncStates(true));
  expect(await missed()).toBe(0);
});

test("同期で送る記録に、報告した週の一覧が入る", async ({ app, gas }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await syncIdle(app); // 裏の同期が終わってから（競り合うと届く中身が前後する）
  await app.evaluate(async () => {
    await dbPut("reports", { id: "test-r1", siteId: currentSiteId, week: "2026-10-19", kind: "skip", createdAt: new Date().toISOString(), start: "2026-10-19", end: "2026-10-24" });
    await pushStates(true);
  });
  const states = () => gas.calls.filter((c) => c.action === "putStates").flatMap((c) => c.states).map((s) => JSON.parse(s.state));
  await expect.poll(() => states().some((st) => (st.weeks || []).join() === "2026-10-19")).toBe(true);
});
