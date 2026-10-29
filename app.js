const $ = (id) => document.getElementById(id);
let verified = false;
let requiredChannels = [];
const say = (msg, type = "") => { $("notice").textContent = msg; $("notice").className = `notice ${type}`; };
async function api(path, body) {
  const r = await fetch(path, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body || {})});
  const data = await r.json().catch(()=>({error:"Server returned an invalid response"}));
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
$("joinBtn").onclick = async () => {
  try {
    say("Loading required channels…");
    const data = await api("/api/config", {});
    requiredChannels = data.channels || [];
    $("channels").innerHTML = requiredChannels.map(c => `<div class="channel"><span>${escapeHtml(c.title)}</span><a href="${escapeAttr(c.url)}" target="_blank" rel="noopener">JOIN ↗</a></div>`).join("");
    $("verifyBtn").hidden = false;
    if (!requiredChannels.length) say("No force-join channels are configured yet. Set FORCE_JOIN_CHANNELS in Vercel Project Settings → Environment Variables.");
    else say("Join every channel above, then tap Verify Telegram Membership. Telegram verification requires a Telegram user identity; configure the verification method before production use.");
  } catch(e) { say(e.message, "error"); }
};
$("verifyBtn").onclick = async () => {
  say("This starter requires Telegram Login Widget verification to verify each visitor's account. Configure TELEGRAM_BOT_TOKEN and the Telegram Login Widget before enabling force-join.");
};
$("sendBtn").onclick = async () => {
  const uid = $("uid").value.trim();
  const region = $("region").value;
  if (!/^\d{5,24}$/.test(uid)) return say("Please enter a valid numeric Player UID.", "error");
  if (requiredChannels.length && !verified) return say("Please complete Telegram force-join verification first.", "error");
  $("sendBtn").disabled = true; say("Sending request…");
  try {
    const data = await api("/api/send-likes", {uid, region});
    $("result").hidden = false;
    $("result").className = "card report";
    $("result").textContent = data.report || "Request completed.";
    say(data.message || "Request processed.");
  } catch(e) {
    if (e.message.includes("DAILY_LIMIT_REACHED")) {
      $("result").hidden = false; $("result").className = "card report error";
      $("result").textContent = "🔥 DAILY LIMIT REACHED 🚫\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📊 Aapne aaj ka limit use kar liya.\n🔢 Limit: 1 per day\n✅ Used: 1\n📅 Kal wapas try karo.";
    }
    say(e.message, "error");
  } finally { $("sendBtn").disabled = false; }
};
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(s){return escapeHtml(s);}
