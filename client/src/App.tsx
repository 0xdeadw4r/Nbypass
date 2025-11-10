import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import AllUIDs from "@/pages/all-uids";
import CreateUID from "@/pages/create-uid";
import UpdateUID from "@/pages/update-uid";
import DeleteUID from "@/pages/delete-uid";
import Credits from "@/pages/credits";
import Settings from "@/pages/settings";
import Activity from "@/pages/activity";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <img src="/logo.webp" alt="Logo" className="w-8 h-8" />
              <div>
                <p className="text-sm font-medium">UID Management System</p>
                <p className="text-xs text-muted-foreground">Administrative Dashboard</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/users">
        <ProtectedRoute requireOwner>
          <AuthenticatedLayout>
            <Users />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/all-uids">
        <ProtectedRoute requireOwner>
          <AuthenticatedLayout>
            <AllUIDs />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/create-uid">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <CreateUID />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/update-uid">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <UpdateUID />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/delete-uid">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <DeleteUID />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/credits">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Credits />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute requireOwner>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/activity">
        <ProtectedRoute requireOwner>
          <AuthenticatedLayout>
            <Activity />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
