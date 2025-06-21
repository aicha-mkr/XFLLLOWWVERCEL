
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const UserHeader = () => {
  const { currentUser, logout } = useUser();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) return null;

  // Get initials from fullName or username
  const getInitials = () => {
    if (currentUser.fullName) {
      const names = currentUser.fullName.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return currentUser.fullName.substring(0, 2).toUpperCase();
    }
    return currentUser.username.substring(0, 2).toUpperCase();
  };

  // Get role display text
  const getRoleDisplay = () => {
    switch (currentUser.role) {
      case "admin":
        return "Administrateur";
      case "manager":
        return "Manager";
      case "employee":
        return "Employé";
      default:
        return currentUser.role;
    }
  };

  // Handle logout action
  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
    setLogoutDialogOpen(false);
  };

  // Navigate to settings
  const navigateToSettings = () => {
    navigate("/settings");
  };

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-12 px-2 relative flex items-center gap-2 hover:bg-gray-100 rounded-md">
            <div className="hidden sm:flex flex-col items-end text-right pr-2">
              <span className="font-medium text-sm">
                {currentUser.fullName || currentUser.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {getRoleDisplay()}
              </span>
            </div>
            <Avatar className="h-8 w-8 border border-gray-200">
              <AvatarFallback className="bg-blue-600 text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={navigateToSettings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à l'application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserHeader;
