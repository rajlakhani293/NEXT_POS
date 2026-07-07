"use client"

import { LoginForm } from "@/components/login-form"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-y-auto bg-slate-100 px-4 pb-10">
      <LoginForm />
    </main>
  )
}
