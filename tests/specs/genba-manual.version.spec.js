// 版数のそろい：app.js の APP_VERSION・index.html の ?v=・service-worker.js の APP_SHELL がずれていると、
// iPhone に古い app.js が残ったり、新しい版が届かなかったりする。画面は開かずにファイルだけ見る
const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const DIR = path.join(__dirname, "..", "..", "genba-manual");
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");
const ver = (text, file) => {
  const m = text.match(new RegExp(file.replace(".", "\\.") + "\\?v=(\\d+)"));
  return m && Number(m[1]);
};

test("APP_VERSION・index.html・service-worker の版数がそろっている", () => {
  const app = read("app.js");
  const html = read("index.html");
  const sw = read("service-worker.js");
  const appVersion = Number(app.match(/const APP_VERSION = (\d+);/)[1]);
  expect(ver(html, "app.js"), "index.html の app.js?v=").toBe(appVersion);
  expect(ver(sw, "app.js"), "service-worker.js の app.js?v=").toBe(appVersion);
  expect(ver(sw, "style.css"), "service-worker.js の style.css?v=").toBe(ver(html, "style.css"));
  expect(sw).toMatch(/const CACHE_VERSION = \d+;/);
});

test("お知らせの先頭が新しい順に並んでいて、形がそろっている", () => {
  const app = read("app.js");
  const block = app.slice(app.indexOf("const ANNOUNCEMENTS = ["), app.indexOf("];", app.indexOf("const ANNOUNCEMENTS = [")));
  const rows = [...block.matchAll(/\{ date: "(\d{4}-\d{2}-\d{2})", type: "(\w+)", text: "/g)];
  expect(rows.length).toBeGreaterThan(0);
  const dates = rows.map((r) => r[1]);
  expect(dates).toEqual([...dates].sort().reverse());
  expect(rows.every((r) => ["feature", "fix"].includes(r[2]))).toBe(true);
});
