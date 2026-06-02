"use client";

import { useEffect } from "react";

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form";
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell";
import { settings } from "@/lib/api/settings";
import { PERMISSIONS } from "@/lib/permissions";

const columns = [
  { key: "full_name", title: "Name" },
  { key: "phone", title: "Phone" },
  { key: "email", title: "Email" },
  { key: "branch__name", title: "Branch" },
  { key: "role__name", title: "Role" },
];

const initialValues = {
  full_name: "",
  phone: "",
  email: "",
  branch_id: "",
  role_id: "",
};

function UserForm(props: any) {
  const [getBranchesDropdown, branches] = (settings as any).useGetBranchesDropdownMutation();
  const [getRoles, roles] = (settings as any).useGetRolesMutation();

  useEffect(() => {
    if (props.isOpen) {
      getBranchesDropdown();
      getRoles({});
    }
  }, [getBranchesDropdown, getRoles, props.isOpen]);

  const branchOptions = (branches.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }));
  const roleOptions = (roles.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }));

  return (
    <CatalogMasterForm
      {...props}
      entityName="User"
      fields={[
        { name: "full_name", label: "Full Name", type: "text", required: true },
        { name: "phone", label: "Phone", type: "text" },
        { name: "email", label: "Email", type: "email" },
        { name: "branch_id", label: "Branch", type: "select", required: true, options: branchOptions },
        { name: "role_id", label: "Role", type: "select", options: roleOptions },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateUserMutation}
      editHook={(settings as any).useEditUserMutation}
      getByIdHook={(settings as any).useGetUserByIdMutation}
      buildPayload={(values) => ({
        ...values,
        branch_id: values.branch_id ? Number(values.branch_id) : undefined,
        role_id: values.role_id ? Number(values.role_id) : undefined,
      })}
    />
  );
}

export default function UsersPage() {
  return (
    <CatalogPageShell
      tableTitle="Users"
      addTitle="Add User"
      columns={columns}
      getDataHook={(settings as any).useGetUsersDataMutation}
      deleteHook={(settings as any).useDeleteUserMutation}
      statusHook={(settings as any).useUpdateUserStatusMutation}
      FormComponent={UserForm}
      deleteTitle="Delete User"
      deleteDescription="Are you sure you want to delete this user?"
      permissions={PERMISSIONS.users}
    />
  );
}
