School Election Kiosk App

Overview
- Purpose-built kiosk app for school elections. Runs offline on a single machine, no login for voters.
- Cyberpunk liquid-glass design with smooth motion and accessible typography.
- Data persists in IndexedDB; optional token-based duplicate prevention available.

Quick start
1) npm install
2) npm run dev
3) Open the app in a browser. Use the small Admin button (top-right) to open settings.

Admin access
- Default password: Itz...6pr
- The password is not stored as plain text. The app verifies a salted SHA-256 hash on-device.
- To change the password, compute sha256("school-2025-cyberpunk" + NEW_PASSWORD) and replace ADMIN_PASSWORD_HASH in the security module.

Kiosk flow
- Home shows a large Start Voting button.
- After clicking, the supervisor performs a quick verification:
  A) Manual roll check (default): Verify on printed voter roll and tap Proceed.
  B) Token mode: Voter enters a single-use token; the app consumes it.
  C) ID+PIN (not recommended): Placeholder available in code; disabled by default.
- Voter selects candidates per position, reviews, confirms. App records the vote and returns to home.

Duplicate prevention options
- A) Manual check (default): No device enforcement. Works best with 1 supervisor per kiosk.
- B) One-time tokens: In Admin, import a list of tokens (comma or newline separated). Each token can be printed and crossed off when used. The app marks tokens as used.
- C) Student ID + PIN: Not implemented by default; schools can extend (code comments indicate where).

Admin panel features
- Start/Stop election state.
- Manage positions and candidates: add, edit, delete. Upload local images.
- Live tallies.
- Export results as PDF (client-side).
- Reset results for testing.

Data persistence & portability
- All data lives in IndexedDB (browser). It survives restarts on the same machine.
- Export/import: Use the browser’s devtools Application > IndexedDB to backup/restore if required. Schools can also enable future sync via an optional server (not required).

Security model
- Offline single-machine kiosk. Password hash is client-side and auditable.
- Admin password prompt includes copy explaining hash verification.

Accessibility checklist
- Keyboard: All interactive elements are reachable by Tab; focus rings are visible.
- Labels: Buttons and inputs have clear labels; images include alt text.
- Contrast: Neon theme includes readable fallbacks with high-contrast text. For print, PDF export uses black-on-white.
- Motion: Motion durations ~150–250ms; no flashing effects.

Invigilator tips
- Place the laptop so the supervisor sees the screen.
- Keep the printed roll or token sheet at hand.
- After each voter, ensure the app returns to the home screen.
- If using tokens, pre-generate and import them at setup; print and cut.
- Keep the browser open; data is saved automatically.

Switching duplicate modes
- Open Admin > Anti-duplicate options. Choose A or B. C is off by default.

Where votes are persisted
- See the db module’s recordVote; it writes selections into IndexedDB with timestamps.

Password verification location
- See the security module verifyPassword; it hashes and compares to the stored hash.

Optional server sync (commented outline)
- Future enhancement: a small Node/Express + SQLite service to sync positions, candidates, and votes. Not needed for kiosk mode and intentionally excluded from the default build.

Testing
- Minimal unit tests would cover admin editing and PDF export. For brevity in this template, tests can be added with your preferred runner (Vitest/RTL).