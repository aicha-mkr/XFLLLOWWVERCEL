import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, UserPermissions, UserRole } from "@/types";
import { useUser, getRolePermissions } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Users, Shield, FileText, BarChart3, Cog, ShoppingCart } from "lucide-react";

interface PermissionsManagerProps {
  user: User;
  onClose: () => void;
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ user, onClose }) => {
  const { updateUser, refreshCurrentUser } = useUser();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<UserPermissions>(user.permissions);
  const [isUpdating, setIsUpdating] = useState(false);

  const permissionModules = [
    {
      key: "canAccessClients",
      title: "Clients",
      description: "Accès complet aux clients (voir, créer, modifier, supprimer)",
      icon: <Users className="h-5 w-5" />,
      color: "blue"
    },
    {
      key: "canAccessProducts",
      title: "Produits", 
      description: "Accès complet aux produits (voir, créer, modifier, supprimer)",
      icon: <ShoppingCart className="h-5 w-5" />,
      color: "green"
    },
    {
      key: "canAccessSales",
      title: "Ventes",
      description: "Accès complet aux ventes (voir, créer, modifier, supprimer)",
      icon: <FileText className="h-5 w-5" />,
      color: "purple"
    },
    {
      key: "canAccessPurchases",
      title: "Achats",
      description: "Accès complet aux achats (voir, créer, modifier, supprimer)",
      icon: <FileText className="h-5 w-5" />,
      color: "orange"
    },
    {
      key: "canViewReports",
      title: "Rapports",
      description: "Accès aux rapports et analyses",
      icon: <BarChart3 className="h-5 w-5" />,
      color: "indigo"
    },
    {
      key: "canManageUsers",
      title: "Gestion des utilisateurs",
      description: "Gérer les comptes utilisateurs",
      icon: <Users className="h-5 w-5" />,
      color: "pink"
    },
    {
      key: "canChangeSettings",
      title: "Paramètres",
      description: "Modifier les paramètres système",
      icon: <Cog className="h-5 w-5" />,
      color: "red"
    }
  ];

  const applyRoleTemplate = (role: UserRole) => {
    const rolePermissions = getRolePermissions(role);
    setPermissions(rolePermissions);
    toast({
      title: "Template appliqué",
      description: `Permissions définies selon le rôle ${role}`,
    });
  };

  const handlePermissionChange = (permissionKey: keyof UserPermissions, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: value
    }));
  };

  const selectAll = () => {
    setPermissions(getRolePermissions('admin'));
  };

  const clearAll = () => {
    const noPermissions: UserPermissions = Object.keys(permissions).reduce((acc, key) => {
      acc[key as keyof UserPermissions] = false;
      return acc;
    }, {} as UserPermissions);
    setPermissions(noPermissions);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      console.log('Updating user permissions:', { userId: user.id, permissions });
      
      await updateUser(user.id, { permissions });
      
      // Force refresh of current user session if updating current user
      await refreshCurrentUser();
      
      toast({
        title: "Permissions mises à jour",
        description: `Les permissions de ${user.username} ont été modifiées. Reconnectez-vous pour voir les changements.`,
      });
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les permissions.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getActivePermissionsCount = () => {
    return Object.values(permissions).filter(Boolean).length;
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Permissions - {user.fullName || user.username}</CardTitle>
                <p className="text-blue-100 text-sm">
                  {getActivePermissionsCount()}/{Object.keys(permissions).length} modules activés
                </p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/20">
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Templates de rôles */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Templates rapides
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyRoleTemplate('admin')}
                  className="bg-red-50 hover:bg-red-100 border-red-200"
                >
                  Administrateur
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyRoleTemplate('manager')}
                  className="bg-orange-50 hover:bg-orange-100 border-orange-200"
                >
                  Manager
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => applyRoleTemplate('employee')}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  Employé
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Tout activer
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Tout désactiver
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modules de permissions simplifiés */}
          <div className="grid grid-cols-1 gap-4">
            {permissionModules.map((module, index) => (
              <Card key={module.key} className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 bg-${module.color}-100 rounded-lg`}>
                        {module.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{module.title}</h4>
                        <p className="text-sm text-gray-600">{module.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={permissions[module.key as keyof UserPermissions]}
                      onCheckedChange={(value) => 
                        handlePermissionChange(module.key as keyof UserPermissions, value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {getActivePermissionsCount()} module(s) activé(s)
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isUpdating}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
};

export default PermissionsManager;
