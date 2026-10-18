/* 敷地マップの吹き出し（管理者・本社で同じファイルを使う）
 * 建物を押すと、その建物のすぐ近くに「この建物ですか？」の吹き出しを出す。
 *   mpShow(wrap, spot, { img, name, stat, buttons: [{ label, sub, primary, disabled, onClick }] })
 *     wrap … マップの枠（position:relative の要素）／spot … 押した建物のボタン
 *   mpHide(wrap)
 * スマホ：画像は小さく、ボタンを大きく（すぐ動ける）。PC：画像と状況を見せて、分かりやすく。
 */
(function () {
  var CSS = ".mpPop{position:absolute;z-index:20;width:300px;max-width:calc(100vw - 32px);background:#fff;border-radius:14px;box-shadow:0 6px 24px rgba(20,30,40,.32);padding:10px;animation:mpIn .18s ease-out}"
    + "@keyframes mpIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}"
    + ".mpOn{overflow:visible!important}"
    + ".mpHead{display:flex;gap:10px;align-items:center}.mpImg{flex:none;width:96px;height:72px;border-radius:10px;overflow:hidden;background:#e8eef4}.mpImg img{width:100%;height:100%;object-fit:cover;display:block}"
    + ".mpTxt{min-width:0;flex:1}.mpQ{font-size:12px;color:#6b6f66}.mpName{margin:0;font-size:18px;font-weight:800;color:#1f3650;line-height:1.3}"
    + ".mpStat{margin-top:6px;font-size:13px;color:#44514a;line-height:1.5}"
    + ".mpBtns{display:flex;gap:8px;margin-top:10px}.mpBtn{flex:1;min-height:46px;border:1px solid #2c4a6b;border-radius:12px;background:#fff;color:#1f3650;font-size:15px;font-weight:800;cursor:pointer;padding:6px 8px;line-height:1.2}"
    + ".mpBtn small{display:block;font-size:11px;font-weight:600;color:#6b6f66}.mpBtn.primary{background:#2c4a6b;border-color:#2c4a6b;color:#fff}.mpBtn.primary small{color:#dfe7ef}.mpBtn[disabled]{opacity:.45;cursor:default}"
    + ".mpX{position:absolute;top:4px;right:6px;border:0;background:transparent;font-size:20px;line-height:1;color:#8a8f84;cursor:pointer;padding:4px}"
    + "@media (max-width:720px){.mpPop{width:260px;padding:8px}.mpImg{width:56px;height:44px}.mpName{font-size:17px}.mpBtn{min-height:52px;font-size:16px}}";
  function addCss() { if (document.getElementById("mpCss")) return; var s = document.createElement("style"); s.id = "mpCss"; s.textContent = CSS; document.head.appendChild(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  window.mpHide = function (wrap) {
    if (!wrap) return;
    var p = wrap.querySelector(".mpPop"); if (p) p.remove();
    wrap.classList.remove("mpOn");
  };
  window.mpShow = function (wrap, spot, o) {
    addCss();
    window.mpHide(wrap);
    if (!wrap || !spot) return null;
    var pop = document.createElement("div"); pop.className = "mpPop";
    pop.innerHTML = '<button class="mpX" aria-label="閉じる">×</button>'
      + '<div class="mpHead">' + (o.img ? '<div class="mpImg">' + o.img + "</div>" : "") + '<div class="mpTxt"><div class="mpQ">この建物ですか？</div><h3 class="mpName">' + esc(o.name) + "</h3></div></div>"
      + (o.stat ? '<div class="mpStat">' + o.stat + "</div>" : "")
      + '<div class="mpBtns">' + (o.buttons || []).map(function (b, i) { return '<button class="mpBtn' + (b.primary ? " primary" : "") + '" data-i="' + i + '"' + (b.disabled ? " disabled" : "") + ">" + esc(b.label) + (b.sub ? "<small>" + esc(b.sub) + "</small>" : "") + "</button>"; }).join("") + "</div>";
    wrap.appendChild(pop); wrap.classList.add("mpOn");
    pop.querySelector(".mpX").onclick = function (e) { e.stopPropagation(); window.mpHide(wrap); if (o.onClose) o.onClose(); };
    Array.prototype.forEach.call(pop.querySelectorAll(".mpBtn"), function (el) { el.onclick = function (e) { e.stopPropagation(); var b = o.buttons[+el.getAttribute("data-i")]; if (b && !b.disabled && b.onClick) b.onClick(); }; });
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
    // 位置：建物の右 → 左 → 真下 の順に、マップの枠からはみ出さない所
    var W = wrap.clientWidth, H = wrap.clientHeight, wr = wrap.getBoundingClientRect(), sr = spot.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight, gap = 10;
    var sx0 = sr.left - wr.left, sx1 = sr.right - wr.left, sy0 = sr.top - wr.top, sy1 = sr.bottom - wr.top, scx = (sx0 + sx1) / 2, scy = (sy0 + sy1) / 2;
    var x, y, clampY = function (v) { return H > ph + 8 ? Math.max(4, Math.min(H - ph - 4, v)) : 4; };   // 枠より高い時は、上にそろえて下へはみ出す（枠は overflow:visible）
    if (sx1 + gap + pw <= W - 4) { x = sx1 + gap; y = clampY(scy - ph / 2); }
    else if (sx0 - gap - pw >= 4) { x = sx0 - gap - pw; y = clampY(scy - ph / 2); }
    else { x = Math.max(4, Math.min(W - pw - 4, scx - pw / 2)); y = sy1 + gap; }
    // 画面（横）からも、はみ出さない
    var vx = wr.left + x; if (vx + pw > innerWidth - 8) x -= vx + pw - (innerWidth - 8); if (wr.left + x < 8) x += 8 - (wr.left + x);
    pop.style.left = x + "px"; pop.style.top = y + "px";
    return pop;
  };
})();
