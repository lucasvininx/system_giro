import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LoginForm } from "./_components/login-form"
import { SignupForm } from "./_components/signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function LoginPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <img src="/placeholder.svg?width=64&height=64" alt="Giro Capital Logo" className="mx-auto h-16 w-16" />
          <h1 className="text-3xl font-bold mt-2">Giro Capital</h1>
          <p className="text-muted-foreground">Acesse sua conta para continuar</p>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Insira seu e-mail e senha para acessar o sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro</CardTitle>
                <CardDescription>Crie uma nova conta para começar a registrar operações.</CardDescription>
              </CardHeader>
              <CardContent>
                <SignupForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="px-8 text-center text-sm text-muted-foreground mt-4">
          Ao continuar, você concorda com nossos{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Termos de Serviço
          </Link>{" "}
          e{" "}
          <Link href="#" className="underline underline-offset-4 hover:text-primary">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
