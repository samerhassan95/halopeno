import fs from "fs";

const phrasesPath = "lib/i18n/admin-phrases.ts";
const phrases = fs.readFileSync(phrasesPath, "utf8");
const start = phrases.indexOf("{");
const end = phrases.lastIndexOf("}");
const body = phrases.slice(start + 1, end);
const map = new Map();
const re = /^\s*("(?:\\.|[^"])+"|[A-Za-z_][\w]*)\s*:\s*("(?:\\.|[^"])*")\s*,?\s*$/gm;
let m;
while ((m = re.exec(body))) {
  let key = m[1];
  if (!key.startsWith('"')) key = JSON.stringify(key);
  // unescape for Map identity
  const norm = JSON.parse(key);
  map.set(norm, m[2]);
}
const lines = [...map.entries()].map(
  ([k, v]) => `  ${JSON.stringify(k)}: ${v},`
);
fs.writeFileSync(
  phrasesPath,
  `export const ADMIN_PHRASES_AR: Record<string, string> = {\n${lines.join("\n")}\n};\n`
);
console.log("normalized phrases", map.size);
