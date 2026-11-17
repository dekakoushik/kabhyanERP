---
name: pretty-urls-and-restful-routing
description: Enforce semantic, clean, pretty URLs and RESTful dynamic route architecture across Next.js App Router, strictly prohibiting query string routing anti-patterns.
---

# Pretty URLs & RESTful Routing Standard

## 1. Core Principle
URLs in Kabhyan ERP must be semantic, predictable, bookmarker-friendly, and human-readable. The application strictly forbids using query string parameters for entity manipulation, creation, or editing (e.g. anti-patterns like `/dashboard/resource/create?user_id=2` or `?id=123`).

---

## 2. Dynamic Route Specifications

### Standard Resource Routing Map
| Action | Standard RESTful URL Pattern | Prohibited Anti-Pattern |
| :--- | :--- | :--- |
| **List Resource** | `/dashboard/{resources}` | `/dashboard?tab={resources}` |
| **Create Resource** | `/dashboard/{resources}/create` | `/dashboard/{resources}?action=create` |
| **View Resource** | `/dashboard/{resources}/[id]` | `/dashboard/{resources}?id=[id]` |
| **Edit Resource** | `/dashboard/{resources}/[id]/edit` | `/dashboard/{resources}/create?[param]=[id]` |

### Next.js 15 App Router Conventions
* Dynamic segments must be defined using bracket directories: `[id]/edit/page.tsx`.
* Component signatures must consume asynchronous params cleanly via React 19 `use(params)`:
  ```tsx
  export default function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const resourceId = resolvedParams.id;
    // ...
  }
  ```

---

## 3. Allowed Use of Query Strings
Query string parameters are permitted **strictly** for volatile view-state filtering, search keywords, and pagination:
* Search filters: `?search=Kabhyan`
* Status filters: `?status=paid`
* Pagination: `?page=2&per_page=25`
* Date range: `?from=2026-01-01&to=2026-01-31`
