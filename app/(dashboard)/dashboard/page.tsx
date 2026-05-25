import { ModulePageShell } from "@/components/module-page-shell"

export default function DashboardPage() {
  return (
    <ModulePageShell
      title="Dashboard"
      description="Track the health of your retail business in one place with quick visibility into sales, stock, dues, and cashier activity."
      primaryAction="Open daily summary"
      highlights={[
        "Today sales snapshot",
        "Cashier shift overview",
        "Low stock attention",
        "Due collection summary",
      ]}
    />
  )
}
