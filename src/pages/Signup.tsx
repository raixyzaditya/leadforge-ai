import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import axios from "axios";
import React, { useState } from "react";

const PORT = 3000;

const DESIGNATIONS = [
  "Founder / Co-Founder",
  "CEO",
  "Head of Sales",
  "Sales Manager",
  "Business Development Manager",
  "Marketing Manager",
  "Growth Manager",
  "Account Executive",
  "Other",
];

const Signup = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    designation: "",
  });
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.id]: e.target.value });
  };

  const handleDesignationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDesignation(val);

    if (val === "Other") {
      setShowCustom(true);
      setUserData({ ...userData, designation: "" });
    } else {
      setShowCustom(false);
      setUserData({ ...userData, designation: val });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `http://localhost:${PORT}/user/signup`,
        userData
      );
      if (res.data.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      nav("/onboarding");
    } catch (error: any) {
      setError(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LeadForge</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start your 14-day free trial</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Jane Smith"
                onChange={handleChange}
              />
            </div>

            {/* Work Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                onChange={handleChange}
              />
            </div>

            {/* Designation Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="designation-select">Your designation</Label>
              <select
                id="designation-select"
                value={selectedDesignation}
                onChange={handleDesignationChange}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--background))",
                  color: selectedDesignation ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                  height: "40px",
                }}
              >
                <option value="" disabled>Select your role</option>
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Custom designation — only shows when Other is selected */}
            {showCustom && (
              <div className="space-y-2">
                <Label htmlFor="designation">Write your designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g. VP of Partnerships"
                  onChange={handleChange}
                  autoFocus
                />
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              className="w-full"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>

          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
