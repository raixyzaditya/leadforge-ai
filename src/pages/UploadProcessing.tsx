import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const PORT = 3000;

type Job = {
    total_rows: number;
    processed_rows: number;
    inserted: number;
    skipped: number;
    status: string;
};

const UploadProcessing = () => {

    const { jobId, campId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState<Job | null>(null);

    useEffect(() => {

        const interval = setInterval(async () => {

            try {

                const res = await axios.get(
                    `http://localhost:${PORT}/prospects/upload_status/${jobId}`
                );

                const j = res.data;

                setJob(j);

                if (j.status === "completed") {
                    clearInterval(interval);

                    setTimeout(() => {
                        navigate(`/review/${campId}`);
                    }, 1500);
                }

            } catch (e) {
                console.log(e);
            }

        }, 3000);

        return () => clearInterval(interval);

    }, []);

    const progress = job && job.total_rows
        ? Math.min(
            100,
            Math.round((job.processed_rows / job.total_rows) * 100)
        )
        : 0;
    return (
        <div
            style={{
                height: "100vh",
                background: "#f5f5f3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
        >

            <div
                style={{
                    width: 420,
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid #e8e6e1",
                    padding: "40px 36px",
                    textAlign: "center",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.06)"
                }}
            >

                {/* Spinner */}
                <div
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        border: "4px solid #e5e7eb",
                        borderTopColor: "#111827",
                        margin: "0 auto 20px",
                        animation: "spin 1s linear infinite"
                    }}
                />

                <h2
                    style={{
                        fontSize: 20,
                        fontWeight: 700,
                        marginBottom: 8,
                        color: "#111827"
                    }}
                >
                    Processing your prospects
                </h2>

                <p
                    style={{
                        fontSize: 13,
                        color: "#9ca3af",
                        marginBottom: 26
                    }}
                >
                    We're adding your contacts and enriching company data.
                </p>

                {/* Progress Bar */}

                <div
                    style={{
                        width: "100%",
                        height: 10,
                        background: "#f1f5f9",
                        borderRadius: 100,
                        overflow: "hidden",
                        marginBottom: 16
                    }}
                >
                    <div
                        style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "linear-gradient(90deg,#2563eb,#0891b2)",
                            borderRadius: 100,
                            transition: "width 0.6s ease"
                        }}
                    />
                </div>

                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 20
                    }}
                >
                    {progress}% completed
                </div>

                {/* Stats */}

                {job && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: "#6b7280"
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 700, color: "#111827" }}>
                                {job.processed_rows}
                            </div>
                            Processed
                        </div>

                        <div>
                            <div style={{ fontWeight: 700, color: "#16a34a" }}>
                                {job.inserted}
                            </div>
                            Inserted
                        </div>

                        <div>
                            <div style={{ fontWeight: 700, color: "#f59e0b" }}>
                                {job.skipped}
                            </div>
                            Skipped
                        </div>
                    </div>
                )}

            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

        </div>
    );
};

export default UploadProcessing;