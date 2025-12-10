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
            <h1 className="scroll-animate animate-in text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight min-h-[1.2em] md:min-h-[2.4em]">
              {displayText}
              <span className="typing-cursor">|</span>
            </h1>
            <p className="scroll-animate animate-in delay-1 text-sm md:text-xl text-muted-foreground mb-10 leading-relaxed">
              Live share code snippets instantly with developers worldwide. Perfect for
              real-time collaboration, coding interviews, debugging & teaching together.
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
              onClick={navigateToRandomEditor}
              size="lg"
              className="text-lg px-8 py-6 bg-primary hover:bg-primary/90"
            >
              Live Share Code Now
            </Button>
          </div>
        </div>
      </section>

      {/* What is Live Code Sharing Section */}
      <section id="live-code-sharing" className="py-24 bg-card/30">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="scroll-animate text-3xl md:text-4xl font-bold mb-8 text-center">
            What is Live Code Sharing?
          </h2>
          <div className="scroll-animate delay-1 space-y-6 text-muted-foreground">
            <p className="text-base md:text-lg leading-relaxed">
              <strong>Live code sharing</strong> is the modern way developers collaborate on code in real-time. Unlike traditional methods like email attachments or file sharing, live code sharing allows you to create instant shareable links that let multiple developers view, edit, and discuss code simultaneously.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Why Live Share is Better Than Traditional Code Sharing
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-semibold mb-2 text-foreground">Traditional Methods</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Email attachments get lost</li>
                  <li>• GitHub gists are static</li>
                  <li>• File sharing is cumbersome</li>
                  <li>• No real-time collaboration</li>
                  <li>• Difficult to discuss specific lines</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-foreground">Live Share Benefits</h4>
                <ul className="space-y-2 text-sm">
                  <li>• ✅ Instant shareable links</li>
                  <li>• ✅ Real-time collaboration</li>
                  <li>• ✅ Syntax highlighting</li>
                  <li>• ✅ Password protection</li>
                  <li>• ✅ No sign-up required</li>
                </ul>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Perfect for Live Coding Scenarios
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Live Share excels in scenarios where real-time code collaboration is essential. Whether you're conducting live coding interviews, debugging issues with your team, teaching programming concepts, or getting help from the developer community, Live Share makes it effortless to share code instantly.
            </p>
          </div>
        </div>
      </section>

      {/* SEO Content Section - Rich Text for Search Engines */}
      <section className="py-24 container mx-auto px-6 max-w-4xl">
        <article className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="scroll-animate text-3xl md:text-4xl font-bold mb-6">
              Live Share Code Instantly - The Best Free Online Code Editor
            </h2>
          <div className="scroll-animate delay-1 space-y-6 text-muted-foreground">
            <p className="text-base md:text-lg leading-relaxed">
              <strong>Live Share</strong> is a free online code editor and live code sharing platform designed for developers, programmers, and software engineers who need to live share code snippets quickly and efficiently. Whether you're conducting coding interviews, debugging with your team, teaching programming concepts, or collaborating on projects, Live Share makes it easy to live share code instantly without any sign-up or installation required.
            </p>
            
            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Why Use an Online Code Editor for Code Sharing?
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Traditional code sharing methods like email attachments, GitHub gists, or messaging apps can be cumbersome and slow. With Live Share's online code editor, you can live share code with a link in seconds. Our web-based code editor supports syntax highlighting for over 50 programming languages including JavaScript, Python, Java, C++, TypeScript, Go, Rust, PHP, Ruby, and many more. This makes it perfect for live code reviews, real-time pair programming sessions, technical interviews, and educational purposes.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Perfect for Live Coding Interviews and Technical Assessments
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Live Share is widely used by hiring managers and technical recruiters for conducting live coding interviews. The real-time collaboration features allow interviewers to watch candidates code live, making it easier to assess problem-solving skills and coding abilities. The password protection feature ensures that only authorized participants can access the live code sharing session, maintaining the integrity of technical assessments.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Ideal for Live Pair Programming and Team Collaboration
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Software development teams use Live Share for live pair programming, real-time code reviews, and debugging sessions. The instant live code sharing capability eliminates the need for screen sharing or complex setup procedures. Simply create a session, share the link, and start live collaborating. The syntax highlighting and code formatting features make it easy to read and understand code, even when working with unfamiliar codebases.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Educational Tool for Live Teaching and Learning Programming
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Teachers and students love Live Share for its simplicity and effectiveness in educational settings. Programming instructors can live share code examples instantly during lectures, while students can live share their code for feedback and help. The no-sign-up requirement means students can start using the tool immediately without creating accounts or dealing with authentication issues.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Key Features of Our Free Code Sharing Platform
            </h3>
            <ul className="list-disc list-inside space-y-3 text-base md:text-lg leading-relaxed">
              <li><strong>Live Code Sharing:</strong> Live share code in seconds with custom URLs like liveshare.dev/your-code</li>
              <li><strong>No Sign-Up Required:</strong> Start live sharing code immediately without creating an account</li>
              <li><strong>Syntax Highlighting:</strong> Beautiful code highlighting for 50+ programming languages</li>
              <li><strong>Password Protection:</strong> Secure your live code sharing with optional password protection</li>
              <li><strong>Real-Time Collaboration:</strong> Multiple users can view and edit code simultaneously</li>
              <li><strong>Dark and Light Themes:</strong> Choose your preferred theme for comfortable live coding</li>
              <li><strong>Free Forever:</strong> All features are completely free with no hidden costs</li>
              <li><strong>Mobile Friendly:</strong> Live share code from any device, anywhere</li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              How to Live Share Code Online with Live Share
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Live sharing code with Live Share is incredibly simple. First, click "Share Code Now" to open our online code editor. Next, choose a unique URL for your code snippet (for example, liveshare.dev/my-algorithm). Then, paste or write your code in the editor. The syntax highlighting will automatically format your code based on the programming language you select. Finally, live share the unique link with anyone you want to collaborate with. They can access your live code sharing session instantly without any setup or installation.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
              Use Cases: When to Live Share Code with Live Share
            </h3>
            <p className="text-base md:text-lg leading-relaxed">
              Live Share is perfect for various scenarios including live coding interviews, remote pair programming, real-time code debugging sessions, programming tutorials, live code reviews, sharing code snippets on forums or social media, teaching programming concepts, collaborative problem-solving, and quick code demonstrations. It's the fastest way to live share code online without the complexity of version control systems or code hosting platforms.
            </p>
          </div>
        </article>
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
              <a href="#how-it-works" className="hover:text-foreground transition-colors">
                How to Live Share
              </a>
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="https://liveshare.dev" className="hover:text-foreground transition-colors">
                Live Share.dev
              </a>
            </nav>
            <p className="text-xs mt-4">
              © 2025 Live Share - Free Online Code Editor and Live Code Sharing Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
