-- Criação das tabelas
DROP TABLE IF EXISTS relatorios_gerados, solicitacoes_relatorio, participacoes, professor_turma, atividades, turmas, professores, alunos CASCADE;

CREATE TABLE alunos (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    email TEXT
);

CREATE TABLE professores (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    departamento TEXT
);

CREATE TABLE turmas (
    id SERIAL PRIMARY KEY,
    nome TEXT
);

CREATE TABLE professor_turma (
    professor_id INT REFERENCES professores(id),
    turma_id INT REFERENCES turmas(id),
    PRIMARY KEY (professor_id, turma_id)
);

CREATE TABLE atividades (
    id SERIAL PRIMARY KEY,
    nome TEXT,
    tipo TEXT,
    turma_id INT REFERENCES turmas(id)
);

CREATE TABLE participacoes (
    id SERIAL PRIMARY KEY,
    aluno_id INT REFERENCES alunos(id),
    atividade_id INT REFERENCES atividades(id),
    turma_id INT REFERENCES turmas(id),
    presenca BOOLEAN,
    horas DECIMAL,
    nota DECIMAL,
    conceito TEXT,
    status_avaliacao TEXT
);

-- Tabela para armazenar solicitações de relatórios
CREATE TABLE solicitacoes_relatorio (
    id SERIAL PRIMARY KEY,
    turma_id INT REFERENCES turmas(id),
    tipo_relatorio VARCHAR(10) NOT NULL CHECK (tipo_relatorio IN ('excel', 'pdf')),
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_inicio_processamento TIMESTAMP,
    data_conclusao TIMESTAMP,
    erro_mensagem TEXT,
    usuario_solicitante VARCHAR(100) DEFAULT 'sistema'
);

-- Tabela para armazenar relatórios gerados
CREATE TABLE relatorios_gerados (
    id SERIAL PRIMARY KEY,
    solicitacao_id INT REFERENCES solicitacoes_relatorio(id) ON DELETE CASCADE,
    turma_id INT REFERENCES turmas(id),
    tipo_relatorio VARCHAR(10) NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    file_key VARCHAR(255), -- URL do relatorio
    tamanho_bytes BIGINT,
    data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadados JSONB -- Para armazenar informações adicionais
);

-- Inserção de dados
INSERT INTO turmas (nome) VALUES ('Turma A');

-- Professores
INSERT INTO professores (nome, departamento) VALUES 
('Professor A', 'Matemática'),
('Professor B', 'História');

-- Relaciona professores à turma
INSERT INTO professor_turma (professor_id, turma_id) VALUES 
(1, 1),
(2, 1);

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
  1
FROM generate_series(1, 20) AS g;

INSERT INTO participacoes (
  aluno_id, atividade_id, turma_id, presenca, horas, nota, conceito, status_avaliacao
)
SELECT
  trunc(random() * 500 + 1)::INT AS aluno_id,
  trunc(random() * 20 + 1)::INT AS atividade_id,
  1 AS turma_id,
  (random() > 0.2) AS presenca,
  round((random() * 5)::numeric, 2) AS horas,
  round((random() * 10)::numeric, 2) AS nota,
  (ARRAY['A', 'B', 'C', 'D', 'E'])[trunc(random()*5 + 1)] AS conceito,
  (ARRAY['Aprovado', 'Reprovado', 'Pendente'])[trunc(random()*3 + 1)] AS status_avaliacao
FROM generate_series(1, 10000);
