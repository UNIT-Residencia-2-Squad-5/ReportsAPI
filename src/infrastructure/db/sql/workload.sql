WITH base AS (
  SELECT
    p.aluno_id,
    a.nome AS aluno_nome,
    p.turma_id,
    EXTRACT(EPOCH FROM COALESCE(p.workload_real, '00:00:00')) AS real_segundos,
    EXTRACT(EPOCH FROM COALESCE(p.workload_simulated, '00:00:00')) AS simulada_segundos,
    p.presenca,
    p.nota
  FROM participacoes p
  JOIN alunos a ON a.id = p.aluno_id
),
totais_aluno AS (
  SELECT
    aluno_id AS id,
    MIN(aluno_nome) AS nome,
    MIN(turma_id)  AS turma_id,
    SUM(real_segundos + simulada_segundos) AS total_segundos,
    SUM(real_segundos) AS real_segundos,
    SUM(simulada_segundos) AS simulada_segundos,
    COUNT(*) AS total_participacoes,
    COUNT(*) FILTER (WHERE presenca) AS total_presencas,
    ROUND(AVG(nota), 2) AS media_nota,
    CASE
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE presenca)::NUMERIC / COUNT(*)), 4)
      ELSE 0
    END AS taxa_presenca
  FROM base
  GROUP BY aluno_id
  ORDER BY total_segundos DESC
  LIMIT 500
),
media_turma AS (
  SELECT
    turma_id,
    ROUND(AVG(total_segundos), 2) AS media_segundos
  FROM (
    SELECT aluno_id, turma_id, SUM(real_segundos + simulada_segundos) AS total_segundos
    FROM base
    GROUP BY aluno_id, turma_id
  ) sub
  GROUP BY turma_id
)
SELECT
  t.nome AS aluno_nome,
  t.id AS aluno_id,
  ROUND(t.total_segundos) AS total_segundos,
  to_char((t.total_segundos || ' seconds')::interval, 'HH24:MI:SS') AS total_horas,
  to_char((t.real_segundos || ' seconds')::interval, 'HH24:MI:SS') AS horas_real,
  to_char((t.simulada_segundos || ' seconds')::interval, 'HH24:MI:SS') AS horas_simulada,
  to_char((m.media_segundos || ' seconds')::interval, 'HH24:MI:SS') AS media_turma,
  t.total_participacoes,
  t.total_presencas,
  t.taxa_presenca,
  t.media_nota
FROM totais_aluno t
JOIN media_turma m ON m.turma_id = t.turma_id
ORDER BY t.total_segundos DESC;