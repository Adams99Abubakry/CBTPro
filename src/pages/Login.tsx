import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
    rememberMe: false
  });

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Defer DB calls to avoid deadlocks and then navigate by role
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type, status")
            .eq("user_id", session.user.id)
            .single();

          if (profile?.status !== 'active') {
            await supabase.auth.signOut();
            return;
          }

          if (profile?.user_type === "admin") {
            navigate("/admin-dashboard");
          } else if (profile?.user_type === "lecturer") {
            navigate("/lecturer-dashboard");
          } else if (profile?.user_type === "student") {
            navigate("/student-dashboard");
          } else {
            navigate("/");
          }
        }, 0);
      }
    });

    // THEN check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const userId = session.user.id;
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_type, status")
            .eq("user_id", userId)
            .single();

          if (profile?.status !== 'active') {
            await supabase.auth.signOut();
            return;
          }

          if (profile?.user_type === "admin") {
            navigate("/admin-dashboard");
          } else if (profile?.user_type === "lecturer") {
            navigate("/lecturer-dashboard");
          } else if (profile?.user_type === "student") {
            navigate("/student-dashboard");
          } else {
            navigate("/");
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Please fill in email and password");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast.error("Please verify your email address before signing in");
          navigate("/email-verification");
        } else if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Check user status and get actual role
        const { data: profile } = await supabase
          .from("profiles")
          .select("status, user_type")
          .eq("user_id", data.user.id)
          .single();

        if (!profile) {
          toast.error("User profile not found. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        // If role was selected, verify it matches (optional verification)
        if (formData.role && profile.user_type !== formData.role) {
          toast.error(`This account is registered as ${profile.user_type}, not ${formData.role}`);
          await supabase.auth.signOut();
          return;
        }

        if (profile.status === "pending") {
          toast.error("Your account is pending approval. Please wait for admin approval.");
          await supabase.auth.signOut();
          return;
        }

        if (profile.status === "suspended") {
          toast.error("Your account has been suspended. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        if (profile.status === "rejected") {
          toast.error("Your account application was rejected. Please contact support.");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Signed in successfully!");

        // Role-based redirection with delay to ensure state updates
        setTimeout(() => {
          if (profile.user_type === "admin") {
            navigate("/admin-dashboard");
          } else if (profile.user_type === "lecturer") {
            navigate("/lecturer-dashboard");
          } else if (profile.user_type === "student") {
            navigate("/student-dashboard");
          } else {
            navigate("/");
          }
        }, 100);
      }
    } catch (error) {
      toast.error("Sign in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <Header />
      
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md shadow-strong">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                <GraduationCap className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your CBT Platform account</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                className="transition-all focus:shadow-soft"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10 transition-all focus:shadow-soft"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Login As (Optional)</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect role or select manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Role selection is optional. The system will auto-detect your account type.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => handleInputChange("rememberMe", !!checked)}
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember me
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="space-y-4">
            <Button 
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full" 
              variant="hero" 
              size="lg"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Create Account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}