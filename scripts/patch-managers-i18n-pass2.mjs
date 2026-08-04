/**
 * Second pass: wrap icon+text buttons and page titles/subtitles.
 */
import fs from "fs";
import path from "path";

const extract = JSON.parse(fs.readFileSync("scripts/resource-pages-extract.json", "utf8"));
const titles = [...new Set(extract.routes.map((r) => r.title).filter(Boolean))];
const subtitles = [...new Set(extract.routes.map((r) => r.subtitle).filter(Boolean))];

const phrasesSrc = fs.readFileSync("lib/i18n/admin-phrases.ts", "utf8");
const phrases = new Set([...phrasesSrc.matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]));

// Ensure page titles/subtitles exist in phrases map (append if missing)
let phrasesFile = phrasesSrc;
const toAdd = [];
for (const title of titles) {
  if (!phrases.has(title)) {
    // We'll rely on ADMIN_PAGES lookup via a helper instead — still wrap with tr and add phrase
    toAdd.push([title, null]);
  }
}

// Build extra AR from admin-pages by matching English title
const pagesSrc = fs.readFileSync("lib/i18n/admin-pages.ts", "utf8");
const pageByEnTitle = {};
for (const r of extract.routes) {
  const block = pagesSrc.includes(`"${r.route}"`) || pagesSrc.includes(`${r.route}:`);
  // Find Arabic title for this route
  const re = new RegExp(
    `(?:\"${r.route.replace(/\//g, "\\/")}\"|${r.route.includes("/") ? `"${r.route}"` : r.route}):\\s*\\{[\\s\\S]*?title:\\s*\"([^\"]+)\"`
  );
  const m = pagesSrc.match(re);
  if (m) pageByEnTitle[r.title] = m[1];
  if (r.subtitle) {
    const re2 = new RegExp(
      `(?:\"${r.route.replace(/\//g, "\\/")}\"|${r.route.includes("/") ? `"${r.route}"` : r.route}):\\s*\\{[\\s\\S]*?subtitle:\\s*\"([^\"]+)\"`
    );
    const m2 = pagesSrc.match(re2);
    if (m2) pageByEnTitle[r.subtitle] = m2[1];
  }
}

// Append missing phrases to admin-phrases.ts
const missing = [];
for (const [en, ar] of Object.entries(pageByEnTitle)) {
  if (!phrases.has(en) && ar) missing.push(`  ${JSON.stringify(en)}: ${JSON.stringify(ar)},`);
}

const extraChrome = [
  ["Export", "تصدير"],
  ["Refresh", "تحديث"],
  ["Import", "استيراد"],
  ["Create Transfer", "إنشاء تحويل"],
  ["Import Transfers", "استيراد التحويلات"],
  ["Create Adjustment", "إنشاء تسوية"],
  ["Import Adjustments", "استيراد التسويات"],
  ["Create Stock Count", "إنشاء جرد"],
  ["Schedule Count", "جدولة الجرد"],
  ["Import Count Sheet", "استيراد ورقة الجرد"],
  ["Create Batch", "إنشاء دفعة"],
  ["Import Batches", "استيراد الدفعات"],
  ["Print Labels", "طباعة الملصقات"],
  ["Create Order", "إنشاء طلب"],
  ["Import Orders", "استيراد الطلبات"],
  ["Generate Picking Lists", "إنشاء قوائم الالتقاط"],
  ["Shipping Labels", "ملصقات الشحن"],
  ["All statuses", "كل الحالات"],
  ["All source warehouses", "كل مستودعات المصدر"],
  ["Manage inventory movement between warehouses and fulfillment locations.", "إدارة حركة المخزون بين المستودعات ومواقع التنفيذ."],
  ["Manage inventory corrections, stock reconciliation, and warehouse adjustments.", "إدارة تصحيحات المخزون ومطابقته وتسويات المستودعات."],
  ["Manage physical inventory counts, cycle counts, warehouse audits, and inventory reconciliation.", "إدارة الجرد الفعلي والدوري وتدقيق المستودعات ومطابقة المخزون."],
  ["Manage batches, lots, serial numbers, expiration dates, and inventory traceability.", "إدارة الدفعات والحصص والأرقام التسلسلية وتواريخ الانتهاء وتتبع المخزون."],
  ["Manage and monitor every order across your entire commerce platform.", "إدارة ومراقبة كل الطلبات عبر منصة التجارة بالكامل."],
  ["Manage orders fulfilled by your internal warehouses and fulfillment centers.", "إدارة الطلبات المنفذة عبر مستودعاتك ومراكز التنفيذ الداخلية."],
];

for (const [en, ar] of extraChrome) {
  if (!phrases.has(en)) missing.push(`  ${JSON.stringify(en)}: ${JSON.stringify(ar)},`);
}

if (missing.length) {
  phrasesFile = phrasesFile.replace(/\n\};\s*$/, `\n${missing.join("\n")}\n};\n`);
  fs.writeFileSync("lib/i18n/admin-phrases.ts", phrasesFile);
  console.log("added", missing.length, "phrases");
}

// Reload phrases list
const allPhrases = [...fs.readFileSync("lib/i18n/admin-phrases.ts", "utf8").matchAll(/^\s*"([^"]+)":/gm)].map((m) => m[1]);
allPhrases.sort((a, b) => b.length - a.length);

const dir = "components/resource";
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith("-manager.tsx"))) {
  let src = fs.readFileSync(path.join(dir, file), "utf8");
  if (!src.includes("useAdminTr")) continue;
  let changed = false;

  for (const phrase of allPhrases) {
    if (phrase.includes("{")) continue;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Avoid double-wrapping
    const already = new RegExp(`tr\\(\"${escaped}\"\\)`);
    if (already.test(src) && !new RegExp(`>${escaped}<`).test(src) && !new RegExp(`/>${escaped}<`).test(src)) {
      // may still have unwrapped icon forms
    }

    const before = src;
    // >Phrase< not already tr(
    src = src.replace(new RegExp(`(?<!tr\\(\"[^\"]*)>(${escaped})<`, "g"), `>{tr("${phrase}")}<`);
    // />Phrase< (lucide icon then text)
    src = src.replace(new RegExp(`/>(${escaped})<`, "g"), `/>{tr("${phrase}")}<`);
    // sm:text-3xl">Phrase</h1>
    src = src.replace(new RegExp(`(text-3xl\">)(${escaped})(</h1>)`, "g"), `$1{tr("${phrase}")}$3`);
    // muted-foreground">Subtitle</p>
    src = src.replace(new RegExp(`(muted-foreground\">)(${escaped})(</p>)`, "g"), `$1{tr("${phrase}")}$3`);

    if (src !== before) changed = true;
  }

  // Fix accidental nested tr(tr(
  src = src.replace(/tr\(\"tr\(\\\"([^\\]+)\\\"\)\"\)/g, 'tr("$1")');
  src = src.replace(/\{tr\("\{tr\("([^"]+)"\)\}"\)\}/g, '{tr("$1")}');

  if (changed) {
    fs.writeFileSync(path.join(dir, file), src);
    console.log("updated", file);
  }
}
console.log("pass2 done");
