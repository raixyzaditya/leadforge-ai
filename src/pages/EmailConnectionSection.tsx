import { useState, useEffect } from "react";
import axios from "axios";

const PORT = 3000;

type EmailAccount = {
    id: string;
    from_name: string;
    from_email: string;
    domain: string;
    resend_domain_id: string;
    dns_records: any[];
    verified: boolean;
    is_default: boolean;
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

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!orgId) return;
        fetchAccounts();
    }, [orgId]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(
                `http://localhost:${PORT}/email_creation/get/${orgId}`
            );
            setAccounts(res.data.accounts ?? []);
        } catch (err) {
            console.error("Failed to fetch accounts");
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
            setDnsRecords(res.data.dns_records);
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
                showToast("✓ Domain verified successfully");
                fetchAccounts();
                setShowDns(null);
            } else {
                showToast(res.data.message || "DNS not detected yet");
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
            await axios.delete(`http://localhost:${PORT}/email_accounts/remove/${id}`);
            fetchAccounts();
            showToast("Account removed");
        } catch {
            showToast("Failed to remove account");
        }
    };

    return (
        <div className="section-card">
            {/* Header */}
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

            {/* Add form */}
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
                        <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}>
                            {error}
                        </p>
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

            {/* DNS Records panel */}
            {showDns && dnsRecords.length > 0 && (
                <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: 12, padding: "20px 22px", marginBottom: 16,
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>
                                ⚠ Add these DNS records to your domain registrar
                            </div>
                            <div style={{ fontSize: 12, color: "#b45309" }}>
                                Go to Namecheap / GoDaddy / Cloudflare → DNS Settings → Add each record below
                            </div>
                        </div>
                        <button
                            className="primary-btn"
                            style={{ fontSize: 12, padding: "8px 16px", flexShrink: 0 }}
                            onClick={() => handleVerify(showDns)}
                            disabled={verifying === showDns}
                        >
                            {verifying === showDns ? "Checking…" : "Verify Domain"}
                        </button>
                    </div>

                    {/* DNS table */}
                    <div style={{ background: "white", borderRadius: 9, border: "1px solid #fde68a", overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 2fr", gap: 0 }}>
                            {["Type", "Name", "Value"].map(h => (
                                <div key={h} style={{
                                    padding: "8px 14px", fontSize: 10.5, fontWeight: 700,
                                    color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase",
                                    background: "#fafaf8", borderBottom: "1px solid #f0efe9"
                                }}>
                                    {h}
                                </div>
                            ))}
                            {dnsRecords.map((record: any, i: number) => (
                                <>
                                    <div key={`t${i}`} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#374151", borderBottom: i < dnsRecords.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                                        {record.type}
                                    </div>
                                    <div key={`n${i}`} style={{ padding: "10px 14px", fontSize: 12, color: "#374151", borderBottom: i < dnsRecords.length - 1 ? "1px solid #f5f5f3" : "none", wordBreak: "break-all" }}>
                                        {record.name}
                                    </div>
                                    <div key={`v${i}`} style={{ padding: "10px 14px", fontSize: 11.5, color: "#6b7280", borderBottom: i < dnsRecords.length - 1 ? "1px solid #f5f5f3" : "none", wordBreak: "break-all", fontFamily: "monospace" }}>
                                        {record.value}
                                    </div>
                                </>
                            ))}
                        </div>
                    </div>

                    <div style={{ fontSize: 11.5, color: "#92400e", marginTop: 10 }}>
                        DNS propagation can take 15 minutes to 48 hours. Click Verify Domain after adding the records.
                    </div>
                </div>
            )}

            {/* Accounts list */}
            {accounts.length === 0 && !showAddForm ? (
                <div style={{
                    textAlign: "center", padding: "40px 24px",
                    background: "#f9f9f7", borderRadius: 12,
                    border: "1.5px dashed #e0ddd6"
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
                        padding: "14px 18px",
                        background: "#f9f9f7",
                        borderRadius: 11,
                        border: `1px solid ${account.verified ? "#e8e6e1" : "#fde68a"}`,
                        marginBottom: 10,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10,
                                background: account.verified ? "#f0fdf4" : "#fffbeb",
                                border: `1px solid ${account.verified ? "#bbf7d0" : "#fde68a"}`,
                                display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 17
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
                                            padding: "2px 8px", borderRadius: 100, fontWeight: 600
                                        }}>
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                                    {account.from_email} · {account.domain}
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
                                            setDnsRecords(account.dns_records || []);
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

            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", bottom: 28, right: 32,
                    background: "#111827", color: "white",
                    padding: "12px 20px", borderRadius: 10,
                    fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8,
                    zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    animation: "savedPop 3s ease forwards"
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
};
export default EmailConnectionSection;