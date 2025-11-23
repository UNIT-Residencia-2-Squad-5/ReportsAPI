TRUNCATE participacoes RESTART IDENTITY;

ALTER TABLE participacoes 
  ADD COLUMN IF NOT EXISTS workload_real TIME,
  ADD COLUMN IF NOT EXISTS workload_simulated TIME,

  ADD COLUMN IF NOT EXISTS acts_workload_real TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS shifts_workload_real TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS practices_workload_real TIME DEFAULT '00:00:00',

  ADD COLUMN IF NOT EXISTS acts_workload_simulated TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS shifts_workload_simulated TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS practices_workload_simulated TIME DEFAULT '00:00:00';

WITH per_turma(n) AS (VALUES (7500)),
alunos_pool AS (
  SELECT id, row_number() OVER (ORDER BY id) AS rn, count(*) OVER () AS total
  FROM alunos
),
grid AS (
  SELECT t.id AS turma_id, gs AS seq
  FROM turmas t
  CROSS JOIN generate_series(1, (SELECT n FROM per_turma)) AS gs
),
pick AS (
  SELECT g.turma_id,
         ((g.seq - 1) % (SELECT max(total) FROM alunos_pool) + 1) AS rn
  FROM grid g
)
INSERT INTO participacoes (
  aluno_id,
  atividade_id,
  turma_id,
  presenca,
  horas,
  nota,
  conceito,
  status_avaliacao
)
SELECT
  ap.id,
  atv.id,
  p.turma_id,
  (random() > 0.2),
  round((random() * 5)::numeric, 2),
  round((random() * 10)::numeric, 2),
  (ARRAY['A','B','C','D','E'])[trunc(random()*5 + 1)],
  (ARRAY['Aprovado','Reprovado','Pendente'])[trunc(random()*3 + 1)]
FROM pick p
JOIN alunos_pool ap ON ap.rn = p.rn
JOIN LATERAL (
  SELECT id
  FROM atividades
  WHERE turma_id = p.turma_id
  ORDER BY random()
  LIMIT 1
) atv ON true;

/* não sobrescreve workloads já preenchidos */
UPDATE participacoes
SET 
  acts_workload_real = CASE
    WHEN acts_workload_real IS NULL OR acts_workload_real = '00:00:00'
    THEN (trunc(random()*4)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE acts_workload_real END,

  shifts_workload_real = CASE
    WHEN shifts_workload_real IS NULL OR shifts_workload_real = '00:00:00'
    THEN (trunc(random()*3)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE shifts_workload_real END,

  practices_workload_real = CASE
    WHEN practices_workload_real IS NULL OR practices_workload_real = '00:00:00'
    THEN (trunc(random()*5)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE practices_workload_real END,

  acts_workload_simulated = CASE
    WHEN acts_workload_simulated IS NULL OR acts_workload_simulated = '00:00:00'
    THEN (trunc(random()*3)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE acts_workload_simulated END,

  shifts_workload_simulated = CASE
    WHEN shifts_workload_simulated IS NULL OR shifts_workload_simulated = '00:00:00'
    THEN (trunc(random()*3)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE shifts_workload_simulated END,

  practices_workload_simulated = CASE
    WHEN practices_workload_simulated IS NULL OR practices_workload_simulated = '00:00:00'
    THEN (trunc(random()*4)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE practices_workload_simulated END,

  workload_real = CASE
    WHEN workload_real IS NULL OR workload_real = '00:00:00'
    THEN (trunc(random()*8)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE workload_real END,

  workload_simulated = CASE
    WHEN workload_simulated IS NULL OR workload_simulated = '00:00:00'
    THEN (trunc(random()*6)::text || ':' || LPAD(trunc(random()*60)::text, 2, '0') || ':00')::time
    ELSE workload_simulated END;

-- sanity check
SELECT 
  COUNT(*) AS total,
  COUNT(workload_real) AS com_workload_real,
  COUNT(workload_simulated) AS com_workload_simulated
FROM participacoes;
