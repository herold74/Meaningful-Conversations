# Portable Memory Bank — install in another project

This folder is a **copy-paste kit** for the six-file Memory Bank pattern + a Cursor rule.

## 1. Copy the bank

Copy the **`memory-bank/`** directory from this template to the **root** of your target repo (same level as `README.md`).

Replace every `TODO` / placeholder in those files with real project content.

> **Tip:** You can copy **only** `memory-bank/` into another repo; keep **this `INSTALL.md`** (or the whole `templates/portable-memory-bank/` folder) somewhere you can reread for steps 2–3.

## 2. Add the Cursor rule

1. Ensure `.cursor/rules/` exists in the target project.
2. Copy **`cursor-rules/memory-bank.mdc`** to **`.cursor/rules/memory-bank.mdc`**.
3. Edit the rule file:
   - Adjust the **skills** row in the layers table (path and description), or remove that row if you do not use Agent Skills.
   - Optional: delete the **Stewardship** short paragraph if you do not want that agreement.
   - In **Maintenance**, change the reference from `core.mdc` to whatever your main always-on rule file is named.

## 3. Hook your “core” rule (recommended)

Paste the contents of **`snippets/core-rule-memory-bank-pointer.md`** into your primary Cursor rule file (e.g. `core.mdc`) so assistants know to refresh the bank after commits. Edit the path if your rule lives elsewhere.

## 4. Optional extras

- **`DOCUMENTATION/`** — If your project uses a docs folder, keep the table row in `memory-bank.mdc`; if not, remove or rewrite that row.
- **Optional memory-bank files** — Add e.g. `memory-bank/migration-plan.md` for temporary deep dives; fold into `systemPatterns.md` or docs when stable.
- **`memory-bank/README.md`** inside the template — Already included; update the “your project” line if needed.

## 5. Verify

Open a new agent chat and ask it to **read `memory-bank/activeContext.md` and summarize the current focus**. If the placeholders are still there, fill them in until the summary matches reality.

