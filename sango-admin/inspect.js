"use strict";
/* 点検・メンテナンス（山郷の管理者用・閲覧）。窓口の inspectList から、項目マスターと全リーダーの記録を読んで、
   「建物 × 項目」の一覧で、期限の状況（超過・近い・先・未実施）を見せる。app.js の $, esc, apiCall, S, route, icon, fillIcons, toast を使う。 */

const IA = { data: null, group: "fire", near: false, sel: null, busy: false, err: "" };
const iaPad = (n) => String(n).padStart(2, "0");
const iaToday = () => { const d = new Date(); return `${d.getFullYear()}-${iaPad(d.getMonth() + 1)}-${iaPad(d.getDate())}`; };
const iaParse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
const iaFmt = (d) => `${d.getFullYear()}-${iaPad(d.getMonth() + 1)}-${iaPad(d.getDate())}`;
const iaMD = (s) => { const d = iaParse(s); return `${d.getMonth() + 1}/${iaPad(d.getDate())}`; };
const iaDays = (a, b) => Math.round((iaParse(a) - iaParse(b)) / 86400000);
function iaAddMonths(s, n) {
  const d = iaParse(s), day = d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  t.setDate(Math.min(day, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return iaFmt(t);
}
function iaDue(item, last) { // 前回の実施日から次の期限（リーダー用アプリと同じ計算）。記録がなければ null
  if (!last) return null;
  const c = item.cycle || {};
  if (c.type === "season" && Array.isArray(c.months) && c.months.length) {
    const ly = iaParse(last).getFullYear(), ds = [];
    for (let y = ly - 1; y <= ly + 3; y++) c.months.forEach((m) => ds.push(iaFmt(new Date(y, m, 0))));
    ds.sort();
    const cover = ds.find((d) => d >= last);
    return ds.find((d) => d > cover) || null;
  }
  return iaAddMonths(last, c.n || 12);
}

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
  main.innerHTML = `<h2 class="pageTitle">点検</h2>
    ${over ? `<div class="iaBanner">期限が過ぎている点検が <b>${over}件</b> あります</div>` : ""}
    <div class="kpis"><div class="kpi iaK over"><small>期限超過</small><div class="v">${over}</div></div><div class="kpi iaK soon"><small>期限が近い</small><div class="v">${soon}</div></div><div class="kpi iaK ok"><small>今月の記録</small><div class="v">${doneMonth}</div></div><div class="kpi iaK none"><small>未実施</small><div class="v">${none}</div></div></div>
    <div class="iaWrap"><div class="panel iaMain">
      <div class="iaTabs">${groups.map((g) => `<button class="iaTab${IA.group === g.id ? " on" : ""}" data-g="${esc(g.id)}">${esc(g.name)}</button>`).join("")}<label class="iaNear"><input type="checkbox" id="iaNear" ${IA.near ? "checked" : ""}> 期限が近い・超過だけ</label></div>
      <div class="iaScroll"><table class="iaTable"><tr><th>建物</th>${items.map((i) => `<th title="${esc(i.title)}">${esc(i.title.length > 12 ? i.title.slice(0, 12) + "…" : i.title)}${i.legal ? `<small class="iaLegal">法定</small>` : ""}</th>`).join("")}</tr>
        ${blds.map((b) => `<tr><td class="iaB">${esc(b.name)}</td>${items.map((i) => { const c = cellOf(i.id, b.id); return c ? `<td class="iaC ${c.st}${sel && sel.item.id === i.id && sel.bid === b.id ? " sel" : ""}" data-i="${esc(i.id)}" data-b="${esc(b.id)}">${label(c)}</td>` : `<td class="iaC na"></td>`; }).join("")}</tr>`).join("") || `<tr><td colspan="${items.length + 1}" class="iaB">該当する建物はありません</td></tr>`}</table></div>
      <div class="note">色：赤＝期限超過／黄土＝期限が近い／緑＝先／グレー＝未実施／斜線＝その項目のない建物。数字は次の期限。セルを押すと、右に履歴が出ます。</div></div>
    <div class="panel iaSide">${sel ? iaSide(sel) : `<div class="note">左の一覧のセルを押すと、その点検の履歴が出ます。</div>`}</div></div>`;
  main.querySelectorAll(".iaTab").forEach((b) => (b.onclick = () => { IA.group = b.dataset.g; viewInsp(main); }));
  $("iaNear").onchange = (e) => { IA.near = e.target.checked; viewInsp(main); };
  main.querySelectorAll(".iaC[data-i]").forEach((el) => (el.onclick = () => { IA.sel = { i: el.dataset.i, b: el.dataset.b }; viewInsp(main); }));
  main.querySelectorAll("[data-photo]").forEach((el) => (el.onclick = async () => {
    try { const x = await apiCall({ action: "getPhoto", name: el.dataset.photo }, 60000); const bin = atob(x.data), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); showLightbox(URL.createObjectURL(new Blob([u8], { type: x.mime || "image/jpeg" }))); }
    catch (e) { toast("写真を読めませんでした"); }
  }));
}
function iaSide(c) {
  const RL = { ok: "異常なし", issue: "要対応あり", pending: "報告書待ち" };
  const logs = c.logs.slice().sort((a, b) => (a.done_on < b.done_on ? 1 : a.done_on > b.done_on ? -1 : 0));
  return `<h3>${esc(c.bname)} × ${esc(c.item.title)}</h3><div class="note">${esc((c.item.cycle || {}).label || "")}／${c.item.legal ? "法定" : "任意"}／${esc(c.item.who || "")}</div>
    <p><b>次の期限：</b>${c.due ? `${c.due.replace(/-/g, "/")}${c.st === "over" ? `（${-c.days}日超過）` : ""}` : "まだ記録がありません"}</p>${c.item.note ? `<div class="note">${esc(c.item.note)}</div>` : ""}
    <h4>実施の履歴</h4>${logs.length ? logs.map((l) => `<div class="iaLog"><div><b>${esc(l.done_on.replace(/-/g, "/"))}</b> <span class="chip ${l.result === "issue" ? "todo" : l.result === "pending" ? "" : "done"}">${RL[l.result] || ""}</span></div>
      <div>${esc(l.done_by || "")}${l.vendor ? "　業者：" + esc(l.vendor) : ""}</div>${(l.checks || []).filter((x) => x.r === "issue").map((x) => `<div class="note">要対応：${esc(x.t)}${x.m ? "（" + esc(x.m) + "）" : ""}</div>`).join("")}${l.memo ? `<div class="note">${esc(l.memo)}</div>` : ""}
      ${(l.photos || []).map((p, n) => `<button class="btn iaPh" data-photo="${esc(p)}">写真${n + 1}</button>`).join("")}</div>`).join("") : `<div class="note">まだ記録がありません</div>`}`;
}
