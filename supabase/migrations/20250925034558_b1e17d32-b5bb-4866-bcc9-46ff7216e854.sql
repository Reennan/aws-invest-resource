-- First, get the crednovo-app-prd cluster ID for reference
-- Delete all user_cluster_permissions for clusters that are not crednovo-app-prd
DELETE FROM user_cluster_permissions 
WHERE cluster_id NOT IN (
  SELECT id FROM clusters WHERE name = 'crednovo-app-prd'
);

-- Delete all resources_created for clusters that are not crednovo-app-prd
DELETE FROM resources_created 
WHERE cluster_id NOT IN (
  SELECT id FROM clusters WHERE name = 'crednovo-app-prd'
);

-- Delete all resources_unused for clusters that are not crednovo-app-prd
DELETE FROM resources_unused 
WHERE cluster_id NOT IN (
  SELECT id FROM clusters WHERE name = 'crednovo-app-prd'
);

-- Delete all runs for clusters that are not crednovo-app-prd
DELETE FROM runs 
WHERE cluster_id NOT IN (
  SELECT id FROM clusters WHERE name = 'crednovo-app-prd'
);

-- Finally, delete all clusters except crednovo-app-prd
DELETE FROM clusters 
WHERE name != 'crednovo-app-prd';