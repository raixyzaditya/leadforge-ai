import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
    const [name, setName] = useState("");
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const nav = useNavigate();

    const steps = [
        "Verifying your account...",
        "Setting up your workspace...",
        "Preparing your dashboard...",
        "Almost ready..."
    ];

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user != null) {
            const parsed = JSON.parse(user);
            setName(parsed.full_name);
        } else {
            nav("/signup");
            return;
        }

        // Progress bar animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 1;
            });
        }, 38);

        // Step text cycling
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 1000);

        // Redirect after 4s
        setTimeout(() => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
            nav("/icp");
        }, 4000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
        };
    }, []);

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0a0f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Google Font */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap');

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes stepFade {
                    0% { opacity: 0; transform: translateY(8px); }
                    20% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-8px); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .step-text {
                    animation: stepFade 1s ease-in-out;
                }
                .fade-up {
                    animation: fadeUp 0.8s ease forwards;
                }
            `}</style>

            {/* Background orbs */}
            <div style={{
                position: "absolute", top: "15%", left: "10%",
                width: 300, height: 300, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
                animation: "float 6s ease-in-out infinite",
                pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute", bottom: "15%", right: "10%",
                width: 250, height: 250, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
                animation: "float 8s ease-in-out infinite reverse",
                pointerEvents: "none"
            }} />

            {/* Card */}
            <div className="fade-up" style={{
                textAlign: "center",
                padding: "60px 50px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24,
                backdropFilter: "blur(20px)",
                width: "100%",
                maxWidth: 460,
                position: "relative",
                zIndex: 1
            }}>
                {/* Logo pulse */}
                <div style={{ position: "relative", display: "inline-flex", marginBottom: 32 }}>
                    <div style={{
                        position: "absolute", inset: 0, borderRadius: "50%",
                        background: "rgba(99,102,241,0.4)",
                        animation: "pulse-ring 1.5s ease-out infinite"
                    }} />
                    <div style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #a855f7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 28, position: "relative"
                    }}>
                        ⚡
                    </div>
                </div>

                {/* Welcome text */}
                <h1 style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 28, fontWeight: 800,
                    color: "#ffffff",
                    margin: "0 0 8px 0",
                    letterSpacing: "-0.5px"
                }}>
                    Welcome, {name || "there"} 👋
                </h1>
                <p style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 15, margin: "0 0 40px 0",
                    fontWeight: 300
                }}>
                    LeadForge is getting everything ready for you
                </p>

                {/* Progress bar */}
                <div style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 100, height: 6,
                    marginBottom: 16, overflow: "hidden"
                }}>
                    <div style={{
                        height: "100%",
                        width: `${progress}%`,
                        borderRadius: 100,
                        background: "linear-gradient(90deg, #6366f1, #a855f7, #6366f1)",
                        backgroundSize: "200% auto",
                        animation: "shimmer 1.5s linear infinite",
                        transition: "width 0.1s linear"
                    }} />
                </div>

                {/* Step text */}
                <div style={{ height: 24, overflow: "hidden" }}>
                    <p key={currentStep} className="step-text" style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 13, margin: 0,
                        fontWeight: 400
                    }}>
                        {steps[currentStep]}
                    </p>
                </div>

                {/* Progress % */}
                <p style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 12, marginTop: 12
                }}>
                    {progress}%
                </p>
            </div>
        </div>
    );
};

export default Onboarding;