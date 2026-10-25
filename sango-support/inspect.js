"use strict";
/* 点検・メンテナンス（リーダー用）。app.js の関数（$, esc, icon, go, dbGet/dbPut, apiCall, hasApi, master, uid, toast,
   resizeImage, readExifDate, blobToBase64, blobUrl, safeName, getSetting/setSetting …）を使う。
   項目マスターと、全リーダーの記録は、窓口（inspectList）から読む。自分の記録は、端末に一時保存してから窓口へ送る。 */

const INSP_CACHE = "insp", INSP_PEND = "inspPending";
const INSP_GLYPH = { fire: "消", heat: "暖", air: "空", elec: "電", season: "季", ext: "外", other: "他" };
const INSP_CAT = { fire: "CAT-12", heat: "CAT-01", air: "CAT-11", elec: "CAT-02", season: "CAT-12", ext: "CAT-05", other: "CAT-12" }; // 要対応を症例にする時の分類
let inspData = null;      // { meta, items, logs, at }
let inspPend = [];        // 送り終わっていない記録 [{ log, photos:[{ name, blob, takenAt }] }]
let inspBld = "";         // 一覧の建物の絞り込み
let inspBusy = false;
let inspForm = null;
let inspAllNone = false;
let inspMode = "list";    // "list"＝点検（絞り込み＋建物の中の図＋一覧）／"plan"＝年間予定（何月に何をやるか）
let inspGrp = "";         // 種類（消防・空調…）の絞り込み
let inspItemFilter = "";  // 項目（消火器の目視点検など）の絞り込み。年間予定から選んだ時も
let inspFreq = "";        // 頻度（m1・m3…）の絞り込み
let inspInfoAsked = false;  // 図面の有無（floorPlanInfo）を、このタブで聞いたか
const inspPinNos = {};    // 建物ごとの、図にピンがある点検の番号（Set）。図を読み込んだ時に作る
/** 絞り込み（建物以外）に合う項目か。一覧と図のピンで同じものを使う */
const inspOk = (it) => (!inspGrp || it.group === inspGrp) && (!inspItemFilter || it.id === inspItemFilter) && (!inspFreq || inspFreqOf(it) === inspFreq);
const inspFiltered = () => !!(inspGrp || inspItemFilter || inspFreq);
/** 標準の予定月（項目マスターの plan。無ければ周期から） */
const inspPlanOf = (it) => IC.planOf(it);   // 計算は inspcore.js（管理者・本社と同じ）
/** 年間予定：毎月のものは、まとめて1行。ほかは、今月から12か月、月ごとに「何をやるか」を並べる */
function inspPlanHtml() {
  const today = inspToday(), y0 = +today.slice(0, 4), m0 = +today.slice(5, 7);
  const logs = inspLogs(), bn = {};
  ((inspData.meta && inspData.meta.buildings) || []).forEach((b) => { bn[b.id] = b.name; });   // 見える建物は、読み込んだ時に絞ってある（inspScope）
  const items = inspData.items.filter((i) => i.enabled && (i.buildings || []).some((b) => bn[b]));
  const monthly = items.filter((i) => inspPlanOf(i).length === 12);
  const doneIn = (item, bid, ym) => logs.some((l) => l.item_id === item.id && l.building_id === bid && l.result !== "pending" && String(l.done_on).slice(0, 7) === ym);
  let html = `<div class="infoBar">${icon("info")}「標準の予定月」です。実際の期限は、前回の実施日から計算されます（「期限の一覧」）。項目を押すと、その項目だけを一覧で見られます。</div>`;
  html += `<div class="planMonthly"><b>毎月やること</b><div>${monthly.map((i) => `<span class="planChip" data-i="${esc(i.id)}">${esc(i.title)}</span>`).join("")}</div></div>`;
  for (let k = 0; k < 12; k++) {
    const idx = m0 - 1 + k, m = (idx % 12) + 1, y = y0 + Math.floor(idx / 12), ym = `${y}-${pad(m)}`;
    const list = items.filter((i) => inspPlanOf(i).length < 12 && inspPlanOf(i).indexOf(m) >= 0);
    html += `<div class="planMonth${k === 0 ? " now" : ""}"><h4>${m}月${k === 0 ? "（今月）" : y !== y0 ? `（${y}年）` : ""}</h4>`;
    html += list.length ? list.map((i) => {
      const bl = (i.buildings || []).filter((b) => bn[b]), done = bl.filter((b) => doneIn(i, b, ym)).length;
      const names = bl.length >= 6 ? `全${bl.length}棟` : bl.map((b) => esc(bn[b])).join("・");
      return `<div class="planRow${bl.length && done === bl.length ? " done" : ""}" data-i="${esc(i.id)}"><span class="planDot ${esc(i.group)}"></span><div class="planT"><b>${esc(i.title)}</b>${i.legal ? ` <span class="tag warn">法定</span>` : ""}<div class="inspMeta">${names}</div></div><span class="planSt">${done ? (done === bl.length ? "済" : `済 ${done}/${bl.length}`) : ""}</span></div>`;
    }).join("") : `<div class="note" style="padding:4px 2px">毎月のもの以外は、ありません</div>`;
    html += `</div>`;
  }
  return html;
}  // 「まだ記録がありません」を全部出すか

/* ---------- 日付の計算 ---------- */
const inspToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const inspParse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const inspFmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inspMD = (s) => { const d = inspParse(s); return `${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + "/" : ""}${d.getMonth() + 1}/${pad(d.getDate())}`; }; // 来年以降は、年も出す
const inspDays = (a, b) => Math.round((inspParse(a) - inspParse(b)) / 86400000);
/** 前回の実施日から、次の期限を出す。記録がなければ null（未実施）。計算は inspcore.js */
const inspDue = (item, last) => IC.due(item, last);

/* ---------- データ（端末の控え・窓口との同期） ---------- */
/** 見える建物だけにする（合言葉で決まる。窓口も絞って返すが、前の控えが残っている時のため）。読み込んだ時に1回だけ */
function inspScope(d) {
  if (!d || !bldScope().length) return d;
  const blds = ((d.meta && d.meta.buildings) || []).filter((b) => bldVisible(b.id));
  return { ...d, meta: { ...(d.meta || {}), buildings: blds }, logs: (d.logs || []).filter((l) => bldVisible(l.building_id)),
    items: (d.items || []).map((it) => ({ ...it, buildings: (it.buildings || []).filter((b) => bldVisible(b)) })) };
}
async function inspLoadCache() {
  try { const c = await dbGet("meta", INSP_CACHE); if (c && c.data) inspData = inspScope(c.data); } catch (e) { /* 無ければ空 */ }
  try { const p = await dbGet("meta", INSP_PEND); inspPend = (p && p.list) || []; } catch (e) { inspPend = []; }
}
const inspSavePend = () => dbPut("meta", { key: INSP_PEND, list: inspPend });
const inspSaveCache = () => dbPut("meta", { key: INSP_CACHE, data: inspData });
function inspLogs() { // 窓口の記録に、まだ送っていない自分の記録を重ねる
  const map = new Map();
  ((inspData && inspData.logs) || []).forEach((l) => map.set(l.id, l));
  inspPend.forEach((p) => map.set(p.log.id, { ...p.log, _pending: true }));
  return [...map.values()];
}
async function inspFlush() { // 送れていない記録を、写真→記録の順に送る
  if (!hasApi()) return false;
  let ok = true;
  for (const p of [...inspPend]) {
    try {
      for (const ph of p.photos) await apiCall({ action: "putPhoto", name: ph.name, record_id: p.log.id, taken_at: new Date(ph.takenAt).toISOString(), data: await blobToBase64(ph.blob) }, 60000);
      await apiCall({ action: "inspectSubmit", sender: getSetting("name"), sender_id: deviceId(), app_version: APP_VERSION, records: [p.log] }, 40000);
      inspPend = inspPend.filter((x) => x.log.id !== p.log.id);
      await inspSavePend();
    } catch (e) { console.warn("点検の送信を後回しにします", e); ok = false; break; }
  }
  return ok;
}
async function inspSync() {
  if (!hasApi() || inspBusy) return false;
  inspBusy = true;
  try {
    await inspFlush();
    const j = await apiCall({ action: "inspectList" }, 40000);
    inspData = inspScope({ meta: j.meta || { buildings: [], groups: [] }, items: j.items || [], logs: j.logs || [], at: Date.now() });
    await inspSaveCache();
    return true;
  } catch (e) { console.warn("点検の読み込みに失敗", e); return false; } finally { inspBusy = false; }
}

/* ---------- 一覧の元データ ---------- */
function inspRows() {
  if (!inspData) return [];
  const today = inspToday(), bnames = {};
  ((inspData.meta && inspData.meta.buildings) || []).forEach((b) => { bnames[b.id] = b.name; });   // 見える建物は、読み込んだ時に絞ってある（inspScope）
  const logs = inspLogs();
  const rows = [];
  inspData.items.filter((i) => i.enabled).forEach((item) => {
    (item.buildings || []).forEach((bid) => {
      if (!bnames[bid]) return;
      const mine = logs.filter((l) => l.item_id === item.id && l.building_id === bid);
      const done = mine.filter((l) => l.result !== "pending").sort((a, b) => (a.done_on < b.done_on ? 1 : a.done_on > b.done_on ? -1 : 0));
      const waiting = mine.some((l) => l.result === "pending");
      const last = done[0] || null;
      const due = inspDue(item, last && last.done_on);
      let st = "none", days = 0;
      if (due) { days = inspDays(due, today); st = days < 0 ? "over" : due.slice(0, 7) === today.slice(0, 7) ? "month" : "later"; }
      rows.push({ item, bid, bname: bnames[bid], last, due, st, days, waiting });
    });
  });
  return rows;
}
const inspCount = (rows) => ({ over: rows.filter((r) => r.st === "over").length, month: rows.filter((r) => r.st === "month").length });
const inspIconHtml = (item) => `<img src="art/insp-${esc(item.icon)}.webp?v=${ART_V}" alt="" loading="lazy" data-fb="cat" data-glyph="${esc(INSP_GLYPH[item.group] || "点")}">`;

/* ---------- 頻度 ---------- */
const INSP_FREQ = [["m1", "毎月"], ["m3", "3か月ごと"], ["m6", "半年ごと"], ["y1", "年1回"], ["season", "季節"]];
const inspFreqOf = (it) => IC.freqOf(it);
/* ---------- 一覧 ---------- */
function inspCard(r, cls, map) {   // map＝"pin"（図にピンあり）／"none"（図にピンがない点検＝ピンなし）／""（図のない建物・すべての建物）
  const who = r.last ? `前回 ${inspMD(r.last.done_on)}${r.last.done_by ? " " + esc(r.last.done_by) + "さん" : ""}${r.last.result === "issue" ? "（要対応あり）" : ""}` : "まだ記録がありません";
  const due = r.due ? `期限 ${inspMD(r.due)}${r.st === "over" ? `（${-r.days}日超過）` : ""}` : "";
  return `<div class="inspCard ${cls}" data-i="${esc(r.item.id)}" data-b="${esc(r.bid)}">
    <div class="inspIcon">${inspIconHtml(r.item)}</div>
    <div class="inspBody"><div class="inspTitle">${esc(r.item.title)}${r.item.legal ? ` <span class="tag warn">法定</span>` : ""}</div>
      <div class="inspMeta"><span class="tag gray">${esc(r.bname)}</span> ${esc((r.item.cycle || {}).label || "")}${map === "none" ? ` <span class="tag gray mapNone">ピンなし</span>` : ""}</div>
      ${due ? `<div class="inspDue ${r.st}">${due}</div>` : ""}<div class="inspLast">${who}${r.waiting ? "　報告書待ち" : ""}</div></div>
    <div class="inspBtns">${map === "pin" ? `<button class="btn inspMapBtn" data-fn="${r.item.no}">${icon("pin")}図</button>` : ""}<button class="btn btnPrimary inspGo">記録する</button></div></div>`;
}
async function viewInspect(main, r) {
  if (r.id === "rec") return viewInspRecord(main, r.sub, r.sid, r.q.get("eq"));
  if (r.id === "hist") return viewInspHist(main, r.sub, r.sid);
  $("topTitle").textContent = "点検";
  if (!hasApi()) { main.innerHTML = `<div class="empty">点検は、窓口につながっている時に使えます。<br>設定で「報告の送り方」を確認してください。</div>`; return; }
  const q = r.q.get("b"); if (q) inspBld = q;
  inspInfoAsked = false;   // 図面の有無は、タブを開くたびに1回だけ聞き直す
  if (!inspData) await inspLoadCache();
  draw();
  inspSync().then((ok) => { if (ok && location.hash.startsWith("#/insp") && !route().id) draw(); }); // 最新を読んで、描き直す
  function draw() {
    if (!inspData) { main.innerHTML = `<div class="empty">${inspBusy ? "読み込んでいます…" : "点検の項目を読み込めませんでした。電波のある所で、もう一度開いてください。"}</div>`; return; }
    const all = inspRows();
    const blds = ((inspData.meta && inspData.meta.buildings) || []).filter((b) => all.some((x) => x.bid === b.id));
    if (inspBld && !blds.some((b) => b.id === inspBld)) inspBld = "";
    const scope = all.filter((x) => !inspBld || x.bid === inspBld);   // 建物で絞ったもの（種類・頻度のボタンは、この中にあるものだけ出す）
    if (inspGrp && !scope.some((x) => x.item.group === inspGrp)) inspGrp = "";
    if (inspItemFilter && !scope.some((x) => x.item.id === inspItemFilter)) inspItemFilter = "";
    if (inspFreq && !scope.some((x) => inspFreqOf(x.item) === inspFreq && (!inspGrp || x.item.group === inspGrp))) inspFreq = "";
    const rows = scope.filter((x) => inspOk(x.item)), cnt = inspCount(rows);
    const today = inspToday();
    const info = FP.info, planOk = !!(inspBld && info && info.buildings && info.buildings[inspBld]), pins = planOk ? inspPinNos[inspBld] : null;
    const mapOf = (x) => (!pins ? "" : pins.has(x.item.no) ? "pin" : "none");
    const sec = (title, cls, list, note) => (list.length ? `<div class="sectionHead"><h3 class="${cls}">${title}</h3><span class="rule"></span><span class="count">${list.length}件</span></div>${note ? `<div class="mutedText" style="margin:-2px 4px 8px">${note}</div>` : ""}${list.map((x) => inspCard(x, x.st, mapOf(x))).join("")}` : "");
    const byDue = (a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
    const over = rows.filter((x) => x.st === "over").sort(byDue), month = rows.filter((x) => x.st === "month").sort(byDue);
    const none = rows.filter((x) => x.st === "none"), later = rows.filter((x) => x.st === "later").sort(byDue);
    const recent = rows.filter((x) => x.last && inspDays(today, x.last.done_on) <= 7 && x.st === "later");
    // 絞り込み：建物／種類（→ 種類を選ぶと、その中の項目）／頻度。一覧と図の両方に効く
    const chip = (attr, val, cur, label) => `<button class="chip${cur === val ? " on" : ""}" ${attr}="${esc(val)}">${label}</button>`;
    const groups = ((inspData.meta && inspData.meta.groups) || []).filter((g) => scope.some((x) => x.item.group === g.id));
    const gItems = inspGrp ? [...new Map(scope.filter((x) => x.item.group === inspGrp).map((x) => [x.item.id, x.item])).values()].sort((a, b) => a.no - b.no) : [];
    const freqs = INSP_FREQ.filter(([k]) => scope.some((x) => inspFreqOf(x.item) === k && (!inspGrp || x.item.group === inspGrp)));
    const short = (t) => { const v = String(t).replace(/（.*?）/g, ""); return v.length > 11 ? v.slice(0, 11) + "…" : v; };
    const flts = `<div class="inspFlts">
      <div class="fRow"><span class="fLbl">建物</span><div class="chips">${chip("data-bb", "", inspBld, "すべて")}${blds.map((b) => chip("data-bb", b.id, inspBld, esc(b.name))).join("")}</div></div>
      <div class="fRow"><span class="fLbl">種類</span><div class="chips">${chip("data-gg", "", inspGrp, "すべて")}${groups.map((g) => chip("data-gg", g.id, inspGrp, esc(g.name))).join("")}</div></div>
      ${gItems.length > 1 ? `<div class="fRow sub"><span class="fLbl"></span><div class="chips">${chip("data-ii", "", inspItemFilter, "ぜんぶ")}${gItems.map((it) => chip("data-ii", it.id, inspItemFilter, esc(short(it.title)))).join("")}</div></div>` : ""}
      <div class="fRow"><span class="fLbl">頻度</span><div class="chips">${chip("data-ff", "", inspFreq, "すべて")}${freqs.map(([k, l]) => chip("data-ff", k, inspFreq, l)).join("")}</div></div>
    </div>`;
    const mapPart = !inspBld ? `<div class="inspMap" id="inspMapRow" hidden><div class="inspMapHd"><img src="art/ic-map.webp?v=4" alt="" width="36" height="36"><span><b>建物を選ぶと、建物の中の図で見られます</b><small>点検する機器がピンで出ます。ピンから記録できます</small></span></div><div class="inspMapList" id="inspMapChips"></div></div>`
      : planOk ? `<button class="fpEntry" id="inspBigMap"><img src="art/ic-map.webp?v=4" alt="" width="40" height="40"><span class="fpT"><b>建物の中の図で見る</b><small>${inspFiltered() ? "上の絞り込みのまま、" : ""}点検する機器がピンで出ます。ピンから記録できます</small></span>${icon("chevron")}</button>` : "";
    const listHtml = `<div class="inspSum"><span class="chipN over">期限超過 ${cnt.over}</span><span class="chipN month">今月 ${cnt.month}</span>${inspFiltered() ? `<button class="linkBtn" id="inspFltOff">絞り込みを戻す</button>` : ""}</div>
      ${sec("期限が過ぎています", "over", over)}${sec("今月やること", "month", month)}${sec("最近済んだもの", "done", recent)}${sec("次の予定", "later", later.filter((x) => !recent.includes(x)))}${sec("まだ記録がありません", "none", inspAllNone ? none : none.slice(0, 6), "初めての記録をすると、次の期限が出ます。")}
      ${!inspAllNone && none.length > 6 ? `<button class="btn" id="inspMore" style="width:100%;margin:4px 0 12px">あと ${none.length - 6}件を表示する</button>` : ""}
      ${rows.length ? "" : `<div class="empty">${inspFiltered() ? "この絞り込みに合う点検はありません。" : "この建物の点検の項目はありません。"}</div>`}`;
    const tg = `<div class="segRow inspTg"><button class="segBtn${inspMode === "list" ? " on ok" : ""}" data-md="list">点検</button><button class="segBtn${inspMode === "plan" ? " on ok" : ""}" data-md="plan">年間予定</button></div>`;
    main.innerHTML = tg + (inspMode === "plan" ? inspPlanHtml() : flts + mapPart + listHtml);
    if (inspMode !== "plan") {
      if (!inspBld) inspMapChips(info, blds, all.filter((x) => inspOk(x.item)), () => draw());
      else if (planOk && !inspPinNos[inspBld]) { const bb = inspBld; fpLoad(bb).then((d) => { inspPinNos[bb] = new Set(((d && d.floors) || []).flatMap((f) => (f.equip || []).map((e) => e.insp))); if (location.hash.startsWith("#/insp") && !route().id && inspBld === bb) draw(); }).catch(() => {}); }   // 図にピンがある点検を覚える（一覧の「図」「ピンなし」）
    }
    if (!info && hasApi() && !inspInfoAsked) { inspInfoAsked = true; fpInfo().then((i) => { if (i && location.hash.startsWith("#/insp") && !route().id) draw(); }); }   // 図面の有無が分かったら、描き直す
    const reset = () => { inspAllNone = false; };
    main.querySelectorAll("[data-md]").forEach((b) => (b.onclick = () => { inspMode = b.dataset.md; draw(); window.scrollTo(0, 0); }));
    main.querySelectorAll(".planRow, .planChip").forEach((el) => (el.onclick = () => { const it = inspItem(el.dataset.i); inspItemFilter = el.dataset.i; inspGrp = it ? it.group : ""; inspFreq = ""; reset(); inspMode = "list"; draw(); window.scrollTo(0, 0); }));
    main.querySelectorAll("[data-bb]").forEach((el) => (el.onclick = () => { inspBld = el.dataset.bb; reset(); draw(); }));
    main.querySelectorAll("[data-gg]").forEach((el) => (el.onclick = () => { inspGrp = el.dataset.gg; inspItemFilter = ""; reset(); draw(); }));
    main.querySelectorAll("[data-ii]").forEach((el) => (el.onclick = () => { inspItemFilter = el.dataset.ii; reset(); draw(); }));
    main.querySelectorAll("[data-ff]").forEach((el) => (el.onclick = () => { inspFreq = el.dataset.ff; reset(); draw(); }));
    const fo = $("inspFltOff"); if (fo) fo.onclick = () => { inspGrp = ""; inspItemFilter = ""; inspFreq = ""; reset(); draw(); };
    const bm = $("inspBigMap"); if (bm) bm.onclick = () => inspOpenMap(inspBld, 0);
    const more = $("inspMore"); if (more) more.onclick = () => { inspAllNone = true; draw(); };
    main.querySelectorAll(".inspMapBtn").forEach((el) => (el.onclick = (e) => { e.stopPropagation(); inspOpenMap(inspBld, +el.dataset.fn); }));   // 一覧の「図」：その点検の機器だけを濃くした図
    main.querySelectorAll(".inspCard").forEach((el) => (el.onclick = () => go(`#/insp/rec/${encodeURIComponent(el.dataset.i)}/${encodeURIComponent(el.dataset.b)}`)));
    main.querySelectorAll(".inspFlts .chip.on").forEach((c) => {   // 選んだボタンが、横にはみ出して見えない時は、見える所まで寄せる
      const box = c.parentElement, d = c.getBoundingClientRect().left - box.getBoundingClientRect().left;
      if (d + c.offsetWidth > box.clientWidth) box.scrollLeft += d - (box.clientWidth - c.offsetWidth) / 2;
    });
    fillIcons(main);
  }
}

/** 建物が「すべて」の時：図のある建物を、絵のボタンで出す。押すと、その建物で絞る（図と一覧が出る）。数は、いまの絞り込みでの期限超過・今月 */
function inspMapChips(info, blds, all, redraw) {   // info＝図面の有無（FP.info）。まだ分からない時は出さない（分かったら draw で描き直す）
  const row = $("inspMapRow"), box = $("inspMapChips");
  if (!row || !box || !info || !info.buildings) return;
  const list = blds.filter((b) => info.buildings[b.id]);
  if (!list.length) return;
  const mb = typeof master !== "undefined" && master && master.buildings ? master.buildings : [];   // 建物の絵（業者データの建物）
  box.innerHTML = list.map((b) => {
    const c = inspCount(all.filter((x) => x.bid === b.id)), mbx = mb.find((x) => x.id === b.id) || { id: b.id };
    return `<button class="inspMapB" data-mb="${esc(b.id)}"><span class="im">${bldImg(mbx)}</span><b>${esc(b.name)}</b>${c.over ? `<span class="chipN over">超過 ${c.over}</span>` : c.month ? `<span class="chipN month">今月 ${c.month}</span>` : ""}</button>`;
  }).join("");
  fillIcons(box);
  row.hidden = false;
  box.querySelectorAll("[data-mb]").forEach((el) => (el.onclick = () => { inspBld = el.dataset.mb; inspAllNone = false; redraw(); window.scrollTo(0, 0); }));
}

/** 点検のタブの図：ホームから入った時と同じ、画面いっぱいの図。上の絞り込み（種類・頻度）のまま。no を渡すと、その点検の機器だけを濃く */
function inspOpenMap(bid, no) {
  if (typeof fpOpen !== "function") return;
  const b = ((inspData.meta && inspData.meta.buildings) || []).find((x) => x.id === bid) || { name: bid };
  const api = fpOpen({ title: b.name + "：点検", load: () => fpLoad(bid), noPlan: true, ...fpPinOpts(bid),
    filter: (eq, st) => (st.item ? inspOk(st.item) : !inspFiltered()),
    hint: inspFiltered() ? "点検のタブで選んだ「種類」「頻度」の絞り込みのまま出ています。ピンを押すと、点検の状態が出ます。" : "ピンを押すと、点検の状態が出ます。点検のタブの上で、種類・頻度を絞れます。",
    equipAction: "点検を記録する",
    onEquip: (eq, close) => { close(); go(`#/insp/rec/${encodeURIComponent(fpItemId(eq.insp))}/${encodeURIComponent(bid)}?eq=${encodeURIComponent(eq.id)}`); } });
  if (no) api.focusItem(no);
}

/* ---------- 記録の入力 ---------- */
const inspNames = () => { try { return JSON.parse(getSetting("inspNames", "[]")); } catch (e) { return []; } };
function inspRememberName(n) { const l = [n, ...inspNames().filter((x) => x !== n)].slice(0, 8); setSetting("inspNames", JSON.stringify(l)); }
function inspItem(id) { return inspData && inspData.items.find((i) => i.id === id); }

/** その建物・その点検の番号の機器（平面図の控えから）。控えが無ければ、窓口から読む */
async function inspEquipOf(itemId, bid) {
  const no = Number(String(itemId).replace(/\D/g, "")), out = [];
  let data = null;
  if (typeof fpLoad === "function") { try { data = await fpLoad(bid); } catch (e) { data = null; } }   // 版が同じなら控え、違えば新しいもの。受け取れない時は前の版
  ((data && data.floors) || []).forEach((f) => (f.equip || []).forEach((eq) => {
    if (eq.insp === no) out.push({ id: eq.id, label: `${f.label || f.id}・${eq.type}${eq.no ? " " + eq.no : ""}（${eq.room || ""}）` });
  }));
  return out;
}
async function viewInspRecord(main, itemId, bid, eqId) {
  if (!inspData) await inspLoadCache();
  const item = inspItem(itemId), bname = (((inspData && inspData.meta.buildings) || []).find((b) => b.id === bid) || {}).name;
  if (!item || !bname) { goReplace("#/insp"); return; }
  $("topTitle").textContent = "点検を記録";
  const key = location.hash;
  if (!inspForm || inspForm.key !== key) {
    inspForm = { key, id: uid(), date: inspToday(), by: inspNames()[0] || getSetting("name"), result: "ok", memo: "", vendor: "", photos: [], rows: (item.checklist || []).map((t) => ({ t, r: "ok", m: "" })), equip: null, eqSel: {} };
    const f0 = inspForm;
    inspEquipOf(itemId, bid).then((list) => {   // 機器の一覧は、あとから読み込む（図から来た時は、その機器に印。一覧から来た時は、印なし＝見た機器に付けてもらう）
      if (inspForm !== f0 || !list.length) return;
      f0.equip = list; list.forEach((e) => { f0.eqSel[e.id] = !!eqId && e.id === eqId; });
      f0.eqMiss = !!eqId && !list.some((e) => e.id === eqId);   // 図から来た機器が、一覧に無い（図が新しくなった時など）
      if (location.hash === key) draw();
    });
  }
  const f = inspForm;
  const rows = inspRows().filter((x) => x.item.id === itemId && x.bid === bid), cur = rows[0];
  const draw = () => {
    const isCheck = item.kind === "check";
    const next = inspDue(item, f.date);
    main.innerHTML = `<div class="formCard inspHead"><div class="inspIcon">${inspIconHtml(item)}</div><div><div class="inspTitle">${esc(item.title)}${item.legal ? ` <span class="tag warn">法定</span>` : ""}</div>
        <div class="inspMeta"><span class="tag gray">${esc(bname)}</span> ${esc((item.cycle || {}).label || "")}</div>${cur && cur.due ? `<div class="inspDue ${cur.st}">期限 ${inspMD(cur.due)}${cur.st === "over" ? `（${-cur.days}日超過）` : ""}</div>` : ""}</div></div>
      ${item.note ? `<div class="infoBar">${icon("info")}${esc(item.note)}</div>` : ""}
      <div class="formCard"><div class="fieldLabel">実施日</div><input class="textInput" type="date" id="iDate" value="${esc(f.date)}" max="${esc(inspToday())}"></div>
      <div class="formCard"><div class="fieldLabel">${isCheck ? "点検した人" : "点検した人（立ち会った人）"}<span class="req">必須</span></div><input class="textInput" id="iBy" list="iByList" maxlength="40" placeholder="名前を入れる" value="${esc(f.by)}"><datalist id="iByList">${inspNames().map((n) => `<option value="${esc(n)}">`).join("")}</datalist></div>
      ${isCheck ? `<div class="formCard"><div class="fieldLabel">点検表</div><div id="iRows"></div></div>` : `
      <div class="formCard"><div class="fieldLabel">実施した業者<span class="opt">任意</span></div><input class="textInput" id="iVendor" maxlength="60" value="${esc(f.vendor)}"></div>
      <div class="formCard"><div class="fieldLabel">結果</div><div class="segRow" id="iRes">${[["ok", "異常なし"], ["issue", "要対応あり"], ["pending", "報告書待ち"]].map(([k, l]) => `<button class="segBtn${f.result === k ? " on " + k : ""}" data-v="${k}">${l}</button>`).join("")}</div></div>`}
      ${f.equip ? `<div class="formCard"><div class="fieldLabel">点検した機器<span class="opt">見た機器に印</span></div>
        ${f.eqMiss ? `<div class="infoBar">${icon("info")}図から選んだ機器が、この一覧にありません（図が新しくなったため）。見た機器に印を付けてください。</div>` : ""}
        <button class="btn" id="eqMap" style="width:100%;margin:2px 0 8px">図で場所を見る</button>
        <div class="eqList">${f.equip.map((e) => `<label class="eqRow"><input type="checkbox" data-eq="${esc(e.id)}" ${f.eqSel[e.id] ? "checked" : ""}> ${esc(e.label)}</label>`).join("")}</div>
        <div class="mutedText" style="margin-top:4px"><a href="#" id="eqAll" style="text-decoration:underline">すべてに印</a>　点検の時期は、この建物でまとめて決まります。印は「どの機器を見たか」の記録です</div></div>` : ""}
      <div class="formCard"><div class="fieldLabel">${isCheck ? "写真" : "点検報告書の写真"}<span class="opt">任意・複数枚OK</span></div><div class="photoStrip" id="iStrip"></div></div>
      <div class="formCard"><div class="fieldLabel">メモ<span class="opt">任意</span></div><textarea id="iMemo" maxlength="500" placeholder="気づいたことなど">${esc(f.memo)}</textarea></div>
      ${isCheck ? "" : `<div class="infoBar">${icon("info")}点検は有資格者が行います。ここには、いつ・誰が行ったかの記録を残します。${next ? `次回の期限：${inspMD(next)}（${next.slice(0, 4)}）` : ""}</div>`}
      <div class="formActions" style="flex-direction:column"><button class="btn btnPrimary" id="iSave">この内容で記録する</button>
        <button class="btn" id="iIssue" ${(isCheck ? f.rows.some((x) => x.r === "issue") : f.result === "issue") ? "" : "hidden"}>要対応を、症例・依頼にする</button>
        <div class="mutedText" style="text-align:center" ${(isCheck ? f.rows.some((x) => x.r === "issue") : f.result === "issue") ? "" : "hidden"}>建物・分類・内容があらかじめ入ります</div></div>
      <div class="mutedText" style="text-align:center;margin-top:8px"><a href="#/insp/hist/${encodeURIComponent(itemId)}/${encodeURIComponent(bid)}" style="text-decoration:underline">この点検の履歴を見る</a></div>`;
    if (isCheck) drawRows();
    drawStrip();
    $("iDate").onchange = (e) => { f.date = e.target.value || inspToday(); };
    $("iBy").oninput = (e) => { f.by = e.target.value; };
    $("iMemo").oninput = (e) => { f.memo = e.target.value; };
    const v = $("iVendor"); if (v) v.oninput = (e) => { f.vendor = e.target.value; };
    main.querySelectorAll("#iRes .segBtn").forEach((b) => (b.onclick = () => { f.result = b.dataset.v; draw(); }));
    main.querySelectorAll("[data-eq]").forEach((c) => (c.onchange = () => { f.eqSel[c.dataset.eq] = c.checked; }));
    const ea = $("eqAll"); if (ea) ea.onclick = (e) => { e.preventDefault(); f.equip.forEach((x) => { f.eqSel[x.id] = true; }); draw(); };
    const em = $("eqMap"); if (em) em.onclick = () => {   // 図から入った時と同じ図で、この点検の機器の場所を見る。ピンから印を付けられる
      fpOpen({ title: bname, load: () => fpLoad(bid), noPlan: true, ...fpPinOpts(bid), focus: Number(String(itemId).replace(/\D/g, "")),
        marked: (eq) => !!f.eqSel[eq.id], equipAction: (eq) => (f.eqSel[eq.id] ? "印を外す" : "この機器に印を付ける"),
        onEquip: (eq) => { if (f.equip.some((x) => x.id === eq.id)) f.eqSel[eq.id] = !f.eqSel[eq.id]; },
        onClose: () => { if (inspForm === f && location.hash === key) draw(); } });   // 図を閉じたら、印を一覧に反映
    };
    $("iSave").onclick = () => save(false);
    $("iIssue").onclick = () => save(true);
    fillIcons(main);
  };
  const drawRows = () => {
    const box = $("iRows");
    box.innerHTML = f.rows.map((x, i) => `<div class="chkRow"><div class="chkText"><span class="chkNo">${i + 1}</span>${esc(x.t)}</div>
      <div class="segRow">${[["ok", "○"], ["issue", "要対応"], ["na", "対象外"]].map(([k, l]) => `<button class="segBtn${x.r === k ? " on " + k : ""}" data-i="${i}" data-v="${k}">${l}</button>`).join("")}</div>
      ${x.r === "issue" ? `<input class="textInput" data-m="${i}" maxlength="100" placeholder="どんな状態か（例：圧力計が黄色）" value="${esc(x.m)}">` : ""}</div>`).join("");
    box.querySelectorAll(".segBtn").forEach((b) => (b.onclick = () => { f.rows[+b.dataset.i].r = b.dataset.v; draw(); }));
    box.querySelectorAll("[data-m]").forEach((el) => (el.oninput = (e) => { f.rows[+el.dataset.m].m = e.target.value; }));
  };
  const drawStrip = () => {
    const strip = $("iStrip"); strip.innerHTML = "";
    f.photos.forEach((p) => {
      const d = document.createElement("div"); d.className = "photoThumb";
      d.innerHTML = `<img src="${blobUrl(p.thumb)}" alt=""><button class="x" aria-label="削除">${icon("close")}</button>`;
      d.querySelector("img").onclick = () => showLightbox(p.blob);
      d.querySelector(".x").onclick = () => { f.photos = f.photos.filter((x) => x !== p); drawStrip(); };
      strip.appendChild(d);
    });
    const add = (label, ic, capture) => {
      const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.hidden = true; if (capture) inp.capture = "environment"; else inp.multiple = true;
      inp.onchange = async () => {
        for (const file of [...inp.files]) {
          try { const taken = ((await readExifDate(file)) || (file.lastModified ? new Date(file.lastModified) : new Date())).getTime(); f.photos.push({ id: uid(), takenAt: taken, blob: await resizeImage(file, 1600), thumb: await resizeImage(file, 360) }); }
          catch (e) { toast("読み込めない写真がありました"); }
        }
        if (inspForm === f) drawStrip();
      };
      const b = document.createElement("button"); b.className = "photoAdd"; b.innerHTML = `${icon(ic)}${label}`; b.onclick = () => inp.click(); strip.append(b, inp);
    };
    add("カメラで撮る", "camera", true); add("撮影済みを選ぶ", "image", false);
    fillIcons(strip);
  };
  async function save(toIssue) {
    const by = f.by.trim();
    if (!by) { toast("点検した人の名前を入れてください"); return; }
    const isCheck = item.kind === "check";
    const result = isCheck ? (f.rows.some((x) => x.r === "issue") ? "issue" : "ok") : f.result;
    const now = new Date().toISOString();
    const photos = f.photos.map((p, n) => ({ name: safeName(`点検_${bname}_${item.id}_${f.date.replace(/-/g, "")}_${f.id.slice(-4)}_${n + 1}_${p.id.slice(-4)}.jpg`), blob: p.blob, takenAt: p.takenAt }));
    const log = { id: f.id, item_id: item.id, building_id: bid, done_on: f.date, done_by: by, result, checks: isCheck ? f.rows.map((x) => ({ t: x.t, r: x.r, m: x.r === "issue" ? x.m.trim() : "" })) : [], memo: f.memo.trim(), photos: photos.map((p) => ({ file: p.name })), vendor: f.vendor.trim(), equip: (f.equip || []).filter((e) => f.eqSel[e.id]).map((e) => ({ id: e.id, label: e.label })), created_at: now, updated_at: now };
    $("iSave").disabled = true;
    inspPend.push({ log, photos });
    try { await inspSavePend(); } catch (e) { inspPend.pop(); $("iSave").disabled = false; toast("保存できませんでした。端末の空き容量を確認してください"); return; }
    inspRememberName(by);
    const issueText = isCheck ? f.rows.filter((x) => x.r === "issue").map((x) => x.t + (x.m.trim() ? "（" + x.m.trim() + "）" : "")).join("／") : "";
    const sent = await inspFlush().catch(() => false);
    inspForm = null;
    toast(sent ? "記録しました" : "記録しました（電波がない時は、あとで自動で送ります）");
    if (toIssue) {
      try { sessionStorage.setItem(P + "prefill", `【点検で要対応】${item.title}${issueText ? "：" + issueText : ""}${f.memo.trim() ? "　" + f.memo.trim() : ""}`); } catch (e) { /* 無くても進める */ }
      goReplace(`#/new?b=${encodeURIComponent(bid)}&c=${encodeURIComponent(INSP_CAT[item.group] || "CAT-12")}`);
    } else goReplace("#/insp");
    inspSync(); // 一覧を最新に
  }
  draw();
}

/* ---------- 履歴 ---------- */
async function viewInspHist(main, itemId, bid) {
  if (!inspData) await inspLoadCache();
  const item = inspItem(itemId), bname = (((inspData && inspData.meta.buildings) || []).find((b) => b.id === bid) || {}).name;
  if (!item || !bname) { goReplace("#/insp"); return; }
  $("topTitle").textContent = "点検の履歴";
  const logs = inspLogs().filter((l) => l.item_id === itemId && l.building_id === bid).sort((a, b) => (a.done_on < b.done_on ? 1 : a.done_on > b.done_on ? -1 : 0));
  const RL = { ok: "異常なし", issue: "要対応あり", pending: "報告書待ち" };
  main.innerHTML = `<div class="formCard"><div class="inspTitle">${esc(item.title)}</div><div class="inspMeta"><span class="tag gray">${esc(bname)}</span> ${esc((item.cycle || {}).label || "")}</div></div>
    ${logs.length ? logs.map((l) => `<div class="formCard"><div class="recMeta"><span>${esc(l.done_on.replace(/-/g, "/"))}</span><span class="tag${l.result === "issue" ? " warn" : ""}">${RL[l.result] || ""}</span>${l._pending ? `<span class="tag gray">送信待ち</span>` : ""}</div>
      <div>${esc(l.done_by || "")}${l.vendor ? "　業者：" + esc(l.vendor) : ""}</div>
      ${(l.checks || []).filter((c) => c.r === "issue").map((c) => `<div class="mutedText">要対応：${esc(c.t)}${c.m ? "（" + esc(c.m) + "）" : ""}</div>`).join("")}
      ${(l.equip || []).length ? `<div class="mutedText">点検した機器：${l.equip.map((e) => esc(e.label)).join("／")}</div>` : ""}${l.memo ? `<div class="mutedText">${esc(l.memo)}</div>` : ""}${(l.photos || []).length ? `<div class="mutedText">写真 ${l.photos.length}枚</div>` : ""}</div>`).join("") : `<div class="empty">まだ記録がありません。</div>`}`;
}

/* ---------- ホーム・建物ページの入口 ---------- */
function inspBannerHtml() {
  if (!hasApi() || !inspData) return "";
  const c = inspCount(inspRows());
  if (!c.over) return "";
  return `<div class="inspBanner" data-insp-go="#/insp">${icon("info")}<span>期限が過ぎている点検が <b>${c.over}件</b> あります</span><span class="inspBannerGo">見る</span></div>`;
}
function inspBuildingCard(bid) {
  if (!hasApi() || !inspData) return "";
  const rows = inspRows().filter((x) => x.bid === bid);
  if (!rows.length) return "";
  const c = inspCount(rows);
  return `<div class="inspEntry" data-insp-go="#/insp?b=${encodeURIComponent(bid)}"><div class="catIcon">${icon("check")}</div><div class="catBody"><div class="catLabel">点検・メンテナンス</div><div class="catSub">建物の定期点検・メンテナンス</div></div>${c.over ? `<span class="chipN over">期限超過 ${c.over}</span>` : ""}${c.month ? `<span class="chipN month">今月 ${c.month}</span>` : ""}</div>`;
}
document.addEventListener("click", (e) => { const t = e.target.closest("[data-insp-go]"); if (t) go(t.dataset.inspGo); });
window.addEventListener("online", () => { inspFlush().catch(() => {}); });
let inspReady = null;
const inspEnsure = () => inspReady || (inspReady = inspLoadCache());
/** アプリの起動時に、app.js から呼ぶ（端末の控えを読み、窓口から最新を読む。失敗しても他の機能は使える） */
async function inspStart() {
  try {
    await inspEnsure();
    if (!hasApi()) return;
    const before = JSON.stringify(inspCount(inspRows()));
    if (await inspSync() && JSON.stringify(inspCount(inspRows())) !== before && ["home", "b"].includes(route().name)) render(); // ホームの帯・建物の入口を更新
  } catch (e) { console.warn("点検の準備に失敗", e); }
}
