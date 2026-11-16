---
name: human-friendly-copywriting
description: Enforce human-friendly, crisp, and sharp copywriting across all UI pages, action buttons, headers, and microcopy instead of robotic or bureaucratic jargon.
---

# Human-Friendly Copywriting & Microcopy Standards

## 1. Core Principle: Clear, Crisp, and Human-First
All text, labels, page titles, empty states, and button microcopy across Kabhyan ERP must read like a modern, world-class enterprise product (e.g., Stripe, Linear, Apple) rather than legacy corporate or bureaucratic software.

### Banned Jargon & Human-Friendly Replacements:
| Prohibited / Robotic Phrasing | Human-Friendly & Crisp Replacement |
| :--- | :--- |
| **"Configure corporate RBAC authority..."** | **"Manage team roles and decide what each person can view or edit."** |
| **"Register corporate internal staff and dispatch onboarding credentials"** | **"Add a new team member, set their role, and create their login details."** |
| **"Staff Profile Dossier"** / **"View Dossier"** | **"Team Member Profile"** / **"View Profile"** |
| **"Personal & Professional Coordinates"** | **"Basic Information"** / **"Personal Details"** |
| **"Staff-Only Governance Isolation alerts / warnings"** | *Do not display developer or architectural notes to users.* |
| **"Non-deletable anchors"** / **"System Baseline Protected Roles"** | **"Built-in Roles"** / **"Standard system defaults."** |
| **"Save & Deploy Custom Role"** / **"Confirm & Onboard Staff"** | **"Save Role"** / **"Save Member"** / **"Add Member"** |
| **"Corporate functional divisions"** | **"Departments"** / **"Teams"** |
| **"Staff Directory"** (top header navigation) | **"Team"** or **"Team Members"** |
| **"Staff Profile Unavailable - Could not retrieve employee records"** | **"Member Profile Not Found — Could not locate this team member's record."** |

---

## 2. Button & Action Label Conventions
* **Action-First & Concise**: Prefer 1–3 words for all primary and secondary actions.
  - Good: `+ Add Member`, `Save Role`, `Edit Profile`, `Suspend Access`, `Cancel`.
  - Bad: `Confirm & Onboard Staff Member`, `Save & Deploy Custom Role Configuration`, `Click Here to Return to Staff Directory`.
* **State Feedback**:
  - `Saving...` (not "Deploying..." or "Registering record...")
  - `Deleting...` (not "Purging account from database...")

---

## 3. Metric Strip & KPI Labeling
KPI blocks must use punchy, plain-English nouns:
* **Total Team** (instead of "Total Staff Headcount")
* **Active Now** (instead of "Active Portal Access")
* **Leadership** (instead of "SuperAdmins & Managers")
* **Custom Roles** (clean)
* **Built-in Roles** (instead of "System Baselines")

---

## 4. Breadcrumb Standards
Breadcrumbs must stay brief, hierarchically flat, and clear:
* Good: `Workspace > Team > Roles & Permissions`
* Good: `Workspace > Team > Add Member`
* Good: `Workspace > Team > [Member Name]`
* Bad: `Workspace > Administration > Team & Staff Management > Onboard New Staff Member`

---

## 5. Checklist for Any Page or Component Copy
- [ ] No academic, bureaucratic, or developer jargon (no "RBAC", "dossier", "coordinates", "deploy role").
- [ ] Action buttons are direct, active verbs (e.g., `Add Member`, `Save Changes`).
- [ ] Helpful context text is friendly, reassuring, and concise (under 2 lines).
- [ ] Error and empty states provide a polite explanation and a clear next step button.
