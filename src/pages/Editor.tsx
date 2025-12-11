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
import {
  Copy,
  Share2,
  Download,
  Plus,
  Minus,
  AlertTriangle,
  Map as MapIcon,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import Editor, { loader } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

// Configure Monaco Editor loader to work with any host/IP
// This fixes issues when accessing via IP address instead of localhost
if (typeof window !== "undefined") {
  // Configure Monaco to use CDN for workers - works from any origin (localhost, IP, domain)
  loader.config({
    paths: {
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs",
    },
  });
}
import { TabBar, Tab, createNewTab } from "@/components/TabBar";
import {
  SetPasswordDialog,
  EnterPasswordDialog,
  hashPassword,
} from "@/components/PasswordDialog";
import { PageLoader } from "@/components/PageLoader";

// Map our language names to Monaco language IDs
const languageMap: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
  csharp: "csharp",
  go: "go",
  rust: "rust",
  php: "php",
  ruby: "ruby",
  swift: "swift",
  kotlin: "kotlin",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  xml: "xml",
  yaml: "yaml",
  markdown: "markdown",
  sql: "sql",
  shell: "shell",
  dockerfile: "dockerfile",
  text: "plaintext",
};

type UserSelection = {
  userId: string;
  start: number;
  end: number;
  color: string;
};

const EditorPage = () => {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "initial",
      name: "Tab 1",
      color: "#3b82f6",
      code: "",
      language: "text",
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
  const [showMinimap, setShowMinimap] = useState(() => {
    const saved = localStorage.getItem("liveshare-minimap");
    return saved !== "false"; // Default to true
  });

  // Get app theme and map to Monaco theme
  const { theme, resolvedTheme } = useTheme();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  const MIN_FONT_SIZE = 10;
  const MAX_FONT_SIZE = 32;
  const [userSelections, setUserSelections] = useState<UserSelection[]>([]);
  const [activeUserCount, setActiveUserCount] = useState(0);
  const [myUserId] = useState(() => Math.random().toString(36).substring(7));
  const { toast } = useToast();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const broadcastTimeoutRef = useRef<NodeJS.Timeout>();
  const isRemoteUpdateRef = useRef(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Track last synced state for merging concurrent edits
  const lastSyncedCodeRef = useRef("");
  const lastSentCodeRef = useRef("");

  // Get current active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Performance: detect large content using character count (faster than line count)
  // ~80 chars per line average, so 2000 lines ≈ 160,000 chars
  const LARGE_FILE_CHAR_THRESHOLD = 100000; // ~1250 lines
  const VERY_LARGE_FILE_THRESHOLD = 300000; // ~3750 lines - use plain textarea

  const codeLength = activeTab?.code?.length || 0;
  const isLargeFile = codeLength > LARGE_FILE_CHAR_THRESHOLD;
  const isVeryLargeFile = codeLength > VERY_LARGE_FILE_THRESHOLD;

  // Use ref for pending code to avoid state updates on every keystroke for large files
  const pendingCodeRef = useRef<string | null>(null);
  const stateUpdateTimeoutRef = useRef<NodeJS.Timeout>();

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

  // Update editor font size when it changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize: fontSize,
      });
    }
  }, [fontSize]);

  // Update editor theme when app theme changes
  useEffect(() => {
    if (editorRef.current && resolvedTheme) {
      monaco.editor.setTheme(monacoTheme);
    }
  }, [monacoTheme, resolvedTheme]);

  // Simple line-based merge function for concurrent edits
  // Optimized for large files with early returns
  const mergeChanges = useCallback(
    (base: string, remote: string, local: string): string => {
      // Fast path: if any two are equal, return the different one
      if (base === local) return remote;
      if (base === remote) return local;
      if (remote === local) return local;

      // For very large content (>500KB), skip complex merge and prefer local
      const MAX_MERGE_SIZE = 500000;
      if (
        base.length > MAX_MERGE_SIZE ||
        remote.length > MAX_MERGE_SIZE ||
        local.length > MAX_MERGE_SIZE
      ) {
        // For very large files, prefer local changes to avoid expensive merge
        return local;
      }

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
    },
    []
  );

  // Generate random unique code
  const generateUniqueCode = () => {
    return Math.random().toString(36).substring(2, 10);
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

  // Broadcast code changes to other users for real-time collaboration
  const broadcastCodeChange = useCallback(
    (tabId: string, code: string) => {
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "code_change",
          payload: {
            tabId,
            code,
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
                language: data.language || "text",
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
              language: data.language || "text",
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
          language: "text",
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
            language: "text",
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
              // Merge tabs instead of overwriting to handle concurrent edits
              setTabs((currentTabs) => {
                const remoteTabs = parsed.tabs as Tab[];

                // Create a map of remote tabs for easy lookup
                const remoteTabMap = new Map(remoteTabs.map((t) => [t.id, t]));
                const currentTabMap = new Map(
                  currentTabs.map((t) => [t.id, t])
                );

                // Merge: for each tab, merge code if both versions exist
                const mergedTabs: Tab[] = remoteTabs.map((remoteTab) => {
                  const currentTab = currentTabMap.get(remoteTab.id);

                  if (currentTab) {
                    // Find the base version for this tab from last synced state
                    let baseCode = "";
                    try {
                      const lastSynced = JSON.parse(lastSyncedCodeRef.current);
                      const baseTab = lastSynced.tabs?.find(
                        (t: Tab) => t.id === remoteTab.id
                      );
                      baseCode = baseTab?.code || "";
                    } catch {
                      baseCode = currentTab.code;
                    }

                    // Merge the code changes
                    const mergedCode = mergeChanges(
                      baseCode,
                      remoteTab.code,
                      currentTab.code
                    );

                    return {
                      ...remoteTab,
                      code: mergedCode,
                    };
                  }

                  return remoteTab;
                });

                // Add any local-only tabs that don't exist remotely (newly created)
                currentTabs.forEach((currentTab) => {
                  if (!remoteTabMap.has(currentTab.id)) {
                    mergedTabs.push(currentTab);
                  }
                });

                return mergedTabs;
              });
              // Don't change active tab - let each user keep their own focus
            }
          } catch {
            // Legacy format handling
          }

          lastSyncedCodeRef.current = remoteCode;
        }
      )
      .on("broadcast", { event: "tabs_update" }, (payload) => {
        const { tabs: remoteTabs, senderId } = payload.payload;

        if (senderId === myUserId) return;

        isRemoteUpdateRef.current = true;

        // Merge tabs instead of overwriting to preserve local edits
        setTabs((currentTabs) => {
          const remoteTabMap = new Map(
            (remoteTabs as Tab[]).map((t) => [t.id, t])
          );
          const currentTabMap = new Map(currentTabs.map((t) => [t.id, t]));

          // Merge: preserve local code for tabs being edited
          const mergedTabs: Tab[] = (remoteTabs as Tab[]).map((remoteTab) => {
            const currentTab = currentTabMap.get(remoteTab.id);

            if (currentTab) {
              // Find base version for merging
              let baseCode = "";
              try {
                const lastSynced = JSON.parse(lastSyncedCodeRef.current);
                const baseTab = lastSynced.tabs?.find(
                  (t: Tab) => t.id === remoteTab.id
                );
                baseCode = baseTab?.code || "";
              } catch {
                baseCode = currentTab.code;
              }

              // Merge the code
              const mergedCode = mergeChanges(
                baseCode,
                remoteTab.code,
                currentTab.code
              );

              return {
                ...remoteTab,
                code: mergedCode,
              };
            }

            return remoteTab;
          });

          // Add any local-only tabs
          currentTabs.forEach((currentTab) => {
            if (!remoteTabMap.has(currentTab.id)) {
              mergedTabs.push(currentTab);
            }
          });

          return mergedTabs;
        });
        // Don't change active tab for other users - let them keep their own focus
      })
      .on("broadcast", { event: "code_change" }, (payload) => {
        const { tabId, code, senderId } = payload.payload;

        if (senderId === myUserId) return;

        isRemoteUpdateRef.current = true;

        // Update the specific tab with the new code
        setTabs((currentTabs) => {
          return currentTabs.map((tab) => {
            if (tab.id === tabId) {
              return { ...tab, code };
            }
            return tab;
          });
        });
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const selections: UserSelection[] = [];
        const uniqueUsers = new Set<string>();

        Object.keys(state).forEach((key) => {
          const presences = state[key] as Array<Record<string, unknown>>;
          presences.forEach((presence) => {
            if (presence.userId) {
              uniqueUsers.add(presence.userId as string);
              if (presence.userId !== myUserId && presence.selection) {
                selections.push(presence.selection as UserSelection);
              }
            }
          });
        });

        setUserSelections(selections);
        setActiveUserCount(uniqueUsers.size);
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
      // Clean up timeouts
      if (broadcastTimeoutRef.current) {
        clearTimeout(broadcastTimeoutRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (stateUpdateTimeoutRef.current) {
        clearTimeout(stateUpdateTimeoutRef.current);
      }
    };
  }, [urlCode, myUserId, mergeChanges]);

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
            description:
              "Share the password with people you want to give access.",
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
    // Use character length for fast size detection (no split needed)
    const contentLength = newCode.length;
    const isLarge = contentLength > LARGE_FILE_CHAR_THRESHOLD;
    const isVeryLarge = contentLength > VERY_LARGE_FILE_THRESHOLD;

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      // Still update state for remote changes
      const newTabs = tabs.map((tab) =>
        tab.id === activeTabId ? { ...tab, code: newCode } : tab
      );
      setTabs(newTabs);
      return;
    }

    // Always broadcast code changes immediately for real-time collaboration
    broadcastCodeChange(activeTabId, newCode);

    // For very large files, debounce state updates to prevent UI freeze
    if (isVeryLarge) {
      pendingCodeRef.current = newCode;

      if (stateUpdateTimeoutRef.current) {
        clearTimeout(stateUpdateTimeoutRef.current);
      }

      // Debounce state update for very large files
      stateUpdateTimeoutRef.current = setTimeout(() => {
        if (pendingCodeRef.current !== null) {
          const newTabs = tabs.map((tab) =>
            tab.id === activeTabId
              ? { ...tab, code: pendingCodeRef.current! }
              : tab
          );
          setTabs(newTabs);

          // Update database with longer debounce
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
          }
          updateTimeoutRef.current = setTimeout(() => {
            updateDatabase(newTabs);
          }, 2000);

          pendingCodeRef.current = null;
        }
      }, 150); // Small debounce for state update

      // For very large files, debounce tab broadcasts but still broadcast code changes
      if (broadcastTimeoutRef.current) {
        clearTimeout(broadcastTimeoutRef.current);
      }
      broadcastTimeoutRef.current = setTimeout(() => {
        const newTabs = tabs.map((tab) =>
          tab.id === activeTabId ? { ...tab, code: newCode } : tab
        );
        broadcastTabsUpdate(newTabs, activeTabId);
      }, 1000);

      return;
    }

    // Normal flow for smaller files
    const newTabs = tabs.map((tab) =>
      tab.id === activeTabId ? { ...tab, code: newCode } : tab
    );
    setTabs(newTabs);

    if (broadcastTimeoutRef.current) {
      clearTimeout(broadcastTimeoutRef.current);
    }

    // For large files, debounce tab broadcasts; for small files, broadcast immediately
    if (isLarge) {
      broadcastTimeoutRef.current = setTimeout(() => {
        broadcastTabsUpdate(newTabs, activeTabId);
      }, 1000);
    } else {
      broadcastTabsUpdate(newTabs, activeTabId);
    }

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Increase debounce time for large files
    const debounceTime = isLarge ? 1500 : 300;
    updateTimeoutRef.current = setTimeout(() => {
      updateDatabase(newTabs);
    }, debounceTime);
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

  // Handle Monaco editor mount
  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Register custom commands for font size shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, () => {
      increaseFontSize();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, () => {
      decreaseFontSize();
    });

    // Set up selection change listener
    editor.onDidChangeCursorSelection((e) => {
      if (!urlCode || !channelRef.current) return;

      const selection = e.selection;
      const model = editor.getModel();
      if (!model) return;

      const start = model.getOffsetAt(selection.getStartPosition());
      const end = model.getOffsetAt(selection.getEndPosition());

      if (start !== end) {
        channelRef.current.track({
          userId: myUserId,
          selection: {
            userId: myUserId,
            start,
            end,
            color: mySelectionColor,
          },
        });
      } else {
        channelRef.current.track({
          userId: myUserId,
          selection: null,
        });
      }
    });
  };

  // Update Monaco decorations when user selections change
  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Create decorations for each user's selection
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];

    userSelections.forEach((selection) => {
      if (!selection || selection.start === selection.end) return;

      try {
        const startPos = model.getPositionAt(selection.start);
        const endPos = model.getPositionAt(selection.end);

        // Create a consistent CSS class based on user ID
        const userIndex =
          selection.userId
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10;
        const userColorClass = `remote-selection-user-${userIndex}`;

        decorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            className: "remote-user-selection",
            inlineClassName: userColorClass,
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      } catch (error) {
        console.warn("Error creating selection decoration:", error);
      }
    });

    // Apply decorations to the editor
    const decorationIds = editor.deltaDecorations([], decorations);

    // Clean up decorations on unmount or when selections change
    return () => {
      if (editorRef.current) {
        editorRef.current.deltaDecorations(decorationIds, []);
      }
    };
  }, [userSelections, activeTab]);

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

    // Map language to file extension
    const extMap: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      go: "go",
      rust: "rs",
      php: "php",
      ruby: "rb",
      swift: "swift",
      kotlin: "kt",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      markdown: "md",
      sql: "sql",
      shell: "sh",
      dockerfile: "dockerfile",
      text: "txt",
    };

    const ext = extMap[activeTab?.language || "text"] || "txt";
    a.download = `${activeTab?.name || "code"}.${ext}`;
    a.click();
    toast({
      title: "Downloaded!",
      description: "Your code has been downloaded",
    });
  };

  if (isLoading) {
    return <PageLoader />;
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 md:gap-6">
            <Select
              value={activeTab?.language || "javascript"}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[130px] sm:w-[160px] md:w-[200px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="ruby">Ruby</SelectItem>
                <SelectItem value="swift">Swift</SelectItem>
                <SelectItem value="kotlin">Kotlin</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="scss">SCSS</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="yaml">YAML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="shell">Shell/Bash</SelectItem>
                <SelectItem value="dockerfile">Dockerfile</SelectItem>
              </SelectContent>
            </Select>

            {/* Live Collaborator Count */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">
                {activeUserCount} developer{activeUserCount !== 1 ? "s" : ""}{" "}
                collaborating live
              </span>
              <span className="md:hidden">{activeUserCount} live</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 justify-end">
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

            {/* Minimap Toggle */}
            <Button
              variant={showMinimap ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowMinimap((prev) => {
                  const newValue = !prev;
                  localStorage.setItem("liveshare-minimap", String(newValue));
                  return newValue;
                });
              }}
              className="px-2 sm:px-3"
              title={showMinimap ? "Hide Minimap" : "Show Minimap"}
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Minimap</span>
            </Button>

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
              <Copy className="h-4 w-4 sm:mr-1 md:mr-2" />
              <span className="hidden md:inline">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="px-2 sm:px-3"
            >
              <Download className="h-4 w-4 sm:mr-1 md:mr-2" />
              <span className="hidden md:inline">Download</span>
            </Button>
            <Button size="sm" onClick={handleShare} className="px-2 sm:px-3">
              <Share2 className="h-4 w-4 sm:mr-1 md:mr-2" />
              <span className="hidden md:inline">Share</span>
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
          className="rounded-b-lg border border-t-0 border-border shadow-2xl overflow-hidden"
          style={{
            height: isLargeFile ? "calc(100vh - 340px)" : "calc(100vh - 300px)",
          }}
        >
          <Editor
            height="100%"
            language={
              languageMap[activeTab?.language || "javascript"] || "plaintext"
            }
            value={activeTab?.code || ""}
            onChange={(value) => handleCodeChange(value || "")}
            onMount={handleEditorMount}
            theme={monacoTheme}
            options={{
              fontSize: fontSize,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              minimap: { enabled: showMinimap },
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              renderWhitespace: "selection",
              bracketPairColorization: { enabled: true },
              smoothScrolling: true,
              cursorBlinking: "expand",
              cursorSmoothCaretAnimation: "on",
              folding: true,
              foldingHighlight: true,
              showFoldingControls: "mouseover",
              matchBrackets: "always",
              selectionHighlight: true,
              occurrencesHighlight: "singleFile",
              renderLineHighlight: "all",
              contextmenu: true,
              quickSuggestions: activeTab?.language !== "text",
              suggestOnTriggerCharacters: activeTab?.language !== "text",
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              trimAutoWhitespace: true,
              formatOnPaste: false,
              formatOnType: false,
              // Performance optimizations for large files
              ...(isLargeFile && {
                renderValidationDecorations: "off",
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                wordBasedSuggestions: "off",
                parameterHints: { enabled: false },
                folding: false,
                renderWhitespace: "none",
              }),
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-slate-800">
                <div className="text-muted-foreground">Loading editor...</div>
              </div>
            }
          />
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

export default EditorPage;
