import { ModulePageShell } from "@/components/module-page-shell"

export default function CustomersPage() {
  return (
    <ModulePageShell
      title="Customers"
      description="Track buyer profiles, due balances, purchase history, and loyalty-driven customer relationships."
      primaryAction="Add customer"
      highlights={[
        "Customer directory",
        "Credit and due balances",
        "Purchase history insights",
        "Loyalty-ready records",
      ]}
    />
  )
}
