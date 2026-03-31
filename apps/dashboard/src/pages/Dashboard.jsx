import { useState, useEffect } from "react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');`;

const css = `
  ${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080809;
    --surface: #0e0e11;
    --border: #1a1a20;
    --border2: #242430;
    --text: #e8e8f0;
    --muted: #52526a;
    --accent: #e8ff47;
    --accent2: #ff4f47;
    --accent3: #47b4ff;
    --green: #3ddc84;
    --font-display: 'Syne', sans-serif;
    --font-mono: 'DM Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-display); overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; } 
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
  @keyframes blink { 0%,100% { opacity:1; } 49% { opacity:1; } 50% { opacity:0; } }

  .fade-up { animation: fadeUp 0.4s ease both; }
  .fade-up-1 { animation: fadeUp 0.4s 0.05s ease both; }
  .fade-up-2 { animation: fadeUp 0.4s 0.1s ease both; }
  .fade-up-3 { animation: fadeUp 0.4s 0.15s ease both; }
  .fade-up-4 { animation: fadeUp 0.4s 0.2s ease both; }
  .fade-up-5 { animation: fadeUp 0.4s 0.25s ease both; }

  .live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--green); animation: pulse 1.5s infinite; }
  .cursor-blink { animation: blink 1s step-end infinite; }

  .btn {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-primary { background: var(--accent); color: #000; font-weight: 500; }
  .btn-primary:hover { background: #fff; transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border2); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: transparent; color: var(--accent2); border: 1px solid var(--accent2)22; }
  .btn-danger:hover { background: var(--accent2)22; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: var(--border2); }

  .tag {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 3px;
  }
  .tag-green { background: var(--green)18; color: var(--green); }
  .tag-yellow { background: var(--accent)18; color: var(--accent); }
  .tag-red { background: var(--accent2)18; color: var(--accent2); }
  .tag-blue { background: var(--accent3)18; color: var(--accent3); }
  .tag-muted { background: var(--border); color: var(--muted); }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; border-radius: 6px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.02em;
    cursor: pointer; transition: all 0.15s; color: var(--muted);
    border: 1px solid transparent;
  }
  .nav-item:hover { color: var(--text); background: var(--border)88; }
  .nav-item.active { color: var(--accent); background: var(--accent)0f; border-color: var(--accent)22; }

  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 20px 24px;
    position: relative; overflow: hidden;
  }
  .stat-card::after {
    content: ''; position: absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, var(--accent)44, transparent);
  }

  .opportunity-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 24px;
    transition: all 0.2s; cursor: pointer; position: relative; overflow: hidden;
  }
  .opportunity-card:hover { border-color: var(--accent)44; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(232,255,71,0.06); }
  .opportunity-card.hot::before {
    content: ''; position:absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, var(--accent2), var(--accent));
  }

  .score-ring {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-mono); font-size: 15px; font-weight: 500;
    position: relative; flex-shrink: 0;
  }

  .channel-row {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 120px;
    align-items: center; padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s; gap: 16px;
  }
  .channel-row:hover { background: var(--border)44; }
  .channel-row:last-child { border-bottom: none; }

  .platform-icon {
    width: 22px; height: 22px; border-radius: 5px;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
  }

  .progress-bar {
    height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-top: 6px;
  }
  .progress-fill {
    height: 100%; border-radius: 2px;
    transition: width 0.6s ease;
  }

  .queue-item {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 20px; border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .queue-item:hover { background: var(--border)44; }

  input, textarea, select {
    background: var(--bg); border: 1px solid var(--border2);
    color: var(--text); font-family: var(--font-mono); font-size: 12px;
    border-radius: 6px; padding: 10px 14px; width: 100%; outline: none;
    transition: border-color 0.15s;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--accent)66; }
  input::placeholder, textarea::placeholder { color: var(--muted); }
  label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); display: block; margin-bottom: 6px; }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center; z-index: 100;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 12px; padding: 32px; width: 540px; max-width: 95vw;
    max-height: 90vh; overflow-y: auto;
    animation: fadeUp 0.25s ease;
  }

  .analytics-bar {
    display: flex; align-items: flex-end; gap: 4px; height: 60px;
  }
  .analytics-bar-item {
    flex: 1; border-radius: 3px 3px 0 0;
    transition: all 0.3s ease; cursor: pointer;
    position: relative;
  }
  .analytics-bar-item:hover { filter: brightness(1.3); }
`;

const OPPORTUNITIES = [
  { id:1, score:96, name:"QuietLux", niche:"Soft Life & Quiet Luxury", trend:"+412%", competition:"Low", cpm:"$18–28", format:"60s aesthetic reels, no face", time:"3–4 months", hot:true, drafts:5, platforms:["YT","IG","TT"], why:"'Quiet luxury' exploding on all platforms. Low saturation, high CPM fashion niche." },
  { id:2, score:91, name:"AIExplained", niche:"AI Tools & Automation", trend:"+280%", competition:"Medium", cpm:"$12–22", format:"90s screen-record tutorials", time:"4–5 months", hot:true, drafts:5, platforms:["YT","IG","TT"], why:"Every business owner wants to learn AI. Massive search volume, sticky audience." },
  { id:3, score:87, name:"MindReset", niche:"5-Min Morning Routines", trend:"+195%", competition:"Low", cpm:"$8–14", format:"60s voiceover + b-roll", time:"3–4 months", hot:false, drafts:5, platforms:["YT","IG","TT"], why:"Morning routine content surging post-new year. Evergreen + trending = perfect combo." },
  { id:4, score:79, name:"EarthFacts", niche:"Surprising Geography Facts", trend:"+140%", competition:"Low", cpm:"$6–10", format:"60s animated map + voice", time:"5–6 months", hot:false, drafts:5, platforms:["YT","TT"], why:"Geography content going viral on TikTok. Easy to produce, high volume potential." },
];

const CHANNELS = [
  { id:1, name:"WealthWire", niche:"Personal Finance", status:"active", subs:3420, videos:47, revenue:124, goal:1000, nextUpload:"2h 14m", emoji:"💰", platforms:["YT","IG","TT"], views:284000, avgViews:6042, health:88 },
  { id:2, name:"MindScape", niche:"Meditation", status:"active", subs:8910, videos:112, revenue:389, goal:1000, nextUpload:"45m", emoji:"🧘", platforms:["YT","IG","TT"], views:920000, avgViews:8214, health:94 },
  { id:3, name:"TechIn60", niche:"Tech News", status:"active", subs:2100, videos:31, revenue:67, goal:1000, nextUpload:"5h 02m", emoji:"⚡", platforms:["YT","TT"], views:142000, avgViews:4580, health:72 },
  { id:4, name:"FunFactFuel", niche:"Facts & Trivia", status:"paused", subs:1200, videos:28, revenue:0, goal:1000, nextUpload:"Paused", emoji:"🧠", platforms:["YT"], views:48000, avgViews:1714, health:31 },
];

const QUEUE = [
  { id:1, channel:"MindScape", emoji:"🧘", title:"5 Breathing Tricks to Stop Anxiety Instantly", platform:"YT", time:"Today 6:00 PM", status:"ready" },
  { id:2, channel:"WealthWire", emoji:"💰", title:"The 50/30/20 Rule Nobody Talks About", platform:"IG", time:"Today 8:00 PM", status:"ready" },
  { id:3, channel:"TechIn60", emoji:"⚡", title:"Claude just beat GPT-4 at coding — here's proof", platform:"TT", time:"Today 9:00 PM", status:"generating" },
  { id:4, channel:"MindScape", emoji:"🧘", title:"Why You Feel Tired Even After 8 Hours Sleep", platform:"YT", time:"Tomorrow 7:00 AM", status:"ready" },
  { id:5, channel:"WealthWire", emoji:"💰", title:"3 Assets That Protect You During Inflation", platform:"YT", time:"Tomorrow 12:00 PM", status:"queued" },
  { id:6, channel:"TechIn60", emoji:"⚡", title:"Google's new AI model changes everything", platform:"IG", time:"Tomorrow 3:00 PM", status:"queued" },
];

const NAV = [
  { id:"opportunities", label:"Opportunities", icon:"◈" },
  { id:"channels", label:"Channels", icon:"▣" },
  { id:"queue", label:"Content Queue", icon:"≡" },
  { id:"analytics", label:"Analytics", icon:"▲" },
];

const PLATFORM_COLORS = { YT:"#ff4f47", IG:"#e147ff", TT:"#47e8ff" };
const PLATFORM_LABELS = { YT:"YT", IG:"IG", TT:"TT" };

function PlatformBadge({ p }) {
  return (
    <span className="platform-icon" style={{ background: PLATFORM_COLORS[p] + "22", color: PLATFORM_COLORS[p], fontSize:9, fontFamily:"var(--font-mono)", letterSpacing:"0.05em" }}>{p}</span>
  );
}

function ScoreRing({ score }) {
  const color = score >= 90 ? "var(--accent)" : score >= 75 ? "var(--accent3)" : "var(--muted)";
  return (
    <div className="score-ring" style={{ background: color + "18", border: `2px solid ${color}44`, color }}>
      {score}
    </div>
  );
}

function HealthBar({ health }) {
  const color = health >= 80 ? "var(--green)" : health >= 50 ? "var(--accent)" : "var(--accent2)";
  return (
    <div>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color }}>{health}%</span>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width:`${health}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniChart({ data, color }) {
  const max = Math.max(...data);
  return (
    <div className="analytics-bar">
      {data.map((v,i) => (
        <div key={i} className="analytics-bar-item"
          style={{ height:`${(v/max)*100}%`, background: i === data.length-1 ? color : color+"44" }} />
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("login");
  const [nav, setNav] = useState("opportunities");
  const [loginData, setLoginData] = useState({ email:"", password:"" });
  const [loginErr, setLoginErr] = useState("");
  const [channels, setChannels] = useState(CHANNELS);
  const [opportunities, setOpportunities] = useState(OPPORTUNITIES);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [launching, setLaunching] = useState(null);
  const [launched, setLaunched] = useState([]);
  const [time, setTime] = useState(new Date());
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [scriptOpp, setScriptOpp] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleLogin = () => {
    if (loginData.email === "admin@autopilot.ai" && loginData.password === "admin123") {
      setPage("app");
    } else {
      setLoginErr("Invalid credentials — try admin@autopilot.ai / admin123");
    }
  };

  const handleLaunch = async (opp) => {
    setLaunching(opp.id);
    await new Promise(r => setTimeout(r, 2200));
    setLaunched(l => [...l, opp.id]);
    setLaunching(null);
    setSelectedOpp(null);
    const newChannel = {
      id: Date.now(), name: opp.name, niche: opp.niche, status:"active",
      subs:0, videos:0, revenue:0, goal:1000, nextUpload:"Scheduling…",
      emoji:"🚀", platforms: opp.platforms, views:0, avgViews:0, health:50
    };
    setChannels(c => [newChannel, ...c]);
  };

  const handleViewScripts = async (opp) => {
    setScriptOpp(opp);
    setGeneratedScript("");
    setGeneratingScript(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content:`You are an expert YouTube Shorts / Reels / TikTok script writer. Generate 2 complete video scripts for this channel concept:\n\nChannel: ${opp.name}\nNiche: ${opp.niche}\nFormat: ${opp.format}\nWhy trending: ${opp.why}\n\nFor each script provide:\n- VIDEO TITLE (clickbait but accurate)\n- HOOK (first 3 seconds, single punchy sentence)\n- SCRIPT BODY (spoken words, 50–70 seconds)\n- ON-SCREEN TEXT (3–4 captions to show)\n- CTA (last 5 seconds)\n- THUMBNAIL CONCEPT (one sentence)\n\nMake them scroll-stopping, viral, and platform-native. No filler.` }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text||"").join("") || "Failed to generate.";
      setGeneratedScript(text);
    } catch {
      setGeneratedScript("Could not connect to AI. Please try again.");
    }
    setGeneratingScript(false);
  };

  const totalRevenue = channels.reduce((s,c) => s+c.revenue, 0);
  const totalSubs = channels.reduce((s,c) => s+c.subs, 0);
  const totalVideos = channels.reduce((s,c) => s+c.videos, 0);
  const activeChannels = channels.filter(c => c.status==="active").length;

  // LOGIN
  if (page === "login") return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" }}>
      <style>{css}</style>
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 30% 50%, #e8ff4708 0%, transparent 60%), radial-gradient(circle at 70% 20%, #47b4ff06 0%, transparent 50%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:1, height:"100vh", background:"linear-gradient(to bottom, transparent, var(--border), transparent)", opacity:0.5 }} />

      <div style={{ width:400, animation:"fadeUp 0.5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:36, height:36, background:"var(--accent)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>▶</div>
            <span style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, letterSpacing:"-0.5px" }}>AutoPilot<span style={{color:"var(--accent)"}}>Studio</span></span>
          </div>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Internal Admin Console</p>
        </div>

        <div className="card" style={{ padding:32 }}>
          <div style={{ marginBottom:20 }}>
            <label>Email Address</label>
            <input placeholder="admin@autopilot.ai" value={loginData.email}
              onChange={e => setLoginData({...loginData, email:e.target.value})}
              onKeyDown={e => e.key==="Enter" && handleLogin()} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={loginData.password}
              onChange={e => setLoginData({...loginData, password:e.target.value})}
              onKeyDown={e => e.key==="Enter" && handleLogin()} />
          </div>
          {loginErr && <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--accent2)", marginBottom:16 }}>{loginErr}</p>}
          <button className="btn btn-primary" style={{ width:"100%", padding:"12px 0", fontSize:12 }} onClick={handleLogin}>
            Access Dashboard →
          </button>
        </div>

        <p style={{ textAlign:"center", fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:20, letterSpacing:"0.08em" }}>
          RESTRICTED ACCESS — AUTHORIZED PERSONNEL ONLY
        </p>
      </div>
    </div>
  );

  // MAIN APP
  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"var(--bg)" }}>
      <style>{css}</style>

      {/* TOP BAR */}
      <div style={{ height:52, borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", flexShrink:0, background:"var(--surface)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:26, height:26, background:"var(--accent)", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>▶</div>
            <span style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:800, letterSpacing:"-0.3px" }}>AutoPilot<span style={{color:"var(--accent)"}}>Studio</span></span>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            {NAV.map(n => (
              <div key={n.id} className={`nav-item ${nav===n.id?"active":""}`} onClick={() => setNav(n.id)}>
                <span style={{ fontSize:12 }}>{n.icon}</span> {n.label}
              </div>
            ))}
          </nav>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span className="live-dot" />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--green)", letterSpacing:"0.08em" }}>SYSTEM ACTIVE</span>
          </div>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>
            {time.toLocaleTimeString()}
          </span>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, cursor:"pointer" }} onClick={() => setPage("login")}>A</div>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        <div style={{ flex:1, overflow:"auto", padding:24 }}>

          {/* STAT STRIP */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginBottom:24 }} className="fade-up">
            {[
              { label:"Monthly Revenue", value:`$${totalRevenue.toLocaleString()}`, sub:"↑ 23% this month", color:"var(--accent)" },
              { label:"Total Subscribers", value:totalSubs.toLocaleString(), sub:`Across ${activeChannels} channels`, color:"var(--accent3)" },
              { label:"Videos Published", value:totalVideos, sub:"All platforms combined", color:"var(--green)" },
              { label:"Active Channels", value:activeChannels, sub:`${channels.length - activeChannels} paused`, color:"var(--muted)" },
            ].map((s,i) => (
              <div key={i} className="stat-card">
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>{s.label}</p>
                <p style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:800, color:s.color, letterSpacing:"-1px" }}>{s.value}</p>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:4 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* OPPORTUNITIES */}
          {nav === "opportunities" && (
            <div className="fade-up-1">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.3px" }}>Channel Opportunities</h2>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>AI-detected trends · Updated 3 hours ago</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost">Refresh Trends</button>
                  <button className="btn btn-primary">+ Scan Now</button>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {opportunities.filter(o => !launched.includes(o.id)).map((opp, i) => (
                  <div key={opp.id} className={`opportunity-card ${opp.hot?"hot":""}`} style={{ animationDelay:`${i*0.07}s` }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        <ScoreRing score={opp.score} />
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                            <span style={{ fontWeight:700, fontSize:15 }}>{opp.name}</span>
                            {opp.hot && <span className="tag tag-red">🔥 Hot</span>}
                          </div>
                          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)" }}>{opp.niche}</span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:4 }}>
                        {opp.platforms.map(p => <PlatformBadge key={p} p={p} />)}
                      </div>
                    </div>

                    <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", lineHeight:1.6, marginBottom:14, paddingBottom:14, borderBottom:"1px solid var(--border)" }}>{opp.why}</p>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                      {[
                        { l:"Search Trend", v:opp.trend, c:"var(--accent)" },
                        { l:"Competition", v:opp.competition, c:opp.competition==="Low"?"var(--green)":"var(--accent)" },
                        { l:"CPM Range", v:opp.cpm, c:"var(--accent3)" },
                      ].map(m => (
                        <div key={m.l} style={{ background:"var(--bg)", borderRadius:6, padding:"10px 12px", border:"1px solid var(--border)" }}>
                          <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{m.l}</p>
                          <p style={{ fontFamily:"var(--font-mono)", fontSize:12, color:m.c, fontWeight:500 }}>{m.v}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => handleViewScripts(opp)}>
                        View {opp.drafts} Scripts
                      </button>
                      <button
                        className="btn btn-primary" style={{ flex:1 }}
                        onClick={() => setSelectedOpp(opp)}
                        disabled={launching === opp.id}
                      >
                        {launching === opp.id ? "Launching…" : "Launch Channel →"}
                      </button>
                    </div>
                  </div>
                ))}
                {launched.length > 0 && (
                  <div style={{ gridColumn:"1/-1", fontFamily:"var(--font-mono)", fontSize:11, color:"var(--green)", padding:12, background:"var(--green)08", borderRadius:8, border:"1px solid var(--green)22", textAlign:"center" }}>
                    ✓ {launched.length} channel{launched.length>1?"s":""} launched — view them in Channels
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHANNELS */}
          {nav === "channels" && (
            <div className="fade-up-1">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.3px" }}>Active Channels</h2>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>All channels running on autopilot</p>
                </div>
                <button className="btn btn-primary" onClick={() => setNav("opportunities")}>+ Add Channel</button>
              </div>

              <div className="card" style={{ overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr 120px", padding:"10px 20px", borderBottom:"1px solid var(--border)", gap:16 }}>
                  {["Channel","Subscribers","Videos","Revenue","Health","Next Upload",""].map(h => (
                    <span key={h} style={{ fontFamily:"var(--font-mono)", fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)" }}>{h}</span>
                  ))}
                </div>
                {channels.map(ch => (
                  <div key={ch.id} className="channel-row">
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:"var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{ch.emoji}</div>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ fontWeight:600, fontSize:13 }}>{ch.name}</span>
                          <span className={`tag ${ch.status==="active"?"tag-green":"tag-muted"}`}>{ch.status}</span>
                        </div>
                        <div style={{ display:"flex", gap:4 }}>
                          {ch.platforms.map(p => <PlatformBadge key={p} p={p} />)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:500 }}>{ch.subs.toLocaleString()}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width:`${Math.min((ch.subs/ch.goal)*100,100)}%`, background:"var(--accent3)" }} />
                      </div>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)" }}>/ {ch.goal.toLocaleString()} goal</span>
                    </div>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:13 }}>{ch.videos}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:13, color:"var(--green)" }}>${ch.revenue}/mo</span>
                    <HealthBar health={ch.health} />
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:ch.status==="active"?"var(--accent)":"var(--muted)" }}>
                      {ch.status==="active" ? `in ${ch.nextUpload}` : ch.nextUpload}
                    </span>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="btn btn-ghost" style={{ padding:"6px 10px", fontSize:10 }}
                        onClick={() => setChannels(channels.map(c => c.id===ch.id ? {...c, status:c.status==="active"?"paused":"active"} : c))}>
                        {ch.status==="active" ? "Pause" : "Resume"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUEUE */}
          {nav === "queue" && (
            <div className="fade-up-1">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.3px" }}>Content Queue</h2>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>{QUEUE.length} videos scheduled across all platforms</p>
                </div>
              </div>
              <div className="card" style={{ overflow:"hidden" }}>
                {QUEUE.map((q,i) => (
                  <div key={q.id} className="queue-item" style={{ animationDelay:`${i*0.05}s` }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", width:20, textAlign:"center" }}>{i+1}</span>
                    <div style={{ width:32, height:32, borderRadius:6, background:"var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{q.emoji}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{q.title}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{q.channel}</span>
                        <span>·</span>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{q.time}</span>
                      </div>
                    </div>
                    <PlatformBadge p={q.platform} />
                    <span className={`tag ${q.status==="ready"?"tag-green":q.status==="generating"?"tag-yellow":"tag-muted"}`}>
                      {q.status==="generating" ? "⟳ generating" : q.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {nav === "analytics" && (
            <div className="fade-up-1">
              <div style={{ marginBottom:16 }}>
                <h2 style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.3px" }}>Analytics Overview</h2>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>Last 30 days · All channels</p>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {channels.filter(c=>c.videos>0).map(ch => (
                  <div key={ch.id} className="card" style={{ padding:20 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:22 }}>{ch.emoji}</span>
                        <div>
                          <p style={{ fontWeight:700, fontSize:14 }}>{ch.name}</p>
                          <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>{ch.niche}</p>
                        </div>
                      </div>
                      <span className={`tag ${ch.status==="active"?"tag-green":"tag-muted"}`}>{ch.status}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                      {[
                        { l:"Subscribers", v:ch.subs.toLocaleString(), c:"var(--accent3)" },
                        { l:"Total Views", v:ch.views>=1000?`${(ch.views/1000).toFixed(0)}K`:ch.views, c:"var(--text)" },
                        { l:"Revenue/mo", v:`$${ch.revenue}`, c:"var(--green)" },
                      ].map(m => (
                        <div key={m.l} style={{ background:"var(--bg)", borderRadius:6, padding:"10px 12px", border:"1px solid var(--border)" }}>
                          <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{m.l}</p>
                          <p style={{ fontFamily:"var(--font-mono)", fontSize:14, color:m.c, fontWeight:500 }}>{m.v}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Views · Last 14 days</p>
                      <MiniChart
                        data={Array.from({length:14}, () => Math.floor(ch.avgViews * (0.5 + Math.random())))}
                        color={ch.health>=80?"var(--green)":ch.health>=50?"var(--accent)":"var(--accent2)"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LAUNCH CONFIRM MODAL */}
      {selectedOpp && (
        <div className="modal-overlay" onClick={() => setSelectedOpp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24, paddingBottom:20, borderBottom:"1px solid var(--border)" }}>
              <ScoreRing score={selectedOpp.score} />
              <div>
                <h3 style={{ fontSize:18, fontWeight:700 }}>Launch {selectedOpp.name}?</h3>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", marginTop:2 }}>{selectedOpp.niche}</p>
              </div>
            </div>
            <div style={{ background:"var(--bg)", borderRadius:8, padding:16, marginBottom:20, border:"1px solid var(--border)" }}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--muted)", lineHeight:1.7 }}>
                Once launched, the system will:<br/>
                <span style={{color:"var(--green)"}}>✓</span> Create the channel across {selectedOpp.platforms.join(", ")}<br/>
                <span style={{color:"var(--green)"}}>✓</span> Queue the first 5 AI-generated videos<br/>
                <span style={{color:"var(--green)"}}>✓</span> Begin posting on autopilot daily<br/>
                <span style={{color:"var(--green)"}}>✓</span> Track analytics and self-optimize
              </p>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setSelectedOpp(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={() => handleLaunch(selectedOpp)}
                disabled={launching===selectedOpp.id}>
                {launching===selectedOpp.id ? "Launching channel…" : "Confirm Launch →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCRIPT MODAL */}
      {scriptOpp && (
        <div className="modal-overlay" onClick={() => { setScriptOpp(null); setGeneratedScript(""); }}>
          <div className="modal" style={{ width:620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:"1px solid var(--border)" }}>
              <div>
                <h3 style={{ fontSize:16, fontWeight:700 }}>Draft Scripts — {scriptOpp.name}</h3>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)", marginTop:2 }}>AI-generated · {scriptOpp.niche}</p>
              </div>
              <button className="btn btn-ghost" style={{ padding:"6px 12px" }} onClick={() => { setScriptOpp(null); setGeneratedScript(""); }}>✕</button>
            </div>
            {generatingScript ? (
              <div style={{ textAlign:"center", padding:"40px 0" }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"var(--accent)", marginBottom:8 }}>
                  Generating scripts<span className="cursor-blink">_</span>
                </div>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--muted)" }}>Claude is writing viral scripts for your channel…</p>
              </div>
            ) : (
              <div style={{ background:"var(--bg)", borderRadius:8, padding:20, border:"1px solid var(--border)", maxHeight:420, overflowY:"auto" }}>
                <pre style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text)", whiteSpace:"pre-wrap", lineHeight:1.7 }}>{generatedScript}</pre>
              </div>
            )}
            {generatedScript && !generatingScript && (
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => handleViewScripts(scriptOpp)}>Regenerate</button>
                <button className="btn btn-primary" style={{ flex:2 }} onClick={() => { setScriptOpp(null); setSelectedOpp(scriptOpp); setGeneratedScript(""); }}>
                  Launch This Channel →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
