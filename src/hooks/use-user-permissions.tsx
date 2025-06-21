
import { useUser } from '@/contexts/UserContext';

export const useUserPermissions = () => {
  const { user } = useUser();
  
  const isAdmin = () => {
    return user?.role === 'admin';
  };
  
  const canDelete = () => {
    return isAdmin();
  };
  
  const canEdit = () => {
    return user?.role === 'admin' || user?.role === 'manager';
  };
  
  const canView = () => {
    return true; // Tous les utilisateurs peuvent voir
  };
  
  return {
    isAdmin,
    canDelete,
    canEdit,
    canView,
    user
  };
};
