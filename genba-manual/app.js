"use strict";

// index.htmlのapp.js/style.css読み込み時の?v=番号と合わせて手動更新する
const APP_VERSION = 73;

// Boxのアップロード用メールアドレス（アップロード専用なので公開されても問題ない、と判断済み）。
// 決まったらここに書く。空のあいだは設定画面で入力したアドレスを使う
const BOX_UPLOAD_EMAIL = "____________.3hytytn6hfzb6y1u@u.box.com"; // Box「7.現場ナビ/報告/社内報告」のアップロード用（アップロード専用なので公開しても読まれない）

// お知らせ。機能追加・不具合修正のたびに、先頭へ {date, type: "feature"|"fix", text} を追記する
// （自動では増えないので、書き忘れるとお知らせが古いまま残る）
const ANNOUNCEMENTS = [
  { date: "2026-10-05", type: "fix", text: "上司とのやりとりまわりを直しました（届いた返信が消えることがある、書きかけのメモが消える、合言葉なしの人の書き足しが上司に届かない、など）" },
  { date: "2026-10-05", type: "feature", text: "上司とのやりとりが、すぐ届くようになりました（設定の「上司とのやりとり」で合言葉を入れた人）。疑問・やりとりは週の報告を待たずに上司に届き、上司からの返信と宿題は開いた時に自動で受け取ります。疑問には「書き足す」で返事を続けられます（文字だけ。写真はこれまで通り報告で）" },
  { date: "2026-10-04", type: "fix", text: "報告の取り消しまわりを直しました（取り消せるのは一番新しい報告だけ、写真付きの「アプリ外で報告」を取り消しても写真が残る、済んだ週に追加で送った写真も報告済みにできる）。やりとりの書きかけが消えることがあったのも直しました" },
  { date: "2026-10-04", type: "feature", text: "その週の報告が済んでいる時は、報告タブの下のボタンが「✓ 今週は報告済み」になります。送り間違えた時は、そこか「過去の報告」から報告を取り消して、写真を「送る写真」に戻して送り直せます（上司の画面では新しい方に置き換わります）" },
  { date: "2026-10-04", type: "feature", text: "電話やLINEで聞いたこと・業者に頼んだことを「やりとり」として残せるようになりました（工程マニュアルの項目の「電話・LINEのやりとりを残す」から）。相手は次から候補で選べます。写真はLINEにある印か、アプリの写真を指すだけなので二重に保存しません。業者の返事待ちはホームの「やること」に出ます" },
  { date: "2026-10-04", type: "fix", text: "バックアップを戻した時に、「該当なし」で外したチェックが戻ってきてしまうのを直しました。宿題を済にした直後は「元に戻す」で取り消せます。品質写真で最後のチェックが付いた時も「完了」をお知らせします" },
  { date: "2026-10-04", type: "feature", text: "班の打合せで上司が決めた「宿題」を受け取れるようになりました。上司からの返信と一緒に取り込むと、ホームの「やること」に期限付きで出ます。押して「済にする」と、次の報告で上司に届きます" },
  { date: "2026-10-04", type: "fix", text: "事前準備にチェックを入れただけで、まだ撮れない写真が「撮り忘れ」に出ていたのを直しました。チェックの右のボタンも「該当なし」「撮影不要」と書き分けました" },
  { date: "2026-10-04", type: "feature", text: "作業手順の「事前準備」に進み具合（2/6）を出し、全部そろうと「✓ 準備OK」、作業手順タブにも ✓ が付くようにしました（工程の完了には含めません）" },
  { date: "2026-10-04", type: "fix", text: "項目名の右の「該当なし」も、押すと付けていたチェックが外れるようにしました（外れる件数を確認してから切り替わります）" },
  { date: "2026-10-03", type: "fix", text: "チェックを付けた後に「なし」にすると、チェックが付いたまま灰色になっていたのを直しました（なしにするとチェックは外れます）" },
  { date: "2026-10-03", type: "feature", text: "チェックが全部済んだ工程に「✓ 完了」が付くようにしました（工程ページ・段階のカード）。写真要の一覧も、全部撮れた工程に「✓ 撮影済み」が出ます" },
  { date: "2026-10-03", type: "feature", text: "チェックポイントごとに「なし」（この現場には無いチェック）を付けられるようにしました。灰色になり、進み具合・写真要の数から外れます" },
  { date: "2026-10-03", type: "feature", text: "長い現場名は、途中で切らずに2行まで折り返して表示するようにしました（2行に入らない時は少し小さくします）" },
  { date: "2026-10-03", type: "feature", text: "報告の工程ページに「全部選ぶ」を付け、写真を指で横になぞるとまとめて選べるようにしました（写真タブも同じ）。品質写真のカメラから「撮影不要」も選べます。使い方のページと最初の案内を、今の画面に合わせて書き直しました" },
  { date: "2026-10-03", type: "fix", text: "報告済みにするのは「送る写真」に選んで送った写真だけになりました（選ばなかった写真は次の報告に残ります）。送信のあとの日付の画面はなくなりました。休工・再開・完工・報告なしの週は、その場で上司（見守り）に知らせられるようにしました" },
  { date: "2026-10-03", type: "feature", text: "設定に「表示の色」を付けました（端末と同じ／ライト／ダーク）。ダークの色も見やすく作り直しました" },
  { date: "2026-10-03", type: "feature", text: "「報告済みにする」を押すと、「アプリから送った」「アプリ外で報告した」「今週は報告なし」から選べるようにしました" },
  { date: "2026-10-03", type: "feature", text: "報告タブの週の欄に「アプリ外で報告済み」「今週は報告なし」を付けました（別の方法で報告した週・自分は担当しない週など）。現場の管理に「写真を片付ける」を付けました（その現場の写真をバックアップに書き出してから、写真データだけ消します。チェック・メモの記録は残ります）" },
  { date: "2026-10-03", type: "feature", text: "現場を完工にする時に、確認と完工日の記録をするようにしました。「完工を上司に知らせて完了」を選ぶと、Boxに完工の知らせが届き、見守りで完工済みと分かります。設定と現場の管理で、現場ごとに使っている容量が見られます" },
  { date: "2026-10-03", type: "feature", text: "現場を「休工」にできるようにしました（ホームの今の現場のカードから）。休工中は報告の遅れに数えず、ホームでは薄く表示します。工程マニュアルの「この現場ではこの項目はない」を、項目名の右の「該当なし」に移し、工程タブから「写真要の一覧」を開けるようにしました" },
  { date: "2026-10-03", type: "feature", text: "報告の期間を「週（月〜土）」で表示するようにしました。報告は金曜から翌週の月曜まで（遅くとも火曜）。月・火曜は、先週の報告がまだなら先週の分が出ます。報告が遅れている週があると、ホームの「やること」に出ます" },
  { date: "2026-10-03", type: "feature", text: "「写真要の一覧」を追加しました。マニュアルで写真が必要なチェックを工程順に並べ、撮った・まだ・撮り忘れが一目で分かります（写真タブの「写真要の品質写真」、ホームの「撮り忘れ」から）。この現場では撮らなくてよいものは「不要」にすると、数から外れます" },
  { date: "2026-10-02", type: "fix", text: "写真が「？」になって見えなくなる不具合の原因を直しました（写真の画像と、送る・報告済みなどの印を別々に保存するようにしました）。使っている途中でアプリが勝手に読み込み直されることも無くなりました（新しい版はホームに戻った時に切り替わります）" },
  { date: "2026-10-02", type: "fix", text: "報告を送った日の後から付けたチェックやメモが、次の報告に入らないことがある不具合を直しました" },
  { date: "2026-10-02", type: "feature", text: "写真タブに見出しの絵を付けました（工程・報告タブとそろえました）" },
  { date: "2026-10-02", type: "feature", text: "工程マニュアルの画面を短くしました。メモは「メモを書く」を押すと書けます。「この項目のポイント」と「撮影ガイド」は見出しを押して開け閉めでき、閉じた状態は次も覚えています" },
  { date: "2026-10-02", type: "feature", text: "写真が読み込めない時は「？」ではなく「読み込めません」と出すようにしました。設定の「写真の点検」で、読み込めない写真が無いか確かめられます" },
  { date: "2026-10-02", type: "fix", text: "撮影中にアプリが読み込み直されて写真が保存されなかった時は、そのことをお知らせして、撮影していた項目・工程のページを開くようにしました。建物の種類の絵も新しくしました" },
  { date: "2026-10-02", type: "feature", text: "現場に「完成イメージ」（完成予想CG・パースなど）の画像と、建物の種類を登録できるようにしました。ホームの現場の写真に出ます。画像はこのiPhoneの中だけに保存し、報告では送りません" },
  { date: "2026-10-02", type: "feature", text: "ホームの「やること」に、2週間以上報告していない現場が出るようにしました" },
  { date: "2026-10-02", type: "feature", text: "現場に「記録を始めた工程」を登録できるようにしました。途中から担当する現場やアプリを入れる前から進んでいる現場は、そこより前の工程を「導入前」として扱い、進み具合や撮り忘れに数えません（「現場の情報を変更」から）" },
  { date: "2026-10-02", type: "feature", text: "ホームを作り直しました。担当現場が全部並び、それぞれ今どの工程かが分かります。その下に「やること」（上司からの返信・報告日・撮り忘れの品質写真）と「次に見る項目」が出ます。6つの工程は下の「工程」タブから開けます" },
  { date: "2026-10-02", type: "feature", text: "現場に「工事番号」と「担当者（苗字）」を登録できるようにしました。同じ現場を二人で担当する時に、上司の画面で一つの現場としてまとめて見られます。登録済みの現場は「現場の管理」→「現場の情報を変更」から入れてください" },
  { date: "2026-10-02", type: "feature", text: "気づき・疑問メモは、書く前に種類（疑問／気づき／職人さんの要望）を選ぶようにしました。上司に答えてほしい時は「疑問」を選んでください" },
  { date: "2026-10-02", type: "feature", text: "報告の送り先（Boxのアドレス）を最初から入れました。設定での入力は不要です。報告のファイル名に、送った人の名前が入るようにしました" },
  { date: "2026-10-02", type: "feature", text: "上司からの返信を受け取れるようになりました。ホームの「上司からの返信」→「返信を取り込む」で、Boxの「返信」フォルダのファイルを選ぶと、気づき・疑問メモの下に返信が表示されます" },
  { date: "2026-10-02", type: "feature", text: "報告に、6つの工程の進み具合と、疑問を解決済みにしたことも入るようにしました（上司が報告をまとめて見られる仕組みの準備です）" },
  { date: "2026-10-01", type: "feature", text: "工程タブの最初の画面を見やすくしました。6つの工程ごとに、今の現場のチェックと品質写真の進み具合が大きく出ます" },
  { date: "2026-10-01", type: "feature", text: "「疑問」のメモに「回答待ち／解決済み」を付けられるようにしました。報告にも状態が入ります" },
  { date: "2026-10-01", type: "feature", text: "マニュアル改訂に備えて、チェックに固定の番号を付けました。新しいマニュアル（2026版の再配布分）を取り込むと、今までのチェックと品質写真はそのまま引き継がれます" },
  { date: "2026-10-01", type: "feature", text: "工程マニュアルの並びを変えました。開いてすぐ「チェックポイント」と品質写真のカメラが出ます。品質写真を撮ると、そのチェックにも自動で印が付きます" },
  { date: "2026-10-01", type: "feature", text: "ホームの「進み具合」をチェックの進み具合に変え、「続きから」を今の現場のすぐ下に出しました。文字とボタンを大きくし、屋外でも見やすくしています" },
  { date: "2026-10-01", type: "feature", text: "Boxへ送信の画面に送る写真の一覧を出し、送信時のメモを報告の記録にも残すようにしました。初回の案内にBoxのアドレスと品質写真の撮り方を足しました" },
  { date: "2026-10-01", type: "feature", text: "工程マニュアルに「気づき・疑問メモ」を追加しました（原本の「気づき・職人さんからの要望」欄）。現場ごとに、いつ・誰が書いたかと一緒に残り、報告にも含まれます" },
  { date: "2026-10-01", type: "feature", text: "写真整理・報告の画面を見やすくしました。写真整理は2列／3列を切り替えられ、写真ごとの「︙」から拡大・工程の変更・削除ができます" },
  { date: "2026-10-01", type: "fix", text: "現場の管理や設定から戻ったとき、工程マニュアルや報告のページが前の現場のまま残ることがある不具合を直しました" },
  { date: "2026-10-01", type: "fix", text: "過去の報告の写真を削除したり品質写真を撮り直したりしたとき、品質写真や報告済みの写真まで消えてしまう不具合を直しました" },
  { date: "2026-10-01", type: "fix", text: "写真タブで、一度「報告に使う」にした写真を外せるようにしました（選ぶと「報告から外す」になります）" },
  { date: "2026-10-01", type: "feature", text: "「記録写真」を「品質写真」に名前を変えました。並びはどこでも「品質（左）・報告（右）」にそろえています" },
  { date: "2026-10-01", type: "feature", text: "ホームに「写真整理」の入口を戻しました。工程タブでは、今の現場のチェックと品質写真の進み具合が分かるようにしました" },
  { date: "2026-10-01", type: "feature", text: "現場をアプリ全体で1つにまとめました。ホームの「今の現場」や各画面の上の欄から切り替え・追加ができ、「現場の管理」で名前の変更・完了・削除ができます" },
  { date: "2026-10-01", type: "feature", text: "写真タブを今の現場のアルバムにしました。品質写真・報告写真が全部見え、写真要の記録がどれだけ撮れているかも分かります。選んで「報告に使う」「工程で仕分け」「保存」「削除」ができます" },
  { date: "2026-10-01", type: "feature", text: "報告タブを工程ごとのページにしました。撮影メモと注意文を見ながら報告写真を撮り・取り込み、送る写真を選べます。工程マニュアルの「この工程の報告写真」からも開けます" },
  { date: "2026-10-01", type: "feature", text: "品質写真を、写真ライブラリからも選べるようにしました" },
  { date: "2026-10-01", type: "feature", text: "初めて使う人向けに、画面の場所を照らして案内する「使い方の案内」を付けました（設定・使い方からいつでも見られます）" },
  { date: "2026-10-01", type: "feature", text: "設定にバックアップを追加しました。登録情報・チェックの記録・写真から選んで書き出し、機種変更のときに戻せます" },
  { date: "2026-10-01", type: "feature", text: "Boxへ送る報告に、期間中に付けたチェック（誰が・いつ）を含めるようにしました" },
  { date: "2026-10-01", type: "feature", text: "違う工程で撮った写真を、あとから正しい工程に変更できるようにしました" },
  { date: "2026-10-01", type: "feature", text: "初めて開いたときに、お名前の登録を案内するようにしました（チェックの記録に名前が残ります）" },
  { date: "2026-10-01", type: "feature", text: "写真を「品質写真（マニュアル用）」と「報告写真（お客様向け）」に分け、それぞれの撮影メモを色付きのラベルで表示するようにしました" },
  { date: "2026-10-01", type: "feature", text: "工程マニュアルの「写真要」のチェック横にカメラを付けました。撮ると写真が表示され、タップで確認・撮り直し・削除ができます" },
  { date: "2026-10-01", type: "feature", text: "写真を削除できるようにしました（報告の写真一覧で長押し、または選んで「削除」）" },
  { date: "2026-10-01", type: "fix", text: "チェックを付けると画面が一番上に戻ってしまう不具合を直しました" },
  { date: "2026-10-01", type: "fix", text: "一部の工程で、中身のない「□」だけのポイントが表示される不具合を直しました（最新のマニュアルを取り込むと反映）" },
  { date: "2026-10-01", type: "feature", text: "会社のロゴを表示するようにしました（ホームの一番下と設定。最新のマニュアルを取り込むと表示されます）" },
  { date: "2026-10-01", type: "feature", text: "工程の検索を追加しました。ホームと工程タブの検索欄から、工程名やチェック項目の言葉で探せます（ひらがな可、「建て方」でも上棟が見つかります）" },
  { date: "2026-10-01", type: "feature", text: "工程マニュアルを見やすくしました。項目ごとに概要・ポイント・チェックポイント・作業の流れ・参考図を表示し、現場ごとにチェックを記録できます（マニュアルを最新版に取り込み直してください）" },
  { date: "2026-09-30", type: "feature", text: "お知らせと使い方のページを追加しました（ホーム右上のベルと？マーク）" },
  { date: "2026-09-30", type: "feature", text: "「現場ナビ」として公開しました。工程ごとのマニュアル閲覧、写真の撮りだめ、報告用の写真選択とBoxへの送信ができます" },
];

// 新しい版が届いても、使っている途中（カメラ・写真選び・メモの入力中など）には読み込み直さない。
// ホームを表示していて、何もしていない時にだけ切り替える。初めて開いた時（前の版が無い時）は読み込み直さない
let swUpdateReady = false;
let swUpdateToasted = false;
function maybeApplyUpdate() {
  if (!swUpdateReady) return;
  const busy = !$("processing").hidden || !$("sheet").hidden || recordTarget || (() => {
    try {
      return !!sessionStorage.getItem("genba-photo-pending-shot");
    } catch (e) {
      return false;
    }
  })();
  if (currentView === "dashView" && !busy && document.visibilityState === "visible") {
    swUpdateReady = false;
    location.reload();
  } else if (!swUpdateToasted) {
    swUpdateToasted = true;
    toast("新しい版が届きました。ホームに戻ると切り替わります");
  }
}
if ("serviceWorker" in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    swUpdateReady = true;
    setTimeout(maybeApplyUpdate, 300);
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

/* ---------- 17分類 ---------- */
// 写真機能で使う分類だけをアプリに持つ。マニュアル本文と撮影ガイドの文面は社内データなので
// アプリには入れず、マニュアルパック(JSON)の取り込み時に guide を上書きする（空欄なら画面に出さない）
const PROCESSES = [
  { id: "p01", no: 1, name: "解体・仮設準備", short: "解体仮設", guide: "" },
  { id: "p02", no: 2, name: "地盤・基礎工事", short: "基礎", guide: "" },
  { id: "p03", no: 3, name: "足場工事", short: "足場", guide: "" },
  { id: "p04", no: 4, name: "大工工事（建方・上棟）", short: "建方上棟", guide: "" },
  { id: "p05", no: 5, name: "大工工事（屋根下地）", short: "屋根下地", guide: "" },
  { id: "p06", no: 6, name: "大工工事（外壁下地・断熱）", short: "外壁下地断熱", guide: "" },
  { id: "p07", no: 7, name: "大工工事（内部下地）", short: "内部下地", guide: "" },
  { id: "p08", no: 8, name: "大工工事（造作・建具）", short: "造作建具", guide: "" },
  { id: "p09", no: 9, name: "屋根仕上げ工事（板金）", short: "屋根板金", guide: "" },
  { id: "p10", no: 10, name: "電気・設備配管工事", short: "電気設備", guide: "" },
  { id: "p11", no: 11, name: "仕上げ：塗装", short: "塗装", guide: "" },
  { id: "p12", no: 12, name: "仕上げ：クロス", short: "クロス", guide: "" },
  { id: "p13", no: 13, name: "仕上げ：床・タイル", short: "床タイル", guide: "" },
  { id: "p14", no: 14, name: "外壁仕上げ", short: "外壁", guide: "" },
  { id: "p15", no: 15, name: "美装・検査", short: "美装検査", guide: "" },
  { id: "p16", no: 16, name: "外構", short: "外構", guide: "" },
  { id: "p17", no: 17, name: "引渡し", short: "引渡し", guide: "" },
];
const PROCESS_MAP = Object.fromEntries(PROCESSES.map((p) => [p.id, p]));
function processOf(id) {
  return PROCESS_MAP[id] || { id, no: 99, name: "（不明な工程）", short: "不明", guide: "" };
}

/* ---------- 6つの大分類（画面の入口） ---------- */
// 17分類を現場の流れに沿って6つにまとめたもの。工程画面のカードとステッパーに使う
const GROUPS = [
  { id: "g1", name: "基礎", sub: "着工〜基礎工事", desc: "解体・仮設準備から、地盤・基礎工事までの工程です。", cats: ["p01", "p02"] },
  { id: "g2", name: "上棟", sub: "建て方・構造", desc: "足場を掛け、構造躯体の組み立てから屋根の下地までを行います。", cats: ["p03", "p04", "p05"] },
  { id: "g3", name: "外装", sub: "屋根・外壁・サッシ", desc: "外壁の下地・断熱から、屋根と外壁の仕上げまでの工程です。", cats: ["p06", "p09", "p14"] },
  { id: "g4", name: "内装", sub: "大工工事・内装仕上げ", desc: "内部の下地・造作から、塗装・クロス・床の仕上げまでの工程です。", cats: ["p07", "p08", "p11", "p12", "p13"] },
  { id: "g5", name: "設備", sub: "電気・給排水・設備", desc: "電気配線、給排水・暖房・換気の配管と器具の取付けです。", cats: ["p10"] },
  { id: "g6", name: "引渡し", sub: "完了検査・引渡し", desc: "美装・各種検査・外構を経て、お引渡しまでの工程です。", cats: ["p15", "p16", "p17"] },
];
function groupOf(gid) {
  return GROUPS.find((g) => g.id === gid) || GROUPS[0];
}
function groupOfProcess(pid) {
  return GROUPS.find((g) => g.cats.includes(pid)) || GROUPS[0];
}

// 大分類のイラスト（GPT生成の透過画像を余白カット・縮小して art/ に置いたもの。元画像は現場訪問マニュアルアプリ/design/）
function groupArt(g, h = 56) {
  return `<img src="art/${g.id}.webp?v=1" alt="" style="height:${h}px" decoding="async">`;
}

/* ---------- アイコン ---------- */

function icon(paths, size = 22, width = 2) {
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" ` +
    `stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}" aria-hidden="true">` +
    paths +
    "</svg>"
  );
}
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  camera: '<path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><circle cx="12" cy="13" r="3.5"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-9 9"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M8 8h3M8 12h3M8 16h3M3 21h18"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21a2 2 0 0 1 2-2h13v2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  grid2: '<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/>',
  grid3: '<path d="M3.5 3.5h4.5v4.5H3.5zM9.75 3.5h4.5v4.5h-4.5zM16 3.5h4.5v4.5H16zM3.5 9.75h4.5v4.5H3.5zM9.75 9.75h4.5v4.5h-4.5zM16 9.75h4.5v4.5H16zM3.5 16h4.5v4.5H3.5zM9.75 16h4.5v4.5h-4.5zM16 16h4.5v4.5H16z"/>',
  dotsV: '<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
  reply: '<path d="M10 9V5l-7 7 7 7v-4c5 0 8 1.5 11 5-1-6-4-11-11-11z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.3" r="0.6" fill="currentColor"/>',
  folder: '<path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.5l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M4.5 19.5h15"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  camSmall: '<path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><circle cx="12" cy="13" r="3.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  checkSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12l3 3 5-6"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7"/><circle cx="12" cy="17.2" r="0.6" fill="currentColor"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/><path d="M11 13l9-9"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
};

/* ---------- 日付 ---------- */

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function todayKey() {
  return toDateKey(new Date());
}
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}
function daysBetween(a, b) {
  return Math.round((keyToDate(b) - keyToDate(a)) / 86400000);
}
function fmtDate(key) {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}
function fmtMMDD(key) {
  return key.slice(5, 7) + key.slice(8, 10);
}

/* ---------- IndexedDB ---------- */

const DB_NAME = "genba-photo";
const DB_VERSION = 4; // v2: マニュアルパック用の manualPages / meta、v3: 現場ごとのチェック記録 checks、v4: 写真の画像を images に分ける
// 写真の画像（blob / thumb）は images に、印や工程などの情報は photos に分けて持つ。
// iPhone（WebKit）では、読み出した写真をそのまま保存し直すと画像データが消えて「？」になることがあるため、
// 画像は写真を作った時に1回だけ書き、印を付ける・外すなどの更新では画像に触らない

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("sites")) db.createObjectStore("sites", { keyPath: "id" });
      if (!db.objectStoreNames.contains("photos")) {
        const s = db.createObjectStore("photos", { keyPath: "id" });
        s.createIndex("siteId", "siteId");
      }
      if (!db.objectStoreNames.contains("reports")) {
        const s = db.createObjectStore("reports", { keyPath: "id" });
        s.createIndex("siteId", "siteId");
      }
      if (!db.objectStoreNames.contains("manualPages")) db.createObjectStore("manualPages", { keyPath: "page" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
        // 今までの写真の画像を images に移す（1回だけ）
        const tx = req.transaction;
        const imgs = tx.objectStore("images");
        const cur = tx.objectStore("photos").openCursor();
        cur.onsuccess = () => {
          const c = cur.result;
          if (!c) return;
          const p = c.value;
          if (p.blob || p.thumb) {
            imgs.put({ id: p.id, blob: p.blob || null, thumb: p.thumb || null });
            delete p.blob;
            delete p.thumb;
            c.update(p);
          }
          c.continue();
        };
      }
      if (!db.objectStoreNames.contains("checks")) {
        // key = "<siteId>|<itemId>"。marks は「区分|チェック文」→ {at, by}（後で品質管理に使えるよう、誰がいつ付けたかを残す）
        const s = db.createObjectStore("checks", { keyPath: "key" });
        s.createIndex("siteId", "siteId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const dbPromise = openDB();

// 写真の情報に、images の画像（blob / thumb）を付けて返す（同じトランザクションの中で読む）
function attachImages(tx, rows, done) {
  const imgs = tx.objectStore("images");
  let left = rows.length;
  if (!left) return done(rows);
  rows.forEach((p) => {
    const r = imgs.get(p.id);
    r.onsuccess = () => {
      const im = r.result;
      if (im) {
        p.blob = im.blob;
        p.thumb = im.thumb;
      } else if (p.imageRemoved) p.thumb = STORED_MARK;
      if (--left === 0) done(rows);
    };
    r.onerror = () => {
      if (--left === 0) done(rows);
    };
  });
}

async function dbGetAll(store, indexName, key) {
  const db = await dbPromise;
  if (store === "photos") {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["photos", "images"], "readonly");
      const os = tx.objectStore("photos");
      const req = indexName ? os.index(indexName).getAll(key) : os.getAll();
      req.onsuccess = () => attachImages(tx, req.result || [], resolve);
      req.onerror = () => reject(req.error);
    });
  }
  return new Promise((resolve, reject) => {
    const os = db.transaction(store, "readonly").objectStore(store);
    const req = indexName ? os.index(indexName).getAll(key) : os.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbGet(store, id) {
  const db = await dbPromise;
  if (store === "photos") {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["photos", "images"], "readonly");
      const req = tx.objectStore("photos").get(id);
      req.onsuccess = () => (req.result ? attachImages(tx, [req.result], (r) => resolve(r[0])) : resolve(null));
      req.onerror = () => reject(req.error);
    });
  }
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutMany(store, items) {
  const db = await dbPromise;
  if (store === "photos") {
    // 画像は、まだ images に無い写真（新しく撮った・取り込んだ・バックアップから戻した）の時だけ書く
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["photos", "images"], "readwrite");
      const ps = tx.objectStore("photos");
      const imgs = tx.objectStore("images");
      items.forEach((it) => {
        const { blob, thumb, ...meta } = it;
        ps.put(meta);
        if (blob) {
          const c = imgs.count(it.id);
          c.onsuccess = () => {
            if (!c.result) imgs.put({ id: it.id, blob, thumb: thumb || null });
          };
        }
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    items.forEach((it) => os.put(it));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbPut(store, item) {
  return dbPutMany(store, [item]);
}
async function dbClear(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbDeleteMany(store, ids) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store === "photos" ? ["photos", "images"] : store, "readwrite");
    const os = tx.objectStore(store);
    ids.forEach((id) => os.delete(id));
    if (store === "photos") ids.forEach((id) => tx.objectStore("images").delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ---------- 現場・報告期間 ---------- */

async function getSites() {
  const sites = await dbGetAll("sites");
  return sites.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

// 未報告（reportIdなし）の写真が「今回の報告」に入る。日付で切るのではなく
// 報告済みにした時点で紐付けるので、期間の境目で写真が漏れることはない
async function getSitePhotos(siteId) {
  return dbGetAll("photos", "siteId", siteId);
}
// 写真の種別：kind = "report"（お客様向けの報告写真。種別なしの古い写真もこちら）/ "record"（マニュアルが求める品質写真）
function isRecordPhoto(p) {
  return p.kind === "record";
}
// 今回の報告に入る写真（報告写真と「報告に使う」を付けた品質写真のうち、まだ報告済みにしていないもの）
function unreported(photos) {
  return photos.filter((p) => !p.reportId && !p.imageRemoved && (!isRecordPhoto(p) || p.forReport));
}

// 今回の報告期間の開始日 = 前回報告の終了日の翌日
// （初回は現場登録日。登録日より前の写真を取り込んだ場合はその日付まで遡る）
function periodStart(site, currentPhotos) {
  let start = site.lastReportEnd ? addDays(site.lastReportEnd, 1) : toDateKey(new Date(site.createdAt));
  currentPhotos.forEach((p) => {
    // 「報告に使う」にした古い品質写真で期間が遡らないよう、期間の計算は報告写真だけで行う
    if (!isRecordPhoto(p) && p.dateKey < start) start = p.dateKey;
  });
  return start;
}

/* ---------- 報告の週 ----------
   工事は月〜土を1週とし（日曜は終わった週の続き）、その週の報告は金曜から翌週の月曜まで（遅くとも火曜）に送る。
   月・火曜は、先週の報告がまだなら先週を対象にする。週の報告は「その週の金曜以降、次の週の金曜より前に報告済みにした」ことで済みとする */
function weekMon(key) {
  return addDays(key, -((keyToDate(key).getDay() + 6) % 7));
}
// 休工：site.pauses = [{ from, to }]（to が空なら休工中）。その週の金曜（報告する日）に休工していた週は、報告しなくてよい
function pausedOn(site, key) {
  return (site.pauses || []).some((p) => p.from <= key && (!p.to || key <= p.to));
}
function isPaused(site) {
  return (site.pauses || []).some((p) => !p.to);
}
async function togglePause(site) {
  site.pauses = site.pauses || [];
  const open = site.pauses.find((p) => !p.to);
  if (open) {
    if (!confirm(`「${site.name}」の工事を再開しますか？`)) return;
    open.to = todayKey();
    toast("工事を再開しました");
    setTimeout(() => notifyStatus(site, { status: "resumed" }, "工事の再開を上司に知らせる"), 300);
  } else {
    if (!confirm(`「${site.name}」を休工にしますか？\n休工中は報告の遅れに数えず、ホームでは薄く表示します。再開する時は同じボタンを押します。`)) return;
    site.pauses.push({ from: todayKey(), to: null });
    toast("休工にしました");
    setTimeout(() => notifyStatus(site, { status: "paused", from: todayKey() }, "休工を上司に知らせる"), 300);
  }
  await dbPut("sites", site);
  await refreshSites();
  rerenderCurrentView();
}

// 週の決まりを入れた週。これより前の週は「遅れ」に数えない（前のやり方で報告していた週が、まとめて遅れに出ないように）
const WEEK_RULE_START = "2026-09-28";
// どの週が報告済みか。週の印（week）がある報告はその週だけ、印の無い古い報告は作った日（金〜翌木）で判断する
function weekReportedFn(reports) {
  const tagged = new Set((reports || []).map((r) => r.week).filter(Boolean));
  const untagged = (reports || []).filter((r) => !r.week).map((r) => (r.createdAt ? toDateKey(new Date(r.createdAt)) : r.end)).filter(Boolean);
  return (mon) => tagged.has(mon) || untagged.some((k) => k >= addDays(mon, 4) && k <= addDays(mon, 10));
}
// 報告済みにする時に付ける週：今週の金曜より前で、先週がまだなら先週。それ以外は今週
function tagWeek(site, reports, today = todayKey()) {
  const isReported = weekReportedFn(reports);
  const thisMon = weekMon(today);
  const prevMon = addDays(thisMon, -7);
  const startMon = weekMon(toDateKey(new Date(site.createdAt || Date.now())));
  if (site.redoWeek) return { mon: site.redoWeek, sat: addDays(site.redoWeek, 5) }; // 取り消した報告の送り直し
  const mon = today < addDays(thisMon, 4) && prevMon >= startMon && !isReported(prevMon) ? prevMon : thisMon;
  return { mon, sat: addDays(mon, 5) };
}

function reportWeek(site, reports, today = todayKey()) {
  const isReported = weekReportedFn(reports);
  const thisMon = weekMon(today);
  const prevMon = addDays(thisMon, -7);
  const created = weekMon(toDateKey(new Date(site.createdAt || Date.now())));
  const startMon = created > WEEK_RULE_START ? created : WEEK_RULE_START;
  let mon = thisMon;
  if (daysBetween(thisMon, today) <= 1 && prevMon >= startMon && !isReported(prevMon)) mon = prevMon;
  const w = { mon, sat: addDays(mon, 5), fri: addDays(mon, 4), due: addDays(mon, 7), late: addDays(mon, 8), isPrev: mon !== thisMon };
  w.state = isReported(mon) ? "done" : pausedOn(site, w.fri <= today ? w.fri : today) ? "paused" : today < w.fri ? "before" : today <= w.due ? "open" : today <= w.late ? "late" : "over";
  const rec = (reports || []).find((r) => r.week === mon);
  w.doneKind = rec ? rec.kind || "" : "";
  w.doneMemo = rec ? rec.memo || "" : "";
  // 期限（火曜）を過ぎても報告していない週の数（現場を登録した週より前と、休工していた週は数えない）
  w.missed = 0;
  for (let m = addDays(mon, -7); m >= startMon && w.missed < 8 && !isReported(m); m = addDays(m, -7)) {
    if (!pausedOn(site, addDays(m, 4))) w.missed++;
  }
  return w;
}
function reportWeekHtml(w) {
  const title = w.isPrev ? "先週の報告" : "今週の報告";
  const sub = {
    done: w.doneKind === "skip" ? `報告なし${w.doneMemo ? "（" + esc(w.doneMemo) + "）" : ""}` : w.doneKind === "external" ? "アプリ外で報告済み" : "報告済み",
    before: `報告は ${fmtDate(w.fri)}〜${fmtDate(w.due)}`,
    open: `報告は ${fmtDate(w.due)}まで（遅くとも ${fmtDate(w.late)}）`,
    late: `今日 ${fmtDate(w.late)} が期限です`,
    over: "期限を過ぎています",
    paused: "休工中（報告はお休み）",
  }[w.state];
  const badge = { done: '<span class="badge badgeOk">済</span>', open: '<span class="badge badgeWarning">報告日</span>', late: '<span class="badge badgeDanger">期限</span>', over: '<span class="badge badgeDanger">遅れ</span>' }[w.state] || "";
  return (
    `<img class="periodArt" src="hero-frame.webp?v=1" alt=""><span class="periodIcon">${icon(ICONS.calendar, 20)}</span><span class="periodLabel">${title}</span>` +
    `<span class="periodValue">${fmtDate(w.mon)}〜${fmtDate(w.sat)}</span>${badge}` +
    `<span class="periodSub">${sub}${w.missed ? `<b class="em">　ほかに未報告の週が${w.missed}週あります</b>` : ""}</span>`
  );
}

function periodLabel(start) {
  const days = daysBetween(start, todayKey()) + 1;
  const weeks = Math.ceil(days / 7);
  return { text: `${fmtDate(start)}〜今日`, weeks };
}

/* ---------- 画像処理 ---------- */

function downscaleImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("toBlob failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// JPEGのEXIFから撮影日時(DateTimeOriginal、なければDateTime)を読む。
// 縮小するとEXIFは消えるので、縮小前の元ファイルから読む必要がある
async function readExifDate(file) {
  try {
    const buf = await file.slice(0, 256 * 1024).arrayBuffer();
    const v = new DataView(buf);
    if (v.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const marker = v.getUint16(off);
      const size = v.getUint16(off + 2);
      if (marker === 0xffe1 && v.getUint32(off + 4) === 0x45786966) {
        return parseTiffDate(v, off + 10);
      }
      if ((marker & 0xff00) !== 0xff00) return null;
      off += 2 + size;
    }
  } catch (e) {
    /* 読めなければ撮影日不明として扱う */
  }
  return null;
}
function parseTiffDate(v, tiff) {
  const le = v.getUint16(tiff) === 0x4949;
  const u16 = (o) => v.getUint16(o, le);
  const u32 = (o) => v.getUint32(o, le);
  const readIfd = (ifdOff) => {
    const entries = {};
    const n = u16(tiff + ifdOff);
    for (let i = 0; i < n; i++) {
      const e = tiff + ifdOff + 2 + i * 12;
      entries[u16(e)] = { count: u32(e + 4), value: u32(e + 8) };
    }
    return entries;
  };
  const readAscii = (entry) => {
    let s = "";
    for (let i = 0; i < entry.count - 1; i++) s += String.fromCharCode(v.getUint8(tiff + entry.value + i));
    return s;
  };
  const ifd0 = readIfd(u32(tiff + 4));
  let str = null;
  if (ifd0[0x8769]) {
    const exif = readIfd(ifd0[0x8769].value);
    if (exif[0x9003]) str = readAscii(exif[0x9003]);
  }
  if (!str && ifd0[0x0132]) str = readAscii(ifd0[0x0132]);
  const m = str && str.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

async function makePhotoRecord(file, siteId, processId, takenAt, extra = {}) {
  const blob = await downscaleImage(file, 1600, 0.82);
  const thumb = await downscaleImage(blob, 360, 0.7);
  return {
    id: newId(),
    siteId,
    processId,
    takenAt: takenAt.toISOString(),
    dateKey: toDateKey(takenAt),
    blob,
    thumb,
    reportId: null,
    kind: "report",
    ...extra,
  };
}

/* ---------- 画面の共通部品 ---------- */

const $ = (id) => document.getElementById(id);
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 画面ごとに作ったサムネイルURLを、次に描き直すときにまとめて解放する
const urlBuckets = {};
const STORED_MARK = { stored: true }; // 片付け済みの写真の thumb に入れる目印
const STORED_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="#f1eee6"/><text x="60" y="44" font-size="12" text-anchor="middle" fill="#6b736c" font-family="sans-serif">バックアップ</text><text x="60" y="60" font-size="12" text-anchor="middle" fill="#6b736c" font-family="sans-serif">済み</text></svg>');
// 画像が無い写真：片付け済みなら「バックアップ済み」、それ以外（読めなくなった等）は「画像なし」
const NO_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect width="120" height="90" fill="#f1eee6"/><text x="60" y="50" font-size="12" text-anchor="middle" fill="#6b736c" font-family="sans-serif">画像なし</text></svg>');
function blobUrl(bucket, blob) {
  if (blob === STORED_MARK) return STORED_IMG;
  if (!blob) return NO_IMG;
  const url = URL.createObjectURL(blob);
  (urlBuckets[bucket] = urlBuckets[bucket] || []).push(url);
  return url;
}
// 描き直しの最初に呼ぶので、すぐ捨てると新しい画面ができるまでの間、表示中の写真が「？」になる。
// 新しい画面に入れ替わった後（数秒後）に捨てる
function releaseUrls(bucket) {
  const old = urlBuckets[bucket] || [];
  urlBuckets[bucket] = [];
  if (old.length) setTimeout(() => old.forEach((u) => URL.revokeObjectURL(u)), 5000);
}

const VIEW_TABS = {
  dashView: "home",
  manualView: "manual",
  groupView: "manual",
  albumView: "photos",
  requiredView: "photos",
  shotView: "report",
  reportView: "report",
  reportProcView: "report",
  reportPastView: "report",
  siteManageView: "",
  settingsView: "",
  announceView: "",
  searchView: "",
  helpView: "",
};
let currentView = "dashView";
let viewBeforeSettings = "dashView";
function showView(id) {
  setTimeout(maybeApplyUpdate, 500);
  setTimeout(fitNames, 80); // 画面が見えてから長い現場名の大きさを合わせる（見えていない間は測れないため）
  currentView = id;
  Object.keys(VIEW_TABS).forEach((v) => ($(v).hidden = v !== id));
  $("tabBar").hidden = id === "shotView";
  const tab = VIEW_TABS[id];
  document.querySelectorAll(".tabBtn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  window.scrollTo(0, 0);
  if (typeof tourOnView === "function") tourOnView(id);
}

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2400);
}

// 取り消しボタン付きのお知らせ（押し間違いをすぐ戻せるように）
function toastAction(msg, label, fn) {
  const t = $("toast");
  t.innerHTML = `<span>${esc(msg)}</span><button type="button" class="toastBtn">${esc(label)}</button>`;
  t.hidden = false;
  t.querySelector(".toastBtn").addEventListener("click", () => {
    t.hidden = true;
    fn();
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 6000);
}

function setProcessing(on, text = "写真を保存中...") {
  $("processingText").textContent = text;
  $("processing").hidden = !on;
}

// 汎用ボトムシート。buildBody(bodyEl, close) で中身を組み立てる
// onDismiss：シートの外を押して閉じた時に呼ぶ（入力を待っている処理を「キャンセル」で終わらせるため）
let sheetDismiss = null;
function openSheet(title, buildBody, onDismiss) {
  $("sheetTitle").textContent = title;
  const body = $("sheetBody");
  body.innerHTML = "";
  $("sheet").hidden = false;
  sheetDismiss = onDismiss || null;
  const close = () => {
    sheetDismiss = null;
    $("sheet").hidden = true;
  };
  buildBody(body, close);
}
function sheetButton(label, cls, onClick) {
  const b = document.createElement("button");
  b.className = `btn ${cls}`;
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
function askText(title, initial, okLabel) {
  return new Promise((resolve) => {
    openSheet(title, (body, close) => {
      const input = document.createElement("input");
      input.className = "sheetInput";
      input.value = initial || "";
      input.placeholder = "例：山田様邸 新築";
      body.appendChild(input);
      const submit = () => {
        const v = input.value.trim();
        if (!v) {
          input.focus();
          return;
        }
        close();
        resolve(v);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.isComposing) submit();
      });
      body.appendChild(sheetButton(okLabel, "btnPrimary", submit));
      body.appendChild(sheetButton("キャンセル", "btnSecondary", () => (close(), resolve(null))));
      setTimeout(() => input.focus(), 50);
    }, () => resolve(null));
  });
}

// actions: [{label, cls, onClick}]。onClick が false を返したら閉じない（確認でキャンセルした時など）
// ボタンの処理はタップの中で同期的に呼ぶ（撮り直しでカメラを開けるように）
function openPhotoViewer(blob, actions = []) {
  // 片付け済みの写真は「バックアップ済み」の絵を出し、撮り直し・削除などのボタンは使えるようにする
  const url = blob ? URL.createObjectURL(blob) : STORED_IMG;
  if (!blob) toast("この写真は片付け済みです（バックアップから戻すと見られます）");
  const box = $("lightbox");
  const close = () => {
    box.hidden = true;
    $("lightboxImg").removeAttribute("src");
    if (blob) URL.revokeObjectURL(url);
  };
  $("lightboxImg").src = url;
  const bar = $("lightboxActions");
  bar.innerHTML = "";
  actions.concat([{ label: "閉じる", cls: "btnGhost", onClick: () => {} }]).forEach((a) => {
    const b = document.createElement("button");
    b.className = `btn ${a.cls || "btnGhost"}`;
    b.textContent = a.label;
    b.addEventListener("click", async (e) => {
      e.stopPropagation();
      const r = a.onClick();
      if (r && typeof r.then === "function") {
        if ((await r) === false) return;
      } else if (r === false) return;
      close();
    });
    bar.appendChild(b);
  });
  box.hidden = false;
  box.onclick = (e) => {
    if (e.target === box || e.target.id === "lightboxImg") close();
  };
}

function openLightbox(blob) {
  openPhotoViewer(blob, []);
}

/* ---------- 今の現場（アプリ全体で1つ） ---------- */
// どの画面でも同じ現場を見て・撮る。選んだ現場は覚えておき、次に開いた時もその現場から始まる

const CURRENT_SITE_KEY = "genba-photo-manual-site"; // 旧「チェックする現場」の保存先をそのまま引き継ぐ
let currentSiteId = null;
let activeSitesCache = []; // 撮影ボタンを同期処理で押せるよう、現場の一覧は先に読んでおく

async function refreshSites() {
  activeSitesCache = (await getSites()).filter((s) => !s.archived);
  const saved = getSetting(CURRENT_SITE_KEY);
  if (!activeSitesCache.some((s) => s.id === currentSiteId)) {
    // 今の現場が完了・削除されたら別の現場に切り替わる。その現場のチェック記録を読み直さないと、前の現場に書き込んでしまう
    currentSiteId = activeSitesCache.some((s) => s.id === saved) ? saved : activeSitesCache[0] ? activeSitesCache[0].id : null;
    setSetting(CURRENT_SITE_KEY, currentSiteId || "");
    if (typeof loadSiteChecks === "function") await loadSiteChecks();
  }
  renderSiteBars();
  return activeSitesCache.find((s) => s.id === currentSiteId) || null;
}

function currentSite() {
  return activeSitesCache.find((s) => s.id === currentSiteId) || null;
}

async function setCurrentSite(id) {
  currentSiteId = id;
  setSetting(CURRENT_SITE_KEY, id || "");
  await refreshSites();
  if (typeof loadSiteChecks === "function") await loadSiteChecks();
  rerenderCurrentView();
}

// 長い現場名：2行に収まらない時だけ文字を少し小さくする
function fitNames() {
  setTimeout(() =>
    document.querySelectorAll(".dsName, .siteBar b, .manageCard .siteName").forEach((el) => {
      if (!el.offsetParent) return; // 見えていない画面は測れないので、見えた時にもう一度
      el.classList.remove("fitShrink");
      if (el.scrollHeight > el.clientHeight + 2) el.classList.add("fitShrink");
    }),
    0
  );
}

function renderSiteBars() {
  const site = currentSite();
  document.querySelectorAll(".curSiteBar").forEach((bar) => {
    bar.classList.toggle("noSite", !site);
    bar.innerHTML =
      `${icon(ICONS.building, 18)}<span>今の現場</span><b>${site ? esc(site.name) : "現場が未登録"}</b>` +
      `<span class="siteSwitch">切替${icon(ICONS.chevron, 14)}</span>`;
  });
  fitNames();
}

function openSiteSwitcher() {
  openSheet("今の現場を切り替える", (body, close) => {
    activeSitesCache.forEach((site) => {
      const b = document.createElement("button");
      b.className = "pickItem" + (site.id === currentSiteId ? " picked" : "");
      b.innerHTML = `<span>${esc(site.name)}</span>${site.id === currentSiteId ? icon(ICONS.check, 20) : ""}`;
      b.addEventListener("click", () => {
        close();
        setCurrentSite(site.id);
      });
      body.appendChild(b);
    });
    if (!activeSitesCache.length) {
      const hint = document.createElement("div");
      hint.className = "hint";
      hint.textContent = "まだ現場が登録されていません。";
      body.appendChild(hint);
    }
    body.appendChild(
      sheetButton("＋ 現場を追加", "btnPrimary", () => {
        close();
        addSite();
      })
    );
    body.appendChild(
      sheetButton("現場の管理（情報の変更・休工・完工・削除）", "btnSecondary", () => {
        close();
        openSiteManage();
      })
    );
  });
}

async function addSite() {
  const res = await editSiteSheet(null);
  if (!res) return;
  const { coverFile, ...info } = res;
  const site = { id: newId(), ...info, createdAt: new Date().toISOString(), archived: false, processes: [], lastReportEnd: null };
  await dbPut("sites", site);
  await saveCover(site.id, coverFile);
  toast(`「${info.name}」を登録しました`);
  await setCurrentSite(site.id);
}

/* ---------- 現場の情報（現場名・工事番号・担当者） ---------- */
// 工事番号は経理で使っている番号。同じ現場を二人で担当した時に、上司の画面（見守り）でまとめる鍵になる。
// 担当者は社員番号が無いので苗字で持つ。表記ゆれを防ぐため、一度入れた苗字は候補として出す
const MEMBER_HISTORY_KEY = "genba-photo-member-history";
function memberHistory() {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_HISTORY_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function addMemberHistory(names) {
  const list = [...new Set([...names, ...memberHistory()])].slice(0, 30);
  try {
    localStorage.setItem(MEMBER_HISTORY_KEY, JSON.stringify(list));
  } catch (e) {}
}
function mySurname() {
  return (getSetting(USER_NAME_KEY) || "").trim().split(/[\s　]+/)[0] || "";
}
function normKoujiNo(s) {
  return String(s || "").normalize("NFKC").replace(/\s/g, "");
}

/* ---------- 現場の顔（完成イメージ・建物の種類） ---------- */
// 完成イメージはお客様の設計データなので、この端末の中（meta: "cover:<現場ID>"）だけに置き、報告では送らない。
// 画像が無い現場は、建物の種類に合わせた絵を出す（種類は現場名から自動で選び、登録シートで変えられる）
const SITE_KINDS = [
  { id: "house", label: "新築住宅", art: "art/kind-house.webp?v=1" },
  { id: "reform", label: "リフォーム", art: "art/kind-reform.webp?v=1" },
  { id: "shop", label: "店舗・事務所", art: "art/kind-shop.webp?v=1" },
];
function guessSiteKind(name) {
  const s = String(name || "");
  if (/リフォーム|改修|改装|修繕|増築|リノベ/.test(s)) return "reform";
  if (/店|事務所|オフィス|ビル|医院|クリニック|工場|倉庫|施設|ホテル|カフェ/.test(s)) return "shop";
  return "house";
}
function siteKindOf(site) {
  return SITE_KINDS.find((k) => k.id === (site.kind || guessSiteKind(site.name))) || SITE_KINDS[0];
}
async function getCover(siteId) {
  return dbGet("meta", "cover:" + siteId);
}
async function saveCover(siteId, file) {
  if (file === undefined) return; // 変更なし
  if (file === null) return dbDeleteMany("meta", ["cover:" + siteId]);
  const blob = await downscaleImage(file, 1600, 0.82);
  const thumb = await downscaleImage(file, 480, 0.75);
  await dbPut("meta", { key: "cover:" + siteId, blob, thumb, updatedAt: new Date().toISOString() });
}

/* ---------- 上司（見守り）への知らせ ----------
   休工・再開・完工・進行中に戻す・アプリ外や報告なしの週を、報告と同じ Box に小さな JSON（genba-site-status）で送る。
   次の報告を待たずに上司の画面に反映されるので、「報告の遅れ」に見えなくなる */
function statusFile(site, extra) {
  const at = new Date().toISOString();
  const data = {
    kind: "genba-site-status",
    schema: 2,
    at,
    app_version: APP_VERSION,
    sender: getSetting(USER_NAME_KEY),
    sender_id: deviceId(),
    site: site.name,
    site_id: site.id,
    kouji_no: site.koujiNo || "",
    members: site.members || [],
    ...extra,
  };
  const label = { completed: "完工", active: "再開", paused: "休工", resumed: "工事再開", week: extra.week_kind === "skip" ? "報告なし" : "アプリ外報告" }[extra.status] || "お知らせ";
  const name = safeFileName(`${label}_${getSetting(USER_NAME_KEY) || "名前なし"}_${site.name}_${todayKey()}_${at.slice(11, 19).replace(/:/g, "")}.json`);
  return new File([JSON.stringify(data, null, 2)], name, { type: "application/json" });
}

// 知らせを送るシート。共有画面はボタンを押した直後に開く（iPhone）。送れたかを確かめてから onSent を呼ぶ
function notifyStatus(site, extra, title, onSent) {
  const email = getBoxEmail();
  const file = statusFile(site, extra);
  openSheet(title, (body, close) => {
    const note = document.createElement("div");
    note.className = "mutedText";
    note.textContent = "上司の画面（見守り）にすぐ反映されるよう、小さな知らせをBoxへ送ります。共有画面でメールを選び、宛先に貼り付けて送ってください（宛先をコピーします）。";
    body.appendChild(note);
    body.appendChild(
      sheetButton("上司に知らせる（Boxへ送る）", "btnPrimary btnLarge", async () => {
        if (!email) {
          alert("設定で、Boxのアップロード用メールアドレスを登録してください。");
          return;
        }
        if (navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        if (!(navigator.canShare && navigator.canShare({ files: [file] }))) {
          alert("この端末では共有機能が使えないため送れません。");
          return;
        }
        try {
          await navigator.share({ files: [file], title: file.name });
        } catch (e) {
          return;
        }
        if (!confirm("メールを送れましたか？")) return;
        close();
        toast("上司に知らせました");
        if (onSent) onSent();
      })
    );
    body.appendChild(sheetButton("あとで（知らせない）", "btnSecondary", close));
  });
}

/* ---------- 写真の片付け（現場単位） ----------
   その現場の写真・チェック・報告の記録をバックアップ（JSON）に書き出してから、アプリの中の写真データ（画像）だけ消す。
   どのチェックの写真を撮ったか・チェック・メモの記録は残る（写真は「バックアップ済み」の絵になる）。
   バックアップから戻すと、画像が元に戻る */
async function cleanupSitePhotos(site, stored) {
  const mb = (stored.reduce((t, p) => t + p.blob.size + (p.thumb ? p.thumb.size : 0), 0) / 1048576).toFixed(1);
  const ok = confirm(
    `「${site.name}」の写真 ${stored.length}枚（約${mb}MB）を片付けます。\n\n` +
      "・写真のデータは、すべてバックアップ（JSONファイル）に書き出してから、このiPhoneの中から消えます\n" +
      "・チェック・メモ・報告の記録と、どのチェックの写真を撮ったかは残ります\n" +
      "・写真を見るには、バックアップから戻す必要があります。バックアップを保存しないと写真は戻せません\n" +
      (site.archived ? "" : "\n※この現場はまだ完工していません。\n") +
      "\nバックアップを作りますか？"
  );
  if (!ok) return;
  setProcessing(true, "バックアップを作成中...");
  // 1つのファイルが大きすぎると、iPhone で戻す時に読み込めなくなるので、約60MBごとに分ける
  const LIMIT = 60 * 1048576;
  const groups = [];
  let cur = [];
  let size = 0;
  stored.forEach((p) => {
    const s = (p.blob.size + (p.thumb ? p.thumb.size : 0)) * 1.37;
    if (cur.length && size + s > LIMIT) {
      groups.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(p.id);
    size += s;
  });
  if (cur.length) groups.push(cur);
  const files = [];
  let skippedPhotos = 0;
  try {
    for (let i = 0; i < groups.length; i++) {
      const r = await buildBackupFile({ sites: true, checks: true, photos: true }, site, new Set(groups[i]), groups.length > 1 ? `${i + 1}of${groups.length}` : "");
      files.push(r.file);
      skippedPhotos += r.skippedPhotos;
    }
  } catch (e) {
    console.error(e);
    alert("バックアップを作成できませんでした。片付けは行っていません。");
    return;
  } finally {
    setProcessing(false);
  }
  const file = files[0];
  const sizeMb = (files.reduce((t, f) => t + f.size, 0) / 1048576).toFixed(1);
  openSheet("写真を片付ける", (body, close) => {
    const info = document.createElement("div");
    info.className = "summaryBox";
    info.innerHTML = `ファイル：${files.length > 1 ? `${files.length}個に分けました（${esc(file.name)} ほか）` : esc(file.name)}<br>大きさ：約${sizeMb}MB（写真 ${stored.length - skippedPhotos}枚）`;
    body.appendChild(info);
    const how = document.createElement("div");
    how.className = "warnText";
    how.textContent = "共有画面で「ファイルに保存」を選び、Boxアプリのフォルダ（または iPhone の中）に保存してください。保存できたら、写真のデータを消します。";
    body.appendChild(how);
    if (skippedPhotos) {
      const w = document.createElement("div");
      w.className = "warnText";
      w.textContent = `読み込めない写真が${skippedPhotos}枚あり、バックアップに入りませんでした（その写真も消えます）。`;
      body.appendChild(w);
    }
    body.appendChild(
      sheetButton("バックアップを保存する", "btnPrimary btnLarge", async () => {
        if (!(navigator.canShare && navigator.canShare({ files }))) {
          alert("この端末では共有機能が使えないため保存できません。片付けは行っていません。");
          return;
        }
        try {
          await navigator.share({ files, title: file.name }); // タップの中ですぐ呼ぶ（iPhone）
        } catch (e) {
          return; // キャンセル：何も消さない
        }
        if (!confirm(`バックアップを保存できましたか？\n\nOK を押すと、「${site.name}」の写真データ ${stored.length}枚をこのiPhoneから消します。\n写真を見るには、今保存したバックアップから戻す必要があります。`)) {
          toast("写真は消していません");
          return;
        }
        close();
        const now = new Date().toISOString();
        const metas = stored.map(({ blob, thumb, ...m }) => ({ ...m, imageRemoved: true, removedAt: now, backupName: files.map((f) => f.name).join(" / ") }));
        await dbPutMany("photos", metas); // 画像を持たない情報だけ書く
        const db = await dbPromise;
        await new Promise((res, rej) => {
          const tx = db.transaction("images", "readwrite");
          stored.forEach((p) => tx.objectStore("images").delete(p.id));
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
        await loadSiteChecks();
        toast(`写真を片付けました（約${mb}MB 空きました）`);
        if (currentView === "siteManageView") renderSiteManage();
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

/* ---------- 完工 ----------
   完工にすると、ホーム・やること・今の現場の切り替えから外れる（写真・記録は残る）。
   上司の見守りに完工を知らせる時は、小さな「完工の知らせ」(genba-site-status) を報告と同じ Box に送る */
function openCompleteSheet(site, photos) {
  const left = unreported(photos || []).filter((p) => !isRecordPhoto(p)).length;
  const email = getBoxEmail();
  const at = new Date().toISOString();
  const status = {
    kind: "genba-site-status",
    schema: 1,
    status: "completed",
    at,
    app_version: APP_VERSION,
    sender: getSetting(USER_NAME_KEY),
    sender_id: deviceId(),
    site: site.name,
    site_id: site.id,
    kouji_no: site.koujiNo || "",
    members: site.members || [],
  };
  const name = safeFileName(`完工_${getSetting(USER_NAME_KEY) || "名前なし"}_${site.name}_${todayKey()}.json`);
  const file = new File([JSON.stringify(status, null, 2)], name, { type: "application/json" });
  const finish = async () => {
    site.archived = true;
    site.completedAt = todayKey();
    const open = (site.pauses || []).find((p) => !p.to);
    if (open) open.to = todayKey();
    await dbPut("sites", site);
    toast(`「${site.name}」を完工にしました`);
    await refreshSites();
    if (currentView === "siteManageView") renderSiteManage();
    else rerenderCurrentView();
  };
  openSheet("完工にする", (body, close) => {
    const note = document.createElement("div");
    note.className = "mutedText";
    note.textContent = `「${site.name}」を完工にします。ホームと「今の現場」の切り替えから外れます（写真・チェックの記録は残り、現場の管理から「進行中に戻す」で戻せます）。`;
    body.appendChild(note);
    if (left) {
      const w = document.createElement("div");
      w.className = "warnText";
      w.textContent = `まだ報告していない報告写真が${left}枚あります。必要なら、先に報告タブから送ってください。`;
      body.appendChild(w);
    }
    body.appendChild(
      sheetButton("上司に知らせて完工にする", "btnPrimary btnLarge", async () => {
        if (!email) {
          alert("設定で、Boxのアップロード用メールアドレスを登録してください。");
          return;
        }
        if (navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        if (!(navigator.canShare && navigator.canShare({ files: [file] }))) {
          alert("この端末では共有機能が使えないため送れません。iPhoneのホーム画面から開いてください。");
          return;
        }
        try {
          await navigator.share({ files: [file], title: name }); // タップの中ですぐ呼ぶ（iPhone）
        } catch (e) {
          return;
        }
        if (!confirm("メールを送れましたか？\n送れていたら「OK」で、完工にします。")) return;
        close();
        await finish();
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

async function editSiteInfo(site) {
  const res = await editSiteSheet(site);
  if (!res) return;
  const { coverFile, ...info } = res;
  Object.assign(site, info);
  await dbPut("sites", site);
  await saveCover(site.id, coverFile);
  await refreshSites();
  toast("現場の情報を変更しました");
  rerenderCurrentView();
}

function editSiteSheet(site) {
  let coverUrl = ""; // 画像の見本の URL（閉じる時に捨てる）
  return new Promise((resolve) => {
    openSheet(site ? "現場の情報を変更" : "現場を登録", (body, close) => {
      const me = mySurname();
      let members = site && site.members ? [...site.members] : me ? [me] : []; // まだ担当者を入れていない現場は、自分を選んだ状態から
      const field = (label, value, placeholder, mode) => {
        const l = document.createElement("label");
        l.className = "fieldLabel strong";
        l.innerHTML = `${esc(label)}<span class="req">必須</span>`;
        const i = document.createElement("input");
        i.className = "sheetInput";
        i.value = value || "";
        i.placeholder = placeholder;
        if (mode) i.inputMode = mode;
        body.appendChild(l);
        body.appendChild(i);
        return i;
      };
      const nameIn = field("現場名", site && site.name, "例：山田様邸 新築");
      // 現場の画像（完成予想CG・パースなど。任意）
      let coverFile; // undefined=変えない / null=消す / File=新しく入れる
      let kind = site ? site.kind || "" : ""; // ""=現場名から自動
      const cl = document.createElement("div");
      cl.className = "fieldLabel strong";
      cl.innerHTML = '現場の画像<span class="opt">任意</span>';
      body.appendChild(cl);
      const coverRow = document.createElement("div");
      coverRow.className = "coverRow";
      body.appendChild(coverRow);
      const coverIn = document.createElement("input");
      coverIn.type = "file";
      coverIn.accept = "image/*";
      coverIn.hidden = true;
      body.appendChild(coverIn);
      const drawCover = async () => {
        if (coverUrl) URL.revokeObjectURL(coverUrl);
        coverUrl = "";
        let src = "";
        if (coverFile) src = coverUrl = URL.createObjectURL(coverFile);
        else if (coverFile === undefined && site) {
          const c = await getCover(site.id);
          if (c) src = coverUrl = URL.createObjectURL(c.thumb);
        }
        const k = SITE_KINDS.find((x) => x.id === (kind || guessSiteKind(nameIn.value))) || SITE_KINDS[0];
        coverRow.innerHTML =
          `<span class="coverPrev${src ? "" : " mock"}"><img src="${src || k.art}" alt=""></span>` +
          `<span class="coverBtns"><button type="button" class="btn btnOutline" data-c="pick">${src ? "画像を変える" : "写真から選ぶ"}</button>` +
          (src ? `<button type="button" class="linkBtn" data-c="del">画像を外す</button>` : `<span class="mutedText">完成予想CG・パースなど。無ければ下の種類の絵が出ます</span>`) +
          `</span>`;
        // iPhone はファイル選択をタップの中で同期的に開く必要がある
        coverRow.querySelector('[data-c="pick"]').addEventListener("click", () => coverIn.click());
        const del = coverRow.querySelector('[data-c="del"]');
        if (del) del.addEventListener("click", () => ((coverFile = null), drawCover()));
      };
      coverIn.addEventListener("change", () => {
        if (coverIn.files[0]) coverFile = coverIn.files[0];
        coverIn.value = "";
        drawCover();
      });
      const kl = document.createElement("div");
      kl.className = "fieldLabel strong";
      kl.innerHTML = '建物の種類<span class="opt">画像が無い時の絵</span>';
      body.appendChild(kl);
      const kinds = document.createElement("div");
      kinds.className = "memberChips";
      body.appendChild(kinds);
      const drawKinds = () => {
        const eff = kind || guessSiteKind(nameIn.value);
        kinds.innerHTML = "";
        SITE_KINDS.forEach((k) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "memberChip" + (k.id === eff ? " on" : "");
          b.textContent = k.label + (k.id === eff && !kind ? "（自動）" : "");
          b.addEventListener("click", () => {
            kind = k.id;
            drawKinds();
            drawCover();
          });
          kinds.appendChild(b);
        });
      };
      nameIn.addEventListener("input", () => {
        if (!kind) {
          drawKinds();
          drawCover();
        }
      });
      drawCover();
      drawKinds();
      const noIn = field("工事番号", site && site.koujiNo, "例：2026-0143", "text");
      const noHint = document.createElement("div");
      noHint.className = "mutedText";
      noHint.textContent = "経理で使っている番号";
      body.appendChild(noHint);
      const ml = document.createElement("div");
      ml.className = "fieldLabel strong";
      ml.innerHTML = '担当者<span class="req">必須</span>';
      body.appendChild(ml);
      const picked = document.createElement("div");
      picked.className = "memberChips";
      const chips = document.createElement("div");
      chips.className = "memberChips";
      body.appendChild(picked);
      body.appendChild(chips);
      const draw = () => {
        const cands = [...new Set([...memberHistory(), ...(me ? [me] : [])])].filter((n) => !members.includes(n));
        picked.innerHTML = "";
        members.forEach((n) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "memberChip on";
          b.innerHTML = `<span>${esc(n)}</span>${icon(ICONS.x, 16, 2.4)}`;
          b.setAttribute("aria-label", `${n}を外す`);
          b.addEventListener("click", () => {
            members = members.filter((x) => x !== n);
            draw();
          });
          picked.appendChild(b);
        });
        chips.innerHTML = "";
        cands.forEach((n) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "memberChip";
          b.textContent = n;
          b.addEventListener("click", () => {
            members = [...members, n];
            draw();
          });
          chips.appendChild(b);
        });
        const add = document.createElement("button");
        add.type = "button";
        add.className = "memberChip add";
        add.textContent = "＋ 苗字を追加";
        add.addEventListener("click", () => {
          const v = (prompt("担当者の苗字（同じ苗字の人がいる時は「佐藤（大）」のように）") || "").trim();
          if (v && !members.includes(v)) members.push(v);
          draw();
        });
        chips.appendChild(add);
      };
      draw();
      const hint = document.createElement("div");
      hint.className = "mutedText";
      hint.textContent = "同じ現場を二人以上で担当する時は、全員が同じ工事番号を入れてください。上司の画面で一つの現場にまとまります。";
      body.appendChild(hint);
      // 途中から担当する現場（担当交代・途中参加・アプリ導入前から進んでいる現場）用。
      // 前の工程にチェックを自動で付けると、誰がいつ確認したかの記録が実際と合わなくなるので「導入前」として数えないだけにする
      let startGroup = site ? site.startGroup || 0 : 0;
      const sl = document.createElement("div");
      sl.className = "fieldLabel strong";
      sl.textContent = "記録を始めた段階";
      body.appendChild(sl);
      const sg = document.createElement("div");
      sg.className = "startGroups";
      body.appendChild(sg);
      const sgHint = document.createElement("div");
      sgHint.className = "mutedText";
      body.appendChild(sgHint);
      const drawSg = () => {
        sg.innerHTML = "";
        GROUPS.forEach((g, i) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "startGroup" + (i === startGroup ? " on" : i < startGroup ? " pre" : "");
          b.textContent = g.name;
          b.addEventListener("click", () => {
            startGroup = i;
            drawSg();
          });
          sg.appendChild(b);
        });
        sgHint.textContent = startGroup
          ? `「${GROUPS[startGroup].name}」より前は「導入前」として、進み具合・撮り忘れに数えません（チェックは付きません）。`
          : "着工から記録する現場は「基礎」のままでOK。途中から担当する現場だけ変えてください。";
      };
      drawSg();
      body.appendChild(
        sheetButton(site ? "変更する" : "登録する", "btnPrimary btnLarge", () => {
          const name = nameIn.value.trim();
          if (!name) {
            toast("現場名を入れてください");
            nameIn.focus();
            return;
          }
          if (!members.length) {
            toast("担当者を1人以上選んでください");
            return;
          }
          if (!normKoujiNo(noIn.value) && !confirm("工事番号が空です。このまま登録しますか？\n（あとから「現場の管理」で入れられます。二人で担当する現場は、同じ番号を入れると上司の画面でまとまります）")) {
            noIn.focus();
            return;
          }
          addMemberHistory(members);
          close();
          if (coverUrl) URL.revokeObjectURL(coverUrl);
          resolve({ name, koujiNo: normKoujiNo(noIn.value), members, startGroup, kind, coverFile });
        })
      );
      body.appendChild(
        sheetButton("キャンセル", "btnSecondary", () => {
          if (coverUrl) URL.revokeObjectURL(coverUrl);
          close();
          resolve(null);
        })
      );
      if (!site) setTimeout(() => nameIn.focus(), 50);
    }, () => {
      if (coverUrl) URL.revokeObjectURL(coverUrl);
      resolve(null);
    });
  });
}

// いま表示している画面を、現場が変わった内容で描き直す
function rerenderCurrentView() {
  const fns = {
    dashView: renderDash,
    manualView: renderManual,
    albumView: renderAlbum,
    requiredView: () => renderRequired(true),
    reportView: renderReport,
    reportProcView: renderReportProc,
    reportPastView: goReport,
    siteManageView: renderSiteManage,
    groupView: () => openGroup(currentGroupId, groupItems[currentItemIdx] && groupItems[currentItemIdx].id),
  };
  if (fns[currentView]) fns[currentView]();
}

// 描画の世代番号。await の間に次の描画が始まったら古い方は画面を触らない（写真が2倍に並ぶのを防ぐ）
const renderGen = { album: 0, report: 0, manage: 0, dash: 0 };

/* ---------- 現場の管理 ---------- */

function openSiteManage() {
  renderSiteManage();
  openSubView("siteManageView");
}

async function renderSiteManage() {
  const gen = ++renderGen.manage;
  const sites = await getSites();
  const photosBySite = {};
  for (const site of sites) photosBySite[site.id] = await getSitePhotos(site.id);
  if (gen !== renderGen.manage) return;
  const list = $("manageList");
  list.innerHTML = "";
  if (!sites.length) list.innerHTML = '<div class="emptyState"><div class="emptyText">まだ現場が登録されていません。</div></div>';
  for (const site of sites) {
    const photos = photosBySite[site.id];
    const card = document.createElement("div");
    card.className = "siteCard manageCard";
    card.innerHTML =
      `<div class="siteCardHead"><span class="siteName">${esc(site.name)}</span>` +
      (site.id === currentSiteId ? '<span class="badge badgeOk">今の現場</span>' : site.archived ? '<span class="badge badgeMuted">完工</span>' : "") +
      `</div>${site.archived && site.completedAt ? `<div class="siteMeta">完工 ${fmtDate(site.completedAt)}</div>` : ""}<div class="siteMeta">${site.koujiNo ? `工事番号 ${esc(site.koujiNo)} ・ ` : '<span class="warnInline">工事番号なし</span> ・ '}担当 ${esc((site.members || []).join("・") || "未登録")}</div>` +
      `<div class="siteMeta">登録 ${fmtDate(toDateKey(new Date(site.createdAt)))} ・ 写真 ${photos.length}枚（約${(photos.reduce((t, p) => t + (p.blob ? p.blob.size : 0) + (p.thumb ? p.thumb.size : 0), 0) / 1048576).toFixed(1)}MB）</div>` +
      `<div class="manageBtns"></div>`;
    const btns = card.querySelector(".manageBtns");
    const add = (label, cls, fn) => {
      const b = document.createElement("button");
      b.className = `btn ${cls}`;
      b.textContent = label;
      b.addEventListener("click", fn);
      btns.appendChild(b);
    };
    if (!site.archived && site.id !== currentSiteId) add("今の現場にする", "btnOutline", () => setCurrentSite(site.id));
    add("現場の情報を変更", "btnSecondary", async () => {
      const res = await editSiteSheet(site);
      if (!res) return;
      const { coverFile, ...info } = res;
      Object.assign(site, info);
      await dbPut("sites", site);
      await saveCover(site.id, coverFile);
      await refreshSites();
      renderSiteManage();
    });
    if (!site.archived) add(isPaused(site) ? "工事を再開" : "休工にする", "btnSecondary", async () => {
      await togglePause(site);
      renderSiteManage();
    });
    add(site.archived ? "進行中に戻す" : "完工にする", "btnSecondary", async () => {
      if (site.archived) {
        if (!confirm(`「${site.name}」を進行中に戻しますか？`)) return;
        site.archived = false;
        delete site.completedAt;
        await dbPut("sites", site);
        toast("進行中に戻しました");
        await refreshSites();
        renderSiteManage();
        notifyStatus(site, { status: "active" }, "進行中に戻したことを上司に知らせる");
        return;
      }
      openCompleteSheet(site, photos);
    });
    const stored = photos.filter((p) => p.blob && !p.imageRemoved);
    if (stored.length) add(`写真を片付ける（約${(stored.reduce((t, p) => t + p.blob.size + (p.thumb ? p.thumb.size : 0), 0) / 1048576).toFixed(0)}MB）`, "btnSecondary", () => cleanupSitePhotos(site, stored));
    const del = document.createElement("button");
    del.className = "btn btnDanger manageDel";
    del.textContent = "この現場を削除";
    card.appendChild(del);
    del.addEventListener("click", async () => {
      if (stored.length && confirm(`「${site.name}」には写真が${stored.length}枚あります。削除すると写真もチェックも戻せません。\n\n先に「写真を片付ける」でバックアップを作りますか？`)) {
        cleanupSitePhotos(site, stored);
        return;
      }
      if (!confirm(`「${site.name}」と写真${photos.length}枚・チェック・メモ・報告の記録をすべて削除します。元に戻せません。よろしいですか？`)) return;
      if (!confirm(`最終確認：「${site.name}」を本当に削除しますか？`)) return;
      const reports = await dbGetAll("reports", "siteId", site.id);
      const checks = await dbGetAll("checks", "siteId", site.id);
      await dbDeleteMany("photos", photos.map((p) => p.id));
      await dbDeleteMany("reports", reports.map((r) => r.id));
      await dbDeleteMany("checks", checks.map((r) => r.key));
      await dbDeleteMany("sites", [site.id]);
      toast("現場を削除しました");
      await refreshSites();
      renderSiteManage();
    });
    list.appendChild(card);
  }
  fitNames();
}

/* ---------- 写真のマス目（アルバム・報告で共通） ---------- */

// 写真の見出し：品質写真はチェック項目、報告写真は工程名
function photoTitle(ph) {
  if (isRecordPhoto(ph) && ph.checkKey) return checkTextOf(ph.itemId, ph.checkKey);
  return processOf(ph.processId).name;
}

// 説明つきのカード（2列表示・報告の工程ページ）
// 写真のマス目を指で横になぞると、まとめて選ぶ／外す（最初に触れた写真の逆の状態にそろえる）。縦に動かした時はふつうにスクロール
function attachDragSelect(grid, isOn, setOn) {
  // 同じマス目を描き直すたびに呼ばれるので、処理は1回だけ付け、使う関数だけ差し替える
  grid._drag = { isOn, setOn };
  if (grid._dragAttached) return;
  grid._dragAttached = true;
  isOn = (id) => grid._drag.isOn(id);
  setOn = (id, on) => grid._drag.setOn(id, on);
  let start = null;
  let mode = null;
  let target = false;
  let touched = new Set();
  const apply = (id) => {
    if (touched.has(id)) return;
    touched.add(id);
    if (isOn(id) !== target) setOn(id, target);
  };
  grid.addEventListener(
    "touchstart",
    (e) => {
      const c = e.target.closest("[data-id]");
      if (!c || e.target.closest(".photoMenu")) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, id: c.dataset.id };
      mode = null;
      touched = new Set();
    },
    { passive: true }
  );
  grid.addEventListener(
    "touchmove",
    (e) => {
      if (!start) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (!mode) {
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
          mode = "select";
          target = !isOn(start.id);
          apply(start.id);
        } else if (Math.abs(dy) > 12) mode = "scroll";
      }
      if (mode === "select") {
        e.preventDefault();
        const el = document.elementFromPoint(t.clientX, t.clientY);
        const c = el && el.closest("[data-id]");
        if (c && grid.contains(c)) apply(c.dataset.id);
      }
    },
    { passive: false }
  );
  grid.addEventListener("touchend", () => {
    start = null;
    mode = null;
  });
}

function photoCard(ph, opts) {
  const card = document.createElement("button");
  card.dataset.id = ph.id;
  card.className = "photoCard" + (opts.selected && opts.selected.has(ph.id) ? " selected" : "");
  const kind = isRecordPhoto(ph) ? '<span class="kindLabel record">品質</span>' : '<span class="kindLabel report">報告</span>';
  const mark = ph.reportId ? '<span class="cardMark">報告済</span>' : ph.sendPick ? '<span class="cardMark use">送る</span>' : "";
  card.innerHTML =
    `<span class="photoCardImg"><img src="${blobUrl(opts.bucket, ph.thumb)}" alt=""><span class="check">${icon(ICONS.check, 18, 3)}</span></span>` +
    `<span class="photoCardInfo">` +
    (opts.compact
      ? ""
      : `<span class="photoCardTags">${opts.showKind ? kind : ""}<span class="procPill">${esc(processOf(ph.processId).short)}</span>${mark}</span>` +
        `<span class="photoCardTitle">${esc(photoTitle(ph))}</span>`) +
    `<span class="photoCardDate">${esc(fmtDateTime(ph.takenAt))}</span></span>` +
    `<span class="photoMenu" role="button" aria-label="メニュー">${icon(ICONS.dotsV, 20)}</span>`;
  card.querySelector(".photoMenu").addEventListener("click", (e) => {
    e.stopPropagation();
    openPhotoViewer(ph.blob, opts.actions ? opts.actions(ph) : []);
  });
  card.addEventListener("contextmenu", (e) => e.preventDefault());
  card.addEventListener("click", () => opts.onTap(ph, card));
  return card;
}

// opts: { bucket, selected:Set, onTap(ph, cell), actions(ph) → ビューアのボタン, showKind }
function photoCell(ph, opts) {
  const cell = document.createElement("button");
  cell.dataset.id = ph.id;
  cell.className = "photoCell" + (opts.selected && opts.selected.has(ph.id) ? " selected" : "");
  const kind = isRecordPhoto(ph) ? '<span class="cellKind record">品質</span>' : '<span class="cellKind report">報告</span>';
  cell.innerHTML =
    `<img src="${blobUrl(opts.bucket, ph.thumb)}" alt="">` +
    `<span class="check">${icon(ICONS.check, 18, 3)}</span>` +
    (opts.showKind ? kind : "") +
    (ph.reportId ? '<span class="cellDone">報告済</span>' : ph.forReport && isRecordPhoto(ph) ? '<span class="cellDone use">送る写真</span>' : "") +
    `<span class="photoTag">${esc(processOf(ph.processId).short)}</span>` +
    `<span class="photoDate">${fmtDate(ph.dateKey)}</span>` +
    `<span class="photoMenu small" role="button" aria-label="メニュー">${icon(ICONS.dotsV, 18)}</span>`;
  cell.querySelector(".photoMenu").addEventListener("click", (e) => {
    e.stopPropagation();
    openPhotoViewer(ph.blob, opts.actions ? opts.actions(ph) : []);
  });
  // 長押しで拡大（工程の変更・削除など）、通常タップは選択
  let pressTimer = null;
  let longPressed = false;
  cell.addEventListener("touchstart", () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      openPhotoViewer(ph.blob, opts.actions ? opts.actions(ph) : []);
    }, 450);
  }, { passive: true });
  const cancel = () => clearTimeout(pressTimer);
  cell.addEventListener("touchend", cancel);
  cell.addEventListener("touchmove", cancel, { passive: true });
  cell.addEventListener("contextmenu", (e) => e.preventDefault());
  cell.addEventListener("click", () => {
    if (longPressed) return;
    opts.onTap(ph, cell);
  });
  return cell;
}

// 写真1枚へのよくある操作（拡大画面のボタン）。after は操作後に描き直す処理
function photoActions(ph, after) {
  return [
    {
      label: "工程を変更",
      cls: "btnPrimary",
      onClick: () => pickProcessSheet("この写真の工程を変更", (pid) => retagPhotos([ph.id], pid, after)),
    },
    {
      label: "削除",
      cls: "btnDanger",
      onClick: async () => {
        if (!confirm("この写真を削除しますか？")) return false;
        await dbDeleteMany("photos", [ph.id]);
        if (typeof loadSiteChecks === "function") await loadSiteChecks();
        await after();
        toast("写真を削除しました");
      },
    },
  ];
}

// 写真の工程を付け替える（違う工程で撮ってしまった時用）
function pickProcessSheet(title, onPick) {
  openSheet(title, (body, close) => {
    PROCESSES.forEach((p) => {
      const g = groupOfProcess(p.id);
      if (g.cats[0] === p.id) {
        const label = document.createElement("div");
        label.className = "pickGroupLabel";
        label.textContent = g.name;
        body.appendChild(label);
      }
      const b = document.createElement("button");
      b.className = "pickItem";
      b.innerHTML = `<span><span class="processNo">${p.no}</span>${esc(p.name)}</span>`;
      b.addEventListener("click", () => {
        close();
        onPick(p.id);
      });
      body.appendChild(b);
    });
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

async function retagPhotos(ids, pid, after) {
  const photos = (await Promise.all(ids.map((id) => dbGet("photos", id)))).filter(Boolean);
  photos.forEach((p) => (p.processId = pid));
  await dbPutMany("photos", photos);
  await after();
  toast(`${photos.length}枚を「${processOf(pid).name}」に変更しました`);
}

function safeFileName(s) {
  return s.replace(/[\\/:*?"<>|\s]/g, "");
}

// 写真を工程順・撮影順に並べ、書き出し用のファイル名を付ける
function photoFiles(site, photos) {
  const sorted = photos.filter((p) => p.blob).sort((a, b) => processOf(a.processId).no - processOf(b.processId).no || (a.takenAt < b.takenAt ? -1 : 1));
  const counters = {};
  return sorted.map((p) => {
    const short = processOf(p.processId).short;
    counters[short] = (counters[short] || 0) + 1;
    const name = safeFileName(`${site.name}_${short}_${fmtMMDD(p.dateKey)}_${pad2(counters[short])}_${p.id.slice(0, 6)}.jpg`);
    return { photo: p, file: new File([p.blob], name, { type: "image/jpeg" }) };
  });
}

async function sharePhotos(site, photos) {
  if (!photos.length) {
    toast("保存する写真を選んでください");
    return;
  }
  const files = photoFiles(site, photos).map((e) => e.file);
  if (!files.length) {
    toast("選んだ写真は片付け済みのため、保存できません");
    return;
  }
  if (navigator.canShare && navigator.canShare({ files })) {
    try {
      await navigator.share({ files });
    } catch (e) {
      /* キャンセル */
    }
    return;
  }
  // 共有シートが使えない環境（PCのブラウザ等）はダウンロードで代用
  files.forEach((f) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
}

/* ---------- 写真タブ：今の現場のアルバム ---------- */

const ALBUM_COLS_KEY = "genba-photo-album-cols";
const albumState = { kind: "all", group: "all", sort: "new", cols: getSetting(ALBUM_COLS_KEY) === "3" ? 3 : 2 };
const albumSel = new Set();
let albumPhotos = [];

function goAlbum() {
  albumSel.clear();
  renderAlbum();
  showView("albumView");
}

// 写真要のチェックのうち、品質写真が撮れている数（該当なしにした工程は数えない）
// 「この現場では撮影不要」にした写真要のチェック（チェック記録の noPhoto に、いつ・誰がを残す）
// チェックごとの該当なし（項目はあるが、このチェックはこの現場に無い）。rec.naChecks[key] = { at, by, off? }
function isNaCheck(rec, key) {
  const v = rec && rec.naChecks && rec.naChecks[key];
  return !!(v && !v.off);
}
async function toggleNaCheck(it, key) {
  const rec = checkRecOf(it.id);
  rec.naChecks = rec.naChecks || {};
  const on = isNaCheck(rec, key);
  rec.naChecks[key] = { at: new Date().toISOString(), by: getSetting(USER_NAME_KEY), ...(on ? { off: true } : {}) };
  // 該当なしにしたら付けていたチェックは外す（戻しても付け直さない）
  if (!on && rec.marks) delete rec.marks[key];
  await saveCheckRec(rec);
}

function photoSkipped(rec, key) {
  const v = rec && rec.noPhoto && rec.noPhoto[key];
  return !!(v && !v.off);
}

async function recordCoverage(siteId) {
  if (!manualMeta) return null;
  const recs = Object.fromEntries((await dbGetAll("checks", "siteId", siteId)).map((r) => [r.itemId, r]));
  const photos = (await getSitePhotos(siteId)).filter(isRecordPhoto);
  const site = (await getSites()).find((x) => x.id === siteId);
  const preCats = new Set(GROUPS.slice(0, (site && site.startGroup) || 0).flatMap((g) => g.cats));
  let total = 0;
  let done = 0;
  manualMeta.items.forEach((it) => {
    if ((recs[it.id] && recs[it.id].na) || preCats.has(it.cat)) return;
    ((it.text && it.text.checks) || []).forEach((c) => {
      if (c.photo !== "要" || photoSkipped(recs[it.id], checkKey("checks", c)) || isNaCheck(recs[it.id], checkKey("checks", c))) return;
      total++;
      if (photos.some((p) => p.itemId === it.id && p.checkKey === checkKey("checks", c))) done++;
    });
  });
  return { total, done };
}

async function renderAlbum() {
  const gen = ++renderGen.album;
  const site = await refreshSites();
  const all = site ? await getSitePhotos(site.id) : [];
  const cov = site ? await recordCoverage(site.id) : null;
  if (gen !== renderGen.album) return;
  releaseUrls("album");
  const grid = $("albumGrid");
  grid.innerHTML = "";
  const empty = $("albumEmpty");
  if (!site) {
    $("albumStats").innerHTML = "";
    $("albumKinds").innerHTML = "";
    $("albumChips").innerHTML = "";
    $("albumHeading").textContent = "";
    $("albumCount").textContent = "";
    empty.hidden = false;
    empty.innerHTML = '<div class="emptyTitle">担当現場を登録しましょう</div><div class="emptyText">上の「今の現場」から現場を登録すると、写真がここにまとまります。</div>';
    $("albumBar").hidden = true;
    return;
  }
  const nReport = all.filter((p) => !isRecordPhoto(p)).length;
  const nRecord = all.length - nReport;
  $("albumStats").innerHTML =
    `<div class="statBox"><span class="kindLabel record">品質</span><b>${nRecord}</b>枚</div>` +
    `<div class="statBox"><span class="kindLabel report">報告</span><b>${nReport}</b>枚</div>` +
    (cov
      ? `<button class="statBox wide statLink" id="albumReqBtn"><span>写真要の品質写真</span><b>${cov.done}</b>/${cov.total}<span class="statBar"><span style="width:${cov.total ? Math.round((cov.done / cov.total) * 100) : 0}%"></span></span><span class="statPct">${cov.total ? Math.round((cov.done / cov.total) * 100) : 0}%</span><span class="statGo">一覧${icon(ICONS.chevron, 14)}</span></button>`
      : "");

  if ($("albumReqBtn")) $("albumReqBtn").addEventListener("click", () => openRequired("all"));
  const kinds = $("albumKinds");
  kinds.innerHTML = "";
  [["all", "すべて"], ["record", "品質写真"], ["report", "報告写真"]].forEach(([k, label]) => {
    const b = document.createElement("button");
    b.className = "segBtn" + (albumState.kind === k ? " active" : "");
    b.textContent = label;
    b.addEventListener("click", () => {
      albumState.kind = k;
      renderAlbum();
    });
    kinds.appendChild(b);
  });

  const byKind = all.filter((p) => albumState.kind === "all" || (albumState.kind === "record" ? isRecordPhoto(p) : !isRecordPhoto(p)));
  const groupsWith = GROUPS.filter((g) => byKind.some((p) => g.cats.includes(p.processId)));
  if (albumState.group !== "all" && !groupsWith.some((g) => g.id === albumState.group)) albumState.group = "all";
  const chips = $("albumChips");
  chips.innerHTML = "";
  // 大分類はイラスト付きのタイル（写真がない大分類は薄く表示して押せない）
  [{ id: "all", name: "すべて" }, ...GROUPS].forEach((g) => {
    const b = document.createElement("button");
    const has = g.id === "all" || groupsWith.some((x) => x.id === g.id);
    b.className = "groupChip" + (albumState.group === g.id ? " active" : "") + (has ? "" : " empty");
    b.disabled = !has;
    b.innerHTML = `<span class="groupChipArt">${g.id === "all" ? icon(ICONS.grid2, 24) : groupArt(g, 30)}</span><span>${esc(g.name)}</span>`;
    b.addEventListener("click", () => {
      albumState.group = g.id;
      renderAlbum();
    });
    chips.appendChild(b);
  });
  chips.hidden = false; // 写真がなくても大分類のタイルは並べておく（写真のない大分類は薄く表示）

  albumPhotos = byKind.filter((p) => albumState.group === "all" || groupOf(albumState.group).cats.includes(p.processId));
  const sorters = {
    new: (a, b) => (a.takenAt < b.takenAt ? 1 : -1),
    old: (a, b) => (a.takenAt < b.takenAt ? -1 : 1),
    proc: (a, b) => processOf(a.processId).no - processOf(b.processId).no || (a.takenAt < b.takenAt ? 1 : -1),
  };
  albumPhotos.sort(sorters[albumState.sort]);
  $("albumSort").value = albumState.sort;
  $("albumColsBtn").innerHTML = icon(albumState.cols === 2 ? ICONS.grid3 : ICONS.grid2, 22);
  $("albumColsBtn").setAttribute("aria-label", albumState.cols === 2 ? "3列で表示" : "2列で表示");
  grid.className = "photoGrid" + (albumState.cols === 2 ? " cols2" : "");
  const gName = albumState.group === "all" ? "" : groupOf(albumState.group).name;
  const kName = { all: "写真", report: "報告写真", record: "品質写真" }[albumState.kind];
  $("albumHeading").textContent = `${gName ? gName + "の" : ""}${kName}`;
  $("albumCount").textContent = `${albumPhotos.length}枚あります。`;
  const maker = albumState.cols === 2 ? photoCard : photoCell;
  albumPhotos.forEach((ph) =>
    grid.appendChild(
      maker(ph, {
        bucket: "album",
        selected: albumSel,
        showKind: true,
        actions: (p) => photoActions(p, renderAlbum),
        onTap: (p, cell) => {
          if (albumSel.has(p.id)) albumSel.delete(p.id);
          else albumSel.add(p.id);
          cell.classList.toggle("selected", albumSel.has(p.id));
          updateAlbumBar();
        },
      })
    )
  );
  attachDragSelect(
    grid,
    (id) => albumSel.has(id),
    (id, on) => {
      if (on) albumSel.add(id);
      else albumSel.delete(id);
      const c = grid.querySelector(`[data-id="${id}"]`);
      if (c) c.classList.toggle("selected", on);
      updateAlbumBar();
    }
  );
  empty.hidden = albumPhotos.length > 0;
  if (!albumPhotos.length) {
    empty.innerHTML = all.length
      ? '<div class="emptyText">この条件の写真はありません。</div>'
      : '<div class="emptyTitle">まだ写真がありません</div><div class="emptyText">品質写真は工程マニュアルの「写真要」のチェック横、報告写真は報告タブの工程ページから撮れます。</div>';
  }
  [...albumSel].forEach((id) => {
    if (!all.some((p) => p.id === id)) albumSel.delete(id);
  });
  updateAlbumBar();
}

function albumSelAllPicked() {
  const sel = albumPhotos.filter((p) => albumSel.has(p.id) && !p.reportId);
  return sel.length > 0 && sel.every((p) => p.sendPick);
}

function updateAlbumBar() {
  $("albumBar").hidden = albumSel.size === 0;
  $("albumSelCount").textContent = albumSel.size;
  $("albumUseLabel").textContent = albumSelAllPicked() ? "送る写真から外す" : "送る写真に入れる";
}

async function albumSelected() {
  return (await Promise.all([...albumSel].map((id) => dbGet("photos", id)))).filter(Boolean);
}

// 選んだ写真を「送る写真」にする（品質写真も報告に使えるようにする）
async function albumUseForReport() {
  if (albumSelAllPicked()) {
    const picked = (await albumSelected()).filter((p) => !p.reportId);
    picked.forEach((p) => {
      p.sendPick = false;
      if (isRecordPhoto(p)) p.forReport = false;
    });
    await dbPutMany("photos", picked);
    albumSel.clear();
    await renderAlbum();
    toast(`${picked.length}枚を報告から外しました`);
    return;
  }
  const photos = await albumSelected();
  const usable = photos.filter((p) => !p.reportId);
  usable.forEach((p) => {
    if (isRecordPhoto(p)) p.forReport = true;
    p.sendPick = true;
  });
  await dbPutMany("photos", usable);
  const skipped = photos.length - usable.length;
  albumSel.clear();
  await renderAlbum();
  toast(`${usable.length}枚を報告の「送る写真」にしました` + (skipped ? `（報告済みの${skipped}枚は除きました）` : ""));
}

function albumRetag() {
  const ids = [...albumSel];
  pickProcessSheet(`選んだ${ids.length}枚の工程を変更`, async (pid) => {
    albumSel.clear();
    await retagPhotos(ids, pid, renderAlbum);
  });
}

async function albumDelete() {
  if (!confirm(`選んだ写真${albumSel.size}枚を削除します。元に戻せません。よろしいですか？`)) return;
  const n = albumSel.size;
  await dbDeleteMany("photos", [...albumSel]);
  albumSel.clear();
  if (typeof loadSiteChecks === "function") await loadSiteChecks();
  await renderAlbum();
  toast(`${n}枚を削除しました`);
}

/* ---------- 撮影 ---------- */

let shootProcessId = null;
let lastShotId = null;
let libraryProcessId = null;
let shotFrom = "report"; // 撮影を始めた画面（今は報告の工程ページだけ）
let lastSavedProcessId = null; // 撮影直後の画面で最後に保存した写真の工程（「終わる」の戻り先）

// 品質写真の撮影先（工程マニュアルの「写真要」チェックから撮るとき）。通常の撮影では null
let recordTarget = null;

/* ---------- 撮影中にアプリが読み込み直された時の対策 ----------
   メモリの少ない iPhone では、カメラから戻った時にアプリ（ページ）が読み込み直されることがあり、
   その時は撮った写真がアプリに渡されず失われる（取り戻す方法は無い）。
   せめて「保存されなかった」ことを伝え、撮っていた場所へ戻すため、カメラを開く前に行き先を控えておく */
const PENDING_SHOT_KEY = "genba-photo-pending-shot";
function markPendingShot(info) {
  try {
    sessionStorage.setItem(PENDING_SHOT_KEY, JSON.stringify({ ...info, siteId: currentSiteId, at: Date.now() }));
  } catch (e) {}
}
function clearPendingShot() {
  try {
    sessionStorage.removeItem(PENDING_SHOT_KEY);
  } catch (e) {}
}
// カメラを閉じた（撮らずにキャンセルした）時は控えを消す。撮った時は change の処理で消える
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  setTimeout(() => {
    if (!$("processing") || $("processing").hidden) clearPendingShot();
  }, 4000);
});
async function checkPendingShot() {
  let p = null;
  try {
    p = JSON.parse(sessionStorage.getItem(PENDING_SHOT_KEY) || "null");
  } catch (e) {}
  clearPendingShot();
  if (!p || Date.now() - p.at > 15 * 60 * 1000) return false;
  alert("撮影中にアプリが読み込み直されたため、写真を保存できませんでした。\nお手数ですが、もう一度撮影してください。");
  if (p.siteId && p.siteId !== currentSiteId) await setCurrentSite(p.siteId);
  const it = p.itemId && manualMeta && manualMeta.items.find((x) => x.id === p.itemId);
  if (it) {
    currentMTab = "check";
    await openGroup(groupOfProcess(it.cat).id, it.id);
  } else if (p.processId) await openReportProc(p.processId);
  return true;
}

function startRecordCamera(it, key) {
  recordTarget = { siteId: currentSiteId, itemId: it.id, checkKey: key };
  shootProcessId = it.cat;
  markPendingShot({ itemId: it.id, processId: it.cat });
  $("cameraInput").click();
}

function startRecordLibrary(it, key) {
  recordTarget = { siteId: currentSiteId, itemId: it.id, checkKey: key };
  shootProcessId = it.cat;
  markPendingShot({ itemId: it.id, processId: it.cat });
  $("recordLibraryInput").click();
}

function startCamera(pid) {
  recordTarget = null;
  shootProcessId = pid;
  markPendingShot({ processId: pid });
  $("cameraInput").click();
}

function startLibrary(pid) {
  libraryProcessId = pid;
  $("libraryInput").click();
}

async function onCameraPicked() {
  const input = $("cameraInput");
  const file = input.files[0];
  input.value = "";
  clearPendingShot();
  if (!file || !shootProcessId || !currentSiteId) return;
  setProcessing(true);
  if (recordTarget) {
    await saveRecordPhoto(file, new Date());
    setProcessing(false);
    return;
  }
  try {
    const rec = await makePhotoRecord(file, currentSiteId, shootProcessId, new Date());
    await dbPut("photos", rec);
    lastShotId = rec.id;
    lastSavedProcessId = shootProcessId;
    await renderShot(rec);
    showView("shotView");
  } catch (e) {
    console.error(e);
    alert("写真を保存できませんでした。もう一度撮影してください。");
  } finally {
    setProcessing(false);
  }
}

async function onRecordLibraryPicked() {
  const input = $("recordLibraryInput");
  const file = input.files[0];
  input.value = "";
  clearPendingShot();
  if (!file || !recordTarget) return;
  setProcessing(true, "写真を取り込み中...");
  const taken = (await readExifDate(file)) || (file.lastModified ? new Date(file.lastModified) : new Date());
  await saveRecordPhoto(file, taken);
  setProcessing(false);
}

async function renderShot(rec) {
  releaseUrls("shot");
  const p = processOf(shootProcessId);
  $("shotTitle").textContent = p.name;
  $("shotGuide").innerHTML = guideHtml(p, { report: true, record: false });
  const current = unreported(await getSitePhotos(currentSiteId))
    .filter((ph) => ph.processId === shootProcessId && !isRecordPhoto(ph))
    .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
  if (rec) {
    $("shotPreview").src = blobUrl("shot", rec.blob);
    $("shotStatus").textContent = `報告写真を保存しました（この工程 ${current.length}枚目）`;
  } else {
    $("shotPreview").removeAttribute("src");
    $("shotStatus").textContent = `取り消しました（この工程 ${current.length}枚）`;
  }
  $("shotUndoBtn").hidden = !rec;
  const strip = $("shotStrip");
  strip.innerHTML = "";
  current.slice(0, 12).forEach((ph) => {
    const img = document.createElement("img");
    img.src = blobUrl("shot", ph.thumb);
    img.alt = "";
    img.addEventListener("click", () =>
      openPhotoViewer(ph.blob, [
        {
          label: "この写真を削除",
          cls: "btnDanger",
          onClick: async () => {
            if (!confirm("この写真を削除しますか？")) return false;
            await dbDeleteMany("photos", [ph.id]);
            if (lastShotId === ph.id) lastShotId = null;
            await renderShot(lastShotId ? await dbGet("photos", lastShotId) : null);
            toast("写真を削除しました");
          },
        },
      ])
    );
    strip.appendChild(img);
  });
}

async function undoLastShot() {
  if (!lastShotId) return;
  await dbDeleteMany("photos", [lastShotId]);
  lastShotId = null;
  await renderShot(null);
}

function pickOtherProcess() {
  const site = currentSite();
  if (!site) return;
  openSheet("どの工程を撮りますか", (body, close) => {
    site.processes.forEach((pid) => {
      const p = processOf(pid);
      const b = document.createElement("button");
      b.className = "pickItem" + (pid === shootProcessId ? " picked" : "");
      b.innerHTML = `<span><span class="processNo">${p.no}</span>${esc(p.name)}</span>${icon(ICONS.camera, 20)}`;
      b.addEventListener("click", () => {
        close();
        startCamera(pid);
      });
      body.appendChild(b);
    });
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

function leaveShot() {
  releaseUrls("shot");
  lastShotId = null;
  openReportProc(lastSavedProcessId || reportProcId || shootProcessId);
}

async function onLibraryPicked() {
  const input = $("libraryInput");
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length || !libraryProcessId || !currentSiteId) return;
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    setProcessing(true, `取り込み中... ${i + 1} / ${files.length}`);
    try {
      const file = files[i];
      const taken = (await readExifDate(file)) || (file.lastModified ? new Date(file.lastModified) : new Date());
      const rec = await makePhotoRecord(file, currentSiteId, libraryProcessId, taken);
      await dbPut("photos", rec);
      ok++;
    } catch (e) {
      console.error(e);
      failed++;
    }
  }
  setProcessing(false);
  toast(`${ok}枚を取り込みました` + (failed ? `（${failed}枚は読み込めませんでした）` : ""));
  if (currentView === "reportProcView") renderReportProc();
}

/* ---------- 報告タブ：今回の期間の工程一覧 ---------- */
// 報告に使う写真（報告候補）＝報告写真 ＋ 写真タブで「報告に使う」を付けた品質写真。そのうち sendPick の付いたものを送る

let reportProcId = null;
let reportPastId = null;
let reportCache = { site: null, all: [] }; // 報告タブを描いた時の写真（「写真を保存」をタップの中ですぐ共有するため）
let pastPhotos = [];                        // 過去の報告の画面に出している写真

function sendPicks(photos) {
  return unreported(photos).filter((p) => p.sendPick);
}

function goReport() {
  renderReport();
  showView("reportView");
}

async function renderReport() {
  const gen = ++renderGen.report;
  const site = await refreshSites();
  const all = site ? await getSitePhotos(site.id) : [];
  const reports = site ? (await dbGetAll("reports", "siteId", site.id)).sort((a, b) => (a.end < b.end ? 1 : -1)) : [];
  if (gen !== renderGen.report) return;
  releaseUrls("report");
  reportCache = { site, all };
  const body = $("reportBody");
  body.innerHTML = "";
  if (!site) {
    body.innerHTML = '<div class="emptyState"><div class="emptyTitle">担当現場を登録しましょう</div><div class="emptyText">上の「今の現場」から現場を登録すると、工程ごとに報告写真を撮れます。</div></div>';
    $("reportBar").hidden = true;
    return;
  }
  const cands = unreported(all);
  const picks = cands.filter((p) => p.sendPick);
  const wk = reportWeek(site, reports);
  // 対象の週より前に撮った、まだ報告していない報告写真があれば知らせる
  const older = cands.filter((p) => !isRecordPhoto(p) && p.dateKey < wk.mon).length;
  let html =
    `<div class="periodBar withArt">${reportWeekHtml(wk)}</div>` +

    (older ? `<div class="hint">${fmtDate(wk.mon)}より前に撮った、まだ報告していない写真が${older}枚あります（今回の報告に含められます）。</div>` : "") +
    `<div class="sectionLabel">今回の工程（タップで報告写真のページへ）</div>`;
  body.innerHTML = html;
  const list = document.createElement("div");
  list.className = "processCards";
  const pids = [...new Set([...site.processes, ...cands.map((p) => p.processId)])].sort((a, b) => processOf(a).no - processOf(b).no);
  if (!pids.length) list.innerHTML = '<div class="hint">今回実施した工程を「工程を追加」から選ぶか、工程マニュアルの「この工程の報告写真」から始めてください。</div>';
  pids.forEach((pid) => {
    const p = processOf(pid);
    const inProc = cands.filter((ph) => ph.processId === pid);
    const sel = inProc.filter((ph) => ph.sendPick).length;
    const card = document.createElement("div");
    card.className = "processCard reportProcCard";
    // 左の絵：いちばん新しい写真、なければ大分類のイラスト
    const latest = inProc.sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))[0];
    const thumb = latest ? `<img src="${blobUrl("report", latest.thumb)}" alt="">` : groupArt(groupOfProcess(pid), 46);
    card.innerHTML =
      `<button class="reportProcOpen"><span class="procThumb${latest ? " photo" : ""}">${thumb}</span>` +
      `<span class="procBody"><span class="processName"><span class="processNo">${p.no}</span>${esc(shortProcessName(p))}</span>` +
      `<span class="procStat">${icon(ICONS.camSmall, 16)}写真 <b>${inProc.length}</b> 枚</span>` +
      `<span class="procStat send">${icon(ICONS.report, 16)}送る <b>${sel}</b> 枚</span></span>` +
      `<span class="chev">${icon(ICONS.chevron, 18)}</span></button>` +
      `<button class="iconBtn removeProcessBtn" aria-label="メニュー">${icon(ICONS.dotsV, 20)}</button>`;
    card.querySelector(".reportProcOpen").addEventListener("click", () => openReportProc(pid));
    card.querySelector(".removeProcessBtn").addEventListener("click", () =>
      openSheet(p.name, (body, close) => {
        body.appendChild(
          sheetButton("今回の工程から外す", "btnDanger", () => {
            close();
            removeProcess(pid, inProc.length);
          })
        );
        body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
      })
    );
    list.appendChild(card);
  });
  body.appendChild(list);
  body.appendChild(sheetButton("＋ 工程を追加", "btnDashed", openProcessPicker));

  if (reports.length) {
    const past = document.createElement("div");
    past.className = "pastReports";
    past.innerHTML = '<div class="sectionLabel">過去の報告</div>';
    reports.forEach((r) => {
      const n = all.filter((ph) => ph.reportId === r.id).length;
      const row = document.createElement("button");
      row.className = "pastReportRow";
      const kindLabel = r.kind === "external" ? "アプリ外で報告" : r.kind === "skip" ? `報告なし${r.memo ? "（" + esc(r.memo) + "）" : ""}` : "";
      row.innerHTML = `<span>${fmtDate(r.start)}〜${fmtDate(r.end)}</span><span class="mutedText">${kindLabel ? `<span class="kindTag">${kindLabel}</span>` : ""}${n ? n + "枚" : kindLabel ? "" : "写真削除済み"}</span>`;
      // アプリ外・報告なしで写真の無い記録は、押すと取り消せる
      row.addEventListener("click", () => (r.kind && !n ? cancelWeekOther(r) : openReportPast(r.id)));
      past.appendChild(row);
    });
    body.appendChild(past);
  }
  $("reportBar").hidden = false;
  $("sendCount").textContent = picks.length;
  const doneBtn = $("markReportedBtn");
  doneBtn.textContent = wk.state === "done" ? `✓ ${wk.isPrev ? "先週" : "今週"}は報告済み` : "報告済みにする";
  doneBtn.classList.toggle("doneState", wk.state === "done");
}

function openProcessPicker() {
  const site = currentSite();
  if (!site) return;
  const picked = new Set(site.processes);
  openSheet("今回の工程を選ぶ（複数可）", (body, close) => {
    PROCESSES.forEach((p) => {
      const g = groupOfProcess(p.id);
      if (g.cats[0] === p.id) {
        const label = document.createElement("div");
        label.className = "pickGroupLabel";
        label.textContent = g.name;
        body.appendChild(label);
      }
      const b = document.createElement("button");
      b.className = "pickItem" + (picked.has(p.id) ? " picked" : "");
      b.innerHTML = `<span><span class="processNo">${p.no}</span>${esc(p.name)}</span><span class="pickMark">${picked.has(p.id) ? icon(ICONS.check, 20) : ""}</span>`;
      b.addEventListener("click", () => {
        if (picked.has(p.id)) picked.delete(p.id);
        else picked.add(p.id);
        b.classList.toggle("picked", picked.has(p.id));
        b.querySelector(".pickMark").innerHTML = picked.has(p.id) ? icon(ICONS.check, 20) : "";
      });
      body.appendChild(b);
    });
    body.appendChild(
      sheetButton("決定", "btnPrimary btnLarge", async () => {
        site.processes = PROCESSES.filter((p) => picked.has(p.id)).map((p) => p.id);
        await dbPut("sites", site);
        close();
        renderReport();
      })
    );
  });
}

async function removeProcess(pid, count) {
  const p = processOf(pid);
  const msg = count
    ? `「${p.name}」を今回の工程から外しますか？\n撮影済みの${count}枚は消えず、写真が残っている間は一覧に表示されます。`
    : `「${p.name}」を今回の工程から外しますか？`;
  if (!confirm(msg)) return;
  const site = currentSite();
  site.processes = site.processes.filter((id) => id !== pid);
  await dbPut("sites", site);
  renderReport();
}

/* ---------- 報告：工程のページ ---------- */

// 工程マニュアルの「この工程の報告写真」や、報告タブの工程から開く
async function openReportProc(pid) {
  const site = await refreshSites();
  if (!site) {
    toast("先に「今の現場」を登録してください");
    openSiteSwitcher();
    return;
  }
  reportProcId = pid;
  if (!site.processes.includes(pid)) {
    site.processes = PROCESSES.filter((p) => p.id === pid || site.processes.includes(p.id)).map((p) => p.id);
    await dbPut("sites", site);
  }
  await renderReportProc();
  showView("reportProcView");
}

async function renderReportProc() {
  releaseUrls("reportProc");
  const site = currentSite();
  if (!site || !reportProcId) return;
  const p = processOf(reportProcId);
  const g = groupOfProcess(reportProcId);
  $("reportProcTitle").textContent = `${shortProcessName(p)}の報告`;
  const all = await getSitePhotos(site.id);
  const cands = unreported(all);
  const list = cands.filter((ph) => ph.processId === reportProcId).sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1));
  $("reportProcPeriodBar").className = "periodBar withArt";
  $("reportProcPeriodBar").innerHTML = reportWeekHtml(reportWeek(site, await dbGetAll("reports", "siteId", site.id)));
  $("reportProcCard").innerHTML =
    `<span class="procHeroArt">${groupArt(g, 44)}</span>` +
    `<span class="procHeroText"><span class="procHeroName">${esc(p.name)}<span class="kindLabel report">報告写真</span></span>` +
    `<span class="procHeroSub">${esc(g.name)}・${esc(g.sub)}</span></span>`;
  $("reportProcGuide").innerHTML =
    `<div class="memoHead">${icon(ICONS.camSmall, 22)}撮影メモ</div>` +
    `<ul class="memoList">${reportGuideList(p).map((x) => `<li>${icon(ICONS.check, 16, 2.6)}<span>${esc(x)}</span></li>`).join("")}</ul>` +
    `<div class="memoNote">${icon(ICONS.alert, 22)}<span>${esc(reportNote)}</span></div>`;
  const grid = $("reportProcGrid");
  grid.innerHTML = "";
  const picked = new Set(list.filter((ph) => ph.sendPick).map((ph) => ph.id));
  const updateCounts = () => {
    $("reportProcCount").innerHTML = `選択数 <b>${picked.size}</b>/${list.length}`;
    $("procBarCount").textContent = picked.size;
    const thumbs = $("procBarThumbs");
    thumbs.innerHTML = "";
    (urlBuckets.procBar || []).forEach((u) => URL.revokeObjectURL(u));
    urlBuckets.procBar = [];
    list
      .filter((ph) => picked.has(ph.id))
      .slice(0, 3)
      .forEach((ph) => {
        const im = document.createElement("img");
        im.src = blobUrl("procBar", ph.thumb);
        thumbs.appendChild(im);
      });
  };
  list.forEach((ph) =>
    grid.appendChild(
      photoCard(ph, {
        bucket: "reportProc",
        selected: picked,
        compact: true,
        actions: (x) => photoActions(x, renderReportProc),
        onTap: async (x, cell) => {
          x.sendPick = !x.sendPick;
          if (x.sendPick) picked.add(x.id);
          else picked.delete(x.id);
          cell.classList.toggle("selected", x.sendPick);
          updateCounts();
          await dbPut("photos", x);
        },
      })
    )
  );
  updateCounts();
  $("reportProcEmpty").hidden = list.length > 0;
  const setPick = async (id, on) => {
    const x = list.find((p) => p.id === id);
    if (!x || !!x.sendPick === on) return;
    x.sendPick = on;
    if (on) picked.add(id);
    else picked.delete(id);
    const card = grid.querySelector(`[data-id="${id}"]`);
    if (card) card.classList.toggle("selected", on);
    updateCounts();
    await dbPut("photos", x);
  };
  attachDragSelect(grid, (id) => picked.has(id), setPick);
  const allBtn = $("reportProcAllBtn");
  allBtn.hidden = !list.length;
  allBtn.textContent = list.length && picked.size === list.length ? "全部外す" : "全部選ぶ";
  allBtn.onclick = async () => {
    const on = picked.size !== list.length;
    for (const ph of list) await setPick(ph.id, on);
    allBtn.textContent = on ? "全部外す" : "全部選ぶ";
  };
}

/* ---------- 報告：過去の報告 ---------- */

async function openReportPast(id) {
  reportPastId = id;
  await renderReportPast();
  showView("reportPastView");
}

async function renderReportPast() {
  releaseUrls("reportPast");
  const site = currentSite();
  const r = await dbGet("reports", reportPastId);
  if (!site || !r) return goReport();
  $("reportPastTitle").textContent = `${fmtDate(r.start)}〜${fmtDate(r.end)}の報告`;
  const list = (await getSitePhotos(site.id)).filter((p) => p.reportId === r.id).sort((a, b) => processOf(a.processId).no - processOf(b.processId).no);
  pastPhotos = list;
  const grid = $("reportPastGrid");
  grid.innerHTML = "";
  list.forEach((ph) =>
    grid.appendChild(
      photoCell(ph, {
        bucket: "reportPast",
        showKind: true,
        actions: (x) => photoActions(x, renderReportPast),
        onTap: (x) => openPhotoViewer(x.blob, photoActions(x, renderReportPast)),
      })
    )
  );
  $("reportPastEmpty").hidden = list.length > 0;
  $("pastShareBtn").hidden = !list.length;
  $("deleteReportPhotosBtn").hidden = !list.length;
  const latestRep = (await dbGetAll("reports", "siteId", site.id)).filter((x) => !x.kind).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  $("undoReportBtn").hidden = !list.length || !!r.kind || !latestRep || latestRep.id !== r.id;
}

async function deleteReportPhotos() {
  const site = currentSite();
  const list = (await getSitePhotos(site.id)).filter((p) => p.reportId === reportPastId);
  if (!list.length) return;
  const reportPhotos = list.filter((p) => !isRecordPhoto(p));
  const quality = list.filter(isRecordPhoto);
  const msg =
    `この報告の報告写真${reportPhotos.length}枚を削除します。必要な写真は先に「保存」で書き出してください。` +
    (quality.length ? `\n（報告に使った品質写真${quality.length}枚は、マニュアルの記録として残します）` : "") +
    "\n削除しますか？";
  if (!confirm(msg)) return;
  await dbDeleteMany("photos", reportPhotos.map((p) => p.id));
  quality.forEach((p) => {
    p.reportId = null;
    p.forReport = false;
    p.sendPick = false;
  });
  if (quality.length) await dbPutMany("photos", quality);
  toast("写真を削除しました");
  goReport();
}

/* ---------- Boxへ送信 ---------- */
// 走行距離アプリと同じく、共有シート→メール→Boxのアップロード用アドレス宛てに送る。
// 写真と一緒に「何の写真か」をまとめたJSONを添付し、後でAIとの対話の材料にする

const MAIL_WARN_BYTES = 15 * 1024 * 1024;

// 期間中に付けたチェックをまとめる（報告メールづくりと、後の品質管理の材料）
async function buildCheckSummary(siteId, start, end) {
  if (!manualMeta) return [];
  // 日付で区切ると、報告を送った日の後から付けたチェック・メモがどの報告にも入らなくなるので、
  // 前回「報告済み」にした時刻より後のものを入れる（まだ報告していない現場は期間の初日から）
  const since = (await dbGetAll("reports", "siteId", siteId))
    .map((r) => r.createdAt)
    .filter(Boolean)
    .sort()
    .pop();
  const inPeriod = (iso) => {
    if (!iso) return false;
    return since ? iso > since : toDateKey(new Date(iso)) >= start;
  };
  const recs = await dbGetAll("checks", "siteId", siteId);
  const recordPhotos = (await getSitePhotos(siteId)).filter(isRecordPhoto);
  const out = [];
  for (const rec of recs) {
    const it = manualMeta.items.find((x) => x.id === rec.itemId);
    if (!it) continue;
    const checked = Object.entries(rec.marks || {})
      .filter(([, m]) => inPeriod(m.at))
      .map(([key, m]) => {
        const [section] = key.split("|");
        const def = checkDefOf(it, key);
        return {
          id: def && def.id ? def.id : "",
          section: section === "prep" ? "事前準備" : "チェック",
          text: def ? def.text : key.split("|").slice(1).join("|"),
          at: m.at,
          by: m.by || "",
          photo_required: !!(def && def.photo === "要"),
          record_photo: recordPhotos.some((p) => p.itemId === it.id && p.checkKey === key),
        };
      })
      .sort((a, b) => (a.at < b.at ? -1 : 1));
    const na = rec.na && inPeriod(rec.naAt);
    const notes = (rec.notes || [])
      .filter((n) => inPeriod(n.at) || inPeriod(n.updatedAt))
      .map((n) => ({
        id: n.id,
        type: noteLabel(n),
        type_id: n.type,
        status: n.type === "question" ? n.status || "open" : n.type === "contact" ? (n.contact && n.contact.pending ? "waiting" : "resolved") : "",
        contact: n.type === "contact" && n.contact ? { who: n.contact.who, side: n.contact.side, via: n.contact.via, result: n.contact.result || "", pending: !!n.contact.pending, in_line: !!n.contact.inLine, photo_ids: n.contact.photoIds || [], resolved_at: n.contact.resolvedAt || "" } : null,
        resolved_at: n.resolvedAt || "",
        resolved_by: n.resolvedBy || "",
        updated_at: n.updatedAt || n.at,
        text: n.text,
        at: n.at,
        by: n.by || "",
        replies_mine: (n.replies || []).filter((r) => r.mine).map((r) => ({ id: r.id, text: r.text, at: r.at })),
      }));
    const naChecks = Object.entries(rec.naChecks || {})
      .filter(([, v]) => !v.off && inPeriod(v.at))
      .map(([key, v]) => {
        const def = checkDefOf(it, key);
        return { id: def && def.id ? def.id : "", text: def ? def.text : key.split("|").slice(1).join("|"), at: v.at, by: v.by || "" };
      });
    const live = ((it.text && it.text.checks) || []).filter((c) => !isNaCheck(rec, checkKey("checks", c)));
    const total = live.length;
    // この期間にチェックが全部そろった（最後のチェック・該当なしがこの期間）
    let completedAt = "";
    if (!rec.na && total && live.every((c) => rec.marks && rec.marks[checkKey("checks", c)])) {
      const last = [...live.map((c) => rec.marks[checkKey("checks", c)].at), ...naChecks.map((x) => x.at)].sort().pop();
      if (inPeriod(last)) completedAt = last;
    }
    if (!checked.length && !na && !notes.length && !naChecks.length) continue;
    out.push({
      item_id: it.id,
      item_no: it.no,
      item: it.name,
      process: processOf(it.cat).name,
      checks_total: total,
      checks_done: live.filter((c) => rec.marks && rec.marks[checkKey("checks", c)]).length,
      checks_na: ((it.text && it.text.checks) || []).length - total,
      not_applicable: !!rec.na,
      completed_at: completedAt,
      na_checks: naChecks,
      checked,
      notes,
    });
  }
  return out.sort((a, b) => allManualItems().findIndex((x) => x.name === a.item) - allManualItems().findIndex((x) => x.name === b.item));
}

function shareSelected() {
  if (!reportCache.site) return;
  sharePhotos(reportCache.site, sendPicks(reportCache.all));
}

async function sendToBox() {
  const site = currentSite();
  if (!site) return;
  const all = await getSitePhotos(site.id);
  const cands = unreported(all);
  const picks = sendPicks(all);
  if (!picks.length) {
    toast("工程のページで、送る写真をタップして選んでください");
    return;
  }
  const email = getBoxEmail();
  if (!email) {
    alert("設定で、Boxのアップロード用メールアドレスを登録してください。");
    return;
  }
  const entries = photoFiles(site, picks);
  if (!entries.length) {
    toast("送る写真が片付け済みのため、送れる写真がありません");
    return;
  }
  const allReports = await dbGetAll("reports", "siteId", site.id);
  const wk = tagWeek(site, allReports);
  const pStart = periodStart(site, cands);
  const start = pStart < wk.mon ? pStart : wk.mon;
  // 期間の終わり：対象の週の土曜と、送る写真のいちばん新しい日のうち遅い方（今日より先にはしない）
  const latestPick = picks.map((p) => p.dateKey).sort().pop();
  let end = [wk.sat, latestPick].sort().pop();
  if (end > todayKey()) end = todayKey();
  // iPhone は「送信する」を押した直後でないと共有画面を開かせないので、読み込みや保存はここで先に済ませる
  if (!site.draftReportId) {
    site.draftReportId = newId(); // 同じ期間を送り直しても同じ番号（見守りで二重に数えない）
    await dbPut("sites", site);
  }
  const otherWeeks = allReports.filter((r) => r.kind && r.week >= addDays(todayKey(), -70)).map((r) => ({ week: r.week, kind: r.kind, memo: r.memo || "", at: r.createdAt }));
  const procIds = new Set(cands.map((p) => p.processId));
  site.processes.forEach((id) => procIds.add(id));
  const processes = [...procIds]
    .map(processOf)
    .sort((a, b) => a.no - b.no)
    .map((p) => ({
      no: p.no,
      name: p.name,
      taken_count: cands.filter((ph) => ph.processId === p.id).length,
      selected_count: entries.filter((e) => e.photo.processId === p.id).length,
    }));
  const photoBytes = entries.reduce((s, e) => s + e.file.size, 0);
  const checkSummary = await buildCheckSummary(site.id, start, end);
  const checkCount = checkSummary.reduce((n, x) => n + x.checked.length, 0);
  // 6工程の進み具合（送信時点の累計。管理者側で現場ごとの進捗を出すため）
  if (site.id !== currentSiteId) await setCurrentSite(site.id);
  await loadSiteChecks();
  const progress = GROUPS.map((g, i) => {
    const pr = groupProgress(g, siteCheckRecs, siteRecordPhotos);
    return { group: g.name, checks_done: pr.checksDone, checks_total: pr.checks, checks_na: pr.checksNa, photos_done: pr.photosDone, photos_total: pr.photos, before_start: i < (site.startGroup || 0) };
  });

  openSheet("Boxへ送信", (body, close) => {
    const box = document.createElement("div");
    box.className = "summaryBox";
    box.innerHTML =
      `現場：${esc(site.name)}<br>期間：${fmtDate(start)}〜${fmtDate(end)}<br>` +
      `工程：${esc(processes.map((p) => p.name).join(" / ") || "なし")}<br>` +
      `写真：${entries.length}枚（約${(photoBytes / 1024 / 1024).toFixed(1)}MB）<br>` +
      `チェック：${checkSummary.length}項目・${checkCount}件（期間中に付けたもの）`;
    body.appendChild(box);
    const thumbs = document.createElement("div");
    thumbs.className = "sendThumbs";
    releaseUrls("send");
    entries.forEach((e) => {
      const im = document.createElement("img");
      im.src = blobUrl("send", e.photo.thumb);
      im.alt = "";
      thumbs.appendChild(im);
    });
    body.appendChild(thumbs);
    if (photoBytes > MAIL_WARN_BYTES) {
      const warn = document.createElement("div");
      warn.className = "warnText";
      warn.textContent = "メールの容量上限を超えるおそれがあります。枚数を減らすか、2回に分けて送ってください。";
      body.appendChild(warn);
    }
    const label = document.createElement("label");
    label.className = "fieldLabel";
    label.textContent = "メモ（任意）：今週の様子・来週の予定・気づいたことなど";
    const memo = document.createElement("textarea");
    memo.className = "sheetTextarea";
    body.appendChild(label);
    body.appendChild(memo);
    const note = document.createElement("div");
    note.className = "mutedText";
    note.textContent = "「送信する」を押すと宛先アドレスをコピーして共有画面を開きます。メールを選び、宛先に貼り付けて送信してください。";
    body.appendChild(note);

    body.appendChild(
      sheetButton("送信する", "btnPrimary btnLarge", async () => {
        const payload = {
          kind: "genba-photo-report",
          report_id: site.draftReportId,
          schema: 6, // 2: checks、3: 番号と疑問の状態、4: progress・写真id・解決日時、5: kouji_no・members、6: start_group（記録を始めた工程）・progress[].before_start
          app_version: APP_VERSION,
          manual_version: manualMeta ? manualMeta.version : "",
          sent_at: new Date().toISOString(),
          sender: getSetting(USER_NAME_KEY),
          sender_id: deviceId(),
          site: site.name,
          site_id: site.id,
          kouji_no: site.koujiNo || "",
          start_group: GROUPS[site.startGroup || 0].name,
          paused: isPaused(site),
          other_weeks: otherWeeks,
          tasks_done: (site.tasks || []).filter((t) => t.doneAt).map((t) => ({ id: t.id, done_at: t.doneAt, text: t.text })),
          pauses: site.pauses || [],
          members: site.members || [],
          period: { start, end },
          processes,
          memo: memo.value.trim(),
          photos: entries.map((e) => ({
            id: e.photo.id,
            file: e.file.name,
            kind: isRecordPhoto(e.photo) ? "record" : "report",
            process_no: processOf(e.photo.processId).no,
            process: processOf(e.photo.processId).name,
            date: e.photo.dateKey,
            taken_at: e.photo.takenAt,
            item_id: e.photo.itemId || "",
            check_id: e.photo.checkKey && e.photo.checkKey.includes("|#") ? e.photo.checkKey.split("|#")[1] : "",
            check: isRecordPhoto(e.photo) && e.photo.checkKey ? checkTextOf(e.photo.itemId, e.photo.checkKey) : "",
          })),
          checks: checkSummary,
          progress,
        };
        const jsonName = safeFileName(`報告_${getSetting(USER_NAME_KEY) || "名前なし"}_${site.name}_${start}_${end}.json`); // Boxで一覧した時に誰の報告か分かるよう名前も入れる
        const jsonFile = new File([JSON.stringify(payload, null, 2)], jsonName, { type: "application/json" });
        const files = [jsonFile, ...entries.map((e) => e.file)];
        if (navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        if (!(navigator.canShare && navigator.canShare({ files }))) {
          alert("この端末では共有機能が使えないため送信できません。iPhoneのホーム画面から開いてください。");
          return;
        }
        try {
          await navigator.share({ files, title: jsonName });
        } catch (e) {
          return; // キャンセル時はシートを開いたまま
        }
        close();
        const memoText = memo.value.trim();
        if (confirm("メールを送れましたか？\n送れていたら「OK」で、送った写真を報告済みにします。")) markReported(memoText, { photoIds: picks.map((p) => p.id), start, end, week: wk.mon });
        else toast("報告済みにはしていません。送れたら「報告済みにする」を押してください");
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

/* ---------- アプリ外で報告した週・報告しない週 ----------
   写真を別の方法で送った週や、自分は担当しない週（もう一人が報告する等）を「済み」にして、未送信・遅れに出さない */
function markWeekOther(site, wk, kind, cands) {
  const photosLeft = cands.filter((p) => p.dateKey <= wk.sat);
  openSheet(kind === "external" ? "アプリ外で報告済みにする" : "今週は報告なしにする", (body, close) => {
    const note = document.createElement("div");
    note.className = "mutedText";
    note.textContent =
      kind === "external"
        ? `${fmtDate(wk.mon)}〜${fmtDate(wk.sat)}の報告を、アプリの外（別のメールなど）で済ませた週として記録します。`
        : `${fmtDate(wk.mon)}〜${fmtDate(wk.sat)}は、この現場の報告をしない週として記録します（遅れに数えません）。`;
    body.appendChild(note);
    let chk = null;
    if (kind === "external" && photosLeft.length) {
      const l = document.createElement("label");
      l.className = "checkOpt";
      l.innerHTML = `<input type="checkbox" checked> まだ報告していない写真${photosLeft.length}枚も報告済みにする`;
      chk = l.querySelector("input");
      body.appendChild(l);
    }
    const lab = document.createElement("label");
    lab.className = "fieldLabel";
    lab.textContent = kind === "external" ? "メモ（任意）：どう報告したか" : "理由（任意）：例「先輩が報告」「工事なし」";
    const memo = document.createElement("input");
    memo.className = "sheetInput";
    body.appendChild(lab);
    body.appendChild(memo);
    body.appendChild(
      sheetButton("記録する", "btnPrimary btnLarge", async () => {
        const report = { id: newId(), siteId: site.id, start: wk.mon, end: wk.sat, createdAt: new Date().toISOString(), memo: memo.value.trim(), week: wk.mon, kind };
        await dbPut("reports", report);
        if (chk && chk.checked) {
          photosLeft.forEach((p) => {
            p.reportId = report.id;
            p.sendPick = false;
          });
          await dbPutMany("photos", photosLeft);
          site.lastReportEnd = wk.sat < todayKey() ? wk.sat : todayKey();
        }
        delete site.draftReportId; // 前に送りかけた報告の番号を次の週に使い回さない
        delete site.redoWeek;
        site.processes = [];
        await dbPut("sites", site);
        close();
        toast(kind === "external" ? "アプリ外で報告済みにしました" : "今週は報告なしにしました");
        renderReport();
        notifyStatus(site, { status: "week", week: wk.mon, week_kind: kind, memo: report.memo }, kind === "external" ? "アプリ外で報告したことを上司に知らせる" : "今週は報告なしと上司に知らせる");
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

// 報告済みにした報告を取り消す（送り間違い・送り直したい時）。写真は「送る写真」に戻し、
// Boxへ送った時の報告番号を戻すので、直して送り直すと見守りでは新しい方に置き換わる
async function undoReport(r) {
  if (r.kind) return cancelWeekOther(r);
  const site0 = currentSite();
  const latest = site0 ? (await dbGetAll("reports", "siteId", site0.id)).filter((x) => !x.kind).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] : null;
  if (!latest || latest.id !== r.id) return alert("取り消して送り直せるのは、一番新しい報告だけです。");
  if (site0.draftReportId && r.sentReportId && site0.draftReportId !== r.sentReportId && !confirm("送信の途中（報告済みにしていない）の報告があります。それより前の報告を取り消して送り直しますか？")) return;
  const msg =
    `${fmtDate(r.start)}〜${fmtDate(r.end)}の報告を取り消して、写真を「送る写真」に戻しますか？\n` +
    `上司にはもう届いています。直して「Boxへ送信」で送り直すと、見守りでは新しい方に置き換わります。`;
  if (!confirm(msg)) return;
  const site = currentSite();
  if (!site) return;
  const photos = (await getSitePhotos(site.id)).filter((p) => p.reportId === r.id);
  photos.forEach((p) => {
    p.reportId = null;
    p.sendPick = true;
  });
  if (photos.length) await dbPutMany("photos", photos);
  await dbDeleteMany("reports", [r.id]);
  if (r.sentReportId) site.draftReportId = r.sentReportId;
  if (r.week) site.redoWeek = r.week; // 送り直す時に元の週の報告として扱う
  await dbPut("sites", site);
  toast(`報告を取り消しました（写真${photos.length}枚を「送る写真」に戻しました）`);
  goReport();
}
// 対象の週の報告（済みなら、その記録）
function weekReportOf(wk, reports) {
  const made = (r) => (r.createdAt ? toDateKey(new Date(r.createdAt)) : r.end);
  return (reports || []).filter((r) => r.week === wk.mon || (!r.week && made(r) >= addDays(wk.mon, 4) && made(r) <= addDays(wk.mon, 10))).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] || null;
}

async function cancelWeekOther(r) {
  if (!confirm(`${fmtDate(r.start)}〜${fmtDate(r.end)}の「${r.kind === "external" ? "アプリ外で報告" : "報告なし"}」を取り消しますか？`)) return;
  await dbDeleteMany("reports", [r.id]);
  const site = currentSite();
  if (site) {
    const photos = (await getSitePhotos(site.id)).filter((p) => p.reportId === r.id);
    photos.forEach((p) => (p.reportId = null));
    if (photos.length) await dbPutMany("photos", photos);
  }
  toast("取り消しました");
  renderReport();
}

// 「報告済みにする」ボタン：どう報告したかを3つから選ぶ（Boxへ送信した後の確認からは markReported に直接進む）
async function chooseReportedKind() {
  const site = currentSite();
  if (!site) return;
  // 対象の週がもう済んでいる時は、何で済んだかを見せて、間違えた時の取り消しだけを出す
  const allReps = await dbGetAll("reports", "siteId", site.id);
  const w = reportWeek(site, allReps);
  if (w.state === "done") {
    const r = weekReportOf(w, allReps);
    const extra = unreported(await getSitePhotos(site.id)).filter((p) => p.sendPick);
    return openSheet(`${w.isPrev ? "先週" : "今週"}は報告済みです`, (body, close) => {
      const box = document.createElement("div");
      box.className = "summaryBox";
      box.innerHTML =
        `${fmtDate(w.mon)}〜${fmtDate(w.sat)}の報告は済んでいます。` +
        (r ? `<br>${r.kind === "external" ? "アプリ外で報告" : r.kind === "skip" ? "報告なし" : "アプリから送信"}（${esc(fmtDateTime(r.createdAt))}）${r.memo ? "<br>" + esc(r.memo) : ""}` : "") +
        `<br><span class="mutedText">写真を撮り足して追加で送る時は、そのまま「Boxへ送信」から送れます。</span>`;
      body.appendChild(box);
      if (extra.length)
        body.appendChild(
          sheetButton(`追加で送った写真${extra.length}枚を報告済みにする`, "btnPrimary btnLarge", () => {
            close();
            markReported("");
          })
        );
      if (r)
        body.appendChild(
          sheetButton(r.kind ? "この記録を取り消す" : "この報告を取り消して送り直す", "btnOutline", () => {
            close();
            undoReport(r);
          })
        );
      body.appendChild(sheetButton("閉じる", "btnGhost", close));
    });
  }
  const cands = unreported(await getSitePhotos(site.id));
  const picks = cands.filter((p) => p.sendPick);
  const wk = tagWeek(site, await dbGetAll("reports", "siteId", site.id));
  openSheet(`報告済みにする（${fmtDate(wk.mon)}〜${fmtDate(wk.sat)}）`, (body, close) => {
    const opt = (title, sub, cls, fn, disabled) => {
      const b = document.createElement("button");
      b.className = "kindOpt " + cls;
      b.disabled = !!disabled;
      b.innerHTML = `<b>${title}</b><small>${sub}</small>`;
      b.addEventListener("click", () => {
        close();
        fn();
      });
      body.appendChild(b);
    };
    opt("アプリから送った", picks.length ? `Boxへ送信した報告。「送る写真」${picks.length}枚を報告済みにします` : "「送る写真」に選んだ写真がありません", "primary", () => markReported(""), !picks.length);
    opt("アプリ外で報告した", "別のメールなどで報告した週として記録します", "", () => markWeekOther(site, wk, "external", cands));
    opt("今週は報告なし", "自分は担当しない・工事が無かった週など。遅れに数えません", "", () => markWeekOther(site, wk, "skip", cands));
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

// 報告済みにする：「送る写真」に選んだ写真（Boxへ送った写真）だけを報告済みにする。選ばなかった写真は次の報告に残る。
// opts を渡さない時（「報告済みにする」→「アプリから送った」）は、今「送る写真」になっている写真を対象にする
async function markReported(memo = "", opts = null) {
  if (typeof memo !== "string") memo = "";
  const site = currentSite();
  if (!site) return;
  const all = await getSitePhotos(site.id);
  const reports = await dbGetAll("reports", "siteId", site.id);
  const ids = opts && opts.photoIds ? new Set(opts.photoIds) : null;
  const targets = ids ? all.filter((p) => ids.has(p.id) && !p.reportId) : sendPicks(all);
  if (!targets.length) {
    toast("「送る写真」に選んだ写真がありません");
    return;
  }
  const wk = opts && opts.week ? { mon: opts.week, sat: addDays(opts.week, 5) } : tagWeek(site, reports);
  const dates = targets.map((p) => p.dateKey).sort();
  const start = opts && opts.start ? opts.start : dates[0] < wk.mon ? dates[0] : wk.mon;
  let end = opts && opts.end ? opts.end : [wk.sat, dates[dates.length - 1]].sort().pop();
  if (end > todayKey()) end = todayKey();
  const report = { id: newId(), siteId: site.id, start, end, createdAt: new Date().toISOString(), memo, week: wk.mon, sentReportId: site.draftReportId || "" };
  targets.forEach((p) => {
    p.reportId = report.id;
    p.sendPick = false;
  });
  await dbPut("reports", report);
  await dbPutMany("photos", targets);
  site.lastReportEnd = end;
  delete site.draftReportId;
  delete site.redoWeek;
  site.processes = []; // 「今回の工程」は次の週に持ち越さない（未報告の写真がある工程は自動で出る）
  await dbPut("sites", site);
  toast(`報告済みにしました（${fmtDate(wk.mon)}〜${fmtDate(wk.sat)}の週・写真${targets.length}枚）`);
  goReport();
}

/* ---------- マニュアル ---------- */
// マニュアル本文は社内データなのでアプリには入れない。tools/build_manual.py が作る
// マニュアルパック(JSON: items=項目と17分類の対応, pages=ページ画像, guides=撮影ガイド)を
// 初回に取り込み、IndexedDB(meta / manualPages)に保存して使う

let manualMeta = null; // { key:"manual", version, title, builtAt, importedAt, items, guides }

const DEFAULT_REPORT_NOTE = "お客様に見せる写真です。ゴミ・工具・資材の散乱が写らないように";
let reportNote = DEFAULT_REPORT_NOTE;

async function loadManualMeta() {
  manualMeta = await dbGet("meta", "manual");
  searchIndex = null;
  const guides = (manualMeta && manualMeta.guides) || {};
  reportNote = guides._reportNote || DEFAULT_REPORT_NOTE;
  await migrateCheckKeys();
  PROCESSES.forEach((p) => {
    const g = guides[p.id];
    // 古いパックは文字列1つ、新しいパックは {record, report}
    p.guideRecord = typeof g === "string" ? g : (g && g.record) || "";
    p.guideReport = typeof g === "object" && g ? g.report || "" : ""; // 文字列、または2〜3項目の配列
  });
}

// 見出し用の短い工程名（「大工工事（建方・上棟）」→「建方・上棟」など）
function shortProcessName(p) {
  return p.name
    .replace(/^大工工事（(.+)）$/, "$1")
    .replace(/^屋根仕上げ工事（板金）$/, "屋根板金")
    .replace(/^仕上げ：/, "");
}

function reportGuideList(p) {
  const g = p.guideReport;
  if (Array.isArray(g)) return g.filter(Boolean);
  return [g || "進み具合が分かる全景"];
}

// 撮影メモ。報告写真（お客様向け）と品質写真（マニュアル用）で撮り方が違うので、色付きラベルで分けて出す
function guideHtml(p, opts = { report: true, record: true }) {
  const lines = [];
  if (opts.record && p.guideRecord) {
    lines.push(`<div class="guideLine"><span class="kindLabel record">品質</span><span>${esc(p.guideRecord)}</span></div>`);
    // 工程カードの「撮影」は報告写真。品質写真は工程マニュアルのチェック横のカメラから撮る
    if (opts.recordHint) lines.push(`<div class="guideHint">品質写真は「工程」タブのマニュアルで、写真要のチェック横のカメラから撮ります</div>`);
  }
  if (opts.report) {
    lines.push(`<div class="guideLine"><span class="kindLabel report">報告</span><span>${esc(reportGuideList(p).join("、"))}</span></div>`);
    lines.push(`<div class="guideNote">${esc(reportNote)}</div>`);
  }
  return lines.length ? `<div class="guideLines">${lines.join("")}</div>` : "";
}

// 大分類ごとの進み具合（今の現場のチェックと品質写真。該当なしにした項目は数えない）
function groupProgress(g, recs, recPhotos) {
  const out = { checks: 0, checksDone: 0, checksNa: 0, photos: 0, photosDone: 0 };
  if (!manualMeta || (!recs && !currentSiteId)) return out;
  recs = recs || siteCheckRecs;
  recPhotos = recPhotos || siteRecordPhotos;
  manualMeta.items
    .filter((it) => g.cats.includes(it.cat))
    .forEach((it) => {
      const rec = recs[it.id];
      if (rec && rec.na) return;
      ((it.text && it.text.checks) || []).forEach((c) => {
        const key = checkKey("checks", c);
        if (isNaCheck(rec, key)) return void out.checksNa++;
        out.checks++;
        if (rec && rec.marks[key]) out.checksDone++;
        if (c.photo === "要" && !photoSkipped(rec, key)) {
          out.photos++;
          if (recPhotos[`${it.id}|${key}`]) out.photosDone++;
        }
      });
    });
  return out;
}

// 6つの大分類カード（ホームと工程タブで共通）。withProgress なら今の現場の進み具合も出す
function renderGroupGrid(container, withProgress = false) {
  container.innerHTML = "";
  GROUPS.forEach((g) => {
    const b = document.createElement("button");
    b.className = "groupCard";
    const pr = withProgress ? groupProgress(g) : null;
    const pre = withProgress && GROUPS.indexOf(g) < ((currentSite() || {}).startGroup || 0);
    b.innerHTML =
      `<span class="groupArt">${groupArt(g)}</span>` +
      `<span class="groupName">${esc(g.name)}<span class="chev">${icon(ICONS.chevron, 18, 2.6)}</span></span>` +
      (pre
        ? `<span class="groupProg"><span class="preLabel">導入前</span></span>`
        : pr && pr.checks
        ? `<span class="groupProg">` +
          (pr.checksDone >= pr.checks ? `<span class="groupDone">${icon(ICONS.check, 12, 3.4)}完了</span>` : `<span>チェック <b>${pr.checksDone}</b>/${pr.checks}</span>`) +
          (pr.photos ? `<span><span class="kindLabel record">品質</span><b>${pr.photosDone}</b>/${pr.photos}</span>` : "") +
          `</span>`
        : "") +
      `<span class="groupSub">${esc(g.sub)}</span>`;
    b.addEventListener("click", () => openGroup(g.id));
    container.appendChild(b);
  });
}

function manualEmptyCard() {
  const card = document.createElement("div");
  card.className = "card emptyState";
  card.innerHTML =
    '<div class="emptyTitle">マニュアルを取り込みましょう</div>' +
    '<div class="emptyText">Boxにある「マニュアル_○○.json」を選ぶと、このiPhoneの中に保存されます（初回のみ）。写真・報告の機能はマニュアルがなくても使えます。</div>';
  card.appendChild(sheetButton("マニュアルを取り込む", "btnPrimary", () => $("manualInput").click()));
  return card;
}

async function renderManual() {
  const empty = $("manualEmpty");
  empty.innerHTML = "";
  if (!manualMeta) empty.appendChild(manualEmptyCard());
  await refreshSites();
  await loadSiteChecks();
  renderGroupGrid($("manualGroups"), !!currentSiteId);
  const reqBox = $("manualReq");
  reqBox.innerHTML = "";
  const site = currentSite();
  if (site && manualMeta) {
    const cov = await recordCoverage(site.id);
    const sm = await siteSummary(site);
    const b = document.createElement("button");
    b.className = "manualReqBtn";
    b.innerHTML =
      `<span class="mrIcon">${icon(ICONS.camera, 20)}</span><span class="mrText"><b>写真要の一覧</b><small>品質写真 ${cov.done}/${cov.total}${sm.missing.length ? `・<span class="em">撮り忘れ ${sm.missing.length}件</span>` : ""}</small></span>${icon(ICONS.chevron, 18)}`;
    b.addEventListener("click", () => openRequired("all"));
    reqBox.appendChild(b);
  }
}

let currentGroupId = "g1";
let groupItems = [];       // 表示中の大分類に含まれる項目（17分類の順→PDFの順）
let currentItemIdx = 0;
let currentMTab = "check";
let siteCheckRecs = {};    // itemId → チェック記録
let siteRecordPhotos = {}; // "項目ID|区分|チェック文" → 品質写真（最新の1枚）


function allManualItems() {
  if (!manualMeta) return [];
  return GROUPS.flatMap((g) => g.cats.flatMap((pid) => manualMeta.items.filter((it) => it.cat === pid)));
}

async function loadSiteChecks() {
  siteCheckRecs = {};
  siteRecordPhotos = {};
  if (!currentSiteId) return;
  (await dbGetAll("checks", "siteId", currentSiteId)).forEach((r) => (siteCheckRecs[r.itemId] = r));
  (await getSitePhotos(currentSiteId))
    .filter(isRecordPhoto)
    .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1))
    .forEach((p) => (siteRecordPhotos[`${p.itemId}|${p.checkKey}`] = p));
}

function checkRecOf(itemId) {
  return siteCheckRecs[itemId] || { key: `${currentSiteId}|${itemId}`, siteId: currentSiteId, itemId, na: false, marks: {} };
}

function itemProgress(it) {
  const rec = checkRecOf(it.id);
  const all = (it.text && it.text.checks) || [];
  const checks = all.filter((c) => !isNaCheck(rec, checkKey("checks", c)));
  const done = checks.filter((c) => rec.marks[checkKey("checks", c)]).length;
  // チェックを全部「なし」にした項目は、項目ごと該当なしと同じ扱い（完了とは分ける）
  return { done, total: checks.length, na: rec.na || (all.length > 0 && checks.length === 0) };
}
// チェックが全部済んだか（写真は別に数える）
function itemDone(it) {
  const pr = itemProgress(it);
  return !pr.na && pr.total > 0 && pr.done >= pr.total;
}
// 工程ページの「3/7」。全部済んだら「✓ 完了」
function checkProgHtml(it) {
  const pr = itemProgress(it);
  if (pr.na && !checkRecOf(it.id).na) return "すべて該当なし";
  return itemDone(it) ? `${icon(ICONS.check, 14, 3)}完了` : `${pr.done}/${pr.total}`;
}
// 事前準備の進み具合（工程の完了・進み具合には入れない）
function prepProgress(it) {
  const rec = checkRecOf(it.id);
  const prep = (it.text && it.text.prep) || [];
  return { done: prep.filter((c) => rec.marks[checkKey("prep", c)]).length, total: prep.length };
}
function prepDone(it) {
  const pr = prepProgress(it);
  return !!currentSiteId && !checkRecOf(it.id).na && pr.total > 0 && pr.done >= pr.total;
}
function setPrepProg(it) {
  const fin = prepDone(it);
  const prog = $("prepProgress");
  if (prog) {
    const pr = prepProgress(it);
    prog.innerHTML = fin ? `${icon(ICONS.check, 14, 3)}準備OK` : `${pr.done}/${pr.total}`;
    prog.classList.toggle("complete", fin);
  }
  const tab = document.querySelector('.itemTab[data-mtab="flow"]');
  if (tab) tab.innerHTML = "作業手順" + (fin ? `<span class="tabDone" aria-label="準備OK">${icon(ICONS.check, 10, 3.6)}</span>` : "");
}

function setCheckProg(it) {
  const prog = $("checkProgress");
  if (!prog) return;
  prog.innerHTML = checkProgHtml(it);
  prog.classList.toggle("complete", itemDone(it));
}
// チェックを付けて全部済んだ瞬間に知らせる
function toastIfCompleted(it, wasDone) {
  if (!wasDone && itemDone(it)) toast(`「${it.name}」のチェックが完了しました`);
}

// itemId を指定すると、その項目を開いた状態で表示する
async function openGroup(gid, itemId) {
  currentGroupId = gid;
  const g = groupOf(gid);
  const idx = GROUPS.indexOf(g);
  const stepper = $("groupStepper");
  stepper.innerHTML = "";
  await refreshSites();
  await loadSiteChecks();
  GROUPS.forEach((x, i) => {
    const b = document.createElement("button");
    const pr = groupProgress(x);
    const pre = i < ((currentSite() || {}).startGroup || 0);
    b.className = "step" + (pre || (pr.checks && pr.checksDone === pr.checks) ? " done" : "") + (i === idx ? " current" : "");
    b.innerHTML = `<span class="stepDot"></span><span>${esc(x.name)}</span>`;
    b.addEventListener("click", () => openGroup(x.id));
    stepper.appendChild(b);
  });
  $("groupTitle").textContent = g.name;
  $("groupDesc").textContent = g.desc;
  $("groupHeroArt").innerHTML = groupArt(g, 100);

  groupItems = manualMeta ? g.cats.flatMap((pid) => manualMeta.items.filter((it) => it.cat === pid)) : [];
  $("groupEmpty").innerHTML = "";
  if (!manualMeta) $("groupEmpty").appendChild(manualEmptyCard());
  $("groupView").classList.toggle("hasItems", groupItems.length > 0);
  $("itemTabs").hidden = !groupItems.length;
  $("itemDetail").hidden = !groupItems.length;
  const found = itemId ? groupItems.findIndex((it) => it.id === itemId) : -1;
  currentItemIdx = found >= 0 ? found : 0;
  renderItemStrip();
  showView("groupView");
  if (groupItems.length) await renderItem();
  else renderNavButtons();
}

function renderItemStrip(scrollToActive = true) {
  const strip = $("itemStrip");
  strip.innerHTML = "";
  let lastCat = "";
  groupItems.forEach((it, i) => {
    const g = groupOf(currentGroupId);
    if (g.cats.length > 1 && it.cat !== lastCat) {
      const label = document.createElement("span");
      label.className = "stripCat";
      label.textContent = processOf(it.cat).short;
      strip.appendChild(label);
    }
    lastCat = it.cat;
    const pr = itemProgress(it);
    const fin = itemDone(it);
    const b = document.createElement("button");
    b.className = "itemChip" + (i === currentItemIdx ? " active" : "") + (pr.na ? " na" : "") + (fin ? " done" : "");
    b.innerHTML =
      (it.no ? `<span class="itemChipNo">${esc(it.no)}</span>` : "") +
      `<span class="itemChipName">${esc(it.name)}</span>` +
      (fin ? `<span class="chipDone" aria-label="完了">${icon(ICONS.check, 12, 3.4)}</span>` : "");
    b.addEventListener("click", async () => {
      currentItemIdx = i;
      renderItemStrip();
      await renderItem();
    });
    strip.appendChild(b);
  });
  // 選んだ項目を横方向だけ中央へ寄せる（scrollIntoView は画面ごと縦にも動いてしまうので使わない）
  const active = strip.querySelector(".itemChip.active");
  if (active && scrollToActive) strip.scrollLeft = active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
}

function renderNavButtons() {
  const all = allManualItems();
  const cur = groupItems[currentItemIdx];
  const pos = cur ? all.findIndex((x) => x.id === cur.id) : -1;
  const prev = pos > 0 ? all[pos - 1] : null;
  const next = pos >= 0 && pos < all.length - 1 ? all[pos + 1] : null;
  const set = (btn, it, arrowLeft) => {
    btn.disabled = !it;
    btn.innerHTML = it
      ? arrowLeft
        ? `${icon(ICONS.back, 18)}<span>${esc(it.name)}</span>`
        : `<span>${esc(it.name)}</span>${icon(ICONS.chevron, 18)}`
      : arrowLeft
      ? "最初の項目"
      : "最後の項目";
    btn.onclick = it ? () => openItemAnywhere(it.id) : null;
  };
  set($("itemPrevBtn"), prev, true);
  set($("itemNextBtn"), next, false);
}

// 別の大分類の項目へも移動できる（前後の項目・開始条件/後工程から）
async function openItemAnywhere(itemId) {
  const it = manualMeta && manualMeta.items.find((x) => x.id === itemId);
  if (!it) return;
  const g = groupOfProcess(it.cat);
  if (g.id === currentGroupId) {
    currentItemIdx = groupItems.findIndex((x) => x.id === itemId);
    renderItemStrip();
    await renderItem();
    window.scrollTo(0, 0);
  } else {
    await openGroup(g.id, itemId);
  }
}

async function renderItem() {
  const it = groupItems[currentItemIdx];
  if (!it) return;
  pushRecent(it);
  renderNavButtons();
  document.querySelectorAll(".itemTab").forEach((t) => t.classList.toggle("active", t.dataset.mtab === currentMTab));
  releaseUrls("manual");
  const box = $("itemDetail");
  const tx = it.text || null;
  const rec = checkRecOf(it.id);
  const p = processOf(it.cat);
  let html =
    `<div class="itemHead">${it.no ? `<span class="itemHeadNo">${esc(it.no)}</span>` : ""}` +
    `<div class="itemHeadText"><div class="itemTitle">${esc(it.name)}</div><div class="itemCat">${esc(p.name)}</div></div>` +
    // この現場に無い項目を、開いてすぐ「なし」にできるよう、項目名の右に置く
    (currentSiteId && currentMTab === "check" && tx
      ? `<button class="naHeadBtn${rec.na ? " on" : ""}" data-na="1">${rec.na ? `${icon(ICONS.check, 14, 3)}該当なし` : "該当なし"}</button>`
      : "") +
    `</div>`;
  if (tx && tx.summary) html += `<div class="itemSummary">${esc(tx.summary)}</div>`;

  if (currentMTab === "check") {
    if (!tx) {
      html += `<div class="emptyNote">このマニュアルには文章データが入っていません。設定から最新版のマニュアルを取り込み直すと、ポイントやチェックポイントが表示されます。</div>`;
    } else {
      html +=
        `<div class="secHead">${icon(ICONS.checkSquare, 22)}チェックポイント<span class="secRight">` +
        (tx.checks.length ? `<span id="checkProgress"${itemDone(it) ? ' class="complete"' : ""}>${checkProgHtml(it)}</span>` : "") +
        `<button class="miniBtn" data-go="docs">原本を見る${icon(ICONS.chevron, 14)}</button></span></div>`;
      html += tx.checks.length
        ? `<div class="checkList">${tx.checks.map((c) => checkRowHtml("checks", c, rec, it)).join("")}</div>`
        : `<div class="emptyNote">チェック項目はまだ登録されていません。</div>`;
      if (!currentSiteId) html += `<div class="hint">上の「今の現場」から現場を登録すると、チェックを記録できます。</div>`;
      // 該当なしにしている時は、チェックが押せない理由が分かるよう、チェックのすぐ下に出す
      else if (rec.na) html += `<div class="naNote">この現場では「該当なし」にしています（チェック・写真は数えません）。戻す時は項目名の右の「該当なし」を押してください。</div>`;
      html += `<div id="memoSection" class="memoSection"></div>`;
      // 毎回は読まない情報は、見出しだけ出して開け閉めする（閉じたかどうかは次も覚えておく）
      if (tx.purpose.length || tx.goal.length) {
        html += `<details class="foldBox pointBox" data-fold="points"${foldOpen("points") ? " open" : ""}><summary class="pointTitle">${icon(ICONS.bulb, 20)}この項目のポイント<span class="foldMark">${icon(ICONS.chevron, 16)}</span></summary>`;
        if (tx.purpose.length) html += `<ul class="pointList">${tx.purpose.map(lineHtml).join("")}</ul>`;
        if (tx.goal.length) html += `<div class="pointSub">ゴール</div><ul class="pointList">${tx.goal.map(lineHtml).join("")}</ul>`;
        html += `</details>`;
      }
      html += `<details class="foldBox guideBoxDetail" data-fold="guide"${foldOpen("guide") ? " open" : ""}><summary class="foldTitle">${icon(ICONS.camSmall, 20)}撮影ガイド<span class="foldMark">${icon(ICONS.chevron, 16)}</span></summary>${guideHtml(p)}</details>`;
    }
    if (it.pages.length > 1) {
      html += `<div class="secHead">${icon(ICONS.photo, 22)}参考図・写真</div><div class="figStrip" id="figStrip"></div>`;
    }
    html += relatedSoonHtml();
  } else if (currentMTab === "flow") {
    if (!tx) {
      html += `<div class="emptyNote">最新版のマニュアルを取り込み直すと、作業の流れが表示されます。</div>`;
    } else {
      html += `<div class="secHead">${icon(ICONS.list, 22)}作業の流れ</div><div class="flowList">`;
      html += tx.before.map((f) => flowCardHtml("前の工程", f)).join("");
      if (tx.before.length) html += `<div class="flowArrow">▼</div>`;
      html += `<div class="flowCard current"><span class="flowLabel">この項目</span>${esc(it.name)}</div>`;
      if (tx.after.length) html += `<div class="flowArrow">▼</div>`;
      html += tx.after.map((f) => flowCardHtml("次の工程", f)).join("");
      html += `</div>`;
      if (tx.timing.length) {
        html += `<div class="secHead">${icon(ICONS.bell, 22)}タイミング</div><div class="timingRow">${tx.timing
          .map((x) => `<span>${esc(x)}</span>`)
          .join("")}</div>`;
      }
      html += `<div class="secHead">${icon(ICONS.checkSquare, 22)}事前準備${tx.prep.length && currentSiteId ? `<span class="secRight"><span id="prepProgress"></span></span>` : ""}</div>`;
      html += tx.prep.length
        ? `<div class="checkList">${tx.prep.map((c) => checkRowHtml("prep", c, rec, it)).join("")}</div>`
        : `<div class="emptyNote">事前準備はまだ登録されていません。</div>`;
    }
  } else {
    html += `<div class="secHead">${icon(ICONS.report, 22)}マニュアル原本<span class="secRight">ピンチで拡大</span></div><div class="docPages" id="docPages"></div>`;
    html += relatedSoonHtml();
  }
  box.innerHTML = html;

  box.querySelectorAll(".checkRow").forEach((row) => bindCheckRow(row, it));
  setPrepProg(it);
  box.querySelectorAll("details[data-fold]").forEach((d) => d.addEventListener("toggle", () => setFold(d.dataset.fold, d.open)));
  if ($("memoSection")) renderMemoSection(it);
  const na = box.querySelector("[data-na]");
  if (na) na.addEventListener("click", () => toggleNa(it));
  const toReport = box.querySelector("[data-toreport]");
  if (toReport) toReport.addEventListener("click", () => openReportProc(it.cat));
  const go = box.querySelector("[data-go]");
  if (go) go.addEventListener("click", () => switchMTab(go.dataset.go));
  box.querySelectorAll("[data-flow]").forEach((el) =>
    el.addEventListener("click", () => {
      const target = allManualItems().find((x) => x.no && x.no === el.dataset.flow);
      if (target) openItemAnywhere(target.id);
      else toast("この項目のマニュアルは見つかりませんでした");
    })
  );

  const figs = $("figStrip");
  if (figs) {
    for (const n of it.pages.slice(1)) {
      const rec2 = await dbGet("manualPages", n);
      if (!rec2) continue;
      const b = document.createElement("button");
      b.innerHTML = `<img src="${blobUrl("manual", rec2.blob)}" alt="${n}ページ">`;
      b.addEventListener("click", () => openLightbox(rec2.blob));
      figs.appendChild(b);
    }
  }
  const pages = $("docPages");
  if (pages) {
    for (const n of it.pages) {
      const rec2 = await dbGet("manualPages", n);
      if (!rec2) continue;
      const img = document.createElement("img");
      img.alt = `${it.name} ${n}ページ`;
      img.src = blobUrl("manual", rec2.blob);
      pages.appendChild(img);
    }
  }
}

// 開け閉めの状態（初めは開いている。閉じたら次も閉じたまま）
const FOLD_KEY = "genba-photo-fold";
function foldOpen(name) {
  try {
    return (JSON.parse(localStorage.getItem(FOLD_KEY) || "{}")[name] ?? true) !== false;
  } catch (e) {
    return true;
  }
}
function setFold(name, open) {
  try {
    const o = JSON.parse(localStorage.getItem(FOLD_KEY) || "{}");
    o[name] = open;
    localStorage.setItem(FOLD_KEY, JSON.stringify(o));
  } catch (e) {}
}

function lineHtml(x) {
  return `<li>${esc(x.text)}${x.added ? ` <span class="addedDate">（${esc(x.added)}追記）</span>` : ""}</li>`;
}

function checkRowHtml(sec, c, rec, it) {
  const key = checkKey(sec, c);
  const mark = rec.marks[key];
  const naC = isNaCheck(rec, key);
  const disabled = !currentSiteId || rec.na || naC;
  // 「写真要」のチェックには品質写真のカメラ。撮る前は灰色、撮ったら写真が出る
  let cam = "";
  if (naC) {
    cam = "";
  } else if (c.photo === "要" && !siteRecordPhotos[`${it.id}|${key}`] && photoSkipped(rec, key)) {
    cam = `<button class="checkCam skip" data-skip="1" aria-label="撮影不要を解除">撮影<br>不要</button>`;
  } else if (c.photo === "要") {
    const ph = siteRecordPhotos[`${it.id}|${key}`];
    cam = ph
      ? `<button class="checkCam has" data-cam="1" aria-label="品質写真を見る"><img src="${blobUrl("manual", ph.thumb)}" alt=""></button>`
      : `<button class="checkCam" data-cam="1" aria-label="品質写真を撮る"${disabled ? " disabled" : ""}>${icon(ICONS.camera, 22)}</button>`;
  }
  const meta = [
    c.photo === "要" ? `<span class="photoReq">${icon(ICONS.camera, 12)}写真要</span>` : "",
    c.added ? `<span class="addedDate">${esc(c.added)}追記</span>` : "",
    mark ? `<span class="checkBy">${esc(fmtDateTime(mark.at))}${mark.by ? " " + esc(mark.by) : ""}</span>` : "",
  ].join("");
  return (
    `<div class="checkRow${mark ? " on" : ""}${naC ? " naC" : ""}" data-key="${esc(key)}">` +
    `<button class="checkMain"${disabled ? " disabled" : ""}><span class="checkBox">${icon(ICONS.check, 16, 3)}</span>` +
    `<span class="checkText">${esc(c.text)}${naC ? `<span class="checkMeta"><span class="naCLabel">この現場では該当なし</span></span>` : meta ? `<span class="checkMeta">${meta}</span>` : ""}</span></button>` +
    // その現場に無いチェックを外すボタン（項目ごと無い時は、項目名の右の「該当なし」）
    (currentSiteId && !rec.na && sec === "checks" ? `<button class="naCheckBtn${naC ? " on" : ""}" data-nacheck="1" aria-label="${naC ? "該当なしを戻す" : "このチェックは該当なし"}">${naC ? "戻す" : "該当<br>なし"}</button>` : "") +
    cam +
    `</div>`
  );
}

// チェック記録・品質写真の鍵。マニュアルパック(schema 5〜)のチェックには固定番号 id があり "区分|#番号"、
// 古いパックは "区分|チェック文"。古い鍵は migrateCheckKeys で番号の鍵に置き換える
function checkKey(sec, c) {
  return c.id ? `${sec}|#${c.id}` : `${sec}|${c.text}`;
}

function checkDefOf(it, key) {
  const [sec, ...rest] = key.split("|");
  const text = rest.join("|");
  const list = (it.text && it.text[sec]) || [];
  return text.startsWith("#") ? list.find((c) => c.id === text.slice(1)) : list.find((c) => c.text === text);
}

// 鍵からチェック文を引く（マニュアルから消えたチェックは番号のまま）
function checkTextOf(itemId, key) {
  const it = manualMeta && manualMeta.items.find((x) => x.id === itemId);
  const def = it && checkDefOf(it, key);
  return def ? def.text : key.split("|").slice(1).join("|");
}

// 古い鍵（区分|チェック文）を番号の鍵へ。マニュアルを取り込んだ時・バックアップから戻した時に1回だけ走らせる
const KEY_MIGRATED_KEY = "genba-photo-checkkey-migrated";
async function migrateCheckKeys(force = false) {
  if (!manualMeta) return;
  const stamp = `${manualMeta.builtAt}|${manualMeta.importedAt}`;
  if (!force && localStorage.getItem(KEY_MIGRATED_KEY) === stamp) return;
  const map = {}; // itemId → { 古い鍵: 新しい鍵 }
  manualMeta.items.forEach((it) => {
    const m = {};
    ["checks", "prep"].forEach((sec) =>
      ((it.text && it.text[sec]) || []).forEach((c) => {
        if (c.id) m[`${sec}|${c.text}`] = checkKey(sec, c);
      })
    );
    map[it.id] = m;
  });
  const recs = (await dbGetAll("checks")).filter((r) => {
    const m = map[r.itemId];
    if (!m) return false;
    let changed = false;
    Object.keys(r.marks || {}).forEach((k) => {
      const nk = m[k];
      if (!nk) return;
      if (!r.marks[nk] || r.marks[nk].at < r.marks[k].at) r.marks[nk] = r.marks[k];
      delete r.marks[k];
      changed = true;
    });
    return changed;
  });
  if (recs.length) await dbPutMany("checks", recs);
  // 写真は数が多いので、全部を一度に読まずに1枚ずつ見て書き換える
  const db = await dbPromise;
  await new Promise((resolve, reject) => {
    const tx = db.transaction("photos", "readwrite");
    const req = tx.objectStore("photos").openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (!cur) return;
      const p = cur.value;
      const nk = p.checkKey && map[p.itemId] && map[p.itemId][p.checkKey];
      if (nk) {
        p.checkKey = nk;
        cur.update(p);
      }
      cur.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  try {
    localStorage.setItem(KEY_MIGRATED_KEY, stamp);
  } catch (e) {}
}

function bindCheckRow(row, it) {
  const key = row.dataset.key;
  row.querySelector(".checkMain").addEventListener("click", () => toggleMark(it, key));
  const cam = row.querySelector("[data-cam]");
  if (cam) cam.addEventListener("click", () => onCheckCamera(it, key));
  const naBtn = row.querySelector("[data-nacheck]");
  if (naBtn)
    naBtn.addEventListener("click", async () => {
      const wasDone = itemDone(it);
      await toggleNaCheck(it, key);
      renderItemStrip(false);
      refreshCheckRow(it, key);
      toastIfCompleted(it, wasDone);
    });
  const skip = row.querySelector("[data-skip]");
  if (skip)
    skip.addEventListener("click", async () => {
      if (!confirm("「撮影不要」を解除して、品質写真を撮るようにしますか？")) return;
      await toggleNoPhoto(it, key);
      refreshCheckRow(it, key);
    });
}

// 1行だけ描き直す（全体を描き直すと画面の位置がずれるため）
function refreshCheckRow(it, key) {
  const row = [...document.querySelectorAll("#itemDetail .checkRow")].find((r) => r.dataset.key === key);
  const def = checkDefOf(it, key);
  if (!row || !def) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = checkRowHtml(key.split("|")[0], def, checkRecOf(it.id), it);
  const fresh = tmp.firstElementChild;
  row.replaceWith(fresh);
  bindCheckRow(fresh, it);
  if (it.text) {
    setCheckProg(it);
    setPrepProg(it);
  }
}

// 品質写真のカメラ：未撮影なら撮る、撮影済みなら確認（撮り直し・削除）
function onCheckCamera(it, key) {
  if (!currentSiteId) {
    toast("上の「今の現場」から現場を登録すると、品質写真を撮れます");
    return;
  }
  const ph = siteRecordPhotos[`${it.id}|${key}`];
  if (!ph) {
    if (checkRecOf(it.id).na) return;
    openSheet("品質写真", (body, close) => {
      body.appendChild(
        sheetButton("撮影する", "btnPrimary btnLarge", () => {
          close();
          startRecordCamera(it, key);
        })
      );
      body.appendChild(
        sheetButton("写真から選ぶ（標準カメラで撮った写真）", "btnSecondary", () => {
          close();
          startRecordLibrary(it, key);
        })
      );
      body.appendChild(
        sheetButton("撮影不要（この現場では撮らない）", "btnSecondary", async () => {
          close();
          await toggleNoPhoto(it, key);
          refreshCheckRow(it, key);
          toast("この現場では撮影不要にしました（数から外れます）");
        })
      );
      body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
    });
    return;
  }
  openPhotoViewer(ph.blob, [
    { label: "撮り直す", cls: "btnPrimary", onClick: () => startRecordCamera(it, key) },
    { label: "写真から選ぶ", cls: "btnGhost", onClick: () => startRecordLibrary(it, key) },
    {
      label: "削除",
      cls: "btnDanger",
      onClick: async () => {
        if (!confirm("この品質写真を削除しますか？")) return false;
        await dbDeleteMany("photos", [ph.id]);
        delete siteRecordPhotos[`${it.id}|${key}`];
        refreshCheckRow(it, key);
        if (currentView === "requiredView") renderRequired(true);
        toast("品質写真を削除しました");
      },
    },
  ]);
}

async function saveRecordPhoto(file, takenAt = new Date()) {
  const t = recordTarget;
  recordTarget = null;
  try {
    const rec = await makePhotoRecord(file, t.siteId, shootProcessId, takenAt, { kind: "record", itemId: t.itemId, checkKey: t.checkKey });
    const mapKey = `${t.itemId}|${t.checkKey}`;
    const old = siteRecordPhotos[mapKey];
    if (old && !old.reportId) {
      rec.forReport = !!old.forReport;
      rec.sendPick = !!old.sendPick;
    }
    await dbPut("photos", rec);
    // 撮り直しは前の1枚と入れ替える（ただし報告済みの写真は過去の報告から欠けないよう残す）
    if (old && !old.reportId) await dbDeleteMany("photos", [old.id]);
    let autoChecked = false;
    const shown = groupItems[currentItemIdx];
    const wasDone = shown && shown.id === t.itemId ? itemDone(shown) : true;
    if (t.siteId === currentSiteId) {
      siteRecordPhotos[mapKey] = rec;
      const crec = checkRecOf(t.itemId);
      if (!crec.marks[t.checkKey]) {
        crec.marks[t.checkKey] = { at: new Date().toISOString(), by: getSetting(USER_NAME_KEY) };
        await saveCheckRec(crec);
        autoChecked = true;
      }
    }
    const it = groupItems[currentItemIdx];
    if (it && it.id === t.itemId) {
      renderItemStrip(false);
      refreshCheckRow(it, t.checkKey);
    }
    if (autoChecked && !wasDone && it && it.id === t.itemId && itemDone(it)) toast(`品質写真を保存しました。「${it.name}」のチェックが完了しました`);
    else toast(autoChecked ? "品質写真を保存し、チェックを付けました" : "品質写真を保存しました");
    if (currentView === "requiredView") renderRequired(true);
  } catch (e) {
    console.error(e);
    alert("写真を保存できませんでした。もう一度撮影してください。");
  }
}

function flowCardHtml(label, f) {
  return (
    `<button class="flowCard" data-flow="${esc(f.no)}"><span class="flowLabel">${label}</span>` +
    `${f.no ? esc(f.no) + " " : ""}${esc(f.name)}<span class="flowWho">${esc(f.who)}</span></button>`
  );
}

// 関連資料（施工要領書など）は今後マニュアルパックに入れる予定。中身ができるまでは出さない
const RELATED_DOCS_READY = false;
function relatedSoonHtml() {
  if (!RELATED_DOCS_READY) return "";
  return (
    `<div class="secHead">${icon(ICONS.report, 22)}関連資料<span class="secRight">準備中</span></div>` +
    `<div class="soonGrid"><div class="soonCard">${icon(ICONS.report, 22)}<span><b>施工要領書</b>準備中</span></div>` +
    `<div class="soonCard">${icon(ICONS.checkSquare, 22)}<span><b>安全作業ガイド</b>準備中</span></div></div>`
  );
}

async function switchMTab(tab) {
  currentMTab = tab;
  await renderItem();
  $("itemTabs").scrollIntoView({ block: "start", behavior: "smooth" });
}

async function saveCheckRec(rec) {
  rec.updatedAt = new Date().toISOString();
  siteCheckRecs[rec.itemId] = rec;
  await dbPut("checks", rec);
}

async function toggleMark(it, key) {
  if (!currentSiteId) return;
  const rec = checkRecOf(it.id);
  const wasDone = itemDone(it);
  if (rec.marks[key]) delete rec.marks[key];
  else rec.marks[key] = { at: new Date().toISOString(), by: getSetting(USER_NAME_KEY) };
  await saveCheckRec(rec);
  renderItemStrip(false);
  refreshCheckRow(it, key);
  toastIfCompleted(it, wasDone);
}

async function toggleNa(it) {
  const rec = checkRecOf(it.id);
  // 該当なしにする時は、付けていたチェックも外す（チェックが付いたまま灰色にならないように）
  const marked = Object.keys(rec.marks || {}).length;
  if (!rec.na && marked) {
    if (!confirm(`付けていたチェック ${marked}件も外れます。\nこの現場では「該当なし」にしますか？`)) return;
    rec.marks = {};
  }
  rec.na = !rec.na;
  rec.naAt = new Date().toISOString();
  rec.naBy = getSetting(USER_NAME_KEY);
  await saveCheckRec(rec);
  renderItemStrip(false);
  const y = window.scrollY;
  await renderItem();
  window.scrollTo(0, y);
}

/* ---------- 気づき・疑問メモ（原本の「気づき・職人さんからの要望」欄） ---------- */
// 1つの欄を書き換えるのではなく、書くたびに1件ずつ残す（いつ・誰が・何を感じたかを後で追えるように）。
// 「疑問」は将来、会議などで答える場につなげる想定
const NOTE_TYPES = [
  { id: "question", label: "疑問", hint: "上司に答えてほしい" },
  { id: "notice", label: "気づき", hint: "共有だけ" },
  { id: "request", label: "職人さんの要望", hint: "職人さんから" },
];
let memoType = null; // 選び間違い（疑問のつもりが気づき）を防ぐため、毎回選んでもらう
let memoMode = "memo"; // "memo"＝気づき・疑問メモ、"contact"＝電話・LINEのやりとり
let memoOpenFor = null; // 「メモを書く」を開いている項目

function renderMemoSection(it) {
  const sec = $("memoSection");
  if (!sec) return;
  if (memoMode === "contact" && contactDraft && $("cSaveBtn")) readContactForm(); // 書きかけを消さないように
  const rec = checkRecOf(it.id);
  const notes = (rec.notes || []).slice().sort((a, b) => (a.at < b.at ? 1 : -1));
  const me = getSetting(USER_NAME_KEY);
  sec.innerHTML =
    `<div class="secHead">${icon(ICONS.edit || ICONS.report, 22)}気づき・疑問メモ<span class="secRight">${notes.length ? notes.length + "件" : ""}</span></div>` +
    (currentSiteId && memoOpenFor !== it.id
      ? `<div class="memoOpenRow"><button id="memoOpenBtn" class="btn btnOutline memoOpenBtn">${icon(ICONS.plus, 18)}メモを書く</button>` +
        `<button id="contactOpenBtn" class="btn btnOutline memoOpenBtn">${icon(ICONS.reply, 18)}電話・LINEのやりとりを残す</button></div>`
      : currentSiteId && memoMode === "contact"
      ? contactFormHtml()
      : currentSiteId
      ? `<div class="noteTypeLabel">種類を選んでから書いてください</div>` +
        `<div class="noteTypes">${NOTE_TYPES.map((t) => `<button class="noteType${t.id === memoType ? " active" : ""}" data-type="${t.id}"><b>${t.label}</b><small>${t.hint}</small></button>`).join("")}</div>` +
        `<textarea id="memoInput" class="sheetTextarea memoInput" placeholder="現場で気づいたこと、疑問に思ったこと、職人さんからの要望など"></textarea>` +
        `<div class="memoBtns"><button id="memoCancelBtn" class="btn btnSecondary">やめる</button><button id="memoSaveBtn" class="btn btnPrimary memoSaveBtn" hidden>保存</button></div>`
      : `<div class="hint">上の「今の現場」から現場を登録すると、メモを残せます。</div>`) +
    `<div class="noteList">${notes
      .map(
        (n) =>
          `<div class="noteItem"><div class="noteHead"><span class="noteBadge ${n.type}">${esc(noteLabel(n))}</span>` +
          `<span class="noteMeta">${esc(fmtDateTime(n.at))}${n.by ? " " + esc(n.by) : ""}</span>` +
          (n.type === "question"
            ? `<button class="noteStatus${n.status === "resolved" ? " done" : (n.replies || []).some((r) => !r.mine) ? " replied" : ""}" data-status="${esc(n.id)}">${n.status === "resolved" ? "解決済み" : (n.replies || []).some((r) => !r.mine) ? "返信あり" : "回答待ち"}</button>`
            : "") +
          (!n.by || n.by === me ? `<button class="noteDel" data-del="${esc(n.id)}" aria-label="このメモを削除">${icon(ICONS.x, 16)}</button>` : "") +
          `</div>${n.type === "contact" ? contactBodyHtml(n) : `<div class="noteText">${esc(n.text)}</div>`}` +
          (n.replies || [])
            .map(
              (r) =>
                `<div class="noteReply${r.readAt ? "" : " unread"}${r.mine ? " mine" : ""}"><div class="noteReplyHead">${icon(ICONS.reply, 14)}<b>${esc(r.mine ? "自分" : r.from || "上司")}</b>` +
                `<span>${esc(fmtDateTime(r.at))}</span>${r.readAt ? "" : '<span class="newMark">新着</span>'}</div><div class="noteText">${esc(r.text)}</div></div>`
            )
            .join("") +
          // 書き足す：見出しに入れると狭くて折り返すので、メモの下に置く
          (n.type !== "notice" || (n.replies || []).length ? `<div class="noteFoot"><button class="noteMore" data-more="${esc(n.id)}">${icon(ICONS.reply, 14)}書き足す</button></div>` : "") +
          `</div>`
      )
      .join("")}</div>`;
  sec.querySelectorAll(".noteType").forEach((b) =>
    b.addEventListener("click", () => {
      memoType = b.dataset.type;
      sec.querySelectorAll(".noteType").forEach((x) => x.classList.toggle("active", x === b));
      sec.querySelector(".noteTypes").classList.remove("need");
    })
  );
  const openBtn = $("memoOpenBtn");
  if (openBtn)
    openBtn.addEventListener("click", () => {
      memoOpenFor = it.id;
      memoMode = "memo";
      memoType = null;
      renderMemoSection(it);
      $("memoInput").focus();
    });
  const cOpen = $("contactOpenBtn");
  if (cOpen)
    cOpen.addEventListener("click", () => {
      memoOpenFor = it.id;
      memoMode = "contact";
      contactDraft = newContactDraft();
      renderMemoSection(it);
      $("cWho").focus();
    });
  if (memoOpenFor === it.id && memoMode === "contact" && $("cSaveBtn")) bindContactForm(it);
  sec.querySelectorAll("[data-resolve]").forEach((b) => b.addEventListener("click", () => resolveContact(it, b.dataset.resolve)));
  sec.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", () => addNoteFollowup(it, b.dataset.more)));
  fillContactPhotos(sec);
  const cancel = $("memoCancelBtn");
  if (cancel)
    cancel.addEventListener("click", () => {
      const typed = memoMode === "contact" ? ($("cText").value.trim() || $("cResult").value.trim()) : $("memoInput").value.trim();
      if (typed && !confirm("書きかけを消しますか？")) return;
      memoOpenFor = null;
      contactDraft = null;
      renderMemoSection(it);
    });
  const save = $("memoSaveBtn");
  if (save) {
    save.addEventListener("click", () => saveMemo(it));
    $("memoInput").addEventListener("input", (e) => (save.hidden = !e.target.value.trim()));
  }
  sec.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deleteMemo(it, b.dataset.del)));
  sec.querySelectorAll("[data-status]").forEach((b) => b.addEventListener("click", () => toggleNoteStatus(it, b.dataset.status)));
  // 表示した返信は既読にする（「新着」の印は今回の表示までは残す）
  const unread = (rec.notes || []).flatMap((n) => (n.replies || []).filter((r) => !r.readAt));
  if (unread.length) {
    const now = new Date().toISOString();
    unread.forEach((r) => (r.readAt = now));
    saveCheckRec(rec);
  }
}

/* ---------- 電話・LINEのやりとりの記録（note.type = "contact"） ----------
   その場では電話やLINEで解決するので、ここは「後から見返せるように残す」場所。
   note.contact = { who, side: "社内"|"業者", via: "電話"|"LINE"|"その場", result, pending, inLine, photoIds, resolvedAt } */
const CONTACT_HISTORY_KEY = "genba-photo-contact-history";
const CONTACT_VIAS = ["電話", "LINE", "その場"];
function contactHistory() {
  try {
    return JSON.parse(localStorage.getItem(CONTACT_HISTORY_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function addContactHistory(who, side) {
  const list = [{ who, side }, ...contactHistory().filter((x) => x.who !== who)].slice(0, 20);
  try {
    localStorage.setItem(CONTACT_HISTORY_KEY, JSON.stringify(list));
  } catch (e) {}
}
let contactDraft = null;
function newContactDraft() {
  const last = contactHistory()[0];
  return { who: "", side: last ? last.side : "社内", via: "電話", text: "", result: "", pending: false, inLine: false, photoIds: [] };
}
function noteLabel(n) {
  if (n.type === "contact") return "やりとり";
  return (NOTE_TYPES.find((t) => t.id === n.type) || NOTE_TYPES[0]).label;
}
function contactFormHtml() {
  const d = contactDraft;
  const seg = (name, list, cur) => `<div class="cSeg">${list.map((v) => `<button type="button" class="${v === cur ? "on" : ""}" data-${name}="${esc(v)}">${esc(v)}</button>`).join("")}</div>`;
  const hist = contactHistory().slice(0, 8);
  return (
    `<div class="contactForm">` +
    `<div class="cLabel">相手</div>${seg("side", ["社内", "業者"], d.side)}` +
    `<input id="cWho" class="input" placeholder="${d.side === "業者" ? "会社名・担当者（例：〇〇建材 田中さん）" : "名前・役職（例：課長、山田さん）"}" value="${esc(d.who)}">` +
    (hist.length ? `<div class="cChips">${hist.map((h) => `<button type="button" class="cChip" data-who="${esc(h.who)}" data-whoside="${esc(h.side)}">${esc(h.who)}</button>`).join("")}</div>` : "") +
    `<div class="cLabel">方法</div>${seg("via", CONTACT_VIAS, d.via)}` +
    `<div class="cLabel">${d.side === "業者" ? "頼んだこと・聞いたこと" : "聞いたこと"}</div>` +
    `<textarea id="cText" class="sheetTextarea memoInput" placeholder="1行でOK（例：サッシ上部の防水テープの重ね方）。キーボードのマイクで話しても入れられます">${esc(d.text)}</textarea>` +
    `<div class="cLabel">${d.side === "業者" ? "結果・返事" : "答え"}</div>` +
    `<textarea id="cResult" class="sheetTextarea memoInput" placeholder="${d.side === "業者" ? "例：明日の午前中に納品と回答" : "例：上から下へ重ねる。写真の通りでOK"}"${d.pending ? " disabled" : ""}>${esc(d.result)}</textarea>` +
    `<label class="checkOpt"><input type="checkbox" id="cPending"${d.pending ? " checked" : ""}>返事待ち（ホームの「やること」に出します）</label>` +
    `<div class="cLabel">写真（任意）</div>` +
    `<label class="checkOpt"><input type="checkbox" id="cInLine"${d.inLine ? " checked" : ""}>写真はLINEにある（日付を手がかりにLINEで探せます）</label>` +
    `<button type="button" id="cPickPh" class="btn btnOutline">${icon(ICONS.photo || ICONS.camera, 18)}アプリの写真から選ぶ${d.photoIds.length ? `（${d.photoIds.length}枚）` : ""}</button>` +
    `<div class="memoBtns"><button id="memoCancelBtn" class="btn btnSecondary">やめる</button><button id="cSaveBtn" class="btn btnPrimary">残す</button></div>` +
    `</div>`
  );
}
function readContactForm() {
  const d = contactDraft;
  d.who = $("cWho").value.trim();
  d.text = $("cText").value.trim();
  d.result = $("cResult").value.trim();
  d.pending = $("cPending").checked;
  d.inLine = $("cInLine").checked;
}
function bindContactForm(it) {
  const sec = $("memoSection");
  const rerender = () => {
    readContactForm();
    renderMemoSection(it);
  };
  sec.querySelectorAll("[data-side]").forEach((b) => b.addEventListener("click", () => (readContactForm(), (contactDraft.side = b.dataset.side), renderMemoSection(it))));
  sec.querySelectorAll("[data-via]").forEach((b) => b.addEventListener("click", () => (readContactForm(), (contactDraft.via = b.dataset.via), renderMemoSection(it))));
  sec.querySelectorAll("[data-who]").forEach((b) =>
    b.addEventListener("click", () => {
      readContactForm();
      contactDraft.who = b.dataset.who;
      contactDraft.side = b.dataset.whoside || contactDraft.side;
      renderMemoSection(it);
    })
  );
  $("cPending").addEventListener("change", rerender);
  $("cPickPh").addEventListener("click", () => {
    readContactForm();
    pickAppPhotos(it);
  });
  $("cSaveBtn").addEventListener("click", () => saveContact(it));
}
// その現場のアプリの写真から選ぶ（コピーせず、写真の番号だけを持つ）
async function pickAppPhotos(it) {
  const photos = (await getSitePhotos(currentSiteId)).filter((p) => !p.imageRemoved).sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)).slice(0, 60);
  const picked = new Set(contactDraft.photoIds);
  releaseUrls("cpick");
  openSheet("アプリの写真から選ぶ", (body, close) => {
    if (!photos.length) {
      body.innerHTML = `<div class="mutedText">この現場の写真はまだありません。</div>`;
      body.appendChild(sheetButton("閉じる", "btnGhost", close));
      return;
    }
    const grid = document.createElement("div");
    grid.className = "cPickGrid";
    photos.forEach((p) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cPick" + (picked.has(p.id) ? " on" : "");
      b.innerHTML = `<img src="${blobUrl("cpick", p.thumb)}" alt=""><span class="cPickMark">${icon(ICONS.check, 14, 3)}</span>`;
      b.addEventListener("click", () => {
        if (picked.has(p.id)) picked.delete(p.id);
        else if (picked.size >= 4) return toast("写真は4枚までです");
        else picked.add(p.id);
        b.classList.toggle("on", picked.has(p.id));
      });
      grid.appendChild(b);
    });
    body.appendChild(grid);
    body.appendChild(
      sheetButton("これにする", "btnPrimary btnLarge", () => {
        contactDraft.photoIds = [...picked];
        close();
        renderMemoSection(it);
      })
    );
    body.appendChild(sheetButton("やめる", "btnGhost", close));
  });
}
async function saveContact(it) {
  readContactForm();
  const d = contactDraft;
  if (!d.text) {
    toast("聞いたこと・頼んだことを入れてください");
    return $("cText").focus();
  }
  if (!d.who) {
    toast("相手を入れてください");
    return $("cWho").focus();
  }
  const rec = checkRecOf(it.id);
  rec.notes = rec.notes || [];
  const now = new Date().toISOString();
  rec.notes.push({
    id: newId(),
    type: "contact",
    text: d.text,
    at: now,
    by: getSetting(USER_NAME_KEY),
    contact: { who: d.who, side: d.side, via: d.via, result: d.pending ? "" : d.result, pending: d.pending, inLine: d.inLine, photoIds: d.photoIds, resolvedAt: d.pending ? "" : now },
  });
  await saveCheckRec(rec);
  sendNoteToGas(it, rec.notes[rec.notes.length - 1]);
  addContactHistory(d.who, d.side);
  contactDraft = null;
  memoOpenFor = null;
  renderMemoSection(it);
  toast(d.pending ? "やりとりを残しました（返事待ちはホームの「やること」に出ます）" : "やりとりを残しました");
}
// 返事が来た時：結果を書いて「返事待ち」を外す
function resolveContact(it, id) {
  const rec = checkRecOf(it.id);
  const n = (rec.notes || []).find((x) => x.id === id);
  if (!n || !n.contact) return;
  openSheet("返事が来た", (body, close) => {
    const ta = document.createElement("textarea");
    ta.className = "sheetTextarea";
    ta.placeholder = "結果・返事（例：明日の午前中に納品）";
    body.appendChild(ta);
    body.appendChild(
      sheetButton("残す", "btnPrimary btnLarge", async () => {
        const rec = checkRecOf(it.id);
        const n = (rec.notes || []).find((x) => x.id === id);
        if (!n || !n.contact) return close();
        n.contact.result = ta.value.trim();
        n.contact.pending = false;
        n.contact.resolvedAt = new Date().toISOString();
        n.updatedAt = n.contact.resolvedAt;
        await saveCheckRec(rec);
        sendNoteToGas(it, n);
        close();
        renderMemoSection(it);
        toast("返事を残しました");
      })
    );
    body.appendChild(sheetButton("やめる", "btnGhost", close));
    setTimeout(() => ta.focus(), 300);
  });
}
function contactBodyHtml(n) {
  const c = n.contact || {};
  return (
    `<div class="cMeta">${esc(c.via || "")}・${esc(c.who || "")}${c.side === "業者" ? "（業者）" : ""}</div>` +
    `<div class="noteText">${esc(n.text)}</div>` +
    (c.pending
      ? `<div class="cWait"><span>返事待ち</span><button class="miniBtn" data-resolve="${esc(n.id)}">返事が来た</button></div>`
      : c.result
      ? `<div class="noteReply"><div class="noteReplyHead">${icon(ICONS.reply, 14)}<b>${esc(c.who || "")}</b>${c.resolvedAt ? `<span>${esc(fmtDateTime(c.resolvedAt))}</span>` : ""}</div><div class="noteText">${esc(c.result)}</div></div>`
      : "") +
    (c.inLine ? `<div class="cPhotoNote">${icon(ICONS.camera, 14)}写真はLINEにあり（${esc(fmtDate(toDateKey(new Date(n.at))))}）</div>` : "") +
    ((c.photoIds || []).length ? `<div class="cThumbs">${c.photoIds.map((pid) => `<img data-cph="${esc(pid)}" alt="">`).join("")}</div>` : "")
  );
}
// アプリの写真を指している時は、後から小さな写真を入れる
async function fillContactPhotos(sec) {
  const imgs = [...sec.querySelectorAll("[data-cph]")];
  if (!imgs.length) return;
  releaseUrls("cthumb");
  for (const img of imgs) {
    const p = await dbGet("photos", img.dataset.cph);
    if (!p) {
      img.replaceWith(Object.assign(document.createElement("span"), { className: "mutedText", textContent: "（写真は消されています）" }));
      continue;
    }
    img.src = blobUrl("cthumb", p.thumb);
    img.addEventListener("click", async () => {
      const full = await dbGet("photos", p.id);
      openPhotoViewer(full && full.blob);
    });
  }
}
// 返事待ちのやりとり（全現場）。ホームの「やること」に出す
function pendingContacts(sums) {
  return sums
    .flatMap((x) => Object.values(x.recs || {}).flatMap((r) => (r.notes || []).filter((n) => n.type === "contact" && n.contact && n.contact.pending).map((n) => ({ site: x.site, rec: r, n }))))
    .sort((a, b) => (a.n.at < b.n.at ? -1 : 1));
}

async function saveMemo(it) {
  const text = $("memoInput").value.trim();
  if (!text) {
    toast("メモの内容を入力してください");
    $("memoInput").focus();
    return;
  }
  if (!memoType) {
    toast("「疑問」「気づき」「職人さんの要望」のどれかを選んでください");
    const box = $("memoSection").querySelector(".noteTypes");
    box.classList.remove("need");
    void box.offsetWidth;
    box.classList.add("need");
    return;
  }
  const rec = checkRecOf(it.id);
  rec.notes = rec.notes || [];
  const note = { id: newId(), type: memoType, text, at: new Date().toISOString(), by: getSetting(USER_NAME_KEY) };
  if (memoType === "question") note.status = "open";
  rec.notes.push(note);
  await saveCheckRec(rec);
  sendNoteToGas(it, note);
  memoType = null;
  memoOpenFor = null;
  renderMemoSection(it);
  toast(note.type === "question" ? "疑問として残しました（報告で上司に届きます）" : "メモを残しました");
}

/* ---------- 打合せの宿題（現場ナビ 見守りの「班の打合せ」で上司が書いた genba-task） ----------
   返信と同じ「返信／自分の名前」フォルダに届き、返信と一緒に取り込む。現場ごとに site.tasks に置き、済んだら報告の tasks_done で上司に返す */
function normPersonName(s) {
  return String(s || "").normalize("NFKC").replace(/\s/g, "");
}
async function importTasks(tasks) {
  const all = await getSites();
  const me = normPersonName(getSetting(USER_NAME_KEY));
  const changed = new Set();
  let added = 0;
  tasks.forEach((x) => {
    const s =
      all.find((y) => y.id === x.site_id) ||
      all.find((y) => x.kouji_no && normKoujiNo(y.koujiNo) === normKoujiNo(x.kouji_no) && (!x.to || normPersonName(x.to) === me));
    if (!s) return;
    s.tasks = s.tasks || [];
    const v = { id: x.id, text: x.text || "", due: x.due || "", process_no: x.process_no || null, process: x.process || "", from: x.from || "", at: x.at || "", week: x.week || "", status: x.status || "open" };
    const cur = s.tasks.find((t) => t.id === x.id);
    if (cur) {
      if (cur.text !== v.text || cur.due !== v.due || cur.status !== v.status || cur.process_no !== v.process_no) {
        Object.assign(cur, v);
        changed.add(s);
      }
    } else if (v.status !== "cancelled") {
      s.tasks.push({ ...v, doneAt: null });
      changed.add(s);
      added++;
    }
  });
  for (const s of changed) await dbPut("sites", s);
  if (changed.size) await refreshSites();
  return added;
}
function openTasks(sites) {
  return sites
    .flatMap((s) => (s.tasks || []).filter((t) => t.status !== "cancelled" && !t.doneAt).map((t) => ({ s, t })))
    .sort((a, b) => ((a.t.due || "9999") < (b.t.due || "9999") ? -1 : (a.t.due || "9999") > (b.t.due || "9999") ? 1 : a.t.at < b.t.at ? -1 : 1));
}
function taskDueHtml(t) {
  if (!t.due) return "期限なし";
  return t.due < todayKey() ? `<span class="em">期限切れ</span>（${fmtDate(t.due)}まで）` : `${fmtDate(t.due)}まで`;
}
function openTaskSheet(site, t) {
  openSheet("打合せの宿題", (body, close) => {
    const box = document.createElement("div");
    box.className = "summaryBox";
    box.innerHTML =
      `<b>${esc(t.text)}</b><br>現場：${esc(site.name)}<br>期限：${taskDueHtml(t)}` +
      (t.process ? `<br>工程：${esc(t.process)}` : "") +
      `<br><span class="mutedText">${esc(t.from || "上司")}より（${t.week ? fmtDate(t.week) + "〜の週の打合せ" : ""}）</span>`;
    body.appendChild(box);
    body.appendChild(
      sheetButton(t.doneAt ? "まだにする" : "済にする", "btnPrimary btnLarge", async () => {
        t.doneAt = t.doneAt ? null : new Date().toISOString();
        await dbPut("sites", site);
        await refreshSites();
        close();
        rerenderCurrentView();
        if (!t.doneAt) return toast("宿題をまだに戻しました");
        toastAction("宿題を済にしました（次の報告で上司に届きます）", "元に戻す", async () => {
          t.doneAt = null;
          await dbPut("sites", site);
          await refreshSites();
          rerenderCurrentView();
          toast("宿題をまだに戻しました");
        });
      })
    );
    if (t.process_no) {
      const pid = `p${String(t.process_no).padStart(2, "0")}`;
      body.appendChild(
        sheetButton("この工程のマニュアルを開く", "btnOutline", async () => {
          close();
          if (site.id !== currentSiteId) await setCurrentSite(site.id);
          const it = allManualItems().find((x) => x.cat === pid);
          currentMTab = "check";
          showView("groupView");
          await openGroup(groupOfProcess(pid).id, it && it.id);
        })
      );
    }
    body.appendChild(sheetButton("閉じる", "btnGhost", close));
  });
}
function openTaskList(sites) {
  openSheet("打合せの宿題", (body, close) => {
    openTasks(sites).forEach(({ s, t }) => {
      const b = document.createElement("button");
      b.className = "dashRow";
      b.innerHTML = `<span class="dashIcon green">${icon(ICONS.checkSquare, 22)}</span><span class="dashRowText">${esc(t.text)}<small>${sites.length > 1 ? esc(s.name) + "・" : ""}${taskDueHtml(t)}</small></span><span class="chev">${icon(ICONS.chevron, 18)}</span>`;
      b.addEventListener("click", () => {
        close();
        setTimeout(() => openTaskSheet(s, t), 250);
      });
      body.appendChild(b);
    });
    body.appendChild(sheetButton("閉じる", "btnGhost", close));
  });
}

/* ---------- 上司とのやりとり（GAS の窓口。文字だけを、週の報告を待たずにすぐ届ける） ----------
   合言葉（人ごと）は設定で各自が入れる（コードには書かない）。送れなかった分は端末に貯めて、つながったら送る。
   届くもの：上司からの返信（reply）・打合せの宿題（task）。送るもの：疑問・やりとり（note）・書き足し（reply） */
const GAS_URL = "https://script.google.com/macros/s/AKfycbwaj8aDwI3wsIcq58YksGB9JImyknVyio7b24v3QKjCKO5yGKIXlJshIa39G2VLYhehPw/exec";
const GAS_TOKEN_KEY = "genba-photo-gas-token";
const GAS_CURSOR_KEY = "genba-photo-gas-cursor";
const GAS_OUTBOX_KEY = "genba-photo-gas-outbox";
function gasOn() {
  return !!getSetting(GAS_TOKEN_KEY);
}
async function gasCall(body) {
  // 電波が弱くて返ってこない時に止まったままにならないよう、25秒で打ち切る
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  let j;
  try {
    const res = await fetch(GAS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...body, token: getSetting(GAS_TOKEN_KEY) }), signal: ctl.signal });
    j = await res.json();
  } finally {
    clearTimeout(timer);
  }
  if (!j.ok) throw new Error(j.error || "error");
  return j;
}
function gasOutbox() {
  try {
    return JSON.parse(localStorage.getItem(GAS_OUTBOX_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function setGasOutbox(list) {
  try {
    localStorage.setItem(GAS_OUTBOX_KEY, JSON.stringify(list));
  } catch (e) {}
}
function enqueueGas(msg) {
  if (!gasOn()) return;
  // 同じメモを続けて直した時は、新しい方だけ送る
  setGasOutbox([...gasOutbox().filter((m) => !(m.kind === msg.kind && m.id === msg.id)), msg]);
  flushGas();
}
let gasFlushing = false;
async function flushGas() {
  if (!gasOn() || gasFlushing || (navigator.onLine === false)) return;
  const box = gasOutbox();
  if (!box.length) return;
  gasFlushing = true;
  try {
    for (let i = 0; i < box.length; i += 20) {
      const part = box.slice(i, i + 20);
      const j = await gasCall({ action: "postMany", msgs: part });
      const results = j.results || part.map((m) => ({ kind: m.kind, id: m.id, ok: true }));
      const key = (m) => m.kind + "|" + m.id;
      const okKeys = new Set(results.filter((r) => r.ok).map(key));
      const ngKeys = new Set(results.filter((r) => !r.ok).map(key));
      const sentVer = new Map(part.map((m) => [key(m), m.ver]));
      let dropped = 0;
      setGasOutbox(
        gasOutbox()
          .filter((m) => !(okKeys.has(key(m)) && sentVer.get(key(m)) === m.ver)) // 送った版が届いた（送信中に直した新しい版は残す）
          .map((m) => (ngKeys.has(key(m)) && sentVer.get(key(m)) === m.ver ? { ...m, tries: (m.tries || 0) + 1 } : m))
          .filter((m) => ((m.tries || 0) >= 5 ? (dropped++, false) : true))
      );
      if (dropped) toast(`送れないやりとりが${dropped}件ありました（中身が大きすぎる等）。上司に直接伝えてください`);
    }
  } catch (e) {
    console.warn("やりとりを送れませんでした（あとで送り直します）", e);
  } finally {
    gasFlushing = false;
  }
}
// 疑問・やりとりを上司に送る形
function notePayload(it, n, extra = {}) {
  const site = currentSite() || {};
  const c = n.contact;
  return {
    note_id: n.id,
    site_id: site.id || "",
    kouji_no: site.koujiNo || "",
    site: site.name || "",
    item_id: it.id,
    item_no: it.no || "",
    item: it.name,
    process: processOf(it.cat).name,
    type: noteLabel(n),
    type_id: n.type,
    status: n.type === "question" ? n.status || "open" : n.type === "contact" ? (c && c.pending ? "waiting" : "resolved") : "",
    resolved_at: n.resolvedAt || "",
    resolved_by: n.resolvedBy || "",
    text: n.text,
    at: n.at,
    by: n.by || getSetting(USER_NAME_KEY),
    sender: getSetting(USER_NAME_KEY),
    sender_id: deviceId(),
    updated_at: n.updatedAt || n.at,
    contact: n.type === "contact" && c ? { who: c.who, side: c.side, via: c.via, result: c.result || "", pending: !!c.pending, in_line: !!c.inLine, photo_ids: c.photoIds || [], resolved_at: c.resolvedAt || "" } : null,
    ...extra,
  };
}
function sendNoteToGas(it, n, extra) {
  enqueueGas({ kind: "note", id: n.id, thread: n.id, ver: new Date().toISOString(), payload: notePayload(it, n, extra) });
}
// 上司からの返信・宿題を受け取る
let gasSyncing = false;
async function syncGas(manual = false) {
  if (!gasOn() || gasSyncing) return;
  gasSyncing = true;
  const me = normPersonName(getSetting(USER_NAME_KEY));
  let replies = 0;
  let tasks = 0;
  try {
    await flushGas();
    for (let round = 0; round < 10; round++) {
      const since = Number(getSetting(GAS_CURSOR_KEY) || 0);
      const j = await gasCall({ action: "sync", since });
      if (j.reset) {
        setSetting(GAS_CURSOR_KEY, "0"); // 窓口のシートが作り直された時は最初から
        continue;
      }
      const msgs = j.messages || [];
      const fromOthers = msgs.filter((m) => normPersonName(m.from) !== me);
      // 返信：元の疑問（この端末にあるメモ）に付ける
      const reps = fromOthers.filter((m) => m.kind === "reply");
      if (reps.length) {
        // 今の現場の分は、画面が持っているメモに直接付ける（別のコピーに付けて、画面側の保存で上書きされないように）
        const recs = (await dbGetAll("checks")).map((r) => (r.siteId === currentSiteId && siteCheckRecs[r.itemId] ? siteCheckRecs[r.itemId] : r));
        const byNote = new Map();
        recs.forEach((r) => (r.notes || []).forEach((n) => byNote.set(n.id, { r, n })));
        const changed = new Set();
        reps.forEach((m) => {
          const hit = byNote.get(m.thread);
          if (!hit) return;
          hit.n.replies = hit.n.replies || [];
          if (hit.n.replies.some((y) => y.id === m.id)) return;
          hit.n.replies.push({ id: m.id, from: m.from, text: (m.payload && m.payload.text) || "", at: m.at, readAt: null });
          hit.n.replies.sort((p, q) => (p.at < q.at ? -1 : 1));
          changed.add(hit.r);
          replies++;
        });
        if (changed.size) await dbPutMany("checks", [...changed]);
      }
      // 宿題：返信の取り込みと同じ形
      const ts = fromOthers.filter((m) => m.kind === "task").map((m) => m.payload).filter((x) => x && x.id);
      if (ts.length) tasks += await importTasks(ts);
      setSetting(GAS_CURSOR_KEY, String(j.cursor || since));
      if (!j.more) break;
    }
    if (replies || tasks) {
      toast(`上司から${[replies ? `返信 ${replies}件` : "", tasks ? `宿題 ${tasks}件` : ""].filter(Boolean).join("・")}が届きました`);
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") || !$("sheet").hidden;
      if (!typing) {
        await loadSiteChecks();
        rerenderCurrentView();
      }
    } else if (manual) toast("新しい返信・宿題はありません");
    $("gasStatus") && ($("gasStatus").textContent = `最後に受け取った時刻：${fmtDateTime(new Date().toISOString())}`);
  } catch (e) {
    console.warn(e);
    if (manual) toast(e.message === "unauthorized" ? "合言葉が違うか、止められています" : "つながりませんでした（電波を確かめてください）");
  } finally {
    gasSyncing = false;
  }
}
// 疑問への書き足し（上司とのやりとりを続ける）
function addNoteFollowup(it, id) {
  const rec = checkRecOf(it.id);
  const n = (rec.notes || []).find((x) => x.id === id);
  if (!n) return;
  openSheet("書き足す", (body, close) => {
    const ta = document.createElement("textarea");
    ta.className = "sheetTextarea";
    ta.placeholder = "上司への返事・追加で聞きたいこと";
    body.appendChild(ta);
    if (!gasOn()) {
      const w = document.createElement("div");
      w.className = "mutedText";
      w.textContent = "設定の「上司とのやりとり」で合言葉を入れると、すぐ上司に届きます。入れていない時は、次の週の報告と一緒に届きます。";
      body.appendChild(w);
    }
    body.appendChild(
      sheetButton("書き足す", "btnPrimary btnLarge", async () => {
        const text = ta.value.trim();
        if (!text) return ta.focus();
        const rec = checkRecOf(it.id); // 開いている間に返信が届いていても消さないよう、今のメモを取り直す
        const n = (rec.notes || []).find((x) => x.id === id);
        if (!n) return close();
        const me = getSetting(USER_NAME_KEY);
        const r = { id: newId(), from: me, text, at: new Date().toISOString(), readAt: new Date().toISOString(), mine: true };
        n.replies = n.replies || [];
        n.replies.push(r);
        n.updatedAt = r.at;
        await saveCheckRec(rec);
        enqueueGas({ kind: "reply", id: r.id, thread: n.id, to: "上司", ver: r.at, payload: { note_id: n.id, text, from: me, from_role: "監督", at: r.at, site: (currentSite() || {}).name || "", item: it.name } });
        close();
        renderMemoSection(it);
        toast(gasOn() ? "書き足しました（上司に届きます）" : "書き足しました");
      })
    );
    body.appendChild(sheetButton("やめる", "btnGhost", close));
    setTimeout(() => ta.focus(), 300);
  });
}
function initGas() {
  const input = $("gasTokenInput");
  if (!input) return;
  input.value = getSetting(GAS_TOKEN_KEY);
  input.addEventListener("change", () => {
    setSetting(GAS_TOKEN_KEY, input.value.trim());
    setSetting(GAS_CURSOR_KEY, "0");
    toast(input.value.trim() ? "合言葉を保存しました" : "合言葉を消しました");
  });
  $("gasCheckBtn").addEventListener("click", async () => {
    setSetting(GAS_TOKEN_KEY, input.value.trim());
    if (!gasOn()) return toast("合言葉を入れてください");
    try {
      const j = await gasCall({ action: "whoami" });
      const app = getSetting(USER_NAME_KEY);
      $("gasStatus").textContent = `つながりました：${j.me.name}（${j.me.role}${j.me.team ? "・" + j.me.team : ""}）`;
      if (normPersonName(j.me.name) !== normPersonName(app)) alert(`合言葉の名前（${j.me.name}）と、このアプリの名前（${app || "未登録"}）が違います。返信が届かなくなるので、どちらかを合わせてください。`);
      syncGas();
    } catch (e) {
      $("gasStatus").textContent = e.message === "unauthorized" ? "合言葉が違うか、止められています" : "つながりませんでした";
    }
  });
  $("gasSyncBtn").addEventListener("click", () => syncGas(true));
  // 開いた時・画面に戻った時・3分ごと（開いている間）に受け取る。電波が戻ったら送り直す
  setTimeout(() => syncGas(), 2500);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && syncGas());
  setInterval(() => document.visibilityState === "visible" && syncGas(), 3 * 60 * 1000);
  window.addEventListener("online", () => flushGas());
}

/* ---------- 上司からの返信（現場ナビ 見守りが Box の「返信」フォルダに書き出す genba-reply JSON） ---------- */
// どのメモへの返信かは note_id で探す。ほかの監督あての返信も同じフォルダに入るので、この端末に無いメモへの返信は黙って飛ばす
async function onRepliesPicked() {
  const input = $("replyInput");
  const files = [...input.files];
  input.value = "";
  if (!files.length) return;
  const replies = [];
  const tasks = [];
  for (const f of files) {
    try {
      const j = JSON.parse(await f.text());
      (Array.isArray(j) ? j : [j]).forEach((x) => {
        if (x && x.kind === "genba-reply" && x.note_id) replies.push(x);
        else if (x && x.kind === "genba-task" && x.id) tasks.push(x);
      });
    } catch (e) {}
  }
  if (!replies.length && !tasks.length) {
    alert("返信・宿題のファイルが見つかりませんでした。Box の「返信」フォルダにある「返信_〜.json」「宿題_〜.json」を選んでください。");
    return;
  }
  const tasksAdded = tasks.length ? await importTasks(tasks) : 0;
  const recs = await dbGetAll("checks");
  const byNote = new Map();
  recs.forEach((r) => (r.notes || []).forEach((n) => byNote.set(n.id, { r, n })));
  const changed = new Set();
  let added = 0;
  let already = 0;
  replies.forEach((x) => {
    const hit = byNote.get(x.note_id);
    if (!hit) return;
    hit.n.replies = hit.n.replies || [];
    if (hit.n.replies.some((y) => y.id === x.id)) {
      already++;
      return;
    }
    hit.n.replies.push({ id: x.id, from: x.from || "", text: x.text || "", at: x.at || new Date().toISOString(), readAt: null });
    hit.n.replies.sort((p, q) => (p.at < q.at ? -1 : 1));
    changed.add(hit.r);
    added++;
  });
  if (changed.size) await dbPutMany("checks", [...changed]);
  await loadSiteChecks();
  const got = [added ? `返信 ${added}件` : "", tasksAdded ? `宿題 ${tasksAdded}件` : ""].filter(Boolean).join("・");
  if (got) toast(`上司からの${got}を取り込みました`);
  else if (already || tasks.length) toast("新しい返信・宿題はありませんでした（取り込み済みです）");
  else toast("この端末のメモへの返信はありませんでした");
  rerenderCurrentView();
}

// まだ読んでいない返信（全現場）。ホームに出す
async function unreadReplies() {
  const out = [];
  const active = new Set((await getSites()).filter((x) => !x.archived).map((x) => x.id));
  (await dbGetAll("checks")).filter((r) => active.has(r.siteId)).forEach((r) =>
    (r.notes || []).forEach((n) => (n.replies || []).forEach((x) => !x.readAt && out.push({ rec: r, note: n, reply: x })))
  );
  return out.sort((p, q) => (p.reply.at < q.reply.at ? 1 : -1));
}

// 返信の付いたメモの項目を開く（別の現場のメモなら、その現場に切り替える）
async function openReplyItem(rec) {
  if (rec.siteId !== currentSiteId) await setCurrentSite(rec.siteId);
  const it = manualMeta && manualMeta.items.find((x) => x.id === rec.itemId);
  if (!it) {
    toast("この項目はマニュアルに見つかりませんでした");
    return;
  }
  currentMTab = "check";
  await openGroup(groupOfProcess(it.cat).id, it.id);
  const sec = $("memoSection");
  if (sec) sec.scrollIntoView({ block: "start" });
}

// 疑問の状態（回答待ち ⇔ 解決済み）。いつ・誰が解決にしたかも残す
async function toggleNoteStatus(it, id) {
  const rec = checkRecOf(it.id);
  const n = (rec.notes || []).find((x) => x.id === id);
  if (!n) return;
  if (n.status === "resolved") {
    n.status = "open";
    delete n.resolvedAt;
    delete n.resolvedBy;
  } else {
    if (!confirm("この疑問を「解決済み」にしますか？")) return;
    n.status = "resolved";
    n.resolvedAt = new Date().toISOString();
    n.resolvedBy = getSetting(USER_NAME_KEY);
  }
  n.updatedAt = new Date().toISOString();
  await saveCheckRec(rec);
  sendNoteToGas(it, n);
  renderMemoSection(it);
}

async function deleteMemo(it, id) {
  if (!confirm("このメモを削除しますか？")) return;
  const rec = checkRecOf(it.id);
  const gone = (rec.notes || []).find((n) => n.id === id);
  if (gone) sendNoteToGas(it, gone, { deleted: true });
  rec.notes = (rec.notes || []).filter((n) => n.id !== id);
  await saveCheckRec(rec);
  renderMemoSection(it);
}

// 右上のカメラ：今開いている項目の工程（17分類）の報告写真のページへ
function shootFromGroup() {
  const it = groupItems[currentItemIdx];
  openReportProc(it ? it.cat : groupOf(currentGroupId).cats[0]);
}

/* ---------- 工程の検索 ---------- */
// 初心者が現場で聞いた工程名からでもマニュアルに辿り着けるよう、項目名だけでなく
// 概要・ポイント・チェック項目の文章からも探す。ひらがな/カタカナ・全角/半角は区別しない。
// 言い換え（建て方＝上棟 など）はマニュアルパックの synonyms で足していく

let searchIndex = null;

function normText(s) {
  return String(s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
    .replace(/[\s・、。,.（）()「」『』【】\-－ー〜~]/g, "");
}

function buildSearchIndex() {
  if (!manualMeta) return [];
  return allManualItems().map((it) => {
    const tx = it.text || {};
    const p = processOf(it.cat);
    const g = groupOfProcess(it.cat);
    const fields = [
      { label: "", raw: it.name, w: 10 },
      { label: "", raw: `${p.name} ${g.name}`, w: 3 },
      { label: "概要", raw: tx.summary || "", w: 3 },
      ...(tx.purpose || []).concat(tx.goal || []).map((x) => ({ label: "ポイント", raw: x.text, w: 2 })),
      ...(tx.checks || []).map((x) => ({ label: "チェック", raw: x.text, w: 2 })),
      ...(tx.prep || []).map((x) => ({ label: "事前準備", raw: x.text, w: 1 })),
    ].filter((f) => f.raw);
    fields.forEach((f) => (f.n = normText(f.raw)));
    return { it, g, fields, no: normText(it.no) };
  });
}

// 入力語＋言い換え辞書で同じ組にある語（部分一致で置き換えたものも含む）
function expandTerm(term) {
  const n = normText(term);
  const out = new Set([n]);
  ((manualMeta && manualMeta.synonyms) || []).forEach((group) => {
    const words = group.map(normText).filter(Boolean);
    words.forEach((w) => {
      if (n.includes(w)) words.forEach((other) => out.add(n.replace(w, other)));
    });
  });
  return [...out].filter(Boolean);
}

function searchManual(query) {
  if (!searchIndex) searchIndex = buildSearchIndex();
  const terms = query.split(/[\s　]+/).filter(Boolean).map(expandTerm).filter((v) => v.length);
  if (!terms.length) return [];
  const results = [];
  searchIndex.forEach((entry, order) => {
    let score = 0;
    let hit = null;
    for (const variants of terms) {
      let best = 0;
      if (variants.some((v) => entry.no && entry.no === v)) best = 12;
      for (const f of entry.fields) {
        const v = variants.find((x) => f.n.includes(x));
        if (!v) continue;
        let w = f.w;
        if (v !== variants[0]) w *= 0.7; // 言い換えで当たったものは、入力した言葉そのままより下に出す
        else if (f.w === 10 && f.n.startsWith(v)) w += 4;
        if (w > best) best = w;
        if (!hit && f.label) hit = { f, v };
      }
      if (!best) return; // すべての語に当てはまる項目だけ出す
      score += best;
    }
    results.push({ entry, score, hit, order });
  });
  return results.sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 50);
}

// 正規化した文字で当たった箇所を、元の文字列の上で強調する
function highlight(raw, v) {
  const chars = [...raw];
  const map = [];
  let norm = "";
  chars.forEach((c, i) => {
    const n = normText(c);
    for (const x of n) {
      norm += x;
      map.push(i);
    }
  });
  const pos = norm.indexOf(v);
  if (pos < 0) return esc(raw);
  const start = map[pos];
  const end = map[pos + v.length - 1] + 1;
  return esc(chars.slice(0, start).join("")) + "<mark>" + esc(chars.slice(start, end).join("")) + "</mark>" + esc(chars.slice(end).join(""));
}

function renderSearch() {
  const q = $("searchInput").value.trim();
  const box = $("searchResults");
  box.innerHTML = "";
  $("searchHint").hidden = !!q;
  if (!manualMeta) {
    box.appendChild(manualEmptyCard());
    return;
  }
  if (!q) return;
  const results = searchManual(q);
  const count = document.createElement("div");
  count.className = "searchCount";
  count.textContent = results.length ? `${results.length}件見つかりました` : "見つかりませんでした。別の言葉や、短い言葉で試してください。";
  box.appendChild(count);
  results.forEach(({ entry, hit }) => {
    const { it, g } = entry;
    const b = document.createElement("button");
    b.className = "searchItem";
    b.innerHTML =
      `<span class="itemChipNo">${esc(it.no || "・")}</span>` +
      `<span class="searchText"><span class="searchName">${esc(it.name)}</span>` +
      `<span class="searchMeta"><span class="pill pillWood">${esc(g.name)}</span>${esc(processOf(it.cat).name)}</span>` +
      (hit ? `<span class="searchSnippet">${esc(hit.f.label)}：${highlight(hit.f.raw, hit.v)}</span>` : "") +
      `</span><span class="chev">${icon(ICONS.chevron, 18)}</span>`;
    b.addEventListener("click", () => {
      $("searchInput").blur();
      openGroup(g.id, it.id);
    });
    box.appendChild(b);
  });
}

// iPhoneでキーボードを出すため、タップの処理の中で同期的にフォーカスする
function openSearch() {
  openSubView("searchView");
  const input = $("searchInput");
  input.focus();
  renderSearch();
}

/* ---------- 最近見た項目（ホームの「次に見る項目」の「続きから」） ---------- */

const RECENT_KEY = "genba-photo-recent";

function getRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function pushRecent(item) {
  const list = getRecent().filter((r) => r.id !== item.id);
  list.unshift({ id: item.id, at: new Date().toISOString() });
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 3)));
  } catch (e) {
    /* ignore */
  }
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

async function onManualPicked() {
  const input = $("manualInput");
  const file = input.files[0];
  input.value = "";
  if (!file) return;
  setProcessing(true, "マニュアルを読み込み中...");
  try {
    const pack = JSON.parse(await file.text());
    if (!pack || pack.kind !== "genba-manual-pack" || !Array.isArray(pack.items) || !pack.pages) {
      throw new Error("not a manual pack");
    }
    const pageNos = Object.keys(pack.pages);
    const records = [];
    for (let i = 0; i < pageNos.length; i++) {
      if (i % 10 === 0) setProcessing(true, `マニュアルを取り込み中... ${i} / ${pageNos.length}ページ`);
      const blob = await (await fetch(pack.pages[pageNos[i]])).blob();
      records.push({ page: Number(pageNos[i]), blob });
    }
    await dbClear("manualPages");
    for (let i = 0; i < records.length; i += 20) await dbPutMany("manualPages", records.slice(i, i + 20));
    await dbPut("meta", {
      key: "manual",
      version: pack.version || "",
      title: pack.title || "マニュアル",
      builtAt: pack.built_at || "",
      importedAt: new Date().toISOString(),
      items: pack.items,
      guides: pack.guides || {},
      synonyms: pack.synonyms || [],
      branding: pack.branding || null,
      schema: pack.schema || 1,
    });
    await loadManualMeta();
    toast(`マニュアル（${manualMeta.version}版）を取り込みました`);
    if (tourIdx >= 0 && TOUR_STEPS[tourIdx] && TOUR_STEPS[tourIdx].target() === $("manualCard")) {
      tourIdx++;
      setTimeout(renderTourStep, 60);
    }
    if (!$("settingsView").hidden) renderSettings();
    else if (currentView === "groupView") openGroup(currentGroupId);
    else goManual();
  } catch (e) {
    console.error(e);
    alert("マニュアルを取り込めませんでした。Boxの「マニュアル_○○.json」を選んでいるか確認してください。");
  } finally {
    setProcessing(false);
  }
}

async function deleteManual() {
  if (!confirm("このiPhoneからマニュアルを削除しますか？（写真・報告のデータは消えません）")) return;
  await dbClear("manualPages");
  await dbDeleteMany("meta", ["manual"]);
  await loadManualMeta();
  toast("マニュアルを削除しました");
  renderSettings();
}

/* ---------- 設定 ---------- */

const USER_NAME_KEY = "genba-photo-user-name";
const BOX_EMAIL_KEY = "genba-photo-box-email";

function getSetting(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch (e) {
    return "";
  }
}
function setSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* ignore */
  }
}

// この端末の番号（同じ名前の人がいても、管理者側で送り手を区別できるように）
const DEVICE_ID_KEY = "genba-photo-device-id";
function deviceId() {
  let v = getSetting(DEVICE_ID_KEY);
  if (!v) {
    v = newId();
    setSetting(DEVICE_ID_KEY, v);
  }
  return v;
}

function getBoxEmail() {
  return BOX_UPLOAD_EMAIL || getSetting(BOX_EMAIL_KEY);
}

async function copyBoxEmail() {
  const email = getBoxEmail();
  if (!email) {
    toast("先にBoxのアップロード用アドレスを入力してください");
    return;
  }
  try {
    await navigator.clipboard.writeText(email);
    toast("アドレスをコピーしました");
  } catch (e) {
    toast("コピーできませんでした");
  }
}

async function renderSettings() {
  renderBrand();
  const bk = getBackupOpts();
  $("bkSites").checked = bk.sites;
  $("bkChecks").checked = bk.checks;
  $("bkPhotos").checked = bk.photos;
  updateBackupNote();
  $("tourAlwaysChk").checked = getSetting(TOUR_ALWAYS_KEY) === "1";
  $("userNameInput").value = getSetting(USER_NAME_KEY);
  $("boxEmailInput").value = getBoxEmail();
  $("boxEmailInput").readOnly = !!BOX_UPLOAD_EMAIL;
  $("versionInfo").textContent = `バージョン ${APP_VERSION}`;
  $("manualInfo").textContent = manualMeta
    ? `${manualMeta.title}（${manualMeta.version}版・${manualMeta.items.length}項目）
取り込み日：${fmtDate(toDateKey(new Date(manualMeta.importedAt)))}`
    : "まだ取り込まれていません";
  $("deleteManualBtn").hidden = !manualMeta;
  $("importManualBtn").textContent = manualMeta ? "新しい版を取り込む" : "マニュアルを取り込む";
  const info = $("storageInfo");
  const photos = await dbGetAll("photos");
  const sites = await getSites();
  const pages = await dbGetAll("manualPages");
  const mb = (n) => (n / 1048576).toFixed(n < 10485760 ? 1 : 0);
  const bySite = {};
  photos.forEach((p) => {
    const s = (bySite[p.siteId] = bySite[p.siteId] || { n: 0, bytes: 0 });
    s.n++;
    s.bytes += (p.blob ? p.blob.size : 0) + (p.thumb ? p.thumb.size : 0);
  });
  const photoBytes = Object.values(bySite).reduce((t, s) => t + s.bytes, 0);
  const manualBytes = pages.reduce((t, p) => t + (p.blob ? p.blob.size : 0), 0);
  let html = `<div class="stoRow total"><span>写真 ${photos.length}枚</span><b>${mb(photoBytes)}MB</b></div>`;
  sites
    .filter((x) => bySite[x.id])
    .sort((a, b) => bySite[b.id].bytes - bySite[a.id].bytes)
    .forEach((x) => {
      html += `<div class="stoRow"><span>${esc(x.name)}${x.archived ? '<span class="badge badgeMuted">完工</span>' : ""}　${bySite[x.id].n}枚</span><b>${mb(bySite[x.id].bytes)}MB</b></div>`;
    });
  html += `<div class="stoRow total"><span>マニュアル（${pages.length}ページ）</span><b>${mb(manualBytes)}MB</b></div>`;
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    html += `<div class="stoRow total"><span>アプリ全体（見積もり）</span><b>${mb(est.usage || 0)}MB</b></div>`;
  }
  if (navigator.storage && navigator.storage.persisted && (await navigator.storage.persisted())) html += `<div class="hint">自動削除の対象外になっています</div>`;
  html += `<div class="hint">写真1枚は約0.3〜0.4MB（撮った写真を縮めて保存しています）。</div>`;
  info.innerHTML = html;
}

/* ---------- 会社ロゴ ---------- */
// ロゴは社内データなのでアプリ本体には持たず、マニュアルパックの branding から表示する

function brandLogoHtml(b) {
  return (
    `<div class="brandLogo">` +
    (b.mark ? `<img class="mark" src="${esc(b.mark)}" alt="">` : "") +
    (b.wordmark ? `<img class="wordmark" src="${esc(b.wordmark)}" alt="${esc(b.company || "")}">` : esc(b.company || "")) +
    `</div>`
  );
}

function renderBrand() {
  const b = manualMeta && manualMeta.branding;
  const footer = $("brandFooter");
  const about = $("aboutBrand");
  footer.hidden = about.hidden = !b;
  if (!b) return;
  footer.innerHTML = `<span>提供</span>${brandLogoHtml(b)}`;
  about.innerHTML = brandLogoHtml(b);
}

/* ---------- ホーム ---------- */
// ホームの役割：担当現場を全部見渡して、今どこまで進んでいて、次に何をすればいいかが3秒で分かること。
// 6工程の一覧は工程タブ、写真は写真タブ、報告は報告タブ。ホームは「現在地」と「やること」だけを出す

// チェックポイントを1つでも付けたか（事前準備は除く）
function checksStarted(rec) {
  return !!rec && Object.keys(rec.marks || {}).some((k) => k.startsWith("checks|"));
}

// 1つの現場の様子（6工程の進み具合・今の工程・撮り忘れ・報告日・未読の返信）
async function siteSummary(site) {
  const recs = Object.fromEntries((await dbGetAll("checks", "siteId", site.id)).map((r) => [r.itemId, r]));
  const photos = await getSitePhotos(site.id);
  const recPhotos = {};
  photos
    .filter(isRecordPhoto)
    .sort((a, b) => (a.takenAt < b.takenAt ? -1 : 1))
    .forEach((p) => (recPhotos[`${p.itemId}|${p.checkKey}`] = p));
  const start = site.startGroup || 0; // 記録を始めた工程。これより前は「導入前」
  const groups = GROUPS.map((g, i) => Object.assign(groupProgress(g, recs, recPhotos), { pre: i < start }));
  let cur = start;
  groups.forEach((x, i) => {
    if (x.checksDone > 0 && i > cur) cur = i;
  });
  const total = groups.filter((x) => !x.pre).reduce((t, x) => ({ c: t.c + x.checks, d: t.d + x.checksDone }), { c: 0, d: 0 });
  const preCats = new Set(GROUPS.slice(0, start).flatMap((g) => g.cats));
  // 撮り忘れ：チェックポイントを始めた項目の「写真要」で、品質写真がまだ無いもの（事前準備のチェックは着手前なので数えない）
  const missing = [];
  if (manualMeta)
    allManualItems().forEach((it) => {
      const rec = recs[it.id];
      if (preCats.has(it.cat) || !rec || rec.na || !checksStarted(rec)) return;
      ((it.text && it.text.checks) || []).forEach((c) => {
        const k = checkKey("checks", c);
        if (c.photo === "要" && !recPhotos[`${it.id}|${k}`] && !photoSkipped(rec, k) && !isNaCheck(rec, k)) missing.push(it);
      });
    });
  const week = reportWeek(site, await dbGetAll("reports", "siteId", site.id));
  const reportDue = week.state === "open" || week.state === "late";
  const overdue = week.missed > 0;
  const unread = Object.values(recs).reduce((n, r) => n + (r.notes || []).reduce((m, x) => m + (x.replies || []).filter((y) => !y.readAt).length, 0), 0);
  const cover = await getCover(site.id);
  return {
    cover, site, groups, cur, pct: total.c ? Math.round((total.d / total.c) * 100) : 0, missing, reportDue, overdue, week, unread, recs };
}

function siteThumbHtml(sm) {
  return sm.cover
    ? `<img src="${blobUrl("dash", sm.cover.thumb)}" alt="">`
    : `<img class="mockArt" src="${siteKindOf(sm.site).art}" alt="">`;
}

function siteMetaText(site) {
  const parts = [];
  if (site.koujiNo) parts.push("No." + esc(site.koujiNo));
  if ((site.members || []).length) parts.push("担当：" + esc(site.members.join("・")));
  return parts.length ? parts.join('<span class="sep">｜</span>') : `<span class="warnInline" data-editsite="${esc(site.id)}">工事番号・担当者を登録する ›</span>`;
}

// 6工程の現在地。済んだ工程は薄い緑、今の工程は濃い緑
function stepDots(sm, withLabels) {
  return (
    `<span class="dashSteps${withLabels ? " labels" : ""}">` +
    GROUPS.map((g, i) => {
      const x = sm.groups[i];
      const done = x.pre || (x.checks && x.checksDone >= x.checks);
      return `<span class="dashStep${i === sm.cur ? " cur" : done ? " done" : ""}${x.pre ? " pre" : ""}"><span class="dot"></span>${withLabels || i === sm.cur ? `<span class="lbl">${esc(g.name)}</span>` : ""}</span>`;
    }).join("") +
    `</span>`
  );
}

async function renderDash() {
  const gen = ++renderGen.dash;
  renderBrand();
  releaseUrls("dash");
  const current = await refreshSites();
  const sites = (await getSites()).filter((x) => !x.archived).sort((a, b) => isPaused(a) - isPaused(b));
  const box = $("dashSiteCard");
  $("dashSiteCount").textContent = sites.length ? `（${sites.length}件）` : "";
  const sums = await Promise.all(sites.map(siteSummary));
  const unread = await unreadReplies();
  if (gen !== renderGen.dash) return; // 後から始まった描き直しに任せる
  const curSum = current ? sums.find((x) => x.site.id === current.id) : null;
  if (current) await loadSiteChecks();

  // ---- 担当現場 ----
  box.innerHTML = "";
  if (!sites.length) {
    box.innerHTML =
      `<button class="curSiteCard empty"><span class="curSiteIcon">${icon(ICONS.building, 24)}</span>` +
      `<span class="curSiteText"><span class="curSiteName">担当現場を登録しましょう</span><span class="curSiteMeta">タップして現場名・工事番号・担当者を登録します</span></span>` +
      `<span class="siteSwitch">${icon(ICONS.plus, 18)}追加</span></button>`;
    box.firstElementChild.addEventListener("click", addSite);
  } else {
    if (curSum) {
      const b = document.createElement("button");
      const paused = isPaused(current);
      const pz = paused ? (current.pauses || []).find((p) => !p.to) : null;
      b.className = "dashSiteMain" + (paused ? " paused" : "");
      b.innerHTML =
        `<span class="dsmTop"><span class="pill pillGreen">今の現場</span>${paused ? `<span class="pill pillMuted">休工中（${fmtDate(pz.from)}〜）</span>` : ""}` +
        `<span class="pauseBtn${paused ? " on" : ""}" data-pause="1" role="button">${paused ? "再開する" : "休工"}</span></span>` +
        `<span class="dsmRow"><span class="dsThumb big">${siteThumbHtml(curSum)}</span><span class="dsText"><span class="dsName">${esc(current.name)}</span>` +
        `<span class="dsMeta">${siteMetaText(current)}</span></span><span class="chev">${icon(ICONS.chevron, 20)}</span></span>` +
        stepDots(curSum, true) +
        `<span class="dsProg"><span class="dsProgLabel">チェック進み具合</span><b>${curSum.pct}</b><span class="pctMark">%</span><span class="tileBar"><span style="width:${curSum.pct}%"></span></span></span>`;
      // 今の工程の最初の項目を開く（「未登録」の文字を押した時は、現場の情報の変更）
      b.addEventListener("click", (e) => {
        if (e.target.closest("[data-editsite]")) editSiteInfo(current);
        else if (e.target.closest("[data-pause]")) togglePause(current);
        else openGroup(GROUPS[curSum.cur].id);
      });
      box.appendChild(b);
    }
    sums
      .filter((x) => !current || x.site.id !== current.id)
      .forEach((sm) => {
        const b = document.createElement("button");
        const paused = isPaused(sm.site);
        b.className = "dashSiteRow" + (paused ? " paused" : "");
        const alert = !paused && (sm.unread || sm.reportDue || sm.overdue || sm.missing.length);
        b.innerHTML =
          `<span class="dsThumb">${siteThumbHtml(sm)}</span><span class="dsText"><span class="dsName">${esc(sm.site.name)}${alert ? '<span class="redDot"></span>' : ""}${paused ? '<span class="pill pillMuted">休工中</span>' : ""}</span>` +
          `<span class="dsMeta">${siteMetaText(sm.site)}</span></span>${stepDots(sm, false)}<span class="chev">${icon(ICONS.chevron, 18)}</span>`;
        b.addEventListener("click", async (e) => {
          if (e.target.closest("[data-editsite]")) return editSiteInfo(sm.site);
          await setCurrentSite(sm.site.id);
          toast(`今の現場を「${sm.site.name}」にしました`);
        });
        box.appendChild(b);
      });
    const add = document.createElement("button");
    add.className = "dashAddSite";
    add.innerHTML = `${icon(ICONS.plus, 16)}現場を追加`;
    add.addEventListener("click", addSite);
    box.appendChild(add);
  }

  // ---- やること（その時に必要なものだけ） ----
  const todo = [];
  if (unread.length) todo.push({ icon: ICONS.reply, cls: "green", html: `上司からの返信 <b class="em">${unread.length}件</b>`, go: () => openReplyItem(unread[0].rec) });
  // 返事待ちのやりとり（古い順に2件まで）
  const waits = pendingContacts(sums);
  waits.slice(0, 2).forEach(({ site, rec, n }) =>
    todo.push({
      icon: ICONS.reply,
      cls: "wood",
      html: `返事待ち：${esc(n.text)}<small>${sites.length > 1 ? esc(site.name) + "・" : ""}${esc(n.contact.who)}・${esc(fmtDate(toDateKey(new Date(n.at))))}から</small>`,
      go: async () => {
        if (site.id !== currentSiteId) await setCurrentSite(site.id);
        const it = allManualItems().find((x) => x.id === rec.itemId);
        if (it) {
          currentMTab = "check";
          await openGroup(groupOfProcess(it.cat).id, it.id);
          setTimeout(() => $("memoSection") && $("memoSection").scrollIntoView({ block: "start", behavior: "smooth" }), 300);
        }
      },
    })
  );
  if (waits.length > 2) todo.push({ icon: ICONS.reply, cls: "muted", html: `ほかの返事待ち <b>${waits.length - 2}件</b>`, go: () => toast("返事待ちは、それぞれの項目の「気づき・疑問メモ」に出ています") });
  // 打合せの宿題（期限の近い順に3件まで）
  const tasks = openTasks(sites);
  tasks.slice(0, 3).forEach(({ s, t }) =>
    todo.push({ icon: ICONS.checkSquare, cls: "green", html: `打合せの宿題：${esc(t.text)}<small>${sites.length > 1 ? esc(s.name) + "・" : ""}${taskDueHtml(t)}</small>`, go: () => openTaskSheet(s, t) })
  );
  if (tasks.length > 3) todo.push({ icon: ICONS.checkSquare, cls: "muted", html: `ほかの宿題 <b>${tasks.length - 3}件</b>`, go: () => openTaskList(sites) });
  const due = sums.filter((x) => x.reportDue);
  due.forEach((x) =>
    todo.push({
      img: "art/report-icon.webp?v=1",
      cls: "wood",
      html:
        x.week.state === "late"
          ? `報告の期限は<b class="em">今日</b>です（${x.week.isPrev ? "先週" : "今週"}の分）<small>${sites.length > 1 ? esc(x.site.name) + "・" : ""}${fmtDate(x.week.mon)}〜${fmtDate(x.week.sat)}</small>`
          : `${x.week.isPrev ? "先週" : "今週"}の報告：<b class="em">未送信</b>（${fmtDate(x.week.due)}まで）<small>${sites.length > 1 ? esc(x.site.name) + "・" : ""}${fmtDate(x.week.mon)}〜${fmtDate(x.week.sat)}</small>`,
      go: async () => {
        if (x.site.id !== currentSiteId) await setCurrentSite(x.site.id);
        goReport();
      },
    })
  );
  sums
    .filter((x) => x.overdue)
    .forEach((x) =>
      todo.push({
        img: "art/report-icon.webp?v=1",
        cls: "wood",
        html: `報告が <b class="em">${x.week.missed}週分</b> 遅れています<small>${esc(x.site.name)}</small>`,
        go: async () => {
          if (x.site.id !== currentSiteId) await setCurrentSite(x.site.id);
          goReport();
        },
      })
    );
  if (curSum && curSum.missing.length && !isPaused(current))
    todo.push({
      icon: ICONS.camera,
      cls: "blue",
      html: `撮り忘れの品質写真 <b class="em">${curSum.missing.length}件</b>`,
      go: () => openRequired("missing"),
    });
  if (!unread.length) todo.push({ icon: ICONS.reply, cls: "muted", html: `上司からの返信・宿題を取り込む<small>Box の「返信」フォルダから</small>`, pick: true });
  const todoBox = $("dashTodo");
  todoBox.innerHTML = "";
  if (todo.length === 1 && todo[0].pick) {
    const n = document.createElement("div");
    n.className = "dashNone";
    n.textContent = "今やることはありません";
    todoBox.appendChild(n);
  }
  todo.forEach((x) => {
    const b = document.createElement("button");
    b.className = "dashRow" + (x.pick ? " sub" : "");
    b.innerHTML = `<span class="dashIcon ${x.cls}">${x.img ? `<img src="${x.img}" alt="">` : icon(x.icon, 22)}</span><span class="dashRowText">${x.html}</span><span class="chev">${icon(ICONS.chevron, 18)}</span>`;
    // 返信の取り込みはファイル選択を開くので、タップの中で同期的に呼ぶ（iPhone）
    b.addEventListener("click", () => (x.pick ? $("replyInput").click() : x.go()));
    todoBox.appendChild(b);
  });

  // ---- 次に見る項目（いつも出る） ----
  const nextBox = $("dashNext");
  nextBox.innerHTML = "";
  const recent = manualMeta ? getRecent().map((r) => manualMeta.items.find((x) => x.id === r.id)).filter(Boolean) : [];
  const rows = [];
  if (recent[0]) rows.push({ icon: ICONS.play, cls: "green", label: "続きから", it: recent[0] });
  const all = allManualItems();
  const from = recent[0] ? all.findIndex((x) => x.id === recent[0].id) + 1 : 0;
  const isDone = (it) => {
    const rec = siteCheckRecs[it.id];
    if (rec && rec.na) return true;
    const all = (it.text && it.text.checks) || [];
    const cs = all.filter((c) => !isNaCheck(rec, checkKey("checks", c)));
    return !!rec && all.length > 0 && cs.every((c) => rec.marks[checkKey("checks", c)]);
  };
  const preCats = new Set(GROUPS.slice(0, (current && current.startGroup) || 0).flatMap((g) => g.cats));
  const next = all.slice(from).find((it) => !preCats.has(it.cat) && !isDone(it));
  if (next) {
    const prep = ((next.text && next.text.prep) || []).length;
    rows.push({ icon: ICONS.report, cls: "wood", label: "次の項目", it: next, extra: prep ? `（事前準備 ${prep}件）` : "" });
  }
  if (!rows.length) nextBox.innerHTML = `<div class="dashNone">${manualMeta ? "工程タブから項目を開くと、ここに続きが出ます" : "設定からマニュアルを取り込むと、ここに項目が出ます"}</div>`;
  rows.forEach((x) => {
    const b = document.createElement("button");
    b.className = "dashRow";
    b.innerHTML = `<span class="dashIcon ${x.cls}">${icon(x.icon, 22)}</span><span class="dashRowText">${x.label}：${esc(x.it.name)}${x.extra || ""}</span><span class="chev">${icon(ICONS.chevron, 18)}</span>`;
    b.addEventListener("click", () => openGroup(groupOfProcess(x.it.cat).id, x.it.id));
    nextBox.appendChild(b);
  });
  fitNames();
}

function goDash() {
  renderDash();
  showView("dashView");
}

// 設定・お知らせ・使い方は、タブの外にある画面。戻るで元の画面に帰る
const SUB_VIEWS = ["settingsView", "announceView", "helpView", "searchView", "siteManageView"];
function openSubView(id) {
  if (!SUB_VIEWS.includes(currentView)) viewBeforeSettings = currentView;
  showView(id);
}
function backFromSubView() {
  const back = { dashView: goDash, manualView: goManual, albumView: goAlbum, reportView: goReport }[viewBeforeSettings];
  if (back) back();
  else {
    // 工程マニュアル・報告の工程ページなど：サブ画面で現場やマニュアルが変わっていることがあるので描き直す
    showView(viewBeforeSettings);
    rerenderCurrentView();
  }
}

function openSettings() {
  renderSettings();
  openSubView("settingsView");
}

/* ---------- お知らせ ---------- */

const ANNOUNCE_SEEN_KEY = "genba-photo-announce-seen";

function announceSeenCount() {
  try {
    return Number(localStorage.getItem(ANNOUNCE_SEEN_KEY) || 0);
  } catch (e) {
    return 0;
  }
}
function updateBellDot() {
  document.querySelectorAll(".bellDot").forEach((d) => (d.hidden = ANNOUNCEMENTS.length <= announceSeenCount()));
}
function openAnnouncements() {
  const unseen = ANNOUNCEMENTS.length - announceSeenCount();
  $("announceList").innerHTML = ANNOUNCEMENTS.map(
    (a, i) =>
      `<div class="announceItem"><div class="announceHead">` +
      `<span class="pill ${a.type === "fix" ? "pillWood" : "pillGreen"}">${a.type === "fix" ? "修正" : "機能"}</span>` +
      `<span class="announceDate">${fmtDate(a.date)}</span>${i < unseen ? '<span class="announceNew">NEW</span>' : ""}</div>` +
      `<div>${esc(a.text)}</div></div>`
  ).join("");
  try {
    localStorage.setItem(ANNOUNCE_SEEN_KEY, String(ANNOUNCEMENTS.length));
  } catch (e) {
    /* ignore */
  }
  updateBellDot();
  openSubView("announceView");
}

/* ---------- バックアップ ---------- */
// 機種変更・故障に備えた書き出しと戻し。マニュアルはBoxから取り込み直せるので含めない。
// 写真を含めるとメールで送れない大きさになるため、その時は「ファイルに保存」（BoxアプリのフォルダもOK）を案内する

const BACKUP_OPT_KEY = "genba-photo-backup-opts";
const BACKUP_KIND = "genba-nav-backup";

function getBackupOpts() {
  try {
    return Object.assign({ sites: true, checks: true, photos: false }, JSON.parse(getSetting(BACKUP_OPT_KEY) || "{}"));
  } catch (e) {
    return { sites: true, checks: true, photos: false };
  }
}

async function updateBackupNote() {
  const opts = { sites: $("bkSites").checked, checks: $("bkChecks").checked, photos: $("bkPhotos").checked };
  setSetting(BACKUP_OPT_KEY, JSON.stringify(opts));
  const note = $("bkNote");
  if (opts.photos) {
    const photos = await dbGetAll("photos");
    const mb = photos.reduce((n, p) => n + (p.blob ? p.blob.size : 0) + (p.thumb ? p.thumb.size : 0), 0) * 1.37 / 1024 / 1024;
    const big = mb * 1024 * 1024 > MAIL_WARN_BYTES;
    note.className = big ? "mutedText warn" : "mutedText";
    note.textContent = big
      ? `写真${photos.length}枚を含めると約${Math.round(mb)}MBになり、メールでは送れません。` +
        "書き出したら共有画面の「ファイルに保存」で、iPhoneの中かBoxアプリのフォルダに保存してください。"
      : `写真${photos.length}枚を含めて約${Math.max(1, Math.round(mb))}MBです。今はメールでも送れますが、写真が増えて15MBを超えるとメールでは送れなくなり、「ファイルに保存」での保存になります。`;
  } else {
    note.className = "warnText";
    note.textContent = "写真はバックアップに入りません。機種変更や故障に備えるなら「写真」にもチェックを入れてください（写真を含めない場合は小さいファイルなので、メールでBoxへ送れます）。";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// バックアップのファイルを作る。onlySite を渡すと、その現場の分だけ（写真の片付けで使う）
async function buildBackupFile(opts, onlySite, photoIds, part) {
  const inSite = (x) => !onlySite || x.siteId === onlySite.id;
  let file;
  var skippedPhotos = 0;
  {
    const head = {
      kind: BACKUP_KIND,
      schema: 1,
      app_version: APP_VERSION,
      created_at: new Date().toISOString(),
      user: getSetting(USER_NAME_KEY),
      include: opts,
    };
    if (onlySite) head.site_only = { id: onlySite.id, name: onlySite.name };
    if (opts.sites) {
      head.sites = (await dbGetAll("sites")).filter((x) => !onlySite || x.id === onlySite.id);
      head.reports = (await dbGetAll("reports")).filter(inSite);
      head.covers = [];
      for (const st of head.sites) {
        const c = await getCover(st.id);
        if (c) head.covers.push({ siteId: st.id, blob: await blobToDataUrl(c.blob), thumb: await blobToDataUrl(c.thumb), updatedAt: c.updatedAt });
      }
      head.settings = { userName: getSetting(USER_NAME_KEY), boxEmail: getSetting(BOX_EMAIL_KEY), manualSite: getSetting(CURRENT_SITE_KEY) };
    }
    if (opts.checks) head.checks = (await dbGetAll("checks")).filter(inSite);
    // 写真は1枚ずつ文字にして並べる（全体を1つの巨大な文字列にするとiPhoneのメモリが足りなくなるため）
    const parts = [JSON.stringify(head).slice(0, -1), ',"photos":['];
    if (opts.photos) {
      const photos = (await dbGetAll("photos")).filter((p) => inSite(p) && !p.imageRemoved && (!photoIds || photoIds.has(p.id)));
      let written = 0;
      for (let i = 0; i < photos.length; i++) {
        if (i % 10 === 0) setProcessing(true, `写真を書き出し中... ${i} / ${photos.length}`);
        const p = photos[i];
        if (!(await canReadBlob(p.blob))) {
          skippedPhotos++; // 読めない写真は飛ばす（1枚のせいでバックアップ全体が失敗しないように）
          continue;
        }
        const rec = Object.assign({}, p, { blob: await blobToDataUrl(p.blob), thumb: (await canReadBlob(p.thumb)) ? await blobToDataUrl(p.thumb) : null });
        parts.push((written ? "," : "") + JSON.stringify(rec));
        written++;
      }
    }
    parts.push("]}");
    const name = safeFileName(
      onlySite
        ? `現場ナビ_写真の片付け_${onlySite.name}_${todayKey()}${part ? "_" + part : ""}_${getSetting(USER_NAME_KEY) || "未登録"}.json`
        : `現場ナビ_バックアップ_${todayKey()}${opts.photos ? "_写真あり" : ""}_${getSetting(USER_NAME_KEY) || "未登録"}.json`
    );
    file = new File(parts, name, { type: "application/json" });
  }
  return { file, skippedPhotos };
}

async function exportBackup() {
  const opts = { sites: $("bkSites").checked, checks: $("bkChecks").checked, photos: $("bkPhotos").checked };
  if (!opts.sites && !opts.checks && !opts.photos) {
    toast("書き出すものを1つ以上選んでください");
    return;
  }
  setProcessing(true, "バックアップを作成中...");
  let file;
  let skippedPhotos = 0;
  try {
    ({ file, skippedPhotos } = await buildBackupFile(opts));
  } catch (e) {
    console.error(e);
    alert("バックアップを作成できませんでした。写真を含めない形で試してください。");
    return;
  } finally {
    setProcessing(false);
  }
  if (skippedPhotos) alert(`読み込めない写真が${skippedPhotos}枚あったため、その写真はバックアップに入れませんでした（設定の「写真の点検」で確認できます）。`);
  const sizeMb = (file.size / 1024 / 1024).toFixed(1);
  openSheet("バックアップを書き出す", (body, close) => {
    const info = document.createElement("div");
    info.className = "summaryBox";
    info.innerHTML = `ファイル：${esc(file.name)}<br>大きさ：約${sizeMb}MB`;
    body.appendChild(info);
    const mailable = file.size <= MAIL_WARN_BYTES;
    const how = document.createElement("div");
    how.className = mailable ? "mutedText" : "warnText";
    how.textContent = mailable
      ? "共有画面でメールを選び、宛先にBoxのアドレスを貼り付けて送ってください（宛先をコピーします）。「ファイルに保存」も選べます。"
      : "メールでは送れない大きさです。共有画面で「ファイルに保存」を選び、iPhoneの中かBoxアプリのフォルダに保存してください。";
    body.appendChild(how);
    body.appendChild(
      sheetButton("共有画面を開く", "btnPrimary btnLarge", async () => {
        const email = getBoxEmail();
        if (mailable && email && navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: file.name });
            close();
            toast("バックアップを書き出しました");
          } catch (e) {
            /* キャンセル */
          }
        } else {
          const a2 = document.createElement("a");
          a2.href = URL.createObjectURL(file);
          a2.download = file.name;
          a2.click();
          setTimeout(() => URL.revokeObjectURL(a2.href), 2000);
          close();
        }
      })
    );
    body.appendChild(sheetButton("キャンセル", "btnSecondary", close));
  });
}

// 戻すときは「足す」。同じIDのものがあればそのまま残し、チェックは新しい方を残してまとめる
async function onRestorePicked() {
  const input = $("restoreInput");
  const files = [...input.files];
  input.value = "";
  if (!files.length) return;
  // 写真の片付けで分けて保存したファイルは、まとめて選んで順に戻せる
  if (files.length > 1 && !confirm(`${files.length}個のバックアップを順に戻します。よろしいですか？`)) return;
  for (const f of files) await restoreFromFile(f, files.length > 1);
}

async function restoreFromFile(file, quiet) {
  setProcessing(true, "バックアップを読み込み中...");
  let data;
  try {
    data = JSON.parse(await file.text());
    if (!data || data.kind !== BACKUP_KIND) throw new Error("not a backup");
  } catch (e) {
    setProcessing(false);
    alert("バックアップのファイルを読み込めませんでした。「現場ナビ_バックアップ_○○.json」を選んでください。");
    return;
  }
  setProcessing(false);
  const n = (k) => (Array.isArray(data[k]) ? data[k].length : 0);
  const msg =
    `${fmtDateTime(data.created_at)}（${data.user || "名前なし"}）のバックアップです。\n` +
    `現場${n("sites")}件・報告${n("reports")}件・チェック${n("checks")}項目・写真${n("photos")}枚\n\n` +
    "今のデータに足して戻します（すでにあるものは消えません）。よろしいですか？";
  if (!quiet && !confirm(msg)) return;
  setProcessing(true, "戻しています...");
  try {
    const add = async (store, rows, keyName) => {
      if (!rows || !rows.length) return 0;
      const exist = new Set((await dbGetAll(store)).map((r) => r[keyName]));
      const fresh = rows.filter((r) => !exist.has(r[keyName]));
      for (let i = 0; i < fresh.length; i += 20) await dbPutMany(store, fresh.slice(i, i + 20));
      return fresh.length;
    };
    const added = {};
    added.sites = await add("sites", data.sites, "id");
    for (const c of data.covers || []) {
      if (await getCover(c.siteId)) continue; // 今の端末の画像を優先
      await dbPut("meta", { key: "cover:" + c.siteId, blob: await (await fetch(c.blob)).blob(), thumb: await (await fetch(c.thumb)).blob(), updatedAt: c.updatedAt });
    }
    added.reports = await add("reports", data.reports, "id");
    if (data.checks && data.checks.length) {
      const current = Object.fromEntries((await dbGetAll("checks")).map((r) => [r.key, r]));
      const merged = data.checks.map((r) => {
        const cur = current[r.key];
        if (!cur) return r;
        const marks = Object.assign({}, cur.marks);
        // この端末で「該当なし」にして外したチェック（外した時より前のチェック）は、バックアップから戻さない
        const removedByNa = (k, m) => (cur.naAt && m.at < cur.naAt) || (cur.naChecks && cur.naChecks[k] && (cur.naChecks[k].at || "") > m.at);
        Object.entries(r.marks || {}).forEach(([k, m]) => {
          if (!marks[k] && removedByNa(k, m)) return;
          if (!marks[k] || marks[k].at < m.at) marks[k] = m;
        });
        const byId = new Map((cur.notes || []).map((n) => [n.id, n]));
        (r.notes || []).forEach((n) => {
          const c = byId.get(n.id);
          const newer = !c || (n.updatedAt || n.at) > (c.updatedAt || c.at) ? n : c;
          const replies = [...(c && c.replies) || [], ...(n.replies || [])].filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i);
          byId.set(n.id, replies.length ? Object.assign({}, newer, { replies }) : newer);
        });
        const notes = [...byId.values()];
        const naFromBackup = r.na && (!cur.naAt || (r.naAt && r.naAt > cur.naAt));
        const naChecks = Object.assign({}, cur.naChecks || {});
        Object.entries(r.naChecks || {}).forEach(([k, v]) => {
          if (!naChecks[k] || (v.at || "") > (naChecks[k].at || "")) naChecks[k] = v;
        });
        // 撮影不要：同じチェックなら新しく変えた方を使う
        const noPhoto = Object.assign({}, cur.noPhoto || {});
        Object.entries(r.noPhoto || {}).forEach(([k, v]) => {
          if (!noPhoto[k] || (v.at || "") > (noPhoto[k].at || "")) noPhoto[k] = v;
        });
        return Object.assign({}, cur, { marks, notes, noPhoto, naChecks }, naFromBackup ? { na: r.na, naAt: r.naAt, naBy: r.naBy } : {});
      });
      await dbPutMany("checks", merged);
      added.checks = merged.length;
    }
    if (data.photos && data.photos.length) {
      const current = await dbGetAll("photos");
      const removed = new Set(current.filter((p) => p.imageRemoved).map((p) => p.id)); // 片付け済み（画像だけ戻す）
      const exist = new Set(current.filter((p) => !p.imageRemoved).map((p) => p.id));
      const siteIds = new Set((await dbGetAll("sites")).map((x) => x.id));
      const reportIds = new Set((await dbGetAll("reports")).map((x) => x.id));
      // 現場が無い写真は見えなくなるので入れない（写真だけのバックアップを別の端末に戻した時など）
      const fresh = data.photos.filter((p) => !exist.has(p.id) && siteIds.has(p.siteId) && p.blob);
      added.skipped = data.photos.filter((p) => !exist.has(p.id) && !removed.has(p.id) && !siteIds.has(p.siteId)).length;
      fresh.forEach((p) => {
        if (p.reportId && !reportIds.has(p.reportId)) p.reportId = null;
      });
      const curById = new Map(current.map((p) => [p.id, p]));
      for (let i = 0; i < fresh.length; i++) {
        if (i % 10 === 0) setProcessing(true, `写真を戻しています... ${i} / ${fresh.length}`);
        const p = fresh[i];
        p.blob = await (await fetch(p.blob)).blob();
        p.thumb = p.thumb ? await (await fetch(p.thumb)).blob() : p.blob;
        if (removed.has(p.id)) {
          // 片付けた後に付いた印（報告済み・送る写真など）を消さないよう、今の情報に画像だけ足す
          const { imageRemoved, removedAt, backupName, ...meta } = curById.get(p.id);
          await dbPut("photos", { ...meta, blob: p.blob, thumb: p.thumb });
        } else await dbPut("photos", p);
      }
      added.photos = fresh.length;
    }
    if (data.settings) {
      if (!getSetting(USER_NAME_KEY) && data.settings.userName) setSetting(USER_NAME_KEY, data.settings.userName);
      if (!getSetting(BOX_EMAIL_KEY) && data.settings.boxEmail) setSetting(BOX_EMAIL_KEY, data.settings.boxEmail);
    }
    await migrateCheckKeys(true);
    await refreshSites();
    await loadSiteChecks();
    toast(
      `戻しました（現場${added.sites || 0}・チェック${added.checks || 0}・写真${added.photos || 0}）` +
        (added.skipped ? `。現場の登録がない写真${added.skipped}枚は戻しませんでした（登録情報も含めたバックアップから戻してください）` : "")
    );
    renderSettings();
  } catch (e) {
    console.error(e);
    alert("途中で失敗しました。もう一度試してください（すでに戻した分は残っています）。");
  } finally {
    setProcessing(false);
  }
}

/* ---------- 使い方の案内（チュートリアル） ---------- */
// 照らした場所を吹き出しで説明する。ページの操作は止めないので、照らした所をそのままタップして進める。
// 名前はチェックの記録に「誰が」を残すため（後で品質管理・育成の指標にも使う想定）

const TOUR_DONE_KEY = "genba-photo-tour-done";
const TOUR_ALWAYS_KEY = "genba-photo-tour-always";

let tourIdx = -1;

const TOUR_STEPS = [
  {
    view: "dashView",
    target: () => document.querySelector("#dashView .settingsBtn"),
    text: "ようこそ！まずはお名前を登録しましょう。右上の歯車をタップしてください。",
    waitView: "settingsView",
  },
  {
    view: "settingsView",
    target: () => $("userNameInput"),
    text: "ここにお名前を入力してください。工程マニュアルのチェックや報告に、名前が一緒に記録されます。",
    next: true,
    onNext: () => {
      const v = $("userNameInput").value.trim();
      if (v) setSetting(USER_NAME_KEY, v);
    },
  },
  {
    view: "settingsView",
    target: () => $("manualCard"),
    text: () =>
      manualMeta
        ? "マニュアルは取り込み済みです。新しい版が出たら、ここから取り込み直します。"
        : "次に、Boxにある「マニュアル_○○.json」をここから取り込みます（初回だけ）。あとで取り込む場合は「次へ」。",
    next: true,
    scroll: true,
  },
  {
    view: "settingsView",
    target: () => $("boxEmailInput"),
    text: () =>
      getBoxEmail()
        ? "報告の送り先（Boxのアドレス）は登録済みです。報告を送る時に、このアドレスをメールの宛先に使います。"
        : "報告の送り先になる、Boxのアップロード用メールアドレスをここに入れます。分からなければ「次へ」で、あとから入れても大丈夫です。",
    next: true,
    scroll: true,
    onNext: () => {
      const v = $("boxEmailInput").value.trim();
      if (v && !BOX_UPLOAD_EMAIL) setSetting(BOX_EMAIL_KEY, v);
    },
  },
  {
    view: "*",
    target: () => document.querySelector('.tabBtn[data-tab="home"]'),
    text: "次に、担当現場を登録します。下の「ホーム」をタップしてください。",
    waitView: "dashView",
  },
  {
    view: "dashView",
    target: () => $("dashSiteCard"),
    text: () =>
      currentSiteId
        ? "ここに担当現場が並びます。いちばん上が「今の現場」で、写真やチェックはこの現場に記録されます。ほかの現場をタップすると切り替わります。"
        : "ここに担当現場が並びます。ここをタップして、現場名・工事番号・担当者を登録してください。",
    next: true,
    onNext: () => {
      if (currentSiteId) return true;
      toast("先にここをタップして、現場名を登録してください");
      return false;
    },
  },
  {
    view: "dashView",
    target: () => document.querySelector('.tabBtn[data-tab="manual"]'),
    text: "品質写真の撮り方です。下の「工程」から項目を開くと「チェックポイント」が出ます。「写真要」のチェックの横にあるカメラで撮ると、写真とチェックが一緒に残ります。お客様向けの報告写真は、工程マニュアルの右上の「報告写真」から撮れます。",
    next: true,
  },
  {
    view: "dashView",
    target: () => document.querySelector('.tabBtn[data-tab="report"]'),
    text: "最後に、週の報告です。月〜土の工事を、金曜〜翌週の月曜（遅くとも火曜）に「報告」タブから送ります。送る写真を選んで「Boxへ送信」してください。",
    next: true,
    nextLabel: "完了",
  },
];

function tourShouldStart() {
  return getSetting(TOUR_ALWAYS_KEY) === "1" || getSetting(TOUR_DONE_KEY) !== "1";
}

function startTour() {
  tourIdx = 0;
  if (currentView !== "dashView") goDash();
  else renderTourStep();
}

function endTour() {
  tourIdx = -1;
  $("tour").hidden = true;
  setSetting(TOUR_DONE_KEY, "1");
}

function tourOnView(id) {
  if (tourIdx < 0) return;
  const step = TOUR_STEPS[tourIdx];
  if (step.waitView && id === step.waitView) {
    tourIdx++;
  }
  setTimeout(renderTourStep, 60);
}

function renderTourStep() {
  if (tourIdx < 0) return;
  if (tourIdx >= TOUR_STEPS.length) {
    endTour();
    toast("準備完了です。使い方はホーム右上の「？」からいつでも見られます");
    return;
  }
  const step = TOUR_STEPS[tourIdx];
  const tour = $("tour");
  const onRightView = step.view === "*" || step.view === currentView;
  const target = onRightView ? step.target() : null;
  if (!target || target.offsetParent === null) {
    tour.hidden = true; // 別の画面に移ったときは隠しておき、戻ったら再表示する
    return;
  }
  if (step.scroll) target.scrollIntoView({ block: "center" });
  tour.hidden = false;
  $("tourStep").textContent = `使い方の案内 ${tourIdx + 1} / ${TOUR_STEPS.length}`;
  $("tourText").textContent = typeof step.text === "function" ? step.text() : step.text;
  $("tourNext").hidden = !step.next;
  $("tourNext").textContent = step.nextLabel || "次へ";
  requestAnimationFrame(placeTourSpot);
}

function placeTourSpot() {
  if (tourIdx < 0 || $("tour").hidden) return;
  const step = TOUR_STEPS[tourIdx];
  const target = step && step.target();
  if (!target) return;
  const r = target.getBoundingClientRect();
  const pad = 6;
  const spot = $("tourSpot");
  spot.style.left = `${r.left - pad}px`;
  spot.style.top = `${r.top - pad}px`;
  spot.style.width = `${r.width + pad * 2}px`;
  spot.style.height = `${r.height + pad * 2}px`;
  const bubble = $("tourBubble");
  const bh = bubble.offsetHeight;
  const below = r.bottom + 16;
  bubble.style.top = below + bh < window.innerHeight - 80 ? `${below}px` : `${Math.max(16, r.top - bh - 16)}px`;
}

window.addEventListener("scroll", () => requestAnimationFrame(placeTourSpot), { passive: true });
window.addEventListener("resize", () => requestAnimationFrame(placeTourSpot));

/* ---------- 起動 ---------- */

function goManual() {
  renderManual();
  showView("manualView");
}

/* ---------- 写真要の一覧（マニュアルで写真が必要なチェックを、工程順に） ----------
   「マニュアルのどこの写真が無かったか」をすぐ確かめる画面。この現場では撮らなくてよいものは「不要」にでき、
   不要にしたものは品質写真の数（写真タブ・ホーム・工程の進み具合・報告の進み具合）から外れる */
let requiredFilter = "todo";
let requiredFrom = "albumView";
const REQ_FILTERS = [
  ["todo", "まだ"],
  ["missing", "撮り忘れ"],
  ["done", "撮影済み"],
  ["skip", "不要"],
  ["all", "すべて"],
];

function openRequired(filter) {
  requiredFrom = ["dashView", "manualView"].includes(currentView) ? currentView : "albumView";
  if (filter) requiredFilter = filter;
  showView("requiredView");
  window.scrollTo(0, 0);
  renderRequired();
}

async function toggleNoPhoto(it, key) {
  const rec = checkRecOf(it.id);
  rec.noPhoto = rec.noPhoto || {};
  const on = photoSkipped(rec, key);
  rec.noPhoto[key] = { at: new Date().toISOString(), by: getSetting(USER_NAME_KEY), ...(on ? { off: true } : {}) };
  await saveCheckRec(rec);
}

async function renderRequired(keepScroll) {
  const y = window.scrollY;
  const site = await refreshSites();
  await loadSiteChecks();
  releaseUrls("required");
  const sum = $("requiredSummary");
  const chips = $("requiredChips");
  const list = $("requiredList");
  list.innerHTML = "";
  if (!site || !manualMeta) {
    sum.innerHTML = "";
    chips.innerHTML = "";
    list.innerHTML = `<div class="emptyState"><div class="emptyText">${site ? "設定からマニュアルを取り込むと、写真要の一覧が出ます。" : "上の「今の現場」から現場を登録すると、写真要の一覧が出ます。"}</div></div>`;
    return;
  }
  const start = site.startGroup || 0;
  const rows = [];
  GROUPS.forEach((g, gi) =>
    g.cats.forEach((cat) =>
      allManualItems()
        .filter((it) => it.cat === cat)
        .forEach((it) =>
          ((it.text && it.text.checks) || []).forEach((c) => {
            if (c.photo !== "要") return;
            const key = checkKey("checks", c);
            const rec = siteCheckRecs[it.id];
            const ph = siteRecordPhotos[`${it.id}|${key}`];
            const started = checksStarted(rec);
            const status = gi < start ? "pre" : (rec && rec.na) || isNaCheck(rec, key) ? "na" : ph ? "done" : photoSkipped(rec, key) ? "skip" : "todo";
            rows.push({ g, it, c, key, ph, status, started });
          })
        )
    )
  );
  const live = rows.filter((r) => r.status === "done" || r.status === "todo");
  const done = live.filter((r) => r.status === "done").length;
  const pct = live.length ? Math.round((done / live.length) * 100) : 0;
  const nSkip = rows.filter((r) => r.status === "skip").length;
  const nOut = rows.filter((r) => r.status === "na" || r.status === "pre").length;
  const nMissing = rows.filter((r) => r.status === "todo" && r.started).length;
  // 1枚以上撮っていて、撮るものが残っていない（残りは不要）＝撮影済み
  const photoDone = (rs) => rs.some((r) => r.status === "done") && !rs.some((r) => r.status === "todo");
  const allDone = live.length > 0 && done === live.length;
  sum.innerHTML =
    `<div class="reqSum${allDone ? " complete" : ""}"><div class="reqSumMain"><span class="kindLabel record">品質写真</span><b>${done}</b>/${live.length}` +
    (allDone ? `<span class="statPct done">${icon(ICONS.check, 14, 3)}すべて撮影済み</span>` : `<span class="statPct">${pct}%</span>`) +
    `</div>` +
    `<span class="statBar"><span style="width:${pct}%"></span></span>` +
    `<div class="reqSumSub">撮り忘れ ${nMissing}件・不要にした ${nSkip}件${nOut ? `・該当なし／導入前 ${nOut}件` : ""}</div></div>`;
  chips.innerHTML = "";
  const count = (f) =>
    f === "all" ? rows.length : f === "missing" ? nMissing : rows.filter((r) => r.status === f).length;
  REQ_FILTERS.forEach(([f, label]) => {
    const b = document.createElement("button");
    b.className = "reqChip" + (requiredFilter === f ? " on" : "");
    b.innerHTML = `${label}<span>${count(f)}</span>`;
    b.addEventListener("click", () => {
      requiredFilter = f;
      renderRequired();
    });
    chips.appendChild(b);
  });
  const shown = rows.filter((r) =>
    requiredFilter === "all" ? true : requiredFilter === "missing" ? r.status === "todo" && r.started : r.status === requiredFilter
  );
  if (!shown.length) {
    list.innerHTML = `<div class="emptyState"><div class="emptyText">${requiredFilter === "missing" ? "撮り忘れはありません。" : "該当する写真はありません。"}</div></div>`;
    return;
  }
  // 6工程 → 項目 の順に並べる
  let lastG = null;
  let lastIt = null;
  let box = null;
  shown.forEach((r) => {
    if (r.g !== lastG) {
      const h = document.createElement("div");
      h.className = "reqGroup";
      const gDone = photoDone(rows.filter((x) => x.g === r.g));
      h.innerHTML =
        `${groupArt(r.g, 28)}<span>${esc(r.g.name)}</span><small>${esc(r.g.sub)}</small>` +
        (gDone ? `<span class="reqDone">${icon(ICONS.check, 12, 3.4)}撮影済み</span>` : "");
      list.appendChild(h);
      lastG = r.g;
      lastIt = null;
    }
    if (r.it !== lastIt) {
      box = document.createElement("div");
      box.className = "reqItem";
      const head = document.createElement("button");
      head.className = "reqItemHead";
      const iDone = photoDone(rows.filter((x) => x.it === r.it));
      head.innerHTML =
        `${r.it.no ? `<span class="itemChipNo">${esc(r.it.no)}</span>` : ""}<span>${esc(r.it.name)}</span>` +
        (iDone ? `<span class="reqDone">${icon(ICONS.check, 12, 3.4)}撮影済み</span>` : "") +
        icon(ICONS.chevron, 16);
      const it = r.it;
      head.addEventListener("click", () => {
        currentMTab = "check";
        openGroup(groupOfProcess(it.cat).id, it.id);
      });
      box.appendChild(head);
      list.appendChild(box);
      lastIt = r.it;
    }
    const row = document.createElement("div");
    row.className = "reqRow " + r.status;
    const camHtml =
      r.status === "done"
        ? `<img src="${blobUrl("required", r.ph.thumb)}" alt="">`
        : r.status === "todo"
        ? icon(ICONS.camera, 22)
        : "";
    const label = { pre: "導入前", na: "該当なし", skip: "不要", todo: r.started ? "撮り忘れ" : "", done: "" }[r.status];
    row.innerHTML =
      `<button class="reqCam ${r.status}" ${r.status === "done" || r.status === "todo" ? "" : "disabled"} aria-label="品質写真">${camHtml}</button>` +
      `<span class="reqText">${esc(r.c.text)}${label ? `<span class="reqLabel ${r.status}${r.status === "todo" ? " miss" : ""}">${label}</span>` : ""}</span>` +
      (r.status === "todo" || r.status === "skip"
        ? `<button class="reqSkip${r.status === "skip" ? " on" : ""}">${r.status === "skip" ? "不要を解除" : "撮影不要"}</button>`
        : "");
    // カメラ・写真のボタンはタップの中でそのまま開く（iPhone）
    const cam = row.querySelector(".reqCam");
    if (r.status === "done" || r.status === "todo") cam.addEventListener("click", () => onCheckCamera(r.it, r.key));
    const sk = row.querySelector(".reqSkip");
    if (sk)
      sk.addEventListener("click", async () => {
        await toggleNoPhoto(r.it, r.key);
        toast(r.status === "skip" ? "撮影不要を解除しました" : "この現場では撮影不要にしました（数から外れます）");
        renderRequired(true);
      });
    box.appendChild(row);
  });
  if (keepScroll) window.scrollTo(0, y);
}

/* ---------- 写真が読み込めない時 ----------
   iPhone では、保存した写真のデータが読めなくなることがまれにある（「？」の画像になる）。
   そのままだと何が起きたか分からないので、代わりに「読み込めません」と出し、設定の「写真の点検」で数を確かめられるようにする */
document.addEventListener(
  "error",
  (e) => {
    const t = e.target;
    if (!(t instanceof HTMLImageElement) || !t.src.startsWith("blob:") || t.dataset.broken) return;
    t.dataset.broken = "1";
    t.classList.add("imgBroken");
    const ph = document.createElement("span");
    ph.className = "imgBrokenNote";
    ph.textContent = "読み込めません";
    t.after(ph);
    console.warn("写真を読み込めませんでした", t.src);
  },
  true
);

async function canReadBlob(b) {
  if (!(b instanceof Blob) || !b.size) return false;
  try {
    await b.slice(0, 16).arrayBuffer();
    return true;
  } catch (e) {
    return false;
  }
}

async function checkPhotos() {
  setProcessing(true, "写真を点検しています...");
  const bad = [];
  let total = 0;
  try {
    const all = await dbGetAll("photos");
    total = all.length;
    for (const p of all) {
      if (p.imageRemoved) continue;
      const ok = (await canReadBlob(p.blob)) && (await canReadBlob(p.thumb));
      if (!ok) bad.push(p);
    }
  } finally {
    setProcessing(false);
  }
  if (!bad.length) {
    alert(`写真 ${total}枚を点検しました。読み込めない写真はありません。`);
    return;
  }
  const sites = Object.fromEntries((await getSites()).map((x) => [x.id, x.name]));
  const lines = bad.slice(0, 8).map((p) => `・${sites[p.siteId] || "?"} ${processOf(p.processId).short} ${fmtDateTime(p.takenAt)}`);
  const msg =
    `写真 ${total}枚のうち、${bad.length}枚が読み込めませんでした。\n${lines.join("\n")}${bad.length > 8 ? "\nほか" + (bad.length - 8) + "枚" : ""}\n\n` +
    "読み込めない写真は元に戻せません。一覧から消しますか？（品質写真なら、チェックの横のカメラで撮り直せます）";
  if (!confirm(msg)) return;
  await dbDeleteMany("photos", bad.map((p) => p.id));
  await loadSiteChecks();
  toast(`読み込めない写真 ${bad.length}枚を消しました`);
}

/* ---------- 表示の色（端末と同じ／ライト／ダーク） ---------- */
const THEME_KEY = "genba-photo-theme";
function applyTheme(t) {
  const root = document.documentElement;
  if (t === "light" || t === "dark") root.setAttribute("data-theme", t);
  else root.removeAttribute("data-theme");
  const dark = t === "dark" || (t !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#1c2320" : "#f7f5ef");
  document.querySelectorAll("[data-theme-set]").forEach((b) => b.classList.toggle("on", b.dataset.themeSet === (t || "auto")));
}

function init() {
  applyTheme(getSetting(THEME_KEY) || "auto");
  document.querySelectorAll("[data-theme-set]").forEach((b) =>
    b.addEventListener("click", () => {
      setSetting(THEME_KEY, b.dataset.themeSet === "auto" ? "" : b.dataset.themeSet);
      applyTheme(b.dataset.themeSet);
    })
  );
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme(getSetting(THEME_KEY) || "auto"));
  $("shotCloseBtn").innerHTML = icon(ICONS.x, 24);
  $("reportProcBackBtn").innerHTML = icon(ICONS.back, 26);
  $("reportPastBackBtn").innerHTML = icon(ICONS.back, 26);
  $("requiredBackBtn").innerHTML = icon(ICONS.back, 26);
  $("requiredBackBtn").addEventListener("click", () => (requiredFrom === "dashView" ? goDash() : requiredFrom === "manualView" ? goManual() : goAlbum()));
  $("groupBackBtn").innerHTML = icon(ICONS.back, 26);
  $("settingsBackBtn").innerHTML = icon(ICONS.back, 26);
  document.querySelectorAll(".settingsBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.settings, 24);
    b.addEventListener("click", openSettings);
  });
  document.querySelectorAll("[data-icon]").forEach((el) => {
    const size = el.classList.contains("tabIcon") ? 24 : el.classList.contains("reportCardIcon") ? 40 : el.classList.contains("bannerIcon") || el.classList.contains("albumCardIcon") ? 28 : el.closest(".toolBtn") ? 22 : 20;
    el.innerHTML = icon(ICONS[el.dataset.icon], size);
  });

  document.querySelectorAll(".curSiteBar").forEach((b) => b.addEventListener("click", openSiteSwitcher));
  $("manageAddBtn").addEventListener("click", addSite);
  $("albumSort").addEventListener("change", (e) => {
    albumState.sort = e.target.value;
    renderAlbum();
  });
  $("albumUseBtn").addEventListener("click", albumUseForReport);
  $("albumColsBtn").addEventListener("click", () => {
    albumState.cols = albumState.cols === 2 ? 3 : 2;
    setSetting(ALBUM_COLS_KEY, String(albumState.cols));
    renderAlbum();
  });
  $("procBarDoneBtn").addEventListener("click", goReport);
  $("albumRetagBtn").addEventListener("click", albumRetag);
  $("albumSaveBtn").addEventListener("click", () => sharePhotos(currentSite(), albumPhotos.filter((p) => albumSel.has(p.id))));
  $("albumDeleteBtn").addEventListener("click", albumDelete);
  $("reportProcBackBtn").addEventListener("click", goReport);
  $("reportPastBackBtn").addEventListener("click", goReport);
  $("reportShootBtn").addEventListener("click", () => {
    shotFrom = "report";
    startCamera(reportProcId);
  });
  $("reportImportBtn").addEventListener("click", () => startLibrary(reportProcId));
  $("pastShareBtn").addEventListener("click", () => sharePhotos(currentSite(), pastPhotos));
  $("recordLibraryInput").addEventListener("change", onRecordLibraryPicked);
  $("cameraInput").addEventListener("change", onCameraPicked);
  $("libraryInput").addEventListener("change", onLibraryPicked);
  $("shotAgainBtn").addEventListener("click", () => startCamera(shootProcessId));
  $("shotOtherBtn").addEventListener("click", pickOtherProcess);
  $("shotDoneBtn").addEventListener("click", leaveShot);
  $("shotCloseBtn").addEventListener("click", leaveShot);
  $("shotUndoBtn").addEventListener("click", undoLastShot);
  $("groupBackBtn").addEventListener("click", goManual);
  $("groupShootBtn").addEventListener("click", shootFromGroup);
  $("settingsBackBtn").addEventListener("click", backFromSubView);
  document.querySelectorAll(".subBackBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.back, 26);
    b.addEventListener("click", backFromSubView);
  });
  document.querySelectorAll(".bellBtn").forEach((b) => {
    b.insertAdjacentHTML("afterbegin", icon(ICONS.bell, 24));
    b.addEventListener("click", openAnnouncements);
  });
  document.querySelectorAll(".helpBtn").forEach((b) => {
    b.innerHTML = icon(ICONS.help, 24);
    b.addEventListener("click", () => openSubView("helpView"));
  });
  updateBellDot();
  $("dashSitesMore").addEventListener("click", openSiteManage);
  $("sendBoxBtn").addEventListener("click", sendToBox);
  $("shareSelectedBtn").addEventListener("click", shareSelected);
  $("groupShootBtn").innerHTML = `${icon(ICONS.camera, 18)}<span class="hsb"><b>報告写真</b><small>お客様向け</small></span>`;
  document.querySelectorAll(".openSearchBtn").forEach((b) => b.addEventListener("click", openSearch));
  $("searchInput").addEventListener("input", renderSearch);
  $("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("searchInput").blur();
  });
  document.querySelectorAll(".itemTab").forEach((t) => t.addEventListener("click", () => switchMTab(t.dataset.mtab)));
  $("manualInput").addEventListener("change", onManualPicked);
  $("importManualBtn").addEventListener("click", () => $("manualInput").click());
  $("deleteManualBtn").addEventListener("click", deleteManual);
  $("userNameInput").addEventListener("change", (e) => setSetting(USER_NAME_KEY, e.target.value.trim()));
  $("boxEmailInput").addEventListener("change", (e) => setSetting(BOX_EMAIL_KEY, e.target.value.trim()));
  $("copyBoxEmailBtn").addEventListener("click", copyBoxEmail);
  ["bkSites", "bkChecks", "bkPhotos"].forEach((id) => $(id).addEventListener("change", updateBackupNote));
  $("backupBtn").addEventListener("click", exportBackup);
  $("restoreBtn").addEventListener("click", () => $("restoreInput").click());
  $("restoreInput").addEventListener("change", onRestorePicked);
  $("replyInput").addEventListener("change", onRepliesPicked);
  $("checkPhotosBtn").addEventListener("click", checkPhotos);
  $("settingsReplyBtn").addEventListener("click", () => $("replyInput").click());
  initGas();
  $("tourAlwaysChk").addEventListener("change", (e) => setSetting(TOUR_ALWAYS_KEY, e.target.checked ? "1" : "0"));
  $("tourAgainBtn").addEventListener("click", startTour);
  $("helpTourBtn").addEventListener("click", startTour);
  $("tourSkip").addEventListener("click", endTour);
  $("tourNext").addEventListener("click", () => {
    const step = TOUR_STEPS[tourIdx];
    if (step && step.onNext && step.onNext() === false) return;
    tourIdx++;
    renderTourStep();
  });
  $("markReportedBtn").addEventListener("click", chooseReportedKind);
  $("deleteReportPhotosBtn").addEventListener("click", deleteReportPhotos);
  $("undoReportBtn").addEventListener("click", async () => {
    const r = await dbGet("reports", reportPastId);
    if (r) undoReport(r);
  });
  document.querySelector(".sheetBackdrop").addEventListener("click", () => {
    const f = sheetDismiss;
    sheetDismiss = null;
    $("sheet").hidden = true;
    if (f) f();
  });

  document.querySelectorAll(".tabBtn").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.tab === "home") goDash();
      if (b.dataset.tab === "manual") goManual();
      if (b.dataset.tab === "photos") goAlbum();
      if (b.dataset.tab === "report") goReport();
    })
  );

  // 写真がブラウザの判断で消されないよう永続化を要求（ホーム画面追加時は通常許可される）
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  loadManualMeta().then(async () => {
    goDash();
    if (await checkPendingShot()) return;
    if (tourShouldStart()) startTour();
  });
}

init();
