import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

const sampleRows = [
  { name: "Alex Chen", company: "TechFlow", email: "alex@techflow.io", title: "CTO" },
  { name: "Sarah Kim", company: "DataSync", email: "sarah@datasync.com", title: "VP Sales" },
  { name: "Mike Johnson", company: "CloudBase", email: "mike@cloudbase.dev", title: "CEO" },
];

const Prospects = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Prospects</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage your prospect lists</p>
        </div>

        {/* Upload Card */}
        <Card className="shadow-card border-border border-dashed p-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Upload CSV</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Drag and drop your CSV file here, or click to browse. We'll match columns automatically.
            </p>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-1" />
              Browse Files
            </Button>
          </div>
        </Card>

        {/* Preview Table */}
        <Card className="shadow-card border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Preview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Sample data from your uploaded file</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Company</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Title</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((r) => (
                  <tr key={r.email} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 font-medium text-foreground">{r.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.company}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.email}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{r.title}</td>
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

export default Prospects;
