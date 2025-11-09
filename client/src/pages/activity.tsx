import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Activity as ActivityIcon, Zap, DollarSign, Trash2, Edit, UserPlus, LogIn } from "lucide-react";
import { useState } from "react";
import type { ActivityLog } from "@shared/schema";

interface ActivityLogWithUsername extends ActivityLog {
  username: string;
}

export default function Activity() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activities = [] } = useQuery<ActivityLogWithUsername[]>({
    queryKey: ["/api/activity"],
  });

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, any> = {
      create_uid: Zap,
      delete_uid: Trash2,
      update_uid: Edit,
      credit_add: DollarSign,
      credit_deduct: DollarSign,
      user_created: UserPlus,
      login: LogIn,
    };
    return iconMap[action] || ActivityIcon;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create_uid: "text-primary",
      delete_uid: "text-destructive",
      update_uid: "text-chart-3",
      credit_add: "text-chart-2",
      credit_deduct: "text-destructive",
      user_created: "text-chart-2",
      login: "text-muted-foreground",
    };
    return colorMap[action] || "text-muted-foreground";
  };

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; variant: any }> = {
      create_uid: { label: "Create UID", variant: "default" },
      delete_uid: { label: "Delete UID", variant: "destructive" },
      update_uid: { label: "Update UID", variant: "secondary" },
      credit_add: { label: "Add Credits", variant: "default" },
      credit_deduct: { label: "Deduct Credits", variant: "secondary" },
      user_created: { label: "User Created", variant: "default" },
      login: { label: "Login", variant: "secondary" },
    };

    const config = actionMap[action] || { label: action, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const filteredActivities = activities.filter(activity =>
    activity.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
        <p className="text-muted-foreground">Monitor all system operations and user actions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>All operations performed in the system</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-activity"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const Icon = getActionIcon(activity.action);
              const colorClass = getActionColor(activity.action);
              const isCost = activity.action === "create_uid" && activity.details?.includes("Cost:");
              const isCredit = activity.action.includes("credit_");

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover-elevate transition-all"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className={`w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getActionBadge(activity.action)}
                      <Badge variant="secondary" className="text-xs font-mono">
                        {activity.username}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mb-1">{activity.details}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatTime(activity.createdAt)}
                    </p>
                  </div>

                  {isCost && activity.details && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-destructive">
                        {activity.details.match(/Cost: \$([0-9.]+)/)?.[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">Deducted</p>
                    </div>
                  )}

                  {isCredit && activity.details && activity.action === "credit_add" && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-chart-2">
                        +{activity.details.match(/\$([0-9.]+)/)?.[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">Added</p>
                    </div>
                  )}

                  {isCredit && activity.details && activity.action === "credit_deduct" && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-destructive">
                        -{activity.details.match(/\$([0-9.]+)/)?.[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">Deducted</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {filteredActivities.length} of {activities.length} activities</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
