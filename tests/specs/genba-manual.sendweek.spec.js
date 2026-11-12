// 送る週を選ぶ（2026-11-07）：未報告がたまった時、③で「どの週の報告として送りますか」を選べる。
// 2026-11-06 の困りごと：金曜に「先週分」のつもりで送ったら今週分として記録され、前の週の写真が今週の一覧に全部出て見分けられなかった。
// 日付は固定せず、page の中で「今日から」週を計算する（何曜日に動かしても同じ結果になるように）
const { test, expect, receiveManual, addSite, addPhoto } = require("../fixtures/app");

// 2026-11-12：月・火曜は「先週が未報告なら先週」が最初に選ばれる決まりで、土曜は日曜の写真が先週に入るため、
// 動かす曜日で結果が変わって夜のチェックで落ちた。今日を木曜に決めて動かす
test.use({ fixedNow: "2026-11-05T10:00:00+09:00" });

const toastOf = (app, text) => app.locator(".toast, #toast").filter({ hasText: text }).first();

// 今週・先週の月曜（page の中の weekMon と今日で計算）
const weeksOf = (app) => app.evaluate(() => ({ thisMon: weekMon(todayKey()), prevMon: addDays(weekMon(todayKey()), -7) }));

// 3週前に登録した現場にして、先週・先々週が「未報告の週」になるようにする
async function oldSite(app) {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001");
  await app.evaluate(async () => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    site.createdAt = new Date(Date.now() - 21 * 864e5).toISOString();
    await dbPut("sites", site);
    await refreshSites();
  });
}
async function openReportTab(app) {
  await app.evaluate(() => goReport());
  await expect(app.locator("#reportSendBtn")).toBeVisible();
}
async function sendNow(app) {
  await app.locator("#reportSendBtn").click();
  const sheet = app.locator(".sheet").last();
  await expect(sheet).toContainText("Boxへ送信");
  await sheet.getByRole("button", { name: "送信する" }).click();
  await expect(toastOf(app, "報告済みにしました")).toBeVisible({ timeout: 15000 });
}
const reportJson = (gas, i = 0) => JSON.parse(gas.box.sent[i].files.find((f) => f.name.endsWith(".json")).data.toString("utf8"));

test("先週を選んで送ると、week と period が先週になり、先週の写真だけが届く", async ({ app, gas, errors }) => {
  await oldSite(app);
  await addPhoto(app, { processId: "p02", daysAgo: 0, color: "#c00" }); // 今週
  await addPhoto(app, { processId: "p02", daysAgo: 7, color: "#0c0" }); // 先週
  const { thisMon, prevMon } = await weeksOf(app);
  await openReportTab(app);
  // 最初は今週。選べる週に先週が並ぶ
  await expect(app.locator(".weekOpt.active")).toHaveAttribute("data-week", thisMon);
  await expect(app.locator(`.weekOpt[data-week="${prevMon}"]`)).toBeVisible();
  await expect(app.locator("#reportSendBtn")).toHaveText("1 枚を送る");
  await app.locator(`.weekOpt[data-week="${prevMon}"]`).click();
  await expect(app.locator(`.weekOpt.active`)).toHaveAttribute("data-week", prevMon);
  await expect(app.locator("#sortGrid .sortCell")).toHaveCount(1);
  await expect(app.locator("#reportSendBtn")).toHaveText("1 枚を送る");
  await expect(app.locator(".periodLabel")).toHaveText("先週の報告");
  await sendNow(app);

  const r = reportJson(gas);
  expect(r.week).toBe(prevMon);
  expect(r.period.start).toBe(prevMon);
  expect(r.period.end).toBe(await app.evaluate((m) => addDays(m, 5), prevMon));
  expect(r.photos).toHaveLength(1);
  // 送ったのは先週の写真。今週の写真は次の報告に残り、選ぶ週は今週に戻る
  const left = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).filter((p) => !p.reportId).map((p) => weekMon(p.dateKey)));
  expect(left).toEqual([thisMon]);
  const reps = await app.evaluate(async () => (await dbGetAll("reports", "siteId", currentSiteId)).map((x) => x.week));
  expect(reps).toEqual([prevMon]);
  await openReportTab(app);
  await expect(app.locator(".weekOpt.active")).toHaveAttribute("data-week", thisMon);
  expect(errors).toEqual([]);
});

test("前の週の写真は畳まれ、今週の一覧には出ない", async ({ app }) => {
  await oldSite(app);
  await addPhoto(app, { processId: "p02", daysAgo: 0 });
  await addPhoto(app, { processId: "p04", daysAgo: 7 });
  await addPhoto(app, { processId: "p04", daysAgo: 8 });
  await openReportTab(app);
  await expect(app.locator("#sortGrid .sortCell")).toHaveCount(1); // 今週の1枚だけ
  const fold = app.locator("#olderFold");
  await expect(fold.locator("summary")).toContainText("前の週の写真（2枚）");
  expect(await fold.evaluate((e) => e.open)).toBe(false);
  await expect(app.locator('.flowProc[data-pid="p04"]')).toHaveCount(0); // ②にも出ない
  await expect(app.locator("#reportSendBtn")).toHaveText("1 枚を送る");
  // 開くと、週ごとに並び、「この週の報告に入れる」「その週を選ぶ」が選べる
  await fold.locator("summary").click();
  await expect(fold.locator(".olderGroup").first().getByRole("button", { name: "この週の報告に入れる" })).toBeVisible();
  await expect(fold.locator(".olderGroup").first().getByRole("button", { name: "その週を選ぶ" })).toBeVisible();
  // 「その週を選ぶ」で先週に切り替わる。今週の写真は「あとの週の写真」として数だけ出る
  const { prevMon } = await weeksOf(app);
  await fold.locator(`.olderGroup[data-week="${prevMon}"]`).getByRole("button", { name: "その週を選ぶ" }).click();
  await expect(app.locator(".weekOpt.active")).toHaveAttribute("data-week", prevMon);
  await expect(app.locator("#sortGrid .sortCell")).toHaveCount(2);
  await expect(app.locator(".laterNote")).toContainText("あとの週の写真（1枚）");
});

test("「この週の報告に入れる」にした写真は、選んでいる週の報告として送られる", async ({ app, gas }) => {
  await oldSite(app);
  await addPhoto(app, { processId: "p02", daysAgo: 0 });
  await addPhoto(app, { processId: "p04", daysAgo: 7 });
  const { thisMon } = await weeksOf(app);
  const oldDate = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).map((p) => p.dateKey).sort()[0]);
  await openReportTab(app);
  await app.locator("#olderFold summary").click();
  await app.locator("#olderFold").getByRole("button", { name: "この週の報告に入れる" }).click();
  await expect(toastOf(app, "1枚を今週の報告に入れました")).toBeVisible();
  await expect(app.locator("#sortGrid .sortCell")).toHaveCount(2);
  await expect(app.locator("#olderFold")).toHaveCount(0);
  await expect(app.locator("#reportSendBtn")).toHaveText("2 枚を送る");
  // 写真に印が残る
  const marks = await app.evaluate(async () => (await getSitePhotos(currentSiteId)).map((p) => p.sendWeek || ""));
  expect(marks.sort()).toEqual(["", thisMon].sort());
  await sendNow(app);
  const r = reportJson(gas);
  expect(r.week).toBe(thisMon);
  expect(r.photos).toHaveLength(2);
  expect(r.period.start).toBe(oldDate); // 期間は、入れた写真の撮影日までさかのぼる
});

test("未報告の週が無ければ、週の選択も前の週の欄も出ない", async ({ app }) => {
  await receiveManual(app);
  await addSite(app, "テスト様邸 新築", "T26001"); // 今週に登録した現場：前の週は無い
  await addPhoto(app, { processId: "p02" });
  await openReportTab(app);
  await expect(app.locator("#weekPick")).toHaveCount(0);
  await expect(app.locator(".weekOpt")).toHaveCount(0);
  await expect(app.locator("#olderFold")).toHaveCount(0);
  await expect(app.locator("#reportSendBtn")).toHaveText("1 枚を送る");
});

test("報告済みの週・休工の週は選べる週に並ばない", async ({ app }) => {
  await oldSite(app);
  const { prevMon } = await weeksOf(app);
  const prev2 = await app.evaluate((m) => addDays(m, -7), prevMon);
  await app.evaluate(async ({ prevMon, prev2 }) => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    await dbPut("reports", { id: "t-r1", siteId: site.id, week: prevMon, kind: "skip", createdAt: new Date().toISOString(), start: prevMon, end: addDays(prevMon, 5) });
    site.pauses = [{ from: addDays(prev2, 4), to: addDays(prev2, 4) }]; // 先々週の金曜は休工
    await dbPut("sites", site);
    await refreshSites();
  }, { prevMon, prev2 });
  const opts = await app.evaluate(async () => {
    const site = (await getSites()).find((s) => s.id === currentSiteId);
    return sendWeekOptions(site, await dbGetAll("reports", "siteId", site.id), []);
  });
  expect(opts).not.toContain(prevMon);
  expect(opts).not.toContain(prev2);
  expect(opts[0]).toBe((await weeksOf(app)).thisMon);
});

test("先週を選んで「報告なし」にすると、先週の報告なしの記録になる", async ({ app }) => {
  await oldSite(app);
  const { prevMon } = await weeksOf(app);
  await openReportTab(app);
  await app.locator(`.weekOpt[data-week="${prevMon}"]`).click();
  await expect(app.locator("#reportSkipBtn")).toHaveText("先週は報告なし");
  await app.locator("#reportSkipBtn").click();
  await app.locator(".sheet").last().getByRole("button", { name: "記録する" }).click();
  await expect(toastOf(app, "先週は報告なしにしました")).toBeVisible();
  const reps = await app.evaluate(async () => (await dbGetAll("reports", "siteId", currentSiteId)).map((r) => [r.week, r.kind]));
  expect(reps).toEqual([[prevMon, "skip"]]);
});

test("先週を選んで写真なしで送ると、先週の報告になる。取り消すと先週の送り直しになる", async ({ app, gas }) => {
  await oldSite(app);
  const { prevMon } = await weeksOf(app);
  await openReportTab(app);
  await app.locator(`.weekOpt[data-week="${prevMon}"]`).click();
  await app.locator("#draftNext").fill("来週のテスト");
  await sendNow(app);
  const r = reportJson(gas);
  expect(r.week).toBe(prevMon);
  expect(r.photos).toEqual([]);
  expect(r.period.start).toBe(prevMon);
  // 取り消すと、先週が選ばれた状態で戻る（送り直しても同じ週・同じ report_id）
  await app.evaluate(async () => undoReport((await dbGetAll("reports", "siteId", currentSiteId))[0]));
  await expect(toastOf(app, "報告を取り消しました")).toBeVisible();
  await expect(app.locator(".weekOpt.active")).toHaveAttribute("data-week", prevMon);
  await sendNow(app);
  expect(reportJson(gas, 1).week).toBe(prevMon);
  expect(reportJson(gas, 1).report_id).toBe(r.report_id);
});
