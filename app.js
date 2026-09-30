"use strict";

// index.htmlのapp.js/style.css読み込み時の?v=番号と合わせて手動更新する
const APP_VERSION = 2;

if ("serviceWorker" in navigator) {
  let swRefreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (swRefreshing) return;
    swRefreshing = true;
    location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

/* ---------- 17分類（マニュアル層） ---------- */
// guide: 撮影ガイドの一言メモ。文面は別途相談して決める（空欄の間は画面に出さない）
const PROCESSES = [
  { id: "p01", no: 1, name: "解体・仮設準備", short: "解体仮設", guide: "" },
  { id: "p02", no: 2, name: "地盤・基礎工事", short: "基礎", guide: "" },
  { id: "p03", no: 3, name: "足場工事", short: "足場", guide: "" },
  { id: "p04", no: 4, name: "大工工事（建方・上棟）", short: "建方上棟", guide: "" },
  { id: "p05", no: 5, name: "大工工事（屋根下地）", short: "屋根下地", guide: "" },
  { id: "p06", no: 6, name: "大工工事（外壁下地・断熱）", short: "外壁下地断熱", guide: "" },
  { id: "p07", no: 7, name: "大工工事（内部下地）", short: "内部下地", guide: "" },
  { id: "p08", no: 8, name: "大工工事（造作・建具）", short: "造作建具", guide: "" },
  { id: "p09", no: 9, name: "屋根仕上げ工事（板金）", short: "屋根板金", guide: "" },
  { id: "p10", no: 10, name: "電気・設備配管工事", short: "電気設備", guide: "" },
  { id: "p11", no: 11, name: "仕上げ：塗装", short: "塗装", guide: "" },
  { id: "p12", no: 12, name: "仕上げ：クロス", short: "クロス", guide: "" },
  { id: "p13", no: 13, name: "仕上げ：床・タイル", short: "床タイル", guide: "" },
  { id: "p14", no: 14, name: "外壁仕上げ", short: "外壁", guide: "" },
  { id: "p15", no: 15, name: "美装・検査", short: "美装検査", guide: "" },
  { id: "p16", no: 16, name: "外構", short: "外構", guide: "" },
  { id: "p17", no: 17, name: "引渡し", short: "引渡し", guide: "" },
];
const PROCESS_MAP = Object.fromEntries(PROCESSES.map((p) => [p.id, p]));
function processOf(id) {
  return PROCESS_MAP[id] || { id, no: 99, name: "（不明な工程）", short: "不明", guide: "" };
}

/* ---------- アイコン ---------- */

function icon(paths, size = 22, width = 2) {
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" aria-hidden="true">` +
    paths +
    "</svg>"
  );
}
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  camera: '<path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><circle cx="12" cy="13" r="3.5"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M8 8h3M8 12h3M8 16h3M3 21h18"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21a2 2 0 0 1 2-2h13v2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/><path d="M11 13l9-9"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
};

/* ---------- 日付 ---------- */

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function todayKey() {
  return toDateKey(new Date());
}
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}
function daysBetween(a, b) {
  return Math.round((keyToDate(b) - keyToDate(a)) / 86400000);
}
function fmtDate(key) {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}
function fmtMMDD(key) {
  return key.slice(5, 7) + key.slice(8, 10);
}

/* ---------- IndexedDB ---------- */

const DB_NAME = "genba-photo";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sites")) db.createObjectStore("sites", { keyPath: "id" });
      if (!db.objectStoreNames.contains("photos")) {
        const s = db.createObjectStore("photos", { keyPath: "id" });
        s.createIndex("siteId", "siteId");
      }
      if (!db.objectStoreNames.contains("reports")) {
        const s = db.createObjectStore("reports", { keyPath: "id" });
        s.createIndex("siteId", "siteId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const dbPromise = openDB();

async function dbGetAll(store, indexName, key) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const os = db.transaction(store, "readonly").objectStore(store);
    const req = indexName ? os.index(indexName).getAll(key) : os.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbGet(store, id) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutMany(store, items) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    items.forEach((it) => os.put(it));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbPut(store, item) {
  return dbPutMany(store, [item]);
}
async function dbDeleteMany(store, ids) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    ids.forEach((id) => os.delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ---------- 現場・報告期間 ---------- */

async function getSites() {
  const sites = await dbGetAll("sites");
  return sites.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

// 未報告（reportIdなし）の写真が「今回の報告」に入る。日付で切るのではなく
// 報告済みにした時点で紐付けるので、期間の境目で写真が漏れることはない
async function getSitePhotos(siteId) {
  return dbGetAll("photos", "siteId", siteId);
}
function unreported(photos) {
  return photos.filter((p) => !p.reportId);
}

// 今回の報告期間の開始日 = 前回報告の終了日の翌日
// （初回は現場登録日。登録日より前の写真を取り込んだ場合はその日付まで遡る）
function periodStart(site, currentPhotos) {
  let start = site.lastReportEnd ? addDays(site.lastReportEnd, 1) : site.createdAt.slice(0, 10);
  currentPhotos.forEach((p) => {
    if (p.dateKey < start) start = p.dateKey;
  });
  return start;
}

function periodLabel(start) {
  const days = daysBetween(start, todayKey()) + 1;
  const weeks = Math.ceil(days / 7);
  return { text: `${fmtDate(start)}〜今日`, weeks };
}

/* ---------- 画像処理 ---------- */

function downscaleImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// JPEGのEXIFから撮影日時(DateTimeOriginal、なければDateTime)を読む。
// 縮小するとEXIFは消えるので、縮小前の元ファイルから読む必要がある
async function readExifDate(file) {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off);
      const size = v.getUint16(off + 2);
      if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) {
        return parseTiffDate(v, off + 10);
      }
      if ((marker & 0xff00) !== 0xff00) return null;
      off += 2 + size;
    }
  } catch (e) {
    /* 読めなければ撮影日不明として扱う */
  }
  return null;
}
function parseTiffDate(v, tiff) {
  const le = v.getUint16(tiff) === 0x4949;
  const u16 = (o) => v.getUint16(o, le);
  const u32 = (o) => v.getUint32(o, le);
  const readIfd = (ifdOff) => {
    const entries = {};
    const n = u16(tiff + ifdOff);
    for (let i = 0; i < n; i++) {
      const e = tiff + ifdOff + 2 + i * 12;
      entries[u16(e)] = { count: u32(e + 4), value: u32(e + 8) };
    }
    return entries;
  };
  const readAscii = (entry) => {
    let s = "";
    for (let i = 0; i < entry.count - 1; i++) s += String.fromCharCode(v.getUint8(tiff + entry.value + i));
    return s;
  };
  const ifd0 = readIfd(u32(tiff + 4));
  let str = null;
  if (ifd0[0x8769]) {
    const exif = readIfd(ifd0[0x8769].value);
    if (exif[0x9003]) str = readAscii(exif[0x9003]);
  }
  if (!str && ifd0[0x0132]) str = readAscii(ifd0[0x0132]);
  const m = str && str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

async function makePhotoRecord(file, siteId, processId, takenAt) {
  const blob = await downscaleImage(file, 1600, 0.82);
  const thumb = await downscaleImage(blob, 360, 0.7);
  return {
    id: newId(),
    siteId,
    processId,
    takenAt: takenAt.toISOString(),
    dateKey: toDateKey(takenAt),
    blob,
    thumb,
    reportId: null,
  };
}

/* ---------- 画面の共通部品 ---------- */

const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 画面ごとに作ったサムネイルURLを、次に描き直すときにまとめて解放する
const urlBuckets = {};
function blobUrl(bucket, blob) {
  const url = URL.createObjectURL(blob);
  (urlBuckets[bucket] = urlBuckets[bucket] || []).push(url);
  return url;
}
function releaseUrls(bucket) {
  (urlBuckets[bucket] || []).forEach((u) => URL.revokeObjectURL(u));
  urlBuckets[bucket] = [];
}

const VIEW_TABS = {
  manualView: "manual",
  manualCatView: "manual",
  manualItemView: "manual",
  homeView: "photos",
  siteView: "photos",
  shotView: "photos",
  summaryView: "photos",
  settingsView: "settings",
};
function showView(id) {
  Object.keys(VIEW_TABS).forEach((v) => ($(v).hidden = v !== id));
  $("tabBar").hidden = id === "shotView";
  const tab = VIEW_TABS[id];
  document.querySelectorAll(".tabBtn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  window.scrollTo(0, 0);
}

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2400);
}

function setProcessing(on, text = "写真を保存中...") {
  $("processingText").textContent = text;
  $("processing").hidden = !on;
}

// 汎用ボトムシート。buildBody(bodyEl, close) で中身を組み立てる
function openSheet(title, buildBody) {
  $("sheetTitle").textContent = title;
  const body = $("sheetBody");
  body.innerHTML = "";
  $("sheet").hidden = false;
  const close = () => ($("sheet").hidden = true);
  buildBody(body, close);
}
function sheetButton(label, cls, onClick) {
  const b = document.createElement("button");
  b.className = `btn ${cls}`;
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
function askText(title, initial, okLabel) {
  return new Promise((resolve) => {
    openSheet(title, (body, close) => {
      const input = document.createElement("input");
      input.className = "sheetInput";
      input.value = initial || "";
      input.placeholder = "例：山田様邸 新築";
      body.appendChild(input);
      const submit = () => {
        const v = input.value.trim();
        if (!v) {
          input.focus();
          return;
        }
        close();
        resolve(v);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.isComposing) submit();
      });
      body.appendChild(sheetButton(okLabel, "btnPrimary", submit));
      body.appendChild(sheetButton("キャンセル", "btnSecondary", () => (close(), resolve(null))));
      setTimeout(() => input.focus(), 50);
    });
  });
}

function openLightbox(blob) {
  const url = URL.createObjectURL(blob);
  $("lightboxImg").src = url;
  $("lightbox").hidden = false;
  $("lightbox").onclick = () => {
    $("lightbox").hidden = true;
    $("lightboxImg").removeAttribute("src");
    URL.revokeObjectURL(url);
  };
}

/* ---------- ① ホーム ---------- */

let showArchived = false;

async function renderHome() {
  const sites = await getSites();
  const active = sites.filter((s) => !s.archived);
  const archived = sites.filter((s) => s.archived);
  const list = $("siteList");
  list.innerHTML = "";
  const weekday = new Date().getDay();
  const isReportDay = weekday === 5 || weekday === 6;

  for (const site of active) {
    const current = unreported(await getSitePhotos(site.id));
    const start = periodStart(site, current);
    const { text, weeks } = periodLabel(start);
    const due = isReportDay && current.length > 0;
    const card = document.createElement("button");
    card.className = "siteCard" + (due ? " isDue" : "");
    const badge = due
      ? '<span class="badge badgeWarning">報告日</span>'
      : weeks >= 2
      ? `<span class="badge badgeMuted">${weeks}週分</span>`
      : "";
    const procNames = site.processes.map((id) => processOf(id).name).join(" / ");
    card.innerHTML =
      `<div class="siteCardHead"><span class="siteName">${esc(site.name)}</span>${badge}</div>` +
      `<div class="siteMeta">今回 ${text} ・ 写真 ${current.length}枚</div>` +
      (procNames ? `<div class="siteMeta">工程：${esc(procNames)}</div>` : "");
    card.addEventListener("click", () => openSite(site.id));
    list.appendChild(card);
  }
  $("siteEmpty").hidden = active.length > 0;

  const toggle = $("toggleArchivedBtn");
  toggle.hidden = archived.length === 0;
  toggle.textContent = showArchived ? "完了した現場を隠す" : `完了した現場（${archived.length}）を表示`;
  const alist = $("archivedList");
  alist.hidden = !showArchived || archived.length === 0;
  alist.innerHTML = "";
  archived.forEach((site) => {
    const card = document.createElement("button");
    card.className = "siteCard";
    card.innerHTML = `<div class="siteCardHead"><span class="siteName">${esc(site.name)}</span><span class="badge badgeMuted">完了</span></div>`;
    card.addEventListener("click", () => openSite(site.id));
    alist.appendChild(card);
  });
}

async function addSite() {
  const name = await askText("現場を追加", "", "登録する");
  if (!name) return;
  const site = { id: newId(), name, createdAt: new Date().toISOString(), archived: false, processes: [], lastReportEnd: null };
  await dbPut("sites", site);
  openSite(site.id);
}

/* ---------- ② 現場画面 ---------- */

let currentSiteId = null;

async function openSite(siteId) {
  currentSiteId = siteId;
  await renderSite();
  showView("siteView");
}

async function renderSite() {
  const site = await dbGet("sites", currentSiteId);
  if (!site) return goHome();
  const photos = await getSitePhotos(site.id);
  const current = unreported(photos);
  $("siteTitle").textContent = site.name;
  $("sitePeriod").textContent = periodLabel(periodStart(site, current)).text;

  const cards = $("processCards");
  cards.innerHTML = "";
  if (site.processes.length === 0) {
    cards.innerHTML = '<div class="hint">今回実施した工程を「工程を追加」から選んでください。</div>';
  }
  site.processes.forEach((pid) => {
    const p = processOf(pid);
    const count = current.filter((ph) => ph.processId === pid).length;
    const card = document.createElement("div");
    card.className = "processCard";
    card.innerHTML =
      `<div class="processHead"><span class="processName"><span class="processNo">${p.no}</span>${esc(p.name)}</span>` +
      `<span class="processCount">${count}枚</span>` +
      `<button class="iconBtn removeProcessBtn" aria-label="この工程を外す">${icon(ICONS.x, 18)}</button></div>` +
      (p.guide ? `<div class="processGuide">撮影メモ：${esc(p.guide)}</div>` : "") +
      `<div class="processActions">` +
      `<button class="btn btnPrimary shootBtn">${icon(ICONS.camera)}撮影</button>` +
      `<button class="btn btnSecondary libraryBtn" aria-label="写真ライブラリから取り込む">${icon(ICONS.photo)}</button>` +
      `</div>`;
    card.querySelector(".shootBtn").addEventListener("click", () => startCamera(pid));
    card.querySelector(".libraryBtn").addEventListener("click", () => startLibrary(pid));
    card.querySelector(".removeProcessBtn").addEventListener("click", () => removeProcess(pid, count));
    cards.appendChild(card);
  });

  $("summaryBtn").textContent = `報告をまとめる（${current.length}枚）`;

  const reports = (await dbGetAll("reports", "siteId", site.id)).sort((a, b) => (a.end < b.end ? 1 : -1));
  const past = $("pastReports");
  past.innerHTML = reports.length ? '<div class="sectionLabel">過去の報告</div>' : "";
  reports.forEach((r) => {
    const n = photos.filter((ph) => ph.reportId === r.id).length;
    const row = document.createElement("button");
    row.className = "pastReportRow";
    row.innerHTML = `<span>${fmtDate(r.start)}〜${fmtDate(r.end)}</span><span class="mutedText">${n ? n + "枚" : "写真削除済み"}</span>`;
    row.addEventListener("click", () => openSummary(r.id));
    past.appendChild(row);
  });
}

async function openProcessPicker() {
  const site = await dbGet("sites", currentSiteId);
  const picked = new Set(site.processes);
  openSheet("今回の工程を選ぶ（複数可）", (body, close) => {
    PROCESSES.forEach((p) => {
      const b = document.createElement("button");
      b.className = "pickItem" + (picked.has(p.id) ? " picked" : "");
      b.innerHTML = `<span><span class="processNo">${p.no}</span>${esc(p.name)}</span><span class="pickMark">${picked.has(p.id) ? icon(ICONS.check, 20) : ""}</span>`;
      b.addEventListener("click", () => {
        if (picked.has(p.id)) picked.delete(p.id);
        else picked.add(p.id);
        b.classList.toggle("picked", picked.has(p.id));
        b.querySelector(".pickMark").innerHTML = picked.has(p.id) ? icon(ICONS.check, 20) : "";
      });
      body.appendChild(b);
    });
    body.appendChild(
      sheetButton("決定", "btnPrimary btnLarge", async () => {
        site.processes = PROCESSES.filter((p) => picked.has(p.id)).map((p) => p.id);
        await dbPut("sites", site);
        close();
        renderSite();
      })
    );
  });
}

async function removeProcess(pid, count) {
  const p = processOf(pid);
  const msg = count
    ? `「${p.name}」を今回の工程から外しますか？\n撮影済みの${count}枚は消えず、報告まとめには残ります。`
    : `「${p.name}」を今回の工程から外しますか？`;
  if (!confirm(msg)) return;
  const site = await dbGet("sites", currentSiteId);
  site.processes = site.processes.filter((id) => id !== pid);
  await dbPut("sites", site);
  renderSite();
}

async function openSiteMenu() {
  const site = await dbGet("sites", currentSiteId);
  openSheet(site.name, (body, close) => {
    body.appendChild(
      sheetButton("現場名を変更", "btnSecondary", async () => {
        close();
        const name = await askText("現場名を変更", site.name, "変更する");
        if (!name) return;
        site.name = name;
        await dbPut("sites", site);
        renderSite();
      })
    );
    body.appendChild(
      sheetButton(site.archived ? "進行中に戻す" : "完了した現場にする", "btnSecondary", async () => {
        site.archived = !site.archived;
        await dbPut("sites", site);
        close();
        toast(site.archived ? "完了した現場に移しました" : "進行中に戻しました");
        renderSite();
      })
    );
    body.appendChild(
      sheetButton("現場を削除（写真もすべて削除）", "btnDanger", async () => {
        const photos = await getSitePhotos(site.id);
        if (!confirm(`「${site.name}」と写真${photos.length}枚をすべて削除します。元に戻せません。よろしいですか？`)) return;
        const reports = await dbGetAll("reports", "siteId", site.id);
        await dbDeleteMany("photos", photos.map((p) => p.id));
        await dbDeleteMany("reports", reports.map((r) => r.id));
        await dbDeleteMany("sites", [site.id]);
        close();
        goHome();
      })
    );
    body.appendChild(sheetButton("閉じる", "btnSecondary", close));
  });
}

/* ---------- ③ 撮影 ---------- */

let shootProcessId = null;
let lastShotId = null;
let libraryProcessId = null;

function startCamera(pid) {
  shootProcessId = pid;
  $("cameraInput").click();
}

function startLibrary(pid) {
  libraryProcessId = pid;
  $("libraryInput").click();
}

async function onCameraPicked() {
  const input = $("cameraInput");
  const file = input.files[0];
  input.value = "";
  if (!file || !shootProcessId || !currentSiteId) return;
  setProcessing(true);
  try {
    const rec = await makePhotoRecord(file, currentSiteId, shootProcessId, new Date());
    await dbPut("photos", rec);
    lastShotId = rec.id;
    await renderShot(rec);
    showView("shotView");
  } catch (e) {
    console.error(e);
    alert("写真を保存できませんでした。もう一度撮影してください。");
  } finally {
    setProcessing(false);
  }
}

async function renderShot(rec) {
  releaseUrls("shot");
  const p = processOf(shootProcessId);
  $("shotTitle").textContent = p.name;
  const current = unreported(await getSitePhotos(currentSiteId))
    .filter((ph) => ph.processId === shootProcessId)
    .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
  if (rec) {
    $("shotPreview").src = blobUrl("shot", rec.blob);
    $("shotStatus").textContent = `保存しました（この工程 ${current.length}枚目）`;
  } else {
    $("shotPreview").removeAttribute("src");
    $("shotStatus").textContent = `取り消しました（この工程 ${current.length}枚）`;
  }
  $("shotUndoBtn").hidden = !rec;
  $("shotStrip").innerHTML = current
    .slice(0, 12)
    .map((ph) => `<img src="${blobUrl("shot", ph.thumb)}" alt="">`)
    .join("");
}

async function undoLastShot() {
  if (!lastShotId) return;
  await dbDeleteMany("photos", [lastShotId]);
  lastShotId = null;
  await renderShot(null);
}

async function pickOtherProcess() {
  const site = await dbGet("sites", currentSiteId);
  openSheet("どの工程を撮りますか", (body, close) => {
    site.processes.forEach((pid) => {
      const p = processOf(pid);
      const b = document.createElement("button");
      b.className = "pickItem" + (pid === shootProcessId ? " picked" : "");
      b.innerHTML = `<span><span class="processNo">${p.no}</span>${esc(p.name)}</span>${icon(ICONS.camera, 20)}`;
      b.addEventListener("click", () => {
        close();
        startCamera(pid);
      });
      body.appendChild(b);
    });
    body.appendChild(
      sheetButton("工程を追加する", "btnDashed", () => {
        close();
        leaveShot();
        openProcessPicker();
      })
    );
  });
}

function leaveShot() {
  releaseUrls("shot");
  lastShotId = null;
  renderSite();
  showView("siteView");
}

async function onLibraryPicked() {
  const input = $("libraryInput");
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length || !libraryProcessId || !currentSiteId) return;
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    setProcessing(true, `取り込み中... ${i + 1} / ${files.length}`);
    try {
      const file = files[i];
      const taken = (await readExifDate(file)) || (file.lastModified ? new Date(file.lastModified) : new Date());
      const rec = await makePhotoRecord(file, currentSiteId, libraryProcessId, taken);
      await dbPut("photos", rec);
      ok++;
    } catch (e) {
      console.error(e);
      failed++;
    }
  }
  setProcessing(false);
  toast(`${ok}枚を取り込みました` + (failed ? `（${failed}枚は読み込めませんでした）` : ""));
  renderSite();
}

/* ---------- ④ 報告まとめ ---------- */

let summaryReportId = null; // null = 今回（未報告）の分
let summaryPhotos = [];
const selectedIds = new Set();

async function openSummary(reportId) {
  summaryReportId = reportId;
  selectedIds.clear();
  await renderSummary();
  showView("summaryView");
}

async function renderSummary() {
  releaseUrls("summary");
  const site = await dbGet("sites", currentSiteId);
  const all = await getSitePhotos(currentSiteId);
  let label;
  if (summaryReportId) {
    const r = await dbGet("reports", summaryReportId);
    summaryPhotos = all.filter((p) => p.reportId === summaryReportId);
    label = `${fmtDate(r.start)}〜${fmtDate(r.end)}`;
  } else {
    summaryPhotos = unreported(all);
    label = periodLabel(periodStart(site, summaryPhotos)).text;
  }
  $("summaryPeriod").textContent = label;

  const groups = $("summaryGroups");
  groups.innerHTML = "";
  const byProc = {};
  summaryPhotos.forEach((p) => (byProc[p.processId] = byProc[p.processId] || []).push(p));
  Object.keys(byProc)
    .sort((a, b) => processOf(a).no - processOf(b).no)
    .forEach((pid) => {
      const list = byProc[pid].sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1));
      const g = document.createElement("div");
      g.className = "summaryGroup";
      g.innerHTML =
        `<div class="summaryGroupHead"><span class="summaryGroupName">${esc(processOf(pid).name)}</span>` +
        `<span class="mutedText" data-count="${pid}"></span></div><div class="photoGrid"></div>`;
      const grid = g.querySelector(".photoGrid");
      list.forEach((ph) => grid.appendChild(photoCell(ph)));
      groups.appendChild(g);
    });
  $("summaryEmpty").hidden = summaryPhotos.length > 0;
  $("markReportedBtn").hidden = !!summaryReportId;
  $("deleteReportPhotosBtn").hidden = !summaryReportId || summaryPhotos.length === 0;
  updateSelectionUi();
}

function photoCell(ph) {
  const cell = document.createElement("button");
  cell.className = "photoCell";
  cell.innerHTML =
    `<img src="${blobUrl("summary", ph.thumb)}" alt="">` +
    `<span class="check">${icon(ICONS.check, 18, 3)}</span>` +
    `<span class="photoDate">${fmtDate(ph.dateKey)}</span>`;
  // 長押しで拡大、通常タップで選択切替
  let pressTimer = null;
  let longPressed = false;
  cell.addEventListener("touchstart", () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      openLightbox(ph.blob);
    }, 450);
  }, { passive: true });
  const cancel = () => clearTimeout(pressTimer);
  cell.addEventListener("touchend", cancel);
  cell.addEventListener("touchmove", cancel, { passive: true });
  cell.addEventListener("contextmenu", (e) => e.preventDefault());
  cell.addEventListener("click", () => {
    if (longPressed) return;
    if (selectedIds.has(ph.id)) selectedIds.delete(ph.id);
    else selectedIds.add(ph.id);
    cell.classList.toggle("selected", selectedIds.has(ph.id));
    updateSelectionUi();
  });
  return cell;
}

function updateSelectionUi() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const pid = el.dataset.count;
    const inGroup = summaryPhotos.filter((p) => p.processId === pid);
    const sel = inGroup.filter((p) => selectedIds.has(p.id)).length;
    el.textContent = `${sel} / ${inGroup.length} 選択`;
  });
  const n = selectedIds.size;
  $("sendBoxBtn").innerHTML = n ? `${icon(ICONS.send)}選んだ${n}枚をBoxへ送信` : "報告に使う写真を選んでください";
}

function safeFileName(s) {
  return s.replace(/[\\/:*?"<>|\s]/g, "");
}

// 選んだ写真を工程順・撮影順に並べ、送信用のファイル名を付ける
async function chosenPhotoFiles() {
  const site = await dbGet("sites", currentSiteId);
  const chosen = summaryPhotos
    .filter((p) => selectedIds.has(p.id))
    .sort((a, b) => processOf(a.processId).no - processOf(b.processId).no || (a.takenAt < b.takenAt ? -1 : 1));
  const counters = {};
  const entries = chosen.map((p) => {
    const short = processOf(p.processId).short;
    counters[short] = (counters[short] || 0) + 1;
    const name = safeFileName(`${site.name}_${short}_${fmtMMDD(p.dateKey)}_${pad2(counters[short])}.jpg`);
    return { photo: p, file: new File([p.blob], name, { type: "image/jpeg" }) };
  });
  return { site, entries };
}

async function shareSelected() {
  if (!selectedIds.size) {
    toast("保存する写真をタップして選んでください");
    return;
  }
  const { entries } = await chosenPhotoFiles();
  const files = entries.map((e) => e.file);
  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({ files });
    } catch (e) {
      /* キャンセル */
    }
    return;
  }
  // 共有シートが使えない環境（PCのブラウザ等）はダウンロードで代用
  files.forEach((f) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

/* ---------- Boxへ送信 ---------- */
// 走行距離アプリと同じく、共有シート→メール→Boxのアップロード用アドレス宛てに送る。
// 写真と一緒に「何の写真か」をまとめたJSONを添付し、後でAIとの対話の材料にする

const MAIL_WARN_BYTES = 15 * 1024 * 1024;

async function sendToBox() {
  if (!selectedIds.size) {
    toast("報告に使う写真をタップして選んでください");
    return;
  }
  const email = getSetting(BOX_EMAIL_KEY);
  if (!email) {
    alert("設定タブで、Boxのアップロード用メールアドレスを登録してください。");
    return;
  }
  const { site, entries } = await chosenPhotoFiles();
  let start;
  let end;
  if (summaryReportId) {
    const r = await dbGet("reports", summaryReportId);
    start = r.start;
    end = r.end;
  } else {
    start = periodStart(site, summaryPhotos);
    end = todayKey();
  }
  const procIds = new Set(summaryPhotos.map((p) => p.processId));
  if (!summaryReportId) site.processes.forEach((id) => procIds.add(id));
  const processes = [...procIds]
    .map(processOf)
    .sort((a, b) => a.no - b.no)
    .map((p) => ({
      no: p.no,
      name: p.name,
      taken_count: summaryPhotos.filter((ph) => ph.processId === p.id).length,
      selected_count: entries.filter((e) => e.photo.processId === p.id).length,
    }));
  const photoBytes = entries.reduce((s, e) => s + e.file.size, 0);

  openSheet("Boxへ送信", (body, close) => {
    const box = document.createElement("div");
    box.className = "summaryBox";
    box.innerHTML =
      `現場：${esc(site.name)}<br>期間：${fmtDate(start)}〜${fmtDate(end)}<br>` +
      `工程：${esc(processes.map((p) => p.name).join(" / ") || "なし")}<br>` +
      `写真：${entries.length}枚（約${(photoBytes / 1024 / 1024).toFixed(1)}MB）`;
    body.appendChild(box);
    if (photoBytes > MAIL_WARN_BYTES) {
      const warn = document.createElement("div");
      warn.className = "warnText";
      warn.textContent = "メールの容量上限を超えるおそれがあります。枚数を減らすか、2回に分けて送ってください。";
      body.appendChild(warn);
    }
    const label = document.createElement("label");
    label.className = "fieldLabel";
    label.textContent = "メモ（任意）：今週の様子・来週の予定・気づいたことなど";
    const memo = document.createElement("textarea");
    memo.className = "sheetTextarea";
    body.appendChild(label);
    body.appendChild(memo);
    const note = document.createElement("div");
    note.className = "mutedText";
    note.textContent = "「送信する」を押すと宛先アドレスをコピーして共有画面を開きます。メールを選び、宛先に貼り付けて送信してください。";
    body.appendChild(note);

    body.appendChild(
      sheetButton("送信する", "btnPrimary btnLarge", async () => {
        const payload = {
          kind: "genba-photo-report",
          schema: 1,
          app_version: APP_VERSION,
          sent_at: new Date().toISOString(),
          sender: getSetting(USER_NAME_KEY),
          site: site.name,
          period: { start, end },
          processes,
          memo: memo.value.trim(),
          photos: entries.map((e) => ({
            file: e.file.name,
            process_no: processOf(e.photo.processId).no,
            process: processOf(e.photo.processId).name,
            date: e.photo.dateKey,
            taken_at: e.photo.takenAt,
          })),
        };
        const jsonName = safeFileName(`報告_${site.name}_${start}_${end}.json`);
        const jsonFile = new File([JSON.stringify(payload, null, 2)], jsonName, { type: "application/json" });
        const files = [jsonFile, ...entries.map((e) => e.file)];
        if (navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        if (!(navigator.canShare && navigator.canShare({ files }))) {
          alert("この端末では共有機能が使えないため送信できません。iPhoneのホーム画面から開いてください。");
          return;
        }
        try {
          await navigator.share({ files, title: jsonName });
        } catch (e) {
          return; // キャンセル時はシートを開いたまま
        }
        close();
        if (!summaryReportId && confirm("送信しました。今回の分を報告済みにしますか？")) markReported();
        else toast("送信しました");
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

async function markReported() {
  const site = await dbGet("sites", currentSiteId);
  if (!summaryPhotos.length) {
    toast("この期間の写真がありません");
    return;
  }
  const start = periodStart(site, summaryPhotos);
  openSheet("報告済みにする", (body, close) => {
    const note = document.createElement("div");
    note.className = "mutedText";
    note.textContent = "報告に含めた最終日を選んでください。この日までの写真が今回の報告にまとまり、次回は翌日からの写真になります。";
    const input = document.createElement("input");
    input.type = "date";
    input.className = "sheetInput";
    input.value = todayKey();
    input.min = start;
    input.max = todayKey();
    body.appendChild(note);
    body.appendChild(input);
    body.appendChild(
      sheetButton("報告済みにする", "btnPrimary btnLarge", async () => {
        const end = input.value || todayKey();
        if (end < start) {
          toast(`${fmtDate(start)}以降の日付を選んでください`);
          return;
        }
        const report = { id: newId(), siteId: site.id, start, end, createdAt: new Date().toISOString() };
        const targets = summaryPhotos.filter((p) => p.dateKey <= end);
        targets.forEach((p) => (p.reportId = report.id));
        await dbPut("reports", report);
        await dbPutMany("photos", targets);
        site.lastReportEnd = end;
        await dbPut("sites", site);
        close();
        toast(`報告済みにしました（次回は${fmtDate(addDays(end, 1))}から）`);
        await renderSite();
        showView("siteView");
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

async function deleteReportPhotos() {
  if (!summaryReportId || !summaryPhotos.length) return;
  if (!confirm(`この報告の写真${summaryPhotos.length}枚を削除します。必要な写真は先に「共有・保存」で書き出してください。削除しますか？`)) return;
  await dbDeleteMany("photos", summaryPhotos.map((p) => p.id));
  toast("写真を削除しました");
  await renderSite();
  showView("siteView");
}

/* ---------- マニュアル ---------- */
// 中身はPDFのページ画像（manual/pNNN.jpg）。17分類への振り分けは tools/build_manual.py が作る manual-data.js

let manualCatId = null;
let manualCatItems = [];
let manualItemIndex = 0;
let activeSitesCache = []; // 撮影ボタンを同期処理で押せるよう、分類画面を開いた時点で読んでおく

function renderManual() {
  const list = $("manualCats");
  list.innerHTML = "";
  PROCESSES.forEach((p) => {
    const n = MANUAL_ITEMS.filter((it) => it.cat === p.id).length;
    const b = document.createElement("button");
    b.className = "card manualCat";
    b.innerHTML =
      `<span class="manualCatNo">${p.no}</span>` +
      `<span class="manualCatText"><span class="manualItemName">${esc(p.name)}</span><br><span class="mutedText">${n}項目</span></span>` +
      `<span class="chev">${icon(ICONS.chevron, 20)}</span>`;
    b.addEventListener("click", () => openManualCat(p.id));
    list.appendChild(b);
  });
}

async function openManualCat(catId) {
  manualCatId = catId;
  const p = processOf(catId);
  manualCatItems = MANUAL_ITEMS.filter((it) => it.cat === catId);
  $("manualCatTitle").textContent = p.name;
  $("manualCatGuide").hidden = !p.guide;
  $("manualCatGuide").textContent = p.guide ? `撮影メモ：${p.guide}` : "";
  const list = $("manualItems");
  list.innerHTML = "";
  manualCatItems.forEach((it, i) => {
    const b = document.createElement("button");
    b.className = "manualRow";
    b.innerHTML =
      `<span>${it.no ? `<span class="manualRowNo">${esc(it.no)}</span>` : ""}${esc(it.name)}</span>` +
      `<span class="chev">${icon(ICONS.chevron, 18)}</span>`;
    b.addEventListener("click", () => openManualItem(i));
    list.appendChild(b);
  });
  activeSitesCache = (await getSites()).filter((s) => !s.archived);
  showView("manualCatView");
}

function openManualItem(index) {
  manualItemIndex = index;
  const it = manualCatItems[index];
  $("manualItemTitle").textContent = (it.no ? it.no + " " : "") + it.name;
  $("manualPages").innerHTML = it.pages
    .map((n) => `<img src="manual/p${String(n).padStart(3, "0")}.jpg" loading="lazy" alt="${esc(it.name)} ${n}ページ">`)
    .join("");
  $("manualPrevBtn").disabled = index === 0;
  $("manualNextBtn").disabled = index === manualCatItems.length - 1;
  showView("manualItemView");
}

// マニュアルから直接撮影する。iPhoneのSafariはユーザー操作から間を置くとカメラ起動を
// 拒否することがあるので、DB読み込みを挟まず同期的にカメラを開く
function shootFromManual() {
  const pid = manualCatId;
  const sites = activeSitesCache;
  if (!sites.length) {
    toast("先に「写真・報告」タブで担当現場を登録してください");
    goHome();
    return;
  }
  const go = (site) => {
    currentSiteId = site.id;
    if (!site.processes.includes(pid)) {
      site.processes = PROCESSES.filter((p) => p.id === pid || site.processes.includes(p.id)).map((p) => p.id);
      dbPut("sites", site);
    }
    startCamera(pid);
  };
  if (sites.length === 1) {
    go(sites[0]);
    return;
  }
  openSheet("どの現場の写真ですか", (body, close) => {
    sites.forEach((site) => {
      const b = document.createElement("button");
      b.className = "pickItem";
      b.innerHTML = `<span>${esc(site.name)}</span>${icon(ICONS.camera, 20)}`;
      b.addEventListener("click", () => {
        close();
        go(site);
      });
      body.appendChild(b);
    });
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

/* ---------- 設定 ---------- */

const USER_NAME_KEY = "genba-photo-user-name";
const BOX_EMAIL_KEY = "genba-photo-box-email";

function getSetting(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (e) {
    return "";
  }
}
function setSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* ignore */
  }
}

async function renderSettings() {
  $("userNameInput").value = getSetting(USER_NAME_KEY);
  $("boxEmailInput").value = getSetting(BOX_EMAIL_KEY);
  $("versionInfo").textContent = `バージョン ${APP_VERSION}`;
  const info = $("storageInfo");
  const photos = await dbGetAll("photos");
  let text = `保存中の写真：${photos.length}枚`;
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    text += ` ・ 使用量 約${Math.round((est.usage || 0) / 1024 / 1024)}MB`;
  }
  if (navigator.storage && navigator.storage.persisted) {
    const persisted = await navigator.storage.persisted();
    text += persisted ? "（自動削除の対象外）" : "";
  }
  info.textContent = text;
}

/* ---------- 起動 ---------- */

function goHome() {
  currentSiteId = null;
  renderHome();
  showView("homeView");
}

function goManual() {
  renderManual();
  showView("manualView");
}

function init() {
  $("addSiteBtn").innerHTML = icon(ICONS.plus, 26);
  $("siteBackBtn").innerHTML = icon(ICONS.back, 26);
  $("summaryBackBtn").innerHTML = icon(ICONS.back, 26);
  $("siteMenuBtn").innerHTML = icon(ICONS.dots, 26);
  $("shotCloseBtn").innerHTML = icon(ICONS.x, 24);
  document.querySelectorAll(".tabIcon").forEach((el) => (el.innerHTML = icon(ICONS[el.dataset.icon], 24)));

  $("addSiteBtn").addEventListener("click", addSite);
  $("addSiteEmptyBtn").addEventListener("click", addSite);
  $("toggleArchivedBtn").addEventListener("click", () => {
    showArchived = !showArchived;
    renderHome();
  });
  $("siteBackBtn").addEventListener("click", goHome);
  $("siteMenuBtn").addEventListener("click", openSiteMenu);
  $("addProcessBtn").addEventListener("click", openProcessPicker);
  $("summaryBtn").addEventListener("click", () => openSummary(null));
  $("cameraInput").addEventListener("change", onCameraPicked);
  $("libraryInput").addEventListener("change", onLibraryPicked);
  $("shotAgainBtn").addEventListener("click", () => startCamera(shootProcessId));
  $("shotOtherBtn").addEventListener("click", pickOtherProcess);
  $("shotDoneBtn").addEventListener("click", leaveShot);
  $("shotCloseBtn").addEventListener("click", leaveShot);
  $("shotUndoBtn").addEventListener("click", undoLastShot);
  $("summaryBackBtn").addEventListener("click", () => {
    releaseUrls("summary");
    renderSite();
    showView("siteView");
  });
  $("sendBoxBtn").addEventListener("click", sendToBox);
  $("shareSelectedBtn").addEventListener("click", shareSelected);
  $("manualCatBackBtn").innerHTML = icon(ICONS.back, 26);
  $("manualItemBackBtn").innerHTML = icon(ICONS.back, 26);
  $("manualCatBackBtn").addEventListener("click", goManual);
  $("manualItemBackBtn").addEventListener("click", () => showView("manualCatView"));
  $("manualPrevBtn").addEventListener("click", () => openManualItem(manualItemIndex - 1));
  $("manualNextBtn").addEventListener("click", () => openManualItem(manualItemIndex + 1));
  $("manualCatShootBtn").addEventListener("click", shootFromManual);
  $("userNameInput").addEventListener("change", (e) => setSetting(USER_NAME_KEY, e.target.value.trim()));
  $("boxEmailInput").addEventListener("change", (e) => setSetting(BOX_EMAIL_KEY, e.target.value.trim()));
  $("markReportedBtn").addEventListener("click", markReported);
  $("deleteReportPhotosBtn").addEventListener("click", deleteReportPhotos);
  document.querySelector(".sheetBackdrop").addEventListener("click", () => ($("sheet").hidden = true));

  document.querySelectorAll(".tabBtn").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.tab === "photos") goHome();
      if (b.dataset.tab === "manual") goManual();
      if (b.dataset.tab === "settings") {
        renderSettings();
        showView("settingsView");
      }
    })
  );

  // 写真がブラウザの判断で消されないよう永続化を要求（ホーム画面追加時は通常許可される）
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  goManual();
}

init();
