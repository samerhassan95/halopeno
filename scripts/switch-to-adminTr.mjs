import fs from "fs";
import path from "path";

const dir = "components/resource";
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith("-manager.tsx"))) {
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, "utf8");

  // Prefer module-level adminTr so nested components work
  s = s.replace(
    /import \{ useAdminTr \} from "@\/lib\/i18n\/admin-tr";/,
    'import { adminTr } from "@/lib/i18n/admin-tr";'
  );
  s = s.replace(/const tr\s*=\s*useAdminTr\(\);\s*/g, "");
  s = s.replace(/const tr=useAdminTr\(\);/g, "");
  s = s.replace(/\btr\(/g, "adminTr(");

  // seller-orders pageCount bug from patch
  s = s.replace(
    /adminTr\("Page \{page\} of \{pages\}", \{ page: page, pages: pages \}\)/g,
    'adminTr("Page {page} of {pages}", { page: page, pages: typeof pages !== "undefined" ? pages : pageCount })'
  );
  // cleaner for seller-orders specifically
  if (f === "seller-orders-manager.tsx") {
    s = s.replace(
      /adminTr\("Page \{page\} of \{pages\}", \{ page: page, pages: typeof pages !== "undefined" \? pages : pageCount \}\)/g,
      'adminTr("Page {page} of {pages}", { page: page, pages: pageCount })'
    );
  }

  fs.writeFileSync(p, s);
  console.log("switched", f);
}
console.log("done");
