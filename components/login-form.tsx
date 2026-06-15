"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { BiLoaderCircle } from "react-icons/bi"
import { GalleryVerticalEnd } from "lucide-react"

import { auth, type AuthUser } from "@/lib/api/auth"
import { useAppDispatch } from "@/lib/redux/hooks"
import { useSession } from "@/lib/redux/session-provider"
import { setSessionData } from "@/lib/redux/sessionSlice"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { UniFieldInput } from "@/components/ui/unifield-input"

const defaultDeviceName = "Web App"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { refreshSession } = useSession()
  const [mode, setMode] = useState<"login" | "register">("login")
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
    if (username.trim().length < 3) {
      nextErrors.username = "Username must contain at least 3 characters."
    }
    if (password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters."
    }
    if (mode === "register") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        nextErrors.email = "Enter a valid email address."
      }
      if (password !== passwordConfirm) {
        nextErrors.passwordConfirm = "Password confirmation does not match."
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
      await completeLogin(response.data.token, response.data.user)
    } catch {
      // API errors are displayed globally by the base query interceptor.
    }
  }

  return (
    <div
      className={cn("flex w-full max-w-md flex-col gap-6 px-4", className)}
      {...props}
    >
      <Card className="w-full">
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#3155f6] text-white shadow-sm">
                  <GalleryVerticalEnd className="size-6" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                    {mode === "login" ? "Welcome back" : "Create your account"}
                  </h1>
                  <FieldDescription>
                    Sign in securely with your username and password.
                  </FieldDescription>
                </div>
              </div>

              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <UniFieldInput
                  id="username"
                  value={username}
                  placeholder="Enter username"
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
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <UniFieldInput
                    id="email"
                    type="email"
                    value={email}
                    placeholder="Enter email address"
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
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <UniFieldInput
                  id="password"
                  type="password"
                  value={password}
                  placeholder="Enter password"
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
                    Confirm Password
                  </FieldLabel>
                  <UniFieldInput
                    id="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    placeholder="Confirm password"
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

              <Field>
                <Button
                  type="submit"
                  variant="blue"
                  size="lg"
                  disabled={isLoading}
                  className="w-full text-base font-semibold"
                >
                  {isLoading ? (
                    <BiLoaderCircle className="size-5 animate-spin" />
                  ) : mode === "login" ? (
                    "Login"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-[#3155f6] hover:underline"
                  onClick={() => {
                    setMode((current) =>
                      current === "login" ? "register" : "login"
                    )
                    setErrors({})
                  }}
                >
                  {mode === "login" ? "Sign up" : "Login"}
                </button>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
