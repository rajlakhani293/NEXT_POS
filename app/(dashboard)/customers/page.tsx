
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function CustomersPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.customers.view}>
      <h1>Customer</h1>
    </PermissionGuard>
  )
}
