import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, Activity, Zap, Settings } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import type { User, ActivityLog, Uid } from "@shared/schema";

export default function Dashboard() {
  const { user, isOwner } = useAuth();
  
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOwner,
  });

  const { data: activities = [] } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  const { data: myUids = [] } = useQuery<Uid[]>({
    queryKey: ["/api/uids/user", user?.id],
    enabled: !!user?.id,
  });

  const totalCredits = users.reduce((sum, user) => sum + parseFloat(user.credits), 0);
  const myCredits = user ? parseFloat(user.credits) : 0;
  
  const uidsToday = activities.filter(a => 
    a.action === "create_uid" && 
    new Date(a.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const myActiveUids = myUids.filter(uid => uid.status === "active").length;

  const totalRevenue = activities
    .filter(a => a.action === "create_uid")
    .reduce((sum, a) => {
      const match = a.details?.match(/Cost: \$([0-9.]+)/);
      return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isOwner ? (
          <>
            <StatCard
              title="Total Users"
              value={users.length}
              icon={Users}
              trend={`${users.filter(u => u.isActive).length} active`}
              trendUp={true}
            />
            <StatCard
              title="Active Credits"
              value={`$${totalCredits.toFixed(2)}`}
              icon={DollarSign}
              trend="All users"
              trendUp={true}
            />
            <StatCard
              title="UIDs Today"
              value={uidsToday}
              icon={Zap}
              trend="All users"
              trendUp={true}
            />
            <StatCard
              title="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              icon={Activity}
              trend="Lifetime"
              trendUp={true}
            />
          </>
        ) : (
          <>
            <StatCard
              title="My Credits"
              value={`$${myCredits.toFixed(2)}`}
              icon={DollarSign}
              trend="Available balance"
              trendUp={true}
            />
            <StatCard
              title="Active UIDs"
              value={myActiveUids}
              icon={Zap}
              trend={`${myUids.length} total`}
              trendUp={true}
            />
            <StatCard
              title="My Activity"
              value={activities.length}
              icon={Activity}
              trend="Recent actions"
              trendUp={true}
            />
            <StatCard
              title="Account Status"
              value={user?.isActive ? "Active" : "Inactive"}
              icon={Settings}
              trend={user?.username || "User"}
              trendUp={user?.isActive}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest operations across all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.slice(0, 10).map((activity) => {
                const user = users.find(u => u.id === activity.userId);
                const isCost = activity.action === "create_uid";
                const isCredit = activity.action.includes("credit_add");
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">{activity.action.replace(/_/g, " ")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {user?.username || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCost && activity.details && (
                        <p className="text-sm font-medium text-primary">
                          {activity.details.match(/Cost: \$([0-9.]+)/)?.[0]}
                        </p>
                      )}
                      {isCredit && activity.details && (
                        <p className="text-sm font-medium text-chart-2">
                          {activity.details.match(/\$([0-9.]+)/)?.[0]}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your system efficiently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isOwner && (
              <a
                href="/users"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-manage-users"
              >
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">Add, edit, or remove users</p>
                </div>
                <Users className="w-5 h-5 text-muted-foreground" />
              </a>
            )}

            <a
              href="/create-uid"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-all"
              data-testid="link-create-uid"
            >
              <div>
                <p className="font-medium">Create UID</p>
                <p className="text-sm text-muted-foreground">Generate new UID with duration</p>
              </div>
              <Zap className="w-5 h-5 text-muted-foreground" />
            </a>

            {isOwner && (
              <a
                href="/credits"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-manage-credits"
              >
                <div>
                  <p className="font-medium">Manage Credits</p>
                  <p className="text-sm text-muted-foreground">Add or deduct user credits</p>
                </div>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </a>
            )}

            {isOwner && (
              <a
                href="/settings"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-settings"
              >
                <div>
                  <p className="font-medium">API Settings</p>
                  <p className="text-sm text-muted-foreground">Configure base URL and API key</p>
                </div>
                <Settings className="w-5 h-5 text-muted-foreground" />
              </a>
            )}

            {!isOwner && (
              <a
                href="/credits"
                className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate active-elevate-2 transition-all"
                data-testid="link-view-credits"
              >
                <div>
                  <p className="font-medium">My Credits</p>
                  <p className="text-sm text-muted-foreground">View your credit balance</p>
                </div>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
