/* ==========================================================
   現場ナビ 見守り（管理者ビューア）
   現場ナビ（genba-manual）から Box に届いた報告JSON・写真を、PCで一覧する。
   - データはサーバーに置かない。Box Drive で同期しているフォルダを選んで、ブラウザの中で読むだけ
   - 返信は、選んだフォルダの「返信」フォルダに JSON で書き出す（現場ナビ側で取り込む）
   ========================================================== */

const APP_NAME = "現場ナビ 見守り"; // 名前を変える時はここと index.html の title / manifest
const APP_VERSION = 20;
const LS = "genba-viewer-"; // localStorage の接頭辞（同じドメインの他アプリと分ける）
const LATE_DAYS = 8; // 最終報告からこの日数たったら「報告の遅れ」
const REPLY_DIR = "返信";

const $ = (id) => document.getElementById(id);

const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  report: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h4"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  sort: '<path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4M13 16l4 4 4-4"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M16.5 14.6c2.6.2 4.4 2 5 5"/>',
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

// 同じ現場を二人以上で担当していると、現場ナビ側では別々の現場として届く。工事番号があればそれでまとめる
let koujiBySiteId = new Map(); // site_id → 工事番号（後から番号を入れた現場の、番号が無い頃の報告もまとめるため）
function normKouji(v) {
  return String(v || "").normalize("NFKC").replace(/\s/g, "");
}
function siteKeyOf(r) {
  const no = normKouji(r.kouji_no) || (r.site_id && koujiBySiteId.get(r.site_id)) || "";
  if (no) return "kouji:" + no;
  return r.site_id || "name:" + r.site;
}

// 17分類 → 6工程（現場ナビの GROUPS と同じ）。現場全体の進み具合を、担当者のチェックを合わせて数えるのに使う
const PROC_GROUP = {
  "解体・仮設準備": "基礎", "地盤・基礎工事": "基礎",
  "足場工事": "上棟", "大工工事（建方・上棟）": "上棟", "大工工事（屋根下地）": "上棟",
  "大工工事（外壁下地・断熱）": "外装", "屋根仕上げ工事（板金）": "外装", "外壁仕上げ": "外装",
  "大工工事（内部下地）": "内装", "大工工事（造作・建具）": "内装", "仕上げ：塗装": "内装", "仕上げ：クロス": "内装", "仕上げ：床・タイル": "内装",
  "電気・設備配管工事": "設備",
  "美装・検査": "引渡し", "外構": "引渡し", "引渡し": "引渡し",
};
function personKeyOf(r) {
  return r.sender_id || "name:" + (r.sender || "（名前なし）");
}

function buildData(reports, replies, statuses = [], meetings = []) {
  data.meetings = new Map();
  meetings.filter((m) => m && m.site_key && m.week).sort((a, b) => (a.at < b.at ? -1 : 1)).forEach((m) => addMeetingToData(m));
  data.taskDone = new Map();
  const latestBy = new Map();
  reports.forEach((r) => {
    if (!r || !Array.isArray(r.tasks_done)) return;
    const k = `${r.site_id || r.site}|${personKeyOf(r)}`;
    if (!latestBy.has(k) || latestBy.get(k).sent_at < r.sent_at) latestBy.set(k, r);
  });
  latestBy.forEach((r) => r.tasks_done.forEach((t) => t && t.id && data.taskDone.set(t.id, t)));
  const num = (v) => Number(v) || 0;
  reports.forEach((r) =>
    (r && Array.isArray(r.progress) ? r.progress : []).forEach((g) => ["checks_done", "checks_total", "checks_na", "photos_done", "photos_total"].forEach((k) => (g[k] = num(g[k]))))
  );
  data.reports = [];
  data.sites = new Map();
  data.people = new Map();
  data.notes = new Map();
  data.replies = new Map();
  data.statuses = statuses.filter((x) => x && x.status && x.at);
  const valid = reports.filter((r) => r && r.kind === "genba-photo-report" && r.period).sort((a, b) => (a.sent_at < b.sent_at ? -1 : 1));
  koujiBySiteId = new Map();
  [...valid, ...statuses].forEach((r) => {
    if (r && r.site_id && normKouji(r.kouji_no)) koujiBySiteId.set(r.site_id, normKouji(r.kouji_no));
  });
  const latest = new Map();
  valid.forEach((r) => {
    // 同じ人が同じ期間を送り直したものは、あとから届いた方だけを使う
    const k = r.report_id ? "id:" + r.report_id : `${siteKeyOf(r)}|${personKeyOf(r)}|${r.period.start}`;
    latest.set(k, r);
  });
  data.reports = [...latest.values()].sort((a, b) => (a.sent_at < b.sent_at ? -1 : 1));

  data.reports.forEach((r) => {
    const sk = siteKeyOf(r);
    const pk = personKeyOf(r);
    let site = data.sites.get(sk);
    if (!site) data.sites.set(sk, (site = { key: sk, name: r.site, koujiNo: r.kouji_no || "", personKey: pk, personName: r.sender || "", persons: new Map(), members: new Set(), reports: [] }));
    site.name = r.site;
    site.personKey = pk; // いちばん新しい報告の人（パンくず用）
    site.personName = r.sender || site.personName;
    site.persons.set(pk, r.sender || "（名前なし）");
    (r.members || []).forEach((m) => site.members.add(m));
    site.reports.push(r);
    let p = data.people.get(pk);
    if (!p) data.people.set(pk, (p = { key: pk, name: r.sender || "（名前なし）", sites: new Set(), reports: [] }));
    p.name = r.sender || p.name;
    p.sites.add(sk);
    p.reports.push(r);

    (r.checks || []).forEach((c) =>
      (c.notes || []).forEach((n) => {
        const typeId = n.type_id || TYPE_BY_LABEL[n.type] || "notice";
        const id = n.id || `${sk}|${c.item}|${n.at}|${n.text}`; // 古い報告のメモには番号が無い
        const prev = data.notes.get(id);
        const ver = n.updated_at || r.sent_at;
        if (prev && prev._ver > ver) return; // 古い報告に入っていた同じメモは、新しい方を使う
        data.notes.set(id, {
          id,
          type: typeOverrides()[id] || typeId, // 上司が「疑問として扱う」にしたものは疑問として数える
          origType: typeId,
          text: n.text || "",
          at: n.at,
          by: n.by || r.sender || "",
          status: n.status || "",
          resolvedAt: n.resolved_at || "",
          resolvedBy: n.resolved_by || "",
          noId: !n.id,
          siteKey: sk,
          siteId: r.site_id || "", // 監督の端末での現場の番号（返信に入れる）
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
  // 現場ナビからの知らせ（完工・進行中に戻す・休工・再開・アプリ外／報告なしの週）を時刻順に当てはめる。
  // 報告の中の休工の印（paused）も、その報告の時点の状態として使う
  data.sites.forEach((site) => {
    const lastRep = site.reports.reduce((a, r) => (!a || r.sent_at > a.sent_at ? r : a), null);
    if (lastRep && lastRep.paused) site.pausedAt = lastRep.sent_at;
  });
  statuses
    .filter((x) => x && x.status && x.at)
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .forEach((x) => {
      const site = data.sites.get(siteKeyOf(x));
      if (!site) return;
      if (x.status === "completed") site.completedAt = x.at;
      else if (x.status === "active") site.completedAt = null;
      else if (x.status === "paused") site.pausedAt = x.at;
      else if (x.status === "resumed") site.pausedAt = null;
      else if (x.status === "week") (site.otherWeeks = site.otherWeeks || []).push({ week: x.week, kind: x.week_kind, memo: x.memo || "", at: x.at, personKey: personKeyOf(x) });
      // 知らせを送ったのも「報告をした」動きとして扱う
      const p = data.people.get(personKeyOf(x));
      if (p) p.lastNoticeAt = !p.lastNoticeAt || x.at > p.lastNoticeAt ? x.at : p.lastNoticeAt;
    });
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

// 状態：疑問は 未回答 → 返信済み → 解決済み（解決は監督が現場ナビで付ける）。
// 職人さんの要望も返事が要ることが多いので、返信するまで「未回答」に数える。気づきは返信したら「返信済み」
function noteStatus(n) {
  if (n.type === "question" && n.status === "resolved") return "resolved";
  if ((data.replies.get(n.id) || []).length) return "replied";
  return n.type === "question" || n.type === "request" ? "open" : "";
}

// 「疑問として扱う」（監督が種類を選び間違えた時など）。この PC だけに覚える
function typeOverrides() {
  try {
    return JSON.parse(getLS("typeOverrides", "{}"));
  } catch (e) {
    return {};
  }
}
function toggleAsQuestion(n) {
  const o = typeOverrides();
  if (n.type === "question" && n.origType !== "question") delete o[n.id];
  else o[n.id] = "question";
  setLS("typeOverrides", JSON.stringify(o));
  n.type = o[n.id] || n.origType;
  updateNavBadge();
  route();
  openNote(n.id);
}
const STATUS_LABEL = { open: "未回答", replied: "返信済み", resolved: "解決済み" };

/* ---------- 自分の班（班の打合せ用に、班のメンバーの報告・疑問だけを出す） ----------
   見せ方だけの絞り込み（Box の権限は変わらない）。この PC に覚える。監督は名前で覚える（端末を替えても同じ人になるように） */
function normName(s) {
  return String(s || "").normalize("NFKC").replace(/\s/g, "");
}
function teamList() {
  try {
    return JSON.parse(getLS("team", "[]"));
  } catch (e) {
    return [];
  }
}
function teamOn() {
  return teamList().length > 0 && getLS("scope", "team") !== "all";
}
function personInScope(p) {
  if (!teamOn()) return true;
  if (!p) return false;
  const n = normName(p.name);
  return teamList().some((x) => normName(x) === n) || (!!getLS("name") && normName(getLS("name")) === n); // 自分の現場も出す
}
function noteInScope(n) {
  return personInScope(data.people.get(n.personKey));
}
function scopedPeople() {
  return [...data.people.values()].filter(personInScope);
}
function scopedNotes() {
  return [...data.notes.values()].filter(noteInScope);
}
// 画面の上の「班だけ／全員」
function scopeBarHtml() {
  const t = teamList();
  if (!t.length) return `<div class="scopeBar"><span>${icon("people", 16)}全員を表示しています</span><a href="#/settings" class="moreLink">自分の班を設定${icon("chevron", 14)}</a></div>`;
  const on = teamOn();
  return (
    `<div class="scopeBar"><span>${icon("people", 16)}表示</span><div class="scopeSeg"><button data-scope="team" class="${on ? "on" : ""}">自分の班（${t.length}人）</button><button data-scope="all" class="${on ? "" : "on"}">全員</button></div>` +
    `<a href="#/settings" class="moreLink">班を変える${icon("chevron", 14)}</a></div>`
  );
}

function openQuestions() {
  return scopedNotes().filter((n) => noteStatus(n) === "open");
}

function personStats(p) {
  const last = p.reports[0];
  // アプリ外で報告した週・報告なしの週も、最後に報告した日として扱う
  const otherAt = p.reports.flatMap((r) => (r.other_weeks || []).map((w) => w.at)).filter(Boolean).sort().pop();
  const weekPhotos = p.reports.filter((r) => daysAgo(r.sent_at) <= 6).reduce((s, r) => s + (r.photos || []).length, 0);
  const open = [...data.notes.values()].filter((n) => n.personKey === p.key && noteStatus(n) === "open").length;
  const lastAt = [last && last.sent_at, otherAt, p.lastNoticeAt].filter(Boolean).sort().pop();
  const lastDays = lastAt ? daysAgo(lastAt) : null;
  const active = [...p.sites].some((k) => {
    const s = data.sites.get(k) || {};
    return !s.completedAt && !s.pausedAt;
  });
  const late = active && (lastDays == null || lastDays >= LATE_DAYS);
  const state = open ? "need" : late ? "late" : "ok"; // 表示はいちばん急ぐもの。絞り込みは need / late を別々に見る
  return { last, lastAt, lastDays, weekPhotos, open, late, state };
}
/* ---------- 週の報告（監督 × 現場 × 週の一覧表） ----------
   現場ナビと同じ決まり：工事は月〜土を1週。その週の報告は金曜〜翌週の月曜、遅くとも火曜。
   その週の金曜に休工していた週・完工した後の週は報告しなくてよい。WEEK_RULE_START より前の週は遅れに数えない */
const WEEK_RULE_START = "2026-09-28";
const WEEK_COLS = 6;
function dayKey(v) {
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d)) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(key, n) {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
function weekMon(key) {
  const d = new Date(key + "T00:00:00");
  return addDays(key, -((d.getDay() + 6) % 7));
}
// 報告がどの週の分か。新しい報告は期間が「月〜土」なのでその月曜、古い報告は送った日（金〜翌木）で決める
function reportWeekOf(r) {
  const st = r.period && r.period.start;
  if (st && st >= WEEK_RULE_START && weekMon(st) === st) return st;
  return weekMon(addDays(dayKey(r.sent_at), -4));
}
// その人のその現場の休工の期間：最新の報告の pauses に、その後に届いた休工・再開の知らせを足す
function pausesOf(site, pk) {
  const last = site.reports.filter((r) => personKeyOf(r) === pk).reduce((a, r) => (!a || r.sent_at > a.sent_at ? r : a), null);
  const list = ((last && last.pauses) || []).map((p) => ({ from: p.from, to: p.to || null }));
  (data.statuses || [])
    .filter((x) => siteKeyOf(x) === site.key && personKeyOf(x) === pk && (!last || x.at > last.sent_at))
    .sort((a, b) => (a.at < b.at ? -1 : 1))
    .forEach((x) => {
      const open = list.find((p) => !p.to);
      if (x.status === "paused" && !open) list.push({ from: x.from || dayKey(x.at), to: null });
      else if (x.status === "resumed" && open) open.to = dayKey(x.at);
    });
  return list;
}
function weekCell(site, pk, mon, ctx) {
  const today = ctx.today;
  const fri = addDays(mon, 4);
  const mine = site.reports.filter((r) => personKeyOf(r) === pk);
  const rep = mine.filter((r) => reportWeekOf(r) === mon).sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1))[0];
  if (rep) return { st: "done", label: "済", title: `${fmtDateTime(rep.sent_at)} に報告・写真 ${(rep.photos || []).length}枚`, rep };
  const other = [
    ...mine.flatMap((r) => r.other_weeks || []),
    ...(site.otherWeeks || []).filter((w) => w.personKey === pk),
  ].filter((w) => w.week === mon).sort((a, b) => ((a.at || "") < (b.at || "") ? 1 : -1))[0];
  if (other)
    return other.kind === "skip"
      ? { st: "skip", label: "報告なし", title: other.memo ? `報告なし：${other.memo}` : "今週は報告なし（現場ナビで記録）" }
      : { st: "ext", label: "アプリ外", title: other.memo ? `アプリ外で報告：${other.memo}` : "アプリ外で報告済み" };
  const byOther = site.persons.size > 1 && site.reports.find((r) => personKeyOf(r) !== pk && reportWeekOf(r) === mon);
  if (byOther) return { st: "done other", label: "済（他）", title: `${byOther.sender || "ほかの担当"} が報告` };
  if (mon < ctx.firstWeek(site, pk)) return { st: "none", label: "", title: "まだ現場ナビで報告していない頃" };
  if (site.completedAt && dayKey(site.completedAt) < fri) return { st: "fin", label: "完工", title: `${fmtMD(site.completedAt)} に完工` };
  if (pausesOf(site, pk).some((p) => p.from <= (fri <= today ? fri : today) && (!p.to || (fri <= today ? fri : today) <= p.to)))
    return { st: "paused", label: "休工", title: "休工中（報告はお休み）" };
  if (today < fri) return { st: "none", label: "", title: `報告は ${fmtMD(fri)}〜${fmtMD(addDays(mon, 7))}` };
  if (today <= addDays(mon, 7)) return { st: "open", label: "受付中", title: `報告は ${fmtMD(addDays(mon, 7))}まで（遅くとも ${fmtMD(addDays(mon, 8))}）` };
  if (today === addDays(mon, 8)) return { st: "due", label: "今日まで", title: "今日が期限です" };
  if (mon < WEEK_RULE_START) return { st: "none", label: "－", title: "週の決まりを始める前の週" };
  return { st: "miss", label: "未報告", title: `期限（${fmtMD(addDays(mon, 8))}）を過ぎています` };
}

/* ---------- 現場カード（ホームの主役：現場ごとの進み具合・今週の報告・現場の声） ---------- */
function siteInScope(s) {
  return [...s.persons.keys()].some((pk) => personInScope(data.people.get(pk)));
}
// 今の段階：チェックが付いている段階のうち、いちばん後ろ
function siteStage(prog) {
  if (!prog) return -1;
  let idx = -1;
  prog.forEach((g, i) => {
    if (!g.before_start && g.checks_done > 0) idx = i;
  });
  return idx >= 0 ? idx : prog.findIndex((g) => !g.before_start);
}
// 今週（月・火曜は先週）の報告の状態。二人担当なら、いちばん進んでいる人の状態
const WEEK_RANK = { done: 0, ext: 1, skip: 2, fin: 3, paused: 4, miss: 5, due: 6, open: 7, none: 8 };
function makeWeekCtx() {
  const today = dayKey(new Date());
  const thisMon = weekMon(today);
  const cache = new Map();
  return {
    today,
    thisMon,
    focus: today <= addDays(thisMon, 1) ? addDays(thisMon, -7) : thisMon,
    firstWeek(site, pk) {
      const k = site.key + "|" + pk;
      if (!cache.has(k)) cache.set(k, site.reports.filter((r) => personKeyOf(r) === pk).map(reportWeekOf).sort()[0] || thisMon);
      return cache.get(k);
    },
  };
}
function siteWeekState(s, ctx) {
  const cells = [...s.persons.keys()].map((pk) => weekCell(s, pk, ctx.focus, ctx));
  const rank = (c) => WEEK_RANK[c.st.split(" ")[0]] + (c.st === "done other" ? 0.5 : 0); // 本人の「済」を「済（他）」より先に
  return cells.sort((a, b) => rank(a) - rank(b))[0] || { st: "none", label: "" };
}
function siteCard(s, ctx) {
  const prog = siteProgress(s);
  const stage = siteStage(prog);
  const last = s.reports[0];
  const curProc = last && (last.processes || []).length ? shortProc(last.processes[last.processes.length - 1].name) : "";
  const notes = [...data.notes.values()].filter((n) => n.siteKey === s.key).filter(noteInScope);
  const open = notes.filter((n) => noteStatus(n) === "open");
  const latest = notes.filter((n) => noteStatus(n) !== "resolved").sort((a, b) => (a.at < b.at ? 1 : -1))[0];
  const wk = siteWeekState(s, ctx);
  const late = !s.completedAt && !s.pausedAt && (wk.st === "miss" || wk.st === "due");
  const segs = (prog || []).map((g, i) => {
    const st = g.before_start ? "pre" : g.checks_total && g.checks_done >= g.checks_total ? "done" : i === stage ? "cur" : i < stage ? "done" : "";
    const pct = g.checks_total ? Math.round((g.checks_done / g.checks_total) * 100) : 0;
    return `<span class="scSeg ${st}" title="${esc(g.group)}：${g.before_start ? "導入前" : `チェック ${g.checks_done}/${g.checks_total}（${pct}%）`}"><i${st === "cur" ? ` style="--p:${Math.max(12, pct)}%"` : ""}></i><small>${esc(g.group)}</small></span>`;
  });
  return (
    `<div class="siteCard${s.completedAt ? " fin" : s.pausedAt ? " paused" : ""}${open.length || late ? " alert" : ""}" data-site="${esc(s.key)}" role="button" tabindex="0">` +
    `<div class="scHead"><b class="scTitle">${esc(s.name)}</b>${s.koujiNo ? `<span class="scNo">No.${esc(s.koujiNo)}</span>` : ""}` +
    `<span class="wk ${wk.st}" title="${esc(wk.title || "")}">${wk.label || "－"}</span></div>` +
    `<div class="scPeople">${[...s.persons.values()].map((n) => `<span>${avatar(n, 22)}${esc(n)}</span>`).join("")}</div>` +
    (prog ? `<div class="scStages">${segs.join("")}</div>` : "") +
    `<div class="scNow"><span>${stage >= 0 && prog ? `今：<b>${esc(prog[stage].group)}</b>${curProc ? `（${esc(curProc)}）` : ""}` : "進み具合はまだ届いていません"}</span><span>${last ? `最終報告 ${fmtMD(last.sent_at)}` : ""}</span></div>` +
    `<div class="scVoice">${
      latest
        ? `${typeBadge(latest.type)}${statusBadge(latest)}<span class="scVoiceText">${esc(headline(latest.text))}</span><span class="mutedText">${relTime(latest.at)}</span>`
        : `<span class="mutedText scVoiceText">対応待ちの声はありません</span>`
    }${open.length ? `<span class="sBadge open">未回答 ${open.length}</span>` : ""}</div></div>`
  );
}
let siteFilter = "all";
const SITE_SORTS = [["rec", "おすすめ順"], ["stage", "進み具合順"], ["old", "最終報告が古い順"], ["name", "現場名順"]];
function siteSectionHtml() {
  const ctx = makeWeekCtx();
  const sites = [...data.sites.values()].filter(siteInScope).filter((s) => matchesQuery(s.name, ...s.persons.values()));
  const info = sites.map((s) => {
    const open = [...data.notes.values()].filter((n) => n.siteKey === s.key && noteStatus(n) === "open" && noteInScope(n)).length;
    const wk = siteWeekState(s, ctx).st.split(" ")[0];
    const rest = !!(s.completedAt || s.pausedAt);
    const late = !rest && (wk === "miss" || wk === "due");
    const stage = siteStage(siteProgress(s));
    return { s, open, wk, rest, late, stage, last: (s.reports[0] || {}).sent_at || "", rank: open ? 0 : late ? 1 : rest ? (s.completedAt ? 4 : 3) : 2 };
  });
  const hit = (x, k) => k === "all" || (k === "open" ? x.open > 0 : k === "late" ? x.late || x.wk === "open" : x.rest);
  const chips = [["all", "すべて"], ["open", "未回答あり"], ["late", "今週の報告まだ"], ["rest", "休工・完工"]];
  const sort = getLS("siteSort", "rec");
  const cmp = {
    rec: (a, b) => a.rank - b.rank || b.open - a.open || a.s.name.localeCompare(b.s.name, "ja"),
    stage: (a, b) => (a.rest - b.rest) || b.stage - a.stage || a.s.name.localeCompare(b.s.name, "ja"),
    old: (a, b) => (a.rest - b.rest) || (a.last < b.last ? -1 : a.last > b.last ? 1 : 0),
    name: (a, b) => a.s.name.localeCompare(b.s.name, "ja"),
  }[sort] || ((a, b) => a.rank - b.rank);
  const shown = info.filter((x) => hit(x, siteFilter)).sort(cmp);
  return (
    `<div class="siteSecHead"><h2>現場の状況</h2><span class="sub">現場を選ぶと、詳しい状況と現場からの声を確認できます。</span>` +
    `<label class="sortSel">${icon("sort", 16)}<select id="siteSort" class="select">${SITE_SORTS.map(([k, l]) => `<option value="${k}"${sort === k ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>` +
    `<div class="chips siteChips">${chips.map(([k, l]) => `<button class="chip${siteFilter === k ? " on" : ""}" data-sf="${k}">${l}<span class="chipNum ${k === "open" ? "need" : k === "late" ? "late" : k === "rest" ? "ok" : "all"}">${info.filter((x) => hit(x, k)).length}</span></button>`).join("")}</div>` +
    (shown.length ? `<div class="siteGrid">${shown.map((x) => siteCard(x.s, ctx)).join("")}</div>` : `<div class="emptyText pad">該当する現場はありません。</div>`) +
    `<a class="moreLink personLink" href="#/sites">担当者ごとに見る（報告の遅れ・未回答）${icon("chevron", 16)}</a>`
  );
}

/* 現場の声を工程順に（段階ごと。今の段階と未回答のある段階は開いておく） */
const STAGE_NAMES = ["基礎", "上棟", "外装", "内装", "設備", "引渡し"];
const STAGE_ART = { 基礎: "stage-1", 上棟: "stage-2", 外装: "stage-3", 内装: "stage-4", 設備: "stage-5", 引渡し: "stage-6" };
function siteVoicesHtml(s, prog, order = "old") {
  const notes = [...data.notes.values()].filter((n) => n.siteKey === s.key);
  const stage = siteStage(prog);
  const byGroup = new Map(STAGE_NAMES.map((g) => [g, []]));
  const other = [];
  notes.forEach((n) => (byGroup.get(PROC_GROUP[n.process]) || other).push(n));
  const row = (n) => {
    const rest = restText(n.text);
    return (
      `<button class="voiceRow ${noteStatus(n)}" data-note="${esc(n.id)}"><span class="vBadges">${typeBadge(n.type, n.origType)}${statusBadge(n)}</span>` +
      `<span class="vWho">${avatar(n.personName, 22)}${esc(n.personName)}</span>` +
      `<span class="vText"><b>${esc(headline(n.text))}</b><small>${esc(rest || `${shortProc(n.process)} › ${n.item || ""}`)}</small></span>` +
      `<span class="vDate">${fmtMD(n.at)}</span></button>`
    );
  };
  const sec = (name, list, i) => {
    const nOpen = list.filter((n) => noteStatus(n) === "open").length;
    const isCur = !!prog && i >= 0 && i === stage;
    const open = list.length && (isCur || nOpen);
    const label = isCur && s.reports[0] && (s.reports[0].processes || []).length ? `${name}（${shortProc(s.reports[0].processes.slice(-1)[0].name)}）` : name;
    return (
      `<details class="voiceGroup${nOpen ? " hasOpen" : ""}${list.length ? "" : " empty"}"${open ? " open" : ""}><summary><img src="art/${STAGE_ART[name] || "stage-1"}.webp" alt=""><b>${esc(label)}</b>` +
      `<span class="vCount${nOpen ? " open" : ""}">${list.length}件</span>${isCur ? `<span class="tag">今の段階</span>` : ""}${icon("chevron", 18)}</summary>` +
      (list.length ? `<div class="voiceList">${list.sort((a, b) => (order === "new" ? (a.at < b.at ? 1 : -1) : a.at < b.at ? -1 : 1)).map(row).join("")}</div>` : "") +
      `</details>`
    );
  };
  return (
    `<div class="card sdPanel"><div class="sdPanelHead"><div><h2>現場の声（工程順）</h2><div class="sub">現場からの疑問・気づき・職人さんの要望を、工程ごとに確認できます。</div></div>` +
    `<label class="sortSel">${icon("sort", 16)}<select id="voiceOrder" class="select"><option value="old"${order === "old" ? " selected" : ""}>古い順</option><option value="new"${order === "new" ? " selected" : ""}>新しい順</option></select></label></div>` +
    (notes.length ? "" : `<div class="emptyText pad">この現場からの声は、まだありません。</div>`) +
    `<div class="voiceGroups">${STAGE_NAMES.map((g, i) => sec(g, byGroup.get(g), i)).join("")}${other.length ? sec("その他", other, -1) : ""}</div></div>`
  );
}

/* ---------- 班の打合せモード（班の現場を1件ずつめくる。打合せメモと宿題を残す） ----------
   打合せメモ：報告フォルダの「打合せ」に genba-meeting-memo（現場×週で1つ。保存し直すと上書き）
   宿題：監督あては「返信／監督名」に genba-task を書き出す（現場ナビが返信と一緒に取り込む）。済は現場ナビの報告の tasks_done で戻る */
const MEET_DIR = "打合せ";
const PROCESS_NAMES = ["解体・仮設準備", "地盤・基礎工事", "足場工事", "大工工事（建方・上棟）", "大工工事（屋根下地）", "大工工事（外壁下地・断熱）", "大工工事（内部下地）",
  "大工工事（造作・建具）", "屋根仕上げ工事（板金）", "電気・設備配管工事", "仕上げ：塗装", "仕上げ：クロス", "仕上げ：床・タイル", "外壁仕上げ", "美装・検査", "外構", "引渡し"];
function meetSites() {
  const ctx = makeWeekCtx();
  const oldFin = addDays(ctx.focus, -14);
  return [...data.sites.values()]
    .filter(siteInScope)
    .filter((s) => !s.completedAt || dayKey(s.completedAt) >= oldFin) // 2週より前に完工した現場は打合せに出さない
    .sort((a, b) => ((a.completedAt ? 2 : a.pausedAt ? 1 : 0) - (b.completedAt ? 2 : b.pausedAt ? 1 : 0)) || (a.koujiNo || a.name).localeCompare(b.koujiNo || b.name, "ja"));
}
function memosOf(s) {
  return (data.meetings.get(s.key) || []).slice().sort((a, b) => (a.week < b.week ? 1 : -1));
}
function taskState(t) {
  if (t.status === "cancelled") return "cancelled";
  if (t.status === "done" || data.taskDone.has(t.id)) return "done";
  if (t.due && t.due < dayKey(new Date())) return "over";
  return "open";
}
function taskRowHtml(t, canToggle) {
  const st = taskState(t);
  const done = data.taskDone.get(t.id);
  return (
    `<div class="taskRow ${st}"><span class="taskMark">${st === "done" ? icon("check", 14, 3.4) : ""}</span><span class="taskText">${esc(t.text)}` +
    `${t.process ? `<small>${esc(shortProc(t.process))}</small>` : ""}</span><span class="taskWho">${esc(t.assignee || "")}</span>` +
    `<span class="taskDue">${st === "done" ? `済 ${fmtMD((done && done.done_at) || t.done_at || "")}` : t.due ? `${fmtMD(t.due)}まで` : ""}</span>` +
    (canToggle && t.assignee_kind === "boss" && st !== "cancelled" ? `<button class="miniBtn" data-boss-task="${esc(t.id)}">${st === "done" ? "戻す" : "済にする"}</button>` : "") +
    `</div>`
  );
}
// 下書き（保存前に別の現場へめくっても消えないように、この PC に置いておく）
function meetDraft(key, week) {
  try {
    return JSON.parse(getLS(`meetDraft|${key}|${week}`, "null"));
  } catch (e) {
    return null;
  }
}
function setMeetDraft(key, week, d) {
  if (d) setLS(`meetDraft|${key}|${week}`, JSON.stringify(d));
  else localStorage.removeItem(LS + `meetDraft|${key}|${week}`);
}
function stepperHtml(prog, stage, curProc) {
  return `<div class="stepper">${prog
    .map((g, i) => {
      const st = g.before_start ? "pre" : g.checks_total && g.checks_done >= g.checks_total ? "done" : i === stage ? "cur" : i < stage ? "done" : "";
      return `<div class="stepNode ${st}" title="${esc(g.group)}：${g.before_start ? "導入前" : `チェック ${g.checks_done}/${g.checks_total}`}"><span class="stepLabel">${esc(g.group)}${st === "cur" && curProc ? `<small>（${esc(curProc)}）</small>` : ""}${st === "pre" ? "<small>導入前</small>" : ""}</span><span class="stepDot">${st === "done" ? icon("check", 14, 3.4) : ""}</span></div>`;
    })
    .join("")}</div>`;
}

function renderMeet(arg) {
  const main = $("main");
  let html =
    `<section class="hero small meetHero"><img src="art/meeting.webp" class="headArt" alt="">` +
    `<h1 class="heroTitle">班の打合せモード</h1><p class="heroSub">週次の班の打合せで、各現場の進み具合・報告・疑問をみんなで確認しましょう。<br>← → キーでも現場をめくれます。</p></section>`;
  if (noData()) {
    main.innerHTML = html + noDataView();
    bindCommon(main);
    return;
  }
  const sites = meetSites();
  if (!sites.length) {
    main.innerHTML = html + scopeBarHtml() + `<div class="emptyText pad card">打合せで見る現場がありません。</div>`;
    bindCommon(main);
    return;
  }
  let idx = Math.min(sites.length, Math.max(1, parseInt(arg || getLS("meetIdx", "1"), 10) || 1)) - 1;
  setLS("meetIdx", String(idx + 1));
  const s = sites[idx];
  const ctx = makeWeekCtx();
  const prog = siteProgress(s);
  const stage = siteStage(prog);
  const last = s.reports[0];
  const curProc = last && (last.processes || []).length ? shortProc(last.processes.slice(-1)[0].name) : "";
  const live = (prog || []).filter((g) => !g.before_start);
  const cd = live.reduce((t, g) => t + g.checks_done, 0);
  const ct = live.reduce((t, g) => t + g.checks_total, 0);
  const wk = siteWeekState(s, ctx);
  const weekReps = s.reports.filter((r) => reportWeekOf(r) === ctx.focus);
  const shownReps = weekReps.length ? weekReps : last ? [last] : [];
  const photos = shownReps.flatMap((r) => r.photos || []);
  const checked = shownReps.reduce((t, r) => t + (r.checks || []).reduce((u, c) => u + (c.checked || []).length, 0), 0);
  const open = [...data.notes.values()].filter((n) => n.siteKey === s.key && noteStatus(n) === "open" && noteInScope(n)).sort((a, b) => (a.at < b.at ? -1 : 1));

  html += scopeBarHtml();
  html +=
    `<div class="card meetNav"><button class="btn btnPrimary meetPrev" data-meet="${idx}"${idx ? "" : " disabled"}>${icon("back", 20)}前へ</button>` +
    `<div class="meetCount"><b>${idx + 1}</b> / ${sites.length}<small>現場</small></div><div class="meetChips">${sites
      .map((x, i) => `<button class="meetChip${i === idx ? " on" : ""}${x.completedAt || x.pausedAt ? " rest" : ""}" data-meet="${i + 1}"><span>${esc(x.name.replace(/\s.*$/, ""))}</span><small>${i + 1}</small></button>`)
      .join("")}</div><button class="btn btnPrimary meetNext" data-meet="${idx + 2}"${idx < sites.length - 1 ? "" : " disabled"}>次へ${icon("chevron", 20)}</button></div>`;

  html +=
    `<div class="card meetSite"><div class="meetSiteHead"><h2>${esc(s.name)}</h2>${s.koujiNo ? `<span class="scNo">No.${esc(s.koujiNo)}</span>` : ""}` +
    `<span class="wk ${wk.st}" title="${esc(wk.title || "")}">${wk.label || "－"}</span><a class="moreLink" href="#/site/${encodeURIComponent(s.key)}">現場の詳細${icon("chevron", 14)}</a></div>` +
    `<div class="meetPeople">${[...s.persons.values()].map((n) => `<span>${avatar(n, 28)}${esc(n)}</span>`).join("")}</div>` +
    (prog ? stepperHtml(prog, stage, curProc) : "") +
    `<div class="meetNow"><span>今：<b>${stage >= 0 && prog ? esc(prog[stage].group) : "－"}</b>${curProc ? `（${esc(curProc)}）` : ""}</span><span>最終報告 <b>${last ? fmtMD(last.sent_at) : "－"}</b></span><span>チェックの進捗 <b>${ct ? Math.round((cd / ct) * 100) : 0}%</b>（${cd} / ${ct}）</span></div></div>`;

  html +=
    `<div class="meetCols"><div class="card meetReport"><div class="meetCardHead">${icon("calendar", 24)}<h3>${weekReps.length ? (ctx.focus === ctx.thisMon ? "今週の報告" : "先週の報告") : "最新の報告"}</h3>` +
    `<span class="mutedText">${shownReps[0] ? `${fmtMD(shownReps[0].period.start)} 〜 ${fmtMD(shownReps[0].period.end)}` : ""}</span></div>` +
    (shownReps.length
      ? `<div class="meetPhotos">${photos
          .slice(0, 4)
          .map((x, k) => `<span class="thumb${k === 3 && photos.length > 4 ? " more" : ""}" ${k === 3 && photos.length > 4 ? `data-more="+${photos.length - 3}枚"` : ""}><img data-photo="${esc(x.file)}" data-full="1" alt=""></span>`)
          .join("")}</div>` +
        `<div class="meetStats"><div>${icon("check", 22, 2.6)}<span>チェック<b>${checked}</b>件</span></div><div>${icon("photo", 22)}<span>品質写真<b>${photos.filter((x) => x.kind === "record").length}</b>枚</span></div>` +
        `<div class="meetMemoBox">${icon("report", 20)}<span>${esc(shownReps.map((r) => r.memo).filter(Boolean).join(" ／ ") || "メモはありません")}</span></div></div>` +
        (weekReps.length ? "" : `<div class="mutedText">${ctx.focus === ctx.thisMon ? "今週" : "先週"}の報告はまだ届いていません（${esc(wk.label || "")}）</div>`)
      : `<div class="emptyText pad">報告はまだありません。</div>`) +
    `</div>` +
    `<div class="card meetOpen${open.length ? " has" : ""}"><div class="meetCardHead">${icon("chat", 24)}<h3>未回答の疑問・要望</h3><span class="meetOpenNum">未回答 <b>${open.length}</b>件</span></div>` +
    (open.length
      ? open
          .map(
            (n) =>
              `<div class="meetQ"><div class="meetQMain"><div>${typeBadge(n.type)}${statusBadge(n)}<b>${esc(headline(n.text))}</b><span class="mutedText">${fmtMD(n.at)}</span></div>` +
              `<small>${esc(restText(n.text) || `${shortProc(n.process)} › ${n.item || ""}`)}</small></div><button class="btn btnPrimary" data-note="${esc(n.id)}">${icon("chat", 18)}返信を書く</button></div>`
          )
          .join("")
      : `<div class="emptyText pad">未回答の疑問・要望はありません。</div>`) +
    `</div></div>`;

  // 打合せメモ（決めたこと・宿題）
  const week = ctx.focus;
  const memos = memosOf(s);
  const cur = memos.find((m) => m.week === week);
  const prev = memos.find((m) => m.week < week);
  const carried = memos.filter((m) => m.week < week).flatMap((m) => (m.tasks || []).map((t) => ({ ...t, _week: m.week }))).filter((t) => ["open", "over"].includes(taskState(t)));
  Object.keys(localStorage)
    .filter((k) => k.startsWith(LS + "meetDraft|") && k.split("|").pop() < addDays(week, -14))
    .forEach((k) => localStorage.removeItem(k));
  let saved = meetDraft(s.key, week);
  if (saved && cur && (saved.base || "") < cur.at) {
    setMeetDraft(s.key, week, null);
    saved = null;
    toast(`${cur.by || "ほかの人"}さんが保存したメモに切り替えました（書きかけは消えました）`);
  }
  const draft = saved || { memo: (cur && cur.memo) || "", tasks: (cur && cur.tasks ? cur.tasks : []).map((t) => ({ ...t })) };
  const people = [...s.persons.entries()];
  const me = getLS("name") || "上司";
  html +=
    `<div class="card meetMemo"><div class="meetCardHead">${icon("report", 24)}<h3>打合せメモ（決めたこと・宿題）</h3><span class="mutedText">${fmtMD(week)}〜の週の打合せ${cur ? `・保存済み（${esc(cur.by || "")} ${fmtDateTime(cur.at)}）` : ""}</span></div>` +
    (prev || carried.length
      ? `<div class="meetPrev2"><div class="meetPrevHead">前回までの打合せ${prev ? `（${fmtMD(prev.week)}〜の週）` : ""}</div>` +
        (prev && prev.memo ? `<div class="meetPrevMemo">${esc(prev.memo)}</div>` : "") +
        (prev ? (prev.tasks || []).map((t) => taskRowHtml(t, true)).join("") : "") +
        carried.filter((t) => !prev || t._week !== prev.week).map((t) => taskRowHtml(t, true)).join("") +
        `</div>`
      : "") +
    `<textarea id="meetMemoText" class="input meetText" rows="3" placeholder="決めたこと・話したことを書きます（例：土台の腐れは月曜に課長と現地確認）">${esc(draft.memo)}</textarea>` +
    `<div class="taskHead">宿題<small>監督あての宿題は、現場ナビの「やること」に届きます（返信と一緒に取り込み）</small></div>` +
    `<div id="taskEdit" class="taskEdit">${draft.tasks
      .filter((t) => t.status !== "cancelled")
      .map(
        (t, i) =>
          `<div class="taskEditRow" data-i="${i}"><input class="input tText" value="${esc(t.text)}" placeholder="やること"><select class="select tWho">${people
            .map(([pk, n]) => `<option value="${esc(pk)}"${t.assignee_id === pk ? " selected" : ""}>${esc(n)}</option>`)
            .join("")}<option value="boss"${t.assignee_kind === "boss" ? " selected" : ""}>${esc(me)}（自分）</option></select>` +
          `<input class="input tDue" type="date" value="${esc(t.due || "")}"><select class="select tProc"><option value="">工程（任意）</option>${PROCESS_NAMES.map((p, k) => `<option value="${k + 1}"${t.process_no === k + 1 ? " selected" : ""}>${esc(shortProc(p))}</option>`).join("")}</select>` +
          `<button class="iconBtn tDel" title="消す">${icon("x", 18)}</button></div>`
      )
      .join("")}</div>` +
    `<div class="btnRow"><button class="btn btnOutline" id="taskAdd">${icon("plus", 18)}宿題を足す</button><button class="btn btnPrimary" id="meetSave">${icon("check", 18)}メモを保存</button></div></div>`;

  main.innerHTML = html;
  // めくる
  main.querySelectorAll("[data-meet]").forEach((b) => b.addEventListener("click", () => (location.hash = `#/meet/${b.dataset.meet}`)));
  // 下書き：入力のたびに覚える
  const readDraft = () => {
    const rows = [...main.querySelectorAll(".taskEditRow")];
    const kept = draft.tasks.filter((t) => t.status !== "cancelled");
    const tasks = rows.map((r, i) => {
      const base = kept[i] || { id: newId(), created_at: new Date().toISOString() };
      const who = r.querySelector(".tWho").value;
      const pn = parseInt(r.querySelector(".tProc").value, 10) || 0;
      return {
        ...base,
        text: r.querySelector(".tText").value.trim(),
        assignee_kind: who === "boss" ? "boss" : "person",
        assignee_id: who === "boss" ? "" : who,
        assignee: who === "boss" ? me : s.persons.get(who) || "",
        due: r.querySelector(".tDue").value,
        process_no: pn || null,
        process: pn ? PROCESS_NAMES[pn - 1] : "",
      };
    });
    const removed = draft.tasks.filter((t) => t.status === "cancelled" || (!rows.length && false));
    return { memo: $("meetMemoText").value, tasks: [...tasks, ...removed], base: cur ? cur.at : "" };
  };
  const remember = () => setMeetDraft(s.key, week, readDraft());
  main.querySelector(".meetMemo").addEventListener("input", remember);
  main.querySelector(".meetMemo").addEventListener("change", remember);
  $("taskAdd").addEventListener("click", () => {
    const d = readDraft();
    const first = people[0] ? people[0][0] : "boss";
    d.tasks.push({ id: newId(), created_at: new Date().toISOString(), text: "", assignee_kind: first === "boss" ? "boss" : "person", assignee_id: first === "boss" ? "" : first, assignee: people[0] ? people[0][1] : me, due: "", process_no: null, process: "" });
    setMeetDraft(s.key, week, d);
    renderMeet(String(idx + 1));
    const rows = document.querySelectorAll(".taskEditRow .tText");
    if (rows.length) rows[rows.length - 1].focus();
  });
  main.querySelectorAll(".tDel").forEach((b) =>
    b.addEventListener("click", () => {
      const d = readDraft();
      const i = parseInt(b.closest(".taskEditRow").dataset.i, 10);
      const live2 = d.tasks.filter((t) => t.status !== "cancelled");
      const t = live2[i];
      // 保存済みの宿題は「取り消し」として残す（現場ナビにも取り消しを届ける）
      const saved = cur && (cur.tasks || []).some((x) => x.id === t.id);
      d.tasks = d.tasks.filter((x) => x !== t);
      if (saved) d.tasks.push({ ...t, status: "cancelled" });
      setMeetDraft(s.key, week, d);
      renderMeet(String(idx + 1));
    })
  );
  $("meetSave").addEventListener("click", () => saveMeeting(s, week, readDraft(), idx));
  main.querySelectorAll("[data-boss-task]").forEach((b) => b.addEventListener("click", () => toggleBossTask(s, b.dataset.bossTask, idx)));
  bindCommon(main);
}

async function writeToFolder(dirs, name, body) {
  let d = dirHandle;
  for (const x of dirs) d = await d.getDirectoryHandle(x, { create: true });
  const fh = await d.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(body);
  await w.close();
}
function addMeetingToData(m) {
  const list = (data.meetings.get(m.site_key) || []).filter((x) => x.id !== m.id);
  list.push(m);
  data.meetings.set(m.site_key, list);
}

async function saveMeeting(s, week, d, idx) {
  const me = getLS("name");
  if (!me) {
    alert("先に設定で、あなたの名前を登録してください（打合せメモと宿題に名前が入ります）。");
    location.hash = "#/settings";
    return;
  }
  const before = (memosOf(s).find((x) => x.week === week) || {}).tasks || [];
  const savedIds = new Set(before.map((t) => t.id));
  const tasks = d.tasks
    .map((t) => (!t.text && t.status !== "cancelled" && savedIds.has(t.id) ? { ...t, text: (before.find((b) => b.id === t.id) || {}).text || "", status: "cancelled" } : t))
    .filter((t) => (t.status === "cancelled" ? savedIds.has(t.id) : t.text));
  if (tasks.some((t) => t.status !== "cancelled" && t.assignee_kind === "person" && !t.assignee_id)) return alert("宿題の担当を選んでください。");
  const m = {
    kind: "genba-meeting-memo",
    schema: 1,
    id: `${s.key}|${week}`,
    app_version: APP_VERSION,
    site_key: s.key,
    kouji_no: s.koujiNo || "",
    site: s.name,
    week,
    at: new Date().toISOString(),
    by: me,
    memo: d.memo.trim(),
    tasks: tasks.map((t) => ({ ...t, status: t.status || "open" })),
  };
  // 監督あての宿題（現場ナビが取り込む形）。その監督の端末での現場の番号を入れる
  const siteIdOf = (pk) => (s.reports.find((r) => personKeyOf(r) === pk) || {}).site_id || "";
  const taskFile = (t, status) => ({
    dir: safeName(t.assignee || "名前なし"),
    name: safeName(`宿題_${s.name}_${t.id.slice(0, 8)}.json`),
    open: status !== "cancelled",
    body: JSON.stringify(
      { kind: "genba-task", schema: 1, id: t.id, app_version: APP_VERSION, site_id: siteIdOf(t.assignee_id), kouji_no: s.koujiNo || "", site: s.name,
        to_id: t.assignee_id.startsWith("name:") ? "" : t.assignee_id, to: t.assignee, from: me, text: t.text, due: t.due || "", process_no: t.process_no || null,
        process: t.process || "", week, status, at: m.at },
      null,
      2
    ),
  });
  const taskFiles = m.tasks.filter((t) => t.assignee_kind === "person").map((t) => taskFile(t, t.status));
  // 担当を替えた・自分の宿題にした時は、前の担当の端末から消えるよう取り消しを送る
  before.forEach((b) => {
    const now = m.tasks.find((t) => t.id === b.id);
    if (b.assignee_kind === "person" && b.assignee_id && now && (now.assignee_kind !== "person" || now.assignee_id !== b.assignee_id)) taskFiles.push(taskFile(b, "cancelled"));
  });
  if (demoMode) {
    addMeetingToData(m);
    setMeetDraft(s.key, week, null);
    toast("サンプルなので、ファイルには書き出していません");
    return renderMeet(String(idx + 1));
  }
  if (!(dirHandle && data.source && data.source.writable)) return alert("このブラウザでは報告フォルダに書き込めません。Edge か Chrome で、設定から報告フォルダを選び直してください。");
  try {
    await writeToFolder([MEET_DIR], safeName(`打合せ_${s.name}_${week}.json`), JSON.stringify(m, null, 2));
    for (const f of taskFiles) await writeToFolder([REPLY_DIR, f.dir], f.name, f.body);
    addMeetingToData(m);
    setMeetDraft(s.key, week, null);
    const n = taskFiles.filter((f) => f.open).length;
    toast(`打合せメモを保存しました${n ? `（監督あての宿題 ${n}件を「${REPLY_DIR}」に書き出し）` : ""}`);
  } catch (e) {
    console.error(e);
    alert("保存できませんでした。フォルダへの書き込みが許可されているか確認してください。");
  }
  renderMeet(String(idx + 1));
}
// 上司（自分）の宿題は、見守りで済にする（その週のメモを書き直す）
async function toggleBossTask(s, id, idx) {
  const orig = memosOf(s).find((x) => (x.tasks || []).some((t) => t.id === id));
  if (!orig) return;
  const m = { ...orig, tasks: orig.tasks.map((x) => ({ ...x })), at: new Date().toISOString() };
  const t = m.tasks.find((x) => x.id === id);
  t.status = t.status === "done" ? "open" : "done";
  t.done_at = t.status === "done" ? new Date().toISOString() : "";
  if (!demoMode) {
    if (!(dirHandle && data.source && data.source.writable)) return alert("このブラウザでは報告フォルダに書き込めません。Edge か Chrome で、設定から報告フォルダを選び直してください。");
    try {
      await writeToFolder([MEET_DIR], safeName(`打合せ_${m.site}_${m.week}.json`), JSON.stringify(m, null, 2));
    } catch (e) {
      console.error(e);
      return alert("保存できませんでした。フォルダへの書き込みが許可されているか確認してください。");
    }
  }
  addMeetingToData(m);
  renderMeet(String(idx + 1));
}

function renderWeeks() {
  const main = $("main");
  let html = `<section class="hero small artHero"><img src="art/weeks-head.webp" class="headArt" alt=""><h1 class="heroTitle">週の報告</h1><p class="heroSub">担当者ごと・現場ごとに、週の報告が済んでいるかを並べています。<br>報告は金曜〜翌週の月曜（遅くとも火曜）。休工中の週と完工した後の週は報告しなくてよい週です。</p></section>`;
  if (!noData()) html += scopeBarHtml();
  if (noData()) {
    main.innerHTML = html + noDataView();
    bindCommon(main);
    return;
  }
  const today = dayKey(new Date());
  const thisMon = weekMon(today);
  const weeks = Array.from({ length: WEEK_COLS }, (_, i) => addDays(thisMon, -7 * (WEEK_COLS - 1 - i)));
  // 今いちばん見るべき週：月・火曜は先週（報告の締め切り前）、それ以外は今週
  const focus = today <= addDays(thisMon, 1) ? addDays(thisMon, -7) : thisMon;
  const firstWeekCache = new Map();
  const ctx = {
    today,
    firstWeek(site, pk) {
      const k = site.key + "|" + pk;
      if (!firstWeekCache.has(k)) {
        const ws = site.reports.filter((r) => personKeyOf(r) === pk).map(reportWeekOf).sort();
        firstWeekCache.set(k, ws[0] || thisMon);
      }
      return firstWeekCache.get(k);
    },
  };
  const order = (s) => (s.completedAt ? 2 : s.pausedAt ? 1 : 0);
  const people = scopedPeople().sort((a, b) => a.name.localeCompare(b.name, "ja"));
  const rows = [];
  people.forEach((p) => {
    const sites = [...p.sites]
      .map((k) => data.sites.get(k))
      .filter((s) => s && (!s.completedAt || dayKey(s.completedAt) >= weeks[0])) // 表の期間より前に完工した現場は出さない
      .filter((s) => matchesQuery(p.name, s.name))
      .sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name, "ja"));
    sites.forEach((s, i) => rows.push({ p, s, first: i === 0, span: sites.length, cells: weeks.map((w) => weekCell(s, p.key, w, ctx)) }));
  });
  const fi = weeks.indexOf(focus);
  const cnt = (st) => rows.filter((r) => r.cells[fi].st.split(" ")[0] === st).length;
  const missAll = rows.reduce((n, r) => n + r.cells.filter((c) => c.st === "miss").length, 0);
  html +=
    `<div class="weekSum">` +
    `<div class="wsCell"><span class="wsLabel">${fmtMD(focus)}〜${fmtMD(addDays(focus, 5))} の週</span><span class="wsSub">${focus === thisMon ? "今週" : "先週（締め切り前）"}</span></div>` +
    `<div class="wsCell ok"><b>${cnt("done") + cnt("ext") + cnt("skip")}</b><span>済</span></div>` +
    `<div class="wsCell wait"><b>${cnt("open") + cnt("due")}</b><span>受付中</span></div>` +
    `<div class="wsCell rest"><b>${cnt("paused")}</b><span>休工</span></div>` +
    `<div class="wsCell miss${missAll ? " on" : ""}"><b>${missAll}</b><span>未報告（${WEEK_COLS}週）</span></div></div>`;
  html += rows.length
    ? `<div class="card weekCard"><table class="weekTable"><thead><tr><th class="wtPerson">担当者</th><th class="wtSite">現場</th>${weeks
        .map((w) => `<th class="${w === focus ? "focus" : ""}">${fmtMD(w).replace(/\(.\)/, "")}〜${w === thisMon ? "<small>今週</small>" : w === focus ? "<small>先週</small>" : ""}</th>`)
        .join("")}</tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr class="${r.first ? "first" : ""}">` +
            (r.first ? `<th class="wtPerson" rowspan="${r.span}"><button class="wtName" data-person="${esc(r.p.key)}">${avatar(r.p.name, 32)}<span>${esc(r.p.name)}</span></button></th>` : "") +
            `<td class="wtSite"><button data-site="${esc(r.s.key)}">${esc(r.s.name)}${r.s.completedAt ? ` <span class="tag">完工</span>` : r.s.pausedAt ? ` <span class="tag">休工中</span>` : ""}</button></td>` +
            r.cells.map((c, i) => `<td class="${weeks[i] === focus ? "focus" : ""}"><span class="wk ${c.st}" title="${esc(c.title)}">${c.label}</span></td>`).join("") +
            `</tr>`
        )
        .join("")}</tbody></table></div>` +
      `<div class="weekLegend"><span class="wk done">済</span>現場ナビから報告<span class="wk ext">アプリ外</span>メール等で報告<span class="wk skip">報告なし</span>その週は報告なし<span class="wk open">受付中</span>締め切り前<span class="wk due">今日まで</span>火曜（最終日）<span class="wk miss">未報告</span>期限切れ<span class="wk paused">休工</span><span class="wk fin">完工</span></div>`
    : `<div class="emptyText pad card">該当する現場はありません。</div>`;
  main.innerHTML = html;
  bindCommon(main);
}

const PERSON_STATE = { need: { label: "対応が必要", cls: "danger" }, late: { label: "報告の遅れ", cls: "warn" }, ok: { label: "順調", cls: "ok" } };

function updateNavBadge() {
  const n = openQuestions().length;
  $("navBadge").hidden = !n;
  $("navBadge").textContent = n;
}

/* ---------- 写真 ---------- */
const urlCache = new Map();
function photoUrl(name) {
  if (urlCache.has(name)) return urlCache.get(name);
  const p = (async () => {
    if (demoMode) return DEMO.photoUrl(name);
    const f = data.photoFiles.get(name);
    if (!f) return "";
    const file = f.getFile ? await f.getFile() : f;
    return URL.createObjectURL(file);
  })().catch(() => "");
  urlCache.set(name, p);
  return p;
}
async function clearUrlCache() {
  const all = await Promise.all([...urlCache.values()]);
  urlCache.clear();
  all.forEach((u) => u && u.startsWith("blob:") && URL.revokeObjectURL(u));
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
    const statuses = [];
    const meetings = [];
    data.photoFiles = new Map();
    await clearUrlCache();
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
          else if (j.kind === "genba-site-status") statuses.push(j);
          else if (j.kind === "genba-meeting-memo") meetings.push(j);
        } catch (e) {
          console.warn("読めないJSON", f.path, e);
        }
      }
    }
    buildData(reports, replies, statuses, meetings);
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
  if (e.target.value !== undefined) e.target.value = ""; // 同じフォルダを選び直しても読み直せるように
  if (!files.length) return;
  showLoading("報告フォルダを読んでいます...");
  const reports = [];
  const replies = [];
  const statuses = [];
  const meetings = [];
  data.photoFiles = new Map();
  await clearUrlCache();
  for (const f of files) {
    const lower = f.name.toLowerCase();
    if (/\.(jpe?g|png|webp|heic)$/.test(lower)) data.photoFiles.set(f.name, f);
    else if (lower.endsWith(".json")) {
      try {
        const j = JSON.parse(await f.text());
        if (j.kind === "genba-photo-report") reports.push(j);
        else if (j.kind === "genba-reply") replies.push(j);
          else if (j.kind === "genba-site-status") statuses.push(j);
        else if (j.kind === "genba-meeting-memo") meetings.push(j);
      } catch (err) {}
    }
  }
  demoMode = false;
  buildData(reports, replies, statuses, meetings);
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
    site_id: n.siteId,
    kouji_no: n.siteKey.startsWith("kouji:") ? n.siteKey.slice(6) : "",
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
      // 返信/<監督名>/ に分けて置く（Boxで監督ごとに自分のフォルダだけ共有できるように）
      const top = await dirHandle.getDirectoryHandle(REPLY_DIR, { create: true });
      const sub = await top.getDirectoryHandle(safeName(n.personName || "名前なし"), { create: true });
      const fh = await sub.getFileHandle(fileName, { create: true });
      const w = await fh.createWritable();
      await w.write(body);
      await w.close();
      addReplyToData(rp);
      toast(`「${REPLY_DIR}/${safeName(n.personName || "名前なし")}」フォルダに書き出しました`);
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
  toast(`ダウンロードしました。Box の「${REPLY_DIR}/${safeName(n.personName || "名前なし")}」フォルダに入れてください`);
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
function typeBadge(t, orig) {
  const x = NOTE_TYPES[t] || NOTE_TYPES.notice;
  const o = NOTE_TYPES[orig] || NOTE_TYPES.notice;
  const from = orig && orig !== t ? `<small>（${esc(o.short || o.label)}から）</small>` : "";
  return `<span class="tBadge ${x.cls}">${esc(x.short || x.label)}${from}</span>`;
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
  root.querySelectorAll("[data-scope]").forEach((b) =>
    b.addEventListener("click", () => {
      setLS("scope", b.dataset.scope);
      updateNavBadge();
      route();
    })
  );
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
    `<section class="hero small homeHero"><img src="art/site-bg.webp" class="siteBg" alt="">` +
    `<a class="btn btnPrimary meetStart" href="#/meet">${icon("people", 20)}班の打合せを始める</a>` +
    `<h1 class="heroTitle">現場の状況</h1>` +
    `<p class="heroSub">現場ごとの進み具合と、今週の報告、現場からの声を一覧で確認できます。<br>週次の班の打合せでの確認にお使いください。</p></section>`;
  if (noData()) {
    main.innerHTML = html + (dirHandle ? emptyBox("前回のフォルダを開きます", "ボタンを押すと、前回選んだ報告フォルダを読み込みます。", false).replace("</div></div>", `</div><div class="btnRow"><button class="btn btnPrimary" data-act="reopen">${icon("folder", 18)}読み込む</button><button class="btn btnOutline" data-act="pick">別のフォルダを選ぶ</button></div></div>`) : noDataView());
    bindCommon(main);
    return;
  }
  const open = openQuestions().sort((a, b) => (a.at < b.at ? 1 : -1));
  const recent = scopedNotes().filter((n) => noteStatus(n) !== "resolved").sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 5);
  html +=
    `<div class="homeTop"><div class="bigCard"><div class="bigIcon">${icon("chat", 40, 1.8)}</div><div><div class="bigLabel">未回答の疑問・要望</div>` +
    `<div class="bigNum"><b>${open.length}</b>件</div></div><a class="btn btnOutline bigBtn" href="#/notes?st=open">未回答をすべて確認${icon("chevron", 16)}</a></div>` +
    `<div class="card newCard"><div class="cardHead"><h2>新着の疑問・気づき<span class="sub">（未回答 ${open.length}件）</span></h2><a href="#/notes" class="moreLink">すべて見る${icon("chevron", 16)}</a></div>` +
    (recent.length
      ? `<div class="newList">${recent
          .map((n) => `<button class="newRow" data-note="${esc(n.id)}">${typeBadge(n.type)}<span class="newSite">${esc(n.siteName)}</span><span class="newText">${esc(headline(n.text))}</span><span class="newAgo">${relTime(n.at)}</span></button>`)
          .join("")}</div>`
      : `<div class="emptyText pad">対応待ちのメモはありません。</div>`) +
    `</div></div>`;

  html += scopeBarHtml();
  html += siteSectionHtml();
  main.innerHTML = html;
  $("siteSort").addEventListener("change", (e) => {
    setLS("siteSort", e.target.value);
    renderHome();
  });
  main.querySelectorAll("[data-sf]").forEach((b) =>
    b.addEventListener("click", () => {
      siteFilter = b.dataset.sf;
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
    `<div class="pcSites">担当現場${sites.map((s) => `<span class="tag${s.completedAt ? " done" : ""}">${esc(s.name)}${s.completedAt ? "（完工）" : s.pausedAt ? "（休工中）" : ""}</span>`).join("")}</div></div>${icon("chevron", 20)}</div>` +
    `<div class="pcStats"><div class="stat${st.open ? " alert" : ""}"><span class="statLabel">${icon("chat", 16)}未回答</span><span><b>${st.open}</b>件</span></div>` +
    `<div class="stat"><span class="statLabel">${icon("photo", 16)}今週の写真</span><span><b>${st.weekPhotos}</b>枚</span></div>` +
    `<div class="stat"><span class="statLabel">${icon("calendar", 16)}最終報告</span><span class="lastRep">${st.lastAt ? fmtMD(st.lastAt) : "－"}</span>` +
    `<span class="ago${st.late && st.lastDays != null && st.lastDays >= LATE_DAYS - 1 ? " late" : ""}">${st.lastAt ? agoLabel(st.lastAt) : ""}</span></div></div></button>`
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
  const list = scopedNotes()
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
    `<div class="noteMain"><div class="noteBadges">${typeBadge(n.type, n.origType)}${statusBadge(n)}</div><div class="noteTitle">${esc(headline(n.text))}</div>` +
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
    `<div class="card origCard"><div class="origHead">${icon("chat", 22)}<span>元の投稿内容</span>${typeBadge(n.type, n.origType)}${statusBadge(n)}</div>` +
    (n.origType !== "question" && st !== "replied"
      ? `<div class="asQ"><span>${n.type === "question" ? "疑問として扱っています（未回答に数えます）" : "答えが必要な内容なら、疑問として扱えます"}</span><button class="btn btnOutline asQBtn" id="asQBtn">${n.type === "question" ? "元の種類に戻す" : "疑問として扱う"}</button></div>`
      : "") +
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
  $("drawerFoot").innerHTML = n.noId
    ? `<div class="noReply">このメモは古い版の現場ナビから届いたため、返信しても監督のアプリに届きません。直接伝えてください。</div>`
    : `<button id="draftBtn" class="btn btnOutline">${icon("save", 18)}下書き保存</button><button id="sendBtn" class="btn btnPrimary">${icon("send", 18)}送る</button>`;
  const ta = $("replyText");
  if (n.noId) ta.disabled = true;
  ta.value = getDrafts()[id] || "";
  const upd = () => ($("replyCount").textContent = ta.value.length);
  upd();
  ta.addEventListener("input", upd);
  if ($("draftBtn")) $("draftBtn").addEventListener("click", () => {
    setDraft(id, ta.value.trim());
    toast(ta.value.trim() ? "下書きを保存しました" : "下書きを消しました");
  });
  if ($("sendBtn")) $("sendBtn").addEventListener("click", async () => {
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
  if ($("asQBtn")) $("asQBtn").addEventListener("click", () => toggleAsQuestion(n));
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
  let html = `<section class="hero small artHero"><img src="art/staff.webp" class="headArt" alt=""><h1 class="heroTitle">担当者</h1><p class="heroSub">担当者ごとの報告の状況（遅れ・未回答）と、担当している現場を確認できます。<br>育成や報告の声かけに使います。</p></section>`;
  if (noData()) {
    main.innerHTML = html + noDataView();
    bindCommon(main);
    return;
  }
  const people = scopedPeople().sort((a, b) => a.name.localeCompare(b.name, "ja"));
  html += scopeBarHtml();
  const pst = people.map((p) => ({ p, st: personStats(p) }));
  const order = { need: 0, late: 1, ok: 2 };
  html += pst.length ? `<div class="personGrid">${pst.filter((x) => matchesQuery(x.p.name, ...[...x.p.sites].map((k) => data.sites.get(k).name))).sort((a, b) => order[a.st.state] - order[b.st.state] || b.st.open - a.st.open).map(personCard).join("")}</div>` : "";
  html += `<div class="secHead"><div><h2>担当者ごとの現場</h2></div></div>`;
  html += people
    .filter((p) => matchesQuery(p.name, ...[...p.sites].map((k) => data.sites.get(k).name)))
    .map((p) => {
      const st = personStats(p);
      const ps = PERSON_STATE[st.state];
      const sites = [...p.sites].map((k) => data.sites.get(k));
      return (
        `<div class="card personBlock"><button class="pbHead" data-person="${esc(p.key)}">${avatar(p.name, 44)}<b>${esc(p.name)}</b><span class="stBadge ${ps.cls}">${ps.label}</span>` +
        `<span class="pbMeta">未回答 ${st.open}件・最終報告 ${st.lastAt ? fmtMD(st.lastAt) : "－"}</span>${icon("chevron", 18)}</button>` +
        `<div class="siteRows">${sites
          .map((s) => {
            const last = s.reports[0];
            const open = [...data.notes.values()].filter((n) => n.siteKey === s.key && noteStatus(n) === "open").length;
            return `<button class="siteRow${s.completedAt ? " done" : ""}" data-site="${esc(s.key)}">${icon("building", 18)}<b>${esc(s.name)}${s.completedAt ? ` <span class="tag">完工 ${fmtMD(s.completedAt)}</span>` : s.pausedAt ? ` <span class="tag">休工中</span>` : ""}</b><span>報告 ${s.reports.length}回</span><span>最終 ${last ? fmtMD(last.period.end) + "まで" : "－"}</span>${open ? `<span class="sBadge open">未回答 ${open}</span>` : "<span></span>"}${icon("chevron", 16)}</button>`;
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

// 現場全体の進み具合。一人なら最新の報告の数字、二人以上なら全員のチェックを合わせて数える
function siteProgress(s) {
  const latest = (s.reports.find((r) => r.progress) || {}).progress || null;
  if (!latest || s.persons.size <= 1) return latest;
  const done = {};
  s.reports.forEach((r) =>
    (r.checks || []).forEach((c) => {
      const g = PROC_GROUP[c.process];
      if (!g) return;
      (c.checked || []).forEach((k) => {
        if (k.section && k.section !== "チェック") return;
        (done[g] = done[g] || new Set()).add(`${c.item_id}|${k.id || k.text}`);
      });
    })
  );
  // 写真の数は人ごとの最新の数字のうち多い方
  const per = personProgress(s);
  return latest.map((g) => ({
    group: g.group,
    before_start: !!g.before_start && per.every((p) => (p.prog.find((x) => x.group === g.group) || {}).before_start), // 誰か一人でも記録していれば出す
    checks_total: g.checks_total,
    checks_na: g.checks_na || 0,
    checks_done: Math.min(g.checks_total, Math.max(done[g.group] ? done[g.group].size : 0, ...per.map((p) => (p.prog.find((x) => x.group === g.group) || {}).checks_done || 0))),
    photos_total: g.photos_total,
    photos_done: Math.max(...per.map((p) => (p.prog.find((x) => x.group === g.group) || {}).photos_done || 0)),
  }));
}
function personProgress(s) {
  return [...s.persons.entries()]
    .map(([key, name]) => {
      const r = s.reports.find((x) => personKeyOf(x) === key && x.progress);
      return r ? { key, name, prog: r.progress } : null;
    })
    .filter(Boolean);
}

const GROUP_ART = { 基礎: "g1", 上棟: "g2", 外装: "g3", 内装: "g4", 設備: "g5", 引渡し: "g6" };
function renderSite(key) {
  const main = $("main");
  const s = data.sites.get(key);
  if (noData() || !s) return renderSites();
  const prog = siteProgress(s);
  const personProg = personProgress(s);
  const stage = siteStage(prog);
  const last = s.reports[0];
  const curProc = last && (last.processes || []).length ? shortProc(last.processes.slice(-1)[0].name) : "";
  const live = (prog || []).filter((g) => !g.before_start);
  const sum = (k) => live.reduce((t, g) => t + (g[k] || 0), 0);
  const [cd, ct, pd, pt, na] = [sum("checks_done"), sum("checks_total"), sum("photos_done"), sum("photos_total"), sum("checks_na")];
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const state = s.completedAt ? ["fin", `完工 ${fmtMD(s.completedAt)}`] : s.pausedAt ? ["paused", `休工中（${fmtMD(s.pausedAt)}〜）`] : ["doing", "進行中"];
  let html =
    `<section class="hero small sdHero"><img src="art/site-bg.webp" class="siteBg" alt="">` +
    `<a class="backLink" href="#/home">${icon("back", 18)}一覧に戻る</a><h1 class="heroTitle">現場の詳細</h1></section>` +
    `<div class="card sdHead"><div class="sdName"><h2>${esc(s.name)}</h2><span class="sdState ${state[0]}">${state[1]}</span></div>` +
    `<div class="sdMeta"><span>工事番号 <b>${s.koujiNo ? "No." + esc(s.koujiNo) : "なし"}</b></span><span>${icon("user", 16)}担当者</span>` +
    [...s.persons.entries()].map(([pk, n]) => `<button class="sdPerson" data-person="${esc(pk)}">${avatar(n, 24)}${esc(n)}</button>`).join("") +
    (s.members.size ? `<span class="mutedText">登録された担当：${esc([...s.members].join("・"))}</span>` : "") +
    `</div></div>`;

  // 工程の進捗：6段階のステッパー＋チェック・品質写真の合計
  html += prog
    ? `<div class="card sdProg"><div class="sdStepWrap"><h3>工程の進捗</h3><div class="stepper">${prog
        .map((g, i) => {
          const st = g.before_start ? "pre" : g.checks_total && g.checks_done >= g.checks_total ? "done" : i === stage ? "cur" : i < stage ? "done" : "";
          const tip = g.before_start ? "アプリ導入前" : `チェック ${g.checks_done}/${g.checks_total}（${pct(g.checks_done, g.checks_total)}%）・品質写真 ${g.photos_done}/${g.photos_total}${g.checks_na ? `・該当なし${g.checks_na}件` : ""}`;
          return `<div class="stepNode ${st}" title="${esc(g.group)}：${esc(tip)}"><span class="stepLabel">${esc(g.group)}${st === "cur" && curProc ? `<small>（${esc(curProc)}）</small>` : ""}${st === "pre" ? "<small>導入前</small>" : ""}</span><span class="stepDot">${st === "done" ? icon("check", 14, 3.4) : ""}</span></div>`;
        })
        .join("")}</div></div>` +
      `<div class="sdStat"><span class="sdStatIcon">${icon("list", 22)}</span><div><div class="sdStatLabel">チェックの進捗</div><div class="sdStatNum"><b>${cd}</b> / ${ct} 件</div><div class="sdBar"><span style="width:${pct(cd, ct)}%"></span></div></div><b class="sdPct">${pct(cd, ct)}%</b></div>` +
      `<div class="sdStat"><span class="sdStatIcon">${icon("photo", 22)}</span><div><div class="sdStatLabel">品質写真の進捗</div><div class="sdStatNum"><b>${pd}</b> / ${pt} 枚</div><div class="sdBar"><span style="width:${pct(pd, pt)}%"></span></div></div><b class="sdPct">${pct(pd, pt)}%</b></div>` +
      `<div class="sdNote">${s.persons.size > 1 ? "担当者のうち誰かが確認したチェックを数えています。" : ""}${na ? `※ この現場で該当なし ${na}件を除く` : ""}${live.length < prog.length ? `　※ 導入前の段階は数えていません` : ""}</div></div>`
    : `<div class="emptyText pad card">進み具合は、現場ナビを新しい版にしてから届いた報告から表示されます。</div>`;

  // 2列：現場の声（工程順）／週ごとの報告
  const order = getLS("voiceOrder", "old");
  html += `<div class="sdCols">${siteVoicesHtml(s, prog, order)}<div class="card sdPanel"><div class="sdPanelHead"><div><h2>週ごとの報告</h2><div class="sub">現場の進み具合や、付けたチェック・品質写真を週ごとに確認できます。</div></div></div><div class="wkList">`;
  html += s.reports
    .map((r) => {
      const photos = r.photos || [];
      const rec = photos.filter((x) => x.kind === "record");
      const checked = (r.checks || []).reduce((t, c) => t + (c.checked || []).length, 0);
      const completed = (r.checks || []).filter((c) => c.completed_at);
      const naChecks = (r.checks || []).flatMap((c) => (c.na_checks || []).map((x) => ({ x, c })));
      const thumbs = photos.slice(0, 4);
      return (
        `<div class="wkItem"><span class="wkDot"></span><div class="wkCard"><div class="wkHead"><b>${fmtMD(r.period.start)} 〜 ${fmtMD(r.period.end)}</b>` +
        (s.persons.size > 1 ? `<span class="tag">${esc(r.sender || "")}</span>` : "") +
        `<span class="mutedText">${agoLabel(r.sent_at)}</span></div>` +
        `<div class="wkBody"><div class="thumbs">${thumbs
          .map((x, k) => `<span class="thumb${k === 3 && photos.length > 4 ? " more" : ""}" ${k === 3 && photos.length > 4 ? `data-more="+${photos.length - 3}枚"` : ""}><img data-photo="${esc(x.file)}" data-full="1" alt=""></span>`)
          .join("")}</div>` +
        `<div class="wkStats"><div>${icon("list", 16)}チェック <b>${checked}</b>件</div><div>${icon("photo", 16)}品質写真 <b>${rec.length}</b>枚</div>` +
        `<div title="${esc(completed.map((c) => c.item).join("・"))}">${icon("check", 16)}完了した工程 <b>${completed.length}</b>件</div>` +
        `<div>${icon("list", 16)}該当なし <b>${naChecks.length}</b>件</div></div></div>` +
        (completed.length ? `<div class="wkLine">${icon("check", 15)}<span>完了：${esc(completed.map((c) => c.item).join("・"))}</span></div>` : "") +
        (naChecks.length
          ? `<details class="tlNa"><summary>該当なしにしたチェック <b>${naChecks.length}</b>件</summary><ul>${naChecks
              .map(({ x, c }) => `<li><b>${esc(c.item)}</b>：${esc(x.text)}<small>${x.by ? esc(x.by) + "・" : ""}${fmtMD(x.at)}</small></li>`)
              .join("")}</ul></details>`
          : "") +
        (r.memo ? `<div class="wkLine memo">${icon("report", 15)}<span>${esc(r.memo)}</span></div>` : "") +
        `</div></div>`
      );
    })
    .join("");
  html += `</div></div></div>`;

  // 二人以上で担当している現場：人ごとの進み具合（育成の目安）
  if (personProg.length > 1) {
    html +=
      `<div class="card personProg"><div class="ppHead">担当者ごとの進み具合（育成の目安：その人が付けたチェック）</div><table><thead><tr><th></th>${(prog || personProg[0].prog)
        .map((g) => `<th>${esc(g.group)}</th>`)
        .join("")}</tr></thead><tbody>${personProg
        .map(
          (pp) =>
            `<tr><th>${avatar(pp.name, 28)}${esc(pp.name)}</th>${pp.prog
              .map((g) => {
                if (g.before_start) return `<td><small>導入前</small></td>`;
                const pc = g.checks_total ? Math.round((g.checks_done / g.checks_total) * 100) : 0;
                return `<td><div class="pgBar"><span style="width:${pc}%"></span></div><small>${pc}%</small></td>`;
              })
              .join("")}</tr>`
        )
        .join("")}</tbody></table></div>`;
  }
  main.innerHTML = html;
  $("voiceOrder").addEventListener("change", (e) => {
    setLS("voiceOrder", e.target.value);
    renderSite(key);
  });
  bindCommon(main);
}

/* ---------- 設定 ---------- */
function teamCardHtml() {
  const team = teamList();
  const inTeam = (name) => team.some((x) => normName(x) === normName(name));
  // 届いている報告の監督＋前に選んだが今は報告が無い人
  const names = [...new Set([...[...data.people.values()].map((p) => p.name), ...team])].sort((a, b) => a.localeCompare(b, "ja"));
  return (
    `<div class="card setCard"><h2>自分の班</h2><p class="sub">班のメンバーを選ぶと、ホーム・週の報告・疑問・気づき・監督・現場に、その人たちの報告だけが出ます（班の打合せ用）。画面の上の「全員」でいつでも全員に戻せます。` +
    `「あなたの名前」と同じ名前の監督（自分の現場）は、選ばなくても出ます。見せ方だけを変えるもので、Box のフォルダの権限は変わりません。</p>` +
    (names.length
      ? `<div class="teamGrid">${names
          .map((n) => `<label class="teamItem"><input type="checkbox" data-team="${esc(n)}"${inTeam(n) ? " checked" : ""}>${avatar(n, 28)}<span>${esc(n)}</span></label>`)
          .join("")}</div><div id="teamCount" class="mutedText">${team.length ? `${team.length}人を選んでいます` : "選んでいません（全員を表示）"}</div>`
      : `<p class="mutedText">報告フォルダを読み込むと、届いている監督の名前から選べます。</p>`) +
    `</div>`
  );
}

function renderSettings() {
  const main = $("main");
  const s = data.source;
  main.innerHTML =
    `<section class="pageHead"><h1>設定</h1></section>` +
    `<div class="card setCard"><h2>あなたの名前</h2><p class="sub">返信に名前が入ります。</p><input id="myName" class="input" placeholder="山郷 太郎" value="${esc(getLS("name"))}"></div>` +
    `<div class="card setCard"><h2>報告フォルダ</h2>` +
    `<p class="sub">現場ナビから Box に届いた報告（JSONと写真）が入っているフォルダを、Box Drive の中から選びます。中のフォルダもまとめて読みます。` +
    `返信は、そのフォルダの中の「${REPLY_DIR}／監督名」フォルダに書き出します。監督ごとに自分のフォルダだけを Box で共有すると、ほかの人あての返信は見えません。</p>` +
    (s ? `<div class="srcNow">${icon(s.demo ? "bulb" : "folder", 18)}<b>${esc(s.name)}</b>　報告 ${s.reports}件${s.photos != null ? `・写真 ${s.photos}枚` : ""}${s.writable === false && !s.demo ? "（読むだけ：返信はダウンロード）" : ""}</div>` : "") +
    `<div class="btnRow"><button class="btn btnPrimary" data-act="pick">${icon("folder", 18)}${s && !s.demo ? "フォルダを選び直す" : "報告フォルダを選ぶ"}</button>` +
    (dirHandle ? `<button class="btn btnOutline" data-act="reopen">${icon("reload", 18)}読み直す</button>` : "") +
    `<button class="btn btnOutline" data-act="demo">サンプルデータで見る</button></div>` +
    (canPickFolder ? "" : `<p class="warn">このブラウザではフォルダに書き込めません。Edge か Chrome で開くと、返信をフォルダに直接書き出せます。</p>`) +
    `</div>` +
    teamCardHtml() +
    `<div class="card setCard"><h2>表示の色</h2><div class="themeSeg">${[["auto", "端末と同じ"], ["light", "ライト"], ["dark", "ダーク"]]
      .map(([k, l]) => `<button type="button" data-theme-set="${k}" class="${(getLS("theme") || "auto") === k ? "on" : ""}">${l}</button>`)
      .join("")}</div><p class="sub">「端末と同じ」は、Windows の「個人用設定 → 色」に合わせて切り替わります。</p></div>` +
    `<div class="card setCard"><h2>アプリとして使う</h2><p class="sub">Edge / Chrome のアドレスバー右端の「アプリをインストール」から入れると、スタートメニューやタスクバーから開けます。</p></div>` +
    `<div class="mutedText">${esc(APP_NAME)} ver.${APP_VERSION}</div>`;
  main.querySelectorAll("[data-theme-set]").forEach((b) =>
    b.addEventListener("click", () => {
      setLS("theme", b.dataset.themeSet === "auto" ? "" : b.dataset.themeSet);
      applyTheme(b.dataset.themeSet);
      main.querySelectorAll("[data-theme-set]").forEach((x) => x.classList.toggle("on", x === b));
    })
  );
  main.querySelectorAll("[data-team]").forEach((c) =>
    c.addEventListener("change", () => {
      const names = new Set(teamList());
      if (c.checked) names.add(c.dataset.team);
      else [...names].filter((x) => normName(x) === normName(c.dataset.team)).forEach((x) => names.delete(x));
      setLS("team", JSON.stringify([...names]));
      setLS("scope", "team");
      updateNavBadge();
      const cnt = main.querySelector("#teamCount");
      if (cnt) cnt.textContent = names.size ? `${names.size}人を選んでいます` : "選んでいません（全員を表示）";
    })
  );
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
  else if (name === "weeks") renderWeeks();
  else if (name === "meet") renderMeet(arg);
  else if (name === "site") renderSite(decodeURIComponent(arg || ""));
  else if (name === "person") renderPerson(decodeURIComponent(arg || ""));
  else if (name === "settings") renderSettings();
  else renderHome();
  if (!$("drawer").hidden && drawerNoteId && !data.notes.has(drawerNoteId)) closeDrawer();
}

function applyTheme(t) {
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme");
  const dark = t === "dark" || (t !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#1c2320" : "#f7f5ef");
}

async function init() {
  applyTheme(getLS("theme") || "auto");
  document.title = APP_NAME;
  $("appName").textContent = APP_NAME;
  document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon, 22)));
  $("reloadBtn").innerHTML = icon("reload", 22);
  $("drawerClose").innerHTML = icon("x", 24);
  $("drawerClose").addEventListener("click", closeDrawer);
  document.querySelector(".drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    // 打合せモード：← → で現場をめくる（入力中は除く）
    if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.altKey && !e.ctrlKey && !e.metaKey && $("lightbox").hidden && location.hash.startsWith("#/meet") && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") && $("drawer").hidden) {
      const b = document.querySelector(e.key === "ArrowLeft" ? ".meetPrev" : ".meetNext");
      if (b && !b.disabled) b.click();
    }
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
