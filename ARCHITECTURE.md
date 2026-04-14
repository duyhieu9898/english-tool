# React Architecture Guide

> Hướng dẫn kiến trúc thực tiễn cho dự án React — lấy cảm hứng từ Feature-Sliced Design (FSD) và Clean Architecture, nhưng được đơn giản hóa để dễ học, dễ áp dụng.

Tài liệu này giúp bạn trả lời một câu hỏi đơn giản: **"Đoạn code này thuộc loại gì và nên đặt ở đâu?"**

Thay vì nhiều layer phức tạp, chúng ta chỉ cần phân biệt **4 loại logic** — mỗi loại có tool, vị trí, và cách test riêng. Component chỉ làm một việc: **compose các hook và render JSX**.

```text
┌─────────────────────────────────────────────────┐
│                  Component Layer                 │
│         (JSX + hook composition only)            │
├──────────┬──────────┬───────────┬───────────────┤
│ UI Logic │ Business │ Data      │ Application   │
│          │ Logic    │ Logic     │ Logic         │
├──────────┼──────────┼───────────┼───────────────┤
│ useState │ utils/   │ React     │ Zustand       │
│ useRef   │ pure fn  │ Query +   │ stores +      │
│ UI hooks │          │ services/ │ router/config │
└──────────┴──────────┴───────────┴───────────────┘
```

---

## 1. Phân loại Logic

### TL;DR

| Logic Type | Primary Tool | Location | Test Approach |
|---|---|---|---|
| UI Logic | useState, useRef, custom UI hooks | Component hoặc hooks/ | Integration test (render) |
| Business Logic | Pure functions | utils/ hoặc feature/logic/ | Unit test thuần (no mock) |
| Data Logic | React Query + axios/fetch | hooks/ + services/ | Hook test (mock API) |
| Application Logic | Zustand + React Router | stores/ + App config | Unit test (mock store) |
| Persistence | Zustand persist middleware | stores/ (→ localStorage) | Unit test (mock storage) |

### 1.1 UI Logic

Logic liên quan trực tiếp đến giao diện người dùng — quản lý state hiển thị, animation, form validation ở mức UI, và conditional rendering. Đây là logic "nhìn thấy được" trên màn hình.

**Ví dụ trong React app:**
- `useState` để toggle modal open/close, show/hide sidebar
- `useRef` để focus input, scroll to element
- Custom hook `useDebounce` cho search input
- Logic conditional rendering: hiển thị skeleton khi loading, error message khi fail
- Form validation trực quan: highlight field lỗi, hiển thị error text

**Tiêu chí phân biệt:**
- ✅ Sử dụng React API (`useState`, `useRef`, `useEffect` cho DOM)
- ✅ Thay đổi trực tiếp những gì user nhìn thấy trên UI
- ✅ Chỉ có ý nghĩa trong context của React component
- ❌ Không chứa business rule hay tính toán nghiệp vụ
- ❌ Không gọi API hay tương tác với server

### 1.2 Business Logic

Logic nghiệp vụ cốt lõi — các quy tắc, tính toán, và data transformation không phụ thuộc vào React hay bất kỳ framework nào. Đây là logic có thể chạy trong Node.js, Deno, hay bất kỳ môi trường JavaScript nào.

**Ví dụ trong React app:**
- Hàm `calculateScore(answers)` tính điểm bài kiểm tra
- Hàm `formatCurrency(amount, locale)` format số tiền
- Hàm `filterExpiredItems(items)` lọc item hết hạn
- Hàm `validateEmail(email)` kiểm tra email hợp lệ (business rule, không phải UI validation)
- Hàm `transformApiResponse(raw)` chuyển đổi data từ API sang format app cần

**Tiêu chí phân biệt:**
- ✅ Pure function: cùng input → luôn cùng output
- ✅ Không import React, không dùng hook, không dùng JSX
- ✅ Có thể test bằng unit test thuần (không cần render, không cần mock)
- ✅ Có thể copy sang dự án khác (không phải React) mà vẫn chạy
- ❌ Không có side effect (không gọi API, không đọc/ghi storage)

### 1.3 Data Logic

Logic liên quan đến việc fetch, cache, sync, và transform dữ liệu từ server. Bao gồm React Query hooks (quản lý server state) và API service layer (thực hiện HTTP request thuần).

**Ví dụ trong React app:**
- React Query hook `useVocabulary(id)` fetch và cache danh sách từ vựng
- React Query mutation `useCreateCard()` tạo flashcard mới với optimistic update
- Service function `api.getVocabulary(id)` gọi HTTP GET (không import React)
- Query key factory `queryKeys.vocabulary.detail(id)` quản lý cache key
- Prefetch data cho route tiếp theo bằng `queryClient.prefetchQuery`

**Tiêu chí phân biệt:**
- ✅ Liên quan đến dữ liệu từ server (fetch, create, update, delete)
- ✅ Sử dụng React Query cho caching, background refetch, optimistic update
- ✅ Service layer chỉ chứa HTTP call thuần (axios/fetch), không import React
- ✅ Quản lý server state: loading, error, stale, refetch
- ❌ Không quản lý client-only state (UI state, user preferences)

### 1.4 Application Logic

Logic điều phối ứng dụng ở mức cao — routing, authentication flow, global state management, và error boundaries. Đây là logic "kết nối" các phần của app lại với nhau.

**Ví dụ trong React app:**
- Zustand store `useAuthStore` quản lý trạng thái đăng nhập, token, user info
- Zustand store `useThemeStore` quản lý theme (dark/light) với persist middleware
- Route guard kiểm tra authentication trước khi cho phép truy cập trang
- Error boundary bắt lỗi runtime và hiển thị fallback UI
- App-level config: base URL, feature flags, environment variables

**Tiêu chí phân biệt:**
- ✅ Ảnh hưởng đến toàn bộ app hoặc nhiều feature cùng lúc
- ✅ Quản lý client-only state được chia sẻ giữa nhiều component
- ✅ Sử dụng Zustand store hoặc React Router
- ✅ Cần persist qua page reload (Zustand persist → localStorage)
- ❌ Không phải server data (đó là Data Logic)
- ❌ Không phải logic chỉ dùng trong 1 component (đó là UI Logic)

### Bảng quyết định: Code này thuộc loại gì?

Trả lời lần lượt các câu hỏi dưới đây. Dừng lại ở câu đầu tiên bạn trả lời **Có**.

| # | Câu hỏi | Có → Kết luận | Không → |
|---|---------|---------------|---------|
| 1 | Code có import React hoặc dùng hook/JSX không? | Tiếp câu 2 | **Business Logic** → `utils/` |
| 2 | Code có gọi API / HTTP request (fetch, axios)? | **Data Logic** → `services/` + `hooks/` (React Query) | Tiếp câu 3 |
| 3 | Code có quản lý state chia sẻ giữa nhiều component? | **Application Logic** → `stores/` (Zustand) | Tiếp câu 4 |
| 4 | Code có cần persist data qua page reload? | **Application Logic** → `stores/` (Zustand persist) | Tiếp câu 5 |
| 5 | Code chỉ quản lý state/UI trong 1 component? | **UI Logic** → `useState`/`useRef` trong component | Tiếp câu 6 |
| 6 | Code là custom hook đóng gói logic UI phức tạp? | **UI Logic** → `hooks/` hoặc feature folder | Xem lại câu 1 |

**Ví dụ nhanh:**

```text
calculateScore(answers)
  → Câu 1: Không import React → Business Logic ✅

useVocabulary(id)  // gọi API qua React Query
  → Câu 1: Có (dùng hook) → Câu 2: Có (gọi API) → Data Logic ✅

useAuthStore  // Zustand store, dùng ở nhiều page
  → Câu 1: Có → Câu 2: Không → Câu 3: Có (shared state) → Application Logic ✅

useState để toggle modal
  → Câu 1: Có → Câu 2: Không → Câu 3: Không → Câu 4: Không → Câu 5: Có → UI Logic ✅
```

> 💡 **Mẹo:** Nếu một đoạn code vừa chứa business logic vừa dùng React, đó là dấu hiệu cần **tách** — extract phần tính toán thuần ra `utils/`, giữ phần React trong hook/component.

---

## 2. Tách Logic khỏi Component

Nguyên tắc cốt lõi: **Component chỉ nên chứa JSX, event handler delegation, và composition của hooks.** Logic nặng — tính toán phức tạp, gọi API, quản lý nhiều state đan xen — nên được extract ra ngoài. Tuy nhiên, UI side effects đơn giản gắn liền với user action (confetti, sound effect, toast notification) được phép nằm trong event handler của component — tách chúng ra thường là over-engineering.

Section này hướng dẫn cách tách từng loại logic ra khỏi component, với ví dụ before/after cụ thể.

### 2.1 Business Logic → Pure Function

**Nguyên tắc:**

- Business logic phải là **pure function**: cùng input → luôn cùng output, không có side effect
- **Không import React** — không dùng hook, không dùng JSX, không dùng context
- Đặt trong `utils/` hoặc `feature/logic/` — có thể chạy ở bất kỳ môi trường JS nào
- Test bằng **unit test thuần** — không cần render component, không cần mock

**❌ Before — Business logic trộn lẫn trong component:**

```tsx
// pages/quiz/QuizResult.tsx
import { useState, useEffect } from "react";

interface Answer {
  questionId: string;
  selected: string;
  correct: string;
}

export function QuizResult({ answers }: { answers: Answer[] }) {
  const [score, setScore] = useState(0);
  const [grade, setGrade] = useState("");
  const [summary, setSummary] = useState("");

  useEffect(() => {
    // ❌ Business logic nằm trong useEffect
    const correctCount = answers.filter(
      (a) => a.selected === a.correct
    ).length;
    const percentage = Math.round((correctCount / answers.length) * 100);
    setScore(percentage);

    // ❌ Quy tắc nghiệp vụ nằm trong component
    if (percentage >= 90) setGrade("A");
    else if (percentage >= 80) setGrade("B");
    else if (percentage >= 70) setGrade("C");
    else if (percentage >= 60) setGrade("D");
    else setGrade("F");

    // ❌ Format logic cũng nằm trong component
    setSummary(`${correctCount}/${answers.length} câu đúng (${percentage}%)`);
  }, [answers]);

  return (
    <div>
      <h2>Kết quả: {grade}</h2>
      <p>{summary}</p>
      <p>Điểm: {score}%</p>
    </div>
  );
}
```

**Vấn đề:**
- Không thể test logic tính điểm mà không render component
- Logic xếp hạng (grade) bị gắn chặt vào React lifecycle (`useEffect`)
- Nếu cần dùng lại `calculateScore` ở trang khác → phải copy code
- `useEffect` + `setState` gây re-render không cần thiết

**✅ After — Extract business logic ra pure function:**

```ts
// utils/quiz.utils.ts — Pure function, không import React
interface Answer {
  questionId: string;
  selected: string;
  correct: string;
}

interface QuizScore {
  percentage: number;
  grade: string;
  summary: string;
}

export function calculateQuizScore(answers: Answer[]): QuizScore {
  if (answers.length === 0) {
    return { percentage: 0, grade: "F", summary: "0/0 câu đúng (0%)" };
  }

  const correctCount = answers.filter(
    (a) => a.selected === a.correct
  ).length;
  const percentage = Math.round((correctCount / answers.length) * 100);

  const grade =
    percentage >= 90 ? "A" :
    percentage >= 80 ? "B" :
    percentage >= 70 ? "C" :
    percentage >= 60 ? "D" : "F";

  const summary = `${correctCount}/${answers.length} câu đúng (${percentage}%)`;

  return { percentage, grade, summary };
}
```

```tsx
// pages/quiz/QuizResult.tsx — Component chỉ render
import { calculateQuizScore } from "../../utils/quiz.utils";

interface Answer {
  questionId: string;
  selected: string;
  correct: string;
}

export function QuizResult({ answers }: { answers: Answer[] }) {
  // ✅ Gọi pure function — không cần useState, không cần useEffect
  const { percentage, grade, summary } = calculateQuizScore(answers);

  return (
    <div>
      <h2>Kết quả: {grade}</h2>
      <p>{summary}</p>
      <p>Điểm: {percentage}%</p>
    </div>
  );
}
```

**Kết quả:**
- `calculateQuizScore` là pure function → test dễ dàng với nhiều bộ input khác nhau
- Component không còn `useEffect` + `setState` → render nhanh hơn, ít bug hơn
- Logic tính điểm có thể tái sử dụng ở bất kỳ đâu (trang khác, API, script)
- Tách biệt rõ ràng: **utils/** chứa "cái gì", **component** chứa "hiển thị thế nào"

### 2.2 Data Logic → Service Layer + React Query Hook

**Nguyên tắc:**

- Áp dụng **2-layer approach**: `services/` chứa HTTP call thuần (không import React), `hooks/` chứa React Query wrapper
- **Service layer** (`services/`) — pure function gọi axios/fetch, nhận params và trả về Promise. Có thể dùng lại ở bất kỳ đâu (script, test, SSR)
- **React Query hook** (`hooks/`) — wrap service function bằng `useQuery`/`useMutation`, quản lý caching, loading, error, refetch
- Component **chỉ gọi hook** — không biết về HTTP, không biết về cache strategy
- Sử dụng **Query Key Factory** để quản lý cache key nhất quán, tránh typo và dễ invalidate
- Áp dụng **Query Options pattern** (TkDodo v5+) để tái sử dụng query config giữa `useQuery`, `prefetchQuery`, và `ensureQueryData`

**❌ Before — API call trực tiếp trong component:**

```tsx
// pages/vocabulary/VocabularyList.tsx
import { useState, useEffect } from "react";
import axios from "axios";

interface Word {
  id: string;
  term: string;
  definition: string;
}

export function VocabularyList({ deckId }: { deckId: string }) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchWords = async () => {
      try {
        setLoading(true);
        setError(null);
        // ❌ API call trực tiếp trong component
        const res = await axios.get(`/api/decks/${deckId}/words`);
        if (!cancelled) {
          setWords(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Không thể tải danh sách từ vựng");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchWords();
    return () => { cancelled = true; };
  }, [deckId]);

  // ❌ Phải tự quản lý loading/error state
  if (loading) return <p>Đang tải...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {words.map((w) => (
        <li key={w.id}>{w.term} — {w.definition}</li>
      ))}
    </ul>
  );
}
```

**Vấn đề:**
- Component phải tự quản lý `loading`, `error`, `cancelled` — boilerplate lặp lại ở mọi trang
- Không có caching — mỗi lần mount lại gọi API, UX chậm
- Không có background refetch, stale-while-revalidate, hay retry
- API URL nằm rải rác trong component — khó thay đổi endpoint
- Không thể reuse logic fetch ở component khác mà không copy code

**✅ After — Tách thành 3 layer:**

```ts
// services/vocabulary.service.ts — Pure HTTP, không import React
import { httpClient } from "./http";

export interface Word {
  id: string;
  term: string;
  definition: string;
}

export interface CreateWordDto {
  term: string;
  definition: string;
}

// ✅ Pure function — nhận params, trả về Promise
export async function getWords(deckId: string): Promise<Word[]> {
  const res = await httpClient.get<Word[]>(`/api/decks/${deckId}/words`);
  return res.data;
}

export async function createWord(
  deckId: string,
  dto: CreateWordDto
): Promise<Word> {
  const res = await httpClient.post<Word>(`/api/decks/${deckId}/words`, dto);
  return res.data;
}
```

```ts
// hooks/queryKeys.ts — Query Key Factory
export const queryKeys = {
  vocabulary: {
    all: ["vocabulary"] as const,
    lists: () => [...queryKeys.vocabulary.all, "list"] as const,
    list: (deckId: string) =>
      [...queryKeys.vocabulary.lists(), deckId] as const,
  },
  // ...thêm các domain khác
};
```

```ts
// hooks/useVocabulary.ts — React Query hook wraps service
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";
import {
  getWords,
  createWord,
  type CreateWordDto,
} from "../services/vocabulary.service";

// ✅ Query Options pattern (TkDodo v5+) — tái sử dụng config
// Dùng được cho useQuery, prefetchQuery, ensureQueryData
export function wordListQueryOptions(deckId: string) {
  return {
    queryKey: queryKeys.vocabulary.list(deckId),
    queryFn: () => getWords(deckId),
    staleTime: 5 * 60 * 1000, // 5 phút
  };
}

// ✅ Hook cho component — chỉ wrap service + cấu hình cache
export function useWordList(deckId: string) {
  return useQuery(wordListQueryOptions(deckId));
}

// ✅ Mutation hook với auto-invalidation
export function useCreateWord(deckId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWordDto) => createWord(deckId, dto),
    onSuccess: () => {
      // Invalidate list để refetch data mới
      queryClient.invalidateQueries({
        queryKey: queryKeys.vocabulary.lists(),
      });
    },
  });
}
```

```tsx
// pages/vocabulary/VocabularyList.tsx — Component chỉ dùng hook
import { useWordList } from "../../hooks/useVocabulary";

export function VocabularyList({ deckId }: { deckId: string }) {
  // ✅ Một dòng — React Query lo hết loading, error, caching, refetch
  const { data: words, isPending, error } = useWordList(deckId);

  if (isPending) return <p>Đang tải...</p>;
  if (error) return <p>Không thể tải danh sách từ vựng</p>;

  return (
    <ul>
      {words.map((w) => (
        <li key={w.id}>{w.term} — {w.definition}</li>
      ))}
    </ul>
  );
}
```

**Kết quả:**
- **Service layer** (`services/`) — pure function, dễ test, dễ reuse, không phụ thuộc React
- **React Query hook** (`hooks/`) — quản lý cache, background refetch, stale-while-revalidate tự động
- **Component** — chỉ gọi hook và render, không biết về HTTP hay cache strategy
- **Query Key Factory** — quản lý cache key tập trung, dễ invalidate chính xác
- **Query Options pattern** — tái sử dụng config cho `useQuery`, `prefetchQuery` (route loader), và `ensureQueryData`

> 💡 **Khi nào dùng Query Options pattern?** Khi bạn cần prefetch data trước khi navigate (route loader), hoặc muốn share cùng query config giữa nhiều nơi. Nếu chỉ dùng `useQuery` ở 1 chỗ, hook đơn giản là đủ.

### 2.3 UI Logic → Custom Hook

**Nguyên tắc:**

- Khi component có **nhiều `useState` + `useEffect` đan xen** để xử lý một tính năng UI (debounce, keyboard navigation, animation...), đó là dấu hiệu cần extract ra custom hook
- Custom hook đóng gói **toàn bộ state + side effect** liên quan đến một tính năng UI, trả về interface gọn cho component
- Đặt trong **cùng feature folder** (nếu chỉ dùng ở 1 nơi) hoặc `hooks/` (nếu dùng chung)
- Hook chỉ chứa **UI logic** — không chứa business rule hay API call (đó là Business Logic và Data Logic)
- Tên hook mô tả tính năng UI: `useSearchInput`, `useDropdown`, `useInfiniteScroll`

**❌ Before — UI logic phức tạp trộn lẫn trong component:**

```tsx
// pages/vocabulary/VocabularySearch.tsx
import { useState, useEffect, useRef, useCallback } from "react";

interface SearchResult {
  id: string;
  term: string;
}

export function VocabularySearch({
  items,
}: {
  items: SearchResult[];
}) {
  // ❌ Nhiều useState đan xen cho 1 tính năng search
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // ❌ useEffect cho debounce — logic UI nằm rải rác
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ❌ useEffect cho filter — phụ thuộc debouncedQuery
  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const filtered = items.filter((item) =>
      item.term.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
    setResults(filtered);
    setIsOpen(filtered.length > 0);
    setActiveIndex(-1);
  }, [debouncedQuery, items]);

  // ❌ Keyboard handler phức tạp nằm trong component
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          if (activeIndex >= 0) {
            setQuery(results[activeIndex].term);
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, activeIndex]
  );

  // ❌ Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm từ vựng..."
      />
      {isOpen && (
        <ul ref={listRef} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => {
                setQuery(r.term);
                setIsOpen(false);
              }}
            >
              {r.term}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Vấn đề:**
- 5 `useState` + 4 `useEffect`/`useCallback` cho một tính năng search — component quá phức tạp
- Logic debounce, filter, keyboard navigation, scroll đan xen — khó đọc, khó debug
- Không thể reuse logic search ở component khác (ví dụ: search user, search deck)
- Khó test: phải render toàn bộ component chỉ để test logic keyboard navigation

**✅ After — Extract UI logic ra custom hook:**

```ts
// pages/vocabulary/useSearchInput.ts — Custom hook đóng gói UI logic
import { useState, useEffect, useRef, useCallback } from "react";

interface UseSearchInputOptions<T> {
  items: T[];
  filterFn: (item: T, query: string) => boolean;
  onSelect: (item: T) => void;
  debounceMs?: number;
}

interface UseSearchInputReturn<T> {
  query: string;
  setQuery: (value: string) => void;
  results: T[];
  isOpen: boolean;
  activeIndex: number;
  listRef: React.RefObject<HTMLUListElement | null>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export function useSearchInput<T>({
  items,
  filterFn,
  onSelect,
  debounceMs = 300,
}: UseSearchInputOptions<T>): UseSearchInputReturn<T> {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Filter items khi debounced query thay đổi
  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const filtered = items.filter((item) => filterFn(item, debouncedQuery));
    setResults(filtered);
    setIsOpen(filtered.length > 0);
    setActiveIndex(-1);
  }, [debouncedQuery, items, filterFn]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.children[activeIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          if (activeIndex >= 0) {
            onSelect(results[activeIndex]);
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, activeIndex, onSelect]
  );

  return {
    query,
    setQuery,
    results,
    isOpen,
    activeIndex,
    listRef,
    handleKeyDown,
  };
}
```

```tsx
// pages/vocabulary/VocabularySearch.tsx — Component chỉ render
import { useSearchInput } from "./useSearchInput";

interface SearchResult {
  id: string;
  term: string;
}

export function VocabularySearch({
  items,
}: {
  items: SearchResult[];
}) {
  // ✅ Một hook — toàn bộ logic search được đóng gói
  const {
    query,
    setQuery,
    results,
    isOpen,
    activeIndex,
    listRef,
    handleKeyDown,
  } = useSearchInput({
    items,
    filterFn: (item, q) =>
      item.term.toLowerCase().includes(q.toLowerCase()),
    onSelect: (item) => setQuery(item.term),
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm từ vựng..."
      />
      {isOpen && (
        <ul ref={listRef} role="listbox">
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => {
                setQuery(r.term);
              }}
            >
              {r.term}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Kết quả:**
- Component giảm từ ~80 dòng logic xuống còn ~30 dòng — chỉ render JSX và gọi hook
- `useSearchInput` là **generic** — dùng lại cho bất kỳ search nào (user, deck, tag...) chỉ cần thay `filterFn`
- Logic debounce, keyboard navigation, scroll được **đóng gói** — dễ debug, dễ test riêng
- Tách biệt rõ ràng: **hook** quản lý "state + behavior", **component** quản lý "hiển thị thế nào"

> 💡 **Khi nào cần extract UI logic ra hook?**
> - ✅ **Bắt buộc** khi: cùng stateful logic lặp lại ở **≥2 component** (ví dụ: `useQuizFlow` dùng chung cho Grammar, Reading, Listening).
> - ⚠️ **Cân nhắc** khi: component quá lớn và nhiều state đan xen — nhưng đây là quyết định của developer, không phải quy tắc cứng.
> - 🔄 **Thay thế**: trước khi nghĩ đến hook, hãy xét **chia nhỏ component** trước. Tách sub-component (ví dụ: `QuizCard`, `HintPanel`, `SpeedControl`) giảm kích thước mà không thêm abstraction layer. Hook chỉ cần khi logic có state phức tạp cần đóng gói, không phải khi JSX dài.

### 2.4 Application Logic → Zustand Store

**Nguyên tắc:**

- Global/shared client state (auth, theme, sidebar, notification...) phải được quản lý bằng **Zustand store riêng biệt**, tách hoàn toàn khỏi component
- Mỗi domain có **một store file riêng** trong `stores/` — không gộp tất cả state vào một store khổng lồ
- Store chỉ chứa **client-only state** — server data thuộc về React Query (Data Logic), không đặt trong Zustand
- Component **chỉ gọi store hook** (`useAuthStore`) — không biết về cách state được lưu trữ hay persist
- Sử dụng **Zustand persist middleware** khi cần giữ state qua page reload (auth token, theme preference, language setting)
- Tên file theo convention: `*.store.ts` — ví dụ: `auth.store.ts`, `theme.store.ts`

**❌ Before — Auth state quản lý bằng useState + Context, truyền qua props:**

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ❌ Provider component phình to với logic auth
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // ❌ useEffect đọc localStorage — side effect trong component
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ❌ Logic login nằm trong Provider
  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
  };

  // ❌ Logic logout cũng nằm trong Provider
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ❌ Custom hook chỉ để unwrap context — boilerplate
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

```tsx
// App.tsx — Phải wrap toàn bộ app trong Provider
import { AuthProvider } from "./contexts/AuthContext";

export function App() {
  return (
    // ❌ Thêm Provider → thêm nesting, nhiều context → "Provider hell"
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
```

**Vấn đề:**
- `AuthProvider` vừa quản lý state, vừa gọi API, vừa đọc/ghi localStorage — vi phạm single responsibility
- Mỗi khi `user` hoặc `token` thay đổi, **toàn bộ children** re-render (Context không có selector)
- Thêm nhiều global state (theme, sidebar, notification) → "Provider hell" với nhiều tầng nesting
- Logic persist (localStorage) nằm rải rác, dễ quên sync khi thêm field mới
- Không thể truy cập auth state **ngoài React** (ví dụ: trong axios interceptor)

**✅ After — Extract auth state ra Zustand store:**

```ts
// stores/auth.store.ts — Zustand store, tách biệt hoàn toàn khỏi component
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

// ✅ Zustand store với persist middleware → tự động sync localStorage
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,

      // Actions
      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // key trong localStorage
      partialize: (state) => ({
        // ✅ Chỉ persist những field cần thiết
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

```tsx
// pages/login/LoginPage.tsx — Component chỉ gọi store hook
import { useAuthStore } from "../../stores/auth.store";
import { loginApi } from "../../services/auth.service";

export function LoginPage() {
  // ✅ Selector — chỉ re-render khi setAuth thay đổi
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async (email: string, password: string) => {
    const { user, token } = await loginApi(email, password);
    setAuth(user, token);
  };

  return (
    <form onSubmit={/* gọi handleLogin */}>
      {/* form fields */}
    </form>
  );
}
```

```tsx
// components/layout/UserMenu.tsx — Đọc auth state từ store
import { useAuthStore } from "../../stores/auth.store";

export function UserMenu() {
  // ✅ Selector — chỉ lấy những gì cần, tránh re-render thừa
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  return (
    <div>
      <span>{user.name}</span>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}
```

```ts
// services/http.ts — Truy cập auth state NGOÀI React (axios interceptor)
import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

export const httpClient = axios.create({ baseURL: "/api" });

httpClient.interceptors.request.use((config) => {
  // ✅ Zustand cho phép đọc state ngoài React bằng getState()
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Kết quả:**
- **Store** (`stores/auth.store.ts`) — quản lý state + actions tập trung, không phụ thuộc React lifecycle
- **Persist middleware** — tự động sync localStorage, không cần viết `useEffect` + `localStorage.setItem` thủ công
- **Selector** (`useAuthStore((s) => s.user)`) — chỉ re-render component khi field được chọn thay đổi, hiệu năng tốt hơn Context
- **Không cần Provider** — bỏ hoàn toàn `AuthProvider`, không còn "Provider hell"
- **Truy cập ngoài React** — `useAuthStore.getState()` dùng được trong axios interceptor, utility function, hay bất kỳ đâu

> 💡 **Zustand persist middleware** hỗ trợ nhiều storage backend (localStorage, sessionStorage, AsyncStorage cho React Native). Chỉ cần thêm option `storage` trong config. Dùng `partialize` để chọn lọc field cần persist — tránh lưu state tạm thời (loading, error) vào storage.

### 2.5 Component Rule — Quy tắc vàng

> **Component chỉ nên chứa JSX, event handler delegation, và composition của hooks — logic nặng nên được extract ra ngoài.**

Đây là tổng kết của toàn bộ Section 2. Nếu bạn chỉ nhớ một quy tắc duy nhất, hãy nhớ quy tắc này.

**✅ Thuộc về component:**

| Được phép | Ví dụ |
|---|---|
| JSX / markup | `<div>`, `<Button>`, conditional rendering |
| Hook composition | `useWordList(deckId)`, `useAuthStore((s) => s.user)` |
| Event handler delegation | `onClick={() => mutation.mutate(data)}` |
| Derived values đơn giản | `const isReady = data && !isPending` |
| UI side effects gắn liền action | `confetti()`, `sounds.correct()`, `toast.success()` trong handler |

**❌ Cần extract ra ngoài:**

| Không nên | Extract đến đâu |
|---|---|
| Tính toán / transformation | `utils/` — pure function (§2.1) |
| API call / HTTP request | `services/` + `hooks/` — React Query (§2.2) |
| Nhiều useState đan xen cho 1 tính năng | Custom hook trong feature folder (§2.3) |
| Global / shared state | `stores/` — Zustand (§2.4) |

**⚠️ Không cần extract:**

| Tình huống | Lý do giữ trong component |
|---|---|
| UI feedback đơn giản (confetti, sound, toast) | Gắn chặt với user action, tách ra chỉ thêm indirection mà không có lợi ích test hay reuse |
| 1-2 `useState` đơn giản (toggle, local input) | Chưa đủ phức tạp để justify một custom hook |
| Derived value 1 dòng | `const isEmpty = items.length === 0` — không cần utils |

**So sánh nhanh:**

```text
❌ Messy Component                    ✅ Clean Component
─────────────────────                 ─────────────────────
useState x 5                          useSearchInput(...)
useEffect cho debounce                useWordList(deckId)
useEffect cho API call                useAuthStore(...)
axios.get trực tiếp
business logic inline                 return <JSX />
localStorage.getItem
return <JSX />
```

**Checklist khi review component:**

- [ ] Component có nhiều useState nhưng logic không lặp lại ở component khác? (Nếu lặp → extract shared hook. Nếu không → cân nhắc chia nhỏ component trước)
- [ ] Không có `useEffect` gọi API? (→ React Query)
- [ ] Không có tính toán/transform phức tạp inline? (→ `utils/`)
- [ ] Không đọc/ghi localStorage trực tiếp? (→ Zustand persist)
- [ ] Phần lớn code là JSX, không phải logic?

Nếu tất cả đều ✅ — component của bạn đã clean. Nếu không, quay lại §2.1–§2.4 để tìm pattern phù hợp.


---

## 3. Folder Structure

### Cây thư mục tổng quan

```text
src/
├── components/          # Shared/reusable UI components
│   ├── ui/              # Primitive UI (Button, Input, Modal...)
│   ├── common/          # Composed shared components
│   └── layout/          # Layout components (AppLayout, Sidebar...)
├── pages/               # Route-level components (thin, compose features)
├── hooks/               # Shared custom hooks (data hooks, utility hooks)
├── services/            # API service layer (pure HTTP, no React)
├── stores/              # Zustand stores (Application Logic / client state)
├── utils/               # Pure utility functions (Business Logic)
├── types/               # TypeScript type definitions
└── config/              # App configuration, constants
```

### Mô tả chi tiết từng thư mục

| Thư mục | Loại Logic | Mục đích |
|---|---|---|
| `components/ui/` | UI Logic | Chứa các primitive UI component tái sử dụng (Button, Input, Modal...) — không chứa business logic |
| `components/common/` | UI Logic | Chứa các composed component dùng chung, kết hợp nhiều primitive UI (SearchBar, DataTable...) |
| `components/layout/` | UI Logic | Chứa các layout component định hình bố cục trang (AppLayout, Sidebar, Header...) |
| `pages/` | Composition | Chứa route-level component — mỗi page là một "thin" component chỉ compose hooks và render JSX |
| `hooks/` | Data Logic / UI Logic | Chứa shared custom hooks: React Query hooks (data fetching), query key factory, và utility hooks dùng chung |
| `services/` | Data Logic | Chứa API service layer — pure HTTP function (axios/fetch), không import React, có thể dùng ngoài React |
| `stores/` | Application Logic | Chứa Zustand stores quản lý client-only state chia sẻ giữa nhiều component (auth, theme, sidebar...) |
| `utils/` | Business Logic | Chứa pure function — tính toán, transformation, validation nghiệp vụ, không phụ thuộc React |
| `types/` | — | Chứa TypeScript type/interface definitions dùng chung toàn app |
| `config/` | Application Logic | Chứa app configuration, constants, environment variables, feature flags |

> 💡 **Nguyên tắc:** Mỗi thư mục có một trách nhiệm rõ ràng tương ứng với một loại logic trong hệ thống phân loại ở Section 1. Khi không biết file nên đặt ở đâu, quay lại bảng quyết định ở §1 để xác định loại logic trước, rồi tra bảng trên để tìm thư mục phù hợp.

### Quy tắc đặt tên file

| Loại file | Pattern | Ví dụ |
|---|---|---|
| Hooks | `use*.ts` | `useVocabulary.ts`, `useSearchInput.ts` |
| Services | `*.service.ts` | `vocabulary.service.ts`, `auth.service.ts` |
| Stores | `*.store.ts` | `auth.store.ts`, `theme.store.ts` |
| Utils | `*.utils.ts` | `quiz.utils.ts`, `format.utils.ts` |
| Types | `*.types.ts` | `vocabulary.types.ts`, `auth.types.ts` |
| Components | `PascalCase.tsx` | `VocabularyList.tsx`, `LoginPage.tsx` |
| Query keys | `queryKeys.ts` | Một file duy nhất trong `hooks/` |

### Ví dụ: Feature folder cho Vocabulary

> **Quy tắc:** Khi feature có > 3 file liên quan → nhóm vào feature folder thay vì để rải rác.

Giả sử trang Vocabulary có page component, sub-component, hook riêng, utils, và types — tổng cộng 5 file. Thay vì để rải rác trong `pages/`, ta nhóm vào feature folder:

```text
pages/vocabulary/
├── VocabularyList.tsx          # Page component (thin, compose hooks)
├── VocabularySearch.tsx         # Sub-component
├── useVocabularyPage.ts         # UI/composition hook cho page này
├── vocabulary.utils.ts          # Business logic riêng cho feature này
└── vocabulary.types.ts          # Types riêng cho feature này
```

**Feature folder chỉ chứa code riêng của feature.** Code dùng chung vẫn nằm ở shared folders:

```text
hooks/useVocabulary.ts           # React Query hook — shared data hook (Data Logic)
services/vocabulary.service.ts   # API layer — pure HTTP (Data Logic)
```

**Cách phân biệt:**

| File | Thuộc về | Lý do |
|---|---|---|
| `useVocabularyPage.ts` | Feature folder (`pages/vocabulary/`) | Hook chỉ dùng cho page này — compose nhiều hook, quản lý UI state |
| `useVocabulary.ts` | Shared folder (`hooks/`) | React Query hook fetch data — có thể dùng ở nhiều page khác |
| `vocabulary.utils.ts` | Feature folder (`pages/vocabulary/`) | Business logic chỉ dùng trong feature này |
| `vocabulary.service.ts` | Shared folder (`services/`) | API call thuần — dùng chung cho hook, test, script |

> 💡 **Nguyên tắc đơn giản:** Nếu chỉ 1 page/feature dùng → đặt trong feature folder. Nếu ≥2 nơi dùng → chuyển ra shared folder (`hooks/`, `utils/`, `services/`).


---

## 4. Stack Guide + Anti-Patterns

### Vai trò từng tool trong stack

| Tool | Vai trò | Ranh giới | Không nên dùng cho |
|---|---|---|---|
| utils (pure functions) | Tính toán, transformation, validation nghiệp vụ | Không import React, không side effect | UI state, API call |
| React Query | Server state management: fetch, cache, sync | Chỉ cho data từ server | Client-only state (theme, sidebar) |
| Zustand | Client state management: global/shared state | Chỉ cho client-only state | Server data (dùng React Query) |
| Custom hooks | Đóng gói và tái sử dụng logic React | Composition layer | Business logic thuần (dùng utils) |
| services (axios/fetch) | HTTP layer: gọi API thuần | Không import React | Caching, state management |
| localStorage | Persist data qua page reload | Qua Zustand persist middleware | Truy cập trực tiếp trong component |

### React Query vs Zustand — Ranh giới rõ ràng

Sai lầm phổ biến nhất khi dùng cả React Query lẫn Zustand: **không phân biệt được server state và client state**. Kết quả là data bị duplicate, cache bị stale, và logic sync rối rắm.

Câu hỏi duy nhất bạn cần trả lời: **"Data này có nguồn gốc từ server không?"**

- **Có** → React Query
- **Không** → Zustand

#### Bảng so sánh

| Tiêu chí | Server State (React Query) | Client State (Zustand) |
|---|---|---|
| Nguồn gốc data | Server / API | Client tạo ra hoặc user chọn |
| Ai sở hữu data? | Server — client chỉ là bản cache | Client — không tồn tại trên server |
| Cần sync với server? | Có — background refetch, stale-while-revalidate | Không — chỉ tồn tại trong app |
| Nhiều user thấy cùng data? | Có — data giống nhau cho mọi user (hoặc theo quyền) | Không — mỗi user có state riêng |
| Data có thể bị "stale"? | Có — user khác có thể thay đổi trên server | Không — client luôn là source of truth |
| Caching strategy | React Query tự quản lý (staleTime, gcTime) | Zustand persist middleware (localStorage) |
| Ví dụ | Danh sách user, chi tiết sản phẩm, kết quả search | Auth token, theme, sidebar open/close, giỏ hàng |

#### Ví dụ cụ thể

**React Query — Server state:**

| Data | Lý do dùng React Query |
|---|---|
| Danh sách user từ API (`/api/users`) | Data sống trên server, cần cache + background refetch |
| Chi tiết sản phẩm (`/api/products/:id`) | Nhiều user xem cùng sản phẩm, data có thể thay đổi bất kỳ lúc nào |
| Kết quả tìm kiếm (`/api/search?q=...`) | Mỗi query là một request đến server, cần cache theo query key |
| Danh sách notification (`/api/notifications`) | Server push data mới, cần refetch định kỳ |

**Zustand — Client state:**

| Data | Lý do dùng Zustand |
|---|---|
| Auth token + user session | Client-only sau khi login, cần persist qua reload |
| Theme preference (dark/light) | User chọn, không liên quan đến server |
| Sidebar open/close | UI state chia sẻ giữa nhiều component |
| Giỏ hàng (trước khi checkout) | Client tạo ra, chưa gửi lên server |
| Language setting | User preference, persist bằng Zustand middleware |

#### Trường hợp dễ nhầm

| Tình huống | Đáp án | Giải thích |
|---|---|---|
| Giỏ hàng **trước** checkout | **Zustand** | Client tạo ra, chưa tồn tại trên server |
| Giỏ hàng **sau** checkout (order) | **React Query** | Đã gửi lên server, trở thành server data |
| User profile từ API | **React Query** | Data từ server, cần cache |
| "User đang online" flag | **Zustand** | Client-only state, không fetch từ API |
| Form draft (chưa submit) | **Zustand** (hoặc `useState`) | Client tạo ra, chưa gửi server |

> 💡 **Nguyên tắc:** Nếu data **đã tồn tại trên server** và bạn chỉ đang hiển thị nó → React Query. Nếu data **do client tạo ra** hoặc là preference của user → Zustand. Đừng bao giờ copy server data vào Zustand store — để React Query làm nhiệm vụ cache.

### Đoạn code này nên đặt ở đâu?

Flowchart duy nhất trả lời câu hỏi: **"Đoạn code/logic này nên đặt ở đâu?"** — bao gồm tất cả tool trong stack.

```text
Đoạn code này là gì?
│
├─ Tính toán/transform thuần (không cần React)?
│  → utils/ (pure function)
│
├─ Gọi API / HTTP request?
│  → services/ (API layer, không import React)
│
├─ Fetch + cache + sync data từ server?
│  → hooks/ với React Query (wraps services/)
│
├─ State chia sẻ giữa nhiều component (client-only)?
│  → stores/ với Zustand
│
├─ Cần persist data qua reload?
│  → Zustand middleware persist → localStorage
│
├─ State chỉ dùng trong 1 component?
│  → useState / useRef trong component
│
├─ Logic UI phức tạp (animation, form, keyboard)?
│  → Custom hook trong feature folder hoặc hooks/
│
└─ Composition / orchestration nhiều hooks?
   → Custom hook trong page/feature folder
```

**Cách đọc:** Đi từ trên xuống, dừng ở nhánh đầu tiên phù hợp. Nếu code rơi vào nhiều nhánh — đó là dấu hiệu cần **tách** thành nhiều phần (ví dụ: tách pure function ra `utils/`, wrap bằng React Query hook trong `hooks/`).

> 💡 **Mẹo nhanh:** Flowchart này kết hợp với bảng quyết định ở §1 và bảng React Query vs Zustand ở trên. Khi phân vân, hãy tự hỏi: "Code này có cần React không?" và "Data này từ server hay client tạo ra?" — hai câu hỏi đó giải quyết 90% trường hợp.

### Common Mistakes — Anti-Patterns

Dưới đây là 4 sai lầm phổ biến nhất khi tổ chức code React. Nếu bạn thấy mình đang làm một trong những điều này — dừng lại và refactor.

**1. Fat Component**
Component chứa business logic, API call, và UI logic lẫn lộn trong cùng một file — vừa tính toán, vừa fetch data, vừa render.
Sai vì: không thể test logic riêng lẻ, không thể reuse, và mỗi thay đổi nhỏ đều ảnh hưởng toàn bộ component.
→ Tách theo loại logic: pure function ra `utils/`, API call ra `services/` + React Query hook, UI state phức tạp ra custom hook (xem §2.1–§2.4).

**2. Business Logic in Hook**
Đặt tính toán, transformation, hoặc validation nghiệp vụ bên trong React Query `select`, custom hook, hoặc `useEffect` — thay vì viết thành pure function.
Sai vì: logic bị gắn chặt vào React lifecycle, không thể test mà không render hook, và không thể dùng lại ngoài React (script, SSR, worker).
→ Extract thành pure function trong `utils/` — hook chỉ gọi function đó (xem §2.1).

**3. Prop Drilling**
Truyền props qua 3-4 tầng component trung gian chỉ để đưa data đến component con ở sâu bên dưới — các component trung gian không dùng props đó.
Sai vì: mỗi thay đổi signature ảnh hưởng toàn bộ chuỗi component, code khó đọc và khó refactor.
→ Dùng Zustand store cho shared client state, hoặc React Query hook để component con tự fetch data nó cần (xem §2.4 và §4 React Query vs Zustand).

**4. Mixed State**
Dùng Zustand để cache data từ server (copy API response vào store), hoặc dùng React Query để quản lý client-only state (theme, sidebar).
Sai vì: data bị duplicate giữa 2 nguồn, cache bị stale không đồng bộ, và logic sync trở nên phức tạp không cần thiết.
→ Server data → React Query, client-only state → Zustand. Không bao giờ copy server data vào Zustand (xem bảng React Query vs Zustand ở trên).
