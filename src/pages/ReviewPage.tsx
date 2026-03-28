import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";


type Prospect = {
  id: string;
  name: string;
  email: string;
  company: string;
  website: string;
  email_subject: string;
  email_body: string;
  email_status: string;
};

const PORT = 3000;

const ReviewPage = () => {
  const { campId } = useParams();
  const nav = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };


  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchProspects = async () => {
      try {
        const res = await axios.get(
          `http://localhost:${PORT}/prospects/get_prospects/${campId}`
        );
        const data: Prospect[] = res.data.prospects;
        setProspects(data);
        const stillGenerating = data.filter((p) => !p.email_subject).length;
        if (stillGenerating > 0) setTimeout(fetchProspects, 4000);
      } catch (err) {
        console.error("Failed to fetch prospects:", err);
      }
    };
    fetchProspects();
  }, [campId]);

  useEffect(() => {
    if (selected) {
      setEditSubject(selected.email_subject || "");
      setEditBody(selected.email_body || "");
    }
  }, [selected?.id]);

  const openProspect = (p: Prospect) => {
    if (!p.email_subject) return;
    setSelected(p);
  };
  const goToNext = (currentId: string) => {
    const currentIndex = prospects.findIndex((p) => p.id === currentId);
    const next = prospects.find(
      (p, i) => i > currentIndex && p.email_subject && p.email_status === "pending"
    );
    if (next) {
      setSelected(next);
      setEditSubject(next.email_subject);
      setEditBody(next.email_body);
    } else {
      setSelected(null); // no more pending — clear selection
    }
  };

  const saveAndApprove = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await axios.patch(
        `http://localhost:${PORT}/prospects/update_mail/${selected.id}`,
        { email_subject: editSubject, email_body: editBody, email_status: "approved" }
      );
      const updated = {
        ...selected,
        email_subject: editSubject,
        email_body: editBody,
        email_status: "approved"
      };
      setProspects((prev) => prev.map((p) => (p.id === selected.id ? updated : p)));
      goToNext(selected.id); // ← auto advance
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await axios.patch(
        `http://localhost:${PORT}/prospects/update_mail/${id}`,
        { email_status: status }
      );
      setProspects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, email_status: status } : p))
      );
      goToNext(id); // ← auto advance
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const approveAll = async () => {
    const toApprove = prospects.filter((p) => p.email_subject && p.email_status === "pending");
    await Promise.all(
      toApprove.map((p) =>
        axios.patch(`http://localhost:${PORT}/prospects/update_mail/${p.id}`, { email_status: "approved" })
      )
    );
    setProspects((prev) =>
      prev.map((p) => (p.email_subject && p.email_status === "pending" ? { ...p, email_status: "approved" } : p))
    );
  };

  const filtered =
    filter === "all" ? prospects :
      filter === "generating" ? prospects.filter((p) => !p.email_subject) :
        prospects.filter((p) => p.email_status === filter);

  const approved = prospects.filter((p) => p.email_status === "approved").length;
  const total = prospects.length;
  const progressPct = total > 0 ? Math.round((approved / total) * 100) : 0;

  const getInitials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const countFor = (f: string) =>
    f === "all" ? total :
      f === "generating" ? prospects.filter(p => !p.email_subject).length :
        prospects.filter(p => p.email_status === f).length;

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.35s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Geist:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #f9f8f5;
          --surface: #ffffff;
          --surface2: #f4f3ef;
          --surface3: #eeedea;
          --ink: #141410;
          --ink2: #3d3d38;
          --ink3: #7c7c74;
          --ink4: #b8b8b0;
          --border: #e8e6df;
          --border2: #d6d4cc;
          --green: #186640;
          --green-bg: #edf7f2;
          --green-border: #a8dfbf;
          --amber: #8a5208;
          --amber-bg: #fef8ee;
          --amber-border: #f0ce88;
          --red: #aa2c2c;
          --red-bg: #fdf2f2;
          --red-border: #edb8b8;
          --blue: #1a46b8;
          --blue-bg: #eef2fd;
          --blue-border: #a8bef5;
          --serif: 'Lora', Georgia, serif;
          --sans: 'Geist', system-ui, sans-serif;
        }

        body { font-family: var(--sans); background: var(--bg); color: var(--ink); -webkit-font-smoothing: antialiased; }

        .shell {
          display: grid;
          grid-template-columns: 296px 1fr;
          height: 100vh;
          overflow: hidden;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }

        /* ─── SIDEBAR ─── */
        .sb { background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }

        .sb-head { padding: 26px 20px 18px; border-bottom: 1px solid var(--border); }

        .sb-back {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10.5px; font-weight: 500; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--ink4); cursor: pointer;
          margin-bottom: 18px; transition: color 0.15s;
        }
        .sb-back:hover { color: var(--ink3); }

        .sb-eyebrow {
          font-size: 9.5px; font-weight: 500; letter-spacing: 0.16em;
          text-transform: uppercase; color: var(--ink4); margin-bottom: 7px;
        }

        .sb-title {
          font-family: var(--serif); font-size: 26px; font-weight: 400;
          color: var(--ink); line-height: 1.18; margin-bottom: 5px;
        }

        .sb-sub { font-size: 11.5px; color: var(--ink3); font-weight: 300; }

        /* Progress */
        .sb-progress { padding: 14px 20px; border-bottom: 1px solid var(--border); background: var(--surface2); }

        .sb-progress-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 9px; }

        .sb-progress-label { font-size: 9.5px; font-weight: 500; letter-spacing: 0.11em; text-transform: uppercase; color: var(--ink3); }

        .sb-progress-num { font-family: var(--serif); font-size: 13px; color: var(--ink2); }

        .sb-track { height: 2px; background: var(--border); border-radius: 100px; overflow: hidden; }

        .sb-fill { height: 100%; background: var(--green); border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }

        /* Filters */
        .sb-filters { display: flex; gap: 5px; padding: 10px 20px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }

        .chip {
          padding: 4px 10px; border-radius: 100px;
          border: 1px solid var(--border); background: transparent;
          font-size: 11px; font-weight: 400; font-family: var(--sans);
          color: var(--ink3); cursor: pointer; transition: all 0.14s;
          letter-spacing: 0.01em;
        }
        .chip:hover { border-color: var(--border2); color: var(--ink2); }
        .chip.on { background: var(--ink); border-color: var(--ink); color: #fff; }

        /* List */
        .sb-list { flex: 1; overflow-y: auto; }

        .p-row {
          padding: 12px 20px; border-bottom: 1px solid var(--border);
          cursor: pointer; transition: background 0.1s;
          border-left: 2px solid transparent; position: relative;
        }
        .p-row:hover { background: var(--surface2); }
        .p-row.sel { background: var(--blue-bg); border-left-color: var(--blue); }
        .p-row.no-email { cursor: default; }

        .p-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 4px; }

        .p-name { font-size: 13px; font-weight: 500; color: var(--ink); line-height: 1.3; }
        .p-co { font-size: 11px; color: var(--ink3); font-weight: 300; margin-top: 1px; }

        .p-subj {
          font-size: 11px; color: var(--ink3);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: var(--serif); font-style: italic;
        }

        .p-gen { font-size: 11px; color: var(--amber); animation: gen-pulse 1.8s ease-in-out infinite; }
        @keyframes gen-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

        /* Badges */
        .bdg {
          font-size: 9px; font-weight: 500; letter-spacing: 0.06em;
          padding: 2px 7px; border-radius: 100px; white-space: nowrap;
          flex-shrink: 0; text-transform: uppercase;
        }
        .bdg-ok  { background: var(--green-bg);  color: var(--green);  border: 1px solid var(--green-border); }
        .bdg-rev { background: var(--amber-bg);  color: var(--amber);  border: 1px solid var(--amber-border); }
        .bdg-no  { background: var(--red-bg);    color: var(--red);    border: 1px solid var(--red-border); }
        .bdg-gen { background: var(--amber-bg);  color: var(--amber);  border: 1px solid var(--amber-border); }

        /* Footer */
        .sb-foot { padding: 14px 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }

        .btn-all {
          width: 100%; padding: 9px;
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 8px; font-size: 12px; font-weight: 400;
          font-family: var(--sans); color: var(--ink2); cursor: pointer;
          transition: all 0.15s;
        }
        .btn-all:hover { background: var(--green-bg); border-color: var(--green-border); color: var(--green); }

        .btn-launch {
          width: 100%; padding: 11px; border: none; border-radius: 9px;
          font-size: 13px; font-weight: 400; font-family: var(--sans);
          cursor: pointer; transition: all 0.18s; letter-spacing: 0.01em;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-launch.on  { background: var(--ink); color: #fff; }
        .btn-launch.on:hover { background: var(--ink2); }
        .btn-launch.off { background: var(--surface2); color: var(--ink4); cursor: not-allowed; }

        /* ─── MAIN ─── */
        .main { display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }

        /* Empty */
        .empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 48px; text-align: center;
        }
        .empty-icon {
          width: 60px; height: 60px; border-radius: 14px;
          background: var(--surface); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; margin-bottom: 18px;
        }
        .empty-title { font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--ink2); margin-bottom: 8px; }
        .empty-body { font-size: 13px; color: var(--ink3); line-height: 1.65; max-width: 290px; font-weight: 300; }

        /* Meta */
        .meta-row {
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 10px 36px; display: flex; gap: 24px;
          flex-wrap: wrap; align-items: center;
        }
        .meta-pair { display: flex; align-items: center; gap: 6px; }
        .meta-k { font-size: 9px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink4); }
        .meta-v { font-size: 12px; color: var(--ink2); font-weight: 400; }

        /* Status pill */
        .status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 400; color: var(--ink3);
          padding: 3px 10px; border-radius: 100px;
          border: 1px solid var(--border); background: var(--surface);
        }
        .s-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        /* Toolbar */
        .toolbar {
          background: var(--surface); border-bottom: 1px solid var(--border);
          padding: 16px 36px; display: flex; justify-content: space-between; align-items: center;
        }
        .tb-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--surface2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 500; color: var(--ink2); flex-shrink: 0;
          letter-spacing: 0.03em;
        }
        .tb-name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 3px; }
        .tb-name { font-family: var(--serif); font-size: 20px; font-weight: 400; color: var(--ink); }
        .tb-email { font-size: 12px; color: var(--ink3); font-weight: 300; padding-left: 42px; }
        .tb-actions { display: flex; gap: 8px; }

        .act-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 15px; border-radius: 8px;
          font-size: 12px; font-weight: 400; font-family: var(--sans);
          cursor: pointer; transition: all 0.14s; letter-spacing: 0.01em;
        }
        .act-rej { background: var(--red-bg);   color: var(--red);   border: 1px solid var(--red-border); }
        .act-rej:hover { background: #fbe8e8; }
        .act-app { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
        .act-app:hover { background: #daf2e8; }

        /* Editor */
        .ed-area { flex: 1; overflow-y: auto; padding: 30px 36px; }

        .f-block { margin-bottom: 20px; }

        .f-label {
          display: block; font-size: 9.5px; font-weight: 500;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--ink3); margin-bottom: 7px;
        }

        .f-input {
          width: 100%; padding: 11px 14px;
          border: 1px solid var(--border); border-radius: 9px;
          font-size: 14px; font-family: var(--sans); font-weight: 400;
          color: var(--ink); background: var(--surface);
          outline: none; transition: border-color 0.15s, box-shadow 0.15s;
          letter-spacing: -0.01em;
        }
        .f-input:focus { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-bg); }

        .f-ta {
          width: 100%; padding: 13px 14px;
          border: 1px solid var(--border); border-radius: 9px;
          font-size: 13.5px; font-family: var(--sans); font-weight: 300;
          color: var(--ink2); background: var(--surface);
          outline: none; resize: vertical; min-height: 200px;
          line-height: 1.82; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .f-ta:focus { border-color: var(--blue-border); box-shadow: 0 0 0 3px var(--blue-bg); }

        .ed-foot { display: flex; gap: 10px; padding-top: 6px; }

        .btn-save {
          padding: 10px 28px; background: var(--ink); color: #fff;
          border: none; border-radius: 9px; font-size: 13px; font-weight: 400;
          font-family: var(--sans); cursor: pointer; transition: background 0.14s;
        }
        .btn-save:hover { background: var(--ink2); }
        .btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-cncl {
          padding: 10px 20px; background: transparent; color: var(--ink3);
          border: 1px solid var(--border); border-radius: 9px;
          font-size: 13px; font-weight: 400; font-family: var(--sans);
          cursor: pointer; transition: all 0.14s;
        }
        .btn-cncl:hover { border-color: var(--border2); color: var(--ink2); }
      `}</style>

      <div className="shell">

        {/* ── SIDEBAR ── */}
        <div className="sb">

          <div className="sb-head">
            <div className="sb-back" onClick={() => nav(`/campaigns/${campId}`)}>← Campaign</div>
            <div className="sb-eyebrow">Outreach Review</div>
            <div className="sb-title">Email<br /><em>Drafts</em></div>
            <div className="sb-sub">{total} prospects · AI‑personalized</div>
          </div>

          <div className="sb-progress">
            <div className="sb-progress-row">
              <span className="sb-progress-label">Approval progress</span>
              <span className="sb-progress-num">{approved} / {total}</span>
            </div>
            <div className="sb-track">
              <div className="sb-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="sb-filters">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button key={f} className={`chip ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ opacity: 0.5, marginLeft: 4 }}>{countFor(f)}</span>
              </button>
            ))}
          </div>

          <div className="sb-list">
            {filtered.map((p) => (
              <div
                key={p.id}
                className={`p-row ${selected?.id === p.id ? "sel" : ""} ${!p.email_subject ? "no-email" : ""}`}
                onClick={() => openProspect(p)}
              >
                <div className="p-top">
                  <div>
                    <div className="p-name">{p.name || p.email}</div>
                    <div className="p-co">{p.company}</div>
                  </div>
                  {!p.email_subject ? (
                    <span className="bdg bdg-gen">Gen…</span>
                  ) : p.email_status === "approved" ? (
                    <span className="bdg bdg-ok">✓</span>
                  ) : p.email_status === "rejected" ? (
                    <span className="bdg bdg-no">✕</span>
                  ) : (
                    <span className="bdg bdg-rev">Review</span>
                  )}
                </div>
                {!p.email_subject
                  ? <div className="p-gen">Generating…</div>
                  : <div className="p-subj">{p.email_subject}</div>
                }
              </div>
            ))}
          </div>

          <div className="sb-foot">
            <button className="btn-all" onClick={approveAll}>✓ Approve all pending</button>
            <button
              className={`btn-launch ${approved > 0 ? "on" : "off"}`}
              onClick={() => approved > 0 && nav(`/campaign/${campId}`)}
            >
              Launch with {approved} email{approved !== 1 ? "s" : ""}
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="main">
          {!selected ? (
            <div className="empty">
              <div className="empty-icon">✉</div>
              <div className="empty-title">Select a prospect</div>
              <div className="empty-body">
                Choose a prospect from the list to review, edit, and approve their personalized outreach email
              </div>
            </div>
          ) : (
            <>
              <div className="meta-row">
                {[
                  { k: "To", v: selected.email },
                  { k: "Company", v: selected.company },
                  { k: "Website", v: selected.website },
                ].map((m) => (
                  <div key={m.k} className="meta-pair">
                    <span className="meta-k">{m.k}</span>
                    <span className="meta-v" style={m.k === "Website" ? { color: "var(--blue)" } : {}}>
                      {m.v}
                    </span>
                  </div>
                ))}
                <div className="meta-pair">
                  <span className="meta-k">Status</span>
                  <div className="status-pill">
                    <div className="s-dot" style={{
                      background:
                        selected.email_status === "approved" ? "var(--green)" :
                          selected.email_status === "rejected" ? "var(--red)" : "var(--amber)"
                    }} />
                    {selected.email_status === "approved" ? "Approved" :
                      selected.email_status === "rejected" ? "Rejected" : "Pending review"}
                  </div>
                </div>
              </div>

              <div className="toolbar">
                <div>
                  <div className="tb-name-row">
                    <div className="tb-avatar">{getInitials(selected.name)}</div>
                    <div className="tb-name">{selected.name}</div>
                  </div>
                  <div className="tb-email">{selected.email}</div>
                </div>
                <div className="tb-actions">
                  <button className="act-btn act-rej" onClick={() => setStatus(selected.id, "rejected")}>
                    ✕ Reject
                  </button>
                  <button className="act-btn act-app" onClick={saveAndApprove} disabled={saving}>
                    {saving ? "Saving…" : "✓ Approve"}
                  </button>
                </div>
              </div>

              <div className="ed-area">
                <div className="f-block">
                  <label className="f-label">Subject line</label>
                  <input
                    className="f-input"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Email subject…"
                  />
                </div>
                <div className="f-block">
                  <label className="f-label">Email body</label>
                  <textarea
                    className="f-ta"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={12}
                  />
                </div>
                <div className="ed-foot">
                  <button className="btn-save" onClick={saveAndApprove} disabled={saving}>
                    {saving ? "Saving…" : "Save & Approve"}
                  </button>
                  <button className="btn-cncl" onClick={() => setSelected(null)}>Cancel</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {toast && (
    <div style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#141410",
        color: "#fff",
        padding: "10px 22px",
        borderRadius: 100,
        fontSize: 13,
        fontWeight: 400,
        fontFamily: "var(--sans)",
        zIndex: 100,
        animation: "fadeUp 0.2s ease"
    }}>
        {toast}
    </div>
)}
    </div>
  );
};

export default ReviewPage;