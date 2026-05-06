# ⚖️ React Coding Law (PATTERNS)

> Mandatory rules for every line of code. Violation = **FAILURE**.

## 1. Logic Layers

Every piece of code MUST belong to exactly one of these 4 layers:

| Layer | Tool | Location | Rule |
|---|---|---|---|
| **UI Logic** | useState, useRef | Component / Hooks | Display & animation only. |
| **Business Logic** | Pure functions | `utils/` | **NO** React imports. Same input → same output. |
| **Infra Logic** | React Query | `hooks/` + `services/` | Server state (Fetch/Cache). |
| **App Logic** | Zustand | `stores/` | Global client state (Auth/Theme). |

### Decision Tree: Where does this code go?

1. **Does it import React/JSX?**
   - No → `utils/` (Business Logic)
2. **Does it call an API?**
   - Yes → `services/` + `hooks/` (React Query)
3. **Is state shared across pages/components?**
   - Yes → `stores/` (Zustand)
4. **Is state local to one component?**
   - Yes → `useState` inside component

---

## 2. DRY & Atomic Enforcement

Never repeat code. Build small → compose big.

### 2.1 Inventory Check (MANDATORY)
Before writing any complex JSX/CSS:
1. Scan `src/components/ui/` for existing components.
2. Found → **MUST reuse**.
3. Not found but reusable → **MUST create Atom** in `ui/` first.

### 2.2 Extraction Threshold
- **UI:** Tailwind > 3 lines or > 10 classes → **Create Atom**.
- **Logic:** Computation > 5 lines → **Create Util**.
- **Data:** API call with loading/error handling → **Create Hook**.

### 2.3 Atomic Flow
**Atoms** (`ui/`) → **Molecules** (`common/`) → **Pages**.
Pages must NOT contain detailed logic or complex styles.

---

## 3. Pre-Code Checklist

Before writing code, silently answer:
1. Which of the 4 layers does this belong to?
2. Does an existing UI component already handle this?
3. Am I stuffing logic into a Page? (If yes → stop and extract.)

---
> 💡 *For detailed Before/After examples, use the `architecture-refactor` skill.*
