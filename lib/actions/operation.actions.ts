"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Tipagem simplificada para o payload da ação
interface OperationPayload {
  sendToGalleria: boolean
  // Adicionar todos os outros campos do formulário aqui
  [key: string]: any
}

export async function createOperation(payload: OperationPayload) {
  const supabase = createServerActionClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuário não autenticado.")
  }

  const { sendToGalleria, socios, ...operationData } = payload

  // 1. Salvar a operação no banco de dados da Giro Capital
  const { data: newOperation, error: operationError } = await supabase
    .from("operations")
    .insert({ ...operationData, created_by: user.id })
    .select()
    .single()

  if (operationError) {
    console.error("Supabase operation error:", operationError)
    throw new Error("Falha ao salvar a operação no banco de dados.")
  }

  // 2. Salvar os sócios, se houver
  if (socios && socios.length > 0) {
    const sociosData = socios.map((socio: any) => ({
      ...socio,
      operation_id: newOperation.id,
    }))
    const { error: sociosError } = await supabase.from("socios").insert(sociosData)
    if (sociosError) {
      console.error("Supabase socios error:", sociosError)
      // Considerar uma transação para rollback em produção
      throw new Error("Falha ao salvar os sócios.")
    }
  }

  // 3. Se marcado, enviar para a API do Galleria Bank
  if (sendToGalleria) {
    const galleriaPayload = {
      integracao: "Giro Capital",
      tipoOperacao: operationData.tipo_operacao,
      contratoPrioridadeAlta: operationData.contrato_prioridade_alta || false,
      divida: operationData.divida || "Nao",
      cobrarComissaoCliente: operationData.cobrar_comissao_cliente || "Nao",
      quantoPrecisa: operationData.quanto_precisa,
      observacao: operationData.observacao || "",
      tipoPessoa: operationData.tipo_pessoa,
      pagadorRecebedor: {
        cpfCnpj: operationData.pagador_cpf_cnpj,
        nome: operationData.pagador_nome,
        email: operationData.pagador_email,
        // ... outros campos do pagador
      },
      imovelCobranca: {
        // ... campos do imóvel
      },
      // ... outros campos condicionais
    }

    try {
      const response = await fetch("https://backoffice.galleriabank.com.br/sistema/siscoat/services/CriarOperacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GALLERIA_BANK_API_TOKEN}`,
        },
        body: JSON.stringify(galleriaPayload),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Galleria Bank API Error:", response.status, errorBody)
        // A operação já foi salva internamente, mas a integração falhou.
        // Pode-se atualizar o status da operação para indicar a falha na integração.
        throw new Error(`Falha na integração com Galleria Bank: ${response.statusText}`)
      }
    } catch (apiError) {
      console.error("Fetch to Galleria API failed:", apiError)
      throw apiError
    }
  }

  // Revalidar o cache para que a lista de operações seja atualizada
  revalidatePath("/operacoes")
  revalidatePath("/dashboard")
}
