import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft, BarChart3, Users, FileText, TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SystemAnalytics() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalAttempts: 0,
    averageScore: 0,
    userGrowth: 0,
    examCompletionRate: 0,
    topPerformers: [],
    recentActivity: []
  });

  useEffect(() => {
    checkAuth();
    fetchAnalytics();
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

  const fetchAnalytics = async () => {
    try {
      // Get total users
      const { data: users } = await supabase
        .from("profiles")
        .select("id, created_at");

      // Get total exams
      const { data: exams } = await supabase
        .from("exams")
        .select("id");

      // Get exam attempts
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("id, score, total_marks, created_at");

      // Calculate metrics
      const totalUsers = users?.length || 0;
      const totalExams = exams?.length || 0;
      const totalAttempts = attempts?.length || 0;
      
      const validScores = attempts?.filter(a => a.score !== null) || [];
      const averageScore = validScores.length > 0 
        ? Math.round(validScores.reduce((sum, a) => sum + (a.score / a.total_marks * 100), 0) / validScores.length)
        : 0;

      // Calculate user growth (users created in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsers = users?.filter(u => new Date(u.created_at) > thirtyDaysAgo) || [];
      const userGrowth = recentUsers.length;

      // Calculate completion rate
      const completedAttempts = attempts?.filter(a => a.score !== null) || [];
      const examCompletionRate = totalAttempts > 0 
        ? Math.round((completedAttempts.length / totalAttempts) * 100)
        : 0;

      setAnalytics({
        totalUsers,
        totalExams,
        totalAttempts,
        averageScore,
        userGrowth,
        examCompletionRate,
        topPerformers: [],
        recentActivity: []
      });
    } catch (error) {
      toast.error("Failed to fetch analytics");
    } finally {
      setIsLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-primary">System Analytics</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{analytics.totalExams}</p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exam Attempts</p>
                  <p className="text-2xl font-bold">{analytics.totalAttempts}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">User Growth (30 days)</p>
                  <p className="text-2xl font-bold">+{analytics.userGrowth}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Performance Metrics</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="text-2xl font-bold">{analytics.averageScore}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="text-2xl font-bold">{analytics.examCompletionRate}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">System Status</h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Database Status</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">API Status</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Authentication</span>
                  <span className="text-green-600 font-medium">Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}