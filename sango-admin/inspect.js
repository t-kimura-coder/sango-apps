"use strict";
/* 点検・メンテナンス（山郷の管理者用・閲覧）。窓口の inspectList から、項目マスターと全リーダーの記録を読んで、
   「建物 × 項目」の一覧で、期限の状況（超過・近い・先・未実施）を見せる。app.js の $, esc, apiCall, S, route, icon, fillIcons, toast を使う。 */

const IA = { mode: "list", data: null, group: "fire", near: false, sel: null, busy: false, err: "" };
const iaPad = (n) => String(n).padStart(2, "0");
const iaToday = () => { const d = new Date(); return `${d.getFullYear()}-${iaPad(d.getMonth() + 1)}-${iaPad(d.getDate())}`; };
const iaParse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const iaFmt = (d) => `${d.getFullYear()}-${iaPad(d.getMonth() + 1)}-${iaPad(d.getDate())}`;
const iaMD = (s) => { const d = iaParse(s); return `${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + "/" : ""}${d.getMonth() + 1}/${iaPad(d.getDate())}`; };
const iaDays = (a, b) => Math.round((iaParse(a) - iaParse(b)) / 86400000);
const iaDue = (item, last) => IC.due(item, last);   // 前回の実施日から次の期限（inspcore.js。リーダー・本社と同じ計算）

async function inspLoad() {
  if (!S.api || S.demo || IA.busy) return false;
  IA.busy = true;
  try {
    const j = await apiCall({ action: "inspectList" }, 45000);
    IA.data = { meta: j.meta || { buildings: [], groups: [] }, items: j.items || [], logs: j.logs || [], at: Date.now() };
    IA.err = "";
    iaBadge();
    if (route().name === "insp" && !(typeof MOBILE !== "undefined" && MOBILE && document.querySelector("details[open]"))) viewInsp($("main"));
    return true;
  } catch (e) { IA.err = String((e && e.message) || e); if (route().name === "insp" && !IA.data) viewInsp($("main")); return false; } finally { IA.busy = false; }
}
function iaCells() { // 項目×建物ごとの状況
  if (!IA.data) return [];
  const today = iaToday(), bn = {};
  (IA.data.meta.buildings || []).forEach((b) => { bn[b.id] = b.name; });
  const out = [];
  IA.data.items.filter((i) => i.enabled).forEach((item) => {
    (item.buildings || []).forEach((bid) => {
      if (!bn[bid]) return;
      const mine = IA.data.logs.filter((l) => l.item_id === item.id && l.building_id === bid);
      const done = mine.filter((l) => l.result !== "pending").sort((a, b) => (a.done_on < b.done_on ? 1 : a.done_on > b.done_on ? -1 : 0));
      const last = done[0] || null, due = iaDue(item, last && last.done_on);
      let st = "none", days = 0;
      const c = item.cycle || {}, thr = c.type === "months" ? Math.min(30, Math.max(5, Math.round((c.n || 12) * 30 * 0.25))) : 30; // 「近い」の目安：周期の4分の1（毎月なら約1週間前、1年なら30日前）
      if (due) { days = iaDays(due, today); st = days < 0 ? "over" : days <= thr ? "soon" : "ok"; }
      out.push({ item, bid, bname: bn[bid], last, due, st, days, logs: mine, waiting: mine.some((l) => l.result === "pending") });
    });
  });
  return out;
}
function iaBadge() {
  const el = $("inspBadge"); if (!el) return;
  const n = iaCells().filter((c) => c.st === "over").length;
  el.textContent = n; el.hidden = !n;
}

function viewInsp(main) {
  if (typeof MOBILE !== "undefined" && MOBILE) return mobileInsp(main); // スマホ表示（mobile.js）
  if (!S.api || S.demo) { main.innerHTML = `<div class="empty panel"><h3>点検は、窓口につながっている時に見られます</h3><p>設定の「窓口につなぐ」で、つないでください。</p></div>`; return; }
  if (!IA.data) {
    main.innerHTML = `<div class="empty panel"><h3>${IA.err ? "点検を読み込めませんでした" : "点検を読み込んでいます…"}</h3>${IA.err ? `<p>${esc(IA.err)}</p><p><button class="btn primary" id="iaRetry">もう一度読む</button></p>` : ""}</div>`;
    const r = $("iaRetry"); if (r) r.onclick = () => { IA.err = ""; viewInsp(main); };
    if (!IA.err) inspLoad();
    return;
  }
  if (IA.mode === "items" && !meAdmin()) IA.mode = "list";
  if (IA.mode === "items") { main.innerHTML = `<h2 class="pageTitle">点検</h2>${iaModeToggle("iaTabs")}${iaItemsHtml()}`; iaWireMode(main, () => viewInsp(main)); iaWireItems(main); return; }
  if (IA.mode === "plan") { main.innerHTML = `<h2 class="pageTitle">点検</h2>${iaModeToggle("iaTabs")}${iaPlanMatrixHtml()}`; iaWireMode(main, () => viewInsp(main)); main.querySelectorAll("[data-pe]").forEach((b) => (b.onclick = () => iaPlanEditor(b.dataset.pe))); return; }
  const all = iaCells(), today = iaToday();
  const over = all.filter((c) => c.st === "over").length, soon = all.filter((c) => c.st === "soon").length, none = all.filter((c) => c.st === "none").length;
  const ym = today.slice(0, 7), doneMonth = IA.data.logs.filter((l) => l.done_on.slice(0, 7) === ym && l.result !== "pending").length;
  const groups = (IA.data.meta.groups || []).filter((g) => all.some((c) => c.item.group === g.id));
  if (!groups.some((g) => g.id === IA.group) && groups.length) IA.group = groups[0].id;
  const cells = all.filter((c) => c.item.group === IA.group);
  const items = [...new Map(cells.map((c) => [c.item.id, c.item])).values()].sort((a, b) => a.no - b.no);
  const blds = (IA.data.meta.buildings || []).filter((b) => cells.some((c) => c.bid === b.id) && (!IA.near || cells.some((c) => c.bid === b.id && (c.st === "over" || c.st === "soon"))));
  const cellOf = (itemId, bid) => cells.find((c) => c.item.id === itemId && c.bid === bid);
  const sel = IA.sel && all.find((c) => c.item.id === IA.sel.i && c.bid === IA.sel.b);
  const label = (c) => (c.st === "over" ? `${iaMD(c.due)}<small>超過</small>` : c.st === "none" ? "未実施" : `${iaMD(c.due)}`);
  main.innerHTML = `<h2 class="pageTitle">点検</h2>${iaModeToggle("iaTabs")}
    ${over ? `<div class="iaBanner">期限が過ぎている点検が <b>${over}件</b> あります</div>` : ""}
    <div class="kpis"><div class="kpi iaK over"><small>期限超過</small><div class="v">${over}</div></div><div class="kpi iaK soon"><small>期限が近い</small><div class="v">${soon}</div></div><div class="kpi iaK ok"><small>今月の記録</small><div class="v">${doneMonth}</div></div><div class="kpi iaK none"><small>未実施</small><div class="v">${none}</div></div></div>
    <div class="iaWrap"><div class="panel iaMain">
      <div class="iaTabs">${groups.map((g) => `<button class="iaTab${IA.group === g.id ? " on" : ""}" data-g="${esc(g.id)}">${esc(g.name)}</button>`).join("")}<label class="iaNear"><input type="checkbox" id="iaNear" ${IA.near ? "checked" : ""}> 期限が近い・超過だけ</label></div>
      <div class="iaScroll"><table class="iaTable"><tr><th>建物</th>${items.map((i) => `<th title="${esc(i.title)}">${esc(i.title.length > 12 ? i.title.slice(0, 12) + "…" : i.title)}${i.legal ? `<small class="iaLegal">法定</small>` : ""}</th>`).join("")}</tr>
        ${blds.map((b) => `<tr><td class="iaB">${esc(b.name)}</td>${items.map((i) => { const c = cellOf(i.id, b.id); return c ? `<td class="iaC ${c.st}${sel && sel.item.id === i.id && sel.bid === b.id ? " sel" : ""}" data-i="${esc(i.id)}" data-b="${esc(b.id)}">${label(c)}</td>` : `<td class="iaC na"></td>`; }).join("")}</tr>`).join("") || `<tr><td colspan="${items.length + 1}" class="iaB">該当する建物はありません</td></tr>`}</table></div>
      <div class="note">色：赤＝期限超過／黄土＝期限が近い／緑＝先／グレー＝未実施／斜線＝その項目のない建物。数字は次の期限。セルを押すと、右に履歴が出ます。</div></div>
    <div class="panel iaSide">${sel ? iaSide(sel) : `<div class="note">左の一覧のセルを押すと、その点検の履歴が出ます。</div>`}</div></div>`;
  main.querySelectorAll(".iaTab[data-g]").forEach((b) => (b.onclick = () => { IA.group = b.dataset.g; viewInsp(main); }));
  iaWireMode(main, () => viewInsp(main));
  $("iaNear").onchange = (e) => { IA.near = e.target.checked; viewInsp(main); };
  main.querySelectorAll(".iaC[data-i]").forEach((el) => (el.onclick = () => { IA.sel = { i: el.dataset.i, b: el.dataset.b }; viewInsp(main); }));
  main.querySelectorAll("[data-iamap]").forEach((el) => (el.onclick = () => iaOpenMap(el.dataset.iamap, +el.dataset.iano)));
  main.querySelectorAll("[data-photo]").forEach((el) => (el.onclick = async () => {
    try { const x = await apiCall({ action: "getPhoto", name: el.dataset.photo }, 60000); const bin = atob(x.data), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); showLightbox(URL.createObjectURL(new Blob([u8], { type: x.mime || "image/jpeg" }))); }
    catch (e) { toast("写真を読めませんでした"); }
  }));
}
/** 点検の一覧から、その建物の図を開く（その点検の機器だけを濃く。見るだけ） */
async function iaOpenMap(bid, no) {
  const info = typeof fpaInfo === "function" ? await fpaInfo() : null;
  if (!(info && info.buildings && info.buildings[bid]) || typeof fpOpen !== "function") return toast("この建物の図面は、まだありません");
  const b = (IA.data.meta.buildings || []).find((x) => x.id === bid) || { name: bid };
  fpOpen({ title: b.name, load: () => fpaLoad(bid), noPlan: true, ...fpaPinOpts(bid), focus: no });
}
function iaSide(c) {
  const RL = { ok: "異常なし", issue: "要対応あり", pending: "報告書待ち" };
  const logs = c.logs.slice().sort((a, b) => (a.done_on < b.done_on ? 1 : a.done_on > b.done_on ? -1 : 0));
  return `<h3>${esc(c.bname)} × ${esc(c.item.title)}</h3><p><button class="btn" data-iamap="${esc(c.bid)}" data-iano="${c.item.no}">図で場所を見る</button></p><div class="note">${esc((c.item.cycle || {}).label || "")}／${c.item.legal ? "法定" : "任意"}／${esc(c.item.who || "")}</div>
    <p><b>次の期限：</b>${c.due ? `${c.due.replace(/-/g, "/")}${c.st === "over" ? `（${-c.days}日超過）` : ""}` : "まだ記録がありません"}</p>${c.item.note ? `<div class="note">${esc(c.item.note)}</div>` : ""}
    <h4>実施の履歴</h4>${logs.length ? logs.map((l) => `<div class="iaLog"><div><b>${esc(l.done_on.replace(/-/g, "/"))}</b> <span class="chip ${l.result === "issue" ? "todo" : l.result === "pending" ? "" : "done"}">${RL[l.result] || ""}</span></div>
      <div>${esc(l.done_by || "")}${l.vendor ? "　業者：" + esc(l.vendor) : ""}</div>${(l.equip || []).length ? `<div class="note">点検した機器：${l.equip.map((e) => esc(e.label)).join("／")}</div>` : ""}${(l.checks || []).filter((x) => x.r === "issue").map((x) => `<div class="note">要対応：${esc(x.t)}${x.m ? "（" + esc(x.m) + "）" : ""}</div>`).join("")}${l.memo ? `<div class="note">${esc(l.memo)}</div>` : ""}
      ${(l.photos || []).map((p, n) => `<button class="btn iaPh" data-photo="${esc(p)}">写真${n + 1}</button>`).join("")}</div>`).join("") : `<div class="note">まだ記録がありません</div>`}`;
}

/* ---------- 年間予定（何月に何をやるか） ---------- */
const iaPlanOf = (it) => IC.planOf(it);   // 標準の予定月（inspcore.js。リーダー・本社と同じ）
/** 今月から12か月の、(項目×月) の状況。done＝その月に、全部の建物で記録がある／part＝一部 */
function iaPlanModel() {
  const today = iaToday(), y0 = +today.slice(0, 4), m0 = +today.slice(5, 7);
  const bn = {}; (IA.data.meta.buildings || []).forEach((b) => { bn[b.id] = b.name; });
  const months = [];
  for (let k = 0; k < 12; k++) { const idx = m0 - 1 + k, m = (idx % 12) + 1, y = y0 + Math.floor(idx / 12); months.push({ m, y, ym: `${y}-${iaPad(m)}`, now: k === 0 }); }
  const items = IA.data.items.filter((i) => i.enabled).sort((a, b) => a.no - b.no).map((it) => {
    const bl = (it.buildings || []).filter((b) => bn[b]);
    const cells = months.map((mo) => {
      if (iaPlanOf(it).indexOf(mo.m) < 0) return null;
      const done = bl.filter((b) => IA.data.logs.some((l) => l.item_id === it.id && l.building_id === b && l.result !== "pending" && String(l.done_on).slice(0, 7) === mo.ym)).length;
      return { done, total: bl.length, st: bl.length && done === bl.length ? "done" : done ? "part" : "todo" };
    });
    return { it, bl: bl.map((b) => bn[b]), cells, monthly: iaPlanOf(it).length === 12 };
  });
  return { months, items };
}
/** PC：項目 × 月の表 */
function iaPlanMatrixHtml() {
  const { months, items } = iaPlanModel();
  const groups = (IA.data.meta.groups || []).filter((g) => items.some((x) => x.it.group === g.id));
  const head = `<tr><th class="iaPI">項目</th>${months.map((mo) => `<th class="${mo.now ? "iaNow" : ""}">${mo.m}月${mo.y !== months[0].y && mo.m === 1 ? `<small>${mo.y}</small>` : ""}</th>`).join("")}</tr>`;
  const body = groups.map((g) => `<tr><td class="iaGrp" colspan="13">${esc(g.name)}</td></tr>` + items.filter((x) => x.it.group === g.id).map((x) => `<tr><td class="iaPI" title="${esc(x.bl.join("・"))}"><b>${esc(x.it.title)}</b>${x.it.legal ? `<small class="iaLegal">法定</small>` : ""}<small>${x.bl.length >= 6 ? `全${x.bl.length}棟` : esc(x.bl.join("・"))}</small>${meAdmin() ? `<button class="iaEdit" data-pe="${esc(x.it.id)}">予定月を変える${x.it.plan_custom ? "（変更済み）" : ""}</button>` : x.it.plan_custom ? `<small>予定月：変更済み</small>` : ""}</td>${x.cells.map((c, i) => (c ? `<td class="iaPC ${c.st}${months[i].now ? " iaNow" : ""}">${c.st === "done" ? "✓" : c.st === "part" ? `${c.done}/${c.total}` : "●"}</td>` : `<td class="${months[i].now ? "iaNow" : ""}"></td>`)).join("")}</tr>`).join("")).join("");
  return `<div class="panel"><div class="note" style="margin-bottom:8px">「標準の予定月」です（実際の期限は、前回の実施日から計算され、「期限の一覧」に出ます）。●＝予定、✓＝その月に全部の建物で記録あり、数字＝一部の建物だけ記録あり。毎月のものは、全部の月に●が並びます。</div><div class="iaScroll"><table class="iaTable iaPlan">${head}${body}</table></div></div>`;
}
/** スマホ：月ごとの一覧（毎月のものは、まとめて1行） */
function iaPlanListHtml() {
  const { months, items } = iaPlanModel();
  const monthly = items.filter((x) => x.monthly);
  let h = `<div class="mBox"><div class="mH">毎月やること</div><div class="mText" style="font-size:13px">${monthly.map((x) => esc(x.it.title)).join("／")}</div></div>`;
  months.forEach((mo, k) => {
    const list = items.map((x) => ({ x, c: x.cells[k] })).filter((o) => o.c && !o.x.monthly);
    h += `<div class="mBox${mo.now ? " iaNowBox" : ""}"><div class="mH" style="font-size:15px">${mo.m}月${mo.now ? "（今月）" : mo.y !== months[0].y ? `（${mo.y}年）` : ""}</div>${list.map((o) => `<div class="mLog"><b>${esc(o.x.it.title)}</b>${o.x.it.legal ? ` <span class="tag warn">法定</span>` : ""} <span class="note">${o.x.bl.length >= 6 ? `全${o.x.bl.length}棟` : esc(o.x.bl.join("・"))}</span>${o.c.st === "done" ? ` <b style="color:#2f6b45">✓</b>` : o.c.st === "part" ? ` <b style="color:#2f6b45">${o.c.done}/${o.c.total}</b>` : ""}</div>`).join("") || `<div class="note">毎月のもの以外は、ありません</div>`}</div>`;
  });
  return h;
}
const iaModeToggle = (cls) => `<div class="${cls}"><button class="${cls === "mChips" ? "mChip" : "iaTab"}${IA.mode === "list" ? " on" : ""}" data-iamode="list">期限の一覧</button><button class="${cls === "mChips" ? "mChip" : "iaTab"}${IA.mode === "plan" ? " on" : ""}" data-iamode="plan">年間予定</button>${cls !== "mChips" && meAdmin() ? `<button class="iaTab${IA.mode === "items" ? " on" : ""}" data-iamode="items">項目の管理</button>` : ""}</div>`;
function iaWireMode(root, redraw) { root.querySelectorAll("[data-iamode]").forEach((b) => (b.onclick = () => { IA.mode = b.dataset.iamode; redraw(); })); }

/** 予定月の変更（管理者）：12か月のチェック。窓口に保存され、リーダーにも・期限の計算にも反映される */
function iaPlanEditor(itemId) {
  const it = IA.data.items.find((x) => x.id === itemId); if (!it) return;
  const cur = new Set(iaPlanOf(it)), def = it.plan_default || [];
  const root = document.createElement("div"); root.className = "fbBack";
  root.innerHTML = `<div class="fbBox"><h3>予定月を変える</h3><p><b>${esc(it.title)}</b></p>
    <div class="iaMonths">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => `<label class="iaMonth"><input type="checkbox" value="${m}" ${cur.has(m) ? "checked" : ""}>${m}月</label>`).join("")}</div>
    <p class="note">チェックした月が、その点検の予定月です（期限は、その月の末日）。12か月すべてにすると「毎月」になります。標準：${def.length === 12 ? "毎月" : def.map((m) => m + "月").join("・")}</p><p id="peMsg" class="note" style="color:#b4531c"></p>
    <p><button class="btn primary" id="peSave">保存</button> ${it.plan_custom ? `<button class="btn" id="peReset">標準に戻す</button> ` : ""}<button class="btn" id="peNo">やめる</button></p></div>`;
  document.body.appendChild(root);
  const done = async (plan) => {
    root.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      const j = await apiCall({ action: "inspectPlanSave", item_id: itemId, plan }, 30000);
      it.plan = j.result.plan; it.plan_custom = j.result.custom; root.remove(); toast(plan ? "予定月を保存しました" : "標準に戻しました");
      if (route().name === "insp") viewInsp($("main"));
    } catch (e) { root.querySelector("#peMsg").textContent = "保存できませんでした：" + String((e && e.message) || e).slice(0, 60); root.querySelectorAll("button").forEach((b) => (b.disabled = false)); }
  };
  root.querySelector("#peNo").onclick = () => root.remove();
  root.querySelector("#peSave").onclick = () => { const ms = [...root.querySelectorAll(".iaMonth input:checked")].map((x) => +x.value); if (!ms.length) { root.querySelector("#peMsg").textContent = "1か月以上、選んでください"; return; } done(ms); };
  const rs = root.querySelector("#peReset"); if (rs) rs.onclick = () => done(null);
}

/* ---------- 項目の管理（山郷の管理者）：使わない（無効）／この棟では不要（非表示）。それ以外の変更は、本社に依頼 ---------- */
function iaItemsHtml() {
  const bn = {}; (IA.data.meta.buildings || []).forEach((b) => { bn[b.id] = b.name; });
  const groups = (IA.data.meta.groups || []);
  const row = (it) => {
    const off = !it.enabled;
    const chips = (it.buildings_all || it.buildings || []).filter((b) => bn[b]).map((b) => { const hid = (it.hidden_buildings || []).indexOf(b) >= 0; return `<button class="iaBChip${hid ? " off" : ""}" data-ihide="${esc(it.id)}" data-b="${esc(b)}" title="${hid ? "押すと、この棟でも点検します" : "押すと、この棟では不要にします（非表示）"}">${esc(bn[b])}${hid ? "（不要）" : ""}</button>`; }).join("");
    return `<div class="iaItemRow${off ? " off" : ""}"><div class="iaItemHead"><b>${esc(it.title)}</b>${it.legal ? `<small class="iaLegal">法定</small>` : ""}<small>${esc((it.cycle || {}).label || "")}${it.who ? "／" + esc(it.who) : ""}</small>${off ? `<span class="chip">使っていません</span>` : ""}</div>
      <div class="iaBChips">${chips || `<span class="note">対象の棟がありません</span>`}</div>
      <div class="iaItemAct">${it.disabled_custom || off ? `<button class="btn" data-ion="${esc(it.id)}">使う（有効に戻す）</button>` : `<button class="btn" data-ioff="${esc(it.id)}">この項目を使わない（無効）</button>`}<button class="btn" data-ireq="${esc(it.id)}">本社に修正を依頼</button></div></div>`;
  };
  return `<div class="panel"><div class="note" style="margin-bottom:8px">ここでできるのは、<b>使わない（無効）</b>と、<b>棟ごとの不要（非表示）</b>です。どちらも、リーダーの画面・期限・お知らせから外れます（記録は消えません。いつでも戻せます）。<br>項目の追加・周期・対象の棟・項目名の変更などは、「本社に修正を依頼」から送ってください（本社にメールが届きます）。</div>
    <div class="iaItemTop"><button class="btn" data-ireq="">項目の追加・そのほかの修正を、本社に依頼する</button></div>
    ${groups.map((g) => { const its = IA.data.items.filter((i) => i.group === g.id).sort((a, b) => a.no - b.no); return its.length ? `<div class="iaGrp2">${esc(g.name)}</div>${its.map(row).join("")}` : ""; }).join("")}</div>`;
}
async function iaItemSave(it, disabled, hidden) {
  const j = await apiCall({ action: "inspectItemSave", item_id: it.id, disabled, hidden }, 30000);
  const r = j.result;
  it.hidden_buildings = r.hidden; it.disabled_custom = r.disabled; it.enabled = !r.disabled;
  it.buildings = (it.buildings_all || []).filter((b) => r.hidden.indexOf(b) < 0);
  iaBadge();
}
function iaWireItems(main) {
  const redraw = () => viewInsp(main);
  const run = async (it, disabled, hidden, msg) => { try { await iaItemSave(it, disabled, hidden); toast(msg); } catch (e) { toast("保存できませんでした：" + String((e && e.message) || e).slice(0, 50)); } redraw(); };
  const find = (id) => IA.data.items.find((x) => x.id === id);
  main.querySelectorAll("[data-ihide]").forEach((b) => (b.onclick = () => { const it = find(b.dataset.ihide); const h = new Set(it.hidden_buildings || []); h.has(b.dataset.b) ? h.delete(b.dataset.b) : h.add(b.dataset.b); run(it, !!it.disabled_custom, [...h], h.has(b.dataset.b) ? "この棟では不要にしました" : "この棟でも点検するようにしました"); }));
  main.querySelectorAll("[data-ioff]").forEach((b) => (b.onclick = () => { const it = find(b.dataset.ioff); if (confirm(`「${it.title}」を使わない（無効）にします。\nリーダーの画面・期限・お知らせから外れます（記録は消えません。いつでも戻せます）。`)) run(it, true, it.hidden_buildings || [], "使わない項目にしました"); }));
  main.querySelectorAll("[data-ion]").forEach((b) => (b.onclick = () => { const it = find(b.dataset.ion); run(it, false, it.hidden_buildings || [], "使う項目に戻しました"); }));
  main.querySelectorAll("[data-ireq]").forEach((b) => (b.onclick = () => iaRequest(find(b.dataset.ireq))));
}
/** 本当の修正（追加・周期・棟割り当て・名前など）の依頼：窓口が、本社（木村）にメールで知らせる */
function iaRequest(it) {
  const root = document.createElement("div"); root.className = "fbBack";
  root.innerHTML = `<div class="fbBox"><h3>点検の項目の修正を、本社に依頼する</h3><p>${it ? `<b>${esc(it.title)}</b>` : "（項目の追加・そのほか）"}</p>
    <textarea id="rqText" maxlength="1000" placeholder="${it ? "例）周期を、毎月から3か月ごとに変えたい／春の対象から外したい／名前を直したい" : "例）「○○の点検」を、毎年4月に、全部の棟で追加したい"}"></textarea><p id="rqMsg" class="note" style="color:#b4531c"></p>
    <p><button class="btn primary" id="rqSend">送る</button> <button class="btn" id="rqNo">やめる</button></p></div>`;
  document.body.appendChild(root);
  root.querySelector("#rqNo").onclick = () => root.remove();
  root.querySelector("#rqSend").onclick = async () => {
    const t = root.querySelector("#rqText").value.trim(); if (!t) { root.querySelector("#rqMsg").textContent = "内容を入れてください"; return; }
    root.querySelector("#rqSend").disabled = true;
    try { await apiCall({ action: "feedback", kind: "点検の修正依頼", text: `【点検の項目${it ? "：" + it.title + "（" + it.id + "）" : ""}】\n${t}`, app: "admin", app_version: APP_VERSION }, 30000); root.remove(); toast("本社に送りました"); }
    catch (e) { root.querySelector("#rqMsg").textContent = "送れませんでした：" + String((e && e.message) || e).slice(0, 60); root.querySelector("#rqSend").disabled = false; }
  };
}
