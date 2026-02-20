import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Eye, MessageSquare, Rocket, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const kpis = [
  { label: "Total Emails Sent", value: "12,847", change: "+12%", up: true, icon: Mail },
  { label: "Open Rate", value: "42.3%", change: "+2.1%", up: true, icon: Eye },
  { label: "Reply Rate", value: "8.7%", change: "-0.3%", up: false, icon: MessageSquare },
  { label: "Active Campaigns", value: "6", change: "+2", up: true, icon: Rocket },
];

const chartData = [
  { day: "Mon", opens: 320, replies: 45 },
  { day: "Tue", opens: 410, replies: 62 },
  { day: "Wed", opens: 380, replies: 55 },
  { day: "Thu", opens: 490, replies: 78 },
  { day: "Fri", opens: 520, replies: 82 },
  { day: "Sat", opens: 280, replies: 30 },
  { day: "Sun", opens: 190, replies: 22 },
];

const recentCampaigns = [
  { name: "Series A Founders Q1", status: "Active", sent: 2340, open: "45.2%", reply: "9.1%" },
  { name: "Product Hunt Launch", status: "Completed", sent: 1890, open: "38.7%", reply: "7.4%" },
  { name: "Enterprise Outreach", status: "Active", sent: 560, open: "51.3%", reply: "12.8%" },
  { name: "Developer Advocates", status: "Paused", sent: 420, open: "33.1%", reply: "5.2%" },
];

const statusVariant = (s: string) => {
  if (s === "Active") return "success" as const;
  if (s === "Paused") return "warning" as const;
  return "secondary" as const;
};

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your outbound performance</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="p-5 shadow-card border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                  <kpi.icon className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.up ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span className={`text-xs font-medium ${kpi.up ? "text-success" : "text-destructive"}`}>
                  {kpi.change}
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="p-6 shadow-card border-border">
          <h3 className="text-base font-semibold text-foreground mb-4">Email Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 13% 91%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="opens" stroke="hsl(234 89% 56%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="replies" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Campaigns Table */}
        <Card className="shadow-card border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Recent Campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Sent</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Open Rate</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Reply Rate</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.name} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{c.name}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{c.sent.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{c.open}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{c.reply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
