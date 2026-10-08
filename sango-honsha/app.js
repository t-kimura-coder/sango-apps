"use strict";
/* 山郷サポート 本社：山郷から来た「対応の依頼」の進捗（業者への手配）と、山郷への請求を管理する。
   窓口（GAS）の honshaList / honshaSave だけを使う。合言葉は「本社用」（山郷側の管理者には渡さない）。 */
const APP_VERSION = 1;
const P = "sango-honsha-";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const getLS = (k, d) => { try { const v = localStorage.getItem(P + k); return v == null ? (d || "") : v; } catch (e) { return d || ""; } };
const setLS = (k, v) => { try { localStorage.setItem(P + k, v); } catch (e) { /* 使えない時は無視 */ } };

const PROGRESS = [["", "未手配"], ["arranged", "手配済み"], ["scheduled", "施工待ち"], ["done", "施工完了"]];
const progLabel = (v) => (PROGRESS.find((p) => p[0] === v) || PROGRESS[0])[1];
const SANGO_STATUS = { "": "依頼中", doing: "対応中", done: "完了" };

const S = { api: loadApi(), records: [], items: {}, syncedAt: 0, syncError: "", loaded: false };
function loadApi() { try { const j = JSON.parse(getLS("api", "")); return j && j.url && j.token ? j : null; } catch (e) { return null; } }

/* ---------- 窓口 ---------- */
async function apiCall(body, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 60000);
  try {
    const res = await fetch(S.api.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ token: S.api.token, ...body }), signal: ctl.signal, redirect: "follow" });
    let j; try { j = await res.json(); } catch (e) { throw new Error("窓口の応答が不正です（" + res.status + "）。URL・公開の設定・電波を確認してください"); }
    if (!j.ok) throw new Error(j.error === "unauthorized" ? "合言葉が違います（本社用の合言葉を入れてください）" : (j.error || "窓口からの返事が不正です"));
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
  if (it.progress === "done") return "billing";
  if (it.progress === "arranged" || it.progress === "scheduled") return "work";
  return "todo";
}
const STAGE_LABEL = { todo: "未手配", work: "進行中", billing: "請求待ち", billed: "請求済み" };
const STAGE_CLS = { todo: "todo", work: "work", billing: "bill", billed: "ok" };
const yen = (v) => (v === "" || v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("ja-JP") + "円");
const fmtDate = (t) => { if (!t) return ""; const d = new Date(t); return d.getFullYear() + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + String(d.getDate()).padStart(2, "0"); };
const gross = (it) => (it.bill_amount !== "" && it.bill_amount != null && !isNaN(Number(it.bill_amount)) && it.cost !== "" && it.cost != null && !isNaN(Number(it.cost)) ? Number(it.bill_amount) - Number(it.cost) : null);
const route = () => { const h = location.hash.replace(/^#\/?/, ""); const [name, id] = h.split("/"); return { name: name || "list", id: id ? decodeURIComponent(id) : "" }; };

let toastTimer = null;
function toast(msg) { const el = $("toast"); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2800); }

/* ---------- 一覧 ---------- */
const F = { stage: "open", q: "" };
function viewList(main) {
  if (!S.api) return viewEmptyApi(main);
  const counts = { all: S.records.length, open: 0, todo: 0, work: 0, billing: 0, billed: 0 };
  S.records.forEach((r) => { const st = stage(r); counts[st]++; if (st !== "billed") counts.open++; });
  const chips = [["open", "対応が必要"], ["todo", "未手配"], ["work", "進行中"], ["billing", "請求待ち"], ["billed", "請求済み"], ["all", "すべて"]];
  main.innerHTML = `<h2>山郷からの依頼</h2>
    <div class="chips">${chips.map(([k, l]) => `<button class="fchip${F.stage === k ? " on" : ""}" data-s="${k}">${l}<small>${counts[k]}</small></button>`).join("")}</div>
    <div class="searchRow"><input id="q" type="search" placeholder="建物・内容・業者で探す" value="${esc(F.q)}"></div>
    <div id="listBody"></div>`;
  main.querySelectorAll(".fchip").forEach((el) => (el.onclick = () => { F.stage = el.dataset.s; viewList(main); }));
  $("q").oninput = (e) => { F.q = e.target.value; renderListBody(); };
  renderListBody();
}
function renderListBody() {
  const box = $("listBody"); if (!box) return;
  const q = F.q.trim().toLowerCase();
  const list = S.records.filter((r) => {
    const st = stage(r);
    if (F.stage === "open" ? st === "billed" : F.stage !== "all" && st !== F.stage) return false;
    if (q && ![r.building, r.category, r.what, r.how, r.sender, item(r).vendor, item(r).memo].join(" ").toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.t - a.t);
  if (!list.length) { box.innerHTML = `<div class="empty">${S.loaded ? "該当する依頼はありません" : S.syncError ? esc(S.syncError) : "読み込んでいます…"}</div>`; return; }
  box.innerHTML = list.map((r) => {
    const st = stage(r), it = item(r);
    return `<a class="card ${r.urgent ? "urgent " : ""}${st}" href="#/r/${encodeURIComponent(r.id)}">
      <div class="top">${r.urgent ? `<span class="chip urgent">急ぎ</span>` : ""}<span class="ttl">${esc(r.building)}｜${esc(r.category)}</span><span class="chip ${STAGE_CLS[st]}">${STAGE_LABEL[st]}${st === "work" ? "（" + progLabel(it.progress) + "）" : ""}</span><span class="chip">山郷：${esc(SANGO_STATUS[r.sango_status] || "依頼中")}</span></div>
      <div class="what">${esc(r.what)}</div>
      <div class="meta">${fmtDate(r.t)}　${esc(r.sender)}${it.vendor ? "　手配先：" + esc(it.vendor) : ""}${it.bill_amount ? "　請求 " + yen(it.bill_amount) : ""}</div></a>`;
  }).join("");
}

/* ---------- 詳細 ---------- */
const photoCache = new Map();
function photoUrl(name) {
  if (!photoCache.has(name)) photoCache.set(name, apiCall({ action: "getPhoto", name }, 60000).then((x) => { const bin = atob(x.data); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u8], { type: x.mime || "image/jpeg" })); }).catch(() => { photoCache.delete(name); return null; }));
  return photoCache.get(name);
}
let viewTok = 0, saveBusy = false;
function viewDetail(main, id) {
  const r = S.records.find((x) => x.id === id);
  if (!r) { main.innerHTML = `<div class="empty">${S.loaded ? "その依頼は見つかりません。" : "読み込んでいます…"}<br><br><a class="btn" href="#/list">一覧へ戻る</a></div>`; return; }
  const it = item(r), tok = ++viewTok;
  const vendors = [...new Set(Object.values(S.items).map((x) => x.vendor).filter(Boolean))];
  main.innerHTML = `<p><a href="#/list" class="note">← 依頼の一覧</a></p>
    <div class="panel"><h3>${r.urgent ? `<span class="chip urgent">急ぎ</span> ` : ""}${esc(r.building)}｜${esc(r.category)}　<span class="chip">山郷：${esc(SANGO_STATUS[r.sango_status] || "依頼中")}</span></h3>
      <dl class="kv"><dt>日付</dt><dd>${fmtDate(r.t)}</dd><dt>送った人</dt><dd>${esc(r.sender)}</dd><dt>何が起きたか</dt><dd>${esc(r.what)}</dd><dt>対応・希望</dt><dd>${esc(r.how || "—")}</dd><dt>山郷が見た業者</dt><dd>${esc(r.vendor || "—")}</dd></dl>
      <div class="photos" id="photos"></div></div>
    <div class="panel"><h3>手配と請求（山郷側には見えません）</h3>
      <div class="form">
        <div><label>手配先の業者</label><input type="text" id="fVendor" list="vendorList" maxlength="60" value="${esc(it.vendor || "")}"><datalist id="vendorList">${vendors.map((v) => `<option value="${esc(v)}">`).join("")}</datalist></div>
        <div><label>進捗</label><select id="fProg">${PROGRESS.map(([k, l]) => `<option value="${k}"${(it.progress || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><label>手配した日</label><input type="date" id="fArr" value="${esc(it.arranged_at || "")}"></div>
        <div><label>見積番号</label><input type="text" id="fEst" maxlength="40" value="${esc(it.est_no || "")}"></div>
        <div><label>業者への支払い（円）</label><input type="number" id="fCost" min="0" step="1" value="${esc(it.cost == null ? "" : it.cost)}"></div>
        <div><label>山郷への請求額（円）</label><input type="number" id="fBill" min="0" step="1" value="${esc(it.bill_amount == null ? "" : it.bill_amount)}"></div>
        <div><label>請求月</label><input type="month" id="fMonth" value="${esc(it.bill_month || "")}"></div>
        <div class="checkRow"><input type="checkbox" id="fBilled"${it.billed ? " checked" : ""}><label for="fBilled" style="margin:0;color:inherit">請求済み</label></div>
        <div class="wide"><label>メモ</label><textarea id="fMemo" maxlength="1000">${esc(it.memo || "")}</textarea></div>
      </div>
      <div class="btnRow"><button class="btn primary" id="fSave">保存する</button><span class="sum" id="gross"></span><span class="note">${it.at ? "最終更新 " + new Date(Number(it.at)).toLocaleString("ja-JP") + (it.by ? "　" + esc(it.by) : "") : ""}</span></div></div>`;
  const upGross = () => { const g = gross({ cost: $("fCost").value, bill_amount: $("fBill").value }); $("gross").textContent = g == null ? "" : "粗利 " + g.toLocaleString("ja-JP") + "円"; };
  upGross(); $("fCost").oninput = upGross; $("fBill").oninput = upGross;
  $("fSave").onclick = async () => {
    if (saveBusy) return;
    saveBusy = true; $("fSave").disabled = true;
    try {
      const patch = { vendor: $("fVendor").value.trim(), progress: $("fProg").value, arranged_at: $("fArr").value, est_no: $("fEst").value.trim(), cost: $("fCost").value, bill_amount: $("fBill").value, bill_month: $("fMonth").value, billed: $("fBilled").checked, memo: $("fMemo").value.trim() };
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
  main.innerHTML = `<h2>請求</h2>
    <div class="panel"><h3>請求待ち（施工完了で、まだ請求していない）<span class="chip bill">${waiting.length}件</span></h3>
      ${waiting.length ? `<table class="tbl"><tr><th>日付</th><th>建物・分類</th><th>内容</th><th>手配先</th><th class="num">請求額</th></tr>${waiting.sort((a, b) => a.t - b.t).map((r) => `<tr class="link" data-id="${esc(r.id)}"><td>${fmtDate(r.t)}</td><td>${esc(r.building)}｜${esc(r.category)}</td><td>${esc(r.what.slice(0, 30))}</td><td>${esc(item(r).vendor || "")}</td><td class="num">${yen(item(r).bill_amount)}</td></tr>`).join("")}</table>` : `<div class="note">ありません</div>`}</div>
    <div class="panel"><h3>月ごとの請求</h3>
      ${keys.length ? `<table class="tbl"><tr><th>請求月</th><th class="num">件数</th><th class="num">請求額</th><th class="num">業者への支払い</th><th class="num">粗利</th></tr>${keys.map((m) => { const l = months[m], b = sum(l, (x) => x.bill_amount), c = sum(l, (x) => x.cost); return `<tr><td>${esc(m)}</td><td class="num">${l.length}</td><td class="num">${yen(b)}</td><td class="num">${yen(c)}</td><td class="num">${yen(b - c)}</td></tr>`; }).join("")}</table>
      <div class="btnRow"><button class="btn" id="csv">請求の一覧をCSVに出す</button><span class="note">Excelで開けます</span></div>` : `<div class="note">請求額や請求月を入れた依頼が、ここに出ます</div>`}</div>`;
  main.querySelectorAll("tr.link").forEach((el) => (el.onclick = () => (location.hash = "#/r/" + encodeURIComponent(el.dataset.id))));
  const c = $("csv"); if (c) c.onclick = () => {
    const head = ["請求月", "請求済み", "日付", "建物", "分類", "内容", "手配先", "見積番号", "手配日", "請求額", "業者への支払い", "粗利", "メモ"];
    const rows = billed.sort((a, b) => String(item(b).bill_month || "").localeCompare(String(item(a).bill_month || "")) || b.t - a.t).map((r) => { const it = item(r), g = gross(it); return [it.bill_month || "", it.billed ? "済" : "未", fmtDate(r.t), r.building, r.category, r.what, it.vendor, it.est_no, it.arranged_at, it.bill_amount, it.cost, g == null ? "" : g, it.memo].map(qs).join(","); });
    const blob = new Blob(["﻿" + [head.map(qs).join(","), ...rows].join("\r\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "山郷_請求一覧_" + new Date().toISOString().slice(0, 10) + ".csv"; a.click();
  };
}

/* ---------- 設定 ---------- */
function viewEmptyApi(main) { main.innerHTML = `<div class="empty"><h3>まだ窓口につながっていません</h3><p>設定で、窓口のURLと本社用の合言葉を入れてください。</p><a class="btn primary" href="#/settings">設定を開く</a></div>`; }
function viewSettings(main) {
  main.innerHTML = `<h2>設定</h2>
    <div class="panel"><h3>窓口につなぐ</h3>
      <p class="note">${S.api ? (S.syncError ? `<span class="warnText">つながりません：${esc(S.syncError)}</span>` : S.syncedAt ? `<span class="okText">つながっています</span>　依頼 ${S.records.length}件` : "読み込み中…") : "まだつながっていません"}</p>
      <div class="form"><div class="wide"><label>窓口のURL</label><input type="text" id="apiUrl" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(S.api ? S.api.url : "")}"></div>
      <div class="wide"><label>本社用の合言葉</label><input type="password" id="apiToken" autocomplete="off" value="${esc(S.api ? S.api.token : "")}"></div></div>
      <div class="btnRow"><button class="btn primary" id="apiSave">つないで読み込む</button>${S.api ? `<button class="btn" id="apiOff">つなぐのをやめる</button>` : ""}</div>
      <p class="note">本社用の合言葉は、山郷側の管理者には渡さないでください（金額・粗利が見えるため）。</p></div>
    <div class="panel"><h3>更新者の名前</h3><input type="text" id="sName" maxlength="20" value="${esc(getLS("name", "木村"))}"><p class="note">保存の記録に残ります。</p></div>
    <div class="panel"><h3>このアプリについて</h3><p class="note">バージョン ${APP_VERSION}　／　開いている間は45秒おきに自動で更新します。</p></div>`;
  $("apiSave").onclick = async () => {
    const url = $("apiUrl").value.trim(), token = $("apiToken").value.trim();
    if (!/^https:\/\/script\.google\.com\//.test(url) || !token) return alert("窓口のURL（https://script.google.com/…）と、本社用の合言葉を入れてください");
    const prev = S.api; S.api = { url, token };
    try { const j = await apiCall({ action: "ping" }, 30000); if (j.role !== "honsha") throw new Error("本社用の合言葉ではありません"); } catch (e) { S.api = prev; return alert("つながりませんでした：" + String((e && e.message) || e)); }
    if (!prev || prev.url !== url) { S.records = []; S.items = {}; S.loaded = false; S.syncedAt = 0; }
    setLS("api", JSON.stringify({ url, token })); loading = false;
    await loadAll(true); toast("窓口につながりました"); render();
  };
  const off = $("apiOff"); if (off) off.onclick = () => { if (!confirm("窓口につなぐのをやめますか？（この画面の情報は消えます）")) return; setLS("api", ""); S.api = null; S.records = []; S.items = {}; S.loaded = false; render(); renderSync(); };
  $("sName").onchange = (e) => setLS("name", e.target.value.trim());
}

/* ---------- 画面の切り替え ---------- */
function render() {
  const r = route(), main = $("main");
  document.querySelectorAll(".topNav a").forEach((a) => a.classList.toggle("on", a.dataset.nav === (r.name === "r" ? "list" : r.name)));
  window.scrollTo(0, 0);
  if (r.name === "r") viewDetail(main, r.id);
  else if (r.name === "bill") viewBill(main);
  else if (r.name === "settings") viewSettings(main);
  else viewList(main);
  renderSync();
}
function refreshView() { // 自動更新のあと。入力中の画面（詳細・設定）は触らない
  const n = route().name;
  if (n === "list" && $("listBody")) { renderListBody(); const m = $("main"); if (!m.contains(document.activeElement) || document.activeElement.tagName !== "INPUT") viewListChips(); }
  else if (n === "bill") viewBill($("main"));
}
function viewListChips() { // 件数の表示だけ更新する（検索欄の入力は消さない）
  const counts = { all: S.records.length, open: 0, todo: 0, work: 0, billing: 0, billed: 0 };
  S.records.forEach((r) => { const st = stage(r); counts[st]++; if (st !== "billed") counts.open++; });
  document.querySelectorAll(".fchip").forEach((el) => { const s = el.querySelector("small"); if (s) s.textContent = counts[el.dataset.s]; });
}
async function autoRefresh() { if (S.api && !document.hidden && (await loadAll(false))) refreshView(); else renderSync(); }

$("reloadBtn").onclick = async () => { if (S.api) { await loadAll(true); const n = route().name; if (n === "list" || n === "bill") render(); else if (n === "r" && !$("fSave")) render(); } };
window.addEventListener("hashchange", render);
render();
if (S.api) loadAll(false).then(() => { const n = route().name; if (n === "list" || n === "bill" || (n === "r" && !S.loaded) || (n === "r" && !document.querySelector("#photos"))) render(); else refreshView(); });
setInterval(autoRefresh, 45000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) autoRefresh(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
