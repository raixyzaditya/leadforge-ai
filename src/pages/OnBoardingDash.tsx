import { useEffect, useState, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

const OnBoardingDash = () => {
  const nav = useNavigate();
  const [name, setName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps: string[] = [
    "Verifying your account...",
    "Setting up your workspace...",
    "Preparing your dashboard...",
    "Almost ready..."
  ];

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      try {
        const parsed = JSON.parse(user);
        setName(parsed.full_name ?? "");
      } catch {
        nav("/signup");
        return;
      }
    } else {
      nav("/signup");
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) =>
        prev < steps.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    const timeout = setTimeout(() => {
      nav("/dashboard");
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [nav]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.loader}></div>

        <h2 style={styles.title}>
          Welcome {name}
        </h2>

        <p style={styles.subtitle}>
          {steps[currentStep]}
        </p>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progress,
              width: `${((currentStep + 1) / steps.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
    fontFamily: "sans-serif"
  },
  card: {
    background: "#1e293b",
    padding: "50px",
    borderRadius: "20px",
    width: "400px",
    textAlign: "center",
    boxShadow: "0px 20px 60px rgba(0,0,0,0.5)"
  },
  loader: {
    margin: "0 auto 30px",
    width: "60px",
    height: "60px",
    border: "6px solid #334155",
    borderTop: "6px solid #38bdf8",
    borderRadius: "50%"
  },
  title: {
    marginBottom: "15px",
    fontSize: "24px",
    fontWeight: 600
  },
  subtitle: {
    marginBottom: "30px",
    opacity: 0.8
  },
  progressBar: {
    height: "6px",
    width: "100%",
    background: "#334155",
    borderRadius: "10px",
    overflow: "hidden"
  },
  progress: {
    height: "100%",
    background: "#38bdf8",
    transition: "width 0.5s ease"
  }
};

export default OnBoardingDash;