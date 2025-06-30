"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import { createOperation } from "@/lib/actions/operation.actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

// Schema de validação simplificado para o exemplo
const formSchema = z.object({
  partner_id: z.string().uuid().optional(),
  tipo_operacao: z.string().min(1, "Campo obrigatório"),
  quanto_precisa: z.coerce.number().min(1, "Valor deve ser maior que zero"),
  tipo_pessoa: z.string().min(1, "Campo obrigatório"),
  pagador_nome: z.string().min(3, "Nome é obrigatório"),
  pagador_cpf_cnpj: z.string().min(11, "Documento inválido"),
  pagador_email: z.string().email("E-mail inválido"),
  observacao: z.string().optional(),
  socios: z
    .array(
      z.object({
        name: z.string().min(1),
        cpf: z.string().min(11),
      }),
    )
    .optional(),
  sendToGalleria: z.boolean().default(false),
})

type OperationFormValues = z.infer<typeof formSchema>

interface OperationFormProps {
  partners: { id: string; name: string }[]
}

export function OperationForm({ partners }: OperationFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const form = useForm<OperationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      socios: [],
      sendToGalleria: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socios",
  })

  const tipoPessoa = form.watch("tipo_pessoa")

  async function onSubmit(data: OperationFormValues) {
    try {
      await createOperation(data)
      toast({
        title: "Sucesso!",
        description: "Operação criada com sucesso.",
      })
      router.push("/operacoes")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a operação. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Dados da Operação</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <FormField
              name="tipo_operacao"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Operação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Home Equity">Home Equity</SelectItem>
                      <SelectItem value="Emprestimo">Empréstimo com Garantia</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="quanto_precisa"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Necessário (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <FormField
                name="tipo_pessoa"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pessoa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PF">Pessoa Física</SelectItem>
                        <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="pagador_nome"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome Completo / Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="pagador_cpf_cnpj"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF / CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="pagador_email"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="cliente@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {tipoPessoa === "PJ" && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Sócios</h3>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", cpf: "" })}>
                      Adicionar Sócio
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-4 p-4 border rounded-md">
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <FormField
                            name={`socios.${index}.name`}
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome do Sócio</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            name={`socios.${index}.cpf`}
                            control={form.control}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CPF do Sócio</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mt-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integração e Finalização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              name="sendToGalleria"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enviar para Galleria Bank</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marque esta opção para enviar os dados da operação para análise no Galleria Bank.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              name="observacao"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Adicionais</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes importantes sobre a operação..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Operação"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
