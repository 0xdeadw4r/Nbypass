import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Clock } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Uid } from "@shared/schema";

interface UidWithUsername extends Uid {
  username: string;
  source?: string;
}

export default function AllUIDs() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUids = [], isLoading } = useQuery<UidWithUsername[]>({
    queryKey: ["/api/uids/all"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-chart-2 text-white";
      case "expired":
        return "bg-destructive text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredUids = allUids.filter(uid =>
    uid.uidValue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    uid.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">All UIDs</h1>
          <p className="text-muted-foreground">
            Complete overview of all UIDs across all users
          </p>
        </div>
        <Card className="px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total UIDs</p>
              <p className="text-3xl font-bold" data-testid="text-total-uids">{allUids.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>UID Directory</CardTitle>
              <CardDescription>Showing {filteredUids.length} of {allUids.length} UIDs</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by UID or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-all-uids"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading UIDs...</div>
          ) : filteredUids.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No UIDs found matching your search" : "No UIDs available"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUids.map((uid) => (
                <div
                  key={uid.id}
                  className="p-4 rounded-lg border border-border hover-elevate transition-all"
                  data-testid={`uid-card-${uid.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {uid.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-mono font-bold text-lg" data-testid={`text-uid-value-${uid.id}`}>
                            {uid.uidValue}
                          </p>
                          <Badge className={getStatusColor(uid.status)} data-testid={`badge-status-${uid.id}`}>
                            {uid.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground" data-testid={`text-username-${uid.id}`}>
                            {uid.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <p className="text-sm font-medium" data-testid={`text-duration-${uid.id}`}>
                            {uid.duration}h
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Created</p>
                        <p className="text-sm font-medium truncate" title={formatDate(uid.createdAt)}>
                          {new Date(uid.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Expires</p>
                        <p className="text-sm font-medium truncate" title={formatDate(uid.expiresAt)}>
                          {new Date(uid.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
