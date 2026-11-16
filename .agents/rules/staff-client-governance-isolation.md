---
name: staff-client-governance-isolation
description: Enforce strict separation between internal company staff and external client portal accounts across database models, controllers, and frontend routes.
---

# Staff & Client Governance Isolation Rule

## 1. Core Principle: Complete Role Separation
Internal company employees and external client portal accounts must remain strictly segregated across all layers of the application:
1. **Database Tier**: External clients are authenticated with `role === 'client'`. They must never be assigned an internal `role_id` or custom staff permissions.
2. **Controller Tier**: All staff listings, stats, dropdown selectors, and role assignment endpoints must filter out clients:
   ```php
   User::where('role', '!=', 'client')->...
   ```
3. **Reserved Slugs**: The role slug `'client'` is permanently reserved. No custom internal role may use `'client'` as a slug.
4. **Middleware Protection**: Internal routes are guarded with `EnsureStaffUser`. Client routes are guarded with `EnsureClientUser`.

---

## 2. Directory & UI Isolation
* **Team Directory (`/dashboard/users`)**: Must only display internal company employees. External client contacts must only exist under **Clients** (`/dashboard/clients`).
* **Roles & Permissions (`/dashboard/users/roles`)**: Governs internal employees only. Never expose or mix client portal permissions into staff role builders.
* **Invisible Boundaries**: Never display developer-facing warning banners to users (e.g. no *"Staff-Only Governance Isolation Alert"*). Enforce the rule invisibly in the backend and schema.

---

## 3. Checklist for User-Related Controllers & Views
- [ ] Backend queries for team members explicitly exclude `where('role', '!=', 'client')`.
- [ ] Role creation endpoint rejects `'client'` slug with HTTP 422.
- [ ] Client accounts created via Client Directory cannot log into `/dashboard/*`.
- [ ] Internal staff cannot be assigned to or managed from the client portal interface.
