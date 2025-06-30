"use client"

import { useFormState, useFormStatus } from "react-dom"
import { signup } from "@/app/login/actions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Criando conta..." : "Criar Conta"}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useFormState(signup, null)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome Completo</Label>
        <Input id="full_name" name="full_name" placeholder="Seu Nome Completo" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Cadastro</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Sucesso!</AlertTitle>
          <AlertDescription>
            Cadastro realizado! Por favor, verifique seu e-mail para confirmar sua conta antes de fazer o login.
          </AlertDescription>
        </Alert>
      )}
      <SubmitButton />
    </form>
  )
}
