# Wealth Projector

A browser-based financial planning tool for modelling long-term wealth trajectories. You define **accounts** (savings, pension, brokerage, mortgage, etc.) and **transfers** (income, contributions, withdrawals, taxes) across a timeline. A monthly simulation engine computes balances forward and renders them as an interactive stacked chart.

All data is stored locally in `localStorage` — no backend, no account required.

---

## Getting started

```bash
npm install
npm run dev
```

---

## Core concepts

### Accounts

An account is a financial bucket that holds a balance. It has:

- **Initial balance** — the opening balance at the start of the simulation. Can be negative (e.g. a mortgage).
- **Initial principal ratio** — what fraction of the initial balance is principal (cost basis). The rest is treated as unrealised gain from day one. E.g. a brokerage account already worth more than you paid into it.
- **Growth rate + period** — annual rate (e.g. `0.07` = 7%), compounded at the chosen interval (monthly, quarterly, half-yearly, or yearly). Growth does not add to principal — it widens the gap between balance and principal, creating taxable gains.

Accounts have no start date — they are active for the entire simulation. Their initial balance is set by the `initialBalance` field.

### Transfers

A transfer moves value between two accounts (or from/to the outside world). Each transfer has:

- **Source / target** — either an account, or `null` for external. A null source is income from outside (salary, pension payments). A null target is money leaving the system (taxes paid out, expenses).
- **Start / end date** — the active window. `null` end date means it runs to the end of the simulation. Start date `null` means from the simulation start.
- **One-time** — fires exactly once at the start date. End date and period are ignored.
- **Period** — how often the transfer recurs: monthly, quarterly, half-yearly, or yearly. It fires every N months relative to its start date.
- **Amount type** — how the transfer amount is calculated each period:
  - `fixed` — a fixed currency amount per occurrence.
  - `percent-balance` — a fraction of the source account's balance (e.g. `0.04` = 4% per period). Uses `abs(balance)` so it works on negative-balance accounts too.
  - `gains-only` — the full unrealised gain on the source account (`balance − principal`). Used for periodic gains-tax or rebalancing. Resolves to 0 when there are no gains.
- **Inflation adjustment** — when enabled (and global inflation is on), a `fixed` transfer's amount scales upward each month to maintain real purchasing power.

#### Tax

Every transfer can have a tax rate applied to it. The tax reduces what the target receives; the source always loses the full resolved amount.

- **Tax basis `full`** — tax applies to the entire transferred amount. Use for income tax, pension drawdown tax, flat fees.
- **Tax basis `gains-fraction`** — tax applies only to the portion of the transfer that represents gains. The gains ratio is computed from the source account's balance vs principal at the time of transfer (`gainsRatio = gains / balance`). The rest of the amount is considered principal and passes through untaxed. Use for capital gains tax on brokerage withdrawals.

When `amountType` is `gains-only`, tax basis must be `full` (since the resolved amount is already purely gains — applying gains-fraction would double-discount).

### Simulation engine

The simulation runs month by month from `timelineStart` to `timelineEnd`. Each monthly tick has three phases, executed in this order:

1. **Income phase** — all transfers with a `null` source (external income) fire first, in the order they appear in the scenario.
2. **Per-account phase** — for each account (in scenario order):
   a. Growth is applied to the current balance.
   b. All outgoing transfers from that account fire, in scenario order.
3. **Bookkeeping** — principal is clamped and balances are recorded.

The **ordering of accounts and transfers matters**. Because each step reads the live balance (updated by previous steps in the same tick), an account higher in the list can "see" income that arrived earlier in that month. This is intentional and gives you fine-grained control over sequencing — e.g. ensuring a tax transfer fires after the gains have already been added by growth.

### Principal tracking

Every account tracks a `principal` value alongside its balance. Principal represents cost basis — money that has been contributed, not earned through growth.

- Deposits (transfer credits) increase principal by the net amount received.
- Withdrawals (transfer debits) reduce principal proportionally: `principalReduced = withdrawal × (principal / balance)`. This keeps the gains/principal ratio intact rather than drawing down one before the other.
- Growth never updates principal. Growth is what creates the gap between balance and principal.
- A `gains-only` self-transfer (tax on gains) resets `principal = balance` after the tax cost is deducted, marking all remaining balance as principal going forward.

### Inflation

When inflation is enabled, the simulation runs in nominal terms and the results are deflated for display:

```
displayBalance = nominalBalance / (1 + inflationRate)^(monthsElapsed / 12)
```

This converts all chart values to real terms in start-of-simulation money. You can also mark individual `fixed` transfers as inflation-adjusted, which scales their nominal amount upward each period so the real value stays constant.

---

## Interface

### Chart

A stacked area chart (D3) spanning the full simulation range. Accounts with positive balances stack upward; negative-balance accounts (debts) stack downward. A net-worth line overlays the stacked areas.

- **Legend** — toggle individual accounts on/off visually without removing them from the simulation.
- **Tooltip** — hover shows per-account balances and total net worth at the nearest month.
- **Today marker** — a vertical line marking the current calendar month.
- **Scroll + zoom** — scroll horizontally or use the mouse wheel to zoom. The viewport is independent of the simulation range; zooming does not retrigger simulation.

### Timeline

A horizontal ruler below the chart showing each account and transfer as a draggable bar.

- Drag the **left handle** to change start date.
- Drag the **right handle** to change end date.
- Drag the **body** to shift both dates.
- Click any bar to open its editor.
- One-time transfers appear as point markers rather than bars.
- **Anchors** — drag to create a vertical anchor line that snaps multiple item edges to the same date. Useful for grouping related events (e.g. retirement starts for several accounts and transfers all at once). Dragging the anchor moves all connected edges together.

### Editor panel

Selecting an account or transfer opens an editor panel on the right. Changes apply immediately and retrigger simulation in real time.

### Settings

Accessible via the gear icon. Contains:

- **Scenarios** — create, duplicate, delete, and switch between named scenarios.
- **Scenario name**
- **Timeline start / end** — the full simulation range.
- **Inflation rate** and enable toggle.
- **Currency symbol** and locale (BCP 47, e.g. `en-US`, `sv-SE`, `de-DE`).
- **Currency symbol position** — before or after the amount.
- **Export / Import** — download the scenario as a `.json` file or load one. Import validates the file before loading.

---

## Persistence and sharing

All scenarios are stored in `localStorage` as JSON under the key `wealth-projector`. The store is managed by Zustand with the persist middleware.

Export and import use the same JSON structure as the internal store. Exported files can be shared and imported on any device. The validator checks required fields, date formats, numeric types, and that all account references in transfers resolve to accounts present in the file.

---

## Tech stack

| Concern | Library |
|---|---|
| Framework | React 19 + Vite |
| Chart | D3.js |
| State | Zustand |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Tests | Vitest |

---

## Development

```bash
npm run dev      # start dev server
npm run build    # type-check + build
npm run test     # run simulation engine tests
npm run lint     # lint
```
