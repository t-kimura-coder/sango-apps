// 山郷サポート リーダー：連絡先の出し方（2026-11-22）。業者の用途（何の時にかけるか）・分類の注意（ガス漏れなど）・本社経由の業者
// 画面の関数をそのまま呼んで、作りものの業者データから作った HTML を確かめる（窓口にはつながない）
const { test, expect } = require("@playwright/test");

const MASTER = {
  kind: "sango-support-master", schema: 1, version: "test",
  help: { title: "困ったときは", contacts: [] },
  buildings: [{ id: "b1", name: "テスト棟", group: "テスト" }, { id: "b2", name: "テスト棟2", group: "テスト" }],
  categories: [{ id: "CAT-14", label: "ガス", glyph: "ガ", alert: "テスト：ガス漏れの時はすぐにガス会社へ" }],
  entries: [
    { b: "b1", c: "CAT-14", none: false, note: "", companies: [
      { name: "テストメーカー", phone: "0120-000-000", contact: "", direct: true, use: "修理（エラー表示・故障）" },
      { name: "テストガス業者", phone: "011-000-0000", contact: "", direct: false, use: "機器の交換・配管（一次側）" },
      { name: "テスト用途なし", phone: "011-000-0001", contact: "", direct: true } ] },
    { b: "b2", c: "CAT-14", none: true, note: "", companies: [] },
  ],
};

test("業者の用途が「〇〇の時」と出る。用途の無い業者には出ない", async ({ page }) => {
  await page.goto("sango-support/index.html");
  const html = await page.evaluate((m) => { master = normMaster(m); return contactHtml("b1", "CAT-14"); }, MASTER);
  await page.setContent(`<div id="x">${html}</div>`);
  await expect(page.locator(".vUse")).toHaveCount(2);
  await expect(page.locator(".vUse").first()).toHaveText("修理（エラー表示・故障）の時");
  await expect(page.locator(".vUse").nth(1)).toHaveText("機器の交換・配管（一次側）の時");
});

test("分類の注意が連絡先の上に出る。設置なしの建物には出ない", async ({ page }) => {
  await page.goto("sango-support/index.html");
  const r = await page.evaluate((m) => { master = normMaster(m); return { has: contactHtml("b1", "CAT-14"), none: contactHtml("b2", "CAT-14") }; }, MASTER);
  expect(r.has).toContain('class="catAlert"');
  expect(r.has.indexOf("catAlert")).toBeLessThan(r.has.indexOf("テストメーカー"));
  expect(r.none).not.toContain("catAlert");
});

test("直接連絡OKの業者は電話のリンク、本社経由の業者は押すと本社に回るボタン", async ({ page }) => {
  await page.goto("sango-support/index.html");
  const html = await page.evaluate((m) => { master = normMaster(m); return contactHtml("b1", "CAT-14"); }, MASTER);
  await page.setContent(`<div id="x">${html}</div>`);
  await expect(page.locator('a.callBtn[href^="tel:0120"]')).toHaveCount(1);
  await expect(page.locator('button.callBtn.held[data-hold="テストガス業者"]')).toHaveCount(1);
});
