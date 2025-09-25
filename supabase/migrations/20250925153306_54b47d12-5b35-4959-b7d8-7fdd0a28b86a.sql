-- Primeiro, vamos remover duplicatas mantendo apenas o registro mais recente
-- Para resources_created
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY cluster_id, name, type 
           ORDER BY created_at DESC, id DESC
         ) as rn
  FROM public.resources_created
  WHERE cluster_id IS NOT NULL AND name IS NOT NULL AND type IS NOT NULL
)
DELETE FROM public.resources_created 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Para resources_unused  
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY cluster_id, name, type 
           ORDER BY id DESC
         ) as rn
  FROM public.resources_unused
  WHERE cluster_id IS NOT NULL AND name IS NOT NULL AND type IS NOT NULL
)
DELETE FROM public.resources_unused 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora adicionar as constraints
ALTER TABLE public.resources_created 
ADD CONSTRAINT unique_resource_created_per_cluster 
UNIQUE (cluster_id, name, type);

ALTER TABLE public.resources_unused
ADD CONSTRAINT unique_resource_unused_per_cluster
UNIQUE (cluster_id, name, type);