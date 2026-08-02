# 🛒 NEXT_POS (Next-Generation Point of Sale)

An advanced, feature-rich Point of Sale (POS) system built using **Next.js 16 (App Router)**, **React 19**, **Redux Toolkit**, and **Tailwind CSS**. Designed for high performance, ease of use, offline reliability, and extensive role-based access control.

---

## ✨ Features

- **📊 Dashboard**: Real-time sales insights, order volumes, analytics charts (powered by Recharts), and status counters.
- **💻 Register & Checkout**: Seamless sales workflow, active checkout registers, payment processing, and transaction logs.
- **📦 Inventory & Catalog**: Comprehensive stock management, categories, dynamic products listing, and barcode rendering using `jsbarcode`.
- **📥 Procurements**: Supplier management, purchase orders, and receiving workflows to keep stock updated.
- **💰 Accounting**: Integrated journal entry management, ledgers, accounts charts, and payment logs.
- **🏷️ Promotions & Loyalty**: Discount coupons, promotional pricing setups, and customer rewards programs.
- **👥 Customers**: Centralized customer records, accounts, purchase history, and contact details.
- **🔒 Route & Component Protection**: Robust role-based authorization using a customized `RoutePermissionGuard` and component-level permissions system.
- **🌐 Internationalization (i18n)**: Translation context wrapper supporting multi-language environments.
- **📡 Offline Guard**: Real-time network listener to immediately notify employees in case of internet connection dropouts.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (v16.1.7) & [React](https://react.dev/) (v19.2.4)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) & [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) (for centralized, cached, and auto-refreshed API state)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) (using CSS Variables and modern design principles)
- **Icons**: [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [tw-animate-css](https://github.com/jackw/tw-animate-css)
- **Utilities**:
  - `dayjs` (date parsing and formatting)
  - `jsbarcode` (barcode generation)
  - `embla-carousel-react` (carousels and slides)
  - `react-hot-toast` (dynamic notifications)

---

## 📂 Project Structure

Here is a breakdown of the key directories within the workspace:

```text
├── app/                  # Next.js App Router Pages
│   ├── (auth)/           # Authentication layout and routing
│   ├── (dashboard)/      # Main Dashboard layout & modules (accounting, inventory, sales, etc.)
│   ├── layout.tsx        # Root HTML structure and providers
│   └── globals.css       # Global styles and Tailwind imports
├── components/           # Reusable UI & Layout Components
│   ├── ui/               # Core atomic shadcn components (button, dialog, input, etc.)
│   ├── app-sidebar.tsx   # Sidebar navigation with dynamic module lists
│   ├── site-header.tsx   # Top navigation header (branch selector, user profile, notifications)
│   ├── DynamicForm.tsx   # Dynamic form renderer for scalable data inputs
│   └── DynamicTable.tsx  # Dynamic list tables featuring sorting, search, and pagination
├── lib/                  # Utilities, Contexts, and API State
│   ├── api/              # RTK Query API slices (sales, inventory, accounting, settings)
│   ├── redux/            # Store configuration, common, and session slices
│   ├── contexts/         # React Contexts (Translation, etc.)
│   ├── permissions.ts    # Helper utilities for checking user permissions
│   └── utils.ts          # Core styling utilities (clsx, tailwind-merge)
├── hooks/                # Custom React Hooks
│   ├── use-permissions.ts# Hook to quickly check user capabilities
│   └── useTableData.ts   # Hook managing fetch, sort, filter, and pagination states
└── types/                # TypeScript type declarations
```

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have **Node.js** (v18+) and **npm** installed on your system.

### ⚙️ Installation

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd NEXT_POS
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and define the backend API URL (you can copy `.env.example` as a starting point):
   ```bash
   cp .env.example .env
   ```
   Modify `.env` to point to your backend service:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

5. **Production Build & Execution:**
   To build the production bundle:
   ```bash
   npm run build
   ```
   To run the built production code:
   ```bash
   npm run start
   ```

---

## 🧑‍💻 Extension Guide

### Adding New API Integrations
All API logic is stored under `lib/api/` and utilizes RTK Query. To add a new request:
1. Locate or create the corresponding API slice (e.g. `lib/api/sales.ts`).
2. Add endpoints using the standard builder injection pattern.
3. Export the auto-generated hooks for components to consume.

### Enforcing Permissions
- **Route Guarding**: Routes placed inside `app/(dashboard)` are subject to checking matching permissions. Ensure the appropriate keys are configured in `lib/route-permissions.ts`.
- **Component-Level Guarding**:
  ```tsx
  import { PermissionGuard } from "@/components/permission-guard";

  <PermissionGuard permission="manage_sales">
    <Button>Create Sale</Button>
  </PermissionGuard>
  ```
