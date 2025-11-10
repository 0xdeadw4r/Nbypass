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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Zap, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Uid } from "@shared/schema";

const pricingTiers = [
  { duration: 24, hours: "24 Hours", days: "1 Day", price: 0.50, popular: false },
  { duration: 48, hours: "48 Hours", days: "2 Days", price: 0.80, popular: false },
  { duration: 72, hours: "72 Hours", days: "3 Days", price: 1.30, popular: true },
  { duration: 120, hours: "120 Hours", days: "5 Days", price: 2.00, popular: false },
  { duration: 168, hours: "168 Hours", days: "7 Days", price: 2.33, popular: false },
  { duration: 720, hours: "720 Hours", days: "30 Days", price: 5.20, popular: false },
  { duration: 1440, hours: "1440 Hours", days: "60 Days", price: 9.50, popular: false },
];

const createUidFormSchema = z.object({
  uidValue: z.string().min(6, "UID must be at least 6 characters").max(12, "UID must be at most 12 characters"),
  duration: z.number(),
});

export default function CreateUID() {
  const [selectedDuration, setSelectedDuration] = useState(72);
  const { toast } = useToast();
  const { user: currentUser, isOwner } = useAuth();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOwner,
  });

  const user = users.find(u => u.id === currentUser?.id) || currentUser;

  const { data: myUids = [] } = useQuery<Uid[]>({
    queryKey: ["/api/uids/user", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const form = useForm<z.infer<typeof createUidFormSchema>>({
    resolver: zodResolver(createUidFormSchema),
    defaultValues: {
      uidValue: "",
      duration: 72,
    },
  });

  const selectedTier = pricingTiers.find(tier => tier.duration === selectedDuration);

  const createUidMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createUidFormSchema>) => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + data.duration);

      const response = await apiRequest("POST", "/api/uids", {
        userId: user!.id,
        uidValue: data.uidValue,
        duration: data.duration,
        cost: selectedTier?.price.toFixed(2),
        expiresAt: expiresAt.toISOString(),
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/uids/user", currentUser?.id] });
      toast({
        title: "UID Created",
        description: `UID ${form.getValues().uidValue} created successfully. New balance: $${data.newCredits}`,
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "An error occurred while creating the UID.",
        variant: "destructive",
      });
    },
  });

  const deleteUidMutation = useMutation({
    mutationFn: async (uidId: string) => {
      return await apiRequest("DELETE", `/api/uids/${uidId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uids/user", currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({
        title: "UID Deleted",
        description: "UID has been removed from the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "An error occurred while deleting the UID.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof createUidFormSchema>) => {
    createUidMutation.mutate(data);
  };

  const currentCredits = parseFloat(user?.credits || "0");
  const remainingCredits = currentCredits - (selectedTier?.price || 0);

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
        <h1 className="text-3xl font-semibold mb-2">Create UID</h1>
        <p className="text-muted-foreground">Generate a new UID with custom duration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>UID Information</CardTitle>
              <CardDescription>Enter UID details and select duration</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="uidValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter 6-12 character UID"
                            className="font-mono"
                            data-testid="input-uid"
                          />
                        </FormControl>
                        <FormDescription>
                          Must be 6-12 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Duration</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {pricingTiers.map((tier) => (
                        <button
                          key={tier.duration}
                          type="button"
                          onClick={() => {
                            setSelectedDuration(tier.duration);
                            form.setValue("duration", tier.duration);
                          }}
                          className={`relative p-4 rounded-md border-2 transition-all hover-elevate active-elevate-2 ${
                            selectedDuration === tier.duration
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          data-testid={`duration-${tier.duration}`}
                        >
                          {tier.popular && (
                            <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs">
                              Popular
                            </Badge>
                          )}
                          <div className="text-center">
                            <p className="text-sm font-medium">{tier.days}</p>
                            <p className="text-xs text-muted-foreground mt-1">{tier.hours}</p>
                            <p className="text-lg font-semibold mt-2 text-primary">
                              ${tier.price.toFixed(2)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={createUidMutation.isPending || remainingCredits < 0}
                    data-testid="button-create-uid"
                  >
                    {createUidMutation.isPending ? (
                      "Creating..."
                    ) : remainingCredits < 0 ? (
                      "Insufficient Credits"
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Create UID - ${selectedTier?.price.toFixed(2)}
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
              <CardTitle>Summary</CardTitle>
              <CardDescription>Creation details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{selectedTier?.days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hours</span>
                  <span className="font-medium">{selectedTier?.hours}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-medium text-primary">${selectedTier?.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Included Features
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span>Instant activation</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span>Automatic expiration</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
                    <span>Activity logging</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Available Credits</p>
                  <p className="text-2xl font-semibold">${currentCredits.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    After purchase: ${Math.max(0, remainingCredits).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My UIDs</CardTitle>
          <CardDescription>Manage your created UIDs</CardDescription>
        </CardHeader>
        <CardContent>
          {myUids.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No UIDs created yet</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first UID above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myUids.map((uid) => (
                <div
                  key={uid.id}
                  className="flex items-center justify-between p-4 rounded-md border hover-elevate"
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
                        <span>{uid.duration}h</span>
                      </div>
                      <div>
                        <span>Cost: ${parseFloat(uid.cost).toFixed(2)}</span>
                      </div>
                      <div>
                        <span>Expires: {formatDate(uid.expiresAt)}</span>
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        data-testid={`button-delete-${uid.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete UID</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete UID <span className="font-mono font-medium">{uid.uidValue}</span>?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteUidMutation.mutate(uid.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid={`confirm-delete-${uid.id}`}
                        >
                          {deleteUidMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
