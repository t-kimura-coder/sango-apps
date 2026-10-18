/* 建物の中のマップ（平面図ビューア）。リーダー・管理者で同じファイルを使う
 * 平面図の画像は、社内の資料なので、窓口（Google）から受け取る（このファイルには入っていない）。
 *   fpOpen({ title, load, pins })
 *     load()          … Promise<{ note, floors: [{ id, label, w, h, img }] }>
 *     pins(floorId)   … （あとで使う）その階の機器のピン [{ id, x, y, label, tone }]（x・y は 0〜1。tone＝over/soon/ok/none）
 *     onPin(pin)      … （あとで使う）ピンを押した時
 *     noPlan          … true なら「元の図面」の切替を出さない（管理者。案内図もイラストもない棟は、元の図面だけを出す）
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
    + ".fpMsg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#5a645d;font-size:15px}";
  function addCss() { if (document.getElementById("fpCss")) return; var s = document.createElement("style"); s.id = "fpCss"; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  window.fpOpen = function (o) {
    addCss();
    var root = document.createElement("div"); root.className = "fpBack";
    root.innerHTML = '<div class="fpHead"><button class="fpClose">← 戻る</button><h3>' + esc(o.title || "平面図") + '</h3></div><div class="fpTabs"></div>'
      + '<div class="fpStage"><div class="fpMsg">読み込んでいます…</div></div><div class="fpNote"></div>';
    document.body.appendChild(root);
    var prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
    var close = function () { document.body.style.overflow = prevOverflow; document.removeEventListener("keydown", onKey); root.remove(); };
    var onKey = function (e) { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    root.querySelector(".fpClose").onclick = close;
    var stage = root.querySelector(".fpStage"), tabs = root.querySelector(".fpTabs"), note = root.querySelector(".fpNote");
    var st = { sc: 1, min: 0.1, tx: 0, ty: 0, floor: null, w: 0, h: 0, inner: null, pins: null, cb: null };
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
      if (st.pins) st.pins.style.setProperty("--inv", String(1 / st.sc));
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
      var hasPins = !!(o.pins && (o.pins(floor.id) || []).length), v = st.view;
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
      var list = (o.pins && o.pins(floor.id)) || [];
      list.forEach(function (p) { var b = document.createElement("button"); b.className = "fpPin " + (p.tone || ""); b.style.left = p.x * 100 + "%"; b.style.top = p.y * 100 + "%"; b.textContent = p.label || ""; b.onclick = function (ev) { ev.stopPropagation(); if (o.onPin) o.onPin(p); }; st.pins.appendChild(b); });
      stage.querySelectorAll(".fpCtl button").forEach(function (b) { b.onclick = function () { var z = b.dataset.z, cx = stage.clientWidth / 2, cy = stage.clientHeight / 2; if (z === "fit") fit(); else zoomAt(z === "in" ? 1.5 : 1 / 1.5, cx, cy); }; b.addEventListener("pointerdown", function (e) { e.stopPropagation(); }); });
      fit();
      Array.prototype.forEach.call(tabs.querySelectorAll(".fpTab"), function (t) { t.classList.toggle("on", t.dataset.f === floor.id); });
    }

    // ---- 操作 ----
    var ptrs = new Map(), last = null, lastTap = 0;
    stage.addEventListener("pointerdown", function (e) {
      if (!st.inner) return;
      stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); stage.classList.add("drag");
      if (ptrs.size === 2) { var a = Array.from(ptrs.values()); last = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx: (a[0].x + a[1].x) / 2, cy: (a[0].y + a[1].y) / 2 }; }
      var now = Date.now(); if (ptrs.size === 1 && now - lastTap < 300) { var r = stage.getBoundingClientRect(); if (st.sc > st.min * 1.2) fit(); else zoomAt(2.5, e.clientX - r.left, e.clientY - r.top); lastTap = 0; } else lastTap = now;
    });
    stage.addEventListener("pointermove", function (e) {
      if (!ptrs.has(e.pointerId)) return;
      var p = ptrs.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { st.tx += dx; st.ty += dy; clampPan(); apply(); }
      else if (ptrs.size === 2 && last) {
        var a = Array.from(ptrs.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), cx = (a[0].x + a[1].x) / 2, cy = (a[0].y + a[1].y) / 2, r = stage.getBoundingClientRect();
        zoomAt(d / last.d, cx - r.left, cy - r.top); st.tx += cx - last.cx; st.ty += cy - last.cy; clampPan(); apply(); last = { d: d, cx: cx, cy: cy };
      }
    });
    var up = function (e) { ptrs.delete(e.pointerId); if (ptrs.size < 2) last = null; if (!ptrs.size) stage.classList.remove("drag"); };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    stage.addEventListener("wheel", function (e) { if (!st.inner) return; e.preventDefault(); var r = stage.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    window.addEventListener("resize", function () { if (st.inner && document.body.contains(root)) fit(); });

    // ---- 読み込み ----
    Promise.resolve().then(o.load).then(function (d) {
      var fl = (d && d.floors) || [];
      if (!fl.length) { stage.innerHTML = '<div class="fpMsg">この建物の平面図は、まだありません。</div>'; return; }
      tabs.innerHTML = fl.map(function (f) { return '<button class="fpTab" data-f="' + esc(f.id) + '">' + esc(f.label || f.id) + "</button>"; }).join("");
      tabs.querySelectorAll(".fpTab").forEach(function (b) { b.onclick = function () { show(fl.filter(function (f) { return f.id === b.dataset.f; })[0]); }; });
      if (fl.length < 2) tabs.hidden = true;
      note.textContent = (d.note || "設計時点の図です。実際と違う所は、現地確認で直します。") + "　（機器のピンは、現地確認のあと、ここに入ります）";
      show(fl[0]);
    }).catch(function (e) { stage.innerHTML = '<div class="fpMsg">平面図を読み込めませんでした。<br>電波のある所で、もう一度開いてください。<br><small>' + esc(String((e && e.message) || e).slice(0, 80)) + "</small></div>"; });
  };
})();
