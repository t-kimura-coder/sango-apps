// 現場ナビ・見守りの動作テスト。使い方は tests/README.md
const { defineConfig, devices } = require("@playwright/test");

const fs = require("fs");
const path = require("path");

// 木村さんの PC では入っている Chrome を使う（ブラウザを別に落とさない）。クラウドでは TEST_BROWSER=chromium
const channel = process.env.TEST_BROWSER === "chromium" ? undefined : "chrome";

// クラウドはブラウザをダウンロードできない（外に出られない）。最初から入っている /opt/pw-browsers の Chromium を使う
function cloudChromium() {
  const root = "/opt/pw-browsers";
  if (channel || !fs.existsSync(root)) return undefined;
  for (const dir of fs.readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    for (const sub of ["chrome-linux64", "chrome-linux"]) {
      const exe = path.join(root, dir, sub, "chrome");
      if (fs.existsSync(exe)) return exe;
    }
  }
  return undefined;
}
const executablePath = cloudChromium();

module.exports = defineConfig({
  testDir: "./specs",
  timeout: 30000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: "http://localhost:4173/",
    serviceWorkers: "block", // 古い版を覚えたまま試さないように
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "iphone-size", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", channel, launchOptions: executablePath ? { executablePath } : {} } }],
  webServer: { command: "node serve.js", url: "http://localhost:4173/genba-manual/", reuseExistingServer: true },
});
