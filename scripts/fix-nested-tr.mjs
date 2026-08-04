import fs from "fs";
import path from "path";

const dir = "components/resource";
let n = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith("-manager.tsx"))) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  s = s.replace(
    /\{tr\("\{tr\("([^"]+)", (\{[^}]+\})\)\}", \{[^}]+\}\)\}/g,
    '{tr("$1", $2)}'
  );
  if (s !== before) {
    fs.writeFileSync(p, s);
    n++;
    console.log("fixed", f);
  }
}
console.log("files", n);
