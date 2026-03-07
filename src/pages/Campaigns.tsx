import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import axios from "axios";

type Campaign = {
  id: string,
  name: string,
  status: string,
  created_at: string,
  product_id: string,
}
type Product = {

  name: string;


  primary_goal: string;          // DB: primary_goal

};
type Prospect = {
  id: string,
  name: string,
  email: string,
  website: string,
  linkedin: string,
  company: string,
  status: string
}
// ── Mock Data ──────────────────────────────────────────────
const analyticsData = [
  { date: "Feb 1", sent: 40, opens: 18, replies: 6, demos: 1 },
  { date: "Feb 5", sent: 80, opens: 34, replies: 11, demos: 2 },
  { date: "Feb 10", sent: 120, opens: 52, replies: 15, demos: 4 },
  { date: "Feb 15", sent: 200, opens: 88, replies: 26, demos: 6 },
  { date: "Feb 20", sent: 270, opens: 114, replies: 34, demos: 8 },
  { date: "Feb 25", sent: 320, opens: 131, replies: 38, demos: 8 },
];

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Not Contacted", value: "not_contacted" },
  { label: "Email Sent", value: "email_sent" },
  { label: "Opened", value: "opened" },
  { label: "Replied", value: "replied" },
  { label: "Meeting Scheduled", value: "meeting_scheduled" }
];


const emailSequence = [
  {
    step: 1, type: "Initial Outreach", delay: "Immediate",
    subject: "Quick question about FinTechX's payment ops",
    preview: "Hi {{first_name}}, I came across FinTechX and noticed you're scaling your payment infrastructure. We help fintech teams automate reconciliation — mind if I share how?",
  },
  {
    step: 2, type: "Follow-up 1", delay: "3 days after Step 1",
    subject: "Re: Payment automation for FinTechX",
    preview: "Hey {{first_name}}, just circling back on my last note. Teams like {{company}} usually save 12+ hours/week on manual reconciliation. Would a 15-min call make sense?",
  },
  {
    step: 3, type: "Follow-up 2", delay: "7 days after Step 2",
    subject: "Last note — payment ops at {{company}}",
    preview: "Hi {{first_name}}, I'll keep this short. If reducing payment errors is a priority this quarter, happy to share a quick case study from a similar fintech. Worth it?",
  },
];
const PORT = 3000;
const statusConfig = {
  not_contacted: { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
  email_sent: { bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  opened: { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  replied: { bg: "#f0fdf4", color: "#166534", dot: "#22c55e" },
  meeting_scheduled: { bg: "#faf5ff", color: "#6b21a8", dot: "#a855f7" }
};

type Tab = "prospects" | "sequence" | "analytics";

const CampaignPage = () => {

  const [activeTab, setActiveTab] = useState<Tab>("prospects");
  const [activeCamp, setActiveCamp] = useState<Campaign | null>(null);
  const [activeProd, setActiveProd] = useState<Product | null>(null);
  const [pros, setPros] = useState<Prospect[]>([]);
  const { id } = useParams();
  const [file, setFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignStatus, setCampaignStatus] = useState<"Draft" | "Active" | "Paused">("Active");
  const [orgID, setOrgID] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      nav("/login");
      return;
    }
    const parsed = JSON.parse(user);
    setOrgID(parsed.org_id);

    const fetch = async () => {
      try {
        console.log("🔍 Fetching campaign with id:", id);
        const res = await axios.get(`http://localhost:${PORT}/campaigns/campaign/${id}`);
        const camp = res.data.camp;
        setActiveCamp(camp);


        if (camp?.product_id) {
          try {
            console.log("🔍 Fetching prod with id:", camp.product_id);
            const prodRes = await axios.get(`http://localhost:${PORT}/product/get_single_product/${camp.product_id}`);
            console.log("prodRes.data:", prodRes.data);
            setActiveProd(prodRes.data.products);
          } catch (e) {
            console.log("Failed to fetch product:", e);
          }
        }
      } catch (error) {
        console.log("Failed to fetch campaign:", error);
      }
    };
    const fetch_pros = async () => {
      try {
        const res = await axios.get(`http://localhost:${PORT}/prospects/get_prospects/${id}`);
        setPros(res.data.prospects);
      } catch (error) {
        console.log("Failed to fetch your prospects:", error);
      }
    }

    fetch();
    fetch_pros();


  }, [])
  useEffect(() => {
    if (activeCamp) {
      setCampaignStatus(activeCamp.status as "Draft" | "Active" | "Paused");
    }
  }, [activeCamp]);
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);

    const day = date.getDate();
    const year = date.getFullYear();

    const month = date.toLocaleString("en-US", { month: "short" });



    return `${month} ${day}, ${year}`;
  };


  const filteredProspects =
    statusFilter === "all"
      ? pros
      : pros.filter((p) => p.status === statusFilter);
  const statusCounts = pros.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const statusBadge = {
    Draft: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
    Active: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
    Paused: { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  }[campaignStatus];

  const handleUpload = async () => {
    const formData = new FormData();
    if (!file) {
      return;
    }
    formData.append("file", file);
    formData.append("campaign_id", id);
    formData.append("organization_id", orgID);

    try {
      const res = await axios.post(
        `http://localhost:${PORT}/prospects/upload_csv/add_prospects`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      nav(`/upload_processing/${res.data.jobID}/${id}`);
      console.log("Upload result:", res.data);
      const res2 = await axios.get(
        `http://localhost:${PORT}/prospects/get_prospects/${id}`
      );

      setPros(res2.data.prospects);
      setFile(null);
    } catch (error) {
      console.log("Upload failed:", error);
    }
  }
  if (!activeCamp || !activeProd) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f5f5f3", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e5e7eb", borderTopColor: "#111827", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600 }}>Loading campaign...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f5f3", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.4s ease forwards; opacity:0; }

        .app-nav-item {
          display:flex; align-items:center; gap:10px; padding:9px 14px;
          border-radius:8px; cursor:pointer; color:rgba(255,255,255,0.38);
          font-size:13px; font-weight:500; transition:all 0.18s; position:relative;
        }
        .app-nav-item:hover  { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.75); }
        .app-nav-item.active { background:rgba(255,255,255,0.09); color:#fff; font-weight:600; }
        .app-nav-item.active::before {
          content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
          width:3px; height:16px; background:#2563eb; border-radius:0 3px 3px 0;
        }

        .kpi-card {
          background:white; border-radius:14px; border:1px solid #e8e6e1;
          padding:20px 24px; flex:1; transition:all 0.2s;
        }
        .kpi-card:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,0.06); }
        .kpi-card.hero  { background:#111827; border-color:#111827; }

        .tab-btn {
          padding:9px 18px; border-radius:8px; border:none; font-size:13px; font-weight:600;
          cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
          background:transparent; color:#6b7280;
        }
        .tab-btn:hover  { background:#f0f0ee; color:#111827; }
        .tab-btn.active { background:#111827; color:white; }

        .action-btn {
          display:inline-flex; align-items:center; gap:7px; padding:9px 18px;
          border-radius:9px; font-size:13px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s; border:none;
        }
        .action-btn:hover { transform:translateY(-1px); filter:brightness(0.93); }

        .filter-chip {
          padding:6px 14px; border-radius:100px; border:1.5px solid #e5e7eb;
          background:white; font-size:12px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; color:#6b7280; transition:all 0.18s;
          white-space:nowrap;
        }
        .filter-chip:hover  { border-color:#111827; color:#111827; }
        .filter-chip.active { background:#111827; border-color:#111827; color:white; }

        .prospect-row { transition:background 0.12s; }
        .prospect-row:hover td { background:#fafaf8 !important; }

        .fit-bar-track { width:60px; height:4px; background:#f1f5f9; border-radius:100px; overflow:hidden; display:inline-block; vertical-align:middle; margin-left:6px; }
        .fit-bar-fill  { height:100%; border-radius:100px; }

        .seq-card {
          background:white; border:1px solid #e8e6e1; border-radius:14px;
          padding:22px 24px; position:relative; transition:all 0.2s;
        }
        .seq-card:hover { box-shadow:0 8px 24px rgba(0,0,0,0.06); transform:translateY(-1px); }

        .ghost-btn {
          background:white; color:#374151; border:1.5px solid #e5e7eb; padding:8px 16px;
          border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
          display:inline-flex; align-items:center; gap:5px;
        }
        .ghost-btn:hover { border-color:#111827; color:#111827; }

        .danger-btn {
          background:white; color:#dc2626; border:1.5px solid #fecaca; padding:9px 18px;
          border-radius:9px; font-size:13px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
        }
        .danger-btn:hover { background:#fef2f2; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 216, background: "#111827", display: "flex", flexDirection: "column", padding: "28px 12px", flexShrink: 0 }}>
        <div style={{ padding: "0 10px", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 19, color: "#fff" }}>LeadForge</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)", marginTop: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>AI Outreach</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginBottom: 6 }}>Main</div>
          {["Dashboard", "Campaigns", "Prospects", "Analytics"].map(l => (
            <div key={l} className={`app-nav-item ${l === "Campaigns" ? "active" : ""}`}>{l}</div>
          ))}
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginTop: 22, marginBottom: 6 }}>Account</div>
          {["Email Accounts", "Products", "Settings"].map(l => (
            <div key={l} className="app-nav-item">{l}</div>
          ))}
        </nav>
        <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600 }}>Starter Plan</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>60%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "#2563eb", borderRadius: 100 }} />
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>600 / 1,000 emails</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 10px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 29, height: 29, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, color: "white", fontWeight: 700 }}>R</div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: 600 }}>Rajeev Rai</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Admin</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>

        {/* ── CAMPAIGN HEADER ── */}
        <div style={{ background: "white", borderBottom: "1px solid #e8e6e1", padding: "28px 36px 24px" }}>

          {/* Breadcrumb */}
          <div className="fade-up" style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ cursor: "pointer", color: "#6b7280" }}>Campaigns</span>
            <span>›</span>
            <span style={{ color: "#111827", fontWeight: 600 }}>{activeCamp.name}</span>
          </div>

          <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Left — title + meta */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: "#111827", letterSpacing: "-0.2px" }}>
                  {activeCamp.name}
                </h1>
                {/* Status badge */}
                <span style={{ background: statusBadge.bg, color: statusBadge.color, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusBadge.dot, display: "inline-block" }} />
                  {activeCamp.status}
                </span>
              </div>
              {/* Meta row */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Product", value: activeProd.name },
                  { label: "Prospects", value: `${pros.length} contacts` },
                  { label: "Created", value: activeCamp.created_at ? formatDate(activeCamp.created_at) : "—" },
                  { label: "Goal", value: activeProd.primary_goal },
                ].map(m => (
                  <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</span>
                    <span style={{ fontSize: 11.5, color: "#374151", fontWeight: 600 }}>· {m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — action buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {campaignStatus === "Active" ? (
                <button className="action-btn" style={{ background: "#fef9c3", color: "#92400e" }} onClick={() => setCampaignStatus("Paused")}>
                  ⏸ Pause
                </button>
              ) : campaignStatus === "Paused" ? (
                <button className="action-btn" style={{ background: "#dcfce7", color: "#166534" }} onClick={() => setCampaignStatus("Active")}>
                  ▶ Resume
                </button>
              ) : (
                <button className="action-btn" style={{ background: "#dcfce7", color: "#166534" }} onClick={() => setCampaignStatus("Active")}>
                  🚀 Launch Campaign
                </button>
              )}
              <button className="action-btn" style={{ background: "#f1f5f9", color: "#374151" }}>
                ✏ Edit
              </button>
              <button className="action-btn" style={{ background: "#eff6ff", color: "#2563eb" }}>
                ⧉ Duplicate
              </button>
              <button className="danger-btn">🗑 Delete</button>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="fade-up" style={{ display: "flex", gap: 14, padding: "24px 36px 0" }}>
          {[
            { label: "Emails Sent", value: "320", sub: "of 320 prospects", subColor: "#9ca3af" },
            { label: "Open Rate", value: "41%", sub: "↑ 4% vs avg", subColor: "#16a34a" },
            { label: "Reply Rate", value: "12%", sub: "38 replies total", subColor: "#16a34a" },
          ].map((k, i) => (
            <div key={k.label} className="kpi-card fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>{k.label}</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 8 }}>{k.value}</div>
              <div style={{ fontSize: 11.5, color: k.subColor, fontWeight: 600 }}>{k.sub}</div>
            </div>
          ))}

          {/* Demo Bookings hero card */}
          <div className="kpi-card hero fade-up" style={{ animationDelay: "0.21s", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(124,58,237,0.12)" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Demo Bookings</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 38, fontWeight: 700, color: "white", lineHeight: 1, marginBottom: 8 }}>8</div>
            <div style={{ fontSize: 11.5, color: "#a78bfa", fontWeight: 600, marginBottom: 14 }}>↑ 3 this week 🔥</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 100, overflow: "hidden" }}>
              <div style={{ width: "53%", height: "100%", background: "linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", marginTop: 5 }}>8 of 15 monthly target</div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ padding: "20px 36px 0" }}>
          <div className="fade-up" style={{ display: "flex", gap: 3, background: "white", padding: 4, borderRadius: 11, border: "1px solid #e8e6e1", width: "fit-content" }}>
            {([
              { key: "prospects", label: "👥 Prospects" },
              { key: "sequence", label: "✉ Email Sequence" },
              { key: "analytics", label: "📈 Analytics" },
            ] as { key: Tab; label: string }[]).map(t => (
              <button key={t.key} className={`tab-btn ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <div style={{ flex: 1, padding: "20px 36px 36px", overflowY: "auto" }}>

          {/* ══ PROSPECTS TAB ══ */}
          {activeTab === "prospects" && (
            <div>
              {/* Toolbar */}


              {/* ── CSV FORMAT GUIDE ── */}
              <div style={{ background: "white", border: "1px solid #e8e6e1", borderRadius: 13, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                {/* Left: format info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>

                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>CSV Upload Format</span>
                  </div>

                  <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                    {/* Required */}
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Required</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", display: "inline-block", flexShrink: 0 }} />
                        <code style={{ fontSize: 12, fontWeight: 700, color: "#111827", background: "#f8f8f6", padding: "2px 7px", borderRadius: 5, border: "1px solid #eeede9" }}>name</code>
                        <code style={{ fontSize: 12, fontWeight: 700, color: "#111827", background: "#f8f8f6", padding: "2px 7px", borderRadius: 5, border: "1px solid #eeede9" }}>email</code>

                      </div>
                    </div>

                    {/* Recommended */}
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Recommended</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {["company", "website", "linkedin"].map(col => (
                          <div key={col} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#d1d5db", display: "inline-block", flexShrink: 0 }} />
                            <code style={{ fontSize: 12, color: "#6b7280", background: "#f8f8f6", padding: "2px 7px", borderRadius: 5, border: "1px solid #eeede9" }}>{col}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Example row */}
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Example Row</div>
                      <code style={{ fontSize: 11.5, color: "#374151", background: "#f8f8f6", padding: "4px 10px", borderRadius: 6, border: "1px solid #eeede9", whiteSpace: "nowrap", display: "block" }}>
                        John, FinTechX, john@fintechx.com, fintechx.com, linkedin.com/in/john
                      </code>
                    </div>
                  </div>
                </div>

                {/* Right: download button */}
                <button
                  onClick={() => {
                    const csvContent = "name,company,email,website,linkedin\nJohn,FinTechX,john@fintechx.com,fintechx.com,linkedin.com/in/john\nkate,PaySafe,kate@paysafe.io,paysafe.io,linkedin.com/in/kate";
                    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "leadforge_prospects_template.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{ background: "#111827", color: "white", border: "none", padding: "9px 16px", borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.18s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#111827")}
                >
                  ⬇ Download Template
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {statusOptions.map((s) => (
                    <button
                      key={s.value}
                      className={`filter-chip ${statusFilter === s.value ? "active" : ""}`}
                      onClick={() => setStatusFilter(s.value)}
                    >
                      {s.label}
                      <span style={{ opacity: 0.6 }}>
                        {" "}
                        (
                        {s.value === "all"
                          ? pros.length
                          : statusCounts[s.value] || 0}
                        )
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Hidden file input */}
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    id="csv-upload"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />

                  {/* Step 1 — pick file */}
                  <label htmlFor="csv-upload" className="ghost-btn" style={{ cursor: "pointer" }}>
                    📂 {file ? file.name : "Choose CSV"}
                  </label>

                  {/* Step 2 — only appears after file is chosen */}
                  {file && (
                    <button
                      className="ghost-btn"
                      style={{ background: "#f0fdf4", borderColor: "#86efac", color: "#16a34a" }}
                      onClick={handleUpload}
                    >
                      ⬆ Upload
                    </button>
                  )}

                  <button className="action-btn" style={{ background: "#111827", color: "white", padding: "8px 16px", fontSize: 12.5 }}>
                    + Add Prospect
                  </button>
                </div>
              </div>

              {/* Prospects table */}
              {pros.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "80px 24px",
                    textAlign: "center",
                    background: "white",
                    borderRadius: 14,
                    border: "1px solid #e8e6e1"
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 20,
                      background: "#eff6ff",
                      border: "2px dashed #bfdbfe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      marginBottom: 18
                    }}
                  >
                    📭
                  </div>

                  <h3
                    style={{
                      fontFamily: "'Fraunces',serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 8
                    }}
                  >
                    No prospects added yet
                  </h3>

                  <p
                    style={{
                      color: "#9ca3af",
                      fontSize: 13,
                      maxWidth: 360,
                      lineHeight: 1.6,
                      marginBottom: 24
                    }}
                  >
                    Upload a CSV file to start building your outreach list and
                    begin sending personalized AI emails to your prospects.
                  </p>

                  <label htmlFor="csv-upload" className="action-btn" style={{ background: "#111827", color: "white", cursor: "pointer" }}>
                    📂 Upload Prospects
                  </label>
                </div>
              ) : (
                <div style={{ background: "white", borderRadius: 14, border: "1px solid #e8e6e1", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#fafaf8" }}>
                        {["Name", "Company", "Email", "Fit Score", "Status", "Last Activity", ""].map(h => (
                          <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProspects.map((p: any) => {
                        const sc = statusConfig[p.status];
                        const fitColor = p.fit >= 85 ? "#16a34a" : p.fit >= 70 ? "#d97706" : "#dc2626";
                        return (
                          <tr key={p.id} className="prospect-row" style={{ borderTop: "1px solid #f5f5f3" }}>
                            <td style={{ padding: "13px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${p.id * 47},60%,88%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: `hsl(${p.id * 47},50%,35%)`, flexShrink: 0 }}>
                                  {p.name[0]}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "13px 18px", fontSize: 13, color: "#374151" }}>{p.company}</td>
                            <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#6b7280" }}>{p.email}</td>
                            <td style={{ padding: "13px 18px" }}>
                              {/* <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: fitColor }}>{p.fit}</span>
                                <div className="fit-bar-track">
                                  <div className="fit-bar-fill" style={{ width: `${p.fit}%`, background: fitColor }} />
                                </div>
                              </div> */}
                            </td>
                            <td style={{ padding: "13px 18px" }}>
                              <span style={{ background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 5 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                                {p.status}
                              </span>
                            </td>
                            <td style={{ padding: "13px 18px", fontSize: 12.5, color: "#9ca3af" }}>{p.last}</td>
                            <td style={{ padding: "13px 18px" }}>
                              <button className="ghost-btn" style={{ padding: "5px 11px", fontSize: 11.5 }}>View</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ EMAIL SEQUENCE TAB ══ */}
          {activeTab === "sequence" && (
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Email Sequence</h3>
                  <p style={{ fontSize: 12.5, color: "#9ca3af" }}>3 emails · AI-generated · Personalized per prospect</p>
                </div>
                <button className="action-btn" style={{ background: "#111827", color: "white", fontSize: 12.5, padding: "8px 16px" }}>+ Add Follow-up</button>
              </div>

              <div style={{ position: "relative" }}>
                {/* Connector line */}
                <div style={{ position: "absolute", left: 23, top: 48, bottom: 48, width: 2, background: "linear-gradient(180deg,#e5e7eb,#e5e7eb)", borderRadius: 100, zIndex: 0 }} />

                {emailSequence.map((email, i) => (
                  <div key={email.step} style={{ display: "flex", gap: 16, marginBottom: i < emailSequence.length - 1 ? 0 : 0, position: "relative", zIndex: 1 }}>
                    {/* Step circle */}
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 46, height: 46, borderRadius: "50%", background: i === 0 ? "#111827" : "white", border: `2px solid ${i === 0 ? "#111827" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: i === 0 ? "white" : "#6b7280", zIndex: 2 }}>
                        {email.step}
                      </div>
                      {i < emailSequence.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: "#e5e7eb", minHeight: 24, margin: "4px 0" }} />
                      )}
                    </div>

                    {/* Email card */}
                    <div className="seq-card fade-up" style={{ flex: 1, marginBottom: 16, animationDelay: `${i * 0.1}s` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                            <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: "#111827" }}>{email.type}</span>
                            {i === 0 && <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>Active</span>}
                          </div>
                          <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                            🕐 {email.delay}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="ghost-btn" style={{ padding: "5px 11px", fontSize: 11.5 }}>✏ Edit</button>
                          <button className="ghost-btn" style={{ padding: "5px 11px", fontSize: 11.5, color: "#dc2626", borderColor: "#fecaca" }}>🗑</button>
                        </div>
                      </div>

                      <div style={{ background: "#f8f8f6", borderRadius: 9, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>Subject</div>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>{email.subject}</div>
                      </div>

                      <div style={{ background: "#f8f8f6", borderRadius: 9, padding: "12px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>Preview</div>
                        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65 }}>{email.preview}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ANALYTICS TAB ══ */}
          {activeTab === "analytics" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

                {/* Opens over time */}
                <div style={{ background: "white", borderRadius: 14, border: "1px solid #e8e6e1", padding: "22px 24px" }}>
                  <div style={{ marginBottom: 18 }}>
                    <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Opens Over Time</h3>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>Daily email open tracking</p>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10.5, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10.5, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 9, border: "1px solid #e8e6e1", fontSize: 12.5 }} />
                      <Area type="monotone" dataKey="opens" stroke="#2563eb" strokeWidth={2} fill="url(#openGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Replies over time */}
                <div style={{ background: "white", borderRadius: 14, border: "1px solid #e8e6e1", padding: "22px 24px" }}>
                  <div style={{ marginBottom: 18 }}>
                    <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Replies Over Time</h3>
                    <p style={{ fontSize: 12, color: "#9ca3af" }}>Prospect reply rate trend</p>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="replyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0891b2" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10.5, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10.5, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 9, border: "1px solid #e8e6e1", fontSize: 12.5 }} />
                      <Area type="monotone" dataKey="replies" stroke="#0891b2" strokeWidth={2} fill="url(#replyGrad)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Demo bookings full width */}
              <div style={{ background: "#111827", borderRadius: 14, padding: "22px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>Demo Bookings</h3>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Your most important metric</p>
                  </div>
                  <span style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>8 total</span>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10.5, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10.5, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: "white", fontSize: 12.5 }} />
                    <Area type="monotone" dataKey="demos" stroke="#a78bfa" strokeWidth={2.5} fill="url(#demoGrad)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignPage;