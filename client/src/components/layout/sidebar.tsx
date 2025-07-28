import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Bot, 
  ShoppingCart, 
  Package, 
  Box, 
  Truck, 
  Warehouse, 
  BarChart3,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "AI Documents", href: "/ai-documents", icon: Bot },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Purchases", href: "/purchases", icon: Package },
  { name: "Products", href: "/products", icon: Box },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200 accounting-sidebar">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white w-4 h-4" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">AccFlow</span>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="mt-8 flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-colors",
                      isActive
                        ? "bg-primary/10 border-r-2 border-primary text-primary"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 flex-shrink-0 h-4 w-4",
                        isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User Profile */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600 w-4 h-4" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">John Doe</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
