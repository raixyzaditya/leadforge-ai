import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const openData = [
  { week: "W1", rate: 38 }, { week: "W2", rate: 41 }, { week: "W3", rate: 44 },
  { week: "W4", rate: 42 }, { week: "W5", rate: 47 }, { week: "W6", rate: 45 },
  { week: "W7", rate: 50 }, { week: "W8", rate: 48 },
];

const clickData = [
  { week: "W1", rate: 12 }, { week: "W2", rate: 15 }, { week: "W3", rate: 14 },
  { week: "W4", rate: 18 }, { week: "W5", rate: 16 }, { week: "W6", rate: 20 },
  { week: "W7", rate: 22 }, { week: "W8", rate: 19 },
];

const replyData = [
  { week: "W1", rate: 6 }, { week: "W2", rate: 7 }, { week: "W3", rate: 8 },
  { week: "W4", rate: 9 }, { week: "W5", rate: 8 }, { week: "W6", rate: 11 },
  { week: "W7", rate: 12 }, { week: "W8", rate: 10 },
];

const chartStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 13% 91%)",
  borderRadius: "8px",
  fontSize: "12px",
};

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your outbound performance</p>
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="1">Series A Founders Q1</SelectItem>
              <SelectItem value="2">Product Hunt Launch</SelectItem>
              <SelectItem value="3">Enterprise Outreach</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 shadow-card border-border">
            <h3 className="text-base font-semibold text-foreground mb-4">Open Rate Over Time</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={openData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" unit="%" />
                  <Tooltip contentStyle={chartStyle} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(234 89% 56%)" strokeWidth={2} dot={false} name="Open Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border">
            <h3 className="text-base font-semibold text-foreground mb-4">Click Rate</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clickData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" unit="%" />
                  <Tooltip contentStyle={chartStyle} />
                  <Bar dataKey="rate" fill="hsl(234 89% 56%)" radius={[4, 4, 0, 0]} name="Click Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 shadow-card border-border lg:col-span-2">
            <h3 className="text-base font-semibold text-foreground mb-4">Reply Rate</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={replyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" unit="%" />
                  <Tooltip contentStyle={chartStyle} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} name="Reply Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
