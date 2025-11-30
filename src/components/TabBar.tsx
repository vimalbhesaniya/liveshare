import { useState, useRef, useEffect } from "react";
import {
  Plus,
  X,
  GripVertical,
  Palette,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type Tab = {
  id: string;
  name: string;
  color: string;
  code: string;
  language: string;
};

const TAB_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

type TabBarProps = {
  tabs: Tab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabAdd: () => void;
  onTabClose: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
  onTabColorChange: (tabId: string, newColor: string) => void;
  onTabsReorder: (tabs: Tab[]) => void;
};

export function TabBar({
  tabs,
  activeTabId,
  onTabSelect,
  onTabAdd,
  onTabClose,
  onTabRename,
  onTabColorChange,
  onTabsReorder,
}: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTabId);
  const activeTab = tabs[activeTabIndex];

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const handleDoubleClick = (tab: Tab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.name);
  };

  const handleEditSubmit = (tabId: string) => {
    if (editValue.trim()) {
      onTabRename(tabId, editValue.trim());
    }
    setEditingTabId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === "Enter") {
      handleEditSubmit(tabId);
    } else if (e.key === "Escape") {
      setEditingTabId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (draggedTab && draggedTab !== tabId) {
      setDragOverTab(tabId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedTab || draggedTab === targetTabId) {
      setDraggedTab(null);
      setDragOverTab(null);
      return;
    }

    const draggedIndex = tabs.findIndex((t) => t.id === draggedTab);
    const targetIndex = tabs.findIndex((t) => t.id === targetTabId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTabs = [...tabs];
    const [removed] = newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, removed);

    onTabsReorder(newTabs);
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
    setDragOverTab(null);
  };

  const handlePrevTab = () => {
    if (activeTabIndex > 0) {
      onTabSelect(tabs[activeTabIndex - 1].id);
    }
  };

  const handleNextTab = () => {
    if (activeTabIndex < tabs.length - 1) {
      onTabSelect(tabs[activeTabIndex + 1].id);
    }
  };

  return (
    <div className="bg-muted/50 p-1 rounded-t-lg border border-b-0 border-border">
      {/* Mobile View - Show navigation arrows with current tab */}
      <div className="flex sm:hidden items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handlePrevTab}
          disabled={activeTabIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {activeTab && (
          <div
            className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-background shadow-sm"
            style={{ borderLeft: `3px solid ${activeTab.color}` }}
          >
            {editingTabId === activeTab.id ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleEditSubmit(activeTab.id)}
                onKeyDown={(e) => handleEditKeyDown(e, activeTab.id)}
                className="h-6 px-2 py-0 text-sm flex-1 min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium truncate flex-1">
                {activeTab.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {activeTabIndex + 1}/{tabs.length}
            </span>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleDoubleClick(activeTab);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="center">
                <div className="grid grid-cols-5 gap-1">
                  {TAB_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        activeTab.color === color
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabColorChange(activeTab.id, color);
                      }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {tabs.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(activeTab.id);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleNextTab}
          disabled={activeTabIndex === tabs.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onTabAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop View - Show all tabs */}
      <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            draggable
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, tab.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, tab.id)}
            onDragEnd={handleDragEnd}
            className={`
              group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer
              transition-all duration-150 min-w-[100px] max-w-[180px]
              ${
                activeTabId === tab.id
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              }
              ${dragOverTab === tab.id ? "ring-2 ring-primary" : ""}
              ${draggedTab === tab.id ? "opacity-50" : ""}
            `}
            onClick={() => onTabSelect(tab.id)}
            style={{
              borderLeft: `3px solid ${tab.color}`,
            }}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />

            {editingTabId === tab.id ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleEditSubmit(tab.id)}
                onKeyDown={(e) => handleEditKeyDown(e, tab.id)}
                className="h-5 px-1 py-0 text-xs w-full min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="text-xs font-medium truncate flex-1"
                onDoubleClick={() => handleDoubleClick(tab)}
              >
                {tab.name}
              </span>
            )}

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Palette className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start">
                  <div className="grid grid-cols-5 gap-1">
                    {TAB_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          tab.color === color
                            ? "border-foreground"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabColorChange(tab.id, color);
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {tabs.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={onTabAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function createNewTab(tabNumber: number): Tab {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: `Tab ${tabNumber}`,
    color: "#3b82f6",
    code: "",
    language: "javascript",
  };
}
