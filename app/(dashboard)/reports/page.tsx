import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function ReportsPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.reports.view}>
      Report
    </PermissionGuard>
  )
}
