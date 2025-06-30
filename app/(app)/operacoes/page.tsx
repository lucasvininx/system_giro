import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle } from "lucide-react"

export default async function OperacoesPage() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch operations. The RLS policy will automatically filter them.
  const { data: operations, error } = await supabase
    .from("operations")
    .select("id, created_at, pagador_nome, quanto_precisa, status")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching operations:", error)
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Crédito Aprovado":
      case "Contrato Assinado":
        return "success"
      case "Recusada":
        return "destructive"
      case "Análise":
      case "Pré-análise":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Operações</h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as suas operações.</p>
        </div>
        <Button asChild>
          <Link href="/operacoes/nova">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Operação
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Solicitado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations?.map((op) => (
                <TableRow key={op.id}>
                  <TableCell>{new Date(op.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="font-medium">{op.pagador_nome}</TableCell>
                  <TableCell>
                    {Number(op.quanto_precisa).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(op.status) as any}>{op.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
