// 見守り：現場Plus の工程表（中継の写し）を、週の報告の下に「この週の工程」として並べる（2026-11-09）
const { test, expect } = require("@playwright/test");

const plans = [
  {
    bk: "BK-0001",
    name: "テスト工程表",
    takenAt: "2026-11-07 19:51",
    changes: 2,
    lastChange: "2026-11-08 10:00",
    tasks: [
      { big: "共通", parent: "", name: "共通", kind: "グループ", company: "", ps: "", pe: "" },
      { big: "基礎", parent: "基礎", name: "テスト配筋", kind: "タスク", company: "テスト建設", ps: "2026-11-02", pe: "2026-11-04" },
      { big: "基礎", parent: "基礎", name: "テスト打設", kind: "タスク", company: "", ps: "2026-11-07", pe: "2026-11-07" },
      { big: "上棟", parent: "上棟", name: "テスト建て方", kind: "タスク", company: "", ps: "2026-11-10", pe: "2026-11-12" },
    ],
  },
];

test("この週に期間がかかる工程だけを並べ、取った日と変更の知らせを添える", async ({ page }) => {
  await page.goto("genba-viewer/");
  const html = await page.evaluate((plans) => planWeekHtml(plans, "2026-11-02"), plans);
  await page.setContent(`<div id="x">${html}</div>`);
  const x = page.locator("#x");
  await expect(x).toContainText("現場Plus の工程（この週）");
  await expect(x).toContainText("11/7(土) 時点");
  await expect(x).toContainText("変更の知らせ 2件");
  await expect(x).toContainText("テスト配筋");
  await expect(x).toContainText("テスト打設");
  await expect(x).not.toContainText("テスト建て方"); // 次の週の工程は出さない
  await expect(x.locator("li")).toHaveCount(2); // グループの行は出さない
});

test("この週に工程が無ければ、そう書く", async ({ page }) => {
  await page.goto("genba-viewer/");
  const html = await page.evaluate((plans) => planWeekHtml(plans, "2026-12-07"), plans);
  expect(html).toContain("この週に予定の入った工程はありません");
});
