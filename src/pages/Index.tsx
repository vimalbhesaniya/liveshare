import { Navigation } from "@/components/Navigation";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useNavigateToRandomEditor } from "@/hooks/use-random-editor";
import {
  Users,
  Video,
  GraduationCap,
  Code2,
  Zap,
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
  "Live Share Code with Developers Worldwide",
  "Real-time Code Collaboration Made Easy",
  "Share Code Instantly, No Sign-up Required",
  "Live Code Sharing for Interviews & Teaching",
  "The Best Way to Live Share Code Online",
];

const Index = () => {
  const navigateToRandomEditor = useNavigateToRandomEditor();
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
            <h1 className="scroll-animate animate-in text-3xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight min-h-[4em] md:min-h-[2.4em]">
              {displayText}
              <span className="typing-cursor">|</span>
            </h1>
            <p className="scroll-animate animate-in delay-1 text-sm md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Live share code snippets instantly with developers worldwide.
              Perfect for real-time collaboration, coding interviews, debugging
              & teaching together.
            </p>
            <div className="scroll-animate animate-in delay-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={navigateToRandomEditor}
                size="lg"
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                Share Code Now
              </Button>
              <p className="text-sm text-muted-foreground">
                Share code for free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use LiveShare */}
      <section id="how-it-works" className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="scroll-animate text-3xl md:text-4xl font-bold text-center mb-4">
            How Live Share Works
          </h2>
          <p className="scroll-animate delay-1 text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Live share your code in just 4 simple steps
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
                  Click "Share Code Now" to live share code
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
                    liveshare.dev/your-code
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
                  Live share your unique link for real-time collaboration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="scroll-animate delay-0">
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Live share with anyone"
              description="Paste your code, get a unique link, and live share it instantly with developers, teammates, or the community."
            />
          </div>
          <div className="scroll-animate delay-1">
            <FeatureCard
              icon={<Video className="h-10 w-10" />}
              title="Live collaborate easily"
              description="Live share code snippets during meetings, discussions, or troubleshooting sessions. Real-time collaboration, no setup needed."
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

      {/* Hero CTA with Interactive Elements */}
      <section className="relative py-32 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Main CTA */}
            <div className="scroll-animate text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Live Collaboration Platform
              </div>
              <h2 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
                Code Together,
                <br />
                Ship Together 🚀
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                The fastest way to share code, collaborate in real-time, and
                build amazing things together.
                <span className="text-primary font-semibold">
                  {" "}
                  No setup required.
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={navigateToRandomEditor}
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/25 transform hover:scale-105 transition-all duration-200"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Coding Live
                </Button>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Join 10,000+ developers
                </div>
              </div>
            </div>

            {/* Interactive Demo Preview */}
            <div className="scroll-animate delay-1 relative max-w-4xl mx-auto">
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                        A
                      </div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                        B
                      </div>
                      <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white">
                        C
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      3 developers collaborating live
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Live</span>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                  <div className="text-muted-foreground">
                    // Real-time collaboration in action
                  </div>
                  <div className="text-primary">
                    function{" "}
                    <span className="text-foreground">collaborate</span>() {"{"}
                  </div>
                  <div className="ml-4 text-accent">
                    console.log(
                    <span className="text-green-500">"Hello World!"</span>);
                  </div>
                  <div className="text-primary">{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Live Share - Interactive Cards */}
      <section className="py-24 bg-card/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="scroll-animate text-3xl md:text-5xl font-bold mb-4">
              Why Developers Choose LiveShare
            </h2>
            <p className="scroll-animate delay-1 text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of code collaboration with features designed
              for modern development teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Speed Card */}
            <div className="scroll-animate delay-0 group">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Share code instantly with a single click. No waiting, no
                  setup, no hassle. Get your collaborative workspace ready in
                  seconds.
                </p>
                <div className="mt-4 text-2xl font-bold text-primary">
                  0-60 seconds
                </div>
              </div>
            </div>

            {/* Collaboration Card */}
            <div className="scroll-animate delay-1 group">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 h-full hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-Time Sync</h3>
                <p className="text-muted-foreground leading-relaxed">
                  See changes instantly as your team codes together. Perfect for
                  pair programming, code reviews, and remote collaboration.
                </p>
                <div className="mt-4 flex items-center gap-2 text-accent">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Always in sync</span>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="scroll-animate delay-2 group">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-8 h-full hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Password-protect your sessions and control who can access your
                  code. Your collaboration stays private and secure.
                </p>
                <div className="mt-4 text-green-500 font-semibold">
                  🔒 End-to-end secure
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="scroll-animate text-3xl md:text-5xl font-bold mb-4">
              How LiveShare Works
            </h2>
            <p className="scroll-animate delay-1 text-xl text-muted-foreground">
              Three simple steps to start collaborating
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />

              {/* Step 1 */}
              <div className="scroll-animate delay-0 text-center relative">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Code2 className="w-10 h-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Create Your Space</h3>
                <p className="text-muted-foreground">
                  Click "Start Coding Live" and get a unique URL instantly.
                  Choose your programming language and start coding.
                </p>
              </div>

              {/* Step 2 */}
              <div className="scroll-animate delay-1 text-center relative">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Link2 className="w-10 h-10 text-accent" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Share the Link</h3>
                <p className="text-muted-foreground">
                  Send your unique LiveShare URL to anyone you want to
                  collaborate with. No sign-up required for participants.
                </p>
              </div>

              {/* Step 3 */}
              <div className="scroll-animate delay-2 text-center relative">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Video className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">Code Together</h3>
                <p className="text-muted-foreground">
                  Collaborate in real-time. See changes instantly, discuss code,
                  and build amazing things together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect For - Use Cases */}
      <section className="py-24 bg-card/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="scroll-animate text-3xl md:text-5xl font-bold mb-4">
              Perfect For Every Developer
            </h2>
            <p className="scroll-animate delay-1 text-xl text-muted-foreground">
              From interviews to education, LiveShare adapts to your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Interview Card */}
            <div className="scroll-animate delay-0 group cursor-pointer">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 h-full hover:shadow-lg hover:border-primary/50 transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Coding Interviews</h4>
                <p className="text-sm text-muted-foreground">
                  Conduct technical interviews with live code assessment
                </p>
              </div>
            </div>

            {/* Team Card */}
            <div className="scroll-animate delay-1 group cursor-pointer">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 h-full hover:shadow-lg hover:border-accent/50 transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Team Collaboration</h4>
                <p className="text-sm text-muted-foreground">
                  Debug, review, and build features together seamlessly
                </p>
              </div>
            </div>

            {/* Teaching Card */}
            <div className="scroll-animate delay-2 group cursor-pointer">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 h-full hover:shadow-lg hover:border-green-500/50 transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                  <FileCode className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Teaching & Learning</h4>
                <p className="text-sm text-muted-foreground">
                  Share code examples and teach programming concepts
                </p>
              </div>
            </div>

            {/* Open Source Card */}
            <div className="scroll-animate delay-3 group cursor-pointer">
              <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 h-full hover:shadow-lg hover:border-orange-500/50 transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Open Source</h4>
                <p className="text-sm text-muted-foreground">
                  Contribute to projects and get help from the community
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="scroll-animate border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground space-y-4">
            <p className="text-sm">
              Used by software engineers at companies and universities we
              respect and admire.
            </p>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <button
                onClick={navigateToRandomEditor}
                className="hover:text-foreground transition-colors"
              >
                Live Share Code
              </button>
              <a
                href="#how-it-works"
                className="hover:text-foreground transition-colors"
              >
                How to Live Share
              </a>
              <a
                href="#features"
                className="hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="https://liveshare.dev"
                className="hover:text-foreground transition-colors"
              >
                Live Share.dev
              </a>
            </nav>
            <p className="text-xs mt-4">
              © 2025 Live Share - Free Online Code Editor and Live Code Sharing
              Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
