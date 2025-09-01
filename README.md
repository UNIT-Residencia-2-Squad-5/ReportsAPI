# Reports API

API backend para o sistema de geração de relatórios da **Bonsae**.

---

## Stack utilizada

- Node.js + TypeScript
- Express.js
- PostgreSQL
- Docker + Docker Compose
- MinIO
- BullMQ 
- Swagger (em breve)

---

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

Para rodar esse projeto, você vai precisar adicionar as seguintes variáveis de ambiente no seu .env:

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

### --- REDIS ---
REDIS_HOST
REDIS_PORT
REDIS_DB

## Docker

Este projeto utiliza docker e docker-compose, preencha as informações no .env e depois rode o comando

```bash
docker-compose up -d
```

## Migrations

Este projeto **não utiliza ORM**. As migrations devem ser aplicadas manualmente diretamente no banco **Postgres** que roda dentro do container Docker.   

Suba o container:
```bash
docker compose up -d
```
Acesse o banco:
```bash
docker exec -it <nome-do-container> psql -U <usuario> -d <database>
```
Rode os arquivos de migration que estão em **src/infrastructure/db/migrations:**
```bash
\i migrations/001_create_users.sql
```

## Rodando localmente

Inicie o servidor

```bash
npm run dev
```

## Faça o teste

### Health Check
Faça uma requisição na rota healthcheck abaixo para testar a API

```http
GET http://localhost:3000/api/health
```
### MinIO
Primeiro crie o bucket com o mesmo nome especificado no .env através do link http://localhost:9001 e depois rode o comando:

```bash
npm run minio:test
```

## Exemplo de Arquitetura

O "Model" **User** foi criado apenas como **exemplo didático**, para mostrar como as camadas do projeto se comunicam entre si 
(routes → controllers → services → repositories → entities).  

Ele **não representa um requisito de negócio real** e pode ser removido ou substituído pelas entidades definitivas do sistema.