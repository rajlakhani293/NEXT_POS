import { ModulePageShell } from "@/components/module-page-shell"

export default function SalesPage() {
  return (
    <ModulePageShell
      title="Sales"
      description="Manage orders, returns, due collections, and cashier billing flow from one sales workspace."
      primaryAction="Create new sale"
      highlights={[
        "Recent order stream",
        "Pending due payments",
        "Return and refund queue",
        "Top selling items",
      ]}
    />
  )
}
