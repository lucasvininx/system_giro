"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function login(prevState: any, formData: FormData) {
  const email = String(formData.get("email"))
  const password = String(formData.get("password"))
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "Credenciais inválidas. Verifique seu e-mail e senha." }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signup(prevState: any, formData: FormData) {
  const email = String(formData.get("email"))
  const password = String(formData.get("password"))
  const fullName = String(formData.get("full_name"))
  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes("User already registered")) {
      return { error: "Este e-mail já está cadastrado." }
    }
    return { error: "Não foi possível criar a conta. Verifique os dados e tente novamente." }
  }

  return { success: true }
}

export async function logout() {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  redirect("/login")
}
