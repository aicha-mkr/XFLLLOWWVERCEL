
import { Bell, User, Settings, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import StockNotifications from "./StockNotifications";
import { useToast } from "@/hooks/use-toast";

const LayoutHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRefreshSystem = () => {
    // Trigger a refresh of all data
    window.location.reload();
    
    toast({
      title: "Système actualisé",
      description: "Toutes les données ont été rechargées",
    });
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.fullName.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "AD";
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Xflow</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* System Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshSystem}
            className="relative hover:bg-blue-50"
            title="Actualiser le système"
          >
            <RefreshCw className="h-5 w-5 text-blue-600" />
          </Button>

          {/* Stock Notifications */}
          <StockNotifications />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700">
                {getUserInitials()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium leading-none">{user?.fullName || "Utilisateur"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default LayoutHeader;
