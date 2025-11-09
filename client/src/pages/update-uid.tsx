import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { RefreshCw, Clock, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Uid } from "@shared/schema";

const updateUidFormSchema = z.object({
  uidId: z.string().min(1, "Please select a UID to update"),
  newUidValue: z.string().min(6, "UID must be at least 6 characters").max(12, "UID must be at most 12 characters"),
});

export default function UpdateUID() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ uidId: string; oldValue: string; newValue: string } | null>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const { data: myUids = [], isLoading } = useQuery<Uid[]>({
    queryKey: ["/api/uids/user", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const form = useForm<z.infer<typeof updateUidFormSchema>>({
    resolver: zodResolver(updateUidFormSchema),
    defaultValues: {
      uidId: "",
      newUidValue: "",
    },
  });

  const selectedUidId = form.watch("uidId");
  const selectedUid = myUids.find(uid => uid.id === selectedUidId);

  const updateUidMutation = useMutation({
    mutationFn: async (data: { uidId: string; newUidValue: string }) => {
      const response = await apiRequest("PATCH", `/api/uids/${data.uidId}/value`, {
        newUidValue: data.newUidValue,
      });
      return response as unknown as { success: boolean; oldValue: string; newValue: string };
    },
    onSuccess: (response: { success: boolean; oldValue: string; newValue: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/uids/user", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "UID Updated Successfully",
        description: `UID updated from ${response.oldValue} to ${response.newValue}`,
      });
      form.reset();
      setShowConfirmDialog(false);
      setPendingUpdate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update UID",
        description: error.message || "An error occurred while updating the UID.",
        variant: "destructive",
      });
      setShowConfirmDialog(false);
      setPendingUpdate(null);
    },
  });

  const onSubmit = async (data: z.infer<typeof updateUidFormSchema>) => {
    const uid = myUids.find(u => u.id === data.uidId);
    if (!uid) return;

    setPendingUpdate({
      uidId: data.uidId,
      oldValue: uid.uidValue,
      newValue: data.newUidValue,
    });
    setShowConfirmDialog(true);
  };

  const confirmUpdate = () => {
    if (pendingUpdate) {
      updateUidMutation.mutate({
        uidId: pendingUpdate.uidId,
        newUidValue: pendingUpdate.newValue,
      });
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

  const activeUids = myUids.filter(uid => uid.status === "active");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Update UID</h1>
        <p className="text-muted-foreground">Change an existing UID to a new value</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Update UID Information</CardTitle>
              <CardDescription>Select an existing UID and enter the new value</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="uidId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select UID to Update</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-uid">
                              <SelectValue placeholder="Choose a UID" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeUids.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No active UIDs available
                              </div>
                            ) : (
                              activeUids.map((uid) => (
                                <SelectItem key={uid.id} value={uid.id} data-testid={`option-uid-${uid.id}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium">{uid.uidValue}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({uid.duration}h, expires {formatDate(uid.expiresAt)})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Only active UIDs can be updated
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedUid && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Current UID Details</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Value</p>
                          <p className="font-mono font-medium">{selectedUid.uidValue}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge className={getStatusColor(selectedUid.status)}>
                            {selectedUid.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{selectedUid.duration} hours</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expires At</p>
                          <p className="font-medium text-xs">{formatDate(selectedUid.expiresAt)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="newUidValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New UID Value</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter new 6-12 character UID"
                            className="font-mono"
                            data-testid="input-new-uid"
                            disabled={!selectedUid}
                          />
                        </FormControl>
                        <FormDescription>
                          Must be 6-12 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={updateUidMutation.isPending || !selectedUid || activeUids.length === 0}
                    data-testid="button-update-uid"
                  >
                    {updateUidMutation.isPending ? (
                      "Updating..."
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update UID
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Information</CardTitle>
              <CardDescription>Important details about updating UIDs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Free Updates</p>
                    <p className="text-muted-foreground">Updating your UID is completely free and does not deduct any credits</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Same Duration</p>
                    <p className="text-muted-foreground">The updated UID will keep the same expiration time and duration</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Instant Update</p>
                    <p className="text-muted-foreground">Changes are applied immediately to both local and external systems</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">Loading your UIDs...</p>
                </div>
              ) : (
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Your Active UIDs
                  </p>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{activeUids.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeUids.length === 1 ? "UID available" : "UIDs available"} to update
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Active UIDs</CardTitle>
          <CardDescription>All your active UIDs that can be updated</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading UIDs...</p>
            </div>
          ) : activeUids.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active UIDs available</p>
              <p className="text-sm text-muted-foreground mt-2">Create a new UID to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeUids.map((uid) => (
                <div
                  key={uid.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate"
                  data-testid={`uid-card-${uid.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-mono font-medium text-lg">{uid.uidValue}</p>
                      <Badge className={getStatusColor(uid.status)}>
                        {uid.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Duration: {uid.duration}h</span>
                      </div>
                      <div>
                        <span>Cost: ${parseFloat(uid.cost).toFixed(2)}</span>
                      </div>
                      <div>
                        <span>Expires: {formatDate(uid.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={() => {
                      form.setValue("uidId", uid.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    data-testid={`button-select-${uid.id}`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm UID Update</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to update this UID?</p>
              {pendingUpdate && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Old UID:</span>
                    <span className="font-mono font-medium">{pendingUpdate.oldValue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New UID:</span>
                    <span className="font-mono font-medium text-primary">{pendingUpdate.newValue}</span>
                  </div>
                </div>
              )}
              <p className="text-xs mt-4">This will update the UID on both local and external systems.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-update">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdate}
              className="bg-primary text-primary-foreground"
              data-testid="button-confirm-update"
            >
              {updateUidMutation.isPending ? "Updating..." : "Confirm Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
