// 本物の GAS（script.google.com）の代わり。テストの間、アプリから GAS への呼び出しはすべてここで受ける。
// 本物には1回も届かない（Box・上司へのメール・共有は起きない）。届いた呼び出しは calls に残るので、テストで中身を確かめられる。
const { fakeManualPack } = require("./fake-manual");

const TEST_TOKEN = "test-token-not-real";

async function useFakeGas(page, opts = {}) {
  const calls = [];
  const manual = JSON.stringify(opts.manual || fakeManualPack());
  const CHUNK = 200000;
  const chunks = Math.ceil(manual.length / CHUNK);
  const me = opts.me || { name: "テスト監督", role: "監督", team: "テスト班" };
  // Box の受け口のふり（boxBegin → boxPut → boxSend）。送り終えたものは box.sent に残る
  const box = { jobs: {}, sent: [] };

  const answer = (body) => {
    switch (body.action) {
      case "boxBegin": {
        const uid = body.uid && box.jobs[body.uid] ? body.uid : `box-${Object.keys(box.jobs).length + 1}-test`;
        box.jobs[uid] = box.jobs[uid] || { title: body.title, names: body.names, files: {} };
        return { uid, have: Object.keys(box.jobs[uid].files).map(Number) };
      }
      case "boxPut":
        box.jobs[body.uid].files[body.i] = Buffer.from(body.data, "base64");
        return { i: body.i };
      case "boxSend": {
        const job = box.jobs[body.uid];
        const missing = job.names.map((n, i) => i).filter((i) => !job.files[i]);
        if (missing.length) return { missing };
        box.sent.push({ title: job.title, files: job.names.map((name, i) => ({ name, data: job.files[i] })) });
        return { mails: 1 };
      }
      case "manualInfo":
        return { name: "マニュアル_test.json", updated: "2026-01-01T00:00:00Z", chunks };
      case "manualChunk":
        return { data: manual.slice(body.i * CHUNK, (body.i + 1) * CHUNK) };
      case "whoami":
      case "me":
        return { me };
      default:
        // 知らない呼び出しは「受け付けた・新しいものは無い」と返す（テストごとに opts.handlers で上書きできる）
        return { items: [], cursor: body.cursor || 0, me };
    }
  };

  await page.route(/script\.google(usercontent)?\.com/, async (route) => {
    let body = {};
    try {
      body = JSON.parse(route.request().postData() || "{}");
    } catch (e) {
      /* 形の違う呼び出し */
    }
    calls.push(body);
    if (body.token !== TEST_TOKEN) return route.fulfill({ json: { ok: false, error: "unauthorized" } });
    const custom = opts.handlers && opts.handlers[body.action];
    const out = custom ? await custom(body) : answer(body);
    return route.fulfill({ json: { ok: true, ...out } });
  });
  return { calls, box, token: TEST_TOKEN };
}

module.exports = { useFakeGas, TEST_TOKEN };
