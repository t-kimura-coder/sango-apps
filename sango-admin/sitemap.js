/* 敷地マップ（山郷サポート共通。リーダー・管理者で同じファイルを使う）
 * 公式サイトの敷地マップ（art/sitemap.svg、viewBox 891.396×527.086）の上に、建物のボタンを重ねる。
 * 狭い画面（スマホ）では、敷地を3つのエリアに分け、エリアを押すと、そこだけが大きく出る。
 *   smRender(box, { narrow, badge(id) -> {n, tone, urgent}, only(id) -> 真偽, onPick(id) })
 *   tone：todo＝要対応（橙）、warn＝注意（黄土）、ok＝進行中（緑）
 */
(function () {
  var W = 891.396, H = 527.086;
  var BLDS = [
    { id: "haru", name: "春", at: [26, 106, 34, 44] }, { id: "kou", name: "香", at: [15, 167, 34, 42] }, { id: "reception", name: "レセプション", at: [197, 164, 17, 30] },
    { id: "u", name: "宇", at: [295, 312, 48, 68] }, { id: "chi", name: "地", at: [357, 297, 63, 59] }, { id: "wa", name: "和", at: [434, 329, 60, 32] },
    { id: "kumajirushi", name: "熊印雑貨", at: [507, 368, 17, 10] }, { id: "larch", name: "店舗レストラン棟", at: [544, 327, 87, 40] }, { id: "botanical", name: "ボタニカル", at: [680, 329, 44, 45] },
    { id: "haruka", name: "HARUKA（カフェ）", at: [475, 396, 56, 33] },
  ];
  var ZONES = [
    { id: "n", name: "北エリア", r: [0, 80, 270, 170] },
    { id: "c", name: "中央エリア", r: [283, 285, 245, 160] },
    { id: "e", name: "東エリア", r: [532, 290, 218, 150] },
  ];
  var svgText = null, zone = "";
  var CSS = ".smWrap{position:relative;width:100%;background:#f7f5ee;border-radius:12px;overflow:hidden}.smWrap>svg{position:absolute;inset:0;width:100%;height:100%;display:block}"
    + ".smSpot{position:absolute;transform:translate(-50%,-50%);min-width:34px;min-height:34px;width:calc(var(--w) + 10px);height:calc(var(--h) + 10px);padding:0;border:2px solid transparent;border-radius:8px;background:transparent;cursor:pointer;transition:transform .15s,background .15s}"
    + ".smSpot:hover,.smSpot:focus-visible{transform:translate(-50%,-50%) scale(1.15);background:rgba(44,74,107,.18);border-color:#2c4a6b;outline:0;z-index:3}"
    + ".smSpot.todo{background:rgba(180,83,28,.38);border-color:#b4531c}.smSpot.warn{background:rgba(176,122,63,.38);border-color:#b07a3f}.smSpot.ok{background:rgba(47,107,69,.3);border-color:#2f6b45}.smSpot.urg{border-color:#a3322a}"
    + ".smN{position:absolute;top:-9px;right:-9px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#a3322a;color:#fff;font-size:12px;font-weight:800;line-height:20px;text-align:center}"
    + ".smName{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:2px;white-space:nowrap;font-size:11px;font-weight:700;color:#1f3650;background:rgba(255,255,255,.88);border-radius:6px;padding:0 4px;pointer-events:none;opacity:0;transition:opacity .15s}"
    + ".smSpot:hover .smName,.smSpot.todo .smName,.smSpot.warn .smName,.smWrap.zoomed .smName{opacity:1}.smWrap.zoomed .smName{font-size:12px}.smWrap.zoomed .smSpot{min-width:44px;min-height:44px}"
    + ".smZone{position:absolute;display:flex;align-items:center;justify-content:center;border:2px dashed #2c4a6b;border-radius:12px;background:rgba(44,74,107,.14);cursor:pointer;padding:2px}.smZone b{font-size:12px;color:#1f3650;background:rgba(255,255,255,.9);border-radius:8px;padding:1px 6px}"
    + ".smZoneN{position:absolute;top:-8px;right:-8px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#a3322a;color:#fff;font-size:12px;font-weight:800;line-height:20px;text-align:center}"
    + ".smBack{display:block;margin:0 0 8px;padding:8px 14px;border:1px solid #2c4a6b;border-radius:12px;background:#fff;color:#1f3650;font-weight:700;cursor:pointer}.smNote{margin-top:6px;font-size:12px;color:#6b6f66}";
  function addCss() { if (document.getElementById("smCss")) return; var s = document.createElement("style"); s.id = "smCss"; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pc(v, base, size) { return (((v - base) / size) * 100).toFixed(2); }
  function load() { if (svgText !== null) return Promise.resolve(svgText); return fetch("art/sitemap.svg").then(function (r) { return r.text(); }).then(function (t) { svgText = t; return t; }, function () { svgText = ""; return ""; }); }
  function inside(b, r) { var cx = b.at[0] + b.at[2] / 2, cy = b.at[1] + b.at[3] / 2; return cx >= r[0] && cx <= r[0] + r[2] && cy >= r[1] && cy <= r[1] + r[3]; }
  window.smName = function (id) { var b = BLDS.filter(function (x) { return x.id === id; })[0]; return b ? b.name : id; };
  window.smRender = function (box, o) {
    addCss();
    return load().then(function (svg0) {
      if (!svg0) { box.innerHTML = ""; return; }
      var narrow = !!o.narrow, z = narrow ? ZONES.filter(function (x) { return x.id === zone; })[0] : null;
      var vr = z ? z.r : [0, 0, W, H], vx = vr[0], vy = vr[1], vw = vr[2], vh = vr[3];
      var svg = z ? svg0.replace(/viewBox="[^"]*"/, 'viewBox="' + vr.join(" ") + '"') : svg0;
      var only = o.only || function () { return true; }, badge = o.badge || function () { return {}; };
      var list = BLDS.filter(function (b) { return only(b.id); });
      var inner;
      if (narrow && !z) {
        inner = ZONES.map(function (zn) {
          var n = list.filter(function (b) { return inside(b, zn.r); }).reduce(function (a, b) { return a + (badge(b.id).n || 0); }, 0);
          return '<button class="smZone" data-z="' + zn.id + '" style="left:' + pc(zn.r[0], 0, W) + '%;top:' + pc(zn.r[1], 0, H) + '%;width:' + ((zn.r[2] / W) * 100).toFixed(2) + '%;height:' + ((zn.r[3] / H) * 100).toFixed(2) + '%"><b>' + zn.name + "</b>" + (n ? '<span class="smZoneN">' + n + "</span>" : "") + "</button>";
        }).join("");
      } else {
        inner = list.filter(function (b) { return !z || inside(b, vr); }).map(function (b) {
          var st = badge(b.id), a = b.at;
          return '<button class="smSpot ' + (st.tone || "") + (st.urgent ? " urg" : "") + '" data-b="' + esc(b.id) + '" title="' + esc(b.name) + '" style="left:' + pc(a[0] + a[2] / 2, vx, vw) + "%;top:" + pc(a[1] + a[3] / 2, vy, vh) + "%;--w:" + ((a[2] / vw) * 100).toFixed(2) + "%;--h:" + ((a[3] / vh) * 100).toFixed(2) + '%">' + (st.n ? '<span class="smN">' + st.n + "</span>" : "") + '<span class="smName">' + esc(b.name) + "</span></button>";
        }).join("");
      }
      box.innerHTML = (z ? '<button class="smBack">← 敷地全体（' + z.name + "を表示中）</button>" : "") + '<div class="smWrap' + (z ? " zoomed" : "") + '" style="aspect-ratio:' + vw + " / " + vh + '">' + svg + inner + "</div>"
        + '<div class="smNote">' + (narrow && !z ? "エリアを押すと、拡大します" : "建物を押してください") + "　※マップに無い建物は、下の一覧から選べます</div>";
      Array.prototype.forEach.call(box.querySelectorAll(".smZone"), function (el) { el.onclick = function () { zone = el.getAttribute("data-z"); window.smRender(box, o); }; });
      var back = box.querySelector(".smBack"); if (back) back.onclick = function () { zone = ""; window.smRender(box, o); };
      Array.prototype.forEach.call(box.querySelectorAll(".smSpot"), function (el) { el.onclick = function () { o.onPick(el.getAttribute("data-b")); }; });
    });
  };
})();
