// 現場カルテ（genba-karte）。過去の現場の事例を、言葉から引く・現場ごとに並べる・振り返る時に足す。
// 社内データ（事例カード・現場名・札・言い換え）はここに書かない。カルテパックの JSON を取り込む。作りは 設計メモ.md
const APP_VERSION = 4;
// お知らせ。機能追加・不具合修正のたびに、先頭へ {date, type: "feature"|"fix", text} を追記する（現場ナビと同じ形）
// （自動では増えないので、書き忘れるとお知らせが古いまま残る）
const ANNOUNCEMENTS = [
  { date: "2026-11-18", type: "feature", text: "「そう言えばを足す」で、現場を期で絞って選べるようにしました。最初は一番新しい期の現場だけが並びます（期の入ったカルテパックを取り込んだ時）" },
  { date: "2026-11-18", type: "feature", text: "ダークモードを足しました。設定の「表示の色」で、端末と同じ・ライト・ダークを選べます" },
  { date: "2026-11-18", type: "feature", text: "お知らせを足しました（ホーム右上のベル）。「新しい機能」と「直したこと」に分けて出します" },
  { date: "2026-11-18", type: "fix", text: "設定のボタンの絵を、現場ナビと同じ歯車にしました" },
  { date: "2026-11-18", type: "feature", text: "現場一覧を「期でくくる」に切り替えられるようにしました。事例を引く時も、期で絞れます（期の入ったカルテパックを取り込んだ時）" },
  { date: "2026-11-18", type: "feature", text: "現場カルテを公開しました。カルテパックを取り込むと、言葉から事例を引く・現場ごとに建てた時とその後を見る・振り返る時に足す、ができます" },
];
// カード・現場名・札・言い換えは社内データ。アプリには入れず、カルテパック（JSON）を取り込んで端末（IndexedDB）に置く
let D = null, CARDS = [], BUKKEN = {}, LISTS = {工程:[], 部位:[], 症状:[]}, ALIAS = {}, NAMES = {}, HAS_NAMES = false, byId = {};
let TASU = [];   // この端末で足した「そう言えば」
function usePack(p){
  D = p; CARDS = p.cards || []; BUKKEN = p.bukken || {}; LISTS = p.lists || {工程:[], 部位:[], 症状:[]}; ALIAS = p.alias || {};
  NAMES = p.names || {}; HAS_NAMES = Object.keys(NAMES).length > 0; byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
}
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isAfter = c => (c['場面'] || '').startsWith('アフター');
const none = v => !v || v === '記録なし' || String(v).startsWith('記録なし');

// ---- 線のアイコン ----
const P = {
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  book:'<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5z"/><path d="M12 6v13"/>',
  helmet:'<path d="M4 16a8 8 0 0116 0"/><path d="M2.5 16h19v2.5h-19z"/><path d="M10 8.3V13M14 8.3V13"/>',
  plus:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>',
  sign:'<path d="M12 3v18"/><path d="M12 5h6l2 2.5L18 10h-6z"/><path d="M12 12H6l-2 2.5L6 17h6z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  chev:'<path d="M9 5l7 7-7 7"/>',
  hammer:'<path d="M14 4l6 6-2.5 2.5-6-6z"/><path d="M12.5 8.5L4 17l3 3 8.5-8.5"/>',
  sprout:'<path d="M12 20v-8"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 14c0-3 2.500-5 6-5 0 3-2.500 5-6 5z"/>',
  cause:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/><path d="M11 8v3.500M11 14v.01"/>',
  wrench:'<path d="M14.500 6a4 4 0 005 5l-9 9a2.100 2.100 0 01-3-3l9-9a4 4 0 01-2-2z"/>',
  bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.500 10.900V15h7v-1.100A6 6 0 0012 3z"/>',
  pin:'<path d="M12 21s7-6.500 7-11.500a7 7 0 10-14 0C5 14.500 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
  cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  note:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  tag:'<path d="M4 12V4h8l8 8-8 8z"/><circle cx="8.500" cy="8.500" r="1.200"/>',
  save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
  check:'<path d="M5 12l4.500 4.500L19 7"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  down:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24">${P[n]}</svg>`;
const img = (f, cls='') => `<img class="${cls}" src="art/${f}" alt="" onerror="this.remove()">`;

// ---- 引く（jirei_lookup.py と同じ考え方：札の一致 各3点＋言葉の一致） ----
function pickTags(q){
  q = q.replace(/[ 　]/g, '');
  const t = {工程:new Set(), 部位:new Set(), 症状:new Set()};
  const long = Object.keys(ALIAS).filter(w => w.length >= 4).sort((a,b) => b.length - a.length);
  let rest = q;
  for (const w of long) if (rest.includes(w)) { const [k,n] = ALIAS[w]; t[k].add(n); rest = rest.split(w).join('　'); }
  for (const k of ['工程','部位','症状']) for (const name of LISTS[k]) {
    const words = [name, ...name.replace(/（/g,'・').replace(/）/g,'').replace(/：/g,'・').split('・').filter(w => w.length >= 2)];
    if (words.some(w => rest.includes(w))) t[k].add(name);
  }
  for (const [w,[k,n]] of Object.entries(ALIAS)) if (rest.includes(w)) t[k].add(n);
  return t;
}
function search(q, filter, ki){
  const t = pickTags(q), qq = q.replace(/[ 　]/g, '');
  const words = Object.keys(ALIAS).filter(w => qq.includes(w));
  const out = [];
  for (const c of CARDS) {
    if (filter === 'new' && isAfter(c)) continue;
    if (filter === 'after' && !isAfter(c)) continue;
    if (ki && String(kiOf(c['物件'])) !== String(ki)) continue;
    let p = 0; const hit = [];
    for (const k of ['工程','部位','症状']) for (const n of c[k] || []) if (t[k].has(n)) { p += 3; hit.push(n); }
    const body = ((c['題']||'') + (c['状況']||'')).replace(/[ 　]/g, '');
    if (p > 0) p += words.filter(w => body.includes(w)).length;
    if (qq.length >= 2 && body.includes(qq)) p += 2;   // 入れた言葉がそのまま本文にある時（試作で足した）
    if (p > 0) out.push({p, c, hit});
  }
  out.sort((a,b) => b.p - a.p || (a.c.id < b.c.id ? -1 : 1));
  return {t, out};
}

// ---- 部品 ----
const gname = k => NAMES[k] || '現場 ' + k;
const pillScene = c => isAfter(c) ? `<span class="pill after">${ic('sprout')}その後<small style="font-weight:400">${esc((c['場面'].match(/（(.+)）/)||[])[1] || '')}</small></span>` : `<span class="pill new">${ic('hammer')}建てた時</span>`;
const pillCheck = c => String(c['確認']||'').startsWith('確認済み') ? `<span class="pill ok">${ic('check')}確認済み</span>` : `<span class="pill wait">未確認</span>`;
const rw = (cls, icon, k, v, alt) => `<div class="rw ${cls}"><span class="k">${ic(icon)}${k}</span><div class="v">${none(v) ? `<span class="empty">${alt}</span>` : esc(v)}</div></div>`;
function caseRow(c, hit){
  const tags = [...(c['工程']||[]), ...(c['部位']||[]), ...(c['症状']||[])];
  return `<a class="case" href="#/card/${encodeURIComponent(c.id)}">
    <div class="hd">${ic('home')}<span class="nm">${esc(gname(c['物件']))}</span><span class="id">${esc(c.id)}</span>${ic('chev')}</div>
    <div class="pills">${pillScene(c)}</div>
    <div class="t">${esc(c['題'])}</div>
    <div class="rows">${rw('', 'cause', '何が要因で', c['原因'], '記録なし')}${rw('next', 'bulb', 'どうした方が良かった', c['次からの手'], '記録なし（振り返る時に足す）')}</div>
    <div class="tags">${tags.slice(0,6).map(x => `<span class="tag${hit && hit.includes(x) ? ' hit' : ''}">${esc(x)}</span>`).join('')}</div></a>`;
}
const kiOf = k => (BUKKEN[k] || {})['期'];
const kiList = () => [...new Set(Object.keys(BUKKEN).map(kiOf).filter(Boolean))].sort((a, b) => b - a);
const kiPill = k => kiOf(k) ? `<span class="ki">${esc(kiOf(k))}期</span>` : '';
const annSeen = () => { try { return Number(localStorage.getItem('gk-announce-seen') || 0); } catch (e) { return 0; } };
const acts = () => `<div class="acts"><a class="gear bellBtn" href="#/oshirase" aria-label="お知らせ">${ic('bell')}${ANNOUNCEMENTS.length > annSeen() ? '<span class="bellDot"></span>' : ''}</a><a class="gear" href="#/settei" aria-label="設定">${ic('gear')}</a></div>`;
function bukkenLabel(k){ const b = BUKKEN[k] || {}; return [b['種類'], b['用途'], b['地域'], b['季節']].filter(x => x && x !== '記録なし').join('・'); }
function kindImg(k){ const b = BUKKEN[k] || {}, y = String(b['用途'] || '');
  if (String(b['種類'] || '').includes('リフォーム')) return 'kind-reform.webp';
  return /店|事務所|美容|レストラン|倉庫|販売|AP|アパート|OFFICE/i.test(y) ? 'kind-shop.webp' : 'kind-house.webp'; }
function bukkenRow(k){
  const cs = CARDS.filter(c => c['物件'] === k), a = cs.filter(isAfter).length;
  return `<a class="g-row" href="#/genba/${encodeURIComponent(k)}">
    <div class="thumb">${img(kindImg(k))}</div>
    <div style="min-width:0"><div class="n">${esc(gname(k))}</div><div class="s">${kiPill(k)}${NAMES[k] ? `<span class="kigo">${esc(k)}</span>　` : ''}${esc(bukkenLabel(k))}</div>
      <div class="c"><span>${ic('hammer')} 建てた時 <b>${cs.length - a}</b>件</span><span>${ic('sprout')} その後 <b>${a}</b>件</span></div></div>
    <span class="chev">${ic('chev')}</span></a>`;
}
const WORDS = ['床鳴り','クロスの隙間','結露','タイルの割れ','建具','暖房','雪','お隣','見積の漏れ','気密'];
const chipsHtml = (scroll) => `<div class="chips${scroll ? ' scroll' : ''}">${WORDS.map(w => `<button class="chip" data-q="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
const searchBox = (q='', btn=true) => `<form class="search" id="sf"><label class="box">${ic('search')}<input id="q" type="search" enterkeyhint="search" placeholder="言葉で事例・現場を探す" value="${esc(q)}" aria-label="引く言葉"></label>${btn ? '<button class="btn">引く</button>' : ''}</form>`;
const emptyBox = msg => `<div class="emptybox">${img('empty.webp')}${msg}</div>`;
const tile = (href, pic, t, s, soon) => `<a class="tile${soon ? ' soon' : ''}" href="${href}"><div class="pic">${img(pic)}</div><div><b>${t}</b><span>${s}</span></div></a>`;

// ---- 画面 ----
function home(){
  const years = [...new Set(Object.keys(BUKKEN).filter(k => /^\d/.test(k)).map(k => k.slice(0,2)))].sort().reverse();
  const recent = Object.keys(BUKKEN).filter(k => k.startsWith(years[0])).sort().reverse().slice(0, 4);
  const after = CARDS.filter(isAfter).length;
  return `<div class="brand">${img('icon-96.png')}<div><b>現場カルテ</b><span>建てた時も、その後も。</span></div>${acts()}</div>
    <div class="hero">${img('hero.webp')}</div>
    <div class="searchwrap">${searchBox('', false)}</div>${chipsHtml(true)}
    <div class="tiles">
      ${tile('#/hiku', 'tile-hiku.webp', '事例を引く', '言葉・工程・部位から、過去の似た事例を探す')}
      ${tile('#/genba', 'tile-genba.webp', '現場一覧', '現場ごとに、建てた時とその後を並べて見る')}
      ${tile('#/tasu', 'tile-tasu.webp', 'そう言えばを足す', '振り返る時に思い出した事を入れる')}
      ${tile('#/taisaku', 'tile-taisaku.webp', '対策の行き先', '決めた対策がマニュアルに入ったかを追う', true)}
    </div>
    <h2>${ic('home')}現場一覧<a class="more" href="#/genba">すべて見る ›</a></h2>
    <div class="list">${recent.map(bukkenRow).join('')}</div>
    <div class="stats">
      <div class="stat"><b>${CARDS.length - after}</b><span>建てた時の事例</span></div>
      <div class="stat"><b>${after}</b><span>その後（下書き）</span></div>
      <div class="stat"><b>${Object.keys(BUKKEN).length}</b><span>現場</span></div></div>
    <div class="foot">現場カルテ v${APP_VERSION}・カード ${esc(D.version || D.built || '')} 版${D.demo ? '・<b>デモ（作りもののデータ）</b>' : ''}<br>${HAS_NAMES ? '<b>社内のみ</b>：現場名（お客様の名前）を表示しています。画面を外に出さないでください' : '現場名は入っていません（記号で表示）'}</div>`;
}
let lastQ = '', lastF = 'all', lastKi = '';
function hiku(){
  const q = lastQ;
  let res = '';
  if (q) {
    const {t, out} = search(q, lastF, lastKi);
    const qq = q.replace(/[ 　]/g, '');
    const gb = Object.keys(NAMES).filter(k => qq.length >= 2 && (NAMES[k].replace(/[ 　]/g, '').includes(qq) || k === qq)).sort().reverse();
    if (gb.length) res += `<h2>${ic('home')}現場<small>名前が合う現場</small></h2><div class="list">${gb.map(bukkenRow).join('')}</div>`;
    const picked = ['工程','部位','症状'].flatMap(k => [...t[k]]);
    res += `<h2>${ic('book')}事例<small>${out.length}件・言葉に近い順</small></h2>
      <p class="lead">拾った札：${picked.length ? picked.map(x => `<span class="tag hit">${esc(x)}</span>`).join(' ') : 'なし（言葉をそのまま探しました）'}</p>
      <div class="list">${out.slice(0,20).map(r => caseRow(r.c, r.hit)).join('') || emptyBox(gb.length ? 'この言葉に当たる事例はありません。上の現場を開いてください。' : '当たる事例がありません。言葉を変えてみてください。')}</div>
      ${out.length > 20 ? `<p class="lead" style="margin-top:12px">上位20件を表示しています（ほか ${out.length - 20}件）</p>` : ''}`;
  }
  const f = (k, l) => `<button class="chip${lastF === k ? ' on' : ''}" data-f="${k}">${l}</button>`;
  return `${searchBox(q)}
    <div class="chips">${f('all','すべて')}${f('new','建てた時')}${f('after','その後')}${kiList().length ? `<select class="chip" id="kiSel" aria-label="期で絞る"><option value="">期：すべて</option>${kiList().map(x => `<option value="${x}"${String(x) === String(lastKi) ? ' selected' : ''}>${x}期</option>`).join('')}</select>` : ''}</div>
    ${q ? res : `<h2>よく引く言葉</h2>${chipsHtml()}<h2>症状の札から</h2><div class="chips">${LISTS['症状'].map(w => `<button class="chip" data-q="${esc(w)}">${esc(w)}</button>`).join('')}</div>`}`;
}
/** 現場一覧のくくり方：'kai'＝振り返り会の年、'ki'＝期（パックの物件に「期」がある時だけ選べる） */
let groupBy = (() => { try { return localStorage.getItem('gk-group') || 'kai'; } catch (e) { return 'kai'; } })();
function genbaList(){
  const all = Object.keys(BUKKEN), hasKi = kiList().length > 0, mode = hasKi && groupBy === 'ki' ? 'ki' : 'kai';
  const grp = mode === 'ki' ? (k => kiOf(k) ? String(kiOf(k)) : 'x') : (k => /^\d/.test(k) ? k.slice(0,2) : 'A');
  const last = mode === 'ki' ? 'x' : 'A';
  const order = (a, b) => grp(a) === grp(b) ? (a < b ? 1 : -1) : grp(a) === last ? 1 : grp(b) === last ? -1 : (grp(a) < grp(b) ? 1 : -1);
  const ks = all.slice().sort(order);
  const head = g => mode === 'ki' ? (g === 'x' ? '期が分からない現場' : g + '期') : (g === 'A' ? '点検の記録だけの現場（振り返り会の記録なし）' : '20' + g + '年の振り返り会');
  const b = (k, l) => `<button class="chip${mode === k ? ' on' : ''}" data-g="${k}">${l}</button>`;
  let y = null, h = `<p class="lead">現場を選ぶと、建てた時の振り返りと、その後の点検の記録が並びます。全 ${ks.length} 件。</p>
    ${hasKi ? `<div class="chips" style="margin:0 0 4px">${b('kai','振り返り会の年でくくる')}${b('ki','期でくくる')}</div>` : ''}`;
  ks.forEach((k, i) => { if (grp(k) !== y) { y = grp(k); h += `<div class="year">${head(y)}<small>　${ks.filter(x => grp(x) === y).length} 件</small></div><div class="list">`; }
    h += bukkenRow(k); if (i === ks.length - 1 || grp(ks[i+1]) !== y) h += '</div>'; });
  return h;
}
function genba(k){
  const cs = CARDS.filter(c => c['物件'] === k), a = cs.filter(isAfter), n = cs.filter(c => !isAfter(c));
  const link = a.filter(c => (c['関連']||[]).some(r => byId[r] && !isAfter(byId[r])));
  return `<div class="card detail"><div class="g-row" style="box-shadow:none;padding:0;background:none"><div class="thumb">${img(kindImg(k))}</div>
        <div><h3 style="margin:0">${esc(gname(k))}</h3><div class="s" style="font-size:12px;color:var(--muted)">${kiPill(k)}${NAMES[k] ? `<span class="kigo">${esc(k)}</span>　` : ''}${esc(bukkenLabel(k))}</div></div></div>
      <div class="stats"><div class="stat"><b>${n.length}</b><span>建てた時</span></div><div class="stat"><b>${a.length}</b><span>その後</span></div><div class="stat"><b>${link.length}</b><span>つながり</span></div></div></div>
    ${link.length ? `<h2>建てた時 → その後<small>同じ現場で部位が近い物</small></h2><div class="list">${link.map(c => {
        const r = c['関連'].map(x => byId[x]).find(x => x && !isAfter(x));
        return `<div class="card"><div class="pills" style="margin:0">${pillScene(r)}</div><a href="#/card/${r.id}"><div class="t" style="font-weight:700;margin-top:4px">${esc(r['題'])}</div></a>
          <div class="pills">${pillScene(c)}</div><a href="#/card/${c.id}"><div class="t" style="font-weight:700;margin-top:4px">${esc(c['題'])}</div></a>
          <div class="info" style="margin-top:10px">同じ出来事かは未確認（Claude の見立て）</div></div>`; }).join('')}</div>` : ''}
    <h2>${ic('sprout')}その後<small>定期点検の記録から・下書き</small></h2>
    ${a.length ? `<div class="line after">${a.map(c => caseRow(c)).join('')}</div>` : '<div class="info">この現場の点検の記録は、まだカードにしていません。</div>'}
    <h2>${ic('hammer')}建てた時<small>振り返り会の記録から</small></h2>
    ${n.length ? `<div class="line new">${n.map(c => caseRow(c)).join('')}</div>` : '<div class="info">この現場は、振り返り会の記録がカードになっていません。</div>'}
    <a class="more" href="#/tasu/${encodeURIComponent(k)}">＋ この現場に「そう言えば」を足す</a>`;
}
function card(id){
  const c = byId[id]; if (!c) return emptyBox('カードがありません。');
  const sec = (icon, k, v) => none(v) ? '' : `<div class="sec"><div class="k">${icon ? ic(icon) : ''}${k}</div><div class="v">${esc(v)}</div></div>`;
  const src = c['出典'] || {}, cost = c['費用'] || {};
  const rel = (c['関連']||[]).map(x => byId[x]).filter(Boolean);
  return `<div class="card detail">
      <a class="hd" href="#/genba/${encodeURIComponent(c['物件'])}" style="display:flex;align-items:center;gap:8px;color:var(--heading);font-weight:700">${ic('home')}<span style="flex:1">${esc(gname(c['物件']))}</span><span style="font-size:11.5px;color:var(--muted);font-weight:400">${esc(c.id)}</span></a>
      <div class="pills">${pillScene(c)}${pillCheck(c)}</div>
      <h3>${esc(c['題'])}</h3><div style="font-size:12px;color:var(--muted)">${esc(c['事例の種類'])}・${esc(bukkenLabel(c['物件']))}</div>
      <div class="rows">
        ${rw('', 'cause', '何が要因で', c['原因'], '記録なし')}
        ${rw('', 'note', 'どうなった', c['状況'] || c['題'], '記録なし')}
        ${rw('next', 'bulb', 'どうした方が良かった', c['次からの手'], '記録なし')}</div>
      ${none(c['次からの手']) ? `<a class="more" href="#/tasu/${encodeURIComponent(c['物件'])}/${encodeURIComponent(c.id)}">＋ 「どうした方が良かった」を足す</a>` : ''}
      ${sec('wrench', '対処', c['対処'])}${sec('check', '結果', c['結果'])}
      ${cost['金額'] ? sec('', '費用', Number(cost['金額']).toLocaleString() + '円' + (cost['メモ'] ? '（' + cost['メモ'] + '）' : '')) : ''}
      ${sec('', 'マニュアル反映', c['マニュアル反映'])}
      <div class="sec"><div class="k">${ic('tag')}札<small style="font-weight:400">（押すと、同じ札の事例を引きます）</small></div><div class="chips" style="margin-top:6px">${[...(c['工程']||[]), ...(c['部位']||[]), ...(c['症状']||[])].map(x => `<button class="chip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
      ${c['Claudeの補足'] ? `<div class="note"><b>Claude の補足（推測を含む）</b><br>${esc(c['Claudeの補足'])}</div>` : ''}
      <div class="info">出典：${esc(Object.values(src).filter(Boolean).join('・'))}<br>確かさ：${esc(c['確かさ'])}　／　${esc(c['確認'])}<br>${esc(c['作成'])}</div></div>
    ${rel.length ? `<h2>関連する事例</h2><div class="list">${rel.map(x => caseRow(x)).join('')}</div>` : ''}
    <a class="more" href="#/genba/${encodeURIComponent(c['物件'])}">この現場のカルテを見る ›</a>`;
}
const SCENES = ['建てた時','引渡しの後','1年点検','2年点検','リフォーム・修理'];
const ROLES = ['工事担当','設計担当','工事事務','リフォーム担当','アフター担当','その他'];
/** 足す画面の現場の選択肢。ki＝期（''＝すべて、'x'＝期が分からない現場） */
function tasuOpts(ki, sel){
  const all = Object.keys(BUKKEN).filter(x => !ki || (ki === 'x' ? !kiOf(x) : String(kiOf(x)) === ki));
  const ks = [...all.filter(x => /^\d/.test(x)).sort().reverse(), ...all.filter(x => !/^\d/.test(x)).sort().reverse()];
  return `<option value="">現場を選んでください（${ks.length} 件）</option>` + ks.map(x => `<option value="${esc(x)}"${x === sel ? ' selected' : ''}>${esc(NAMES[x] ? NAMES[x] + '（' + x + '）' : x + '　' + bukkenLabel(x))}</option>`).join('');
}
function tasu(k, cid){
  const base = cid && byId[cid];
  // 現場が多いと選びにくいので、期で絞る。最初は、開いた現場の期（無ければ一番新しい期）
  const kis = kiList(), ki0 = k && BUKKEN[k] ? (kiOf(k) ? String(kiOf(k)) : 'x') : (kis.length ? String(kis[0]) : '');
  const opts = tasuOpts(ki0, k);
  const sel = base && isAfter(base) ? (base['場面'].includes('2年') ? '2年点検' : '1年点検') : '建てた時';
  return `<div class="tasu-head"><p>振り返っていて「そう言えばこんな事もあった」と思い出した事を、あとから足して残します。その時に気付いた事は、現場ナビに入れてください。</p>${img('note.webp')}</div>
    ${base ? `<div class="info">次のカードに足します：<b>${esc(base.id)}</b> ${esc(base['題'])}</div>` : ''}
    <label class="f">${ic('pin')}現場を選ぶ<span class="must">必須</span></label>${kis.length ? `<div class="chips" id="f-ki" style="margin:0 0 8px">${[...kis.map(x => [String(x), x + '期']), ['x', '期が不明'], ['', 'すべて']].map(([v, l]) => `<button type="button" class="chip${v === ki0 ? ' on' : ''}" data-tk="${v}">${l}</button>`).join('')}</div>` : ''}<select class="inp" id="f-b">${opts}</select>
    <label class="f">${ic('note')}何があった<span class="must">必須</span><small>一つの出来事だけ</small></label><textarea class="inp" id="f-t" placeholder="例：2階の建具が冬になると閉まりにくくなった">${base ? esc(base['題']) : ''}</textarea>
    <label class="f">${ic('cal')}いつの事か<span class="must">必須</span></label><div class="seg" id="f-s">${SCENES.map(s => `<button type="button" data-s="${s}" class="${s === sel ? 'on' : ''}">${s}</button>`).join('')}</div>
    <label class="f">${ic('cause')}何が要因で<small>分からなければ空のまま</small></label><textarea class="inp" id="f-g" placeholder="考えられる原因"></textarea>
    <label class="f">${ic('wrench')}どう対処した<small>任意</small></label><textarea class="inp" id="f-d" placeholder="行った対応・処置"></textarea>
    <label class="f">${ic('bulb')}どうした方が良かった<small>次の現場に伝えたい事</small></label><textarea class="inp" id="f-n" placeholder="例：枠は土台で押さえる納まりにする"></textarea>
    <label class="f">${ic('tag')}札<small>書いた言葉から自動で拾います</small></label><div class="tags" id="f-tags" style="margin-top:0"><span style="font-size:13px;color:var(--muted)">まだ拾えていません</span></div>
    <label class="f">入れる人の役割<small>名前は残しません</small></label><select class="inp" id="f-r">${ROLES.map(r => `<option${r === (localStorage.getItem('gk-role') || '') ? ' selected' : ''}>${r}</option>`).join('')}</select>
    <div style="margin-top:22px"><button class="btn green" id="f-save">${ic('save')}この端末に保存する</button></div>
    <div id="f-out"></div>
    <div class="info">この端末の中に保存します（今 ${TASU.length} 件）。まとめて書き出すのは <a href="#/settei" style="text-decoration:underline">設定</a> から。</div>`;
}
function taisaku(){
  return `<div class="emptybox">${img('tile-taisaku.webp')}<b style="font-size:16px;color:var(--heading)">対策の行き先（準備中）</b><br>振り返り会で決めた対策が、マニュアル・チェックリスト・スキル・見積の単価に入ったかを一覧にする画面です。まだ作っていません。</div>
    <div class="info">今の手がかり：事例カードの「マニュアル反映」の欄に書いてある物は ${CARDS.filter(c => !none(c['マニュアル反映'])).length} 枚、「どうした方が良かった」が書いてある物は ${CARDS.filter(c => !none(c['次からの手'])).length} 枚です。</div>`;
}

// ---- 道案内 ----
const TABS = [['home','#/','ホーム','home'],['hiku','#/hiku','事例','book'],['genba','#/genba','現場','helmet'],['tasu','#/tasu','足す','plus'],['taisaku','#/taisaku','対策','sign']];
const TITLES = {home:'現場カルテ', hiku:'事例を引く', genba:'現場一覧', tasu:'そう言えばを足す', card:'事例カード', taisaku:'対策の行き先', settei:'設定', oshirase:'お知らせ'};
function renderApp(){
  const p = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/'); const tab = p[0] || 'home';
  let h = '', title = TITLES[tab] || '現場カルテ';
  if (tab === 'home') h = home();
  else if (tab === 'hiku') h = hiku();
  else if (tab === 'genba') { if (p[1]) { h = genba(p[1]); title = gname(p[1]); } else h = genbaList(); }
  else if (tab === 'card') h = card(p[1]);
  else if (tab === 'tasu') h = tasu(p[1], p[2]);
  else if (tab === 'taisaku') h = taisaku();
  else if (tab === 'settei') h = settei();
  else if (tab === 'oshirase') h = oshirase();
  document.body.classList.toggle('home', tab === 'home');
  $('#app').innerHTML = h; $('#title').textContent = title;
  const cur = tab === 'card' ? 'hiku' : tab;
  $('#tabs').innerHTML = TABS.map(([k, href, l, i]) => `<a href="${href}" data-tab="${k}" class="${k === cur ? 'on' : ''}"><svg viewBox="0 0 24 24">${P[i]}</svg>${l}</a>`).join('');
  window.scrollTo(0, 0);
}
function go(q){ lastQ = q; if (location.hash === '#/hiku') render(); else location.hash = '#/hiku'; }
const formText = () => ['#f-t','#f-g','#f-d','#f-n'].map(s => $(s).value).join('');
document.addEventListener('submit', e => { if (e.target.id === 'sf') { e.preventDefault(); go($('#q').value.trim()); } });
document.addEventListener('click', e => {
  const q = e.target.closest('[data-q]'); if (q) { go(q.dataset.q); return; }
  const f = e.target.closest('[data-f]'); if (f) { lastF = f.dataset.f; render(); return; }
  const g = e.target.closest('[data-g]'); if (g) { groupBy = g.dataset.g; try { localStorage.setItem('gk-group', groupBy); } catch (er) {} render(); return; }
  const s = e.target.closest('[data-s]'); if (s) { document.querySelectorAll('#f-s button').forEach(b => b.classList.toggle('on', b === s)); return; }
  if (e.target.closest('#back')) { history.length > 1 ? history.back() : (location.hash = '#/'); return; }
  if (e.target.closest('[data-tab="hiku"]')) lastQ = '';
  if (e.target.closest('#f-save')) {
    const t = pickTags(formText());
    const d = {'題': $('#f-t').value.trim(), '物件': $('#f-b').value, '場面': ($('#f-s .on') || {}).textContent, '工程': [...t['工程']], '部位': [...t['部位']], '症状': [...t['症状']],
      '原因': $('#f-g').value.trim() || '記録なし', '対処': $('#f-d').value.trim() || '記録なし', '次からの手': $('#f-n').value.trim() || '記録なし', '役割': [$('#f-r').value], '確かさ': '振り返り（記憶ベース）', '確認': '未確認'};
    saveTasu(d);
  }
});
document.addEventListener('input', e => {
  if (!['f-t','f-g','f-d','f-n'].includes(e.target.id)) return;
  const t = pickTags(formText()), all = ['工程','部位','症状'].flatMap(k => [...t[k]]);
  $('#f-tags').innerHTML = all.length ? all.map(x => `<span class="tag hit">${esc(x)}</span>`).join('') : '<span style="font-size:13px;color:var(--muted)">まだ拾えていません</span>';
});
window.addEventListener('hashchange', render);

// ---- お知らせ（「新しい機能」と「直したこと」に分ける。機能の追加が、細かい修正に埋もれないように） ----
let annTab = 'feature', annUnseen = 0, annOpened = false;
function oshirase(){
  if (!annOpened) { annUnseen = ANNOUNCEMENTS.length - annSeen(); annTab = 'feature'; annOpened = true; try { localStorage.setItem('gk-announce-seen', String(ANNOUNCEMENTS.length)); } catch (e) {} }
  const isFix = a => a.type === 'fix', newIn = fix => ANNOUNCEMENTS.filter((a, i) => i < annUnseen && isFix(a) === fix).length;
  const tab = (k, l, n) => `<button type="button" data-ann="${k}" class="${annTab === k ? 'on' : ''}">${l}${n ? `<span class="annCount">${n}</span>` : ''}</button>`;
  const list = ANNOUNCEMENTS.map((a, i) => ({a, i})).filter(({a}) => isFix(a) === (annTab === 'fix'));
  return `<div class="seg" id="annTabs">${tab('feature', '新しい機能', newIn(false))}${tab('fix', '直したこと', newIn(true))}</div>
    <div class="list" style="margin-top:14px">${list.length ? list.map(({a, i}) => `<div class="card annItem"><div class="pills" style="margin:0 0 4px"><span class="pill ${isFix(a) ? 'new' : 'after'}">${isFix(a) ? '修正' : '機能'}</span><span class="annDate">${esc(a.date.replace(/-/g, '/'))}</span>${i < annUnseen ? '<span class="annNew">NEW</span>' : ''}</div><div>${esc(a.text)}</div></div>`).join('') : '<div class="lead">まだありません。</div>'}</div>`;
}
// ---- 表示の色（端末と同じ／ライト／ダーク）。現場ナビと同じ考え方 ----
const getTheme = () => { try { const t = localStorage.getItem('gk-theme'); return t === 'light' || t === 'dark' ? t : 'auto'; } catch (e) { return 'auto'; } };
function applyTheme(t){
  const el = document.documentElement;
  if (t === 'light' || t === 'dark') el.setAttribute('data-theme', t); else el.removeAttribute('data-theme');
  const dark = t === 'dark' || (t !== 'light' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#1c2320' : '#f7f5ef');
}
function setTheme(t){ try { if (t === 'auto') localStorage.removeItem('gk-theme'); else localStorage.setItem('gk-theme', t); } catch (e) {} applyTheme(t); render(); }
const themeSec = () => `<h2>表示の色</h2><div class="card"><div class="seg">${[['auto','端末と同じ'],['light','ライト'],['dark','ダーク']].map(([k, l]) => `<button type="button" data-theme-set="${k}" class="${getTheme() === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(getTheme()));

// ---- ここから：パックの取り込み・端末への保存・設定（試作には無かった部分） ----
const DB_NAME = 'genba-karte', STORE_META = 'meta', STORE_TASU = 'tasu';
let db = null;
function dbOpen(){
  return new Promise((ok, ng) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(STORE_META)) d.createObjectStore(STORE_META); if (!d.objectStoreNames.contains(STORE_TASU)) d.createObjectStore(STORE_TASU, {keyPath: 'uid'}); };
    r.onsuccess = () => { db = r.result; ok(db); };
    r.onerror = () => ng(r.error);
  });
}
const tx = (store, mode, fn) => new Promise((ok, ng) => { const t = db.transaction(store, mode), rq = fn(t.objectStore(store)); t.oncomplete = () => ok(rq && rq.result); t.onerror = () => ng(t.error); });
const dbGet = (store, key) => tx(store, 'readonly', s => s.get(key));
const dbPut = (store, val, key) => tx(store, 'readwrite', s => key === undefined ? s.put(val) : s.put(val, key));
const dbAll = store => tx(store, 'readonly', s => s.getAll());
const dbDel = (store, key) => tx(store, 'readwrite', s => s.delete(key));

function toast(msg){
  let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3200);
}

/** パックの形を確かめる。だめな時は理由を返す */
function packProblem(p){
  if (!p || typeof p !== 'object') return 'ファイルの中身が読めません';
  if (p.kind !== 'genba-karte-pack') return '現場カルテのパックではありません';
  if (p.schema !== 1) return 'このアプリでは読めない版のパックです（schema ' + p.schema + '）。アプリを最新にしてください';
  if (!Array.isArray(p.cards) || !p.bukken || !p.lists) return 'パックの中身が足りません';
  return '';
}
/** パックを受け取る口は、ここ1つ。ファイルからでも、将来の窓口からでも、同じ形で入れる */
async function receivePack(p){
  const bad = packProblem(p); if (bad) throw new Error(bad);
  await dbPut(STORE_META, p, 'pack'); usePack(p);
}
async function importFile(file){
  try {
    const p = JSON.parse(await file.text());
    await receivePack(p);
    toast('取り込みました（カード ' + CARDS.length + ' 枚・現場 ' + Object.keys(BUKKEN).length + '）');
    if (location.search) { location.href = location.pathname + '#/'; return; }
    location.hash = '#/'; render();
  } catch (e) { toast('取り込めませんでした：' + String(e.message).slice(0, 60)); }
}

function welcome(){
  return `<div class="brand">${img('icon-96.png')}<div><b>現場カルテ</b><span>建てた時も、その後も。</span></div>${acts()}</div>
    <div class="hero">${img('hero.webp')}</div>
    <div class="card welcomeCard" style="margin-top:-18px;position:relative"><b style="font-size:17px;color:var(--heading)">カルテパックを取り込んでください</b>
      <p class="lead" style="margin:6px 0 14px">事例カードと現場の一覧は、アプリには入っていません。受け取った「カルテパック」のファイル（.json）を選ぶと、この端末に入ります。</p>
      <button class="btn green" id="imp">${ic('down')}ファイルから取り込む</button>
      <a class="more" href="?demo=1" id="demo">作りもののデータで試す（デモ）</a></div>
    <div class="foot">現場カルテ v${APP_VERSION}</div>`;
}
function settei(){
  const has = !!D;
  return `<h2>${ic('book')}カルテパック</h2>
    <div class="card">${has ? `<div>版：<b>${esc(D.version || D.built || '不明')}</b>${D.demo ? '　<span class="pill wait">デモ</span>' : ''}</div>
        <div class="lead" style="margin:4px 0 12px">カード ${CARDS.length} 枚・現場 ${Object.keys(BUKKEN).length}・現場名 ${HAS_NAMES ? 'あり（社内のみ）' : 'なし'}</div>` : '<div class="lead">まだ入っていません。</div>'}
      <button class="btn green" id="imp">${ic('down')}${has ? '新しいパックを取り込む' : 'ファイルから取り込む'}</button></div>
    <h2>${ic('plus')}この端末で足した物<small>${TASU.length} 件</small></h2>
    <div class="card">${TASU.length ? `<div class="list" style="gap:6px;margin-bottom:12px">${TASU.slice().reverse().slice(0, 30).map(x => `<div class="rw"><span class="k">${esc(x['物件'])}　${esc(x['場面'] || '')}</span><div class="v">${esc(x['題'])}</div><button class="chip" data-del="${esc(x.uid)}" style="margin-top:6px">消す</button></div>`).join('')}</div>
        <button class="btn green" id="exp">${ic('save')}まとめて書き出す（${TASU.length} 件）</button>
        <p class="lead" style="margin:10px 0 0">書き出したファイルを、決まった場所に置いてください。書き出しても、端末の中の物は消えません。</p>` : '<div class="lead" style="margin:0">まだありません。「足す」から入れられます。</div>'}</div>
    ${themeSec()}
    <h2>${ic('gear')}アプリ</h2>
    <div class="card"><div class="lead">現場カルテ v${APP_VERSION}</div><button class="btn green" id="upd" style="background:var(--surface);color:var(--primary);border:1.5px solid var(--primary)">アプリ本体を最新にする</button>
      <p class="lead" style="margin:10px 0 0">取り込んだパックと、足した物は、端末に残ります。</p></div>`;
}
async function saveTasu(d){
  if (!d['題'] || !d['物件']) { $('#f-out').innerHTML = '<div class="note">「現場を選ぶ」と「何があった」を入れてください。</div>'; return; }
  const pp = decodeURIComponent(location.hash).split('/');
  if (pp[3] && byId[pp[3]]) d['足す先'] = pp[3];
  d.uid = 'local-' + Date.now(); d['入れた日'] = new Date().toISOString().slice(0, 10); d['作成'] = '現場カルテで入力（人が書いた物）';
  try { localStorage.setItem('gk-role', d['役割'][0]); } catch (e) {}
  await dbPut(STORE_TASU, d); TASU.push(d);
  toast('この端末に保存しました（' + TASU.length + ' 件）');
  location.hash = '#/settei';
}
function exportTasu(){
  const out = {kind: 'genba-karte-tasu', schema: 1, exported_at: new Date().toISOString(), pack_version: D ? (D.version || D.built || '') : '', items: TASU};
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], {type: 'application/json'}));
  a.download = 'カルテ_足す_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('書き出しました（' + TASU.length + ' 件）');
}
async function updateApp(){
  try { if ('caches' in window) for (const k of await caches.keys()) if (k.startsWith('genba-karte-')) await caches.delete(k);
    if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) if (r.scope.includes('/genba-karte/')) await r.unregister(); } catch (e) {}
  location.reload();
}
function render(){
  const tab = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/')[0] || 'home';
  const nav = document.querySelector('.tab');
  if (tab !== 'oshirase') annOpened = false;
  if (!D && tab !== 'settei' && tab !== 'oshirase') { document.body.classList.add('home'); nav.hidden = true; $('#app').innerHTML = welcome(); window.scrollTo(0, 0); return; }
  nav.hidden = false;
  renderApp();
}
document.addEventListener('click', e => {
  const tk = e.target.closest('[data-tk]'); if (tk) { const cur = $('#f-b').value; document.querySelectorAll('#f-ki .chip').forEach(b => b.classList.toggle('on', b === tk)); $('#f-b').innerHTML = tasuOpts(tk.dataset.tk, cur); return; }
  const th = e.target.closest('[data-theme-set]'); if (th) { setTheme(th.dataset.themeSet); return; }
  const an = e.target.closest('[data-ann]'); if (an) { annTab = an.dataset.ann; render(); return; }
  if (e.target.closest('#imp')) { $('#packFile').click(); return; }
  if (e.target.closest('#exp')) { exportTasu(); return; }
  if (e.target.closest('#upd')) { updateApp(); return; }
  const del = e.target.closest('[data-del]');
  if (del && confirm('この1件を端末から消します。よろしいですか？')) { dbDel(STORE_TASU, del.dataset.del).then(() => { TASU = TASU.filter(x => x.uid !== del.dataset.del); render(); }); }
});
document.addEventListener('change', e => { if (e.target.id === 'kiSel') { lastKi = e.target.value; render(); return; }
  if (e.target.id === 'packFile' && e.target.files[0]) { importFile(e.target.files[0]); e.target.value = ''; } });
async function boot(){
  applyTheme(getTheme());
  try { await dbOpen(); TASU = (await dbAll(STORE_TASU)) || []; } catch (e) { toast('この端末の保存場所が使えません（プライベートブラウズでは保存されません）'); }
  const demo = /[?&]demo=1/.test(location.search);
  try { const p = !demo && db ? await dbGet(STORE_META, 'pack') : null; if (p && !packProblem(p)) usePack(p); } catch (e) {}
  if (!D && demo && window.KARTE_DEMO) usePack(window.KARTE_DEMO);
  render();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
boot();
