import 'dotenv/config';
import { getLogger } from '@/utils/Logger';
import { Postgres } from '@/infrastructure/postgres/Postgres';
import App from '@/App';

const LOGGER = getLogger();
const PORT = Number(process.env.PORT || 3000);

async function bootstrap() {
  Postgres.init();

  try {
    await Postgres.ping();
    LOGGER.info('Conectado ao Postgres com sucesso!');

    App.server.listen(PORT, () => {
      LOGGER.info(`Servidor rodando com sucesso na porta ${PORT}!`);
    });
  } catch (err) {
    LOGGER.error({ err }, 'Erro ao conectar ao Postgres');
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  LOGGER.info('Recebido SIGTERM, finalizando...');
  await Postgres.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  LOGGER.info('Recebido SIGINT, finalizando...');
  await Postgres.end();
  process.exit(0);
});

bootstrap();
