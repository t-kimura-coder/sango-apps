// 標準施工手引書（2026-11-28）：工程タブの中で手引書の図面を見られる。
// マニュアルを受け取ったあと続けて受け取る／項目の一番下に関係するページ／章から見る一覧と「手引書の中を探す」／検索の📘／図面の画面（色・隣のページ）。
// 手引書は fixtures/fake-tebiki.js の作りもの（3ページ）。本物の手引書・図は使わない。
const { test: base, expect, receiveManual } = require("../fixtures/app");
const { useFakeGas } = require("../fixtures/fake-gas");
const { fakeTebikiPack } = require("../fixtures/fake-tebiki");

// 手引書あり（既定）。tebiki: null の describe では「まだ無い」
const test = base.extend({
  gas: async ({ page }, use) => {
    await use(await useFakeGas(page, { tebiki: fakeTebikiPack() }));
  },
});
const testNone = base.extend({
  gas: async ({ page }, use) => {
    await use(await useFakeGas(page, {}));
  },
});

// マニュアルを受け取る（続けて手引書も受け取る）まで待つ
async function receiveBoth(app) {
  await receiveManual(app);
  await app.waitForFunction(() => tebikiMeta && tebikiMeta.pages.length === 3, null, { timeout: 45000 });
}

test("マニュアルを受け取ると、続けて手引書も受け取って端末に残る", async ({ app, gas, errors }) => {
  await receiveBoth(app);
  const actions = gas.calls.map((c) => c.action);
  expect(actions).toContain("tebikiInfo");
  expect(actions).toContain("tebikiChunk");
  expect(actions.indexOf("manualChunk")).toBeLessThan(actions.indexOf("tebikiInfo")); // マニュアルのあと
  const st = await app.evaluate(async () => {
    const recs = await dbGetAll("tebikiPages");
    const meta = await dbGet("meta", "tebiki");
    return {
      n: recs.length,
      blobs: recs.every((r) => r.img instanceof Blob && r.thumb instanceof Blob),
      version: meta.version,
      metaHasImg: meta.pages.some((p) => "img" in p || "thumb" in p),
      nos: meta.pages.map((p) => p.no),
    };
  });
  expect(st).toEqual({ n: 3, blobs: true, version: "test-t1", metaHasImg: false, nos: ["101", "102", "201"] });
  // 設定の手引書の行
  await app.evaluate(() => openSettings());
  await expect(app.locator("#tebikiInfo")).toContainText("test-t1版・3枚");
  await expect(app.locator("#receiveTebikiBtn")).toContainText("新しい版を受け取る");
  expect(errors).toEqual([]);
});

test("項目の一番下に、その項目に関係する手引書のページだけが出る", async ({ app, errors }) => {
  await receiveBoth(app);
  const open = (cat, id) => app.evaluate(([cat, id]) => openGroup(groupOfProcess(cat).id, id), [cat, id]);
  await open("p02", "m902"); // 番号 2：101 と 102
  await expect(app.locator("#tebikiRow .tbRow h3")).toHaveText("📘 手引書（2枚）");
  await expect(app.locator("#tebikiRow .tbMini")).toHaveCount(2);
  await expect(app.locator("#tebikiRow .tbMini img").first()).toHaveAttribute("src", /^blob:/);
  await open("p01", "m901"); // 番号 1：102 だけ
  await expect(app.locator("#tebikiRow .tbMini")).toHaveCount(1);
  await open("p04", "m903"); // 番号 3：当たる手引書なし → 欄を出さない
  await expect(app.locator("#tebikiRow .tbRow")).toHaveCount(0);
  // 項目の鍵：番号、番号が空なら項目名
  expect(await app.evaluate(() => [tebikiKeyOf({ no: " 10 ", name: "x" }), tebikiKeyOf({ no: "", name: " 仮設安全確認 " }), tebikiKeyOf({ name: "名前だけ" })])).toEqual(["10", "仮設安全確認", "名前だけ"]);
  // 当たる項目の下の札を押すと図面が開く
  await open("p02", "m902");
  await app.locator("#tebikiRow .tbMini").first().click();
  await expect(app.locator("#tebikiView")).toBeVisible();
  await expect(app.locator("#tbTtl")).toContainText("101");
  await app.locator("#tbClose").click(); // 戻ると元の項目の画面
  await expect(app.locator("#groupView")).toBeVisible();
  await expect(app.locator("#tebikiView")).toBeHidden();
  expect(errors).toEqual([]);
});

test("工程タブの「📘 手引書を章から見る」から、章ごとの一覧→図面を開ける。戻るで一覧に帰る", async ({ app, errors }) => {
  await receiveBoth(app);
  await app.evaluate(() => goManual());
  await expect(app.locator("#tebikiEntryBtn")).toContainText("📘 手引書を章から見る");
  await app.locator("#tebikiEntryBtn").click();
  await expect(app.locator("#tebikiListView")).toBeVisible();
  await expect(app.locator(".tbChap")).toHaveText(["テスト基礎工事", "テスト木工事"]); // 製本の並び
  await expect(app.locator(".tbCard")).toHaveCount(3);
  await expect(app.locator(".tbCard img").first()).toHaveAttribute("src", /^blob:/);
  await app.locator(".tbCard", { hasText: "Ⅱ：テストアンカー" }).click();
  await expect(app.locator("#tebikiView")).toBeVisible();
  await expect(app.locator("#tbTtl")).toContainText("102");
  // 図は全体表示（幅いっぱい・拡大しない）
  const fit = await app.evaluate(() => ({ scale: tbScale, paper: $("tbPaper").clientWidth, stage: $("tbStage").clientWidth }));
  expect(fit.scale).toBe(1);
  expect(fit.paper).toBe(fit.stage);
  await expect(app.locator("#tbImg")).toHaveAttribute("src", /^blob:/);
  await app.locator("#tbClose").click();
  await expect(app.locator("#tebikiListView")).toBeVisible();
  await expect(app.locator("#tebikiView")).toBeHidden();
  await app.locator("#tebikiListBackBtn").click();
  await expect(app.locator("#manualView")).toBeVisible();
  expect(errors).toEqual([]);
});

test("一覧の「手引書の中を探す」：当たったページだけに絞る→開くと色→戻ると言葉と結果が残る。入り直すと消える", async ({ app, errors }) => {
  await receiveBoth(app);
  await app.evaluate(() => goTebikiList());
  await app.locator("#tbFindInput").fill("かぶり厚さ");
  await expect(app.locator("#tebikiChapters")).toBeHidden();
  await expect(app.locator("#tebikiFound .tbHit")).toHaveCount(2); // 101 と 102
  await expect(app.locator("#tebikiFound .tbHit").first().locator("mark").first()).toHaveText("かぶり厚さ");
  await app.locator("#tebikiFound .tbHit").first().locator(".tbHd").click();
  await expect(app.locator("#tebikiView")).toBeVisible();
  await expect(app.locator("#tbTtl")).toContainText("101");
  await expect(app.locator("#tbPaper .tbBox")).toHaveCount(2);
  expect(await app.evaluate(() => tbScale)).toBe(1);
  await app.locator("#tbClose").click();
  await expect(app.locator("#tebikiListView")).toBeVisible();
  await expect(app.locator("#tbFindInput")).toHaveValue("かぶり厚さ");
  await expect(app.locator("#tebikiFound .tbHit")).toHaveCount(2);
  // 見つからない言葉
  await app.locator("#tbFindInput").fill("そんなことば");
  await expect(app.locator("#tebikiFound .tbHit")).toHaveCount(0);
  await expect(app.locator("#tebikiListNote")).toContainText("見つかりませんでした");
  // 消すと章ごとの一覧に戻る
  await app.locator("#tbFindInput").fill("");
  await expect(app.locator("#tebikiChapters")).toBeVisible();
  await expect(app.locator(".tbCard")).toHaveCount(3);
  // 工程タブから入り直すと言葉は消える
  await app.locator("#tbFindInput").fill("アンカー");
  await app.locator("#tebikiListBackBtn").click();
  await app.locator("#tebikiEntryBtn").click();
  await expect(app.locator("#tbFindInput")).toHaveValue("");
  await expect(app.locator("#tebikiChapters")).toBeVisible();
  expect(errors).toEqual([]);
});

test("検索：マニュアルの当たりが先、手引書の当たりは📘の下。開くと言葉の当たる行すべてに色が付き、隣のページでも同じ言葉に色が付く", async ({ app, errors }) => {
  await receiveBoth(app);
  await app.evaluate(() => openSearch());
  await app.locator("#searchInput").fill("かぶり厚さ");
  await expect(app.locator("#searchResults .searchItem")).toHaveCount(1); // マニュアルの項目（テスト配筋）
  await expect(app.locator("#searchResults .tbSearchHead")).toContainText("📘 手引書");
  const order = await app.evaluate(() => {
    const kids = [...$("searchResults").children];
    return [kids.findIndex((e) => e.classList.contains("searchItem")), kids.findIndex((e) => e.classList.contains("tbSearchHead")), kids.findIndex((e) => e.classList.contains("tbHit"))];
  });
  expect(order[0]).toBeLessThan(order[1]); // マニュアル → 📘 の見出し → 手引書の当たり
  expect(order[1]).toBeLessThan(order[2]);
  await expect(app.locator("#searchResults .tbHit")).toHaveCount(2); // 101 と 102。201 には無い
  await expect(app.locator("#searchResults .tbHit").first().locator("mark").first()).toHaveText("かぶり厚さ");
  await expect(app.locator("#searchResults .tbHit").first().locator(".tbLn")).toHaveCount(3); // 見出し1＋行2
  // 開く：101 で、言葉を含む行すべて（2か所）に色。見出しの枠は重ねない
  await app.locator("#searchResults .tbHit").first().locator(".tbLn").nth(1).click();
  await expect(app.locator("#tebikiView")).toBeVisible();
  await expect(app.locator("#tbTtl")).toContainText("101");
  await expect(app.locator("#tbPaper .tbBox")).toHaveCount(2);
  expect(await app.evaluate(() => tbScale)).toBe(1); // 拡大しない
  // 次のページ（102）でも同じ言葉に色（1か所）。201 では当たる行が無いので色なし
  await app.locator("#tbNext").click();
  await expect(app.locator("#tbTtl")).toContainText("102");
  await expect(app.locator("#tbPaper .tbBox")).toHaveCount(1);
  await app.locator("#tbNext").click();
  await expect(app.locator("#tbTtl")).toContainText("201");
  await expect(app.locator("#tbPaper .tbBox")).toHaveCount(0);
  // 戻ると検索の画面（入力した言葉が残っている）
  await app.locator("#tbClose").click();
  await expect(app.locator("#searchView")).toBeVisible();
  await expect(app.locator("#searchInput")).toHaveValue("かぶり厚さ");
  await expect(app.locator("#searchResults .tbHit")).toHaveCount(2);
  // 手引書にしか無い言葉：マニュアルの項目は無く、📘だけ。ひらがなでも探せる
  await app.locator("#searchInput").fill("あんかーぼると");
  await expect(app.locator("#searchResults .searchItem")).toHaveCount(0);
  await expect(app.locator("#searchResults .tbHit")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("図面の画面：目次は無く図が全画面。前後のページ・拡大ボタン", async ({ app, errors }) => {
  await receiveBoth(app);
  await app.evaluate(() => goTebikiList());
  await app.locator(".tbCard").first().click();
  await expect(app.locator("#tbTtl")).toContainText("101");
  // 目次は図面の画面に出さない（2026-11-28 木村さん：iPhone の縦で図が小さくなるため）
  await expect(app.locator("#tbSheet")).toHaveCount(0);
  const h = await app.evaluate(() => ({ stage: $("tbStage").getBoundingClientRect().height, view: window.innerHeight }));
  expect(h.stage).toBeGreaterThan(h.view * 0.7);
  // 一覧から開いた時は色を付けない
  expect(await app.locator("#tbPaper .tbBox").count()).toBe(0);
  // 先頭ページ：「前」は押せず、「次」に次のページの名前
  await expect(app.locator("#tbPrev")).toBeDisabled();
  await expect(app.locator("#tbNext")).toHaveText("102 Ⅱ：テストアンカー ›");
  await app.locator("#tbNext").click();
  await app.locator("#tbNext").click();
  await expect(app.locator("#tbTtl")).toContainText("201");
  await expect(app.locator("#tbNext")).toBeDisabled(); // 最後のページ
  // 横にすると横の幅いっぱいに合わせ直す。縦に戻すと縦の幅に
  const before = app.viewportSize();
  await app.setViewportSize({ width: before.height, height: before.width });
  await app.waitForFunction(() => Math.abs($("tbPaper").clientWidth - $("tbStage").clientWidth) < 2 && $("tbStage").clientWidth > 600);
  await app.setViewportSize(before);
  await app.waitForFunction(() => Math.abs($("tbPaper").clientWidth - $("tbStage").clientWidth) < 2 && $("tbStage").clientWidth < 500);
  await app.locator("#tbPrev").click();
  await expect(app.locator("#tbTtl")).toContainText("102");
  // 拡大・縮小・全体
  await app.locator("#tbZin").click();
  expect(await app.evaluate(() => tbScale)).toBeGreaterThan(1);
  await app.locator("#tbZfit").click();
  expect(await app.evaluate(() => tbScale)).toBe(1);
  expect(errors).toEqual([]);
});

test("新しい版が配られると、ホームのやることに出る（半日に1回、手引書も確かめる）", async ({ app, gas }) => {
  await receiveBoth(app);
  expect(await app.evaluate(() => tebikiUpdateAvailable())).toBe(false);
  // 配っている版の日時が、受け取った版より新しい
  const n = gas.calls.filter((c) => c.action === "tebikiInfo").length;
  await app.evaluate(() => {
    localStorage.setItem("genba-photo-tebiki-latest", "2099-01-01T00:00:00Z");
    localStorage.removeItem("genba-photo-tebiki-latest:at");
  });
  expect(await app.evaluate(() => tebikiUpdateAvailable())).toBe(true);
  await app.evaluate(() => goDash());
  await expect(app.locator("#dashTodo")).toContainText("標準施工手引書の新しい版があります");
  // 半日以内は聞き直さない／半日たてば聞く
  expect(await app.evaluate(() => checkTebikiVersion())).toBe(true);
  expect(gas.calls.filter((c) => c.action === "tebikiInfo").length).toBe(n + 1);
  expect(await app.evaluate(() => checkTebikiVersion())).toBe(false);
  expect(gas.calls.filter((c) => c.action === "tebikiInfo").length).toBe(n + 1);
  // 受け取ると消える
  await app.evaluate(() => receiveTebikiViaGas(true));
  await app.waitForFunction(() => !tebikiUpdateAvailable());
});

testNone("手引書がまだ無い時は、静かに飛ばす（案内・エラー・入口なし）", async ({ app, gas, errors }) => {
  const alerts = [];
  app.on("dialog", (d) => d.type() === "alert" && alerts.push(d.message()));
  await receiveManual(app);
  await expect.poll(() => gas.calls.some((c) => c.action === "tebikiInfo")).toBe(true); // 聞きには行った
  expect(gas.calls.some((c) => c.action === "tebikiChunk")).toBe(false);
  expect(alerts).toEqual([]);
  expect(await app.evaluate(() => tebikiMeta)).toBeNull();
  await expect(app.locator("#tebikiEntryBtn")).toHaveCount(0); // 工程タブに入口を出さない
  // 項目にも欄は出ない
  await app.evaluate(() => openGroup(groupOfProcess("p02").id, "m902"));
  await expect(app.locator("#tebikiRow .tbRow")).toHaveCount(0);
  // 設定：まだ受け取っていない。押すと「まだ配られていません」
  await app.evaluate(() => openSettings());
  await expect(app.locator("#tebikiInfo")).toHaveText("まだ受け取っていません");
  await expect(app.locator("#deleteTebikiBtn")).toBeHidden();
  await app.locator("#receiveTebikiBtn").click();
  await expect(app.locator("#toast")).toContainText("まだ配られていません");
  expect(alerts).toEqual([]);
  expect(errors).toEqual([]);
});
