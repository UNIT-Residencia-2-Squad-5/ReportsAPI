WITH
base AS (
    SELECT
    p.*,
    a.nome AS aluno_nome
    FROM participacoes p
    JOIN alunos a ON a.id = p.aluno_id
),

totais_aluno AS (
    SELECT
    p.aluno_id,
    MIN(p.aluno_nome) AS aluno,

    SUM((p.workload_real)::interval)      AS horas_real,
    SUM((p.workload_simulated)::interval) AS horas_simulada,

    SUM((p.workload_real)::interval)
    + SUM((p.workload_simulated)::interval) AS horas_total,

    COUNT(*) AS total_participacoes,
    SUM(CASE WHEN p.presenca THEN 1 ELSE 0 END) AS total_presencas,

    AVG(p.nota) AS media_nota,

    CASE
        WHEN COUNT(*) > 0 THEN
        (SUM(CASE WHEN p.presenca THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric)
        ELSE NULL
    END AS taxa_presenca
    FROM base p
    GROUP BY p.aluno_id
),

totais_por_turma_e_aluno AS (
    SELECT
    p.turma_id,
    p.aluno_id,
    SUM((p.workload_real)::interval)
    + SUM((p.workload_simulated)::interval) AS horas_total_aluno_turma
    FROM participacoes p
    GROUP BY p.turma_id, p.aluno_id
),

media_horas_por_turma AS (
    SELECT
    aluno_id,
    AVG(horas_total_aluno_turma) AS media_horas_turma
    FROM totais_por_turma_e_aluno
    GROUP BY aluno_id
)

SELECT
    jsonb_agg(
    jsonb_build_object(
        'Aluno',
        jsonb_build_object(
            'id', ta.aluno_id,
            'nome', ta.aluno
        ),

        'Total de horas por aluno',
        jsonb_build_object(
            'total', ta.horas_total
        ),

        'Distribuição de horas por tipo (real vs simulada)',
        jsonb_build_object(
            'real', ta.horas_real,
            'simulada', ta.horas_simulada
        ),

        'Média de horas por turma',
        mt.media_horas_turma,

        'Indicadores de participação',
        jsonb_build_object(
            'total_participacoes', ta.total_participacoes,
            'total_presencas', ta.total_presencas,
            'taxa_presenca', ta.taxa_presenca,
            'media_nota', ta.media_nota
        )
    )
    ) AS resultado
FROM totais_aluno ta
LEFT JOIN media_horas_por_turma mt ON mt.aluno_id = ta.aluno_id;