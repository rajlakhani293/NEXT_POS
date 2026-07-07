"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, KeyRound, RefreshCw, Save, Trash2 } from "lucide-react"

import { PermissionGuard } from "@/components/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const profileFields = [
  { name: "username", label: "Username", type: "text", required: true },
  { name: "full_name", label: "Full Name", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "text" },
] as const

const attributeFields = [
  { name: "theme", label: "Theme", description: "Define what is the theme that applies to the dashboard." },
  { name: "avatar_link", label: "Avatar", description: "Define the image that should be used as an avatar." },
  { name: "language", label: "Language", description: "Choose the language for the current account." },
] as const

const securityFields = [
  { name: "old_password", label: "Old Password", description: "Provide the old password." },
  { name: "password", label: "Password", description: "Change your password with a better stronger password." },
  { name: "password_confirm", label: "Password Confirmation", description: "Change your password with a better stronger password." },
] as const

function dateLabel(value?: string | null) {
  if (!value) return "Never"
  return value
}

export default function UserProfilePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.session.user)
  const [values, setValues] = useState<ProfileValues>(emptyProfile)
  const [tokenName, setTokenName] = useState("")
  const [generatedToken, setGeneratedToken] = useState("")
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

  useEffect(() => {
    if (!user) return
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
  }, [user])

  const setField = (field: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const saveProfile = async () => {
    if (!values.username.trim()) {
      showToast.error(t("Username is required."))
      return
    }

    if (values.password && values.password !== values.password_confirm) {
      showToast.error(t("Password confirmation does not match."))
      return
    }

    try {
      const payload: Record<string, string> = {
        username: values.username,
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        theme: values.theme,
        language: values.language,
        avatar_link: values.avatar_link,
      }

      if (values.password) {
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
    } catch (error: any) {
      showToast.error(error?.data?.message || t("Unable to proceed, the form is not valid."))
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
    } catch (error: any) {
      showToast.error(error?.data?.message || t("Unable to proceed, the form is not valid."))
    }
  }

  const handleDeleteToken = async (token: AccessTokenRecord) => {
    if (!window.confirm(t("You're about to delete a token that might be in use by an external app. Would you like to proceed?"))) {
      return
    }

    try {
      const response = await deleteToken(token.id).unwrap()
      refetchTokens()
      showToast.success(response?.message || t("Token deleted successfully."))
    } catch (error: any) {
      showToast.error(error?.data?.message || t("An unexpected error occurred."))
    }
  }

  const copyGeneratedToken = async () => {
    if (!generatedToken) return
    await navigator.clipboard.writeText(generatedToken)
    showToast.success(t("Token copied successfully."))
  }

  return (
    <PermissionGuard permission={PERMISSIONS.special.manageProfile}>
      <div className="max-w-5xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              {user?.full_name || user?.username || t("My Profile")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{user?.email || "-"}</p>
          </div>
          <Badge>{user?.status === 1 ? t("Deactive") : t("Active")}</Badge>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">{t("General")}</TabsTrigger>
            <TabsTrigger value="security">{t("Security")}</TabsTrigger>
            <TabsTrigger value="token">{t("API Token")}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="rounded-md border bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              {profileFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{t(field.label)}</Label>
                  <Input
                    id={field.name}
                    type={field.type}
                    value={values[field.name]}
                    onChange={(event) => setField(field.name, event.target.value)}
                    required={Boolean("required" in field && field.required)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {attributeFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{t(field.label)}</Label>
                  <Input
                    id={field.name}
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
          </TabsContent>

          <TabsContent value="security" className="rounded-md border bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              {securityFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{t(field.label)}</Label>
                  <Input
                    id={field.name}
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
          </TabsContent>

          <TabsContent value="token" className="rounded-md border bg-white p-5 shadow-sm">
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
                <Label htmlFor="token_name">{t("Token Name")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="token_name"
                    value={tokenName}
                    onChange={(event) => setTokenName(event.target.value)}
                    placeholder={t("Token Name")}
                  />
                  <Button onClick={handleCreateToken} disabled={createTokenState.isLoading}>
                    <Save className="mr-2 size-4" />
                    {t("Save Token")}
                  </Button>
                </div>
                <p className="text-xs text-slate-500">{t("This will be used to identifier the token.")}</p>
              </div>

              {generatedToken ? (
                <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <Label htmlFor="generated_token">{t("Generated Token")}</Label>
                  <div className="flex gap-2">
                    <Input id="generated_token" value={generatedToken} readOnly />
                    <Button type="button" variant="outline" onClick={copyGeneratedToken}>
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
                            <div>{t("Created")}: {dateLabel(token.created_at)}</div>
                            <div>{t("Last Use")}: {t(dateLabel(token.last_used_at))}</div>
                            <div>{t("Expires")}: {t(dateLabel(token.expires_at))}</div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={deleteTokenState.isLoading}
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
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}
