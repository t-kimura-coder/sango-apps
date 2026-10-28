// 現場ナビの基本の動き（開く・マニュアルを受け取る・探す・現場を登録する）
const { test, expect, receiveManual, addSite } = require("../fixtures/app");

test("開くとホームが出て、エラーが無い", async ({ app, errors }) => {
  await expect(app.locator("#dashView")).toBeVisible();
  await expect(app.locator("#dashSiteCard")).toContainText("担当現場を登録しましょう");
  expect(errors).toEqual([]);
});

test("合言葉でマニュアルを受け取ると、項目が使えるようになる", async ({ app, gas, errors }) => {
  await receiveManual(app);
  const actions = gas.calls.map((c) => c.action);
  expect(actions).toContain("manualInfo");
  expect(actions).toContain("manualChunk");
  const names = await app.evaluate(() => allManualItems().map((it) => it.name));
  expect(names).toEqual(["テスト仮設", "テスト配筋", "テスト建て方", "テスト外壁"]);
  expect(errors).toEqual([]);
});

test("検索：項目名・チェックの文・言い換えで見つかる", async ({ app }) => {
  await receiveManual(app);
  const hit = (q) => app.evaluate((q) => searchManual(q).map((r) => r.entry.it.id), q);
  expect(await hit("テスト配筋")).toEqual(["m902"]);
  expect((await hit("かぶり厚さ"))[0]).toBe("m902"); // チェックの文から
  expect(await hit("てすと上棟")).toEqual(["m903"]); // ひらがな＋言い換え（テスト建て方＝テスト上棟）
  expect(await hit("存在しない言葉")).toEqual([]);
});

test("現場を登録すると、今の現場になり、工事番号は大文字にそろう", async ({ app, errors }) => {
  await addSite(app, "テスト様邸 新築", "t26001");
  await expect(app.locator(".toast, #toast").filter({ hasText: "登録しました" }).first()).toBeVisible();
  const site = await app.evaluate(async () => (await getSites())[0]);
  expect(site.name).toBe("テスト様邸 新築");
  expect(site.koujiNo).toBe("T26001");
  expect(errors).toEqual([]);
});

test("偽の GAS 以外（本物の GAS）には何も送らない", async ({ app, gas }) => {
  await receiveManual(app);
  // 全部の呼び出しがテストの合言葉つき＝偽物が受けたもの
  expect(gas.calls.length).toBeGreaterThan(0);
  expect(gas.calls.every((c) => c.token === "test-token-not-real")).toBe(true);
});
