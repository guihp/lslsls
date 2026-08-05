# Dev Dashboard / Daily Tasks

Clone funcional de gestão de demandas por projeto, progresso diário/semanal, documentos e permissões individuais.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase Auth, Postgres (RLS), Storage

## Setup

1. Copie `.env.example` para `.env.local` e preencha URL + anon key do Supabase.
2. Schema já aplicado no projeto `user-daily` (migration `initial_schema` + `secure_functions`).
3. No Supabase Auth, desative **Confirm email** em desenvolvimento (Authentication → Providers → Email) para o primeiro cadastro entrar direto.
4. Rode:

```bash
npm install
npm run dev
```

## Fluxo inicial (banco vazio)

1. Conta ADMIN já existente (ou primeiro usuário legado).
2. **Cadastro público desativado** — `/cadastro` redireciona para login.
3. ADMIN cria usuários em `/admin/usuarios` (edge function `admin-create-user`).
4. Defina telas e flag **Criar demanda** por usuário.
5. Crie clientes, sprints, demandas e valide progresso.

Logo: `public/LogoIAFE.jpeg` · cor marca: laranja `#FF6B00`.

## Telas

| Rota | Função |
|------|--------|
| `/dashboard` | Tarefas da semana + progresso diário |
| `/clientes` | Pipeline por status |
| `/clientes/[id]` | Detalhe, sprints, anexos, comentários, atividade |
| `/documentos` | Docs / tutoriais / melhorias |
| `/progresso` | Medidor + histórico (vazio até haver dados) |
| `/admin/usuarios` | Permissões por usuário |
| `/perfil` | Foto, nome, senha |

## Scripts

```bash
npm run dev
npm run build
npm test
```

## Coolify

Deploy with the repo **Dockerfile** (multi-stage Next.js standalone).

| Setting | Value |
|---------|--------|
| Build pack | Dockerfile |
| Port | `3000` |
| Healthcheck | `GET /login` or `GET /` |

**Environment variables** (set as build args **and** runtime env — `NEXT_PUBLIC_*` are inlined at build):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After deploy: point your domain in Coolify, then add Redirect URLs in Supabase Auth (`https://seu-dominio/*`). Edge Function `admin-create-user` lives in Supabase (not this image); deploy it separately if it is not already live.
