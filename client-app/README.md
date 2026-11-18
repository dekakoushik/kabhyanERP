# Kabhyan Technologies — Enterprise Client Mobile App

Built with **React Native (Expo SDK 57)** for Android & iOS. Designed for direct testing in the **Expo Go** mobile app.

---

## 📱 How to Run & Test in Expo Go (SDK 57)

1. Open your terminal in this directory:
   ```bash
   cd client-app
   ```

2. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

3. Open **Expo Go** (supporting SDK 57) on your physical mobile device:
   - **Android**: Scan the QR code displayed in the terminal using the Expo Go camera scanner.
   - **iOS**: Scan the QR code with your default iOS Camera app to open in Expo Go.

---

## 🚀 Key Modules & Architecture

- **Authentication & Persistence**:
  - Secure Sanctum Bearer token storage via `@react-native-async-storage/async-storage`.
  - Seamless auto-login on app launch.
  - Role-protected client workspace (`role === 'client'`).
  
- **Overview Dashboard**:
  - Verified Partner status badge with corporate GSTIN.
  - Financial KPIs: Outstanding Due, Gross Settled Turnover, Active Engineering Projects, Open Tickets.
  - Quick action shortcuts.
  - Recent milestone invoices with instant pay triggers.

- **Tax Invoices & Billing**:
  - Filterable by `All`, `Pending`, `Paid`, `Overdue`.
  - Comprehensive Deliverables Ledger (item description, quantity, unit rate, taxable turnover, 18% GST breakdown, gross total).
  - One-touch online checkout via **Cashfree** through `expo-web-browser`.

- **Project Portfolio & Sprints**:
  - Enterprise engineering contracts and target deadlines.
  - Deliverables & milestones tracker.

- **Quotations / Estimates**:
  - Proposal scope schedules and validity deadlines.
  - Direct Accept / Decline approval actions.

- **Support Desk**:
  - Issue tickets categorized by priority (`low`, `medium`, `high`, `urgent`).
  - Interactive threaded discussion between client and Kabhyan engineering.
  - In-app reply composer.

- **Corporate Profile & Settings**:
  - Company entity details, GSTIN, PAN, and billing address.
  - Connected Gateway status: `https://erp.kabhyan.com`.
  - Prominent red `Log Out of Portal` action.

---

## 🛠️ Tech Stack

- **Framework**: React Native 0.86 & Expo SDK 57 (`expo@~57.0.33`)
- **Navigation**: React Navigation (`@react-navigation/native-stack`, `@react-navigation/bottom-tabs`)
- **Language**: TypeScript (Strict typing, 0 TS errors)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Styling**: Native StyleSheet with Kabhyan Enterprise Blue theme
