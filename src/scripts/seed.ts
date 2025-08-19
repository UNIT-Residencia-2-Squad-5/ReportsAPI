import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { Postgres } from '@/infrastructure/postgres/Postgres';
import { getLogger } from '@/infrastructure/utils/Logger';

dotenv.config(); 

async function seed() {
    const LOGGER = getLogger();
    const pool = Postgres.init();

    try {
        const now = new Date().toISOString();
        const users = [
            {
                id: randomUUID(),
                name: 'João da Silva',
                email: 'joao@example.com',
                password_hash: 'hash1',
                created_at: now,
                updated_at: now,
            },
            {
                id: randomUUID(),
                name: 'Maria Souza',
                email: 'maria@example.com',
                password_hash: 'hash2',
                created_at: now,
                updated_at: now,
            },
        ];
        for (const user of users) {
            await pool.query(
                `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (email) DO NOTHING`,
                [
                user.id,
                user.name,
                user.email,
                user.password_hash,
                user.created_at,
                user.updated_at,
                ]
            );
        }
        LOGGER.info('Seed executado com sucesso!');
    } catch (err) {
        LOGGER.error('Erro ao executar seed:', err);
    } finally {
        await Postgres.end();
    }
}

seed();
