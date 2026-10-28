// 現場ナビ・見守りの動作テスト。使い方は tests/README.md
const { defineConfig, devices } = require("@playwright/test");

// 木村さんの PC では入っている Chrome を使う（ブラウザを別に落とさない）。クラウドでは TEST_BROWSER=chromium にして npx playwright install chromium
const channel = process.env.TEST_BROWSER === "chromium" ? undefined : "chrome";

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
  projects: [{ name: "iphone-size", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", channel } }],
  webServer: { command: "node serve.js", url: "http://localhost:4173/genba-manual/", reuseExistingServer: true },
});
