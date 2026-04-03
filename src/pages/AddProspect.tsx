import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const PORT = 3000;

type Prospect = {
    name: string;
    email: string;
    company: string;
    website: string;
    linkedin: string;
};

type FieldError = { name?: string; email?: string };

const emptyProspect = (): Prospect => ({
    name: "", email: "", company: "", website: "", linkedin: "",
});

const AddProspect = () => {
    const { campId } = useParams();
    const nav = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [prospects, setProspects] = useState<Prospect[]>([emptyProspect()]);
    const [errors, setErrors] = useState<FieldError[]>([{}]);
    const [activeCard, setActiveCard] = useState(0);
    const [loading, setLoading] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const [done, setDone] = useState(false);
    const [orgId, setOrgId] = useState("");
    const [mounted, setMounted] = useState(false);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [processingMsg, setProcessingMsg] = useState("");
    const [generatedCount, setGeneratedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [allGenerated, setAllGenerated] = useState(false);

    useEffect(() => {
        setMounted(true);
        const user = localStorage.getItem("user");
        if (user) setOrgId(JSON.parse(user).org_id);
    }, []);

    const validateAll = (): boolean => {
        const newErrors: FieldError[] = prospects.map((p) => {
            const e: FieldError = {};
            if (!p.name.trim()) e.name = "Required";
            if (!p.email.trim()) e.email = "Required";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))
                e.email = "Invalid email";
            return e;
        });
        setErrors(newErrors);
        const firstInvalid = newErrors.findIndex(e => Object.keys(e).length > 0);
        if (firstInvalid !== -1) setActiveCard(firstInvalid);
        return newErrors.every(e => Object.keys(e).length === 0);
    };

    const handleChange = (idx: number, field: keyof Prospect, value: string) => {
        setProspects(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
        if (errors[idx]?.[field as keyof FieldError]) {
            setErrors(prev => prev.map((e, i) => i === idx ? { ...e, [field]: undefined } : e));
        }
    };

    const addRow = () => {
        setProspects(prev => [...prev, emptyProspect()]);
        setErrors(prev => [...prev, {}]);
        setTimeout(() => setActiveCard(prospects.length), 50);
    };

    const removeRow = (idx: number) => {
        if (prospects.length === 1) return;
        setProspects(prev => prev.filter((_, i) => i !== idx));
        setErrors(prev => prev.filter((_, i) => i !== idx));
        setActiveCard(Math.max(0, idx - 1));
    };

    const pollUntilDone = async () => {
        setDone(true);
        const maxAttempts = 40;
        let attempts = 0;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await axios.get(
                    `http://localhost:${PORT}/prospects/get_prospects/${campId}`
                );
                const all: any[] = res.data.prospects;
                const pending = all.filter(p => !p.email_subject);
                const generated = all.filter(p => p.email_subject).length;

                setGeneratedCount(generated);
                setTotalCount(all.length);

                if (pending.length === 0 || attempts >= maxAttempts) {
                    clearInterval(interval);
                    setAllGenerated(true);
                }
            } catch (err) {
                console.error("Poll failed:", err);
            }
        }, 4000);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirm(false);
        setLoading(true);

        const messages = [
            "Submitting prospects…",
            "Scraping websites…",
            "Analysing company data…",
            "Generating personalized emails…",
            "Almost done…",
        ];
        let msgIdx = 0;
        setProcessingMsg(messages[0]);
        const msgInterval = setInterval(() => {
            msgIdx = (msgIdx + 1) % messages.length;
            setProcessingMsg(messages[msgIdx]);
        }, 2200);

        try {
            const res = await axios.post(
                `http://localhost:${PORT}/prospects/add_prospects_manually`,
                { prospects, camp_id: campId, organization_id: orgId }
            );
            clearInterval(msgInterval);
            setSuccessCount(res.data.added);
            setLoading(false);
            pollUntilDone();
        } catch (err) {
            clearInterval(msgInterval);
            console.error("Failed:", err);
            setLoading(false);
        }
    };

    const totalFilled = prospects.reduce(
        (acc, p) => acc + Object.values(p).filter(v => v.trim()).length, 0
    );
    const totalFields = prospects.length * 5;
    const progressPct = Math.round((totalFilled / totalFields) * 100);

    const fields: { id: keyof Prospect; label: string; placeholder: string; required: boolean; num: string }[] = [
        { id: "name",     label: "Full Name",  placeholder: "Carl Mellander",      required: true,  num: "01" },
        { id: "email",    label: "Work Email", placeholder: "carl@ericsson.com",    required: true,  num: "02" },
        { id: "company",  label: "Company",    placeholder: "Ericsson",             required: false, num: "03" },
        { id: "website",  label: "Website",    placeholder: "https://ericsson.com", required: false, num: "04" },
        { id: "linkedin", label: "LinkedIn",   placeholder: "linkedin.com/in/carl", required: false, num: "05" },
    ];

    return (
        <div style={{
            minHeight: "100vh", display: "flex",
            fontFamily: "'Geist', system-ui, sans-serif",
            opacity: mounted ? 1 : 0, transition: "opacity 0.35s ease",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,ital,wght@9..144,0,300;9..144,0,400;9..144,1,300;9..144,1,400&family=Geist:wght@300;400;500&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                :root {
                    --left-bg:    #151410;
                    --right-bg:   #1c1b16;
                    --surface:    #242318;
                    --ink:        #f0ede3;
                    --ink2:       #c8c5b8;
                    --ink3:       #8a8880;
                    --ink4:       #56544e;
                    --border:     rgba(240,237,227,0.08);
                    --border2:    rgba(240,237,227,0.16);
                    --accent:     #d4a853;
                    --accent-dim: rgba(212,168,83,0.12);
                    --red:        #e06060;
                    --red-bg:     rgba(224,96,96,0.08);
                    --serif: 'Fraunces', Georgia, serif;
                    --sans:  'Geist', system-ui, sans-serif;
                }
                @keyframes slideLeft  { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
                @keyframes slideRight { from{opacity:0;transform:translateX(20px)}  to{opacity:1;transform:translateX(0)} }
                @keyframes fadeUp     { from{opacity:0;transform:translateY(10px)}  to{opacity:1;transform:translateY(0)} }
                @keyframes cardIn     { from{opacity:0;transform:translateY(8px)}   to{opacity:1;transform:translateY(0)} }
                @keyframes spin       { to{transform:rotate(360deg)} }
                @keyframes successIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
                @keyframes checkDraw  { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
                @keyframes pulseGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(212,168,83,0.3)} 50%{box-shadow:0 0 0 8px rgba(212,168,83,0)} }
                @keyframes shimmerBar { 0%{transform:translateX(-200%)} 100%{transform:translateX(400%)} }

                .left-anim  { animation: slideLeft  0.5s cubic-bezier(0.4,0,0.2,1) forwards; }
                .right-anim { animation: slideRight 0.5s cubic-bezier(0.4,0,0.2,1) 0.1s forwards; opacity:0; }

                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

                .ap-label {
                    display: block; font-size: 9.5px; font-weight: 500;
                    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 7px;
                    transition: color 0.15s;
                }
                .ap-input {
                    width: 100%; padding: 0 0 9px 0;
                    background: transparent; border: none;
                    border-bottom: 1px solid var(--border);
                    font-size: 14.5px; font-family: var(--sans); font-weight: 300;
                    color: var(--ink); outline: none; transition: border-color 0.2s;
                    caret-color: var(--accent);
                }
                .ap-input::placeholder { color: var(--ink4); }
                .ap-input:focus { border-bottom-color: rgba(240,237,227,0.35); }
                .ap-input.err { border-bottom-color: var(--red); }

                .err-hint { font-size: 10.5px; color: var(--red); margin-top: 4px; display: flex; align-items: center; gap: 4px; }

                .p-card {
                    border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px;
                    cursor: pointer; transition: all 0.2s; position: relative; margin-bottom: 10px;
                }
                .p-card:hover { border-color: var(--border2); background: rgba(255,255,255,0.02); }
                .p-card.active { border-color: var(--accent); background: var(--accent-dim); }
                .p-card-num { font-family: var(--serif); font-style: italic; font-size: 10px; color: var(--ink4); margin-bottom: 4px; }
                .p-card-name { font-size: 14px; font-weight: 400; color: var(--ink); }
                .p-card-email { font-size: 11.5px; color: var(--ink3); font-weight: 300; margin-top: 2px; }

                .remove-btn {
                    position: absolute; top: 14px; right: 14px;
                    width: 22px; height: 22px; border-radius: 50%;
                    background: transparent; border: 1px solid var(--border);
                    color: var(--ink4); font-size: 11px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s; font-family: var(--sans);
                }
                .remove-btn:hover { border-color: var(--red); color: var(--red); background: var(--red-bg); }

                .add-row-btn {
                    width: 100%; padding: 11px; background: transparent;
                    border: 1px dashed var(--border); border-radius: 10px; color: var(--ink3);
                    font-size: 12px; font-weight: 400; font-family: var(--sans);
                    cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em;
                    display: flex; align-items: center; justify-content: center; gap: 7px;
                }
                .add-row-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

                .submit-btn {
                    display: inline-flex; align-items: center; gap: 9px;
                    padding: 13px 28px; background: var(--accent); color: #0f0e09;
                    border: none; border-radius: 100px; font-size: 13px; font-weight: 500;
                    font-family: var(--sans); cursor: pointer; transition: all 0.2s; letter-spacing: 0.01em;
                }
                .submit-btn:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
                .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

                .back-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    font-size: 10.5px; font-weight: 400; color: var(--ink4);
                    cursor: pointer; letter-spacing: 0.09em; text-transform: uppercase;
                    background: none; border: none; font-family: var(--sans);
                    transition: color 0.15s; padding: 0;
                }
                .back-btn:hover { color: var(--ink2); }

                .f-row { animation: fadeUp 0.3s ease forwards; opacity: 0; }

                .prog-track { height: 1px; background: var(--border); border-radius: 100px; overflow: hidden; }
                .prog-bar { height: 100%; background: var(--accent); border-radius: 100px; transition: width 0.4s ease; }

                .field-num {
                    position: absolute; left: -28px; top: 28px;
                    font-size: 9.5px; color: var(--ink4); font-family: var(--serif); font-style: italic;
                }

                .modal-cancel-btn {
                    flex: 1; padding: 11px;
                    background: transparent;
                    border: 1px solid var(--border);
                    border-radius: 10px; color: var(--ink3);
                    font-size: 13px; font-weight: 400;
                    font-family: var(--sans); cursor: pointer; transition: all 0.15s;
                }
                .modal-cancel-btn:hover { border-color: rgba(240,237,227,0.25); color: var(--ink2); }

                .modal-confirm-btn {
                    flex: 2; padding: 11px;
                    background: transparent;
                    border: 1.5px solid var(--accent);
                    border-radius: 10px; color: var(--accent);
                    font-size: 13px; font-weight: 500;
                    font-family: var(--sans); cursor: pointer; transition: all 0.18s;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .modal-confirm-btn:hover {
                    background: var(--accent-dim);
                    border-color: var(--accent);
                    transform: translateY(-1px);
                }
            `}</style>

            {/* ── LEFT ── */}
            <div className="left-anim" style={{
                width: "38%", minHeight: "100vh",
                background: "var(--left-bg)",
                borderRight: "1px solid var(--border)",
                display: "flex", flexDirection: "column",
                padding: "44px 40px",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", inset: 0, opacity: 0.35,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat", backgroundSize: "128px", pointerEvents: "none",
                }} />

                <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>
                    <button className="back-btn" onClick={() => nav(`/campaigns/${campId}`)}>
                        ← Campaign
                    </button>

                    <div style={{ marginTop: 40, marginBottom: 40 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 12 }}>
                            LeadForge
                        </div>
                        <h1 style={{ fontFamily: "var(--serif)", fontSize: 48, fontWeight: 300, color: "var(--ink)", lineHeight: 1.08, letterSpacing: "-0.5px", marginBottom: 14 }}>
                            Add<br /><em>prospects.</em>
                        </h1>
                        <p style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.7, maxWidth: 260 }}>
                            Add one or more prospects. We'll walk over your prospect's business culture and generate a personalized email automatically.
                        </p>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 10 }}>
                            {prospects.length} Prospect{prospects.length !== 1 ? "s" : ""}
                        </div>
                        {prospects.map((p, i) => (
                            <div
                                key={i}
                                className={`p-card ${activeCard === i ? "active" : ""}`}
                                onClick={() => !done && setActiveCard(i)}
                                style={{ animation: `cardIn 0.25s ease ${i * 0.04}s both` }}
                            >
                                <div className="p-card-num">#{String(i + 1).padStart(2, "0")}</div>
                                <div className="p-card-name">{p.name || "—"}</div>
                                <div className="p-card-email">{p.email || "No email yet"}</div>
                                {prospects.length > 1 && !done && (
                                    <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeRow(i); }}>✕</button>
                                )}
                            </div>
                        ))}
                        {!done && (
                            <button className="add-row-btn" onClick={addRow}>
                                + Add another prospect
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                            <span style={{ fontSize: 9.5, color: "var(--ink4)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                Completion
                            </span>
                            <span style={{ fontFamily: "var(--serif)", fontSize: 12, color: "var(--ink3)" }}>
                                {done ? `${generatedCount} / ${totalCount} emails` : `${totalFilled} / ${totalFields}`}
                            </span>
                        </div>
                        <div className="prog-track">
                            <div className="prog-bar" style={{
                                width: done
                                    ? `${totalCount > 0 ? (generatedCount / totalCount) * 100 : 0}%`
                                    : `${progressPct}%`
                            }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="right-anim" style={{
                flex: 1, minHeight: "100vh",
                background: "var(--right-bg)",
                display: "flex", alignItems: "flex-start",
                padding: "44px 64px", overflowY: "auto",
            }}>
                {done ? (
                    /* ── SUCCESS SCREEN ── */
                    <div style={{ animation: "successIn 0.4s ease forwards", paddingTop: 60 }}>
                        <div style={{ marginBottom: 28 }}>
                            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                                <circle cx="28" cy="28" r="27" stroke="var(--accent)" strokeWidth="1" fill="var(--accent-dim)" />
                                <polyline
                                    points="16,29 25,38 41,20"
                                    stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round" fill="none" strokeDasharray="40"
                                    style={{ strokeDashoffset: 0, animation: "checkDraw 0.45s ease 0.15s forwards" }}
                                />
                            </svg>
                        </div>

                        <div style={{
                            fontFamily: "var(--serif)", fontSize: 46, fontWeight: 300,
                            color: "var(--ink)", lineHeight: 1.1, letterSpacing: "-0.5px", marginBottom: 12,
                        }}>
                            {successCount} prospect{successCount !== 1 ? "s" : ""}<br />
                            <em>added.</em>
                        </div>

                        <p style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.7, maxWidth: 320, marginBottom: 24 }}>
                            {allGenerated
                                ? "All personalized emails are ready for review."
                                : "Scraping websites and generating personalized emails in the background."
                            }
                        </p>

                        {/* Live generation progress */}
                        {!allGenerated && totalCount > 0 && (
                            <div style={{ marginBottom: 32, maxWidth: 320 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 11 }}>
                                    <span style={{ color: "var(--ink4)" }}>Emails generated</span>
                                    <span style={{ fontFamily: "var(--serif)", color: "var(--ink2)" }}>
                                        {generatedCount} / {totalCount}
                                    </span>
                                </div>
                                <div style={{ height: 2, background: "var(--border)", borderRadius: 100, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", borderRadius: 100, background: "var(--accent)",
                                        width: `${totalCount > 0 ? (generatedCount / totalCount) * 100 : 0}%`,
                                        transition: "width 0.5s ease",
                                    }} />
                                </div>
                                <div style={{ fontSize: 11, color: "var(--ink4)", marginTop: 8, display: "flex", alignItems: "center", gap: 7 }}>
                                    <span style={{
                                        width: 10, height: 10, borderRadius: "50%",
                                        border: "1.5px solid var(--border2)", borderTopColor: "var(--accent)",
                                        animation: "spin 0.8s linear infinite", display: "inline-block",
                                    }} />
                                    Checking every 4 seconds…
                                </div>
                            </div>
                        )}

                        {/* Review button — only when all done */}
                        {allGenerated && (
                            <button
                                onClick={() => nav(`/review/${campId}`)}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 8,
                                    padding: "12px 28px", background: "var(--accent)",
                                    color: "#0f0e09", border: "none", borderRadius: 100,
                                    fontSize: 13, fontWeight: 500, fontFamily: "var(--sans)",
                                    cursor: "pointer", marginBottom: 16, transition: "all 0.2s",
                                }}
                            >
                                Review Emails →
                            </button>
                        )}

                        <div style={{ marginTop: 8 }}>
                            <button
                                onClick={() => nav(`/campaign/${campId}`)}
                                style={{
                                    background: "none", border: "none", color: "var(--ink4)",
                                    fontSize: 12, fontFamily: "var(--sans)", cursor: "pointer",
                                    textDecoration: "underline", padding: 0,
                                }}
                            >
                                Back to campaign
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ── FORM ── */
                    <form style={{ width: "100%", maxWidth: 420, paddingTop: 16 }}>
                        <div style={{ marginBottom: 36 }}>
                            <div style={{ fontFamily: "var(--serif)", fontSize: 13, fontStyle: "italic", color: "var(--accent)", marginBottom: 8 }}>
                                Prospect #{String(activeCard + 1).padStart(2, "0")}
                            </div>
                            <h2 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 300, color: "var(--ink)", lineHeight: 1.15, letterSpacing: "-0.3px" }}>
                                {prospects[activeCard].name
                                    ? <>Details for <em>{prospects[activeCard].name}</em></>
                                    : <>Who are you<br /><em>reaching out to?</em></>
                                }
                            </h2>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingLeft: 28, marginBottom: 44 }}>
                            {fields.map((field, fi) => (
                                <div key={field.id} className="f-row" style={{ position: "relative", animationDelay: `${fi * 0.06}s` }}>
                                    <span className="field-num">{field.num}</span>
                                    <label
                                        className="ap-label"
                                        htmlFor={`${activeCard}-${field.id}`}
                                        style={{
                                            color: errors[activeCard]?.[field.id as keyof FieldError]
                                                ? "var(--red)"
                                                : activeField === `${activeCard}-${field.id}`
                                                    ? "var(--ink2)"
                                                    : "var(--ink4)",
                                        }}
                                    >
                                        {field.label}
                                        {field.required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
                                    </label>
                                    <input
                                        className={`ap-input ${errors[activeCard]?.[field.id as keyof FieldError] ? "err" : ""}`}
                                        id={`${activeCard}-${field.id}`}
                                        type={field.id === "email" ? "email" : "text"}
                                        placeholder={field.placeholder}
                                        value={prospects[activeCard][field.id]}
                                        onChange={e => handleChange(activeCard, field.id, e.target.value)}
                                        onFocus={() => setActiveField(`${activeCard}-${field.id}`)}
                                        onBlur={() => setActiveField(null)}
                                        autoComplete="off"
                                    />
                                    {errors[activeCard]?.[field.id as keyof FieldError] && (
                                        <div className="err-hint">↑ {errors[activeCard][field.id as keyof FieldError]}</div>
                                    )}
                                    {field.id === "email" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: "-28px", marginTop: 28 }}>
                                            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                            <span style={{ fontSize: 9.5, color: "var(--ink4)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>Optional</span>
                                            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {prospects.length > 1 && (
                            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                                <button
                                    type="button"
                                    disabled={activeCard === 0}
                                    onClick={() => setActiveCard(p => p - 1)}
                                    style={{
                                        padding: "7px 16px", borderRadius: 8,
                                        background: "transparent", border: "1px solid var(--border)",
                                        color: activeCard === 0 ? "var(--ink4)" : "var(--ink2)",
                                        fontSize: 12, cursor: activeCard === 0 ? "not-allowed" : "pointer",
                                        fontFamily: "var(--sans)", transition: "all 0.15s",
                                        opacity: activeCard === 0 ? 0.4 : 1,
                                    }}
                                >← Prev</button>
                                <button
                                    type="button"
                                    disabled={activeCard === prospects.length - 1}
                                    onClick={() => setActiveCard(p => p + 1)}
                                    style={{
                                        padding: "7px 16px", borderRadius: 8,
                                        background: "transparent", border: "1px solid var(--border)",
                                        color: activeCard === prospects.length - 1 ? "var(--ink4)" : "var(--ink2)",
                                        fontSize: 12, cursor: activeCard === prospects.length - 1 ? "not-allowed" : "pointer",
                                        fontFamily: "var(--sans)", transition: "all 0.15s",
                                        opacity: activeCard === prospects.length - 1 ? 0.4 : 1,
                                    }}
                                >Next →</button>
                                <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink4)", display: "flex", alignItems: "center" }}>
                                    {activeCard + 1} of {prospects.length}
                                </span>
                            </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                            <button
                                type="button"
                                className="submit-btn"
                                disabled={loading}
                                onClick={() => { if (!validateAll()) return; setShowConfirm(true); }}
                            >
                                Submit {prospects.length} Prospect{prospects.length !== 1 ? "s" : ""} →
                            </button>
                            <span style={{ fontSize: 11, color: "var(--ink4)", fontWeight: 300 }}>
                                <span style={{ color: "var(--red)" }}>*</span> Name & email required
                            </span>
                        </div>
                    </form>
                )}
            </div>

            {/* ── Processing Loader ── */}
            {loading && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
                    backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 200,
                }}>
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
                        padding: "48px 56px", background: "#1c1b16",
                        border: "1px solid rgba(240,237,227,0.08)", borderRadius: 20,
                        boxShadow: "0 32px 80px rgba(0,0,0,0.6)", position: "relative", overflow: "hidden",
                    }}>
                        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, var(--accent), transparent)" }} />
                        <div style={{ position: "relative", width: 64, height: 64 }}>
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(212,168,83,0.15)" }} />
                            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid transparent", borderTopColor: "var(--accent)", borderRightColor: "rgba(212,168,83,0.3)", animation: "spin 1s linear infinite" }} />
                            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", opacity: 0.7 }} />
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                            {prospects.map((_, i) => (
                                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", opacity: 0.3, animation: `pulseGlow 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 300, color: "var(--ink)", marginBottom: 8, letterSpacing: "-0.2px" }}>
                                {processingMsg}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--ink4)", fontWeight: 300 }}>
                                Processing {prospects.length} prospect{prospects.length !== 1 ? "s" : ""} · Please wait
                            </div>
                        </div>
                        <div style={{ width: 200, height: 1, background: "var(--border)", borderRadius: 100, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: "40%", background: "var(--accent)", borderRadius: 100, animation: "shimmerBar 1.8s ease-in-out infinite" }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirm Modal ── */}
            {showConfirm && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
                    backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
                    justifyContent: "center", zIndex: 100, animation: "fadeUp 0.2s ease forwards",
                }}>
                    <div style={{
                        background: "#1c1b16", border: "1px solid rgba(240,237,227,0.12)",
                        borderRadius: 18, padding: "36px 40px", width: "100%", maxWidth: 420,
                        boxShadow: "0 32px 80px rgba(0,0,0,0.6)", position: "relative",
                        animation: "successIn 0.25s cubic-bezier(0.4,0,0.2,1) forwards",
                    }}>
                        <div style={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 1, background: "linear-gradient(90deg, transparent, var(--accent), transparent)", borderRadius: 100 }} />

                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(212,168,83,0.1)", border: "1px solid rgba(212,168,83,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 20 }}>
                            ✦
                        </div>

                        <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 300, color: "var(--ink)", lineHeight: 1.2, marginBottom: 10, letterSpacing: "-0.3px" }}>
                            Ready to submit<br />
                            <em>{prospects.length} prospect{prospects.length !== 1 ? "s" : ""}?</em>
                        </div>

                        <p style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
                            Once confirmed, we'll walk over your prospect's business culture and generate personalized emails in the background. You'll be able to review them before sending.
                        </p>

                        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 28, display: "flex", flexDirection: "column", gap: 7 }}>
                            {prospects.map((p, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                                    <span style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 10, color: "var(--ink4)", minWidth: 24 }}>
                                        #{String(i + 1).padStart(2, "0")}
                                    </span>
                                    <span style={{ color: "var(--ink2)", fontWeight: 400, flex: 1 }}>{p.name || "—"}</span>
                                    <span style={{ color: "var(--ink4)", fontWeight: 300 }}>{p.email}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="modal-cancel-btn" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="modal-confirm-btn" onClick={handleConfirmSubmit}>
                                ✦ Yes, confirm & generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddProspect;