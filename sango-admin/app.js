"use strict";
/* 山郷サポート 管理者ビューア（PC用）。リーダーが「報告」した症例（JSON＋写真）をBox Driveのフォルダから読んで一覧し、
   管理者が金額・原因・メモを書き足して整理する。書き足した内容はフォルダ内の「管理データ.json」1ファイルに保存する。
   編集できるのは山郷側の管理者のPC1台だけ（ほかのPCは閲覧専用）。社内データはアプリに持たない。 */

const APP_VERSION = 2;
const ADMIN_FILE = "管理データ.json";
const CAUSES = ["経年劣化", "施工不良", "使い方", "自然災害", "不明", "その他"];
const BLD_ORDER = ["haru", "kou", "wa", "chi", "u", "larch", "haruka", "botanical", "kumajirushi", "reception", "larch-back", "gaiko"];
const P = "sango-admin-";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const getLS = (k, d = "") => { try { const v = localStorage.getItem(P + k); return v == null ? d : v; } catch (e) { return d; } };
const setLS = (k, v) => { try { localStorage.setItem(P + k, v); } catch (e) {} };
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (t) => { if (!t) return "—"; const d = new Date(t); return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`; };
const fmtTime = (t) => { if (!t) return ""; const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const yen = (n) => (n === "" || n == null || isNaN(Number(n)) ? "—" : Number(n).toLocaleString("ja-JP") + "円");
const catNo = (id) => String(id || "").toLowerCase();

const ICONS = {
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  doc: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M10 13h6M10 17h6"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  reload: '<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/>',
  photo: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  tool: '<path d="M14 6a4 4 0 005 5l-8 8a2 2 0 01-3-3l8-8z"/>',
  filter: '<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0114 0"/>',
  down: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
};
const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const fillIcons = (root) => root.querySelectorAll("[data-icon]").forEach((e) => { if (!e.firstChild) e.innerHTML = icon(e.dataset.icon); });

/* ---------- 状態 ---------- */
const S = { records: [], admin: { kind: "sango-support-admin", schema: 1, items: {} }, photoGetters: new Map(), dirHandle: null, source: null, demo: false, writable: false };
const F = { src: "all", blds: new Set(), cats: new Set(), leader: "", period: "all", todo: false, q: "", sort: "new", sel: null };
let SUM = { period: "365" };

function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => (t.hidden = true), 3000); }
function showLoading(msg) { $("loadingText").textContent = msg; $("loading").hidden = false; }
function hideLoading() { $("loading").hidden = true; }
const canEdit = () => getLS("edit") === "1";

/* ---------- データの取り込み ---------- */
function norm(r, sender) {
  return {
    id: r.id, src: r.source === "past" ? "past" : "new", buildingId: r.building_id || "", building: r.building || "", categoryId: r.category_id || "", category: r.category || "",
    what: r.what || "", how: r.how || "", vendor: r.vendor || "", reporter: r.reporter || "", sender: String(sender || "").trim(), t: Date.parse(r.created_at) || 0,
    updated: Date.parse(r.updated_at || r.created_at) || 0, photos: (r.photos || []).map((p) => p.file), amount0: r.amount == null ? "" : r.amount, cause0: r.cause || "", memo0: r.memo || "",
  };
}
const adm = (r) => {
  const it = S.admin.items[r.id] || {};
  return { amount: it.amount !== undefined && it.amount !== null ? it.amount : r.amount0, cause: it.cause != null ? it.cause : r.cause0, memo: it.memo != null ? it.memo : r.memo0, status: it.status || (r.src === "past" ? "done" : ""), at: it.at || 0, by: it.by || "" };
};
const isTodo = (r) => r.src === "new" && adm(r).status !== "done";
const titleOf = (r) => (r.what.split(/\n/)[0] || "（内容なし）").slice(0, 40);

async function ingest(entries) {
  const recs = new Map();
  const admins = [];
  const getters = new Map();
  const put = (r, sender, past) => { // 壊れた1件で、同じファイルの残りが捨てられないようにする
    try {
      if (!r || !r.id) return;
      const n = norm(past ? { ...r, source: "past" } : r, sender);
      const old = recs.get(n.id);
      if (past || !old || n.updated >= old.updated) recs.set(n.id, n);
    } catch (err) { console.warn("読めない症例", err); }
  };
  for (const e of entries) {
    const lower = e.name.toLowerCase();
    if (/\.(jpe?g|png|webp|heic)$/.test(lower)) getters.set(e.name, e.get);
    else if (lower.endsWith(".json")) {
      try {
        const j = JSON.parse(await (await e.get()).text());
        if (j.kind === "sango-support-records") (j.records || []).forEach((r) => put(r, j.sender, false));
        else if (j.kind === "sango-support-past") (j.records || []).forEach((r) => put(r, "", true));
        else if (j.kind === "sango-support-admin" && j.items) admins.push(j);
      } catch (err) { console.warn("読めないJSON", e.name, err); }
    }
  }
  S.records = [...recs.values()];
  S.admin = mergeAdmins(admins);
  S.photoGetters = getters;
  clearUrls();
  // 読み直しで無くなった建物・分類・担当を絞り込みから外す（0件になって見えなくなるのを防ぐ）
  const ids = (k) => new Set(S.records.map((r) => r[k]));
  const bs = ids("buildingId"), cs = ids("categoryId"), ls = ids("sender");
  [...F.blds].forEach((x) => { if (!bs.has(x)) F.blds.delete(x); });
  [...F.cats].forEach((x) => { if (!cs.has(x)) F.cats.delete(x); });
  if (F.leader && !ls.has(F.leader)) F.leader = "";
}
function mergeAdmins(list) { // 項目ごとに、更新が新しい方を残す
  const out = { kind: "sango-support-admin", schema: 1, items: {}, updated_at: "" };
  for (const a of list) {
    if ((a.updated_at || "") > out.updated_at) out.updated_at = a.updated_at || "";
    for (const [id, it] of Object.entries(a.items || {})) { const cur = out.items[id]; if (!cur || (it.at || 0) > (cur.at || 0)) out.items[id] = it; }
  }
  return out;
}

const urlCache = new Map();
function clearUrls() { urlCache.forEach((p) => p.then((u) => u && URL.revokeObjectURL(u))); urlCache.clear(); }
function photoUrl(name) {
  if (urlCache.has(name)) return urlCache.get(name);
  const g = S.photoGetters.get(name);
  const p = g ? Promise.resolve().then(g).then((f) => URL.createObjectURL(f)).catch(() => "") : Promise.resolve("");
  urlCache.set(name, p);
  return p;
}

/* ---------- フォルダ（Box Drive） ---------- */
const IDB = "sango-admin";
const idb = () => new Promise((res, rej) => { const q = indexedDB.open(IDB, 1); q.onupgradeneeded = () => q.result.createObjectStore("kv"); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
const kvGet = async (k) => { const d = await idb(); return new Promise((res) => { const q = d.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); };
const kvSet = async (k, v) => { const d = await idb(); return new Promise((res) => { const tx = d.transaction("kv", "readwrite"); tx.objectStore("kv").put(v, k); tx.oncomplete = () => res(); tx.onerror = () => res(); }); };
const canPickFolder = "showDirectoryPicker" in window;

async function* walk(dir, depth = 0) {
  for await (const [name, h] of dir.entries()) {
    if (h.kind === "file") yield { name, h };
    else if (depth < 3) yield* walk(h, depth + 1);
  }
}
async function pickFolder() {
  if (!canPickFolder) return $("folderInput").click();
  try { S.dirHandle = await window.showDirectoryPicker({ id: "sango-reports", mode: "readwrite" }); } catch (e) { return; }
  await kvSet("dir", S.dirHandle);
  S.demo = false;
  await loadFromHandle();
}
async function reopenFolder() {
  if (S.demo) return startDemo();
  if (!S.dirHandle) return pickFolder();
  const ok = (await S.dirHandle.queryPermission({ mode: "readwrite" })) === "granted" || (await S.dirHandle.requestPermission({ mode: "readwrite" })) === "granted";
  if (!ok) return toast("フォルダを読む許可がありません。もう一度選んでください");
  await loadFromHandle();
}
async function loadFromHandle() {
  showLoading("フォルダを読んでいます...");
  try {
    const entries = [];
    for await (const f of walk(S.dirHandle)) entries.push({ name: f.name, get: () => f.h.getFile() });
    await ingest(entries);
    S.source = { name: S.dirHandle.name, at: Date.now(), files: entries.length };
    S.writable = true;
    toast(`症例 ${S.records.length}件・写真 ${S.photoGetters.size}枚を読み込みました`);
  } catch (e) {
    console.error(e);
    alert("フォルダを読めませんでした。設定からフォルダを選び直してください。");
  } finally { hideLoading(); boot(); }
}
$("folderInput").addEventListener("change", async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;
  showLoading("フォルダを読んでいます...");
  S.demo = false; S.dirHandle = null; S.writable = false;
  await ingest(files.map((f) => ({ name: f.name, get: async () => f })));
  S.source = { name: "（選んだフォルダ）", at: Date.now(), files: files.length };
  hideLoading();
  toast(`症例 ${S.records.length}件を読み込みました（このブラウザでは閲覧のみ）`);
  boot();
});
async function startDemo() {
  showLoading("デモデータを作っています...");
  const d = await makeDemo();
  S.demo = true; S.dirHandle = null; S.writable = false;
  S.records = [...d.records.map((r) => norm(r, d.senderOf(r))), ...d.past.map((r) => norm(r, ""))];
  S.admin = { kind: "sango-support-admin", schema: 1, items: {} };
  S.photoGetters = new Map([...d.photoFiles].map(([n, f]) => [n, async () => f]));
  S.source = { name: "デモ（架空のデータ）", at: Date.now(), files: 0 };
  clearUrls();
  hideLoading();
  boot();
}

/* ---------- 管理データの保存 ---------- */
async function readDiskAdmin() {
  try { const fh = await S.dirHandle.getFileHandle(ADMIN_FILE); return JSON.parse(await (await fh.getFile()).text()); } catch (e) { return null; }
}
async function saveItem(r, patch) {
  if (!canEdit()) { toast("閲覧専用です。編集は設定で「編集する」を入れたPCだけです"); return false; }
  try {
    const items = { ...S.admin.items };
    if (S.dirHandle) { // 他のPCが書いた分を取り込んでから書く（同じ症例は新しい方を残す）
      if ((await S.dirHandle.queryPermission({ mode: "readwrite" })) !== "granted" && (await S.dirHandle.requestPermission({ mode: "readwrite" })) !== "granted") { toast("書き込みの許可がありません"); return false; }
      const disk = await readDiskAdmin();
      if (disk && disk.items) for (const [id, it] of Object.entries(disk.items)) { const mine = items[id]; if (!mine || (it.at || 0) > (mine.at || 0)) items[id] = it; }
    }
    items[r.id] = { ...(items[r.id] || {}), ...patch, at: Date.now(), by: getLS("name") };
    const next = { ...S.admin, kind: "sango-support-admin", schema: 1, updated_at: new Date().toISOString(), items };
    const text = JSON.stringify(next, null, 1);
    if (S.demo) { S.admin = next; toast("デモなので保存はされません（画面の上では反映されます）"); return true; }
    if (S.dirHandle) {
      const fh = await S.dirHandle.getFileHandle(ADMIN_FILE, { create: true });
      const w = await fh.createWritable();
      try { await w.write(text); await w.close(); } catch (err) { try { await w.abort(); } catch (e2) {} throw err; }
      S.admin = next;
      toast("保存しました");
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      a.download = ADMIN_FILE;
      a.click();
      S.admin = next;
      toast("このブラウザではフォルダに書けないため、ファイルを保存しました。Boxのフォルダに入れてください");
    }
    return true;
  } catch (err) {
    console.error(err);
    alert("保存できませんでした。Boxの同期中・ファイルのロック・容量を確認して、もう一度試してください。\n（" + (err && err.message ? err.message : err) + "）");
    return false;
  }
}

/* ---------- 絞り込み ---------- */
function filtered() {
  const q = F.q.trim().toLowerCase();
  const now = Date.now();
  const days = F.period === "all" ? 0 : Number(F.period);
  let list = S.records.filter((r) => {
    if (F.src !== "all" && r.src !== F.src) return false;
    if (F.blds.size && !F.blds.has(r.buildingId)) return false;
    if (F.cats.size && !F.cats.has(r.categoryId)) return false;
    if (F.leader && r.sender !== F.leader) return false;
    if (days && now - r.t > days * 86400000) return false;
    if (F.todo && !isTodo(r)) return false;
    if (q) {
      const a = adm(r);
      if (![r.what, r.how, r.vendor, r.reporter, r.sender, r.building, r.category, a.memo, a.cause].join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  });
  list.sort((x, y) => (F.sort === "new" ? y.t - x.t : x.t - y.t));
  return list;
}
const bldRank = (id) => { const i = BLD_ORDER.indexOf(id); return i < 0 ? 99 : i; };
function bldImg(id) { return `<img src="art/bld-${esc(id)}.webp" alt="" data-fb="x">`; }
function catImg(id) { return `<img src="art/${esc(catNo(id))}.webp" alt="" data-fb="x">`; }
document.addEventListener("error", (e) => { const t = e.target; if (t && t.tagName === "IMG" && t.dataset.fb) t.style.visibility = "hidden"; }, true);

/* ---------- ルーティング ---------- */
const route = () => { const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean); return { name: parts[0] || "list", id: parts[1] ? decodeURIComponent(parts[1]) : "" }; };
function boot() { renderHeader(); render(); }
function renderHeader() {
  const b = $("modeBadge");
  b.textContent = canEdit() ? "編集モード" : "閲覧専用";
  b.className = "modeBadge" + (canEdit() ? " edit" : "");
}
let viewTok = 0;
function render() {
  viewTok++;
  const r = route();
  document.querySelectorAll(".sideNav > a").forEach((a) => a.classList.toggle("on", a.dataset.nav === (r.name === "r" ? "list" : r.name)));
  $("sideExtra").innerHTML = "";
  const main = $("main");
  window.scrollTo(0, 0);
  if (!S.records.length && r.name !== "settings") return viewEmpty(main);
  if (r.name === "list") { renderFilters(); viewList(main); }
  else if (r.name === "r") viewDetail(main, r.id);
  else if (r.name === "summary") viewSummary(main);
  else if (r.name === "settings") viewSettings(main);
  else location.hash = "#/list";
  fillIcons(document.body);
}

function viewEmpty(main) {
  main.innerHTML = `<div class="empty panel"><h3>症例がまだ読み込まれていません</h3>
    <p>リーダーが報告した症例が入っているフォルダ（Box Drive の受け取りフォルダ）を選んでください。</p>
    <p><button class="btn primary" id="emPick">フォルダを選ぶ</button> <button class="btn" id="emDemo">デモデータで見てみる</button></p>
    ${S.dirHandle ? `<p><button class="btn" id="emReopen">前回のフォルダを開く</button></p>` : ""}</div>`;
  $("emPick").onclick = pickFolder; $("emDemo").onclick = startDemo;
  const re = $("emReopen"); if (re) re.onclick = reopenFolder;
}

/* ---------- 左：絞り込み ---------- */
function renderFilters() {
  const bs = new Map(), cs = new Map(), leaders = new Set();
  S.records.forEach((r) => {
    if (r.buildingId) { const b = bs.get(r.buildingId) || { name: r.building, n: 0 }; b.n++; bs.set(r.buildingId, b); }
    if (r.categoryId) { const c = cs.get(r.categoryId) || { name: r.category, n: 0 }; c.n++; cs.set(r.categoryId, c); }
    if (r.sender) leaders.add(r.sender);
  });
  const bl = [...bs].sort((a, b) => bldRank(a[0]) - bldRank(b[0]) || a[1].name.localeCompare(b[1].name));
  const cl = [...cs].sort((a, b) => a[0].localeCompare(b[0]));
  $("sideExtra").innerHTML = `
    <div class="fGroup"><div class="fTitle">${icon("home")}建物</div>${bl.map(([id, b]) => `<label class="fRow"><input type="checkbox" data-b="${esc(id)}" ${F.blds.has(id) ? "checked" : ""}>${bldImg(id)}<span class="fn">${esc(b.name)}</span><span class="fc">${b.n}</span></label>`).join("")}</div>
    <div class="fGroup"><div class="fTitle">${icon("tool")}分類</div><div class="fGrid">${cl.map(([id, c]) => `<label class="fRow"><input type="checkbox" data-c="${esc(id)}" ${F.cats.has(id) ? "checked" : ""}><span class="fn">${esc(c.name)}</span></label>`).join("")}</div></div>
    <div class="fGroup"><div class="fTitle">${icon("user")}担当リーダー</div><select class="fSelect" id="fLeader"><option value="">すべて</option>${[...leaders].sort().map((l) => `<option ${F.leader === l ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
    <div class="fGroup"><div class="fTitle">${icon("cal")}期間</div><select class="fSelect" id="fPeriod">${[["all", "すべての期間"], ["30", "過去30日"], ["90", "過去3か月"], ["365", "過去1年"]].map(([v, l]) => `<option value="${v}" ${F.period === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
    <label class="fRow"><input type="checkbox" id="fTodo" ${F.todo ? "checked" : ""}><span class="fn"><b>未整理だけ</b></span></label>`;
  const side = $("sideExtra");
  side.querySelectorAll("[data-b]").forEach((el) => (el.onchange = () => { el.checked ? F.blds.add(el.dataset.b) : F.blds.delete(el.dataset.b); renderListBody(); }));
  side.querySelectorAll("[data-c]").forEach((el) => (el.onchange = () => { el.checked ? F.cats.add(el.dataset.c) : F.cats.delete(el.dataset.c); renderListBody(); }));
  $("fLeader").onchange = (e) => { F.leader = e.target.value; renderListBody(); };
  $("fPeriod").onchange = (e) => { F.period = e.target.value; renderListBody(); };
  $("fTodo").onchange = (e) => { F.todo = e.target.checked; renderListBody(); };
}

/* ---------- 症例一覧 ---------- */
function viewList(main) {
  main.innerHTML = `<div class="listLayout"><section class="panel">
    <div class="listTop"><h2>症例一覧</h2>
      <div class="seg" id="srcSeg">${[["all", "すべて"], ["new", "新しい症例"], ["past", "過去"]].map(([v, l]) => `<button data-v="${v}" class="${F.src === v ? "on" : ""}">${l}</button>`).join("")}</div>
      <span class="grow"></span><span class="cnt" id="listCnt"></span>
      <select class="sortSel" id="sortSel"><option value="new" ${F.sort === "new" ? "selected" : ""}>新しい順</option><option value="old" ${F.sort === "old" ? "selected" : ""}>古い順</option></select></div>
    <table class="tbl"><thead><tr><th>日付</th><th>建物</th><th>分類</th><th>何が起きたか</th><th>報告した人／担当</th><th>写真</th><th>状態</th></tr></thead><tbody id="listBody"></tbody></table>
    <div id="listEmpty" class="empty" hidden>条件に合う症例がありません。</div></section>
    <aside class="panel pv" id="preview"></aside></div>`;
  $("globalSearch").value = F.q;
  $("srcSeg").querySelectorAll("button").forEach((b) => (b.onclick = () => { F.src = b.dataset.v; viewList(main); fillIcons(main); }));
  $("sortSel").onchange = (e) => { F.sort = e.target.value; renderListBody(); };
  renderListBody();
}
function stateChip(r) { return r.src === "past" ? `<span class="chip past">過去</span>` : adm(r).status === "done" ? `<span class="chip done">整理済み</span>` : `<span class="chip todo">未整理</span>`; }
function renderListBody() {
  const list = filtered();
  $("listCnt").textContent = `全 ${list.length} 件`;
  $("listEmpty").hidden = list.length > 0;
  if (!list.some((r) => r.id === F.sel)) F.sel = list.length ? list[0].id : null;
  $("listBody").innerHTML = list.map((r) => `<tr class="row ${r.id === F.sel ? "sel" : ""}" data-id="${esc(r.id)}">
    <td class="cDate">${fmtDate(r.t)}<br>${fmtTime(r.t)}</td>
    <td><div class="cBld">${bldImg(r.buildingId)}<span>${esc(r.building)}</span></div></td>
    <td><span class="cCat">${catImg(r.categoryId)}${esc(r.category)}</span></td>
    <td class="cWhat"><b>${esc(titleOf(r))}</b><span>${esc(r.what)}</span></td>
    <td class="cPeople"><b>${esc(r.reporter || "—")}</b><span>担当 ${esc(r.sender || "—")}</span></td>
    <td><span class="cPhoto">${icon("photo")}${r.photos.length}</span></td><td>${stateChip(r)}</td></tr>`).join("");
  $("listBody").querySelectorAll("tr.row").forEach((tr) => {
    tr.onclick = () => { F.sel = tr.dataset.id; $("listBody").querySelectorAll("tr.row").forEach((x) => x.classList.toggle("sel", x === tr)); renderPreview(); };
    tr.ondblclick = () => (location.hash = "#/r/" + encodeURIComponent(tr.dataset.id));
  });
  fillIcons($("listBody"));
  renderPreview();
}
async function renderPreview() {
  const box = $("preview");
  const r = S.records.find((x) => x.id === F.sel);
  if (!r) { box.innerHTML = `<div class="note">症例を選ぶと、ここに内容が出ます。</div>`; return; }
  const a = adm(r);
  box.innerHTML = `<div class="pvHero">${bldImg(r.buildingId)}${stateChip(r)}</div>
    <dl class="facts"><dt>建物</dt><dd>${esc(r.building)}</dd><dt>分類</dt><dd>${esc(r.category)}</dd><dt>件名</dt><dd>${esc(titleOf(r))}</dd><dt>報告日</dt><dd>${fmtDate(r.t)} ${fmtTime(r.t)}</dd><dt>報告した人</dt><dd>${esc(r.reporter || "—")}</dd><dt>担当リーダー</dt><dd>${esc(r.sender || "—")}</dd></dl>
    <div class="sub">何が起きたか</div><div class="pvText">${esc(r.what)}</div>
    ${r.how ? `<div class="sub">どう対応したか</div><div class="pvText">${esc(r.how)}</div>` : ""}
    ${r.photos.length ? `<div class="sub">写真 ${r.photos.length}枚</div><div class="thumbs" id="pvThumbs"></div>` : ""}
    ${a.memo ? `<div class="sub">対応メモ</div><div class="pvText">${esc(a.memo)}</div>` : ""}
    <button class="btn primary wide" id="pvOpen" style="margin-top:10px">詳細を見る</button>`;
  $("pvOpen").onclick = () => (location.hash = "#/r/" + encodeURIComponent(r.id));
  fillIcons(box);
  const th = $("pvThumbs");
  if (th) for (const name of r.photos.slice(0, 3)) { const im = document.createElement("img"); im.alt = ""; im.src = await photoUrl(name); im.onclick = () => showLightbox(im.src); th.appendChild(im); if (F.sel !== r.id) return; }
}
function showLightbox(src) { if (!src) return; const lb = $("lightbox"); lb.innerHTML = `<img src="${src}" alt="">`; lb.hidden = false; lb.onclick = () => { lb.hidden = true; lb.innerHTML = ""; }; }

/* ---------- 症例の詳細 ---------- */
async function viewDetail(main, id) {
  const r = S.records.find((x) => x.id === id);
  if (!r) { location.hash = "#/list"; return; }
  const a = adm(r), edit = canEdit();
  const sim = S.records.filter((x) => x.id !== r.id && x.buildingId === r.buildingId && x.categoryId === r.categoryId).sort((x, y) => y.t - x.t).slice(0, 6);
  const sim2 = sim.length ? sim : S.records.filter((x) => x.id !== r.id && x.categoryId === r.categoryId).sort((x, y) => y.t - x.t).slice(0, 6);
  main.innerHTML = `<div class="detailTop"><a class="backLink" href="#/list">← 一覧に戻る</a></div>
    <div class="detailLayout"><div>
      <div class="panel"><div class="dHead"><div class="pvHero">${bldImg(r.buildingId)}</div><div><h2>${esc(r.building)} ${stateChip(r)}</h2>
        <div class="dFacts"><div><span>分類</span>${esc(r.category)}</div><div><span>件名</span>${esc(titleOf(r))}</div><div><span>報告日</span>${fmtDate(r.t)} ${fmtTime(r.t)}</div><div><span>報告した人</span>${esc(r.reporter || "—")}</div><div><span>担当リーダー</span>${esc(r.sender || "—")}</div><div><span>対応した業者</span>${esc(r.vendor || "—")}</div></div></div></div></div>
      <div class="two"><div class="panel"><h3>何が起きたか</h3><div class="pvText">${esc(r.what)}</div></div><div class="panel"><h3>どう対応したか</h3><div class="pvText">${esc(r.how || "（まだ書かれていません）")}</div></div></div>
      ${r.photos.length ? `<div class="panel" style="margin-top:12px"><h3>写真 <span class="note">計 ${r.photos.length} 枚</span></h3><div class="photoGrid" id="dPhotos"></div></div>` : ""}
      <div class="panel" style="margin-top:12px"><h3>管理者による整理${edit ? "" : "　<span class=\"note\">（閲覧専用です。編集は山郷側の管理者のPCで行います）</span>"}</h3>
        <div class="editRow"><div><label>金額（円）</label><input id="eAmt" type="number" min="0" step="1" value="${esc(a.amount)}" ${edit ? "" : "disabled"}></div>
          <div><label>原因の分類</label><select id="eCause" ${edit ? "" : "disabled"}><option value="">（未選択）</option>${CAUSES.map((c) => `<option ${a.cause === c ? "selected" : ""}>${c}</option>`).join("")}${a.cause && !CAUSES.includes(a.cause) ? `<option selected>${esc(a.cause)}</option>` : ""}</select></div>
          <div><label>メモ</label><textarea id="eMemo" maxlength="500" ${edit ? "" : "disabled"}>${esc(a.memo)}</textarea></div></div>
        <div class="editBtns"><button class="btn primary" id="eDone" ${edit ? "" : "disabled"}>${a.status === "done" ? "整理済み（内容を保存）" : "整理済みにする"}</button>
          <button class="btn" id="eSave" ${edit ? "" : "disabled"}>保存</button>${a.status === "done" && r.src === "new" ? `<button class="btn" id="eUndo" ${edit ? "" : "disabled"}>未整理に戻す</button>` : ""}
          <span class="note">${a.at ? `最終更新 ${fmtDate(a.at)} ${fmtTime(a.at)}${a.by ? "　" + esc(a.by) : ""}` : ""}</span></div></div>
    </div>
    <aside class="panel"><h3>似た症例</h3>${sim2.length ? sim2.map((x) => `<div class="simItem" data-id="${esc(x.id)}">${bldImg(x.buildingId)}<div class="t"><b>${esc(titleOf(x))}</b>${esc(x.building)}｜${esc(x.category)}｜${fmtDate(x.t)}</div>${stateChip(x)}</div>`).join("") : `<div class="note">同じ分類の症例はまだありません。</div>`}</aside></div>`;
  main.querySelectorAll(".simItem").forEach((el) => (el.onclick = () => (location.hash = "#/r/" + encodeURIComponent(el.dataset.id))));
  const tok = viewTok;
  const read = () => ({ amount: $("eAmt").value === "" ? "" : Number($("eAmt").value), cause: $("eCause").value, memo: $("eMemo").value.trim() });
  const done = async (patch) => {
    if (!(await saveItem(r, patch))) return;
    if (tok === viewTok && route().name === "r" && route().id === id) { viewDetail(main, id); fillIcons(main); } // 保存中に別の画面へ移っていたら描き直さない
  };
  if (edit) {
    $("eSave").onclick = () => done(read());
    $("eDone").onclick = () => done({ ...read(), status: "done" });
    const u = $("eUndo"); if (u) u.onclick = () => done({ ...read(), status: "" });
  }
  fillIcons(main);
  const grid = $("dPhotos");
  if (grid) for (const name of r.photos) {
    const src = await photoUrl(name);
    if (tok !== viewTok || !grid.isConnected) return; // 別の画面に移っていたら続けない
    const im = document.createElement("img"); im.alt = ""; im.src = src; im.onclick = () => showLightbox(src); grid.appendChild(im);
  }
}

/* ---------- まとめ ---------- */
function viewSummary(main) {
  const days = SUM.period === "all" ? 0 : Number(SUM.period), now = Date.now();
  const list = S.records.filter((r) => !days || now - r.t <= days * 86400000);
  const bs = new Map(), cs = new Map(), matrix = {}, vendors = new Map();
  list.forEach((r) => {
    if (r.buildingId) bs.set(r.buildingId, r.building);
    if (r.categoryId) cs.set(r.categoryId, r.category);
    const k = r.buildingId + "|" + r.categoryId; matrix[k] = (matrix[k] || 0) + 1;
    if (r.vendor && !["自分で対応", "未定"].includes(r.vendor)) vendors.set(r.vendor, (vendors.get(r.vendor) || 0) + 1);
  });
  const bl = [...bs].sort((a, b) => bldRank(a[0]) - bldRank(b[0])), cl = [...cs].sort((a, b) => a[0].localeCompare(b[0]));
  const lvl = (n) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 10 ? 3 : 4);
  const thisMonth = list.filter((r) => { const d = new Date(r.t), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); }).length;
  const catCount = cl.map(([id, name]) => [name, list.filter((r) => r.categoryId === id).length]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const vList = [...vendors].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const months = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ y: d.getFullYear(), m: d.getMonth(), n: 0 }); }
  S.records.forEach((r) => { const d = new Date(r.t); const m = months.find((x) => x.y === d.getFullYear() && x.m === d.getMonth()); if (m) m.n++; });
  const mx = Math.max(1, ...months.map((m) => m.n)), bmax = (arr) => Math.max(1, ...arr.map((x) => x[1]));
  const bars = (arr) => arr.map(([n, c]) => `<div class="barRow"><span>${esc(n)}</span><div class="bar"><i style="width:${(c / bmax(arr)) * 100}%"></i></div><b>${c}件</b></div>`).join("") || `<div class="note">データがありません</div>`;
  main.innerHTML = `<div class="listTop"><h2>まとめ</h2><span class="note">登録された症例を、建物・分類・業者・月ごとに集計しています。</span><span class="grow"></span>
      <select class="sortSel" id="sumPeriod">${[["365", "過去1年"], ["90", "過去3か月"], ["30", "過去30日"], ["all", "すべての期間"]].map(([v, l]) => `<option value="${v}" ${SUM.period === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <button class="btn primary" id="csvBtn">${icon("down")}Excel（CSV）に書き出す</button></div>
    <div class="kpis"><div class="kpi"><small>総症例数</small><div class="v">${list.length}<i>件</i></div></div><div class="kpi"><small>未整理</small><div class="v">${list.filter(isTodo).length}<i>件</i></div></div>
      <div class="kpi"><small>今月の件数</small><div class="v">${thisMonth}<i>件</i></div></div><div class="kpi"><small>対応業者数</small><div class="v">${vendors.size}<i>社</i></div></div></div>
    <div class="panel"><h3>建物 × 分類の件数 <span class="note">色が濃いほど件数が多いことを示します</span></h3>
      <table class="heat"><thead><tr><th></th>${cl.map(([id, n]) => `<th>${catImg(id)}${esc(n)}</th>`).join("")}</tr></thead><tbody>${bl.map(([bid, bn]) => `<tr><td class="name">${bldImg(bid)}${esc(bn)}</td>${cl.map(([cid]) => { const n = matrix[bid + "|" + cid] || 0; return `<td class="h${lvl(n)}">${n}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="charts"><div class="panel"><h3>分類ごとの件数</h3>${bars(catCount)}</div><div class="panel"><h3>業者ごとの件数</h3>${bars(vList)}</div>
      <div class="panel"><h3>月ごとの件数（直近12か月）</h3><div class="vbars">${months.map((m) => `<div class="vb"><b>${m.n || ""}</b><i style="height:${(m.n / mx) * 100}%"></i>${m.m + 1}月</div>`).join("")}</div></div></div>`;
  $("sumPeriod").onchange = (e) => { SUM.period = e.target.value; viewSummary(main); fillIcons(main); };
  $("csvBtn").onclick = () => exportCsv(list);
}
function exportCsv(list) {
  const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
  const qs = (v) => q(/^[=+@]|^-(?!\d)/.test(String(v == null ? "" : v)) ? "'" + v : v); // 文字の先頭が = + @ - だと、Excelが数式と解釈するため先頭に ' を付ける
  const head = ["区分", "日付", "建物", "分類", "何が起きたか", "どう対応したか", "対応した業者", "報告した人", "担当リーダー", "写真", "金額", "原因の分類", "メモ", "状態"];
  const rows = list.sort((a, b) => b.t - a.t).map((r) => { const a = adm(r); return [qs(r.src === "past" ? "過去" : "新規"), qs(fmtDate(r.t)), qs(r.building), qs(r.category), qs(r.what), qs(r.how), qs(r.vendor), qs(r.reporter), qs(r.sender), q(r.photos.length), q(a.amount), qs(a.cause), qs(a.memo), qs(r.src === "past" ? "過去" : a.status === "done" ? "整理済み" : "未整理")].join(","); });
  const blob = new Blob(["﻿" + [head.map(q).join(","), ...rows].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `山郷サポート_症例一覧_${(() => { const d = new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()); })()}.csv`;
  a.click();
  toast("書き出しました");
}

/* ---------- 設定 ---------- */
function viewSettings(main) {
  const n = S.records.length, todo = S.records.filter(isTodo).length, past = S.records.filter((r) => r.src === "past").length;
  main.innerHTML = `<div class="settingBox"><div class="listTop"><h2>設定</h2></div>
    <div class="panel"><h3>症例のフォルダ</h3>
      <p class="note">リーダーが「報告」した症例（JSONと写真）が入っているフォルダ（Box Drive の受け取りフォルダ）を選びます。</p>
      <p>${S.source ? `<span class="statusOk">読み込み済み</span>　${esc(S.source.name)}　症例 ${n}件（うち過去 ${past}件）・未整理 ${todo}件・写真 ${S.photoGetters.size}枚` : `<span class="statusWarn">未読み込み</span>`}</p>
      <p><button class="btn primary" id="sPick">フォルダを選ぶ</button> <button class="btn" id="sReload">読み直す</button> <button class="btn" id="sDemo">デモデータで見る</button></p>
      ${canPickFolder ? "" : `<p class="note">このブラウザではフォルダへの保存ができません。Edge か Chrome で開くと、整理した内容をフォルダに保存できます。</p>`}</div>
    <div class="panel"><h3>編集モード</h3>
      <label><input type="checkbox" id="sEdit" ${canEdit() ? "checked" : ""}> このPCで金額・原因・メモを編集する</label>
      <p class="note">編集できるのは、山郷側の管理者のPC1台だけにしてください（ほかのPCは入れないままで、閲覧専用になります）。整理した内容は、選んだフォルダの「${ADMIN_FILE}」1ファイルに保存されます。</p>
      <p><label class="note">編集者の名前（更新の記録に残ります）</label><br><input id="sName" class="fSelect" style="max-width:260px" value="${esc(getLS("name"))}" placeholder="例）山田"></p></div>
    <div class="panel"><h3>原因の分類</h3><p class="note">${CAUSES.join("・")}</p></div>
    <div class="panel"><h3>このアプリについて</h3><p class="note">バージョン ${APP_VERSION}　／　症例のデータはこのアプリには含まれず、選んだフォルダから毎回読みます。</p></div></div>`;
  $("sPick").onclick = pickFolder; $("sReload").onclick = reopenFolder; $("sDemo").onclick = startDemo;
  $("sEdit").onchange = (e) => { setLS("edit", e.target.checked ? "1" : "0"); renderHeader(); toast(e.target.checked ? "編集モードにしました" : "閲覧専用にしました"); };
  $("sName").onchange = (e) => setLS("name", e.target.value.trim());
}

/* ---------- 起動 ---------- */
$("globalSearch").addEventListener("input", (e) => { F.q = e.target.value; if (route().name !== "list") location.hash = "#/list"; else renderListBody(); });
$("reloadBtn").innerHTML = icon("reload");
$("reloadBtn").onclick = reopenFolder;
window.addEventListener("hashchange", render);
fillIcons(document.body);
(async () => {
  try { S.dirHandle = (await kvGet("dir")) || null; } catch (e) {}
  if (S.dirHandle) {
    try { if ((await S.dirHandle.queryPermission({ mode: "readwrite" })) === "granted") { await loadFromHandle(); } else boot(); } catch (e) { boot(); }
  } else boot();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
})();
