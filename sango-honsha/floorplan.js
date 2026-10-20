/* 建物の中のマップ（平面図ビューア）。リーダー・管理者で同じファイルを使う
 * 平面図の画像は、社内の資料なので、窓口（Google）から受け取る（このファイルには入っていない）。
 *   fpOpen({ title, load, status, onEquip, equipAction, art })   → { close }
 *     load()          … Promise<{ note, floors: [{ id, label, w, h, img, guide, equip }] }>
 *                       equip＝その階の機器 [{ id, type, no, icon, insp, room, model, place, memo, x, y }]（x・y は 0〜1）
 *     status(eq)      … 機器の点検の状態 { st, freq, title, cycle, last, due }（アプリの点検のデータから）。無ければピンは出さない
 *                       st＝over（期限超過）／soon（期限が近い・今月）／done（済・次の予定）／none（まだ記録なし）／na（この建物に項目なし）
 *                       freq＝m1（毎月）／m3／m6／y1（年1回）／season（季節）
 *     onEquip(eq, close) … 詳しい札のボタン（equipAction の文字）を押した時。点検のページへ移る
 *     art             … 点検の絵の場所（"art/insp-" ＋ icon ＋ ".webp"）
 *     prepare()       … ピンを描く前に1回だけ呼ぶ（アプリが、点検の記録の索引を作り直す。ピンごとに作り直さないため）
 *     focus           … 点検の番号。その点検の機器だけを濃く出す（点検の記録の画面から「図で場所を見る」）。絞り込みのボタンは出さない
 *     marked(eq)      … true の機器に「✓」（点検の記録の画面で、印を付けた機器）。focus の時は、札のボタンを押しても図を閉じず、ピンを描き直す
 *     equipAction     … 札のボタンの文字（関数なら eq を受け取って文字を返す）
 *     onClose()       … 図を閉じた時
 *     noPlan          … true なら「元の図面」の切替を出さない（管理者。案内図もイラストもない棟は、元の図面だけを出す）
 *     mount           … 要素を渡すと、画面いっぱいではなく、その中に図を埋め込む（点検のタブ）。上の帯（戻る）は出さない
 *     filter(eq, s)   … 渡すと、絞り込みはアプリ側で決める（false のピンはうすく）。図の中の頻度のボタンは出さない
 *     hint            … 図の下の説明（凡例のあとの文）を差し替える
 *     onExpand()      … mount の時に、右上に「大きく見る」を出す。押した時に呼ぶ（アプリが、画面いっぱいの図を開く）
 *   戻り値 { close, redraw(), focusItem(no) } … redraw＝ピンを描き直す（絞り込み・記録が変わった時）
 *                                             focusItem＝その点検の機器だけを濃く（null で戻す）。その機器がある階に切り替える
 * 「全体」は、図の白い余白を除いた、建物の部分が画面の中央に来るように合わせる（階を切り替えても、真ん中がそろう）
 * 操作：ドラッグで動かす／2本指（ホイール）で拡大・縮小／ダブルタップで拡大／ボタンの＋－
 */
(function () {
  var CSS = ".fpBack{position:fixed;inset:0;z-index:90;background:#f4f2ec;display:flex;flex-direction:column}"
    + ".fpHead{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#244f37;color:#fff}.fpHead h3{margin:0;font-size:17px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
    + ".fpClose{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:10px;padding:8px 14px;font-size:15px;font-weight:700;cursor:pointer}"
    + ".fpTabs{display:flex;gap:8px;padding:8px 12px;background:#fff;border-bottom:1px solid #d9d4c5;overflow-x:auto}"
    + ".fpTab{border:1px solid #244f37;background:#fff;color:#244f37;border-radius:16px;padding:6px 16px;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap}.fpTab.on{background:#244f37;color:#fff}"
    + ".fpStage{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;background:#fbf9f3;cursor:grab}.fpStage.drag{cursor:grabbing}"
    + ".fpInner{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}.fpInner img{display:block;user-select:none;-webkit-user-drag:none;pointer-events:none}"
    + ".fpPins{position:absolute;inset:0}.fpPin{position:absolute;transform:translate(-50%,-100%) scale(var(--inv,1));transform-origin:50% 100%;min-width:26px;height:26px;border-radius:13px 13px 13px 2px;border:2px solid #fff;background:#2f6b45;color:#fff;font-size:12px;font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer;padding:0 6px}"
    + ".fpPin.over{background:#a3322a}.fpPin.soon{background:#b07a3f}.fpPin.none{background:#8a8f84}"
    + ".fpCtl{position:absolute;right:10px;bottom:10px;display:flex;flex-direction:column;gap:6px}.fpCtl button{width:42px;height:42px;border-radius:21px;border:1px solid #244f37;background:#fff;color:#244f37;font-size:20px;font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer}"
    + ".fpSw{position:absolute;left:10px;top:10px;display:flex;border:1px solid #244f37;border-radius:18px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.25)}.fpSw button{border:0;background:#fff;color:#244f37;padding:8px 14px;font-size:14px;font-weight:700;cursor:pointer}.fpSw button.on{background:#244f37;color:#fff}"
    + ".fpNote{padding:8px 14px calc(8px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #d9d4c5;font-size:12.5px;color:#5a645d;line-height:1.5}"
    + ".fpEq{position:absolute;width:0;height:0;border:0;padding:0;background:none;cursor:pointer}.fpEq>i{position:absolute;left:0;top:0;transform:scale(var(--inv,1));transform-origin:0 0;display:block}"
    + ".fpEq b.h{position:absolute;left:-20px;top:-58px;width:40px;height:40px;border-radius:50%;background:#fff;border:4px solid var(--c);box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}"
    + ".fpEq b.h img{width:30px;height:30px;border-radius:50%}.fpEq b.t{position:absolute;left:-8px;top:-20px;border-left:8px solid transparent;border-right:8px solid transparent;border-top:16px solid var(--c)}"
    + ".fpEq b.n{position:absolute;left:12px;top:-64px;min-width:18px;height:18px;border-radius:9px;background:var(--c);color:#fff;border:2px solid #fff;font:800 11px/14px sans-serif;text-align:center;padding:0 3px}"
    + ".fpEq b.g{position:absolute;right:14px;top:-66px;border-radius:4px;color:#fff;border:1.5px solid #fff;font:800 10px/13px sans-serif;padding:0 3px;white-space:nowrap}.fpEq b.g.out{background:#3f6f8f}.fpEq b.g.under{background:#8a6a3a}"
    + ".fpEq b.c{position:absolute;left:0;top:2px;transform:translateX(-50%);white-space:nowrap;font:700 11px/16px sans-serif;color:#fff;background:var(--c);border-radius:8px;padding:0 6px;box-shadow:0 1px 2px rgba(0,0,0,.25)}"
    + ".fpEq.over{--c:#a3322a}.fpEq.soon{--c:#c27a1e}.fpEq.done{--c:#2f6b45}.fpEq.none{--c:#8a8f84}.fpEq.na{--c:#b9bdb5}.fpEq.dim{opacity:.18;pointer-events:none}.fpPins.small .fpEq b.c{display:none}.fpEq.sel b.h{box-shadow:0 0 0 5px rgba(36,79,55,.35)}"
    + ".fpFlt{position:absolute;left:10px;right:62px;bottom:10px;display:flex;gap:6px;overflow-x:auto;padding:2px}.fpFlt button{flex:none;border:1px solid #244f37;background:#fff;color:#244f37;border-radius:16px;padding:6px 12px;font-size:13px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:pointer}.fpFlt button.on{background:#244f37;color:#fff}.fpFlt button small{font-weight:600;opacity:.8;margin-left:3px}"
    + ".fpCard{position:absolute;left:50%;bottom:60px;transform:translateX(-50%);width:min(380px,calc(100% - 20px));background:#fff;border-radius:14px;box-shadow:0 4px 18px rgba(0,0,0,.3);padding:12px 14px;font-size:14px;color:#1f2a24}"
    + ".fpCard .hd{display:flex;gap:10px;align-items:center}.fpCard .hd img{width:44px;height:44px;border-radius:10px;background:#f4f1e8}.fpCard h4{margin:0;font-size:16px}.fpCard .sub{font-size:12.5px;color:#5a645d}"
    + ".fpCard .st{margin:8px 0 4px;padding:6px 10px;border-radius:8px;font-weight:800;color:#fff;background:var(--c)}.fpCard .rw{font-size:13px;margin:2px 0}.fpCard .memo{font-size:12px;color:#a3322a;margin-top:4px}"
    + ".fpCard .bt{display:flex;gap:8px;margin-top:10px}.fpCard .bt button{flex:1;min-height:40px;border-radius:10px;border:1px solid #244f37;background:#fff;color:#244f37;font-weight:800;font-size:14px;cursor:pointer}.fpCard .bt button.pr{background:#244f37;color:#fff}"
    + ".fpCard.over{--c:#a3322a}.fpCard.soon{--c:#c27a1e}.fpCard.done{--c:#2f6b45}.fpCard.none,.fpCard.na{--c:#8a8f84}"
    + ".fpCard .hs{margin-top:6px;padding-top:6px;border-top:1px solid #e3e0d6;font-size:12.5px}.fpCard .hs b{display:block;font-size:12px;color:#5a645d;margin-bottom:2px}.fpCard .hs small{display:block;color:#5a645d;font-size:11.5px}"
    + ".fpEq b.k{position:absolute;left:-30px;top:-66px;width:20px;height:20px;border-radius:10px;background:#2f6b45;color:#fff;border:2px solid #fff;font:800 12px/16px sans-serif;text-align:center}"
    + ".fpFocus{position:absolute;left:10px;right:62px;bottom:10px;background:#fff;border:1px solid #244f37;border-radius:12px;padding:6px 10px;font-size:13px;color:#244f37;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.2)}"
    + ".fpLeg{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:4px}.fpLeg span:before{content:'';display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px;background:var(--c)}"
    + ".fpLeg .over{--c:#a3322a}.fpLeg .soon{--c:#c27a1e}.fpLeg .done{--c:#2f6b45}.fpLeg .none{--c:#8a8f84}"
    + ".fpBack.fpInline{position:relative;inset:auto;z-index:auto;height:min(56vh,520px);border:1px solid #d9d4c5;border-radius:14px;overflow:hidden;margin:0 0 12px}.fpInline .fpHead{display:none}.fpInline .fpTabs{padding:6px 10px}.fpInline .fpNote{padding:6px 10px;font-size:12px}.fpInline .fpCard{bottom:8px;max-height:calc(100% - 16px);overflow:auto}"
    + ".fpBig{position:absolute;right:10px;top:10px;border:1px solid #244f37;background:#244f37;color:#fff;border-radius:18px;padding:7px 14px;font-size:14px;font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,.25);cursor:pointer}"
    + ".fpMsg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#5a645d;font-size:15px}";
  function addCss() { if (document.getElementById("fpCss")) return; var s = document.createElement("style"); s.id = "fpCss"; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }


  /* ---------- 平面図の受け取り（3アプリ共通）----------
   * 窓口（Google）は、たまに30秒近く待たせたり、中身のない返事（404・service だけ）を返す。
   * → 版の情報は1回だけ聞く（失敗は覚えない）／建物ごとに端末へ控え（IndexedDB「sango-fp」）、版が同じなら控えを使う／
   *   受け取りは、短めの待ち時間で何回かやり直す／新しい版を受け取れない時は、前の版の控えで見せる／同じ建物を同時に2回取りに行かない
   *   fpPlanInfo(api)       … Promise<{ version, buildings } | null>
   *   fpPlanLoad(api, bid)  … Promise<{ note, floors }>
   *   api(body, ms)         … 各アプリの apiCall */
  var FPC = { info: null, infoP: null, mem: {}, run: {} };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function idb() {
    return new Promise(function (res) {
      try { var q = indexedDB.open("sango-fp", 1); q.onupgradeneeded = function () { q.result.createObjectStore("plan"); }; q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; } catch (e) { res(null); }
    });
  }
  function cacheGet(bid) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(null); try { var r = db.transaction("plan").objectStore("plan").get(bid); r.onsuccess = function () { res(r.result || null); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); }); }
  function cachePut(bid, rec) { return idb().then(function (db) { if (!db) return; try { db.transaction("plan", "readwrite").objectStore("plan").put(rec, bid); } catch (e) { /* 控えられなくても、見られる */ } }); }
  window.fpPlanInfo = function (api) {
    if (FPC.info) return Promise.resolve(FPC.info);
    if (!FPC.infoP) FPC.infoP = (async function () {
      for (var i = 0; i < 3; i++) {
        try { var j = await api({ action: "floorPlanInfo" }, 30000); if (j && j.buildings && j.version) { FPC.info = j; return j; } } catch (e) { /* もう一度 */ }
        await sleep(1200);
      }
      return null;
    })().then(function (v) { FPC.infoP = null; return v; });
    return FPC.infoP;
  };
  window.fpPlanLoad = function (api, bid) {
    if (FPC.run[bid]) return FPC.run[bid];
    var p = (async function () {
      var c = FPC.mem[bid] || await cacheGet(bid);
      var info = await window.fpPlanInfo(api), ver = info && info.version;
      if (c && c.data && (!ver || c.version === ver)) { FPC.mem[bid] = c; return c.data; }   // 版が同じ（または版が分からない）なら控え
      var err = null;
      for (var i = 0; i < 4; i++) {
        try {
          var j = await api({ action: "floorPlanGet", building: bid }, 45000);
          if (j && Array.isArray(j.floors) && j.floors.length) { var rec = { version: j.version || ver || "", data: { note: j.note, floors: j.floors } }; FPC.mem[bid] = rec; cachePut(bid, rec); return rec.data; }
        } catch (e) { err = e; }
        await sleep(1000 * (i + 1));
      }
      if (c && c.data) return c.data;   // 新しい版を受け取れない時は、前の版で見せる
      throw err || new Error("平面図を受け取れませんでした");
    })();
    FPC.run[bid] = p;
    p.then(function () { delete FPC.run[bid]; }, function () { delete FPC.run[bid]; });
    return p;
  };
  window.fpPlanCached = function (bid) { return FPC.mem[bid] ? Promise.resolve(true) : cacheGet(bid).then(function (c) { return !!(c && c.data); }); };

  window.fpOpen = function (o) {
    addCss();
    var root = document.createElement("div"); root.className = "fpBack" + (o.mount ? " fpInline" : "");
    root.innerHTML = '<div class="fpHead"><button class="fpClose">← 戻る</button><h3>' + esc(o.title || "平面図") + '</h3></div><div class="fpTabs"></div>'
      + '<div class="fpStage"><div class="fpMsg">読み込んでいます…<br><small>初めて開く時・図が新しくなった時は、30秒ほどかかることがあります</small></div></div><div class="fpNote"></div>';
    if (o.mount) { o.mount.innerHTML = ""; o.mount.appendChild(root); } else document.body.appendChild(root);
    var prevOverflow = document.body.style.overflow; if (!o.mount) document.body.style.overflow = "hidden";
    var close = function () { if (!root.parentNode) return; if (!o.mount) document.body.style.overflow = prevOverflow; document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); root.remove(); if (o.onClose) o.onClose(); };   // 閉じたら、図のデータを持ち続けないように、見張りも外す
    var onKey = function (e) { if (e.key === "Escape" && !o.mount) close(); };
    document.addEventListener("keydown", onKey);
    root.querySelector(".fpClose").onclick = close;
    var stage = root.querySelector(".fpStage"), tabs = root.querySelector(".fpTabs"), note = root.querySelector(".fpNote");
    var st = { sc: 1, min: 0.1, tx: 0, ty: 0, floor: null, w: 0, h: 0, inner: null, pins: null, cb: null, flt: "", sel: "", focus: o.focus || 0, floors: [] };
    var FREQ = [["m1", "毎月"], ["m3", "3か月"], ["m6", "半年"], ["y1", "年1回"], ["season", "季節"]];
    var STL = { over: "期限超過", soon: "期限が近い", done: "済（次の予定あり）", none: "まだ記録なし", na: "この建物には、まだ点検の項目がありません" };
    var art = o.art || "art/insp-";
    function md(s) { var p = String(s || "").split("-"); return p.length === 3 ? (+p[1]) + "/" + (+p[2]) : ""; }
    function eqName(eq) { return eq.type + (eq.no ? " " + eq.no : ""); }
    function eqStat(eq) { var s = o.status ? o.status(eq) : null; return s || { st: "na", freq: "" }; }
    function caption(s) { return s.st === "over" ? "超過" : s.st === "soon" ? "〜" + md(s.due) : s.st === "done" ? "次 " + md(s.due) : s.st === "none" ? "未記録" : ""; }
    function match(s, eq) {
      if (st.focus) return eq.insp === st.focus;   // 点検の記録の画面から・一覧から：その点検の機器だけ
      if (o.filter) return !!o.filter(eq, s);      // 絞り込みはアプリ側（点検のタブ）
      return !st.flt || (st.flt === "due" ? (s.st === "over" || s.st === "soon") : s.freq === st.flt);
    }
    var boxes = {};   // 図ごとの、建物の部分の範囲（画像の px）

    // 図の、余白でない部分（四すみの色と違う所）の範囲を、小さく描いて調べる。調べられない時は、図の全体
    function contentBox(img, key, w, h) {
      if (boxes[key]) return boxes[key];
      var all = { x: 0, y: 0, w: w, h: h };
      try {
        var k = Math.min(1, 400 / Math.max(w, h)), cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
        var c = document.createElement("canvas"); c.width = cw; c.height = ch;
        var g = c.getContext("2d"); g.drawImage(img, 0, 0, cw, ch);
        var d = g.getImageData(0, 0, cw, ch).data, bg = [d[0], d[1], d[2]];
        var x0 = cw, y0 = ch, x1 = -1, y1 = -1;
        for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) {
          var i = (y * cw + x) * 4;
          if (d[i + 3] > 40 && Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 36) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 < x0 || (x1 - x0) < cw * 0.2 || (y1 - y0) < ch * 0.2) return (boxes[key] = all);
        return (boxes[key] = { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k });
      } catch (e) { return all; }
    }

    function apply() {
      if (!st.inner) return;
      st.inner.style.transform = "translate(" + st.tx + "px," + st.ty + "px) scale(" + st.sc + ")";
      if (st.pins) {   // ピンの大きさ：小さい画面の「全体」では小さく、拡大すると元の大きさに（重なりを減らす）
        var ps = Math.max(0.5, Math.min(1, (stage.clientWidth / 900) * (st.sc / (st.min || st.sc))));
        if (st.nnd) ps = Math.max(0.5, Math.min(ps, st.nnd * st.sc / 46));   // ピンが混み合う階は、となりのピンとの間に合わせて小さく（拡大すると元の大きさ）
        st.pins.style.setProperty("--inv", String(ps / st.sc));
        st.pins.classList.toggle("small", ps < 0.75);
      }
    }
    function clampPan() {   // 建物の部分（cb）が画面より小さい時は真ん中に。大きい時は、はみ出しすぎないように
      var sw = stage.clientWidth, sh = stage.clientHeight, b = st.cb || { x: 0, y: 0, w: st.w, h: st.h }, m = 60;
      var bx = b.x * st.sc, by = b.y * st.sc, bw = b.w * st.sc, bh = b.h * st.sc;
      st.tx = bw <= sw ? (sw - bw) / 2 - bx : Math.min(m - bx, Math.max(sw - bw - m - bx, st.tx));
      st.ty = bh <= sh ? (sh - bh) / 2 - by : Math.min(m - by, Math.max(sh - bh - m - by, st.ty));
    }
    function fit() { var sw = stage.clientWidth, sh = stage.clientHeight, b = st.cb || { w: st.w, h: st.h }; st.min = Math.min(sw / b.w, sh / b.h) * 0.94; st.sc = st.min; clampPan(); apply(); }
    function zoomAt(f, cx, cy) {
      var ns = Math.min(st.min * 8, Math.max(st.min, st.sc * f)); f = ns / st.sc;
      st.tx = cx - (cx - st.tx) * f; st.ty = cy - (cy - st.ty) * f; st.sc = ns; clampPan(); apply();
    }

    function show(floor) {
      st.floor = floor; st.w = floor.w; st.h = floor.h;
      var hasPins = !!(o.status && (floor.equip || []).length), v = st.view;
      var base = floor.illust || (floor.guide ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(floor.guide) : "");
      if (!base || (v === "plan" && !o.noPlan)) v = "plan"; else if (v === "fade" && !(floor.illust && hasPins)) v = "base"; else if (v !== "fade") v = "base";
      var src = v === "plan" ? floor.img : base;
      var btn = function (key, label) { return '<button data-v="' + key + '"' + (v === key ? ' class="on"' : "") + ">" + label + "</button>"; };
      var sw = base ? '<div class="fpSw">' + btn("base", floor.illust ? "イラスト" : "案内図") + (floor.illust && hasPins ? btn("fade", "点検用") : "") + (o.noPlan ? "" : btn("plan", "元の図面")) + "</div>" : "";
      if (sw && o.noPlan && !(floor.illust && hasPins)) sw = "";   // 切り替えるものが1つだけなら、切替は出さない
      stage.innerHTML = '<div class="fpInner"><img alt="" style="width:100%;height:100%' + (v === "fade" ? ";filter:saturate(.35) brightness(1.12) contrast(.85)" : "") + '" src="' + src + '"><div class="fpPins"></div></div>' + sw + '<div class="fpCtl"><button data-z="in">＋</button><button data-z="out">－</button><button data-z="fit" style="font-size:13px">全体</button></div>';
      stage.querySelectorAll(".fpSw button").forEach(function (b) { b.onclick = function () { st.view = b.dataset.v; show(floor); }; b.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); });
      st.inner = stage.querySelector(".fpInner"); st.pins = stage.querySelector(".fpPins"); st.cb = null;
      var im = st.inner.querySelector("img"), key = floor.id + ":" + (v === "plan" ? "plan" : "base");
      var onImg = function () { if (st.floor !== floor) return; st.cb = contentBox(im, key, st.w, st.h); fit(); };
      if (im.complete && im.naturalWidth) setTimeout(onImg, 0); else im.addEventListener("load", onImg);
      st.inner.style.width = st.w + "px"; st.inner.style.height = st.h + "px";
      drawEquip(floor);
      if (o.mount && o.onExpand) {   // 埋め込みの図：画面いっぱいで見る
        var big = document.createElement("button"); big.className = "fpBig"; big.textContent = "⤢ 大きく見る";
        big.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); big.onclick = function () { o.onExpand(); };
        stage.appendChild(big);
      }
      stage.querySelectorAll(".fpCtl button").forEach(function (b) { b.onclick = function () { var z = b.dataset.z, cx = stage.clientWidth / 2, cy = stage.clientHeight / 2; if (z === "fit") fit(); else zoomAt(z === "in" ? 1.5 : 1 / 1.5, cx, cy); }; b.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); });
      fit();
      Array.prototype.forEach.call(tabs.querySelectorAll(".fpTab"), function (t) { t.classList.toggle("on", t.dataset.f === floor.id); });
    }

    // ---- 機器のピン・絞り込み・詳しい札 ----
    function drawEquip(floor) {
      var list = (o.status && floor.equip) || [];
      st.nnd = 0;
      st.pins.innerHTML = "";
      var old = stage.querySelector(".fpFlt, .fpFocus"); if (old) old.remove();
      if (!list.length) return;
      if (o.prepare) o.prepare();
      var stats = list.map(eqStat);
      // となりのピンまでの距離（図の px、近い方から3割の所）。混み合っているかの目安
      var nn = list.map(function (a) { var m = 1e9; list.forEach(function (b) { if (a !== b) m = Math.min(m, Math.hypot((a.x - b.x) * st.w, (a.y - b.y) * st.h)); }); return m; }).sort(function (a, b) { return a - b; });
      st.nnd = nn.length > 1 ? nn[Math.floor(nn.length * 0.3)] : 0; apply();
      list.forEach(function (eq, i) {
        var s = stats[i], b = document.createElement("button");
        b.className = "fpEq " + s.st + (match(s, eq) ? "" : " dim") + (st.sel === eq.id ? " sel" : "");
        b.style.left = eq.x * 100 + "%"; b.style.top = eq.y * 100 + "%"; b.title = eqName(eq);
        var cap = caption(s);
        b.innerHTML = '<i><b class="t"></b><b class="h"><img alt="" src="' + art + esc(eq.icon) + '.webp"></b>' + (eq.no ? '<b class="n">' + eq.no + "</b>" : "")
          + (eq.place === "out" ? '<b class="g out">外</b>' : eq.place === "under" ? '<b class="g under">床下</b>' : "") + (cap ? '<b class="c">' + esc(cap) + "</b>" : "") + (o.marked && o.marked(eq) ? '<b class="k">✓</b>' : "") + "</i>";
        b.onclick = function (e) { e.stopPropagation(); if (st.moved > 8) return; st.sel = eq.id; drawEquip(floor); card(eq, s); };   // 図を動かした時は、ピンを押した扱いにしない
        st.pins.appendChild(b);
      });
      if (st.focus) {   // 点検の記録の画面から来た時は、絞り込みの代わりに案内
        var fb = document.createElement("div"); fb.className = "fpFocus";
        var nF = list.filter(function (eq) { return eq.insp === st.focus; }).length;
        fb.textContent = nF ? "この点検の機器（" + nF + "）だけを濃く出しています" + (o.onEquip && o.focus ? "。ピンを押して、印を付けられます" : "") : "この階には、この点検の機器はありません";
        fb.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        stage.appendChild(fb); return;
      }
      if (o.filter) return;   // 絞り込みはアプリ側。図の中のボタンは出さない
      // 絞り込み（頻度）：その階にある頻度だけ出す。対象外のピンは、うすく
      var has = {}; stats.forEach(function (s) { if (s.freq) has[s.freq] = (has[s.freq] || 0) + 1; });
      var nDue = stats.filter(function (s) { return s.st === "over" || s.st === "soon"; }).length;
      var bar = document.createElement("div"); bar.className = "fpFlt";
      var chip = function (k, label, n) { return '<button data-k="' + k + '"' + (st.flt === k ? ' class="on"' : "") + ">" + label + (n != null ? "<small>" + n + "</small>" : "") + "</button>"; };
      bar.innerHTML = chip("", "すべて", list.length) + FREQ.filter(function (f) { return has[f[0]]; }).map(function (f) { return chip(f[0], f[1], has[f[0]]); }).join("") + (nDue ? chip("due", "期限が近い・超過", nDue) : "");
      bar.querySelectorAll("button").forEach(function (x) { x.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); x.onclick = function () { st.flt = x.dataset.k; st.sel = ""; var oc = stage.querySelector(".fpCard"); if (oc) oc.remove(); drawEquip(floor); }; });   // 絞り込んだら、開いていた札は閉じる
      stage.appendChild(bar);
    }
    function card(eq, s) {
      var oc = stage.querySelector(".fpCard"); if (oc) oc.remove();
      var c = document.createElement("div"); c.className = "fpCard " + s.st;
      c.innerHTML = '<div class="hd"><img alt="" src="' + art + esc(eq.icon) + '.webp"><div><h4>' + esc(eqName(eq)) + (eq.place === "out" ? "（外）" : eq.place === "under" ? "（床下）" : "") + '</h4><div class="sub">' + esc(eq.room) + (eq.model ? "　" + esc(eq.model) : "") + "</div></div></div>"
        + '<div class="st">' + esc(STL[s.st] || "") + (s.st === "over" || s.st === "soon" ? "　期限 " + esc(md(s.due)) : "") + "</div>"
        + (s.title ? '<div class="rw">点検：' + esc(s.title) + (s.cycle ? "（" + esc(s.cycle) + "）" : "") + "</div>" : "")
        + (s.st !== "na" ? '<div class="rw">前回：' + (s.last ? esc(md(s.last.done_on)) + (s.last.done_by ? "　" + esc(s.last.done_by) + "さん" : "") : "まだ記録がありません") + "</div>" : "")
        + (s.due ? '<div class="rw">次の期限：' + esc(String(s.due).replace(/-/g, "/")) + "</div>" : "")
        + (s.st !== "na" && s.hist ? '<div class="hs"><b>この機器の点検</b>' + (s.hist.length ? s.hist.slice(0, 3).map(function (l) {
            return "<div>" + esc(md(l.done_on)) + "　" + esc({ ok: "異常なし", issue: "要対応あり", pending: "報告書待ち" }[l.result] || "") + (l.done_by ? "　" + esc(l.done_by) + "さん" : "") + (l.memo ? '<small>' + esc(String(l.memo).slice(0, 60)) + "</small>" : "") + "</div>"; }).join("")
            : "<div><small>まだ記録がありません（点検の記録で、この機器に印を付けると出ます）</small></div>") + "</div>" : "")
        + (eq.memo ? '<div class="memo">' + esc(eq.memo) + "</div>" : "")
        + '<div class="bt">' + (o.onEquip && s.st !== "na" && (!st.focus || eq.insp === st.focus) ? '<button class="pr" data-a="go">' + esc((typeof o.equipAction === "function" ? o.equipAction(eq) : o.equipAction) || "点検のページへ") + "</button>" : "") + '<button data-a="x">閉じる</button></div>';
      c.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
      c.querySelector('[data-a="x"]').onclick = function () { st.sel = ""; c.remove(); drawEquip(st.floor); };
      var g = c.querySelector('[data-a="go"]'); if (g) g.onclick = function () {
        o.onEquip(eq, close);
        if (st.focus && o.focus && root.parentNode) { st.sel = ""; c.remove(); drawEquip(st.floor); }   // 記録の画面から：続けて印を付けられるように、閉じずに描き直す
      };
      stage.appendChild(c);
    }

    // ---- 操作 ----
    var ptrs = new Map(), last = null, lastTap = 0;
    st.moved = 0;
    stage.addEventListener("pointerdown", function (e) {
      if (!st.inner) return;
      var onPin = !!(e.target.closest && e.target.closest(".fpEq"));
      // ピンの上から始めた時は、指を捕まえない（捕まえると、ピンを押しても反応しない端末がある）。動かすのは、どちらでもできる
      if (!onPin) { try { stage.setPointerCapture(e.pointerId); } catch (er) { /* 捕まえられなくても、動かせるように */ } }
      if (!ptrs.size) st.moved = 0;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); stage.classList.add("drag");
      if (ptrs.size === 2) { var a = Array.from(ptrs.values()); last = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2 }; }
      var now = Date.now(); if (ptrs.size === 1 && now - lastTap < 300 && !onPin) { var r = stage.getBoundingClientRect(); if (st.sc > st.min * 1.2) fit(); else zoomAt(2.5, e.clientX - r.left, e.clientY - r.top); lastTap = 0; } else lastTap = onPin ? 0 : now;   // ピンを押した直後の図のタップを、ダブルタップとみなさない
    });
    stage.addEventListener("pointermove", function (e) {
      if (!ptrs.has(e.pointerId)) return;
      var p = ptrs.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      st.moved += Math.abs(dx) + Math.abs(dy);
      if (ptrs.size === 1) { st.tx += dx; st.ty += dy; clampPan(); apply(); }
      else if (ptrs.size === 2 && last) {
        var a = Array.from(ptrs.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx = (a[0].x + a[1].x) / 2, cy = (a[0].y + a[1].y) / 2, r = stage.getBoundingClientRect();
        zoomAt(d / last.d, cx - r.left, cy - r.top); st.tx += cx - last.cx; st.ty += cy - last.cy; clampPan(); apply(); last = { d: d, cx: cx, cy: cy };
      }
    });
    var up = function (e) { ptrs.delete(e.pointerId); if (ptrs.size < 2) last = null; if (!ptrs.size) stage.classList.remove("drag"); };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up); stage.addEventListener("pointerleave", up);
    stage.addEventListener("wheel", function (e) { if (!st.inner || (o.mount && !e.ctrlKey)) return; e.preventDefault(); var r = stage.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    stage.addEventListener("scroll", function () { stage.scrollTop = 0; stage.scrollLeft = 0; });   // ボタンを押した時に、ブラウザが中を動かすのを戻す（図は transform で動かす）
    function onResize() { if (st.inner && document.body.contains(root)) fit(); }
    window.addEventListener("resize", onResize);

    // ---- 読み込み ----
    Promise.resolve().then(o.load).then(function (d) {
      var fl = (d && d.floors) || [];
      if (!fl.length) { stage.innerHTML = '<div class="fpMsg">この建物の平面図は、まだありません。</div>'; return; }
      tabs.innerHTML = fl.map(function (f) { return '<button class="fpTab" data-f="' + esc(f.id) + '">' + esc(f.label || f.id) + "</button>"; }).join("");
      tabs.querySelectorAll(".fpTab").forEach(function (b) { b.onclick = function () { show(fl.filter(function (f) { return f.id === b.dataset.f; })[0]); }; });
      if (fl.length < 2) tabs.hidden = true;
      st.floors = fl;
      var withEq = !!o.status && fl.some(function (f) { return (f.equip || []).length; });
      note.innerHTML = (withEq && o.focus ? "" : withEq ? '<div class="fpLeg"><span class="over">期限超過</span><span class="soon">期限が近い</span><span class="done">済（下の日付は次の期限）</span><span class="none">まだ記録なし</span></div>' + (o.hint != null ? esc(o.hint) : "ピンを押すと、点検の状態が出ます。下のボタンで、毎月・年1回などに絞れます。") : "")
        + esc(d.note || "設計時点の図です。実際と違う所は、現地確認で直します。") + (withEq ? "" : "　（機器のピンは、現地確認のあと、ここに入ります）");
      show(floorOf(st.focus) || fl[0]);   // 点検の記録の画面から：その点検の機器がある階から
    }).catch(function (e) { stage.innerHTML = '<div class="fpMsg">平面図を読み込めませんでした。<br>電波のある所で、もう一度開いてください。<br><small>' + esc(String((e && e.message) || e).slice(0, 80)) + "</small></div>"; });
    function floorOf(no) { return no ? st.floors.filter(function (f) { return (f.equip || []).some(function (e) { return e.insp === no; }); })[0] : null; }
    return {
      close: close,
      redraw: function () { if (st.floor) drawEquip(st.floor); },
      focusItem: function (no) {
        st.focus = no || 0; st.sel = ""; var oc = stage.querySelector(".fpCard"); if (oc) oc.remove();
        var f = floorOf(st.focus);
        if (f && f !== st.floor) show(f); else if (st.floor) { drawEquip(st.floor); fit(); }
      },
    };
  };
})();
