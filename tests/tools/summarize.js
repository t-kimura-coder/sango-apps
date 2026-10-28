// テストの結果（test-results/results.json）を短くまとめて出す。動作チェックの報告の材料
// 使い方：node tools/summarize.js
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "test-results", "results.json");
if (!fs.existsSync(file)) {
  console.log("結果がありません（先に npx playwright test）");
  process.exit(2);
}
const r = JSON.parse(fs.readFileSync(file, "utf8"));
const tests = [];
const walk = (suite, parents) => {
  for (const s of suite.suites || []) walk(s, [...parents, s.title]);
  for (const spec of suite.specs || []) {
    for (const t of spec.tests) {
      const last = t.results[t.results.length - 1] || {};
      tests.push({
        file: parents[0] || "",
        title: spec.title,
        status: last.status || "skipped",
        error: ((last.error && last.error.message) || "").replace(/\u001b\[[0-9;]*m/g, "").split("\n").slice(0, 6).join("\n"),
      });
    }
  }
};
walk(r, []);
const ng = tests.filter((t) => t.status !== "passed" && t.status !== "skipped");
console.log(`テスト ${tests.length} 本：通った ${tests.filter((t) => t.status === "passed").length}・落ちた ${ng.length}・飛ばした ${tests.filter((t) => t.status === "skipped").length}（${Math.round((r.stats?.duration || 0) / 1000)} 秒）`);
for (const t of ng) console.log(`\n✗ ${t.file} › ${t.title}\n${t.error}`);
process.exit(ng.length ? 1 : 0);
