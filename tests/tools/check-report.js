// 動作チェックの報告を GitHub の「check-reports」の枝に置く（main には入れない。main は GitHub Pages で即本番のため）。
// 使い方：
//   node tools/check-report.js last              … 前回チェックした時のコミット（無ければ空）
//   node tools/check-report.js save <報告.md> 昼|夜  … 報告を reports/ に置き、last.txt を今のコミットにして push
// 作業はテンポラリの別フォルダ（git worktree）で行うので、今の作業中のファイルには触らない。
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const BRANCH = "check-reports";
const ROOT = path.join(__dirname, "..", "..");
const git = (args, cwd = ROOT) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const fetchBranch = () => {
  try {
    git(["fetch", "-q", "origin", BRANCH]);
    return true;
  } catch (e) {
    return false; // まだ枝が無い（初回）
  }
};

const [cmd, src, who = "昼"] = process.argv.slice(2);

if (cmd === "last") {
  if (!fetchBranch()) process.exit(0);
  try {
    console.log(git(["show", `origin/${BRANCH}:last.txt`]));
  } catch (e) {
    /* last.txt がまだ無い */
  }
} else if (cmd === "save") {
  if (!src || !fs.existsSync(src)) {
    console.error("報告のファイルがありません: " + src);
    process.exit(2);
  }
  const head = git(["rev-parse", "HEAD"]);
  const exists = fetchBranch();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sango-check-"));
  try {
    if (exists) {
      git(["worktree", "add", "-q", "--detach", dir, `origin/${BRANCH}`]);
    } else {
      git(["worktree", "add", "-q", "--detach", dir]);
      git(["checkout", "-q", "--orphan", "tmp-check-reports"], dir);
      git(["rm", "-rq", "--cached", "."], dir);
      for (const f of fs.readdirSync(dir)) if (f !== ".git") fs.rmSync(path.join(dir, f), { recursive: true, force: true });
      fs.writeFileSync(path.join(dir, "README.md"), "# 動作チェックの報告\n\n`reports/` に1回ごとの報告。`last.txt` は最後にチェックした main のコミット。アプリの本体は main にある。\n");
    }
    // クラウドは世界標準時で動くので、日本の時刻で名前を付ける
    const t = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date())
        .map((p) => [p.type, p.value])
    );
    const name = `${t.year}-${t.month}-${t.day}_${t.hour}${t.minute}_${who}.md`;
    fs.mkdirSync(path.join(dir, "reports"), { recursive: true });
    fs.copyFileSync(src, path.join(dir, "reports", name));
    fs.writeFileSync(path.join(dir, "last.txt"), head + "\n");
    git(["add", "-A"], dir);
    git(["commit", "-q", "-m", `check: ${name}`], dir);
    git(["push", "-q", "origin", `HEAD:refs/heads/${BRANCH}`], dir);
    console.log(`報告を置きました: ${BRANCH}/reports/${name}`);
  } finally {
    try {
      git(["worktree", "remove", "--force", dir]);
    } catch (e) {
      fs.rmSync(dir, { recursive: true, force: true });
      git(["worktree", "prune"]);
    }
    try {
      git(["branch", "-D", "tmp-check-reports"]);
    } catch (e) {
      /* 初回以外は無い */
    }
  }
} else {
  console.log("使い方: node tools/check-report.js last | save <報告.md> 昼|夜");
  process.exit(2);
}
