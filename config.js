module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const raw = process.env.FORCE_JOIN_CHANNELS || "Free Fire Likes & TCP Bot|https://t.me/freefirelikesandtcpbot";
  const channels = raw.split(",").map(x=>x.trim()).filter(Boolean).map(item=>{
    const [title,url] = item.split("|");
    return {title:title || "Required Telegram Channel", url:url || "https://t.me/"};
  });
  res.status(200).json({channels,botUsername:process.env.TELEGRAM_BOT_USERNAME || "@SAARKARLIKEBOT"});
};
