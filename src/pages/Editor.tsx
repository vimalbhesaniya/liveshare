import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  Map as MapIcon,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getSnippet,
  createSnippet,
  updateSnippet,
  saveSnippetKeepalive,
} from "@/lib/api";
import { getRealtime, type RealtimeLike } from "@/lib/realtime";
import { useTheme } from "next-themes";
import "@/lib/monaco-setup";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";
import {
  computeTextOps,
  applyOpsToModel,
  applyRemoteCodeToModel,
  getIsApplyingRemoteOps,
  type TextOp,
} from "@/lib/text-ops";
import { throttle, debounce } from "@/lib/throttle";
import { stripTabsForBroadcast, mergeTabMeta, type TabMeta } from "@/lib/tab-meta";
import { TabBar, Tab, createNewTab } from "@/components/TabBar";
import {
  SetPasswordDialog,
  EnterPasswordDialog,
  hashPassword,
} from "@/components/PasswordDialog";

const SAVE_DEBOUNCE_MS = 3000;
const DOC_OPS_THROTTLE_MS = 16;

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
  const { t } = useTranslation();
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
  const [snippetReady, setSnippetReady] = useState(false);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("liveshare-font-size");
    return saved ? parseInt(saved, 10) : 14;
  });
  const [showMinimap, setShowMinimap] = useState(() => {
    const saved = localStorage.getItem("liveshare-minimap");
    return saved === "true";
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
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isRemoteUpdateRef = useRef(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const socketRef = useRef<RealtimeLike | null>(null);
  const modelsRef = useRef<Map<string, editor.ITextModel>>(new Map());
  const syncBaseRef = useRef<Map<string, string>>(new Map());
  const pendingDocOpsRef = useRef<{
    tabId: string;
    baseLength: number;
    ops: TextOp[];
    code: string;
  } | null>(null);
  const contentListenerDisposeRef = useRef<monaco.IDisposable | null>(null);
  const onLocalEditRef = useRef<(code: string) => void>(() => {});
  const hasLocalEditsRef = useRef(false);
  const [codeLength, setCodeLength] = useState(0);

  // Track last synced state for merging concurrent edits
  const lastSyncedCodeRef = useRef("");
  const lastSentCodeRef = useRef("");
  const isDirtyRef = useRef(false);
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  const passwordHashRef = useRef(passwordHash);

  tabsRef.current = tabs;
  activeTabIdRef.current = activeTabId;
  passwordHashRef.current = passwordHash;

  // Get current active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Performance: detect large content using character count (faster than line count)
  // ~80 chars per line average, so 2000 lines ≈ 160,000 chars
  const LARGE_FILE_CHAR_THRESHOLD = 100000;
  const isLargeFile = codeLength > LARGE_FILE_CHAR_THRESHOLD;

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

  const getModelLanguage = (lang: string) =>
    languageMap[lang] || "plaintext";

  const getOrCreateModel = useCallback(
    (tab: Tab): editor.ITextModel => {
      const existing = modelsRef.current.get(tab.id);
      if (existing && !existing.isDisposed()) {
        return existing;
      }
      const uri = monaco.Uri.parse(
        `inmemory://liveshare/${urlCode ?? "local"}/${tab.id}`,
      );
      const model = monaco.editor.createModel(
        tab.code,
        getModelLanguage(tab.language),
        uri,
      );
      modelsRef.current.set(tab.id, model);
      syncBaseRef.current.set(tab.id, tab.code);
      return model;
    },
    [urlCode],
  );

  const disposeModel = (tabId: string) => {
    const model = modelsRef.current.get(tabId);
    if (model && !model.isDisposed()) {
      model.dispose();
    }
    modelsRef.current.delete(tabId);
    syncBaseRef.current.delete(tabId);
  };

  /** Read live document text from Monaco models (editor model is source of truth). */
  const getTabsWithModelCode = useCallback((): Tab[] => {
    const activeId = activeTabIdRef.current;
    const liveModel = editorRef.current?.getModel();

    if (liveModel && activeId) {
      modelsRef.current.set(activeId, liveModel);
    }

    return tabsRef.current.map((tab) => {
      let code = tab.code;

      if (tab.id === activeId && liveModel && !liveModel.isDisposed()) {
        code = liveModel.getValue();
      } else {
        const model = modelsRef.current.get(tab.id);
        if (model && !model.isDisposed()) {
          code = model.getValue();
        }
      }

      return { ...tab, code };
    });
  }, []);

  const syncTabCodeFromModel = useCallback((tabId: string) => {
    const model = modelsRef.current.get(tabId);
    if (!model) return;
    const code = model.getValue();
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, code } : t)),
    );
    syncBaseRef.current.set(tabId, code);
  }, []);

  const flushDocOps = useCallback(() => {
    const pending = pendingDocOpsRef.current;
    if (!pending || !socketRef.current || !urlCode) return;
    pendingDocOpsRef.current = null;
    socketRef.current.emit("doc:ops", {
      uniqueCode: urlCode,
      tabId: pending.tabId,
      senderId: myUserId,
      baseLength: pending.baseLength,
      ops: pending.ops,
      code: pending.code,
    });
  }, [urlCode, myUserId]);

  const throttledFlushDocOps = useRef(
    throttle(() => flushDocOps(), DOC_OPS_THROTTLE_MS),
  ).current;

  const queueDocOps = useCallback(
    (tabId: string, baseLength: number, ops: TextOp[], code: string) => {
      if (ops.length === 0) return;
      throttledFlushDocOps.flush();
      pendingDocOpsRef.current = { tabId, baseLength, ops, code };
      throttledFlushDocOps();
    },
    [throttledFlushDocOps],
  );

  // Generate random unique code
  const generateUniqueCode = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  // Broadcast tab metadata only (no code payloads)
  const broadcastTabsUpdate = useCallback(
    (newTabs: Tab[], newActiveTabId: string) => {
      if (socketRef.current && urlCode) {
        socketRef.current.emit("tabs:update", {
          uniqueCode: urlCode,
          tabs: stripTabsForBroadcast(newTabs),
          activeTabId: newActiveTabId,
          senderId: myUserId,
        });
      }
    },
    [myUserId, urlCode],
  );

  // Load or create code snippet
  useEffect(() => {
    const loadOrCreateSnippet = async () => {
      const uniqueCode = urlCode || generateUniqueCode();

      if (!urlCode) {
        navigate(`/${uniqueCode}`, { replace: true });
        return;
      }

      const { data, error, status } = await getSnippet(uniqueCode);

      if (error) {
        console.error("Error loading snippet:", error);
        toast({
          title: t("editor.errorTitle"),
          description: t("editor.errorLoadSnippet"),
          variant: "destructive",
        });
        setSnippetReady(true);
        return;
      }

      if (data && status !== 404) {
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
          code: t("editor.welcomeComment"),
          language: "text",
        };

        const { data: newSnippet, error: insertError } = await createSnippet(
          uniqueCode,
          JSON.stringify({
            tabs: [initialTab],
            activeTabId: "initial",
            passwordHash: null,
          }),
          "text",
        );

        if (insertError) {
          console.error("Error creating snippet:", insertError);
          toast({
            title: t("editor.errorTitle"),
            description: t("editor.errorCreateSnippet"),
            variant: "destructive",
          });
        } else if (newSnippet) {
          setSnippetId(newSnippet.id);
          setTabs([initialTab]);
          setActiveTabId("initial");
          setIsAuthenticated(true);
        }
      }

      setSnippetReady(true);
    };

    loadOrCreateSnippet();
  }, [urlCode, navigate, toast, t]);

  // Set up realtime (AWS WebSocket or Socket.io locally)
  useEffect(() => {
    if (!urlCode) return;

    const socket = getRealtime();
    socketRef.current = socket;

    const handleSnippetUpdated = ({
      code: remoteCode,
      senderId,
    }: {
      code: string;
      senderId?: string;
    }) => {
      if (senderId === myUserId) return;
      if (hasLocalEditsRef.current) return;

      if (remoteCode === lastSentCodeRef.current) {
        lastSyncedCodeRef.current = remoteCode;
        return;
      }

      try {
        const parsed = JSON.parse(remoteCode);
        if (!parsed.tabs || !Array.isArray(parsed.tabs)) return;

        parsed.tabs.forEach((remoteTab: Tab) => {
          const tab =
            tabsRef.current.find((t) => t.id === remoteTab.id) ?? remoteTab;
          const model = modelsRef.current.get(remoteTab.id) ?? getOrCreateModel(tab);
          if (model.getValue() !== remoteTab.code) {
            applyRemoteCodeToModel(model, remoteTab.code);
            syncBaseRef.current.set(remoteTab.id, remoteTab.code);
          }
        });

        setTabs((currentTabs) => {
          const remoteTabMap = new Map(
            (parsed.tabs as Tab[]).map((t) => [t.id, t]),
          );
          return currentTabs.map((tab) => {
            const remoteTab = remoteTabMap.get(tab.id);
            return remoteTab ? { ...tab, ...remoteTab } : tab;
          });
        });

        if (parsed.activeTabId) {
          setActiveTabId(parsed.activeTabId);
        }
        if (parsed.passwordHash) {
          setPasswordHash(parsed.passwordHash);
        }
      } catch {
        // Legacy format handling
      }

      lastSyncedCodeRef.current = remoteCode;
    };

    const handleTabsUpdate = ({
      tabs: remoteTabs,
      senderId,
    }: {
      tabs: TabMeta[];
      senderId: string;
    }) => {
      if (senderId === myUserId) return;

      setTabs((currentTabs) => {
        const getCode = (tabId: string) =>
          modelsRef.current.get(tabId)?.getValue() ??
          currentTabs.find((t) => t.id === tabId)?.code ??
          "";
        return mergeTabMeta(currentTabs, remoteTabs, getCode);
      });
    };

    const handleDocOps = ({
      tabId,
      senderId,
      baseLength,
      ops,
      code,
    }: {
      tabId: string;
      senderId: string;
      baseLength: number;
      ops: TextOp[];
      code?: string;
    }) => {
      if (senderId === myUserId) return;

      const tab = tabsRef.current.find((t) => t.id === tabId);
      if (!tab) return;

      const model = modelsRef.current.get(tabId) ?? getOrCreateModel(tab);
      let applied = applyOpsToModel(model, ops, baseLength);

      if (!applied && code !== undefined) {
        applyRemoteCodeToModel(model, code);
        applied = true;
      }

      if (applied) {
        syncBaseRef.current.set(tabId, model.getValue());
        if (tabId === activeTabIdRef.current) {
          isRemoteUpdateRef.current = true;
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 0);
        }
      }
    };

    /** Legacy clients may still send full document replaces */
    const handleCodeChange = ({
      tabId,
      code,
      senderId,
    }: {
      tabId: string;
      code: string;
      senderId: string;
    }) => {
      if (senderId === myUserId) return;

      const tab = tabsRef.current.find((t) => t.id === tabId);
      if (!tab) return;

      const model = modelsRef.current.get(tabId) ?? getOrCreateModel(tab);
      if (model.getValue() === code) return;

      applyRemoteCodeToModel(model, code);
      syncBaseRef.current.set(tabId, code);
      if (tabId === activeTabIdRef.current) {
        isRemoteUpdateRef.current = true;
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 0);
      }
    };

    const handlePresenceSync = ({
      count,
      selections,
    }: {
      count: number;
      selections: UserSelection[];
    }) => {
      const others = selections.filter((s) => s.userId !== myUserId);
      setUserSelections(others);
      setActiveUserCount(count);
    };

    const joinRoom = () => {
      socket.emit("room:join", { uniqueCode: urlCode, userId: myUserId });
    };

    socket.on("connect", joinRoom);
    socket.on("snippet:updated", handleSnippetUpdated);
    socket.on("tabs:update", handleTabsUpdate);
    socket.on("doc:ops", handleDocOps);
    socket.on("code:change", handleCodeChange);
    socket.on("presence:sync", handlePresenceSync);

    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.emit("room:leave", { uniqueCode: urlCode });
      socket.off("connect", joinRoom);
      socket.off("snippet:updated", handleSnippetUpdated);
      socket.off("tabs:update", handleTabsUpdate);
      socket.off("doc:ops", handleDocOps);
      socket.off("code:change", handleCodeChange);
      socket.off("presence:sync", handlePresenceSync);
      throttledFlushDocOps.flush();
      throttledFlushDocOps.cancel();
      contentListenerDisposeRef.current?.dispose();
      contentListenerDisposeRef.current = null;
    };
  }, [
    urlCode,
    myUserId,
    getOrCreateModel,
    throttledFlushDocOps,
  ]);

  const buildSavePayload = useCallback(
    (metaOverride?: Tab[]) => {
      const withCode = getTabsWithModelCode();
      const tabsToSave = metaOverride
        ? withCode.map((tab) => {
            const meta = metaOverride.find((m) => m.id === tab.id);
            return meta ? { ...tab, ...meta, code: tab.code } : tab;
          })
        : withCode;
      return JSON.stringify({
        tabs: tabsToSave,
        activeTabId: activeTabIdRef.current,
        passwordHash: passwordHashRef.current,
      });
    },
    [getTabsWithModelCode],
  );

  // Persist to MongoDB (REST) and notify other users (WebSocket)
  const updateDatabase = useCallback(
    async (metaOverride?: Tab[]) => {
      if (!urlCode) return;

      const tabsToSave = getTabsWithModelCode();
      const lang =
        (metaOverride?.find((t) => t.id === activeTabIdRef.current)?.language ??
          tabsToSave.find((t) => t.id === activeTabIdRef.current)?.language) ||
        "text";
      const dataToSave = buildSavePayload(metaOverride);
      lastSentCodeRef.current = dataToSave;

      const { error } = await updateSnippet(urlCode, dataToSave, lang);
      if (error) {
        console.error("Error updating snippet:", error);
        toast({
          title: t("editor.errorTitle"),
          description: t("editor.errorSaveSnippet"),
          variant: "destructive",
        });
        return;
      }

      lastSyncedCodeRef.current = dataToSave;
      isDirtyRef.current = false;
    },
    [urlCode, myUserId, buildSavePayload, getTabsWithModelCode, toast, t],
  );

  const flushSave = useCallback(() => {
    if (!urlCode) return;
    throttledFlushDocOps.flush();
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = undefined;
    }
    if (!isDirtyRef.current) return;
    const dataToSave = buildSavePayload();
    const lang =
      tabsRef.current.find((t) => t.id === activeTabIdRef.current)?.language ||
      "text";
    saveSnippetKeepalive(urlCode, dataToSave, lang);
    lastSentCodeRef.current = dataToSave;
    isDirtyRef.current = false;
  }, [urlCode, buildSavePayload]);

  // Sync active tab model when switching tabs
  useEffect(() => {
    if (!snippetReady || !editorRef.current) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const model = getOrCreateModel(tab);
    if (editorRef.current.getModel() !== model) {
      editorRef.current.setModel(model);
    }
    modelsRef.current.set(tab.id, model);
    syncBaseRef.current.set(tab.id, model.getValue());
    setCodeLength(model.getValue().length);
  }, [activeTabId, snippetReady, tabs, getOrCreateModel]);

  // Hydrate Monaco models once snippet data arrives
  useEffect(() => {
    if (!snippetReady || hasLocalEditsRef.current) return;

    tabsRef.current.forEach((tab) => {
      const model = modelsRef.current.get(tab.id) ?? getOrCreateModel(tab);
      if (model.getValue() !== tab.code) {
        applyRemoteCodeToModel(model, tab.code);
        syncBaseRef.current.set(tab.id, tab.code);
      }
    });
    setCodeLength(
      modelsRef.current.get(activeTabIdRef.current)?.getValue().length ?? 0,
    );
  }, [snippetReady, getOrCreateModel]);

  // Save when leaving the page
  useEffect(() => {
    const onLeave = () => flushSave();
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [flushSave]);

  // Backup autosave every 30s while editing
  useEffect(() => {
    if (!urlCode) return;
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        updateDatabase();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [urlCode, updateDatabase]);

  // Flush save when leaving the editor room
  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [urlCode, flushSave]);

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
      updateSnippet(urlCode!, dataToSave, activeTab?.language || "text").then(
        ({ error }) => {
          if (!error) {
            socketRef.current?.emit("snippet:sync", {
              uniqueCode: urlCode,
              code: dataToSave,
              senderId: myUserId,
            });
            toast({
              title: t("editor.codeProtectedTitle"),
              description: t("editor.codeProtectedDesc"),
            });
          }
        },
      );
    } else {
      setPasswordHash(null);
      // Save immediately without password
      const dataToSave = JSON.stringify({
        tabs: tabs,
        activeTabId: activeTabId,
        passwordHash: null,
      });
      lastSentCodeRef.current = dataToSave;
      updateSnippet(urlCode!, dataToSave, activeTab?.language || "text").then(
        ({ error }) => {
          if (!error) {
            socketRef.current?.emit("snippet:sync", {
              uniqueCode: urlCode,
              code: dataToSave,
              senderId: myUserId,
            });
            toast({
              title: t("editor.protectionRemovedTitle"),
              description: t("editor.protectionRemovedDesc"),
            });
          }
        },
      );
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

  const debouncedSizeCheck = useRef(
    debounce((len: number) => setCodeLength(len), 200),
  ).current;

  const handleCodeChange = (newCode: string) => {
    if (getIsApplyingRemoteOps()) return;

    const tabId = activeTabIdRef.current;
    const liveModel = editorRef.current?.getModel();
    if (liveModel && tabId) {
      modelsRef.current.set(tabId, liveModel);
    }

    const syncBase = syncBaseRef.current.get(tabId) ?? "";

    if (isRemoteUpdateRef.current && newCode === syncBase) {
      isRemoteUpdateRef.current = false;
      return;
    }
    isRemoteUpdateRef.current = false;

    if (newCode === syncBase) return;

    hasLocalEditsRef.current = true;
    isDirtyRef.current = true;

    const ops = computeTextOps(syncBase, newCode);
    const baseLength = syncBase.length;
    syncBaseRef.current.set(tabId, newCode);
    queueDocOps(tabId, baseLength, ops, newCode);

    debouncedSizeCheck(newCode.length);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      throttledFlushDocOps.flush();
      updateDatabase();
    }, SAVE_DEBOUNCE_MS);
  };
  onLocalEditRef.current = handleCodeChange;

  const handleLanguageChange = (newLanguage: string) => {
    const model = modelsRef.current.get(activeTabId);
    if (model) {
      monaco.editor.setModelLanguage(model, getModelLanguage(newLanguage));
    }
    const newTabs = tabs.map((tab) =>
      tab.id === activeTabId ? { ...tab, language: newLanguage } : tab,
    );
    setTabs(newTabs);
    broadcastTabsUpdate(newTabs, activeTabId);
    updateDatabase(newTabs);
  };

  // Tab management functions
  const handleTabSelect = (tabId: string) => {
    syncTabCodeFromModel(activeTabId);
    setActiveTabId(tabId);
  };

  const handleTabAdd = () => {
    const newTab = createNewTab(tabs.length + 1);
    getOrCreateModel(newTab);
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTabId(newTab.id);
    isDirtyRef.current = true;
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

    disposeModel(tabId);
    setTabs(newTabs);
    setActiveTabId(newActiveTabId);
    broadcastTabsUpdate(newTabs, newActiveTabId);
    updateDatabase(newTabs);
  };

  const handleTabRename = (tabId: string, newName: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, name: newName } : tab,
    );
    setTabs(newTabs);
    broadcastTabsUpdate(newTabs, activeTabId);
    updateDatabase(newTabs);
  };

  const handleTabColorChange = (tabId: string, newColor: string) => {
    const newTabs = tabs.map((tab) =>
      tab.id === tabId ? { ...tab, color: newColor } : tab,
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
    () => `hsl(${Math.random() * 360}, 70%, 60%)`,
  );

  const emitSelectionChange = useRef(
    throttle(
      (payload: {
        uniqueCode: string;
        userId: string;
        selection: UserSelection | null;
      }) => {
        socketRef.current?.emit("selection:change", payload);
      },
      100,
    ),
  ).current;

  // Handle Monaco editor mount
  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    const tab =
      tabsRef.current.find((t) => t.id === activeTabIdRef.current) ??
      tabsRef.current[0];
    if (tab) {
      let model = editorInstance.getModel();
      if (!model || model.isDisposed()) {
        model = getOrCreateModel(tab);
        editorInstance.setModel(model);
      } else {
        // Reuse model created by @monaco-editor/react; keep ref in sync
        modelsRef.current.set(tab.id, model);
        syncBaseRef.current.set(tab.id, model.getValue());
      }
      setCodeLength(model.getValue().length);
    }

    contentListenerDisposeRef.current?.dispose();
    contentListenerDisposeRef.current =
      editorInstance.onDidChangeModelContent(() => {
        const value = editorInstance.getModel()?.getValue() ?? "";
        onLocalEditRef.current(value);
      });

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, () => {
      increaseFontSize();
    });

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, () => {
      decreaseFontSize();
    });

    editorInstance.onDidChangeCursorSelection((e) => {
      if (!urlCode || !socketRef.current) return;

      const selection = e.selection;
      const model = editorInstance.getModel();
      if (!model) return;

      const start = model.getOffsetAt(selection.getStartPosition());
      const end = model.getOffsetAt(selection.getEndPosition());

      if (start !== end) {
        emitSelectionChange({
          uniqueCode: urlCode,
          userId: myUserId,
          selection: {
            userId: myUserId,
            start,
            end,
            color: mySelectionColor,
          },
        });
      } else {
        emitSelectionChange({
          uniqueCode: urlCode,
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
            endPos.column,
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
      title: t("editor.linkCopiedTitle"),
      description: t("editor.linkCopiedDesc"),
    });
  };

  const handleCopy = () => {
    const code =
      modelsRef.current.get(activeTabId)?.getValue() ??
      activeTab?.code ??
      "";
    navigator.clipboard.writeText(code);
    toast({
      title: t("editor.codeCopiedTitle"),
      description: t("editor.codeCopiedDesc"),
    });
  };

  const handleDownload = () => {
    const code =
      modelsRef.current.get(activeTabId)?.getValue() ??
      activeTab?.code ??
      "";
    const blob = new Blob([code], { type: "text/plain" });
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
      title: t("editor.downloadedTitle"),
      description: t("editor.downloadedDesc"),
    });
  };

  // Lock page scroll — only the editor pane should scroll
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  if (snippetReady && passwordHash && !isAuthenticated) {
    return (
      <div className="h-svh overflow-hidden bg-background">
        <Navigation />
        <EnterPasswordDialog onPasswordSubmit={handlePasswordSubmit} />
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <Navigation />

      <div className="container-fluid mx-auto flex min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden px-2 sm:px-3 pb-2 pt-14 sm:pt-16">
        {/* Header */}
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-4 md:gap-6">
            <Select
              value={activeTab?.language || "javascript"}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[130px] sm:w-[160px] md:w-[200px]">
                <SelectValue placeholder={t("editor.language")} />
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
                {activeUserCount} {activeUserCount !== 1 ? t("editor.developers") : t("editor.developer")}{" "}
                {t("editor.collaborating")}
              </span>
              <span className="md:hidden">{activeUserCount} {t("editor.live")}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 md:gap-3">
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
              title={showMinimap ? t("editor.hideMinimap") : t("editor.showMinimap")}
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">{t("editor.minimap")}</span>
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
              <span className="hidden md:inline">{t("editor.copy")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="px-2 sm:px-3"
            >
              <Download className="h-4 w-4 sm:mr-1 md:mr-2" />
              <span className="hidden md:inline">{t("editor.download")}</span>
            </Button>

            <Button size="sm" onClick={handleShare} className="px-2 sm:px-3">
              <Share2 className="h-4 w-4 sm:mr-1 md:mr-2" />
              <span className="hidden md:inline">{t("editor.share")}</span>
            </Button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="shrink-0">
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
        </div>

        {/* Code Editor */}
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-lg border border-border shadow-lg">
          {!snippetReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <div className="text-sm text-muted-foreground">
                {t("editor.loadingEditor")}
              </div>
            </div>
          )}
          <Editor
            height="100%"
            language={
              languageMap[activeTab?.language || "javascript"] || "plaintext"
            }
            defaultValue={activeTab?.code || ""}
            onMount={handleEditorMount}
            keepCurrentModel={true}
            theme={monacoTheme}
            options={{
              fontSize: fontSize,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              minimap: { enabled: showMinimap },
              scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
              },
              lineNumbers: "on",
              wordWrap: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              padding: { top: 8, bottom: 8 },
              renderWhitespace: "none",
              bracketPairColorization: { enabled: true },
              smoothScrolling: true,
              cursorBlinking: "solid",
              cursorSmoothCaretAnimation: "off",
              folding: !isLargeFile,
              foldingHighlight: false,
              showFoldingControls: "mouseover",
              matchBrackets: "always",
              selectionHighlight: false,
              occurrencesHighlight: "off",
              renderLineHighlight: "line",
              contextmenu: true,
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              wordBasedSuggestions: "off",
              parameterHints: { enabled: false },
              hover: { enabled: false },
              links: false,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              trimAutoWhitespace: true,
              formatOnPaste: false,
              formatOnType: false,
              ...(isLargeFile && {
                renderValidationDecorations: "off",
                folding: false,
              }),
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-slate-800">
                <div className="text-muted-foreground">{t("editor.loadingEditor")}</div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
