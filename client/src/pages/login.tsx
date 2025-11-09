import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { loginSchema, type LoginData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { GradientBackground } from "@/components/GradientBackground";
import { Lock, User, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      const result = await response.json();
      
      if (result && result.user) {
        login(result.user);
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.username}!`,
        });
        setLocation("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <GradientBackground />
      <ParticlesBackground />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
      </div>
      
      <Card className="w-full max-w-md relative glass border-2 shadow-2xl animate-scale-in hover:shadow-xl transition-all duration-300">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-lg blur opacity-20 animate-pulse-border" />
        
        <div className="relative">
          <CardHeader className="space-y-3 text-center pb-8">
            <div className="mx-auto mb-4 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-md opacity-50 animate-glow" />
              <img src="/logo.webp" alt="UID Management" className="w-24 h-24 mx-auto relative z-10 drop-shadow-2xl" />
            </div>
            <CardTitle className="text-4xl font-bold gradient-text">
              UID Management
            </CardTitle>
            <CardDescription className="text-base flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Next-Gen Control Panel
              <Sparkles className="w-4 h-4 text-accent" />
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                      <FormLabel className="text-sm font-semibold">Username</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            {...field}
                            placeholder="Enter your username"
                            className="pl-11 h-12 border-2 focus:border-primary transition-all duration-300"
                            disabled={isLoading}
                            data-testid="input-username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                      <FormLabel className="text-sm font-semibold">Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            className="pl-11 h-12 border-2 focus:border-primary transition-all duration-300"
                            disabled={isLoading}
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl animate-slide-in-up"
                  style={{ animationDelay: '0.3s' }}
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-border text-center text-xs text-muted-foreground animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p>Secure encrypted authentication</p>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
