/* ==========================================================
   現場ナビ 見守り（管理者ビューア）
   現場ナビ（genba-manual）から Box に届いた報告JSON・写真を、PCで一覧する。
   - データはサーバーに置かない。Box Drive で同期しているフォルダを選んで、ブラウザの中で読むだけ
   - 返信は、選んだフォルダの「返信」フォルダに JSON で書き出す（現場ナビ側で取り込む）
   ========================================================== */

const APP_NAME = "現場ナビ 見守り"; // 名前を変える時はここと index.html の title / manifest
const APP_VERSION = 3;
const LS = "genba-viewer-"; // localStorage の接頭辞（同じドメインの他アプリと分ける）
const LATE_DAYS = 8; // 最終報告からこの日数たったら「報告の遅れ」
const REPLY_DIR = "返信";

const $ = (id) => document.getElementById(id);

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  building: '<path d="M4 21V4h10v17"/><path d="M14 9h6v12"/><path d="M7 8h4M7 12h4M7 16h4"/><path d="M2 21h20"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  reload: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  reply: '<path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 11 5-1-6-4-11-11-11z"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
};
function icon(name, size = 20, width = 2) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 3200);
}
function getLS(key, fallback = "") {
  try {
    const v = localStorage.getItem(LS + key);
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function setLS(key, v) {
  try {
    localStorage.setItem(LS + key, v);
  } catch (e) {}
}
function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ---------- 日付 ---------- */
const WD = ["日", "月", "火", "水", "木", "金", "土"];
function fmtMD(v) {
  const d = typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + "T00:00:00") : new Date(v);
  if (isNaN(d)) return "";
  return `${d.getMonth() + 1}/${d.getDate()}(${WD[d.getDay()]})`;
}
function fmtDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${fmtMD(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function daysAgo(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const n = new Date();
  const b = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.round((b - a) / 86400000);
}
function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (isNaN(ms)) return "";
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "たった今";
  if (h < 24) return `${h}時間前`;
  const d = daysAgo(iso);
  return d <= 1 ? "1日前" : `${d}日前`;
}
function agoLabel(iso) {
  const d = daysAgo(iso);
  if (d == null) return "";
  return d === 0 ? "今日" : `${d}日前`;
}

/* ---------- データ（報告フォルダから組み立てる） ---------- */
// reports: 報告JSON（重複は送信日時で1つに）。sites / people / notes は reports から組み立てる
const data = { reports: [], sites: new Map(), people: new Map(), notes: new Map(), replies: new Map(), photoFiles: new Map(), source: null };
let demoMode = false;

const NOTE_TYPES = {
  question: { label: "疑問", icon: "chat", cls: "q" },
  notice: { label: "気づき", icon: "bulb", cls: "n" },
  request: { label: "職人さんの要望", short: "要望", icon: "wrench", cls: "r" },
};
const TYPE_BY_LABEL = { 疑問: "question", 気づき: "notice", 職人さんの要望: "request" };

function siteKeyOf(r) {
  return r.site_id || "name:" + r.site;
}
function personKeyOf(r) {
  return r.sender_id || "name:" + (r.sender || "（名前なし）");
}

function buildData(reports, replies) {
  data.reports = [];
  data.sites = new Map();
  data.people = new Map();
  data.notes = new Map();
  data.replies = new Map();
  const seen = new Set();
  reports
    .filter((r) => r && r.kind === "genba-photo-report" && r.period)
    .sort((a, b) => (a.sent_at < b.sent_at ? -1 : 1))
    .forEach((r) => {
      const k = `${siteKeyOf(r)}|${r.period.start}|${r.period.end}|${r.sent_at}`;
      if (seen.has(k)) return;
      seen.add(k);
      data.reports.push(r);
    });

  data.reports.forEach((r) => {
    const sk = siteKeyOf(r);
    const pk = personKeyOf(r);
    let site = data.sites.get(sk);
    if (!site) data.sites.set(sk, (site = { key: sk, name: r.site, personKey: pk, personName: r.sender || "", reports: [] }));
    site.name = r.site;
    site.personKey = pk;
    site.personName = r.sender || site.personName;
    site.reports.push(r);
    let p = data.people.get(pk);
    if (!p) data.people.set(pk, (p = { key: pk, name: r.sender || "（名前なし）", sites: new Set(), reports: [] }));
    p.name = r.sender || p.name;
    p.sites.add(sk);
    p.reports.push(r);

    (r.checks || []).forEach((c) =>
      (c.notes || []).forEach((n) => {
        const typeId = n.type_id || TYPE_BY_LABEL[n.type] || "notice";
        const id = n.id || `${sk}|${c.item}|${n.at}|${n.text}`;
        const prev = data.notes.get(id);
        const ver = n.updated_at || r.sent_at;
        if (prev && prev._ver > ver) return; // 古い報告に入っていた同じメモは、新しい方を使う
        data.notes.set(id, {
          id,
          type: typeId,
          text: n.text || "",
          at: n.at,
          by: n.by || r.sender || "",
          status: n.status || "",
          resolvedAt: n.resolved_at || "",
          resolvedBy: n.resolved_by || "",
          siteKey: sk,
          siteName: r.site,
          personKey: pk,
          personName: r.sender || "",
          itemId: c.item_id || "",
          item: c.item,
          itemNo: c.item_no,
          process: c.process,
          _ver: ver,
        });
      })
    );
  });
  data.sites.forEach((s) => s.reports.sort((a, b) => (a.period.end < b.period.end ? 1 : a.period.end > b.period.end ? -1 : a.sent_at < b.sent_at ? 1 : -1)));
  data.people.forEach((p) => p.reports.sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1)));
  (replies || []).forEach(addReplyToData);
  updateNavBadge();
}

function addReplyToData(rp) {
  if (!rp || rp.kind !== "genba-reply" || !rp.note_id) return;
  const list = data.replies.get(rp.note_id) || [];
  if (list.some((x) => x.id === rp.id)) return;
  list.push(rp);
  list.sort((a, b) => (a.at < b.at ? -1 : 1));
  data.replies.set(rp.note_id, list);
}

// 状態：疑問は 未回答 → 返信済み → 解決済み（解決は監督が現場ナビで付ける）。気づき・要望は返信したら「返信済み」
function noteStatus(n) {
  if (n.type === "question" && n.status === "resolved") return "resolved";
  if ((data.replies.get(n.id) || []).length) return "replied";
  return n.type === "question" ? "open" : "";
}
const STATUS_LABEL = { open: "未回答", replied: "返信済み", resolved: "解決済み" };

function openQuestions() {
  return [...data.notes.values()].filter((n) => noteStatus(n) === "open");
}

function personStats(p) {
  const last = p.reports[0];
  const weekPhotos = p.reports.filter((r) => daysAgo(r.sent_at) <= 6).reduce((s, r) => s + (r.photos || []).length, 0);
  const open = [...data.notes.values()].filter((n) => n.personKey === p.key && noteStatus(n) === "open").length;
  const lastDays = last ? daysAgo(last.sent_at) : null;
  const late = lastDays == null || lastDays >= LATE_DAYS;
  const state = open ? "need" : late ? "late" : "ok"; // 表示はいちばん急ぐもの。絞り込みは need / late を別々に見る
  return { last, lastDays, weekPhotos, open, late, state };
}
const PERSON_STATE = { need: { label: "対応が必要", cls: "danger" }, late: { label: "報告の遅れ", cls: "warn" }, ok: { label: "順調", cls: "ok" } };

function updateNavBadge() {
  const n = openQuestions().length;
  $("navBadge").hidden = !n;
  $("navBadge").textContent = n;
}

/* ---------- 写真 ---------- */
const urlCache = new Map();
async function photoUrl(name) {
  if (urlCache.has(name)) return urlCache.get(name);
  let url = "";
  if (demoMode) url = DEMO.photoUrl(name);
  else {
    const f = data.photoFiles.get(name);
    if (f) {
      const file = f.getFile ? await f.getFile() : f;
      url = URL.createObjectURL(file);
    }
  }
  urlCache.set(name, url);
  return url;
}
// <img data-photo="ファイル名"> を後から埋める（一覧を先に出して、写真は見えてから読む）
function fillPhotos(root) {
  root.querySelectorAll("img[data-photo]").forEach(async (img) => {
    const url = await photoUrl(img.dataset.photo);
    if (url) img.src = url;
    else img.closest(".thumb")?.classList.add("missing");
  });
}
function openLightbox(src) {
  $("lightboxImg").src = src;
  $("lightbox").hidden = false;
}

/* ---------- 報告フォルダ（Box Drive） ---------- */
// フォルダの許可（ハンドル）は IndexedDB に残し、次回は「読み込む」1回で開けるようにする
const IDB = "genba-viewer";
function idb() {
  return new Promise((res, rej) => {
    const q = indexedDB.open(IDB, 1);
    q.onupgradeneeded = () => q.result.createObjectStore("kv");
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function kvGet(key) {
  const db = await idb();
  return new Promise((res) => {
    const q = db.transaction("kv").objectStore("kv").get(key);
    q.onsuccess = () => res(q.result);
    q.onerror = () => res(null);
  });
}
async function kvSet(key, val) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

let dirHandle = null;
const canPickFolder = "showDirectoryPicker" in window;

async function pickFolder() {
  if (!canPickFolder) {
    $("folderInput").click();
    return;
  }
  try {
    dirHandle = await window.showDirectoryPicker({ id: "genba-reports", mode: "readwrite" });
  } catch (e) {
    return; // キャンセル
  }
  await kvSet("dir", dirHandle);
  demoMode = false;
  setLS("demo", "0");
  await loadFromHandle();
}

async function reopenFolder() {
  if (!dirHandle) return pickFolder();
  const ok = (await dirHandle.queryPermission({ mode: "readwrite" })) === "granted" || (await dirHandle.requestPermission({ mode: "readwrite" })) === "granted";
  if (!ok) {
    toast("フォルダを読む許可がありません。もう一度選んでください");
    return;
  }
  demoMode = false;
  setLS("demo", "0");
  await loadFromHandle();
}

async function* walk(dir, path = "", depth = 0) {
  for await (const [name, h] of dir.entries()) {
    if (h.kind === "file") yield { name, path: path + name, handle: h };
    else if (depth < 4) yield* walk(h, path + name + "/", depth + 1);
  }
}

async function loadFromHandle() {
  showLoading("報告フォルダを読んでいます...");
  try {
    const reports = [];
    const replies = [];
    data.photoFiles = new Map();
    urlCache.forEach((u) => u && u.startsWith("blob:") && URL.revokeObjectURL(u));
    urlCache.clear();
    let jsonCount = 0;
    for await (const f of walk(dirHandle)) {
      const lower = f.name.toLowerCase();
      if (/\.(jpe?g|png|webp|heic)$/.test(lower)) data.photoFiles.set(f.name, f.handle);
      else if (lower.endsWith(".json")) {
        jsonCount++;
        try {
          const j = JSON.parse(await (await f.handle.getFile()).text());
          if (j.kind === "genba-photo-report") reports.push(j);
          else if (j.kind === "genba-reply") replies.push(j);
        } catch (e) {
          console.warn("読めないJSON", f.path, e);
        }
      }
    }
    buildData(reports, replies);
    data.source = { name: dirHandle.name, at: new Date().toISOString(), reports: data.reports.length, photos: data.photoFiles.size, writable: true };
    toast(`報告 ${data.reports.length}件・写真 ${data.photoFiles.size}枚を読み込みました`);
  } catch (e) {
    console.error(e);
    alert("報告フォルダを読めませんでした。設定からフォルダを選び直してください。");
  } finally {
    hideLoading();
    renderSource();
    route();
  }
}

// フォルダを選べないブラウザ用（Edge / Chrome 以外）。読むだけで、返信はファイルのダウンロードになる
async function onFolderInput(e) {
  const files = [...e.target.files];
  if (!files.length) return;
  showLoading("報告フォルダを読んでいます...");
  const reports = [];
  const replies = [];
  data.photoFiles = new Map();
  urlCache.clear();
  for (const f of files) {
    const lower = f.name.toLowerCase();
    if (/\.(jpe?g|png|webp|heic)$/.test(lower)) data.photoFiles.set(f.name, f);
    else if (lower.endsWith(".json")) {
      try {
        const j = JSON.parse(await f.text());
        if (j.kind === "genba-photo-report") reports.push(j);
        else if (j.kind === "genba-reply") replies.push(j);
      } catch (err) {}
    }
  }
  demoMode = false;
  buildData(reports, replies);
  data.source = { name: (files[0].webkitRelativePath || "").split("/")[0] || "フォルダ", at: new Date().toISOString(), reports: data.reports.length, photos: data.photoFiles.size, writable: false };
  hideLoading();
  renderSource();
  route();
}

function loadDemo() {
  demoMode = true;
  setLS("demo", "1");
  urlCache.clear();
  const d = DEMO.build();
  data.photoFiles = new Map();
  buildData(d.reports, d.replies);
  data.source = { name: "サンプルデータ", demo: true, reports: data.reports.length, writable: false };
  renderSource();
  route();
}

function renderSource() {
  const s = data.source;
  $("sourceInfo").innerHTML = s
    ? `${icon(s.demo ? "bulb" : "folder", 16)}<span><b>${esc(s.name)}</b><br>報告 ${s.reports}件${s.at ? `・${fmtDateTime(s.at)}に読込` : ""}</span>`
    : "";
}

let loadingEl = null;
function showLoading(text) {
  hideLoading();
  loadingEl = document.createElement("div");
  loadingEl.className = "loading";
  loadingEl.innerHTML = `<div class="spinner"></div><div>${esc(text)}</div>`;
  document.body.appendChild(loadingEl);
}
function hideLoading() {
  if (loadingEl) loadingEl.remove();
  loadingEl = null;
}

/* ---------- 返信（「返信」フォルダに JSON を書き出す） ---------- */
function safeName(s) {
  return String(s).replace(/[\\/:*?"<>|\s]/g, "");
}
function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

async function sendReply(n, text) {
  const me = getLS("name");
  if (!me) {
    alert("先に設定で、あなたの名前を登録してください（返信に名前が入ります）。");
    location.hash = "#/settings";
    return false;
  }
  const rp = {
    kind: "genba-reply",
    schema: 1,
    id: newId(),
    app_version: APP_VERSION,
    note_id: n.id,
    note_type: n.type,
    note_text: n.text,
    item_id: n.itemId,
    item: n.item,
    site_id: n.siteKey.startsWith("name:") ? "" : n.siteKey,
    site: n.siteName,
    to_id: n.personKey.startsWith("name:") ? "" : n.personKey,
    to: n.personName,
    from: me,
    text,
    at: new Date().toISOString(),
  };
  const fileName = safeName(`返信_${n.siteName}_${n.personName}_${stamp()}_${rp.id.slice(0, 6)}.json`);
  const body = JSON.stringify(rp, null, 2);
  if (demoMode) {
    addReplyToData(rp);
    toast("サンプルなので、ファイルには書き出していません");
    return true;
  }
  if (dirHandle && data.source && data.source.writable) {
    try {
      const sub = await dirHandle.getDirectoryHandle(REPLY_DIR, { create: true });
      const fh = await sub.getFileHandle(fileName, { create: true });
      const w = await fh.createWritable();
      await w.write(body);
      await w.close();
      addReplyToData(rp);
      toast(`「${REPLY_DIR}」フォルダに書き出しました。Box で ${n.personName || "監督"} さんに届きます`);
      return true;
    } catch (e) {
      console.error(e);
      alert("返信を書き出せませんでした。フォルダへの書き込みが許可されているか確認してください。");
      return false;
    }
  }
  // 書き込めない時はダウンロードして、Box の「返信」フォルダに置いてもらう
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "application/json" }));
  a.download = fileName;
  a.click();
  addReplyToData(rp);
  toast(`ダウンロードしました。Box の「${REPLY_DIR}」フォルダに入れてください`);
  return true;
}

function getDrafts() {
  try {
    return JSON.parse(getLS("drafts", "{}"));
  } catch (e) {
    return {};
  }
}
function setDraft(id, text) {
  const d = getDrafts();
  if (text) d[id] = text;
  else delete d[id];
  setLS("drafts", JSON.stringify(d));
}

/* ---------- 共通の部品 ---------- */
function avatar(name, size = 52) {
  const s = String(name || "?").trim();
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px;background:hsl(${h} 35% 88%);color:hsl(${h} 40% 28%)">${esc(s.slice(0, 1))}</span>`;
}
function typeBadge(t) {
  const x = NOTE_TYPES[t] || NOTE_TYPES.notice;
  return `<span class="tBadge ${x.cls}">${esc(x.short || x.label)}</span>`;
}
function statusBadge(n) {
  const st = noteStatus(n);
  return st ? `<span class="sBadge ${st}">${STATUS_LABEL[st]}</span>` : "";
}
function headline(text) {
  const first = String(text || "").split(/\r?\n/)[0];
  return first.length > 40 ? first.slice(0, 40) + "…" : first;
}
function restText(text) {
  const lines = String(text || "").split(/\r?\n/);
  return lines.length > 1 ? lines.slice(1).join(" ") : "";
}
function matchesQuery(...fields) {
  const q = ($("globalSearch").value || "").trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => String(f || "").toLowerCase().includes(q));
}
function emptyBox(title, text, withButtons = false) {
  return (
    `<div class="emptyBox"><div class="emptyTitle">${esc(title)}</div><div class="emptyText">${text}</div>` +
    (withButtons
      ? `<div class="btnRow"><button class="btn btnPrimary" data-act="pick">${icon("folder", 18)}報告フォルダを選ぶ</button><button class="btn btnOutline" data-act="demo">サンプルデータで見る</button></div>`
      : "") +
    `</div>`
  );
}
function bindCommon(root) {
  root.querySelectorAll('[data-act="pick"]').forEach((b) => b.addEventListener("click", pickFolder));
  root.querySelectorAll('[data-act="reopen"]').forEach((b) => b.addEventListener("click", reopenFolder));
  root.querySelectorAll('[data-act="demo"]').forEach((b) => b.addEventListener("click", loadDemo));
  root.querySelectorAll("[data-note]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openNote(b.dataset.note);
    })
  );
  root.querySelectorAll("[data-site]").forEach((b) => b.addEventListener("click", () => (location.hash = "#/site/" + encodeURIComponent(b.dataset.site))));
  root.querySelectorAll("[data-person]").forEach((b) => b.addEventListener("click", () => (location.hash = "#/person/" + encodeURIComponent(b.dataset.person))));
  root.querySelectorAll("img[data-full]").forEach((img) => img.addEventListener("click", () => openLightbox(img.src)));
  fillPhotos(root);
}

function noData() {
  return !data.source;
}
function noDataView() {
  return emptyBox(
    "報告フォルダを選びましょう",
    "現場ナビから Box に届いた報告（JSONと写真）が入っているフォルダを、Box Drive の中から選びます。<br>読むだけで、どこにも送りません。",
    true
  );
}

/* ---------- ホーム ---------- */
let homeFilter = "all";
function renderHome() {
  const main = $("main");
  let html =
    `<section class="hero"><img src="art/hero-sky.webp" class="heroSky" alt=""><img src="art/hero-frame.webp" class="heroArt" alt=""><img src="art/hero-icons.webp" class="heroIcons" alt="">` +
    `<h1 class="heroTitle">現場の声に、<br>すぐに気づき、支える。</h1>` +
    `<p class="heroSub">現場からの疑問・気づき・相談をいち早く確認し、<br>必要なサポートにつなげましょう。</p></section>`;
  if (noData()) {
    main.innerHTML = html + (dirHandle ? emptyBox("前回のフォルダを開きます", "ボタンを押すと、前回選んだ報告フォルダを読み込みます。", false).replace("</div></div>", `</div><div class="btnRow"><button class="btn btnPrimary" data-act="reopen">${icon("folder", 18)}読み込む</button><button class="btn btnOutline" data-act="pick">別のフォルダを選ぶ</button></div></div>`) : noDataView());
    bindCommon(main);
    return;
  }
  const open = openQuestions().sort((a, b) => (a.at < b.at ? 1 : -1));
  const recent = [...data.notes.values()].filter((n) => noteStatus(n) !== "resolved").sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 5);
  html +=
    `<div class="homeTop"><div class="bigCard"><div class="bigIcon">${icon("chat", 40, 1.8)}</div><div><div class="bigLabel">未回答の疑問</div>` +
    `<div class="bigNum"><b>${open.length}</b>件</div></div><a class="btn btnOutline bigBtn" href="#/notes?st=open">すべての疑問を確認${icon("chevron", 16)}</a></div>` +
    `<div class="card newCard"><div class="cardHead"><h2>新着の疑問・気づき<span class="sub">（未回答 ${open.length}件）</span></h2><a href="#/notes" class="moreLink">すべて見る${icon("chevron", 16)}</a></div>` +
    (recent.length
      ? `<div class="newList">${recent
          .map((n) => `<button class="newRow" data-note="${esc(n.id)}">${typeBadge(n.type)}<span class="newSite">${esc(n.siteName)}</span><span class="newText">${esc(headline(n.text))}</span><span class="newAgo">${relTime(n.at)}</span></button>`)
          .join("")}</div>`
      : `<div class="emptyText pad">対応待ちのメモはありません。</div>`) +
    `</div></div>`;

  const people = [...data.people.values()].map((p) => ({ p, st: personStats(p) }));
  const hit = (x, k) => k === "all" || (k === "need" ? x.st.open > 0 : k === "late" ? x.st.late : x.st.state === "ok");
  const cnt = Object.fromEntries(["all", "need", "late", "ok"].map((k) => [k, people.filter((x) => hit(x, k)).length]));
  const chips = [["all", "すべて"], ["need", "未回答の疑問あり"], ["late", "報告の遅れあり"], ["ok", "順調"]];
  html +=
    `<div class="secHead"><div><h2>担当者の状況</h2><div class="sub">各担当者の報告状況と、対応が必要な内容を確認できます。</div></div>` +
    `<div class="chips">${chips.map(([k, l]) => `<button class="chip${homeFilter === k ? " on" : ""}" data-hf="${k}">${l}<span class="chipNum ${k}">${cnt[k]}</span></button>`).join("")}</div></div>`;
  const order = { need: 0, late: 1, ok: 2 };
  const shown = people
    .filter((x) => hit(x, homeFilter))
    .filter((x) => matchesQuery(x.p.name, ...[...x.p.sites].map((k) => data.sites.get(k).name)))
    .sort((a, b) => order[a.st.state] - order[b.st.state] || (b.st.open - a.st.open));
  html += shown.length ? `<div class="personGrid">${shown.map(personCard).join("")}</div>` : `<div class="emptyText pad">該当する担当者はいません。</div>`;
  main.innerHTML = html;
  main.querySelectorAll("[data-hf]").forEach((b) =>
    b.addEventListener("click", () => {
      homeFilter = b.dataset.hf;
      renderHome();
    })
  );
  bindCommon(main);
}

function personCard({ p, st }) {
  const sites = [...p.sites].map((k) => data.sites.get(k));
  const ps = PERSON_STATE[st.state];
  return (
    `<button class="personCard" data-person="${esc(p.key)}"><div class="pcHead">${avatar(p.name)}<div class="pcName"><div><b>${esc(p.name)}</b><span class="stBadge ${ps.cls}">${ps.label}</span></div>` +
    `<div class="pcSites">担当現場${sites.map((s) => `<span class="tag">${esc(s.name)}</span>`).join("")}</div></div>${icon("chevron", 20)}</div>` +
    `<div class="pcStats"><div class="stat${st.open ? " alert" : ""}"><span class="statLabel">${icon("chat", 16)}未回答の疑問</span><span><b>${st.open}</b>件</span></div>` +
    `<div class="stat"><span class="statLabel">${icon("photo", 16)}今週の写真</span><span><b>${st.weekPhotos}</b>枚</span></div>` +
    `<div class="stat"><span class="statLabel">${icon("calendar", 16)}最終報告</span><span class="lastRep">${st.last ? fmtMD(st.last.sent_at) : "－"}</span>` +
    `<span class="ago${st.lastDays != null && st.lastDays >= LATE_DAYS - 1 ? " late" : ""}">${st.last ? agoLabel(st.last.sent_at) : ""}</span></div></div></button>`
  );
}

/* ---------- 疑問・気づき一覧 ---------- */
const noteFilter = { type: "all", status: "all", q: "", sort: "new" };
function renderNotes(params) {
  const main = $("main");
  if (params.get("st")) noteFilter.status = params.get("st");
  let html =
    `<section class="pageHead withArt"><img src="art/site-bg.webp" class="pageBg" alt=""><img src="art/character.webp" class="pageArt" alt=""><h1>疑問・気づき一覧</h1><p class="sub">現場からの疑問・気づき・職人さんの要望を、新しい順に確認できます。早めの対応で、現場をスムーズに進めましょう。</p></section>`;
  if (noData()) {
    main.innerHTML = html + noDataView();
    bindCommon(main);
    return;
  }
  const types = [["all", "すべて"], ["question", "疑問"], ["notice", "気づき"], ["request", "職人さんの要望"]];
  const sts = [["all", "すべて"], ["open", "未回答"], ["replied", "返信済み"], ["resolved", "解決済み"]];
  html +=
    `<div class="card filterCard"><div class="filterRow"><span class="fLabel">種類</span>${types
      .map(([k, l]) => `<button class="chip${noteFilter.type === k ? " on" : ""} t-${k}" data-ft="${k}">${k !== "all" ? icon(NOTE_TYPES[k].icon, 16) : ""}${l}</button>`)
      .join("")}<span class="fSep"></span><span class="fLabel">状態</span>${sts
      .map(([k, l]) => `<button class="chip${noteFilter.status === k ? " on" : ""}" data-fs="${k}">${l}</button>`)
      .join("")}</div>` +
    `<div class="filterRow"><label class="searchField">${icon("search", 18)}<input id="noteQ" type="search" placeholder="キーワードで検索（本文・現場名・監督名など）" value="${esc(noteFilter.q)}"></label>` +
    `<select id="noteSort" class="select"><option value="new">新しい順</option><option value="old">古い順</option></select></div></div>`;
  const q = noteFilter.q.trim().toLowerCase();
  const list = [...data.notes.values()]
    .filter((n) => noteFilter.type === "all" || n.type === noteFilter.type)
    .filter((n) => noteFilter.status === "all" || noteStatus(n) === noteFilter.status)
    .filter((n) => !q || [n.text, n.siteName, n.personName, n.item, n.process].some((f) => String(f || "").toLowerCase().includes(q)))
    .filter((n) => matchesQuery(n.siteName, n.personName))
    .sort((a, b) => (noteFilter.sort === "new" ? (a.at < b.at ? 1 : -1) : a.at < b.at ? -1 : 1));
  html += list.length ? `<div class="noteList">${list.map(noteRow).join("")}</div>` : `<div class="emptyText pad">該当するメモはありません。</div>`;
  main.innerHTML = html;
  $("noteSort").value = noteFilter.sort;
  main.querySelectorAll("[data-ft]").forEach((b) => b.addEventListener("click", () => ((noteFilter.type = b.dataset.ft), renderNotes(new URLSearchParams()))));
  main.querySelectorAll("[data-fs]").forEach((b) => b.addEventListener("click", () => ((noteFilter.status = b.dataset.fs), renderNotes(new URLSearchParams()))));
  $("noteSort").addEventListener("change", (e) => ((noteFilter.sort = e.target.value), renderNotes(new URLSearchParams())));
  $("noteQ").addEventListener("input", (e) => {
    noteFilter.q = e.target.value;
    clearTimeout(renderNotes.t);
    renderNotes.t = setTimeout(() => {
      renderNotes(new URLSearchParams());
      const inp = $("noteQ");
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }, 250);
  });
  bindCommon(main);
}

function noteRow(n) {
  const st = noteStatus(n);
  const t = NOTE_TYPES[n.type] || NOTE_TYPES.notice;
  const rest = restText(n.text);
  return (
    `<div class="noteRow ${st === "open" ? "open" : ""} ${t.cls}"><div class="noteIcon ${t.cls}">${icon(t.icon, 26, 1.8)}</div>` +
    `<div class="noteMain"><div class="noteBadges">${typeBadge(n.type)}${statusBadge(n)}</div><div class="noteTitle">${esc(headline(n.text))}</div>` +
    (rest ? `<div class="noteBody">${esc(rest)}</div>` : "") +
    `</div><div class="noteMeta"><div>${icon("user", 16)}${esc(n.personName)}</div><div>${icon("building", 16)}${esc(n.siteName)}</div>` +
    `<div>${icon("list", 16)}${esc(shortProc(n.process))} › ${esc(n.item || "")}</div><div>${icon("clock", 16)}${fmtDateTime(n.at)}</div></div>` +
    `<button class="btn ${st === "open" ? "btnPrimary" : "btnOutline"} replyBtn" data-note="${esc(n.id)}">${icon("chat", 18)}${st === "open" || st === "" ? "返信を書く" : "返信を見る"}${icon("chevron", 16)}</button></div>`
  );
}
function shortProc(p) {
  const m = String(p || "").match(/（(.+)）/);
  return m ? m[1] : p || "";
}

/* ---------- 返信パネル ---------- */
let drawerNoteId = null;
function openNote(id) {
  const n = data.notes.get(id);
  if (!n) return;
  drawerNoteId = id;
  const st = noteStatus(n);
  const replies = data.replies.get(id) || [];
  // 同じ現場・同じ項目の品質写真（いちばん新しい報告のものから）
  const site = data.sites.get(n.siteKey);
  const photos = [];
  (site ? site.reports : []).forEach((r) =>
    (r.photos || []).forEach((p) => {
      if (p.kind === "record" && n.itemId && p.item_id === n.itemId && !photos.some((x) => x.file === p.file)) photos.push(p);
    })
  );
  const body = $("drawerBody");
  body.innerHTML =
    `<div class="card origCard"><div class="origHead">${icon("chat", 22)}<span>元の投稿内容</span>${typeBadge(n.type)}${statusBadge(n)}</div>` +
    `<div class="origTitle">${esc(headline(n.text))}</div>` +
    `<dl class="origMeta"><dt>${icon("user", 16)}監督名</dt><dd>${esc(n.personName)}</dd><dt>${icon("building", 16)}現場名</dt><dd>${esc(n.siteName)}</dd>` +
    `<dt>${icon("list", 16)}工程・項目</dt><dd>${esc(shortProc(n.process))} › ${esc(n.item || "")}</dd><dt>${icon("clock", 16)}投稿日</dt><dd>${fmtDateTime(n.at)}</dd></dl>` +
    `<div class="origText">${esc(n.text)}</div>` +
    (photos.length
      ? `<div class="origPhotosLabel">同じ項目の品質写真</div><div class="origPhotos">${photos
          .slice(0, 8)
          .map((p) => `<span class="thumb"><img data-photo="${esc(p.file)}" data-full="1" alt="" title="${esc(p.check || "")}"></span>`)
          .join("")}</div>`
      : "") +
    (st === "resolved" ? `<div class="resolvedNote">${icon("check", 18)}${esc(n.resolvedBy || n.personName)} さんが ${fmtDateTime(n.resolvedAt)} に解決済みにしました</div>` : "") +
    `</div>` +
    (replies.length
      ? `<div class="card"><div class="origHead">${icon("reply", 20)}<span>これまでの返信</span></div>${replies
          .map((r) => `<div class="pastReply"><div class="prMeta"><b>${esc(r.from)}</b>　${fmtDateTime(r.at)}</div><div class="prText">${esc(r.text)}</div></div>`)
          .join("")}</div>`
      : "") +
    `<div class="card"><div class="origHead">${icon("save", 20)}<span>返信内容</span></div>` +
    `<textarea id="replyText" class="replyText" maxlength="1000" placeholder="${esc(n.personName || "監督")}さんへの返信を入力してください。&#10;現場の状況に寄り添った、わかりやすい内容を心がけましょう。"></textarea>` +
    `<div class="replyCount"><span id="replyCount">0</span> / 1000</div></div>`;
  $("drawerFoot").innerHTML =
    `<button id="draftBtn" class="btn btnOutline">${icon("save", 18)}下書き保存</button><button id="sendBtn" class="btn btnPrimary">${icon("send", 18)}送る</button>`;
  const ta = $("replyText");
  ta.value = getDrafts()[id] || "";
  const upd = () => ($("replyCount").textContent = ta.value.length);
  upd();
  ta.addEventListener("input", upd);
  $("draftBtn").addEventListener("click", () => {
    setDraft(id, ta.value.trim());
    toast(ta.value.trim() ? "下書きを保存しました" : "下書きを消しました");
  });
  $("sendBtn").addEventListener("click", async () => {
    const text = ta.value.trim();
    if (!text) {
      toast("返信の内容を入力してください");
      ta.focus();
      return;
    }
    $("sendBtn").disabled = true;
    const ok = await sendReply(n, text);
    $("sendBtn").disabled = false;
    if (!ok) return;
    setDraft(id, "");
    updateNavBadge();
    route();
    openNote(id);
  });
  bindCommon(body);
  $("drawer").hidden = false;
  setTimeout(() => ta.focus(), 50);
}
function closeDrawer() {
  $("drawer").hidden = true;
  drawerNoteId = null;
}

/* ---------- 監督・現場 ---------- */
function renderSites() {
  const main = $("main");
  let html = `<section class="pageHead"><h1>監督・現場</h1><p class="sub">担当者ごとの現場と、最後の報告を確認できます。現場を選ぶと、週ごとの報告と工程の進み具合が見られます。</p></section>`;
  if (noData()) {
    main.innerHTML = html + noDataView();
    bindCommon(main);
    return;
  }
  const people = [...data.people.values()].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  html += people
    .filter((p) => matchesQuery(p.name, ...[...p.sites].map((k) => data.sites.get(k).name)))
    .map((p) => {
      const st = personStats(p);
      const ps = PERSON_STATE[st.state];
      const sites = [...p.sites].map((k) => data.sites.get(k));
      return (
        `<div class="card personBlock"><button class="pbHead" data-person="${esc(p.key)}">${avatar(p.name, 44)}<b>${esc(p.name)}</b><span class="stBadge ${ps.cls}">${ps.label}</span>` +
        `<span class="pbMeta">未回答の疑問 ${st.open}件・最終報告 ${st.last ? fmtMD(st.last.sent_at) : "－"}</span>${icon("chevron", 18)}</button>` +
        `<div class="siteRows">${sites
          .map((s) => {
            const last = s.reports[0];
            const open = [...data.notes.values()].filter((n) => n.siteKey === s.key && noteStatus(n) === "open").length;
            return `<button class="siteRow" data-site="${esc(s.key)}">${icon("building", 18)}<b>${esc(s.name)}</b><span>報告 ${s.reports.length}回</span><span>最終 ${last ? fmtMD(last.period.end) + "まで" : "－"}</span>${open ? `<span class="sBadge open">未回答 ${open}</span>` : "<span></span>"}${icon("chevron", 16)}</button>`;
          })
          .join("")}</div></div>`
      );
    })
    .join("");
  main.innerHTML = html;
  bindCommon(main);
}

function renderPerson(key) {
  const p = data.people.get(key);
  if (!p) return renderSites();
  const sites = [...p.sites];
  if (sites.length === 1) return renderSite(sites[0], true);
  renderSites();
  const el = [...document.querySelectorAll(".pbHead")].find((b) => b.dataset.person === key);
  if (el) el.closest(".personBlock").scrollIntoView({ block: "start" });
}

const GROUP_ART = { 基礎: "g1", 上棟: "g2", 外装: "g3", 内装: "g4", 設備: "g5", 引渡し: "g6" };
function renderSite(key) {
  const main = $("main");
  const s = data.sites.get(key);
  if (noData() || !s) return renderSites();
  const p = data.people.get(s.personKey);
  const last = s.reports[0];
  const open = [...data.notes.values()].filter((n) => n.siteKey === key && noteStatus(n) === "open");
  const prog = (s.reports.find((r) => r.progress) || {}).progress || null;
  const curGroup = prog ? (prog.find((g) => g.checks_total && g.checks_done < g.checks_total && g.checks_done > 0) || {}).group : "";
  let html =
    `<section class="hero small"><img src="art/site-bg.webp" class="siteBg" alt="">` +
    `<div class="crumbs"><a href="#/sites">監督・現場</a>›<a href="#/person/${encodeURIComponent(s.personKey)}">${esc(s.personName)}</a>›<b>${esc(s.name)}</b></div>` +
    `<h1 class="heroTitle">${esc(s.name)}の報告</h1>` +
    `<p class="heroSub">${curGroup ? `現在、${esc(curGroup)}の工程を進めています。` : ""}現場の状況や報告を確認し、<br>必要なサポートやフォローを行いましょう。</p></section>`;
  html +=
    `<div class="card siteSummary"><div class="ssCell">${avatar(s.personName, 56)}<div><div class="ssLabel">担当監督</div><div class="ssValue">${esc(s.personName)}</div>` +
    `<div class="ssSub"><span class="tag">担当現場 ${p ? p.sites.size : 1}件</span></div></div></div>` +
    `<div class="ssCell">${icon("calendar", 28)}<div><div class="ssLabel">最新の報告期間</div><div class="ssValue">${last ? `${fmtMD(last.period.start)} 〜 ${fmtMD(last.period.end)}` : "－"}</div>` +
    `<div class="ssSub">${last ? `${agoLabel(last.sent_at)}に届きました` : ""}</div></div></div>` +
    `<button class="ssCell ssAlert${open.length ? "" : " zero"}" ${open.length ? `data-note="${esc(open[0].id)}"` : ""}>${icon("chat", 30)}<div><div class="ssLabel">未回答の疑問</div><div class="ssValue big"><b>${open.length}</b>件</div></div>${open.length ? icon("chevron", 18) : ""}</button></div>`;

  html += `<div class="secHead"><div><h2>工程の進捗</h2><div class="sub">6つの工程のチェックの進み具合と、品質写真の撮影状況です（最新の報告の時点）。</div></div></div>`;
  html += prog
    ? `<div class="progRow">${prog
        .map((g) => {
          const pc = g.checks_total ? Math.round((g.checks_done / g.checks_total) * 100) : 0;
          const pp = g.photos_total ? Math.round((g.photos_done / g.photos_total) * 100) : 0;
          const state = g.checks_total && g.checks_done >= g.checks_total ? ["done", "完了"] : g.checks_done ? ["doing", "進行中"] : ["todo", "未着手"];
          return (
            `<div class="progCard"><div class="pgHead"><img src="art/${GROUP_ART[g.group] || "g1"}.webp" alt=""><b>${esc(g.group)}</b></div>` +
            `<div class="pgBar"><span style="width:${pc}%"></span></div><div class="pgNum">チェック ${pc}%<small>${g.checks_done}/${g.checks_total}</small></div>` +
            `<div class="pgBar photo"><span style="width:${pp}%"></span></div><div class="pgNum">品質写真 ${pp}%<small>${g.photos_done}/${g.photos_total}</small></div>` +
            `<div class="pgState ${state[0]}">${state[1]}</div></div>`
          );
        })
        .join("")}</div>`
    : `<div class="emptyText pad card">進み具合は、現場ナビを新しい版にしてから届いた報告から表示されます。</div>`;

  html += `<div class="secHead"><div><h2>週ごとの報告</h2><div class="sub">現場からの報告を新しい順に表示しています。</div></div></div><div class="timeline">`;
  html += s.reports
    .map((r, i) => {
      const photos = r.photos || [];
      const rep = photos.filter((x) => x.kind !== "record");
      const rec = photos.filter((x) => x.kind === "record");
      const checked = (r.checks || []).reduce((t, c) => t + (c.checked || []).length, 0);
      const notes = (r.checks || []).flatMap((c) => (c.notes || []).map((n) => ({ n, c })));
      const thumbs = photos.slice(0, 4);
      return (
        `<div class="tlItem"><div class="tlDot"></div><div class="card tlCard"><div class="tlDate"><b>${fmtMD(r.period.start)} 〜<br>${fmtMD(r.period.end)}</b>` +
        (i === 0 && daysAgo(r.sent_at) <= 6 ? `<span class="tag wood">今週</span>` : "") +
        `<span class="mutedText">${agoLabel(r.sent_at)}</span></div>` +
        `<div class="tlPhotos"><div class="thumbs">${thumbs
          .map((x, k) => `<span class="thumb${k === 3 && photos.length > 4 ? " more" : ""}" ${k === 3 && photos.length > 4 ? `data-more="+${photos.length - 3}枚"` : ""}><img data-photo="${esc(x.file)}" data-full="1" alt=""></span>`)
          .join("")}</div><div class="mutedText">報告写真 <b>${rep.length}</b>枚・品質写真 <b>${rec.length}</b>枚</div></div>` +
        `<div class="tlChecks"><div class="tlLabel">チェック</div><div class="tlStat">${icon("check", 18)}期間中に付けたチェック <b>${checked}</b>件</div>` +
        `<div class="tlStat">${icon("camera", 18)}品質写真 <b>${rec.length}</b>枚</div>` +
        `<div class="tlStat">${icon("list", 18)}${esc((r.processes || []).map((x) => shortProc(x.name)).join("・") || "－")}</div>` +
        (r.memo ? `<div class="tlMemo">${esc(r.memo)}</div>` : "") +
        `</div><div class="tlNotes"><div class="tlLabel">気づき・疑問・職人さんの要望</div>${
          notes.length
            ? notes
                .slice(0, 4)
                .map(({ n }) => {
                  const id = n.id || "";
                  return `<button class="tlNote" ${id && data.notes.has(id) ? `data-note="${esc(id)}"` : ""}>${typeBadge(n.type_id || TYPE_BY_LABEL[n.type] || "notice")}<span>${esc(headline(n.text))}</span>${icon("chevron", 16)}</button>`;
                })
                .join("") + (notes.length > 4 ? `<div class="mutedText">ほか ${notes.length - 4}件</div>` : "")
            : `<div class="mutedText">この週のメモはありません</div>`
        }</div></div></div>`
      );
    })
    .join("");
  html += `</div>`;
  main.innerHTML = html;
  bindCommon(main);
}

/* ---------- 設定 ---------- */
function renderSettings() {
  const main = $("main");
  const s = data.source;
  main.innerHTML =
    `<section class="pageHead"><h1>設定</h1></section>` +
    `<div class="card setCard"><h2>あなたの名前</h2><p class="sub">返信に名前が入ります。</p><input id="myName" class="input" placeholder="山郷 太郎" value="${esc(getLS("name"))}"></div>` +
    `<div class="card setCard"><h2>報告フォルダ</h2>` +
    `<p class="sub">現場ナビから Box に届いた報告（JSONと写真）が入っているフォルダを、Box Drive の中から選びます。中のフォルダもまとめて読みます。` +
    `返信は、そのフォルダの中の「${REPLY_DIR}」フォルダに書き出します。</p>` +
    (s ? `<div class="srcNow">${icon(s.demo ? "bulb" : "folder", 18)}<b>${esc(s.name)}</b>　報告 ${s.reports}件${s.photos != null ? `・写真 ${s.photos}枚` : ""}${s.writable === false && !s.demo ? "（読むだけ：返信はダウンロード）" : ""}</div>` : "") +
    `<div class="btnRow"><button class="btn btnPrimary" data-act="pick">${icon("folder", 18)}${s && !s.demo ? "フォルダを選び直す" : "報告フォルダを選ぶ"}</button>` +
    (dirHandle ? `<button class="btn btnOutline" data-act="reopen">${icon("reload", 18)}読み直す</button>` : "") +
    `<button class="btn btnOutline" data-act="demo">サンプルデータで見る</button></div>` +
    (canPickFolder ? "" : `<p class="warn">このブラウザではフォルダに書き込めません。Edge か Chrome で開くと、返信をフォルダに直接書き出せます。</p>`) +
    `</div>` +
    `<div class="card setCard"><h2>アプリとして使う</h2><p class="sub">Edge / Chrome のアドレスバー右端の「アプリをインストール」から入れると、スタートメニューやタスクバーから開けます。</p></div>` +
    `<div class="mutedText">${esc(APP_NAME)} ver.${APP_VERSION}</div>`;
  $("myName").addEventListener("change", (e) => {
    setLS("name", e.target.value.trim());
    toast("名前を保存しました");
  });
  bindCommon(main);
}

/* ---------- 画面の切り替え（#/home など。ブラウザの戻るで前の画面に戻れる） ---------- */
function route() {
  const hash = location.hash || "#/home";
  const [path, qs] = hash.slice(2).split("?");
  const [name, arg] = path.split("/");
  const params = new URLSearchParams(qs || "");
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === (name === "site" || name === "person" ? "sites" : name)));
  if (name === "notes") renderNotes(params);
  else if (name === "sites") renderSites();
  else if (name === "site") renderSite(decodeURIComponent(arg || ""));
  else if (name === "person") renderPerson(decodeURIComponent(arg || ""));
  else if (name === "settings") renderSettings();
  else renderHome();
  if (!$("drawer").hidden && drawerNoteId && !data.notes.has(drawerNoteId)) closeDrawer();
}

async function init() {
  document.title = APP_NAME;
  $("appName").textContent = APP_NAME;
  document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon, 22)));
  $("reloadBtn").innerHTML = icon("reload", 22);
  $("drawerClose").innerHTML = icon("x", 24);
  $("drawerClose").addEventListener("click", closeDrawer);
  document.querySelector(".drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!$("lightbox").hidden) $("lightbox").hidden = true;
      else closeDrawer();
    }
  });
  $("lightbox").addEventListener("click", () => ($("lightbox").hidden = true));
  $("folderInput").addEventListener("change", onFolderInput);
  $("reloadBtn").addEventListener("click", () => (demoMode ? loadDemo() : dirHandle ? reopenFolder() : pickFolder()));
  $("globalSearch").addEventListener("input", () => {
    clearTimeout(init.t);
    init.t = setTimeout(route, 200);
  });
  window.addEventListener("hashchange", route);
  try {
    dirHandle = canPickFolder ? (await kvGet("dir")) || null : null;
  } catch (e) {
    dirHandle = null;
  }
  if (getLS("demo") === "1") return loadDemo();
  // 許可が残っていれば（インストールしたアプリでは残ることが多い）そのまま読む
  if (dirHandle && (await dirHandle.queryPermission({ mode: "readwrite" })) === "granted") return loadFromHandle();
  route();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}
init();
