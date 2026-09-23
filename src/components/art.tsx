/**
 * Illustrations for the site, drawn as inline SVG.
 *
 * Why vector and not photography: every colour here is a design token, so
 * the art follows light and dark mode, stays sharp on any screen density,
 * and costs a few kilobytes instead of a 200 KB hero photo that would be the
 * largest thing on the page. The one raster image the site needs (the
 * social share card) is generated from the same shapes in
 * app/opengraph-image.tsx.
 */

type ArtProps = { className?: string };

/**
 * Wax seal, drawn as a disc with scalloped edges where the wax spread.
 * Positioned by its centre so it can be dropped onto any flap.
 */
export function WaxSeal({
  cx = 0,
  cy = 0,
  r = 34,
  letter = "E",
}: {
  cx?: number;
  cy?: number;
  r?: number;
  letter?: string;
}) {
  const lobes = Array.from({ length: 9 }, (_, i) => {
    const angle = (i / 9) * Math.PI * 2 + 0.3;
    return {
      x: cx + Math.cos(angle) * r * 0.86,
      y: cy + Math.sin(angle) * r * 0.86,
      r: r * (i % 2 ? 0.3 : 0.26),
    };
  });

  return (
    <g>
      {lobes.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y} r={l.r} fill="var(--seal)" />
      ))}
      <circle cx={cx} cy={cy} r={r} fill="var(--seal)" />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.72}
        fill="none"
        stroke="var(--seal-ink)"
        strokeOpacity="0.35"
        strokeWidth={r * 0.05}
      />
      <ellipse
        cx={cx - r * 0.32}
        cy={cy - r * 0.4}
        rx={r * 0.32}
        ry={r * 0.16}
        fill="#fff"
        opacity="0.16"
        transform={`rotate(-30 ${cx - r * 0.32} ${cy - r * 0.4})`}
      />
      <text
        x={cx}
        y={cy + r * 0.3}
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize={r * 0.85}
        fontStyle="italic"
        fill="var(--seal-ink)"
      >
        {letter}
      </text>
    </g>
  );
}

/** Pale handwriting: rows of rounded strokes of uneven length. */
function Script({
  x,
  y,
  width,
  rows,
  gap = 16,
}: {
  x: number;
  y: number;
  width: number;
  rows: number;
  gap?: number;
}) {
  const lengths = [0.92, 0.78, 0.95, 0.6, 0.88, 0.7, 0.94, 0.5, 0.83, 0.66];
  return (
    <g fill="var(--line-strong)">
      {Array.from({ length: rows }, (_, i) => (
        <rect
          key={i}
          x={x}
          y={y + i * gap}
          width={width * lengths[i % lengths.length]}
          height="3.5"
          rx="1.75"
        />
      ))}
    </g>
  );
}

/**
 * The hero: a sealed envelope, back side up, with the letter it holds
 * behind it and a tag naming the day it opens.
 */
export function SealedEnvelopeArt({ className = "" }: ArtProps) {
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="A cream envelope closed with a red wax seal, a handwritten letter behind it, and a tag that reads: to be opened on our first anniversary"
      className={className}
    >
      <ellipse
        cx="260"
        cy="396"
        rx="200"
        ry="14"
        style={{ fill: "rgb(var(--shadow-rgb))" }}
        opacity="0.12"
      />

      {/* The letter, leaning out from behind */}
      <g transform="rotate(-9 200 200)">
        <rect
          x="96"
          y="28"
          width="236"
          height="300"
          rx="4"
          fill="var(--paper)"
          stroke="var(--line)"
          strokeWidth="1.5"
        />
        <Script x={122} y={62} width={184} rows={9} gap={17} />
      </g>

      {/* Envelope */}
      <g className="animate-float" style={{ transformOrigin: "260px 256px" }}>
        <rect
          x="64"
          y="134"
          width="392"
          height="244"
          rx="8"
          fill="var(--surface)"
          stroke="var(--line-strong)"
          strokeWidth="1.5"
        />
        <path d="M64 142 L236 262 L64 374 Z" fill="var(--surface-2)" />
        <path d="M456 142 L284 262 L456 374 Z" fill="var(--surface-2)" />
        <path
          d="M72 378 L260 250 L448 378 Z"
          fill="var(--surface)"
          stroke="var(--line-strong)"
          strokeWidth="1.2"
        />
        <path
          d="M66 138 L260 282 L454 138 Z"
          fill="var(--surface-2)"
          stroke="var(--line-strong)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M90 146 L260 272 L430 146"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1"
          opacity="0.55"
        />
        <WaxSeal cx={260} cy={276} r={34} />
      </g>

      {/* Tag */}
      <g transform="rotate(7 420 336)">
        <path
          d="M392 318 Q 370 300 356 262"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
        />
        <rect
          x="372"
          y="312"
          width="132"
          height="64"
          rx="6"
          fill="var(--paper)"
          stroke="var(--line-strong)"
          strokeWidth="1.2"
        />
        <circle
          cx="388"
          cy="326"
          r="4"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.5"
        />
        <text
          x="438"
          y="340"
          textAnchor="middle"
          fontFamily="var(--font-body), Georgia, serif"
          fontSize="10"
          letterSpacing="1.4"
          fill="var(--muted)"
        >
          TO BE OPENED
        </text>
        <text
          x="438"
          y="360"
          textAnchor="middle"
          fontFamily="var(--font-display), Georgia, serif"
          fontSize="13"
          fontStyle="italic"
          fill="var(--ink)"
        >
          our first anniversary
        </text>
      </g>
    </svg>
  );
}

/**
 * The front of an envelope as it arrives: address block, stamp and a
 * cancellation mark. Used where the page talks about delivery.
 */
export function PostedEnvelopeArt({ className = "" }: ArtProps) {
  return (
    <svg
      viewBox="0 0 440 290"
      role="img"
      aria-label="The front of a posted envelope with an address, a stamp and a postmark"
      className={className}
    >
      <ellipse
        cx="220"
        cy="276"
        rx="180"
        ry="10"
        style={{ fill: "rgb(var(--shadow-rgb))" }}
        opacity="0.12"
      />
      <rect
        x="16"
        y="16"
        width="408"
        height="248"
        rx="8"
        fill="var(--surface)"
        stroke="var(--line-strong)"
        strokeWidth="1.5"
      />

      {/* Stamp with perforated edge */}
      <rect
        x="330"
        y="36"
        width="70"
        height="84"
        fill="var(--paper)"
        stroke="var(--paper)"
        strokeWidth="6"
        strokeDasharray="3 3"
      />
      <rect
        x="337"
        y="43"
        width="56"
        height="70"
        fill="var(--seal-soft)"
        stroke="var(--line-strong)"
        strokeWidth="1"
      />
      <path
        d="M365 96s-14-8.2-14-18.6a7.9 7.9 0 0 1 14-5 7.9 7.9 0 0 1 14 5C379 87.8 365 96 365 96Z"
        fill="var(--seal)"
      />

      {/* Postmark */}
      <g stroke="var(--muted)" strokeWidth="1.5" fill="none" opacity="0.7">
        <circle cx="318" cy="92" r="30" />
        <circle cx="318" cy="92" r="23" strokeDasharray="2 3" />
        <path d="M200 70 q 10 -6 20 0 t 20 0 t 20 0 t 20 0" />
        <path d="M200 84 q 10 -6 20 0 t 20 0 t 20 0 t 20 0" />
        <path d="M200 98 q 10 -6 20 0 t 20 0 t 20 0 t 20 0" />
      </g>
      <text
        x="318"
        y="96"
        textAnchor="middle"
        fontFamily="var(--font-body), Georgia, serif"
        fontSize="9"
        letterSpacing="1"
        fill="var(--muted)"
      >
        POSTED
      </text>

      <text
        x="150"
        y="176"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="17"
        fontStyle="italic"
        fill="var(--ink)"
      >
        Mira &amp; Jonas Adler
      </text>
      <Script x={150} y={190} width={170} rows={3} gap={15} />
    </svg>
  );
}

/** Small decorative flourish for section breaks. */
export function Flourish({ className = "" }: ArtProps) {
  return (
    <svg
      viewBox="0 0 120 12"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="var(--gold)"
      strokeWidth="1"
    >
      <path d="M0 6h48M72 6h48" />
      <path d="M60 1.5 64.5 6 60 10.5 55.5 6Z" fill="var(--gold)" />
    </svg>
  );
}
