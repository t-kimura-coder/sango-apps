/* 点検の期限・状態の計算。リーダー・管理者・本社で同じファイルを使う（直す時は、3つのアプリに同じものを置く）
 *   IC.planOf(item)          … 標準の予定月（管理者が変えた月 plan があれば、それ）
 *   IC.due(item, last)       … 前回の実施日（YYYY-MM-DD）から、次の期限。記録がなければ null
 *   IC.freqOf(item)          … m1（毎月）／m3／m6／y1（年1回）／season（季節）
 *   IC.index(logs)           … 記録を「項目|建物」ごとに、新しい順にまとめる（図のピンを描く時に1回だけ作る）
 *   IC.pinStatus(itemsById, idx, bid, eq)  … 図のピン1つの状態
 *       st＝over（期限超過）／soon（期限が今月。リーダーの「今月やること」と同じ）／done（済・次の予定）／none（まだ記録なし）／na（この建物に項目なし）
 *       hist＝この機器に印が付いた記録（点検の時期は、項目×建物でまとめて決まる）
 */
(function () {
  var pad = function (n) { return String(n).padStart(2, "0"); };
  var parse = function (s) { var p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  var fmt = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var today = function () { return fmt(new Date()); };
  function planOf(it) {
    if (Array.isArray(it.plan) && it.plan.length) return it.plan;
    var c = it.cycle || {};
    if (c.type === "season") return c.months || [];
    var n = c.n || 12;
    return n === 1 ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : n === 3 ? [1, 4, 7, 10] : n === 6 ? [5, 11] : [4];
  }
  function addMonths(s, n) { // 月末をはみ出さないように足す（1/31 + 1か月 = 2/28）
    var d = parse(s), day = d.getDate(), t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    t.setDate(Math.min(day, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
    return fmt(t);
  }
  function due(item, last) {
    if (!last) return null;
    var pl = planOf(item);
    if (pl.length < 12) { // 予定月が決まっている：前回の実施を含む予定月の、次の予定月の末日が期限
      var ly = parse(last).getFullYear(), ds = [];
      for (var y = ly - 1; y <= ly + 3; y++) pl.forEach(function (m) { ds.push(fmt(new Date(y, m, 0))); });
      ds.sort();
      var cover = ds.find(function (d) { return d >= last; });
      return ds.find(function (d) { return d > cover; }) || null;
    }
    return addMonths(last, 1); // 毎月
  }
  function freqOf(it) {
    var c = it.cycle || {};
    if (c.type === "season") return "season";
    var n = c.n || 12;
    return n <= 1 ? "m1" : n <= 3 ? "m3" : n <= 6 ? "m6" : "y1";
  }
  var desc = function (a, b) { return a.done_on < b.done_on ? 1 : a.done_on > b.done_on ? -1 : 0; };
  function index(logs) {
    var m = new Map();
    (logs || []).forEach(function (l) { var k = l.item_id + "|" + l.building_id; if (!m.has(k)) m.set(k, []); m.get(k).push(l); });
    m.forEach(function (v) { v.sort(desc); });
    return m;
  }
  var itemId = function (no) { return "I" + pad(no || 0); };
  function pinStatus(itemsById, idx, bid, eq) {
    var it = eq.insp ? itemsById[itemId(eq.insp)] : null;
    if (!it || !it.enabled || (it.buildings || []).indexOf(bid) < 0) return { st: "na", freq: "" };
    var logs = idx.get(it.id + "|" + bid) || [];
    var last = logs.find(function (l) { return l.result !== "pending"; }) || null, d = due(it, last && last.done_on), t = today();
    var st = !d ? "none" : d < t ? "over" : d.slice(0, 7) === t.slice(0, 7) ? "soon" : "done";
    return { st: st, freq: freqOf(it), item: it, title: it.title, cycle: (it.cycle || {}).label || "", last: last, due: d,
      hist: logs.filter(function (l) { return (l.equip || []).some(function (e) { return e.id === eq.id; }); }) };
  }
  function byId(items) { var o = {}; (items || []).forEach(function (it) { o[it.id] = it; }); return o; }
  window.IC = { planOf: planOf, due: due, freqOf: freqOf, index: index, pinStatus: pinStatus, byId: byId, itemId: itemId };
})();
