-- Remove UNIQUE constraints from resources_created table
ALTER TABLE public.resources_created 
DROP CONSTRAINT IF EXISTS resources_created_cluster_id_name_type_key;

-- Remove UNIQUE constraints from resources_unused table  
ALTER TABLE public.resources_unused 
DROP CONSTRAINT IF EXISTS resources_unused_cluster_id_name_type_key;

-- Drop the upsert functions since we're going back to normal inserts
DROP FUNCTION IF EXISTS public.upsert_resource_created(uuid, uuid, text, text, text, text, text, jsonb, timestamp with time zone);
DROP FUNCTION IF EXISTS public.upsert_resource_unused(uuid, uuid, text, text, text, text, text, text, integer, jsonb, jsonb, integer, integer, integer, integer, integer, integer, text, text);