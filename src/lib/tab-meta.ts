import type { Tab } from "@/components/TabBar";

/** Tab metadata for WS broadcast — excludes heavy `code` payloads */
export type TabMeta = {
  id: string;
  name: string;
  color: string;
  language: string;
};

export function toTabMeta(tab: Tab): TabMeta {
  return {
    id: tab.id,
    name: tab.name,
    color: tab.color,
    language: tab.language,
  };
}

export function stripTabsForBroadcast(tabs: Tab[]): TabMeta[] {
  return tabs.map(toTabMeta);
}

export function mergeTabMeta(
  currentTabs: Tab[],
  remoteMeta: TabMeta[],
  getCode: (tabId: string) => string,
): Tab[] {
  const codeById = new Map(currentTabs.map((t) => [t.id, t.code]));

  const merged: Tab[] = remoteMeta.map((meta) => ({
    ...meta,
    code: getCode(meta.id) || codeById.get(meta.id) || "",
  }));

  currentTabs.forEach((tab) => {
    if (!remoteMeta.some((m) => m.id === tab.id)) {
      merged.push(tab);
    }
  });

  return merged;
}
