"use strict";
/* 山郷サポート 本社：山郷から来た「対応の依頼」の進捗（業者への手配）と、山郷への請求を管理する。
   窓口（GAS）の honshaList / honshaSave だけを使う。合言葉は「本社用」（山郷側の管理者には渡さない）。 */
const APP_VERSION = 15;
const HONSHA_API_URL = "https://script.google.com/macros/s/AKfycbwK_-2R23HZfPtWS_NUzknStSt2DGKExK7EAyhzfQq598QIhcY0u8LLmpcE_q18OD0y/exec"; // 窓口のURL（人ごとの合言葉が無ければ使えない）
const P = "sango-honsha-";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const getLS = (k, d) => { try { const v = localStorage.getItem(P + k); return v == null ? (d || "") : v; } catch (e) { return d || ""; } };
const setLS = (k, v) => { try { localStorage.setItem(P + k, v); } catch (e) { /* 使えない時は無視 */ } };

const PROGRESS = [["", "未手配"], ["arranged", "手配済み"], ["scheduled", "施工待ち"], ["done", "施工完了"]];
const progLabel = (v) => (PROGRESS.find((p) => p[0] === v) || PROGRESS[0])[1];
const SANGO_STATUS = { "": "依頼中", doing: "対応中", done: "完了" };

const S = { api: loadApi(), records: [], items: {}, syncedAt: 0, syncError: "", loaded: false, master: null, past: [] };
function loadApi() { try { const j = JSON.parse(getLS("api", "")); return j && j.url && j.token ? j : null; } catch (e) { return null; } }

/* ---------- 窓口 ---------- */
/** 窓口に送る。通信エラー（iPhone では「Load failed」）の時は、自動で2回までやり直す。症例・写真・点検の記録は、同じIDなら上書きなので、重ならない */
async function netFetch(url, init) {
  for (let k = 0; ; k++) {
    try { return await fetch(url, init); }
    catch (e) {
      if (e && e.name === "AbortError") throw new Error("時間がかかりすぎました。電波の良い所で、もう一度お試しください");
      if (k >= 2) throw new Error("窓口につながりませんでした。電波を確認して、もう一度お試しください（" + String((e && e.message) || e).slice(0, 40) + "）");
      await new Promise((r) => setTimeout(r, 1200 * (k + 1)));
    }
  }
}
async function apiCall(body, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 60000);
  try {
    const res = await netFetch(S.api.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ token: S.api.token, ...body }), signal: ctl.signal, redirect: "follow" });
    let j; try { j = await res.json(); } catch (e) { throw new Error("窓口の応答が不正です（" + res.status + "）。URL・公開の設定・電波を確認してください"); }
    if (!j.ok) throw new Error(j.error === "unauthorized" ? "合言葉が違います（または、止められています）" : (j.error || "窓口からの返事が不正です"));
    return j;
  } finally { clearTimeout(timer); }
}
let loading = false;
async function loadAll(manual) {
  if (!S.api || loading) return false;
  loading = true;
  const api0 = S.api;
  try {
    const j = await apiCall({ action: "honshaList" });
    if (S.api !== api0) return false;
    S.records = (j.records || []).filter((r) => r && r.id).map((r) => ({ ...r, id: String(r.id), t: Date.parse(r.created_at) || 0 }));
    const items = {};
    const a = (j.honsha && j.honsha.items) || {}, b = S.items || {};
    for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) { items[id] = !a[id] ? b[id] : !b[id] ? a[id] : ((Number(b[id].at) || 0) > (Number(a[id].at) || 0) ? b[id] : a[id]); } // 手元で保存したばかりの値を、古い読み込みで巻き戻さない
    S.items = items;
    S.past = (j.past || []).filter((r) => r && r.id).map((r) => ({ ...r, id: String(r.id), t: Date.parse(r.created_at) || 0 })); // 過去の症例（読むだけ）
    S.syncedAt = Date.now(); S.syncError = ""; S.loaded = true;
    return true;
  } catch (e) {
    S.syncError = String((e && e.message) || e);
    if (manual) toast("読み込めませんでした：" + S.syncError.slice(0, 60));
    return false;
  } finally { loading = false; renderSync(); }
}
function renderSync() {
  const el = $("syncInfo"); if (!el) return;
  if (!S.api) { el.textContent = ""; return; }
  el.textContent = S.syncError ? "窓口につながりません" : S.syncedAt ? "自動更新 " + new Date(S.syncedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "読み込み中…";
  el.className = "syncInfo" + (S.syncError ? " bad" : "");
}

/* ---------- 状態の判定 ---------- */
const item = (r) => S.items[r.id] || {};
function stage(r) { // todo 未手配／work 進行中／billing 請求待ち／billed 請求済み
  const it = item(r);
  if (it.billed) return "billed";
  if (it.progress === "done") return it.bill_kind === "none" ? "billed" : "billing";
  if (it.progress === "arranged" || it.progress === "scheduled") return "work";
  return "todo";
}
const STAGE_LABEL = { todo: "未手配", work: "進行中", billing: "請求待ち", billed: "請求済み" };
const stLabel = (r, st) => (st === "billed" && item(r).bill_kind === "none" && !item(r).billed ? "請求なし" : STAGE_LABEL[st]); // 請求区分「請求しない」は、施工完了で、請求待ちに出さず「請求なし」で終わり
const BILL_KINDS = [["", "未選択"], ["charge", "請求する"], ["none", "請求しない（保証・サービス）"], ["tbd", "未定"]];
const STAGE_CLS = { todo: "todo", work: "work", billing: "bill", billed: "ok" };
const yen = (v) => (v === "" || v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("ja-JP") + "円");
const fmtDate = (t) => { if (!t) return ""; const d = new Date(t); return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0"); };
const gross = (it) => (it.bill_amount !== "" && it.bill_amount != null && !isNaN(Number(it.bill_amount)) && it.cost !== "" && it.cost != null && !isNaN(Number(it.cost)) ? Number(it.bill_amount) - Number(it.cost) : null);
const route = () => { const h = location.hash.replace(/^#\/?/, ""); const [name, id] = h.split("/"); return { name: name || "map", id: id ? decodeURIComponent(id) : "" }; };

let toastTimer = null;
function toast(msg) { const el = $("toast"); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2800); }

/* ---------- 建物・分類の絵（山郷サポートの絵を使う。無ければ出さない） ---------- */
const bldImg = (id) => `<img class="bimg" src="art/bld-${esc(id)}.webp" alt="" loading="lazy" onerror="this.remove()">`;
const catImg = (id) => `<img class="cimg" src="art/${esc(String(id || "").toLowerCase())}.webp" alt="" loading="lazy" onerror="this.remove()">`;
const pad2 = (n) => String(n).padStart(2, "0");
const ymNow = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; };

/* ---------- 新着（まだ開いていない依頼） ---------- */
const seenSet = () => { try { return new Set(JSON.parse(getLS("seen", "[]"))); } catch (e) { return new Set(); } };
function markSeen(ids) { const s = seenSet(); ids.forEach((i) => s.add(i)); setLS("seen", JSON.stringify([...s].slice(-800))); }
function initSeen() { if (getLS("seen") === "" && S.loaded) markSeen(S.records.map((r) => r.id)); } // 初めて開いた時は、今までの依頼を「新着」にしない
function updateTitle() { const s = seenSet(), n = S.records.filter((r) => !s.has(r.id)).length; document.title = (n ? `(${n}) ` : "") + "山郷サポート 本社"; }

/* ---------- 業者データ（手配先の候補。設計者の合言葉なら受け取れる。無くても使える） ---------- */
async function loadMaster() {
  try {
    const info = await apiCall({ action: "masterInfo" }, 20000);
    let cur = null; try { cur = JSON.parse(getLS("master", "null")); } catch (e) { cur = null; }
    if (cur && cur.v === info.version && cur.u === info.updated) { S.master = cur.data; return; }
    const got = await apiCall({ action: "masterGet" }, 60000);
    S.master = got.data; setLS("master", JSON.stringify({ v: got.version, u: got.updated, data: got.data }));
  } catch (e) { /* 本社用の合言葉だけでは受け取れない。候補が出ないだけ */ }
}
const entryOf = (r) => (S.master && S.master.entries ? S.master.entries.find((e) => e.b === r.building_id && e.c === r.category_id) : null);

/* ---------- 一覧 ---------- */
const F = { stage: "open", q: "", bld: "", late: "" };
const LATE_ARRANGE_DAYS = 3, LATE_BILL_DAYS = 30; // 窓口の朝のメールと同じ基準
/** 遅れ：手配（3日たっても未手配）／請求（施工完了から30日たっても未請求。「請求しない」は除く） */
function lateInfo() {
  const now = Date.now(), DAY = 86400000, arrange = [], bill = [];
  S.records.forEach((r) => {
    const st = stage(r), it = item(r);
    if (st === "todo" && r.t && now - r.t > LATE_ARRANGE_DAYS * DAY) arrange.push(r);
    if (st === "billing") { const dt = Date.parse(it.done_at) || Number(it.at) || 0; if (dt && now - dt > LATE_BILL_DAYS * DAY) bill.push(r); }
  });
  return { arrange, bill };
}
function lateBanner() {
  if (!S.loaded) return "";
  const l = lateInfo(); if (!l.arrange.length && !l.bill.length) return "";
  return `<div class="lateBanner">${l.arrange.length ? `<span>手配が遅れている依頼が <b>${l.arrange.length}件</b></span><button class="lateBtn" data-late="arrange">見る</button>` : ""}${l.bill.length ? `<span>請求が漏れていそうな依頼が <b>${l.bill.length}件</b></span><button class="lateBtn" data-late="bill">見る</button>` : ""}</div>`;
}
function wireLate(main) { main.querySelectorAll(".lateBtn").forEach((b) => (b.onclick = () => { F.late = b.dataset.late; F.stage = b.dataset.late === "bill" ? "billing" : "todo"; F.bld = ""; location.hash = "#/list"; })); }
function kpiHtml(counts) {
  const wait = S.records.filter((r) => stage(r) === "billing"), waitSum = wait.reduce((a, r) => a + (Number(item(r).bill_amount) || 0), 0);
  const ym = ymNow(), mon = S.records.filter((r) => item(r).bill_month === ym && (item(r).bill_amount || item(r).cost));
  const monBill = mon.reduce((a, r) => a + (Number(item(r).bill_amount) || 0), 0), monCost = mon.reduce((a, r) => a + (Number(item(r).cost) || 0), 0);
  const s = seenSet(), nNew = S.records.filter((r) => !s.has(r.id)).length;
  return `<div class="kpis">
    <button class="kpi todo" data-s="todo">${icn("order", "kIc")}<small>未手配</small><b>${counts.todo}</b>${nNew ? `<span class="kNew">新着 ${nNew}</span>` : ""}</button>
    <button class="kpi work" data-s="work">${icn("schedule", "kIc")}<small>進行中</small><b>${counts.work}</b></button>
    <button class="kpi bill" data-s="billing">${icn("invoice", "kIc")}<small>請求待ち</small><b>${counts.billing}</b><span>${waitSum ? yen(waitSum) : ""}</span></button>
    <div class="kpi ok">${icn("margin", "kIc")}<small>${Number(ym.slice(5))}月の請求</small><b class="yen">${monBill ? yen(monBill) : "—"}</b><span>${monBill ? "粗利 " + yen(monBill - monCost) : ""}</span></div></div>`;
}
function viewList(main) {
  if (!S.api) return viewEmptyApi(main);
  if (route().name === "list" && F.keepBld !== F.bld) { /* 建物画面から戻った時の絞り込みは、そのまま使う */ }
  const counts = { all: S.records.length, open: 0, todo: 0, work: 0, billing: 0, billed: 0, past: S.past.length };
  S.records.forEach((r) => { const st = stage(r); counts[st]++; if (st !== "billed") counts.open++; });
  const chips = [["open", "対応が必要"], ["todo", "未手配"], ["work", "進行中"], ["billing", "請求待ち"], ["billed", "請求済み"], ["all", "すべて"], ["past", "過去の症例"]];
  const blds = [...new Map([...S.records, ...S.past].map((r) => [r.building_id, r.building])).entries()];
  const lateSet = F.late ? new Set(lateInfo()[F.late].map((r) => r.id)) : null;
  main.innerHTML = `<h2>山郷からの依頼</h2>${lateBanner()}${F.late ? `<div class="lateNote">遅れている依頼だけを表示しています（${F.late === "bill" ? "請求漏れの疑い" : "手配の遅れ"}）<button class="lateBtn" id="lateOff">すべて表示</button></div>` : ""}${kpiHtml(counts)}
    <div class="chips">${chips.map(([k, l]) => `<button class="fchip${F.stage === k ? " on" : ""}" data-s="${k}">${l}<small>${counts[k]}</small></button>`).join("")}</div>
    <div class="searchRow"><input id="q" type="search" placeholder="建物・内容・業者で探す" value="${esc(F.q)}"> <select id="fb"><option value="">すべての建物</option>${blds.map(([id, n]) => `<option value="${esc(id)}"${F.bld === id ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
    <div id="listBody"></div>`;
  main.querySelectorAll(".fchip, .kpi[data-s]").forEach((el) => (el.onclick = () => { F.stage = el.dataset.s; F.late = ""; viewList(main); }));
  wireLate(main); if ($("lateOff")) $("lateOff").onclick = () => { F.late = ""; viewList(main); };
  $("q").oninput = (e) => { F.q = e.target.value; renderListBody(); };
  $("fb").onchange = (e) => { F.bld = e.target.value; renderListBody(); };
  renderListBody();
}
const lateIds = () => new Set(lateInfo()[F.late || "arrange"].map((r) => r.id));
function renderListBody() {
  const box = $("listBody"); if (!box) return;
  const q = F.q.trim().toLowerCase(), seen = seenSet();
  if (F.stage === "past") { // 過去の症例：読むだけ（手配・請求の対象ではない）。新しい順
    const pl = S.past.filter((r) => (!F.bld || r.building_id === F.bld) && (!q || [r.building, r.category, r.what, r.how, r.vendor, r.cause, r.memo, r.hq_note].join(" ").toLowerCase().includes(q))).sort((a, b) => b.t - a.t);
    if (!pl.length) { box.innerHTML = `<div class="empty">該当する過去の症例はありません</div>`; return; }
    box.innerHTML = pl.slice(0, 150).map((r) => `<div class="card past"><div class="cardImg">${bldImg(r.building_id)}</div><div class="cardBody"><div class="top"><span class="ttl">${catImg(r.category_id)}${esc(r.building)}｜${esc(r.category)}</span><span class="chip">過去</span></div><div class="what">${esc(r.what)}</div><div class="meta">${r.t ? fmtDate(r.t) : "日付なし"}${r.vendor ? "　業者：" + esc(r.vendor) : ""}${r.amount !== "" && r.amount != null ? "　金額：" + (isFinite(Number(r.amount)) ? yen(Number(r.amount)) : esc(r.amount)) : ""}${r.cause ? "　原因：" + esc(r.cause) : ""}</div>${r.how || r.memo ? `<div class="meta">${esc([r.how, r.memo].filter(Boolean).join(" ／ "))}</div>` : ""}${r.hq_note ? `<div class="meta hqNote">本社用メモ（山郷には見えません）：${esc(r.hq_note)}</div>` : ""}</div></div>`).join("") + (pl.length > 150 ? `<div class="note" style="padding:8px 2px">新しい順に150件を表示しています（全${pl.length}件）。建物やキーワードで絞ってください</div>` : "");
    return;
  }
  const list = S.records.filter((r) => {
    const st = stage(r);
    if (F.stage === "open" ? st === "billed" : F.stage !== "all" && st !== F.stage) return false;
    if (F.bld && r.building_id !== F.bld) return false;
    if (F.late && !lateIds().has(r.id)) return false;
    if (q && ![r.building, r.category, r.what, r.how, r.sender, item(r).vendor, item(r).memo].join(" ").toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.t - a.t);
  if (!list.length) { box.innerHTML = `<div class="empty"><img class="emptyArt" src="art/hero.webp" alt="" onerror="this.remove()"><br>${S.loaded ? "該当する依頼はありません" : S.syncError ? esc(S.syncError) : "読み込んでいます…"}</div>`; return; }
  box.innerHTML = list.map((r) => {
    const st = stage(r), it = item(r);
    return `<a class="card ${r.urgent ? "urgent " : ""}${st}" href="#/r/${encodeURIComponent(r.id)}">
      <div class="cardImg">${bldImg(r.building_id)}</div>
      <div class="cardBody"><div class="top">${seen.has(r.id) ? "" : `<span class="chip new">新着</span>`}${r.urgent ? `<span class="chip urgent">急ぎ</span>` : ""}<span class="ttl">${catImg(r.category_id)}${esc(r.building)}｜${esc(r.category)}</span><span class="chip ${STAGE_CLS[st]}">${stLabel(r, st)}${st === "work" ? "（" + progLabel(it.progress) + "）" : ""}</span><span class="chip">山郷：${esc(SANGO_STATUS[r.sango_status] || "依頼中")}</span></div>
      <div class="what">${esc(r.what)}</div>
      <div class="meta">${fmtDate(r.t)}　${esc(r.sender)}${it.vendor ? "　手配先：" + esc(it.vendor) : ""}${it.bill_amount ? "　請求 " + yen(it.bill_amount) : ""}</div></div></a>`;
  }).join("");
}


/* ---------- 敷地マップ（メイン画面）：建物を押すと、その建物の依頼へ ---------- */
// 公式サイトの敷地イラストマップ（art/sitemap.svg、viewBox 891.396×527.086）の上に、建物の位置（viewBox の座標）を重ねる。
const MAP_W = 891.396, MAP_H = 527.086;
const BLDS = [ // id、名前、マップ上の位置（無い建物は、下の一覧から選ぶ）
  { id: "haru", name: "春", at: [15, 167, 34, 42] }, { id: "kou", name: "香", at: [26, 106, 34, 44] }, { id: "reception", name: "レセプション", at: [197, 164, 17, 30] },
  { id: "u", name: "宇", at: [295, 312, 48, 68] }, { id: "chi", name: "地", at: [357, 297, 63, 59] }, { id: "wa", name: "和", at: [434, 329, 60, 32] },
  { id: "kumajirushi", name: "熊印雑貨", at: [507, 368, 17, 10] }, { id: "larch", name: "店舗レストラン棟", at: [544, 327, 87, 40] }, { id: "botanical", name: "ボタニカル", at: [680, 329, 44, 45] },
  { id: "haruka", name: "HARUKA（カフェ）", at: [475, 396, 56, 33] }, { id: "larch-back", name: "店舗バックヤード", at: null }, { id: "gaiko", name: "外構・敷地全体", at: null },
];
let mapSvg = null, selB = "", mapZone = "";
// スマホ（縦）では、敷地全体は押しにくいので、3つのエリアに分け、エリアを押すと、そこだけが大きく出る（座標は viewBox）
const ZONES = [
  { id: "n", name: "北エリア", sub: "春・香・レセプション", r: [0, 80, 270, 170] },
  { id: "c", name: "中央エリア", sub: "宇・地・和・熊印・HARUKA", r: [283, 285, 245, 160] },
  { id: "e", name: "東エリア", sub: "店舗棟・ボタニカル", r: [532, 290, 218, 150] },
];
const isNarrow = () => window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
async function loadMapSvg() { if (mapSvg === null) { try { mapSvg = await (await fetch("art/sitemap.svg")).text(); } catch (e) { mapSvg = ""; } } return mapSvg; }
/** 建物ごとの状況：open＝請求済みでない依頼の数、tone＝いちばん急ぐ状態（todo 未手配／bill 請求待ち／work 進行中）、nNew＝新着 */
function bldStat(id) {
  const seen = seenSet(), list = S.records.filter((r) => r.building_id === id), open = list.filter((r) => stage(r) !== "billed");
  const has = (st) => open.some((r) => stage(r) === st);
  return { all: list.length, open: open.length, tone: has("todo") ? "todo" : has("billing") ? "bill" : has("work") ? "work" : "", nNew: list.filter((r) => !seen.has(r.id)).length, urgent: open.some((r) => r.urgent) };
}
async function viewMap(main) {
  if (!S.api) return viewEmptyApi(main);
  const counts = { all: S.records.length, open: 0, todo: 0, work: 0, billing: 0, billed: 0 };
  S.records.forEach((r) => { const st = stage(r); counts[st]++; if (st !== "billed") counts.open++; });
  const svg0 = await loadMapSvg();
  const narrow = isNarrow(), zone = narrow ? ZONES.find((z) => z.id === mapZone) : null, [vx, vy, vw, vh] = zone ? zone.r : [0, 0, MAP_W, MAP_H];
  const svg = svg0 && zone ? svg0.replace(/viewBox="[^"]*"/, `viewBox="${vx} ${vy} ${vw} ${vh}"`) : svg0;
  const pc = (v, base, size) => (((v - base) / size) * 100).toFixed(2);
  const spots = narrow && !zone ? ZONES.map((z) => `<button class="zoneBtn" data-z="${z.id}" style="left:${pc(z.r[0], 0, MAP_W)}%;top:${pc(z.r[1], 0, MAP_H)}%;width:${((z.r[2] / MAP_W) * 100).toFixed(2)}%;height:${((z.r[3] / MAP_H) * 100).toFixed(2)}%"><b>${z.name}</b></button>`).join("")
    : BLDS.filter((b) => b.at && (!zone || (b.at[0] + b.at[2] / 2 >= vx && b.at[0] + b.at[2] / 2 <= vx + vw && b.at[1] + b.at[3] / 2 >= vy && b.at[1] + b.at[3] / 2 <= vy + vh))).map((b) => {
      const st = bldStat(b.id), [x, y, w, h] = b.at;
      return `<button class="spot ${st.tone}${st.nNew ? " new" : ""}${st.urgent ? " urg" : ""}" data-b="${esc(b.id)}" title="${esc(b.name)}${st.open ? "：対応が必要 " + st.open + "件" : ""}" style="left:${pc(x + w / 2, vx, vw)}%;top:${pc(y + h / 2, vy, vh)}%;--w:${((w / vw) * 100).toFixed(2)}%;--h:${((h / vh) * 100).toFixed(2)}%">${st.open ? `<span class="spotN">${st.open}</span>` : ""}<span class="spotName">${esc(b.name)}</span></button>`;
    }).join("");
  const chips = BLDS.map((b) => { const st = bldStat(b.id); return `<button class="bchip ${st.tone}" data-b="${esc(b.id)}">${esc(b.name)}${st.open ? `<b>${st.open}</b>` : ""}${st.nNew ? `<i>新着</i>` : ""}</button>`; }).join("");
  const todo = S.records.filter((r) => stage(r) === "todo").sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.t - a.t).slice(0, 5);
  main.innerHTML = `<h2>山郷の敷地</h2>${lateBanner()}${kpiHtml(counts)}
    <div class="mapCard">${zone ? `<button class="zoneBack" id="zoneBack">← 敷地全体（${zone.name}を表示中）</button>` : ""}<div class="mapWrap${zone ? " zoomed" : ""}" style="aspect-ratio:${vw} / ${vh}">${narrow ? "" : `<div id="bPrev"></div>`}${svg || `<div class="empty">マップを読み込めませんでした。下の一覧から選んでください。</div>`}${svg ? spots : ""}</div>
      ${narrow ? `<div id="bPrev" class="bPrevBelow"></div>` : ""}<div class="mapLegend"><span><i class="lg todo"></i>未手配あり</span><span><i class="lg bill"></i>請求待ちあり</span><span><i class="lg work"></i>進行中</span><span class="note">${narrow && !zone ? "エリアを押すと、拡大します" : "建物を押すと、画像と状況が出ます"}</span></div></div>
    <div class="bchips">${chips}</div>
    <h3 class="subH">いま手配が必要な依頼</h3>${todo.map((r) => `<a class="card urgentLine" href="#/r/${encodeURIComponent(r.id)}"><div class="cardImg">${bldImg(r.building_id)}</div><div class="cardBody"><div class="top">${r.urgent ? `<span class="chip urgent">急ぎ</span>` : ""}<span class="ttl">${catImg(r.category_id)}${esc(r.building)}｜${esc(r.category)}</span></div><div class="what">${esc(r.what)}</div><div class="meta">${fmtDate(r.t)}　${esc(r.sender)}</div></div></a>`).join("") || `<div class="note" style="padding:6px 2px">未手配の依頼は、ありません</div>`}`;
  const prev = main.querySelector("#bPrev");
  const showPrev = (id) => { // 1回目の押し：建物の画像と状況を見せる。「この建物を開く」で、依頼の画面へ
    const b = BLDS.find((x) => x.id === id) || { id, name: id }, st = bldStat(id);
    main.querySelectorAll(".spot, .bchip").forEach((e) => e.classList.toggle("sel", e.dataset.b === id));
    prev.innerHTML = `<div class="bPrev enter"><div class="bPrevImg">${bldImg(id)}</div><div class="bPrevBody"><h3>${esc(b.name)}</h3><div class="note">${st.open ? `対応が必要な依頼 ${st.open}件` : "対応が必要な依頼はありません"}${st.nNew ? `　<span class="chip new">新着 ${st.nNew}</span>` : ""}${st.urgent ? `　<span class="chip urgent">急ぎ</span>` : ""}</div><div class="note">これまでの依頼 ${st.all}件</div><button class="btn bPrevGo" data-go="${esc(id)}">この建物を開く →</button></div></div>`;
    prev.querySelector(".bPrevGo").onclick = () => { location.hash = "#/b/" + encodeURIComponent(id); };
    selB = id;
  };
  main.querySelectorAll(".spot, .bchip").forEach((el) => (el.onclick = () => showPrev(el.dataset.b)));
  main.querySelectorAll(".zoneBtn").forEach((el) => (el.onclick = () => { mapZone = el.dataset.z; selB = ""; viewMap(main); }));
  if ($("zoneBack")) $("zoneBack").onclick = () => { mapZone = ""; selB = ""; viewMap(main); };
  if (selB && prev) showPrev(selB); // 自動更新で描き直しても、選択を保つ
  main.querySelectorAll(".kpi[data-s]").forEach((el) => (el.onclick = () => { F.stage = el.dataset.s; F.bld = ""; F.late = ""; location.hash = "#/list"; }));
  wireLate(main);
}
/** 建物の画面：その建物の依頼だけ（マップに戻れる） */
function viewBuilding(main, id) {
  const b = BLDS.find((x) => x.id === id) || { id, name: id }, st = bldStat(id);
  F.bld = id;
  const counts = { all: 0, open: 0, todo: 0, work: 0, billing: 0, billed: 0, past: S.past.filter((r) => r.building_id === id).length };
  S.records.filter((r) => r.building_id === id).forEach((r) => { const s2 = stage(r); counts[s2]++; counts.all++; if (s2 !== "billed") counts.open++; });
  const chips = [["open", "対応が必要"], ["todo", "未手配"], ["work", "進行中"], ["billing", "請求待ち"], ["billed", "請求済み"], ["all", "すべて"], ["past", "過去の症例"]];
  main.innerHTML = `<p><a href="#/map" class="note">← 敷地マップ</a></p>
    <div class="hero enter">${bldImg(id)}<div class="heroText"><div class="heroSub">${st.open ? `対応が必要な依頼 ${st.open}件` : "対応が必要な依頼はありません"}${st.nNew ? `　<span class="chip new">新着 ${st.nNew}</span>` : ""}</div><h2>${esc(b.name)}</h2></div></div>
    <div class="chips">${chips.map(([k, l]) => `<button class="fchip${F.stage === k ? " on" : ""}" data-s="${k}">${l}<small>${counts[k]}</small></button>`).join("")}</div>
    <div id="listBody"></div>`;
  main.querySelectorAll(".fchip").forEach((el) => (el.onclick = () => { F.stage = el.dataset.s; viewBuilding(main, id); }));
  renderListBody();
}

/* ---------- 詳細 ---------- */
const photoCache = new Map();
function photoUrl(name) {
  if (!photoCache.has(name)) photoCache.set(name, apiCall({ action: "getPhoto", name }, 60000).then((x) => { const bin = atob(x.data); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u8], { type: x.mime || "image/jpeg" })); }).catch(() => { photoCache.delete(name); return null; }));
  return photoCache.get(name);
}
const STEPS = ["依頼を受けた", "手配済み", "施工待ち", "施工完了", "請求済み"];
const STEP_ICONS = ["order", "arrange", "schedule", "done", "invoice"];
const icn = (n, c) => `<img class="${c || "ic"}" src="art/ic-${n}.webp" alt="" onerror="this.remove()">`;
const stepIdx = (r) => { const it = item(r); return it.billed ? 4 : it.progress === "done" ? 3 : it.progress === "scheduled" ? 2 : it.progress === "arranged" ? 1 : 0; };
let viewTok = 0, saveBusy = false;
function viewDetail(main, id) {
  const r = S.records.find((x) => x.id === id);
  if (!r) { main.innerHTML = `<div class="empty">${S.loaded ? "その依頼は見つかりません。" : "読み込んでいます…"}<br><br><a class="btn" href="#/list">一覧へ戻る</a></div>`; return; }
  markSeen([r.id]); updateTitle();
  const it = item(r), tok = ++viewTok, si = stepIdx(r);
  const vendors = [...new Set(Object.values(S.items).map((x) => x.vendor).filter(Boolean))];
  const en = entryOf(r), cands = en && !en.none ? (en.companies || []) : [];
  main.innerHTML = `<p><a href="${F.bld ? "#/b/" + encodeURIComponent(F.bld) : "#/list"}" class="note">← ${F.bld ? "建物の画面" : "依頼の一覧"}</a></p>
    <div class="hero">${bldImg(r.building_id)}<div class="heroText"><div class="heroSub">${catImg(r.category_id)}${esc(r.category)}</div><h2>${r.urgent ? `<span class="chip urgent">急ぎ</span> ` : ""}${esc(r.building)}</h2></div></div>
    <ol class="steps">${STEPS.map((l, i) => `<li class="${i < si ? "done" : i === si ? "now" : ""}">${icn(STEP_ICONS[i], "stepIc")}<span>${i + 1}</span>${l}</li>`).join("")}</ol>
    <div class="panel"><h3>依頼の内容　<span class="chip">山郷：${esc(SANGO_STATUS[r.sango_status] || "依頼中")}</span></h3>
      <dl class="kv"><dt>日付</dt><dd>${fmtDate(r.t)}</dd><dt>送った人</dt><dd>${esc(r.sender)}</dd><dt>何が起きたか</dt><dd>${esc(r.what)}</dd><dt>対応・希望</dt><dd>${esc(r.how || "—")}</dd><dt>山郷が見た業者</dt><dd>${esc(r.vendor || "—")}</dd></dl>
      <div class="photos" id="photos"></div></div>
    <div class="panel replyPanel"><h3>山郷への返事（山郷に表示されます）</h3>
      <div class="note" style="margin-bottom:8px">リーダー・管理者の画面に、「手配済み」の段階と、ここに書いた内容が出ます。<b>手配先の名前・粗利を乗せた請求額は、出ません。</b></div>
      <div class="form">
        <div><label>訪問予定日（業者が伺う日）</label><input type="date" id="fVisit" value="${esc(it.visit_at || "")}"></div>
        <div><label>業者の金額の目安（円。山郷に表示）</label><input type="text" id="fEstm" maxlength="40" placeholder="例）100000（約10万円なら、そのまま）" value="${esc(it.estimate == null ? "" : it.estimate)}"></div>
        <div class="wide"><label>山郷へのひとこと</label><input type="text" id="fReply" maxlength="120" placeholder="例）10/14 午前に業者が伺います" value="${esc(it.reply || "")}"></div>
      </div></div>
    <div class="panel"><h3>手配と請求（山郷側には見えません）</h3>
      ${en ? `<div class="cands"><div class="note">この建物・分類の担当業者（業者データより）${en.none ? "：設置なし" : ""}</div>${cands.map((c) => `<span class="cand"><button type="button" class="candBtn" data-v="${esc(c.name)}">${esc(c.name)}</button>${c.phone ? `<a class="tel" href="tel:${esc(String(c.phone).replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a>` : ""}</span>`).join("") || `<span class="note">登録なし</span>`}${en.note ? `<div class="note">備考：${esc(en.note.slice(0, 120))}</div>` : ""}</div>` : ""}
      <div class="form">
        <div><label>手配先の業者</label><input type="text" id="fVendor" list="vendorList" maxlength="60" value="${esc(it.vendor || "")}"><datalist id="vendorList">${vendors.map((v) => `<option value="${esc(v)}">`).join("")}</datalist></div>
        <div><label>進捗</label><select id="fProg">${PROGRESS.map(([k, l]) => `<option value="${k}"${(it.progress || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><label>手配した日</label><input type="date" id="fArr" value="${esc(it.arranged_at || "")}"></div>
        <div><label>見積番号</label><input type="text" id="fEst" maxlength="40" value="${esc(it.est_no || "")}"></div>
        <div><label>業者への支払い（円）</label><input type="number" id="fCost" min="0" step="1" value="${esc(it.cost == null ? "" : it.cost)}"></div>
        <div><label>請求区分</label><select id="fKind">${BILL_KINDS.map(([k, l]) => `<option value="${k}"${(it.bill_kind || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><label>山郷への請求額（円）</label><input type="number" id="fBill" min="0" step="1" value="${esc(it.bill_amount == null ? "" : it.bill_amount)}"></div>
        <div><label>請求月</label><input type="month" id="fMonth" value="${esc(it.bill_month || "")}"></div>
        <div class="checkRow"><input type="checkbox" id="fBilled"${it.billed ? " checked" : ""}><label for="fBilled" style="margin:0;color:inherit">請求済み</label></div>
        <div class="wide"><label>メモ</label><textarea id="fMemo" maxlength="1000">${esc(it.memo || "")}</textarea></div>
      </div>
      <div class="btnRow"><button class="btn primary" id="fSave">保存する</button><span class="sum" id="gross"></span><span class="note">${it.at ? "最終更新 " + new Date(Number(it.at)).toLocaleString("ja-JP") + (it.by ? "　" + esc(it.by) : "") : ""}</span></div></div>`;
  const upGross = () => { const g = gross({ cost: $("fCost").value, bill_amount: $("fBill").value }); $("gross").textContent = g == null ? "" : "粗利 " + g.toLocaleString("ja-JP") + "円"; };
  upGross(); $("fCost").oninput = upGross; $("fBill").oninput = upGross;
  main.querySelectorAll(".candBtn").forEach((b) => (b.onclick = () => { $("fVendor").value = b.dataset.v; if (!$("fProg").value) $("fProg").value = "arranged"; if (!$("fArr").value) $("fArr").value = new Date().toISOString().slice(0, 10); }));
  $("fSave").onclick = async () => {
    if (saveBusy) return;
    saveBusy = true; $("fSave").disabled = true;
    try {
      const patch = { vendor: $("fVendor").value.trim(), progress: $("fProg").value, arranged_at: $("fArr").value, est_no: $("fEst").value.trim(), cost: $("fCost").value, bill_amount: $("fBill").value, bill_month: $("fMonth").value, bill_kind: $("fKind").value, visit_at: $("fVisit").value, reply: $("fReply").value.trim(), estimate: $("fEstm").value.trim(), billed: $("fBilled").checked, memo: $("fMemo").value.trim() };
      if (patch.billed && !patch.bill_month) { toast("請求済みにするには、請求月を入れてください"); return; }
      const j = await apiCall({ action: "honshaSave", id: r.id, patch, by: getLS("name", "木村") }, 40000);
      if (!j.item) throw new Error("窓口の返事に保存結果がありません");
      S.items = { ...S.items, [r.id]: j.item };
      toast("保存しました");
      if (tok === viewTok && route().name === "r" && route().id === id) viewDetail(main, id);
    } catch (e) { alert("保存できませんでした。電波や窓口の状態を確認して、もう一度試してください。\n（" + String((e && e.message) || e) + "）"); }
    finally { saveBusy = false; const b = $("fSave"); if (b) b.disabled = false; }
  };
  const box = $("photos");
  (async () => { for (const name of r.photos.map((p) => p && p.file).filter(Boolean)) { const u = await photoUrl(name); if (tok !== viewTok || !box.isConnected) return; if (!u) continue; const im = document.createElement("img"); im.src = u; im.alt = ""; im.onclick = () => { const lb = $("lightbox"); lb.innerHTML = `<img src="${u}" alt="">`; lb.hidden = false; lb.onclick = () => { lb.hidden = true; lb.innerHTML = ""; }; }; box.appendChild(im); } })();
}

/* ---------- 請求 ---------- */
const qs = (v) => { let s = String(v == null ? "" : v); if (/^[=+@\t\r]/.test(s) || (/^-/.test(s) && isNaN(Number(s)))) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
function viewBill(main) {
  if (!S.api) return viewEmptyApi(main);
  const billed = S.records.filter((r) => item(r).billed || item(r).bill_amount), waiting = S.records.filter((r) => stage(r) === "billing");
  const months = {};
  billed.forEach((r) => { const it = item(r), m = it.bill_month || "（月が未入力）"; (months[m] = months[m] || []).push(r); });
  const keys = Object.keys(months).sort().reverse();
  const sum = (list, f) => list.reduce((a, r) => a + (Number(f(item(r))) || 0), 0);
  const maxBill = Math.max(1, ...keys.map((m) => sum(months[m], (x) => x.bill_amount)));
  main.innerHTML = `<h2>請求</h2>
    <div class="panel"><h3>請求待ち（施工完了で、まだ請求していない）<span class="chip bill">${waiting.length}件</span></h3>
      ${waiting.length ? `<table class="tbl"><tr><th>日付</th><th>建物・分類</th><th>内容</th><th>手配先</th><th class="num">請求額</th></tr>${waiting.sort((a, b) => a.t - b.t).map((r) => `<tr class="link" data-id="${esc(r.id)}"><td>${fmtDate(r.t)}</td><td>${esc(r.building)}｜${esc(r.category)}</td><td>${esc(r.what.slice(0, 30))}</td><td>${esc(item(r).vendor || "")}</td><td class="num">${yen(item(r).bill_amount)}</td></tr>`).join("")}</table>` : `<div class="note">ありません</div>`}</div>
    <div class="panel"><h3>月ごとの請求</h3>
      ${keys.length ? `<div class="bars">${keys.slice(0, 8).map((m) => { const l = months[m], b = sum(l, (x) => x.bill_amount), c = sum(l, (x) => x.cost); return `<div class="barRow"><span class="barM">${esc(m)}</span><div class="barT"><div class="barB" style="width:${Math.round((b / maxBill) * 100)}%"></div></div><span class="barV">${yen(b)}<small>粗利 ${yen(b - c)}</small></span></div>`; }).join("")}</div>
      <table class="tbl"><tr><th>請求月</th><th class="num">件数</th><th class="num">請求額</th><th class="num">業者への支払い</th><th class="num">粗利</th></tr>${keys.map((m) => { const l = months[m], b = sum(l, (x) => x.bill_amount), c = sum(l, (x) => x.cost); return `<tr><td>${esc(m)}</td><td class="num">${l.length}</td><td class="num">${yen(b)}</td><td class="num">${yen(c)}</td><td class="num">${yen(b - c)}</td></tr>`; }).join("")}</table>
      <div class="btnRow"><button class="btn" id="csv">請求の一覧をCSVに出す</button><span class="note">Excelで開けます</span></div>` : `<div class="empty" style="margin:0"><img class="emptyArt" src="art/hero.webp" alt="" onerror="this.remove()"><br>請求額や請求月を入れた依頼が、ここに出ます</div>`}</div>`;
  main.querySelectorAll("tr.link").forEach((el) => (el.onclick = () => (location.hash = "#/r/" + encodeURIComponent(el.dataset.id))));
  const c = $("csv"); if (c) c.onclick = () => {
    const head = ["請求月", "請求済み", "日付", "建物", "分類", "内容", "手配先", "見積番号", "手配日", "請求額", "業者への支払い", "粗利", "メモ"];
    const rows = billed.sort((a, b) => String(item(b).bill_month || "").localeCompare(String(item(a).bill_month || "")) || b.t - a.t).map((r) => { const it = item(r), g = gross(it); return [it.bill_month || "", it.billed ? "済" : "未", fmtDate(r.t), r.building, r.category, r.what, it.vendor, it.est_no, it.arranged_at, it.bill_amount, it.cost, g == null ? "" : g, it.memo].map(qs).join(","); });
    const blob = new Blob(["﻿" + [head.map(qs).join(","), ...rows].join("\r\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "山郷_請求一覧_" + new Date().toISOString().slice(0, 10) + ".csv"; a.click();
  };
}

/* ---------- 使い方 ---------- */
function viewHelp(main) {
  const sec = (title, items) => `<div class="panel"><h3>${title}</h3><ol class="helpList">${items.map((i) => `<li>${i}</li>`).join("")}</ol></div>`;
  main.innerHTML = `<h2>使い方</h2>
    ${sec("この画面でできること", ["山郷のリーダーが「対応を依頼する」で送った依頼を、一覧で受けて、<b>業者への手配の進み具合</b>と、<b>山郷への請求</b>を管理します。", "山郷側の管理者・リーダーには、ここに入れた金額・粗利・手配先は、見えません。"])}
    ${sec("依頼を受けて、手配する", ["依頼が届くと、メールが来ます。この画面を開くと、「<b>新着</b>」の印が付いた依頼が、一覧に出ます（急ぎは先頭）。", "依頼を開くと、写真・内容と、この建物・分類の<b>担当業者（電話番号つき）</b>が出ます。業者の名前を押すと、「手配先」に入ります。", "<b>手配先・進捗・手配した日・見積番号</b>を入れて「保存」。進捗は、「未手配 → 手配済み → 施工待ち → 施工完了」と進めます。上の帯で、今どこかが分かります。", "上の4つの数字（未手配・進行中・請求待ち・今月の請求）を押すと、その状態の依頼だけが出ます。"])}
    ${sec("請求を管理する", ["依頼の詳細で、<b>業者への支払い</b>と<b>山郷への請求額</b>を入れると、<b>粗利</b>が自動で出ます。", "請求書を出したら、<b>請求月</b>を入れて「請求済み」にチェックして保存します（請求月が無いと、請求済みにできません）。請求書そのものは、見積アプリのPDFで、これまでどおり社内で処理します。", "「請求」の画面に、<b>請求待ち</b>（施工完了で、まだ請求していないもの）と、<b>月ごとの請求額・粗利</b>が出ます。「CSVに出す」で、Excelで開けます。"])}
    ${sec("困った時", ["「窓口につながりません」は、ネットワークを確認して、右上の「↻」を押します。", "新しい機能が出ない時は、設定の「更新」にある2つのボタンを押します。", "山郷側の管理者が使う管理者ビューアとは、別の画面です（合言葉の役割が違うため）。"])}`;
}

/* ---------- 設定 ---------- */
function viewEmptyApi(main) { main.innerHTML = `<div class="empty"><img class="emptyArt" src="art/hero.webp" alt="" onerror="this.remove()"><h3>まだ窓口につながっていません</h3><p>設定で、あなたの合言葉を入れてください。</p><a class="btn primary" href="#/settings">設定を開く</a></div>`; }
async function updateApp() {
  try { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) { /* 無ければ次へ */ }
  try { for (const k of await caches.keys()) await caches.delete(k); } catch (e) { /* 無ければ次へ */ }
  try { await fetch(location.pathname, { cache: "reload" }); } catch (e) { /* 電波がなければ、そのまま読み直す */ }
  location.reload();
}
function viewSettings(main) {
  main.innerHTML = `<h2>設定</h2>
    <div class="panel"><h3>更新</h3><p class="note">アプリの版：${APP_VERSION}　／　新しい機能や直しが出た時に押します（設定や合言葉は、消えません）。</p><p><button class="btn primary" id="upData">データを最新にする</button> <button class="btn" id="upApp">アプリ本体を最新にする（読み直し）</button></p><p class="note" id="upMsg"></p></div>
    <div class="panel"><h3>窓口につなぐ</h3>
      <p class="note">${S.api ? (S.syncError ? `<span class="warnText">つながりません：${esc(S.syncError)}</span>` : S.syncedAt ? `<span class="okText">つながっています</span>　依頼 ${S.records.length}件` : "読み込み中…") : "まだつながっていません"}</p>
      <div class="form"><div class="wide"><label>あなたの合言葉</label><input type="password" id="apiToken" autocomplete="off" value="${esc(S.api ? S.api.token : "")}"></div></div>
      <div class="btnRow"><button class="btn primary" id="apiSave">つないで読み込む</button>${S.api ? `<button class="btn" id="apiOff">つなぐのをやめる</button>` : ""}</div>
      <p class="note">この画面は、本社（設計者）の合言葉の人だけが使えます。山郷側の管理者・リーダーの合言葉では、金額・粗利は見えません。</p></div>
    <div class="panel"><h3>更新者の名前</h3><input type="text" id="sName" maxlength="20" value="${esc(getLS("name", "木村"))}"><p class="note">保存の記録に残ります。</p></div>
    <div class="panel"><h3>このアプリについて</h3><p class="note">バージョン ${APP_VERSION}　／　開いている間は45秒おきに自動で更新します。建物・分類の絵は、山郷サポートのものを使っています。</p></div>`;
  $("upData").onclick = async () => { $("upData").disabled = true; $("upMsg").textContent = "最新にしています…"; try { if (S.api) { const ok = await loadAll(true); await loadMaster(); $("upMsg").textContent = ok ? "最新にしました" : "読み込めませんでした"; } else $("upMsg").textContent = "窓口につないでいません"; } finally { $("upData").disabled = false; } };
  $("upApp").onclick = () => { $("upApp").disabled = true; $("upMsg").textContent = "読み直しています…"; updateApp(); };
  $("apiSave").onclick = async () => {
    const token = $("apiToken").value.trim(), url = HONSHA_API_URL;
    if (token.length < 32) return alert("合言葉が短すぎます。コピーし損ねていないか、確認してください");
    const prev = S.api; S.api = { url, token };
    try { const j = await apiCall({ action: "ping" }, 30000); if (j.legacy && j.role !== "honsha") throw new Error("共通の合言葉ではありません"); if (!j.caps || j.caps.indexOf("honsha") < 0) throw new Error("この合言葉は、本社画面では使えません（役割：" + (j.user_role || "") + "）"); } catch (e) { S.api = prev; return alert("つながりませんでした：" + String((e && e.message) || e)); }
    if (!prev || prev.token !== token) { S.records = []; S.items = {}; S.loaded = false; S.syncedAt = 0; S.master = null; }
    setLS("api", JSON.stringify({ url, token })); loading = false;
    await loadAll(true); initSeen(); loadMaster(); toast("窓口につながりました"); render();
  };
  const off = $("apiOff"); if (off) off.onclick = () => { if (!confirm("窓口につなぐのをやめますか？（この画面の情報は消えます）")) return; setLS("api", ""); S.api = null; S.records = []; S.items = {}; S.loaded = false; S.master = null; render(); renderSync(); };
  $("sName").onchange = (e) => setLS("name", e.target.value.trim());
}

/* ---------- 画面の切り替え ---------- */
let lastName = "";
function render() {
  const r = route(), main = $("main");
  if (r.name === "map" || (r.name === "list" && lastName !== "r")) F.bld = ""; // 建物の絞り込みは、建物の画面から入った時だけ使う
  lastName = r.name;
  document.querySelectorAll(".sideNav a").forEach((a) => a.classList.toggle("on", a.dataset.nav === (r.name === "r" ? "list" : r.name === "b" ? "map" : r.name)));
  window.scrollTo(0, 0);
  if (r.name === "r") viewDetail(main, r.id);
  else if (r.name === "map") viewMap(main);
  else if (r.name === "b") viewBuilding(main, r.id);
  else if (r.name === "bill") viewBill(main);
  else if (r.name === "help") viewHelp(main);
  else if (r.name === "settings") viewSettings(main);
  else viewList(main);
  renderSync(); updateTitle();
}
function refreshView() { // 自動更新のあと。入力中の画面（詳細・設定）は触らない
  const n = route().name;
  if (n === "list" && $("listBody")) { renderListBody(); const m = $("main"); if (!m.contains(document.activeElement) || !["INPUT", "SELECT"].includes(document.activeElement.tagName)) viewListChips(); }
  else if (n === "bill") viewBill($("main"));
  else if (n === "map") viewMap($("main"));
  else if (n === "b") { const m = $("main"); if (!m.contains(document.activeElement)) viewBuilding(m, route().id); }
  updateTitle();
}
function viewListChips() { // 件数の表示と、上の数字だけ更新する（検索欄の入力は消さない）
  const counts = { all: S.records.length, open: 0, todo: 0, work: 0, billing: 0, billed: 0 };
  S.records.forEach((r) => { const st = stage(r); counts[st]++; if (st !== "billed") counts.open++; });
  document.querySelectorAll(".fchip").forEach((el) => { const s = el.querySelector("small"); if (s) s.textContent = counts[el.dataset.s]; });
  const k = document.querySelector(".kpis"); if (k) k.outerHTML = kpiHtml(counts), document.querySelectorAll(".kpi[data-s]").forEach((el) => (el.onclick = () => { F.stage = el.dataset.s; viewList($("main")); }));
}
async function autoRefresh() { if (S.api && !document.hidden && (await loadAll(false))) refreshView(); else renderSync(); }

$("reloadBtn").onclick = async () => { if (S.api) { await loadAll(true); const n = route().name; if (n === "list" || n === "bill" || n === "map" || n === "b") render(); else if (n === "r" && !$("fSave")) render(); } };
window.addEventListener("hashchange", render);
render();
if (S.api) { loadAll(false).then(() => { initSeen(); loadMaster().then(() => { if (route().name === "r") render(); }); const n = route().name; if (n === "list" || n === "bill" || n === "map" || n === "b" || (n === "r" && !S.loaded) || (n === "r" && !document.querySelector("#photos"))) render(); else refreshView(); }); }
setInterval(autoRefresh, 45000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) autoRefresh(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
