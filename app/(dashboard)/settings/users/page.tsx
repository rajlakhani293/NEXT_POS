"use client"

import { useEffect, useRef } from "react"

import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { settings } from "@/lib/api/settings"
import { PERMISSIONS } from "@/lib/permissions"

const columns = [
  { key: "full_name", title: "Name" },
  { key: "phone", title: "Phone" },
  { key: "email", title: "Email" },
  { key: "branch__name", title: "Branch" },
  { key: "role__name", title: "Role" },
]

const initialValues = {
  full_name: "",
  phone: "",
  email: "",
  role_id: "",
}

function UserForm(props: any) {
  const hasLoadedRolesRef = useRef(false)
  const [getRoles, roles] = (settings as any).useGetRolesMutation()

  useEffect(() => {
    if (!props.isOpen || hasLoadedRolesRef.current) return
    hasLoadedRolesRef.current = true
    getRoles()
  }, [getRoles, props.isOpen])

  const roleOptions = (roles.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  return (
    <CatalogMasterForm
      {...props}
      entityName="User"
      fields={[
        {
          name: "full_name",
          label: "Full Name",
          placeholder: "Enter full name",
          type: "text",
          required: true,
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter phone number",
          type: "text",
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter email address",
          type: "email",
        },
        {
          name: "role_id",
          label: "Role",
          placeholder: "Select role",
          type: "select",
          options: roleOptions,
        },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateUserMutation}
      editHook={(settings as any).useEditUserMutation}
      getByIdHook={(settings as any).useGetUserByIdMutation}
      buildPayload={(values) => ({
        ...values,
        role_id: values.role_id ? Number(values.role_id) : undefined,
      })}
    />
  )
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
  )
}
