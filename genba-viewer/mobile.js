"use strict";
/* ---------- スマホ用の画面（見守り） ----------
   スマホ（iPhone の Safari など）は Box のフォルダを読めないので、GAS にあるものだけで組み立てる：
   ・現場の一覧と詳細 … 現場ナビが送るチェックの記録（states）。段階ごとの進み具合・最近の報告の要約（写真なし）
   ・疑問・気づき … GAS のやりとり（PC と同じ）。返信・「確認した」もここから
   写真と週の報告の全文は PC（Box）で見る。PC 用の画面と同じ URL で、端末に合わせて切り替える（設定で手動にもできる）
   このファイルは app.js より先に読む。中の関数は、app.js を読み終えた後（init の中）で呼ばれる */

// "mobile"／"pc"。設定で選んでいなければ、フォルダを読めるか（PC の Edge・Chrome）で決める
function viewMode() {
  const v = getLS("viewMode");
  if (v === "mobile" || v === "pc") return v;
  return canPickFolder ? "pc" : "mobile";
}
let MOBILE = false;

async function initMobile() {
  MOBILE = true;
  document.body.classList.add("mobileMode");
  // 再読み込みボタンは、フォルダではなく GAS を確かめ直す
  const b = $("reloadBtn");
  const nb = b.cloneNode(true);
  b.replaceWith(nb);
  nb.addEventListener("click", () => syncGas(true));
  buildData([], [], [], []);
  data.source = { name: "スマホ表示（GAS）", mobile: true, at: new Date().toISOString(), reports: 0, photos: null, writable: false };
  mobileMergeSites();
  route();
  await refreshStatesAndDraw();
}

// チェックの記録から現場と担当者を作る（疑問・気づきから作った現場とは、工事番号でまとまる）
function mobileMergeSites() {
  stateCache.forEach((list, key) => {
    if (!key.startsWith("k:")) return;
    const sk = "kouji:" + key.slice(2);
    const first = list[0] || {};
    let s = data.sites.get(sk);
    if (!s) data.sites.set(sk, (s = { key: sk, name: first.siteName || "（現場名なし）", koujiNo: key.slice(2), personKey: "", personName: "", persons: new Map(), members: new Set(), reports: [] }));
    if (first.siteName && (!s.name || s.name === "（現場名なし）")) s.name = first.siteName;
    list.forEach((st) => {
      const has = [...s.persons.values()].some((n) => normName(n) === normName(st.person));
      const pk = "name:" + st.person;
      if (!has) s.persons.set(pk, st.person);
      if (!s.personName) {
        s.personName = st.person;
        s.personKey = pk;
      }
      if (!data.people.has(pk) && ![...data.people.values()].some((p) => normName(p.name) === normName(st.person))) data.people.set(pk, { key: pk, name: st.person, sites: new Set([sk]), reports: [] });
      (st.members || []).forEach((m) => s.members.add(m));
    });
  });
}

// 画面の振り分け（スマホは「現場」「疑問・気づき」「設定」の3つ）
function mobileRoute(name, arg, params) {
  document.querySelectorAll("[data-mnav]").forEach((a) => a.classList.toggle("on", a.dataset.mnav === (name === "site" ? "home" : name || "home")));
  if (name === "notes") renderNotes(params);
  else if (name === "settings") renderMSettings();
  else if (name === "site") renderMSite(decodeURIComponent(arg || ""));
  else renderMHome();
  return true;
}

function latestOf(list, key) {
  return list.reduce((a, x) => (!a || (x[key] || "") > (a[key] || "") ? x : a), null);
}
function mReportsOf(s) {
  return statesOf(s)
    .flatMap((st) => (st.reports || []).map((r) => ({ ...r, person: st.person })))
    .sort((a, b) => ((a.at || "") < (b.at || "") ? 1 : -1));
}
const M_KIND = { sent: "報告", external: "アプリ外で報告", skip: "報告なし" };
function mSum(prog) {
  const live = (prog || []).filter((g) => !g.before_start);
  const cd = live.reduce((t, g) => t + (g.checks_done || 0), 0);
  const ct = live.reduce((t, g) => t + (g.checks_total || 0), 0);
  return { cd, ct, pct: ct ? Math.round((cd / ct) * 100) : 0 };
}

function renderMHome() {
  const main = $("main");
  let html = `<section class="mHead"><h1>現場の状況</h1><p>今の進み具合と現場の声（スマホ版）。写真と週の報告の全文は PC の見守りで見られます。</p></section>`;
  if (!gasOn()) {
    main.innerHTML = html + emptyBox("合言葉を入れてください", "設定の「現場とのやりとり」に上司用の合言葉を入れると、現場の記録が届きます。");
    bindCommon(main);
    return;
  }
  const notes = [...data.notes.values()];
  const rows = [...data.sites.values()]
    .filter((s) => siteInScope(s) && (statesOf(s).length || notes.some((n) => n.siteKey === s.key)))
    .map((s) => {
      const prog = siteProgress(s);
      const sts = statesOf(s);
      const open = notes.filter((n) => n.siteKey === s.key && noteStatus(n) === "open" && noteInScope(n)).length;
      const lastAt = (latestOf(sts, "at") || {}).at || "";
      return { s, prog, open, lastAt, rep: mReportsOf(s)[0] };
    })
    .sort((a, b) => b.open - a.open || (a.lastAt < b.lastAt ? 1 : -1));
  if (!rows.length) {
    main.innerHTML = html + emptyBox("まだ現場の記録が届いていません", "監督が現場ナビに合言葉を入れてチェックを付けると、ここに現場が出ます（工事番号のある現場だけ）。");
    bindCommon(main);
    return;
  }
  html += `<div class="mList">${rows
    .map(({ s, prog, open, lastAt, rep }) => {
      const st = siteStage(prog);
      const sum = mSum(prog);
      return (
        `<button class="mCard" data-site="${esc(s.key)}">` +
        `<div class="mCardTop"><b>${esc(s.name)}</b>${open ? `<span class="sBadge open">未回答 ${open}</span>` : ""}</div>` +
        `<div class="mCardSub">${esc([...s.persons.values()].join("・"))}${s.koujiNo ? `　No.${esc(s.koujiNo)}` : ""}</div>` +
        (prog
          ? `<div class="mProg"><span class="mStage">${esc(st >= 0 ? prog[st].group : "－")}</span><span class="mBar"><i style="width:${sum.pct}%"></i></span><span class="mPct">${sum.pct}%</span></div>`
          : `<div class="mCardSub">チェックの記録はまだありません</div>`) +
        `<div class="mCardFoot">${lastAt ? `記録 ${esc(fmtDateTime(lastAt))}` : ""}${rep ? `　${esc(fmtMD(rep.start))}〜${esc(fmtMD(rep.end))} ${esc(M_KIND[rep.kind] || "報告")}` : ""}</div>` +
        `</button>`
      );
    })
    .join("")}</div>`;
  main.innerHTML = html;
  bindCommon(main);
}

function renderMSite(key) {
  const main = $("main");
  const s = data.sites.get(key);
  if (!s) return renderMHome();
  const prog = siteProgress(s);
  const sts = statesOf(s);
  const sum = mSum(prog);
  let html =
    `<a class="backLink mBack" href="#/home">${icon("back", 18)}現場の一覧</a>` +
    `<section class="mHead"><h1>${esc(s.name)}</h1><p>${s.koujiNo ? `工事番号 No.${esc(s.koujiNo)}　` : ""}${esc([...s.persons.values()].join("・"))}</p></section>`;
  // 段階ごとの進み具合
  html +=
    `<div class="card mBox"><h2>工程の進み具合<span class="mSub">チェック ${sum.cd}/${sum.ct}（${sum.pct}%）</span></h2>` +
    (prog
      ? prog
          .map((g) => {
            const pct = g.checks_total ? Math.round((g.checks_done / g.checks_total) * 100) : 0;
            return `<div class="mGroup${g.before_start ? " pre" : ""}"><span class="mgName">${esc(g.group)}</span><span class="mBar"><i style="width:${g.before_start ? 0 : pct}%"></i></span><span class="mgNum">${g.before_start ? "導入前" : `${g.checks_done}/${g.checks_total}`}</span></div>`;
          })
          .join("")
      : `<div class="mutedText">チェックの記録はまだありません。</div>`) +
    (sts.length ? `<div class="mutedText mAsOf">${sts.map((x) => `${esc(x.person)}：${esc(fmtDateTime(x.at))} 時点`).join("<br>")}</div>` : "") +
    `</div>`;
  // 最近の報告の要約
  const reps = mReportsOf(s).slice(0, 3);
  html += `<div class="card mBox"><h2>最近の報告</h2>`;
  html += reps.length
    ? reps
        .map((r) => {
          const photos = Object.entries(r.photos || {});
          const total = photos.reduce((t, [, n]) => t + n, 0);
          return (
            `<div class="mRep"><div class="mRepHead"><b>${esc(fmtMD(r.start))}〜${esc(fmtMD(r.end))}</b><span class="tag">${esc(M_KIND[r.kind] || "報告")}</span><span class="mutedText">${esc(r.person)}</span></div>` +
            (r.processes || []).map((p) => `<div class="mRepRow"><b>${esc(shortProc(p.name))}</b>${p.status ? `<span class="tag">${esc(p.status)}</span>` : ""}<span>${esc(p.note || "")}</span></div>`).join("") +
            (r.customer && r.customer.done_other ? `<div class="mRepRow"><b>写真以外</b><span>${esc(r.customer.done_other)}</span></div>` : "") +
            (r.customer && r.customer.next ? `<div class="mRepRow"><b>来週・連絡</b><span>${esc(r.customer.next)}</span></div>` : "") +
            (r.memo ? `<div class="mRepRow"><b>上司へ</b><span>${esc(r.memo)}</span></div>` : "") +
            (total ? `<div class="mRepPhotos">${icon("photo", 15)}写真 ${total}枚（${photos.map(([n, c]) => `${esc(shortProc(n))} ${c}`).join("・")}）</div>` : "") +
            `</div>`
          );
        })
        .join("")
    : `<div class="mutedText">報告の要約はまだありません（現場ナビ v84 以降で報告すると届きます）。</div>`;
  html += `<div class="mPhotoHint">${icon("photo", 16)}<span>写真は Box アプリの「7.現場ナビ ＞ 報告 ＞ 社内報告 ＞ 現場ごと ＞ ${esc(s.name)}」にあります。PC の見守りでも見られます。</span></div></div>`;
  // この現場の疑問・気づき
  const notes = [...data.notes.values()].filter((n) => n.siteKey === s.key).sort((a, b) => (a.at < b.at ? 1 : -1));
  html += `<div class="card mBox"><h2>現場の声</h2>${notes.length ? `<div class="noteList">${notes.map(noteRow).join("")}</div>` : `<div class="mutedText">疑問・気づきはまだありません。</div>`}</div>`;
  main.innerHTML = html;
  bindCommon(main);
}

function viewModeCardHtml() {
  const v = getLS("viewMode") || "auto";
  return (
    `<div class="card setCard"><h2>画面の表示</h2><div class="themeSeg">${[["auto", "自動"], ["mobile", "スマホ用"], ["pc", "PC用"]]
      .map(([k, l]) => `<button type="button" data-view-set="${k}" class="${v === k ? "on" : ""}">${l}</button>`)
      .join("")}</div><p class="sub">自動：フォルダを読める PC（Edge・Chrome）は PC 用、それ以外（スマホなど）はスマホ用。スマホ用は、進み具合と現場の声（返信）だけの軽い画面です。</p></div>`
  );
}
function bindViewModeCard(root) {
  root.querySelectorAll("[data-view-set]").forEach((b) =>
    b.addEventListener("click", () => {
      setLS("viewMode", b.dataset.viewSet === "auto" ? "" : b.dataset.viewSet);
      location.reload();
    })
  );
}

function renderMSettings() {
  const main = $("main");
  main.innerHTML =
    `<section class="mHead"><h1>設定</h1></section>` +
    `<div class="card setCard"><h2>あなたの名前</h2><p class="sub">合言葉から自動で入ります。</p><div><b>${esc(getLS("name") || "（未設定）")}</b></div></div>` +
    gasCardHtml() +
    viewModeCardHtml() +
    `<div class="card setCard"><h2>表示の色</h2><div class="themeSeg">${[["auto", "端末と同じ"], ["light", "ライト"], ["dark", "ダーク"]]
      .map(([k, l]) => `<button type="button" data-theme-set="${k}" class="${(getLS("theme") || "auto") === k ? "on" : ""}">${l}</button>`)
      .join("")}</div></div>` +
    `<div class="card setCard"><h2>ホーム画面に追加</h2><p class="sub">Safari の共有ボタン（□に↑）→「ホーム画面に追加」で、アプリのように開けます。</p></div>` +
    `<div class="mutedText">${esc(APP_NAME)} ver.${APP_VERSION}（スマホ表示）</div>`;
  main.querySelectorAll("[data-theme-set]").forEach((b) =>
    b.addEventListener("click", () => {
      setLS("theme", b.dataset.themeSet === "auto" ? "" : b.dataset.themeSet);
      applyTheme(b.dataset.themeSet);
      main.querySelectorAll("[data-theme-set]").forEach((x) => x.classList.toggle("on", x === b));
    })
  );
  bindGasCard(main);
  bindViewModeCard(main);
  bindCommon(main);
}
