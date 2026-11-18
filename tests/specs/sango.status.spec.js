// 山郷サポート リーダー・管理者：手配の状況の出し方（本社からの連絡の経過・続きの依頼）と、新着の目印（2026-11-18）
// 画面の関数をそのまま呼んで、作りものの状況から作った HTML を確かめる（窓口にはつながない）
const { test, expect } = require("@playwright/test");

const ST = {
  state: "done", visit_at: "2026-11-05", estimate: "",
  replies: [{ t: "2026-11-01T10:00:00+09:00", text: "テスト：11/5 に伺います" }],
  follows: [{ id: "c2", what: "テスト：部品の交換", created_at: "2026-11-18T12:00:00+09:00", state: "arranged", visit_at: "", reply: "テスト：見積を頼んでいます", t: "2026-11-18T12:05:00+09:00" }],
};
const CHILD = { state: "received", replies: [], parent: { id: "c1", what: "テスト：金具が外れた", created_at: "2026-10-30T09:00:00+09:00" } };

for (const app of ["sango-support", "sango-admin"]) {
  test(`${app}：元の依頼に、続きの依頼の内容・段階・本社からの連絡が出る（業者の名前は持っていない）`, async ({ page }) => {
    await page.goto(app + "/index.html");
    const html = await page.evaluate((st) => reqStatusHtml(st), ST);
    await page.setContent(`<div id="x">${html}</div>`);
    const x = page.locator("#x");
    await expect(x).toContainText("続きの依頼（本社が立てました）");
    await expect(x).toContainText("テスト：部品の交換");
    await expect(x).toContainText("手配済み");
    await expect(x).toContainText("テスト：見積を頼んでいます");
    await expect(x).toContainText("テスト：11/5 に伺います");
  });

  test(`${app}：続きの依頼には「元の依頼」が出る`, async ({ page }) => {
    await page.goto(app + "/index.html");
    const html = await page.evaluate((st) => reqStatusHtml(st), CHILD);
    expect(html).toContain("元の依頼");
    expect(html).toContain("テスト：金具が外れた");
  });

  test(`${app}：続きの依頼の段階・連絡が変わると、新着の目印（hqKey）が変わる。続きが無い時は前と同じ形`, async ({ page }) => {
    await page.goto(app + "/index.html");
    const r = await page.evaluate((st) => {
      const a = hqKey(st);
      const b = hqKey({ ...st, follows: [{ ...st.follows[0], state: "scheduled" }] });
      const plain = hqKey({ state: "arranged", replies: [{ t: "2026-11-01T10:00:00+09:00", text: "x" }] });
      return { a, b, plain };
    }, ST);
    expect(r.a).not.toBe(r.b);
    expect(r.plain).toBe("arranged|2026-11-01T10:00:00+09:00");
  });
}

test("sango-admin：手元にある依頼なら、続きの依頼・元の依頼はリンクになる", async ({ page }) => {
  await page.goto("sango-admin/index.html");
  const html = await page.evaluate((st) => { S.records = [{ id: "c2" }]; return reqStatusHtml(st); }, ST);
  expect(html).toContain('href="#/r/c2"');
});
