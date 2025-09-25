import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SecuritySettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    passwordPolicy: true,
    sessionTimeout: true,
    emailVerification: true,
    auditLogging: true
  });

  const [securityStatus] = useState([
    { item: "SSL/TLS Encryption", status: "enabled", level: "high" },
    { item: "Row Level Security", status: "enabled", level: "high" },
    { item: "Email Verification", status: "enabled", level: "medium" },
    { item: "Password Strength", status: "enabled", level: "medium" },
    { item: "Audit Logging", status: "enabled", level: "low" }
  ]);

  useEffect(() => {
    checkAuth();
    // In a real app, you'd fetch actual security settings from the backend
    setIsLoading(false);
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.user_type !== "admin") {
      toast.error("Access denied. Admin privileges required.");
      navigate("/admin-dashboard");
      return;
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    toast.success(`${setting} ${value ? 'enabled' : 'disabled'} successfully`);
  };

  const getStatusBadge = (status: string, level: string) => {
    const variants: any = {
      enabled: level === "high" ? "default" : level === "medium" ? "secondary" : "outline",
      disabled: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getStatusIcon = (status: string, level: string) => {
    if (status === "enabled") {
      return level === "high" ? 
        <CheckCircle className="h-4 w-4 text-green-600" /> : 
        <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">Security Settings</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Security Status</h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityStatus.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status, item.level)}
                      <span className="font-medium">{item.item}</span>
                    </div>
                    {getStatusBadge(item.status, item.level)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Security Configuration</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <p className="text-sm text-muted-foreground">
                    Enforce strong password requirements
                  </p>
                </div>
                <Switch
                  id="password-policy"
                  checked={settings.passwordPolicy}
                  onCheckedChange={(checked) => handleSettingChange('passwordPolicy', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-logout after inactivity
                  </p>
                </div>
                <Switch
                  id="session-timeout"
                  checked={settings.sessionTimeout}
                  onCheckedChange={(checked) => handleSettingChange('sessionTimeout', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-verification">Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  id="email-verification"
                  checked={settings.emailVerification}
                  onCheckedChange={(checked) => handleSettingChange('emailVerification', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="audit-logging">Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Log all administrative actions
                  </p>
                </div>
                <Switch
                  id="audit-logging"
                  checked={settings.auditLogging}
                  onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Security Recommendations</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Enable two-factor authentication for all admin accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Regularly review user permissions and access levels</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Monitor login patterns for suspicious activity</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Keep all system components updated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}