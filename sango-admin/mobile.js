"use strict";
/* ---------- スマホ用の画面（管理者ビューア） ----------
   スマホでは、窓口（GAS）から読んだものだけで、「報告・依頼を事前に確認する」「メモを書く」ことに絞る。
   下のタブは 症例／依頼／点検／設定。まとめ・金額や原因の編集・CSVは、PC表示で行う。
   PC用の画面と同じ URL で、端末に合わせて切り替える（設定で手動にもできる：getLS("viewMode") = "mobile" | "pc"）。
   app.js の S, adm, isHidden, isTodo, stateChip, titleOf, photoUrl, showLightbox, saveItem, canEdit, route, loadApiRecords などを使う。 */

function viewMode() {
  const v = getLS("viewMode");
  if (v === "mobile" || v === "pc") return v;
  if (typeof canPickFolder !== "undefined" && canPickFolder) return "pc";   // フォルダを読める PC（Edge・Chrome）
  const touch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  return touch || window.innerWidth < 760 ? "mobile" : "pc";
}
let MOBILE = false;
try { MOBILE = viewMode() === "mobile"; } catch (e) { MOBILE = false; }
if (MOBILE) document.body.classList.add("mobileMode");

const MF = { mode: "todo", q: "", reqAll: false, inspAll: false, more: 60 };
const mTabOf = (n) => (n === "r" ? (MF.from || "list") : n === "help" ? "settings" : n);

function mobileRender() {
  const r = route(), main = $("main");
  const tab = mTabOf(r.name);
  document.querySelectorAll("#mTabs a").forEach((a) => a.classList.toggle("on", a.dataset.nav === tab));
  $("mTitle").textContent = { map: "山郷の敷地", list: "症例", req: "依頼", insp: "点検", settings: "設定", r: "症例の確認", help: "使い方" }[r.name] || "山郷サポート";
  $("mBack").hidden = !(r.name === "r" || r.name === "help");
  if (r.name === "map") viewMap(main);
  else if (r.name === "list") mList(main);
  else if (r.name === "req") mReq(main);
  else if (r.name === "r") mDetail(main, r.id);
  else if (r.name === "insp") viewInsp(main);
  else if (r.name === "settings") viewSettings(main);
  else if (r.name === "help") viewHelp(main);
  else location.hash = "#/map";
  fillIcons(document.body);
}

const mNeedApi = () => `<div class="empty panel"><h3>${S.api && !S.syncedAt && !S.syncError ? "読み込んでいます…" : S.syncError ? "つながりません" : "まだつながっていません"}</h3><p>${S.syncError ? esc(S.syncError) : "「設定」で、あなたの合言葉を入れてください。"}</p><p><a class="btn primary" href="#/settings">設定を開く</a></p></div>`;
const mCard = (r, from) => `<a class="mCard${r.urgent ? " urgent" : ""}" href="#/r/${encodeURIComponent(r.id)}" data-from="${from}"><div class="mTop"><b>${esc(r.building)}｜${esc(r.category)}</b><span class="mDate">${fmtDate(r.t)}</span></div><div class="mWhat">${esc(titleOf(r))}</div><div class="mMeta">${stateChip(r)}<span>${esc(r.sender)}</span></div></a>`;
function mWire(main, from) { main.querySelectorAll(".mCard").forEach((el) => (el.onclick = () => { MF.from = from; })); }

/* ---------- 症例の一覧 ---------- */
function mList(main) {
  if (!S.records.length) { main.innerHTML = mNeedApi(); return; }
  const q = MF.q.trim().toLowerCase();
  let list = S.records.filter((r) => !isHidden(r) && (MF.mode === "past" ? r.src === "past" : r.src === "new") && (MF.mode !== "todo" || isTodo(r)));
  if (q) list = list.filter((r) => [r.what, r.how, r.vendor, r.reporter, r.sender, r.building, r.category, adm(r).memo].join(" ").toLowerCase().includes(q));
  list.sort((a, b) => b.t - a.t);
  const nTodo = S.records.filter(isTodo).length;
  main.innerHTML = `<div class="mChips">${[["todo", `未整理 ${nTodo}`], ["all", "新しい症例"], ["past", "過去"]].map(([k, l]) => `<button class="mChip${MF.mode === k ? " on" : ""}" data-m="${k}">${l}</button>`).join("")}</div>
    <input id="mQ" class="mSearch" type="search" placeholder="キーワードで探す（建物・内容など）" value="${esc(MF.q)}">
    ${list.slice(0, MF.more).map((r) => mCard(r, "list")).join("") || `<div class="empty panel">該当する症例はありません</div>`}
    ${list.length > MF.more ? `<button class="btn" id="mMore" style="width:100%">あと ${list.length - MF.more}件を表示</button>` : ""}`;
  main.querySelectorAll(".mChip").forEach((b) => (b.onclick = () => { MF.mode = b.dataset.m; MF.more = 60; mList(main); }));
  $("mQ").oninput = (e) => { MF.q = e.target.value; clearTimeout(MF.t); MF.t = setTimeout(() => { mList(main); const i = $("mQ"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 350); };
  const more = $("mMore"); if (more) more.onclick = () => { MF.more += 60; mList(main); };
  mWire(main, "list");
}

/* ---------- 依頼の一覧 ---------- */
function mReq(main) {
  if (!S.records.length) { main.innerHTML = mNeedApi(); return; }
  const all = S.records.filter((r) => r.req && !isHidden(r));
  const open = all.filter((r) => adm(r).status !== "done");
  const list = (MF.reqAll ? all : open).slice().sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.t - a.t);
  main.innerHTML = `<div class="mChips"><button class="mChip${MF.reqAll ? "" : " on"}" data-a="0">対応中・依頼中 ${open.length}</button><button class="mChip${MF.reqAll ? " on" : ""}" data-a="1">完了も見る</button></div>
    ${list.map((r) => mCard(r, "req")).join("") || `<div class="empty panel">${MF.reqAll ? "依頼はありません" : "いま対応が必要な依頼はありません"}</div>`}`;
  main.querySelectorAll(".mChip").forEach((b) => (b.onclick = () => { MF.reqAll = b.dataset.a === "1"; mReq(main); }));
  mWire(main, "req");
}

/* ---------- 症例の詳細（確認とメモ） ---------- */
async function mDetail(main, id) {
  const r = S.records.find((x) => x.id === id);
  if (!r) { main.innerHTML = `<div class="empty panel">その症例は見つかりません。<br><a class="btn" href="#/list">一覧へ</a></div>`; return; }
  const a = adm(r), edit = canEdit(), tok = viewTok;
  const STATE = { "": r.req ? "依頼中" : "未整理", doing: "対応中", done: r.req ? "完了" : "整理済み" };
  main.innerHTML = `<div class="mBox"><div class="mTop"><b>${esc(r.building)}｜${esc(r.category)}</b><span class="mDate">${fmtDate(r.t)} ${fmtTime(r.t)}</span></div>${placeHtml(r)}<div class="mMeta">${stateChip(r)}<span>${esc(r.sender)}${r.reporter ? "（報告した人：" + esc(r.reporter) + "）" : ""}</span></div></div>
    <div class="mBox"><div class="mH">何が起きたか</div><div class="mText">${esc(r.what)}</div></div>
    <div class="mBox"><div class="mH">どう対応したか</div><div class="mText">${esc(r.how || "（まだ書かれていません）")}</div>${r.vendor ? `<div class="mH" style="margin-top:8px">業者</div><div class="mText">${esc(r.vendor)}</div>` : ""}</div>
    ${r.photos.length ? `<div class="mBox"><div class="mH">写真 ${r.photos.length}枚</div><div class="photoGrid" id="mPhotos"></div></div>` : ""}
    ${r.req && r.src === "new" && S.api && !S.demo ? `<div class="mBox" id="reqBox"><div class="mH">手配の状況</div><div class="note">読み込んでいます…</div></div>` : ""}
    <div class="mBox"><div class="mH">管理者の整理</div><div class="mMeta"><span>状態：${esc(STATE[a.status] || "")}</span>${a.cause ? `<span>原因：${esc(a.cause)}</span>` : ""}${a.amount !== "" && a.amount != null ? `<span>金額：${esc(yen(a.amount))}</span>` : ""}</div>
      <div class="mH" style="margin-top:10px">メモ</div><textarea id="mMemo" class="mMemo" maxlength="500" ${edit ? "" : "disabled"} placeholder="${edit ? "気づいたこと・伝えること" : ""}">${esc(a.memo)}</textarea>
      ${edit ? `<button class="btn primary" id="mSave" style="width:100%;margin-top:8px">メモを保存</button>` : `<div class="note">メモを書くには、管理者の合言葉でつないでください。</div>`}
      <div class="note" style="margin-top:6px">${a.at ? `最終更新 ${fmtDate(a.at)} ${fmtTime(a.at)}${a.by ? "　" + esc(a.by) : ""}` : ""}</div>
      <div class="note">金額・原因・「整理済み」は、PC表示で行います。</div></div>`;
  fillReqStatus(id);
  const save = $("mSave");
  if (save) save.onclick = async () => {
    save.disabled = true;
    const ok = await saveItem(r, { memo: $("mMemo").value.trim() });
    if (tok === viewTok && route().name === "r" && route().id === id) { if (ok) mDetail(main, id); else save.disabled = false; }
  };
  const grid = $("mPhotos");
  if (grid) for (const name of r.photos) {
    const src = await photoUrl(name);
    if (tok !== viewTok || !grid.isConnected) return;
    if (!src) continue;
    const im = document.createElement("img"); im.alt = ""; im.src = src; im.onclick = () => showLightbox(src); grid.appendChild(im);
  }
}

/* ---------- 点検（一覧と履歴） ---------- */
function mobileInsp(main) {
  if (!IA.data) {
    main.innerHTML = `<div class="empty panel"><h3>${IA.err ? "点検を読み込めませんでした" : "点検を読み込んでいます…"}</h3>${IA.err ? `<p>${esc(IA.err)}</p><p><button class="btn primary" id="iaRetry">もう一度読む</button></p>` : ""}</div>`;
    const b = $("iaRetry"); if (b) b.onclick = () => { IA.err = ""; mobileInsp(main); };
    if (!IA.err) inspLoad();
    return;
  }
  if (IA.mode === "plan") { main.innerHTML = iaModeToggle("mChips") + iaPlanListHtml(); iaWireMode(main, () => mobileInsp(main)); return; }
  const all = iaCells();
  const order = { over: 0, soon: 1, ok: 2, none: 3 };
  const cells = all.filter((c) => MF.inspAll || c.st === "over" || c.st === "soon").sort((a, b) => order[a.st] - order[b.st] || (a.due < b.due ? -1 : 1));
  const nOver = all.filter((c) => c.st === "over").length, nSoon = all.filter((c) => c.st === "soon").length;
  const ST = { over: "期限超過", soon: "期限が近い", ok: "先", none: "未実施" };
  const RL = { ok: "異常なし", issue: "要対応あり", pending: "報告書待ち" };
  main.innerHTML = iaModeToggle("mChips") + `<div class="mChips"><span class="mChip over">期限超過 ${nOver}</span><span class="mChip soon">近い ${nSoon}</span><button class="mChip${MF.inspAll ? " on" : ""}" id="mAll">すべて表示</button></div>
    ${cells.map((c) => `<details class="mIns ${c.st}"><summary><div class="mTop"><b>${esc(c.item.title)}</b></div><div class="mMeta"><span>${esc(c.bname)}</span><span class="mSt ${c.st}">${ST[c.st]}${c.due ? "　" + iaMD(c.due) : ""}${c.st === "over" ? `（${-c.days}日超過）` : ""}</span></div></summary>
      <div class="mLogs"><div class="note">${esc((c.item.cycle || {}).label || "")}／${c.item.legal ? "法定" : "任意"}／${esc(c.item.who || "")}</div><button class="btn" data-iamap="${esc(c.bid)}" data-iano="${c.item.no}" style="margin:4px 0">図で場所を見る</button>${c.logs.slice().sort((a, b) => (a.done_on < b.done_on ? 1 : -1)).slice(0, 5).map((l) => `<div class="mLog"><b>${esc(l.done_on.replace(/-/g, "/"))}</b> ${RL[l.result] || ""}　${esc(l.done_by || "")}${(l.checks || []).filter((x) => x.r === "issue").map((x) => `<div class="note">要対応：${esc(x.t)}${x.m ? "（" + esc(x.m) + "）" : ""}</div>`).join("")}${l.memo ? `<div class="note">${esc(l.memo)}</div>` : ""}</div>`).join("") || `<div class="note">まだ記録がありません</div>`}</div></details>`).join("") || `<div class="empty panel">${MF.inspAll ? "点検の項目がありません" : "期限が近い・過ぎている点検はありません"}</div>`}`;
  $("mAll").onclick = () => { MF.inspAll = !MF.inspAll; mobileInsp(main); };
  main.querySelectorAll("[data-iamap]").forEach((el) => (el.onclick = (e) => { e.preventDefault(); iaOpenMap(el.dataset.iamap, +el.dataset.iano); }));
  iaWireMode(main, () => mobileInsp(main));
}

/* ---------- 設定の「表示」 ---------- */
function viewModePanelHtml() {
  const v = getLS("viewMode") || "auto";
  return `<div class="panel"><h3>表示</h3><p class="note">今は「${MOBILE ? "スマホ表示" : "PC表示"}」です。同じURLで、端末に合わせて自動で切り替わります。</p>
    <p>${[["auto", "自動"], ["mobile", "スマホ表示"], ["pc", "PC表示"]].map(([k, l]) => `<button class="btn${v === k ? " primary" : ""}" data-vm="${k}">${l}</button>`).join(" ")}</p>
    <p class="note">スマホ表示は、報告・依頼の確認と、メモの記入に絞っています。まとめ・金額や原因の編集・CSVは、PC表示で行います。</p></div>`;
}
function wireViewMode() {
  document.querySelectorAll("[data-vm]").forEach((b) => (b.onclick = () => { if (b.dataset.vm === "auto") { try { localStorage.removeItem(P + "viewMode"); } catch (e) { /* 無視 */ } } else setLS("viewMode", b.dataset.vm); location.hash = "#/settings"; location.reload(); }));
}

/* ---------- 下のタブ・上の帯 ---------- */
(function initMobileChrome() {
  if (!MOBILE) return;
  const reload = $("mReload"), back = $("mBack");
  if (reload) reload.onclick = async () => { reload.disabled = true; try { await loadApiRecords(true); await inspLoad(); } finally { reload.disabled = false; } mobileRender(); };
  if (back) back.onclick = () => { if (history.length > 1) history.back(); else location.hash = "#/list"; };
  const tabs = $("mTabs"), head = $("mHeader");
  if (tabs) tabs.hidden = false;
  if (head) head.hidden = false;
})();
