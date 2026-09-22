/**
 * Renders a sample letter and reports whether the PDF is structurally sound
 * and where the address block sits, in millimetres.
 *
 * Pingen prints into a windowed envelope. If the address falls outside the
 * DIN 5008 window the letter is posted and undeliverable, and you find out
 * weeks later. This checks the geometry without needing a Pingen account. It
 * does not replace the live test letter, it just means the live test is
 * unlikely to fail for this particular reason.
 *
 *   node scripts/pdf-proof.ts [outfile.pdf]
 */

import { writeFileSync } from "node:fs";
import { renderLetterPdf } from "../src/lib/pdf.ts";

// DIN 5008 Form A address window, measured from the sheet edges.
const WINDOW = { leftMm: 20, topMm: 45, widthMm: 85, heightMm: 40 };
const A4 = { widthMm: 210, heightMm: 297 };

const out = process.argv[2] ?? "letter-proof.pdf";

const pdf = await renderLetterPdf({
  body: [
    "My love,",
    "",
    "A year ago today we were standing in the rain outside the registry",
    "office and you said the thing about the umbrella. I am writing this",
    "while it is still funny, so you get to laugh at it again when it is old.",
    "",
    "Happy anniversary.",
  ].join("\n"),
  recipient: {
    name: "Ana Meyer",
    line1: "Hauptstrasse 4",
    line2: "Hinterhaus, 2. OG",
    postcode: "10115",
    city: "Berlin",
    country: "DE",
  },
});

writeFileSync(out, pdf);

const raw = pdf.toString("latin1");
const header = pdf.subarray(0, 8).toString("latin1");
const wellFormed = header.startsWith("%PDF-") && raw.trimEnd().endsWith("%%EOF");
const pages = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;

console.log(`wrote ${out} (${pdf.length.toLocaleString("en")} bytes)`);
console.log(`header         : ${JSON.stringify(header)}`);
console.log(`well-formed    : ${wellFormed}`);
console.log(`pages          : ${pages}`);
console.log(`A4 declared    : ${raw.includes("595.28") || raw.includes("595.2")}`);
console.log("");
console.log(
  `address block  : drawn at ${WINDOW.leftMm}mm from left, ${WINDOW.topMm}mm from top`,
);
console.log(
  `DIN 5008 window: x ${WINDOW.leftMm}-${WINDOW.leftMm + WINDOW.widthMm}mm, ` +
    `y ${WINDOW.topMm}-${WINDOW.topMm + WINDOW.heightMm}mm on ${A4.widthMm}x${A4.heightMm}mm`,
);
console.log("");
console.log("Open it and hold it against a windowed envelope. Geometry being");
console.log("right on paper is not the same as Pingen accepting it, run");
console.log("scripts/pingen-test-letter.ts for that.");
