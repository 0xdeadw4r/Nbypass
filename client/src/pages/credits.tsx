import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Minus, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export default function Credits() {
  const { user, isOwner } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [operation, setOperation] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isOwner,
  });

  const updateCreditsMutation = useMutation({
    mutationFn: async (data: { userId: string; amount: number; operation: "add" | "deduct" }) => {
      return await apiRequest("PATCH", `/api/users/${data.userId}/credits`, {
        userId: data.userId,
        amount: data.amount,
        operation: data.operation,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const user = users.find(u => u.id === variables.userId);
      toast({
        title: `Credits ${variables.operation === "add" ? "Added" : "Deducted"}`,
        description: `${variables.operation === "add" ? "Added" : "Deducted"} $${variables.amount.toFixed(2)} ${variables.operation === "add" ? "to" : "from"} ${user?.username}`,
      });
      setIsDialogOpen(false);
      setSelectedUser("");
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Credits",
        description: error.message || "An error occurred while updating credits.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const user = users.find(u => u.id === selectedUser);
    if (!user || !amount) return;

    updateCreditsMutation.mutate({
      userId: selectedUser,
      amount: parseFloat(amount),
      operation,
    });
  };

  const getCreditsBadge = (credits: string) => {
    const amount = parseFloat(credits);
    if (amount > 100) return "bg-chart-2 text-white";
    if (amount > 50) return "bg-chart-3 text-white";
    return "bg-destructive text-white";
  };

  const getCreditStatus = (credits: string) => {
    const amount = parseFloat(credits);
    if (amount > 100) return "High";
    if (amount > 50) return "Medium";
    return "Low";
  };

  if (!isOwner) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Credits</h1>
          <p className="text-muted-foreground">View your available credit balance</p>
        </div>

        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <Badge className="bg-chart-2 text-white">
                Active
              </Badge>
            </div>
            <CardTitle className="text-lg mt-4">{user?.username}</CardTitle>
            <CardDescription>Your account balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
                <p className="text-4xl font-bold text-primary">${user ? parseFloat(user.credits).toFixed(2) : '0.00'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Contact the admin to add more credits to your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Credit Management</h1>
          <p className="text-muted-foreground">Add or deduct credits for users</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-manage-credits">
              <DollarSign className="w-4 h-4 mr-2" />
              Manage Credits
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User Credits</DialogTitle>
              <DialogDescription>
                Add or deduct credits from a user account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user-select">Select User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user-select" data-testid="select-user">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} (${parseFloat(user.credits).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation-select">Operation</Label>
                <Select value={operation} onValueChange={(val) => setOperation(val as "add" | "deduct")}>
                  <SelectTrigger id="operation-select" data-testid="select-operation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add Credits</SelectItem>
                    <SelectItem value="deduct">Deduct Credits</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateCreditsMutation.isPending}
                data-testid="button-submit-credits"
              >
                {updateCreditsMutation.isPending ? "Processing..." : `${operation === "add" ? "Add" : "Deduct"} Credits`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover-elevate" data-testid={`credit-card-${user.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Badge className={getCreditsBadge(user.credits)}>
                  {getCreditStatus(user.credits)}
                </Badge>
              </div>
              <CardTitle className="text-lg mt-4">{user.username}</CardTitle>
              <CardDescription className="font-mono text-xs">{user.id.substring(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available Credits</p>
                  <p className="text-3xl font-bold text-primary">${parseFloat(user.credits).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(user.id);
                      setOperation("add");
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-add-${user.id}`}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(user.id);
                      setOperation("deduct");
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-deduct-${user.id}`}
                  >
                    <Minus className="w-3 h-3 mr-1" />
                    Deduct
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
