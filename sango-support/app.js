"use strict";
/* 山郷サポート：建物から入って業者の連絡先を調べ、トラブルと対応を写真付きで記録するPWA。
   社内データ（建物・業者・電話）はアプリに持たず、「マスターパック」JSONを取り込んで端末内（IndexedDB）に保存する。 */

const APP_VERSION = 23;
const ART_V = 2; // 絵を差し替えたら上げる
const BOX_UPLOAD_EMAIL = "______.7imjq60uox1556sk@u.box.com"; // Box「8.山郷サポート/報告」のアップロード用（アップロード専用なので公開しても読まれない）
const ANNOUNCEMENTS = [
  { date: "2026-10-05", type: "fix", text: "自動送信の安全性を高めました（送信中は画面を閉じられない、失敗したら残りの写真の送信も止める、送信中に編集した症例は報告済みにしない、窓口のエラーを分かりやすく表示）。" },
  { date: "2026-10-05", type: "feature", text: "「管理者に報告する」を、ボタン1つで自動送信にしました（メールの共有画面は不要）。電波が悪くて送れない時は、症例は端末に残り、もう一度送るか、メールで送れます（予備）。設定の「報告の送り方」で、つながるか確認できます。" },
  { date: "2026-10-05", type: "fix", text: "最終バグチェックで見つかった点を直しました（古い値で上書きして最新の変更を消す問題、削除途中の失敗、iPhoneでのコピー、写真ファイル名の取り違えなど）。" },
  { date: "2026-10-05", type: "feature", text: "症例を「LINEで連絡する」ボタンを追加しました（文章と写真をLINEに送れます）。LINEで送った内容は管理ページには載らないので、受け取った方が登録し直してください。送ると症例に「LINE連絡済み」の印が付きます。管理ページに載せたいときは、これまでどおり「管理者に報告する」を押します。" },
  { date: "2026-10-05", type: "feature", text: "「報告済み」「完了」を一覧で見分けられるようにしました（報告済みは薄く、完了はさらに薄く表示）。解決したら症例の詳細から「完了にする」を押してください。写真は「カメラで撮る」「撮影済みを選ぶ」から追加できます（撮影日時も読み取ります）。送信先アドレスのコピーボタンも付けました。" },
  { date: "2026-10-04", type: "fix", text: "バグチェックで見つかった点を直しました（報告の送り方を「準備→メールを開く」の2段階にして、iPhoneで共有画面が開かない問題を避けるなど）。" },
  { date: "2026-10-04", type: "feature", text: "管理者への報告の送信先を、最初から設定済みにしました（設定で入力する必要はありません）。" },
  { date: "2026-10-04", type: "feature", text: "アプリの名前を「山郷サポート」にしました（ホーム画面に追加し直すと、アイコンの名前も変わります）。分類の一覧から電話ボタンを外し、分類を開いて症例を見てから連絡先に進む形にしました。" },
  { date: "2026-10-04", type: "feature", text: "分類を押した画面を「何が起きたかを書く → 連絡先 → これまでの症例」の順にしました。「設備カテゴリ」は、建具・内装・外構なども含むため「分類」に変えました。" },
  { date: "2026-10-04", type: "feature", text: "設備を押すと、まず症例と写真、次に連絡先が出るようにしました。言葉も「症例」「報告」に統一し、保存したあとにそのまま報告できます。LINEで受けた報告を残す時の「報告した人」欄も付けました。" },
  { date: "2026-10-04", type: "feature", text: "LARCH（バックヤード）と外構の絵を入れました。" },
  { date: "2026-10-04", type: "feature", text: "ホームと建物ページに「困ったときは」の連絡先（本社・担当）を目立つ形で置きました。" },
  { date: "2026-10-04", type: "fix", text: "記録は「あなたが残したものだけ」が出ることが分かるよう、表示の言葉を直しました。" },
  { date: "2026-10-04", type: "feature", text: "電話ボタンを押すと、相手の名前と番号を確認してから電話をかけるようにしました。" },
  { date: "2026-10-04", type: "feature", text: "ホーム画面のアプリアイコンを新しくしました（追加し直すと反映されます）。" },
  { date: "2026-10-04", type: "fix", text: "電話ボタンをカードの下に移し、設備名が読みやすくなりました。" },
  { date: "2026-10-04", type: "fix", text: "設定ボタンを歯車の形にしました。" },
  { date: "2026-10-04", type: "feature", text: "ロゴ、ホームの風景、記録が空の時の絵を入れました。" },
  { date: "2026-10-04", type: "feature", text: "建物とカテゴリの絵を入れました。" },
  { date: "2026-10-04", type: "feature", text: "設備サポートを作りました。建物から業者の連絡先を調べて電話でき、トラブルと対応を写真付きで記録できます。" },
];

const P = "sango-support-";
const DB_NAME = "sango-support";
const MAIL_WARN_BYTES = 15 * 1024 * 1024;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function getSetting(k, def = "") { try { const v = localStorage.getItem(P + k); return v == null ? def : v; } catch (e) { return def; } }
function setSetting(k, v) { try { localStorage.setItem(P + k, v); } catch (e) {} }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function deviceId() { let d = getSetting("device"); if (!d) { d = uid(); setSetting("device", d); } return d; }
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (t) => { const d = new Date(t); return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`; };
const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; };
const mmdd = (t) => { const d = new Date(t); return `${pad(d.getMonth() + 1)}${pad(d.getDate())}`; };
const safeName = (s) => String(s).replace(/[\\/:*?"<>|\s]+/g, "_");
const telHref = (p) => "tel:" + String(p).replace(/[^\d+]/g, "");

/* ---------- アイコン ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  doc: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M10 13h6M10 17h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M5 18l5-5 4 4 2-2 3 3"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
  build: '<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M10 21v-6h4v6"/>',
  tool: '<path d="M14 6a4 4 0 005 5l-8 8a2 2 0 01-3-3l8-8z"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0114 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
};
const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
function fillIcons(root) { root.querySelectorAll("[data-icon]").forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.icon); }); }

/* ---------- IndexedDB ---------- */
let dbPromise;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        d.createObjectStore("meta", { keyPath: "key" });
        d.createObjectStore("records", { keyPath: "id" });
        d.createObjectStore("photos", { keyPath: "id" }).createIndex("recordId", "recordId");
        d.createObjectStore("images", { keyPath: "id" }); // 画像本体は別に持ち、一覧は軽いサムネだけ読む
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}
async function run(store, mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(store, mode);
    const r = fn(tx.objectStore(store), tx);
    tx.oncomplete = () => resolve(r && "result" in r ? r.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
const dbGet = (s, k) => run(s, "readonly", (st) => st.get(k));
const dbAll = (s) => run(s, "readonly", (st) => st.getAll());
const dbPut = (s, o) => run(s, "readwrite", (st) => st.put(o));
const dbDel = (s, k) => run(s, "readwrite", (st) => st.delete(k));
const photosOf = (recordId) => run("photos", "readonly", (st) => st.index("recordId").getAll(recordId));

/* ---------- マスター（社内データ） ---------- */
let master = null;
const bById = (id) => (master && master.buildings.find((b) => b.id === id)) || null;
const cById = (id) => (master && master.categories.find((c) => c.id === id)) || null;
const entryOf = (b, c) => (master && master.entries.find((e) => e.b === b && e.c === c)) || { b, c, none: false, companies: [], note: "" };
function normMaster(data) {
  if (!data || data.kind !== "sango-support-master" || !Array.isArray(data.buildings) || !Array.isArray(data.categories) || !Array.isArray(data.entries)) throw new Error("山郷サポート用のマスターデータではありません");
  if (data.buildings.some((b) => !b || !b.id || !b.name) || data.categories.some((c) => !c || !c.id || !c.label)) throw new Error("マスターデータの建物または分類の情報が足りません");
  if (data.api && !(typeof data.api.url === "string" && /^https:\/\/script\.google\.com\//.test(data.api.url) && typeof data.api.token === "string" && data.api.token)) data.api = null; // 送り先は、Google Apps Script のURLだけ許可
  data.entries = data.entries.filter((e) => e && e.b && e.c).map((e) => ({ ...e, note: typeof e.note === "string" ? e.note : "", companies: Array.isArray(e.companies) ? e.companies.filter((x) => x && typeof x === "object") : [] }));
  if (data.help && typeof data.help === "object") data.help = { ...data.help, contacts: Array.isArray(data.help.contacts) ? data.help.contacts.filter((c) => c && typeof c === "object" && c.name) : [] };
  else data.help = null;
  return data;
}
async function loadMaster() {
  const m = await dbGet("meta", "master");
  try { master = m && m.data ? normMaster(m.data) : null; } catch (e) { master = null; }
  return master;
}
async function importMaster(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { throw new Error("JSONとして読めませんでした"); }
  data = normMaster(data);
  await dbPut("meta", { key: "master", data, importedAt: Date.now() });
  master = data;
}

/* ---------- 画像 ---------- */
// JPEGのEXIFから撮影日時を読む（縮小するとEXIFは消えるので、縮小前の元ファイルから）。読めなければ null
async function readExifDate(file) {
  try {
    const v = new DataView(await file.slice(0, 256 * 1024).arrayBuffer());
    if (v.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off), size = v.getUint16(off + 2);
      if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) return parseTiffDate(v, off + 10);
      if ((marker & 0xff00) !== 0xff00) return null;
      off += 2 + size;
    }
  } catch (e) { /* 読めなければ撮影日不明として扱う */ }
  return null;
}
function parseTiffDate(v, tiff) {
  const le = v.getUint16(tiff) === 0x4949;
  const u16 = (o) => v.getUint16(o, le), u32 = (o) => v.getUint32(o, le);
  const readIfd = (ifdOff) => {
    const entries = {};
    const n = u16(tiff + ifdOff);
    for (let i = 0; i < n; i++) { const e = tiff + ifdOff + 2 + i * 12; entries[u16(e)] = { count: u32(e + 4), value: u32(e + 8) }; }
    return entries;
  };
  const readAscii = (en) => { let s = ""; for (let i = 0; i < en.count - 1; i++) s += String.fromCharCode(v.getUint8(tiff + en.value + i)); return s; };
  const ifd0 = readIfd(u32(tiff + 4));
  let str = null;
  if (ifd0[0x8769]) { const exif = readIfd(ifd0[0x8769].value); if (exif[0x9003]) str = readAscii(exif[0x9003]); }
  if (!str && ifd0[0x0132]) str = readAscii(ifd0[0x0132]);
  const m = str && str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}
async function resizeImage(file, maxEdge) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (e) {
    const u = URL.createObjectURL(file);
    try { bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; }); } finally { setTimeout(() => URL.revokeObjectURL(u), 3000); }
  }
  const w = bmp.width, h = bmp.height, s = Math.min(1, maxEdge / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s); c.height = Math.round(h * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  if (bmp.close) bmp.close();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), "image/jpeg", 0.82));
}

/* ---------- 表示ユーティリティ ---------- */
const urlPool = [];
function blobUrl(blob) { const u = URL.createObjectURL(blob); urlPool.push(u); return u; }
function clearUrls() { while (urlPool.length) URL.revokeObjectURL(urlPool.pop()); }
let toastTimer;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2800); }
function house(group) {
  const roof = group === "Villa" ? "#8a6a45" : group === "施設" ? "#6d5a45" : "#7a8a6a";
  return `<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="72" rx="52" ry="6" fill="#cfdcc2"/><rect x="38" y="36" width="44" height="32" fill="#b98b57"/><path d="M30 38 L60 16 L90 38 Z" fill="${roof}"/><rect x="52" y="48" width="10" height="20" fill="#f3d58c"/><rect x="68" y="46" width="9" height="9" fill="#f3d58c"/><path d="M14 68 L22 40 L30 68 Z" fill="#5f8a4f"/><path d="M94 68 L102 36 L110 68 Z" fill="#4f7a43"/></svg>`;
}
function bldImg(b) { return `<img src="art/bld-${esc(b.id)}.webp?v=${ART_V}" alt="" loading="lazy" data-fb="bld" data-group="${esc(b.group)}">`; }
function catIconHtml(c) { return `<img src="art/${esc(c.id.toLowerCase())}.webp?v=${ART_V}" alt="" loading="lazy" data-fb="cat" data-glyph="${esc(c.glyph)}">`; }
document.addEventListener("error", (e) => { // 絵が無い時の仮表示（GPTの素材を置くまで）
  const t = e.target;
  if (!t || t.tagName !== "IMG" || !t.dataset.fb) return;
  if (t.dataset.fb === "bld") { const w = document.createElement("span"); w.innerHTML = house(t.dataset.group); t.replaceWith(w.firstChild); }
  else if (t.dataset.fb === "cat") t.replaceWith(document.createTextNode(t.dataset.glyph));
  else t.remove();
}, true);

/* ---------- シート ---------- */
function openSheet(title, build, onClose) {
  const back = document.createElement("div");
  back.className = "sheetBack";
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  const head = document.createElement("div");
  head.className = "sheetHead";
  head.innerHTML = `<h3>${esc(title)}</h3><button class="iconBtn" aria-label="閉じる">${icon("close")}</button>`;
  const body = document.createElement("div");
  sheet.append(head, body);
  back.appendChild(sheet);
  const close = () => { back.remove(); if (onClose) onClose(); };
  head.querySelector("button").onclick = close;
  back.addEventListener("click", (e) => { if (e.target === back && !back.dataset.locked) close(); });
  $("sheetRoot").appendChild(back);
  build(body, close);
  fillIcons(body);
  return close;
}

/* ---------- ルーティング ---------- */
const route = () => {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, q] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const dec = (v) => { try { return decodeURIComponent(v); } catch (e) { return v; } };
  return { name: parts[0] || "home", id: parts[1] ? dec(parts[1]) : "", sub: parts[2] || "", sid: parts[3] ? dec(parts[3]) : "", q: new URLSearchParams(q || "") };
};
const go = (hash) => { location.hash = hash; };
const goReplace = (hash) => location.replace(location.pathname + location.search + hash);

async function render() {
  try { await renderInner(); } catch (e) {
    console.error(e);
    $("main").innerHTML = `<div class="empty"><br>画面を表示できませんでした。<br><br><button class="btn btnPrimary" id="errHome">ホームへ戻る</button> <button class="btn" id="errSet">設定を開く（データの取り込み直し）</button></div>`;
    $("errHome").onclick = () => goReplace("#/home"); $("errSet").onclick = () => goReplace("#/settings");
  }
}
async function renderInner() {
  const lb = $("lightbox"); if (lb) { lb.hidden = true; lb.innerHTML = ""; }
  $("sheetRoot").innerHTML = "";
  clearUrls();
  const r = route();
  if (r.name !== "new") form = null;
  const main = $("main");
  const back = $("backBtn"), title = $("topTitle"), brand = $("topBrand");
  const showBack = r.name !== "home" && r.name !== "mine";
  back.hidden = !showBack;
  brand.hidden = r.name !== "home";
  title.hidden = r.name === "home";
  $("tabbar").hidden = r.name === "new" || r.name === "r";
  document.querySelectorAll("#tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === (r.name === "mine" ? "mine" : r.name === "home" || r.name === "b" ? "home" : "")));
  main.innerHTML = "";
  window.scrollTo(0, 0);
  if (r.name === "home") await viewHome(main);
  else if (r.name === "b" && r.sub === "c") await viewCategory(main, r.id, r.sid);
  else if (r.name === "b") await viewBuilding(main, r.id);
  else if (r.name === "new") await viewForm(main, r);
  else if (r.name === "mine") await viewMine(main);
  else if (r.name === "r") await viewDetail(main, r.id);
  else if (r.name === "settings") await viewSettings(main);
  else goReplace("#/home");
  fillIcons(document.body);
}

/* ---------- 「困ったときは」（本社・自分など。不明な時はまずここ） ---------- */
function helpCard(compact) {
  const h = master && master.help;
  if (!h || !Array.isArray(h.contacts) || !h.contacts.length) return "";
  const btns = h.contacts.map((c) => c.phone
    ? `<a class="helpCall" href="${telHref(c.phone)}" data-name="${esc(c.name)}" data-phone="${esc(c.phone)}">${icon("phone")}<span class="hcName">${esc(c.name)}</span><span class="hcTel">${esc(c.phone)}</span></a>`
    : `<span class="helpCall off">${icon("phone")}<span class="hcName">${esc(c.name)}</span><span class="hcTel">番号は未登録</span></span>`).join("");
  return `<div class="helpCard${compact ? " compact" : ""}"><div class="helpTitle">${esc(h.title || "困ったときは")}</div>${h.lead && !compact ? `<div class="helpLead">${esc(h.lead)}</div>` : ""}<div class="helpBtns">${btns}</div></div>`;
}

/* ---------- ホーム ---------- */
async function viewHome(main) {
  $("topLogo").innerHTML = `<img src="art/logo.webp?v=${ART_V}" alt="" data-fb="x"><span style="font-weight:700;font-size:19px">山郷サポート</span>`;
  const hero = `<div class="homeHero"><div class="heroText"><h2>建物を選ぶ</h2><p>連絡先の確認と症例の管理</p></div><img class="heroLand" src="art/hero.webp?v=${ART_V}" alt="" data-fb="x"></div>`;
  if (!master) {
    main.innerHTML = hero + `<div class="empty" style="margin-top:12px"><img class="emptyArt" src="art/empty-master.webp?v=${ART_V}" alt="" data-fb="x"><br>業者データがまだ入っていません。<br>本社から配られたマスターデータ（JSON）を取り込んでください。<br><button class="btn btnPrimary" id="goSettings">設定を開く</button></div>`;
    $("goSettings").onclick = () => go("#/settings");
    return;
  }
  const recs = await dbAll("records");
  const count = {};
  recs.forEach((r) => { count[r.buildingId] = (count[r.buildingId] || 0) + 1; });
  const groups = [];
  master.buildings.forEach((b) => { let g = groups.find((x) => x.name === b.group); if (!g) groups.push((g = { name: b.group, list: [] })); g.list.push(b); });
  main.innerHTML = hero + helpCard(false) + groups.map((g) => `
    <div class="sectionHead"><h3>${esc(g.name)}</h3><span class="rule"></span><span class="count">${g.list.length}件</span></div>
    <div class="bldGrid">${g.list.map((b) => `
      <button class="bldCard" data-b="${esc(b.id)}">
        <div class="bldImg">${bldImg(b)}</div>
        <div class="bldName"><span>${esc(b.name)}</span>${icon("chevron")}</div>
        <div class="bldSub">${count[b.id] ? `あなたの症例 ${count[b.id]}件` : "連絡先を確認"}</div>
      </button>`).join("")}</div>`).join("");
  main.querySelectorAll(".bldCard").forEach((el) => (el.onclick = () => go("#/b/" + encodeURIComponent(el.dataset.b))));
}

/* ---------- 建物ページ ---------- */
function catSummary(e) {
  if (e.none) return { text: "設置なし", cls: "muted2" };
  if (e.companies.length) return { text: e.companies.map((c) => c.name).join("・"), cls: "" };
  return { text: e.note ? "備考を見る" : "未登録", cls: "muted2" };
}
async function viewBuilding(main, bid) {
  const b = bById(bid);
  if (!b) { goReplace("#/home"); return; }
  $("topTitle").textContent = b.name;
  const recs = (await dbAll("records")).filter((r) => r.buildingId === bid).sort((a, c) => c.createdAt - a.createdAt);
  main.innerHTML = `
    <div class="pageHero"><div class="heroText"><h2>${esc(b.name)}</h2><p>連絡先と症例</p></div><div class="fbHero bldImg" style="background:none">${bldImg(b)}</div></div>
    ${helpCard(true)}
    <div class="sectionHead"><h3>分類から探す</h3><span class="rule"></span></div>
    <div class="catGrid">${master.categories.map((c) => {
      const e = entryOf(bid, c.id), s = catSummary(e);
      return `<div class="catCard${e.none ? " none" : ""}" data-c="${esc(c.id)}" role="button" tabindex="0">
        <div class="catIcon">${catIconHtml(c)}</div>
        <div class="catBody"><div class="catLabel">${esc(c.label)}</div><div class="catSub ${s.cls}">${esc(s.text)}</div></div>
        ${e.companies.length > 1 ? `<span class="chipN">${e.companies.length}社</span>` : ""}
      </div>`;
    }).join("")}</div>
    <div class="sectionHead"><h3>あなたの症例</h3><span class="rule"></span><span class="count">${recs.length}件</span></div>
    <div class="mutedText" style="margin:-2px 4px 8px">この端末で、あなたが残した症例だけが出ます。</div>
    <div class="recList" id="bRecs"></div>
    <button class="fab" id="fabAdd">${icon("plus")}症例を追加</button>`;
  main.querySelectorAll(".catCard").forEach((el) => (el.onclick = (ev) => { if (ev.target.closest("[data-stop]")) return; go(`#/b/${encodeURIComponent(bid)}/c/${encodeURIComponent(el.dataset.c)}`); }));
  $("fabAdd").onclick = () => go(`#/new?b=${encodeURIComponent(bid)}`);
  await fillRecList($("bRecs"), recs, "この建物で、あなたが残した症例はまだありません。");
}
function contactHtml(bid, cid) {
  const e = entryOf(bid, cid);
  let h = "";
  if (e.none) h += `<div class="empty">この建物には設置されていません。</div>`;
  e.companies.forEach((co) => {
    h += `<div class="vendorCard"><div class="vName">${esc(co.name)}</div>
      <div class="vSub">${co.contact ? "担当：" + esc(co.contact) : "担当者名は未登録"}</div>
      ${co.phone ? `<a class="callBtn big" href="${telHref(co.phone)}" data-name="${esc(co.name + (co.contact ? "（" + co.contact + "）" : ""))}" data-phone="${esc(co.phone)}">${icon("phone")}${esc(co.phone)}</a>` : `<span class="callBtn big off">電話番号は未登録</span>`}</div>`;
  });
  if (!e.none && !e.companies.length) h += `<div class="empty">この分類の担当業者はまだ登録されていません。</div>`;
  if (e.note) h += `<div class="vendorCard"><div class="vSub" style="margin:0">備考</div><ul class="noteList">${e.note.split("／").map((n) => `<li>${esc(n.trim())}</li>`).join("")}</ul></div>`;
  const help = master.help || {};
  (help.contacts || []).forEach((c) => {
    if (c.phone) h += `<div class="vendorCard"><div class="vName">${esc(c.name)}</div><div class="vSub">${esc(help.title || "困ったときは")}（担当が分からない時もここへ）</div><a class="callBtn big" href="${telHref(c.phone)}" data-name="${esc(c.name)}" data-phone="${esc(c.phone)}">${icon("phone")}${esc(c.phone)}</a></div>`;
  });
  return h;
}
/* 設備ページ：①何が起きたかを書く → ②連絡先 → ③これまでの症例（履歴は下にたまる） */
async function viewCategory(main, bid, cid) {
  const b = bById(bid), c = cById(cid);
  if (!b || !c) { goReplace("#/home"); return; }
  $("topTitle").textContent = `${b.name}・${c.label}`;
  const recs = (await dbAll("records")).filter((r) => r.buildingId === bid && r.categoryId === cid).sort((x, y) => y.createdAt - x.createdAt);
  main.innerHTML = `
    <div class="catHead"><div class="catIcon big">${catIconHtml(c)}</div><div><div class="catHeadName">${esc(c.label)}</div><div class="mutedText">${esc(b.name)}</div></div></div>
    <div class="stepHead"><span class="stepNo">1</span><h3>何が起きましたか？</h3></div>
    <div class="formCard">
      <textarea id="cWhat" maxlength="500" placeholder="例）洗面の排水がつまって水が流れにくい"></textarea>
      <div class="mutedText" style="margin:6px 0 10px">LINEで受けた報告も、ここに書いて残せます。写真や対応は次の画面で付けられます。</div>
      <button class="btn btnPrimary wide" id="cAdd">${icon("plus")}症例を書く</button>
    </div>
    <div class="stepHead"><span class="stepNo">2</span><h3>連絡先</h3></div>
    ${contactHtml(bid, cid)}
    <div class="stepHead"><span class="stepNo">3</span><h3>${esc(c.label)}の症例</h3><span class="count">${recs.length}件</span></div>
    <div class="mutedText" style="margin:0 4px 8px">この端末で、あなたが残した症例と写真です。新しいものが上に並びます。</div>
    <div class="recList" id="cRecs"></div>`;
  $("cAdd").onclick = () => {
    try { sessionStorage.setItem(P + "prefill", $("cWhat").value.trim()); } catch (e) {}
    go(`#/new?b=${encodeURIComponent(bid)}&c=${encodeURIComponent(cid)}`);
  };
  await fillRecList($("cRecs"), recs, `${c.label}の症例はまだありません。上に書いて残すと、ここにたまっていきます。`);
}
/* 保存した直後に「管理者へ報告しますか？」 */
function askReport(rec) {
  openSheet("報告しますか？", (body, close) => {
    body.innerHTML = `<div class="mutedText" style="margin-bottom:12px">症例を保存しました。管理者へ報告すると、管理ページにのって、管理者がまとめて見られます。LINEで連絡した場合は、管理ページには載りません（受け取った方が登録し直します）。あとで「自分の症例」からでも報告できます。</div>
      <div class="btnCol"><button class="btn btnPrimary twoLine" id="arGo"><span>${icon("send")}管理者に報告する</span><small>管理ページに載ります${hasApi() ? "（ボタン1つで送信）" : "（メールでBoxへ）"}</small></button>
        <button class="btn twoLine" id="arLine"><span>${icon("send")}LINEで連絡する</span><small>管理ページには載りません</small></button>
        <button class="btn" id="arLater">あとで</button></div>`;
    $("arLater").onclick = close;
    $("arGo").onclick = () => { close(); sendRecords([rec]); };
    $("arLine").onclick = () => { close(); sendLine(rec); };
  });
}

/* ---------- LINEで連絡する（文章＋写真。管理ページには載らない） ---------- */
function lineText(r, nPhotos) {
  const L = [`【症例】${r.buildingName}／${r.categoryName || "分類なし"}　${fmtDate(r.createdAt)}`, `何が起きた：${r.what}`];
  if (r.how) L.push(`対応：${r.how}`);
  if (r.vendor) L.push(`対応した業者：${r.vendor}`);
  if (r.reporter) L.push(`連絡元：${r.reporter}`);
  const who = getSetting("name");
  if (who) L.push(`連絡した人：${who}`);
  if (nPhotos) L.push(`（写真${nPhotos}枚）`);
  L.push("※山郷サポートの管理ページには未登録です。受け取った方は、症例として登録をお願いします。");
  return L.join("\n");
}
async function sendLine(r) {
  toast("送る準備をしています...");
  let files = [], bytes = 0;
  try {
    const ps = (await photosOf(r.id)).sort((a, b) => a.takenAt - b.takenAt);
    let n = 0;
    for (const p of ps) {
      const img = await dbGet("images", p.id);
      if (!img) continue;
      n++;
      files.push(new File([img.blob], safeName(`${r.buildingName}_${r.categoryName || "分類"}_${mmdd(r.createdAt)}_${n}.jpg`), { type: "image/jpeg" }));
      bytes += img.blob.size;
    }
  } catch (e) { console.error(e); return toast("送る準備ができませんでした。もう一度試してください"); }
  const text = lineText(r, files.length);
  $("toast").hidden = true;
  let marked = false;
  openSheet("LINEで連絡する", (body, close) => {
    body.innerHTML = `<div class="infoBar" style="background:var(--warn-soft);color:var(--warn)">LINEで送った内容は、山郷サポートの管理ページには<b>登録されません</b>。受け取った方が、症例として登録し直してください。</div>
      <textarea id="lnText" readonly rows="9">${esc(text)}</textarea>
      <div class="mutedText" style="margin:6px 0 10px">写真 ${files.length}枚（約${(bytes / 1048576).toFixed(1)}MB）。LINEによっては、文章と写真のどちらかしか入らないことがあります。その時は「文章だけ」「写真だけ」に分けて送ってください。文章は、押すとコピーもされます。</div>
      <div class="btnCol"><button class="btn btnPrimary" id="lnBoth">${icon("send")}LINEを開く（文章＋写真）</button>
        <button class="btn" id="lnTextOnly">文章だけ送る</button>${files.length ? `<button class="btn" id="lnPhotos">写真だけ送る</button>` : ""}
        <button class="btn" id="lnCopy">文章をコピー</button><button class="btn" id="lnNo">やめる</button></div>`;
    $("lnNo").onclick = close;
    $("lnCopy").onclick = () => copyText(text).then((ok) => toast(ok ? "文章をコピーしました" : "コピーできませんでした"));
    const go = (data, copy) => { // 押した直後に共有を呼ぶ
      if (copy) copyText(text);
      if (!navigator.share || (navigator.canShare && !navigator.canShare(data))) { alert("この端末ではこの形では共有できません。「文章だけ」「写真だけ」を試してください。"); return; }
      navigator.share(data).then(async () => {
        if (marked) return;
        if (confirm("LINEで送れましたか？\n送れていたら「OK」で、「LINE連絡済み」の印を付けます。")) {
          marked = true;
          const cur = await dbGet("records", r.id);
          if (cur) await dbPut("records", { ...cur, lineAt: Date.now() });
          toast("「LINE連絡済み」の印を付けました");
          const note = document.createElement("div");
          note.className = "infoBar";
          note.textContent = "「LINE連絡済み」の印を付けました。文章か写真が入っていなければ、続けて「文章だけ／写真だけ」を送れます。";
          body.insertBefore(note, body.firstChild);
        }
      }).catch((e) => { if (e && e.name === "AbortError") return; alert("共有画面を開けませんでした。\n（" + (e && e.name ? e.name : e) + "）"); });
    };
    $("lnBoth").onclick = () => go(files.length ? { text, files } : { text }, true);
    $("lnTextOnly").onclick = () => go({ text }, true);
    const lp = $("lnPhotos"); if (lp) lp.onclick = () => go({ files }, false);
  }, () => { if (marked) render(); });
}

/* ---------- 電話の確認（誤タップ対策：押してもすぐには電話せず、確認してから） ---------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href^='tel:'][data-name]");
  if (!a || a.dataset.confirmed) return;
  e.preventDefault();
  e.stopPropagation();
  openSheet("電話をかけますか？", (body, close) => {
    body.innerHTML = `<div class="vendorCard"><div class="vName">${esc(a.dataset.name || "")}</div><div class="vSub" style="margin:2px 0 0">${esc(a.dataset.phone || "")}</div></div>
      <div class="btnCol"><a class="btn btnPrimary" id="callGo" href="${esc(a.getAttribute("href"))}">${icon("phone")}電話する</a><button class="btn" id="callNo">やめる</button></div>`;
    $("callNo").onclick = close;
    $("callGo").onclick = () => setTimeout(close, 300);
  });
}, true);

/* ---------- 症例リスト（共通） ---------- */
const changedAfterSent = (r) => !!r.sentAt && (r.updatedAt || 0) > r.sentAt; // 報告したあとに、完了・編集などで変えた
const needsReport = (r) => !r.draft && (!r.sentAt || changedAfterSent(r));
const reqTags = (r) => (r.kind === "request" ? `<span class="tag req">依頼</span>${r.urgent ? `<span class="tag urgent">急ぎ</span>` : ""}` : "");
function stateTag(r) { // 下書き／完了／報告済み／未報告
  if (r.draft) return `<span class="tag warn">下書き</span>` + reqTags(r);
  const line = r.lineAt ? `<span class="tag line">LINE連絡済み</span>` : "";
  if (r.doneAt) return reqTags(r) + `<span class="tag done">完了</span>` + (!r.sentAt ? `<span class="tag gray">未報告</span>` : changedAfterSent(r) ? `<span class="tag gray">変更は未報告</span>` : "") + line;
  return reqTags(r) + (r.sentAt ? `<span class="tag">報告済み</span>` + (changedAfterSent(r) ? `<span class="tag gray">変更は未報告</span>` : "") : `<span class="tag gray">未報告</span>`) + line;
}
async function fillRecList(box, recs, emptyText) {
  if (!recs.length) { box.innerHTML = `<div class="empty"><img class="emptyArt" src="art/empty-records.webp?v=${ART_V}" alt="" data-fb="x"><br>${esc(emptyText)}</div>`; return; }
  const photos = await dbAll("photos");
  const firstThumb = {};
  photos.sort((a, b) => a.takenAt - b.takenAt).forEach((p) => { if (!firstThumb[p.recordId]) firstThumb[p.recordId] = p; });
  box.innerHTML = "";
  recs.forEach((r) => {
    const p = firstThumb[r.id];
    const btn = document.createElement("button");
    btn.className = "recItem" + (r.doneAt ? " isDone" : r.sentAt && !r.draft ? " isSent" : "");
    btn.innerHTML = `<div class="recThumb">${p && p.thumb ? `<img src="${blobUrl(p.thumb)}" alt="">` : icon("image")}</div>
      <div class="recBody"><div class="recMeta"><span>${fmtDate(r.createdAt)}</span>${r.categoryName ? `<span class="tag">${esc(r.categoryName)}</span>` : ""}${stateTag(r)}</div>
      <div class="recTitle">${esc(r.what || "（内容なし）")}</div>
      <div class="recSub">${esc([r.buildingName, r.how].filter(Boolean).join(" ／ "))}</div></div>${icon("chevron")}`;
    btn.lastElementChild.style.cssText = "width:18px;height:18px;color:var(--muted);flex:none";
    btn.onclick = () => go("#/r/" + encodeURIComponent(r.id));
    box.appendChild(btn);
  });
}

/* ---------- 症例の入力 ---------- */
let form = null;
function takePrefill() {
  try { const v = sessionStorage.getItem(P + "prefill") || ""; sessionStorage.removeItem(P + "prefill"); return v; } catch (e) { return ""; }
}
async function viewForm(main, r) {
  if (!master) { toast("先に設定で業者データを取り込んでください"); goReplace("#/settings"); return; }
  const editId = r.q.get("id");
  if (!form || form.key !== location.hash) {
    if (editId) {
      const rec = await dbGet("records", editId);
      if (!rec) { goReplace("#/mine"); return; }
      const ps = (await photosOf(editId)).sort((a, b) => a.takenAt - b.takenAt);
      const full = await Promise.all(ps.map(async (p) => ({ id: p.id, takenAt: p.takenAt, thumb: p.thumb, blob: ((await dbGet("images", p.id)) || {}).blob || p.thumb, saved: true })));
      form = { key: location.hash, id: rec.id, isNew: false, createdAt: rec.createdAt, sentAt: rec.sentAt, buildingId: rec.buildingId, categoryId: rec.categoryId, what: rec.what, how: rec.how, vendor: rec.vendor, reporter: rec.reporter || "", buildingName: rec.buildingName || "", categoryName: rec.categoryName || "", doneAt: rec.doneAt || null, lineAt: rec.lineAt || null, kind: rec.kind === "request" ? "request" : "report", urgent: !!rec.urgent, photos: full, removed: [] };
    } else {
      form = { key: location.hash, id: uid(), isNew: true, createdAt: Date.now(), sentAt: null, buildingId: r.q.get("b") || "", categoryId: r.q.get("c") || "", what: takePrefill(), how: "", vendor: "", reporter: "", kind: "report", urgent: false, photos: [], removed: [] };
    }
  }
  $("topTitle").textContent = form.isNew ? "症例を入力" : "症例を編集";
  const b = () => bById(form.buildingId), c = () => cById(form.categoryId);
  const draw = () => {
    main.innerHTML = `
      <button class="pickRow" id="pkB"><div class="pickIcon">${b() ? bldImg(b()) : icon("build")}</div><div class="pickText"><div class="pickLabel">建物</div><div class="pickValue${b() ? "" : " ph"}">${b() ? esc(b().name) : "選んでください"}</div></div>${icon("chevron")}</button>
      <button class="pickRow" id="pkC"><div class="pickIcon">${c() ? catIconHtml(c()) : icon("tool")}</div><div class="pickText"><div class="pickLabel">分類</div><div class="pickValue${c() ? "" : " ph"}">${c() ? esc(c().label) : "選んでください"}</div></div>${icon("chevron")}</button>
      <div class="formCard"><div class="fieldLabel">報告の種類</div><div class="chips" id="kindChips" style="margin-bottom:6px"><button class="chip${form.kind === "request" ? "" : " on"}" data-k="report">報告のみ</button><button class="chip${form.kind === "request" ? " on" : ""}" data-k="request">対応を依頼する</button></div>${form.kind === "request" ? `<label class="urgentRow"><input type="checkbox" id="fUrgent"${form.urgent ? " checked" : ""}> 急ぎ（すぐ対応してほしい）</label><div class="mutedText">保存して「管理者に報告する」を押すと、本社に連絡が届きます。</div>` : `<div class="mutedText">記録として残します（本社への連絡はありません）。</div>`}</div>
      <div class="formCard"><div class="fieldLabel">何が起きたか<span class="req">必須</span></div><textarea id="fWhat" maxlength="500" placeholder="例）洗面の排水がつまって水が流れにくい">${esc(form.what)}</textarea><div class="counter"><span id="cWhat">${form.what.length}</span>/500</div></div>
      <div class="formCard"><div class="fieldLabel">どう対応したか<span class="opt">対応中なら空欄でOK</span></div><textarea id="fHow" maxlength="500" placeholder="例）業者へ連絡。トラップを清掃し、排水は改善。">${esc(form.how)}</textarea><div class="counter"><span id="cHow">${form.how.length}</span>/500</div></div>
      <div class="formCard"><div class="fieldLabel">写真<span class="opt">複数枚OK</span></div><div class="photoStrip" id="strip"></div></div>
      <button class="pickRow" id="pkV"><div class="pickIcon">${icon("person")}</div><div class="pickText"><div class="pickLabel">対応した業者</div><div class="pickValue${form.vendor ? "" : " ph"}">${form.vendor ? esc(form.vendor) : "選んでください（任意）"}</div></div>${icon("chevron")}</button>
      <div class="formCard"><div class="fieldLabel">報告した人<span class="opt">LINEで受けた報告なら名前</span></div><input class="textInput" id="fRep" maxlength="40" placeholder="例）佐藤さん（自分で見つけた時は空欄）" value="${esc(form.reporter)}"></div>
      <div class="infoBar">${icon("info")}この症例はこの端末に保存されます。管理者へは、保存した直後か「自分の症例」から報告できます。</div>
      <div class="formActions"><button class="btn" id="fDraft">下書き保存</button><button class="btn btnPrimary" id="fSave">保存する</button></div>`;
    fillIcons(main);
    drawStrip();
    document.querySelectorAll("#kindChips .chip").forEach((el) => (el.onclick = () => { form.kind = el.dataset.k; if (form.kind !== "request") form.urgent = false; draw(); }));
    const fu = $("fUrgent"); if (fu) fu.onchange = () => { form.urgent = fu.checked; };
    $("fWhat").oninput = (e) => { form.what = e.target.value; $("cWhat").textContent = form.what.length; };
    $("fRep").oninput = (e) => { form.reporter = e.target.value; };
    $("fHow").oninput = (e) => { form.how = e.target.value; $("cHow").textContent = form.how.length; };
    $("pkB").onclick = pickBuilding; $("pkC").onclick = pickCategory; $("pkV").onclick = pickVendor;
    $("fDraft").onclick = () => saveForm(true);
    $("fSave").onclick = () => saveForm(false);
  };
  const drawStrip = () => {
    const strip = $("strip");
    strip.innerHTML = "";
    form.photos.forEach((p) => {
      const d = document.createElement("div");
      d.className = "photoThumb";
      d.innerHTML = `<img src="${blobUrl(p.thumb)}" alt=""><button class="x" aria-label="削除">${icon("close")}</button>`;
      d.querySelector("img").onclick = () => showLightbox(p.blob);
      d.querySelector(".x").onclick = () => { if (p.saved) form.removed.push(p.id); form.photos = form.photos.filter((x) => x !== p); drawStrip(); };
      strip.appendChild(d);
    });
    const add = (label, ic, input) => { const a = document.createElement("button"); a.className = "photoAdd"; a.innerHTML = `${icon(ic)}${label}`; a.onclick = () => input.click(); strip.appendChild(a); };
    add("カメラで撮る", "camera", $("shootInput"));
    add("撮影済みを選ぶ", "image", $("pickInput"));
  };
  window.__formDraw = draw;
  const pickBuilding = () => openSheet("建物を選ぶ", (body, close) => {
    body.innerHTML = `<div class="optList">${master.buildings.map((x) => `<button class="optBtn${x.id === form.buildingId ? " sel" : ""}" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join("")}</div>`;
    body.querySelectorAll(".optBtn").forEach((el) => (el.onclick = () => { if (form.buildingId !== el.dataset.id) form.vendor = ""; form.buildingId = el.dataset.id; close(); draw(); }));
  });
  const pickCategory = () => openSheet("分類を選ぶ", (body, close) => {
    body.innerHTML = `<div class="catPickGrid">${master.categories.map((x) => `<button class="optBtn${x.id === form.categoryId ? " sel" : ""}" data-id="${esc(x.id)}"><span class="catIcon" style="width:36px;height:36px;font-size:16px">${catIconHtml(x)}</span>${esc(x.label)}</button>`).join("")}</div>`;
    body.querySelectorAll(".optBtn").forEach((el) => (el.onclick = () => { if (form.categoryId !== el.dataset.id) form.vendor = ""; form.categoryId = el.dataset.id; close(); draw(); }));
  });
  const pickVendor = () => openSheet("対応した業者", (body, close) => {
    const names = form.buildingId && form.categoryId ? entryOf(form.buildingId, form.categoryId).companies.map((x) => x.name) : [];
    const opts = [...names, "自分で対応", "未定"];
    body.innerHTML = `<div class="optList">${opts.map((n) => `<button class="optBtn${n === form.vendor ? " sel" : ""}" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
      <div class="fieldLabel" style="margin-top:14px">その他の業者名を入力</div><input class="textInput" id="vOther" maxlength="40" placeholder="業者名" value="${esc(opts.includes(form.vendor) ? "" : form.vendor)}">
      <div class="btnCol"><button class="btn btnPrimary" id="vOk">この名前にする</button>${form.vendor ? `<button class="btn" id="vClear">選択を外す</button>` : ""}</div>`;
    body.querySelectorAll(".optBtn").forEach((el) => (el.onclick = () => { form.vendor = el.dataset.n; close(); draw(); }));
    $("vOk").onclick = () => { form.vendor = $("vOther").value.trim(); close(); draw(); };
    const cl = $("vClear"); if (cl) cl.onclick = () => { form.vendor = ""; close(); draw(); };
  });
  let saving = false;
  async function saveForm(draft) {
    if (saving || !form) return;
    if (!draft) {
      if (!form.buildingId) return toast("建物を選んでください");
      if (!form.categoryId) return toast("分類を選んでください");
      if (!form.what.trim()) return toast("「何が起きたか」を入力してください");
    } else if (!form.buildingId) return toast("下書きでも建物は選んでください");
    saving = true;
    document.querySelectorAll("#fDraft, #fSave").forEach((x) => (x.disabled = true));
    const f = form;
    const rec = {
      id: f.id, buildingId: f.buildingId, buildingName: b() ? b().name : f.buildingName || "", categoryId: f.categoryId, categoryName: c() ? c().label : f.categoryName || "",
      what: f.what.trim(), how: f.how.trim(), vendor: f.vendor, reporter: f.reporter.trim(), draft, createdAt: f.createdAt, updatedAt: Date.now(), sentAt: null, doneAt: f.doneAt || null, lineAt: f.lineAt || null, kind: f.kind === "request" ? "request" : "report", urgent: f.kind === "request" && !!f.urgent, by: getSetting("name"),
    };
    try {
      for (const p of f.photos) if (!p.saved) { await dbPut("images", { id: p.id, blob: p.blob }); await dbPut("photos", { id: p.id, recordId: f.id, takenAt: p.takenAt, thumb: p.thumb }); }
      await dbPut("records", rec); // 写真を先に書き、最後に症例を書く（途中で失敗しても、写真だけ欠けた症例が残らない）
      for (const id of f.removed) { await dbDel("photos", id); await dbDel("images", id); }
    } catch (e) {
      console.error(e);
      saving = false;
      document.querySelectorAll("#fDraft, #fSave").forEach((x) => (x.disabled = false));
      return toast("保存できませんでした。端末の空き容量を確認して、もう一度試してください");
    }
    saving = false;
    const bid = f.buildingId;
    form = null;
    toast(draft ? "下書きを保存しました" : f.sentAt ? "保存しました。内容を変えたので、管理者にも伝えるには、もう一度「管理者に報告する」を押してください" : "保存しました");
    const cid = rec.categoryId;
    goReplace(draft ? "#/mine" : cid ? `#/b/${encodeURIComponent(bid)}/c/${encodeURIComponent(cid)}` : "#/b/" + encodeURIComponent(bid));
    if (!draft) setTimeout(() => askReport(rec), 400);
  }
  draw();
}
async function addPhotos(files) {
  const target = form;
  if (!target) return;
  for (const f of files) {
    try {
      const taken = ((await readExifDate(f)) || (f.lastModified ? new Date(f.lastModified) : new Date())).getTime();
      const [blob, thumb] = [await resizeImage(f, 1600), await resizeImage(f, 360)];
      if (form !== target) return; // 追加中に別の画面へ移った
      target.photos.push({ id: uid(), takenAt: taken, blob, thumb, saved: false });
    } catch (e) { toast("読み込めない写真がありました"); }
  }
  if (form === target && window.__formDraw) window.__formDraw();
}
$("shootInput").addEventListener("change", (e) => { addPhotos([...e.target.files]); e.target.value = ""; });
$("pickInput").addEventListener("change", (e) => { addPhotos([...e.target.files]); e.target.value = ""; });
function showLightbox(blob) { const lb = $("lightbox"); lb.innerHTML = `<img src="${blobUrl(blob)}" alt="">`; lb.hidden = false; lb.onclick = () => { lb.hidden = true; lb.innerHTML = ""; }; }

/* ---------- 自分の症例 ---------- */
let mineFilter = "all", mineQuery = "";
async function viewMine(main) {
  $("topTitle").textContent = "自分の症例";
  const all = (await dbAll("records")).sort((a, b) => b.createdAt - a.createdAt);
  const unsent = all.filter(needsReport);
  main.innerHTML = `
    <div class="mutedText" style="margin:0 4px 8px">この端末で、あなたが残した症例です。他の人の症例は出ません。</div>
    <div class="searchRow">${icon("search")}<input id="mQ" type="search" placeholder="建物・分類・内容で探す" value="${esc(mineQuery)}"></div>
    <div class="chips">${[["all", "すべて"], ["unsent", "未報告"], ["sent", "報告済み"], ["done", "完了"], ["draft", "下書き"]].map(([k, l]) => `<button class="chip${mineFilter === k ? " on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
    ${unsent.length ? `<div class="sendBar"><button class="btn btnPrimary" id="sendAll">${icon("send")}未報告${unsent.length}件を管理者へ報告する</button></div>` : ""}
    <div class="recList" id="mList"></div>
    <button class="fab" id="fabAdd">${icon("plus")}症例を追加</button>`;
  const draw = async () => {
    const q = mineQuery.trim().toLowerCase();
    let list = all;
    if (mineFilter === "unsent") list = unsent;
    if (mineFilter === "sent") list = all.filter((r) => !r.draft && r.sentAt && !r.doneAt && !changedAfterSent(r));
    if (mineFilter === "done") list = all.filter((r) => !r.draft && r.doneAt);
    if (mineFilter === "draft") list = all.filter((r) => r.draft);
    if (q) list = list.filter((r) => [r.buildingName, r.categoryName, r.what, r.how, r.vendor].join(" ").toLowerCase().includes(q));
    await fillRecList($("mList"), list, all.length ? "該当する症例がありません。" : "まだ症例がありません。建物を選んで、右下の「症例を追加」から残せます。");
  };
  $("mQ").oninput = (e) => { mineQuery = e.target.value; draw(); };
  main.querySelectorAll(".chip").forEach((el) => (el.onclick = () => { mineFilter = el.dataset.f; viewMine(main); }));
  $("fabAdd").onclick = () => { if (!master) return toast("先に設定で業者データを取り込んでください"); go("#/new"); };
  const sa = $("sendAll"); if (sa) sa.onclick = () => sendRecords(unsent);
  await draw();
}

/* ---------- 症例の詳細 ---------- */
async function viewDetail(main, id) {
  const r = await dbGet("records", id);
  if (!r) { goReplace("#/mine"); return; }
  $("topTitle").textContent = "症例";
  const ps = (await photosOf(id)).sort((a, b) => a.takenAt - b.takenAt);
  main.innerHTML = `
    <div class="formCard">
      <div class="recMeta" style="margin-bottom:8px"><span>${fmtDate(r.createdAt)}</span>${reqTags(r)}${r.draft ? `<span class="tag warn">下書き</span>` : r.sentAt ? `<span class="tag">報告済み ${fmtDate(r.sentAt)}</span>${changedAfterSent(r) ? `<span class="tag gray">変更は未報告</span>` : ""}` : `<span class="tag gray">未報告</span>`}${r.lineAt ? `<span class="tag line">LINE連絡済み ${fmtDate(r.lineAt)}</span>` : ""}${r.doneAt ? `<span class="tag done">完了 ${fmtDate(r.doneAt)}</span>` : ""}</div>
      <dl class="kv"><dt>建物</dt><dd>${esc(r.buildingName)}</dd><dt>分類</dt><dd>${esc(r.categoryName || "—")}</dd><dt>何が起きたか</dt><dd>${esc(r.what || "—")}</dd><dt>どう対応したか</dt><dd>${esc(r.how || "—")}</dd><dt>対応した業者</dt><dd>${esc(r.vendor || "—")}</dd>${r.reporter ? `<dt>報告した人</dt><dd>${esc(r.reporter)}</dd>` : ""}</dl>
      ${ps.length ? `<div class="detailPhotos" id="dPhotos"></div>` : ""}
    </div>
    <div class="btnCol">
      ${r.draft ? "" : `<button class="btn btnPrimary twoLine" id="dSend"><span>${icon("send")}${r.kind === "request" ? "依頼を送る（本社に連絡）" : "管理者に報告する"}${r.sentAt ? "（もう一度）" : ""}</span><small>管理ページに載ります${hasApi() ? "（ボタン1つで送信）" : "（メールでBoxへ）"}</small></button>`}
      ${r.draft ? "" : `<button class="btn twoLine" id="dLine"><span>${icon("send")}LINEで連絡する${r.lineAt ? "（もう一度）" : ""}</span><small>管理ページには載りません</small></button>`}
      ${r.draft ? "" : `<button class="btn" id="dDone">${icon("check")}${r.doneAt ? "完了を取り消す" : "完了にする（解決した）"}</button>`}
      ${r.draft || !hasApi() ? "" : `<button class="btn" id="dMail" style="min-height:40px;font-weight:400">メールで送る（予備）</button>`}
      <button class="btn" id="dEdit">${icon("edit")}${r.draft ? "続きを書く" : "編集する"}</button>
      <button class="btn btnDanger" id="dDel">${icon("trash")}削除する</button>
    </div>`;
  const box = $("dPhotos");
  if (box) ps.forEach((p) => { const im = document.createElement("img"); im.src = blobUrl(p.thumb); im.onclick = async () => { const img = await dbGet("images", p.id); showLightbox(img ? img.blob : p.thumb); }; box.appendChild(im); });
  $("dEdit").onclick = () => { form = null; go(`#/new?id=${encodeURIComponent(id)}`); };
  const ds = $("dSend"); if (ds) ds.onclick = () => sendRecords([r]);
  const dl = $("dLine"); if (dl) dl.onclick = () => sendLine(r);
  const dm = $("dMail"); if (dm) dm.onclick = () => sendByMail([r]);
  const dd = $("dDone");
  if (dd) dd.onclick = async () => {
    const wasDone = !!r.doneAt;
    const cur = (await dbGet("records", id)) || r;
    try { await dbPut("records", { ...cur, doneAt: wasDone ? null : Date.now(), updatedAt: Date.now() }); } catch (e) { console.error(e); return toast("保存できませんでした。端末の空き容量を確認してください"); }
    toast(wasDone ? "完了を取り消しました" : "完了にしました。管理者にも伝えるには、もう一度「管理者に報告する」を押してください");
    render();
  };
  $("dDel").onclick = async () => {
    if (!confirm("この症例を削除しますか？写真も消えます。\n（管理者に報告済みの分は、管理者側には残ります）")) return;
    try {
      await dbDel("records", id);
      for (const p of ps) { await dbDel("photos", p.id); await dbDel("images", p.id); }
    } catch (e) { console.error(e); toast("削除の途中で失敗しました。もう一度試してください"); return render(); }
    toast("削除しました");
    goReplace("#/mine");
  };
}

/* ---------- 管理者へ報告する（Boxのメール宛 ＋ 共有シート） ---------- */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 次の方法へ */ }
  try { const t = document.createElement("textarea"); t.value = text; t.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px"; document.body.appendChild(t); t.focus(); t.select(); t.setSelectionRange(0, text.length); const ok = document.execCommand("copy"); t.remove(); return ok; } catch (e) { return false; }
}
function boxEmail() { return BOX_UPLOAD_EMAIL || getSetting("box"); }
async function buildReport(list) {
  const files = [];
  const jobs = [];
  const outRecs = [];
  let bytes = 0;
  for (const r of list) {
    const ps = (await photosOf(r.id)).sort((a, b) => a.takenAt - b.takenAt);
    const outPhotos = [];
    let n = 0;
    for (const p of ps) {
      n++;
      const img = await dbGet("images", p.id);
      if (!img) continue;
      const name = safeName(`${r.buildingName}_${r.categoryName || "分類"}_${mmdd(r.createdAt)}_${r.id.slice(-4)}_${p.id.slice(-6)}.jpg`); // 写真IDを入れる（差し替えても別の名前になり、古い写真と取り違えない）
      files.push(new File([img.blob], name, { type: "image/jpeg" }));
      jobs.push({ name, record_id: r.id, taken_at: new Date(p.takenAt).toISOString(), blob: img.blob });
      bytes += img.blob.size;
      outPhotos.push({ file: name, taken_at: new Date(p.takenAt).toISOString() });
    }
    outRecs.push({ id: r.id, building_id: r.buildingId, building: r.buildingName, category_id: r.categoryId, category: r.categoryName, what: r.what, how: r.how, vendor: r.vendor, reporter: r.reporter || "", kind: r.kind === "request" ? "request" : "", urgent: !!r.urgent, done_at: r.doneAt ? new Date(r.doneAt).toISOString() : "", created_at: new Date(r.createdAt).toISOString(), updated_at: new Date(r.updatedAt || r.createdAt).toISOString(), photos: outPhotos });
  }
  const payload = { kind: "sango-support-records", schema: 1, app_version: APP_VERSION, master_version: master ? master.version : "", sent_at: new Date().toISOString(), sender: getSetting("name"), sender_id: deviceId(), records: outRecs };
  const hms = (() => { const d = new Date(); return pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); })();
  const jsonName = safeName(`症例_${getSetting("name")}_${ymd(Date.now())}_${hms}_${list.length}件.json`); // 時刻を入れる（同じ日に同じ件数を2回送っても、同名で上書きされない）
  const jsonFile = new File([JSON.stringify(payload, null, 2)], jsonName, { type: "application/json" });
  return { all: [jsonFile, ...files], photoCount: files.length, bytes, jsonName, recs: outRecs, jobs };
}
const hasApi = () => !!(master && master.api && master.api.url && master.api.token);
async function apiCall(body, ms) {
  const api = master && master.api; // 送信中にマスターが入れ替わっても、この送り先を使い続ける
  if (!api) throw new Error("送り先が設定されていません（業者データを取り込み直してください）");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 40000);
  try {
    const res = await fetch(api.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ token: api.token, ...body }), signal: ctl.signal, redirect: "follow" });
    let j;
    try { j = await res.json(); } catch (e) { throw new Error("窓口の応答が不正です（" + res.status + "）。電波、またはURL・公開の設定を確認してください"); }
    if (!j.ok) throw new Error(j.error || "送信に失敗しました");
    return j;
  } finally { clearTimeout(timer); }
}
const blobToBase64 = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1] || ""); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); });
let apiSending = false;

/** 「管理者に報告する」：窓口（GAS）へ症例と写真を自動で送る。窓口が無い／失敗した時は、メールで送る（予備） */
async function sendRecords(list) {
  if (!getSetting("name")) { toast("先に設定で名前を入れてください"); return go("#/settings"); }
  if (!hasApi()) return sendByMail(list);
  if (apiSending) return toast("いま送信中です。少しお待ちください");
  apiSending = true;
  let status, closeStatus = () => {};
  const showStatus = (msg) => { if (status && status.isConnected) status.textContent = msg; };
  closeStatus = openSheet("管理者に報告しています", (body) => { body.innerHTML = `<div class="mutedText" id="apiStatus" style="font-size:15px;padding:8px 0">準備しています...</div><div class="mutedText">この画面を開いたまま、少しお待ちください。</div>`; status = $("apiStatus"); const back = body.closest(".sheetBack"); back.dataset.locked = "1"; const x = back.querySelector(".sheetHead button"); if (x) x.hidden = true; }); // 送信中は閉じられない
  try {
    if (navigator.onLine === false) throw new Error("オフライン");
    list = (await Promise.all(list.map((r) => dbGet("records", r.id)))).filter(Boolean); // 開いてから変わっていても、最新の内容で送る
    if (!list.length) throw new Error("送る症例が見つかりません");
    const prep = await buildReport(list);
    showStatus(`症例 ${list.length}件を送っています...`);
    await apiCall({ action: "submit", sender: getSetting("name"), sender_id: deviceId(), app_version: APP_VERSION, records: prep.recs }, 60000);
    let done = 0, next = 0, failed = false, firstErr = null;
    const total = prep.jobs.length;
    const worker = async () => { // 3枚ずつ並行して送る（1枚ずつより速い）。1枚でも失敗したら、残りの送信も止める
      while (!failed && next < total) {
        const job = prep.jobs[next++];
        try {
          await apiCall({ action: "putPhoto", name: job.name, record_id: job.record_id, taken_at: job.taken_at, data: await blobToBase64(job.blob) });
        } catch (e) { failed = true; firstErr = firstErr || e; return; }
        done++;
        showStatus(`写真を送っています（${done}/${total}枚）...`);
      }
    };
    if (total) showStatus(`写真を送っています（0/${total}枚）...`);
    await Promise.all(Array.from({ length: Math.min(3, total) }, worker)); // 全部の送信が終わるのを待つ（失敗後に裏で送り続けない）
    if (failed) throw firstErr || new Error("写真を送れませんでした");
    const now = Date.now();
    let edited = 0;
    for (const r of list) {
      const cur = await dbGet("records", r.id);
      if (!cur) continue;
      const sent = prep.recs.find((x) => x.id === r.id);
      if (sent && new Date(cur.updatedAt || cur.createdAt).toISOString() !== sent.updated_at) { edited++; continue; } // 送信中に編集された症例は、報告済みにしない（もう一度報告が必要）
      await dbPut("records", { ...cur, sentAt: now });
    }
    closeStatus();
    toast(edited ? "報告しました。送信中に変えた症例は、もう一度報告してください" : "管理者に報告しました");
    render();
  } catch (e) {
    console.error(e);
    closeStatus();
    const offline = navigator.onLine === false || /Failed to fetch|NetworkError|abort|オフライン|Load failed/i.test(String(e && (e.message || e.name)));
    openSheet("送れませんでした", (body, close) => {
      body.innerHTML = `<div class="infoBar" style="background:var(--warn-soft);color:var(--warn)">${offline ? "電波が弱いか、つながっていないようです。" : esc(String(e && e.message || e))}</div>
        <div class="mutedText" style="margin:10px 0">症例は、この端末に保存されています。電波が良い所で、もう一度送れます。急ぐ時は、メールで送れます（予備）。</div>
        <div class="btnCol"><button class="btn btnPrimary" id="apiRetry">${icon("send")}もう一度送る</button><button class="btn" id="apiMail">メールで送る（予備）</button><button class="btn" id="apiClose">閉じる</button></div>`;
      $("apiClose").onclick = close;
      $("apiRetry").onclick = () => { close(); sendRecords(list); };
      $("apiMail").onclick = () => { close(); sendByMail(list); };
    });
  } finally { apiSending = false; }
}

/** メールで送る（予備）：共有画面から、Boxのアップロード用メールアドレス宛に送る */
async function sendByMail(list) {
  const email = boxEmail();
  if (!email) { toast("先に設定で管理者の送信先を入れてください"); return go("#/settings"); }
  if (!getSetting("name")) { toast("先に設定で名前を入れてください"); return go("#/settings"); }
  toast("送る準備をしています...");
  let prep;
  try { prep = await buildReport(list); } catch (e) { console.error(e); return toast("送る準備ができませんでした。もう一度試してください"); }
  $("toast").hidden = true;
  openSheet("管理者へ報告する", (body, close) => {
    const mb = (prep.bytes / 1048576).toFixed(1);
    body.innerHTML = `<div class="mutedText" style="margin-bottom:10px">症例 ${list.length}件・写真 ${prep.photoCount}枚（約${mb}MB）を、メールで管理者へ送ります。<br>「メールを開く」を押すと、送信先のアドレスをコピーして共有画面が開きます。メールを選び、宛先に貼り付けて送信してください。</div>
      <div class="vendorCard"><div class="vSub" style="margin:0">送信先のアドレス</div><div style="word-break:break-all;font-weight:700;margin:4px 0 8px">${esc(email)}</div>
        <button class="btn wide" id="rpCopy">アドレスをコピー</button><div class="mutedText" id="rpCopied" style="margin-top:6px" hidden>コピーしました。メールの宛先に貼り付けてください。</div></div>
      ${prep.bytes > MAIL_WARN_BYTES ? `<div class="infoBar" style="background:var(--warn-soft);color:var(--warn)">写真が15MBを超えています。メールの容量上限で送れないかもしれません。件数を分けて報告してください。</div>` : ""}
      <div class="btnCol"><button class="btn btnPrimary" id="rpGo">${icon("send")}メールを開く</button><button class="btn" id="rpNo">やめる</button></div>`;
    $("rpNo").onclick = close;
    $("rpCopy").onclick = () => copyText(email).then((ok) => { $("rpCopied").hidden = !ok; toast(ok ? "アドレスをコピーしました" : "コピーできませんでした"); });
    $("rpGo").onclick = () => { // 押した直後に共有を呼ぶ（間に待ち時間を入れない）
      copyText(email).then((ok) => { if (ok) $("rpCopied").hidden = false; }); // 共有画面が開く前にコピー（共有画面の裏にも「コピーしました」が残る）
      if (!(navigator.canShare && navigator.canShare({ files: prep.all }))) { alert("この端末では共有機能が使えないため送信できません。iPhoneのホーム画面から開いてください。"); return; }
      navigator.share({ files: prep.all, title: prep.jsonName }).then(async () => {
        close();
        if (confirm("メールを送れましたか？\n送れていたら「OK」で、報告済みにします。")) {
          const now = Date.now();
          for (const r of list) { const cur = await dbGet("records", r.id); if (cur) await dbPut("records", { ...cur, sentAt: now }); } // 最新の内容に印だけ付ける（古い値で上書きしない）
          toast("報告済みにしました");
          render();
        } else toast("報告済みにはしていません");
      }).catch((e) => { if (e && e.name === "AbortError") return; alert("共有画面を開けませんでした。\n（" + (e && e.name ? e.name : e) + "）"); });
    };
  });
}

/* ---------- 設定 ---------- */
async function viewSettings(main) {
  $("topTitle").textContent = "設定";
  const meta = await dbGet("meta", "master");
  const recs = await dbAll("records");
  main.innerHTML = `
    <div class="settingSec"><h3>業者データ（マスターパック）</h3><div class="formCard">
      <div class="mutedText">本社から配られたマスターデータ（JSON）を取り込みます。取り込み直すと入れ替わり、症例は消えません。</div>
      <div style="margin:10px 0">${meta ? `<span class="statusOk">取り込み済み</span>　版 ${esc(meta.data.version)}／建物${meta.data.buildings.length}／${fmtDate(meta.importedAt)}` : `<span class="statusWarn">未取り込み</span>`}</div>
      <button class="btn btnPrimary" id="sImport" style="width:100%">データを取り込む</button></div></div>
    <div class="settingSec"><h3>あなたの名前</h3><div class="formCard"><input class="textInput" id="sName" maxlength="20" placeholder="例）木村" value="${esc(getSetting("name"))}"><div class="mutedText" style="margin-top:6px">症例を送る時に付きます。</div></div></div>
    <div class="settingSec"><h3>報告の送り方</h3><div class="formCard"><div id="apiLine">${hasApi() ? `<span class="statusOk">自動で送信</span>（ボタン1つで、症例と写真が管理者に届きます）` : `<span class="statusWarn">メールで送信</span>（業者データに送り先が入っていません）`}</div>${hasApi() ? `<button class="btn wide" id="apiPing" style="margin-top:8px">つながるか確認する</button>` : ""}</div></div>
    <div class="settingSec"><h3>管理者への送信先（メール・予備）</h3><div class="formCard"><input class="textInput" id="sBox" type="email" placeholder="例）xxxxxxxx@u.box.com" value="${esc(boxEmail())}" ${BOX_UPLOAD_EMAIL ? "readonly" : ""}><button class="btn wide" id="sBoxCopy" style="margin-top:8px">アドレスをコピー</button><div class="mutedText" style="margin-top:6px">Boxのアップロード用メールアドレス。管理者から教えてもらってください。</div></div></div>
    <div class="settingSec"><h3>使い方</h3><div class="formCard mutedText" style="line-height:1.8">
      1. 設定で業者データを取り込む（最初の1回だけ）<br>2. ホームで建物を選び、分類（水回り・電気・建具など）を押すと「①何が起きたかを書く ②業者の連絡先 ③これまでの症例」が出ます<br>3. 困ったら電話。「症例を書く」で、何があったか・どう対応したかを写真付きで残し、そのまま「管理者に報告」（管理ページに載ります）。LINEで連絡することもできますが、その場合は管理ページには載らないので、受け取った方が登録し直します<br>4. LINEで受けた報告の内容と写真も、同じ「症例を書く」で保管（「報告した人」に名前を入れる）<br>※ 見られるのは、この端末であなたが残した症例だけです。他のリーダーの症例は管理者がまとめて見ます</div></div>
    <div class="settingSec"><h3>このアプリについて</h3><div class="formCard mutedText">バージョン ${APP_VERSION}　／　症例 ${recs.length}件（この端末内）</div></div>`;
  $("sImport").onclick = () => $("masterFile").click();
  const ap = $("apiPing"); if (ap) ap.onclick = async () => { toast("確認しています..."); try { const j = await apiCall({ action: "ping" }, 20000); toast("つながっています（" + j.role + "）"); } catch (e) { toast("つながりませんでした：" + String(e && e.message || e).slice(0, 60)); } };
  $("sBoxCopy").onclick = () => copyText(boxEmail()).then((ok) => toast(ok ? "アドレスをコピーしました" : "コピーできませんでした"));
  $("sName").onchange = (e) => { setSetting("name", e.target.value.trim()); toast("保存しました"); };
  $("sBox").onchange = (e) => { if (!BOX_UPLOAD_EMAIL) { setSetting("box", e.target.value.trim()); toast("保存しました"); } };
}
$("masterFile").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  try { await importMaster(f); toast("業者データを取り込みました"); render(); } catch (err) { alert(err.message); }
});

/* ---------- お知らせ ---------- */
const seen = () => parseInt(getSetting("ann-seen", "0"), 10) || 0;
function refreshBell() { $("bellDot").hidden = ANNOUNCEMENTS.length <= seen(); }
$("bellBtn").onclick = () => {
  openSheet("お知らせ", (body) => {
    body.innerHTML = ANNOUNCEMENTS.map((a) => `<div class="annItem"><small>${esc(a.date)}${a.type === "fix" ? "　修正" : "　新機能"}</small>${esc(a.text)}</div>`).join("");
  });
  setSetting("ann-seen", String(ANNOUNCEMENTS.length));
  refreshBell();
};

/* ---------- 起動 ---------- */
$("gearBtn").innerHTML = icon("gear");
$("bellBtn").insertAdjacentHTML("afterbegin", icon("bell"));
$("backBtn").innerHTML = icon("back");
$("backBtn").onclick = () => { if (history.length > 1) history.back(); else go("#/home"); };
window.addEventListener("hashchange", render);
$("gearBtn").onclick = () => go("#/settings");
(async () => {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try {
    await loadMaster();
    refreshBell();
    if (!location.hash) history.replaceState(null, "", location.pathname + location.search + "#/home");
    await render();
  } catch (e) {
    console.error(e);
    $("main").innerHTML = `<div class="empty">端末の保存領域が使えませんでした。<br>Safariの「プライベートブラウズ」を使っていないか確認して、ホーム画面のアイコンから開き直してください。<br><button class="btn btnPrimary" id="retryBoot">もう一度開く</button></div>`;
    $("retryBoot").onclick = () => location.reload();
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
})();
