# TailorSpace — What We Shipped This Sprint

**15–18 May 2026 · Live on tailorspace.uk**

---

## 1. Fixed: customers couldn't reset their password

**The problem:** When a customer (or a new team member being onboarded)
tried to set a new password, the page failed with a confusing error and
the password was never changed. This blocked people from getting into
their accounts.

**What we did:** Found the underlying cause, fixed it, and added a
safeguard so that even if something goes wrong in future, users see a
clear message instead of a cryptic error.

**Status:** ✅ Fixed and confirmed working on the live site.

---

## 2. Launched: orders can now be shared across multiple tailors

Previously an order went to a single tailor. Now an order's items can be
**automatically split across several tailors** based on their skills and
how busy they are. This unlocks faster turnaround and better use of the
tailor network.

What's included:
- **Smart auto-assignment** — when a runner collects an order, each item
  is routed to the best-suited available tailor automatically.
- **Fair payouts** — each tailor is paid for their own items; runners
  receive their delivery fee. Payouts are recorded automatically.
- **Clearer runner journeys** — the runner app now groups stops by
  tailor, so drop-offs and pickups are organised.

**Quality check before launch:** We reviewed the new work and caught
**three issues before they reached customers**, including one that could
have left some orders stuck and undeliverable. All three were fixed prior
to going live.

**Status:** ✅ Built, reviewed, fixed, and deployed to the live site.

---

## What's left / next steps

- **Hands-on testing** of the new multi-tailor flow using real tailor and
  runner accounts — main focus: confirming shared orders complete
  correctly and payouts are calculated as expected.
- **Minor housekeeping** items noted for a future tidy-up — none of these
  block customers or affect the live experience.

---

## Bottom line

Two meaningful wins this sprint: a customer-blocking login issue is
**resolved**, and a significant new capability — **multi-tailor orders** —
is **live**, with a quality review that caught and fixed problems before
they could affect customers. Remaining work is verification and polish,
not new risk.
