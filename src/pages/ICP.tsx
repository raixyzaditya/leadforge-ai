import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const organizationMap: Record<string, string> = {
  ibm: "IBM",
  kpmg: "KPMG",
  deloitte: "Deloitte",
  amazon: "Amazon",
};

const entities: Record<string, string> = {
  company_name: "Company Name",

  company_business: "What does your company sell?",
  industry: "Industry",
  product_description: "Product Description",
  ideal_customer: "Ideal Customer",
  target_size: "Target Company Size",
  primary_goal: "Primary Goal",
  target_geography: "Target Geography",
}

const PORT = 3000;

const ICP = () => {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState({
    user_id: "",
    domain:"",
    company_name: "",
    
    industry: "",
    
    ideal_customer: [] as string[],
    target_size: "",
    primary_goal: "",
    target_geography: "",
  });

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      nav("/login");
      return;
    }
    const parsed = JSON.parse(user);
    const d = parsed.email.split("@")[1]?.split(".")[0] || "";
    
    const companyName = organizationMap[d] || d;
    setOrgData((prev) => ({
      ...prev,
      user_id: parsed.id,
      company_name: companyName,
      domain:d+".com"
    }));
  }, []);

  const validate = () => {
    const errors: Record<string, boolean> = {};
    let firstErrorKey = "";

    for (const [key, value] of Object.entries(orgData)) {
      if (key === "user_id") continue;
      if (value === "" || (Array.isArray(value) && value.length === 0)) {
        errors[key] = true;
        if (!firstErrorKey) firstErrorKey = key;
      }
    }

    setFieldErrors(errors);

    if (firstErrorKey) {
      setErr(`Please fill in the ${entities[firstErrorKey]} field`);
      return false;
    }

    setErr("");
    return true;
  };

  // Step 1 continue — validate only step 1 fields
  const handleStep1Continue = () => {
    const step1Fields = ["company_name", "industry"];
    const errors: Record<string, boolean> = {};
    let firstErrorKey = "";

    for (const key of step1Fields) {
      const value = orgData[key as keyof typeof orgData];
      if (value === "" || (Array.isArray(value) && value.length === 0)) {
        errors[key] = true;
        if (!firstErrorKey) firstErrorKey = key;
      }
    }

    setFieldErrors(errors);

    if (firstErrorKey) {
      setErr(`Please fill in the ${entities[firstErrorKey]} field`);
      return;
    }

    setErr("");
    setStep(2);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setOrgData({ ...orgData, [e.target.id]: e.target.value });
    // Clear error for this field as user types
    if (fieldErrors[e.target.id]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.id]: false }));
    }
  };

  const toggleICP = (val: string) => {
    setOrgData((prev) => ({
      ...prev,
      ideal_customer: prev.ideal_customer.includes(val)
        ? prev.ideal_customer.filter((v) => v !== val)
        : [...prev.ideal_customer, val],
    }));
    if (fieldErrors["ideal_customer"]) {
      setFieldErrors((prev) => ({ ...prev, ideal_customer: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sending orgData:", orgData);  
    console.log("ideal_customer:", orgData.ideal_customer);
    setErr("");
    const valid = validate();
    if (valid) {
      setLoading(true);
      try {
        const res = await axios.post(`http://localhost:${PORT}/org/create`, orgData);
        localStorage.setItem("user",JSON.stringify(res.data.user));
        nav("/plans");
      } catch (error: any) {
        setErr(error.response?.data?.error || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  const icpOptions = [
    "SaaS companies",
    "Fintech startups",
    "E-commerce brands",
    "Marketplaces",
    "Enterprises",
    "SMBs",
  ];

  // Helper: returns error border style if field has an error
  const errorStyle = (fieldKey: string): React.CSSProperties =>
    fieldErrors[fieldKey]
      ? { borderColor: "#ef4444", background: "rgba(239,68,68,0.04)" }
      : {};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f7f4",
        fontFamily: "'Instrument Sans', sans-serif",
        display: "flex",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,700;1,600&display=swap');

        @keyframes floatA {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(12deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-8deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-22px) rotate(60deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes thinkBubble {
          0%,100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .step-form { animation: fadeSlideIn 0.4s ease forwards; }
        .field-error { animation: shake 0.4s ease; }

        .icp-chip {
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 100px;
          border: 1.5px solid #d4d0c8;
          background: white;
          font-size: 13px;
          font-family: 'Instrument Sans', sans-serif;
          color: #555;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .icp-chip:hover { border-color: #2d2d2d; color: #2d2d2d; }
        .icp-chip.selected {
          background: #2d2d2d;
          border-color: #2d2d2d;
          color: white;
        }

        .field-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e0ddd6;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Instrument Sans', sans-serif;
          background: white;
          color: #2d2d2d;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .field-input:focus { border-color: #2d2d2d; }
        .field-input.has-error {
          border-color: #ef4444 !important;
          background: rgba(239,68,68,0.04) !important;
        }
        .field-input.has-error:focus { border-color: #dc2626 !important; }

        .icp-group-error {
          border: 1.5px solid #ef4444;
          border-radius: 12px;
          padding: 10px;
          background: rgba(239,68,68,0.04);
          animation: shake 0.4s ease;
        }

        .next-btn {
          background: #2d2d2d;
          color: white;
          border: none;
          padding: 13px 32px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Instrument Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
        }
        .next-btn:hover { background: #111; transform: translateY(-1px); }
        .next-btn:disabled { background: #aaa; cursor: not-allowed; transform: none; }

        .back-btn {
          background: transparent;
          color: #888;
          border: 1.5px solid #e0ddd6;
          padding: 13px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Instrument Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-btn:hover { border-color: #2d2d2d; color: #2d2d2d; }

        label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #555;
          margin-bottom: 6px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .required-star {
          color: #ef4444;
          margin-left: 3px;
          font-size: 14px;
          vertical-align: top;
          line-height: 1;
        }

        .error-hint {
          font-size: 11px;
          color: #ef4444;
          margin-top: 4px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
      `}</style>

      {/* ── LEFT PANEL — Illustration ── */}
      <div
        style={{
          width: "42%",
          minHeight: "100vh",
          background: "#1e1e1e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          padding: "48px 40px",
        }}
      >
        {/* subtle grid texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* floating shapes above boy */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <div
            style={{
              position: "absolute",
              top: -90,
              left: 30,
              width: 0,
              height: 0,
              borderLeft: "18px solid transparent",
              borderRight: "18px solid transparent",
              borderBottom: "30px solid #c8f150",
              animation: "floatA 4s ease-in-out infinite",
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -110,
              left: 120,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#f4a261",
              animation: "floatB 5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -75,
              right: 40,
              width: 18,
              height: 18,
              background: "#7dd3fc",
              borderRadius: 3,
              animation: "floatC 3.5s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -130,
              right: 100,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "3px solid #f4a261",
              animation: "floatA 6s ease-in-out infinite reverse",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -60,
              left: 80,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#c8f150",
              animation: "floatB 4.5s ease-in-out infinite 1s",
            }}
          />

          {/* Think bubbles */}
          <div
            style={{
              position: "absolute",
              top: -50,
              right: 20,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              alignItems: "flex-end",
            }}
          >
            {["ICP", "Market", "Goals"].map((txt, i) => (
              <div
                key={txt}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  animation: `thinkBubble ${2.5 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`,
                  fontFamily: "'Instrument Sans', sans-serif",
                }}
              >
                {txt}
              </div>
            ))}
          </div>

          {/* SVG Boy thinking */}
          <svg
            width="260"
            height="300"
            viewBox="0 0 260 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="130" cy="292" rx="55" ry="8" fill="rgba(0,0,0,0.3)" />
            <rect x="88" y="160" width="84" height="100" rx="12" fill="#2a7d6b" />
            <path d="M115 160 L130 185 L145 160" fill="#e8e8e8" />
            <rect x="60" y="168" width="30" height="16" rx="8" fill="#2a7d6b" transform="rotate(30 60 168)" />
            <ellipse cx="62" cy="200" rx="12" ry="10" fill="#f4c89a" transform="rotate(10 62 200)" />
            <rect x="170" y="162" width="30" height="16" rx="8" fill="#2a7d6b" transform="rotate(-50 170 162)" />
            <ellipse cx="186" cy="148" rx="13" ry="11" fill="#f4c89a" />
            <rect x="92" y="248" width="28" height="50" rx="10" fill="#3d3d5c" />
            <rect x="140" y="248" width="28" height="50" rx="10" fill="#3d3d5c" />
            <rect x="84" y="290" width="40" height="14" rx="7" fill="#2d2d2d" />
            <rect x="132" y="290" width="40" height="14" rx="7" fill="#2d2d2d" />
            <rect x="118" y="136" width="24" height="28" rx="6" fill="#f4c89a" />
            <ellipse cx="130" cy="110" rx="44" ry="46" fill="#f4c89a" />
            <path d="M88 100 Q88 60 130 62 Q172 60 172 100 Q165 72 130 70 Q95 72 88 100Z" fill="#2d2020" />
            <path d="M88 100 Q82 85 90 75 Q88 95 92 105Z" fill="#2d2020" />
            <ellipse cx="114" cy="108" rx="7" ry="7.5" fill="white" />
            <ellipse cx="146" cy="108" rx="7" ry="7.5" fill="white" />
            <circle cx="116" cy="106" r="4" fill="#2d2d2d" />
            <circle cx="148" cy="106" r="4" fill="#2d2d2d" />
            <circle cx="117" cy="105" r="1.5" fill="white" />
            <circle cx="149" cy="105" r="1.5" fill="white" />
            <path d="M107 97 Q114 92 121 95" stroke="#2d2020" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M139 95 Q146 92 153 97" stroke="#2d2020" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M128 115 Q126 122 130 123 Q134 122 132 115" stroke="#e0a070" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M118 132 Q130 140 143 133" stroke="#c47b50" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="86" cy="112" rx="7" ry="10" fill="#f4c89a" />
            <ellipse cx="174" cy="112" rx="7" ry="10" fill="#f4c89a" />
          </svg>
        </div>

        {/* Text below illustration */}
        <div style={{ textAlign: "center", marginTop: 32, position: "relative", zIndex: 2 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 26,
              fontWeight: 700,
              color: "white",
              margin: "0 0 10px",
              lineHeight: 1.3,
            }}
          >
            Build your perfect
            <br />
            <em style={{ color: "#c8f150" }}>outreach engine</em>
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 260,
              margin: "0 auto",
            }}
          >
            Tell us about your business and ideal customers. Our AI will craft
            hyper-personalized campaigns just for you.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginTop: 32, position: "relative", zIndex: 2 }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 28 : 8,
                height: 8,
                borderRadius: 100,
                background: s === step ? "#c8f150" : "rgba(255,255,255,0.2)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 60px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                display: "inline-block",
                background: "#2d2d2d",
                color: "#c8f150",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                padding: "5px 12px",
                borderRadius: 100,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              Step {step} of 2
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 32,
                fontWeight: 700,
                color: "#1a1a1a",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {step === 1 ? "About your company" : "Your ideal customer"}
            </h1>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
              {step === 1
                ? "Help our AI understand what you sell and who you are."
                : "Define your ICP so we can target the right prospects."}
            </p>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="step-form" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {/* Company Name */}
              <div>
                <label htmlFor="company_name">
                  Company Name <span className="required-star">*</span>
                </label>
                <input
                  className={`field-input${fieldErrors.company_name ? " has-error" : ""}`}
                  id="company_name"
                  placeholder="e.g. Technova"
                  value={orgData.company_name}
                  onChange={handleChange}
                />
                {fieldErrors.company_name && (
                  <p className="error-hint">⚠ This field is required</p>
                )}
              </div>

              {/* What do you sell */}
              

              {/* Industry */}
              <div>
                <label htmlFor="industry">
                  Industry <span className="required-star">*</span>
                </label>
                <select
                  className={`field-input${fieldErrors.industry ? " has-error" : ""}`}
                  id="industry"
                  value={orgData.industry}
                  onChange={(e) => {
                    setOrgData({ ...orgData, industry: e.target.value });
                    if (fieldErrors.industry) setFieldErrors((prev) => ({ ...prev, industry: false }));
                  }}
                >
                  <option value="">Select your industry</option>
                  {["SaaS", "Fintech", "Edtech", "Healthtech", "AI", "Marketplace", "Other"].map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                {fieldErrors.industry && (
                  <p className="error-hint">⚠ This field is required</p>
                )}
              </div>

              {err && step === 1 && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    color: "#dc2626",
                    fontSize: 13,
                  }}
                >
                  ⚠️ {err}
                </div>
              )}

              <button className="next-btn" onClick={handleStep1Continue} style={{ alignSelf: "flex-end" }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form
              className="step-form"
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 24 }}
            >
              {/* Ideal Customer */}
              <div>
                <label>
                  Who is your ideal customer? <span className="required-star">*</span>
                </label>
                <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 10px" }}>
                  Select all that apply
                </p>
                <div
                  className={fieldErrors.ideal_customer ? "icp-group-error" : ""}
                  style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                >
                  {icpOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      className={`icp-chip ${orgData.ideal_customer.includes(opt) ? "selected" : ""}`}
                      onClick={() => toggleICP(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {fieldErrors.ideal_customer && (
                  <p className="error-hint">⚠ Please select at least one option</p>
                )}
              </div>

              {/* Target Size */}
              <div>
                <label htmlFor="target_size">
                  Target Company Size <span className="required-star">*</span>
                </label>
                <select
                  className={`field-input${fieldErrors.target_size ? " has-error" : ""}`}
                  id="target_size"
                  value={orgData.target_size}
                  onChange={(e) => {
                    setOrgData({ ...orgData, target_size: e.target.value });
                    if (fieldErrors.target_size) setFieldErrors((prev) => ({ ...prev, target_size: false }));
                  }}
                >
                  <option value="">Select size</option>
                  {["1–10 employees", "10–50", "50–200", "200+"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {fieldErrors.target_size && (
                  <p className="error-hint">⚠ This field is required</p>
                )}
              </div>

              {/* Primary Goal */}
              <div>
                <label htmlFor="primary_goal">
                  Primary Goal <span className="required-star">*</span>
                </label>
                <select
                  className={`field-input${fieldErrors.primary_goal ? " has-error" : ""}`}
                  id="primary_goal"
                  value={orgData.primary_goal}
                  onChange={(e) => {
                    setOrgData({ ...orgData, primary_goal: e.target.value });
                    if (fieldErrors.primary_goal) setFieldErrors((prev) => ({ ...prev, primary_goal: false }));
                  }}
                >
                  <option value="">Select your goal</option>
                  {["Book demos", "Generate leads", "Close enterprise deals", "Expand internationally"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {fieldErrors.primary_goal && (
                  <p className="error-hint">⚠ This field is required</p>
                )}
              </div>

              {/* Target Geography */}
              <div>
                <label htmlFor="target_geography">
                  Target Geography <span className="required-star">*</span>
                </label>
                <select
                  className={`field-input${fieldErrors.target_geography ? " has-error" : ""}`}
                  id="target_geography"
                  value={orgData.target_geography}
                  onChange={(e) => {
                    setOrgData({ ...orgData, target_geography: e.target.value });
                    if (fieldErrors.target_geography) setFieldErrors((prev) => ({ ...prev, target_geography: false }));
                  }}
                >
                  <option value="">Select geography</option>
                  {["India", "US", "Europe", "Global"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {fieldErrors.target_geography && (
                  <p className="error-hint">⚠ This field is required</p>
                )}
              </div>

              {/* Error banner */}
              

              {/* Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                <button type="button" className="back-btn" onClick={() => { setStep(1); setFieldErrors({}); setErr(""); }}>
                  ← Back
                </button>
                <button type="submit" className="next-btn" disabled={loading}>
                  {loading ? "Saving..." : "Complete Setup →"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ICP;