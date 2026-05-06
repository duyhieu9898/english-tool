# LingoMe — Design System

> Visual identity and UI component tokens for the LingoMe project.

## 1. Style: Neubrutalism

- **Borders**: Thick black (`border-4 border-black`).
- **Shadows**: Hard, no blur (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`).
- **Colors**: High-saturation palette on high-contrast backgrounds.
- **Typography**: Bold (`font-black`), uppercase + wide tracking for CTAs.
- **Shapes**: Moderate rounding (`rounded-xl` / `rounded-2xl`), still rigid.

## 2. Color Tokens

| Role | Tailwind Class |
|---|---|
| Primary | `bg-blue-500` |
| Secondary | `bg-amber-300` |
| Success | `bg-lime-400` |
| Danger | `bg-red-500` |
| Neutral | `bg-white`, `bg-black`, `bg-gray-50` |

## 3. Component Catalog (`src/components/ui/`)

| Component | Purpose |
|---|---|
| **Button** | Variants: `primary`, `secondary`, `outline`, `danger`, `success`, `black`. Sizes: `sm`, `md`, `lg`. Built-in press effect. |
| **Badge** | Status/label with signature black border. |
| **Card** | Content container. |
| **ProgressBar** | Bold border + vibrant fill color. |
| **QuizOption** | States: `correct`, `incorrect`, `selected`. |
| **AnswerInput** | Input field for quiz exercises. |
| **Textarea** | Multi-line text input. |

---
> 💡 *Before creating a new component, check this catalog first. See [PATTERNS.md](./PATTERNS.md) for extraction rules.*
