import { useState } from "react";
import { useUser, getRolePermissions } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserRole, UserPermissions, User } from "@/types";
import { UserPlus, UserX, Settings, Eye, EyeOff, Shield } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import PermissionsManager from "@/components/PermissionsManager";

// Schéma simplifié pour la création d'utilisateur
const userFormSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit avoir au moins 3 caractères"),
  email: z.string().email("Adresse email invalide"),
  fullName: z.string().optional(),
  role: z.enum(["admin", "employee", "manager"] as const),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  active: z.boolean().default(true),
});

// Schéma pour l'édition d'utilisateur
const userEditFormSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit avoir au moins 3 caractères"),
  email: z.string().email("Adresse email invalide"),
  fullName: z.string().optional(),
  role: z.enum(["admin", "employee", "manager"] as const),
  active: z.boolean().default(true),
  newPassword: z.string().optional(),
});

// Types pour les formulaires
type UserFormData = z.infer<typeof userFormSchema>;
type UserEditFormData = z.infer<typeof userEditFormSchema>;

const UsersManagement = () => {
  const { toast } = useToast();
  const { users, currentUser, createUser, updateUser, deleteUser, validatePassword, isProcessing } = useUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Formulaire d'ajout d'utilisateur
  const addForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      role: "employee",
      password: "",
      active: true,
    }
  });

  // Formulaire d'édition d'utilisateur
  const editForm = useForm<UserEditFormData>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      role: "employee",
      active: true,
      newPassword: "",
    }
  });

  // Nouvelle fonction pour gérer les permissions
  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  // Réinitialiser le formulaire d'ajout
  const handleAddDialogOpen = () => {
    addForm.reset({
      username: "",
      email: "",
      fullName: "",
      role: "employee",
      password: "",
      active: true,
    });
    setShowPassword(false);
    setIsAddDialogOpen(true);
  };

  // Gérer l'édition d'un utilisateur
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      fullName: user.fullName || "",
      role: user.role,
      active: user.active,
      newPassword: "",
    });
    setShowNewPassword(false);
    setIsEditDialogOpen(true);
  };

  // Soumettre le formulaire d'ajout
  const onAddSubmit = async (data: UserFormData) => {
    try {
      // Valider le mot de passe
      const passwordCheck = validatePassword(data.password);
      if (!passwordCheck.isValid) {
        toast({
          title: "Erreur",
          description: passwordCheck.message || "Mot de passe invalide",
          variant: "destructive",
        });
        return;
      }

      // Créer l'utilisateur avec les données correctes - remove permissions from the data
      const userData = {
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        active: data.active,
        password: data.password,
      };
      
      await createUser(userData);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la création de l'utilisateur", error);
    }
  };

  // Soumettre le formulaire d'édition
  const onEditSubmit = async (data: UserEditFormData) => {
    if (!selectedUser) return;
    
    try {
      // Préparer les données à mettre à jour
      const updateData: Partial<User> & { newPassword?: string } = {
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        active: data.active,
        // Les permissions seront automatiquement mises à jour selon le rôle dans updateUser
      };
      
      // Ajouter le nouveau mot de passe s'il est fourni
      if (data.newPassword) {
        const passwordCheck = validatePassword(data.newPassword);
        if (!passwordCheck.isValid) {
          toast({
            title: "Erreur",
            description: passwordCheck.message || "Mot de passe invalide",
            variant: "destructive",
          });
          return;
        }
        updateData.newPassword = data.newPassword;
      }
      
      await updateUser(selectedUser.id, updateData);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'utilisateur", error);
    }
  };

  // Supprimer un utilisateur
  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur", error);
    }
  };

  // Afficher un badge pour le rôle
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600 hover:bg-red-700">Administrateur</Badge>;
      case 'manager':
        return <Badge className="bg-blue-600 hover:bg-blue-700">Manager</Badge>;
      case 'employee':
        return <Badge className="bg-green-600 hover:bg-green-700">Employé</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 p-4 md:p-6 max-w-full animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestion des utilisateurs
            </h1>
            <p className="text-gray-600 mt-2">Gérez les comptes utilisateurs et leurs permissions</p>
          </div>
          <Button 
            onClick={handleAddDialogOpen} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all shadow-lg"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all animate-slide-up stagger-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total utilisateurs</p>
                  <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                </div>
                <div className="p-2 bg-blue-200 rounded-full">
                  <UserPlus className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all animate-slide-up stagger-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold text-green-900">{users.filter(u => u.active).length}</p>
                </div>
                <div className="p-2 bg-green-200 rounded-full">
                  <Shield className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all animate-slide-up stagger-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Administrateurs</p>
                  <p className="text-2xl font-bold text-purple-900">{users.filter(u => u.role === 'admin').length}</p>
                </div>
                <div className="p-2 bg-purple-200 rounded-full">
                  <Settings className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg hover:shadow-xl transition-all border-0 bg-gradient-to-br from-white to-gray-50 animate-scale-in">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Liste des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Utilisateur</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Rôle</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold">Dernière connexion</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow 
                      key={user.id} 
                      className={`${currentUser?.id === user.id ? "bg-blue-50 border-l-4 border-l-blue-400" : ""} hover:bg-gray-50 transition-all duration-300 animate-fade-in`}
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            user.role === 'admin' ? 'bg-red-500' : 
                            user.role === 'manager' ? 'bg-blue-500' : 'bg-green-500'
                          }`}>
                            {(user.fullName || user.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.fullName || user.username}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                        {currentUser?.id === user.id && (
                          <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Vous
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">{user.email}</TableCell>
                      <TableCell>{renderRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.active ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-800 border-gray-200">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm') : 
                          <span className="text-gray-400 italic">Jamais connecté</span>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManagePermissions(user)}
                            title="Gérer les permissions"
                            className="hover:scale-105 transition-transform hover:bg-purple-50 hover:border-purple-200"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            disabled={currentUser?.id === user.id && user.role === 'admin'}
                            title="Modifier l'utilisateur"
                            className="hover:scale-105 transition-transform hover:bg-blue-50 hover:border-blue-200"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:scale-105 transition-all"
                                disabled={currentUser?.id === user.id}
                                title="Supprimer l'utilisateur"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="animate-scale-in">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-700">Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.fullName || user.username}</strong> ? 
                                  Cette action est irréversible et supprimera toutes les données associées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 text-white hover:bg-red-700"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  Supprimer définitivement
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <div className="flex flex-col items-center gap-3 animate-bounce-in">
                          <UserPlus className="h-12 w-12 text-gray-300" />
                          <div>
                            <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                            <p className="text-sm">Commencez par ajouter votre premier utilisateur</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Dialogue de gestion des permissions */}
        {isPermissionsDialogOpen && selectedUser && (
          <PermissionsManager
            user={selectedUser}
            onClose={() => setIsPermissionsDialogOpen(false)}
          />
        )}

        {/* Dialogue d'ajout d'utilisateur */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] animate-scale-in">
            <DialogHeader>
              <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Créez un nouvel utilisateur en renseignant ses informations de base.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe*</FormLabel>
                      <div className="flex">
                        <FormControl>
                          <div className="relative w-full">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              {...field} 
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Utilisateur actif</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isProcessing} className="hover:scale-105 transition-transform">
                    {isProcessing ? "Création..." : "Créer l'utilisateur"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialogue d'édition d'utilisateur */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] animate-scale-in">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les informations de base de l'utilisateur.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="employee">Employé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe (optionnel)</FormLabel>
                      <div className="flex">
                        <FormControl>
                          <div className="relative w-full">
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              {...field} 
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Utilisateur actif</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isProcessing} className="hover:scale-105 transition-transform">
                    {isProcessing ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UsersManagement;
