import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Mail, BarChart3, Zap, Check } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">LeadForge</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground mb-6 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Outbound Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground max-w-3xl mx-auto leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            AI-Powered Outbound Engine for SaaS Startups
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Research prospects, personalize emails, and automate campaigns to book more demos.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">
                Start Free Trial
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg">
              Book Demo
            </Button>
          </div>
          <div className="mt-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <img
              src={heroImage}
              alt="LeadForge Dashboard Preview"
              className="rounded-xl shadow-elevated border border-border/50 max-w-4xl mx-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need to scale outbound</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From research to reply, LeadForge automates your entire cold email workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI Prospect Research",
                description: "Automatically find and enrich prospect data with AI-powered research across the web.",
              },
              {
                icon: Mail,
                title: "Personalized Email Generation",
                description: "Generate hyper-personalized emails at scale using context from each prospect's profile.",
              },
              {
                icon: BarChart3,
                title: "Automated Follow-ups & Tracking",
                description: "Smart follow-up sequences with real-time open, click, and reply tracking.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border bg-background hover:shadow-elevated transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Starter", price: "$0", period: "/mo", features: ["500 emails/mo", "1 email account", "Basic analytics", "Community support"], cta: "Get Started" },
              { name: "Growth", price: "$79", period: "/mo", features: ["5,000 emails/mo", "5 email accounts", "AI personalization", "Priority support"], cta: "Start Free Trial", featured: true },
              { name: "Scale", price: "$199", period: "/mo", features: ["Unlimited emails", "Unlimited accounts", "Advanced analytics", "Dedicated CSM"], cta: "Contact Sales" },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-xl border ${plan.featured ? "border-primary shadow-elevated ring-1 ring-primary/10" : "border-border bg-card"}`}
              >
                <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.featured ? "default" : "outline"} className="w-full" asChild>
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">LeadForge</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 LeadForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
