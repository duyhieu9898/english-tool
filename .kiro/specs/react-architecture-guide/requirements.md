# Requirements Document

## Introduction

Tài liệu này định nghĩa các yêu cầu cho việc tạo một file ARCHITECTURE.md — một hướng dẫn kiến trúc thực tiễn cho các dự án React. Hướng dẫn này lấy cảm hứng từ Feature-Sliced Design (FSD) và Clean Architecture, nhưng được đơn giản hóa để dễ học, dễ áp dụng, và phù hợp với các thực hành phổ biến hiện tại trong hệ sinh thái React.

Mục tiêu chính: tách biệt business logic khỏi component để dễ test và bảo trì, đồng thời cung cấp một hệ thống phân loại logic rõ ràng (UI logic, business logic, data logic) với các quy ước về folder structure và stack validation.

## Glossary

- **Architecture_Guide**: Tài liệu ARCHITECTURE.md — file markdown mô tả kiến trúc tổng quan, quy ước folder, phân loại logic, và hướng dẫn thực hành cho dự án React.
- **Logic_Classification_System**: Hệ thống phân loại các loại logic trong ứng dụng React thành các nhóm riêng biệt (UI Logic, Business Logic, Data Logic, Application Logic).
- **UI_Logic**: Logic liên quan trực tiếp đến giao diện — quản lý state hiển thị, animation, form validation ở mức UI, conditional rendering.
- **Business_Logic**: Logic nghiệp vụ cốt lõi — các quy tắc, tính toán, transformation không phụ thuộc vào React hay bất kỳ framework nào.
- **Data_Logic**: Logic liên quan đến việc fetch, cache, sync, và transform dữ liệu từ server — bao gồm React Query hooks và API service layer.
- **Application_Logic**: Logic điều phối ứng dụng — routing, authentication flow, global state management (Zustand), error boundaries.
- **Separation_Pattern**: Mẫu thiết kế mô tả cách tách logic ra khỏi component và đặt vào đúng layer tương ứng.
- **Folder_Convention**: Quy ước tổ chức thư mục trong dự án React, xác định vị trí vật lý của từng loại logic.
- **Stack**: Tập hợp các thư viện và công cụ được sử dụng: utils (pure functions), React Query (server state), Zustand (client state), custom hooks (composition), services (API layer).
- **Pure_Function**: Hàm không có side effect, cùng input luôn cho cùng output — nền tảng cho business logic dễ test.
- **Custom_Hook**: React hook do developer tự viết để đóng gói và tái sử dụng logic — có thể chứa UI logic, data logic, hoặc composition logic.
- **Service_Layer**: Tầng chứa các hàm giao tiếp với API/external services — tách biệt hoàn toàn khỏi React, chỉ sử dụng HTTP client.

## Requirements

### Requirement 1: Phân loại Logic (Logic Classification System)

**User Story:** Là một developer, tôi muốn có một hệ thống phân loại rõ ràng các loại logic trong ứng dụng React, để tôi biết chính xác mỗi đoạn code thuộc loại nào và nên đặt ở đâu.

#### Acceptance Criteria

1. THE Architecture_Guide SHALL mở đầu bằng bảng TL;DR tóm tắt với 4 cột: Logic Type, Primary Tool, Location, và Test Approach — cho phép developer tra cứu nhanh toàn bộ kiến trúc.
2. THE Architecture_Guide SHALL định nghĩa chính xác 4 loại logic: UI_Logic, Business_Logic, Data_Logic, và Application_Logic với mô tả, ví dụ cụ thể, và tiêu chí phân biệt cho từng loại.
3. THE Architecture_Guide SHALL cung cấp một bảng quyết định (decision table) giúp developer xác định một đoạn code thuộc loại logic nào dựa trên các câu hỏi có/không.
4. WHEN một đoạn code thực hiện tính toán hoặc transformation không phụ thuộc vào React, THE Logic_Classification_System SHALL phân loại đoạn code đó là Business_Logic.
5. WHEN một đoạn code quản lý state hiển thị, animation, hoặc conditional rendering, THE Logic_Classification_System SHALL phân loại đoạn code đó là UI_Logic.
6. WHEN một đoạn code thực hiện fetch, cache, hoặc sync dữ liệu với server, THE Logic_Classification_System SHALL phân loại đoạn code đó là Data_Logic.
7. WHEN một đoạn code điều phối routing, authentication, hoặc global state, THE Logic_Classification_System SHALL phân loại đoạn code đó là Application_Logic.
8. THE Architecture_Guide SHALL truyền tải nguyên tắc testing: Business_Logic (Pure_Function) → unit test thuần không cần mock, Data_Logic → hook test với mock API, UI component → integration test — thông qua cột Test Approach trong bảng TL;DR.

### Requirement 2: Tách Logic khỏi Component (Logic Separation Patterns)

**User Story:** Là một developer, tôi muốn biết cách và nơi tách logic ra khỏi React component, để component chỉ tập trung vào việc render UI và dễ bảo trì hơn.

#### Acceptance Criteria

1. THE Architecture_Guide SHALL mô tả Separation_Pattern cho từng loại logic, chỉ rõ logic đó nên được extract ra file/module nào.
2. THE Architecture_Guide SHALL cung cấp ví dụ code trước và sau khi tách logic cho mỗi Separation_Pattern, sử dụng TypeScript và React.
3. WHEN Business_Logic được tách khỏi component, THE Separation_Pattern SHALL đặt Business_Logic vào Pure_Function trong thư mục utils hoặc module logic riêng, không import bất kỳ React API nào.
4. WHEN Data_Logic được tách khỏi component, THE Separation_Pattern SHALL đóng gói Data_Logic vào Custom_Hook sử dụng React Query, và đặt API call thuần vào Service_Layer.
5. WHEN UI_Logic phức tạp được tách khỏi component, THE Separation_Pattern SHALL đóng gói UI_Logic vào Custom_Hook riêng trong cùng feature folder hoặc thư mục hooks.
6. WHEN Application_Logic cần quản lý global state, THE Separation_Pattern SHALL sử dụng Zustand store riêng biệt, tách khỏi component và hook.
7. THE Architecture_Guide SHALL định nghĩa quy tắc "component chỉ nên chứa JSX, event handler delegation, và composition của hooks" — mọi logic khác phải được extract ra ngoài.

### Requirement 3: Quy ước tổ chức thư mục (Folder Structure Convention)

**User Story:** Là một developer, tôi muốn có một quy ước folder structure rõ ràng và nhất quán, để mọi người trong team biết chính xác file nào nằm ở đâu.

#### Acceptance Criteria

1. THE Architecture_Guide SHALL định nghĩa một Folder_Convention chuẩn với cây thư mục hoàn chỉnh, mô tả mục đích của từng thư mục.
2. THE Folder_Convention SHALL tổ chức code theo feature (feature-based) cho các module nghiệp vụ, kết hợp với shared folder cho code dùng chung.
3. THE Folder_Convention SHALL chỉ rõ vị trí vật lý cho từng loại logic: Business_Logic trong utils hoặc feature/logic, Data_Logic trong hooks và services, UI_Logic trong component hoặc feature/hooks, Application_Logic trong stores và config.
4. THE Architecture_Guide SHALL cung cấp quy tắc đặt tên file nhất quán cho từng loại: *.service.ts, *.store.ts, *.hook.ts (hoặc use*.ts), *.utils.ts, *.types.ts.
5. WHEN một feature có nhiều hơn 3 file liên quan, THE Folder_Convention SHALL nhóm các file đó vào một feature folder riêng thay vì để rải rác.
6. THE Architecture_Guide SHALL cung cấp ví dụ cây thư mục cho một feature cụ thể, minh họa cách áp dụng Folder_Convention trong thực tế.

### Requirement 4: Stack Guide, Decision Model, và Anti-Patterns

**User Story:** Là một developer, tôi muốn biết stack hiện tại (utils, React Query, Zustand, custom hooks, services) có phù hợp không, cách sử dụng đúng vai trò của từng thành phần, và các sai lầm phổ biến cần tránh.

#### Acceptance Criteria

1. THE Architecture_Guide SHALL liệt kê từng thành phần trong Stack (utils, React Query, Zustand, custom hooks, services) kèm vai trò chính xác và ranh giới trách nhiệm.
2. THE Architecture_Guide SHALL cung cấp bảng mapping giữa loại logic và thành phần Stack tương ứng: Business_Logic → utils/Pure_Function, Data_Logic → React Query + Service_Layer, UI_Logic → Custom_Hook + component state, Application_Logic → Zustand + router.
3. THE Architecture_Guide SHALL định nghĩa ranh giới rõ ràng giữa React Query (server state) và Zustand (client state), bao gồm tiêu chí quyết định khi nào dùng cái nào.
4. WHEN developer cần quyết định đặt code/state ở đâu, THE Architecture_Guide SHALL cung cấp một unified decision flowchart bao gồm tất cả: utils (pure function), services (API), React Query (server state), Zustand (client state), useState (local state), localStorage (persistence), và custom hooks (UI/composition logic).
5. THE Architecture_Guide SHALL cung cấp danh sách ít nhất 4 anti-patterns phổ biến: fat component, business logic trong hook, prop drilling thay vì state management, và mixing server/client state.
6. WHEN mô tả mỗi anti-pattern, THE Architecture_Guide SHALL bao gồm: mô tả vấn đề, tại sao nó sai, và cách sửa ngắn gọn.
7. THE Architecture_Guide SHALL viết bằng tiếng Việt, sử dụng thuật ngữ tiếng Anh cho các khái niệm kỹ thuật, để phù hợp với mục đích tham khảo cá nhân và AI.
