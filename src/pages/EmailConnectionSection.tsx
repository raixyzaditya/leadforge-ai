import { useState, useEffect } from "react";
import axios from "axios";

const PORT = 3000;

type EmailAccount = {
    id: string;
    from_name: string;
    from_email: string;
    domain_name: string;
    resend_domain_id: string;
    dns_record: any[];
    verified: boolean;
    is_default: boolean;
};

const registrarSteps: Record<string, { steps: string[]; url: string }> = {
    namecheap: {
        url: "https://namecheap.com",
        steps: [
            "Login to Namecheap → click Domain List in the left sidebar",
            "Find your domain → click the Manage button",
            "Click the Advanced DNS tab at the top",
            "Click Add New Record for each DNS record below",
            "Click the green checkmark to save each record",
        ],
    },
    godaddy: {
        url: "https://dcc.godaddy.com",
        steps: [
            "Login to GoDaddy → click My Products",
            "Find your domain → click the DNS button",
            "Click Add New Record for each DNS record below",
            "Fill in Type, Name and Value from the table below",
            "Click Save when done",
        ],
    },
    cloudflare: {
        url: "https://dash.cloudflare.com",
        steps: [
            "Login to Cloudflare → select your domain",
            "Click DNS in the left sidebar → then Records",
            "Click Add Record for each DNS record below",
            "Set Proxy status to DNS only (grey cloud) for all records",
            "Click Save",
        ],
    },
    other: {
        url: "",
        steps: [
            "Login to your domain registrar's dashboard",
            "Find DNS Settings or DNS Management",
            "Add each record from the table below one by one",
            "Save all changes",
        ],
    },
};

const EmailConnectionSection = ({ orgId }: { orgId: string }) => {
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [fromName, setFromName] = useState("");
    const [fromEmail, setFromEmail] = useState("");
    const [adding, setAdding] = useState(false);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [dnsRecords, setDnsRecords] = useState<any[]>([]);
    const [showDns, setShowDns] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [registrar, setRegistrar] = useState("");
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // Auto-poll every 30 seconds while DNS panel is open
    useEffect(() => {
        if (!showDns) return;
        const interval = setInterval(async () => {
            try {
                const res = await axios.post(
                    `http://localhost:${PORT}/email_creation/verify/${showDns}`,
                    { organization_id: orgId }
                );
                if (res.data.verified) {
                    showToast("✅ Domain verified automatically!");
                    fetchAccounts();
                    setShowDns(null);
                    clearInterval(interval);
                }
            } catch { /* silent */ }
        }, 30000);
        return () => clearInterval(interval);
    }, [showDns]);

    useEffect(() => {
        if (!orgId) return;
        fetchAccounts();
    }, [orgId]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(
                `http://localhost:${PORT}/email_creation/get/${orgId}`
            );
            const accounts = (res.data.accounts ?? []).map((acc: any) => ({
                ...acc,
                dns_record: typeof acc.dns_record === "string"
                    ? JSON.parse(acc.dns_record)
                    : acc.dns_record ?? [],
            }));
            setAccounts(accounts);
        } catch {
            setAccounts([]);
        }
    };

    const handleAdd = async () => {
        if (!fromName.trim() || !fromEmail.trim()) {
            setError("Both fields are required");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
            setError("Enter a valid email address");
            return;
        }
        setAdding(true);
        setError("");
        try {
            const res = await axios.post(
                `http://localhost:${PORT}/email_creation/add`,
                { from_name: fromName, from_email: fromEmail, organization_id: orgId }
            );
            const records = res.data.dns_record ?? res.data.dns_records ?? [];
            setDnsRecords(records);
            setShowDns(res.data.domain_id);
            setShowAddForm(false);
            setFromName("");
            setFromEmail("");
            fetchAccounts();
            showToast("Domain registered — add DNS records to verify");
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to add domain");
        } finally {
            setAdding(false);
        }
    };

    const handleVerify = async (domainId: string) => {
        setVerifying(domainId);
        try {
            const res = await axios.post(
                `http://localhost:${PORT}/email_creation/verify/${domainId}`,
                { organization_id: orgId }
            );
            if (res.data.verified) {
                showToast("✓ Domain verified successfully!");
                fetchAccounts();
                setShowDns(null);
            } else {
                showToast(res.data.message || "DNS not detected yet. Try again in a few minutes.");
            }
        } catch {
            showToast("Verification failed. Try again.");
        } finally {
            setVerifying(null);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            await axios.patch(
                `http://localhost:${PORT}/email_creation/set_default/${id}`,
                { organization_id: orgId }
            );
            fetchAccounts();
            showToast("Default sending account updated");
        } catch {
            showToast("Failed to update default");
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await axios.delete(`http://localhost:${PORT}/email_creation/remove/${id}`);
            fetchAccounts();
            showToast("Account removed");
        } catch {
            showToast("Failed to remove account");
        }
    };

    const copyValue = (value: string, index: number) => {
        navigator.clipboard.writeText(value);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const copyAll = () => {
        const text = dnsRecords.map(r =>
            `Type: ${r.type}\nName: ${r.name}\nValue: ${r.value}`
        ).join("\n\n");
        navigator.clipboard.writeText(text);
        showToast("All DNS records copied!");
    };

    const guide = registrarSteps[registrar];

    // Progress steps state
    const progressSteps = [
        { label: "Domain registered", done: true },
        { label: "DNS records added", done: false },
        { label: "Domain verified",   done: false },
    ];

    return (
        <div className="section-card">
            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                    <div className="section-title">Email Sending Domain</div>
                    <div className="section-subtitle">
                        Connect your company domain so emails send from your address.
                        Prospects will never see LeadForge.
                    </div>
                </div>
                {!showAddForm && (
                    <button
                        className="primary-btn"
                        style={{ fontSize: 12, padding: "8px 16px", flexShrink: 0 }}
                        onClick={() => setShowAddForm(true)}
                    >
                        + Add Domain
                    </button>
                )}
            </div>

            {/* ── Add form ── */}
            {showAddForm && (
                <div style={{
                    background: "#f9f9f7", border: "1px solid #e8e6e1",
                    borderRadius: 12, padding: "20px 22px", marginBottom: 16,
                }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 14 }}>
                        Add sending domain
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                        <div>
                            <label className="field-label">Display Name</label>
                            <input
                                className="field-input"
                                placeholder="e.g. Deloitte Outreach"
                                value={fromName}
                                onChange={e => setFromName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="field-label">From Email</label>
                            <input
                                className="field-input"
                                placeholder="e.g. outreach@deloitte.com"
                                value={fromEmail}
                                onChange={e => setFromEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    {error && (
                        <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}>{error}</p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            className="primary-btn"
                            style={{ fontSize: 12, padding: "8px 18px" }}
                            onClick={handleAdd}
                            disabled={adding}
                        >
                            {adding ? "Registering…" : "Register Domain →"}
                        </button>
                        <button
                            className="ghost-btn"
                            style={{ fontSize: 12, padding: "8px 14px" }}
                            onClick={() => { setShowAddForm(false); setError(""); }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── DNS Records panel ── */}
            {showDns && dnsRecords.length > 0 && (
                <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: 12, padding: "22px 24px", marginBottom: 16,
                }}>

                    {/* Progress indicator */}
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
                        {progressSteps.map((step, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: "50%",
                                        background: step.done ? "#16a34a" : "#fde68a",
                                        border: `2px solid ${step.done ? "#16a34a" : "#f59e0b"}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, color: step.done ? "white" : "#92400e",
                                        fontWeight: 700, marginBottom: 5,
                                    }}>
                                        {step.done ? "✓" : i + 1}
                                    </div>
                                    <div style={{
                                        fontSize: 10, color: step.done ? "#16a34a" : "#92400e",
                                        fontWeight: step.done ? 700 : 500,
                                        textAlign: "center", whiteSpace: "nowrap",
                                    }}>
                                        {step.label}
                                    </div>
                                </div>
                                {i < progressSteps.length - 1 && (
                                    <div style={{
                                        height: 2, flex: 1, marginBottom: 20,
                                        background: step.done ? "#16a34a" : "#fde68a",
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>
                                ⚠ Add these DNS records to your domain registrar
                            </div>
                            <div style={{ fontSize: 12, color: "#b45309" }}>
                                We'll check automatically every 30 seconds once you've added them
                            </div>
                        </div>
                        <button
                            className="primary-btn"
                            style={{ fontSize: 12, padding: "8px 16px", flexShrink: 0 }}
                            onClick={() => handleVerify(showDns)}
                            disabled={verifying === showDns}
                        >
                            {verifying === showDns ? "Checking…" : "Check Now"}
                        </button>
                        <button onClick={()=>{
                            setShowDns(null);
                            setDnsRecords([]);
                        }} style={{
                            width:30, height:30, borderRadius:"50%",
                            background: "rgba(146,64,14,0.1)",
                            border: "1px solid rgba(146,64,14,0.2)",
                            color:"#92400e", fontSize:13,
                            cursor: "pointer", display:"flex",
                            alignItems: "center",justifyContent:"center",
                            flexShrink: 0, transition: "all 0.15s"
                        }}>x</button>
                    </div>

                    {/* Registrar selector */}
                    <div style={{ marginBottom: 14 }}>
                        <label className="field-label" style={{ marginBottom: 6 }}>
                            Where is your domain registered?
                        </label>
                        <select
                            value={registrar}
                            onChange={e => setRegistrar(e.target.value)}
                            style={{
                                padding: "9px 13px", borderRadius: 8,
                                border: "1px solid #fde68a", background: "white",
                                fontSize: 13, fontFamily: "inherit", color: "#374151",
                                outline: "none", cursor: "pointer", width: 220,
                            }}
                        >
                            <option value="">Select your registrar…</option>
                            <option value="namecheap">Namecheap</option>
                            <option value="godaddy">GoDaddy</option>
                            <option value="cloudflare">Cloudflare</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Registrar guide */}
                    {guide && (
                        <div style={{
                            background: "white", border: "1px solid #fde68a",
                            borderRadius: 10, padding: "14px 16px", marginBottom: 14,
                        }}>
                            <div style={{
                                fontSize: 11, fontWeight: 700, color: "#92400e",
                                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
                            }}>
                                How to add records on {registrar === "other" ? "your registrar" : registrar.charAt(0).toUpperCase() + registrar.slice(1)}
                            </div>
                            {guide.steps.map((step, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                                    <div style={{
                                        width: 20, height: 20, borderRadius: "50%",
                                        background: "#fef9c3", color: "#92400e",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5 }}>
                                        {step}
                                    </div>
                                </div>
                            ))}
                            {guide.url && (
                                <a
                                    href={guide.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: 5,
                                        marginTop: 6, fontSize: 12, color: "#2563eb",
                                        textDecoration: "none", fontWeight: 600,
                                    }}
                                >
                                    Open {registrar.charAt(0).toUpperCase() + registrar.slice(1)} ↗
                                </a>
                            )}
                        </div>
                    )}

                    {/* Copy all button */}
                    <button
                        onClick={copyAll}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", background: "white",
                            border: "1px solid #fde68a", borderRadius: 8,
                            fontSize: 12, color: "#92400e", cursor: "pointer",
                            fontFamily: "inherit", marginBottom: 10,
                        }}
                    >
                        📋 Copy all records
                    </button>

                    {/* DNS table */}
                    <div style={{ background: "white", borderRadius: 9, border: "1px solid #fde68a", overflow: "hidden" }}>
                        {/* Table header */}
                        <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 2fr 70px", background: "#fafaf8", borderBottom: "1px solid #f0efe9" }}>
                            {["Type", "Name", "Value", ""].map(h => (
                                <div key={h} style={{
                                    padding: "8px 12px", fontSize: 10.5, fontWeight: 700,
                                    color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase",
                                }}>
                                    {h}
                                </div>
                            ))}
                        </div>

                        {dnsRecords.map((record: any, i: number) => (
                            <div
                                key={i}
                                style={{
                                    display: "grid", gridTemplateColumns: "70px 1fr 2fr 70px",
                                    borderBottom: i < dnsRecords.length - 1 ? "1px solid #f5f5f3" : "none",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                                    {record.type}
                                </div>
                                <div style={{ padding: "10px 12px", fontSize: 12, color: "#374151", wordBreak: "break-all" }}>
                                    {record.name}
                                </div>
                                <div style={{ padding: "10px 12px", fontSize: 11.5, color: "#6b7280", wordBreak: "break-all", fontFamily: "monospace" }}>
                                    {record.value}
                                </div>
                                <div style={{ padding: "10px 8px", display: "flex", justifyContent: "center" }}>
                                    <button
                                        onClick={() => copyValue(record.value, i)}
                                        style={{
                                            background: copiedIndex === i ? "#dcfce7" : "#f4f3ef",
                                            border: `1px solid ${copiedIndex === i ? "#bbf7d0" : "#e8e6e1"}`,
                                            borderRadius: 6, padding: "4px 8px",
                                            fontSize: 10.5,
                                            color: copiedIndex === i ? "#16a34a" : "#6b7280",
                                            cursor: "pointer", fontFamily: "inherit",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {copiedIndex === i ? "✓" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Auto check indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#92400e", marginTop: 12 }}>
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: "#f59e0b", display: "inline-block",
                            animation: "pulse 1.5s ease-in-out infinite",
                        }} />
                        Checking automatically every 30 seconds · DNS can take up to 48 hours to propagate
                    </div>
                </div>
            )}

            {/* ── Accounts list ── */}
            {accounts.length === 0 && !showAddForm ? (
                <div style={{
                    textAlign: "center", padding: "40px 24px",
                    background: "#f9f9f7", borderRadius: 12,
                    border: "1.5px dashed #e0ddd6",
                }}>
                    <div style={{ fontSize: 24, marginBottom: 10 }}>📨</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                        No sending domain connected
                    </div>
                    <div style={{ fontSize: 12.5, color: "#9ca3af", maxWidth: 320, margin: "0 auto" }}>
                        Add your company domain so outreach emails send from your address, not LeadForge's.
                    </div>
                </div>
            ) : (
                accounts.map((account) => (
                    <div key={account.id} style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px", background: "#f9f9f7",
                        borderRadius: 11,
                        border: `1px solid ${account.verified ? "#e8e6e1" : "#fde68a"}`,
                        marginBottom: 10,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10,
                                background: account.verified ? "#f0fdf4" : "#fffbeb",
                                border: `1px solid ${account.verified ? "#bbf7d0" : "#fde68a"}`,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                            }}>
                                {account.verified ? "✅" : "⏳"}
                            </div>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>
                                    {account.from_name}
                                    {account.is_default && (
                                        <span style={{
                                            marginLeft: 8, fontSize: 10.5,
                                            background: "#eff6ff", color: "#2563eb",
                                            padding: "2px 8px", borderRadius: 100, fontWeight: 600,
                                        }}>
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                                    {account.from_email.trim()} · {account.domain_name.trim()}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {account.verified ? (
                                <span className="badge" style={{ background: "#dcfce7", color: "#16a34a" }}>
                                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                                    Verified
                                </span>
                            ) : (
                                <>
                                    <span className="badge" style={{ background: "#fef9c3", color: "#92400e" }}>
                                        Pending DNS
                                    </span>
                                    <button
                                        className="ghost-btn"
                                        style={{ padding: "6px 12px", fontSize: 12 }}
                                        onClick={() => {
                                            const records = account.dns_record;
                                            const parsed = typeof records === "string"
                                                ? JSON.parse(records)
                                                : records ?? [];
                                            setDnsRecords(parsed);
                                            setShowDns(account.resend_domain_id);
                                        }}
                                    >
                                        View DNS
                                    </button>
                                    <button
                                        className="ghost-btn"
                                        style={{ padding: "6px 12px", fontSize: 12 }}
                                        onClick={() => handleVerify(account.resend_domain_id)}
                                        disabled={verifying === account.resend_domain_id}
                                    >
                                        {verifying === account.resend_domain_id ? "Checking…" : "Verify"}
                                    </button>
                                </>
                            )}
                            {account.verified && !account.is_default && (
                                <button
                                    className="ghost-btn"
                                    style={{ padding: "6px 12px", fontSize: 12 }}
                                    onClick={() => handleSetDefault(account.id)}
                                >
                                    Set Default
                                </button>
                            )}
                            <button
                                className="danger-btn"
                                style={{ padding: "6px 12px", fontSize: 12 }}
                                onClick={() => handleRemove(account.id)}
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))
            )}

            {/* ── Toast ── */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 28, right: 32,
                    background: "#111827", color: "white",
                    padding: "12px 20px", borderRadius: 10,
                    fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8,
                    zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    animation: "savedPop 3s ease forwards",
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
};

export default EmailConnectionSection;
