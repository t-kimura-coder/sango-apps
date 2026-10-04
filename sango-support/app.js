"use strict";
/* 山郷サポート：建物から入って業者の連絡先を調べ、トラブルと対応を写真付きで記録するPWA。
   社内データ（建物・業者・電話）はアプリに持たず、「マスターパック」JSONを取り込んで端末内（IndexedDB）に保存する。 */

const APP_VERSION = 15;
const ART_V = 2; // 絵を差し替えたら上げる
const BOX_UPLOAD_EMAIL = "______.7imjq60uox1556sk@u.box.com"; // Box「8.山郷サポート/報告」のアップロード用（アップロード専用なので公開しても読まれない）
const ANNOUNCEMENTS = [
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
async function loadMaster() { const m = await dbGet("meta", "master"); master = m && m.data ? m.data : null; return master; }
async function importMaster(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch (e) { throw new Error("JSONとして読めませんでした"); }
  if (!data || data.kind !== "sango-support-master" || !Array.isArray(data.buildings) || !Array.isArray(data.entries)) throw new Error("山郷サポート用のマスターデータではありません");
  await dbPut("meta", { key: "master", data, importedAt: Date.now() });
  master = data;
}

/* ---------- 画像 ---------- */
async function resizeImage(file, maxEdge) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch (e) {
    bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); });
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
function openSheet(title, build) {
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
  const close = () => back.remove();
  head.querySelector("button").onclick = close;
  back.addEventListener("click", (e) => { if (e.target === back) close(); });
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
  return { name: parts[0] || "home", id: parts[1] ? decodeURIComponent(parts[1]) : "", sub: parts[2] || "", sid: parts[3] ? decodeURIComponent(parts[3]) : "", q: new URLSearchParams(q || "") };
};
const go = (hash) => { location.hash = hash; };

async function render() {
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
  else go("#/home");
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
  if (!b) { go("#/home"); return; }
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
  if (!b || !c) { go("#/home"); return; }
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
  openSheet("管理者へ報告しますか？", (body, close) => {
    body.innerHTML = `<div class="mutedText" style="margin-bottom:12px">症例を保存しました。管理者へ報告（送信）すると、管理者がまとめて見られます。あとで「自分の症例」からでも報告できます。</div>
      <div class="btnCol"><button class="btn btnPrimary" id="arGo">${icon("send")}今すぐ報告する</button><button class="btn" id="arLater">あとで</button></div>`;
    $("arLater").onclick = close;
    $("arGo").onclick = () => { close(); sendRecords([rec]); };
  });
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
async function fillRecList(box, recs, emptyText) {
  if (!recs.length) { box.innerHTML = `<div class="empty"><img class="emptyArt" src="art/empty-records.webp?v=${ART_V}" alt="" data-fb="x"><br>${esc(emptyText)}</div>`; return; }
  const photos = await dbAll("photos");
  const firstThumb = {};
  photos.sort((a, b) => a.takenAt - b.takenAt).forEach((p) => { if (!firstThumb[p.recordId]) firstThumb[p.recordId] = p; });
  box.innerHTML = "";
  recs.forEach((r) => {
    const p = firstThumb[r.id];
    const btn = document.createElement("button");
    btn.className = "recItem";
    btn.innerHTML = `<div class="recThumb">${p && p.thumb ? `<img src="${blobUrl(p.thumb)}" alt="">` : icon("image")}</div>
      <div class="recBody"><div class="recMeta"><span>${fmtDate(r.createdAt)}</span>${r.categoryName ? `<span class="tag">${esc(r.categoryName)}</span>` : ""}${r.draft ? `<span class="tag warn">下書き</span>` : r.sentAt ? "" : `<span class="tag gray">未報告</span>`}</div>
      <div class="recTitle">${esc(r.what || "（内容なし）")}</div>
      <div class="recSub">${esc([r.buildingName, r.how].filter(Boolean).join(" ／ "))}</div></div>${icon("chevron")}`;
    btn.querySelector("svg:last-child").style.cssText = "width:18px;height:18px;color:var(--muted);flex:none";
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
  const editId = r.q.get("id");
  if (!form || form.key !== location.hash) {
    if (editId) {
      const rec = await dbGet("records", editId);
      if (!rec) { go("#/mine"); return; }
      const ps = (await photosOf(editId)).sort((a, b) => a.takenAt - b.takenAt);
      const full = await Promise.all(ps.map(async (p) => ({ id: p.id, takenAt: p.takenAt, thumb: p.thumb, blob: (await dbGet("images", p.id)).blob, saved: true })));
      form = { key: location.hash, id: rec.id, isNew: false, createdAt: rec.createdAt, sentAt: rec.sentAt, buildingId: rec.buildingId, categoryId: rec.categoryId, what: rec.what, how: rec.how, vendor: rec.vendor, reporter: rec.reporter || "", photos: full, removed: [] };
    } else {
      form = { key: location.hash, id: uid(), isNew: true, createdAt: Date.now(), sentAt: null, buildingId: r.q.get("b") || "", categoryId: r.q.get("c") || "", what: takePrefill(), how: "", vendor: "", reporter: "", photos: [], removed: [] };
    }
  }
  $("topTitle").textContent = form.isNew ? "症例を入力" : "症例を編集";
  const b = () => bById(form.buildingId), c = () => cById(form.categoryId);
  const draw = () => {
    main.innerHTML = `
      <button class="pickRow" id="pkB"><div class="pickIcon">${b() ? bldImg(b()) : icon("build")}</div><div class="pickText"><div class="pickLabel">建物</div><div class="pickValue${b() ? "" : " ph"}">${b() ? esc(b().name) : "選んでください"}</div></div>${icon("chevron")}</button>
      <button class="pickRow" id="pkC"><div class="pickIcon">${c() ? catIconHtml(c()) : icon("tool")}</div><div class="pickText"><div class="pickLabel">分類</div><div class="pickValue${c() ? "" : " ph"}">${c() ? esc(c().label) : "選んでください"}</div></div>${icon("chevron")}</button>
      <div class="formCard"><div class="fieldLabel">何が起きたか<span class="req">必須</span></div><textarea id="fWhat" maxlength="500" placeholder="例）洗面の排水がつまって水が流れにくい">${esc(form.what)}</textarea><div class="counter"><span id="cWhat">${form.what.length}</span>/500</div></div>
      <div class="formCard"><div class="fieldLabel">どう対応したか<span class="opt">対応中なら空欄でOK</span></div><textarea id="fHow" maxlength="500" placeholder="例）業者へ連絡。トラップを清掃し、排水は改善。">${esc(form.how)}</textarea><div class="counter"><span id="cHow">${form.how.length}</span>/500</div></div>
      <div class="formCard"><div class="fieldLabel">写真<span class="opt">複数枚OK</span></div><div class="photoStrip" id="strip"></div></div>
      <button class="pickRow" id="pkV"><div class="pickIcon">${icon("person")}</div><div class="pickText"><div class="pickLabel">対応した業者</div><div class="pickValue${form.vendor ? "" : " ph"}">${form.vendor ? esc(form.vendor) : "選んでください（任意）"}</div></div>${icon("chevron")}</button>
      <div class="formCard"><div class="fieldLabel">報告した人<span class="opt">LINEで受けた報告なら名前</span></div><input class="textInput" id="fRep" maxlength="40" placeholder="例）佐藤さん（自分で見つけた時は空欄）" value="${esc(form.reporter)}"></div>
      <div class="infoBar">${icon("info")}この症例はこの端末に保存されます。管理者へは「自分の症例」から送れます。</div>
      <div class="formActions"><button class="btn" id="fDraft">下書き保存</button><button class="btn btnPrimary" id="fSave">保存する</button></div>`;
    fillIcons(main);
    drawStrip();
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
    add("撮影", "camera", $("shootInput"));
    add("選ぶ", "image", $("pickInput"));
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
      <div class="fieldLabel" style="margin-top:14px">その他の業者名を入力</div><input class="textInput" id="vOther" placeholder="業者名" value="${esc(opts.includes(form.vendor) ? "" : form.vendor)}">
      <div class="btnCol"><button class="btn btnPrimary" id="vOk">この名前にする</button>${form.vendor ? `<button class="btn" id="vClear">選択を外す</button>` : ""}</div>`;
    body.querySelectorAll(".optBtn").forEach((el) => (el.onclick = () => { form.vendor = el.dataset.n; close(); draw(); }));
    $("vOk").onclick = () => { form.vendor = $("vOther").value.trim(); close(); draw(); };
    const cl = $("vClear"); if (cl) cl.onclick = () => { form.vendor = ""; close(); draw(); };
  });
  async function saveForm(draft) {
    if (!draft) {
      if (!form.buildingId) return toast("建物を選んでください");
      if (!form.categoryId) return toast("分類を選んでください");
      if (!form.what.trim()) return toast("「何が起きたか」を入力してください");
    } else if (!form.buildingId) return toast("下書きでも建物は選んでください");
    const rec = {
      id: form.id, buildingId: form.buildingId, buildingName: b() ? b().name : "", categoryId: form.categoryId, categoryName: c() ? c().label : "",
      what: form.what.trim(), how: form.how.trim(), vendor: form.vendor, reporter: form.reporter.trim(), draft, createdAt: form.createdAt, updatedAt: Date.now(), sentAt: null, by: getSetting("name"),
    };
    await dbPut("records", rec);
    for (const id of form.removed) { await dbDel("photos", id); await dbDel("images", id); }
    for (const p of form.photos) if (!p.saved) { await dbPut("images", { id: p.id, blob: p.blob }); await dbPut("photos", { id: p.id, recordId: form.id, takenAt: p.takenAt, thumb: p.thumb }); }
    const bid = form.buildingId;
    form = null;
    toast(draft ? "下書きを保存しました" : "保存しました");
    const cid = rec.categoryId;
    go(draft ? "#/mine" : cid ? `#/b/${encodeURIComponent(bid)}/c/${encodeURIComponent(cid)}` : "#/b/" + encodeURIComponent(bid));
    if (!draft) setTimeout(() => askReport(rec), 400);
  }
  draw();
}
async function addPhotos(files) {
  if (!form) return;
  for (const f of files) {
    try {
      const [blob, thumb] = [await resizeImage(f, 1600), await resizeImage(f, 360)];
      form.photos.push({ id: uid(), takenAt: f.lastModified || Date.now(), blob, thumb, saved: false });
    } catch (e) { toast("読み込めない写真がありました"); }
  }
  if (window.__formDraw) window.__formDraw();
}
$("shootInput").addEventListener("change", (e) => { addPhotos([...e.target.files]); e.target.value = ""; });
$("pickInput").addEventListener("change", (e) => { addPhotos([...e.target.files]); e.target.value = ""; });
function showLightbox(blob) { const lb = $("lightbox"); lb.innerHTML = `<img src="${blobUrl(blob)}" alt="">`; lb.hidden = false; lb.onclick = () => { lb.hidden = true; lb.innerHTML = ""; }; }

/* ---------- 自分の症例 ---------- */
let mineFilter = "all", mineQuery = "";
async function viewMine(main) {
  $("topTitle").textContent = "自分の症例";
  const all = (await dbAll("records")).sort((a, b) => b.createdAt - a.createdAt);
  const unsent = all.filter((r) => !r.draft && !r.sentAt);
  main.innerHTML = `
    <div class="mutedText" style="margin:0 4px 8px">この端末で、あなたが残した症例です。他の人の症例は出ません。</div>
    <div class="searchRow">${icon("search")}<input id="mQ" type="search" placeholder="建物・分類・内容で探す" value="${esc(mineQuery)}"></div>
    <div class="chips">${[["all", "すべて"], ["unsent", "未報告"], ["draft", "下書き"]].map(([k, l]) => `<button class="chip${mineFilter === k ? " on" : ""}" data-f="${k}">${l}</button>`).join("")}</div>
    ${unsent.length ? `<div class="sendBar"><button class="btn btnPrimary" id="sendAll">${icon("send")}未報告${unsent.length}件を管理者へ報告する</button></div>` : ""}
    <div class="recList" id="mList"></div>
    <button class="fab" id="fabAdd">${icon("plus")}症例を追加</button>`;
  const draw = async () => {
    const q = mineQuery.trim().toLowerCase();
    let list = all;
    if (mineFilter === "unsent") list = unsent;
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
  if (!r) { go("#/mine"); return; }
  $("topTitle").textContent = "症例";
  const ps = (await photosOf(id)).sort((a, b) => a.takenAt - b.takenAt);
  main.innerHTML = `
    <div class="formCard">
      <div class="recMeta" style="margin-bottom:8px"><span>${fmtDate(r.createdAt)}</span>${r.draft ? `<span class="tag warn">下書き</span>` : r.sentAt ? `<span class="tag">報告済み ${fmtDate(r.sentAt)}</span>` : `<span class="tag gray">未報告</span>`}</div>
      <dl class="kv"><dt>建物</dt><dd>${esc(r.buildingName)}</dd><dt>分類</dt><dd>${esc(r.categoryName || "—")}</dd><dt>何が起きたか</dt><dd>${esc(r.what || "—")}</dd><dt>どう対応したか</dt><dd>${esc(r.how || "—")}</dd><dt>対応した業者</dt><dd>${esc(r.vendor || "—")}</dd>${r.reporter ? `<dt>報告した人</dt><dd>${esc(r.reporter)}</dd>` : ""}</dl>
      ${ps.length ? `<div class="detailPhotos" id="dPhotos"></div>` : ""}
    </div>
    <div class="btnCol">
      ${r.draft ? "" : `<button class="btn btnPrimary" id="dSend">${icon("send")}管理者へ報告する${r.sentAt ? "（もう一度）" : ""}</button>`}
      <button class="btn" id="dEdit">${icon("edit")}${r.draft ? "続きを書く" : "編集する"}</button>
      <button class="btn btnDanger" id="dDel">${icon("trash")}削除する</button>
    </div>`;
  const box = $("dPhotos");
  if (box) ps.forEach((p) => { const im = document.createElement("img"); im.src = blobUrl(p.thumb); im.onclick = async () => showLightbox((await dbGet("images", p.id)).blob); box.appendChild(im); });
  $("dEdit").onclick = () => { form = null; go(`#/new?id=${encodeURIComponent(id)}`); };
  const ds = $("dSend"); if (ds) ds.onclick = () => sendRecords([r]);
  $("dDel").onclick = async () => {
    if (!confirm("この症例を削除しますか？写真も消えます。")) return;
    for (const p of ps) { await dbDel("photos", p.id); await dbDel("images", p.id); }
    await dbDel("records", id);
    toast("削除しました");
    go("#/mine");
  };
}

/* ---------- 管理者へ報告する（Boxのメール宛 ＋ 共有シート） ---------- */
function boxEmail() { return BOX_UPLOAD_EMAIL || getSetting("box"); }
async function sendRecords(list) {
  const email = boxEmail();
  if (!email) { toast("先に設定で管理者の送信先を入れてください"); return go("#/settings"); }
  if (!getSetting("name")) { toast("先に設定で名前を入れてください"); return go("#/settings"); }
  const files = [];
  const outRecs = [];
  let bytes = 0;
  for (const r of list) {
    const ps = (await photosOf(r.id)).sort((a, b) => a.takenAt - b.takenAt);
    const outPhotos = [];
    let n = 0;
    for (const p of ps) {
      n++;
      const blob = (await dbGet("images", p.id)).blob;
      const name = safeName(`${r.buildingName}_${r.categoryName || "分類"}_${mmdd(r.createdAt)}_${r.id.slice(-4)}_${n}.jpg`);
      files.push(new File([blob], name, { type: "image/jpeg" }));
      bytes += blob.size;
      outPhotos.push({ file: name, taken_at: new Date(p.takenAt).toISOString() });
    }
    outRecs.push({ id: r.id, building_id: r.buildingId, building: r.buildingName, category_id: r.categoryId, category: r.categoryName, what: r.what, how: r.how, vendor: r.vendor, reporter: r.reporter || "", created_at: new Date(r.createdAt).toISOString(), updated_at: new Date(r.updatedAt || r.createdAt).toISOString(), photos: outPhotos });
  }
  const payload = { kind: "sango-support-records", schema: 1, app_version: APP_VERSION, master_version: master ? master.version : "", sent_at: new Date().toISOString(), sender: getSetting("name"), sender_id: deviceId(), records: outRecs };
  const jsonName = safeName(`症例_${getSetting("name")}_${ymd(Date.now())}_${list.length}件.json`);
  const jsonFile = new File([JSON.stringify(payload, null, 2)], jsonName, { type: "application/json" });
  const all = [jsonFile, ...files];
  if (bytes > MAIL_WARN_BYTES && !confirm("写真が15MBを超えています。メールの容量上限で送れないかもしれません。このまま進めますか？")) return;
  if (navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
  if (!(navigator.canShare && navigator.canShare({ files: all }))) { alert("この端末では共有機能が使えないため送信できません。iPhoneのホーム画面から開いてください。"); return; }
  try { await navigator.share({ files: all, title: jsonName }); } catch (e) { return; }
  if (confirm("メールを送れましたか？\n送れていたら「OK」で、報告済みにします。")) {
    const now = Date.now();
    for (const r of list) await dbPut("records", { ...r, sentAt: now });
    toast("報告済みにしました");
    render();
  } else toast("報告済みにはしていません");
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
    <div class="settingSec"><h3>あなたの名前</h3><div class="formCard"><input class="textInput" id="sName" placeholder="例）木村" value="${esc(getSetting("name"))}"><div class="mutedText" style="margin-top:6px">症例を送る時に付きます。</div></div></div>
    <div class="settingSec"><h3>管理者への送信先</h3><div class="formCard"><input class="textInput" id="sBox" type="email" placeholder="例）xxxxxxxx@u.box.com" value="${esc(boxEmail())}" ${BOX_UPLOAD_EMAIL ? "readonly" : ""}><div class="mutedText" style="margin-top:6px">Boxのアップロード用メールアドレス。管理者から教えてもらってください。</div></div></div>
    <div class="settingSec"><h3>使い方</h3><div class="formCard mutedText" style="line-height:1.8">
      1. 設定で業者データを取り込む（最初の1回だけ）<br>2. ホームで建物を選び、分類（水回り・電気・建具など）を押すと「①何が起きたかを書く ②業者の連絡先 ③これまでの症例」が出ます<br>3. 困ったら電話。「症例を書く」で、何があったか・どう対応したかを写真付きで残し、そのまま管理者へ報告<br>4. LINEで受けた報告の内容と写真も、同じ「症例を書く」で保管（「報告した人」に名前を入れる）<br>※ 見られるのは、この端末であなたが残した症例だけです。他のリーダーの症例は管理者がまとめて見ます</div></div>
    <div class="settingSec"><h3>このアプリについて</h3><div class="formCard mutedText">バージョン ${APP_VERSION}　／　症例 ${recs.length}件（この端末内）</div></div>`;
  $("sImport").onclick = () => $("masterFile").click();
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
  await loadMaster();
  refreshBell();
  if (!location.hash) location.hash = "#/home";
  await render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(() => {});
})();
