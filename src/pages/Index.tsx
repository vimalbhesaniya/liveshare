import { Navigation } from "@/components/Navigation";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Users,
  Video,
  GraduationCap,
  Code2,
  Zap,
  Lock,
  FileCode,
  Link2,
  Share2,
  PanelLeft,
  ClipboardPaste,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";

// Cursor spotlight position hook

const typingTexts = [
  "Share Code in Real-time with Developers",
  "Collaborate Instantly with Your Team",
  "Debug Together, Ship Faster",
  "Learn & Teach Code Seamlessly",
  "Code Sharing Made Simple & Fast",
];

const Index = () => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const currentText = typingTexts[textIndex];
    const typingSpeed = isDeleting ? 30 : 80;
    const pauseTime = 2000;

    if (!isDeleting && displayText === currentText) {
      // Pause before deleting
      const timeout = setTimeout(() => setIsDeleting(true), pauseTime);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayText === "") {
      // Move to next text
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % typingTexts.length);
      return;
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(currentText.substring(0, displayText.length - 1));
      } else {
        setDisplayText(currentText.substring(0, displayText.length + 1));
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, textIndex]);

  // Cursor tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(".scroll-animate");
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Cursor Glow */}
      <div
        className="pointer-events-none fixed z-50 rounded-full"
        style={{
          left: cursorPos.x - 75,
          top: cursorPos.y - 75,
          width: 150,
          height: 150,
          background: `radial-gradient(circle, hsl(351 83% 60% / 0.25) 0%, transparent 70%)`,
          filter: "blur(15px)",
        }}
      />
      <Navigation />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 pt-32 pb-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="scroll-animate animate-in text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight min-h-[1.2em] md:min-h-[2.4em]">
              {displayText}
              <span className="typing-cursor">|</span>
            </h1>
            <p className="scroll-animate animate-in delay-1 text-sm md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Share code snippets instantly with anyone. Perfect for
              collaboration, debugging & learning together.
            </p>
            <div className="scroll-animate animate-in delay-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                <Link to="/editor">Share Code Now</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Share code for free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use LiveShare */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="scroll-animate text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="scroll-animate delay-1 text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Share your code in just 4 simple steps
          </p>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

              {/* Step 1 */}
              <div className="scroll-animate delay-0 text-center relative">
                <div className="step-circle inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 md:mb-6 relative cursor-pointer">
                  <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                    <PanelLeft className="h-8 w-8 md:h-12 md:w-12 text-primary transition-all duration-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                    1
                  </span>
                </div>
                <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-3">
                  Open Editor
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Click "New Session" to open the code editor
                </p>
              </div>

              {/* Step 2 */}
              <div className="scroll-animate delay-1 text-center relative">
                <div className="step-circle inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 md:mb-6 relative cursor-pointer">
                  <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                    <Link2 className="h-8 w-8 md:h-12 md:w-12 text-primary transition-all duration-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                    2
                  </span>
                </div>
                <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-3">
                  Set Your URL
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Choose a unique code like{" "}
                  <span className="text-primary font-medium">
                    liveshare.in/your-code
                  </span>
                </p>
              </div>

              {/* Step 3 */}
              <div className="scroll-animate delay-2 text-center relative">
                <div className="step-circle inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 md:mb-6 relative cursor-pointer">
                  <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                    <ClipboardPaste className="h-8 w-8 md:h-12 md:w-12 text-primary transition-all duration-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                    3
                  </span>
                </div>
                <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-3">
                  Paste Code
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Paste or write your code with syntax highlighting
                </p>
              </div>

              {/* Step 4 */}
              <div className="scroll-animate delay-3 text-center relative">
                <div className="step-circle inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4 md:mb-6 relative cursor-pointer">
                  <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                    <Share2 className="h-8 w-8 md:h-12 md:w-12 text-primary transition-all duration-300" />
                  </div>
                  <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs md:text-sm">
                    4
                  </span>
                </div>
                <h3 className="text-base md:text-xl font-semibold mb-2 md:mb-3">
                  Share
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Share your unique link with anyone to collaborate
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="scroll-animate delay-0">
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Share with anyone"
              description="Paste your code, get a unique link, and share it instantly with friends, teammates, or the community."
            />
          </div>
          <div className="scroll-animate delay-1">
            <FeatureCard
              icon={<Video className="h-10 w-10" />}
              title="Collaborate easily"
              description="Share code snippets during meetings, discussions, or troubleshooting sessions. No setup needed."
            />
          </div>
          <div className="scroll-animate delay-2">
            <FeatureCard
              icon={<GraduationCap className="h-10 w-10" />}
              title="Learn together"
              description="Share examples with students and peers. A simple way to exchange code for learning and teaching."
            />
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="scroll-animate text-3xl md:text-4xl font-bold text-center mb-16">
            Why Choose LiveShare?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="scroll-animate delay-0 text-center group">
              <div className="icon-hover-glow inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 cursor-pointer">
                <Zap className="h-8 w-8 text-primary transition-all duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Sharing</h3>
              <p className="text-muted-foreground">
                No sign-up required. Share code in seconds.
              </p>
            </div>
            <div className="scroll-animate delay-1 text-center group">
              <div className="icon-hover-glow inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 cursor-pointer">
                <Code2 className="h-8 w-8 text-primary transition-all duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Syntax Highlighting
              </h3>
              <p className="text-muted-foreground">
                Beautiful highlighting for all popular languages.
              </p>
            </div>
            <div className="scroll-animate delay-2 text-center group">
              <div className="icon-hover-glow inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 cursor-pointer">
                <ShieldCheck className="h-8 w-8 text-primary transition-all duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Password Protected</h3>
              <p className="text-muted-foreground">
                Secure your code with optional password protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="scroll-animate text-3xl md:text-5xl font-bold mb-6">
            Ready to start sharing code?
          </h2>
          <p className="scroll-animate delay-1 text-xl text-muted-foreground mb-8">
            Join thousands of developers who trust LiveShare for their
            collaboration needs.
          </p>
          <div className="scroll-animate delay-2">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90"
            >
              <Link to="/editor">Create Free Session</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="scroll-animate border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              Used by software engineers at companies and universities we
              respect and admire.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
