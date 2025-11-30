import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Share2, Download, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { TabBar, Tab, createNewTab } from "@/components/TabBar";
import {
  SetPasswordDialog,
  EnterPasswordDialog,
  hashPassword,
} from "@/components/PasswordDialog";

type UserSelection = {
  userId: string;
  start: number;
  end: number;
  color: string;
};

const Editor = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "initial",
      name: "Tab 1",
      color: "#3b82f6",
      code: "",
      language: "javascript",
    },
  ]);
  const [activeTabId, setActiveTabId] = useState("initial");
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("liveshare-font-size");
    return saved ? parseInt(saved, 10) : 14;
  });

  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 32;
  const [userSelections, setUserSelections] = useState<UserSelection[]>([]);
  const [myUserId] = useState(() => Math.random().toString(36).substring(7));
  const { toast } = useToast();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isRemoteUpdateRef = useRef(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Track last synced state for merging concurrent edits
  const lastSyncedCodeRef = useRef("");
  const lastSentCodeRef = useRef("");

  // Get current active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Font size handlers
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const newSize = Math.min(prev + 2, MAX_FONT_SIZE);
      localStorage.setItem("liveshare-font-size", newSize.toString());
      return newSize;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const newSize = Math.max(prev - 2, MIN_FONT_SIZE);
      localStorage.setItem("liveshare-font-size", newSize.toString());
      return newSize;
    });
  }, []);

  // Keyboard shortcuts for font size
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          increaseFontSize();
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          decreaseFontSize();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [increaseFontSize, decreaseFontSize]);

  // Simple line-based merge function for concurrent edits
  const mergeChanges = (
    base: string,
    remote: string,
    local: string
  ): string => {
    if (base === local) return remote;
    if (base === remote) return local;
    if (remote === local) return local;

    const baseLines = base.split("\n");
    const remoteLines = remote.split("\n");
    const localLines = local.split("\n");

    const mergedLines: string[] = [];
    const maxLen = Math.max(
      baseLines.length,
      remoteLines.length,
      localLines.length
    );

    for (let i = 0; i < maxLen; i++) {
      const baseLine = baseLines[i] ?? "";
      const remoteLine = remoteLines[i] ?? "";
      const localLine = localLines[i] ?? "";

      if (baseLine === localLine && baseLine !== remoteLine) {
        if (i < remoteLines.length) {
          mergedLines.push(remoteLine);
        }
      } else if (baseLine === remoteLine && baseLine !== localLine) {
        if (i < localLines.length) {
          mergedLines.push(localLine);
        }
      } else if (baseLine !== localLine && baseLine !== remoteLine) {
        if (localLine === remoteLine) {
          mergedLines.push(localLine);
        } else {
          if (i < localLines.length) {
            mergedLines.push(localLine);
          }
        }
      } else {
        if (i < Math.max(remoteLines.length, localLines.length)) {
          mergedLines.push(baseLine);
        }
      }
    }

    return mergedLines.join("\n");
  };

  // Generate random unique code
  const generateUniqueCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  // Broadcast tabs update to other users
  const broadcastTabsUpdate = useCallback(
    (newTabs: Tab[], newActiveTabId: string) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "tabs_update",
          payload: {
            tabs: newTabs,
            activeTabId: newActiveTabId,
            senderId: myUserId,
          },
        });
      }
    },
    [myUserId]
  );

  // Load or create code snippet
  useEffect(() => {
    const loadOrCreateSnippet = async () => {
      const uniqueCode = urlCode || generateUniqueCode();

      if (!urlCode) {
        navigate(`/${uniqueCode}`, { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("code_snippets")
        .select("*")
        .eq("unique_code", uniqueCode)
        .maybeSingle();

      if (error) {
        console.error("Error loading snippet:", error);
        toast({
          title: "Error",
          description: "Failed to load code snippet",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (data) {
        setSnippetId(data.id);
        const loadedCode = data.code || "";
        lastSyncedCodeRef.current = loadedCode;

        // Try to parse tabs from stored data
        try {
          const parsed = JSON.parse(loadedCode);
          if (parsed.tabs && Array.isArray(parsed.tabs)) {
            setTabs(parsed.tabs);
            setActiveTabId(parsed.activeTabId || parsed.tabs[0]?.id);
            // Handle password protection
            if (parsed.passwordHash) {
              setPasswordHash(parsed.passwordHash);
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
            }
          } else {
            // Legacy format - single code
            setTabs([
              {
                id: "initial",
                name: "Tab 1",
                color: "#3b82f6",
                code: loadedCode,
                language: data.language || "javascript",
              },
            ]);
            setIsAuthenticated(true);
          }
        } catch {
          // Not JSON - legacy format
          setTabs([
            {
              id: "initial",
              name: "Tab 1",
              color: "#3b82f6",
              code: loadedCode,
              language: data.language || "javascript",
            },
          ]);
          setIsAuthenticated(true);
        }
      } else {
        const initialTab = {
          id: "initial",
          name: "Tab 1",
          color: "#3b82f6",
          code: "// Welcome to LiveShare!\n// Start typing here...\n",
          language: "javascript",
        };

        const { data: newSnippet, error: insertError } = await supabase
          .from("code_snippets")
          .insert({
            unique_code: uniqueCode,
            code: JSON.stringify({
              tabs: [initialTab],
              activeTabId: "initial",
              passwordHash: null,
            }),
            language: "javascript",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating snippet:", insertError);
          toast({
            title: "Error",
            description: "Failed to create code snippet",
            variant: "destructive",
          });
        } else if (newSnippet) {
          setSnippetId(newSnippet.id);
          setTabs([initialTab]);
          setActiveTabId("initial");
          setIsAuthenticated(true);
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
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "code_snippets",
          filter: `unique_code=eq.${urlCode}`,
        },
        (payload) => {
          const remoteCode = payload.new.code || "";

          if (remoteCode === lastSentCodeRef.current) {
            lastSyncedCodeRef.current = remoteCode;
            return;
          }

          isRemoteUpdateRef.current = true;

          try {
            const parsed = JSON.parse(remoteCode);
            if (parsed.tabs && Array.isArray(parsed.tabs)) {
              setTabs(parsed.tabs);
              if (parsed.activeTabId) {
                setActiveTabId(parsed.activeTabId);
              }
            }
          } catch {
            // Legacy format handling
          }

          lastSyncedCodeRef.current = remoteCode;
        }
      )
      .on("broadcast", { event: "tabs_update" }, (payload) => {
        const {
          tabs: remoteTabs,
          activeTabId: remoteActiveTabId,
          senderId,
        } = payload.payload;

        if (senderId === myUserId) return;

        isRemoteUpdateRef.current = true;
        setTabs(remoteTabs);
        // Don't change active tab for other users - let them keep their own
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const selections: UserSelection[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as Array<Record<string, unknown>>;
          presences.forEach((presence) => {
            if (presence.userId !== myUserId && presence.selection) {
              selections.push(presence.selection as UserSelection);
            }
          });
        });

        setUserSelections(selections);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: myUserId,
            selection: null,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [urlCode, myUserId]);

  // Update database when tabs change (with debouncing)
  const updateDatabase = async (newTabs: Tab[]) => {
    if (!snippetId || !urlCode) return;

    const dataToSave = JSON.stringify({
      tabs: newTabs,
      activeTabId: activeTabId,
      passwordHash: passwordHash,
    });

    lastSentCodeRef.current = dataToSave;

    const { error } = await supabase
      .from("code_snippets")
      .update({
        code: dataToSave,
        language: activeTab?.language || "javascript",
      })
      .eq("unique_code", urlCode);

    if (error) {
      console.error("Error updating snippet:", error);
    } else {
      lastSyncedCodeRef.current = dataToSave;
    }
  };

  // Handle password setting/removal
  const handleSetPassword = (password: string | null) => {
    if (password) {
      const hash = hashPassword(password);
      setPasswordHash(hash);
      // Save immediately with password
      const dataToSave = JSON.stringify({
        tabs: tabs,
        activeTabId: activeTabId,
        passwordHash: hash,
      });
      lastSentCodeRef.current = dataToSave;
      supabase
        .from("code_snippets")
        .update({ code: dataToSave })
        .eq("unique_code", urlCode)
        .then(() => {
          toast({
            title: "Code Protected!",
            description: "Share the password with people you want to give access.",
          });
        });
    } else {
      setPasswordHash(null);
      // Save immediately without password
      const dataToSave = JSON.stringify({
        tabs: tabs,
        activeTabId: activeTabId,
        passwordHash: null,
      });
      lastSentCodeRef.current = dataToSave;
      supabase
        .from("code_snippets")
        .update({ code: dataToSave })
        .eq("unique_code", urlCode)
        .then(() => {
          toast({
            title: "Protection Removed",
            description: "Anyone with the link can now access this code.",
          });
        });
    }
  };

  // Handle password verification
  const handlePasswordSubmit = (password: string): boolean => {
    const hash = hashPassword(password);
    if (hash === passwordHash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleCodeChange = (newCode: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === activeTabId ? { ...tab, code: newCode } : tab
    );
    setTabs(newTabs);

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    broadcastTabsUpdate(newTabs, activeTabId);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateDatabase(newTabs);
    }, 300);
  };

  const handleLanguageChange = (newLanguage: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === activeTabId ? { ...tab, language: newLanguage } : tab
    );
    setTabs(newTabs);
    broadcastTabsUpdate(newTabs, activeTabId);
    updateDatabase(newTabs);
  };

  // Tab management functions
  const handleTabSelect = (tabId: string) => {
    setActiveTabId(tabId);
  };

  const handleTabAdd = () => {
    const newTab = createNewTab(tabs.length + 1);
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTabId(newTab.id);
    broadcastTabsUpdate(newTabs, newTab.id);
    updateDatabase(newTabs);
  };

  const handleTabClose = (tabId: string) => {
    if (tabs.length <= 1) return;

    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);

    let newActiveTabId = activeTabId;
    if (activeTabId === tabId) {
      newActiveTabId = newTabs[Math.max(0, tabIndex - 1)]?.id || newTabs[0].id;
    }

    setTabs(newTabs);
    setActiveTabId(newActiveTabId);
    broadcastTabsUpdate(newTabs, newActiveTabId);
    updateDatabase(newTabs);
  };

  const handleTabRename = (tabId: string, newName: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    );
    setTabs(newTabs);
    broadcastTabsUpdate(newTabs, activeTabId);
    updateDatabase(newTabs);
  };

  const handleTabColorChange = (tabId: string, newColor: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, color: newColor } : tab
    );
    setTabs(newTabs);
    broadcastTabsUpdate(newTabs, activeTabId);
    updateDatabase(newTabs);
  };

  const handleTabsReorder = (newTabs: Tab[]) => {
    setTabs(newTabs);
    broadcastTabsUpdate(newTabs, activeTabId);
    updateDatabase(newTabs);
  };

  // Store a consistent color for this user's selection
  const [mySelectionColor] = useState(
    () => `hsl(${Math.random() * 360}, 70%, 60%)`
  );

  const handleSelection = async () => {
    if (!editorRef.current || !urlCode || !channelRef.current) return;

    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;

    if (start !== end) {
      await channelRef.current.track({
        userId: myUserId,
        selection: {
          userId: myUserId,
          start,
          end,
          color: mySelectionColor,
        },
      });
    } else {
      await channelRef.current.track({
        userId: myUserId,
        selection: null,
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
    navigator.clipboard.writeText(activeTab?.code || "");
    toast({
      title: "Code copied!",
      description: "Code has been copied to clipboard",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([activeTab?.code || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext =
      activeTab?.language === "javascript"
        ? "js"
        : activeTab?.language || "txt";
    a.download = `${activeTab?.name || "code"}.${ext}`;
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

  // Show password entry dialog if protected and not authenticated
  if (passwordHash && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <EnterPasswordDialog onPasswordSubmit={handlePasswordSubmit} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-4 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-2xl font-bold whitespace-nowrap">
              Editor
            </h1>
            <Select
              value={activeTab?.language || "javascript"}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[130px] sm:w-[180px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Simple Text</SelectItem>
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

          <div className="flex items-center gap-2 justify-end">
            {/* Font Size Controls - visible on mobile/tablet */}
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={decreaseFontSize}
                disabled={fontSize <= MIN_FONT_SIZE}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-mono w-6 text-center">
                {fontSize}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={increaseFontSize}
                disabled={fontSize >= MAX_FONT_SIZE}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <SetPasswordDialog
              isProtected={!!passwordHash}
              onSetPassword={handleSetPassword}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="px-2 sm:px-3"
            >
              <Copy className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="px-2 sm:px-3"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button size="sm" onClick={handleShare} className="px-2 sm:px-3">
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabSelect={handleTabSelect}
          onTabAdd={handleTabAdd}
          onTabClose={handleTabClose}
          onTabRename={handleTabRename}
          onTabColorChange={handleTabColorChange}
          onTabsReorder={handleTabsReorder}
        />

        {/* Code Editor */}
        <div
          className="rounded-b-lg border border-border shadow-2xl relative overflow-auto"
          style={{ height: "calc(100vh - 300px)" }}
        >
          <CodeEditor
            value={activeTab?.code || ""}
            language={activeTab?.language || "javascript"}
            placeholder="Start typing your code..."
            onChange={(evn) => handleCodeChange(evn.target.value)}
            onSelect={handleSelection}
            onClick={handleSelection}
            onBlur={handleSelection}
            onKeyUp={handleSelection}
            ref={editorRef as React.RefObject<HTMLTextAreaElement>}
            padding={12}
            className="code-editor-responsive"
            data-color-mode="dark"
            style={{
              fontSize: fontSize,
              backgroundColor: "#1e293b",
              color: "#e2e8f0",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              minHeight: "100%",
            }}
          />
          {userSelections.map((selection, idx) => {
            const code = activeTab?.code || "";
            const beforeText = code.substring(0, selection.start);
            const selectedText = code.substring(selection.start, selection.end);
            const beforeLines = beforeText.split("\n");
            const startLine = beforeLines.length - 1;
            const startCol = beforeLines[beforeLines.length - 1].length;

            // Calculate dimensions based on font size
            const charWidth = fontSize * 0.6;
            const lineHeight = fontSize * 1.5;
            const padding = 12;

            // Handle multi-line selections
            const selectedLines = selectedText.split("\n");

            return selectedLines.map((lineText, lineIdx) => {
              const isFirstLine = lineIdx === 0;
              const isLastLine = lineIdx === selectedLines.length - 1;
              const currentLine = startLine + lineIdx;
              const colStart = isFirstLine ? startCol : 0;
              const lineLength = lineText.length;

              // Skip empty lines at the end
              if (lineLength === 0 && isLastLine && selectedLines.length > 1) {
                return null;
              }

              return (
                <div
                  key={`${idx}-${lineIdx}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${padding + colStart * charWidth}px`,
                    top: `${padding + currentLine * lineHeight}px`,
                    width: `${Math.max(lineLength * charWidth, 4)}px`,
                    height: `${lineHeight}px`,
                    backgroundColor: selection.color,
                    opacity: 0.35,
                    borderRadius: "2px",
                  }}
                />
              );
            });
          })}
        </div>

        {/* Footer text */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground space-y-1">
          <p>Anyone with this link can view and edit in real-time</p>
          <p className="hidden lg:block text-xs opacity-70">
            Tip: Use Ctrl + ↑/↓ to adjust font size
          </p>
        </div>
      </div>
    </div>
  );
};

export default Editor;
