import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Type matches DB column names exactly ──────────────────
type Product = {
  id: string;
  name: string;
  description: string;
  target_industry: string[];      // DB: target_industry
  target_company_size: string;   // DB: target_company_size
  target_geography: string;      // DB: target_geography
  primary_goal: string;          // DB: primary_goal
  campaigns_count: number;       // DB: campaigns_count
  created_at: string;            // DB: created_at
};

const PORT = 3000;
const navItems = [
  { label: "Dashboard", active: true, link: "/dashboard" },
  { label: "Campaigns", active: false, link: "/campaigns" },
  { label: "Products", active: false, link: "/products" },
  { label: "Prospects", active: false, link: "/prospects" },
  { label: "Analytics", active: false, link: "/dashboard" },
  { label: "Email Accounts", active: false, link: "/dashboard" },
  { label: "Settings", active: false, link: "/profile" },


];
const emptyForm = {
  org_id: "",
  name: "",
  description: "",
  targetIndustry: [] as string[],
  targetSize: "",
  targetGeo: "",
  primaryGoal: "",
};

const industryOptions = ["SaaS", "Fintech", "Edtech", "Healthtech", "AI", "Marketplace", "E-commerce", "Other"];
const sizeOptions = ["1–10 employees", "10–50", "50–200", "200+"];
const geoOptions = ["India", "US", "Europe", "Global"];
const goalOptions = ["Book demos", "Generate leads", "Enterprise outreach", "Expand internationally"];

const goalColors: Record<string, { bg: string; color: string }> = {
  "Book demos": { bg: "#eff6ff", color: "#2563eb" },
  "Generate leads": { bg: "#f0fdf4", color: "#16a34a" },
  "Enterprise outreach": { bg: "#faf5ff", color: "#7c3aed" },
  "Expand internationally": { bg: "#fff7ed", color: "#ea580c" },
};

const requiredFields = ["name", "description", "targetSize", "targetGeo", "primaryGoal"] as const;
const fieldLabels: Record<string, string> = {
  name: "Product Name",
  description: "Description",
  targetSize: "Target Company Size",
  targetGeo: "Target Geography",
  primaryGoal: "Primary Goal",
};

const ProductPage = () => {
  const nav = useNavigate();
  const [dashData, setDashData] = useState({
    "name": "",
    "plan": ""
  })
  // ✅ Fix 1: useState needs ([]) not just <Product[]>
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [deletedProd,setDeletedProd] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({ ...emptyForm });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  const fetch_prod = async (id: string) => {
    setFetching(true);
    try {
      const res = await axios.get(`http://localhost:${PORT}/product/get_product/${id}`);
      setProducts(res.data.products || []);
    } catch (error) {
      console.log("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!user || !token) { nav("/login"); return; }
    const parsed = JSON.parse(user);
    setDashData({
      ...dashData,
      "name": parsed.full_name,
      "plan": parsed.organization.plan_type
    })
    setForm(prev => ({ ...prev, org_id: parsed.org_id }));
    fetch_prod(parsed.org_id);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
    if (id === "description") setCharCount(value.length);
    if (fieldErrors[id]) setFieldErrors(prev => ({ ...prev, [id]: "" }));
  };

  const toggleIndustry = (val: string) => {
    setForm(prev => ({
      ...prev,
      targetIndustry: prev.targetIndustry.includes(val)
        ? prev.targetIndustry.filter(v => v !== val)
        : [...prev.targetIndustry, val],
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    for (const key of requiredFields) {
      const val = form[key as keyof typeof form];
      if (!val || (typeof val === "string" && val.trim() === "")) {
        errors[key] = `${fieldLabels[key]} is required`;
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccessMsg("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (editId !== null) {

        await axios.put(`http://localhost:${PORT}/product/update_product/${editId}`, {
          name: form.name,
          description: form.description,
          target_industry: form.targetIndustry,
          target_company_size: form.targetSize,
          target_geography: form.targetGeo,
          primary_goal: form.primaryGoal,
        });
        // ✅ Update local state with snake_case keys to match Product type
        setProducts(prev => prev.map(p =>
          p.id === editId
            ? {
              ...p,
              name: form.name,
              description: form.description,
              target_industry: form.targetIndustry,
              target_company_size: form.targetSize,
              target_geography: form.targetGeo,
              primary_goal: form.primaryGoal,
            }
            : p
        ));
        setSuccessMsg(`${form.name} has been updated successfully!`);
      } else {
        // POST to add
        const res = await axios.post(`http://localhost:${PORT}/product/add_product`, {
          org_id: form.org_id,
          name: form.name,
          description: form.description,
          target_industry: form.targetIndustry,
          target_company_size: form.targetSize,
          target_geography: form.targetGeo,
          primary_goal: form.primaryGoal,
        });
        // ✅ Push new product using snake_case to match Product type
        const newProduct: Product = {
          id: res.data.product?.id ?? String(Date.now()),
          name: form.name,
          description: form.description,
          target_industry: form.targetIndustry,
          target_company_size: form.targetSize,
          target_geography: form.targetGeo,
          primary_goal: form.primaryGoal,
          campaigns_count: 0,
          created_at: new Date().toISOString(),
        };
        setProducts(prev => [...prev, newProduct]);
        setSuccessMsg("Product added successfully!");
      }
      closeModal();
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (error: any) {
      setApiError(error.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm(prev => ({ ...emptyForm, org_id: prev.org_id }));
    setEditId(null);
    setCharCount(0);
    setFieldErrors({});
    setApiError("");
    setShowModal(true);
  };

  // ✅ Fix 2: openEdit now maps snake_case DB fields → camelCase form fields
  const openEdit = (p: Product) => {
    setForm(prev => ({
      ...prev,
      name: p.name,
      description: p.description,
      targetIndustry: Array.isArray(p.target_industry) ? [...p.target_industry] : [],
      targetSize: p.target_company_size,
      targetGeo: p.target_geography,
      primaryGoal: p.primary_goal,
    }));
    setCharCount(p.description.length);
    setEditId(p.id);
    setFieldErrors({});
    setApiError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFieldErrors({});
    setApiError("");
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const prod = await axios.delete(`http://localhost:${PORT}/product/delete/${deleteId}`);
      if (prod.data.error){
        setApiError(prod.data.error);
        return
      }
      setDeletedProd(prod.data.name)
      setProducts(prev => prev.filter(p => p.id !== deleteId));
      setSuccessMsg(`${deletedProd} deleted successfully.`);
      setDeletedProd("");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setApiError("Failed to delete. Try again.");
    } finally {
      setDeleteId(null);
    }
  };

  const errStyle = (key: string): React.CSSProperties =>
    fieldErrors[key] ? { borderColor: "#ef4444", background: "rgba(239,68,68,0.03)" } : {};

  // Format date nicely
  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return iso; }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f5f5f3", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn   { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes overlayIn { from{opacity:0} to{opacity:1} }
        @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .fade-up   { animation: fadeUp    0.42s ease forwards; opacity:0; }
        .modal-box { animation: modalIn   0.28s ease forwards; }
        .overlay   { animation: overlayIn 0.22s ease forwards; }
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
        

        .product-card {
          background:white; border-radius:16px; border:1px solid #e8e6e1;
          padding:26px; transition:all 0.22s ease; position:relative; overflow:hidden;
          display:flex; flex-direction:column;
        }
        .product-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.08); }
        .product-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,#2563eb,#0891b2); opacity:0; transition:opacity 0.22s;
          border-radius:16px 16px 0 0;
        }
        .product-card:hover::before { opacity:1; }

        .info-chip {
          display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:7px;
          font-size:11.5px; font-weight:600; background:#f8f8f6; color:#4b5563; border:1px solid #eeede9;
        }

        .industry-chip {
          padding:5px 12px; border-radius:100px; border:1.5px solid #e0ddd6; background:white;
          font-size:12px; font-family:'Plus Jakarta Sans',sans-serif; color:#555;
          cursor:pointer; transition:all 0.18s; white-space:nowrap;
        }
        .industry-chip:hover { border-color:#111827; color:#111827; }
        .industry-chip.sel   { background:#111827; border-color:#111827; color:white; }

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

        .field-err {
          font-size:11.5px; color:#ef4444; margin-top:5px; font-weight:500;
          display:flex; align-items:center; gap:4px;
        }
        .api-err-banner {
          background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.25);
          border-radius:9px; padding:11px 14px; color:#dc2626;
          font-size:13px; font-weight:500; display:flex; align-items:center; gap:8px;
          animation: shake 0.35s ease;
        }

        .primary-btn {
          background:#111827; color:white; border:none; padding:10px 22px; border-radius:9px;
          font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
          transition:all 0.18s; display:inline-flex; align-items:center; gap:6px;
        }
        .primary-btn:hover    { background:#1e293b; transform:translateY(-1px); }
        .primary-btn:disabled { background:#9ca3af; cursor:not-allowed; transform:none; }

        .ghost-btn {
          background:white; color:#374151; border:1.5px solid #e5e7eb; padding:10px 20px;
          border-radius:9px; font-size:13px; font-weight:600; cursor:pointer;
          font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.18s;
        }
        .ghost-btn:hover { border-color:#111827; color:#111827; }

        .icon-btn {
          display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:8px;
          font-size:12px; font-weight:600; cursor:pointer; border:1px solid; transition:all 0.18s;
          font-family:'Plus Jakarta Sans',sans-serif; background:transparent;
        }
        .icon-btn.edit { border-color:#e5e7eb; color:#374151; }
        .icon-btn.edit:hover { border-color:#111827; color:#111827; background:#f9f9f7; }
        .icon-btn.del  { border-color:#fecaca; color:#dc2626; }
        .icon-btn.del:hover  { background:#fef2f2; }
        .icon-btn.view { border-color:#dbeafe; color:#2563eb; }
        .icon-btn.view:hover { background:#eff6ff; }

        .divider       { height:1px; background:#f1f1ef; margin:18px 0; }
        .section-label { font-size:11px; font-weight:700; color:#9ca3af; letter-spacing:0.1em; text-transform:uppercase; }

        /* skeleton shimmer */
        .shimmer {
          background: linear-gradient(90deg, #f0f0ee 25%, #e8e8e6 50%, #f0f0ee 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }
        @keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
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
              <button onClick={() => nav(item.link)}><span>{item.label}</span></button>
            </div>
          ))}

          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginTop: 22, marginBottom: 6 }}>Account</div>
          {navItems.slice(4).map((item) => (
            <div key={item.label} className={`nav-item ${item.active ? "active" : ""}`}>
              <button onClick={() => nav(item.link)}><span>{item.label}</span></button>
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
      <div style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>

        {/* Page header */}
        <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 23, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Products</h1>
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              Manage the products you promote through outbound campaigns.
              {!fetching && <span style={{ marginLeft: 8, background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 100 }}>{products.length} total</span>}
            </p>
          </div>
          <button className="primary-btn" onClick={openAdd}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Product
          </button>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="fade-up" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "12px 16px", color: "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15 }}>✓</span>
            {/* ✅ render msg as-is, the name is already embedded in it */}
            {successMsg}
          </div>
        )}

        {/* ── LOADING SKELETONS ── */}
        {fetching && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 18 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e1", padding: 26 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div className="shimmer" style={{ width: 160, height: 18, marginBottom: 10 }} />
                    <div className="shimmer" style={{ width: 260, height: 13, marginBottom: 6 }} />
                    <div className="shimmer" style={{ width: 200, height: 13 }} />
                  </div>
                  <div className="shimmer" style={{ width: 80, height: 24, borderRadius: 100 }} />
                </div>
                <div style={{ height: 1, background: "#f1f1ef", margin: "14px 0" }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                  <div className="shimmer" style={{ width: 90, height: 26, borderRadius: 7 }} />
                  <div className="shimmer" style={{ width: 70, height: 26, borderRadius: 7 }} />
                  <div className="shimmer" style={{ width: 60, height: 26, borderRadius: 7 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="shimmer" style={{ width: 120, height: 14 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <div className="shimmer" style={{ width: 90, height: 30, borderRadius: 8 }} />
                    <div className="shimmer" style={{ width: 60, height: 30, borderRadius: 8 }} />
                    <div className="shimmer" style={{ width: 36, height: 30, borderRadius: 8 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EMPTY STATE (after fetch, no products) ── */}
        {!fetching && products.length === 0 && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 24px", textAlign: "center" }}>
            {/* Illustration box */}
            <div style={{ position: "relative", marginBottom: 28 }}>
              <div style={{ width: 88, height: 88, borderRadius: 24, background: "#f8f8f6", border: "2px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
                📦
              </div>
              <div style={{ position: "absolute", top: -8, right: -8, width: 28, height: 28, borderRadius: "50%", background: "#fef9c3", border: "2px solid #fde047", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>!</div>
            </div>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
              Sorry, no products available
            </h2>
            <p style={{ color: "#9ca3af", fontSize: 14, maxWidth: 360, lineHeight: 1.7, marginBottom: 8 }}>
              You haven't added any products yet. Products help our AI personalize your outreach and calculate fit scores for each prospect.
            </p>
            <p style={{ color: "#c4b5fd", fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
              ✦ Add a product to unlock AI-powered campaigns
            </p>
            <button className="primary-btn" style={{ padding: "12px 28px", fontSize: 14 }} onClick={openAdd}>
              <span style={{ fontSize: 16 }}>+</span> Add Your First Product
            </button>
          </div>
        )}

        {/* ── PRODUCT CARDS ── */}
        {!fetching && products.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 18 }}>
            {products.map((p, idx) => {
              // ✅ Fix 3: use snake_case fields from DB
              const gc = goalColors[p.primary_goal] || { bg: "#f1f5f9", color: "#475569" };
              const industries = Array.isArray(p.target_industry) ? p.target_industry : [];

              return (
                <div key={p.id} className="product-card fade-up" style={{ animationDelay: `${idx * 0.07}s` }}>

                  {/* Top row: name + goal badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ flex: 1, marginRight: 14 }}>
                      <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 7, lineHeight: 1.25 }}>
                        {p.name}
                      </h3>
                      <p style={{
                        fontSize: 13, color: "#6b7280", lineHeight: 1.65,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {p.description}
                      </p>
                    </div>
                    {/* ✅ p.primary_goal not p.primaryGoal */}
                    <span style={{ background: gc.bg, color: gc.color, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 100, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${gc.color}22` }}>
                      {p.primary_goal}
                    </span>
                  </div>

                  <div className="divider" />

                  {/* Info chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                    {/* ✅ p.target_industry not p.targetIndustry */}
                    <span className="info-chip">
                      🎯 {industries.length > 0 ? industries.join(", ") : "Any industry"}
                    </span>
                    {/* ✅ p.target_company_size not p.targetSize */}
                    <span className="info-chip">🏢 {p.target_company_size || "Any size"}</span>
                    {/* ✅ p.target_geography not p.targetGeo */}
                    <span className="info-chip">🌍 {p.target_geography || "Global"}</span>
                  </div>

                  {/* Footer row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* ✅ p.campaigns_count not p.campaigns */}
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: (p.campaigns_count ?? 0) > 0 ? "#16a34a" : "#d1d5db" }} />
                        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
                          {p.campaigns_count ?? 0} campaign{(p.campaigns_count ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span style={{ color: "#e5e7eb" }}>·</span>
                      {/* ✅ p.created_at not p.createdAt */}
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{fmtDate(p.created_at)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="icon-btn view">👁 Campaigns</button>
                      <button className="icon-btn edit" onClick={() => openEdit(p)}>✏ Edit</button>
                      <button className="icon-btn del" onClick={() => setDeleteId(p.id)}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <div className="overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div className="modal-box" style={{ background: "white", borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>

            <div style={{ padding: "26px 28px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
                  {editId !== null ? "Edit Product" : "Add New Product"}
                </h2>
                <p style={{ fontSize: 12.5, color: "#9ca3af" }}>Fields marked <span style={{ color: "#ef4444" }}>*</span> are required.</p>
              </div>
              <button onClick={closeModal} style={{ background: "#f5f5f3", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 15, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 18 }}>

              {apiError && (
                <div className="api-err-banner">
                  <span style={{ fontSize: 16 }}>⚠️</span> {apiError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="field-label" htmlFor="name">Product Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input id="name" className="field-input" placeholder="e.g. LeadForge Core" value={form.name} onChange={handleChange} style={errStyle("name")} />
                {fieldErrors.name && <p className="field-err">⚠ {fieldErrors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label className="field-label" htmlFor="description" style={{ marginBottom: 0 }}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                  <span style={{ fontSize: 11, color: charCount > 450 ? "#ef4444" : "#9ca3af" }}>{charCount} / 500</span>
                </div>
                <textarea id="description" className="field-input" placeholder="Describe what your product does…" rows={3} maxLength={500} value={form.description} onChange={handleChange} style={{ resize: "none", ...errStyle("description") }} />
                {fieldErrors.description && <p className="field-err">⚠ {fieldErrors.description}</p>}
              </div>

              <div className="divider" style={{ margin: "2px 0" }} />
              <p className="section-label">Target Audience</p>

              {/* Industry chips */}
              <div>
                <label className="field-label">Target Industry <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", fontSize: 10, letterSpacing: 0 }}>(optional)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {industryOptions.map(opt => (
                    <button key={opt} type="button" className={`industry-chip ${form.targetIndustry.includes(opt) ? "sel" : ""}`} onClick={() => toggleIndustry(opt)}>{opt}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label className="field-label" htmlFor="targetSize">Company Size <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="targetSize" className="field-select" value={form.targetSize} onChange={handleChange} style={errStyle("targetSize")}>
                    <option value="">Select size</option>
                    {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {fieldErrors.targetSize && <p className="field-err">⚠ {fieldErrors.targetSize}</p>}
                </div>
                <div>
                  <label className="field-label" htmlFor="targetGeo">Geography <span style={{ color: "#ef4444" }}>*</span></label>
                  <select id="targetGeo" className="field-select" value={form.targetGeo} onChange={handleChange} style={errStyle("targetGeo")}>
                    <option value="">Select geography</option>
                    {geoOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {fieldErrors.targetGeo && <p className="field-err">⚠ {fieldErrors.targetGeo}</p>}
                </div>
              </div>

              <div className="divider" style={{ margin: "2px 0" }} />
              <p className="section-label">Campaign Goal</p>

              {/* Primary Goal buttons */}
              <div>
                <label className="field-label">Primary Goal <span style={{ color: "#ef4444" }}>*</span></label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {goalOptions.map(g => {
                    const selected = form.primaryGoal === g;
                    const gc = goalColors[g] || { bg: "#f1f5f9", color: "#475569" };
                    return (
                      <button key={g} type="button"
                        onClick={() => { setForm(prev => ({ ...prev, primaryGoal: g })); if (fieldErrors.primaryGoal) setFieldErrors(prev => ({ ...prev, primaryGoal: "" })); }}
                        style={{ padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${selected ? gc.color : fieldErrors.primaryGoal ? "#ef4444" : "#e5e7eb"}`, background: selected ? gc.bg : fieldErrors.primaryGoal ? "rgba(239,68,68,0.03)" : "white", color: selected ? gc.color : "#6b7280", fontSize: 13, fontWeight: selected ? 700 : 500, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: "left", transition: "all 0.18s" }}>
                        {g}
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.primaryGoal && <p className="field-err" style={{ marginTop: 8 }}>⚠ {fieldErrors.primaryGoal}</p>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button type="button" className="ghost-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? "Saving…" : editId !== null ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteId !== null && (
        <div className="overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div className="modal-box" style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 400, padding: "28px", boxShadow: "0 24px 60px rgba(0,0,0,0.18)", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>🗑</div>
            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Delete this product?</h3>
            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.65, marginBottom: 24 }}>
              This will permanently remove the product and unlink it from any active campaigns.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="ghost-btn" onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ background: "#dc2626", color: "white", border: "none", padding: "10px 22px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans'" }} onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;