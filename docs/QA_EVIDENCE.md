# Evidence workflow verification — 2026-09-17

Historical EV-prototype QA. For the current website-aligned workspace, see [QA_PROGRAM_MEMORY.md](./QA_PROGRAM_MEMORY.md). The limitations below describe the earlier prototype, not the current feature inventory.

Scope: the implemented local demo evidence workflow. No next-stage features were added.

## Defects found and corrected

1. Rapid uploads could share an ID because IDs were based on millisecond timestamps. Evidence and event IDs now use UUIDs. A frozen-clock regression test reproduces the original failure and passes after the fix.
2. The test harness omitted `window.localStorage`, so persistence silently fell back to unavailable storage. The harness now provides a browser-shaped storage adapter and asserts actual persistence and rehydration.
3. The attention counter ignored mapped records with `needs-context` status. Both Evidence Vault and the program dashboard now include them.
4. The sidebar continued displaying the funder identity in Program perspective. It now displays Maya Chen / Program manager when selected.

## Passed checks

- Production build, including TypeScript validation.
- Real store tests: funder mutation denial, original-version preservation, replacement audit event, mapping event, no-op duplicate mapping, invalid mapping/replacement rejection, UUID uniqueness, persisted state rehydration, and reset to seed data.
- Browser: funder detail view omits editing forms; program view exposes them.
- Browser: empty replacement fields disable creation; valid input creates v3 and retains v2/v1 metadata and replacement reasons.
- Browser: a fresh page load restores the replacement and selected role.
- Browser: mapping updates the record and disables redundant saves.
- Browser: replacement and mapping each create one corresponding ledger event.
- Browser: combined status/mapping filters and search empty state work.
- Browser: unknown evidence ID shows a recovery link.
- Visual inspection: evidence details at desktop and 390 × 844 mobile dimensions. Temporary viewport override restored.
- Final browser regression: mapped replacement requiring context is counted (2 items), and Program perspective shows the correct identity.

Run store tests with `npm run test:evidence` after dependencies are installed.

## Remaining limitations / release gate

This is a pass for the tested metadata workflow, not a release approval for the entire beta.

- Upload is still a filename simulation; original bytes, extraction, and real storage are not implemented.
- AI suggestions and the submission/review workflow remain unfinished.
- Workspace switching, Settings, and Help still have placeholder controls.
- Ledger resource references are not yet clickable backlinks.
- Published framework editing and full graph editing are not implemented.
- Full accessibility, cross-browser, concurrent-tab synchronization, and storage-quota failure testing remain outside this pass.
- The ledger's “sequence intact” label is illustrative and does not run an integrity check.

Stage 4 remains open for its unfinished file-selection/validation work. No later stage is marked complete by this verification.
