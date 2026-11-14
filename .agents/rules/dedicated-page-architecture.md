---
name: dedicated-page-architecture
description: Enforce dedicated full-page routes for creating and editing records in the Kabhyan ERP instead of modal-based interfaces.
---

# Dedicated Page Architecture Rule

## 1. Core Principle: No Modal Creation Interfaces
All major entity creation and comprehensive record-editing workflows across the Kabhyan ERP must use **dedicated full-page Next.js routes** (`/dashboard/{resource}/create` and `/dashboard/{resource}/{id}` or `/edit`), **NEVER popup modals**.

### Why This Rule Exists:
- **Consistent User Experience**: Having a header button open a full-page view while an empty state opens a popup modal creates confusion and broken workflows.
- **Form Fidelity & Responsiveness**: Modals cram accounting ledgers, multi-step GST details, client snapshot cards, and file attachments into tiny scrollable boxes.
- **Deep Linking & State Persistence**: Dedicated routes support bookmarks, direct links from emails/notifications, browser history navigation, and URL query params.

## 2. Universal Navigation Standard
Whenever creating or editing a primary resource (Estimates, Proforma Invoices, Tax Invoices, Projects, Clients, Tickets):
1. **Primary Header Buttons**: Must link to `/dashboard/{resource}/create` using Next.js `<Link>`.
2. **Empty State Buttons**: Must link to `/dashboard/{resource}/create` using Next.js `<Link>`, never an `onClick` that launches a modal.
3. **Table Row Edit Actions**: Must link to the dedicated document page or `/dashboard/{resource}/{id}/edit`, rather than a legacy modal.
4. **Quick-Add Exceptions**: The only allowed modals are lightweight inline helpers (such as `+ Add New Client` modal *inside* a dedicated estimate/invoice create page) that prevent losing in-progress form state.

## 3. Checklist for Any Listing Page (`/dashboard/{resource}`)
- [ ] Top action button uses `<Link href="/dashboard/{resource}/create">`.
- [ ] Empty state action button uses `<Link href="/dashboard/{resource}/create">`.
- [ ] No duplicate modal creation forms left in the listing page component.
