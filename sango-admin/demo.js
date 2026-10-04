"use strict";
/* デモデータ（架空）。フォルダを読み込まなくても画面を試せるようにするためのもの。実データではない */
async function makeDemo() {
  const mkPhoto = (label, hue) => new Promise((res) => {
    const c = document.createElement("canvas");
    c.width = 640; c.height = 480;
    const x = c.getContext("2d");
    x.fillStyle = `hsl(${hue}, 35%, 72%)`; x.fillRect(0, 0, 640, 480);
    x.fillStyle = `hsl(${hue}, 35%, 40%)`; x.fillRect(80, 120, 480, 260);
    x.fillStyle = "#fff"; x.font = "bold 56px sans-serif"; x.textAlign = "center"; x.fillText(label, 320, 270);
    c.toBlob((b) => res(new File([b], `demo_${label}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.8);
  });
  const photoFiles = new Map();
  for (const [i, l] of ["写真A", "写真B", "写真C"].entries()) {
    const f = await mkPhoto(l, 90 + i * 60);
    photoFiles.set(f.name, f);
  }
  const names = [...photoFiles.keys()];
  const B = { haru: "サンプル棟1", kou: "サンプル棟2", wa: "サンプル棟3", larch: "サンプル店舗", botanical: "サンプル温室", gaiko: "外構" };
  const C = { "CAT-01": "水回り", "CAT-02": "電気", "CAT-03": "建具", "CAT-04": "内装", "CAT-09": "通信・Wi-Fi", "CAT-11": "空調・換気" };
  const items = [
    ["haru", "CAT-01", "洗面の排水がつまって水が流れにくい", "業者へ連絡。トラップを清掃して改善。", "サンプル設備工業", 2],
    ["kou", "CAT-02", "玄関の照明が点かない", "電気業者が来訪、安定器を交換。", "サンプル電気", 2],
    ["wa", "CAT-03", "玄関ドアが閉まりづらい", "蝶番を調整して解消。", "サンプル建具店", 3],
    ["larch", "CAT-11", "暖房が作動しない", "リモコンの電池切れと判明。", "自分で対応", 1],
    ["botanical", "CAT-09", "Wi-Fiがつながりにくい", "ルーターを再起動、中継機を増設予定。", "サンプル通信", 1],
    ["gaiko", "CAT-04", "園路の照明カバーが割れた", "代替品を手配中。", "未定", 3],
    ["haru", "CAT-11", "浴室の換気扇から異音", "清掃しても改善せず、交換見積もり依頼。", "サンプル設備工業", 2],
    ["kou", "CAT-01", "キッチンの水栓からポタポタ水漏れ", "パッキン交換。", "サンプル設備工業", 3],
    ["wa", "CAT-02", "外灯がチカチカする", "", "サンプル電気", 0],
    ["larch", "CAT-03", "引き戸のレールに砂がかみ重い", "清掃とレール潤滑。", "自分で対応", 1],
  ];
  const leaders = ["リーダーA", "リーダーB"], reporters = ["スタッフ1", "スタッフ2", "スタッフ3", ""];
  const records = [];
  const now = Date.now();
  for (let i = 0; i < 26; i++) {
    const it = items[i % items.length];
    const d = new Date(now - (i * 11 + 1) * 86400000 * (1 + (i % 3) * 0.3));
    records.push({
      id: `demo${i}`, building_id: it[0], building: B[it[0]], category_id: it[1], category: C[it[1]],
      what: it[2] + (i >= items.length ? `（${Math.floor(i / items.length) + 1}回目）` : ""), how: it[3], vendor: it[4], reporter: reporters[i % 4],
      created_at: d.toISOString(), updated_at: d.toISOString(),
      photos: Array.from({ length: it[5] }, (_, k) => ({ file: names[(i + k) % 3], taken_at: d.toISOString() })),
      _sender: leaders[i % 2],
    });
  }
  const past = [
    ["haru", "CAT-01", "給湯器にエラーが表示された", "メーカーに点検を依頼、部品交換で復旧。", "サンプル設備工業", 38500, "経年劣化"],
    ["kou", "CAT-02", "ブレーカーが落ちる", "漏電箇所を特定し配線を修理。", "サンプル電気", 22000, "施工不良"],
    ["wa", "CAT-03", "サッシの結露がひどい", "窓周りのコーキングを打ち直し。", "サンプル建具店", 15000, "経年劣化"],
    ["larch", "CAT-04", "壁のクロスが剥がれた", "部分張り替え。", "サンプル内装", 9800, "使い方"],
    ["gaiko", "CAT-04", "ウッドデッキが腐食", "一部張り替え、防腐塗装。", "サンプル外構", 64000, "経年劣化"],
    ["botanical", "CAT-09", "Wi-Fi機器の故障", "機器交換。", "サンプル通信", 31000, "不明"],
  ].map((p, i) => ({
    id: `past${i}`, source: "past", building_id: p[0], building: B[p[0]], category_id: p[1], category: C[p[1]], what: p[2], how: p[3], vendor: p[4],
    amount: p[5], cause: p[6], created_at: new Date(now - (400 + i * 40) * 86400000).toISOString(), photos: [],
  }));
  return { records, past, photoFiles, senderOf: (r) => r._sender };
}
