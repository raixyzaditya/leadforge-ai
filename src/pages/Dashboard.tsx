import { link } from "fs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Mock Data ──────────────────────────────────────────────
const chartData = [
  { day: "Jan 1", opens: 42, replies: 18, demos: 3 },
  { day: "Jan 5", opens: 68, replies: 24, demos: 5 },
  { day: "Jan 10", opens: 55, replies: 20, demos: 4 },
  { day: "Jan 15", opens: 91, replies: 37, demos: 9 },
  { day: "Jan 20", opens: 78, replies: 29, demos: 7 },
  { day: "Jan 25", opens: 110, replies: 45, demos: 12 },
  { day: "Jan 30", opens: 134, replies: 52, demos: 15 },
];

const campaigns = [
  { name: "SaaS Founders Outreach", status: "Active", sent: 340, open: "48%", reply: "18%", demos: 7 },
  { name: "Fintech Decision Makers", status: "Active", sent: 210, open: "39%", reply: "12%", demos: 4 },
  { name: "E-commerce Q1 Push", status: "Paused", sent: 180, open: "31%", reply: "9%", demos: 2 },
  { name: "Enterprise Cold Sequence", status: "Draft", sent: 0, open: "—", reply: "—", demos: 0 },
  { name: "Product-Led Growth ICP", status: "Completed", sent: 500, open: "52%", reply: "21%", demos: 13 },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#dcfce7", color: "#16a34a" },
  Paused: { bg: "#fef9c3", color: "#ca8a04" },
  Draft: { bg: "#f1f5f9", color: "#64748b" },
  Completed: { bg: "#ede9fe", color: "#7c3aed" },
};

const navItems = [
  { label: "Dashboard", active: true,link:"/dashboard" },
  { label: "Campaigns", active: false,link:"/campaigns" },
  { label: "Products", active: false,link:"/products" },
  { label: "Prospects", active: false,link:"/prospects" },
  { label: "Analytics", active: false,link:"/dashboard" },
  { label: "Email Accounts", active: false, link:"/dashboard" },
  { label: "Settings", active: false,link:"/profile" },

];

// ── Component ──────────────────────────────────────────────
const Dashboard = () => {
  const nav = useNavigate();
  const [activeMetric, setActiveMetric] = useState<"opens" | "replies" | "demos">("opens");
  const [dashData, setDashData] = useState({
    "name": "",
    "plan": ""
  })
  const isFirstTime = false;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token == null || user == null) {
      nav("/login");
      return;
    }

    const n = JSON.parse(user);
    console.log(n);
    setDashData({
      ...dashData,
      "name": n.full_name,
      "plan": n.organization.plan_type
    })

  }, [])



  const metricConfig = {
    opens: { color: "#2563eb", label: "Opens" },
    replies: { color: "#0891b2", label: "Replies" },
    demos: { color: "#7c3aed", label: "Demo Bookings" },
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f5f3", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-in { animation: fadeUp 0.45s ease forwards; opacity: 0; }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.18s ease;
          color: rgba(255,255,255,0.38);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          position: relative;
        }
        .nav-item:hover  { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); }
        .nav-item.active { background: rgba(255,255,255,0.09); color: #ffffff; font-weight: 600; }
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 16px;
          background: #2563eb;
          border-radius: 0 3px 3px 0;
        }

        .kpi-card {
          background: #ffffff;
          border-radius: 14px;
          padding: 22px 24px;
          border: 1px solid #e8e6e1;
          flex: 1;
          min-width: 0;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.06); }
        .kpi-card.hero  { background: #111827; border-color: #111827; }

        .metric-btn {
          padding: 6px 13px;
          border-radius: 7px;
          border: none;
          font-size: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          background: transparent;
          color: #94a3b8;
        }
        .metric-btn.active { background: #111827; color: white; }
        .metric-btn:hover:not(.active) { background: #f1f5f9; color: #334155; }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 15px;
          border-radius: 9px;
          border: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          width: 100%;
        }
        .action-btn:hover { transform: translateX(2px); }

        .table-row { transition: background 0.12s; }
        .table-row:hover td { background: #fafaf8 !important; }

        .pipeline-box {
          background: #ffffff;
          border: 1px solid #e8e6e1;
          border-radius: 12px;
          padding: 18px;
          flex: 1;
          text-align: center;
          transition: all 0.18s ease;
        }
        .pipeline-box:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.05); }

        .top-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 17px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.18s;
          border: none;
        }
        .top-btn:hover { filter: brightness(0.93); transform: translateY(-1px); }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: 216,
        background: "#111827",
        display: "flex",
        flexDirection: "column",
        padding: "28px 12px",
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.04)",
      }}>

        {/* Logo */}
        <div style={{ padding: "0 10px", marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 700,
            fontSize: 19,
            color: "#ffffff",
            letterSpacing: "-0.2px",
            lineHeight: 1.2,
          }}>
            LeadForge
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)", marginTop: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            AI Outreach
          </div>
        </div>

        {/* Nav groups */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginBottom: 6 }}>Main</div>
          {navItems.slice(0, 5).map((item) => (
            <div key={item.label} className={`nav-item ${item.active ? "active" : ""}`}>
              <button onClick={()=>nav(item.link)}><span>{item.label}</span></button>
            </div>
          ))}

          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginTop: 22, marginBottom: 6 }}>Account</div>
          {navItems.slice(4).map((item) => (
            <div key={item.label} className={`nav-item ${item.active ? "active" : ""}`}>
              <button onClick={()=>nav(item.link)}><span>{item.label}</span></button>
            </div>
          ))}
        </nav>

        {/* Usage pill */}
        <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600 }}>{dashData.plan} Plan</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>60%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "#2563eb", borderRadius: 100 }} />
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>600 / 1,000 emails</div>
        </div>

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 10px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={() => nav("/profile")}>
            <div style={{ width: 29, height: 29, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, color: "white", fontWeight: 700, flexShrink: 0 }}>{dashData.name.charAt(0).toUpperCase()}</div></button>
          <div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: 600 }}>{dashData.name}</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Admin</div>
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 34px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: 700, color: "#111827", marginBottom: 4, letterSpacing: "-0.2px" }}>
              Good morning, {dashData.name}
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Your outreach overview — January 2026</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="top-btn" style={{ background: "white", border: "1px solid #e5e7eb", color: "#374151" }}>
              📂 Upload Prospects
            </button>
            <button className="top-btn" style={{ background: "#111827", color: "white" }}>
              + New Campaign
            </button>
          </div>
        </div>

        {isFirstTime ? (
          <div style={{ maxWidth: 500, margin: "56px auto", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Let's launch your first campaign
            </h2>
            <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 28, lineHeight: 1.65 }}>
              Complete these steps to start generating leads with AI-powered outreach.
            </p>
            {[
              { done: true, label: "Add your product details" },
              { done: true, label: "Set up your organization" },
              { done: false, label: "Connect your email account" },
              { done: false, label: "Upload your prospects" },
              { done: false, label: "Launch your first campaign" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, fontSize: 13.5, color: "#374151", background: "white", border: "1px solid #e8e6e1", marginBottom: 8, opacity: item.done ? 0.5 : 1 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: item.done ? "#dcfce7" : "white", border: `1.5px solid ${item.done ? "#16a34a" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#16a34a", flexShrink: 0 }}>
                  {item.done ? "✓" : ""}
                </div>
                <span style={{ fontWeight: item.done ? 400 : 600, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
                {!item.done && <span style={{ marginLeft: "auto", fontSize: 12, color: "#2563eb", fontWeight: 600 }}>Start →</span>}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── KPI CARDS ── */}
            <div style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
              {[
                { label: "Emails Sent", value: "1,284", sub: "↑ 12% vs last month", subColor: "#16a34a" },
                { label: "Open Rate", value: "48.2%", sub: "↑ 4.1% vs last month", subColor: "#16a34a" },
                { label: "Reply Rate", value: "18.7%", sub: "↓ 1.2% vs last month", subColor: "#ef4444" },
                { label: "Active Campaigns", value: "5", sub: "of 5 on Starter plan", subColor: "#9ca3af" },
              ].map((k, i) => (
                <div key={k.label} className="kpi-card fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>{k.label}</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1, marginBottom: 10 }}>{k.value}</div>
                  <div style={{ fontSize: 11.5, color: k.subColor, fontWeight: 600 }}>{k.sub}</div>
                </div>
              ))}

              {/* Demo Bookings Hero */}
              <div className="kpi-card hero fade-in" style={{ animationDelay: "0.28s", minWidth: 164 }}>
                <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: "rgba(124,58,237,0.1)" }} />
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Demo Bookings</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 38, fontWeight: 700, color: "#ffffff", lineHeight: 1, marginBottom: 10 }}>28</div>
                <div style={{ fontSize: 11.5, color: "#a78bfa", fontWeight: 600, marginBottom: 16 }}>↑ 8 this week</div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ width: "70%", height: "100%", background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 100 }} />
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>28 of 40 monthly target</div>
              </div>
            </div>

            {/* ── CHART + ACTIONS ── */}
            <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
              <div style={{ flex: 1, background: "white", borderRadius: 14, padding: "24px 26px", border: "1px solid #e8e6e1" }} className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Outbound Performance</h3>
                    <p style={{ fontSize: 11.5, color: "#9ca3af" }}>January 2026</p>
                  </div>
                  <div style={{ display: "flex", gap: 3, background: "#f8fafc", padding: 3, borderRadius: 8, border: "1px solid #e8e6e1" }}>
                    {(["opens", "replies", "demos"] as const).map((m) => (
                      <button key={m} className={`metric-btn ${activeMetric === m ? "active" : ""}`} onClick={() => setActiveMetric(m)}>
                        {metricConfig[m].label}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10.5, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10.5, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 9, border: "1px solid #e8e6e1", boxShadow: "0 4px 18px rgba(0,0,0,0.07)", fontSize: 12.5 }} cursor={{ stroke: "#f1f5f9", strokeWidth: 2 }} />
                    <Line type="monotone" dataKey={activeMetric} stroke={metricConfig[activeMetric].color} strokeWidth={2} dot={{ r: 3.5, fill: metricConfig[activeMetric].color, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ width: 222, background: "white", borderRadius: 14, padding: "22px 16px", border: "1px solid #e8e6e1", display: "flex", flexDirection: "column", gap: 8 }} className="fade-in">
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Quick Actions</h3>
                <button className="action-btn" style={{ background: "#111827", color: "white" }}>+ New Campaign</button>
                <button className="action-btn" style={{ background: "#eff6ff", color: "#1d4ed8" }}>📂 Upload Prospects</button>
                <button className="action-btn" style={{ background: "#faf5ff", color: "#7c3aed" }}>🔗 Connect Email</button>
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 4 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", marginBottom: 9, textTransform: "uppercase", letterSpacing: "0.07em" }}>Monthly Usage</div>
                  <div style={{ height: 4, background: "#f1f5f9", borderRadius: 100, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg, #2563eb, #0891b2)", borderRadius: 100 }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: "#6b7280" }}>600 / 1,000 emails sent</div>
                </div>
              </div>
            </div>

            {/* ── PIPELINE ── */}
            <div style={{ background: "white", borderRadius: 14, padding: "20px 24px", border: "1px solid #e8e6e1", marginBottom: 18 }} className="fade-in">
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Pipeline Snapshot</h3>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Prospects Contacted", value: "1,284", color: "#2563eb" },
                  { label: "Awaiting Reply", value: "842", color: "#d97706" },
                  { label: "Replied", value: "240", color: "#0891b2" },
                  { label: "Meetings Scheduled", value: "28", color: "#7c3aed" },
                ].map((p) => (
                  <div key={p.label} className="pipeline-box">
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: p.color, marginBottom: 6, lineHeight: 1 }}>{p.value}</div>
                    <div style={{ fontSize: 11.5, color: "#9ca3af", fontWeight: 500 }}>{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CAMPAIGN TABLE ── */}
            <div style={{ background: "white", borderRadius: 14, border: "1px solid #e8e6e1", overflow: "hidden" }} className="fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 700, color: "#111827" }}>Recent Campaigns</h3>
                <button style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#374151", padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans'" }}>
                  View All →
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafaf8" }}>
                    {["Campaign", "Status", "Sent", "Open %", "Reply %", "Demos"].map((h) => (
                      <th key={h} style={{ padding: "10px 24px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={i} className="table-row" style={{ borderTop: "1px solid #f5f5f3" }}>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.name}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ background: statusColor[c.status].bg, color: statusColor[c.status].color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#4b5563" }}>{c.sent.toLocaleString()}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#4b5563" }}>{c.open}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, color: "#4b5563" }}>{c.reply}</td>
                      <td style={{ padding: "14px 24px", fontSize: 13, fontWeight: 700, color: c.demos > 0 ? "#7c3aed" : "#d1d5db" }}>
                        {c.demos > 0 ? c.demos : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;