import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp } from "lucide-react"

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single()
  const isAdmin = profile?.role === "ADMIN"

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  // Constrói a query base
  let query = supabase
    .from("operations")
    .select("id, pagador_nome, status, quanto_precisa, created_by, profiles(full_name)", { count: "exact" })
    .gte("created_at", firstDayOfMonth)
    .lte("created_at", lastDayOfMonth)

  // Se não for admin, filtra pelo usuário logado
  if (!isAdmin) {
    query = query.eq("created_by", user!.id)
  }

  const { data: monthOperations, count: totalOperacoesMes, error } = await query

  if (error) {
    console.error("Error fetching dashboard data:", error)
  }

  const valorTotalMes = monthOperations?.reduce((acc, op) => acc + Number(op.quanto_precisa || 0), 0) || 0

  // Query para operações recentes (sem filtro de data)
  let recentQuery = supabase
    .from("operations")
    .select("id, pagador_nome, status, created_by, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(5)

  if (!isAdmin) {
    recentQuery = recentQuery.eq("created_by", user!.id)
  }

  const { data: operacoesRecentes } = await recentQuery

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
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operações no Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOperacoesMes || 0}</div>
            <p className="text-xs text-muted-foreground">Total de operações neste mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total no Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {valorTotalMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <p className="text-xs text-muted-foreground">Soma dos valores solicitados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operações Recentes</CardTitle>
          <CardDescription>As últimas operações registradas no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operacoesRecentes?.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.pagador_nome}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(op.status) as any}>{op.status}</Badge>
                  </TableCell>
                  <TableCell>{op.profiles?.full_name || "N/A"}</TableCell>
                </TableRow>
              ))}
              {(!operacoesRecentes || operacoesRecentes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhuma operação recente encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
