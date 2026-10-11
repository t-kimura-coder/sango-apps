"use strict";
/* 合言葉（人ごと）・業者データの自動受け取り・質問/要望（リーダー用）。app.js の getSetting/setSetting, dbGet/dbPut, normMaster, master, toast, openSheet, esc, render を使う。
   合言葉を入れると、窓口が「誰か」を教えてくれる（苗字・役割）。業者データも窓口から受け取る（Box のファイルや共有シートは使わない）。 */

const ROLE_LABEL = { "リーダー": "リーダー", "管理者": "管理者", "本社": "本社", "設計者": "設計者" };

/** 窓口を、指定した合言葉で呼ぶ（まだ保存していない合言葉の確認にも使う） */
async function acall(token, body, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms || 30000);
  try {
    const res = await netFetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ token, ...body }), signal: ctl.signal, redirect: "follow" });
    let j;
    try { j = await res.json(); } catch (e) { throw new Error("窓口の応答が不正です（" + res.status + "）。電波を確認してください"); }
    if (!j.ok) throw new Error(j.error || "窓口からの返事が不正です");
    return j;
  } finally { clearTimeout(timer); }
}

/** 窓口から、最新の業者データを受け取る。変わっていなければ何もしない（true＝入れ替えた） */
async function masterPull(force) {
  const token = getSetting("token");
  if (!token) return false;
  const info = await acall(token, { action: "masterInfo" });
  const cur = await dbGet("meta", "master");
  if (!force && cur && cur.src === info.updated && cur.data && cur.data.version === info.version) return false;
  const got = await acall(token, { action: "masterGet" }, 60000);
  const data = normMaster(got.data);
  await dbPut("meta", { key: "master", data, importedAt: Date.now(), src: got.updated });
  master = data;
  return true;
}

/** 合言葉を入れて、つなぐ。ok なら { name, given, role } を返す */
async function accountLogin(raw) {
  const t = String(raw || "").trim();
  if (t.length < 32) throw new Error("合言葉が短すぎます。コピーし損ねていないか、確認してください");
  let who;
  try { who = await acall(t, { action: "whoami" }); }
  catch (e) { throw new Error(/unauthorized/.test(String(e.message)) ? "合言葉が違います（または、止められています）" : e.message); }
  if (!who.caps || who.caps.indexOf("submit") < 0) throw new Error("この合言葉は、このアプリでは使えません（役割：" + who.role + "）");
  if (who.legacy) throw new Error("共通の合言葉ではなく、自分の合言葉を入れてください");
  setSetting("token", t);
  setSetting("tokenBad", "");
  setSetting("name", who.name || "");
  setSetting("role", who.role || "");
  if (who.given && !getSetting("given")) setSetting("given", who.given);
  await masterPull(true);
  return who;
}

/** 起動した時・戻ってきた時：合言葉が今も使えるか確かめ、業者データを最新にする。失敗しても、他の機能は使える */
let accountChecked = 0;
async function accountStart(force) {
  const token = getSetting("token");
  if (!token || (!force && Date.now() - accountChecked < 10 * 60 * 1000)) return;
  accountChecked = Date.now();
  try {
    const who = await acall(token, { action: "whoami" }, 20000);
    setSetting("name", who.name || getSetting("name")); setSetting("role", who.role || ""); setSetting("tokenBad", "");
    if (await masterPull(false)) { toast("業者データを更新しました"); render(); }
  } catch (e) {
    if (/unauthorized/.test(String(e.message))) { setSetting("tokenBad", "1"); toast("合言葉が使えなくなっています。設定で、新しい合言葉を入れてください"); if (route().name === "settings" || route().name === "home") render(); }
  }
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) accountStart(false); });

/* ---------- 最初の画面（業者データがまだ無い時） ---------- */
function renderLogin(box) {
  box.innerHTML = `<div class="empty" style="margin-top:12px;text-align:left"><b style="font-size:16px">合言葉を入れてください</b>
    <div class="mutedText" style="margin:6px 0 10px">木村から受け取った、あなたの合言葉を入れると、業者データが自動で入ります。</div>
    <input class="textInput" id="lgToken" type="password" autocomplete="off" placeholder="あなたの合言葉">
    <button class="btn btnPrimary" id="lgGo" style="width:100%;margin-top:10px">つないで受け取る</button>
    <div id="lgMsg" class="mutedText" style="margin-top:8px;color:var(--warn)"></div>
    <div class="mutedText" style="margin-top:12px;text-align:center"><a href="#/settings" style="text-decoration:underline">ファイルから取り込む（予備）</a></div></div>`;
  $("lgGo").onclick = async () => {
    $("lgGo").disabled = true; $("lgMsg").textContent = "";
    try { const who = await accountLogin($("lgToken").value); toast(`${who.name}さん、つながりました`); await render(); if (typeof maybeStartTour === "function") maybeStartTour(); }
    catch (e) { $("lgMsg").textContent = e.message; $("lgGo").disabled = false; }
  };
}

/* ---------- 設定の「あなたの合言葉」「業者データ」「質問・要望」 ---------- */
function accountSettingsHtml(meta) {
  const t = getSetting("token"), bad = !!getSetting("tokenBad");
  const status = t ? (bad ? `<span class="statusWarn">合言葉が使えなくなっています</span>（止められたか、出し直されました。新しい合言葉を入れてください）` : `<span class="statusOk">つながっています</span>　${esc(getSetting("name"))}さん（${esc(getSetting("role"))}）`) : `<span class="statusWarn">まだ入っていません</span>`;
  return `<div class="settingSec"><h3>あなたの合言葉</h3><div class="formCard">
      <div style="margin-bottom:8px">${status}</div>
      <input class="textInput" id="acToken" type="password" autocomplete="off" placeholder="${t ? "合言葉を入れ直す時だけ入れる" : "あなたの合言葉"}">
      <button class="btn btnPrimary" id="acGo" style="width:100%;margin-top:8px">${t ? "入れ直す" : "つないで受け取る"}</button>
      <div id="acMsg" class="mutedText" style="margin-top:6px;color:var(--warn)"></div>
      <div class="fieldLabel" style="margin-top:12px">名前（下の名前）<span class="opt">任意</span></div>
      <input class="textInput" id="acGiven" maxlength="20" placeholder="同じ苗字の人と区別するため" value="${esc(getSetting("given"))}">
      <div class="mutedText" style="margin-top:6px">苗字は、合言葉で決まっています（変えられません）。</div></div></div>
    <div class="settingSec"><h3>業者データ</h3><div class="formCard">
      <div class="mutedText">${t ? "窓口から、自動で最新が入ります（アプリを開いた時）。" : "合言葉を入れると、自動で入ります。"}</div>
      <div style="margin:10px 0">${meta ? `<span class="statusOk">入っています</span>　版 ${esc(meta.data.version)}／建物${meta.data.buildings.length}／${fmtDate(meta.importedAt)}` : `<span class="statusWarn">まだ入っていません</span>`}</div>
      ${t ? `<button class="btn" id="acPull" style="width:100%">いま最新にする</button>` : ""}
      <button class="btn" id="sImport" style="width:100%;margin-top:8px;font-weight:400">ファイルから取り込む（予備）</button></div></div>
    <div class="settingSec"><h3>質問・要望・不具合</h3><div class="formCard"><div class="mutedText">困ったこと、直してほしいことを、木村に送れます。</div>
      <button class="btn" id="fbOpen" style="width:100%;margin-top:8px" ${t ? "" : "disabled"}>質問・要望を送る</button></div></div>`;
}
function wireAccountSettings() {
  $("acGo").onclick = async () => {
    const v = $("acToken").value; if (!v.trim()) { $("acMsg").textContent = "合言葉を入れてください"; return; }
    $("acGo").disabled = true; $("acMsg").textContent = "";
    try { const who = await accountLogin(v); toast(`${who.name}さん、つながりました`); render(); }
    catch (e) { $("acMsg").textContent = e.message; $("acGo").disabled = false; }
  };
  $("acGiven").onchange = (e) => { setSetting("given", e.target.value.trim()); toast("保存しました"); };
  const pull = $("acPull"); if (pull) pull.onclick = async () => { pull.disabled = true; try { const ch = await masterPull(true); toast(ch ? "業者データを更新しました" : "最新です"); render(); } catch (e) { toast("受け取れませんでした：" + String(e.message).slice(0, 50)); pull.disabled = false; } };
  $("fbOpen").onclick = openFeedback;
}

/* ---------- 質問・要望を送る ---------- */
function openFeedback() {
  openSheet("質問・要望・不具合を送る", (body, close) => {
    body.innerHTML = `<div class="segRow" id="fbKind">${["質問", "要望", "不具合", "その他"].map((k, i) => `<button class="segBtn${i === 0 ? " on ok" : ""}" data-v="${k}">${k}</button>`).join("")}</div>
      <textarea id="fbText" maxlength="1000" style="margin-top:10px" placeholder="例）点検の画面で、○○が出ません"></textarea>
      <div class="mutedText">画面の名前や、何をした時かを書くと、早く直せます。</div>
      <div class="btnCol" style="margin-top:10px"><button class="btn btnPrimary" id="fbSend">送る</button><button class="btn" id="fbNo">やめる</button></div><div id="fbMsg" class="mutedText" style="color:var(--warn)"></div>`;
    let kind = "質問";
    body.querySelectorAll("#fbKind .segBtn").forEach((b) => (b.onclick = () => { kind = b.dataset.v; body.querySelectorAll("#fbKind .segBtn").forEach((x) => (x.className = "segBtn" + (x === b ? " on ok" : ""))); }));
    $("fbNo").onclick = close;
    $("fbSend").onclick = async () => {
      const text = $("fbText").value.trim(); if (!text) { $("fbMsg").textContent = "内容を入れてください"; return; }
      $("fbSend").disabled = true;
      try { await acall(getSetting("token"), { action: "feedback", kind, text, app: "leader", app_version: APP_VERSION }, 30000); close(); toast("送りました。ありがとうございます"); }
      catch (e) { $("fbMsg").textContent = "送れませんでした：" + String(e.message).slice(0, 60); $("fbSend").disabled = false; }
    };
  });
}

/** 業者データがまだ無い時のホーム：合言葉が無ければ入力欄、合言葉があれば「受け取る」ボタン */
function renderNoMaster(box) {
  if (!getSetting("token")) return renderLogin(box);
  box.innerHTML = `<div class="empty" style="margin-top:12px"><b>業者データを受け取れていません</b><div class="mutedText" style="margin:6px 0 10px">電波のある所で、もう一度試してください。</div>
    <button class="btn btnPrimary" id="nmPull">いま受け取る</button> <button class="btn" id="nmSet">設定を開く</button><div id="nmMsg" class="mutedText" style="margin-top:8px;color:var(--warn)"></div></div>`;
  $("nmSet").onclick = () => go("#/settings");
  $("nmPull").onclick = async () => { $("nmPull").disabled = true; try { await masterPull(true); render(); } catch (e) { $("nmMsg").textContent = /unauthorized/.test(e.message) ? "合言葉が使えなくなっています。設定で、新しい合言葉を入れてください" : "受け取れませんでした：" + String(e.message).slice(0, 60); $("nmPull").disabled = false; } };
}
