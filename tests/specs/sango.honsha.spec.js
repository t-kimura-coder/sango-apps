// 山郷サポート 本社の画面（2026-11-18）：本社メモの経過・見積と書類・続きの依頼。窓口は偽物（fixtures/fake-sango.js）
const { test, expect } = require("@playwright/test");
const { openHonsha } = require("../fixtures/fake-sango");

test.use({ viewport: { width: 1280, height: 1000 }, isMobile: false, hasTouch: false });

test("本社メモ：書き換えの欄は無く、足すと日時と名前つきで先頭に積まれる。取り消すと一番新しい1件が消える", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  const fake = await openHonsha(page, "#/r/t1");
  await expect(page.locator("#memoList")).toContainText("前の形のメモ");
  await expect(page.locator("#fMemo")).toHaveCount(0);
  await page.fill("#fMemoAdd", "テスト：見積をもらった");
  await page.click("#fMemoSend");
  await expect(page.locator("#memoList li")).toHaveCount(2);
  await expect(page.locator("#memoList li").first()).toContainText("テスト：見積をもらった");
  await expect(page.locator("#memoList li").first()).toContainText("テスト本社");
  await expect(page.locator("#fMemoAdd")).toHaveValue("");
  await page.click("#memoUndo");
  await expect(page.locator("#memoList li")).toHaveCount(1);
  expect(fake.st.items.t1.memos.map((x) => x.text)).toEqual(["前の形のメモ"]);
});

test("本社メモ：書きかけのメモは「保存する」でも足され、メモを丸ごと送らない", async ({ page }) => {
  const fake = await openHonsha(page, "#/r/t1");
  await expect(page.locator("#fSave")).toBeVisible();
  let sent = null;
  page.on("request", (r) => { if (r.url().includes("script.google.com")) { const b = JSON.parse(r.postData() || "{}"); if (b.action === "honshaSave") sent = b.patch; } });
  await page.fill("#fMemoAdd", "テスト：保存と一緒に");
  await page.click("#fSave");
  await expect(page.locator("#memoList li").first()).toContainText("テスト：保存と一緒に");
  expect(sent.memo_add).toBe("テスト：保存と一緒に");
  expect("memo" in sent).toBe(false);
  expect(fake.st.items.t1.memos).toHaveLength(2);
});

test("見積・書類：PDF を入れると一覧に出て、押すと新しいタブで開き、取り消すと消える", async ({ page, context }) => {
  page.on("dialog", (d) => d.accept());
  const fake = await openHonsha(page, "#/r/t1");
  await expect(page.locator("#docPanel")).toBeVisible();
  await page.setInputFiles("#docFile", { name: "テスト見積.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") });
  await page.fill("#docNote", "テストのひとこと");
  await page.click("#docSend");
  await expect(page.locator(".docList li")).toHaveCount(1);
  await expect(page.locator(".docList li")).toContainText("テスト見積.pdf");
  await expect(page.locator(".docList li")).toContainText("テストのひとこと");
  expect(fake.st.calls).toContain("docPut");
  const [tab] = await Promise.all([context.waitForEvent("page"), page.click(".docOpen")]);
  await expect.poll(() => tab.url()).toMatch(/^blob:/);
  await tab.close();
  await page.click(".docRm");
  await expect(page.locator(".docList li")).toHaveCount(0);
});

test("見積・書類：PDF・JPEG・PNG 以外は、窓口に送らずに断る", async ({ page }) => {
  let msg = "";
  page.on("dialog", (d) => { msg = d.message(); d.accept(); });
  const fake = await openHonsha(page, "#/r/t1");
  await page.setInputFiles("#docFile", { name: "テスト.txt", mimeType: "text/plain", buffer: Buffer.from("テスト") });
  await page.click("#docSend");
  await expect.poll(() => msg).toContain("入れられないファイル");
  expect(fake.st.calls).not.toContain("docPut");
});

test("続きの依頼：立てると元の依頼は施工完了になり、続きの依頼の画面に移って、元の依頼へのリンクが出る", async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  const fake = await openHonsha(page, "#/r/t1");
  await page.click("#followOpen");
  await expect(page.locator("#followClose")).toBeChecked();
  await page.fill("#followWhat", "テスト：部品の交換");
  await page.click("#followGo");
  await expect(page).toHaveURL(/#\/r\/t2$/);
  await expect(page.locator('.relList a[href="#/r/t1"]')).toBeVisible();
  expect(fake.st.items.t1.progress).toBe("done");
  const kid = fake.st.records.find((r) => r.id === "t2");
  expect(kid.parent_id).toBe("t1");
  expect(kid.building_id).toBe("b1");
  await page.goto("sango-honsha/index.html#/r/t1");
  await expect(page.locator('.relList a[href="#/r/t2"]')).toContainText("テスト：部品の交換");
});

test("続きの依頼：内容が空なら立てない", async ({ page }) => {
  const fake = await openHonsha(page, "#/r/t1");
  await page.click("#followOpen");
  await page.click("#followGo");
  await expect(page.locator("#followBox")).toBeVisible();
  expect(fake.st.calls).not.toContain("honshaFollow");
});
