import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  CreditCard, 
  FileText,
  Truck,
  Settings,
  Package2,
  UserCog,
  Receipt,
  BarChart3,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { useUser } from "@/contexts/UserContext";
import { useMemo } from "react";

const Sidebar = () => {
  const { settings } = useCompanySettings();
  const { hasPermission, user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = useMemo(() => [
    { 
      name: "Tableau de bord", 
      href: "/", 
      icon: LayoutDashboard,
      permission: null
    },
    { 
      name: "Produits", 
      href: "/products", 
      icon: Package,
      permission: "canAccessProducts"
    },
    { 
      name: "Clients", 
      href: "/clients", 
      icon: Users,
      permission: "canAccessClients"
    },
    { 
      name: "Fournisseurs", 
      href: "/suppliers", 
      icon: Building2,
      permission: null
    },
    { 
      name: "Ventes", 
      href: "/sales", 
      icon: ShoppingCart,
      permission: "canAccessSales"
    },
    { 
      name: "Achats", 
      href: "/purchases", 
      icon: Package2,
      permission: "canAccessPurchases"
    },
    { 
      name: "Factures", 
      href: "/invoices", 
      icon: Receipt,
      permission: "canAccessSales"
    },
    { 
      name: "Paiements", 
      href: "/payments", 
      icon: CreditCard,
      permission: "canAccessSales"
    },
    { 
      name: "Bons de commande", 
      href: "/purchase-orders", 
      icon: FileText,
      permission: null
    },
    { 
      name: "Bons de livraison", 
      href: "/delivery-notes", 
      icon: Truck,
      permission: null
    },
    { 
      name: "Devis", 
      href: "/quotes", 
      icon: FileText,
      permission: null
    },
    { 
      name: "Rapports", 
      href: "/reports", 
      icon: BarChart3,
      permission: "canViewReports"
    },
    { 
      name: "Gestion utilisateurs", 
      href: "/users", 
      icon: UserCog,
      permission: "canManageUsers"
    },
    { 
      name: "Paramètres", 
      href: "/settings", 
      icon: Settings,
      permission: "canChangeSettings"
    },
  ], []);

  // Optimize filtered nav items with useMemo
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (user?.role === 'admin') {
        return true;
      }
      
      if (!item.permission) return true;
      
      return hasPermission(item.permission as any);
    });
  }, [navItems, user?.role, hasPermission]);

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="h-full w-64 bg-gradient-to-b from-blue-50 to-blue-100 py-6 flex flex-col border-r border-blue-200 shadow-lg">
      <div className="px-4 mb-8 flex items-center">
        {settings.logoUrl ? (
          <div className="w-10 h-10 mr-3 overflow-hidden rounded-lg shadow-md">
            <img 
              src={settings.logoUrl} 
              alt={settings.name || "Xflow"} 
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-10 h-10 mr-3 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold shadow-md">
            {settings.name ? settings.name.charAt(0) : "X"}
          </div>
        )}
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          {settings.name || "Xflow"}
        </h1>
      </div>
      <nav className="flex-1 px-2 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = isActiveRoute(item.href);
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-left",
                isActive 
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg" 
                  : "text-blue-700 hover:bg-white/60 hover:text-blue-800 hover:shadow-md"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="px-4 py-2">
        <div className="bg-white/60 rounded-lg p-3 border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">Version 1.0.0</p>
          <p className="text-xs text-blue-500">Système de gestion</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
