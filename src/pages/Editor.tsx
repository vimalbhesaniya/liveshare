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
  unlockSnippet,
  isPasswordRequiredResponse,
} from "@/lib/api";
import { getRealtime, type RealtimeLike } from "@/lib/realtime";
import {
  parseSnippetStorage,
  stringifySnippetPayload,
} from "@/lib/snippet-payload";
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
import {
  SetPasswordDialog,
  EnterPasswordDialog,
} from "@/components/PasswordDialog";

const SAVE_DEBOUNCE_MS = 3000;
const DOC_OPS_THROTTLE_MS = 16;

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
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("text");
  const [snippetId, setSnippetId] = useState<string | null>(null);
  const [snippetReady, setSnippetReady] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionPassword, setSessionPassword] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("liveshare-font-size");
    return saved ? parseInt(saved, 10) : 14;
  });
  const [showMinimap, setShowMinimap] = useState(() => {
    const saved = localStorage.getItem("liveshare-minimap");
    return saved === "true";
  });

  const { resolvedTheme } = useTheme();
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
  const modelRef = useRef<editor.ITextModel | null>(null);
  const socketRef = useRef<RealtimeLike | null>(null);
  const syncBaseRef = useRef("");
  const pendingDocOpsRef = useRef<{
    baseLength: number;
    ops: TextOp[];
    code: string;
  } | null>(null);
  const contentListenerDisposeRef = useRef<monaco.IDisposable | null>(null);
  const onLocalEditRef = useRef<(value: string) => void>(() => {});
  const hasLocalEditsRef = useRef(false);
  const [codeLength, setCodeLength] = useState(0);

  const lastSyncedCodeRef = useRef("");
  const lastSentCodeRef = useRef("");
  const isDirtyRef = useRef(false);
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const sessionPasswordRef = useRef(sessionPassword);
  const isAuthenticatedRef = useRef(isAuthenticated);

  codeRef.current = code;
  languageRef.current = language;
  sessionPasswordRef.current = sessionPassword;
  isAuthenticatedRef.current = isAuthenticated;

  const LARGE_FILE_CHAR_THRESHOLD = 100000;
  const isLargeFile = codeLength > LARGE_FILE_CHAR_THRESHOLD;

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

  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize });
  }, [fontSize]);

  useEffect(() => {
    if (editorRef.current && resolvedTheme) {
      monaco.editor.setTheme(monacoTheme);
    }
  }, [monacoTheme, resolvedTheme]);

  const getModelLanguage = (lang: string) =>
    languageMap[lang] || "plaintext";

  const getLiveCode = useCallback(() => {
    const model = editorRef.current?.getModel() ?? modelRef.current;
    return model && !model.isDisposed() ? model.getValue() : codeRef.current;
  }, []);

  const getOrCreateModel = useCallback(
    (initialCode: string, lang: string): editor.ITextModel => {
      if (modelRef.current && !modelRef.current.isDisposed()) {
        return modelRef.current;
      }
      const uri = monaco.Uri.parse(
        `inmemory://liveshare/${urlCode ?? "local"}/main`,
      );
      const model = monaco.editor.createModel(
        initialCode,
        getModelLanguage(lang),
        uri,
      );
      modelRef.current = model;
      syncBaseRef.current = initialCode;
      return model;
    },
    [urlCode],
  );

  const applyRemoteCode = useCallback((remoteCode: string) => {
    const model =
      modelRef.current ??
      (editorRef.current?.getModel() && !editorRef.current.getModel()!.isDisposed()
        ? editorRef.current.getModel()!
        : null);
    if (!model) return;

    if (model.getValue() === remoteCode) return;
    applyRemoteCodeToModel(model, remoteCode);
    syncBaseRef.current = remoteCode;
    setCode(remoteCode);
    isRemoteUpdateRef.current = true;
    setTimeout(() => {
      isRemoteUpdateRef.current = false;
    }, 0);
  }, []);

  const flushDocOps = useCallback(() => {
    const pending = pendingDocOpsRef.current;
    if (!pending || !socketRef.current || !urlCode) return;
    pendingDocOpsRef.current = null;
    socketRef.current.emit("doc:ops", {
      uniqueCode: urlCode,
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
    (baseLength: number, ops: TextOp[], snapshot: string) => {
      if (ops.length === 0) return;
      throttledFlushDocOps.flush();
      pendingDocOpsRef.current = { baseLength, ops, code: snapshot };
      throttledFlushDocOps();
    },
    [throttledFlushDocOps],
  );

  const emitCodeNow = useCallback(() => {
    if (!urlCode || !socketRef.current) return;
    socketRef.current.emit("code:change", {
      uniqueCode: urlCode,
      code: getLiveCode(),
      senderId: myUserId,
    });
  }, [urlCode, myUserId, getLiveCode]);

  const throttledEmitCode = useRef(throttle(() => emitCodeNow(), 80)).current;

  const generateUniqueCode = () =>
    Math.random().toString(36).substring(2, 10);

  const buildSavePayload = useCallback(() => {
    return stringifySnippetPayload({
      code: getLiveCode(),
      language: languageRef.current,
    });
  }, [getLiveCode]);

  const applyLoadedSnippet = useCallback(
    (
      data: {
        id: string;
        code: string;
        language: string;
        password_protected?: boolean;
      },
      password?: string | null,
    ) => {
      setSnippetId(data.id);
      const loaded = data.code || "";
      lastSyncedCodeRef.current = loaded;
      const payload = parseSnippetStorage(loaded, data.language || "text");
      setCode(payload.code);
      setLanguage(payload.language);
      syncBaseRef.current = payload.code;
      const protected_ = Boolean(data.password_protected);
      setIsPasswordProtected(protected_);
      if (protected_) {
        setSessionPassword(password ?? null);
        setIsAuthenticated(true);
        if (urlCode && password) {
          sessionStorage.setItem(`liveshare-pwd:${urlCode}`, password);
        }
      } else {
        setSessionPassword(null);
        setIsAuthenticated(true);
        if (urlCode) sessionStorage.removeItem(`liveshare-pwd:${urlCode}`);
      }
    },
    [urlCode],
  );

  useEffect(() => {
    const loadOrCreateSnippet = async () => {
      const uniqueCode = urlCode || generateUniqueCode();

      if (!urlCode) {
        navigate(`/${uniqueCode}`, { replace: true });
        return;
      }

      const savedPwd = sessionStorage.getItem(`liveshare-pwd:${uniqueCode}`);
      const { data, error, status, raw } = await getSnippet(
        uniqueCode,
        savedPwd,
      );

      if (status === 401 || isPasswordRequiredResponse(raw)) {
        setSnippetId(
          isPasswordRequiredResponse(raw) && raw.id ? raw.id : null,
        );
        setIsPasswordProtected(true);
        setIsAuthenticated(false);
        setSessionPassword(null);
        setCode("");
        setSnippetReady(true);
        return;
      }

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
        applyLoadedSnippet(data, savedPwd);
      } else {
        const welcome = t("editor.welcomeComment");
        const payload = stringifySnippetPayload({
          code: welcome,
          language: "text",
        });
        const { data: newSnippet, error: insertError } = await createSnippet(
          uniqueCode,
          payload,
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
          setCode(welcome);
          setLanguage("text");
          syncBaseRef.current = welcome;
          setIsPasswordProtected(false);
          setIsAuthenticated(true);
        }
      }

      setSnippetReady(true);
    };

    loadOrCreateSnippet();
  }, [urlCode, navigate, toast, t, applyLoadedSnippet]);

  useEffect(() => {
    if (!urlCode || !snippetReady || !isAuthenticated) return;

    const socket = getRealtime();
    socketRef.current = socket;

    const handleSnippetUpdated = ({
      code: remoteRaw,
      senderId,
    }: {
      code: string;
      senderId?: string;
    }) => {
      if (senderId === myUserId) return;
      if (hasLocalEditsRef.current) return;
      if (remoteRaw === lastSentCodeRef.current) {
        lastSyncedCodeRef.current = remoteRaw;
        return;
      }

      const payload = parseSnippetStorage(
        remoteRaw,
        languageRef.current,
      );
      applyRemoteCode(payload.code);
      setLanguage(payload.language);
      lastSyncedCodeRef.current = remoteRaw;
    };

    const handleDocOps = ({
      senderId,
      baseLength,
      ops,
      code: snapshot,
    }: {
      senderId: string;
      baseLength: number;
      ops: TextOp[];
      code?: string;
    }) => {
      if (senderId === myUserId) return;

      const model =
        modelRef.current ??
        (editorRef.current?.getModel() ?? getOrCreateModel(codeRef.current, languageRef.current));

      let applied = applyOpsToModel(model, ops, baseLength);

      if (!applied && snapshot !== undefined) {
        applyRemoteCode(snapshot);
        return;
      }

      if (applied) {
        const value = model.getValue();
        syncBaseRef.current = value;
        setCode(value);
        isRemoteUpdateRef.current = true;
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 0);
      }
    };

    const handleCodeChange = ({
      code: remoteCode,
      senderId,
    }: {
      code: string;
      senderId: string;
    }) => {
      if (senderId === myUserId) return;
      applyRemoteCode(remoteCode);
    };

    const handlePresenceSync = ({
      count,
      selections,
    }: {
      count: number;
      selections: UserSelection[];
    }) => {
      setUserSelections(selections.filter((s) => s.userId !== myUserId));
      setActiveUserCount(count);
    };

    const joinRoom = () => {
      socket.emit("room:join", {
        uniqueCode: urlCode,
        userId: myUserId,
        ...(sessionPasswordRef.current
          ? { password: sessionPasswordRef.current }
          : {}),
      });
    };

    socket.on("connect", joinRoom);
    socket.on("snippet:updated", handleSnippetUpdated);
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
      socket.off("doc:ops", handleDocOps);
      socket.off("code:change", handleCodeChange);
      socket.off("presence:sync", handlePresenceSync);
      throttledFlushDocOps.flush();
      throttledFlushDocOps.cancel();
      throttledEmitCode.flush();
      throttledEmitCode.cancel();
      contentListenerDisposeRef.current?.dispose();
      contentListenerDisposeRef.current = null;
    };
  }, [
    urlCode,
    myUserId,
    snippetReady,
    isAuthenticated,
    getOrCreateModel,
    applyRemoteCode,
    throttledFlushDocOps,
    throttledEmitCode,
    emitCodeNow,
  ]);

  const updateDatabase = useCallback(async () => {
    if (!urlCode || !isAuthenticatedRef.current) return;

    const dataToSave = buildSavePayload();
    lastSentCodeRef.current = dataToSave;

    const { error } = await updateSnippet(
      urlCode,
      dataToSave,
      languageRef.current,
      { currentPassword: sessionPasswordRef.current },
    );
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
  }, [urlCode, buildSavePayload, toast, t]);

  const flushSave = useCallback(() => {
    if (!urlCode || !isAuthenticatedRef.current) return;
    throttledFlushDocOps.flush();
    throttledEmitCode.flush();
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = undefined;
    }
    if (!isDirtyRef.current) return;
    const dataToSave = buildSavePayload();
    saveSnippetKeepalive(
      urlCode,
      dataToSave,
      languageRef.current,
      sessionPasswordRef.current,
    );
    lastSentCodeRef.current = dataToSave;
    isDirtyRef.current = false;
  }, [urlCode, buildSavePayload, throttledFlushDocOps, throttledEmitCode]);

  useEffect(() => {
    if (!snippetReady || !editorRef.current) return;
    const model = getOrCreateModel(codeRef.current, languageRef.current);
    monaco.editor.setModelLanguage(model, getModelLanguage(language));
    if (editorRef.current.getModel() !== model) {
      editorRef.current.setModel(model);
    }
    syncBaseRef.current = model.getValue();
    setCodeLength(model.getValue().length);
  }, [snippetReady, language, getOrCreateModel]);

  useEffect(() => {
    if (!snippetReady || hasLocalEditsRef.current) return;
    const model = modelRef.current ?? getOrCreateModel(code, language);
    if (model.getValue() !== code) {
      applyRemoteCodeToModel(model, code);
      syncBaseRef.current = code;
    }
    setCodeLength(model.getValue().length);
  }, [snippetReady, code, language, getOrCreateModel]);

  useEffect(() => {
    const onLeave = () => flushSave();
    window.addEventListener("beforeunload", onLeave);
    window.addEventListener("pagehide", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [flushSave]);

  useEffect(() => {
    if (!urlCode) return;
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        updateDatabase();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [urlCode, updateDatabase]);

  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [urlCode, flushSave]);

  const handleSetPassword = (password: string | null) => {
    const dataToSave = stringifySnippetPayload({
      code: getLiveCode(),
      language: languageRef.current,
    });
    lastSentCodeRef.current = dataToSave;

    const currentPassword = sessionPasswordRef.current;
    updateSnippet(urlCode!, dataToSave, languageRef.current, {
      currentPassword,
      password,
    }).then(({ error, data }) => {
      if (error) {
        toast({
          title: t("editor.errorTitle"),
          description: error,
          variant: "destructive",
        });
        return;
      }

      const protected_ = Boolean(data?.password_protected ?? password);
      setIsPasswordProtected(protected_);
      if (password) {
        setSessionPassword(password);
        sessionStorage.setItem(`liveshare-pwd:${urlCode}`, password);
      } else {
        setSessionPassword(null);
        sessionStorage.removeItem(`liveshare-pwd:${urlCode}`);
      }

      socketRef.current?.emit("snippet:sync", {
        uniqueCode: urlCode,
        code: dataToSave,
        senderId: myUserId,
      });

      // Re-join room with updated password credentials
      socketRef.current?.emit("room:join", {
        uniqueCode: urlCode,
        userId: myUserId,
        ...(password ? { password } : {}),
      });

      toast({
        title: password
          ? t("editor.codeProtectedTitle")
          : t("editor.protectionRemovedTitle"),
        description: password
          ? t("editor.codeProtectedDesc")
          : t("editor.protectionRemovedDesc"),
      });
    });
  };

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    if (!urlCode) return false;
    const { data, error } = await unlockSnippet(urlCode, password);
    if (error || !data) return false;
    applyLoadedSnippet(data, password);
    return true;
  };

  const debouncedSizeCheck = useRef(
    debounce((len: number) => setCodeLength(len), 200),
  ).current;

  const handleLocalCodeChange = (newCode: string) => {
    if (getIsApplyingRemoteOps()) return;

    const syncBase = syncBaseRef.current;

    if (isRemoteUpdateRef.current && newCode === syncBase) {
      isRemoteUpdateRef.current = false;
      return;
    }
    isRemoteUpdateRef.current = false;

    if (newCode === syncBase) return;

    hasLocalEditsRef.current = true;
    isDirtyRef.current = true;

    const ops = computeTextOps(syncBase, newCode);
    syncBaseRef.current = newCode;
    setCode(newCode);
    queueDocOps(syncBase.length, ops, newCode);
    throttledEmitCode();

    debouncedSizeCheck(newCode.length);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      throttledFlushDocOps.flush();
      throttledEmitCode.flush();
      updateDatabase();
    }, SAVE_DEBOUNCE_MS);
  };
  onLocalEditRef.current = handleLocalCodeChange;

  const handleLanguageChange = (newLanguage: string) => {
    const model = modelRef.current ?? editorRef.current?.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, getModelLanguage(newLanguage));
    }
    setLanguage(newLanguage);
    languageRef.current = newLanguage;
    isDirtyRef.current = true;
    void updateDatabase();
  };

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

  const handleEditorMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    let model = editorInstance.getModel();
    if (!model || model.isDisposed()) {
      model = getOrCreateModel(codeRef.current, languageRef.current);
      editorInstance.setModel(model);
    } else {
      modelRef.current = model;
      syncBaseRef.current = model.getValue();
    }
    setCodeLength(model.getValue().length);
    monaco.editor.setModelMarkers(model, "owner", []);
    monaco.editor.setModelMarkers(model, "javascript", []);
    monaco.editor.setModelMarkers(model, "typescript", []);
    monaco.editor.setModelMarkers(model, "json", []);
    monaco.editor.setModelMarkers(model, "css", []);
    monaco.editor.setModelMarkers(model, "html", []);

    contentListenerDisposeRef.current?.dispose();
    contentListenerDisposeRef.current =
      editorInstance.onDidChangeModelContent(() => {
        const value = editorInstance.getModel()?.getValue() ?? "";
        const m = editorInstance.getModel();
        if (m) {
          monaco.editor.setModelMarkers(m, "javascript", []);
          monaco.editor.setModelMarkers(m, "typescript", []);
          monaco.editor.setModelMarkers(m, "json", []);
          monaco.editor.setModelMarkers(m, "css", []);
          monaco.editor.setModelMarkers(m, "html", []);
        }
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
      const m = editorInstance.getModel();
      if (!m) return;

      const start = m.getOffsetAt(selection.getStartPosition());
      const end = m.getOffsetAt(selection.getEndPosition());

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

  useEffect(() => {
    if (!editorRef.current) return;

    const ed = editorRef.current;
    const model = ed.getModel();
    if (!model) return;

    const decorations: monaco.editor.IModelDeltaDecoration[] = [];

    userSelections.forEach((selection) => {
      if (!selection || selection.start === selection.end) return;

      try {
        const startPos = model.getPositionAt(selection.start);
        const endPos = model.getPositionAt(selection.end);
        const userIndex =
          selection.userId
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10;

        decorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column,
          ),
          options: {
            className: "remote-user-selection",
            inlineClassName: `remote-selection-user-${userIndex}`,
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      } catch (error) {
        console.warn("Error creating selection decoration:", error);
      }
    });

    const decorationIds = ed.deltaDecorations([], decorations);
    return () => {
      editorRef.current?.deltaDecorations(decorationIds, []);
    };
  }, [userSelections]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: t("editor.linkCopiedTitle"),
      description: t("editor.linkCopiedDesc"),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getLiveCode());
    toast({
      title: t("editor.codeCopiedTitle"),
      description: t("editor.codeCopiedDesc"),
    });
  };

  const handleDownload = () => {
    const text = getLiveCode();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = extMap[language] || "txt";
    a.download = `snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: t("editor.downloadedTitle"),
      description: t("editor.downloadedDesc"),
    });
  };

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

  if (snippetReady && isPasswordProtected && !isAuthenticated) {
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

      <div className="container-fluid mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden px-2 sm:px-3 pb-1 pt-[4.75rem] sm:pt-20">
        <div className="mb-2 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-4 md:gap-6">
            <Select value={language} onValueChange={handleLanguageChange}>
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

            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">
                {activeUserCount}{" "}
                {activeUserCount !== 1
                  ? t("editor.developers")
                  : t("editor.developer")}{" "}
                {t("editor.collaborating")}
              </span>
              <span className="md:hidden">
                {activeUserCount} {t("editor.live")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 justify-end">
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
              title={
                showMinimap ? t("editor.hideMinimap") : t("editor.showMinimap")
              }
            >
              <MapIcon className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">{t("editor.minimap")}</span>
            </Button>

            <SetPasswordDialog
              isProtected={isPasswordProtected}
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

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-border shadow-lg">
          {!snippetReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <div className="text-sm text-muted-foreground">
                {t("editor.loadingEditor")}
              </div>
            </div>
          )}
          <Editor
            height="100%"
            language={languageMap[language] || "plaintext"}
            defaultValue={code}
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
              renderValidationDecorations: "off",
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              trimAutoWhitespace: true,
              formatOnPaste: false,
              formatOnType: false,
              ...(isLargeFile && {
                folding: false,
              }),
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-slate-800">
                <div className="text-muted-foreground">
                  {t("editor.loadingEditor")}
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
