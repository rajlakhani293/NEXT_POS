import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function SalesPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.sales.view}>
      <h1>Sales</h1>
    </PermissionGuard>
  )
}
