import PDFDocument from "pdfkit";
import type { Recipient } from "./letters.ts";

/**
 * Renders a letter to an A4 PDF for Pingen to print.
 *
 * The address block position matters: Pingen prints into a windowed
 * envelope, so the recipient block has to land inside the DIN 5008 window.
 * Getting this wrong produces a letter that is posted and undeliverable —
 * confirm the placement against a real printed test letter before trusting
 * it, which is what the week-zero live test is for.
 */

// DIN 5008 Form A, in PDF points (1pt = 1/72in, 1mm = 2.8346pt).
const MM = 2.834645669;
const ADDRESS_LEFT = 20 * MM;
const ADDRESS_TOP = 45 * MM;
const ADDRESS_WIDTH = 85 * MM;
const BODY_TOP = 100 * MM;
const MARGIN_LEFT = 25 * MM;
const MARGIN_RIGHT = 20 * MM;
const MARGIN_BOTTOM = 20 * MM;

export function renderLetterPdf(opts: {
  body: string;
  recipient: Recipient;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: BODY_TOP,
        left: MARGIN_LEFT,
        right: MARGIN_RIGHT,
        bottom: MARGIN_BOTTOM,
      },
      info: { Title: "The Envelope" },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const { recipient } = opts;
    const addressLines = [
      recipient.name,
      recipient.line1,
      ...(recipient.line2 ? [recipient.line2] : []),
      `${recipient.postcode} ${recipient.city}`,
      recipient.country,
    ];

    doc
      .font("Times-Roman")
      .fontSize(11)
      .text(addressLines.join("\n"), ADDRESS_LEFT, ADDRESS_TOP, {
        width: ADDRESS_WIDTH,
        lineGap: 2,
      });

    doc
      .font("Times-Roman")
      .fontSize(12)
      .text(opts.body, MARGIN_LEFT, BODY_TOP, {
        width: doc.page.width - MARGIN_LEFT - MARGIN_RIGHT,
        align: "left",
        lineGap: 3,
      });

    doc.end();
  });
}
