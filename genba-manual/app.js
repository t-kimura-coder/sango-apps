"use strict";

// index.htmlのapp.js/style.css読み込み時の?v=番号と合わせて手動更新する
const APP_VERSION = 16;

// Boxのアップロード用メールアドレス（アップロード専用なので公開されても問題ない、と判断済み）。
// 決まったらここに書く。空のあいだは設定画面で入力したアドレスを使う
const BOX_UPLOAD_EMAIL = "";

// お知らせ。機能追加・不具合修正のたびに、先頭へ {date, type: "feature"|"fix", text} を追記する
// （自動では増えないので、書き忘れるとお知らせが古いまま残る）
const ANNOUNCEMENTS = [
  { date: "2026-10-01", type: "feature", text: "写真を「報告写真（お客様向け）」と「記録写真（マニュアル用）」に分け、それぞれの撮影メモを色付きのラベルで表示するようにしました" },
  { date: "2026-10-01", type: "feature", text: "工程マニュアルの「写真要」のチェック横にカメラを付けました。撮ると写真が表示され、タップで確認・撮り直し・削除ができます" },
  { date: "2026-10-01", type: "feature", text: "写真を削除できるようにしました（報告の写真一覧で長押し、または選んで「削除」）" },
  { date: "2026-10-01", type: "fix", text: "チェックを付けると画面が一番上に戻ってしまう不具合を直しました" },
  { date: "2026-10-01", type: "fix", text: "一部の工程で、中身のない「□」だけのポイントが表示される不具合を直しました（最新のマニュアルを取り込むと反映）" },
  { date: "2026-10-01", type: "feature", text: "会社のロゴを表示するようにしました（ホームの一番下と設定。最新のマニュアルを取り込むと表示されます）" },
  { date: "2026-10-01", type: "feature", text: "工程の検索を追加しました。ホームと工程タブの検索欄から、工程名やチェック項目の言葉で探せます（ひらがな可、「建て方」でも上棟が見つかります）" },
  { date: "2026-10-01", type: "feature", text: "工程マニュアルを見やすくしました。項目ごとに概要・ポイント・チェックポイント・作業の流れ・参考図を表示し、現場ごとにチェックを記録できます（マニュアルを最新版に取り込み直してください）" },
  { date: "2026-09-30", type: "feature", text: "お知らせと使い方のページを追加しました（ホーム右上のベルと？マーク）" },
  { date: "2026-09-30", type: "feature", text: "「現場ナビ」として公開しました。工程ごとのマニュアル閲覧、写真の撮りだめ、報告用の写真選択とBoxへの送信ができます" },
];

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

/* ---------- 17分類 ---------- */
// 写真機能で使う分類だけをアプリに持つ。マニュアル本文と撮影ガイドの文面は社内データなので
// アプリには入れず、マニュアルパック(JSON)の取り込み時に guide を上書きする（空欄なら画面に出さない）
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

/* ---------- 6つの大分類（画面の入口） ---------- */
// 17分類を現場の流れに沿って6つにまとめたもの。工程画面のカードとステッパーに使う
const GROUPS = [
  { id: "g1", name: "基礎", sub: "着工〜基礎工事", desc: "解体・仮設準備から、地盤・基礎工事までの工程です。", cats: ["p01", "p02"] },
  { id: "g2", name: "上棟", sub: "建て方・構造", desc: "足場を掛け、構造躯体の組み立てから屋根の下地までを行います。", cats: ["p03", "p04", "p05"] },
  { id: "g3", name: "外装", sub: "屋根・外壁・サッシ", desc: "外壁の下地・断熱から、屋根と外壁の仕上げまでの工程です。", cats: ["p06", "p09", "p14"] },
  { id: "g4", name: "内装", sub: "大工工事・内装仕上げ", desc: "内部の下地・造作から、塗装・クロス・床の仕上げまでの工程です。", cats: ["p07", "p08", "p11", "p12", "p13"] },
  { id: "g5", name: "設備", sub: "電気・給排水・設備", desc: "電気配線、給排水・暖房・換気の配管と器具の取付けです。", cats: ["p10"] },
  { id: "g6", name: "引渡し", sub: "完了検査・引渡し", desc: "美装・各種検査・外構を経て、お引渡しまでの工程です。", cats: ["p15", "p16", "p17"] },
];
function groupOf(gid) {
  return GROUPS.find((g) => g.id === gid) || GROUPS[0];
}
function groupOfProcess(pid) {
  return GROUPS.find((g) => g.cats.includes(pid)) || GROUPS[0];
}

// 大分類のイラスト（GPT生成の透過画像を余白カット・縮小して art/ に置いたもの。元画像は現場訪問マニュアルアプリ/design/）
function groupArt(g, h = 56) {
  return `<img src="art/${g.id}.webp?v=1" alt="" style="height:${h}px" decoding="async">`;
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
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  checkSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12l3 3 5-6"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7"/><circle cx="12" cy="17.2" r="0.6" fill="currentColor"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/><path d="M11 13l9-9"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
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
const DB_VERSION = 3; // v2: マニュアルパック用の manualPages / meta、v3: 現場ごとのチェック記録 checks

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
      if (!db.objectStoreNames.contains("manualPages")) db.createObjectStore("manualPages", { keyPath: "page" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      if (!db.objectStoreNames.contains("checks")) {
        // key = "<siteId>|<itemId>"。marks は「区分|チェック文」→ {at, by}（後で品質管理に使えるよう、誰がいつ付けたかを残す）
        const s = db.createObjectStore("checks", { keyPath: "key" });
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
async function dbClear(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
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
// 写真の種別：kind = "report"（お客様向けの報告写真。種別なしの古い写真もこちら）/ "record"（マニュアルが求める記録写真）
function isRecordPhoto(p) {
  return p.kind === "record";
}
// 今回の報告に入る写真（報告写真のうち、まだ報告済みにしていないもの）
function unreported(photos) {
  return photos.filter((p) => !p.reportId && !isRecordPhoto(p));
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

async function makePhotoRecord(file, siteId, processId, takenAt, extra = {}) {
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
    kind: "report",
    ...extra,
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
  dashView: "home",
  manualView: "manual",
  groupView: "manual",
  homeView: "photos",
  siteView: "photos",
  shotView: "photos",
  reportView: "report",
  summaryView: "report",
  settingsView: "",
  announceView: "",
  searchView: "",
  helpView: "",
};
let currentView = "dashView";
let viewBeforeSettings = "dashView";
function showView(id) {
  currentView = id;
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

// actions: [{label, cls, onClick}]。onClick が false を返したら閉じない（確認でキャンセルした時など）
// ボタンの処理はタップの中で同期的に呼ぶ（撮り直しでカメラを開けるように）
function openPhotoViewer(blob, actions = []) {
  const url = URL.createObjectURL(blob);
  const box = $("lightbox");
  const close = () => {
    box.hidden = true;
    $("lightboxImg").removeAttribute("src");
    URL.revokeObjectURL(url);
  };
  $("lightboxImg").src = url;
  const bar = $("lightboxActions");
  bar.innerHTML = "";
  actions.concat([{ label: "閉じる", cls: "btnGhost", onClick: () => {} }]).forEach((a) => {
    const b = document.createElement("button");
    b.className = `btn ${a.cls || "btnGhost"}`;
    b.textContent = a.label;
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const r = a.onClick();
      if (r && typeof r.then === "function") {
        if ((await r) === false) return;
      } else if (r === false) return;
      close();
    });
    bar.appendChild(b);
  });
  box.hidden = false;
  box.onclick = (e) => {
    if (e.target === box || e.target.id === "lightboxImg") close();
  };
}

function openLightbox(blob) {
  openPhotoViewer(blob, []);
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
  shotFrom = "site";
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
      guideHtml(p, { report: true, record: true, recordHint: true }) +
      `<div class="processActions">` +
      `<button class="btn btnPrimary shootBtn">${icon(ICONS.camera)}撮影</button>` +
      `<button class="btn btnSecondary libraryBtn" aria-label="写真ライブラリから取り込む">${icon(ICONS.photo)}</button>` +
      `</div>`;
    card.querySelector(".shootBtn").addEventListener("click", () => startCamera(pid));
    card.querySelector(".libraryBtn").addEventListener("click", () => startLibrary(pid));
    card.querySelector(".removeProcessBtn").addEventListener("click", () => removeProcess(pid, count));
    cards.appendChild(card);
  });

  $("summaryBtn").textContent = `報告用の写真を選ぶ（${current.length}枚）`;

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
      const g = groupOfProcess(p.id);
      if (g.cats[0] === p.id) {
        const label = document.createElement("div");
        label.className = "pickGroupLabel";
        label.textContent = g.name;
        body.appendChild(label);
      }
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

// 記録写真の撮影先（工程マニュアルの「写真要」チェックから撮るとき）。通常の撮影では null
let recordTarget = null;

function startRecordCamera(it, key) {
  recordTarget = { siteId: manualSiteId, itemId: it.id, checkKey: key };
  currentSiteId = manualSiteId;
  shootProcessId = it.cat;
  $("cameraInput").click();
}

function startCamera(pid) {
  recordTarget = null;
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
  if (recordTarget) {
    await saveRecordPhoto(file);
    setProcessing(false);
    return;
  }
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
  $("shotGuide").innerHTML = guideHtml(p, { report: true, record: false });
  const current = unreported(await getSitePhotos(currentSiteId))
    .filter((ph) => ph.processId === shootProcessId)
    .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
  if (rec) {
    $("shotPreview").src = blobUrl("shot", rec.blob);
    $("shotStatus").textContent = `報告写真を保存しました（この工程 ${current.length}枚目）`;
  } else {
    $("shotPreview").removeAttribute("src");
    $("shotStatus").textContent = `取り消しました（この工程 ${current.length}枚）`;
  }
  $("shotUndoBtn").hidden = !rec;
  const strip = $("shotStrip");
  strip.innerHTML = "";
  current.slice(0, 12).forEach((ph) => {
    const img = document.createElement("img");
    img.src = blobUrl("shot", ph.thumb);
    img.alt = "";
    img.addEventListener("click", () =>
      openPhotoViewer(ph.blob, [
        {
          label: "この写真を削除",
          cls: "btnDanger",
          onClick: async () => {
            if (!confirm("この写真を削除しますか？")) return false;
            await dbDeleteMany("photos", [ph.id]);
            if (lastShotId === ph.id) lastShotId = null;
            await renderShot(lastShotId ? await dbGet("photos", lastShotId) : null);
            toast("写真を削除しました");
          },
        },
      ])
    );
    strip.appendChild(img);
  });
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

let shotFrom = "site"; // 撮影を始めた画面（"manual" なら終わったら工程マニュアルに戻る）

function leaveShot() {
  releaseUrls("shot");
  lastShotId = null;
  if (shotFrom === "manual" && manualMeta) {
    shotFrom = "site";
    openGroup(currentGroupId, groupItems[currentItemIdx] && groupItems[currentItemIdx].id);
    return;
  }
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

/* ---------- 報告：写真を選ぶ ---------- */

let summaryReportId = null; // null = 今回（未報告）の分
let summaryPhotos = [];
let summaryFilter = "all";
let summaryFrom = "siteView";
const selectedIds = new Set();

async function openSummary(reportId, from) {
  summaryReportId = reportId;
  summaryFilter = "all";
  if (from) summaryFrom = from;
  selectedIds.clear();
  await renderSummary();
  showView("summaryView");
}

async function renderSummary() {
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
  $("summaryTitle").textContent = site.name;
  $("summaryPeriod").textContent = label;
  $("summaryHeading").textContent = summaryReportId ? "過去の報告の写真" : "今回の写真";

  const procIds = [...new Set(summaryPhotos.map((p) => p.processId))].sort((a, b) => processOf(a).no - processOf(b).no);
  if (summaryFilter !== "all" && !procIds.includes(summaryFilter)) summaryFilter = "all";
  const chips = $("summaryChips");
  chips.innerHTML = "";
  [["all", "すべて"], ...procIds.map((id) => [id, processOf(id).short])].forEach(([id, name]) => {
    const b = document.createElement("button");
    b.className = "chip" + (summaryFilter === id ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => {
      summaryFilter = id;
      renderSummaryGrid();
      chips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
    });
    chips.appendChild(b);
  });
  chips.hidden = procIds.length === 0;
  renderSummaryGrid();
  $("summaryEmpty").hidden = summaryPhotos.length > 0;
  $("markReportedBtn").hidden = !!summaryReportId;
  $("deleteReportPhotosBtn").hidden = !summaryReportId || summaryPhotos.length === 0;
  updateSelectionUi();
}

function renderSummaryGrid() {
  releaseUrls("summary");
  const list = summaryPhotos
    .filter((p) => summaryFilter === "all" || p.processId === summaryFilter)
    .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
  const grid = $("summaryGrid");
  grid.innerHTML = "";
  list.forEach((ph) => grid.appendChild(photoCell(ph)));
  $("summaryCount").textContent =
    summaryFilter === "all" ? `写真が ${list.length} 枚あります。` : `${processOf(summaryFilter).name}の写真が ${list.length} 枚あります。`;
}

function photoCell(ph) {
  const cell = document.createElement("button");
  cell.className = "photoCell" + (selectedIds.has(ph.id) ? " selected" : "");
  cell.innerHTML =
    `<img src="${blobUrl("summary", ph.thumb)}" alt="">` +
    `<span class="check">${icon(ICONS.check, 18, 3)}</span>` +
    `<span class="photoTag">${esc(processOf(ph.processId).short)}</span>` +
    `<span class="photoDate">${fmtDate(ph.dateKey)}</span>`;
  // 長押しで拡大、通常タップで選択切替
  let pressTimer = null;
  let longPressed = false;
  cell.addEventListener("touchstart", () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      openPhotoViewer(ph.blob, [
        {
          label: "この写真を削除",
          cls: "btnDanger",
          onClick: async () => {
            if (!confirm("この写真を削除しますか？")) return false;
            await dbDeleteMany("photos", [ph.id]);
            selectedIds.delete(ph.id);
            await renderSummary();
            toast("写真を削除しました");
          },
        },
      ]);
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
  $("selectedCount").textContent = selectedIds.size;
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
  const email = getBoxEmail();
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

async function deleteSelectedPhotos() {
  if (!selectedIds.size) {
    toast("削除する写真をタップして選んでください");
    return;
  }
  if (!confirm(`選んだ写真${selectedIds.size}枚を削除します。元に戻せません。よろしいですか？`)) return;
  await dbDeleteMany("photos", [...selectedIds]);
  const n = selectedIds.size;
  selectedIds.clear();
  await renderSummary();
  toast(`${n}枚を削除しました`);
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
// マニュアル本文は社内データなのでアプリには入れない。tools/build_manual.py が作る
// マニュアルパック(JSON: items=項目と17分類の対応, pages=ページ画像, guides=撮影ガイド)を
// 初回に取り込み、IndexedDB(meta / manualPages)に保存して使う

let manualMeta = null; // { key:"manual", version, title, builtAt, importedAt, items, guides }
let activeSitesCache = []; // 撮影ボタンを同期処理で押せるよう、分類画面を開いた時点で読んでおく

const DEFAULT_REPORT_NOTE = "お客様に見せる写真です。ゴミ・工具・資材の散乱が写らないように";
let reportNote = DEFAULT_REPORT_NOTE;

async function loadManualMeta() {
  manualMeta = await dbGet("meta", "manual");
  searchIndex = null;
  const guides = (manualMeta && manualMeta.guides) || {};
  reportNote = guides._reportNote || DEFAULT_REPORT_NOTE;
  PROCESSES.forEach((p) => {
    const g = guides[p.id];
    // 古いパックは文字列1つ、新しいパックは {record, report}
    p.guideRecord = typeof g === "string" ? g : (g && g.record) || "";
    p.guideReport = typeof g === "object" && g ? g.report || "" : "";
  });
}

// 撮影メモ。報告写真（お客様向け）と記録写真（マニュアル用）で撮り方が違うので、色付きラベルで分けて出す
function guideHtml(p, opts = { report: true, record: true }) {
  const lines = [];
  if (opts.report) {
    lines.push(`<div class="guideLine"><span class="kindLabel report">報告</span><span>${esc(p.guideReport || "進み具合が分かる全景")}</span></div>`);
    lines.push(`<div class="guideNote">${esc(reportNote)}</div>`);
  }
  if (opts.record && p.guideRecord) {
    lines.push(`<div class="guideLine"><span class="kindLabel record">記録</span><span>${esc(p.guideRecord)}</span></div>`);
    // 工程カードの「撮影」は報告写真。記録写真は工程マニュアルのチェック横のカメラから撮る
    if (opts.recordHint) lines.push(`<div class="guideHint">記録写真は「工程」タブのマニュアルで、写真要のチェック横のカメラから撮ります</div>`);
  }
  return lines.length ? `<div class="guideLines">${lines.join("")}</div>` : "";
}

// 6つの大分類カード（ホームと工程タブで共通）
function renderGroupGrid(container) {
  container.innerHTML = "";
  GROUPS.forEach((g) => {
    const b = document.createElement("button");
    b.className = "groupCard";
    b.innerHTML =
      `<span class="groupArt">${groupArt(g)}</span>` +
      `<span class="groupName">${esc(g.name)}<span class="chev">${icon(ICONS.chevron, 18, 2.6)}</span></span>` +
      `<span class="groupSub">${esc(g.sub)}</span>`;
    b.addEventListener("click", () => openGroup(g.id));
    container.appendChild(b);
  });
}

function manualEmptyCard() {
  const card = document.createElement("div");
  card.className = "card emptyState";
  card.innerHTML =
    '<div class="emptyTitle">マニュアルを取り込みましょう</div>' +
    '<div class="emptyText">Boxにある「マニュアル_○○.json」を選ぶと、このiPhoneの中に保存されます（初回のみ）。写真・報告の機能はマニュアルがなくても使えます。</div>';
  card.appendChild(sheetButton("マニュアルを取り込む", "btnPrimary", () => $("manualInput").click()));
  return card;
}

function renderManual() {
  const empty = $("manualEmpty");
  empty.innerHTML = "";
  if (!manualMeta) empty.appendChild(manualEmptyCard());
  renderGroupGrid($("manualGroups"));
}

let currentGroupId = "g1";
let groupItems = [];       // 表示中の大分類に含まれる項目（17分類の順→PDFの順）
let currentItemIdx = 0;
let currentMTab = "check";
let manualSiteId = "";     // チェックを記録する現場（空＝読むだけ）
let siteCheckRecs = {};    // itemId → チェック記録
let siteRecordPhotos = {}; // "項目ID|区分|チェック文" → 記録写真（最新の1枚）

const MANUAL_SITE_KEY = "genba-photo-manual-site";

function allManualItems() {
  if (!manualMeta) return [];
  return GROUPS.flatMap((g) => g.cats.flatMap((pid) => manualMeta.items.filter((it) => it.cat === pid)));
}

async function loadSiteChecks() {
  siteCheckRecs = {};
  siteRecordPhotos = {};
  if (!manualSiteId) return;
  (await dbGetAll("checks", "siteId", manualSiteId)).forEach((r) => (siteCheckRecs[r.itemId] = r));
  (await getSitePhotos(manualSiteId))
    .filter(isRecordPhoto)
    .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1))
    .forEach((p) => (siteRecordPhotos[`${p.itemId}|${p.checkKey}`] = p));
}

function checkRecOf(itemId) {
  return siteCheckRecs[itemId] || { key: `${manualSiteId}|${itemId}`, siteId: manualSiteId, itemId, na: false, marks: {} };
}

function itemProgress(it) {
  const checks = (it.text && it.text.checks) || [];
  const rec = checkRecOf(it.id);
  const done = checks.filter((c) => rec.marks["checks|" + c.text]).length;
  return { done, total: checks.length, na: rec.na };
}

// itemId を指定すると、その項目を開いた状態で表示する
async function openGroup(gid, itemId) {
  currentGroupId = gid;
  const g = groupOf(gid);
  const idx = GROUPS.indexOf(g);
  const stepper = $("groupStepper");
  stepper.innerHTML = "";
  GROUPS.forEach((x, i) => {
    const b = document.createElement("button");
    b.className = "step" + (i < idx ? " done" : "") + (i === idx ? " current" : "");
    b.innerHTML = `<span class="stepDot"></span><span>${esc(x.name)}</span>`;
    b.addEventListener("click", () => openGroup(x.id));
    stepper.appendChild(b);
  });
  $("groupTitle").textContent = g.name;
  $("groupDesc").textContent = g.desc;
  $("groupHeroArt").innerHTML = groupArt(g, 100);

  activeSitesCache = (await getSites()).filter((s) => !s.archived);
  let saved = "";
  try {
    saved = localStorage.getItem(MANUAL_SITE_KEY) || "";
  } catch (e) {
    /* ignore */
  }
  if (saved === "none") manualSiteId = "";
  else manualSiteId = activeSitesCache.some((s) => s.id === saved) ? saved : activeSitesCache[0] ? activeSitesCache[0].id : "";
  await loadSiteChecks();
  renderSiteBar();

  groupItems = manualMeta ? g.cats.flatMap((pid) => manualMeta.items.filter((it) => it.cat === pid)) : [];
  $("groupEmpty").innerHTML = "";
  if (!manualMeta) $("groupEmpty").appendChild(manualEmptyCard());
  $("itemTabs").hidden = !groupItems.length;
  $("itemDetail").hidden = !groupItems.length;
  const found = itemId ? groupItems.findIndex((it) => it.id === itemId) : -1;
  currentItemIdx = found >= 0 ? found : 0;
  renderItemStrip();
  showView("groupView");
  if (groupItems.length) await renderItem();
  else renderNavButtons();
}

function renderSiteBar() {
  const bar = $("manualSiteBar");
  const site = activeSitesCache.find((s) => s.id === manualSiteId);
  bar.classList.toggle("noSite", !site);
  bar.innerHTML =
    `${icon(ICONS.building, 18)}<span>チェックする現場</span><b>${site ? esc(site.name) : activeSitesCache.length ? "選ばない（読むだけ）" : "現場が未登録"}</b>` +
    `<span class="chev">${icon(ICONS.chevron, 16)}</span>`;
}

function pickManualSite() {
  if (!activeSitesCache.length) {
    toast("「写真」タブで担当現場を登録すると、現場ごとにチェックを記録できます");
    return;
  }
  openSheet("チェックを記録する現場", (body, close) => {
    const choose = async (id) => {
      close();
      manualSiteId = id;
      try {
        localStorage.setItem(MANUAL_SITE_KEY, id || "none");
      } catch (e) {
        /* ignore */
      }
      await loadSiteChecks();
      renderSiteBar();
      renderItemStrip();
      await renderItem();
    };
    activeSitesCache.forEach((site) => {
      const b = document.createElement("button");
      b.className = "pickItem" + (site.id === manualSiteId ? " picked" : "");
      b.textContent = site.name;
      b.addEventListener("click", () => choose(site.id));
      body.appendChild(b);
    });
    const none = document.createElement("button");
    none.className = "pickItem" + (!manualSiteId ? " picked" : "");
    none.textContent = "選ばない（読むだけ）";
    none.addEventListener("click", () => choose(""));
    body.appendChild(none);
  });
}

function renderItemStrip(scrollToActive = true) {
  const strip = $("itemStrip");
  strip.innerHTML = "";
  let lastCat = "";
  groupItems.forEach((it, i) => {
    const g = groupOf(currentGroupId);
    if (g.cats.length > 1 && it.cat !== lastCat) {
      const label = document.createElement("span");
      label.className = "stripCat";
      label.textContent = processOf(it.cat).short;
      strip.appendChild(label);
    }
    lastCat = it.cat;
    const pr = itemProgress(it);
    const b = document.createElement("button");
    b.className =
      "itemChip" + (i === currentItemIdx ? " active" : "") + (pr.na ? " na" : "") + (!pr.na && pr.total && pr.done === pr.total ? " done" : "");
    b.innerHTML = `<span class="itemChipNo">${esc(it.no || "・")}</span><span class="itemChipName">${esc(it.name)}</span>`;
    b.addEventListener("click", async () => {
      currentItemIdx = i;
      renderItemStrip();
      await renderItem();
    });
    strip.appendChild(b);
  });
  // 選んだ項目を横方向だけ中央へ寄せる（scrollIntoView は画面ごと縦にも動いてしまうので使わない）
  const active = strip.querySelector(".itemChip.active");
  if (active && scrollToActive) strip.scrollLeft = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
}

function renderNavButtons() {
  const all = allManualItems();
  const cur = groupItems[currentItemIdx];
  const pos = cur ? all.findIndex((x) => x.id === cur.id) : -1;
  const prev = pos > 0 ? all[pos - 1] : null;
  const next = pos >= 0 && pos < all.length - 1 ? all[pos + 1] : null;
  const set = (btn, it, arrowLeft) => {
    btn.disabled = !it;
    btn.innerHTML = it
      ? arrowLeft
        ? `${icon(ICONS.back, 18)}<span>${esc(it.name)}</span>`
        : `<span>${esc(it.name)}</span>${icon(ICONS.chevron, 18)}`
      : arrowLeft
      ? "最初の項目"
      : "最後の項目";
    btn.onclick = it ? () => openItemAnywhere(it.id) : null;
  };
  set($("itemPrevBtn"), prev, true);
  set($("itemNextBtn"), next, false);
}

// 別の大分類の項目へも移動できる（前後の項目・開始条件/後工程から）
async function openItemAnywhere(itemId) {
  const it = manualMeta && manualMeta.items.find((x) => x.id === itemId);
  if (!it) return;
  const g = groupOfProcess(it.cat);
  if (g.id === currentGroupId) {
    currentItemIdx = groupItems.findIndex((x) => x.id === itemId);
    renderItemStrip();
    await renderItem();
    window.scrollTo(0, 0);
  } else {
    await openGroup(g.id, itemId);
  }
}

async function renderItem() {
  const it = groupItems[currentItemIdx];
  if (!it) return;
  pushRecent(it);
  renderNavButtons();
  document.querySelectorAll(".itemTab").forEach((t) => t.classList.toggle("active", t.dataset.mtab === currentMTab));
  releaseUrls("manual");
  const box = $("itemDetail");
  const tx = it.text || null;
  const rec = checkRecOf(it.id);
  const p = processOf(it.cat);
  let html =
    `<div class="itemHead"><span class="itemHeadNo">${esc(it.no || "・")}</span>` +
    `<div class="itemHeadText"><div class="itemTitle">${esc(it.name)}</div><div class="itemCat">${esc(p.name)}</div></div></div>`;
  if (tx && tx.summary) html += `<div class="itemSummary">${esc(tx.summary)}</div>`;

  if (currentMTab === "check") {
    if (!tx) {
      html += `<div class="emptyNote">このマニュアルには文章データが入っていません。設定から最新版のマニュアルを取り込み直すと、ポイントやチェックポイントが表示されます。</div>`;
    } else {
      if (tx.purpose.length || tx.goal.length) {
        html += `<div class="pointBox"><div class="pointTitle">${icon(ICONS.bulb, 20)}この工程のポイント</div>`;
        if (tx.purpose.length) html += `<ul class="pointList">${tx.purpose.map(lineHtml).join("")}</ul>`;
        if (tx.goal.length) html += `<div class="pointSub">ゴール</div><ul class="pointList">${tx.goal.map(lineHtml).join("")}</ul>`;
        html += `</div>`;
      }
      html += `<div class="guideBoxDetail">${guideHtml(p)}</div>`;
      const done = tx.checks.filter((c) => rec.marks["checks|" + c.text]).length;
      html +=
        `<div class="secHead">${icon(ICONS.checkSquare, 22)}チェックポイント<span class="secRight">` +
        (tx.checks.length ? `<span id="checkProgress">${done}/${tx.checks.length}</span>` : "") +
        `<button class="miniBtn" data-go="docs">詳細を見る${icon(ICONS.chevron, 14)}</button></span></div>`;
      html += tx.checks.length
        ? `<div class="checkList">${tx.checks.map((c) => checkRowHtml("checks", c, rec, it)).join("")}</div>`
        : `<div class="emptyNote">チェック項目はまだ登録されていません。</div>`;
      if (!manualSiteId) html += `<div class="hint">上の「チェックする現場」を選ぶと、チェックを記録できます。</div>`;
      else html += `<button class="naBtn${rec.na ? " on" : ""}" data-na="1">${rec.na ? "この現場では該当なし（解除する）" : "この現場ではこの工程はない"}</button>`;
    }
    if (it.pages.length > 1) {
      html += `<div class="secHead">${icon(ICONS.photo, 22)}参考図・写真</div><div class="figStrip" id="figStrip"></div>`;
    }
    html += relatedSoonHtml();
  } else if (currentMTab === "flow") {
    if (!tx) {
      html += `<div class="emptyNote">最新版のマニュアルを取り込み直すと、作業の流れが表示されます。</div>`;
    } else {
      html += `<div class="secHead">${icon(ICONS.list, 22)}作業の流れ</div><div class="flowList">`;
      html += tx.before.map((f) => flowCardHtml("前の工程", f)).join("");
      if (tx.before.length) html += `<div class="flowArrow">▼</div>`;
      html += `<div class="flowCard current"><span class="flowLabel">この工程</span>${esc(it.name)}</div>`;
      if (tx.after.length) html += `<div class="flowArrow">▼</div>`;
      html += tx.after.map((f) => flowCardHtml("次の工程", f)).join("");
      html += `</div>`;
      if (tx.timing.length) {
        html += `<div class="secHead">${icon(ICONS.bell, 22)}タイミング</div><div class="timingRow">${tx.timing
          .map((x) => `<span>${esc(x)}</span>`)
          .join("")}</div>`;
      }
      html += `<div class="secHead">${icon(ICONS.checkSquare, 22)}事前準備</div>`;
      html += tx.prep.length
        ? `<div class="checkList">${tx.prep.map((c) => checkRowHtml("prep", c, rec, it)).join("")}</div>`
        : `<div class="emptyNote">事前準備はまだ登録されていません。</div>`;
    }
  } else {
    html += `<div class="secHead">${icon(ICONS.report, 22)}マニュアル原本<span class="secRight">ピンチで拡大</span></div><div class="docPages" id="docPages"></div>`;
    html += relatedSoonHtml();
  }
  box.innerHTML = html;

  box.querySelectorAll(".checkRow").forEach((row) => bindCheckRow(row, it));
  const na = box.querySelector("[data-na]");
  if (na) na.addEventListener("click", () => toggleNa(it));
  const go = box.querySelector("[data-go]");
  if (go) go.addEventListener("click", () => switchMTab(go.dataset.go));
  box.querySelectorAll("[data-flow]").forEach((el) =>
    el.addEventListener("click", () => {
      const target = allManualItems().find((x) => x.no && x.no === el.dataset.flow);
      if (target) openItemAnywhere(target.id);
      else toast("この工程のマニュアルは見つかりませんでした");
    })
  );

  const figs = $("figStrip");
  if (figs) {
    for (const n of it.pages.slice(1)) {
      const rec2 = await dbGet("manualPages", n);
      if (!rec2) continue;
      const b = document.createElement("button");
      b.innerHTML = `<img src="${blobUrl("manual", rec2.blob)}" alt="${n}ページ">`;
      b.addEventListener("click", () => openLightbox(rec2.blob));
      figs.appendChild(b);
    }
  }
  const pages = $("docPages");
  if (pages) {
    for (const n of it.pages) {
      const rec2 = await dbGet("manualPages", n);
      if (!rec2) continue;
      const img = document.createElement("img");
      img.alt = `${it.name} ${n}ページ`;
      img.src = blobUrl("manual", rec2.blob);
      pages.appendChild(img);
    }
  }
}

function lineHtml(x) {
  return `<li>${esc(x.text)}${x.added ? ` <span class="addedDate">（${esc(x.added)}追記）</span>` : ""}</li>`;
}

function checkRowHtml(sec, c, rec, it) {
  const key = `${sec}|${c.text}`;
  const mark = rec.marks[key];
  const disabled = !manualSiteId || rec.na;
  // 「写真要」のチェックには記録写真のカメラ。撮る前は灰色、撮ったら写真が出る
  let cam = "";
  if (c.photo === "要") {
    const ph = siteRecordPhotos[`${it.id}|${key}`];
    cam = ph
      ? `<button class="checkCam has" data-cam="1" aria-label="記録写真を見る"><img src="${blobUrl("manual", ph.thumb)}" alt=""></button>`
      : `<button class="checkCam" data-cam="1" aria-label="記録写真を撮る"${disabled ? " disabled" : ""}>${icon(ICONS.camera, 22)}</button>`;
  }
  const meta = [
    c.photo === "要" ? `<span class="photoReq">${icon(ICONS.camera, 12)}写真要</span>` : "",
    c.added ? `<span class="addedDate">${esc(c.added)}追記</span>` : "",
    mark ? `<span class="checkBy">${esc(fmtDateTime(mark.at))}${mark.by ? " " + esc(mark.by) : ""}</span>` : "",
  ].join("");
  return (
    `<div class="checkRow${mark ? " on" : ""}" data-key="${esc(key)}">` +
    `<button class="checkMain"${disabled ? " disabled" : ""}><span class="checkBox">${icon(ICONS.check, 16, 3)}</span>` +
    `<span class="checkText">${esc(c.text)}${meta ? `<span class="checkMeta">${meta}</span>` : ""}</span></button>` +
    cam +
    `</div>`
  );
}

function checkDefOf(it, key) {
  const [sec, ...rest] = key.split("|");
  const text = rest.join("|");
  const list = (it.text && it.text[sec]) || [];
  return list.find((c) => c.text === text);
}

function bindCheckRow(row, it) {
  const key = row.dataset.key;
  row.querySelector(".checkMain").addEventListener("click", () => toggleMark(it, key));
  const cam = row.querySelector("[data-cam]");
  if (cam) cam.addEventListener("click", () => onCheckCamera(it, key));
}

// 1行だけ描き直す（全体を描き直すと画面の位置がずれるため）
function refreshCheckRow(it, key) {
  const row = [...document.querySelectorAll("#itemDetail .checkRow")].find((r) => r.dataset.key === key);
  const def = checkDefOf(it, key);
  if (!row || !def) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = checkRowHtml(key.split("|")[0], def, checkRecOf(it.id), it);
  const fresh = tmp.firstElementChild;
  row.replaceWith(fresh);
  bindCheckRow(fresh, it);
  const prog = $("checkProgress");
  if (prog && it.text) {
    const rec = checkRecOf(it.id);
    prog.textContent = `${it.text.checks.filter((c) => rec.marks["checks|" + c.text]).length}/${it.text.checks.length}`;
  }
}

// 記録写真のカメラ：未撮影なら撮る、撮影済みなら確認（撮り直し・削除）
function onCheckCamera(it, key) {
  if (!manualSiteId) {
    toast("上の「チェックする現場」を選ぶと、記録写真を撮れます");
    return;
  }
  const ph = siteRecordPhotos[`${it.id}|${key}`];
  if (!ph) {
    if (checkRecOf(it.id).na) return;
    startRecordCamera(it, key);
    return;
  }
  openPhotoViewer(ph.blob, [
    { label: "撮り直す", cls: "btnPrimary", onClick: () => startRecordCamera(it, key) },
    {
      label: "削除",
      cls: "btnDanger",
      onClick: async () => {
        if (!confirm("この記録写真を削除しますか？")) return false;
        await dbDeleteMany("photos", [ph.id]);
        delete siteRecordPhotos[`${it.id}|${key}`];
        refreshCheckRow(it, key);
        toast("記録写真を削除しました");
      },
    },
  ]);
}

async function saveRecordPhoto(file) {
  const t = recordTarget;
  recordTarget = null;
  try {
    const rec = await makePhotoRecord(file, t.siteId, shootProcessId, new Date(), { kind: "record", itemId: t.itemId, checkKey: t.checkKey });
    const mapKey = `${t.itemId}|${t.checkKey}`;
    const old = siteRecordPhotos[mapKey];
    await dbPut("photos", rec);
    if (old) await dbDeleteMany("photos", [old.id]); // 撮り直しは前の1枚と入れ替える
    if (t.siteId === manualSiteId) siteRecordPhotos[mapKey] = rec;
    const it = groupItems[currentItemIdx];
    if (it && it.id === t.itemId) refreshCheckRow(it, t.checkKey);
    toast("記録写真を保存しました");
  } catch (e) {
    console.error(e);
    alert("写真を保存できませんでした。もう一度撮影してください。");
  }
}

function flowCardHtml(label, f) {
  return (
    `<button class="flowCard" data-flow="${esc(f.no)}"><span class="flowLabel">${label}</span>` +
    `${f.no ? esc(f.no) + " " : ""}${esc(f.name)}<span class="flowWho">${esc(f.who)}</span></button>`
  );
}

// 関連資料（施工要領書など）は今後マニュアルパックに入れる予定。今は枠だけ
function relatedSoonHtml() {
  return (
    `<div class="secHead">${icon(ICONS.report, 22)}関連資料<span class="secRight">準備中</span></div>` +
    `<div class="soonGrid"><div class="soonCard">${icon(ICONS.report, 22)}<span><b>施工要領書</b>準備中</span></div>` +
    `<div class="soonCard">${icon(ICONS.checkSquare, 22)}<span><b>安全作業ガイド</b>準備中</span></div></div>`
  );
}

async function switchMTab(tab) {
  currentMTab = tab;
  await renderItem();
  $("itemTabs").scrollIntoView({ block: "start", behavior: "smooth" });
}

async function saveCheckRec(rec) {
  rec.updatedAt = new Date().toISOString();
  siteCheckRecs[rec.itemId] = rec;
  await dbPut("checks", rec);
}

async function toggleMark(it, key) {
  if (!manualSiteId) return;
  const rec = checkRecOf(it.id);
  if (rec.marks[key]) delete rec.marks[key];
  else rec.marks[key] = { at: new Date().toISOString(), by: getSetting(USER_NAME_KEY) };
  await saveCheckRec(rec);
  renderItemStrip(false);
  refreshCheckRow(it, key);
}

async function toggleNa(it) {
  const rec = checkRecOf(it.id);
  rec.na = !rec.na;
  rec.naAt = new Date().toISOString();
  rec.naBy = getSetting(USER_NAME_KEY);
  await saveCheckRec(rec);
  renderItemStrip(false);
  const y = window.scrollY;
  await renderItem();
  window.scrollTo(0, y);
}

// 右上のカメラ：今開いている項目の工程（17分類）で撮る
function shootFromGroup() {
  const it = groupItems[currentItemIdx];
  if (it) shootFromManual(it.cat);
  else shootFromManual(groupOf(currentGroupId).cats[0]);
}

/* ---------- 工程の検索 ---------- */
// 初心者が現場で聞いた工程名からでもマニュアルに辿り着けるよう、項目名だけでなく
// 概要・ポイント・チェック項目の文章からも探す。ひらがな/カタカナ・全角/半角は区別しない。
// 言い換え（建て方＝上棟 など）はマニュアルパックの synonyms で足していく

let searchIndex = null;

function normText(s) {
  return String(s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[\s・、。,.（）()「」『』【】\-－ー〜~]/g, "");
}

function buildSearchIndex() {
  if (!manualMeta) return [];
  return allManualItems().map((it) => {
    const tx = it.text || {};
    const p = processOf(it.cat);
    const g = groupOfProcess(it.cat);
    const fields = [
      { label: "", raw: it.name, w: 10 },
      { label: "", raw: `${p.name} ${g.name}`, w: 3 },
      { label: "概要", raw: tx.summary || "", w: 3 },
      ...(tx.purpose || []).concat(tx.goal || []).map((x) => ({ label: "ポイント", raw: x.text, w: 2 })),
      ...(tx.checks || []).map((x) => ({ label: "チェック", raw: x.text, w: 2 })),
      ...(tx.prep || []).map((x) => ({ label: "事前準備", raw: x.text, w: 1 })),
    ].filter((f) => f.raw);
    fields.forEach((f) => (f.n = normText(f.raw)));
    return { it, g, fields, no: normText(it.no) };
  });
}

// 入力語＋言い換え辞書で同じ組にある語（部分一致で置き換えたものも含む）
function expandTerm(term) {
  const n = normText(term);
  const out = new Set([n]);
  ((manualMeta && manualMeta.synonyms) || []).forEach((group) => {
    const words = group.map(normText).filter(Boolean);
    words.forEach((w) => {
      if (n.includes(w)) words.forEach((other) => out.add(n.replace(w, other)));
    });
  });
  return [...out].filter(Boolean);
}

function searchManual(query) {
  if (!searchIndex) searchIndex = buildSearchIndex();
  const terms = query.split(/[\s　]+/).filter(Boolean).map(expandTerm).filter((v) => v.length);
  if (!terms.length) return [];
  const results = [];
  searchIndex.forEach((entry, order) => {
    let score = 0;
    let hit = null;
    for (const variants of terms) {
      let best = 0;
      if (variants.some((v) => entry.no && entry.no === v)) best = 12;
      for (const f of entry.fields) {
        const v = variants.find((x) => f.n.includes(x));
        if (!v) continue;
        let w = f.w;
        if (v !== variants[0]) w *= 0.7; // 言い換えで当たったものは、入力した言葉そのままより下に出す
        else if (f.w === 10 && f.n.startsWith(v)) w += 4;
        if (w > best) best = w;
        if (!hit && f.label) hit = { f, v };
      }
      if (!best) return; // すべての語に当てはまる項目だけ出す
      score += best;
    }
    results.push({ entry, score, hit, order });
  });
  return results.sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 50);
}

// 正規化した文字で当たった箇所を、元の文字列の上で強調する
function highlight(raw, v) {
  const chars = [...raw];
  const map = [];
  let norm = "";
  chars.forEach((c, i) => {
    const n = normText(c);
    for (const x of n) {
      norm += x;
      map.push(i);
    }
  });
  const pos = norm.indexOf(v);
  if (pos < 0) return esc(raw);
  const start = map[pos];
  const end = map[pos + v.length - 1] + 1;
  return esc(chars.slice(0, start).join("")) + "<mark>" + esc(chars.slice(start, end).join("")) + "</mark>" + esc(chars.slice(end).join(""));
}

function renderSearch() {
  const q = $("searchInput").value.trim();
  const box = $("searchResults");
  box.innerHTML = "";
  $("searchHint").hidden = !!q;
  if (!manualMeta) {
    box.appendChild(manualEmptyCard());
    return;
  }
  if (!q) return;
  const results = searchManual(q);
  const count = document.createElement("div");
  count.className = "searchCount";
  count.textContent = results.length ? `${results.length}件見つかりました` : "見つかりませんでした。別の言葉や、短い言葉で試してください。";
  box.appendChild(count);
  results.forEach(({ entry, hit }) => {
    const { it, g } = entry;
    const b = document.createElement("button");
    b.className = "searchItem";
    b.innerHTML =
      `<span class="itemChipNo">${esc(it.no || "・")}</span>` +
      `<span class="searchText"><span class="searchName">${esc(it.name)}</span>` +
      `<span class="searchMeta"><span class="pill pillWood">${esc(g.name)}</span>${esc(processOf(it.cat).name)}</span>` +
      (hit ? `<span class="searchSnippet">${esc(hit.f.label)}：${highlight(hit.f.raw, hit.v)}</span>` : "") +
      `</span><span class="chev">${icon(ICONS.chevron, 18)}</span>`;
    b.addEventListener("click", () => {
      $("searchInput").blur();
      openGroup(g.id, it.id);
    });
    box.appendChild(b);
  });
}

// iPhoneでキーボードを出すため、タップの処理の中で同期的にフォーカスする
function openSearch() {
  openSubView("searchView");
  const input = $("searchInput");
  input.focus();
  renderSearch();
}

/* ---------- 最近見た項目（ホームの「前回の続き」） ---------- */

const RECENT_KEY = "genba-photo-recent";

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function pushRecent(item) {
  const list = getRecent().filter((r) => r.id !== item.id);
  list.unshift({ id: item.id, at: new Date().toISOString() });
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 3)));
  } catch (e) {
    /* ignore */
  }
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

async function onManualPicked() {
  const input = $("manualInput");
  const file = input.files[0];
  input.value = "";
  if (!file) return;
  setProcessing(true, "マニュアルを読み込み中...");
  try {
    const pack = JSON.parse(await file.text());
    if (!pack || pack.kind !== "genba-manual-pack" || !Array.isArray(pack.items) || !pack.pages) {
      throw new Error("not a manual pack");
    }
    const pageNos = Object.keys(pack.pages);
    const records = [];
    for (let i = 0; i < pageNos.length; i++) {
      if (i % 10 === 0) setProcessing(true, `マニュアルを取り込み中... ${i} / ${pageNos.length}ページ`);
      const blob = await (await fetch(pack.pages[pageNos[i]])).blob();
      records.push({ page: Number(pageNos[i]), blob });
    }
    await dbClear("manualPages");
    for (let i = 0; i < records.length; i += 20) await dbPutMany("manualPages", records.slice(i, i + 20));
    await dbPut("meta", {
      key: "manual",
      version: pack.version || "",
      title: pack.title || "マニュアル",
      builtAt: pack.built_at || "",
      importedAt: new Date().toISOString(),
      items: pack.items,
      guides: pack.guides || {},
      synonyms: pack.synonyms || [],
      branding: pack.branding || null,
      schema: pack.schema || 1,
    });
    await loadManualMeta();
    toast(`マニュアル（${manualMeta.version}版）を取り込みました`);
    if (!$("settingsView").hidden) renderSettings();
    else if (currentView === "groupView") openGroup(currentGroupId);
    else goManual();
  } catch (e) {
    console.error(e);
    alert("マニュアルを取り込めませんでした。Boxの「マニュアル_○○.json」を選んでいるか確認してください。");
  } finally {
    setProcessing(false);
  }
}

async function deleteManual() {
  if (!confirm("このiPhoneからマニュアルを削除しますか？（写真・報告のデータは消えません）")) return;
  await dbClear("manualPages");
  await dbDeleteMany("meta", ["manual"]);
  await loadManualMeta();
  toast("マニュアルを削除しました");
  renderSettings();
}

// マニュアルから直接撮影する。iPhoneのSafariはユーザー操作から間を置くとカメラ起動を
// 拒否することがあるので、DB読み込みを挟まず同期的にカメラを開く
function shootFromManual(pid) {
  const sites = activeSitesCache;
  if (!sites.length) {
    toast("先に「写真」タブで担当現場を登録してください");
    goHome();
    return;
  }
  const go = (site) => {
    currentSiteId = site.id;
    shotFrom = "manual";
    if (!site.processes.includes(pid)) {
      site.processes = PROCESSES.filter((p) => p.id === pid || site.processes.includes(p.id)).map((p) => p.id);
      dbPut("sites", site);
    }
    startCamera(pid);
  };
  const checking = sites.find((x) => x.id === manualSiteId);
  if (checking || sites.length === 1) {
    go(checking || sites[0]);
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

function getBoxEmail() {
  return BOX_UPLOAD_EMAIL || getSetting(BOX_EMAIL_KEY);
}

async function copyBoxEmail() {
  const email = getBoxEmail();
  if (!email) {
    toast("先にBoxのアップロード用アドレスを入力してください");
    return;
  }
  try {
    await navigator.clipboard.writeText(email);
    toast("アドレスをコピーしました");
  } catch (e) {
    toast("コピーできませんでした");
  }
}

async function renderSettings() {
  renderBrand();
  $("userNameInput").value = getSetting(USER_NAME_KEY);
  $("boxEmailInput").value = getBoxEmail();
  $("boxEmailInput").readOnly = !!BOX_UPLOAD_EMAIL;
  $("versionInfo").textContent = `バージョン ${APP_VERSION}`;
  $("manualInfo").textContent = manualMeta
    ? `${manualMeta.title}（${manualMeta.version}版・${manualMeta.items.length}項目）
取り込み日：${fmtDate(toDateKey(new Date(manualMeta.importedAt)))}`
    : "まだ取り込まれていません";
  $("deleteManualBtn").hidden = !manualMeta;
  $("importManualBtn").textContent = manualMeta ? "新しい版を取り込む" : "マニュアルを取り込む";
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

/* ---------- 会社ロゴ ---------- */
// ロゴは社内データなのでアプリ本体には持たず、マニュアルパックの branding から表示する

function brandLogoHtml(b) {
  return (
    `<div class="brandLogo">` +
    (b.mark ? `<img class="mark" src="${b.mark}" alt="">` : "") +
    (b.wordmark ? `<img class="wordmark" src="${b.wordmark}" alt="${esc(b.company || "")}">` : esc(b.company || "")) +
    `</div>`
  );
}

function renderBrand() {
  const b = manualMeta && manualMeta.branding;
  const footer = $("brandFooter");
  const about = $("aboutBrand");
  footer.hidden = about.hidden = !b;
  if (!b) return;
  footer.innerHTML = `<span>提供</span>${brandLogoHtml(b)}`;
  about.innerHTML = brandLogoHtml(b);
}

/* ---------- ホーム ---------- */

async function renderDash() {
  renderGroupGrid($("dashGroups"));
  renderBrand();
  const sites = (await getSites()).filter((s) => !s.archived);
  let total = 0;
  for (const site of sites) total += unreported(await getSitePhotos(site.id)).length;
  $("dashReportSub").textContent = total
    ? `撮った写真 ${total} 枚から報告用を選べます。`
    : "撮った写真から報告用を選べます。";

  const recent = manualMeta
    ? getRecent().map((r) => ({ r, it: manualMeta.items.find((x) => x.id === r.id) })).filter((x) => x.it)
    : [];
  $("recentSection").hidden = recent.length === 0;
  const list = $("recentList");
  list.innerHTML = "";
  recent.forEach(({ r, it }) => {
    const g = groupOfProcess(it.cat);
    const b = document.createElement("button");
    b.className = "recentItem";
    b.innerHTML =
      `<span class="recentThumb">${groupArt(g, 40)}</span>` +
      `<span class="recentText"><span><span class="pill pillWood">${esc(g.name)}</span></span>` +
      `<span class="recentName">${esc(it.name)}</span><span class="recentMeta">最終閲覧：${fmtDateTime(r.at)}</span></span>` +
      `<span class="chev">${icon(ICONS.chevron, 18)}</span>`;
    b.addEventListener("click", () => openGroup(g.id, it.id));
    list.appendChild(b);
  });
}

function goDash() {
  renderDash();
  showView("dashView");
}

/* ---------- 報告タブ：現場の一覧 ---------- */

async function renderReportList() {
  const sites = (await getSites()).filter((s) => !s.archived);
  const list = $("reportSiteList");
  list.innerHTML = "";
  if (!sites.length) {
    const empty = document.createElement("div");
    empty.className = "emptyState";
    empty.innerHTML = '<div class="emptyText">まだ現場が登録されていません。「写真」タブから担当現場を登録してください。</div>';
    list.appendChild(empty);
  }
  for (const site of sites) {
    const current = unreported(await getSitePhotos(site.id));
    const card = document.createElement("button");
    card.className = "siteCard";
    card.innerHTML =
      `<div class="siteCardHead"><span class="siteName">${esc(site.name)}</span>` +
      `<span class="chev">${icon(ICONS.chevron, 18)}</span></div>` +
      `<div class="siteMeta">今回 ${periodLabel(periodStart(site, current)).text} ・ 写真 ${current.length}枚</div>`;
    card.addEventListener("click", () => {
      currentSiteId = site.id;
      openSummary(null, "reportView");
    });
    list.appendChild(card);
  }
}

function goReport() {
  renderReportList();
  showView("reportView");
}

// 設定・お知らせ・使い方は、タブの外にある画面。戻るで元の画面に帰る
const SUB_VIEWS = ["settingsView", "announceView", "helpView", "searchView"];
function openSubView(id) {
  if (!SUB_VIEWS.includes(currentView)) viewBeforeSettings = currentView;
  showView(id);
}
function backFromSubView() {
  const back = { dashView: goDash, manualView: goManual, homeView: goHome, reportView: goReport }[viewBeforeSettings];
  if (back) back();
  else showView(viewBeforeSettings);
}

function openSettings() {
  renderSettings();
  openSubView("settingsView");
}

/* ---------- お知らせ ---------- */

const ANNOUNCE_SEEN_KEY = "genba-photo-announce-seen";

function announceSeenCount() {
  try {
    return Number(localStorage.getItem(ANNOUNCE_SEEN_KEY) || 0);
  } catch (e) {
    return 0;
  }
}
function updateBellDot() {
  document.querySelectorAll(".bellDot").forEach((d) => (d.hidden = ANNOUNCEMENTS.length <= announceSeenCount()));
}
function openAnnouncements() {
  const unseen = ANNOUNCEMENTS.length - announceSeenCount();
  $("announceList").innerHTML = ANNOUNCEMENTS.map(
    (a, i) =>
      `<div class="announceItem"><div class="announceHead">` +
      `<span class="pill ${a.type === "fix" ? "pillWood" : "pillGreen"}">${a.type === "fix" ? "修正" : "機能"}</span>` +
      `<span class="announceDate">${fmtDate(a.date)}</span>${i < unseen ? '<span class="announceNew">NEW</span>' : ""}</div>` +
      `<div>${esc(a.text)}</div></div>`
  ).join("");
  try {
    localStorage.setItem(ANNOUNCE_SEEN_KEY, String(ANNOUNCEMENTS.length));
  } catch (e) {
    /* ignore */
  }
  updateBellDot();
  openSubView("announceView");
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
  $("groupBackBtn").innerHTML = icon(ICONS.back, 26);
  $("settingsBackBtn").innerHTML = icon(ICONS.back, 26);
  document.querySelectorAll(".settingsBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.settings, 24);
    b.addEventListener("click", openSettings);
  });
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const size = el.classList.contains("tabIcon") ? 24 : el.classList.contains("reportCardIcon") ? 40 : el.classList.contains("bannerIcon") ? 28 : 20;
    el.innerHTML = icon(ICONS[el.dataset.icon], size);
  });

  $("addSiteBtn").addEventListener("click", addSite);
  $("addSiteEmptyBtn").addEventListener("click", addSite);
  $("toggleArchivedBtn").addEventListener("click", () => {
    showArchived = !showArchived;
    renderHome();
  });
  $("siteBackBtn").addEventListener("click", goHome);
  $("siteMenuBtn").addEventListener("click", openSiteMenu);
  $("addProcessBtn").addEventListener("click", openProcessPicker);
  $("cameraInput").addEventListener("change", onCameraPicked);
  $("libraryInput").addEventListener("change", onLibraryPicked);
  $("shotAgainBtn").addEventListener("click", () => startCamera(shootProcessId));
  $("shotOtherBtn").addEventListener("click", pickOtherProcess);
  $("shotDoneBtn").addEventListener("click", leaveShot);
  $("shotCloseBtn").addEventListener("click", leaveShot);
  $("shotUndoBtn").addEventListener("click", undoLastShot);
  $("summaryBackBtn").addEventListener("click", () => {
    releaseUrls("summary");
    if (summaryFrom === "reportView") goReport();
    else {
      renderSite();
      showView("siteView");
    }
  });
  $("summaryBtn").addEventListener("click", () => openSummary(null, "siteView"));
  $("groupBackBtn").addEventListener("click", goManual);
  $("groupShootBtn").addEventListener("click", shootFromGroup);
  $("settingsBackBtn").addEventListener("click", backFromSubView);
  document.querySelectorAll(".subBackBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.back, 26);
    b.addEventListener("click", backFromSubView);
  });
  document.querySelectorAll(".bellBtn").forEach((b) => {
    b.insertAdjacentHTML("afterbegin", icon(ICONS.bell, 24));
    b.addEventListener("click", openAnnouncements);
  });
  document.querySelectorAll(".helpBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.help, 24);
    b.addEventListener("click", () => openSubView("helpView"));
  });
  updateBellDot();
  $("dashReportBtn").addEventListener("click", goReport);
  $("dashPhotoBtn").addEventListener("click", goHome);
  $("sendBoxBtn").addEventListener("click", sendToBox);
  $("shareSelectedBtn").addEventListener("click", shareSelected);
  $("groupShootBtn").innerHTML = icon(ICONS.camera, 24);
  $("manualSiteBar").addEventListener("click", pickManualSite);
  document.querySelectorAll(".openSearchBtn").forEach((b) => b.addEventListener("click", openSearch));
  $("searchInput").addEventListener("input", renderSearch);
  $("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("searchInput").blur();
  });
  document.querySelectorAll(".itemTab").forEach((t) => t.addEventListener("click", () => switchMTab(t.dataset.mtab)));
  $("manualInput").addEventListener("change", onManualPicked);
  $("importManualBtn").addEventListener("click", () => $("manualInput").click());
  $("deleteManualBtn").addEventListener("click", deleteManual);
  $("userNameInput").addEventListener("change", (e) => setSetting(USER_NAME_KEY, e.target.value.trim()));
  $("boxEmailInput").addEventListener("change", (e) => setSetting(BOX_EMAIL_KEY, e.target.value.trim()));
  $("copyBoxEmailBtn").addEventListener("click", copyBoxEmail);
  $("deleteSelectedBtn").addEventListener("click", deleteSelectedPhotos);
  $("markReportedBtn").addEventListener("click", markReported);
  $("deleteReportPhotosBtn").addEventListener("click", deleteReportPhotos);
  document.querySelector(".sheetBackdrop").addEventListener("click", () => ($("sheet").hidden = true));

  document.querySelectorAll(".tabBtn").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.tab === "home") goDash();
      if (b.dataset.tab === "manual") goManual();
      if (b.dataset.tab === "photos") goHome();
      if (b.dataset.tab === "report") goReport();
    })
  );

  // 写真がブラウザの判断で消されないよう永続化を要求（ホーム画面追加時は通常許可される）
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  loadManualMeta().then(goDash);
}

init();
