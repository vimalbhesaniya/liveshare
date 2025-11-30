import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Share2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CodeEditor from '@uiw/react-textarea-code-editor';

const Editor = () => {
  const [code, setCode] = useState(`// Welcome to CodeShare!
// Start typing your code here...

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`);
  const [language, setLanguage] = useState("javascript");
  const { toast } = useToast();

  const handleShare = () => {
    const shareUrl = window.location.origin + "/editor/" + Math.random().toString(36).substring(7);
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with others to collaborate",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: "Code has been copied to clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'javascript' ? 'js' : language}`;
    a.click();
    toast({
      title: "Downloaded!",
      description: "Your code has been downloaded",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 pt-24 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Code Editor</h1>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
        
        <div className="rounded-lg border border-border overflow-hidden shadow-2xl">
          <CodeEditor
            value={code}
            language={language}
            placeholder="Start typing your code..."
            onChange={(evn) => setCode(evn.target.value)}
            padding={20}
            style={{
              fontSize: 14,
              backgroundColor: 'hsl(var(--code-bg))',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              minHeight: '70vh',
            }}
          />
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Share the link above to collaborate in real-time with others</p>
        </div>
      </div>
    </div>
  );
};

export default Editor;
