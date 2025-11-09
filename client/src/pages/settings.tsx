import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Eye, EyeOff, Lock, Save, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Settings } from "@shared/schema";

const settingsFormSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  apiKey: z.string().min(10, "API key must be at least 10 characters").optional().or(z.literal("")),
});

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      baseUrl: "",
      apiKey: "",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        baseUrl: settings.baseUrl || "",
        apiKey: settings.apiKey || "",
      });
    }
  }, [settings, form]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsFormSchema>) => {
      return await apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Saved",
        description: "API configuration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Settings",
        description: error.message || "An error occurred while saving settings.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof settingsFormSchema>) => {
    updateSettingsMutation.mutate(data);
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    const first = key.substring(0, 4);
    const last = key.substring(key.length - 4);
    const masked = "*".repeat(key.length - 8);
    return `${first}${masked}${last}`;
  };

  const apiKeyValue = form.watch("apiKey");

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure API settings and system preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Manage base URL and API key for UID operations</CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Encrypted
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="https://api.example.com"
                          className="pl-10"
                          data-testid="input-base-url"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The base URL for UID API operations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter API key"
                          className="pl-10 pr-10 font-mono"
                          data-testid="input-api-key"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-toggle-api-key"
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your secure API key for authentication (stored encrypted)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Information</CardTitle>
          <CardDescription>System security status and best practices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-chart-2/10 border border-chart-2/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-chart-2">Strong Security Enabled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All API keys are encrypted at rest using industry-standard encryption. Passwords are hashed with bcrypt.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Security Best Practices:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Never share your API key with unauthorized users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Rotate API keys regularly for enhanced security</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Monitor activity logs for suspicious operations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>All sensitive data is transmitted over HTTPS</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
