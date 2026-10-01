---
name: The Envelope
description: Warm stationery for private letters kept until a chosen posting date.
colors:
  bg: "#fbf7f0"
  surface: "#f3eadb"
  surface-2: "#f0e6d4"
  paper: "#fffdf8"
  ink: "#2a2420"
  muted: "#6f6458"
  line: "#e0d4c0"
  line-strong: "#cbb99c"
  seal: "#7b2d26"
  seal-strong: "#5e211c"
  seal-ink: "#fbf7f0"
  seal-soft: "#f4e4de"
  gold: "#b08d3b"
  gold-text: "#7a5f1f"
  sage: "#3d5a47"
  sage-soft: "#e4ebe2"
  dark-bg: "#1c1815"
  dark-surface: "#262019"
  dark-surface-2: "#2f2821"
  dark-paper: "#2a241e"
  dark-ink: "#f3eadb"
  dark-muted: "#b3a695"
  dark-line: "#3a3128"
  dark-line-strong: "#52463a"
  dark-seal: "#e07869"
  dark-seal-strong: "#e8887b"
  dark-seal-ink: "#1c1815"
  dark-seal-soft: "#3b231f"
  dark-gold: "#c9a961"
  dark-gold-text: "#d8bb74"
  dark-sage: "#9dc3a8"
  dark-sage-soft: "#1f2d25"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 400
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: "2.5rem"
    letterSpacing: "-0.025em"
  headline-wide:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.025em"
  section-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  detail-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: "1.75rem"
  body:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  lead:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  button:
    fontFamily: "Source Serif 4, Georgia, Times New Roman, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.25
  reference:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "0.875rem"
    lineHeight: "1.25rem"
rounded:
  control: "0.375rem"
  inset: "0.5rem"
  card: "0.75rem"
  pill: "calc(infinity * 1px)"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "3rem"
  section-wide: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.seal}"
    textColor: "{colors.seal-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.seal-strong}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1.5rem"
  button-inverse:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1.5rem"
  button-inverse-hover:
    backgroundColor: "{colors.surface}"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.625rem 0.75rem"
  field-invalid:
    backgroundColor: "{colors.seal-soft}"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  nav:
    textColor: "{colors.muted}"
  status-sage:
    backgroundColor: "{colors.sage-soft}"
    textColor: "{colors.sage}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.75rem"
  status-attention:
    backgroundColor: "{colors.seal-soft}"
    textColor: "{colors.seal}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.75rem"
  status-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.375rem 0.75rem"
  custody-record:
    textColor: "{colors.ink}"
    padding: "2rem 0"
---

# Design System: The Envelope

## Overview

**Creative North Star: "The Kept Letter"**

Warm stationery, serif text and wax-seal color make the interface feel like the paper letter it holds. Broad margins surround readable text; functional forms use the same materials with a quieter, more compact hierarchy.

The established world carries through customer tasks: clear labels, visible status and a destination that belongs to its letter. Management shows posting metadata while the letter's words stay sealed.

**Key Characteristics:**

- Warm paper layers with restrained borders.
- Fraunces headings and Source Serif 4 reading text.
- Oxblood actions, sage states and decorative antique gold.
- Responsive forms with visible keyboard focus.
- Individual letter records with inline address editing.

## Colors

The palette combines ivory and cream stationery with warm ink, oxblood wax, sage and antique gold. Frontmatter contains the exact light and dark values; `dark-` keys describe the dark overrides of the corresponding CSS variable.

### Primary

- **Oxblood wax:** `seal` carries primary actions, links and attention feedback. `seal-strong` is the hover color; `seal-ink` supplies text on filled actions; `seal-soft` supplies tinted selections and notices. Dark mode lifts oxblood to clay red.

### Secondary

- **Sage:** `sage` and `sage-soft` carry sealed, successful and posting-progress states. Text labels and SVG icons explain their meaning.

### Tertiary

- **Antique gold:** `gold` belongs to decorative rules and illustration details. `gold-text` is the separate text-capable tone.

### Neutral

- **Stationery:** `bg` is the page, `surface` is a cream band or inset, `surface-2` is the stronger cream layer, and `paper` is the sheet or card.
- **Warm ink:** `ink` carries main text and `muted` carries labels, supporting text and metadata.
- **Rules:** `line` separates regions; `line-strong` outlines inputs and secondary controls.

The theme follows the operating-system preference. A root `data-theme` override uses the same role mapping. Components consume semantic variables, so palette relationships survive either theme.

**The Seal Rule.** Use the seal family for actions and attention; reserve sage for state feedback.

**The Gold Rule.** Decorative gold does not carry reading text; use the gold-text role when words need a gold tone.

## Typography

**Display Font:** Fraunces, with Georgia and serif fallbacks.

**Body Font:** Source Serif 4, with Georgia, Times New Roman and serif fallbacks.

**Reference Font:** the existing monospace stack for private references and codes.

The two serif families share a literary character. Fraunces supplies the stronger silhouette; Source Serif 4 keeps labels, addresses and instructions readable without introducing a separate interface font.

### Hierarchy

- **Headline:** the repeated page-title role grows from `headline` to `headline-wide` at the small breakpoint.
- **Section title:** groups related material and introduces the management results.
- **Title / detail title:** identify a letter, form section, recipient or date without competing with the page title.
- **Body / lead:** body text carries addresses and instructions; leads use a larger size and relaxed line height. Supporting paragraphs are usually limited to a two-column content width (42rem).
- **Label:** sentence-case field labels and metadata use the smaller body face.
- **Button:** controls use the body family; compact task actions use the label size.
- **Reference:** monospace is confined to codes and reference entry.

**The Two Serif Rule.** Keep headings in Fraunces and reading text in Source Serif 4; reserve monospace for literal references and codes.

## Layout

Shared chrome and broad pages use a centered container (72rem); the management ledger narrows to (56rem), with its introduction constrained to (42rem). Side padding grows from (1rem) to (1.5rem) at the small breakpoint. Layout uses the spacing scale in frontmatter rather than a dense application grid.

Small screens stack fields, lookup controls and date/address groups. At the small breakpoint (40rem), postal fields split into two columns while name, street and country remain full width; lookup controls sit in one row. Primary navigation appears at the medium breakpoint (48rem). Large marketing and compose layouts divide into columns at (64rem).

Management records remain a vertical sequence. Their heading and status can wrap, and address text breaks rather than forcing horizontal overflow. Shared chrome stays above the content; the sticky header has a translucent paper background and blur.

## Elevation & Depth

Paper tones, fine borders and soft ambient shadows establish depth. Cards use the existing two-part card shadow; selected marketing cards lift on hover. Primary buttons have a small inset highlight and diffuse seal-colored shadow. The custody records themselves use rules rather than raised cards.

Motion is modest: controls transition over (150ms), decorative artwork can float, and the landing introduction and confirmation seal have entrance motion. The existing reduced-motion preference shortens animation and transitions and disables smooth scrolling. Exact shadow and motion definitions live in the sidecar.

## Shapes

Controls have gently curved corners; larger paper containers use a wider radius. Insets sit between those two scales. Pills are reserved for compact states and circular icon holders. Fine borders define surfaces and fields; postal addresses retain plain, non-italic multiline text.

## Components

### Buttons

Compact, tactile actions with the shared control radius and spacing.

- **Primary:** seal fill, seal-ink text and a stronger seal hover.
- **Secondary:** paper fill, ink text and a line-strong border that becomes ink on hover.
- **Inverse:** background-colored fill on the existing seal-colored callout.
- **States:** a pressed control moves down (1px); disabled controls reduce opacity and stop accepting actions. Visible keyboard focus uses a seal outline (2px) offset by (3px).

### Inputs / Fields

Paper-filled, bordered fields with explicit labels above them.

- Hover strengthens the border to muted ink.
- Focus changes the border to seal and adds a soft seal ring (3px).
- Invalid fields use seal borders and seal-soft fill, with linked explanatory feedback.
- Postal fields share one vocabulary between compose and management. The private-reference placeholder uses muted text, and reference entry uses monospace.

### Cards / Containers

Paper sheets with fine borders and softly rounded corners. General cards use the card shadow; the private-reference form uses the same paper and corner language with a border. Padding scales from compact mobile spacing to roomier desktop spacing.

### Status Chips

Pills pair a short text status with a lock or check SVG. Sage communicates the ordinary sealed/posting journey, seal communicates delays or attention, and neutral paper tones communicate cancellation. A status is always explained in nearby text; color alone is insufficient.

### Navigation

The sticky header pairs the wax-seal wordmark with a persistent primary action. Its inline navigation uses smaller muted body text, becoming ink on hover, and appears from the medium breakpoint. Footer groups remain available on smaller screens. Text links use a seal-colored underline that strengthens on hover.

### Custody Records

Each letter has a ruled record containing its own title, status, posting date and destination. A three-step ruled journey distinguishes sealed, printing and submitted-for-post stages. Address correction expands inside the relevant record, with shared postal fields and explicit save/keep-current actions. Success appears beside that record; focus returns to its heading or edit control.

**The Letter Owns Its Record Rule.** Keep status, destination and address feedback with the individual letter, including when an order contains a pair.

## Do's and Don'ts

### Do:

- **Do** use semantic paper, ink, seal and sage variables in both themes.
- **Do** keep serif hierarchy, sentence-case controls and readable supporting text.
- **Do** retain labeled fields, visible keyboard focus and explanatory status text.
- **Do** keep each letter's destination and inline editor in its own record.

### Don't:

- **Don't** use decorative gold for reading text.
- **Don't** substitute a new palette or display family when extending this stationery world.
- **Don't** use status color as the only explanation of a letter's state.
- **Don't** expose letter-body content in the management ledger.
