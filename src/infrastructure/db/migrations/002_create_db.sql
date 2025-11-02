-- Criação das tabelas
DROP TABLE IF EXISTS relatorios_gerados, solicitacoes_relatorio, participacoes, professor_turma, atividades, turmas, professores, alunos CASCADE;

-- Habilitando extensão uuid-ossp para gerar UUIDs automaticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alterado id de SERIAL para UUID com geração automática via gen_random_uuid()
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT,
    email TEXT
);

-- Alterado id de SERIAL para UUID
CREATE TABLE professores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT,
    departamento TEXT
);

-- Alterado id de SERIAL para UUID
CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT
);

-- Alterado tipos das foreign keys de INT para UUID
CREATE TABLE professor_turma (
    professor_id UUID REFERENCES professores(id),
    turma_id UUID REFERENCES turmas(id),
    PRIMARY KEY (professor_id, turma_id)
);

-- Alterado id de SERIAL para UUID e foreign key de INT para UUID
CREATE TABLE atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT,
    tipo TEXT,
    turma_id UUID REFERENCES turmas(id)
);

-- Alterado id de SERIAL para UUID e todas as foreign keys de INT para UUID
CREATE TABLE participacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES alunos(id),
    atividade_id UUID REFERENCES atividades(id),
    turma_id UUID REFERENCES turmas(id),
    presenca BOOLEAN,
    horas DECIMAL,
    nota DECIMAL,
    conceito TEXT,
    status_avaliacao TEXT
);

-- Alterado id de SERIAL para UUID e foreign key de INT para UUID
-- Tabela para armazenar solicitações de relatórios
CREATE TABLE solicitacoes_relatorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID REFERENCES turmas(id),
    tipo_relatorio VARCHAR(10) NOT NULL CHECK (tipo_relatorio IN ('excel', 'pdf')),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_inicio_processamento TIMESTAMP,
    data_conclusao TIMESTAMP,
    erro_mensagem TEXT,
    usuario_solicitante VARCHAR(100) DEFAULT 'sistema'
);

-- Alterado id de SERIAL para UUID e foreign keys de INT para UUID
-- Tabela para armazenar relatórios gerados
CREATE TABLE relatorios_gerados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID REFERENCES solicitacoes_relatorio(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id),
    tipo_relatorio VARCHAR(10) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    file_key VARCHAR(255), -- URL do relatorio
    tamanho_bytes BIGINT,
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadados JSONB -- Para armazenar informações adicionais
);

-- Inserção de dados agora com UUIDs gerados automaticamente
-- Inserção de dados
INSERT INTO turmas (nome) VALUES ('Turma A');

-- Professores
INSERT INTO professores (nome, departamento) VALUES 
('Professor A', 'Matemática'),
('Professor B', 'História');

-- Ajustado para usar UUIDs nas foreign keys
-- Relaciona professores à turma
INSERT INTO professor_turma (professor_id, turma_id) 
SELECT p.id, t.id 
FROM professores p, turmas t 
WHERE p.nome IN ('Professor A', 'Professor B') AND t.nome = 'Turma A';

-- Alunos
INSERT INTO alunos (nome, email)
SELECT 
  'Aluno ' || g, 
  'aluno' || g || '@exemplo.com'
FROM generate_series(1, 500) AS g;

-- Atividades
INSERT INTO atividades (nome, tipo, turma_id)
SELECT 
  'Atividade ' || g, 
  CASE WHEN g % 2 = 0 THEN 'Prova' ELSE 'Trabalho' END, 
  (SELECT id FROM turmas WHERE nome = 'Turma A')
FROM generate_series(1, 20) AS g;

-- Ajustado para usar UUIDs aleatórios dos registros existentes
INSERT INTO participacoes (
  aluno_id, atividade_id, turma_id, presenca, horas, nota, conceito, status_avaliacao
)
SELECT
  (SELECT id FROM alunos ORDER BY random() LIMIT 1) AS aluno_id,
  (SELECT id FROM atividades ORDER BY random() LIMIT 1) AS atividade_id,
  (SELECT id FROM turmas WHERE nome = 'Turma A') AS turma_id,
  (random() > 0.2) AS presenca,
  round((random() * 5)::numeric, 2) AS horas,
  round((random() * 10)::numeric, 2) AS nota,
  (ARRAY['A', 'B', 'C', 'D', 'E'])[trunc(random()*5 + 1)] AS conceito,
  (ARRAY['Aprovado', 'Reprovado', 'Pendente'])[trunc(random()*3 + 1)] AS status_avaliacao
FROM generate_series(1, 10000);
