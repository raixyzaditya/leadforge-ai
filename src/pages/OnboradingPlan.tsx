import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PORT = 3000;

const OnboradingPlan = () => {
  const nav = useNavigate()
  const [openFree, setOpenFree] = useState(false);
  const [openMonthly, setOpenMonthly] = useState(false);
  const [openYearly, setOpenYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planData, setPlanData] = useState({
    "type": "",
    "org_id": "",
    "user_id": ""
  });
  const [err, setErr] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      nav('/signup')
      return;
    }
    const parsed = JSON.parse(user);
    setPlanData({
      ...planData,
      "org_id": parsed.org_id,
      "user_id": parsed.id
    })
  }, [])

  const handleSubmit = async (type: String) => {
    if (loading) return;
    setLoading(true)
    try {
      const res = await axios.post(`http://localhost:${PORT}/plan/register`, {
        "type": type,
        "org_id": planData.org_id,
        "user_id": planData.user_id,
        
      })
      localStorage.setItem("user", JSON.stringify(res.data.user));
      nav('/ondashboard');
    } catch (error) {
      console.log(error.response?.data);
      setErr(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f6f5f2",
        fontFamily: "Inter, sans-serif",
        padding: "80px 40px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .pricing-container {
          max-width: 1100px;
          margin: auto;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .pricing-header h1 {
          font-size: 40px;
          font-weight: 700;
          color: #111;
          margin-bottom: 12px;
        }

        .pricing-header p {
          color: #666;
          font-size: 16px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 28px;
        }

        .card {
          background: white;
          border-radius: 18px;
          padding: 36px;
          border: 1px solid #e8e6e1;
          transition: all 0.25s ease;
          position: relative;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.06);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          right: 20px;
          background: #111;
          color: white;
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 100px;
          font-weight: 600;
        }

        .plan-title {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #111;
        }

        .plan-price {
          font-size: 34px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #111;
        }

        .know-btn {
          background: transparent;
          border: none;
          color: #555;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 16px;
        }

        .know-btn:hover {
          color: #111;
        }

        .features {
          margin-top: 10px;
          margin-bottom: 24px;
        }

        .feature-item {
          font-size: 14px;
          color: #444;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .feature-item::before {
          content: "✔";
          font-size: 12px;
          color: #16a34a;
        }

        .cta-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cta-primary {
          background: #111;
          color: white;
        }

        .cta-primary:hover {
          background: #000;
          transform: translateY(-2px);
        }

        .cta-outline {
          background: transparent;
          border: 1.5px solid #111;
          color: #111;
        }

        .cta-outline:hover {
          background: #111;
          color: white;
        }
      `}</style>

      <div className="pricing-container">
        <div className="pricing-header">
          <h1>Explore Our Plans</h1>
          <p>Choose the plan that fits your outreach goals.</p>
        </div>

        <div className="pricing-grid">

          {/* BASIC PLAN */}
          <div className="card">
            <div className="plan-title">Basic</div>
            <div className="plan-price">Free</div>

            <button className="know-btn" onClick={() => setOpenFree(!openFree)}>
              {openFree ? "Hide details ↑" : "Know more ↓"}
            </button>

            {openFree && (
              <div className="features">
                {[
                  "60-day free trial",
                  "Up to 100 prospects",
                  "AI email generation",
                  "Basic fit scoring",
                  "Limited auto follow-ups",
                  "1 active campaign",
                  "Gmail integration",
                  "Basic analytics (open rate only)",
                ].map((f) => (
                  <div key={f} className="feature-item">{f}</div>
                ))}
              </div>
            )}

            <button
              className="cta-btn cta-outline"
              disabled={loading}
              onClick={() => handleSubmit("Free")}
            >
              {loading ? "Processing..." : "Start Free Trial"}
            </button>
          </div>

          {/* STARTER PLAN */}
          <div className="card">
            <div className="popular-badge">Most Popular</div>
            <div className="plan-title">Starter</div>
            <div className="plan-price">$29/mo</div>

            <button className="know-btn" onClick={() => setOpenMonthly(!openMonthly)}>
              {openMonthly ? "Hide details ↑" : "Know more ↓"}
            </button>

            {openMonthly && (
              <div className="features">
                {[
                  "1,000 emails/month",
                  "Up to 5 active campaigns",
                  "AI fit scoring",
                  "Automated follow-ups",
                  "Open & reply tracking",
                  "1 connected email account",
                  "Basic analytics dashboard",
                ].map((f) => (
                  <div key={f} className="feature-item">{f}</div>
                ))}
              </div>
            )}

            <button className="cta-btn cta-primary" onClick={() => handleSubmit("Starter")}>
              Start Starter Plan
            </button>
          </div>

          {/* GROWTH PLAN */}
          <div className="card">
            <div className="plan-title">Growth</div>
            <div className="plan-price">$79/mo</div>

            <button className="know-btn" onClick={() => setOpenYearly(!openYearly)}>
              {openYearly ? "Hide details ↑" : "Know more ↓"}
            </button>

            {openYearly && (
              <div className="features">
                {[
                  "5,000 emails/month",
                  "Unlimited campaigns",
                  "Advanced AI scoring",
                  "Smart personalization",
                  "3 automated follow-ups",
                  "A/B subject testing",
                  "Multi-user (3 team members)",
                  "Advanced analytics",
                  "Priority support",
                ].map((f) => (
                  <div key={f} className="feature-item">{f}</div>
                ))}
              </div>
            )}

            <button className="cta-btn cta-outline" onClick={() => handleSubmit("Growth")}>
              Start Growth Plan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OnboradingPlan;