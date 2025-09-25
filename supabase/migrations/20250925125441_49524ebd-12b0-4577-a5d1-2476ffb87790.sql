-- Corrigir função com search_path explícito para segurança
CREATE OR REPLACE FUNCTION public.set_user_permissions_by_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir permissões baseadas no papel
  CASE NEW.role
    WHEN 'admin' THEN
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := true;
      NEW.can_view_reports := true;
      NEW.can_manage_users := true;
    WHEN 'editor' THEN
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := true;
      NEW.can_view_reports := true;
      NEW.can_manage_users := false;
    WHEN 'viewer' THEN
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := false;
      NEW.can_view_reports := false;
      NEW.can_manage_users := false;
    ELSE
      -- Para papéis não definidos, usar permissões de viewer como padrão
      NEW.can_view_dashboard := true;
      NEW.can_view_clusters := false;
      NEW.can_view_reports := false;
      NEW.can_manage_users := false;
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;