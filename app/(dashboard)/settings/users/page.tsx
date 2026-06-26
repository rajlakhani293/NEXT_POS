"use client"

import { useEffect, useRef } from "react"
import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { settings } from "@/lib/api/settings"
import { customers } from "@/lib/api/customers"
import { PERMISSIONS } from "@/lib/permissions"

// NexoPOS UserCrud::getColumns
const columns = [
  { key: "username", title: "Username" },
  { key: "account_amount", title: "Wallet" },
  { key: "owed_amount", title: "Owed" },
  { key: "purchases_amount", title: "Purchases" },
  { key: "roles_names", title: "Roles" },
  {
    key: "created_at",
    title: "Created At",
    render: (value: any) =>
      value ? new Date(value).toLocaleDateString() : "-",
  },
]

const initialValues = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
  active: true,
  role_id: "",
  group_id: "",
  birth_date: "",
  credit_limit_amount: "",
  gender: "",
  phone: "",
  pobox: "",
}

function UserForm(props: any) {
  const hasLoadedRef = useRef(false)

  const [getRoles, roles] = (settings as any).useGetRolesMutation()
  const [getGroupsDropdown, groups] = (customers as any).useGetCustomerGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen || hasLoadedRef.current) return
    hasLoadedRef.current = true
    getRoles()
    getGroupsDropdown()
  }, [getRoles, getGroupsDropdown, props.isOpen])

  const roleOptions = (roles.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  const groupOptions = (groups.data?.data || []).map((item: any) => ({
    label: item.name,
    value: item.id,
  }))

  return (
    <CatalogMasterForm
      {...props}
      entityName="User"
      formWidth="w-[560px]"
      fields={[
        // General tab fields matching NexoPOS getForm
        {
          name: "username",
          label: "Username",
          placeholder: "Enter username",
          type: "text",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter email address",
          type: "email",
        },
        {
          name: "first_name",
          label: "First Name",
          placeholder: "Enter first name",
          type: "text",
        },
        {
          name: "last_name",
          label: "Last Name",
          placeholder: "Enter last name",
          type: "text",
        },
        {
          name: "password",
          label: "Password",
          placeholder: "Enter password",
          type: "text",
        },
        {
          name: "password_confirm",
          label: "Confirm Password",
          placeholder: "Re-enter password",
          type: "text",
          validate: (value: any, values: any) =>
            value && value !== values.password
              ? "Passwords do not match"
              : "",
        },
        {
          name: "active",
          label: "Active",
          type: "switch",
          note: "Define whether the user can use the application.",
        },
        {
          name: "role_id",
          label: "Role",
          placeholder: "Select role",
          type: "select",
          options: roleOptions,
          allowClear: true,
        },
        {
          name: "group_id",
          label: "Customer Group",
          placeholder: "Assign the customer to a group",
          type: "select",
          options: groupOptions,
          allowClear: true,
        },
        {
          name: "birth_date",
          label: "Birth Date",
          type: "date",
        },
        {
          name: "credit_limit_amount",
          label: "Credit Limit",
          placeholder: "Set the credit limit",
          type: "number",
        },
        {
          name: "gender",
          label: "Gender",
          placeholder: "Select gender",
          type: "select",
          options: [
            { label: "Not Defined", value: "" },
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ],
          allowClear: true,
        },
        {
          name: "phone",
          label: "Phone",
          placeholder: "Enter phone number",
          type: "text",
        },
        {
          name: "pobox",
          label: "PO Box",
          placeholder: "Enter PO Box",
          type: "text",
        },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateUserMutation}
      editHook={(settings as any).useEditUserMutation}
      getByIdHook={(settings as any).useGetUserByIdMutation}
      buildPayload={(values) => ({
        ...values,
        role_id: values.role_id ? Number(values.role_id) : undefined,
        group_id: values.group_id ? Number(values.group_id) : undefined,
        credit_limit_amount: values.credit_limit_amount
          ? Number(values.credit_limit_amount)
          : undefined,
        // Strip password_confirm before sending to backend
        password_confirm: undefined,
        // Don't send empty password on edit
        password: values.password || undefined,
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
