/**
 * Bundle Monaco workers via Vite instead of CDN.
 * Import once before any Monaco usage.
 */
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    switch (label) {
      case "json":
        return new jsonWorker();
      case "css":
      case "scss":
      case "less":
        return new cssWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker();
      case "typescript":
      case "javascript":
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};

// LiveShare is a paste/share editor — turn off language validation squiggles
// (e.g. JS "Cannot find module" / path errors) for every language.
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
  noSuggestionDiagnostics: true,
});
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: true,
  noSuggestionDiagnostics: true,
});
monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  ...monaco.languages.typescript.javascriptDefaults.getCompilerOptions(),
  noLib: true,
  allowNonTsExtensions: true,
});
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
  noLib: true,
  allowNonTsExtensions: true,
});
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: false,
  allowComments: true,
  schemas: [],
  enableSchemaRequest: false,
});
monaco.languages.css.cssDefaults.setOptions({
  validate: false,
});
monaco.languages.css.scssDefaults.setOptions({
  validate: false,
});
monaco.languages.css.lessDefaults.setOptions({
  validate: false,
});
monaco.languages.html.htmlDefaults.setOptions({
  validate: false,
});
