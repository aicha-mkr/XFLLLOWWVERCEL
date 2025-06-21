import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as UserType, UserPermissions, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface UserContextType {
  currentUser: UserType | null;
  users: UserType[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  login: (username: string, password: string) => Promise<UserType | null>;
  logout: () => void;
  updateUser: (id: string, userData: Partial<UserType> & { newPassword?: string }) => Promise<void>;
  createUser: (userData: Omit<UserType, 'id' | 'createdAt' | 'permissions' | 'passwordHash'> & { password: string }) => Promise<UserType | null>;
  deleteUser: (id: string) => Promise<void>;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  refreshCurrentUser: () => Promise<void>;
  getRolePermissions: (role: UserRole) => UserPermissions;
  validatePassword: (password: string) => { isValid: boolean; message?: string };
}

const defaultPermissions: UserPermissions = {
  canAccessClients: false,
  canAccessProducts: false,
  canAccessSales: false,
  canAccessPurchases: false,
  canViewReports: false,
  canManageUsers: false,
  canChangeSettings: false,
};

export const getRolePermissions = (role: UserRole): UserPermissions => {
    const allPermissions: UserPermissions = { ...defaultPermissions };
    for (const key in allPermissions) { (allPermissions as any)[key] = true; }

    const managerPermissions: UserPermissions = {
        ...defaultPermissions,
        canAccessClients: true,
        canAccessProducts: true,
        canAccessSales: true,
        canAccessPurchases: true,
        canViewReports: true,
    };

    const employeePermissions: UserPermissions = {
        ...defaultPermissions,
        canAccessClients: true,
        canAccessProducts: true,
        canAccessSales: true,
    };

    switch (role) {
        case 'admin': return allPermissions;
        case 'manager': return managerPermissions;
        case 'employee': return employeePermissions;
        default: return { ...defaultPermissions };
    }
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isElectron = !!(window as any).electronAPI;

  const parseDate = (value: any): Date | undefined => {
    if (!value) return undefined;
    // Try parsing as-is (ISO string, or a direct number timestamp)
    let date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
    // If that fails, it might be a string that's a number
    const num = parseFloat(value);
    if (!isNaN(num)) {
      date = new Date(num);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    console.warn(`Could not parse date value: "${value}"`);
    return undefined;
  };

  // Load users from storage
  const loadUsers = async () => {
    try {
      if (!isElectron) {
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
          const usersList = JSON.parse(savedUsers);
          setUsers(usersList.map((u: any) => ({
            ...u,
            createdAt: new Date(u.createdAt),
            lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined,
            permissions: getRolePermissions(u.role)
          })));
        } else {
          // Create default admin if no users exist
          const defaultAdmin = await createDefaultAdmin();
          setUsers([defaultAdmin]);
          localStorage.setItem('users', JSON.stringify([{
            ...defaultAdmin,
            createdAt: defaultAdmin.createdAt.toISOString(),
            lastLogin: defaultAdmin.lastLogin?.toISOString()
          }]));
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await loadUsers();
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          const fullUser = {
            ...userData,
            createdAt: new Date(userData.createdAt),
            lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined,
            permissions: getRolePermissions(userData.role)
          };
          setCurrentUser(fullUser);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !currentUser && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [currentUser, isLoading, location.pathname, navigate]);

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    try {
      let updatedUser: UserType | null = null;

      if (isElectron) {
        const dbUser = await (window as any).electronAPI.dbGet(
          'SELECT u.*, p.userId as permission_userId, p.* FROM users u LEFT JOIN user_permissions p ON u.id = p.userId WHERE u.id = ? AND u.active = 1',
          [currentUser.id]
        );

        if (dbUser) {
          let permissions: UserPermissions;
          if (dbUser.permission_userId) {
            permissions = {
              canAccessClients: !!(dbUser.canViewClients || dbUser.canCreateClients || dbUser.canEditClients || dbUser.canDeleteClients),
              canAccessProducts: !!(dbUser.canViewProducts || dbUser.canCreateProducts || dbUser.canEditProducts || dbUser.canDeleteProducts),
              canAccessSales: !!(dbUser.canViewSales || dbUser.canCreateSales || dbUser.canEditSales || dbUser.canDeleteSales),
              canAccessPurchases: !!(dbUser.canViewPurchases || dbUser.canCreatePurchases || dbUser.canEditPurchases || dbUser.canDeletePurchases),
              canViewReports: !!dbUser.canViewReports,
              canManageUsers: !!dbUser.canManageUsers,
              canChangeSettings: !!dbUser.canChangeSettings,
            };
          } else {
            permissions = getRolePermissions(dbUser.role);
          }
          
          updatedUser = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            fullName: dbUser.fullName,
            passwordHash: dbUser.passwordHash,
            role: dbUser.role,
            active: !!dbUser.active,
            permissions: permissions,
            createdAt: parseDate(dbUser.createdAt) || new Date(),
            lastLogin: parseDate(dbUser.lastLogin)
          };
        }
      } else {
        const savedUsers = localStorage.getItem('users');
        if (savedUsers) {
          const usersList = JSON.parse(savedUsers);
          const dbUser = usersList.find((u: any) => u.id === currentUser.id && u.active);
          
          if (dbUser) {
            updatedUser = {
              ...dbUser,
              createdAt: parseDate(dbUser.createdAt) || new Date(),
              lastLogin: parseDate(dbUser.lastLogin),
              permissions: getRolePermissions(dbUser.role)
            };
          }
        }
      }

      if (updatedUser) {
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify({
          ...updatedUser,
          createdAt: updatedUser.createdAt.toISOString(),
          lastLogin: updatedUser.lastLogin?.toISOString()
        }));
        
        console.log('User permissions refreshed:', updatedUser.permissions);
      }
    } catch (error) {
      console.error('Error refreshing current user:', error);
    }
  };

  const createDefaultAdmin = async (): Promise<UserType> => {
    const defaultAdmin: UserType = {
      id: '1',
      username: 'admin',
      email: 'admin@xflow.com',
      fullName: 'Administrator',
      passwordHash: '$2a$10$RRCqQyVeGb2JJLqjGVEGe.pNJJE9PRf/FBjBYaT8sL0hkiuVB4Eni', // Admin123!
      role: 'admin',
      active: true,
      permissions: getRolePermissions('admin'),
      createdAt: new Date(),
      lastLogin: new Date()
    };
    return defaultAdmin;
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return { isValid: false, message: "Le mot de passe doit contenir au moins 8 caractères" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: "Le mot de passe doit contenir au moins une majuscule" };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: "Le mot de passe doit contenir au moins une minuscule" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Le mot de passe doit contenir au moins un chiffre" };
    }
    return { isValid: true };
  };

  const checkPasswordStrength = (password: string): string => {
    if (password.length < 8) return "Faible";
    if (password.length < 12) return "Moyen";
    return "Fort";
  };

  const hasPermission = (permission: keyof UserPermissions): boolean => {
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === 'admin') return true;
    
    return currentUser.permissions[permission] || false;
  };
  
  const login = async (username: string, password: string): Promise<UserType | null> => {
    setIsProcessing(true);
    try {
      if (!isElectron) {
        // Web version - use localStorage
        const savedUsers = localStorage.getItem('users');
        const usersList = savedUsers ? JSON.parse(savedUsers) : [];
        
        if (usersList.length === 0) {
          // Create default admin if no users exist
          const defaultAdmin = await createDefaultAdmin();
          usersList.push({
            ...defaultAdmin,
            createdAt: defaultAdmin.createdAt.toISOString(),
            lastLogin: defaultAdmin.lastLogin?.toISOString()
          });
          localStorage.setItem('users', JSON.stringify(usersList));
        }

        const foundUser = usersList.find((u: any) => u.username === username);
        
        if (foundUser) {
          // For the default admin account
          if (username === 'admin' && password === 'Admin123!') {
            const user = {
              ...foundUser,
              createdAt: new Date(foundUser.createdAt),
              lastLogin: new Date(),
              permissions: getRolePermissions(foundUser.role)
            };
            
            setCurrentUser(user);
            localStorage.setItem('currentUser', JSON.stringify({
              ...user,
              createdAt: user.createdAt.toISOString(),
              lastLogin: user.lastLogin?.toISOString()
            }));

            toast({
              title: "Connexion réussie",
              description: `Bienvenue, ${user.fullName || user.username}!`,
            });

            return user;
          }
        }
      }

      toast({
        title: "Erreur de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect.",
        variant: "destructive",
      });
      return null;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erreur de connexion",
        description: "Une erreur s'est produite lors de la connexion.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    navigate('/login', { replace: true });
  };

  const createUser = async (userData: Omit<UserType, 'id' | 'createdAt' | 'permissions' | 'passwordHash'> & { password: string }): Promise<UserType | null> => {
    setIsProcessing(true);
    try {
      // Input validation
      if (!userData.username || !userData.password || !userData.email || !userData.fullName || !userData.role) {
        throw new Error("Tous les champs sont requis.");
      }
      if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        throw new Error("Ce nom d'utilisateur existe déjà.");
      }

      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.message || '');
      }

      let hashedPassword = '';
      if (isElectron) {
        const result = await (window as any).electronAPI.bcryptHash(userData.password);
        if (result.success && result.hash) {
          hashedPassword = result.hash;
        } else {
          throw new Error(result.error || 'Password hashing failed');
        }
      } else {
        // Fallback for web version
        const bcrypt = (await import('bcryptjs')).default;
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }
      
      const newUser: UserType = {
        id: `user-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        passwordHash: hashedPassword,
        role: userData.role,
        active: true,
        permissions: getRolePermissions(userData.role),
        createdAt: new Date(),
        lastLogin: undefined
      };

      if (isElectron) {
        await (window as any).electronAPI.dbRun(
          'INSERT INTO users (id, username, email, fullName, role, active, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [newUser.id, newUser.username, newUser.email, newUser.fullName, newUser.role, newUser.active, newUser.passwordHash, newUser.createdAt.toISOString()]
        );
      } else {
        const updatedUsers = [...users, newUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers.map(u => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLogin: u.lastLogin?.toISOString()
        }))));
        setUsers(updatedUsers);
      }
      
      await loadUsers();
      toast({ title: "Succès", description: "Utilisateur créé avec succès." });
      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateUser = async (id: string, userData: Partial<UserType> & { newPassword?: string }) => {
    setIsProcessing(true);
    try {
      let userToUpdate = users.find(u => u.id === id);
      if (!userToUpdate) {
        throw new Error("Utilisateur non trouvé.");
      }

      // Merge existing data with new data
      let updatedData = {
        ...userToUpdate,
        ...userData,
      };
      
      // Hash new password if provided
      if (userData.newPassword) {
        const passwordValidation = validatePassword(userData.newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.message || '');
        }
        if (isElectron) {
          const result = await (window as any).electronAPI.bcryptHash(userData.newPassword);
          if (result.success && result.hash) {
            updatedData.passwordHash = result.hash;
          } else {
            throw new Error(result.error || 'Password hashing failed');
          }
        } else {
            // Fallback for web version
            const bcrypt = (await import('bcryptjs')).default;
            updatedData.passwordHash = await bcrypt.hash(userData.newPassword, 10);
        }
      }

      // If permissions are being updated, save them to the user_permissions table
      if (userData.permissions) {
        const perms = userData.permissions;
        const dbPerms = {
          userId: id,
          canViewClients: perms.canAccessClients ? 1 : 0,
          canCreateClients: perms.canAccessClients ? 1 : 0,
          canEditClients: perms.canAccessClients ? 1 : 0,
          canDeleteClients: perms.canAccessClients ? 1 : 0,
          canViewProducts: perms.canAccessProducts ? 1 : 0,
          canCreateProducts: perms.canAccessProducts ? 1 : 0,
          canEditProducts: perms.canAccessProducts ? 1 : 0,
          canDeleteProducts: perms.canAccessProducts ? 1 : 0,
          canViewSales: perms.canAccessSales ? 1 : 0,
          canCreateSales: perms.canAccessSales ? 1 : 0,
          canEditSales: perms.canAccessSales ? 1 : 0,
          canDeleteSales: perms.canAccessSales ? 1 : 0,
          canViewPurchases: perms.canAccessPurchases ? 1 : 0,
          canCreatePurchases: perms.canAccessPurchases ? 1 : 0,
          canEditPurchases: perms.canAccessPurchases ? 1 : 0,
          canDeletePurchases: perms.canAccessPurchases ? 1 : 0,
          canViewReports: perms.canViewReports ? 1 : 0,
          canManageUsers: perms.canManageUsers ? 1 : 0,
          canChangeSettings: perms.canChangeSettings ? 1 : 0,
        };
        const fields = Object.keys(dbPerms);
        const placeholders = fields.map(() => '?').join(',');
        const values = Object.values(dbPerms);
        const sql = `INSERT OR REPLACE INTO user_permissions (${fields.join(',')}) VALUES (${placeholders})`;
        await (window as any).electronAPI.dbRun(sql, values);
      }

      // Remove non-db properties before saving to users table
      if (isElectron) {
        const { id, newPassword, permissions, createdAt, ...dbData } = updatedData;
        
        // Build the update query dynamically
        const fields = Object.keys(dbData).filter(key => key !== 'id' && (dbData as any)[key] !== undefined);
        const values = fields.map(key => {
          const value = (dbData as any)[key];
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        });
        const setClause = fields.map(key => `${key} = ?`).join(', ');

        if(fields.length > 0) {
          await (window as any).electronAPI.dbRun(
            `UPDATE users SET ${setClause} WHERE id = ?`,
            [...values, id]
          );
        }
      } else {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
          const updatedUsers = [...users];
          const { newPassword, ...finalData } = updatedData;
          updatedUsers[userIndex] = finalData;
          localStorage.setItem('users', JSON.stringify(updatedUsers.map(u => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            lastLogin: u.lastLogin?.toISOString()
          }))));
        }
      }
      
      await loadUsers(); // Refresh users list
      if (currentUser && currentUser.id === id) {
        await refreshCurrentUser(); // Refresh current user data if they are the one being edited
      }
      toast({ title: "Succès", description: "Utilisateur mis à jour." });
    } catch (error: any) {
      console.error('Error updating user:', error);
      const description = error.code === 'SQLITE_CONSTRAINT' ? `Erreur: ${error.message}` : "Impossible de mettre à jour.";
      toast({ title: 'Erreur', description, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      toast({ title: 'Erreur', description: 'Vous ne pouvez pas supprimer votre propre compte.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      if (isElectron) {
        await (window as any).electronAPI.dbRun('DELETE FROM users WHERE id = ?', [id]);
      } else {
        const updatedUsers = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(updatedUsers.map(u => ({
          ...u,
          createdAt: (u.createdAt as Date).toISOString(),
          lastLogin: u.lastLogin ? (u.lastLogin as Date).toISOString() : undefined
        }))));
      }
      
      await loadUsers(); // Refresh users list
      toast({ title: "Succès", description: "Utilisateur supprimé." });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({ title: 'Erreur', description: "Impossible de supprimer l'utilisateur.", variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        isLoading,
        isProcessing,
        login,
        logout,
        updateUser,
        createUser,
        deleteUser,
        hasPermission,
        refreshCurrentUser,
        getRolePermissions,
        validatePassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};