"use client";

import { useEffect, useMemo, useState } from "react";

import DynamicForm from "@/components/DynamicForm";
import DynamicTable from "@/components/DynamicTable";
import { PermissionGuard } from "@/components/permission-guard";
import { Checkbox } from "@/components/ui/checkbox";
import { settings } from "@/lib/api/settings";
import { PERMISSIONS } from "@/lib/permissions";
import { showToast } from "@/lib/toast";
import { usePermissions } from "@/hooks/use-permissions";

const initialValues = {
  name: "",
  code: "",
  description: "",
  is_cashier: false,
  is_store_manager: false,
  permission_codenames: [] as string[],
};

const columns = [
  { key: "name", title: "Name" },
  { key: "code", title: "Code" },
  { key: "description", title: "Description" },
  {
    key: "permissions",
    title: "Permissions",
    render: (value: string[]) => value?.length || 0,
  },
];

export default function RolesPage() {
  const { hasPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  const [roleRows, setRoleRows] = useState<any[]>([]);
  const [getRoles] = (settings as any).useGetRolesMutation();
  const permissions = (settings as any).useGetPermissionsQuery();
  const [createRole] = (settings as any).useCreateRoleMutation();
  const [editRole] = (settings as any).useEditRoleMutation();
  const [deleteRole] = (settings as any).useDeleteRoleMutation();

  const fetchRoles = async () => {
    try {
      const res = await getRoles({}).unwrap();
      setRoleRows(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const canCreate = hasPermission(PERMISSIONS.roles.create);
  const canUpdate = hasPermission(PERMISSIONS.roles.update);
  const canDelete = hasPermission(PERMISSIONS.roles.delete);

  const permissionRows = permissions.data?.data || [];
  const formValues = editRecord
    ? {
      ...initialValues,
      ...editRecord,
      permission_codenames: editRecord.permissions || [],
    }
    : initialValues;

  const groupedPermissions = useMemo(() => {
    return permissionRows.reduce((groups: Record<string, any[]>, permission: any) => {
      const groupName = permission.codename?.split("_")[0] || "other";
      groups[groupName] = groups[groupName] || [];
      groups[groupName].push(permission);
      return groups;
    }, {});
  }, [permissionRows]);

  const handleClose = () => {
    setIsOpen(false);
    setEditRecord(null);
  };

  // const refresh = () => fetchRoles();

  return (
    <PermissionGuard permission={PERMISSIONS.roles.view}>
      <div className="h-full space-y-4">
        <DynamicTable
          data={roleRows}
          columns={columns}
          tableTitle="Roles"
          title={canCreate ? "Add Role" : undefined}
          setAddEntityOpen={canCreate ? () => setIsOpen(true) : undefined}
          showSearch
          showEdit={canUpdate}
          onEdit={(record: any) => {
            setEditRecord(record);
            setIsOpen(true);
          }}
          showDelete={canDelete}
          deleteMutation={async ({ ids }: any) => deleteRole({ id: ids[0] })}
          // triggerRefresh={refresh}
          deleteModalTitle="Delete Role"
          deleteModalDescription="Are you sure you want to delete this role?"
          currentPage={1}
          itemsPerPage={10}
          totalItems={roleRows.length}
        />

        <DynamicForm
          key={editRecord?.id || "create-role"}
          isOpen={isOpen}
          onClose={handleClose}
          title={editRecord ? "Edit Role" : "Create Role"}
          initialValues={formValues}
          fields={[
            { name: "name", label: "Role Name", type: "text", required: true },
            { name: "code", label: "Code", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea", rows: 3 },
            { name: "is_cashier", label: "Cashier Role", type: "switch" },
            { name: "is_store_manager", label: "Store Manager Role", type: "switch" },
          ]}
          onSubmit={async (values: any) => {
            if (editRecord) {
              const response = await editRole({ id: editRecord.id, payLoad: values }).unwrap();
              showToast.success(response?.message || "Role updated successfully.");
            } else {
              const response = await createRole(values).unwrap();
              showToast.success(response?.message || "Role created successfully.");
            }
            // refresh();
            handleClose();
          }}
        >
          {({ formData, handleChange }: any) => (
            <div className="space-y-3 rounded-lg border p-3">
              <div>
                <h3 className="text-sm font-semibold">Permissions</h3>
                <p className="text-xs text-muted-foreground">Select what this role can access.</p>
              </div>
              {Object.entries(groupedPermissions).map(([groupName, items]: any) => (
                <div key={groupName} className="space-y-2">
                  <div className="text-xs font-bold uppercase text-muted-foreground">{groupName}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((permission: any) => {
                      const checked = formData.permission_codenames?.includes(permission.codename);
                      return (
                        <label key={permission.codename} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              const current = formData.permission_codenames || [];
                              const next = value
                                ? [...current, permission.codename]
                                : current.filter((item: string) => item !== permission.codename);
                              handleChange("permission_codenames", next);
                            }}
                          />
                          {permission.name}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DynamicForm>
      </div>
    </PermissionGuard>
  );
}
