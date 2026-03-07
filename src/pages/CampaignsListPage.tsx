import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Types matching DB schema exactly ──────────────────────
type Campaign = {
  id: string;
  organization_id: string;
  product_id: string;
  name: string;
  
  description: string | null;
  status: "Active" | "Paused" | "Draft" | "Completed";
  created_by: string;
  launch_date: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string; // joined from products in backend
};

type Product = {
  id: string;
  name: string;
  description: string;
  target_industry: string[];
  target_company_size: string;
  target_geography: string;
  primary_goal: string;
  campaigns_count: number;
  created_at: string;
};

const PORT = 3000;

const statusConfig = {
  Active: { bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
  Paused: { bg: "#fef9c3", color: "#92400e", dot: "#f59e0b" },
  Draft: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  Completed: { bg: "#ede9fe", color: "#6b21a8", dot: "#a855f7" },
};

const emptyForm = { name: "", product_id: "" };

const CampaignsListPage = () => {
  const nav = useNavigate();

  const [prod, setProd] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [apiErr, setApiErr] = useState("");
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");

  const filtered = filter === "All"
    ? campaigns
    : campaigns.filter(c => c.status === filter);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
    if (fieldErrors[id]) setFieldErrors(prev => ({ ...prev, [id]: "" }));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) { nav("/login"); return; }
    const parsed = JSON.parse(user);
    setOrgId(parsed.org_id);
    setUserId(parsed.id);

    const fetchProducts = async () => {
      try {
        const res = await axios.get(`http://localhost:${PORT}/product/get_product/${parsed.org_id}`);
        setProd(res.data.products || []);
      } catch { setProd([]); }
    };

    const fetchCampaigns = async () => {
      setFetching(true);
      try {
        const res = await axios.get(`http://localhost:${PORT}/campaigns/all_campaign/${parsed.org_id}`);
        setCampaigns(res.data.campaigns || []);
      } catch {
        setCampaigns([]);
      } finally {
        setFetching(false);
      }
    };



    fetchProducts();
    fetchCampaigns();
  }, []);
  
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Campaign name is required";
    if (!form.product_id) errors.product_id = "Please select a product";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setApiErr("");
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:${PORT}/campaigns/create_campaign`, {
        organization_id: orgId,
        product_id: form.product_id,
        name: form.name,
        created_by: userId,

      });

      const selectedProduct = prod.find(p => p.id === form.product_id);
      const newCampaign: Campaign = {
        ...res.data.campaign,
        product_name: selectedProduct?.name ?? "",
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      setSuccessMsg(`"${form.name}" created as Draft!`);
      setForm({ ...emptyForm });
      setShowModal(false);
      nav(`/campaigns/${newCampaign.id}`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      setApiErr(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ ...emptyForm });
    setFieldErrors({});
    setApiErr("");
  };

  const errStyle = (key: string): React.CSSProperties =>
    fieldErrors[key] ? { borderColor: "#ef4444", background: "rgba(239,68,68,0.03)" } : {};

  const counts = {
    All: campaigns.length,
    Active: campaigns.filter(c => c.status === "Active").length,
    Paused: campaigns.filter(c => c.status === "Paused").length,
    Draft: campaigns.filter(c => c.status === "Draft").length,
    Completed: campaigns.filter(c => c.status === "Completed").length,
  };

  const fmtDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return iso; }
  };

  const selectedProductDetails = prod.find(p => p.id === form.product_id);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f5f3", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#ddd; border-radius:4px; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn   { from{opacity:0;transform:scale(0.97) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer   { from{background-position:200% 0} to{background-position:-200% 0} }

        .fade-up   { animation:fadeUp    0.4s ease forwards; opacity:0; }
        .modal-box { animation:modalIn   0.28s ease forwards; }
        .overlay   { animation:overlayIn 0.22s ease forwards; }
        .float-anim{ animation:float     3s ease-in-out infinite; }

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

        .filter-chip {
          padding:7px 16px; border-radius:100px; border:1.5px solid #e5e7eb;
          background:white; font-size:12.5px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; color:#6b7280;
          transition:all 0.18s; display:inline-flex; align-items:center; gap:6px;
        }
        .filter-chip:hover  { border-color:#374151; color:#374151; }
        .filter-chip.active { background:#111827; border-color:#111827; color:white; }

        .campaign-row {
          display:grid;
          grid-template-columns: 2.4fr 1.4fr 0.9fr 0.7fr 0.7fr 0.7fr 110px;
          align-items:center; padding:16px 24px;
          border-bottom:1px solid #f5f5f3;
          transition:background 0.12s; cursor:pointer; gap:8px;
        }
        .campaign-row:hover { background:#fafaf8; }
        .campaign-row:last-child { border-bottom:none; }

        .primary-btn {
          background:#111827; color:white; border:none; padding:10px 22px;
          border-radius:9px; font-size:13px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
          display:inline-flex; align-items:center; gap:6px;
        }
        .primary-btn:hover    { background:#1e293b; transform:translateY(-1px); }
        .primary-btn:disabled { background:#9ca3af; cursor:not-allowed; transform:none; }

        .ghost-btn {
          background:white; color:#374151; border:1.5px solid #e5e7eb;
          padding:9px 18px; border-radius:9px; font-size:13px; font-weight:600;
          cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
        }
        .ghost-btn:hover { border-color:#111827; color:#111827; }

        .field-label {
          font-size:11px; font-weight:700; color:#6b7280; letter-spacing:0.08em;
          text-transform:uppercase; margin-bottom:6px; display:block;
        }
        .field-input {
          width:100%; padding:10px 13px; border:1.5px solid #e5e7eb; border-radius:9px;
          font-size:13.5px; font-family:'Plus Jakarta Sans',sans-serif; color:#111827;
          background:white; outline:none; transition:border-color 0.18s, background 0.18s;
        }
        .field-input:focus { border-color:#111827; }
        .field-select {
          width:100%; padding:10px 13px; border:1.5px solid #e5e7eb; border-radius:9px;
          font-size:13.5px; font-family:'Plus Jakarta Sans',sans-serif; color:#111827;
          background:white; outline:none; transition:border-color 0.18s; cursor:pointer;
        }
        .field-select:focus { border-color:#111827; }
        .field-err { font-size:11.5px; color:#ef4444; margin-top:5px; font-weight:500; display:flex; align-items:center; gap:4px; }
        .api-err-banner {
          background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.2);
          border-radius:9px; padding:11px 14px; color:#dc2626; font-size:13px;
          font-weight:500; display:flex; align-items:center; gap:8px;
          animation:shake 0.35s ease;
        }

        .stat-col { font-size:13px; color:#9ca3af; font-weight:500; }
        .summary-card {
          background:white; border-radius:13px; border:1px solid #e8e6e1;
          padding:18px 22px; flex:1; transition:all 0.18s;
        }
        .summary-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.06); }
        .row-action {
          background:transparent; border:1px solid #e5e7eb; color:#6b7280;
          padding:5px 11px; border-radius:7px; font-size:11.5px; font-weight:600;
          cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.15s;
        }
        .row-action:hover { border-color:#111827; color:#111827; }
        .shimmer {
          background:linear-gradient(90deg,#f0f0ee 25%,#e8e8e6 50%,#f0f0ee 75%);
          background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:8px;
        }
        .add-prod-btn {
          width:100%; padding:11px 14px; border-radius:9px;
          border:1.5px dashed #d1d5db; background:#fafaf8;
          color:#6b7280; font-size:13px; font-weight:500; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s;
          display:flex; align-items:center; gap:8px;
        }
        .add-prod-btn:hover { border-color:#2563eb; color:#2563eb; background:#eff6ff; }
        .add-prod-btn:hover .nudge-arrow { background:#2563eb; color:white; }
        .nudge-arrow {
          margin-left:auto; font-size:11px; background:#eff6ff; color:#2563eb;
          padding:3px 9px; border-radius:100px; font-weight:700; transition:all 0.2s;
          white-space:nowrap;
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 216, background: "#111827", display: "flex", flexDirection: "column", padding: "28px 12px", flexShrink: 0 }}>
        <div style={{ padding: "0 10px", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 700, fontSize: 19, color: "#fff" }}>LeadForge</div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)", marginTop: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>AI Outreach</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginBottom: 6 }}>Main</div>
          {[{ l: "Dashboard", a: false }, { l: "Campaigns", a: true }, { l: "Prospects", a: false }, { l: "Analytics", a: false }].map(item => (
            <div key={item.l} className={`app-nav-item ${item.a ? "active" : ""}`}>{item.l}</div>
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

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>

        {/* Page header */}
        <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 23, fontWeight: 700, color: "#111827", marginBottom: 4, letterSpacing: "-0.2px" }}>Campaigns</h1>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Manage and track all your outreach campaigns.
              {!fetching && (
                <span style={{ marginLeft: 8, background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>
                  {campaigns.length} total
                </span>
              )}
            </p>
          </div>
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create Campaign
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="fade-up" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "12px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span>✓</span> {successMsg}
          </div>
        )}

        {/* ── LOADING SKELETONS ── */}
        {fetching && (
          <div>
            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ flex: 1, background: "white", borderRadius: 13, border: "1px solid #e8e6e1", padding: "18px 22px" }}>
                  <div className="shimmer" style={{ width: 60, height: 11, marginBottom: 12 }} />
                  <div className="shimmer" style={{ width: 36, height: 28 }} />
                </div>
              ))}
            </div>
            <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e1", overflow: "hidden" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ padding: "18px 24px", borderBottom: "1px solid #f5f5f3", display: "flex", gap: 20, alignItems: "center" }}>
                  <div><div className="shimmer" style={{ width: 200, height: 14, marginBottom: 8 }} /><div className="shimmer" style={{ width: 100, height: 11 }} /></div>
                  <div className="shimmer" style={{ width: 90, height: 11, marginLeft: "auto" }} />
                  <div className="shimmer" style={{ width: 68, height: 24, borderRadius: 100 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AFTER FETCH ── */}
        {!fetching && (
          <>
            {/* Summary cards */}
            <div className="fade-up" style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Active", value: counts.Active, color: "#16a34a", bg: "#dcfce7" },
                { label: "Paused", value: counts.Paused, color: "#92400e", bg: "#fef9c3" },
                { label: "Draft", value: counts.Draft, color: "#475569", bg: "#f1f5f9" },
                { label: "Completed", value: counts.Completed, color: "#6b21a8", bg: "#ede9fe" },
              ].map(s => (
                <div key={s.label} className="summary-card">
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{s.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700, color: "#111827" }}>{s.value}</div>
                    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100 }}>campaigns</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter chips */}
            <div className="fade-up" style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {(["All", "Active", "Paused", "Draft", "Completed"] as const).map(f => (
                <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                  {f} <span style={{ opacity: 0.55, fontSize: 11 }}>{counts[f]}</span>
                </button>
              ))}
            </div>

            {/* ── DELIGHTFUL EMPTY STATE — no campaigns at all ── */}
            {campaigns.length === 0 && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", textAlign: "center", background: "white", borderRadius: 20, border: "1px solid #e8e6e1" }}>

                {/* Floating rocket */}
                <div className="float-anim" style={{ marginBottom: 26, position: "relative" }}>
                  <div style={{ width: 96, height: 96, borderRadius: 28, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", border: "2px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>
                    🚀
                  </div>
                  <div style={{ position: "absolute", top: -10, right: -14, width: 22, height: 22, borderRadius: "50%", background: "#fef9c3", border: "2px solid #fde047", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✦</div>
                  <div style={{ position: "absolute", bottom: -5, left: -16, width: 16, height: 16, borderRadius: "50%", background: "#dcfce7", border: "2px solid #86efac" }} />
                  <div style={{ position: "absolute", top: 10, left: -20, width: 12, height: 12, borderRadius: "50%", background: "#ede9fe", border: "2px solid #c4b5fd" }} />
                </div>

                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 10, letterSpacing: "-0.2px" }}>
                  Your first campaign awaits
                </h2>
                <p style={{ color: "#9ca3af", fontSize: 14, maxWidth: 380, lineHeight: 1.72, marginBottom: 6 }}>
                  Campaigns are how you reach your ideal customers at scale. Set one up and let LeadForge AI personalize every email automatically.
                </p>
                <p style={{ color: "#a78bfa", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
                  ✦ Takes less than 2 minutes to launch
                </p>

                {/* 3-step visual */}
                <div style={{ display: "flex", background: "#f8f8f6", borderRadius: 14, padding: "16px 20px", width: "100%", maxWidth: 460, marginBottom: 28, gap: 0 }}>
                  {[
                    { n: "1", title: "Name it", sub: "Give your campaign a focus" },
                    { n: "2", title: "Pick product", sub: "AI grabs target settings" },
                    { n: "3", title: "Launch 🚀", sub: "Start booking demos today" },
                  ].map((s, i) => (
                    <div key={s.n} style={{ flex: 1, textAlign: "center", padding: "0 8px", position: "relative" }}>
                      {i < 2 && <div style={{ position: "absolute", right: 0, top: "28%", height: "44%", width: 1, background: "#e5e7eb" }} />}
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111827", color: "white", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{s.n}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                <button className="primary-btn" style={{ padding: "12px 32px", fontSize: 14 }} onClick={() => setShowModal(true)}>
                  <span style={{ fontSize: 18 }}>+</span> Create Your First Campaign
                </button>
              </div>
            )}

            {/* ── FILTERED EMPTY (campaigns exist but filter = 0) ── */}
            {campaigns.length > 0 && filtered.length === 0 && (
              <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px", textAlign: "center", background: "white", borderRadius: 16, border: "1px solid #e8e6e1" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>📭</div>
                <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                  No {filter.toLowerCase()} campaigns
                </h3>
                <p style={{ color: "#9ca3af", fontSize: 13.5, marginBottom: 20 }}>
                  You don't have any {filter.toLowerCase()} campaigns right now.
                </p>
                <button className="ghost-btn" onClick={() => setFilter("All")}>View all campaigns</button>
              </div>
            )}

            {/* ── CAMPAIGNS TABLE ── */}
            {filtered.length > 0 && (
              <div className="fade-up" style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e1", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1.4fr 0.9fr 0.7fr 0.7fr 0.7fr 110px", gap: 8, padding: "11px 24px", background: "#fafaf8", borderBottom: "1px solid #f1f1ef" }}>
                  {["Campaign", "Product", "Status", "Open %", "Reply %", "Demos", ""].map(h => (
                    <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</div>
                  ))}
                </div>

                {filtered.map((c, i) => {
                  const sc = statusConfig[c.status] || statusConfig.Draft;
                  return (
                    <div key={c.id} className="campaign-row fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      {/* Name + date */}
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{c.name}</div>
                        <span style={{ fontSize: 11.5, color: "#9ca3af" }}>Created {fmtDate(c.created_at)}</span>
                      </div>

                      {/* Product */}
                      <div style={{ fontSize: 12.5, color: "#6b7280", fontWeight: 500 }}>
                        {c.product_name ?? "—"}
                      </div>

                      {/* Status */}
                      <div>
                        <span style={{ background: sc.bg, color: sc.color, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 100, display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                          {c.status}
                        </span>
                      </div>

                      {/* Stats — dashes until campaign runs */}
                      <div className="stat-col">—</div>
                      <div className="stat-col">—</div>
                      <div className="stat-col">—</div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="row-action" onClick={() => nav(`/campaigns/${c.id}`)}>Open</button>
                        <button className="row-action" style={{ color: "#dc2626", borderColor: "#fecaca" }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ CREATE CAMPAIGN MODAL ══ */}
      {showModal && (
        <div className="overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div className="modal-box" style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>

            <div style={{ padding: "26px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Create New Campaign</h2>
                <p style={{ fontSize: 12.5, color: "#9ca3af" }}>Fields marked <span style={{ color: "#ef4444" }}>*</span> are required.</p>
              </div>
              <button onClick={closeModal} style={{ background: "#f5f5f3", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 15, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

              {apiErr && <div className="api-err-banner"><span>⚠️</span> {apiErr}</div>}

              {/* Campaign Name */}
              <div>
                <label className="field-label" htmlFor="name">Campaign Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input id="name" className="field-input" placeholder="e.g. US Fintech Outreach Q2" value={form.name} onChange={handleChange} style={errStyle("name")} />
                {fieldErrors.name && <p className="field-err">⚠ {fieldErrors.name}</p>}
              </div>

              {/* Product */}
              <div>
                <label className="field-label" htmlFor="product_id">
                  Product <span style={{ color: "#ef4444" }}>*</span>
                </label>

                {prod.length > 0 ? (
                  <>
                    <select id="product_id" className="field-select" value={form.product_id} onChange={handleChange} style={errStyle("product_id")}>
                      <option value="">Select a product</option>
                      {prod.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {fieldErrors.product_id && <p className="field-err">⚠ {fieldErrors.product_id}</p>}

                    {/* Product details preview after selection */}
                    {selectedProductDetails && (
                      <div style={{ marginTop: 10, background: "#f8f8f6", border: "1px solid #e8e6e1", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                          Auto-applied from product
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {[
                            { icon: "🎯", val: selectedProductDetails.target_industry?.join(", ") || "Any industry" },
                            { icon: "🏢", val: selectedProductDetails.target_company_size || "Any size" },
                            { icon: "🌍", val: selectedProductDetails.target_geography || "Global" },
                            { icon: "🚀", val: selectedProductDetails.primary_goal },
                          ].map(chip => chip.val && (
                            <span key={chip.icon} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 7, padding: "4px 10px", fontSize: 11.5, color: "#374151", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              {chip.icon} {chip.val}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add product nudge */}
                    <button type="button" className="add-prod-btn" style={{ marginTop: 10 }} onClick={() => { closeModal(); nav("/products"); }}>
                      <span style={{ fontSize: 16 }}>+</span>
                      <span>Don't see your product? <strong>Add a new product</strong></span>
                      <span className="nudge-arrow">Go to Products →</span>
                    </button>
                  </>
                ) : (
                  /* No products — full CTA block */
                  <div style={{ border: "1.5px dashed #e0ddd6", borderRadius: 12, padding: "22px 20px", textAlign: "center", background: "#fafaf8" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827", marginBottom: 6 }}>No products added yet</div>
                    <p style={{ fontSize: 12.5, color: "#9ca3af", lineHeight: 1.65, marginBottom: 16 }}>
                      You need at least one product to create a campaign. Products define your target audience automatically.
                    </p>
                    <button type="button" onClick={() => { closeModal(); nav("/products"); }}
                      style={{ background: "#111827", color: "white", border: "none", padding: "10px 22px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 15 }}>+</span> Add Your First Product
                    </button>
                  </div>
                )}
              </div>

              {/* Info note */}
              <div style={{ background: "#f8f8f6", borderRadius: 9, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6 }}>
                  Campaign starts as a <strong style={{ color: "#374151" }}>Draft</strong>. Target geography, company size, and goal are pulled from your selected product automatically.
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button className="ghost-btn" onClick={closeModal}>Cancel</button>
                <button className="primary-btn" onClick={handleCreate} disabled={loading || prod.length === 0}>
                  {loading ? "Creating…" : "Create Campaign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsListPage;