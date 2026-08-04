import fs from "fs";
import path from "path";

const dir = "components/resource";
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith("-manager.tsx"))) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  s = s.replace(
    /adminTr\("Page \{page\} of \{pages\}", \{ page: page, pages: typeof pages !== "undefined" \? pages : pageCount \}\)/g,
    'adminTr("Page {page} of {pages}", { page: page, pages: pages })'
  );
  if (f === "seller-orders-manager.tsx") {
    s = s.replace(
      /adminTr\("Page \{page\} of \{pages\}", \{ page: page, pages: pages \}\)/g,
      'adminTr("Page {page} of {pages}", { page: page, pages: pageCount })'
    );
  }
  fs.writeFileSync(p, s);
  console.log("pages var", f);
}

// Deduplicate admin-phrases.ts keys (keep last)
const phrasesPath = "lib/i18n/admin-phrases.ts";
let phrases = fs.readFileSync(phrasesPath, "utf8");
const start = phrases.indexOf("{");
const end = phrases.lastIndexOf("}");
const body = phrases.slice(start + 1, end);
const map = new Map();
const re = /^\s*("(?:\\.|[^"])+"|[A-Za-z_][A-Za-z0-9_]*):\s*("(?:\\.|[^"])*"),?\s*$/gm;
let m;
while ((m = re.exec(body))) {
  map.set(m[1], m[2]);
}
const lines = [...map.entries()].map(([k, v]) => `  ${k}: ${v},`);
fs.writeFileSync(
  phrasesPath,
  `export const ADMIN_PHRASES_AR: Record<string, string> = {\n${lines.join("\n")}\n};\n`
);
console.log("deduped phrases", map.size);
