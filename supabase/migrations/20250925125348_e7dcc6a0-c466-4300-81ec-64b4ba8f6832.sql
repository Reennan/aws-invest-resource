-- Função para definir permissões baseadas no papel do usuário
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
$$ LANGUAGE plpgsql;

-- Criar trigger para aplicar permissões automaticamente em INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_set_user_permissions_by_role ON public.users_profile;
CREATE TRIGGER trigger_set_user_permissions_by_role
  BEFORE INSERT OR UPDATE OF role ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_permissions_by_role();

-- Atualizar usuários existentes com as permissões corretas baseadas no papel
UPDATE public.users_profile 
SET 
  can_view_dashboard = CASE 
    WHEN role IN ('admin', 'editor', 'viewer') THEN true 
    ELSE true 
  END,
  can_view_clusters = CASE 
    WHEN role IN ('admin', 'editor') THEN true 
    ELSE false 
  END,
  can_view_reports = CASE 
    WHEN role IN ('admin', 'editor') THEN true 
    ELSE false 
  END,
  can_manage_users = CASE 
    WHEN role = 'admin' THEN true 
    ELSE false 
  END;