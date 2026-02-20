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
- Arquitetura em camadas (domain / infra / shared)
- REST API

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
Estrutura de Pastas
/src
├─ /app
│ ├─ /api → Controllers (routes REST)
│ ├─ /(public) → Catálogo público
│ ├─ /(auth) → Login
│ ├─ /(dashboard) → Área administrativa
│
├─ /domain → Regras de negócio
│ ├─ entities
│ ├─ services
│ ├─ repositories (interfaces)
│
├─ /infra
│ ├─ prisma
│ ├─ repositories (implementações)
│ ├─ storage
│
├─ /shared
│ ├─ errors
│ ├─ http
│ ├─ utils
│ ├─ types

4️⃣ Princípios Arquiteturais

Separação de responsabilidades

Domínio não depende de Prisma ou Next.js

Controllers apenas orquestram chamadas

Regras de negócio vivem no /domain

Multi-tenant por padrão (uma loja nunca acessa dados de outra)

Código pensado para migração futura para NestJS, se necessário

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
✔ Setup do projeto
✔ Auth
✔ Prisma
✔ Estrutura base
✔ Padrão de erros

Sprint 2:
🚧 Produtos
🚧 Catálogo público
🚧 Upload de imagens

🤖 13️⃣ Instruções para a IA

- Atue como engenheiro de software sênior
- Priorize segurança e escalabilidade
- Não simplifique arquitetura sem justificar
- Sempre considerar multi-tenancy
- Código pronto para produção
- Seguir exatamente este contexto
