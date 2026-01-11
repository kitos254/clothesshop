
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarSkeleton, UserAvatarSkeleton } from "@/components/ui/loading-skeletons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  BarChart3,
  User,
  Shield,
  FileText,
  Tag,
  Truck,
  MessageSquare,
  LogOut,
  Crown,
  Cloud
} from "lucide-react";

interface SidebarLinkProps {
  icon: React.ElementType;
  label: string;
  href?: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  badge?: number;
}

const SidebarLink = ({ 
  icon: Icon, 
  label, 
  href,
  active = false, 
  collapsed = false,
  onClick,
  badge 
}: SidebarLinkProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md w-full transition-all duration-200 relative",
        active 
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center"
      )}
    >
      <Icon size={20} />
      {!collapsed && <span>{label}</span>}
      {badge && !collapsed && (
        <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full font-medium min-w-[1.25rem] text-center">
          {badge}
        </span>
      )}
    </button>
  );
};

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, isLoading, logout } = useAuth();

  // Navigation items for NewRan admin
  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Package, label: "Products", href: "/products" },
    { icon: ShoppingCart, label: "Orders", href: "/orders", badge: 3 },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: Tag, label: "Categories", href: "/categories" },
    { icon: Truck, label: "Shipping", href: "/shipping" },
  ];

  const analyticsItems = [
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: FileText, label: "Reports", href: "/reports" },
    { icon: MessageSquare, label: "Reviews", href: "/reviews" },
  ];

  const systemItems = [
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  // Add admin management for super admin and admin
  const adminItems = admin && ['super_admin', 'admin'].includes(admin.role) ? [
    { icon: Shield, label: "Admin Users", href: "/admin-users" },
    { icon: Cloud, label: "Cloudinary", href: "/cloudinary" },
  ] : [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col",
          collapsed ? "w-16" : "w-56",
          className
        )}
      >
        <SidebarSkeleton />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-56",
        className
      )}
    >
      {/* Fixed Header */}
      <div className={cn(
        "flex-shrink-0",
        collapsed ? "p-1" : "p-2"
      )}>
        <div className={cn(
          "flex items-center gap-2",
          collapsed && "justify-center"
        )}>
          {/* Logo Container */}
          <div className="h-12 w-12 rounded-full bg-white p-0.5 shadow-lg backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <img 
              src="/newranLogo.png" 
              alt="NewRan Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          {!collapsed && (
            <h1 className="font-semibold text-xl text-sidebar-foreground">New<span className="text-primary">Ran</span></h1>
          )}
        </div>
      </div>

      <div className="absolute top-4 -right-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-6 w-6 rounded-full bg-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Scrollable Navigation Content */}
      <div className={cn(
        "flex-1 overflow-y-auto mt-6 space-y-6 pb-4",
        collapsed ? "px-1" : "px-2"
      )}>
        {/* Main Navigation */}
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <SidebarLink 
              key={item.href}
              icon={item.icon} 
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              collapsed={collapsed}
              onClick={() => handleNavigation(item.href)}
              badge={item.badge}
            />
          ))}
        </div>

        {/* Analytics Section */}
        <div className="pt-4 border-t border-sidebar-border">
          <p className={cn(
            "text-xs uppercase text-sidebar-foreground/60 mb-2 px-3",
            collapsed && "text-center"
          )}>
            {collapsed ? "📊" : "Analytics"}
          </p>
          <div className="space-y-1">
            {analyticsItems.map((item) => (
              <SidebarLink 
                key={item.href}
                icon={item.icon} 
                label={item.label}
                href={item.href}
                active={isActive(item.href)}
                collapsed={collapsed}
                onClick={() => handleNavigation(item.href)}
              />
            ))}
          </div>
        </div>

        {/* Admin Management (Super Admin & Admin only) */}
        {adminItems.length > 0 && (
          <div className="pt-4 border-t border-sidebar-border">
            <p className={cn(
              "text-xs uppercase text-sidebar-foreground/60 mb-2 px-3",
              collapsed && "text-center"
            )}>
              {collapsed ? "👑" : "Administration"}
            </p>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <SidebarLink 
                  key={item.href}
                  icon={item.icon} 
                  label={item.label}
                  href={item.href}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                  onClick={() => handleNavigation(item.href)}
                />
              ))}
            </div>
          </div>
        )}

        {/* System Section */}
        <div className="pt-4 border-t border-sidebar-border">
          <p className={cn(
            "text-xs uppercase text-sidebar-foreground/60 mb-2 px-3",
            collapsed && "text-center"
          )}>
            {collapsed ? "⚙️" : "System"}
          </p>
          <div className="space-y-1">
            {systemItems.map((item) => (
              <SidebarLink 
                key={item.href}
                icon={item.icon} 
                label={item.label}
                href={item.href}
                active={isActive(item.href)}
                collapsed={collapsed}
                onClick={() => handleNavigation(item.href)}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Fixed Admin Profile at Bottom */}
      <div className={cn(
        "flex-shrink-0 border-t border-sidebar-border bg-sidebar",
        collapsed ? "p-1" : "p-2"
      )}>
        {admin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center rounded-md w-full hover:bg-sidebar-accent transition-colors",
                collapsed ? "justify-center p-1" : "gap-3 px-3 py-2"
              )}>
                <div className="relative">
                  <img
                    src={admin.avatar?.url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                    alt={admin.fullName}
                    className={cn(
                      "rounded-full object-cover",
                      collapsed ? "w-9 h-9" : "w-8 h-8"
                    )}
                  />
                  <div className={cn(
                    "absolute bg-green-500 rounded-full border-2 border-sidebar",
                    collapsed ? "-top-0.5 -right-0.5 w-3 h-3" : "-top-1 -right-1 w-3 h-3"
                  )}></div>
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {admin.fullName}
                      </p>
                      {admin.role === 'super_admin' && (
                        <Crown size={12} className="text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {admin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="top"
              className="w-56 mb-2"
              sideOffset={8}
            >
              <div className="flex items-center gap-3 p-3">
                <img
                  src={admin.avatar?.url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                  alt={admin.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {admin.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {admin.email}
                  </p>
                </div>
                {admin.role === 'super_admin' && (
                  <Crown size={14} className="text-yellow-500" />
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <UserAvatarSkeleton />
        )}
      </div>
    </div>
  );
}
