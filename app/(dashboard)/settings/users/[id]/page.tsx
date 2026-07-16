"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import { PermissionGuard } from "@/components/permission-guard"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect, UniFieldMultiSelect } from "@/components/ui/unifield-select"
import { customers } from "@/lib/api/customers"
import { settings } from "@/lib/api/settings"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { showToast } from "@/lib/toast"

type UserFormValues = {
  username: string
  email: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
  active: boolean
  roles: number[]
  group_id: string
  birth_date: string
  credit_limit_amount: string
  gender: string
  phone: string
  pobox: string
  billing_first_name: string
  billing_last_name: string
  billing_phone: string
  billing_address_1: string
  billing_address_2: string
  billing_country: string
  billing_city: string
  billing_pobox: string
  billing_company: string
  billing_email: string
  shipping_first_name: string
  shipping_last_name: string
  shipping_phone: string
  shipping_address_1: string
  shipping_address_2: string
  shipping_country: string
  shipping_city: string
  shipping_pobox: string
  shipping_company: string
  shipping_email: string
}

const initialValues: UserFormValues = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
  active: false,
  roles: [],
  group_id: "",
  birth_date: "",
  credit_limit_amount: "",
  gender: "",
  phone: "",
  pobox: "",
  billing_first_name: "",
  billing_last_name: "",
  billing_phone: "",
  billing_address_1: "",
  billing_address_2: "",
  billing_country: "",
  billing_city: "",
  billing_pobox: "",
  billing_company: "",
  billing_email: "",
  shipping_first_name: "",
  shipping_last_name: "",
  shipping_phone: "",
  shipping_address_1: "",
  shipping_address_2: "",
  shipping_country: "",
  shipping_city: "",
  shipping_pobox: "",
  shipping_company: "",
  shipping_email: "",
}

const toDate = (value: string) => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const toDateString = (date?: Date) => {
  if (!date) return ""
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

export function UserCreateUpdatePage({ userId }: { userId?: string | number }) {
  const router = useRouter()
  const { t } = useTranslation()
  const isEdit = Boolean(userId) && userId !== "create"
  const [values, setValues] = useState<UserFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const loadedRef = useRef(false)
  const [getRoles, rolesState] = (settings as any).useGetRolesMutation()
  const [getGroupsDropdown, groupsState] = (customers as any).useGetCustomerGroupsDropdownMutation()
  const [getUserById, userState] = (settings as any).useGetUserByIdMutation()
  const [createUser, createState] = (settings as any).useCreateUserMutation()
  const [editUser, editState] = (settings as any).useEditUserMutation()
  const isSaving = createState.isLoading || editState.isLoading

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    getRoles()
    getGroupsDropdown()
    if (userId && userId !== "create") {
      getUserById({ id: userId })
    }
  }, [getGroupsDropdown, getRoles, getUserById, userId])

  useEffect(() => {
    const user = userState.data?.data
    if (!user) return
    const billing = user.addresses?.billing || {}
    const shipping = user.addresses?.shipping || {}
    setValues({
      ...initialValues,
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      active: Number(user.status) === 0,
      roles: Array.isArray(user.roles) ? user.roles.map((role: any) => Number(role.id)).filter(Boolean) : [],
      group_id: user.group_id ? String(user.group_id) : "",
      birth_date: user.birth_date || "",
      credit_limit_amount: user.credit_limit_amount != null ? String(user.credit_limit_amount) : "",
      gender: user.gender || "",
      phone: user.phone || "",
      pobox: user.pobox || "",
      billing_first_name: billing.first_name || "",
      billing_last_name: billing.last_name || "",
      billing_phone: billing.phone || "",
      billing_address_1: billing.address_1 || "",
      billing_address_2: billing.address_2 || "",
      billing_country: billing.country || "",
      billing_city: billing.city || "",
      billing_pobox: billing.pobox || "",
      billing_company: billing.company || "",
      billing_email: billing.email || "",
      shipping_first_name: shipping.first_name || "",
      shipping_last_name: shipping.last_name || "",
      shipping_phone: shipping.phone || "",
      shipping_address_1: shipping.address_1 || "",
      shipping_address_2: shipping.address_2 || "",
      shipping_country: shipping.country || "",
      shipping_city: shipping.city || "",
      shipping_pobox: shipping.pobox || "",
      shipping_company: shipping.company || "",
      shipping_email: shipping.email || "",
    })
  }, [userState.data])

  const roleOptions = useMemo(
    () => (rolesState.data?.data || []).map((item: any) => ({ label: item.name, value: Number(item.id) })),
    [rolesState.data]
  )

  const groupOptions = useMemo(
    () => (groupsState.data?.data || []).map((item: any) => ({ label: item.name, value: String(item.id) })),
    [groupsState.data]
  )

  const updateValue = (name: keyof UserFormValues, value: any) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: "" }))
  }

  const toggleRole = (roleId: number, checked: boolean) => {
    setValues((current) => ({
      ...current,
      roles: checked
        ? Array.from(new Set([...current.roles, roleId]))
        : current.roles.filter((id) => id !== roleId),
    }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!values.username.trim()) nextErrors.username = t("Username is required.")
    if (!values.email.trim()) nextErrors.email = t("Email is required.")
    if (!isEdit && !values.password) nextErrors.password = t("Password is required.")
    if (values.password && values.password.length < 6) nextErrors.password = t("Password must contain at least 6 characters.")
    if (values.password && values.password_confirm !== values.password) {
      nextErrors.password_confirm = t("Passwords do not match")
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const addressPayload = (prefix: "billing" | "shipping") => ({
    first_name: values[`${prefix}_first_name`],
    last_name: values[`${prefix}_last_name`],
    phone: values[`${prefix}_phone`],
    address_1: values[`${prefix}_address_1`],
    address_2: values[`${prefix}_address_2`],
    country: values[`${prefix}_country`],
    city: values[`${prefix}_city`],
    pobox: values[`${prefix}_pobox`],
    company: values[`${prefix}_company`],
    email: values[`${prefix}_email`],
  })

  const buildPayload = () => ({
    username: values.username.trim(),
    email: values.email.trim(),
    first_name: values.first_name,
    last_name: values.last_name,
    password: values.password || undefined,
    password_confirm: values.password ? values.password_confirm : undefined,
    active: values.active,
    roles: values.roles,
    group_id: values.group_id ? Number(values.group_id) : undefined,
    birth_date: values.birth_date || undefined,
    credit_limit_amount: values.credit_limit_amount ? Number(values.credit_limit_amount) : undefined,
    gender: values.gender,
    phone: values.phone,
    pobox: values.pobox,
    billing: addressPayload("billing"),
    shipping: addressPayload("shipping"),
  })

  const save = async () => {
    if (!validate()) return
    const payLoad = buildPayload()
    if (isEdit) {
      const response = await editUser({ id: userId, payLoad }).unwrap()
      showToast.success(response?.message || t("User updated successfully."))
    } else {
      const response = await createUser(payLoad).unwrap()
      showToast.success(response?.message || t("User created successfully."))
    }
    router.push("/settings/users")
  }

  const permission = isEdit ? PERMISSIONS.users.update : PERMISSIONS.users.create
  const isLoading = isEdit && userState.isLoading && !userState.data

  return (
    <DashboardPage padding="none">
      <PermissionGuard permission={permission}>
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push("/settings/users")}>
                  <ArrowLeft className="size-4" />
                </Button>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-slate-950">
                    {isEdit ? t("Edit user") : t("Create a new user")}
                  </h1>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {isEdit ? t("Modify User.") : t("Register a new user and save it.")}
                  </p>
                </div>
              </div>
              <Button type="button" onClick={save} disabled={isSaving || isLoading}>
                {isSaving ? <Spinner /> : null}
                {t("Save")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
              <Spinner />
              {t("Loading user...")}
            </div>
          ) : (
            <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
              <div className="flex-none bg-white px-4 sm:px-6">
                <TabsList variant="line" className="w-full justify-start border-b border-gray-200">
                  <TabsTrigger value="general">{t("General")}</TabsTrigger>
                  <TabsTrigger value="billing">{t("Billing Address")}</TabsTrigger>
                  <TabsTrigger value="shipping">{t("Shipping Address")}</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <TabsContent value="general" className="mt-0 pt-0 space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {t("General Information")}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <UniFieldInput
                        label={t("Username")}
                        required
                        placeholder={t("Provide a name to the resource.")}
                        value={values.username}
                        onChange={(event) => updateValue("username", event.target.value)}
                        error={errors.username}
                      />

                      <UniFieldInput
                        label={t("Email")}
                        required
                        placeholder={t("Will be used for various purposes such as email recovery.")}
                        value={values.email}
                        onChange={(event) => updateValue("email", event.target.value)}
                        error={errors.email}
                      />

                      <UniFieldInput
                        label={t("First Name")}
                        placeholder={t("Provide the user first name.")}
                        value={values.first_name}
                        onChange={(event) => updateValue("first_name", event.target.value)}
                      />

                      <UniFieldInput
                        label={t("Last Name")}
                        placeholder={t("Provide the user last name.")}
                        value={values.last_name}
                        onChange={(event) => updateValue("last_name", event.target.value)}
                      />

                      <UniFieldSelect
                        label={t("Gender")}
                        placeholder={t("Select Gender")}
                        value={values.gender}
                        onValueChange={(value) => updateValue("gender", value)}
                        allowClear
                      >
                        <SelectItem value="male">{t("Male")}</SelectItem>
                        <SelectItem value="female">{t("Female")}</SelectItem>
                      </UniFieldSelect>

                      <UniFieldInput
                        label={t("Phone")}
                        placeholder={t("Set the user phone number.")}
                        value={values.phone}
                        onChange={(event) => updateValue("phone", event.target.value)}
                      />

                      <UniFieldInput
                        label={t("PO Box")}
                        placeholder={t("Set the user PO Box.")}
                        value={values.pobox}
                        onChange={(event) => updateValue("pobox", event.target.value)}
                      />

                      <UniFieldSelect
                        label={t("Group")}
                        placeholder={t("Select Group")}
                        value={values.group_id}
                        onValueChange={(value) => updateValue("group_id", value)}
                        allowClear
                        hasOptions={groupOptions.length > 0}
                      >
                        {groupOptions.map((group: any) => (
                          <SelectItem key={group.value} value={group.value}>
                            {group.label}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>

                      <UniFieldMultiSelect
                        label={t("Roles")}
                        options={roleOptions}
                        value={values.roles}
                        onValueChange={(nextValues) => updateValue("roles", nextValues)}
                        placeholder={t("Select Roles")}
                        allowClear
                      />

                      <DatePicker
                        label={t("Birth Date")}
                        placeholder={t("Pick a date")}
                        value={toDate(values.birth_date)}
                        onChange={(date) => updateValue("birth_date", toDateString(date))}
                      />

                      <UniFieldInput
                        label={t("Credit Limit")}
                        type="number"
                        placeholder={t("Set the limit that can't be exceeded by the user.")}
                        value={values.credit_limit_amount}
                        onChange={(event) => updateValue("credit_limit_amount", event.target.value)}
                      />

                      <UniFieldInput
                        label={t("Password")}
                        type="password"
                        required={!isEdit}
                        placeholder={t("Make a unique and secure password.")}
                        value={values.password}
                        onChange={(event) => updateValue("password", event.target.value)}
                        error={errors.password}
                      />

                      <UniFieldInput
                        label={t("Confirm Password")}
                        type="password"
                        placeholder={t("Should be the same as the password.")}
                        value={values.password_confirm}
                        onChange={(event) => updateValue("password_confirm", event.target.value)}
                        error={errors.password_confirm}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="billing" className="mt-0 pt-0 space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {t("Billing Details")}
                      </h2>
                    </div>
                    <AddressFields prefix="billing" values={values} updateValue={updateValue} />
                  </TabsContent>

                  <TabsContent value="shipping" className="mt-0 pt-0 space-y-6">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {t("Shipping Details")}
                      </h2>
                    </div>
                    <AddressFields prefix="shipping" values={values} updateValue={updateValue} />
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          )}
        </div>
      </PermissionGuard>
    </DashboardPage>
  )
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>()
  return <UserCreateUpdatePage userId={params.id} />
}

function AddressFields({
  prefix,
  values,
  updateValue,
}: {
  prefix: "billing" | "shipping"
  values: UserFormValues
  updateValue: (name: keyof UserFormValues, value: any) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UniFieldInput
        label={t("First Name")}
        placeholder={prefix === "billing" ? t("Provide the billing First Name.") : t("Provide the shipping First Name.")}
        value={values[`${prefix}_first_name`]}
        onChange={(event) => updateValue(`${prefix}_first_name`, event.target.value)}
      />
      <UniFieldInput
        label={t("Last Name")}
        placeholder={prefix === "billing" ? t("Provide the billing Last Name.") : t("Provide the shipping Last Name.")}
        value={values[`${prefix}_last_name`]}
        onChange={(event) => updateValue(`${prefix}_last_name`, event.target.value)}
      />
      <UniFieldInput
        label={t("Company")}
        placeholder={t("Company")}
        value={values[`${prefix}_company`]}
        onChange={(event) => updateValue(`${prefix}_company`, event.target.value)}
      />
      <UniFieldInput
        label={t("Phone")}
        placeholder={prefix === "billing" ? t("Billing phone number.") : t("Shipping phone number.")}
        value={values[`${prefix}_phone`]}
        onChange={(event) => updateValue(`${prefix}_phone`, event.target.value)}
      />
      <UniFieldInput
        label={t("Email")}
        placeholder={t("Email")}
        value={values[`${prefix}_email`]}
        onChange={(event) => updateValue(`${prefix}_email`, event.target.value)}
      />
      <UniFieldInput
        label={t("Address 1")}
        placeholder={prefix === "billing" ? t("Billing First Address.") : t("Shipping First Address.")}
        value={values[`${prefix}_address_1`]}
        onChange={(event) => updateValue(`${prefix}_address_1`, event.target.value)}
      />
      <UniFieldInput
        label={t("Address 2")}
        placeholder={prefix === "billing" ? t("Billing Second Address.") : t("Shipping Second Address.")}
        value={values[`${prefix}_address_2`]}
        onChange={(event) => updateValue(`${prefix}_address_2`, event.target.value)}
      />
      <UniFieldInput
        label={t("Country")}
        placeholder={prefix === "billing" ? t("Billing Country.") : t("Shipping Country.")}
        value={values[`${prefix}_country`]}
        onChange={(event) => updateValue(`${prefix}_country`, event.target.value)}
      />
      <UniFieldInput
        label={t("City")}
        placeholder={t("City")}
        value={values[`${prefix}_city`]}
        onChange={(event) => updateValue(`${prefix}_city`, event.target.value)}
      />
      <UniFieldInput
        label={t("PO.Box")}
        placeholder={t("Postal Address")}
        value={values[`${prefix}_pobox`]}
        onChange={(event) => updateValue(`${prefix}_pobox`, event.target.value)}
      />
    </div>
  )
}
