# Design Document: React Architecture Guide

## Overview

Thiết kế cho việc tạo file ARCHITECTURE.md — một tài liệu kiến trúc thực tiễn cho dự án React. Tài liệu này là một file markdown duy nhất, không liên quan đến code runtime, mà là hướng dẫn tham khảo cho developer và AI.

Vì deliverable là một file tài liệu (không phải code chạy), thiết kế tập trung vào cấu trúc nội dung, thứ tự các section, và các mô hình/bảng biểu cần có trong ARCHITECTURE.md.

## Architecture Approach

### Triết lý thiết kế

Kết hợp tinh hoa từ 2 trường phái:
- **Feature-Sliced Design (FSD)**: Lấy ý tưởng tổ chức theo feature/slice, nhưng bỏ qua sự phức tạp của layers/segments
- **Clean Architecture**: Lấy nguyên tắc tách biệt concerns và dependency rule, nhưng đơn giản hóa thành 4 loại logic thay vì nhiều layer

### Mô hình 4 loại logic

```
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

### Stack mapping (bảng TL;DR — đặt đầu Section 1)

| Logic Type | Primary Tool | Location | Test Approach |
|---|---|---|---|
| UI Logic | useState, useRef, custom UI hooks | Component hoặc hooks/ | Integration test (render) |
| Business Logic | Pure functions | utils/ hoặc feature/logic/ | Unit test thuần (no mock) |
| Data Logic | React Query + axios | hooks/ + services/ | Hook test (mock API) |
| Application Logic | Zustand + React Router | stores/ + App config | Unit test (mock store) |
| Persistence | Zustand persist middleware | stores/ (→ localStorage) | Unit test (mock storage) |

## Document Structure Design

ARCHITECTURE.md sẽ được tổ chức thành 4 sections gọn gàng:

### Section 1: Phân loại Logic (Requirements 1 + Quick Reference)
- Mở đầu bằng bảng TL;DR tóm tắt: logic types → tool → folder → test approach (gom Quick Reference vào đây thay vì section riêng)
- Định nghĩa 4 loại logic với mô tả, ví dụ, tiêu chí
- Decision table dạng câu hỏi có/không
- Cột "Test approach" trong bảng tóm tắt thay thế cho Testing section riêng

### Section 2: Tách Logic khỏi Component (Requirement 2)
- Mỗi loại logic có subsection riêng
- Mỗi subsection có: nguyên tắc, before/after code, quy tắc
- Component rule ở cuối section: "component chỉ chứa JSX + hook composition"

### Section 3: Folder Structure (Requirement 3)
- Cây thư mục tổng quan
- Mô tả từng thư mục
- Quy tắc đặt tên file
- Ví dụ feature folder cụ thể

### Section 4: Stack Guide + Anti-Patterns (Requirements 4, 5, 6)
- Bảng vai trò từng tool trong stack
- React Query vs Zustand boundary với tiêu chí rõ ràng
- State decision flowchart
- Anti-patterns gom ở cuối section dưới dạng "Common Mistakes"
- Mỗi anti-pattern: vấn đề + cách sửa ngắn gọn

> **Thiết kế gọn**: Bỏ Quick Reference section riêng (gom vào bảng TL;DR đầu Section 1). Bỏ Testing section riêng (gom cột "Test approach" vào bảng tóm tắt). Kết quả: 4 sections, không lặp nội dung.

## Folder Structure Design

Cây thư mục chuẩn sẽ được đề xuất trong ARCHITECTURE.md:

```
src/
├── components/          # Shared/reusable UI components
│   ├── ui/              # Primitive UI (Button, Input, Modal...)
│   ├── common/          # Composed shared components
│   └── layout/          # Layout components (AppLayout, Sidebar...)
├── pages/               # Route-level components (thin, compose features)
│   └── vocabulary/      # Feature page folder
│       ├── VocabSession.tsx
│       ├── useVocabSession.ts    # UI/composition hook for this page
│       └── vocabSession.utils.ts # Business logic for this feature
├── hooks/               # Shared custom hooks (data hooks, utility hooks)
│   ├── useApi.ts         # React Query hooks (Data Logic)
│   └── queryKeys.ts      # Query key factory
├── services/            # API service layer (pure HTTP, no React)
│   ├── api.ts            # API functions
│   └── http.ts           # Axios instance
├── stores/              # Zustand stores (Application Logic / client state)
├── utils/               # Pure utility functions (Business Logic)
├── types/               # TypeScript type definitions
└── config/              # App configuration, constants
```

## "Where Does This Code Go?" — Unified Decision Model

Một flowchart duy nhất trả lời câu hỏi: "Đoạn code/logic này nên đặt ở đâu?"

```
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

Model này thay thế State Management Decision Model cũ (chỉ cover state) bằng một flowchart thống nhất cover tất cả: utils, services, React Query, Zustand, hooks, useState, localStorage.

## Anti-Pattern Catalog

Tài liệu sẽ bao gồm ít nhất 4 anti-patterns:

1. **Fat Component**: Component chứa business logic, API call, và UI logic lẫn lộn
2. **Business Logic in Hook**: Đặt tính toán/transformation trong React Query select hoặc custom hook thay vì pure function
3. **Prop Drilling**: Truyền props qua nhiều tầng thay vì dùng Zustand hoặc context
4. **Mixed State**: Dùng Zustand cho server-cached data hoặc React Query cho pure client state

## Correctness Properties

Vì deliverable là một file tài liệu markdown (không phải code runtime), các correctness properties tập trung vào tính đầy đủ và nhất quán của nội dung:

1. **Completeness — Logic Types**: ARCHITECTURE.md phải chứa đầy đủ 4 loại logic (UI, Business, Data, Application) với định nghĩa, ví dụ, và tiêu chí phân biệt cho mỗi loại.

2. **Completeness — TL;DR Table**: Bảng tóm tắt đầu Section 1 phải bao gồm 4 cột: Logic Type, Primary Tool, Location, Test Approach — thay thế cho Quick Reference và Testing sections riêng.

3. **Completeness — Separation Patterns**: Mỗi loại logic phải có ít nhất 1 ví dụ code before/after minh họa cách tách logic khỏi component.

4. **Completeness — Stack Mapping**: Mỗi thành phần trong stack (utils, React Query, Zustand, custom hooks, services) phải được liệt kê với vai trò và mapping tới loại logic tương ứng.

5. **Completeness — Anti-Patterns**: Tài liệu phải chứa ít nhất 4 anti-patterns (fat component, business logic in hook, prop drilling, mixed state) gom ở cuối Stack Guide section, mỗi pattern có mô tả vấn đề và cách sửa.

6. **Consistency — Folder-Logic Mapping**: Mọi loại logic được đề cập trong Section 1 phải có vị trí tương ứng trong Section 3 (Folder Structure), và ngược lại.

7. **Consistency — Stack-Logic Mapping**: Bảng mapping logic→stack trong Section 4 phải nhất quán với các separation patterns được mô tả trong Section 2.

8. **Language Consistency**: Toàn bộ tài liệu phải viết bằng tiếng Việt, sử dụng thuật ngữ tiếng Anh cho các khái niệm kỹ thuật (component, hook, state, etc.).
