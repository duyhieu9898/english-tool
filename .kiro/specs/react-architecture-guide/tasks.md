# Tasks — React Architecture Guide

## Task 1: Viết Section 1 — Phân loại Logic
- [x] 1.1 Tạo file ARCHITECTURE.md với tiêu đề, giới thiệu ngắn (triết lý FSD + Clean Architecture đơn giản hóa), và bảng TL;DR (Logic Type | Primary Tool | Location | Test Approach) bao gồm 5 dòng: UI Logic, Business Logic, Data Logic, Application Logic, Persistence
- [x] 1.2 Viết định nghĩa chi tiết cho 4 loại logic (UI_Logic, Business_Logic, Data_Logic, Application_Logic) — mỗi loại có: mô tả 1-2 câu, ví dụ cụ thể từ React app, và tiêu chí phân biệt
- [x] 1.3 Viết decision table dạng câu hỏi có/không giúp developer xác định đoạn code thuộc loại logic nào (ví dụ: "Code có import React không?" → Không → Business Logic)

## Task 2: Viết Section 2 — Tách Logic khỏi Component
- [x] 2.1 Viết separation pattern cho Business Logic: nguyên tắc (pure function, no React import) + ví dụ before/after code bằng TypeScript
- [x] 2.2 Viết separation pattern cho Data Logic: nguyên tắc (React Query hook wraps service layer) + ví dụ before/after code minh họa tách API call ra services/ và wrap bằng useQuery
- [x] 2.3 Viết separation pattern cho UI Logic: nguyên tắc (custom hook cho logic UI phức tạp) + ví dụ before/after code minh họa extract useState/useEffect phức tạp ra custom hook
- [x] 2.4 Viết separation pattern cho Application Logic: nguyên tắc (Zustand store riêng biệt) + ví dụ before/after code minh họa tách global state ra store
- [x] 2.5 Viết Component Rule tổng kết: "Component chỉ chứa JSX + event handler delegation + hook composition" — kèm ví dụ component clean vs component messy

## Task 3: Viết Section 3 — Folder Structure
- [x] 3.1 Viết cây thư mục tổng quan (src/ với components/, pages/, hooks/, services/, stores/, utils/, types/, config/) kèm mô tả mục đích 1 dòng cho mỗi thư mục
- [x] 3.2 Viết quy tắc đặt tên file cho từng loại: use*.ts cho hooks, *.service.ts cho services, *.store.ts cho stores, *.utils.ts cho utils, *.types.ts cho types
- [x] 3.3 Viết ví dụ feature folder cụ thể (ví dụ: pages/vocabulary/) minh họa cách tổ chức khi feature có nhiều hơn 3 file, bao gồm component, hook, utils, và types

## Task 4: Viết Section 4 — Stack Guide + Anti-Patterns
- [x] 4.1 Viết bảng vai trò từng tool trong stack (utils, React Query, Zustand, custom hooks, services, localStorage) với cột: Tool, Vai trò, Ranh giới, Không nên dùng cho
- [x] 4.2 Viết ranh giới React Query vs Zustand: tiêu chí phân biệt server state vs client state, kèm ví dụ cụ thể cho từng loại
- [x] 4.3 Viết unified decision flowchart "Where Does This Code Go?" dạng text diagram, bao gồm tất cả: utils, services, React Query, Zustand, useState, localStorage, custom hooks
- [x] 4.4 Viết 4 anti-patterns (fat component, business logic in hook, prop drilling, mixed state) — mỗi pattern có: tên, mô tả vấn đề, tại sao sai, cách sửa ngắn gọn

## Task 5: Review và hoàn thiện
- [x] 5.1 Review toàn bộ ARCHITECTURE.md: kiểm tra tính nhất quán giữa bảng TL;DR (Section 1), separation patterns (Section 2), folder structure (Section 3), và stack guide (Section 4) — đảm bảo không có mâu thuẫn
- [x] 5.2 Kiểm tra ngôn ngữ: toàn bộ viết bằng tiếng Việt, thuật ngữ kỹ thuật giữ tiếng Anh, format markdown đúng chuẩn, và tài liệu đọc được trong ~15-20 phút
