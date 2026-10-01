---
version: 1
slug: "src-app-manage-page-tsx"
primary_target: "src/app/manage/page.tsx"
related_targets: ["src/app/manage/manage-form.tsx","src/components/address-fields.tsx"]
---

# Private letter management

Mode: Operate. Scope: `/manage` and the shared postal-address editor.

Returning customers use their existing private reference to check the delivery
metadata and update either letter's destination before printing. A pair has two
independent addresses. There are no accounts, and no token is placed in the
browser URL or persistent storage. Encrypted letter content is never selected.

The surface extends the existing stationery world. The composition is a private
custody ledger: purpose and reference form first, followed by individual records
showing status, posting date, destination and an inline address editor. Grounded
structures considered: receipt with inline edit; timeline beside address;
letter-selector tabs; address-first task form; delivery table; vertical custody
ledger. The surface roll assigned candidate 6, key 022935f6. The memorable moment
is changing a destination while the words stay sealed.

Updates authorize the reference afresh and atomically constrain order ownership
and editable status. Printing wins safely: a rejected edit offers a fresh status
lookup and restores records-heading focus. Actual provider acceptance is labeled
as submitted for posting, never delivered. Failed dispatch remains visible and
is not silently restarted by an address edit.

The independent finish review reached disposition `ship`; both recovery and
placeholder-contrast findings were resolved. Synthetic browser proof covers
desktop/mobile/dark mode, independent pair updates, printing races, privacy and
the shared compose fields. No unresolved surface decisions.
