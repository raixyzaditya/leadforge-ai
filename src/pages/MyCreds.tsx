import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Tab = "profile" | "organization" | "billing";

const ProfilePage = () => {
    const nav = useNavigate();
    const daysLeft = (endDay:string)=>{
        const today = new Date();
        const end = new Date(endDay);
        const diff = end.getTime() - today.getTime();
        const dayLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const day = dayLeft.toString();
        return dayLeft > 0?day:"0";
    }
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("profile");
    const [profileData, setProfileData] = useState({
        "name": "",
        "email": "",
        "joined": "",
        "company": "",
        "domain": "",
        "industry": "",
        "size": "",
        "plan":"",
        
        "sub_end":"",
        "left_days":"",
        
    });
    const [notifications, setNotifications] = useState({
        replyAlerts: true,
        weeklySummary: true,
        campaignAlerts: false,
    });
    const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" });
    const [saved, setSaved] = useState(false);
    const [price,setPrice] = useState("");
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);

        const day = date.getDate();
        const year = date.getFullYear();

        const month = date.toLocaleString("en-US", { month: "short" });

        

        return `${month} ${day}, ${year}`;
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user")
        if (user === null || token === null) {
            nav('/login');
            return;
        }
        const n = JSON.parse(user);
        const date = n.joined ? formatDate(n.joined) : "";
        const dayLeft = daysLeft(n.organization.end);
        const plan_end = n.organization.end ? formatDate(n.organization.end): "";
        setProfileData({ ...profileData, "name": n.full_name, "email": n.email, "joined": date, "company": n.organization.name, "domain": n.organization.domain, "industry": n.organization.industry, "size": n.organization.size,"plan":n.organization.plan_type,"sub_end":plan_end,"left_days":dayLeft });
        if (n.organization.plan_type === "Free"){
            setPrice("0");
        }else if(n.organization.plan_type === "Starter"){
            setPrice("29");
        }else{
            setPrice("79");
        }

    }, [])

    useEffect(()=>{
       console.log(profileData.left_days);
       console.log(profileData.sub_end)
    },[])
    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2200);
    };

    const confirmLogout = () => {
        localStorage.clear();
        nav("/login");
    };
    const overlayStyle: React.CSSProperties = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    };

    const modalStyle: React.CSSProperties = {
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        width: "320px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    };

    return (
        <div style={{ display: "flex", height: "100vh", background: "#f5f5f3", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes savedPop {
          0%   { opacity: 0; transform: scale(0.9); }
          20%  { opacity: 1; transform: scale(1.02); }
          80%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        .fade-up  { animation: fadeUp  0.4s ease forwards; }
        .slide-in { animation: slideIn 0.35s ease forwards; opacity: 0; }
        .saved-toast { animation: savedPop 2.2s ease forwards; }

        .app-nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; border-radius: 8px; cursor: pointer;
          color: rgba(255,255,255,0.38); font-size: 13px; font-weight: 500;
          transition: all 0.18s; white-space: nowrap; position: relative;
        }
        .app-nav-item:hover  { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.75); }
        .app-nav-item.active { background: rgba(255,255,255,0.09); color: #fff; font-weight: 600; }
        .app-nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 16px; background: #2563eb; border-radius: 0 3px 3px 0;
        }

        .settings-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 9px; cursor: pointer;
          font-size: 13.5px; font-weight: 500; transition: all 0.18s;
          color: #6b7280; border: none; background: transparent;
          font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap;
        }
        .settings-tab:hover  { background: #f0f0ee; color: #111827; }
        .settings-tab.active { background: #111827; color: white; font-weight: 600; }

        .section-card {
          background: white; border-radius: 14px;
          border: 1px solid #e8e6e1; padding: 28px 30px;
          margin-bottom: 18px;
        }
        .section-title {
          font-family: 'Fraunces', serif; font-size: 15px;
          font-weight: 700; color: #111827; margin-bottom: 4px;
        }
        .section-subtitle {
          font-size: 12.5px; color: #9ca3af; margin-bottom: 22px;
        }

        .field-label {
          font-size: 11.5px; font-weight: 700; color: #6b7280;
          letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 6px;
          display: block;
        }
        .field-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #e5e7eb; border-radius: 9px;
          font-size: 13.5px; font-family: 'Plus Jakarta Sans', sans-serif;
          color: #111827; background: white; outline: none;
          transition: border-color 0.18s;
        }
        .field-input:focus { border-color: #111827; }
        .field-input:disabled { background: #f9f9f7; color: #9ca3af; cursor: not-allowed; }

        .badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 100px;
          font-size: 11.5px; font-weight: 600;
        }

        .toggle-switch {
          position: relative; width: 40px; height: 22px;
          border-radius: 100px; cursor: pointer; transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-knob {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%;
          background: white; transition: left 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }

        .primary-btn {
          background: #111827; color: white; border: none;
          padding: 10px 22px; border-radius: 9px; font-size: 13px;
          font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.18s;
        }
        .primary-btn:hover { background: #1e293b; transform: translateY(-1px); }

        .ghost-btn {
          background: white; color: #374151;
          border: 1.5px solid #e5e7eb; padding: 10px 20px;
          border-radius: 9px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.18s;
        }
        .ghost-btn:hover { border-color: #111827; color: #111827; }

        .danger-btn {
          background: white; color: #dc2626;
          border: 1.5px solid #fecaca; padding: 10px 20px;
          border-radius: 9px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.18s;
        }
        .danger-btn:hover { background: #fef2f2; border-color: #dc2626; }

        .divider { height: 1px; background: #f1f1ef; margin: 20px 0; }

        .role-badge { padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 700; background: #eff6ff; color: #1d4ed8; }

        .usage-bar-track { height: 6px; background: #f1f5f9; border-radius: 100px; overflow: hidden; }
        .usage-bar-fill  { height: 100%; border-radius: 100px; transition: width 0.5s ease; }

        .plan-card-highlight {
          background: #111827; border-radius: 14px; padding: 24px 26px;
          position: relative; overflow: hidden;
        }
        

        .team-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid #f5f5f3; }
        .team-row:last-child { border-bottom: none; }
      `}</style>

            {/* ── APP SIDEBAR ── */}
            <div style={{ width: 216, background: "#111827", display: "flex", flexDirection: "column", padding: "28px 12px", flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ padding: "0 10px", marginBottom: 36 }}>
                    <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: 19, color: "#ffffff", letterSpacing: "-0.2px" }}>LeadForge</div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.22)", marginTop: 3, letterSpacing: "0.05em", textTransform: "uppercase" }}>AI Outreach</div>
                </div>
                <nav style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginBottom: 6 }}>Main</div>
                    {[
                        { label: "Dashboard",url:"/dashboard" },
                        { label: "Campaigns",url:"/dashboard" },
                        { label: "Prospects",url:"/dashboard" },
                        { label: "Analytics",url:"/dashboard" },
                    ].map((item) => (
                        <button onClick={()=>nav(item.url)}><div key={item.label} className="app-nav-item">{item.label}</div></button>
                    ))}
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "0 14px", marginTop: 22, marginBottom: 6 }}>Account</div>
                    {[
                        { label: "Email Accounts" },
                        { label: "Settings", active: true },
                    ].map((item) => (
                        <div key={item.label} className={`app-nav-item ${item.active ? "active" : ""}`}>{item.label}</div>
                    ))}
                </nav>
                <div style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "#93c5fd", fontWeight: 600 }}>{profileData.plan} Plan</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>60%</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 100, overflow: "hidden" }}>
                        <div style={{ width: "60%", height: "100%", background: "#2563eb", borderRadius: 100 }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>600 / 1,000 emails</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 10px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 29, height: 29, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, color: "white", fontWeight: 700, flexShrink: 0 }}>{profileData.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12.5, fontWeight: 600 }}>{profileData.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Admin</div>
                    </div>
                </div>
            </div>

            {/* ── MAIN ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>

                {/* Page header */}
                <div className="fade-up" style={{ marginBottom: 28 }}>
                    <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 23, fontWeight: 700, color: "#111827", marginBottom: 4, letterSpacing: "-0.2px" }}>Settings</h1>
                    <p style={{ color: "#9ca3af", fontSize: 13 }}>Manage your account, organization and billing preferences.</p>
                </div>

                {/* Tab bar */}
                <div className="fade-up" style={{ display: "flex", gap: 4, background: "white", padding: 5, borderRadius: 12, border: "1px solid #e8e6e1", width: "fit-content", marginBottom: 28 }}>
                    {([
                        { key: "profile", label: "My Profile" },
                        { key: "organization", label: "Organization" },
                        { key: "billing", label: "Billing & Plan" },
                    ] as { key: Tab; label: string }[]).map((t) => (
                        <button key={t.key} className={`settings-tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ══ PROFILE TAB ══ */}
                {activeTab === "profile" && (
                    <div className="slide-in">

                        {/* Basic Info */}
                        <div className="section-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                                <div>
                                    <div className="section-title">Basic Information</div>
                                    <div className="section-subtitle">Your personal account details.</div>
                                </div>
                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "white", fontWeight: 700 }}>{profileData.name.charAt(0).toUpperCase()}</div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label className="field-label">Full Name</label>
                                    <input className="field-input" value={profileData.name} placeholder="Your full name" />
                                </div>
                                <div>
                                    <label className="field-label">Work Email</label>
                                    <input className="field-input" value={profileData.email} disabled />
                                </div>
                                <div>
                                    <label className="field-label">Role</label>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 42 }}>
                                        <span className="role-badge">Admin</span>
                                        <span style={{ fontSize: 12, color: "#9ca3af" }}>Assigned by organization owner</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="field-label">Member Since</label>
                                    <input className="field-input" value={profileData.joined} disabled />
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, gap: 10 }}>
                                <button className="ghost-btn">Discard</button>
                                <button className="primary-btn" onClick={handleSave}>Save Changes</button>
                            </div>
                        </div>

                        {/* Email Connection */}
                        <div className="section-card">
                            <div className="section-title">Email Connection</div>
                            <div className="section-subtitle">Connect your inbox to send outreach campaigns.</div>

                            {/* Gmail row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "#f9f9f7", borderRadius: 11, border: "1px solid #e8e6e1", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "white", border: "1px solid #e8e6e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📧</div>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>Gmail</div>
                                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{profileData.email} · Last synced 2 min ago</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span className="badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                                        Connected
                                    </span>
                                    <button className="ghost-btn" style={{ padding: "7px 14px", fontSize: 12 }}>Reconnect</button>
                                </div>
                            </div>

                            {/* Outlook row — not connected */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "#f9f9f7", borderRadius: 11, border: "1.5px dashed #e0ddd6" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "white", border: "1px solid #e8e6e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📨</div>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>Outlook</div>
                                        <div style={{ fontSize: 12, color: "#9ca3af" }}>Not connected</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span className="badge" style={{ background: "#f1f5f9", color: "#64748b" }}>Not Connected</span>
                                    <button className="primary-btn" style={{ padding: "7px 14px", fontSize: 12 }}>Connect</button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications */}
                        <div className="section-card">
                            <div className="section-title">Notifications</div>
                            <div className="section-subtitle">Choose what updates you want to receive.</div>

                            {([
                                { key: "replyAlerts", label: "Reply Alerts", desc: "Get notified when a prospect replies to your email" },
                                { key: "weeklySummary", label: "Weekly Performance Summary", desc: "A digest of your outreach stats every Monday" },
                                { key: "campaignAlerts", label: "Campaign Alerts", desc: "Updates when campaigns finish or encounter errors" },
                            ] as { key: keyof typeof notifications; label: string; desc: string }[]).map((n, i) => (
                                <div key={n.key}>
                                    {i > 0 && <div className="divider" />}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{n.label}</div>
                                            <div style={{ fontSize: 12, color: "#9ca3af" }}>{n.desc}</div>
                                        </div>
                                        <div
                                            className="toggle-switch"
                                            style={{ background: notifications[n.key] ? "#111827" : "#e5e7eb" }}
                                            onClick={() => setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                                        >
                                            <div className="toggle-knob" style={{ left: notifications[n.key] ? "21px" : "3px" }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Security */}
                        <div className="section-card">
                            <div className="section-title">Security</div>
                            <div className="section-subtitle">Manage your password and account access.</div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, maxWidth: 440 }}>
                                <div>
                                    <label className="field-label">Current Password</label>
                                    <input className="field-input" type="password" placeholder="••••••••" value={passwordForm.current} onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <div>
                                        <label className="field-label">New Password</label>
                                        <input className="field-input" type="password" placeholder="••••••••" value={passwordForm.newPass} onChange={(e) => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="field-label">Confirm Password</label>
                                        <input className="field-input" type="password" placeholder="••••••••" value={passwordForm.confirm} onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                                    </div>
                                </div>
                            </div>

                            <div className="divider" />

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 3 }}>Two-Factor Authentication</div>
                                    <div style={{ fontSize: 12, color: "#9ca3af" }}>Add an extra layer of security to your account</div>
                                </div>
                                <span className="badge" style={{ background: "#fef9c3", color: "#92400e" }}>Coming Soon</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
                                <button
                                    className="danger-btn"
                                    onClick={() => setShowLogoutModal(true)}
                                >
                                    Log Out
                                </button>
                                {showLogoutModal && (
                                    <div style={overlayStyle}>
                                        <div style={modalStyle}>
                                            <h3 style={{ marginBottom: 10 }}>Confirm Logout</h3>
                                            <p style={{ fontSize: 14, color: "#666", marginBottom: 20 }}>
                                                Are you sure you want to log out?
                                            </p>

                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                                                <button
                                                    className="ghost-btn"
                                                    onClick={() => setShowLogoutModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="danger-btn"
                                                    onClick={confirmLogout}
                                                >
                                                    Yes, Log Out
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <button className="primary-btn" onClick={handleSave}>Update Password</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ ORGANIZATION TAB ══ */}
                {activeTab === "organization" && (
                    <div className="slide-in">

                        {/* Org Info */}
                        <div className="section-card">
                            <div className="section-title">Organization Info</div>
                            <div className="section-subtitle">Update your company details. Only admins can edit.</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                {[
                                    { label: "Company Name", value: profileData.company, disabled: false },
                                    { label: "Domain", value: profileData.domain, disabled: true },
                                    { label: "Industry", value: profileData.industry, disabled: false },
                                    { label: "Team Size", value: profileData.size, disabled: false },
                                ].map((f) => (
                                    <div key={f.label}>
                                        <label className="field-label">{f.label}</label>
                                        <input className="field-input" defaultValue={f.value} disabled={f.disabled} />
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, gap: 10 }}>
                                <button className="ghost-btn">Discard</button>
                                <button className="primary-btn" onClick={handleSave}>Save Changes</button>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="section-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <div>
                                    <div className="section-title">Products</div>
                                    <div className="section-subtitle" style={{ marginBottom: 0 }}>Products our AI uses to craft personalized emails.</div>
                                </div>
                                <button className="primary-btn" style={{ fontSize: 12, padding: "8px 16px" }}>+ Add Product</button>
                            </div>

                            {[
                                { name: "LeadForge Core", desc: "AI-powered outbound email automation for B2B sales teams.", tag: "Active" },
                                { name: "Analytics Add-on", desc: "Deep campaign performance analytics and ICP scoring.", tag: "Active" },
                            ].map((p, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#f9f9f7", borderRadius: 10, border: "1px solid #e8e6e1", marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827", marginBottom: 3 }}>{p.name}</div>
                                        <div style={{ fontSize: 12, color: "#9ca3af", maxWidth: 380 }}>{p.desc}</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className="badge" style={{ background: "#dcfce7", color: "#16a34a" }}>{p.tag}</span>
                                        <button className="ghost-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Edit</button>
                                        <button className="danger-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Team Management */}
                        <div className="section-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <div>
                                    <div className="section-title">Team Management</div>
                                    <div className="section-subtitle" style={{ marginBottom: 0 }}>Manage who has access to your LeadForge workspace.</div>
                                </div>
                                <button className="primary-btn" style={{ fontSize: 12, padding: "8px 16px" }}>+ Invite Member</button>
                            </div>

                            <div style={{ marginTop: 20 }}>
                                {/* Table header */}
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 100px", gap: 12, padding: "8px 12px", background: "#f8f8f6", borderRadius: 8, marginBottom: 4 }}>
                                    {["Name", "Email", "Role", "Status", "Action"].map((h) => (
                                        <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</div>
                                    ))}
                                </div>

                                {[
                                    { name: "Rajeev Rai", email: "rajeev@deloitte.com", role: "Admin", status: "Active" },
                                    { name: "Priya Sharma", email: "priya@deloitte.com", role: "Member", status: "Active" },
                                    { name: "Arjun Singh", email: "arjun@deloitte.com", role: "Member", status: "Pending" },
                                ].map((m, i) => (
                                    <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 100px", gap: 12, padding: "12px 12px", borderBottom: "1px solid #f5f5f3", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 700, flexShrink: 0 }}>
                                                {m.name[0]}
                                            </div>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{m.name}</span>
                                        </div>
                                        <span style={{ fontSize: 12.5, color: "#6b7280" }}>{m.email}</span>
                                        <span className="badge" style={{ background: m.role === "Admin" ? "#eff6ff" : "#f1f5f9", color: m.role === "Admin" ? "#1d4ed8" : "#475569", width: "fit-content" }}>{m.role}</span>
                                        <span className="badge" style={{ background: m.status === "Active" ? "#dcfce7" : "#fef9c3", color: m.status === "Active" ? "#16a34a" : "#92400e", width: "fit-content" }}>{m.status}</span>
                                        <button className="danger-btn" style={{ padding: "5px 10px", fontSize: 11.5 }}>Remove</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ BILLING TAB ══ */}
                {activeTab === "billing" && (
                    <div className="slide-in">

                        {/* Current plan */}
                        <div className="plan-card-highlight" style={{ marginBottom: 18 }}>
                            <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(37,99,235,0.1)" }} />
                            <div style={{ position: "absolute", bottom: -20, left: "40%", width: 80, height: 80, borderRadius: "50%", background: "rgba(124,58,237,0.08)" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Current Plan</div>
                                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "white", marginBottom: 6 }}>{profileData.plan}</div>
                                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>${price} / month · Renews {profileData.sub_end}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span className="badge" style={{ background: "rgba(134,239,172,0.15)", color: "#86efac", fontSize: 12, marginBottom: 12, display: "inline-block" }}>
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#86efac", display: "inline-block", marginRight: 5 }} />
                                        Active
                                    </span>
                                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>{profileData.left_days} days remaining</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 22, position: "relative", zIndex: 1 }}>
                                <button style={{ background: "white", color: "#111827", border: "none", padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans'" }}>
                                    Upgrade to Growth →
                                </button>
                                <button style={{ background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.12)", padding: "9px 18px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans'" }}>
                                    View all plans
                                </button>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="section-card">
                            <div className="section-title">Usage This Month</div>
                            <div className="section-subtitle">February 2026 · Resets on March 1</div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                                {[
                                    { label: "Emails Sent", used: 600, total: 1000, color: "#2563eb" },
                                    { label: "Active Campaigns", used: 5, total: 5, color: "#7c3aed" },
                                    { label: "Prospects Uploaded", used: 840, total: 2000, color: "#0891b2" },
                                ].map((u) => {
                                    const pct = Math.round((u.used / u.total) * 100);
                                    const isWarning = pct >= 90;
                                    return (
                                        <div key={u.label}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{u.label}</span>
                                                <span style={{ fontSize: 12.5, color: isWarning ? "#dc2626" : "#6b7280", fontWeight: isWarning ? 700 : 500 }}>
                                                    {u.used.toLocaleString()} / {u.total.toLocaleString()} {isWarning && "⚠️"}
                                                </span>
                                            </div>
                                            <div className="usage-bar-track">
                                                <div className="usage-bar-fill" style={{ width: `${pct}%`, background: isWarning ? "#ef4444" : u.color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="section-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                <div>
                                    <div className="section-title">Payment Method</div>
                                    <div className="section-subtitle" style={{ marginBottom: 0 }}>Manage your billing details.</div>
                                </div>
                                <button className="ghost-btn" style={{ fontSize: 12, padding: "7px 14px" }}>+ Add Card</button>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#f9f9f7", borderRadius: 10, border: "1px solid #e8e6e1" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 44, height: 30, background: "#1a1a2e", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ width: 24, height: 16, borderRadius: 3, background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>•••• •••• •••• 4242</div>
                                        <div style={{ fontSize: 12, color: "#9ca3af" }}>Expires 08/27 · Visa</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <span className="badge" style={{ background: "#dcfce7", color: "#16a34a" }}>Default</span>
                                    <button className="ghost-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Edit</button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="section-card" style={{ border: "1px solid #fecaca" }}>
                            <div className="section-title" style={{ color: "#dc2626" }}>Danger Zone</div>
                            <div className="section-subtitle">These actions are permanent and cannot be undone.</div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button className="danger-btn">Cancel Subscription</button>
                                <button className="danger-btn">Delete Organization</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* ── SAVED TOAST ── */}
            {saved && (
                <div className="saved-toast" style={{ position: "fixed", bottom: 28, right: 32, background: "#111827", color: "white", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                    <span style={{ fontSize: 15 }}>✓</span> Changes saved successfully
                </div>
            )}
        </div>
    );
};

export default ProfilePage;