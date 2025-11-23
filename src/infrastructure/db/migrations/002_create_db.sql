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

CREATE TABLE solicitacoes_relatorio (
  id SERIAL PRIMARY KEY,
  turma_id INT REFERENCES turmas(id),
  tipo_relatorio VARCHAR(30) NOT NULL 
    CHECK (tipo_relatorio IN ('excel','pdf','workload_excel','workload_pdf')),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' 
    CHECK (status IN ('pendente','processando','concluido','erro')),
  data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_inicio_processamento TIMESTAMP,
  data_conclusao TIMESTAMP,
  erro_mensagem TEXT,
  usuario_solicitante VARCHAR(100) DEFAULT 'sistema'
);

CREATE TABLE relatorios_gerados (
  id SERIAL PRIMARY KEY,
  solicitacao_id INT REFERENCES solicitacoes_relatorio(id) ON DELETE CASCADE,
  turma_id INT REFERENCES turmas(id),
  tipo_relatorio VARCHAR(30) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  file_key VARCHAR(255),
  tamanho_bytes BIGINT,
  data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadados JSONB
);

INSERT INTO turmas (nome)
VALUES ('Turma A'), ('Turma B'), ('Turma C'), ('Turma D');

INSERT INTO professores (nome, departamento) VALUES
('Professor A','Matemática'),
('Professor B','História'),
('Professor C','Física'),
('Professor D','Biologia');

/* fixa A e B na Turma A */
INSERT INTO professor_turma (professor_id, turma_id)
VALUES (1, 1), (2, 1);

/* nenhum professor repetido por certeza, só um por turma */
INSERT INTO professor_turma (professor_id, turma_id)
SELECT (SELECT id FROM professores ORDER BY random() LIMIT 1), t.id
FROM turmas t
WHERE t.nome IN ('Turma B','Turma C','Turma D');

INSERT INTO alunos (nome, email)
SELECT 'Aluno ' || g, 'aluno' || g || '@exemplo.com'
FROM generate_series(1, 500) AS g;

INSERT INTO atividades (nome, tipo, turma_id)
SELECT
  'Atividade ' || gs.g,
  CASE WHEN gs.g % 2 = 0 THEN 'Prova' ELSE 'Trabalho' END,
  t.id
FROM turmas t
CROSS JOIN LATERAL generate_series(1, 20) AS gs(g);

/* 40k participações distribuídas em todas as turmas */
INSERT INTO participacoes (
  aluno_id, atividade_id, turma_id, presenca, horas, nota, conceito, status_avaliacao
)
SELECT
  (SELECT id FROM alunos ORDER BY random() LIMIT 1),
  a.id,
  a.turma_id,
  (random() > 0.2),
  round((random() * 5)::numeric, 2),
  round((random() * 10)::numeric, 2),
  (ARRAY['A','B','C','D','E'])[trunc(random()*5 + 1)],
  (ARRAY['Aprovado','Reprovado','Pendente'])[trunc(random()*3 + 1)]
FROM generate_series(1, 40000) g
CROSS JOIN LATERAL (
  SELECT id, turma_id 
  FROM atividades 
  ORDER BY random() 
  LIMIT 1
) a;
