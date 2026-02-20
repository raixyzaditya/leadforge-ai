import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <Card className="p-6 shadow-card border-border space-y-6">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-4">Profile</h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input defaultValue="Jane" />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input defaultValue="Smith" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue="jane@startup.com" type="email" />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-semibold text-foreground mb-4">Company</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Company name</Label>
                <Input defaultValue="Startup Inc." />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input defaultValue="https://startup.com" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
