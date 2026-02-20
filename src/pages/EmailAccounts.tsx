import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, XCircle } from "lucide-react";

const accounts = [
  { email: "jane@startup.com", provider: "Gmail", connected: true },
  { email: "outreach@startup.com", provider: "Gmail", connected: true },
  { email: "sales@startup.com", provider: "Gmail", connected: false },
];

const EmailAccounts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect your email accounts to send campaigns</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <Card key={a.email} className="p-6 shadow-card border-border">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{a.email}</p>
                  <p className="text-xs text-muted-foreground">{a.provider}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {a.connected ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <span className="text-xs text-success font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Not Connected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Button variant={a.connected ? "outline" : "default"} size="sm" className="w-full">
                  {a.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </Card>
          ))}

          {/* Add New */}
          <Card className="p-6 shadow-card border-border border-dashed flex flex-col items-center justify-center text-center min-h-[160px]">
            <Mail className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">Add Email Account</p>
            <p className="text-xs text-muted-foreground mb-4">Connect Gmail or Outlook</p>
            <Button size="sm">Connect</Button>
          </Card>
        </div>

        <Card className="p-5 shadow-card border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">How it works</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Click "Connect" to authorize your email account</li>
            <li>Grant LeadForge permission to send emails on your behalf</li>
            <li>Your account will appear as connected and ready to use in campaigns</li>
          </ol>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EmailAccounts;
