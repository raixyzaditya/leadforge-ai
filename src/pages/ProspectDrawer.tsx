import { useEffect, useState } from "react";
import axios from "axios";

type Prospect = {
    id: string;
    name: string;
    email: string;
    company: string;
    website: string;
    linkedin: string;
    status: string;
    email_subject: string;
    email_body: string;
    email_status: string;
    sequence_step: number;
    last_email_send_at: string | null;
    created_at: string;
};

type Props = {
    prospectId: string | null;
    onClose: () => void;
};

const PORT = 3000;

const statusConfig: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    not_contacted: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8", label: "Not Contacted" },
    email_sent: { bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6", label: "Email Sent" },
    opened: { bg: "#fefce8", color: "#854d0e", dot: "#eab308", label: "Opened" },
    replied: { bg: "#f0fdf4", color: "#166534", dot: "#22c55e", label: "Replied" },
    meeting_scheduled: { bg: "#faf5ff", color: "#6b21a8", dot: "#a855f7", label: "Meeting Scheduled" },
};

const emailStatusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fffbeb", color: "#92400e", label: "Pending Review" },
    approved: { bg: "#f0fdf4", color: "#166534", label: "Approved" },
    rejected: { bg: "#fef2f2", color: "#991b1b", label: "Rejected" },
};

export const ProspectDrawer = ({ prospectId, onClose }: Props) => {
    const [prospect, setProspect] = useState<Prospect | null>(null);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState<"overview" | "email">("overview");

    // Edit state
    const [editSubject, setEditSubject] = useState("");
    const [editBody, setEditBody] = useState("");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!prospectId) {
            setProspect(null);
            setEditing(false);
            return;
        }
        setLoading(true);
        setTab("overview");
        setEditing(false);
        axios
            .get(`http://localhost:${PORT}/prospects/get_pros/${prospectId}`)
            .then((res) => {
                const p = res.data.prospect;
                setProspect(p);
                setEditSubject(p.email_subject || "");
                setEditBody(p.email_body || "");
            })
            .catch((err) => console.error("Failed to fetch prospect:", err))
            .finally(() => setLoading(false));
    }, [prospectId]);

    // Sync edit fields when prospect changes
    useEffect(() => {
        if (prospect) {
            setEditSubject(prospect.email_subject || "");
            setEditBody(prospect.email_body || "");
        }
    }, [prospect?.id]);

    const handleSave = async () => {
        if (!prospect) return;
        setSaving(true);
        try {
            await axios.patch(
                `http://localhost:${PORT}/prospects/update_mail/${prospect.id}`,
                {
                    email_subject: editSubject,
                    email_body: editBody,
                    email_status: prospect.email_status,
                }
            );
            setProspect((prev) =>
                prev ? { ...prev, email_subject: editSubject, email_body: editBody } : prev
            );
            setEditing(false);
            showToast("Prospect mail updated successfully");
        } catch (err) {
            console.error("Save failed:", err);
            showToast("Failed to save changes", "error");
        } finally {
            setSaving(false);
        }
    };
    const handleEmailStatus = async (status: string) => {
        if (!prospect) return;
        try {
            await axios.patch(
                `http://localhost:${PORT}/prospects/update_mail/${prospect.id}`,
                { email_status: status }
            );
            setProspect((prev) => prev ? { ...prev, email_status: status } : prev);
            showToast(
                status === "approved"
                    ? "Email approved successfully"
                    : "Email rejected"
                ,
                status === "approved" ? "success" : "error"
            );
        } catch (err) {
            console.error("Status update failed:", err);
            showToast("Failed to update status", "error");
        }
    };
    const handleCancel = () => {
        setEditSubject(prospect?.email_subject || "");
        setEditBody(prospect?.email_body || "");
        setEditing(false);
    };

    const isOpen = !!prospectId;

    const formatDate = (iso: string | null) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
        });
    };

    const getInitials = (name: string) =>
        name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

    const sc = prospect ? (statusConfig[prospect.status] ?? statusConfig.not_contacted) : null;
    const ec = prospect ? (emailStatusConfig[prospect.email_status] ?? emailStatusConfig.pending) : null;

    const hasChanges =
        editSubject !== (prospect?.email_subject || "") ||
        editBody !== (prospect?.email_body || "");

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Geist:wght@300;400;500&display=swap');

        .drawer-overlay {
          position: fixed; inset: 0; background: rgba(10,10,8,0.28);
          z-index: 200; transition: opacity 0.25s ease;
          backdrop-filter: blur(2px);
        }
        .drawer-overlay.hidden { opacity: 0; pointer-events: none; }

        .drawer-panel {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 500px; background: #faf9f6;
          border-left: 1px solid #e8e6de;
          z-index: 201; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Geist', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }
        .drawer-panel.open { transform: translateX(0); }

        .dr-head {
          background: #ffffff; border-bottom: 1px solid #e8e6de;
          padding: 22px 28px 18px; flex-shrink: 0;
        }
        .dr-close-row {
          display: flex; align-items: center; justify-content: flex-end;
          margin-bottom: 16px;
        }
        .close-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: #f4f3ef; border: 1px solid #e8e6de;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 13px; color: #7c7c74;
          transition: all 0.14s; line-height: 1;
        }
        .close-btn:hover { background: #eeedea; color: #3d3d38; }

        .dr-avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
        .dr-avatar {
          width: 50px; height: 50px; border-radius: 13px;
          background: linear-gradient(135deg, #e8e4f8, #dbeafe);
          border: 1px solid #e0ddf8;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 500; color: #3730a3;
          flex-shrink: 0; letter-spacing: 0.02em;
        }
        .dr-name {
          font-family: 'Lora', Georgia, serif;
          font-size: 21px; font-weight: 500; color: #141410;
          line-height: 1.2; margin-bottom: 3px;
        }
        .dr-email-meta { font-size: 12px; color: #7c7c74; font-weight: 300; }
        .dr-badges { display: flex; gap: 6px; flex-wrap: wrap; }
        .dr-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 400; padding: 3px 10px;
          border-radius: 100px; letter-spacing: 0.01em;
        }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .dr-tabs {
          display: flex; gap: 2px; padding: 0 28px;
          background: #ffffff; border-bottom: 1px solid #e8e6de; flex-shrink: 0;
        }
        .dr-tab {
          padding: 11px 16px; font-size: 12px; font-weight: 400;
          font-family: 'Geist', sans-serif; color: #7c7c74; cursor: pointer;
          border: none; background: transparent;
          border-bottom: 2px solid transparent;
          transition: all 0.14s; letter-spacing: 0.01em; margin-bottom: -1px;
        }
        .dr-tab:hover { color: #3d3d38; }
        .dr-tab.on { color: #141410; border-bottom-color: #141410; font-weight: 500; }

        .dr-body { flex: 1; overflow-y: auto; padding: 22px 28px; }
        .dr-body::-webkit-scrollbar { width: 3px; }
        .dr-body::-webkit-scrollbar-thumb { background: #d6d4cc; border-radius: 4px; }

        .dr-section { margin-bottom: 22px; }
        .dr-section-title {
          font-size: 9.5px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: #b8b8b0;
          margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e8e6de;
        }
        .dr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dr-field {
          background: #ffffff; border: 1px solid #e8e6de;
          border-radius: 10px; padding: 11px 13px;
        }
        .dr-field.full { grid-column: 1 / -1; }
        .dr-field-label {
          font-size: 9.5px; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; color: #b8b8b0; margin-bottom: 4px;
        }
        .dr-field-value { font-size: 13px; color: #3d3d38; font-weight: 400; word-break: break-all; line-height: 1.4; }
        .dr-field-link { font-size: 13px; color: #1a46b8; font-weight: 400; text-decoration: none; word-break: break-all; }
        .dr-field-link:hover { text-decoration: underline; }

        /* ── Email tab ── */
        .email-tab-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .email-tab-title {
          font-size: 9.5px; font-weight: 500; letter-spacing: 0.14em;
          text-transform: uppercase; color: #b8b8b0;
        }
        .edit-toggle-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 7px;
          font-size: 12px; font-weight: 400; font-family: 'Geist', sans-serif;
          cursor: pointer; transition: all 0.14s; letter-spacing: 0.01em;
          background: #f4f3ef; color: #3d3d38; border: 1px solid #e8e6de;
        }
        .edit-toggle-btn:hover { background: #eeedea; border-color: #d6d4cc; }

        /* View mode */
        .email-card {
          background: #ffffff; border: 1px solid #e8e6de;
          border-radius: 12px; overflow: hidden;
        }
        .email-card-head {
          padding: 14px 18px; border-bottom: 1px solid #f0efe9; background: #faf9f6;
        }
        .email-subject-label {
          font-size: 9.5px; font-weight: 500; letter-spacing: 0.12em;
          text-transform: uppercase; color: #b8b8b0; margin-bottom: 5px;
        }
        .email-subject-val {
          font-family: 'Lora', Georgia, serif;
          font-size: 15px; font-weight: 500; color: #141410; line-height: 1.35;
        }
        .email-card-body {
          padding: 18px; font-size: 13.5px; color: #3d3d38;
          line-height: 1.82; font-weight: 300; white-space: pre-wrap;
        }

        /* Edit mode */
        .edit-form { display: flex; flex-direction: column; gap: 16px; }

        .edit-field-label {
          display: block; font-size: 9.5px; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: #b8b8b0; margin-bottom: 6px;
        }
        .edit-input {
          width: 100%; padding: 10px 13px;
          border: 1px solid #e8e6de; border-radius: 8px;
          font-size: 13.5px; font-family: 'Geist', sans-serif; font-weight: 400;
          color: #141410; background: #ffffff; outline: none;
          transition: border-color 0.14s, box-shadow 0.14s;
        }
        .edit-input:focus { border-color: #a8bef5; box-shadow: 0 0 0 3px #eef2fd; }

        .edit-textarea {
          width: 100%; padding: 12px 13px;
          border: 1px solid #e8e6de; border-radius: 8px;
          font-size: 13px; font-family: 'Geist', sans-serif; font-weight: 300;
          color: #3d3d38; background: #ffffff; outline: none;
          resize: vertical; min-height: 220px; line-height: 1.8;
          transition: border-color 0.14s, box-shadow 0.14s;
        }
        .edit-textarea:focus { border-color: #a8bef5; box-shadow: 0 0 0 3px #eef2fd; }

        .edit-actions { display: flex; gap: 8px; padding-top: 4px; }

        .btn-save-changes {
          padding: 9px 22px; background: #141410; color: #fff;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 400;
          font-family: 'Geist', sans-serif; cursor: pointer; transition: background 0.14s;
        }
        .btn-save-changes:hover:not(:disabled) { background: #3d3d38; }
        .btn-save-changes:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-cancel-edit {
          padding: 9px 18px; background: transparent; color: #7c7c74;
          border: 1px solid #e8e6de; border-radius: 8px; font-size: 13px; font-weight: 400;
          font-family: 'Geist', sans-serif; cursor: pointer; transition: all 0.14s;
        }
        .btn-cancel-edit:hover { border-color: #d6d4cc; color: #3d3d38; }

        .no-email {
          text-align: center; padding: 48px 20px;
          color: #b8b8b0; font-size: 13px; font-weight: 300;
        }
        .no-email-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.35; }

        /* Loading */
        .dr-loading { flex: 1; display: flex; align-items: center; justify-content: center; }
        .spinner {
          width: 24px; height: 24px; border-radius: 50%;
          border: 2px solid #e8e6de; border-top-color: #141410;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Timeline */
        .timeline-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid #f4f3ef;
        }
        .timeline-row:last-child { border-bottom: none; }
        .tl-step {
          width: 27px; height: 27px; border-radius: 50%;
          background: #f4f3ef; border: 1px solid #e8e6de;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 500; color: #7c7c74; flex-shrink: 0;
        }
        .tl-step.done { background: #f0fdf4; border-color: #a8dfbf; color: #186640; }
        .tl-label { font-size: 12.5px; color: #3d3d38; font-weight: 400; }
        .tl-date { font-size: 11px; color: #b8b8b0; font-weight: 300; margin-left: auto; }

        /* Toast */
        .toast {
          position: fixed; bottom: 28px; left: 50%;
          transform: translateX(-50%);
          padding: 11px 22px; border-radius: 100px;
          font-size: 13px; font-weight: 400; font-family: 'Geist', sans-serif;
          z-index: 300; white-space: nowrap;
          animation: toastIn 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          letter-spacing: 0.01em;
        }
        .toast.success { background: #141410; color: #ffffff; }
        .toast.error   { background: #aa2c2c; color: #ffffff; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fadeIn 0.2s ease; }

        .unsaved-dot {
          display: inline-block; width: 6px; height: 6px;
          border-radius: 50%; background: #f59e0b;
          margin-left: 6px; vertical-align: middle;
        }
      `}</style>

            {/* Overlay */}
            <div className={`drawer-overlay ${isOpen ? "" : "hidden"}`} onClick={onClose} />

            {/* Panel */}
            <div className={`drawer-panel ${isOpen ? "open" : ""}`}>
                {loading ? (
                    <div className="dr-loading"><div className="spinner" /></div>
                ) : prospect ? (
                    <>
                        {/* ── Header ── */}
                        <div className="dr-head">
                            <div className="dr-close-row">
                                <button className="close-btn" onClick={onClose}>✕</button>
                            </div>
                            <div className="dr-avatar-row">
                                <div className="dr-avatar">{getInitials(prospect.name)}</div>
                                <div>
                                    <div className="dr-name">{prospect.name || "—"}</div>
                                    <div className="dr-email-meta">{prospect.email}</div>
                                </div>
                            </div>
                            <div className="dr-badges">
                                {sc && (
                                    <span className="dr-badge" style={{ background: sc.bg, color: sc.color }}>
                                        <span className="badge-dot" style={{ background: sc.dot }} />
                                        {sc.label}
                                    </span>
                                )}
                                {ec && (
                                    <span className="dr-badge" style={{ background: ec.bg, color: ec.color }}>
                                        ✉ {ec.label}
                                    </span>
                                )}
                            </div>

                            {/* ── Approve / Reject buttons ── */}
                            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                                <button
                                    onClick={() => handleEmailStatus("approved")}
                                    disabled={prospect.email_status === "approved"}
                                    style={{
                                        flex: 1,
                                        padding: "8px 0",
                                        borderRadius: 8,
                                        border: "1px solid #a8dfbf",
                                        background: prospect.email_status === "approved" ? "#f0fdf4" : "#ffffff",
                                        color: "#186640",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        fontFamily: "'Geist', sans-serif",
                                        cursor: prospect.email_status === "approved" ? "not-allowed" : "pointer",
                                        opacity: prospect.email_status === "approved" ? 0.6 : 1,
                                        transition: "all 0.14s",
                                    }}
                                >
                                    {prospect.email_status === "approved" ? "✓ Approved" : "✓ Approve"}
                                </button>
                                <button
                                    onClick={() => handleEmailStatus("rejected")}
                                    disabled={prospect.email_status === "rejected"}
                                    style={{
                                        flex: 1,
                                        padding: "8px 0",
                                        borderRadius: 8,
                                        border: "1px solid #edb8b8",
                                        background: prospect.email_status === "rejected" ? "#fef2f2" : "#ffffff",
                                        color: "#aa2c2c",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        fontFamily: "'Geist', sans-serif",
                                        cursor: prospect.email_status === "rejected" ? "not-allowed" : "pointer",
                                        opacity: prospect.email_status === "rejected" ? 0.6 : 1,
                                        transition: "all 0.14s",
                                    }}
                                >
                                    {prospect.email_status === "rejected" ? "✕ Rejected" : "✕ Reject"}
                                </button>
                            </div>
                        </div>

                        {/* ── Tabs ── */}
                        <div className="dr-tabs">
                            {(["overview", "email"] as const).map((t) => (
                                <button
                                    key={t}
                                    className={`dr-tab ${tab === t ? "on" : ""}`}
                                    onClick={() => { setTab(t); if (t === "overview") setEditing(false); }}
                                >
                                    {t === "overview" ? "Overview" : (
                                        <>
                                            Email Draft
                                            {tab === "email" && editing && hasChanges && (
                                                <span className="unsaved-dot" title="Unsaved changes" />
                                            )}
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* ── Body ── */}
                        <div className="dr-body fade-in">

                            {/* Overview tab */}
                            {tab === "overview" && (
                                <>
                                    <div className="dr-section">
                                        <div className="dr-section-title">Contact Details</div>
                                        <div className="dr-grid">
                                            <div className="dr-field">
                                                <div className="dr-field-label">Name</div>
                                                <div className="dr-field-value">{prospect.name || "—"}</div>
                                            </div>
                                            <div className="dr-field">
                                                <div className="dr-field-label">Company</div>
                                                <div className="dr-field-value">{prospect.company || "—"}</div>
                                            </div>
                                            <div className="dr-field full">
                                                <div className="dr-field-label">Email</div>
                                                <div className="dr-field-value" style={{ color: "#1a46b8" }}>{prospect.email}</div>
                                            </div>
                                            <div className="dr-field">
                                                <div className="dr-field-label">Website</div>
                                                {prospect.website ? (
                                                    <a
                                                        className="dr-field-link"
                                                        href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
                                                        target="_blank" rel="noreferrer"
                                                    >
                                                        {prospect.website}
                                                    </a>
                                                ) : <div className="dr-field-value">—</div>}
                                            </div>
                                            <div className="dr-field">
                                                <div className="dr-field-label">LinkedIn</div>
                                                {prospect.linkedin ? (
                                                    <a
                                                        className="dr-field-link"
                                                        href={prospect.linkedin.startsWith("http") ? prospect.linkedin : `https://${prospect.linkedin}`}
                                                        target="_blank" rel="noreferrer"
                                                    >
                                                        View Profile ↗
                                                    </a>
                                                ) : <div className="dr-field-value">—</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dr-section">
                                        <div className="dr-section-title">Outreach Status</div>
                                        <div className="dr-grid">
                                            <div className="dr-field">
                                                <div className="dr-field-label">Status</div>
                                                <div className="dr-field-value">{sc?.label || prospect.status}</div>
                                            </div>
                                            <div className="dr-field">
                                                <div className="dr-field-label">Sequence Step</div>
                                                <div className="dr-field-value">
                                                    {prospect.sequence_step > 0 ? `Step ${prospect.sequence_step}` : "Not started"}
                                                </div>
                                            </div>
                                            <div className="dr-field">
                                                <div className="dr-field-label">Last Email Sent</div>
                                                <div className="dr-field-value">{formatDate(prospect.last_email_send_at)}</div>
                                            </div>
                                            <div className="dr-field">
                                                <div className="dr-field-label">Added On</div>
                                                <div className="dr-field-value">{formatDate(prospect.created_at)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="dr-section">
                                        <div className="dr-section-title">Journey</div>
                                        {[
                                            { label: "Added to campaign", done: true, date: formatDate(prospect.created_at) },
                                            { label: "Email generated", done: !!prospect.email_subject, date: prospect.email_subject ? "Done" : "Pending" },
                                            { label: "Email approved", done: prospect.email_status === "approved", date: prospect.email_status === "approved" ? "Done" : "—" },
                                            { label: "Email sent", done: ["email_sent", "opened", "replied", "meeting_scheduled"].includes(prospect.status), date: formatDate(prospect.last_email_send_at) },
                                            { label: "Opened", done: ["opened", "replied", "meeting_scheduled"].includes(prospect.status), date: "—" },
                                            { label: "Replied", done: ["replied", "meeting_scheduled"].includes(prospect.status), date: "—" },
                                        ].map((step, i) => (
                                            <div key={i} className="timeline-row">
                                                <div className={`tl-step ${step.done ? "done" : ""}`}>
                                                    {step.done ? "✓" : i + 1}
                                                </div>
                                                <div className="tl-label">{step.label}</div>
                                                <div className="tl-date">{step.date}</div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Email tab */}
                            {tab === "email" && (
                                <>
                                    <div className="email-tab-head">
                                        <span className="email-tab-title">
                                            {editing ? "Editing Draft" : "Email Draft"}
                                        </span>
                                        {prospect.email_subject && !editing && (
                                            <button className="edit-toggle-btn" onClick={() => setEditing(true)}>
                                                ✏ Edit
                                            </button>
                                        )}
                                    </div>

                                    {!prospect.email_subject ? (
                                        <div className="no-email">
                                            <div className="no-email-icon">✉</div>
                                            <div>No email generated yet</div>
                                        </div>
                                    ) : editing ? (
                                        /* ── Edit mode ── */
                                        <div className="edit-form">
                                            <div>
                                                <label className="edit-field-label">Subject line</label>
                                                <input
                                                    className="edit-input"
                                                    value={editSubject}
                                                    onChange={(e) => setEditSubject(e.target.value)}
                                                    placeholder="Email subject…"
                                                />
                                            </div>
                                            <div>
                                                <label className="edit-field-label">Email body</label>
                                                <textarea
                                                    className="edit-textarea"
                                                    value={editBody}
                                                    onChange={(e) => setEditBody(e.target.value)}
                                                    rows={12}
                                                />
                                            </div>
                                            <div className="edit-actions">
                                                <button
                                                    className="btn-save-changes"
                                                    onClick={handleSave}
                                                    disabled={saving || !hasChanges}
                                                >
                                                    {saving ? "Saving…" : "Save changes"}
                                                </button>
                                                <button className="btn-cancel-edit" onClick={handleCancel}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* ── View mode ── */
                                        <div className="email-card">
                                            <div className="email-card-head">
                                                <div className="email-subject-label">Subject</div>
                                                <div className="email-subject-val">{prospect.email_subject}</div>
                                            </div>
                                            <div className="email-card-body">{prospect.email_body}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                ) : null}
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
                </div>
            )}
        </>
    );
};

export default ProspectDrawer;