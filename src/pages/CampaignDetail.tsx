import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import EmailPreviewModal from "@/components/email/EmailPreviewModal";

const prospects = [
  { name: "Alex Chen", company: "TechFlow", email: "alex@techflow.io", status: "Opened" },
  { name: "Sarah Kim", company: "DataSync", email: "sarah@datasync.com", status: "Replied" },
  { name: "Mike Johnson", company: "CloudBase", email: "mike@cloudbase.dev", status: "Sent" },
  { name: "Lisa Park", company: "ScaleUp", email: "lisa@scaleup.co", status: "Bounced" },
  { name: "Tom Davis", company: "NexGen AI", email: "tom@nexgen.ai", status: "Opened" },
];

const prospectStatusVariant = (s: string) => {
  if (s === "Replied") return "success" as const;
  if (s === "Opened") return "info" as const;
  if (s === "Bounced") return "destructive" as const;
  return "secondary" as const;
};

const sequence = [
  { step: 1, subject: "Quick intro — LeadForge + {{company}}", delay: "Day 0", status: "Sent to 560" },
  { step: 2, subject: "Following up on my last email", delay: "Day 3", status: "Sent to 420" },
  { step: 3, subject: "One more thing {{firstName}}...", delay: "Day 7", status: "Scheduled" },
];

const CampaignDetail = () => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/campaigns"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Series A Founders Q1</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success">Active</Badge>
              <span className="text-sm text-muted-foreground">Created Jan 15, 2026</span>
            </div>
          </div>
          <Button>
            <Play className="h-4 w-4 mr-1" />
            Launch Campaign
          </Button>
        </div>

        <Tabs defaultValue="prospects">
          <TabsList>
            <TabsTrigger value="prospects">Prospects</TabsTrigger>
            <TabsTrigger value="sequence">Email Sequence</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="prospects" className="mt-4">
            <Card className="shadow-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Company</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.map((p) => (
                      <tr key={p.email} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-foreground">{p.name}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{p.company}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{p.email}</td>
                        <td className="px-5 py-3.5">
                          <Badge variant={prospectStatusVariant(p.status)}>{p.status}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEmailModalOpen(true)}>
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            Preview
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sequence" className="mt-4">
            <div className="space-y-3">
              {sequence.map((s) => (
                <Card key={s.step} className="p-5 shadow-card border-border flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{s.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.delay}</p>
                  </div>
                  <Badge variant="secondary">{s.status}</Badge>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Emails Sent", value: "560" },
                { label: "Open Rate", value: "51.3%" },
                { label: "Reply Rate", value: "12.8%" },
              ].map((m) => (
                <Card key={m.label} className="p-5 shadow-card border-border text-center">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{m.value}</p>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EmailPreviewModal open={emailModalOpen} onOpenChange={setEmailModalOpen} />
    </DashboardLayout>
  );
};

export default CampaignDetail;
