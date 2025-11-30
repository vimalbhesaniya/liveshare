import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Share2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CodeEditor from '@uiw/react-textarea-code-editor';

type UserSelection = {
  userId: string;
  start: number;
  end: number;
  color: string;
};

const Editor = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSelections, setUserSelections] = useState<UserSelection[]>([]);
  const [myUserId] = useState(() => Math.random().toString(36).substring(7));
  const { toast } = useToast();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isRemoteUpdateRef = useRef(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Generate random unique code
  const generateUniqueCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  // Load or create code snippet
  useEffect(() => {
    const loadOrCreateSnippet = async () => {
      const uniqueCode = urlCode || generateUniqueCode();
      
      // If no code in URL, redirect to a new unique URL
      if (!urlCode) {
        navigate(`/${uniqueCode}`, { replace: true });
        return;
      }

      // Try to load existing snippet
      const { data, error } = await supabase
        .from('code_snippets')
        .select('*')
        .eq('unique_code', uniqueCode)
        .maybeSingle();

      if (error) {
        console.error('Error loading snippet:', error);
        toast({
          title: "Error",
          description: "Failed to load code snippet",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data) {
        // Snippet exists, load it
        setSnippetId(data.id);
        setCode(data.code || "");
        setLanguage(data.language || "javascript");
      } else {
        // Create new snippet
        const { data: newSnippet, error: insertError } = await supabase
          .from('code_snippets')
          .insert({
            unique_code: uniqueCode,
            code: "// Welcome to CodeShare!\n// Start typing your code here...\n",
            language: "javascript",
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating snippet:', insertError);
          toast({
            title: "Error",
            description: "Failed to create code snippet",
            variant: "destructive",
          });
        } else if (newSnippet) {
          setSnippetId(newSnippet.id);
          setCode(newSnippet.code || "");
          setLanguage(newSnippet.language || "javascript");
        }
      }

      setIsLoading(false);
    };

    loadOrCreateSnippet();
  }, [urlCode, navigate, toast]);

  // Set up realtime subscription and presence
  useEffect(() => {
    if (!urlCode) return;

    const channel = supabase
      .channel(`code-snippet-${urlCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'code_snippets',
          filter: `unique_code=eq.${urlCode}`,
        },
        (payload) => {
          console.log('Received update:', payload);
          isRemoteUpdateRef.current = true;
          setCode(payload.new.code || "");
          setLanguage(payload.new.language || "javascript");
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const selections: UserSelection[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.userId !== myUserId && presence.selection) {
              selections.push(presence.selection);
            }
          });
        });
        
        setUserSelections(selections);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: myUserId,
            selection: null,
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [urlCode, myUserId]);

  // Update database when code changes (with debouncing)
  const updateDatabase = async (newCode: string, newLanguage: string) => {
    if (!snippetId || !urlCode) return;

    const { error } = await supabase
      .from('code_snippets')
      .update({
        code: newCode,
        language: newLanguage,
      })
      .eq('unique_code', urlCode);

    if (error) {
      console.error('Error updating snippet:', error);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    // Don't update database if this was a remote update
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Debounce database updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateDatabase(newCode, language);
    }, 500);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    updateDatabase(code, newLanguage);
  };

  const handleSelection = async () => {
    if (!editorRef.current || !urlCode) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    
    if (start !== end) {
      const channel = supabase.channel(`code-snippet-${urlCode}`);
      await channel.track({
        userId: myUserId,
        selection: {
          userId: myUserId,
          start,
          end,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        },
      });
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 pt-24 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Code Editor</h1>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
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
        
        <div className="rounded-lg border border-border overflow-hidden shadow-2xl relative">
          <CodeEditor
            value={code}
            language={language}
            placeholder="Start typing your code..."
            onChange={(evn) => handleCodeChange(evn.target.value)}
            onSelect={handleSelection}
            ref={editorRef as any}
            padding={20}
            style={{
              fontSize: 14,
              backgroundColor: 'hsl(var(--code-bg))',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              minHeight: '70vh',
            }}
          />
          {userSelections.map((selection, idx) => {
            const beforeText = code.substring(0, selection.start);
            const lines = beforeText.split('\n');
            const line = lines.length;
            const col = lines[lines.length - 1].length;
            
            return (
              <div
                key={idx}
                className="absolute pointer-events-none"
                style={{
                  left: `${20 + col * 8.4}px`,
                  top: `${20 + (line - 1) * 21}px`,
                  width: `${(selection.end - selection.start) * 8.4}px`,
                  height: '21px',
                  backgroundColor: selection.color,
                  opacity: 0.3,
                  borderRadius: '2px',
                }}
              />
            );
          })}
        </div>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Anyone with this link can view and edit the code in real-time</p>
        </div>
      </div>
    </div>
  );
};

export default Editor;