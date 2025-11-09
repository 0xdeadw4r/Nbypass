import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Search, Clock, AlertCircle, RefreshCw, Database, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Uid } from "@shared/schema";

interface ExternalUidListResponse {
  external: any;
  local: Uid[];
}

export default function DeleteUID() {
  const [searchUid, setSearchUid] = useState("");
  const [selectedUid, setSelectedUid] = useState<Uid | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: myUids = [] } = useQuery<Uid[]>({
    queryKey: ["/api/uids/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: externalData, isLoading: isLoadingExternal, refetch: refetchExternal } = useQuery<ExternalUidListResponse>({
    queryKey: ["/api/uids/external/list"],
    enabled: !!user?.id,
  });

  const deleteUidMutation = useMutation({
    mutationFn: async (uidId: string) => {
      return await apiRequest("DELETE", `/api/uids/${uidId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uids/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/uids/external/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "UID Deleted Successfully",
        description: "UID has been removed from both local and external systems.",
      });
      setSelectedUid(null);
      setSearchUid("");
      setShowConfirmDialog(false);
      refetchExternal();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete UID",
        description: error.message || "An error occurred while deleting the UID from external API.",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
    },
  });

  const handleSearch = () => {
    const trimmedSearch = searchUid.trim();
    
    if (!trimmedSearch) {
      toast({
        title: "Enter UID",
        description: "Please enter a UID to search",
        variant: "destructive",
      });
      return;
    }

    const found = myUids.find(
      (uid) => uid.uidValue.toLowerCase().trim() === trimmedSearch.toLowerCase()
    );

    if (found) {
      setSelectedUid(found);
    } else {
      toast({
        title: "UID Not Found",
        description: "This UID does not exist in your account or has already been deleted.",
        variant: "destructive",
      });
      setSelectedUid(null);
    }
  };

  const handleDelete = () => {
    if (selectedUid) {
      setShowConfirmDialog(true);
    }
  };

  const confirmDelete = () => {
    if (selectedUid) {
      deleteUidMutation.mutate(selectedUid.id);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Delete UID</h1>
        <p className="text-muted-foreground">
          Search and permanently delete a specific UID from both local and external systems
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Search UID</CardTitle>
              <CardDescription>
                Enter the UID you want to delete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search-uid">UID Value</Label>
                <div className="flex gap-3">
                  <Input
                    id="search-uid"
                    placeholder="Enter UID (e.g., 123456)"
                    value={searchUid}
                    onChange={(e) => setSearchUid(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="font-mono"
                    data-testid="input-search-uid"
                  />
                  <Button
                    onClick={handleSearch}
                    data-testid="button-search-uid"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>

              {selectedUid && (
                <div className="p-6 rounded-lg border-2 border-primary bg-primary/5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <p className="font-mono font-bold text-2xl">{selectedUid.uidValue}</p>
                        <Badge className={getStatusColor(selectedUid.status)}>
                          {selectedUid.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Duration</p>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{selectedUid.duration} hours</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Cost</p>
                          <p className="font-medium">${parseFloat(selectedUid.cost).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Created</p>
                          <p className="font-medium">{formatDate(selectedUid.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Expires</p>
                          <p className="font-medium">{formatDate(selectedUid.expiresAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex items-start gap-3 bg-destructive/10 -mx-6 -mb-6 p-4 rounded-b-lg">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-destructive mb-1">Warning</p>
                      <p className="text-sm text-muted-foreground">
                        This action will permanently delete the UID from both your local database 
                        and the external UID bypass API. This cannot be undone.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleDelete}
                    disabled={deleteUidMutation.isPending}
                    className="w-full"
                    data-testid="button-delete-uid"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteUidMutation.isPending ? "Deleting..." : "Delete UID Permanently"}
                  </Button>
                </div>
              )}

              {!selectedUid && searchUid && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Search for a UID to view details and delete</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Your Active UIDs</CardTitle>
              <CardDescription>Quick reference list</CardDescription>
            </CardHeader>
            <CardContent>
              {myUids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No UIDs found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {myUids.map((uid) => (
                    <button
                      key={uid.id}
                      onClick={() => {
                        setSearchUid(uid.uidValue);
                        setSelectedUid(uid);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all hover-elevate ${
                        selectedUid?.id === uid.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      data-testid={`uid-quick-${uid.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-mono font-medium">{uid.uidValue}</p>
                        <Badge className={getStatusColor(uid.status)} variant="secondary">
                          {uid.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uid.duration}h • ${parseFloat(uid.cost).toFixed(2)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you absolutely sure you want to delete UID{" "}
              <span className="font-mono font-bold text-foreground">
                {selectedUid?.uidValue}
              </span>
              ?
              <br />
              <br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remove the UID from the external UID bypass API</li>
                <li>Delete the UID from your local database</li>
                <li>Record this action in activity logs</li>
              </ul>
              <br />
              <strong>This action cannot be undone.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Yes, Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
