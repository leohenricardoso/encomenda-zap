📦 PROJECT_CONTEXT.md

SaaS de Encomendas e Catálogo Digital (MVP)

1️⃣ Visão Geral do Projeto

Este projeto é um SaaS de encomendas sob demanda e catálogo digital, focado em pequenos e médios comércios (padarias, confeitarias, marmitarias, lojas artesanais, serviços sob demanda).

Objetivo principal

Permitir que lojistas:

Cadastrem produtos

Disponibilizem um catálogo público via link

Recebam encomendas com:

Retirada agendada

Entrega opcional, limitada por CEP

Clientes realizam pedidos sem necessidade de login completo, informando apenas nome e WhatsApp, com possibilidade de completar cadastro posteriormente.

2️⃣ Stack Técnica
Frontend:

- Next.js (App Router)
- TypeScript
- Tailwind CSS (ou similar)
- Server Components quando aplicável

Backend:

- Backend no próprio Next.js (/app/api)
- Arquitetura DDD em camadas: domain / application / controllers / infra / shared
- REST API
- Composition Root centraliza toda a injeção de dependência
- Código preparado para migração direta para NestJS

Banco de Dados:

- PostgreSQL
- Prisma ORM

Auth:

- Autenticação segura (JWT ou session-based)
- Middleware protegendo rotas privadas
- Cookies HTTP-only quando aplicável

Infra / Deploy:

- Vercel (plano gratuito no MVP)
- Storage externo (S3, R2, Cloudinary ou similar)

3️⃣ Arquitetura do Projeto

Fluxo obrigatório de uma requisição:

```
Request HTTP
  → /app/api (route handler — uma linha)
  → Controller        (parse HTTP, extrair campos, chamar use case)
  → Application UseCase (orquestrar domínio, multi-tenancy, transações)
  → Domain            (entidades, interfaces de repositório)
  → Infra Repository  (Prisma — única camada que toca o banco)
  → Response padronizada
```

Estrutura de Pastas

```
src/
├── domain/                         ← Zero imports de Prisma ou Next.js
│   ├── product/
│   │   ├── Product.ts              ← Entidade + tipos de input/output
│   │   └── IProductRepository.ts  ← Interface (contrato de persistência)
│   ├── auth/
│   │   ├── Admin.ts                ← Entidade Admin
│   │   └── IAdminRepository.ts    ← Interface
│   └── store/
│       ├── types.ts                ← CreateStoreInput, CreateStoreOutput
│       └── IStoreRepository.ts    ← Interface
│
├── application/                    ← Orquestração; sem imports de Next.js ou Prisma
│   ├── ports/
│   │   └── IPasswordHasher.ts     ← Port: abstração de hashing (argon2, bcrypt…)
│   ├── auth/
│   │   └── LoginUseCase.ts
│   ├── store/
│   │   └── RegisterStoreUseCase.ts
│   └── product/
│       ├── CreateProductUseCase.ts
│       ├── ListProductsUseCase.ts
│       ├── GetProductByIdUseCase.ts
│       ├── UpdateProductUseCase.ts
│       └── DeleteProductUseCase.ts
│
├── controllers/
│   └── http/                       ← Adapters HTTP; sem regras de negócio
│       ├── AuthController.ts
│       └── ProductController.ts
│
├── infra/                          ← Única camada que importa Prisma / Next.js
│   ├── prisma/                     ← Client Prisma, schema, migrations
│   ├── repositories/               ← Implementações concretas (Prisma)
│   │   ├── PrismaProductRepository.ts
│   │   ├── PrismaAdminRepository.ts
│   │   └── PrismaStoreRepository.ts
│   ├── security/
│   │   ├── Argon2PasswordHasher.ts ← Implementa IPasswordHasher
│   │   └── tokenService.ts         ← JWT (jose)
│   ├── http/                       ← Glue Next.js-specific
│   │   ├── middleware/withAuth.ts  ← HOF para rotas autenticadas
│   │   ├── auth/getSession.ts      ← Helper para Server Components
│   │   └── cookies/authCookie.ts
│   └── composition/
│       └── index.ts                ← Composition Root (único ponto de new)
│
├── shared/                         ← Zero dependência de framework
│   ├── errors/AppError.ts
│   └── http/                       ← HttpStatus, response helpers
│
app/
├── api/                            ← Route handlers: uma linha cada
│   ├── auth/{login,register,logout}/route.ts
│   ├── products/route.ts
│   └── products/[id]/route.ts
├── (protected)/                    ← Rotas autenticadas (dashboard)
└── login/                          ← Rota pública
```

4️⃣ Princípios Arquiteturais

**Regras de camada — NUNCA QUEBRAR:**

| Camada                      | Pode importar                                       | NUNCA importa                    |
| --------------------------- | --------------------------------------------------- | -------------------------------- |
| `domain/`                   | `shared/`                                           | Prisma, Next.js, argon2, jose    |
| `application/`              | `domain/`, `shared/`, ports de `application/ports/` | Prisma, Next.js                  |
| `controllers/`              | `application/`, `infra/http/`, `shared/`            | regras de negócio, Prisma direto |
| `infra/`                    | tudo                                                | —                                |
| `app/api/` (route handlers) | apenas controllers via `infra/composition`          | qualquer lógica direta           |

**Responsabilidades por camada:**

- **domain/** — Entidades puras e interfaces de repositório. Testável sem banco, sem framework.
- **application/** — Use cases (classes com DI). Orquestram domínio, aplicam multi-tenancy, controlam transações. Injetam dependências via interfaces (ports).
- **controllers/http/** — Adapters. Parse do request HTTP, guardas de tamanho, chamada do use case, mapeamento para NextResponse.
- **infra/repositories/** — Implementações Prisma dos contratos de domínio. Única camada que usa `@prisma/client`. Converte tipos Prisma (ex: Decimal) para tipos de domínio.
- **infra/composition/** — Composition Root. Único lugar onde `new` é chamado em classes de infra. Exporta singletons (controllers, use cases) consumidos pelos route handlers.
- **app/api/** — Route handlers de uma linha: `export const POST = authController.login`.

**Migração para NestJS:**

O código foi escrito para que a migração seja mecânica:

- Use cases (`@Injectable()`) → providers no `@Module()`
- Interfaces de repositório → tokens de injeção: `{ provide: 'IProductRepository', useClass: PrismaProductRepository }`
- `IPasswordHasher` port → trocável sem tocar use cases
- Controllers → `@Controller()` com `@UseGuards(JwtAuthGuard)` em vez de `withAuth`
- Composition Root → `AppModule`

5️⃣ Modelo de Multi-Tenancy

Toda entidade pertence a uma Store (Loja)

Um User Admin pertence a uma Store

O storeId:

Nunca vem do client

Sempre é derivado do usuário autenticado

Todas as queries devem ser filtradas por storeId

6️⃣ Regras de Negócio Essenciais
Usuários / Loja

Usuário administrador cria e gerencia sua loja

Um usuário pode ter apenas uma loja no MVP

Login obrigatório apenas para administradores

Clientes

Cliente fornece:

Nome

WhatsApp

Cliente fica vinculado à Store

Cadastro pode ser incompleto inicialmente

Produtos

Produto pertence a uma Store

Produto pode ter:

Nome

Descrição

Preço

Imagem

Ativo/Inativo

Apenas produtos ativos aparecem no catálogo público

Encomendas

Cliente pode selecionar:

Vários produtos e quantidades

Escolhe:

Data

Horário de retirada (definido pelo admin)

OU entrega (limitada por CEP)

Encomenda tem status:

Pendente

Aprovada

Cancelada

Concluída

7️⃣ Horários e Entrega
Retirada

Admin define horários disponíveis por dia

Cliente escolhe um horário disponível

Entrega

Admin define:

CEP inicial e final (range)

Sistema valida se o CEP do cliente é atendido

8️⃣ Comunicação
MVP

Geração de link WhatsApp:

Abre WhatsApp Web/App

Mensagem pré-preenchida

Notificação para lojista:

WhatsApp (link)

Email (opcional)

Sem envio automático de mensagens no MVP (evita custos e bloqueios).

9️⃣ Upload e Armazenamento de Imagens

Upload feito pelo frontend

Imagem enviada diretamente para Storage externo

Backend armazena apenas a URL

Evitar upload direto pelo backend no MVP

🔐 10️⃣ Segurança (Obrigatório)

Senhas com hash seguro (bcrypt ou similar)

JWT ou sessões com expiração

Cookies HTTP-only

Validação de input (Zod ou similar)

Rate limit básico em endpoints sensíveis

Nenhuma informação sensível exposta no catálogo público

📜 11️⃣ LGPD (Brasil)

Coletar apenas dados necessários:

Nome

WhatsApp

Informar finalidade do uso

Permitir exclusão de dados sob solicitação

Não compartilhar dados com terceiros

Uso interno apenas para gestão de pedidos

🚧 12️⃣ Status do Projeto
Sprint 1:
✔ Setup do projeto (Next.js 16, TypeScript strict, ESLint v9 flat config)
✔ Auth (JWT HS256, HttpOnly cookie, withAuth HOF, Edge middleware)
✔ Prisma v7 + adapter-pg + PostgreSQL Docker
✔ Estrutura base DDD: domain / application / controllers / infra / shared
✔ Composition Root com injeção de dependência manual
✔ Padrão de erros (AppError, HttpStatus, response helpers)
✔ CRUD completo de Produtos (API + dashboard)
✔ Dashboard: listagem, criação e edição de produtos

Sprint 2:
🚧 Catálogo público (/[storeSlug])
🚧 Upload de imagens (produto)
🚧 Modelo de Cliente + Encomenda
🚧 Fluxo de pedido (carrinho → WhatsApp link)

🤖 13️⃣ Instruções para a IA

- Atue como engenheiro de software sênior especialista em DDD e arquitetura backend
- Priorize segurança e escalabilidade
- Não simplifique arquitetura sem justificar
- Sempre considerar multi-tenancy (storeId nunca vem do client)
- Código pronto para produção
- Seguir exatamente este contexto

**Regras obrigatórias ao gerar código:**

1. Novas entidades → criar em `src/domain/<entidade>/` com interface `I<Entidade>Repository.ts`
2. Novos casos de uso → criar em `src/application/<domínio>/<NomeUseCase>.ts` (classe com construtor)
3. Novas implementações Prisma → `src/infra/repositories/Prisma<Entidade>Repository.ts`
4. Registrar wiring em `src/infra/composition/index.ts`
5. Novos controllers → `src/controllers/http/<NomeController.ts>` (classe)
6. Route handlers → apenas `export const MÉTODO = controller.método`
7. `storeId` SEMPRE vem de `req.session` (API) ou `getSession()` (Server Component)
8. Nenhum import de `@prisma/client` fora de `src/infra/`
9. Nenhum import de `next/server` ou `next/navigation` fora de `src/infra/http/`, `src/controllers/`, `app/`
