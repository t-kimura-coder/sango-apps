// テストの共通の準備：まっさらな端末で、名前・合言葉を入れ、案内を終えた状態から始める。
// 本物の GAS の代わりに偽物（fake-gas.js）を立てる。確認の窓（confirm）は「OK」で進める。
const base = require("@playwright/test");
const { useFakeGas, TEST_TOKEN } = require("./fake-gas");

const test = base.test.extend({
  gas: async ({ page }, use) => {
    const gas = await useFakeGas(page);
    await use(gas);
  },
  errors: async ({ page }, use) => {
    // 画面の裏で起きたエラー（テストの最後に「無いこと」を確かめる）
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await use(errors);
  },
  app: async ({ page, gas, errors }, use) => {
    await page.addInitScript((token) => {
      // iPhone の Safari にはフォルダを選ぶ機能が無い（あると PC 用の「フォルダに保存」になる）。テストは iPhone と同じ動きで
      delete window.showDirectoryPicker;
      delete Window.prototype.showDirectoryPicker;
      if (sessionStorage.getItem("test-ready")) return; // 読み込み直しでは消さない
      sessionStorage.setItem("test-ready", "1");
      localStorage.setItem("genba-photo-user-name", "テスト");
      localStorage.setItem("genba-photo-gas-token", token);
      localStorage.setItem("genba-photo-tour-done", "1");
      localStorage.setItem("genba-photo-box-email", "test-upload@example.invalid"); // 送り先の設定（偽の GAS で送るので使われない）
      localStorage.setItem("genba-photo-cust-offer", "0"); // 送ったあとの「お客様メール用の写真」の案内は出さない
    }, TEST_TOKEN);
    page.on("dialog", (d) => d.accept());
    await page.goto("genba-manual/");
    await use(page);
  },
});

// マニュアルを偽の GAS から受け取る（設定の「合言葉で受け取る」と同じ道）
async function receiveManual(page) {
  await page.evaluate(() => receiveManualViaGas());
  await base.expect(page.locator(".toast, #toast").filter({ hasText: "取り込みました" }).first()).toBeVisible({ timeout: 15000 });
}

// 現場を登録する（ホームの「担当現場を登録しましょう」から）
async function addSite(page, name, koujiNo) {
  await page.evaluate(() => goDash()); // マニュアルを受け取った後は工程の画面にいるので、ホームに戻る
  await page.locator("#dashSiteCard").getByText("担当現場を登録しましょう").click();
  const sheet = page.locator(".sheet").last();
  await sheet.getByPlaceholder("例：山田様邸 新築").fill(name);
  await sheet.getByPlaceholder("例：S26492").fill(koujiNo);
  await sheet.getByRole("button", { name: "登録する" }).click();
}

// 写真を1枚足す（カメラの代わりに、画面の中で色を塗った絵を作って、アプリと同じ作り方で保存する）
async function addPhoto(page, { processId, itemId = "", custOff = false, sendPick = true, color = "#888" }) {
  return page.evaluate(
    async ({ processId, itemId, custOff, sendPick, color }) => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 48;
      const g = c.getContext("2d");
      g.fillStyle = color;
      g.fillRect(0, 0, 64, 48);
      const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.9));
      const rec = await makePhotoRecord(new File([blob], "test.jpg", { type: "image/jpeg" }), currentSiteId, processId, new Date(), { itemId, custOff, sendPick });
      await dbPut("photos", rec);
      return rec.id;
    },
    { processId, itemId, custOff, sendPick, color }
  );
}

// チェックを付ける（項目の画面でチェックを押したのと同じ処理）
async function markCheck(page, itemId, index) {
  await page.evaluate(
    async ({ itemId, index }) => {
      await loadSiteChecks();
      const it = allManualItems().find((x) => x.id === itemId);
      await toggleMark(it, checkKey("checks", it.text.checks[index]));
    },
    { itemId, index }
  );
}

module.exports = { test, expect: base.expect, receiveManual, addSite, addPhoto, markCheck };
