import { ModulePageShell } from "@/components/module-page-shell"

export default function ReportsPage() {
  return (
    <ModulePageShell
      title="Reports"
      description="Review sales performance, inventory movement, cashier activity, and business trends through focused reports."
      primaryAction="Generate report"
      highlights={[
        "Sales summaries",
        "Inventory movement reports",
        "Cashier shift totals",
        "Customer due analysis",
      ]}
    />
  )
}
