import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
            <Code2 className="h-6 w-6" />
            <span>codeshare</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/editor" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Editor
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link to="/editor">New Session</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
