"use client"

import { useEffect, useRef } from "react"
import { CatalogMasterForm } from "@/components/catalog/catalog-master-form"
import { CatalogPageShell } from "@/components/catalog/catalog-page-shell"
import { settings } from "@/lib/api/settings"
import { customers } from "@/lib/api/customers"
import { PERMISSIONS } from "@/lib/permissions"

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
  roles: [],
  role_id: "",
  group_id: "",
  birth_date: "",
  credit_limit_amount: "",
  gender: "",
  phone: "",
  pobox: "",
}

export function UserForm(props: any) {
  const hasLoadedRef = useRef(false)

  const [getRoles, roles] = (settings as any).useGetRolesMutation()
  const [getGroupsDropdown, groups] = (customers as any).useGetCustomerGroupsDropdownMutation()

  useEffect(() => {
    if (!props.isOpen) {
      hasLoadedRef.current = false
      return
    }
    if (hasLoadedRef.current) return
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
        {
          name: "username",
          label: "Username",
          placeholder: "Provide a name to the resource.",
          type: "text",
          required: true,
        },
        {
          name: "email",
          label: "Email",
          placeholder: "Will be used for various purposes such as email recovery.",
          type: "email",
          required: true,
        },
        {
          name: "first_name",
          label: "First Name",
          placeholder: "Provide the user first name.",
          type: "text",
        },
        {
          name: "last_name",
          label: "Last Name",
          placeholder: "Provide the user last name.",
          type: "text",
        },
        {
          name: "password",
          label: "Password",
          placeholder: "Make a unique and secure password.",
          type: "password",
        },
        {
          name: "password_confirm",
          label: "Confirm Password",
          placeholder: "Should be the same as the password.",
          type: "password",
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
          name: "roles",
          label: "Roles",
          placeholder: "Define what roles applies to the user",
          type: "select",
          multiple: true,
          options: roleOptions,
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
          placeholder: "Set the limit that can't be exceeded by the user.",
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
          placeholder: "Set the user phone number.",
          type: "text",
        },
        {
          name: "pobox",
          label: "PO Box",
          placeholder: "Set the user PO Box.",
          type: "text",
        },
      ]}
      initialValues={initialValues}
      createHook={(settings as any).useCreateUserMutation}
      editHook={(settings as any).useEditUserMutation}
      getByIdHook={(settings as any).useGetUserByIdMutation}
      buildPayload={(values) => ({
        ...values,
        roles: Array.isArray(values.roles)
          ? values.roles.map((role: any) => Number(role)).filter(Boolean)
          : [],
        role_id: undefined,
        group_id: values.group_id ? Number(values.group_id) : undefined,
        credit_limit_amount: values.credit_limit_amount
          ? Number(values.credit_limit_amount)
          : undefined,
        password_confirm: undefined,
        password: values.password || undefined,
      })}
    />
  )
}

export default function UsersPage() {
  return (
    <CatalogPageShell
      tableTitle="Users List"
      addTitle="Add a new user"
      columns={columns}
      getDataHook={(settings as any).useGetUsersDataMutation}
      deleteHook={(settings as any).useDeleteUserMutation}
      statusHook={(settings as any).useUpdateUserStatusMutation}
      FormComponent={UserForm}
      deleteTitle="Delete User"
      deleteDescription="Would you like to delete this ?"
      permissions={PERMISSIONS.users}
    />
  )
}
