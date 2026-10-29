const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const json = (res, statusCode, payload) => res.status(statusCode).setHeader("Cache-Control","no-store").json(payload);
const safe = (v) => String(v ?? "").replace(/[<>]/g,"").slice(0,120);
function getCounts(data) {
  const d = data?.data || data?.result || data;
  const before = Number(d?.before ?? d?.likes_before ?? d?.likesBefore);
  const after = Number(d?.after ?? d?.likes_after ?? d?.likesAfter);
  const added = Number(d?.likes_added ?? d?.likesAdded ?? (Number.isFinite(before)&&Number.isFinite(after)?after-before:NaN));
  return {before,after,added,player:safe(d?.nickname ?? d?.player_name ?? d?.name ?? "Player")};
}
module.exports = async (req, res) => {
  if (req.method !== "POST") return json(res,405,{error:"Method not allowed"});
  let body; try { body=req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}"); } catch { return json(res,400,{error:"Invalid JSON"}); }
  const uid = String(body.uid || "").trim(), region = String(body.region || "IND").trim().toUpperCase();
  if (!/^\d{5,24}$/.test(uid) || !/^[A-Z]{2,4}$/.test(region)) return json(res,400,{error:"Invalid UID or region."});
  const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,TELEGRAM_BOT_TOKEN} = process.env;
  const LIKE_API_URL = process.env.LIKE_API_URL || "https://likeapiindbd.vercel.app/like?uid={uid}&server_name={server}";
  const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "-1004342336431";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json(res,500,{error:"Database is not configured. Add Supabase environment variables."});
  const db = createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const day = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const id = crypto.createHash("sha256").update(`${day}:${uid}:${region}`).digest("hex");
  // Check existing daily use before calling the provider API.
  const {data: existing, error: checkError} = await db.from("daily_likes").select("id").eq("request_key",id).maybeSingle();
  if (checkError) return json(res,500,{error:"Could not check daily limit. Please try again later."});
  if (existing) return json(res,429,{error:"DAILY_LIMIT_REACHED"});
  // Call the provider, then save the successful request.
  const template = LIKE_API_URL.replace(/\{uid\}/g, encodeURIComponent(uid)).replace(/\{server\}/g, encodeURIComponent(region));
  const apiUrl = new URL(template);
  apiUrl.searchParams.set("uid",uid); apiUrl.searchParams.set("server_name",region);
  let upstream;
  try {
    const resp = await fetch(apiUrl.toString(),{method:"GET",headers:{"Accept":"application/json"},signal:AbortSignal.timeout(15000)});
    upstream = await resp.json().catch(()=>({}));
    if (!resp.ok || upstream.success === false || upstream.status === "failed" || upstream.error) {
      return json(res,502,{error:safe(upstream.message || upstream.error || "Like API request failed. Limit was not used.")});
    }
  } catch(e) { return json(res,502,{error:"Like API could not be reached. Limit was not used."}); }
  const counts = getCounts(upstream);
  // Unique key is enforced by the database; duplicate submissions are rejected.
  const {error:insertError} = await db.from("daily_likes").insert({request_key:id, uid, region, request_date:day, api_response:upstream});
  if (insertError) {
    if (insertError.code === "23505") return json(res,429,{error:"DAILY_LIMIT_REACHED"});
    return json(res,500,{error:"Could not save request limit. Contact the site owner."});
  }
  const dateText = new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric"}).format(new Date());
  const timeText = new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hour12:true}).format(new Date());
  const before = Number.isFinite(counts.before)?counts.before:"N/A";
  const after = Number.isFinite(counts.after)?counts.after:"N/A";
  const added = Number.isFinite(counts.added)?counts.added:"N/A";
  const report = `🚀 𝗠𝗔𝗡𝗨𝗔𝗟 𝗟𝗜𝗞𝗘 𝗥𝗘𝗣𝗢𝗥𝗧 🚀\n━━━━━━━━━━━━━━━━━━━━━━━━\n👤 Player  : ${counts.player}\n🆔 UID     : ${uid}\n🌍 Region  : ${region}\n━━━━━━━━━━━━━━━━━━━━━━━━\n📊 Before  : ${before}\n📈 After   : ${after}\n🎯 Likes   : +${added}\n━━━━━━━━━━━━━━━━━━━━━━━━\n[▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱] ${added}\n━━━━━━━━━━━━━━━━━━━━━━━━\n⚡ Powered by @Sarkargggg\n🕐 ${dateText} | ${timeText} IST\n👑 STATUS : SUCCESS ✅`;
  if (TELEGRAM_BOT_TOKEN && LOG_CHANNEL_ID) {
    try {
      const logResp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({chat_id:LOG_CHANNEL_ID,text:report})
      });
      if (!logResp.ok) console.error("Telegram log delivery failed", await logResp.text());
    } catch(e) { console.error("Telegram log delivery failed", e.message); }
  }
  return json(res,200,{success:true,message:"Like request successful.",report});
};