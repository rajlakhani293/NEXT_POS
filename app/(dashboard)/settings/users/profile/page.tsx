"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Copy, KeyRound, RefreshCw, Save, Search, Trash2 } from "lucide-react"

import { useConfirmDialog } from "@/components/confirm-dialog"
import { DashboardPage } from "@/components/dashboard/dashboard-page"
import { PermissionGuard } from "@/components/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SelectItem } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniFieldInput } from "@/components/ui/unifield-input"
import { UniFieldSelect } from "@/components/ui/unifield-select"
import { MediaManagerDialog, mediaImageUrl } from "@/components/media-manager"
import { supportedLanguages } from "@/lib/i18n/languages"
import { auth, type AccessTokenRecord } from "@/lib/api/auth"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { PERMISSIONS } from "@/lib/permissions"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { showToast } from "@/lib/toast"

type ProfileValues = {
  username: string
  full_name: string
  email: string
  phone: string
  theme: string
  language: string
  avatar_link: string
  old_password: string
  password: string
  password_confirm: string
}

type AddressValues = {
  email: string
  first_name: string
  last_name: string
  phone: string
  address_1: string
  address_2: string
  country: string
  city: string
  pobox: string
  company: string
}

type ProfileTab = "general" | "billing" | "shipping" | "security" | "token"

const emptyProfile: ProfileValues = {
  username: "",
  full_name: "",
  email: "",
  phone: "",
  theme: "",
  language: "",
  avatar_link: "",
  old_password: "",
  password: "",
  password_confirm: "",
}

const emptyAddress: AddressValues = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  address_1: "",
  address_2: "",
  country: "",
  city: "",
  pobox: "",
  company: "",
}

const profileFields = [
  { name: "username", label: "Username", type: "text", required: true },
  { name: "full_name", label: "Full Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "text" },
] as const

const securityFields = [
  { name: "old_password", label: "Old Password", description: "Provide the old password." },
  { name: "password", label: "Password", description: "Change your password with a better stronger password." },
  { name: "password_confirm", label: "Password Confirmation", description: "Change your password with a better stronger password." },
] as const

const addressFields = [
  { name: "first_name", label: "First Name", description: "Provide the billing first name." },
  { name: "last_name", label: "Last Name", description: "Provide the billing last name." },
  { name: "phone", label: "Phone", description: "Billing phone number." },
  { name: "address_1", label: "Address 1", description: "Billing First Address." },
  { name: "address_2", label: "Address 2", description: "Billing Second Address." },
  { name: "country", label: "Country", description: "Billing Country." },
  { name: "city", label: "City", description: "City" },
  { name: "pobox", label: "PO.Box", description: "Postal Address" },
  { name: "company", label: "Company", description: "Company" },
  { name: "email", label: "Email", description: "Email" },
] as const

function dateLabel(value?: string | null) {
  if (!value) return "Never"
  return value
}

export default function UserProfilePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { confirm, confirmDialog } = useConfirmDialog()
  const user = useAppSelector((state) => state.session.user)
  const [values, setValues] = useState<ProfileValues>(emptyProfile)
  const [billing, setBilling] = useState<AddressValues>(emptyAddress)
  const [shipping, setShipping] = useState<AddressValues>(emptyAddress)
  const [tokenName, setTokenName] = useState("")
  const [generatedToken, setGeneratedToken] = useState("")
  const [activeTab, setActiveTab] = useState<ProfileTab>("general")
  const [updateProfile, updateState] = auth.useUpdateProfileMutation()
  const [createToken, createTokenState] = auth.useCreateTokenMutation()
  const [deleteToken, deleteTokenState] = auth.useDeleteTokenMutation()
  const {
    data: tokenResponse,
    isFetching: isLoadingTokens,
    refetch: refetchTokens,
  } = auth.useGetTokensQuery()

  const tokens = useMemo<AccessTokenRecord[]>(
    () => tokenResponse?.data || [],
    [tokenResponse?.data]
  )

  const [mediaManagerOpen, setMediaManagerOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const billingAddress = user.addresses?.billing || {}
    const shippingAddress = user.addresses?.shipping || {}
    setValues({
      username: user.username || "",
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      theme: user.theme || "",
      language: user.language || "",
      avatar_link: user.avatar_link || user.profile_image || "",
      old_password: "",
      password: "",
      password_confirm: "",
    })
    setBilling({
      email: billingAddress.email || "",
      first_name: billingAddress.first_name || "",
      last_name: billingAddress.last_name || "",
      phone: billingAddress.phone || "",
      address_1: billingAddress.address_1 || "",
      address_2: billingAddress.address_2 || "",
      country: billingAddress.country || "",
      city: billingAddress.city || "",
      pobox: billingAddress.pobox || "",
      company: billingAddress.company || "",
    })
    setShipping({
      email: shippingAddress.email || "",
      first_name: shippingAddress.first_name || "",
      last_name: shippingAddress.last_name || "",
      phone: shippingAddress.phone || "",
      address_1: shippingAddress.address_1 || "",
      address_2: shippingAddress.address_2 || "",
      country: shippingAddress.country || "",
      city: shippingAddress.city || "",
      pobox: shippingAddress.pobox || "",
      company: shippingAddress.company || "",
    })
  }, [user])

  const setField = (field: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const setAddressField = (
    addressType: "billing" | "shipping",
    field: keyof AddressValues,
    value: string
  ) => {
    const setAddress = addressType === "billing" ? setBilling : setShipping
    setAddress((current) => ({ ...current, [field]: value }))
  }

  const saveProfile = async () => {
    if (!values.username.trim()) {
      showToast.error(t("Username is required."))
      return
    }

    const wantsPasswordChange = Boolean(
      values.old_password || values.password || values.password_confirm
    )

    if (wantsPasswordChange && !values.old_password) {
      showToast.error(t("Old password is required."))
      setActiveTab("security")
      return
    }

    if (wantsPasswordChange && !values.password) {
      showToast.error(t("Password is required."))
      setActiveTab("security")
      return
    }

    if (values.password && values.password.length < 6) {
      showToast.error(t("Password must contain at least 6 characters."))
      setActiveTab("security")
      return
    }

    if (wantsPasswordChange && values.password !== values.password_confirm) {
      showToast.error(t("Password confirmation does not match."))
      setActiveTab("security")
      return
    }

    try {
      const payload: Record<string, any> = {
        username: values.username,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        theme: values.theme,
        language: values.language,
        avatar_link: values.avatar_link,
        billing,
        shipping,
      }

      if (wantsPasswordChange) {
        payload.old_password = values.old_password
        payload.password = values.password
        payload.password_confirm = values.password_confirm
      }

      const response = await updateProfile(payload).unwrap()
      dispatch(setSessionData({ user: response.data }))
      setValues((current) => ({
        ...current,
        old_password: "",
        password: "",
        password_confirm: "",
      }))
      showToast.success(response?.message || t("The profile has been successfully saved."))
    } catch {
    }
  }

  const handleCreateToken = async () => {
    if (!tokenName.trim()) {
      showToast.error(t("Token Name is required."))
      return
    }

    try {
      const response = await createToken({ name: tokenName }).unwrap()
      setGeneratedToken(response?.data?.token || "")
      setTokenName("")
      refetchTokens()
      showToast.success(response?.message || t("Token created successfully."))
    } catch {
    }
  }

  const handleDeleteToken = async (token: AccessTokenRecord) => {
    if (token.current) {
      showToast.error(t("Please logout to revoke the current session."))
      return
    }
    const confirmed = await confirm({
      title: t("Delete"),
      description: t("You're about to delete a token that might be in use by an external app. Would you like to proceed?"),
      confirmLabel: t("Delete"),
      variant: "destructive",
    })
    if (!confirmed) return

    try {
      const response = await deleteToken(token.id).unwrap()
      refetchTokens()
      showToast.success(response?.message || t("Token deleted successfully."))
    } catch {
    }
  }

  const copyGeneratedToken = async () => {
    if (!generatedToken) return
    await navigator.clipboard.writeText(generatedToken)
    showToast.success(t("Token copied successfully."))
  }

  const renderAddressForm = (addressType: "billing" | "shipping") => {
    const addressValues = addressType === "billing" ? billing : shipping
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {addressFields.map((field) => (
            <div key={`${addressType}-${field.name}`} className="space-y-2">
              <UniFieldInput
                id={`${addressType}-${field.name}`}
                label={t(field.label)}
                placeholder={`${t("Enter")} ${t(field.label)}`}
                value={addressValues[field.name]}
                onChange={(event) => setAddressField(addressType, field.name, event.target.value)}
              />
              <p className="text-xs text-slate-500">{t(field.description)}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={saveProfile} disabled={updateState.isLoading}>
            <Save className="mr-2 size-4" />
            {t("Save")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardPage padding="none">
      <PermissionGuard permission={PERMISSIONS.special.manageProfile}>
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
          <div className="z-20 flex-none border-b border-gray-200 bg-white px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => router.push("/settings/users")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {user?.full_name || user?.username || t("My Profile")}
                  </h1>
                  <p className="text-xs font-medium text-gray-500">
                    {user?.email || t("Manage your profile, addresses, security, and API tokens.")}
                  </p>
                </div>
              </div>
              <Badge>{user?.status === 1 ? t("Deactive") : t("Active")}</Badge>
            </div>
          </div>

          <div className="flex-none">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileTab)}>
              <TabsList variant="line" className="w-full justify-start">
                {([
                  ["general", "General Info"],
                  ["billing", "Billing Address"],
                  ["shipping", "Shipping Address"],
                  ["security", "Security"],
                  ["token", "API Token"],
                ] as [ProfileTab, string][]).map(([tab, label]) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                  >
                    {t(label)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/50 p-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {activeTab === "general" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {profileFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <UniFieldInput
                          id={field.name}
                          label={t(field.label)}
                          placeholder={`${t("Enter")} ${t(field.label)}`}
                          type={field.type}
                          value={values[field.name]}
                          onChange={(event) => setField(field.name, event.target.value)}
                          required={Boolean("required" in field && field.required)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {/* Theme Selection */}
                    <div className="space-y-2">
                      <UniFieldSelect
                        label={t("Theme")}
                        value={values.theme}
                        onValueChange={(val) => setField("theme", val)}
                      >
                        <SelectItem value="light">{t("Light")}</SelectItem>
                        <SelectItem value="dark">{t("Dark")}</SelectItem>
                      </UniFieldSelect>
                      <p className="text-xs text-slate-500">
                        {t("Define what is the theme that applies to the dashboard.")}
                      </p>
                    </div>

                    {/* Avatar Selection */}
                    <div className="space-y-2">
                      <UniFieldInput
                        id="avatar_link"
                        label={t("Avatar")}
                        placeholder={`${t("Enter")} ${t("Avatar")}`}
                        value={values.avatar_link}
                        onChange={(event) => setField("avatar_link", event.target.value)}
                        suffix={
                          <button
                            type="button"
                            onClick={() => setMediaManagerOpen(true)}
                            className="flex h-full items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none"
                          >
                            <Search className="size-4" />
                          </button>
                        }
                      />
                      <p className="text-xs text-slate-500">
                        {t("Define the image that should be used as an avatar.")}
                      </p>
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-2">
                      <UniFieldSelect
                        label={t("Language")}
                        value={values.language}
                        onValueChange={(val) => setField("language", val)}
                      >
                        {supportedLanguages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {t(lang.label)}
                          </SelectItem>
                        ))}
                      </UniFieldSelect>
                      <p className="text-xs text-slate-500">
                        {t("Choose the language for the current account.")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button onClick={saveProfile} disabled={updateState.isLoading}>
                      <Save className="mr-2 size-4" />
                      {t("Save")}
                    </Button>
                  </div>
                </>
              )}

              {activeTab === "billing" && renderAddressForm("billing")}

              {activeTab === "shipping" && renderAddressForm("shipping")}

              {activeTab === "security" && (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    {securityFields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <UniFieldInput
                          id={field.name}
                          label={t(field.label)}
                          placeholder={`${t("Enter")} ${t(field.label)}`}
                          type="password"
                          value={values[field.name]}
                          onChange={(event) => setField(field.name, event.target.value)}
                        />
                        <p className="text-xs text-slate-500">{t(field.description)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button onClick={saveProfile} disabled={updateState.isLoading}>
                      <Save className="mr-2 size-4" />
                      {t("Save")}
                    </Button>
                  </div>
                </>
              )}

              {activeTab === "token" && (
                <div className="max-w-2xl space-y-5">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <KeyRound className="size-4" />
                      {t("About Token")}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {t("Tokens provide secure API access without sharing your username and password.")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <UniFieldInput
                        id="token_name"
                        label={t("Token Name")}
                        value={tokenName}
                        onChange={(event) => setTokenName(event.target.value)}
                        placeholder={`${t("Enter")} ${t("Token Name")}`}
                        containerClassName="flex-1"
                      />
                      <Button onClick={handleCreateToken} disabled={createTokenState.isLoading} className="h-10">
                        <Save className="mr-2 size-4" />
                        {t("Save Token")}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">{t("This will be used to identifier the token.")}</p>
                  </div>

                  {generatedToken ? (
                    <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-end gap-2">
                        <UniFieldInput
                          id="generated_token"
                          label={t("Generated Token")}
                          value={generatedToken}
                          readOnly
                          containerClassName="flex-1"
                        />
                        <Button type="button" variant="outline" onClick={copyGeneratedToken} className="h-10">
                          <Copy className="mr-2 size-4" />
                          {t("Copy")}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-2 border-b pb-2">
                      <h2 className="text-lg font-semibold">{t("Generated Tokens")}</h2>
                      <Button type="button" variant="outline" size="sm" onClick={() => refetchTokens()}>
                        <RefreshCw className="mr-2 size-4" />
                        {t("Refresh")}
                      </Button>
                    </div>

                    {isLoadingTokens ? (
                      <div className="py-6 text-center text-sm text-slate-500">{t("Loading...")}</div>
                    ) : tokens.length === 0 ? (
                      <div className="py-6 text-center text-sm text-slate-500">
                        {t("You haven't yet generated any token for your account. Create one to get started.")}
                      </div>
                    ) : (
                      <div className="divide-y rounded-md border">
                        {tokens.map((token) => (
                          <div key={token.id} className="flex items-center justify-between gap-4 p-3">
                            <div className="min-w-0">
                              <div className="truncate font-medium">{token.name || t("Untitled Token")}</div>
                              <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                                {token.current ? <div className="font-semibold text-slate-700">{t("Current Session")}</div> : null}
                                <div>{t("Created")}: {dateLabel(token.created_at)}</div>
                                <div>{t("Last Use")}: {t(dateLabel(token.last_used_at))}</div>
                                <div>{t("Expires")}: {t(dateLabel(token.expires_at))}</div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={deleteTokenState.isLoading || token.current}
                              onClick={() => handleDeleteToken(token)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t("Revoke")}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {confirmDialog}
        <MediaManagerDialog
          open={mediaManagerOpen}
          onOpenChange={setMediaManagerOpen}
          onSelect={(record) => {
            const selectedUrl = mediaImageUrl(record)
            if (!selectedUrl) {
              showToast.error(t("Selected media has no image URL."))
              return
            }
            setField("avatar_link", selectedUrl)
          }}
        />
      </PermissionGuard>
    </DashboardPage>
  )
}
