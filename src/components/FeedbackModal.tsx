import { useState, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setName("");
      setEmail("");
      setMessage("");
      setStatus("idle");
      setErrorText("");
    }, 200);
  }, [onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setErrorText("Feedback message is required");
      return;
    }

    setStatus("submitting");
    setErrorText("");

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setStatus("error");
      setErrorText("Email service not configured. Please add EmailJS env variables.");
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: name.trim() || "Anonymous",
          reply_to: email.trim() || "not-provided@feedback.local",
          message: trimmedMessage,
        },
        publicKey
      );
      setStatus("success");
    } catch (err) {
      console.error("Feedback send error:", err);
      setStatus("error");
      setErrorText(err instanceof Error ? err.message : "Failed to send feedback. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (status === "submitting") e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (status === "submitting") e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            We'd love your feedback
          </DialogTitle>
        </DialogHeader>

        {status === "success" ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-muted-foreground">Thank you! Your feedback has been sent.</p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-name">Name (optional)</Label>
              <Input
                id="feedback-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={status === "submitting"}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">Email (optional)</Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">
                Feedback <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="feedback-message"
                required
                placeholder="Your feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={status === "submitting"}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {errorText && (
              <p className="text-sm text-destructive">{errorText}</p>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={status === "submitting"}
              >
                Close
              </Button>
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
