-- Habilitar a extensão pgcrypto para usar gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Perfis de Usuário
-- Armazena dados públicos e o tipo de permissão (role)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' -- Pode ser 'ADMIN' ou 'USER'
);

-- Habilitar Row Level Security para a tabela de perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tabela de Parceiros
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  document TEXT NOT NULL UNIQUE, -- CPF ou CNPJ
  phone TEXT,
  email TEXT,
  bank_account TEXT,
  pix_key TEXT,
  notes TEXT
);

-- Habilitar Row Level Security para Parceiros
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view all partners." ON partners FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert partners." ON partners FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update partners." ON partners FOR UPDATE USING (get_user_role() = 'ADMIN');
CREATE POLICY "Admins can delete partners." ON partners FOR DELETE USING (get_user_role() = 'ADMIN');


-- Tabela de Operações (a tabela principal)
CREATE TABLE operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  partner_id UUID REFERENCES partners(id),
  
  -- Status da Operação
  status TEXT DEFAULT 'Pré-análise',

  -- Campos para Galleria Bank API
  integracao TEXT DEFAULT 'Giro Capital',
  tipo_operacao TEXT, -- "Home Equity" | "Emprestimo"
  contrato_prioridade_alta BOOLEAN,
  divida TEXT, -- "Sim" | "Nao"
  divida_valor NUMERIC,
  cobrar_comissao_cliente TEXT, -- "Sim" | "Nao"
  comissao_cliente_valor_fixo NUMERIC,
  comissao_cliente_porcentagem NUMERIC,
  quanto_precisa NUMERIC,
  observacao TEXT,
  tipo_pessoa TEXT, -- "PF" | "PJ"

  -- Pagador/Recebedor
  pagador_cpf_cnpj TEXT,
  pagador_nome TEXT,
  pagador_email TEXT,
  pagador_tel_celular TEXT,
  pagador_sexo TEXT,
  pagador_data_nascimento DATE,
  pagador_estado_civil TEXT,

  -- Imóvel
  imovel_cep TEXT,
  imovel_endereco TEXT,
  imovel_complemento TEXT,
  imovel_cidade TEXT,
  imovel_bairro TEXT,
  imovel_estado TEXT,
  imovel_numero_cartorio TEXT,
  imovel_cartorio_registro TEXT,
  imovel_cartorio_estado TEXT,
  imovel_cartorio_municipio TEXT,
  imovel_numero_matricula TEXT,
  imovel_valor_estimado NUMERIC,
  imovel_latitude TEXT,
  imovel_longitude TEXT,
  imovel_tipo TEXT, -- "Casa De Condomínio", etc.

  -- Campos Internos
  cover_image_url TEXT,
  tipos_imoveis_selecionados TEXT[], -- Array de strings para seleção múltipla
  
  -- Informações Empresariais (se PJ)
  empresa_cnpj TEXT,
  faturamento_mensal NUMERIC,
  faturamento_anual NUMERIC,
  quantidade_funcionarios INTEGER,
  possui_dividas_empresa BOOLEAN,
  divida_valor_empresa NUMERIC,
  divida_instituicao_empresa TEXT,
  
  -- Campos gerais
  possui_dividas_processos_judiciais BOOLEAN,
  imovel_alugado BOOLEAN,
  valor_aluguel NUMERIC
);

-- Tabela de Sócios (relacionada a uma operação)
CREATE TABLE socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  marital_status TEXT,
  participation_percentage NUMERIC
);

-- Habilitar Row Level Security
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE socios ENABLE ROW LEVEL SECURITY;

-- Função para pegar o role do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de Acesso para Operações
CREATE POLICY "Admins can see all operations." ON operations FOR SELECT USING (get_user_role() = 'ADMIN');
CREATE POLICY "Users can see their own operations." ON operations FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Authenticated users can create operations." ON operations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update operations." ON operations FOR UPDATE USING (get_user_role() = 'ADMIN');
-- Ninguém pode deletar operações diretamente, conforme regra de negócio.

-- Políticas de Acesso para Sócios
CREATE POLICY "Users can manage socios for operations they have access to." ON socios
  FOR ALL
  USING (
    (get_user_role() = 'ADMIN') OR
    (EXISTS (SELECT 1 FROM operations WHERE id = socios.operation_id AND created_by = auth.uid()))
  );

-- Configuração do Storage para imagens das operações
INSERT INTO storage.buckets (id, name, public) VALUES ('operation_images', 'operation_images', true);

CREATE POLICY "Operation images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'operation_images');
CREATE POLICY "Authenticated users can upload operation images." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'operation_images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own images." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'operation_images');

-- Função para criar um perfil para um novo usuário
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'USER');
  return new;
end;
$$;

-- Trigger para executar a função após a criação de um novo usuário
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
