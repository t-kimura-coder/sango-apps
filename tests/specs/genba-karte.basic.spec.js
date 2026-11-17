// 現場カルテ（genba-karte）の基本：開く・デモで引く・パックの取り込み・足して書き出す・版数のそろい
// データは作りものだけ（genba-karte/demo.js と、この中で組む小さなパック）。本物の事例・現場名は入れない
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const DIR = path.join(__dirname, "..", "..", "genba-karte");
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const URL = "genba-karte/";

/** 画面のエラーを集める（絵が無いなどの 404 は数えない） */
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return errors;
}

test("パックが無い時は、取り込みの案内が出る", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(URL);
  await expect(page.getByText("カルテパックを取り込んでください")).toBeVisible();
  await expect(page.locator("#imp")).toBeVisible();
  await expect(page.locator("nav.tab")).toBeHidden();
  expect(errors).toEqual([]);
});

test("デモ：ホームが出て、言葉から事例を引ける", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(URL + "?demo=1");
  await expect(page.locator(".tile")).toHaveCount(4);
  await expect(page.locator(".g-row").first()).toContainText("サンプル商店");
  await page.locator("#q").fill("床鳴りがする");
  await page.locator("#q").press("Enter");
  await expect(page.locator(".case").first()).toContainText("寝室で床鳴りがした");
  await expect(page.locator(".case").first().locator(".pill.after")).toBeVisible();
  // その後だけに絞ると、建てた時のカードは出ない
  await page.locator('[data-f="after"]').click();
  await expect(page.locator(".case .pill.new")).toHaveCount(0);
  // 現場名でも探せる
  await page.locator("#q").fill("見本");
  await page.locator("#q").press("Enter");
  await expect(page.locator(".g-row")).toContainText(["見本一郎様邸"]);
  expect(errors).toEqual([]);
});

test("デモ：現場のカルテに、建てた時 → その後 のつながりが出る", async ({ page }) => {
  await page.goto(URL + "?demo=1#/genba/26-91");
  await expect(page.locator("#title")).toHaveText("見本一郎様邸");
  await expect(page.getByText("同じ出来事かは未確認")).toBeVisible();
  await expect(page.locator(".line.after .case")).toHaveCount(1);
  await expect(page.locator(".line.new .case")).toHaveCount(2);
  // カードを開くと、3つの見出しが出る
  await page.locator(".line.after .case").click();
  await expect(page.locator(".rw .k")).toContainText(["何が要因で", "どうなった", "どうした方が良かった"]);
});

test("デモ：現場一覧を期でくくれる。事例も期で絞れる", async ({ page }) => {
  await page.goto(URL + "?demo=1#/genba");
  // 最初は振り返り会の年でくくる
  await expect(page.locator(".year").first()).toContainText("2026年の振り返り会");
  await page.locator('[data-g="ki"]').click();
  const heads = await page.locator(".year").allTextContents();
  expect(heads.map((h) => h.replace(/\s.*$/, ""))).toEqual(["55期", "54期", "期が分からない現場"]);
  await expect(page.locator(".g-row .ki").first()).toHaveText("55期");
  // 選んだくくり方は、開き直しても残る
  await page.reload();
  await expect(page.locator(".year").first()).toContainText("55期");
  // 事例を引く：期で絞ると、その期の現場のカードだけになる
  await page.goto(URL + "?demo=1#/hiku");
  await page.locator("#q").fill("床");
  await page.locator("#q").press("Enter");
  const all = await page.locator(".case").count();
  await page.locator("#kiSel").selectOption("54");
  await expect(page.locator(".case")).toHaveCount(0);
  await page.locator("#kiSel").selectOption("55");
  await expect(page.locator(".case")).toHaveCount(all);
});

test("期の入っていないパックでは、期のボタンが出ない", async ({ page }) => {
  await page.goto(URL);
  const demo = await page.evaluate(() => window.KARTE_DEMO);
  const bukken = Object.fromEntries(Object.entries(demo.bukken).map(([k, v]) => [k, { ...v, "期": undefined }]));
  await page.locator("#packFile").setInputFiles({ name: "pack.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...demo, demo: false, bukken })) });
  await page.locator(".tile").first().waitFor();
  await page.goto(URL + "#/genba");
  await expect(page.locator(".g-row").first()).toBeVisible();
  await expect(page.locator('[data-g="ki"]')).toHaveCount(0);
  await expect(page.locator(".g-row .ki")).toHaveCount(0);
});

test("パックをファイルから取り込むと、端末に残る", async ({ page }) => {
  await page.goto(URL);
  const demo = await page.evaluate(() => window.KARTE_DEMO);
  const pack = { ...demo, version: "test-1", demo: false, cards: demo.cards.slice(0, 2) };
  await page.locator("#packFile").setInputFiles({ name: "pack.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(pack)) });
  await expect(page.locator(".tile")).toHaveCount(4);
  await expect(page.locator(".foot")).toContainText("test-1");
  // 開き直しても、取り込んだパックで開く
  await page.reload();
  await expect(page.locator(".tile")).toHaveCount(4);
  await expect(page.locator(".stat b").first()).toHaveText("2");
});

test("形の違うファイルは取り込まない", async ({ page }) => {
  await page.goto(URL);
  await page.locator("#packFile").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ kind: "something-else" })) });
  await expect(page.locator("#toast")).toContainText("取り込めませんでした");
  await expect(page.getByText("カルテパックを取り込んでください")).toBeVisible();
});

test("デモ：そう言えばを足すと端末に残り、書き出せる", async ({ page }) => {
  await page.goto(URL + "?demo=1#/tasu/26-91");
  await page.locator("#f-t").fill("2階の建具が冬に閉まらない");
  await page.locator('#f-s [data-s="2年点検"]').click();
  await page.locator("#f-n").fill("枠のすき間を多めに取る");
  await expect(page.locator("#f-tags")).toContainText("開閉の不具合");
  await page.locator("#f-save").click();
  await expect(page.locator("#title")).toHaveText("設定");
  await expect(page.locator(".rw .v").first()).toHaveText("2階の建具が冬に閉まらない");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#exp").click()]);
  const out = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  expect(out.kind).toBe("genba-karte-tasu");
  expect(out.items).toHaveLength(1);
  expect(out.items[0]).toMatchObject({ "物件": "26-91", "場面": "2年点検", "次からの手": "枠のすき間を多めに取る", "確認": "未確認" });
  expect(out.items[0]["症状"]).toContain("開閉の不具合");
  // 現場と「何があった」が無いと保存しない
  await page.goto(URL + "?demo=1#/tasu");
  await page.locator("#f-save").click();
  await expect(page.locator("#f-out")).toContainText("入れてください");
});

test("デモ：足す画面の現場は、期で絞って選べる", async ({ page }) => {
  await page.goto(URL + "?demo=1#/tasu");
  const names = () => page.locator("#f-b option").allTextContents();
  // 最初は、一番新しい期（55期）の現場だけ
  await expect(page.locator("#f-ki .on")).toHaveText("55期");
  expect(await names()).toEqual(["現場を選んでください（1 件）", "見本一郎様邸（26-91）"]);
  await page.locator('#f-ki [data-tk="54"]').click();
  expect(await names()).toEqual(["現場を選んでください（1 件）", "サンプル商店（26-92）"]);
  // 選んだ現場は、期を変えても、その期にあれば選ばれたまま。書いた文も消えない
  await page.locator("#f-t").fill("書きかけ");
  await page.locator("#f-b").selectOption("26-92");
  await page.locator('#f-ki [data-tk=""]').click();
  expect((await names()).length).toBe(4);
  await expect(page.locator("#f-b")).toHaveValue("26-92");
  await expect(page.locator("#f-t")).toHaveValue("書きかけ");
  await page.locator('#f-ki [data-tk="x"]').click();
  expect(await names()).toEqual(["現場を選んでください（1 件）", "作例様邸（A55-91）"]);
  // 現場のカルテから開いた時は、その現場の期が選ばれている
  await page.goto(URL + "?demo=1#/tasu/26-92");
  await expect(page.locator("#f-ki .on")).toHaveText("54期");
  await expect(page.locator("#f-b")).toHaveValue("26-92");
});

test("お知らせ：ベルの印、機能と修正のタブ、開くと既読になる", async ({ page }) => {
  await page.goto(URL + "?demo=1");
  await expect(page.locator(".bellDot")).toBeVisible();
  await page.locator(".bellBtn").click();
  await expect(page.locator("#title")).toHaveText("お知らせ");
  // 最初は「新しい機能」。機能の印だけが並び、NEW が付く
  await expect(page.locator("#annTabs .on")).toContainText("新しい機能");
  await expect(page.locator(".annItem").first().locator(".pill")).toHaveText("機能");
  await expect(page.locator(".annItem .annNew").first()).toBeVisible();
  await page.locator('[data-ann="fix"]').click();
  await expect(page.locator(".annItem").first().locator(".pill")).toHaveText("修正");
  await expect(page.locator(".annItem .pill", { hasText: "機能" })).toHaveCount(0);
  // 一度開いたら、ホームのベルの印は消える。開き直すと NEW も消える
  await page.goto(URL + "?demo=1");
  await expect(page.locator(".bellBtn")).toBeVisible();
  await expect(page.locator(".bellDot")).toHaveCount(0);
  await page.locator(".bellBtn").click();
  await expect(page.locator(".annItem").first()).toBeVisible();
  await expect(page.locator(".annNew")).toHaveCount(0);
});

test("表示の色：ダークを選ぶと暗くなり、開き直しても残る。端末と同じに戻せる", async ({ page }) => {
  await page.goto(URL + "?demo=1#/settei");
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await bg()).toBe("rgb(247, 245, 239)");
  await page.locator('[data-theme-set="dark"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await bg()).toBe("rgb(28, 35, 32)");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator('[data-theme-set="dark"]')).toHaveClass(/on/);
  await page.locator('[data-theme-set="auto"]').click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  expect(await bg()).toBe("rgb(247, 245, 239)");
  // 端末がダークの時は、何も選ばなくても暗くなる。ライトを選ぶと明るいまま
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await bg()).toBe("rgb(28, 35, 32)");
  await page.locator('[data-theme-set="light"]').click();
  expect(await bg()).toBe("rgb(247, 245, 239)");
});

test("設定とお知らせの絵が現場ナビと同じ・お知らせが新しい順", () => {
  const app = read("app.js");
  const navi = fs.readFileSync(path.join(DIR, "..", "genba-manual", "app.js"), "utf8");
  const naviIcon = (name) => navi.match(new RegExp("\\n  " + name + ": '([^']+)',"))[1];
  const myIcon = (name) => app.match(new RegExp("\\n  " + name + ":'([^']+)',"))[1];
  expect(myIcon("gear"), "設定の絵（歯車）").toBe(naviIcon("settings"));
  expect(myIcon("bell"), "お知らせの絵（ベル）").toBe(naviIcon("bell"));
  const block = app.slice(app.indexOf("const ANNOUNCEMENTS = ["), app.indexOf("];", app.indexOf("const ANNOUNCEMENTS = [")));
  const rows = [...block.matchAll(/\{ date: "(\d{4}-\d{2}-\d{2})", type: "(\w+)", text: "/g)];
  expect(rows.length).toBeGreaterThan(0);
  const dates = rows.map((r) => r[1]);
  expect(dates).toEqual([...dates].sort().reverse());
  expect(rows.every((r) => ["feature", "fix"].includes(r[2]))).toBe(true);
});

test("版数がそろっている・社内データが入っていない", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  const v = Number(app.match(/const APP_VERSION = (\d+);/)[1]);
  const ver = (text, file) => Number((text.match(new RegExp(file.replace(".", "\\.") + "\\?v=(\\d+)")) || [])[1]);
  expect(ver(html, "app.js"), "index.html の app.js?v=").toBe(v);
  expect(ver(sw, "app.js"), "service-worker.js の app.js?v=").toBe(v);
  expect(ver(sw, "style.css"), "service-worker.js の style.css?v=").toBe(ver(html, "style.css"));
  expect(sw).toMatch(/const CACHE_VERSION = \d+;/);
  // デモのデータは、作りものの印が付いている
  expect(read("demo.js")).toMatch(/demo: true/);
  for (const m of read("demo.js").matchAll(/"題": "([^"]+)"/g)) expect(m[1]).toMatch(/^（作りもの）/);
});
