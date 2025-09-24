-- Set user as admin
UPDATE users_profile 
SET role = 'admin', 
    can_view_clusters = true, 
    can_view_reports = true, 
    can_manage_users = true 
WHERE email = 'renaninfor47@gmail.com';