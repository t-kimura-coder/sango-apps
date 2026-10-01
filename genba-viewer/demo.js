/* サンプルデータ（画面の確認・説明用）。人名・現場名はすべて架空 */
const DEMO = (() => {
  const GROUPS = [
    ["基礎", 111, 24],
    ["上棟", 44, 11],
    ["外装", 47, 4],
    ["内装", 51, 6],
    ["設備", 31, 3],
    ["引渡し", 25, 2],
  ];
  const ART = { 基礎: "g1", 上棟: "g2", 外装: "g3", 内装: "g4", 設備: "g5", 引渡し: "g6" };
  const PEOPLE = [
    { id: "demo-p1", name: "山田 健太", sites: [["demo-s1", "佐藤様邸", 1.6], ["demo-s2", "鈴木様邸", 0.4]], lastDays: 1 },
    { id: "demo-p2", name: "高橋 直樹", sites: [["demo-s3", "高橋様邸", 1.1], ["demo-s4", "中村様邸", 2.4]], lastDays: 2 },
    { id: "demo-p3", name: "佐藤 大輔", sites: [["demo-s5", "松井様邸", 1.3]], lastDays: 0 },
    { id: "demo-p4", name: "鈴木 翔太", sites: [["demo-s6", "田中様邸", 3.4]], lastDays: 9 },
    { id: "demo-p5", name: "伊藤 誠", sites: [["demo-s7", "伊藤様邸", 4.5]], lastDays: 1 },
    { id: "demo-p6", name: "渡辺 拓也", sites: [["demo-s8", "小林様邸", 2.0]], lastDays: 4 },
    { id: "demo-p7", name: "新人 太郎", sites: [["demo-s9", "松井様邸", 0.8]], lastDays: 1 },
  ];
  // 工事番号（松井様邸は二人の担当なので同じ番号）と、現場に登録された担当者
  const KOUJI = { 佐藤様邸: "2026-0101", 鈴木様邸: "2026-0102", 高橋様邸: "2026-0103", 中村様邸: "2026-0104", 松井様邸: "2026-0105", 田中様邸: "2026-0106", 伊藤様邸: "2026-0107", 小林様邸: "2026-0108" };
  const MEMBERS = { 松井様邸: ["佐藤", "新人"] };
  const NOTES = {
    "demo-s1": [
      ["question", "筋かいの設置位置について確認させてください\n図面と現場の納まりで、2階東側の筋かいが窓と干渉しそうです。どちらを優先すればよいでしょうか？", "上棟", "筋交い・ホールダウン設置", 0.2],
      ["notice", "上棟時のクレーン作業は順調に進みました\n天候にも恵まれ、予定通りです。", "上棟", "1F建て方", 3],
    ],
    "demo-s2": [["request", "電気屋さんからの要望です。コンセント位置の調整について\n2階の洋室Aのコンセント位置を、ベッド配置に合わせて10cm上げてほしいとの要望がありました。", "内装", "電気配線工事①", 1]],
    "demo-s3": [
      ["question", "コンクリートの養生期間\nこの時期の養生期間はどのくらいを目安にすればよいでしょうか？気温が下がってきており心配です。", "基礎", "ベース打設", 0.3],
      ["question", "スリーブの位置\n暖房のスリーブ位置が設備図と配置図で少し違います。どちらに合わせますか？", "基礎", "スリーブ設置（暖房）", 5, "resolved"],
    ],
    "demo-s4": [["question", "外壁材の仕様について\nサッシ上部の防水テープの貼り方が、図面と実際の納まりで異なるように見えます。", "外装", "タイベック", 0.1]],
    "demo-s5": [["notice", "基礎周りの配管位置について\n立ち上がり付近で、配管の位置が図面より少しずれているように見えます。念のため共有します。", "基礎", "設備管埋設", 0.5]],
    "demo-s6": [
      ["question", "断熱材の仕様確認\n屋根の断熱材が仕様書ではA種ですが、この現場はB種で対応してよいでしょうか？", "外装", "付加断熱材", 9],
      ["question", "図面と実際の寸法の差について\n図面の寸法と現場の寸法に5mm程度の差があります。このまま施工して問題ないでしょうか？", "外装", "外壁下地", 10],
    ],
    "demo-s7": [["notice", "床下の換気口に養生が必要です\n現在の状況だと、床下換気口に雨が吹き込みそうです。", "内装", "床仕上げ材貼り", 1]],
    "demo-s8": [["question", "給排水の配管ルート確認\n2階トイレの排水ルートを、梁を避けて変更してよいか確認したいです。", "設備", "床下配管工事（水道）", 4]],
  };
  const iso = (daysAgo, h = 17) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, 30, 0, 0);
    return d.toISOString();
  };
  const key = (daysAgo) => iso(daysAgo).slice(0, 10);

  function build() {
    const reports = [];
    const replies = [];
    PEOPLE.forEach((p) =>
      p.sites.forEach(([sid, sname, stage], si) => {
        for (let w = 0; w < 3; w++) {
          const sent = p.lastDays + w * 7 + si;
          const st = Math.max(0, stage - w * 0.35);
          const progress = GROUPS.map(([g, tc, tp], gi) => {
            const ratio = Math.max(0, Math.min(1, st - gi));
            return { group: g, checks_done: Math.round(tc * ratio), checks_total: tc, photos_done: Math.round(tp * ratio), photos_total: tp };
          });
          const cur = GROUPS[Math.min(5, Math.floor(st))][0];
          const photos = [];
          const n = 6 + ((sid.length + w) % 5);
          for (let i = 0; i < n; i++) photos.push({ id: `${sid}-${w}-${i}`, file: `demo_${ART[cur]}_${sid}_${w}_${i}.jpg`, kind: i < 2 ? "record" : "report", process: cur, date: key(sent + 1), item_id: i < 2 ? `${sid}-item` : "" });
          const notes = (NOTES[sid] || [])
            .filter(([, , , , ago]) => (w === 0 || ago >= sent) && ago < sent + 7)
            .map(([type, text, grp, item, ago, status], k) => ({ id: `${sid}-n${k}-${ago}`, type_id: type, type: { question: "疑問", notice: "気づき", request: "職人さんの要望" }[type], status: type === "question" ? status || "open" : "", resolved_at: status ? iso(ago - 1) : "", resolved_by: status ? p.name : "", text, at: iso(ago, 11), by: p.name, _item: item, _grp: grp }));
          const byItem = {};
          notes.forEach((nt) => (byItem[nt._item] = byItem[nt._item] || []).push(nt));
          const checks = Object.entries(byItem).map(([item, ns]) => ({ item_id: `${sid}-item`, item, process: `（${ns[0]._grp}）`, checked: [], notes: ns }));
          const proc = { 基礎: "地盤・基礎工事", 上棟: "大工工事（建方・上棟）", 外装: "外壁仕上げ", 内装: "仕上げ：クロス", 設備: "電気・設備配管工事", 引渡し: "引渡し" }[cur];
          checks.push({ item_id: `${sname}-c`, item: "チェック", process: proc, checked: Array.from({ length: 4 + w }, (_, i) => ({ id: `${sname}-${cur}-${(i + si * 3 + p.id.length) % 9}`, section: "チェック", text: `確認${i}`, at: iso(sent + 1) })), notes: [] });
          reports.push({
            kind: "genba-photo-report",
            schema: 4,
            sent_at: iso(sent),
            sender: p.name,
            sender_id: p.id,
            site: sname,
            site_id: sid,
            kouji_no: KOUJI[sname] || "",
            members: MEMBERS[sname] || [p.name.split(" ")[0]],
            period: { start: key(sent + 6), end: key(sent) },
            processes: [{ no: 1, name: `（${cur}）` }],
            memo: w === 0 ? "今週は予定通り進みました。来週は次の工程の段取りに入ります。" : "",
            photos,
            checks,
            progress,
          });
        }
      })
    );
    // 返信済みのサンプル（気づき1件）
    replies.push({ kind: "genba-reply", schema: 1, id: "demo-r1", note_id: "demo-s5-n0-0.5", from: "部長 木村", text: "共有ありがとう。設備屋さんに位置を確認してもらってください。", at: iso(0, 9) });
    return { reports, replies };
  }

  function photoUrl(name) {
    const m = name.match(/^demo_(g\d)_/);
    return m ? `art/${m[1]}.webp` : "";
  }
  return { build, photoUrl };
})();
