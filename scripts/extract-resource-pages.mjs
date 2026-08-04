import fs from "fs";
const s = fs.readFileSync("lib/resource-pages.ts", "utf8");
const routes = [];
const re = /route:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"(?:[\s\S]*?subtitle:\s*"([^"]+)")?/g;
let m;
while ((m = re.exec(s))) {
  routes.push({ route: m[1], title: m[2], subtitle: m[3] || "" });
}
const cols = new Set();
for (const cm of s.matchAll(/\{\s*key:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)) {
  cols.add(`${cm[1]}|||${cm[2]}`);
}
fs.writeFileSync("scripts/resource-pages-extract.json", JSON.stringify({ routes, cols: [...cols] }, null, 2));
console.log(routes.length, "pages", cols.size, "column pairs");
