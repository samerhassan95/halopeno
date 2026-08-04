/**
 * Inject useAdminTr() into custom resource managers and wrap common English UI phrases.
 */
import fs from "fs";
import path from "path";

const dir = path.resolve("components/resource");
const importLine = `import { useAdminTr } from "@/lib/i18n/admin-tr";\n`;

const phrasesPath = path.resolve("lib/i18n/admin-phrases.ts");
const phrasesSrc = fs.readFileSync(phrasesPath, "utf8");
const phrases = [...phrasesSrc.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]);
// Prefer longer phrases first to avoid partial replacements
phrases.sort((a, b) => b.length - a.length);

const files = fs.readdirSync(dir).filter((f) => f.endsWith("-manager.tsx"));

let patched = 0;
for (const file of files) {
  const full = path.join(dir, file);
  let src = fs.readFileSync(full, "utf8");
  if (src.includes("useAdminTr")) continue;

  // Insert import after first import block line or at top after "use client"
  if (src.includes('from "@/lib/i18n/admin-tr"')) {
    // already
  } else if (src.startsWith('"use client"')) {
    src = src.replace('"use client";\n', `"use client";\n\n${importLine}`);
  } else {
    src = importLine + src;
  }

  // Insert hook call right after function opening brace of exported manager
  src = src.replace(
    /export function (\w+)\(\)\s*\{/,
    (match, name) => `export function ${name}(){const tr=useAdminTr();`
  );
  // Also handle multiline style: export function Foo() {\n
  src = src.replace(
    /export function (\w+)\(\)\s*\{\n/,
    (match, name) => {
      if (match.includes("useAdminTr")) return match;
      return `export function ${name}() {\n  const tr = useAdminTr();\n`;
    }
  );

  // If double-injected, fix
  src = src.replace(/const tr=useAdminTr\(\);const tr=useAdminTr\(\);/g, "const tr=useAdminTr();");
  src = src.replace(/const tr = useAdminTr\(\);\n\s*const tr = useAdminTr\(\);\n/g, "  const tr = useAdminTr();\n");

  // Replace JSX text nodes and simple string props for known phrases
  for (const phrase of phrases) {
    if (phrase.includes("{")) continue; // skip templates with vars for safety
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // >Phrase<
    src = src.replace(new RegExp(`>(${escaped})<`, "g"), `>{tr("${phrase}")}<`);
    // {"Phrase"}
    src = src.replace(new RegExp(`\\{"(${escaped})"\\}`, "g"), `{tr("${phrase}")}`);
    // placeholder="Phrase"
    src = src.replace(new RegExp(`placeholder="${escaped}"`, "g"), `placeholder={tr("${phrase}")}`);
    // title="Phrase" / aria-label="Phrase" / confirmLabel="Phrase"
    src = src.replace(new RegExp(`(aria-label|title|confirmLabel|description)="${escaped}"`, "g"), `$1={tr("${phrase}")}`);
  }

  // Page X of Y patterns (common in managers)
  src = src.replace(
    />Page \{(\w+)\} of \{(\w+)\}</g,
    `>{tr("Page {page} of {pages}", { page: $1, pages: $2 })}<`
  );
  src = src.replace(
    /Page \{(\w+)\} of \{(\w+)\}/g,
    `{tr("Page {page} of {pages}", { page: $1, pages: $2 })}`
  );

  fs.writeFileSync(full, src);
  patched += 1;
  console.log("patched", file);
}

console.log("done", patched, "files");
