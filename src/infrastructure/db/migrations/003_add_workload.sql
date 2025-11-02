-- ============================================================================
-- MIGRAÇÃO POSTGRESQL - Adicionar campos de carga horária
-- ============================================================================
-- Este script adiciona os campos de workload na tabela participacoes
-- e popula com valores aleatórios para registros existentes
-- ============================================================================

-- Passo 1: Adicionar as novas colunas
ALTER TABLE participacoes 
  ADD COLUMN IF NOT EXISTS workload_real TIME,
  ADD COLUMN IF NOT EXISTS workload_simulated TIME,
  ADD COLUMN IF NOT EXISTS acts_workload_real TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS shifts_workload_real TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS practices_workload_real TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS acts_workload_simulated TIME DEFAULT '00:00:00',
  ADD COLUMN IF NOT EXISTS practices_workload_simulated TIME DEFAULT '00:00:00';

-- Passo 2: Atualizar registros existentes com valores aleatórios
UPDATE participacoes
SET 
  workload_real = (
    trunc(random() * 8) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME,
  
  workload_simulated = (
    trunc(random() * 6) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME,
  
  acts_workload_real = (
    trunc(random() * 4) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME,
  
  shifts_workload_real = (
    trunc(random() * 3) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME,
  
  practices_workload_real = (
    trunc(random() * 5) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME,
  
  acts_workload_simulated = (
    trunc(random() * 3) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME,
  
  practices_workload_simulated = (
    trunc(random() * 4) || ':' || 
    LPAD(trunc(random() * 60)::text, 2, '0') || ':00'
  )::TIME
WHERE workload_real IS NULL; -- Apenas atualiza registros que ainda não têm valor

-- Passo 3: Verificar os resultados
SELECT 
  COUNT(*) as total_registros,
  COUNT(workload_real) as com_workload_real,
  COUNT(workload_simulated) as com_workload_simulated
FROM participacoes;

-- Passo 4: Mostrar exemplos dos dados
SELECT 
  id,
  aluno_id,
  atividade_id,
  workload_real,
  workload_simulated,
  acts_workload_real,
  shifts_workload_real,
  practices_workload_real,
  acts_workload_simulated,
  practices_workload_simulated
FROM participacoes
LIMIT 10;
