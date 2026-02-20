import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const campaigns = [
  { id: "1", name: "Series A Founders Q1", status: "Active", sent: 2340, open: "45.2%", reply: "9.1%" },
  { id: "2", name: "Product Hunt Launch", status: "Completed", sent: 1890, open: "38.7%", reply: "7.4%" },
  { id: "3", name: "Enterprise Outreach", status: "Active", sent: 560, open: "51.3%", reply: "12.8%" },
  { id: "4", name: "Developer Advocates", status: "Paused", sent: 420, open: "33.1%", reply: "5.2%" },
  { id: "5", name: "YC Batch W24", status: "Active", sent: 1120, open: "47.8%", reply: "11.2%" },
];

const statusVariant = (s: string) => {
  if (s === "Active") return "success" as const;
  if (s === "Paused") return "warning" as const;
  return "secondary" as const;
};

const Campaigns = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your outbound campaigns</p>
          </div>
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="h-4 w-4 mr-1" />
              Create Campaign
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." className="pl-9" />
          </div>
        </div>

        <Card className="shadow-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Campaign Name</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Emails Sent</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Open Rate</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Reply Rate</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <Link to={`/campaigns/${c.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {c.name}
                      </Link>
                    </td>
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

export default Campaigns;
