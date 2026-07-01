"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Cookies from "js-cookie"
import { BiLoaderCircle } from "react-icons/bi"

import { auth, type AuthUser } from "@/lib/api/auth"
import { useTranslation } from "@/lib/contexts/TranslationContext"
import { useAppDispatch } from "@/lib/redux/hooks"
import { useSession } from "@/lib/redux/session-provider"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { showToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { UniFieldInput } from "@/components/ui/unifield-input"

const defaultDeviceName = "Web App"
const recoveryEnabled = true

export function LoginForm({
  initialMode = "login",
  className,
  ...props
}: React.ComponentProps<"div"> & { initialMode?: "login" | "register" }) {
  const router = useRouter()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { refreshSession } = useSession()
  const mode = initialMode
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [login, { isLoading: isLoggingIn }] = auth.useLoginMutation()
  const [register, { isLoading: isRegistering }] = auth.useRegisterMutation()
  const isLoading = isLoggingIn || isRegistering

  const completeLogin = async (token: string, user: AuthUser) => {
    Cookies.set("token", token, { expires: 1, path: "/" })
    dispatch(setSessionData({ user }))
    await refreshSession()
    router.replace("/dashboard")
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (username.trim().length < 5) {
      nextErrors.username = t("Username must contain at least 5 characters.")
    }
    if (password.length < 6) {
      nextErrors.password = t("Password must contain at least 6 characters.")
    }
    if (mode === "register") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = t("Enter a valid email address.")
      }
      if (password !== passwordConfirm) {
        nextErrors.passwordConfirm = t("Password confirmation does not match.")
      }
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    try {
      const payLoad = {
        username: username.trim(),
        password,
        device_name: defaultDeviceName,
        ...(mode === "register"
          ? {
              email: email.trim(),
              password_confirm: passwordConfirm,
            }
          : {}),
      }
      const response =
        mode === "login"
          ? await login(payLoad).unwrap()
          : await register(payLoad).unwrap()
      showToast.success(
        response.message ||
          t(mode === "login" ? "You have successfully logged in." : "The account has been successfully created.")
      )
      await completeLogin(response.data.token, response.data.user)
    } catch {
      // API errors are displayed by the base query interceptor.
    }
  }

  return (
    <div
      className={cn("flex w-full max-w-md flex-col gap-6", className)}
      {...props}
    >
      <div className="flex justify-center py-6">
        <div className="flex h-14 min-w-32 items-center justify-center rounded bg-white px-6 text-2xl font-semibold tracking-tight text-slate-950 shadow-sm">
          {t("POS")}
        </div>
      </div>
      <div className="overflow-hidden rounded bg-white shadow">
        <div className="p-3">
          <form id="auth-form" onSubmit={handleSubmit} onKeyUp={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.requestSubmit()
            }
          }}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">{t("Username")}</FieldLabel>
                <UniFieldInput
                  id="username"
                  value={username}
                  placeholder={t("Provide your username.")}
                  autoComplete="username"
                  disabled={isLoading}
                  error={errors.username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setErrors((current) => ({ ...current, username: "" }))
                  }}
                />
              </Field>

              {mode === "register" ? (
                <Field>
                  <FieldLabel htmlFor="email">{t("Email")}</FieldLabel>
                  <UniFieldInput
                    id="email"
                    type="email"
                    value={email}
                    placeholder={t("Provide your email.")}
                    autoComplete="email"
                    disabled={isLoading}
                    error={errors.email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setErrors((current) => ({ ...current, email: "" }))
                    }}
                  />
                </Field>
              ) : null}

              <Field>
                <FieldLabel htmlFor="password">{t("Password")}</FieldLabel>
                <UniFieldInput
                  id="password"
                  type="password"
                  value={password}
                  placeholder={t("Provide your password.")}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  disabled={isLoading}
                  error={errors.password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((current) => ({ ...current, password: "" }))
                  }}
                />
              </Field>

              {mode === "register" ? (
                <Field>
                  <FieldLabel htmlFor="password-confirm">
                    {t("Password Confirm")}
                  </FieldLabel>
                  <UniFieldInput
                    id="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    placeholder={t("Should be the same as the password.")}
                    autoComplete="new-password"
                    disabled={isLoading}
                    error={errors.passwordConfirm}
                    onChange={(event) => {
                      setPasswordConfirm(event.target.value)
                      setErrors((current) => ({
                        ...current,
                        passwordConfirm: "",
                      }))
                    }}
                  />
                </Field>
              ) : null}

              {recoveryEnabled ? (
                <div className="flex w-full items-center justify-center py-4">
                  <a href="/password-lost" className="text-sm text-blue-600 hover:underline">
                    {t("Password Forgotten ?")}
                  </a>
                  {mode === "login" ? (
                    <>
                      <div className="mx-4 h-[15px] border-l" />
                      <Link
                        href="/register"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {t("Register")}
                      </Link>
                    </>
                  ) : null}
                  {mode === "register" ? (
                    <>
                      <div className="mx-4 h-[15px] border-l" />
                      <Link
                        href="/login"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {t("Sign In")}
                      </Link>
                    </>
                  ) : null}
                </div>
              ) : null}
            </FieldGroup>
          </form>
        </div>
        <div className="flex items-center justify-end border-t bg-slate-50 p-3">
          <Button
            type="button"
            variant="blue"
            disabled={isLoading}
            className="justify-between"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>("#auth-form")
              form?.requestSubmit()
            }}
          >
            {isLoading ? <BiLoaderCircle className="mr-2 size-5 animate-spin" /> : null}
            <span>{mode === "login" ? t("Sign In") : t("Register")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
