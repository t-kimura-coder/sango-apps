"use strict";
/* 使い方ガイド（#/help）と、初回の案内（チュートリアル）。現場ナビと同じ形：
   場所を照らして吹き出しで説明する。照らした所は、そのまま押して進める（画面の操作は止めない）。
   app.js の getSetting/setSetting, route, go, master, hasApi, icon, esc, toast, openSheet を使う。 */

const TOUR_DONE_KEY = "tour-done";
const TOUR_ALWAYS_KEY = "tour-always";
let tourIdx = -1;
let tourTimer = null;

/* ---------- 案内の手順 ---------- */
// goto：その手順が始まる時に開く画面。target：照らす場所（無ければ、少し待ってから探す。見つからなければ、その手順は飛ばす）
const firstBld = () => (master && master.buildings && master.buildings[0] ? master.buildings[0].id : "");
const TOUR_STEPS = [
  { goto: () => "#/home", target: () => document.querySelector(".bldCard"), text: "ようこそ！まず、建物を選びます。ここを押すと、その建物の連絡先と、症例が見られます。（案内の途中でも、照らした所は、そのまま押せます）" },
  { goto: () => "#/b/" + encodeURIComponent(firstBld()), target: () => document.querySelector(".catCard"), text: "建物の中では、設備の分類（水回り・電気・建具など）を選びます。担当の業者と電話番号が出て、電話できます（押すと、確認の画面が出ます）。「設置なし」は、その建物にない設備です。" },
  { goto: () => "#/b/" + encodeURIComponent(firstBld()), target: () => $("fabAdd"), text: "困ったことが起きたら、「症例を追加」。何が起きたか・写真・対応を残します。「報告のみ」（記録として残す）か、「対応を依頼する」（本社に連絡が届く。急ぎにもできる）を選べます。" },
  { goto: () => "#/b/" + encodeURIComponent(firstBld()), target: () => document.querySelector(".inspEntry"), optional: true, text: "「点検・メンテナンス」は、この建物の定期点検の入口です。期限が過ぎているものは赤く出ます。" },
  { goto: () => "#/home", target: () => $("tabInsp"), optional: true, text: "下の「点検」タブでは、全部の建物の点検の期限が分かります。「記録する」で点検表（○／要対応）を付けます。ほかのリーダーが記録したものも、ここに自動で出ます。" },
  { goto: () => "#/home", target: () => document.querySelector('#tabbar a[data-tab="mine"]'), text: "「自分の症例」には、あなたが残した症例が並びます。「未報告」「報告済み」「完了」で状態が分かり、未報告は、まとめて報告できます。" },
  { goto: () => "#/home", target: () => $("helpBtn"), text: "この「？」から、いつでも「使い方」を見られます。この案内も、使い方のページから、もう一度見られます。" },
  { goto: () => "#/home", target: () => $("gearBtn"), text: "歯車は設定です。名前（下の名前）の登録、業者データを最新にする、困ったことを木村に送る「質問・要望」が、ここにあります。", nextLabel: "完了" },
];

function tourShouldStart() { return getSetting(TOUR_ALWAYS_KEY) === "1" || getSetting(TOUR_DONE_KEY) !== "1"; }
function startTour() { if (!master) { toast("業者データが入ってから、案内を見られます"); return; } tourIdx = 0; runTourStep(); }
function endTour(done) {
  tourIdx = -1; clearTimeout(tourTimer);
  const t = $("tour"); if (t) t.hidden = true;
  if (done !== false) setSetting(TOUR_DONE_KEY, "1");
}

function runTourStep(tries) {
  if (tourIdx < 0) return;
  if (tourIdx >= TOUR_STEPS.length) { endTour(true); toast("案内はここまでです。「？」から、いつでも使い方を見られます"); return; }
  const step = TOUR_STEPS[tourIdx];
  const want = step.goto && step.goto();
  if (!tries && want && location.hash !== want) { go(want); }
  const target = step.target();
  if (!target || !target.getClientRects().length) { // 固定の位置のもの（症例を追加ボタンなど）は offsetParent が無いので、大きさで見分ける
    if ((tries || 0) < 14) { clearTimeout(tourTimer); tourTimer = setTimeout(() => runTourStep((tries || 0) + 1), 150); return; }
    tourIdx++; runTourStep(); return; // 見つからなければ飛ばす（点検タブが無い、など）
  }
  target.scrollIntoView({ block: "center" });
  $("tour").hidden = false;
  $("tourStep").textContent = `使い方の案内 ${tourIdx + 1} / ${TOUR_STEPS.length}`;
  $("tourText").textContent = step.text;
  $("tourNext").textContent = step.nextLabel || "次へ";
  requestAnimationFrame(placeTourSpot);
}
function placeTourSpot() {
  if (tourIdx < 0 || $("tour").hidden) return;
  const step = TOUR_STEPS[tourIdx], target = step && step.target();
  if (!target) return;
  const r = target.getBoundingClientRect(), pad = 6, spot = $("tourSpot");
  spot.style.left = `${r.left - pad}px`; spot.style.top = `${r.top - pad}px`; spot.style.width = `${r.width + pad * 2}px`; spot.style.height = `${r.height + pad * 2}px`;
  const bubble = $("tourBubble"), bh = bubble.offsetHeight, below = r.bottom + 16;
  bubble.style.top = below + bh < window.innerHeight - 80 ? `${below}px` : `${Math.max(16, r.top - bh - 16)}px`;
}
window.addEventListener("scroll", () => requestAnimationFrame(placeTourSpot), { passive: true });
window.addEventListener("resize", () => requestAnimationFrame(placeTourSpot));
document.addEventListener("click", (e) => {
  if (e.target.closest("#tourNext")) { tourIdx++; runTourStep(); }
  else if (e.target.closest("#tourSkip")) endTour(true);
  else if (tourIdx >= 0 && !e.target.closest("#tourBubble")) setTimeout(() => runTourStep(1), 400); // 照らした所を押して画面が変わった時は、今の手順を探し直す
});

/** 起動後・合言葉を入れた直後に呼ぶ。初めて（または「毎回」にしている時）だけ、案内を始める */
function maybeStartTour() {
  if (!master || tourIdx >= 0 || !tourShouldStart()) return;
  if (route().name !== "home") return;
  setTimeout(() => { if (tourIdx < 0 && tourShouldStart() && route().name === "home") startTour(); }, 900);
}

/* ---------- 使い方のページ ---------- */
function viewHelp(main) {
  $("topTitle").textContent = "使い方";
  const sec = (title, items) => `<div class="formCard helpSec"><h3>${title}</h3><ol class="helpList">${items.map((i) => `<li>${i}</li>`).join("")}</ol></div>`;
  main.innerHTML = `<div class="btnCol" style="margin-bottom:10px"><button class="btn btnPrimary" id="hpTour">画面で案内を見る</button><button class="btn" id="hpFb" ${getSetting("token") ? "" : "disabled"}>質問・要望を送る</button></div>
    ${sec("はじめに（1回だけ）", ["最初の画面で、木村から受け取った<b>自分の合言葉</b>を入れます。業者データが、自動で入ります（アプリを開くたびに、最新になります）。", "設定で、<b>名前（下の名前）</b>を入れます（任意。同じ苗字の人と区別するため）。苗字は、合言葉で決まっています。", "iPhone の Safari で開いている場合は、共有ボタン →「ホーム画面に追加」で、アイコンから開けるようにします。"])}
    ${sec("連絡先を調べて、電話する", ["ホームで<b>建物</b>を選び、<b>分類</b>（水回り・電気・建具など）を押すと、担当の業者と電話番号が出ます。", "電話ボタンを押すと、確認の画面が出ます（いきなり発信はしません）。", "分類が「設置なし」の薄い表示は、その建物にない設備です。", "どこに連絡すればよいか分からない時は、ホームの「困ったときは」に電話します。"])}
    ${sec("症例を残す・報告する", ["建物か分類の画面で「<b>症例を追加</b>」を押し、何が起きたか・どう対応したか・業者・写真を入れて「保存」します（写真は、カメラで撮る／撮影済みを選ぶ）。", "<b>報告の種類</b>：「報告のみ」は記録として残します。「<b>対応を依頼する</b>」は、本社に連絡が届きます（急ぎなら「急ぎ」にチェック）。", "保存した後に「<b>管理者に報告する</b>」を押すと、症例と写真が、管理者に届きます（ボタン1つ）。電波がない時は、症例は端末に残るので、あとでもう一度送れます。", "LINE で連絡したい時は「LINEで連絡する」。文章と写真が、LINE に渡せます（管理ページには載りません）。"])}
    ${sec("自分の症例", ["下の「自分の症例」に、あなたが残した症例が並びます（ほかの人のは出ません）。", "状態は「未報告」「報告済み」「完了」。報告したあとに内容や完了を変えたら、「<b>変更は未報告</b>」と出るので、もう一度報告します。", "上の「未報告 ○件を管理者へ報告する」で、まとめて報告できます。", "解決したら、症例の詳細で「完了にする」を押します。"])}
    ${sec("点検・メンテナンス", ["下の「<b>点検</b>」タブに、設備の点検の期限が並びます。<b>赤＝期限超過</b>、黄土色＝今月、です。建物の画面の「点検・メンテナンス」からも開けます。", "項目を開いて、点検表の各行に「○／要対応／対象外」を付け、写真・メモを添えて「<b>この内容で記録する</b>」。点検した人の名前を入れます。", "<b>ほかのリーダーが記録したものも、自動で出ます</b>（前回 ○/○ △△さん）。二重チェックにならないようにするためです。", "「要対応」を付けたら「要対応を、症例・依頼にする」で、建物・分類・内容が入った症例の入力に進めます。", "消防の点検など、資格のある業者が行うもの（「法定」）は、点検表ではなく、「実施日・業者・結果・報告書の写真」を記録します。"])}
    ${sec("困った時", ["「送れませんでした」は、電波の良い所で「もう一度送る」。症例は、端末に残っています。", "「合言葉が使えなくなっています」は、止められたか、出し直されました。木村から新しい合言葉をもらいます。", "業者データが古い・入らない時は、設定の「いま最新にする」。", "そのほか、困ったこと・直してほしいことは、設定または、このページの「<b>質問・要望を送る</b>」から、木村に送れます。", "お知らせ（ベルのマーク）に、新しい機能や直した点が出ます。"])}
    <div class="formCard helpSec"><h3>案内の表示</h3><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="hpAlways" ${getSetting(TOUR_ALWAYS_KEY) === "1" ? "checked" : ""}> アプリを開くたびに、画面の案内を出す</label></div>`;
  $("hpTour").onclick = () => { go("#/home"); setTimeout(startTour, 300); };
  $("hpFb").onclick = () => { if (typeof openFeedback === "function") openFeedback(); };
  $("hpAlways").onchange = (e) => { setSetting(TOUR_ALWAYS_KEY, e.target.checked ? "1" : "0"); toast(e.target.checked ? "開くたびに案内を出します" : "案内は、最初の1回だけにしました"); };
}
