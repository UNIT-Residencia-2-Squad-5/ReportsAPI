
# Reports API

API backend para o sistema de geração de relatórios da **Bonsae**.

## Stack utilizada

- Node.js + TypeScript
- Express.js
- PostgreSQL
- Docker + Docker Compose
- MinIO
- BullMQ
- Swagger (em breve)

## Instalando

Clone o projeto

```bash
  git clone https://github.com/UNIT-Residencia-2-Squad-5/ReportsAPI.git
```

Entre no diretório do projeto

```bash
  cd ReportsAPI
```

Instale as dependências

```bash
  npm install
```

## Variáveis de Ambiente

Para rodar esse projeto, você vai precisar adicionar as seguintes variáveis de ambiente no seu .env

### Banco de Dados 
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB
- POSTGRES_PORT

### URL usada pela aplicação Node (fora do Docker)
- DATABASE_URL

### MinIO / S3
- S3_ENDPOINT
- S3_REGION
- S3_ACCESS_KEY
- S3_SECRET_KEY
- S3_BUCKET
- S3_FORCE_PATH_STYLE = true
- S3_PRESIGNED_TTL_SECONDS

## Docker

Este projeto utiliza docker e docker-compose, preencha as informações no .env e depois rode o comando

```bash
  docker-compose up -d
```

## Rodando localmente

Inicie o servidor

```bash
  npm run dev
```

## Faça o teste

Faça uma requisição na rota healthcheck abaixo para testar a API

```http
  GET http://localhost:3000/api/health
```

Teste o MinIO

```bash
npm run minio:test
```