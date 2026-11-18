// 山郷サポートの窓口（GAS）のふり。本物の窓口には何も届かない。名前・内容はすべて作りもの（このリポジトリは公開）
// 本社の画面が使う操作だけを、画面の確かめに要る分だけまねる（窓口の細かい決まりは、窓口の側で確かめる）
const API_URL = "https://script.google.com/macros/s/test-sango/exec";

function makeSango() {
  const now = () => new Date(Date.parse("2026-11-18T10:00:00+09:00") + (makeSango.n++) * 60000).toISOString();
  const st = {
    records: [
      { id: "t1", kind: "request", building_id: "b1", building: "テスト棟", category_id: "CAT-01", category: "水回り", what: "テスト：水が止まらない", how: "", vendor: "", sender: "テスト係", created_at: "2026-11-10T09:00:00+09:00", photos: [], urgent: false, parent_id: "" },
    ],
    items: { t1: { vendor: "テスト設備", progress: "arranged", memo: "前の形のメモ", memos: [{ t: "2026-11-10T10:00:00+09:00", text: "前の形のメモ", by: "テスト本社" }], replies: [], at: 1, by: "テスト本社" } },
    docs: {},
    files: {},
    calls: [],
  };
  const item = (id) => (st.items[id] = st.items[id] || { memos: [], replies: [] });
  const handle = (b) => {
    st.calls.push(b.action);
    switch (b.action) {
      case "honshaList": return { records: st.records, honsha: { items: st.items }, past: [], docs: st.docs };
      case "honshaSave": {
        const it = item(b.id), p = b.patch || {};
        Object.keys(p).forEach((k) => { if (!/^(memo_add|memo_undo|reply_add|reply_undo|memo)$/.test(k)) it[k] = p[k]; });
        if (p.memo_undo) it.memos = it.memos.slice(0, -1);
        if (p.memo_add) it.memos = it.memos.concat([{ t: now(), text: p.memo_add, by: "テスト本社" }]);
        it.memo = it.memos.map((x) => x.text).join("\n");
        it.at = Date.now();
        return { item: it };
      }
      case "docPut": {
        if (!["application/pdf", "image/jpeg", "image/png"].includes(b.mime)) return { ok: false, error: "入れられるのは PDF・JPEG・PNG だけです" };
        const id = "doc" + Object.keys(st.files).length;
        st.files[id] = { mime: b.mime, data: b.data, name: b.name };
        (st.docs[b.record_id] = st.docs[b.record_id] || []).push({ id, record_id: b.record_id, name: b.name, mime: b.mime, size: Buffer.from(b.data, "base64").length, note: b.note || "", at: now(), by: "テスト本社" });
        return { docs: st.docs[b.record_id] };
      }
      case "docGet": return { name: st.files[b.id].name, mime: st.files[b.id].mime, data: st.files[b.id].data };
      case "docRemove": {
        const rid = Object.keys(st.docs).find((k) => st.docs[k].some((d) => d.id === b.id));
        if (!rid) return { ok: false, error: "その書類が見つかりません" };
        st.docs[rid] = st.docs[rid].filter((d) => d.id !== b.id);
        return { docs: st.docs[rid] };
      }
      case "honshaFollow": {
        const p = st.records.find((r) => r.id === b.parent_id);
        const id = "t" + (st.records.length + 1);
        st.records.push({ ...p, id, what: b.what, sender: "本社", created_at: now(), parent_id: p.id, urgent: !!b.urgent });
        if (b.close_parent) item(p.id).progress = "done";
        return { result: { id, parent_id: p.id } };
      }
      default: return { ok: false, error: "テストでは使わない操作: " + b.action };
    }
  };
  return { st, handle };
}
makeSango.n = 0;

/** 本社の画面を、偽物の窓口につないで開く */
async function openHonsha(page, hash) {
  const fake = makeSango();
  await page.route("**/script.google.com/**", async (route) => {
    let b = {}; try { b = JSON.parse(route.request().postData() || "{}"); } catch (e) { /* 空 */ }
    const r = fake.handle(b);
    const body = r && r.ok === false ? r : Object.assign({ ok: true }, r);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body), headers: { "Access-Control-Allow-Origin": "*" } });
  });
  await page.addInitScript((url) => {
    localStorage.setItem("sango-honsha-api", JSON.stringify({ url, token: "t".repeat(40) }));
    localStorage.setItem("sango-honsha-tour-done", "1");
  }, API_URL);
  await page.goto("sango-honsha/index.html" + (hash || ""));
  return fake;
}

module.exports = { makeSango, openHonsha, API_URL };
