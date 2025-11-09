import { Home, Users, CreditCard, Settings, Activity, PlusCircle, RefreshCw, Trash2, LogOut, List } from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: Home,
    ownerOnly: false,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    ownerOnly: true,
  },
  {
    title: "All UIDs",
    url: "/all-uids",
    icon: List,
    ownerOnly: true,
  },
  {
    title: "Create UID",
    url: "/create-uid",
    icon: PlusCircle,
    ownerOnly: false,
  },
  {
    title: "Update UID",
    url: "/update-uid",
    icon: RefreshCw,
    ownerOnly: false,
  },
  {
    title: "Delete UID",
    url: "/delete-uid",
    icon: Trash2,
    ownerOnly: false,
  },
  {
    title: "Credits",
    url: "/credits",
    icon: CreditCard,
    ownerOnly: false,
  },
  {
    title: "Activity",
    url: "/activity",
    icon: Activity,
    ownerOnly: true,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    ownerOnly: true,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isOwner } = useAuth();
  
  const visibleMenuItems = menuItems.filter(item => !item.ownerOnly || isOwner);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider px-4 py-3">
            Management Panel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <a href={item.url} className="flex items-center gap-3 px-4 py-2.5">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
            <p className="text-xs text-muted-foreground">{isOwner ? "Owner Account" : "User Account"}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
