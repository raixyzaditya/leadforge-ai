import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Save } from "lucide-react";

const generatedEmail = `Hi Alex,

I noticed TechFlow recently closed a Series A — congrats! At this stage, most teams struggle to scale outbound without burning through SDR bandwidth.

We built LeadForge to solve exactly that: AI-powered prospect research, hyper-personalized emails, and automated follow-ups that actually get replies.

Would love to show you a quick demo — does Thursday work?

Best,
Jane`;

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmailPreviewModal = ({ open, onOpenChange }: EmailPreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">AI Generated</p>
            <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm text-foreground whitespace-pre-line leading-relaxed h-64 overflow-auto">
              {generatedEmail}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Edit</p>
            <Textarea
              defaultValue={generatedEmail}
              className="h-64 resize-none text-sm leading-relaxed"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline">
            <Save className="h-4 w-4 mr-1" />
            Save Template
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-1" />
            Send Test
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
