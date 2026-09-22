"use client";

/**
 * The last resort: the root layout itself failed, so there is no layout,
 * no fonts and no tokens to lean on. Everything here is inline on purpose.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#fbf7f0",
          color: "#2a2420",
          fontFamily: "Georgia, 'Times New Roman', serif",
          margin: 0,
          minHeight: "100vh",
          padding: "6rem 1rem",
        }}
      >
        <main style={{ margin: "0 auto", maxWidth: "36rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 400, margin: 0 }}>
            The Envelope is having a bad moment.
          </h1>
          <p style={{ color: "#6f6458", fontSize: "1.125rem" }}>
            Please try again shortly. Nothing you wrote has been lost.
          </p>
          <p style={{ marginTop: "2rem" }}>
            {/* A plain anchor on purpose: the root layout threw, so a
                client-side transition would re-enter the broken tree. This
                has to be a fresh document load. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: "#7b2d26" }}>
              Back to the start
            </a>
          </p>
          {error.digest ? (
            <p style={{ color: "#6f6458", fontSize: "0.875rem" }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
