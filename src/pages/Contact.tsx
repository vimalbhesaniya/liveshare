import { useState, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { Navigation } from "@/components/Navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageSeo } from "@/hooks/use-page-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const YOUR_EMAIL = "liveshare.help@gmail.com";

export default function Contact() {
  usePageSeo({
    title: "Contact | LiveShare",
    description:
      "Contact LiveShare — send message with form or email us directly.",
    canonicalPath: "/contact",
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setError("Please write your message.");
      return;
    }

    setStatus("submitting");
    setError(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      // Fallback: open the user’s mail client with the form content.
      const subject = encodeURIComponent("LiveShare contact request");
      const body = encodeURIComponent(
        `Name: ${name || "Anonymous"}\nEmail: ${email || "not-provided"}\n\nMessage:\n${trimmedMessage}\n`,
      );
      window.location.href = `mailto:${YOUR_EMAIL}?subject=${subject}&body=${body}`;
      setStatus("success");
      return;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: name.trim() || "Anonymous",
          reply_to: email.trim() || "not-provided@contact.local",
          message: trimmedMessage,
        },
        publicKey,
      );
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Could not send. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-[5.5rem] sm:pt-20 pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6">Contact</h1>

        <div className="max-w-3xl">
          <p className="text-muted-foreground mb-6">
            Use form below to contact LiveShare team. If email setup is not
            ready yet, we will open your mail app with message already written.
          </p>

          {status === "success" && (
            <div className="border border-border rounded-xl p-4 bg-card/30 mb-6">
              Thank you! Message is sent (or opened in your mail app).
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={status === "submitting"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === "submitting"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <textarea
                id="contact-message"
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                disabled={status === "submitting"}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Send Message"}
              </Button>
              <span className="text-sm text-muted-foreground">
                Or email: <a className="underline" href={`mailto:${YOUR_EMAIL}`}>{YOUR_EMAIL}</a>
              </span>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

