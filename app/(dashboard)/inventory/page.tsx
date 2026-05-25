import { ModulePageShell } from "@/components/module-page-shell"

export default function InventoryPage() {
  return (
    <ModulePageShell
      title="Inventory"
      description="Keep stock accurate with movement tracking, low stock attention, and transfer-ready inventory controls."
      primaryAction="Adjust stock"
      highlights={[
        "Current stock levels",
        "Low stock watchlist",
        "Stock transfer activity",
        "Movement history",
      ]}
    />
  )
}
