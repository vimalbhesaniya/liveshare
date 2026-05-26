import diff from "fast-diff";
import type { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

/** Compact text operation for wire transport */
export type TextOp =
  | { t: "i"; pos: number; text: string }
  | { t: "d"; pos: number; len: number };

export type DocOpsPayload = {
  uniqueCode: string;
  tabId: string;
  senderId: string;
  baseLength: number;
  ops: TextOp[];
};

const DIFF_DELETE = -1;
const DIFF_INSERT = 1;
const DIFF_EQUAL = 0;

/** Compute minimal insert/delete ops from oldText → newText */
export function computeTextOps(oldText: string, newText: string): TextOp[] {
  if (oldText === newText) return [];

  const parts = diff(oldText, newText);
  const ops: TextOp[] = [];
  let index = 0;

  for (const [type, text] of parts) {
    if (type === DIFF_EQUAL) {
      index += text.length;
    } else if (type === DIFF_DELETE) {
      ops.push({ t: "d", pos: index, len: text.length });
      index += text.length;
    } else if (type === DIFF_INSERT) {
      ops.push({ t: "i", pos: index, text });
    }
  }

  return ops;
}

export function applyTextOps(text: string, ops: TextOp[]): string {
  if (ops.length === 0) return text;

  // Apply from end to start so positions stay valid
  const sorted = [...ops].sort((a, b) => b.pos - a.pos);
  let result = text;

  for (const op of sorted) {
    if (op.t === "d") {
      result = result.slice(0, op.pos) + result.slice(op.pos + op.len);
    } else {
      result = result.slice(0, op.pos) + op.text + result.slice(op.pos);
    }
  }

  return result;
}

export function opsToMonacoEdits(
  model: editor.ITextModel,
  ops: TextOp[],
): editor.IIdentifiedSingleEditOperation[] {
  return ops.map((op) => {
    if (op.t === "i") {
      const pos = model.getPositionAt(op.pos);
      return {
        range: new monaco.Range(
          pos.lineNumber,
          pos.column,
          pos.lineNumber,
          pos.column,
        ),
        text: op.text,
      };
    }
    const start = model.getPositionAt(op.pos);
    const end = model.getPositionAt(op.pos + op.len);
    return {
      range: new monaco.Range(
        start.lineNumber,
        start.column,
        end.lineNumber,
        end.column,
      ),
      text: "",
    };
  });
}

export function applyOpsToModel(
  model: editor.ITextModel,
  ops: TextOp[],
  baseLength: number,
): boolean {
  const current = model.getValue();
  if (current.length !== baseLength) {
    return false;
  }

  if (ops.length === 0) return true;

  isApplyingRemoteOps = true;
  try {
    const edits = opsToMonacoEdits(model, ops);
    model.applyEdits(edits);
    return true;
  } finally {
    isApplyingRemoteOps = false;
  }
}

/** Apply remote text with incremental edits; fall back to full replace only if needed. */
export function applyRemoteCodeToModel(
  model: editor.ITextModel,
  remoteCode: string,
): void {
  const current = model.getValue();
  if (current === remoteCode) return;

  const ops = computeTextOps(current, remoteCode);
  if (ops.length === 0) return;

  const applied = applyOpsToModel(model, ops, current.length);
  if (applied) return;

  isApplyingRemoteOps = true;
  try {
    model.setValue(remoteCode);
  } finally {
    isApplyingRemoteOps = false;
  }
}

/** Set while applying remote ops so onChange handlers can ignore echoes */
let isApplyingRemoteOps = false;

export function getIsApplyingRemoteOps(): boolean {
  return isApplyingRemoteOps;
}
