// 山郷サポート 3つのアプリ：版数のそろい（APP_VERSION・index.html の ?v=・APP_SHELL）。上げ忘れると、現場の端末に古い版が残る
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const read = (app, f) => fs.readFileSync(path.join(ROOT, app, f), "utf8");

for (const app of ["sango-support", "sango-admin", "sango-honsha"]) {
  test(`${app}：APP_VERSION と index.html・APP_SHELL の ?v= がそろっている`, () => {
    const js = read(app, "app.js"), html = read(app, "index.html"), sw = read(app, "service-worker.js");
    const ver = Number((js.match(/const APP_VERSION = (\d+);/) || [])[1]);
    expect(ver).toBeGreaterThan(0);
    expect(html).toContain(`app.js?v=${ver}"`);
    expect(sw).toContain(`'app.js?v=${ver}'`);
    const css = (html.match(/style\.css\?v=(\d+)/) || [])[1];
    expect(sw).toContain(`'style.css?v=${css}'`);
    // index.html で読む自分のフォルダのスクリプトは、すべて APP_SHELL に同じ ?v= で入っている
    for (const m of html.matchAll(/<script src="([\w.-]+\.js\?v=\d+)"/g)) expect(sw).toContain(`'${m[1]}'`);
  });
}

for (const app of ["sango-support", "sango-admin"]) {
  test(`${app}：お知らせは新しい順`, () => {
    const js = read(app, "app.js");
    const block = js.slice(js.indexOf("const ANNOUNCEMENTS = ["), js.indexOf("];", js.indexOf("const ANNOUNCEMENTS = [")));
    const dates = [...block.matchAll(/date: "(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]);
    expect(dates.length).toBeGreaterThan(0);
    expect(dates).toEqual([...dates].sort().reverse());
  });
}
