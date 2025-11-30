import { Navigation } from "@/components/Navigation";
import { FeatureCard } from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Video, GraduationCap, Code2, Zap, Lock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 pt-32 pb-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
              Share Code in Real-time with Developers
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
              An online code editor for interviews, troubleshooting, teaching & more...
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                <Link to="/editor">Share Code Now</Link>
              </Button>
              <p className="text-sm text-muted-foreground">Share code for free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Users className="h-10 w-10" />}
            title="Code with your team"
            description="Open a codeshare editor, write or copy code, then share it with friends and colleagues. Pair program and troubleshoot together."
          />
          <FeatureCard
            icon={<Video className="h-10 w-10" />}
            title="Interview developers"
            description="Set coding tasks and observe in real-time when interviewing remotely or in person. Nobody likes writing code on a whiteboard."
          />
          <FeatureCard
            icon={<GraduationCap className="h-10 w-10" />}
            title="Teach people to program"
            description="Share your code with students and peers then educate them. Universities and colleges around the world use Codeshare every day."
          />
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose CodeShare?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Instant Setup</h3>
              <p className="text-muted-foreground">No sign-up required. Start coding in seconds.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Code2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Language Support</h3>
              <p className="text-muted-foreground">Support for all popular programming languages.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
              <p className="text-muted-foreground">Your code is private and secure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to start sharing code?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers who trust CodeShare for their collaboration needs.
          </p>
          <Button asChild size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
            <Link to="/editor">Create Free Session</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Used by software engineers at companies and universities we respect and admire.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
