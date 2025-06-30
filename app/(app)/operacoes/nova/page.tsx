import { OperationForm } from "./_components/operation-form"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export default async function NovaOperacaoPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: partners } = await supabase.from("partners").select("id, name")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Operação</h1>
        <p className="text-muted-foreground">Preencha o formulário abaixo para registrar uma nova operação.</p>
      </div>
      <OperationForm partners={partners || []} />
    </div>
  )
}
