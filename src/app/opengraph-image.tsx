import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "The Envelope: write to your first anniversary, we post it on the day.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The social share card, rendered to PNG at build time. PNG rather than
 * JPEG because it is flat colour and type, which PNG compresses without
 * artefacts; every platform that reads og:image accepts it.
 */
export default async function OpengraphImage() {
  const svg = await readFile(join(process.cwd(), "src/app/icon.svg"));
  const seal = `data:image/svg+xml;base64,${svg.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fbf7f0",
          color: "#2a2420",
          padding: 36,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            border: "2px solid #e0d4c0",
            borderRadius: 16,
            padding: "56px 64px",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", width: 620 }}
          >
            <div style={{ fontSize: 22, letterSpacing: 5, color: "#7a5f1f" }}>
              THE ENVELOPE
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 56,
                lineHeight: 1.08,
                letterSpacing: -1.5,
              }}
            >
              Write to your first anniversary.
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 56,
                lineHeight: 1.08,
                letterSpacing: -1.5,
                color: "#7b2d26",
              }}
            >
              We post it on the day.
            </div>
            <div style={{ marginTop: 32, fontSize: 26, color: "#6f6458" }}>
              Sealed on paper, held encrypted, posted up to five years ahead.
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                width: 380,
                height: 250,
                background: "#f3eadb",
                border: "2px solid #cbb99c",
                borderRadius: 10,
                transform: "rotate(-4deg)",
                boxShadow: "0 30px 50px -20px rgba(42,36,32,0.35)",
              }}
            >
              <svg
                width="380"
                height="250"
                viewBox="0 0 380 250"
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                <path d="M0 0 L170 130 L0 250 Z" fill="#f0e6d4" />
                <path d="M380 0 L210 130 L380 250 Z" fill="#f0e6d4" />
                <path
                  d="M2 2 L190 150 L378 2 Z"
                  fill="#f0e6d4"
                  stroke="#cbb99c"
                  strokeWidth="2"
                />
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
              <img
                src={seal}
                width={96}
                height={96}
                alt=""
                style={{ position: "absolute", left: 142, top: 104 }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
