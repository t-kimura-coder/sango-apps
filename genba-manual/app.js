"use strict";

// index.htmlのapp.js/style.css読み込み時の?v=番号と合わせて手動更新する
const APP_VERSION = 25;
// 工事看板のイラスト（art/site-board.webp）が届いたら true にする。届くまではアイコンで代用
const HAS_SITE_BOARD = true;

// Boxのアップロード用メールアドレス（アップロード専用なので公開されても問題ない、と判断済み）。
// 決まったらここに書く。空のあいだは設定画面で入力したアドレスを使う
const BOX_UPLOAD_EMAIL = "";

// お知らせ。機能追加・不具合修正のたびに、先頭へ {date, type: "feature"|"fix", text} を追記する
// （自動では増えないので、書き忘れるとお知らせが古いまま残る）
const ANNOUNCEMENTS = [
  { date: "2026-10-01", type: "feature", text: "写真整理・報告の画面を見やすくしました。写真整理は2列／3列を切り替えられ、写真ごとの「︙」から拡大・工程の変更・削除ができます" },
  { date: "2026-10-01", type: "fix", text: "現場の管理や設定から戻ったとき、工程マニュアルや報告のページが前の現場のまま残ることがある不具合を直しました" },
  { date: "2026-10-01", type: "fix", text: "過去の報告の写真を削除したり品質写真を撮り直したりしたとき、品質写真や報告済みの写真まで消えてしまう不具合を直しました" },
  { date: "2026-10-01", type: "fix", text: "写真タブで、一度「報告に使う」にした写真を外せるようにしました（選ぶと「報告から外す」になります）" },
  { date: "2026-10-01", type: "feature", text: "「記録写真」を「品質写真」に名前を変えました。並びはどこでも「品質（左）・報告（右）」にそろえています" },
  { date: "2026-10-01", type: "feature", text: "ホームに「写真整理」の入口を戻しました。工程タブでは、今の現場のチェックと品質写真の進み具合が分かるようにしました" },
  { date: "2026-10-01", type: "feature", text: "現場をアプリ全体で1つにまとめました。ホームの「今の現場」や各画面の上の欄から切り替え・追加ができ、「現場の管理」で名前の変更・完了・削除ができます" },
  { date: "2026-10-01", type: "feature", text: "写真タブを今の現場のアルバムにしました。品質写真・報告写真が全部見え、写真要の記録がどれだけ撮れているかも分かります。選んで「報告に使う」「工程で仕分け」「保存」「削除」ができます" },
  { date: "2026-10-01", type: "feature", text: "報告タブを工程ごとのページにしました。撮影メモと注意文を見ながら報告写真を撮り・取り込み、送る写真を選べます。工程マニュアルの「この工程の報告写真」からも開けます" },
  { date: "2026-10-01", type: "feature", text: "品質写真を、写真ライブラリからも選べるようにしました" },
  { date: "2026-10-01", type: "feature", text: "初めて使う人向けに、画面の場所を照らして案内する「使い方の案内」を付けました（設定・使い方からいつでも見られます）" },
  { date: "2026-10-01", type: "feature", text: "設定にバックアップを追加しました。登録情報・チェックの記録・写真から選んで書き出し、機種変更のときに戻せます" },
  { date: "2026-10-01", type: "feature", text: "Boxへ送る報告に、期間中に付けたチェック（誰が・いつ）を含めるようにしました" },
  { date: "2026-10-01", type: "feature", text: "違う工程で撮った写真を、あとから正しい工程に変更できるようにしました" },
  { date: "2026-10-01", type: "feature", text: "初めて開いたときに、お名前の登録を案内するようにしました（チェックの記録に名前が残ります）" },
  { date: "2026-10-01", type: "feature", text: "写真を「品質写真（マニュアル用）」と「報告写真（お客様向け）」に分け、それぞれの撮影メモを色付きのラベルで表示するようにしました" },
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
  grid2: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>',
  grid3: '<path d="M3.5 3.5h4.5v4.5H3.5zM9.75 3.5h4.5v4.5h-4.5zM16 3.5h4.5v4.5H16zM3.5 9.75h4.5v4.5H3.5zM9.75 9.75h4.5v4.5h-4.5zM16 9.75h4.5v4.5H16zM3.5 16h4.5v4.5H3.5zM9.75 16h4.5v4.5h-4.5zM16 16h4.5v4.5H16z"/>',
  dotsV: '<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r="0.6" fill="currentColor"/>',
  folder: '<path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.5l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M4.5 19.5h15"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  camSmall: '<path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><circle cx="12" cy="13" r="3.5"/>',
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
// 写真の種別：kind = "report"（お客様向けの報告写真。種別なしの古い写真もこちら）/ "record"（マニュアルが求める品質写真）
function isRecordPhoto(p) {
  return p.kind === "record";
}
// 今回の報告に入る写真（報告写真と「報告に使う」を付けた品質写真のうち、まだ報告済みにしていないもの）
function unreported(photos) {
  return photos.filter((p) => !p.reportId && (!isRecordPhoto(p) || p.forReport));
}

// 今回の報告期間の開始日 = 前回報告の終了日の翌日
// （初回は現場登録日。登録日より前の写真を取り込んだ場合はその日付まで遡る）
function periodStart(site, currentPhotos) {
  let start = site.lastReportEnd ? addDays(site.lastReportEnd, 1) : toDateKey(new Date(site.createdAt));
  currentPhotos.forEach((p) => {
    // 「報告に使う」にした古い品質写真で期間が遡らないよう、期間の計算は報告写真だけで行う
    if (!isRecordPhoto(p) && p.dateKey < start) start = p.dateKey;
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
  albumView: "photos",
  shotView: "report",
  reportView: "report",
  reportProcView: "report",
  reportPastView: "report",
  siteManageView: "",
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
  if (typeof tourOnView === "function") tourOnView(id);
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

/* ---------- 今の現場（アプリ全体で1つ） ---------- */
// どの画面でも同じ現場を見て・撮る。選んだ現場は覚えておき、次に開いた時もその現場から始まる

const CURRENT_SITE_KEY = "genba-photo-manual-site"; // 旧「チェックする現場」の保存先をそのまま引き継ぐ
let currentSiteId = null;
let activeSitesCache = []; // 撮影ボタンを同期処理で押せるよう、現場の一覧は先に読んでおく

async function refreshSites() {
  activeSitesCache = (await getSites()).filter((s) => !s.archived);
  const saved = getSetting(CURRENT_SITE_KEY);
  if (!activeSitesCache.some((s) => s.id === currentSiteId)) {
    // 今の現場が完了・削除されたら別の現場に切り替わる。その現場のチェック記録を読み直さないと、前の現場に書き込んでしまう
    currentSiteId = activeSitesCache.some((s) => s.id === saved) ? saved : activeSitesCache[0] ? activeSitesCache[0].id : null;
    setSetting(CURRENT_SITE_KEY, currentSiteId || "");
    if (typeof loadSiteChecks === "function") await loadSiteChecks();
  }
  renderSiteBars();
  return activeSitesCache.find((s) => s.id === currentSiteId) || null;
}

function currentSite() {
  return activeSitesCache.find((s) => s.id === currentSiteId) || null;
}

async function setCurrentSite(id) {
  currentSiteId = id;
  setSetting(CURRENT_SITE_KEY, id || "");
  await refreshSites();
  if (typeof loadSiteChecks === "function") await loadSiteChecks();
  rerenderCurrentView();
}

function renderSiteBars() {
  const site = currentSite();
  document.querySelectorAll(".curSiteBar").forEach((bar) => {
    bar.classList.toggle("noSite", !site);
    bar.innerHTML =
      `${icon(ICONS.building, 18)}<span>今の現場</span><b>${site ? esc(site.name) : "現場が未登録"}</b>` +
      `<span class="siteSwitch">切替${icon(ICONS.chevron, 14)}</span>`;
  });
}

function openSiteSwitcher() {
  openSheet("今の現場を切り替える", (body, close) => {
    activeSitesCache.forEach((site) => {
      const b = document.createElement("button");
      b.className = "pickItem" + (site.id === currentSiteId ? " picked" : "");
      b.innerHTML = `<span>${esc(site.name)}</span>${site.id === currentSiteId ? icon(ICONS.check, 20) : ""}`;
      b.addEventListener("click", () => {
        close();
        setCurrentSite(site.id);
      });
      body.appendChild(b);
    });
    if (!activeSitesCache.length) {
      const hint = document.createElement("div");
      hint.className = "hint";
      hint.textContent = "まだ現場が登録されていません。";
      body.appendChild(hint);
    }
    body.appendChild(
      sheetButton("＋ 現場を追加", "btnPrimary", () => {
        close();
        addSite();
      })
    );
    body.appendChild(
      sheetButton("現場の管理（名前の変更・完了・削除）", "btnSecondary", () => {
        close();
        openSiteManage();
      })
    );
  });
}

async function addSite() {
  const name = await askText("現場を追加", "", "登録する");
  if (!name) return;
  const site = { id: newId(), name, createdAt: new Date().toISOString(), archived: false, processes: [], lastReportEnd: null };
  await dbPut("sites", site);
  toast(`「${name}」を登録しました`);
  await setCurrentSite(site.id);
}

// いま表示している画面を、現場が変わった内容で描き直す
function rerenderCurrentView() {
  const fns = {
    dashView: renderDash,
    manualView: renderManual,
    albumView: renderAlbum,
    reportView: renderReport,
    reportProcView: renderReportProc,
    siteManageView: renderSiteManage,
    groupView: () => openGroup(currentGroupId, groupItems[currentItemIdx] && groupItems[currentItemIdx].id),
  };
  if (fns[currentView]) fns[currentView]();
}

// 描画の世代番号。await の間に次の描画が始まったら古い方は画面を触らない（写真が2倍に並ぶのを防ぐ）
const renderGen = { album: 0, report: 0, manage: 0 };

/* ---------- 現場の管理 ---------- */

function openSiteManage() {
  renderSiteManage();
  openSubView("siteManageView");
}

async function renderSiteManage() {
  const gen = ++renderGen.manage;
  const sites = await getSites();
  const photosBySite = {};
  for (const site of sites) photosBySite[site.id] = await getSitePhotos(site.id);
  if (gen !== renderGen.manage) return;
  const list = $("manageList");
  list.innerHTML = "";
  if (!sites.length) list.innerHTML = '<div class="emptyState"><div class="emptyText">まだ現場が登録されていません。</div></div>';
  for (const site of sites) {
    const photos = photosBySite[site.id];
    const card = document.createElement("div");
    card.className = "siteCard manageCard";
    card.innerHTML =
      `<div class="siteCardHead"><span class="siteName">${esc(site.name)}</span>` +
      (site.id === currentSiteId ? '<span class="badge badgeOk">今の現場</span>' : site.archived ? '<span class="badge badgeMuted">完了</span>' : "") +
      `</div><div class="siteMeta">登録 ${fmtDate(toDateKey(new Date(site.createdAt)))} ・ 写真 ${photos.length}枚</div>` +
      `<div class="manageBtns"></div>`;
    const btns = card.querySelector(".manageBtns");
    const add = (label, cls, fn) => {
      const b = document.createElement("button");
      b.className = `btn ${cls}`;
      b.textContent = label;
      b.addEventListener("click", fn);
      btns.appendChild(b);
    };
    if (!site.archived && site.id !== currentSiteId) add("今の現場にする", "btnOutline", () => setCurrentSite(site.id));
    add("名前を変更", "btnSecondary", async () => {
      const name = await askText("現場名を変更", site.name, "変更する");
      if (!name) return;
      site.name = name;
      await dbPut("sites", site);
      await refreshSites();
      renderSiteManage();
    });
    add(site.archived ? "進行中に戻す" : "完了にする", "btnSecondary", async () => {
      site.archived = !site.archived;
      await dbPut("sites", site);
      toast(site.archived ? "完了した現場にしました" : "進行中に戻しました");
      await refreshSites();
      renderSiteManage();
    });
    add("削除", "btnDanger", async () => {
      if (!confirm(`「${site.name}」と写真${photos.length}枚・チェックの記録をすべて削除します。元に戻せません。よろしいですか？`)) return;
      const reports = await dbGetAll("reports", "siteId", site.id);
      const checks = await dbGetAll("checks", "siteId", site.id);
      await dbDeleteMany("photos", photos.map((p) => p.id));
      await dbDeleteMany("reports", reports.map((r) => r.id));
      await dbDeleteMany("checks", checks.map((r) => r.key));
      await dbDeleteMany("sites", [site.id]);
      toast("現場を削除しました");
      await refreshSites();
      renderSiteManage();
    });
    list.appendChild(card);
  }
}

/* ---------- 写真のマス目（アルバム・報告で共通） ---------- */

// 写真の見出し：品質写真はチェック項目、報告写真は工程名
function photoTitle(ph) {
  if (isRecordPhoto(ph) && ph.checkKey) return ph.checkKey.split("|").slice(1).join("|");
  return processOf(ph.processId).name;
}

// 説明つきのカード（2列表示・報告の工程ページ）
function photoCard(ph, opts) {
  const card = document.createElement("button");
  card.className = "photoCard" + (opts.selected && opts.selected.has(ph.id) ? " selected" : "");
  const kind = isRecordPhoto(ph) ? '<span class="kindLabel record">品質</span>' : '<span class="kindLabel report">報告</span>';
  const mark = ph.reportId ? '<span class="cardMark">報告済</span>' : ph.sendPick ? '<span class="cardMark use">送る</span>' : "";
  card.innerHTML =
    `<span class="photoCardImg"><img src="${blobUrl(opts.bucket, ph.thumb)}" alt=""><span class="check">${icon(ICONS.check, 18, 3)}</span></span>` +
    `<span class="photoCardInfo">` +
    (opts.compact
      ? ""
      : `<span class="photoCardTags">${opts.showKind ? kind : ""}<span class="procPill">${esc(processOf(ph.processId).short)}</span>${mark}</span>` +
        `<span class="photoCardTitle">${esc(photoTitle(ph))}</span>`) +
    `<span class="photoCardDate">${esc(fmtDateTime(ph.takenAt))}</span></span>` +
    `<span class="photoMenu" role="button" aria-label="メニュー">${icon(ICONS.dotsV, 20)}</span>`;
  card.querySelector(".photoMenu").addEventListener("click", (e) => {
    e.stopPropagation();
    openPhotoViewer(ph.blob, opts.actions ? opts.actions(ph) : []);
  });
  card.addEventListener("contextmenu", (e) => e.preventDefault());
  card.addEventListener("click", () => opts.onTap(ph, card));
  return card;
}

// opts: { bucket, selected:Set, onTap(ph, cell), actions(ph) → ビューアのボタン, showKind }
function photoCell(ph, opts) {
  const cell = document.createElement("button");
  cell.className = "photoCell" + (opts.selected && opts.selected.has(ph.id) ? " selected" : "");
  const kind = isRecordPhoto(ph) ? '<span class="cellKind record">品質</span>' : '<span class="cellKind report">報告</span>';
  cell.innerHTML =
    `<img src="${blobUrl(opts.bucket, ph.thumb)}" alt="">` +
    `<span class="check">${icon(ICONS.check, 18, 3)}</span>` +
    (opts.showKind ? kind : "") +
    (ph.reportId ? '<span class="cellDone">報告済</span>' : ph.forReport && isRecordPhoto(ph) ? '<span class="cellDone use">報告に使う</span>' : "") +
    `<span class="photoTag">${esc(processOf(ph.processId).short)}</span>` +
    `<span class="photoDate">${fmtDate(ph.dateKey)}</span>` +
    `<span class="photoMenu small" role="button" aria-label="メニュー">${icon(ICONS.dotsV, 18)}</span>`;
  cell.querySelector(".photoMenu").addEventListener("click", (e) => {
    e.stopPropagation();
    openPhotoViewer(ph.blob, opts.actions ? opts.actions(ph) : []);
  });
  // 長押しで拡大（工程の変更・削除など）、通常タップは選択
  let pressTimer = null;
  let longPressed = false;
  cell.addEventListener("touchstart", () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      openPhotoViewer(ph.blob, opts.actions ? opts.actions(ph) : []);
    }, 450);
  }, { passive: true });
  const cancel = () => clearTimeout(pressTimer);
  cell.addEventListener("touchend", cancel);
  cell.addEventListener("touchmove", cancel, { passive: true });
  cell.addEventListener("contextmenu", (e) => e.preventDefault());
  cell.addEventListener("click", () => {
    if (longPressed) return;
    opts.onTap(ph, cell);
  });
  return cell;
}

// 写真1枚へのよくある操作（拡大画面のボタン）。after は操作後に描き直す処理
function photoActions(ph, after) {
  return [
    {
      label: "工程を変更",
      cls: "btnPrimary",
      onClick: () => pickProcessSheet("この写真の工程を変更", (pid) => retagPhotos([ph.id], pid, after)),
    },
    {
      label: "削除",
      cls: "btnDanger",
      onClick: async () => {
        if (!confirm("この写真を削除しますか？")) return false;
        await dbDeleteMany("photos", [ph.id]);
        if (typeof loadSiteChecks === "function") await loadSiteChecks();
        await after();
        toast("写真を削除しました");
      },
    },
  ];
}

// 写真の工程を付け替える（違う工程で撮ってしまった時用）
function pickProcessSheet(title, onPick) {
  openSheet(title, (body, close) => {
    PROCESSES.forEach((p) => {
      const g = groupOfProcess(p.id);
      if (g.cats[0] === p.id) {
        const label = document.createElement("div");
        label.className = "pickGroupLabel";
        label.textContent = g.name;
        body.appendChild(label);
      }
      const b = document.createElement("button");
      b.className = "pickItem";
      b.innerHTML = `<span><span class="processNo">${p.no}</span>${esc(p.name)}</span>`;
      b.addEventListener("click", () => {
        close();
        onPick(p.id);
      });
      body.appendChild(b);
    });
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

async function retagPhotos(ids, pid, after) {
  const photos = (await Promise.all(ids.map((id) => dbGet("photos", id)))).filter(Boolean);
  photos.forEach((p) => (p.processId = pid));
  await dbPutMany("photos", photos);
  await after();
  toast(`${photos.length}枚を「${processOf(pid).name}」に変更しました`);
}

function safeFileName(s) {
  return s.replace(/[\\/:*?"<>|\s]/g, "");
}

// 写真を工程順・撮影順に並べ、書き出し用のファイル名を付ける
function photoFiles(site, photos) {
  const sorted = [...photos].sort((a, b) => processOf(a.processId).no - processOf(b.processId).no || (a.takenAt < b.takenAt ? -1 : 1));
  const counters = {};
  return sorted.map((p) => {
    const short = processOf(p.processId).short;
    counters[short] = (counters[short] || 0) + 1;
    const name = safeFileName(`${site.name}_${short}_${fmtMMDD(p.dateKey)}_${pad2(counters[short])}.jpg`);
    return { photo: p, file: new File([p.blob], name, { type: "image/jpeg" }) };
  });
}

async function sharePhotos(site, photos) {
  if (!photos.length) {
    toast("保存する写真を選んでください");
    return;
  }
  const files = photoFiles(site, photos).map((e) => e.file);
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

/* ---------- 写真タブ：今の現場のアルバム ---------- */

const ALBUM_COLS_KEY = "genba-photo-album-cols";
const albumState = { kind: "all", group: "all", sort: "new", cols: getSetting(ALBUM_COLS_KEY) === "3" ? 3 : 2 };
const albumSel = new Set();
let albumPhotos = [];

function goAlbum() {
  albumSel.clear();
  renderAlbum();
  showView("albumView");
}

// 写真要のチェックのうち、品質写真が撮れている数（該当なしにした工程は数えない）
async function recordCoverage(siteId) {
  if (!manualMeta) return null;
  const recs = Object.fromEntries((await dbGetAll("checks", "siteId", siteId)).map((r) => [r.itemId, r]));
  const photos = (await getSitePhotos(siteId)).filter(isRecordPhoto);
  let total = 0;
  let done = 0;
  manualMeta.items.forEach((it) => {
    if (recs[it.id] && recs[it.id].na) return;
    ((it.text && it.text.checks) || []).forEach((c) => {
      if (c.photo !== "要") return;
      total++;
      if (photos.some((p) => p.itemId === it.id && p.checkKey === "checks|" + c.text)) done++;
    });
  });
  return { total, done };
}

async function renderAlbum() {
  const gen = ++renderGen.album;
  const site = await refreshSites();
  const all = site ? await getSitePhotos(site.id) : [];
  const cov = site ? await recordCoverage(site.id) : null;
  if (gen !== renderGen.album) return;
  releaseUrls("album");
  const grid = $("albumGrid");
  grid.innerHTML = "";
  const empty = $("albumEmpty");
  if (!site) {
    $("albumStats").innerHTML = "";
    $("albumKinds").innerHTML = "";
    $("albumChips").innerHTML = "";
    $("albumHeading").textContent = "";
    $("albumCount").textContent = "";
    empty.hidden = false;
    empty.innerHTML = '<div class="emptyTitle">担当現場を登録しましょう</div><div class="emptyText">上の「今の現場」から現場を登録すると、写真がここにまとまります。</div>';
    $("albumBar").hidden = true;
    return;
  }
  const nReport = all.filter((p) => !isRecordPhoto(p)).length;
  const nRecord = all.length - nReport;
  $("albumStats").innerHTML =
    `<div class="statBox"><span class="kindLabel record">品質</span><b>${nRecord}</b>枚</div>` +
    `<div class="statBox"><span class="kindLabel report">報告</span><b>${nReport}</b>枚</div>` +
    (cov
      ? `<div class="statBox wide"><span>写真要の品質写真</span><b>${cov.done}</b>/${cov.total}<span class="statBar"><span style="width:${cov.total ? Math.round((cov.done / cov.total) * 100) : 0}%"></span></span><span class="statPct">${cov.total ? Math.round((cov.done / cov.total) * 100) : 0}%</span></div>`
      : "");

  const kinds = $("albumKinds");
  kinds.innerHTML = "";
  [["all", "すべて"], ["record", "品質写真"], ["report", "報告写真"]].forEach(([k, label]) => {
    const b = document.createElement("button");
    b.className = "segBtn" + (albumState.kind === k ? " active" : "");
    b.textContent = label;
    b.addEventListener("click", () => {
      albumState.kind = k;
      renderAlbum();
    });
    kinds.appendChild(b);
  });

  const byKind = all.filter((p) => albumState.kind === "all" || (albumState.kind === "record" ? isRecordPhoto(p) : !isRecordPhoto(p)));
  const groupsWith = GROUPS.filter((g) => byKind.some((p) => g.cats.includes(p.processId)));
  if (albumState.group !== "all" && !groupsWith.some((g) => g.id === albumState.group)) albumState.group = "all";
  const chips = $("albumChips");
  chips.innerHTML = "";
  // 大分類はイラスト付きのタイル（写真がない大分類は薄く表示して押せない）
  [{ id: "all", name: "すべて" }, ...GROUPS].forEach((g) => {
    const b = document.createElement("button");
    const has = g.id === "all" || groupsWith.some((x) => x.id === g.id);
    b.className = "groupChip" + (albumState.group === g.id ? " active" : "") + (has ? "" : " empty");
    b.disabled = !has;
    b.innerHTML = `<span class="groupChipArt">${g.id === "all" ? icon(ICONS.grid2, 24) : groupArt(g, 30)}</span><span>${esc(g.name)}</span>`;
    b.addEventListener("click", () => {
      albumState.group = g.id;
      renderAlbum();
    });
    chips.appendChild(b);
  });
  chips.hidden = !byKind.length;

  albumPhotos = byKind.filter((p) => albumState.group === "all" || groupOf(albumState.group).cats.includes(p.processId));
  const sorters = {
    new: (a, b) => (a.takenAt < b.takenAt ? 1 : -1),
    old: (a, b) => (a.takenAt < b.takenAt ? -1 : 1),
    proc: (a, b) => processOf(a.processId).no - processOf(b.processId).no || (a.takenAt < b.takenAt ? 1 : -1),
  };
  albumPhotos.sort(sorters[albumState.sort]);
  $("albumSort").value = albumState.sort;
  $("albumColsBtn").innerHTML = icon(albumState.cols === 2 ? ICONS.grid3 : ICONS.grid2, 22);
  $("albumColsBtn").setAttribute("aria-label", albumState.cols === 2 ? "3列で表示" : "2列で表示");
  grid.className = "photoGrid" + (albumState.cols === 2 ? " cols2" : "");
  const gName = albumState.group === "all" ? "" : groupOf(albumState.group).name;
  const kName = { all: "写真", report: "報告写真", record: "品質写真" }[albumState.kind];
  $("albumHeading").textContent = `${gName ? gName + "の" : ""}${kName}`;
  $("albumCount").textContent = `${albumPhotos.length}枚あります。`;
  const maker = albumState.cols === 2 ? photoCard : photoCell;
  albumPhotos.forEach((ph) =>
    grid.appendChild(
      maker(ph, {
        bucket: "album",
        selected: albumSel,
        showKind: true,
        actions: (p) => photoActions(p, renderAlbum),
        onTap: (p, cell) => {
          if (albumSel.has(p.id)) albumSel.delete(p.id);
          else albumSel.add(p.id);
          cell.classList.toggle("selected", albumSel.has(p.id));
          updateAlbumBar();
        },
      })
    )
  );
  empty.hidden = albumPhotos.length > 0;
  if (!albumPhotos.length) {
    empty.innerHTML = all.length
      ? '<div class="emptyText">この条件の写真はありません。</div>'
      : '<div class="emptyTitle">まだ写真がありません</div><div class="emptyText">品質写真は工程マニュアルの「写真要」のチェック横、報告写真は報告タブの工程ページから撮れます。</div>';
  }
  [...albumSel].forEach((id) => {
    if (!all.some((p) => p.id === id)) albumSel.delete(id);
  });
  updateAlbumBar();
}

function albumSelAllPicked() {
  const sel = albumPhotos.filter((p) => albumSel.has(p.id) && !p.reportId);
  return sel.length > 0 && sel.every((p) => p.sendPick);
}

function updateAlbumBar() {
  $("albumBar").hidden = albumSel.size === 0;
  $("albumSelCount").textContent = albumSel.size;
  $("albumUseLabel").textContent = albumSelAllPicked() ? "報告から外す" : "報告に使う";
}

async function albumSelected() {
  return (await Promise.all([...albumSel].map((id) => dbGet("photos", id)))).filter(Boolean);
}

// 選んだ写真を「送る写真」にする（品質写真も報告に使えるようにする）
async function albumUseForReport() {
  if (albumSelAllPicked()) {
    const picked = (await albumSelected()).filter((p) => !p.reportId);
    picked.forEach((p) => {
      p.sendPick = false;
      if (isRecordPhoto(p)) p.forReport = false;
    });
    await dbPutMany("photos", picked);
    albumSel.clear();
    await renderAlbum();
    toast(`${picked.length}枚を報告から外しました`);
    return;
  }
  const photos = await albumSelected();
  const usable = photos.filter((p) => !p.reportId);
  usable.forEach((p) => {
    if (isRecordPhoto(p)) p.forReport = true;
    p.sendPick = true;
  });
  await dbPutMany("photos", usable);
  const skipped = photos.length - usable.length;
  albumSel.clear();
  await renderAlbum();
  toast(`${usable.length}枚を報告の「送る写真」にしました` + (skipped ? `（報告済みの${skipped}枚は除きました）` : ""));
}

function albumRetag() {
  const ids = [...albumSel];
  pickProcessSheet(`選んだ${ids.length}枚の工程を変更`, async (pid) => {
    albumSel.clear();
    await retagPhotos(ids, pid, renderAlbum);
  });
}

async function albumDelete() {
  if (!confirm(`選んだ写真${albumSel.size}枚を削除します。元に戻せません。よろしいですか？`)) return;
  const n = albumSel.size;
  await dbDeleteMany("photos", [...albumSel]);
  albumSel.clear();
  if (typeof loadSiteChecks === "function") await loadSiteChecks();
  await renderAlbum();
  toast(`${n}枚を削除しました`);
}

/* ---------- 撮影 ---------- */

let shootProcessId = null;
let lastShotId = null;
let libraryProcessId = null;
let shotFrom = "report"; // 撮影を始めた画面（今は報告の工程ページだけ）
let lastSavedProcessId = null; // 撮影直後の画面で最後に保存した写真の工程（「終わる」の戻り先）

// 品質写真の撮影先（工程マニュアルの「写真要」チェックから撮るとき）。通常の撮影では null
let recordTarget = null;

function startRecordCamera(it, key) {
  recordTarget = { siteId: currentSiteId, itemId: it.id, checkKey: key };
  shootProcessId = it.cat;
  $("cameraInput").click();
}

function startRecordLibrary(it, key) {
  recordTarget = { siteId: currentSiteId, itemId: it.id, checkKey: key };
  shootProcessId = it.cat;
  $("recordLibraryInput").click();
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
    await saveRecordPhoto(file, new Date());
    setProcessing(false);
    return;
  }
  try {
    const rec = await makePhotoRecord(file, currentSiteId, shootProcessId, new Date());
    await dbPut("photos", rec);
    lastShotId = rec.id;
    lastSavedProcessId = shootProcessId;
    await renderShot(rec);
    showView("shotView");
  } catch (e) {
    console.error(e);
    alert("写真を保存できませんでした。もう一度撮影してください。");
  } finally {
    setProcessing(false);
  }
}

async function onRecordLibraryPicked() {
  const input = $("recordLibraryInput");
  const file = input.files[0];
  input.value = "";
  if (!file || !recordTarget) return;
  setProcessing(true, "写真を取り込み中...");
  const taken = (await readExifDate(file)) || (file.lastModified ? new Date(file.lastModified) : new Date());
  await saveRecordPhoto(file, taken);
  setProcessing(false);
}

async function renderShot(rec) {
  releaseUrls("shot");
  const p = processOf(shootProcessId);
  $("shotTitle").textContent = p.name;
  $("shotGuide").innerHTML = guideHtml(p, { report: true, record: false });
  const current = unreported(await getSitePhotos(currentSiteId))
    .filter((ph) => ph.processId === shootProcessId && !isRecordPhoto(ph))
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

function pickOtherProcess() {
  const site = currentSite();
  if (!site) return;
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
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

function leaveShot() {
  releaseUrls("shot");
  lastShotId = null;
  openReportProc(lastSavedProcessId || reportProcId || shootProcessId);
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
  if (currentView === "reportProcView") renderReportProc();
}

/* ---------- 報告タブ：今回の期間の工程一覧 ---------- */
// 報告に使う写真（報告候補）＝報告写真 ＋ 写真タブで「報告に使う」を付けた品質写真。そのうち sendPick の付いたものを送る

let reportProcId = null;
let reportPastId = null;
let reportCache = { site: null, all: [] }; // 報告タブを描いた時の写真（「写真を保存」をタップの中ですぐ共有するため）
let pastPhotos = [];                        // 過去の報告の画面に出している写真

function sendPicks(photos) {
  return unreported(photos).filter((p) => p.sendPick);
}

function goReport() {
  renderReport();
  showView("reportView");
}

async function renderReport() {
  const gen = ++renderGen.report;
  const site = await refreshSites();
  const all = site ? await getSitePhotos(site.id) : [];
  const reports = site ? (await dbGetAll("reports", "siteId", site.id)).sort((a, b) => (a.end < b.end ? 1 : -1)) : [];
  if (gen !== renderGen.report) return;
  releaseUrls("report");
  reportCache = { site, all };
  const body = $("reportBody");
  body.innerHTML = "";
  if (!site) {
    body.innerHTML = '<div class="emptyState"><div class="emptyTitle">担当現場を登録しましょう</div><div class="emptyText">上の「今の現場」から現場を登録すると、工程ごとに報告写真を撮れます。</div></div>';
    $("reportBar").hidden = true;
    return;
  }
  const cands = unreported(all);
  const picks = cands.filter((p) => p.sendPick);
  const { text, weeks } = periodLabel(periodStart(site, cands));
  const weekday = new Date().getDay();
  const due = (weekday === 5 || weekday === 6) && cands.length > 0;
  let html =
    `<div class="periodBar"><span class="periodIcon">${icon(ICONS.calendar, 20)}</span><span class="periodLabel">今回の報告期間</span><span class="periodValue">${text}</span>` +
    (due ? '<span class="badge badgeWarning">報告日</span>' : weeks >= 2 ? `<span class="badge badgeMuted">${weeks}週分</span>` : "") +
    `</div><div class="sectionLabel">今回の工程（タップで報告写真のページへ）</div>`;
  body.innerHTML = html;
  const list = document.createElement("div");
  list.className = "processCards";
  const pids = [...new Set([...site.processes, ...cands.map((p) => p.processId)])].sort((a, b) => processOf(a).no - processOf(b).no);
  if (!pids.length) list.innerHTML = '<div class="hint">今回実施した工程を「工程を追加」から選ぶか、工程マニュアルの「この工程の報告写真」から始めてください。</div>';
  pids.forEach((pid) => {
    const p = processOf(pid);
    const inProc = cands.filter((ph) => ph.processId === pid);
    const sel = inProc.filter((ph) => ph.sendPick).length;
    const card = document.createElement("div");
    card.className = "processCard reportProcCard";
    // 左の絵：いちばん新しい写真、なければ大分類のイラスト
    const latest = inProc.sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))[0];
    const thumb = latest ? `<img src="${blobUrl("report", latest.thumb)}" alt="">` : groupArt(groupOfProcess(pid), 46);
    card.innerHTML =
      `<button class="reportProcOpen"><span class="procThumb${latest ? " photo" : ""}">${thumb}</span>` +
      `<span class="procBody"><span class="processName"><span class="processNo">${p.no}</span>${esc(p.name)}</span>` +
      `<span class="procStat">${icon(ICONS.camSmall, 16)}写真 <b>${inProc.length}</b> 枚</span>` +
      `<span class="procStat send">${icon(ICONS.report, 16)}送る <b>${sel}</b> 枚</span></span>` +
      `<span class="chev">${icon(ICONS.chevron, 18)}</span></button>` +
      `<button class="iconBtn removeProcessBtn" aria-label="今回の工程から外す">${icon(ICONS.x, 16)}</button>`;
    card.querySelector(".reportProcOpen").addEventListener("click", () => openReportProc(pid));
    card.querySelector(".removeProcessBtn").addEventListener("click", () => removeProcess(pid, inProc.length));
    list.appendChild(card);
  });
  body.appendChild(list);
  body.appendChild(sheetButton("＋ 工程を追加", "btnDashed", openProcessPicker));

  if (reports.length) {
    const past = document.createElement("div");
    past.className = "pastReports";
    past.innerHTML = '<div class="sectionLabel">過去の報告</div>';
    reports.forEach((r) => {
      const n = all.filter((ph) => ph.reportId === r.id).length;
      const row = document.createElement("button");
      row.className = "pastReportRow";
      row.innerHTML = `<span>${fmtDate(r.start)}〜${fmtDate(r.end)}</span><span class="mutedText">${n ? n + "枚" : "写真削除済み"}</span>`;
      row.addEventListener("click", () => openReportPast(r.id));
      past.appendChild(row);
    });
    body.appendChild(past);
  }
  $("reportBar").hidden = false;
  $("sendCount").textContent = picks.length;
}

function openProcessPicker() {
  const site = currentSite();
  if (!site) return;
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
        renderReport();
      })
    );
  });
}

async function removeProcess(pid, count) {
  const p = processOf(pid);
  const msg = count
    ? `「${p.name}」を今回の工程から外しますか？\n撮影済みの${count}枚は消えず、写真が残っている間は一覧に表示されます。`
    : `「${p.name}」を今回の工程から外しますか？`;
  if (!confirm(msg)) return;
  const site = currentSite();
  site.processes = site.processes.filter((id) => id !== pid);
  await dbPut("sites", site);
  renderReport();
}

/* ---------- 報告：工程のページ ---------- */

// 工程マニュアルの「この工程の報告写真」や、報告タブの工程から開く
async function openReportProc(pid) {
  const site = await refreshSites();
  if (!site) {
    toast("先に「今の現場」を登録してください");
    openSiteSwitcher();
    return;
  }
  reportProcId = pid;
  if (!site.processes.includes(pid)) {
    site.processes = PROCESSES.filter((p) => p.id === pid || site.processes.includes(p.id)).map((p) => p.id);
    await dbPut("sites", site);
  }
  await renderReportProc();
  showView("reportProcView");
}

async function renderReportProc() {
  releaseUrls("reportProc");
  const site = currentSite();
  if (!site || !reportProcId) return;
  const p = processOf(reportProcId);
  const g = groupOfProcess(reportProcId);
  $("reportProcTitle").textContent = `${p.name}の報告`;
  const all = await getSitePhotos(site.id);
  const cands = unreported(all);
  const list = cands.filter((ph) => ph.processId === reportProcId).sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
  $("reportProcPeriodBar").innerHTML =
    `<span class="periodIcon">${icon(ICONS.calendar, 20)}</span><span class="periodLabel">今回の報告期間</span>` +
    `<span class="periodValue">${periodLabel(periodStart(site, cands)).text}</span>`;
  $("reportProcCard").innerHTML =
    `<span class="procHeroArt">${groupArt(g, 70)}</span>` +
    `<span class="procHeroText"><span class="procHeroName">${esc(p.name)}<span class="kindLabel report">報告写真</span></span>` +
    `<span class="procHeroSub">${esc(g.name)}・${esc(g.sub)}</span><span class="procHeroDesc">${esc(g.desc)}</span></span>`;
  $("reportProcGuide").innerHTML =
    `<div class="memoHead">${icon(ICONS.camSmall, 22)}撮影メモ</div>` +
    `<ul class="memoList">${reportGuideList(p).map((x) => `<li>${icon(ICONS.check, 16, 2.6)}<span>${esc(x)}</span></li>`).join("")}</ul>` +
    `<div class="memoNote">${icon(ICONS.alert, 22)}<span>${esc(reportNote)}</span></div>`;
  const grid = $("reportProcGrid");
  grid.innerHTML = "";
  const picked = new Set(list.filter((ph) => ph.sendPick).map((ph) => ph.id));
  const updateCounts = () => {
    $("reportProcCount").innerHTML = `選択数 <b>${picked.size}</b>/${list.length}`;
    $("procBarCount").textContent = picked.size;
    const thumbs = $("procBarThumbs");
    thumbs.innerHTML = "";
    list
      .filter((ph) => picked.has(ph.id))
      .slice(0, 3)
      .forEach((ph) => {
        const im = document.createElement("img");
        im.src = blobUrl("reportProc", ph.thumb);
        thumbs.appendChild(im);
      });
  };
  list.forEach((ph) =>
    grid.appendChild(
      photoCard(ph, {
        bucket: "reportProc",
        selected: picked,
        compact: true,
        actions: (x) => photoActions(x, renderReportProc),
        onTap: async (x, cell) => {
          x.sendPick = !x.sendPick;
          if (x.sendPick) picked.add(x.id);
          else picked.delete(x.id);
          cell.classList.toggle("selected", x.sendPick);
          updateCounts();
          await dbPut("photos", x);
        },
      })
    )
  );
  updateCounts();
  $("reportProcEmpty").hidden = list.length > 0;
}

/* ---------- 報告：過去の報告 ---------- */

async function openReportPast(id) {
  reportPastId = id;
  await renderReportPast();
  showView("reportPastView");
}

async function renderReportPast() {
  releaseUrls("reportPast");
  const site = currentSite();
  const r = await dbGet("reports", reportPastId);
  if (!site || !r) return goReport();
  $("reportPastTitle").textContent = `${fmtDate(r.start)}〜${fmtDate(r.end)}の報告`;
  const list = (await getSitePhotos(site.id)).filter((p) => p.reportId === r.id).sort((a, b) => processOf(a.processId).no - processOf(b.processId).no);
  pastPhotos = list;
  const grid = $("reportPastGrid");
  grid.innerHTML = "";
  list.forEach((ph) =>
    grid.appendChild(
      photoCell(ph, {
        bucket: "reportPast",
        showKind: true,
        actions: (x) => photoActions(x, renderReportPast),
        onTap: (x) => openPhotoViewer(x.blob, photoActions(x, renderReportPast)),
      })
    )
  );
  $("reportPastEmpty").hidden = list.length > 0;
  $("pastShareBtn").hidden = !list.length;
  $("deleteReportPhotosBtn").hidden = !list.length;
}

async function deleteReportPhotos() {
  const site = currentSite();
  const list = (await getSitePhotos(site.id)).filter((p) => p.reportId === reportPastId);
  if (!list.length) return;
  const reportPhotos = list.filter((p) => !isRecordPhoto(p));
  const quality = list.filter(isRecordPhoto);
  const msg =
    `この報告の報告写真${reportPhotos.length}枚を削除します。必要な写真は先に「保存」で書き出してください。` +
    (quality.length ? `\n（報告に使った品質写真${quality.length}枚は、マニュアルの記録として残します）` : "") +
    "\n削除しますか？";
  if (!confirm(msg)) return;
  await dbDeleteMany("photos", reportPhotos.map((p) => p.id));
  quality.forEach((p) => {
    p.reportId = null;
    p.forReport = false;
    p.sendPick = false;
  });
  if (quality.length) await dbPutMany("photos", quality);
  toast("写真を削除しました");
  goReport();
}

/* ---------- Boxへ送信 ---------- */
// 走行距離アプリと同じく、共有シート→メール→Boxのアップロード用アドレス宛てに送る。
// 写真と一緒に「何の写真か」をまとめたJSONを添付し、後でAIとの対話の材料にする

const MAIL_WARN_BYTES = 15 * 1024 * 1024;

// 期間中に付けたチェックをまとめる（報告メールづくりと、後の品質管理の材料）
async function buildCheckSummary(siteId, start, end) {
  if (!manualMeta) return [];
  const inPeriod = (iso) => {
    if (!iso) return false;
    const k = toDateKey(new Date(iso));
    return k >= start && k <= end;
  };
  const recs = await dbGetAll("checks", "siteId", siteId);
  const recordPhotos = (await getSitePhotos(siteId)).filter(isRecordPhoto);
  const out = [];
  for (const rec of recs) {
    const it = manualMeta.items.find((x) => x.id === rec.itemId);
    if (!it) continue;
    const checked = Object.entries(rec.marks || {})
      .filter(([, m]) => inPeriod(m.at))
      .map(([key, m]) => {
        const [section, ...rest] = key.split("|");
        const text = rest.join("|");
        const def = checkDefOf(it, key);
        return {
          section: section === "prep" ? "事前準備" : "チェック",
          text,
          at: m.at,
          by: m.by || "",
          photo_required: !!(def && def.photo === "要"),
          record_photo: recordPhotos.some((p) => p.itemId === it.id && p.checkKey === key),
        };
      })
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    const na = rec.na && inPeriod(rec.naAt);
    if (!checked.length && !na) continue;
    const total = ((it.text && it.text.checks) || []).length;
    out.push({
      item_no: it.no,
      item: it.name,
      process: processOf(it.cat).name,
      checks_total: total,
      checks_done: Object.keys(rec.marks || {}).filter((k) => k.startsWith("checks|")).length,
      not_applicable: !!rec.na,
      checked,
    });
  }
  return out.sort((a, b) => allManualItems().findIndex((x) => x.name === a.item) - allManualItems().findIndex((x) => x.name === b.item));
}

function shareSelected() {
  if (!reportCache.site) return;
  sharePhotos(reportCache.site, sendPicks(reportCache.all));
}

async function sendToBox() {
  const site = currentSite();
  if (!site) return;
  const all = await getSitePhotos(site.id);
  const cands = unreported(all);
  const picks = sendPicks(all);
  if (!picks.length) {
    toast("工程のページで、送る写真をタップして選んでください");
    return;
  }
  const email = getBoxEmail();
  if (!email) {
    alert("設定で、Boxのアップロード用メールアドレスを登録してください。");
    return;
  }
  const entries = photoFiles(site, picks);
  const start = periodStart(site, cands);
  const end = todayKey();
  const procIds = new Set(cands.map((p) => p.processId));
  site.processes.forEach((id) => procIds.add(id));
  const processes = [...procIds]
    .map(processOf)
    .sort((a, b) => a.no - b.no)
    .map((p) => ({
      no: p.no,
      name: p.name,
      taken_count: cands.filter((ph) => ph.processId === p.id).length,
      selected_count: entries.filter((e) => e.photo.processId === p.id).length,
    }));
  const photoBytes = entries.reduce((s, e) => s + e.file.size, 0);
  const checkSummary = await buildCheckSummary(site.id, start, end);
  const checkCount = checkSummary.reduce((n, x) => n + x.checked.length, 0);

  openSheet("Boxへ送信", (body, close) => {
    const box = document.createElement("div");
    box.className = "summaryBox";
    box.innerHTML =
      `現場：${esc(site.name)}<br>期間：${fmtDate(start)}〜${fmtDate(end)}<br>` +
      `工程：${esc(processes.map((p) => p.name).join(" / ") || "なし")}<br>` +
      `写真：${entries.length}枚（約${(photoBytes / 1024 / 1024).toFixed(1)}MB）<br>` +
      `チェック：${checkSummary.length}項目・${checkCount}件（期間中に付けたもの）`;
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
          schema: 2, // 2: checks（期間中に付けたチェック）を追加
          app_version: APP_VERSION,
          sent_at: new Date().toISOString(),
          sender: getSetting(USER_NAME_KEY),
          site: site.name,
          period: { start, end },
          processes,
          memo: memo.value.trim(),
          photos: entries.map((e) => ({
            file: e.file.name,
            kind: isRecordPhoto(e.photo) ? "record" : "report",
            process_no: processOf(e.photo.processId).no,
            process: processOf(e.photo.processId).name,
            date: e.photo.dateKey,
            taken_at: e.photo.takenAt,
          })),
          checks: checkSummary,
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
        if (confirm("送信しました。今回の分を報告済みにしますか？")) markReported();
        else toast("送信しました");
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

async function markReported() {
  const site = currentSite();
  if (!site) return;
  const cands = unreported(await getSitePhotos(site.id));
  if (!cands.length) {
    toast("この期間の写真がありません");
    return;
  }
  const start = periodStart(site, cands);
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
        const targets = cands.filter((p) => p.dateKey <= end);
        targets.forEach((p) => {
          p.reportId = report.id;
          p.sendPick = false;
        });
        await dbPut("reports", report);
        await dbPutMany("photos", targets);
        site.lastReportEnd = end;
        await dbPut("sites", site);
        close();
        toast(`報告済みにしました（次回は${fmtDate(addDays(end, 1))}から）`);
        goReport();
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

/* ---------- マニュアル ---------- */
// マニュアル本文は社内データなのでアプリには入れない。tools/build_manual.py が作る
// マニュアルパック(JSON: items=項目と17分類の対応, pages=ページ画像, guides=撮影ガイド)を
// 初回に取り込み、IndexedDB(meta / manualPages)に保存して使う

let manualMeta = null; // { key:"manual", version, title, builtAt, importedAt, items, guides }

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
    p.guideReport = typeof g === "object" && g ? g.report || "" : ""; // 文字列、または2〜3項目の配列
  });
}

function reportGuideList(p) {
  const g = p.guideReport;
  if (Array.isArray(g)) return g.filter(Boolean);
  return [g || "進み具合が分かる全景"];
}

// 撮影メモ。報告写真（お客様向け）と品質写真（マニュアル用）で撮り方が違うので、色付きラベルで分けて出す
function guideHtml(p, opts = { report: true, record: true }) {
  const lines = [];
  if (opts.record && p.guideRecord) {
    lines.push(`<div class="guideLine"><span class="kindLabel record">品質</span><span>${esc(p.guideRecord)}</span></div>`);
    // 工程カードの「撮影」は報告写真。品質写真は工程マニュアルのチェック横のカメラから撮る
    if (opts.recordHint) lines.push(`<div class="guideHint">品質写真は「工程」タブのマニュアルで、写真要のチェック横のカメラから撮ります</div>`);
  }
  if (opts.report) {
    lines.push(`<div class="guideLine"><span class="kindLabel report">報告</span><span>${esc(reportGuideList(p).join("、"))}</span></div>`);
    lines.push(`<div class="guideNote">${esc(reportNote)}</div>`);
  }
  return lines.length ? `<div class="guideLines">${lines.join("")}</div>` : "";
}

// 大分類ごとの進み具合（今の現場のチェックと品質写真。該当なしにした項目は数えない）
function groupProgress(g) {
  const out = { checks: 0, checksDone: 0, photos: 0, photosDone: 0 };
  if (!manualMeta || !currentSiteId) return out;
  manualMeta.items
    .filter((it) => g.cats.includes(it.cat))
    .forEach((it) => {
      const rec = siteCheckRecs[it.id];
      if (rec && rec.na) return;
      ((it.text && it.text.checks) || []).forEach((c) => {
        const key = "checks|" + c.text;
        out.checks++;
        if (rec && rec.marks[key]) out.checksDone++;
        if (c.photo === "要") {
          out.photos++;
          if (siteRecordPhotos[`${it.id}|${key}`]) out.photosDone++;
        }
      });
    });
  return out;
}

// 6つの大分類カード（ホームと工程タブで共通）。withProgress なら今の現場の進み具合も出す
function renderGroupGrid(container, withProgress = false) {
  container.innerHTML = "";
  GROUPS.forEach((g) => {
    const b = document.createElement("button");
    b.className = "groupCard";
    const pr = withProgress ? groupProgress(g) : null;
    b.innerHTML =
      `<span class="groupArt">${groupArt(g)}</span>` +
      `<span class="groupName">${esc(g.name)}<span class="chev">${icon(ICONS.chevron, 18, 2.6)}</span></span>` +
      (pr && pr.checks
        ? `<span class="groupProg"><span>チェック <b>${pr.checksDone}</b>/${pr.checks}</span>` +
          (pr.photos ? `<span><span class="kindLabel record">品質</span><b>${pr.photosDone}</b>/${pr.photos}</span>` : "") +
          `</span>`
        : "") +
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

async function renderManual() {
  const empty = $("manualEmpty");
  empty.innerHTML = "";
  if (!manualMeta) empty.appendChild(manualEmptyCard());
  await refreshSites();
  await loadSiteChecks();
  renderGroupGrid($("manualGroups"), !!currentSiteId);
}

let currentGroupId = "g1";
let groupItems = [];       // 表示中の大分類に含まれる項目（17分類の順→PDFの順）
let currentItemIdx = 0;
let currentMTab = "check";
let siteCheckRecs = {};    // itemId → チェック記録
let siteRecordPhotos = {}; // "項目ID|区分|チェック文" → 品質写真（最新の1枚）


function allManualItems() {
  if (!manualMeta) return [];
  return GROUPS.flatMap((g) => g.cats.flatMap((pid) => manualMeta.items.filter((it) => it.cat === pid)));
}

async function loadSiteChecks() {
  siteCheckRecs = {};
  siteRecordPhotos = {};
  if (!currentSiteId) return;
  (await dbGetAll("checks", "siteId", currentSiteId)).forEach((r) => (siteCheckRecs[r.itemId] = r));
  (await getSitePhotos(currentSiteId))
    .filter(isRecordPhoto)
    .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1))
    .forEach((p) => (siteRecordPhotos[`${p.itemId}|${p.checkKey}`] = p));
}

function checkRecOf(itemId) {
  return siteCheckRecs[itemId] || { key: `${currentSiteId}|${itemId}`, siteId: currentSiteId, itemId, na: false, marks: {} };
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

  await refreshSites();
  await loadSiteChecks();

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
      html += `<button class="btn btnOutline toReportBtn" data-toreport="1">${icon(ICONS.camera, 18)}この工程の報告写真（撮る・見る）</button>`;
      const done = tx.checks.filter((c) => rec.marks["checks|" + c.text]).length;
      html +=
        `<div class="secHead">${icon(ICONS.checkSquare, 22)}チェックポイント<span class="secRight">` +
        (tx.checks.length ? `<span id="checkProgress">${done}/${tx.checks.length}</span>` : "") +
        `<button class="miniBtn" data-go="docs">詳細を見る${icon(ICONS.chevron, 14)}</button></span></div>`;
      html += tx.checks.length
        ? `<div class="checkList">${tx.checks.map((c) => checkRowHtml("checks", c, rec, it)).join("")}</div>`
        : `<div class="emptyNote">チェック項目はまだ登録されていません。</div>`;
      if (!currentSiteId) html += `<div class="hint">上の「今の現場」から現場を登録すると、チェックを記録できます。</div>`;
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
  const toReport = box.querySelector("[data-toreport]");
  if (toReport) toReport.addEventListener("click", () => openReportProc(it.cat));
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
  const disabled = !currentSiteId || rec.na;
  // 「写真要」のチェックには品質写真のカメラ。撮る前は灰色、撮ったら写真が出る
  let cam = "";
  if (c.photo === "要") {
    const ph = siteRecordPhotos[`${it.id}|${key}`];
    cam = ph
      ? `<button class="checkCam has" data-cam="1" aria-label="品質写真を見る"><img src="${blobUrl("manual", ph.thumb)}" alt=""></button>`
      : `<button class="checkCam" data-cam="1" aria-label="品質写真を撮る"${disabled ? " disabled" : ""}>${icon(ICONS.camera, 22)}</button>`;
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

// 品質写真のカメラ：未撮影なら撮る、撮影済みなら確認（撮り直し・削除）
function onCheckCamera(it, key) {
  if (!currentSiteId) {
    toast("上の「今の現場」から現場を登録すると、品質写真を撮れます");
    return;
  }
  const ph = siteRecordPhotos[`${it.id}|${key}`];
  if (!ph) {
    if (checkRecOf(it.id).na) return;
    openSheet("品質写真", (body, close) => {
      body.appendChild(
        sheetButton("撮影する", "btnPrimary btnLarge", () => {
          close();
          startRecordCamera(it, key);
        })
      );
      body.appendChild(
        sheetButton("写真から選ぶ（標準カメラで撮った写真）", "btnSecondary", () => {
          close();
          startRecordLibrary(it, key);
        })
      );
      body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
    });
    return;
  }
  openPhotoViewer(ph.blob, [
    { label: "撮り直す", cls: "btnPrimary", onClick: () => startRecordCamera(it, key) },
    { label: "写真から選ぶ", cls: "btnGhost", onClick: () => startRecordLibrary(it, key) },
    {
      label: "削除",
      cls: "btnDanger",
      onClick: async () => {
        if (!confirm("この品質写真を削除しますか？")) return false;
        await dbDeleteMany("photos", [ph.id]);
        delete siteRecordPhotos[`${it.id}|${key}`];
        refreshCheckRow(it, key);
        toast("品質写真を削除しました");
      },
    },
  ]);
}

async function saveRecordPhoto(file, takenAt = new Date()) {
  const t = recordTarget;
  recordTarget = null;
  try {
    const rec = await makePhotoRecord(file, t.siteId, shootProcessId, takenAt, { kind: "record", itemId: t.itemId, checkKey: t.checkKey });
    const mapKey = `${t.itemId}|${t.checkKey}`;
    const old = siteRecordPhotos[mapKey];
    if (old && !old.reportId) {
      rec.forReport = !!old.forReport;
      rec.sendPick = !!old.sendPick;
    }
    await dbPut("photos", rec);
    // 撮り直しは前の1枚と入れ替える（ただし報告済みの写真は過去の報告から欠けないよう残す）
    if (old && !old.reportId) await dbDeleteMany("photos", [old.id]);
    if (t.siteId === currentSiteId) siteRecordPhotos[mapKey] = rec;
    const it = groupItems[currentItemIdx];
    if (it && it.id === t.itemId) refreshCheckRow(it, t.checkKey);
    toast("品質写真を保存しました");
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
  if (!currentSiteId) return;
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

// 右上のカメラ：今開いている項目の工程（17分類）の報告写真のページへ
function shootFromGroup() {
  const it = groupItems[currentItemIdx];
  openReportProc(it ? it.cat : groupOf(currentGroupId).cats[0]);
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
    if (tourIdx >= 0 && TOUR_STEPS[tourIdx] && TOUR_STEPS[tourIdx].target() === $("manualCard")) {
      tourIdx++;
      setTimeout(renderTourStep, 60);
    }
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
  const bk = getBackupOpts();
  $("bkSites").checked = bk.sites;
  $("bkChecks").checked = bk.checks;
  $("bkPhotos").checked = bk.photos;
  updateBackupNote();
  $("tourAlwaysChk").checked = getSetting(TOUR_ALWAYS_KEY) === "1";
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
    (b.mark ? `<img class="mark" src="${esc(b.mark)}" alt="">` : "") +
    (b.wordmark ? `<img class="wordmark" src="${esc(b.wordmark)}" alt="${esc(b.company || "")}">` : esc(b.company || "")) +
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
  const site = await refreshSites();
  const card = $("dashSiteCard");
  if (!site) {
    card.innerHTML =
      `<button class="curSiteCard empty"><span class="curSiteIcon">${icon(ICONS.building, 24)}</span>` +
      `<span class="curSiteText"><span class="curSiteName">担当現場を登録しましょう</span><span class="curSiteMeta">タップして現場名を登録します</span></span>` +
      `<span class="siteSwitch">${icon(ICONS.plus, 18)}追加</span></button>`;
    card.firstElementChild.addEventListener("click", addSite);
    $("dashReportSub").textContent = "撮った写真から報告用を選べます。";
    $("dashAlbumSub").textContent = "撮った写真を、工程ごとに確認・整理します。";
  } else {
    const all = await getSitePhotos(site.id);
    const cands = unreported(all);
    const cov = await recordCoverage(site.id);
    const pct = cov && cov.total ? Math.round((cov.done / cov.total) * 100) : 0;
    card.innerHTML =
      `<button class="curSiteCard rich">` +
      `<span class="siteBoard">${HAS_SITE_BOARD ? '<img class="boardBg" src="art/site-bg.webp?v=1" alt=""><img class="boardImg" src="art/site-board.webp?v=1" alt="">' : icon(ICONS.building, 40)}</span>` +
      `<span class="curSiteText"><span class="curSiteLabel">今の現場</span><span class="curSiteName">${esc(site.name)}</span>` +
      `<span class="curSiteMeta">${icon(ICONS.calendar, 14)}${periodLabel(periodStart(site, cands)).text}</span>` +
      `<span class="siteTiles">` +
      (cov ? `<span class="siteTile"><span class="tileLabel">${icon(ICONS.report, 14)}写真要</span><span><b>${cov.done}</b>/${cov.total}</span></span>` : "") +
      `<span class="siteTile"><span class="tileLabel">${icon(ICONS.camSmall, 14)}報告写真</span><span><b>${cands.length}</b> 枚</span></span>` +
      (cov ? `<span class="siteTile"><span class="tileLabel">進み具合</span><span class="tileBar"><span style="width:${pct}%"></span></span><span class="tilePct">${pct}%</span></span>` : "") +
      `</span></span><span class="siteSwitch pillSwitch">切替${icon(ICONS.chevron, 14)}</span></button>`;
    card.firstElementChild.addEventListener("click", openSiteSwitcher);
    const nRec = all.filter(isRecordPhoto).length;
    $("dashAlbumSub").textContent = all.length
      ? `品質写真 ${nRec}枚・報告写真 ${all.length - nRec}枚を、工程ごとに確認できます。`
      : "撮った写真を、工程ごとに確認・整理します。";
    const picks = cands.filter((p) => p.sendPick).length;
    $("dashReportSub").textContent = cands.length
      ? `今回の写真 ${cands.length} 枚（送る写真 ${picks} 枚）から報告できます。`
      : "工程ごとに報告写真を撮って、送る写真を選べます。";
  }

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

// 設定・お知らせ・使い方は、タブの外にある画面。戻るで元の画面に帰る
const SUB_VIEWS = ["settingsView", "announceView", "helpView", "searchView", "siteManageView"];
function openSubView(id) {
  if (!SUB_VIEWS.includes(currentView)) viewBeforeSettings = currentView;
  showView(id);
}
function backFromSubView() {
  const back = { dashView: goDash, manualView: goManual, albumView: goAlbum, reportView: goReport }[viewBeforeSettings];
  if (back) back();
  else {
    // 工程マニュアル・報告の工程ページなど：サブ画面で現場やマニュアルが変わっていることがあるので描き直す
    showView(viewBeforeSettings);
    rerenderCurrentView();
  }
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

/* ---------- バックアップ ---------- */
// 機種変更・故障に備えた書き出しと戻し。マニュアルはBoxから取り込み直せるので含めない。
// 写真を含めるとメールで送れない大きさになるため、その時は「ファイルに保存」（BoxアプリのフォルダもOK）を案内する

const BACKUP_OPT_KEY = "genba-photo-backup-opts";
const BACKUP_KIND = "genba-nav-backup";

function getBackupOpts() {
  try {
    return Object.assign({ sites: true, checks: true, photos: false }, JSON.parse(getSetting(BACKUP_OPT_KEY) || "{}"));
  } catch (e) {
    return { sites: true, checks: true, photos: false };
  }
}

async function updateBackupNote() {
  const opts = { sites: $("bkSites").checked, checks: $("bkChecks").checked, photos: $("bkPhotos").checked };
  setSetting(BACKUP_OPT_KEY, JSON.stringify(opts));
  const note = $("bkNote");
  if (opts.photos) {
    const photos = await dbGetAll("photos");
    const mb = photos.reduce((n, p) => n + (p.blob ? p.blob.size : 0) + (p.thumb ? p.thumb.size : 0), 0) * 1.37 / 1024 / 1024;
    const big = mb * 1024 * 1024 > MAIL_WARN_BYTES;
    note.className = big ? "mutedText warn" : "mutedText";
    note.textContent = big
      ? `写真${photos.length}枚を含めると約${Math.round(mb)}MBになり、メールでは送れません。` +
        "書き出したら共有画面の「ファイルに保存」で、iPhoneの中かBoxアプリのフォルダに保存してください。"
      : `写真${photos.length}枚を含めて約${Math.max(1, Math.round(mb))}MBです。今はメールでも送れますが、写真が増えて15MBを超えるとメールでは送れなくなり、「ファイルに保存」での保存になります。`;
  } else {
    note.className = "mutedText";
    note.textContent = "写真を含めない場合は小さいファイルなので、メールでBoxへ送れます（宛先をコピーします）。";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

async function exportBackup() {
  const opts = { sites: $("bkSites").checked, checks: $("bkChecks").checked, photos: $("bkPhotos").checked };
  if (!opts.sites && !opts.checks && !opts.photos) {
    toast("書き出すものを1つ以上選んでください");
    return;
  }
  setProcessing(true, "バックアップを作成中...");
  let file;
  try {
    const head = {
      kind: BACKUP_KIND,
      schema: 1,
      app_version: APP_VERSION,
      created_at: new Date().toISOString(),
      user: getSetting(USER_NAME_KEY),
      include: opts,
    };
    if (opts.sites) {
      head.sites = await dbGetAll("sites");
      head.reports = await dbGetAll("reports");
      head.settings = { userName: getSetting(USER_NAME_KEY), boxEmail: getSetting(BOX_EMAIL_KEY), manualSite: getSetting(CURRENT_SITE_KEY) };
    }
    if (opts.checks) head.checks = await dbGetAll("checks");
    // 写真は1枚ずつ文字にして並べる（全体を1つの巨大な文字列にするとiPhoneのメモリが足りなくなるため）
    const parts = [JSON.stringify(head).slice(0, -1), ',"photos":['];
    if (opts.photos) {
      const photos = await dbGetAll("photos");
      for (let i = 0; i < photos.length; i++) {
        if (i % 10 === 0) setProcessing(true, `写真を書き出し中... ${i} / ${photos.length}`);
        const p = photos[i];
        const rec = Object.assign({}, p, { blob: await blobToDataUrl(p.blob), thumb: p.thumb ? await blobToDataUrl(p.thumb) : null });
        parts.push((i ? "," : "") + JSON.stringify(rec));
      }
    }
    parts.push("]}");
    const name = safeFileName(`現場ナビ_バックアップ_${todayKey()}${opts.photos ? "_写真あり" : ""}_${getSetting(USER_NAME_KEY) || "未登録"}.json`);
    file = new File(parts, name, { type: "application/json" });
  } catch (e) {
    console.error(e);
    alert("バックアップを作成できませんでした。写真を含めない形で試してください。");
    return;
  } finally {
    setProcessing(false);
  }
  const sizeMb = (file.size / 1024 / 1024).toFixed(1);
  openSheet("バックアップを書き出す", (body, close) => {
    const info = document.createElement("div");
    info.className = "summaryBox";
    info.innerHTML = `ファイル：${esc(file.name)}<br>大きさ：約${sizeMb}MB`;
    body.appendChild(info);
    const mailable = file.size <= MAIL_WARN_BYTES;
    const how = document.createElement("div");
    how.className = mailable ? "mutedText" : "warnText";
    how.textContent = mailable
      ? "共有画面でメールを選び、宛先にBoxのアドレスを貼り付けて送ってください（宛先をコピーします）。「ファイルに保存」も選べます。"
      : "メールでは送れない大きさです。共有画面で「ファイルに保存」を選び、iPhoneの中かBoxアプリのフォルダに保存してください。";
    body.appendChild(how);
    body.appendChild(
      sheetButton("共有画面を開く", "btnPrimary btnLarge", async () => {
        const email = getBoxEmail();
        if (mailable && email && navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: file.name });
            close();
            toast("バックアップを書き出しました");
          } catch (e) {
            /* キャンセル */
          }
        } else {
          const a2 = document.createElement("a");
          a2.href = URL.createObjectURL(file);
          a2.download = file.name;
          a2.click();
          setTimeout(() => URL.revokeObjectURL(a2.href), 2000);
          close();
        }
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

// 戻すときは「足す」。同じIDのものがあればそのまま残し、チェックは新しい方を残してまとめる
async function onRestorePicked() {
  const input = $("restoreInput");
  const file = input.files[0];
  input.value = "";
  if (!file) return;
  setProcessing(true, "バックアップを読み込み中...");
  let data;
  try {
    data = JSON.parse(await file.text());
    if (!data || data.kind !== BACKUP_KIND) throw new Error("not a backup");
  } catch (e) {
    setProcessing(false);
    alert("バックアップのファイルを読み込めませんでした。「現場ナビ_バックアップ_○○.json」を選んでください。");
    return;
  }
  setProcessing(false);
  const n = (k) => (Array.isArray(data[k]) ? data[k].length : 0);
  const msg =
    `${fmtDateTime(data.created_at)}（${data.user || "名前なし"}）のバックアップです。\n` +
    `現場${n("sites")}件・報告${n("reports")}件・チェック${n("checks")}項目・写真${n("photos")}枚\n\n` +
    "今のデータに足して戻します（すでにあるものは消えません）。よろしいですか？";
  if (!confirm(msg)) return;
  setProcessing(true, "戻しています...");
  try {
    const add = async (store, rows, keyName) => {
      if (!rows || !rows.length) return 0;
      const exist = new Set((await dbGetAll(store)).map((r) => r[keyName]));
      const fresh = rows.filter((r) => !exist.has(r[keyName]));
      for (let i = 0; i < fresh.length; i += 20) await dbPutMany(store, fresh.slice(i, i + 20));
      return fresh.length;
    };
    const added = {};
    added.sites = await add("sites", data.sites, "id");
    added.reports = await add("reports", data.reports, "id");
    if (data.checks && data.checks.length) {
      const current = Object.fromEntries((await dbGetAll("checks")).map((r) => [r.key, r]));
      const merged = data.checks.map((r) => {
        const cur = current[r.key];
        if (!cur) return r;
        const marks = Object.assign({}, cur.marks);
        Object.entries(r.marks || {}).forEach(([k, m]) => {
          if (!marks[k] || marks[k].at < m.at) marks[k] = m;
        });
        const naFromBackup = r.na && (!cur.naAt || (r.naAt && r.naAt > cur.naAt));
        return Object.assign({}, cur, { marks }, naFromBackup ? { na: r.na, naAt: r.naAt, naBy: r.naBy } : {});
      });
      await dbPutMany("checks", merged);
      added.checks = merged.length;
    }
    if (data.photos && data.photos.length) {
      const exist = new Set((await dbGetAll("photos")).map((p) => p.id));
      const siteIds = new Set((await dbGetAll("sites")).map((x) => x.id));
      const reportIds = new Set((await dbGetAll("reports")).map((x) => x.id));
      // 現場が無い写真は見えなくなるので入れない（写真だけのバックアップを別の端末に戻した時など）
      const fresh = data.photos.filter((p) => !exist.has(p.id) && siteIds.has(p.siteId));
      added.skipped = data.photos.filter((p) => !exist.has(p.id) && !siteIds.has(p.siteId)).length;
      fresh.forEach((p) => {
        if (p.reportId && !reportIds.has(p.reportId)) p.reportId = null;
      });
      for (let i = 0; i < fresh.length; i++) {
        if (i % 10 === 0) setProcessing(true, `写真を戻しています... ${i} / ${fresh.length}`);
        const p = fresh[i];
        p.blob = await (await fetch(p.blob)).blob();
        p.thumb = p.thumb ? await (await fetch(p.thumb)).blob() : p.blob;
        await dbPut("photos", p);
      }
      added.photos = fresh.length;
    }
    if (data.settings) {
      if (!getSetting(USER_NAME_KEY) && data.settings.userName) setSetting(USER_NAME_KEY, data.settings.userName);
      if (!getSetting(BOX_EMAIL_KEY) && data.settings.boxEmail) setSetting(BOX_EMAIL_KEY, data.settings.boxEmail);
    }
    await refreshSites();
    await loadSiteChecks();
    toast(
      `戻しました（現場${added.sites || 0}・チェック${added.checks || 0}・写真${added.photos || 0}）` +
        (added.skipped ? `。現場の登録がない写真${added.skipped}枚は戻しませんでした（登録情報も含めたバックアップから戻してください）` : "")
    );
    renderSettings();
  } catch (e) {
    console.error(e);
    alert("途中で失敗しました。もう一度試してください（すでに戻した分は残っています）。");
  } finally {
    setProcessing(false);
  }
}

/* ---------- 使い方の案内（チュートリアル） ---------- */
// 照らした場所を吹き出しで説明する。ページの操作は止めないので、照らした所をそのままタップして進める。
// 名前はチェックの記録に「誰が」を残すため（後で品質管理・育成の指標にも使う想定）

const TOUR_DONE_KEY = "genba-photo-tour-done";
const TOUR_ALWAYS_KEY = "genba-photo-tour-always";

let tourIdx = -1;

const TOUR_STEPS = [
  {
    view: "dashView",
    target: () => document.querySelector("#dashView .settingsBtn"),
    text: "ようこそ！まずはお名前を登録しましょう。右上の歯車をタップしてください。",
    waitView: "settingsView",
  },
  {
    view: "settingsView",
    target: () => $("userNameInput"),
    text: "ここにお名前を入力してください。工程マニュアルのチェックや報告に、名前が一緒に記録されます。",
    next: true,
    onNext: () => {
      const v = $("userNameInput").value.trim();
      if (v) setSetting(USER_NAME_KEY, v);
    },
  },
  {
    view: "settingsView",
    target: () => $("manualCard"),
    text: () =>
      manualMeta
        ? "マニュアルは取り込み済みです。新しい版が出たら、ここから取り込み直します。"
        : "次に、Boxにある「マニュアル_○○.json」をここから取り込みます（初回だけ）。あとで取り込む場合は「次へ」。",
    next: true,
    scroll: true,
  },
  {
    view: "*",
    target: () => document.querySelector('.tabBtn[data-tab="home"]'),
    text: "最後に、担当現場を登録します。下の「ホーム」をタップしてください。",
    waitView: "dashView",
  },
  {
    view: "dashView",
    target: () => $("dashSiteCard"),
    text: "ここが「今の現場」です。タップして現場名を登録・切り替えします。写真やチェックは、この現場に記録されます。",
    next: true,
    nextLabel: "完了",
  },
];

function tourShouldStart() {
  return getSetting(TOUR_ALWAYS_KEY) === "1" || getSetting(TOUR_DONE_KEY) !== "1";
}

function startTour() {
  tourIdx = 0;
  if (currentView !== "dashView") goDash();
  else renderTourStep();
}

function endTour() {
  tourIdx = -1;
  $("tour").hidden = true;
  setSetting(TOUR_DONE_KEY, "1");
}

function tourOnView(id) {
  if (tourIdx < 0) return;
  const step = TOUR_STEPS[tourIdx];
  if (step.waitView && id === step.waitView) {
    tourIdx++;
  }
  setTimeout(renderTourStep, 60);
}

function renderTourStep() {
  if (tourIdx < 0) return;
  if (tourIdx >= TOUR_STEPS.length) {
    endTour();
    toast("準備完了です。使い方はホーム右上の「？」からいつでも見られます");
    return;
  }
  const step = TOUR_STEPS[tourIdx];
  const tour = $("tour");
  const onRightView = step.view === "*" || step.view === currentView;
  const target = onRightView ? step.target() : null;
  if (!target || target.offsetParent === null) {
    tour.hidden = true; // 別の画面に移ったときは隠しておき、戻ったら再表示する
    return;
  }
  if (step.scroll) target.scrollIntoView({ block: "center" });
  tour.hidden = false;
  $("tourStep").textContent = `使い方の案内 ${tourIdx + 1} / ${TOUR_STEPS.length}`;
  $("tourText").textContent = typeof step.text === "function" ? step.text() : step.text;
  $("tourNext").hidden = !step.next;
  $("tourNext").textContent = step.nextLabel || "次へ";
  requestAnimationFrame(placeTourSpot);
}

function placeTourSpot() {
  if (tourIdx < 0 || $("tour").hidden) return;
  const step = TOUR_STEPS[tourIdx];
  const target = step && step.target();
  if (!target) return;
  const r = target.getBoundingClientRect();
  const pad = 6;
  const spot = $("tourSpot");
  spot.style.left = `${r.left - pad}px`;
  spot.style.top = `${r.top - pad}px`;
  spot.style.width = `${r.width + pad * 2}px`;
  spot.style.height = `${r.height + pad * 2}px`;
  const bubble = $("tourBubble");
  const bh = bubble.offsetHeight;
  const below = r.bottom + 16;
  bubble.style.top = below + bh < window.innerHeight - 80 ? `${below}px` : `${Math.max(16, r.top - bh - 16)}px`;
}

window.addEventListener("scroll", () => requestAnimationFrame(placeTourSpot), { passive: true });
window.addEventListener("resize", () => requestAnimationFrame(placeTourSpot));

/* ---------- 起動 ---------- */

function goManual() {
  renderManual();
  showView("manualView");
}

function init() {
  $("shotCloseBtn").innerHTML = icon(ICONS.x, 24);
  $("reportProcBackBtn").innerHTML = icon(ICONS.back, 26);
  $("reportPastBackBtn").innerHTML = icon(ICONS.back, 26);
  $("groupBackBtn").innerHTML = icon(ICONS.back, 26);
  $("settingsBackBtn").innerHTML = icon(ICONS.back, 26);
  document.querySelectorAll(".settingsBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.settings, 24);
    b.addEventListener("click", openSettings);
  });
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const size = el.classList.contains("tabIcon") ? 24 : el.classList.contains("reportCardIcon") ? 40 : el.classList.contains("bannerIcon") || el.classList.contains("albumCardIcon") ? 28 : el.closest(".toolBtn") ? 22 : 20;
    el.innerHTML = icon(ICONS[el.dataset.icon], size);
  });

  document.querySelectorAll(".curSiteBar").forEach((b) => b.addEventListener("click", openSiteSwitcher));
  $("manageAddBtn").addEventListener("click", addSite);
  $("albumSort").addEventListener("change", (e) => {
    albumState.sort = e.target.value;
    renderAlbum();
  });
  $("albumUseBtn").addEventListener("click", albumUseForReport);
  $("albumColsBtn").addEventListener("click", () => {
    albumState.cols = albumState.cols === 2 ? 3 : 2;
    setSetting(ALBUM_COLS_KEY, String(albumState.cols));
    renderAlbum();
  });
  $("procBarDoneBtn").addEventListener("click", goReport);
  $("albumRetagBtn").addEventListener("click", albumRetag);
  $("albumSaveBtn").addEventListener("click", () => sharePhotos(currentSite(), albumPhotos.filter((p) => albumSel.has(p.id))));
  $("albumDeleteBtn").addEventListener("click", albumDelete);
  $("reportProcBackBtn").addEventListener("click", goReport);
  $("reportPastBackBtn").addEventListener("click", goReport);
  $("reportShootBtn").addEventListener("click", () => {
    shotFrom = "report";
    startCamera(reportProcId);
  });
  $("reportImportBtn").addEventListener("click", () => startLibrary(reportProcId));
  $("pastShareBtn").addEventListener("click", () => sharePhotos(currentSite(), pastPhotos));
  $("recordLibraryInput").addEventListener("change", onRecordLibraryPicked);
  $("cameraInput").addEventListener("change", onCameraPicked);
  $("libraryInput").addEventListener("change", onLibraryPicked);
  $("shotAgainBtn").addEventListener("click", () => startCamera(shootProcessId));
  $("shotOtherBtn").addEventListener("click", pickOtherProcess);
  $("shotDoneBtn").addEventListener("click", leaveShot);
  $("shotCloseBtn").addEventListener("click", leaveShot);
  $("shotUndoBtn").addEventListener("click", undoLastShot);
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
  $("dashAlbumBtn").addEventListener("click", goAlbum);
  $("sendBoxBtn").addEventListener("click", sendToBox);
  $("shareSelectedBtn").addEventListener("click", shareSelected);
  $("groupShootBtn").innerHTML = icon(ICONS.camera, 24);
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
  ["bkSites", "bkChecks", "bkPhotos"].forEach((id) => $(id).addEventListener("change", updateBackupNote));
  $("backupBtn").addEventListener("click", exportBackup);
  $("restoreBtn").addEventListener("click", () => $("restoreInput").click());
  $("restoreInput").addEventListener("change", onRestorePicked);
  $("tourAlwaysChk").addEventListener("change", (e) => setSetting(TOUR_ALWAYS_KEY, e.target.checked ? "1" : "0"));
  $("tourAgainBtn").addEventListener("click", startTour);
  $("helpTourBtn").addEventListener("click", startTour);
  $("tourSkip").addEventListener("click", endTour);
  $("tourNext").addEventListener("click", () => {
    const step = TOUR_STEPS[tourIdx];
    if (step && step.onNext) step.onNext();
    tourIdx++;
    renderTourStep();
  });
  $("markReportedBtn").addEventListener("click", markReported);
  $("deleteReportPhotosBtn").addEventListener("click", deleteReportPhotos);
  document.querySelector(".sheetBackdrop").addEventListener("click", () => ($("sheet").hidden = true));

  document.querySelectorAll(".tabBtn").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.tab === "home") goDash();
      if (b.dataset.tab === "manual") goManual();
      if (b.dataset.tab === "photos") goAlbum();
      if (b.dataset.tab === "report") goReport();
    })
  );

  // 写真がブラウザの判断で消されないよう永続化を要求（ホーム画面追加時は通常許可される）
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  loadManualMeta().then(() => {
    goDash();
    if (tourShouldStart()) startTour();
  });
}

init();
