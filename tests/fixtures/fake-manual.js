// テスト用の作りもののマニュアル（本物のマニュアルは社内資料なので、このリポジトリには入れない）。
// 本物と同じ形（genba-manual-pack・schema 5）で、項目は少しだけ。文はすべて作りもの。
// 1×1 の白い JPEG（ページの絵の代わり）
const PAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

function item(id, no, name, cat, page, checks, prep = []) {
  return {
    id,
    no,
    name,
    cat,
    pages: [page],
    text: {
      summary: `${name}の作りものの概要です。`,
      purpose: [{ text: `${name}の目的（テスト用）` }],
      goal: [],
      checks: checks.map((t, i) => ({ id: `${id}.c${String(i + 1).padStart(2, "0")}`, text: t })),
      prep: prep.map((t, i) => ({ id: `${id}.p${String(i + 1).padStart(2, "0")}`, text: t })),
    },
  };
}

function fakeManualPack() {
  const items = [
    item("m901", "1", "テスト仮設", "p01", 1, ["仮設のテスト確認A", "仮設のテスト確認B"], ["仮設の段取りテスト"]),
    item("m902", "2", "テスト配筋", "p02", 2, ["配筋のかぶり厚さを確かめる（テスト）", "スペーサーの間隔（テスト）"]),
    item("m903", "3", "テスト建て方", "p04", 3, ["建て方の通りを確かめる（テスト）"]),
    item("m904", "4", "テスト外壁", "p06", 4, ["透湿シートの重ね（テスト）"]),
  ];
  const pages = {};
  items.forEach((it) => it.pages.forEach((p) => (pages[String(p)] = PAGE)));
  return {
    kind: "genba-manual-pack",
    schema: 5,
    version: "test",
    title: "テスト用マニュアル",
    built_at: "2026-01-01T00:00:00",
    guides: {},
    synonyms: [["テスト建て方", "テスト上棟"]],
    branding: null,
    items,
    pages,
  };
}

module.exports = { fakeManualPack };
