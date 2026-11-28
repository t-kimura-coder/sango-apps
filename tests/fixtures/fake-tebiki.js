// テスト用の作りものの標準施工手引書パック（本物の手引書は社内資料なので、このリポジトリには入れない）。
// 本物と同じ形（genba-tebiki-pack・schema 1）で、ページは3枚だけ。図は 60×40 の白いPNG（その場で作る）。文字はすべて作りもの。
const zlib = require("zlib");

function crc32(buf) {
  let c,
    crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
// 幅 w・高さ h の白い PNG を data URL で返す（gray は明るさ 0〜255）
function pngDataUrl(w, h, gray = 255) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8bit
  ihdr[9] = 0; // グレー
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w, gray)]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
  return "data:image/png;base64," + png.toString("base64");
}

const line = (t, b) => ({ t, b });

function fakeTebikiPack() {
  const img = pngDataUrl(60, 40);
  const thumb = pngDataUrl(30, 20, 230);
  const pages = [
    {
      no: "101",
      chapter: "テスト基礎工事",
      title: "Ⅰ：テスト配筋",
      heads: [
        { t: "テスト配筋の基準", lv: 0, at: null },
        { t: "Ａ：テストかぶり厚さ", lv: 1, at: [0.1, 0.1, 0.5, 0.18] },
        { t: "スペーサー間隔", lv: 2, at: [0.1, 0.3, 0.5, 0.38] },
      ],
      lines: [line("かぶり厚さは40mm以上", [0.1, 0.1, 0.5, 0.15]), line("かぶり厚さを確かめる", [0.1, 0.5, 0.5, 0.55]), line("スペーサーは1m間隔", [0.1, 0.3, 0.5, 0.35])],
      items: ["2"],
    },
    {
      no: "102",
      chapter: "テスト基礎工事",
      title: "Ⅱ：テストアンカー",
      heads: [{ t: "Ａ：アンカーボルトの位置", lv: 1, at: [0.2, 0.2, 0.6, 0.3] }],
      lines: [line("アンカーボルトの位置を測る", [0.2, 0.2, 0.6, 0.25]), line("かぶり厚さの参考", [0.2, 0.6, 0.6, 0.65])],
      items: ["1", "2"],
    },
    {
      no: "201",
      chapter: "テスト木工事",
      title: "Ⅰ：テスト建て方",
      heads: [{ t: "Ａ：建て方の手順", lv: 1, at: null }],
      lines: [line("建て方の通りを確かめる", [0.3, 0.3, 0.7, 0.35])],
      items: ["999"], // マニュアルのどの項目にも当たらないページ
    },
  ].map((p) => ({ ...p, img, thumb }));
  return { kind: "genba-tebiki-pack", schema: 1, version: "test-t1", title: "テスト用 標準施工手引書", source: "テスト", built_at: "2026-01-01T00:00:00", pages };
}

module.exports = { fakeTebikiPack, pngDataUrl };
