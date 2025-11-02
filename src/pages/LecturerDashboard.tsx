import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Users, FileCheck, Plus, LogOut, MessageSquare, Calendar, BarChart3, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CourseMaterialsUpload } from "@/components/CourseMaterialsUpload";
import { CourseMaterialsList } from "@/components/CourseMaterialsList";

export default function LecturerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalExams: 0,
    totalAttempts: 0,
    avgScore: 0,
    pendingComplaints: 0
  });

  useEffect(() => {
    const load = async (sessionUser: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", sessionUser.id)
        .single();

      if (profile?.user_type !== "lecturer") {
        toast.error("Access denied. Lecturer privileges required.");
        navigate("/"); // Do NOT sign out - keep session
        setIsLoading(false);
        return;
      }

      if (profile?.status === "pending") {
        toast.error("Your account is still pending approval. Please wait for admin approval.");
        navigate("/"); // Keep session
        setIsLoading(false);
        return;
      }

      setUser(sessionUser);
      setProfile(profile);
      await fetchDashboardData(sessionUser.id);
      setIsLoading(false);
    };

    // Listen for auth changes (no async directly in callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/login");
        return;
      }
      if (session?.user) {
        setTimeout(() => load(session.user), 0);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setTimeout(() => load(session.user), 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async (userId: string) => {
    // Fetch exams
    const { data: examsData } = await supabase
      .from("exams")
      .select(`
        *,
        exam_attempts (
          id,
          score,
          total_marks,
          status
        )
      `)
      .eq("lecturer_id", userId)
      .order("created_at", { ascending: false });

    if (examsData) {
      setExams(examsData);
      
      // Calculate stats
      const totalAttempts = examsData.reduce((sum, exam) => sum + (exam.exam_attempts?.length || 0), 0);
      const completedAttempts = examsData.flatMap(exam => 
        exam.exam_attempts?.filter((attempt: any) => attempt.status === 'submitted' && attempt.score !== null) || []
      );
      const avgScore = completedAttempts.length > 0 
        ? completedAttempts.reduce((sum: number, attempt: any) => sum + ((attempt.score / attempt.total_marks) * 100), 0) / completedAttempts.length
        : 0;

      // Fetch pending complaints count
      const { data: complaintsData } = await supabase
        .from("complaints")
        .select("id")
        .eq("status", "pending");

      setStats({
        totalExams: examsData.length,
        totalAttempts,
        avgScore: Math.round(avgScore),
        pendingComplaints: complaintsData?.length || 0
      });
    }
  };

  const publishExam = async (examId: string) => {
    const { error } = await supabase
      .from("exams")
      .update({ status: "published" })
      .eq("id", examId);

    if (error) {
      toast.error("Failed to publish exam");
    } else {
      toast.success("Exam published successfully");
      fetchDashboardData(user.id);
    }
  };

  const deleteExam = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", examId);

    if (error) {
      toast.error("Failed to delete exam");
    } else {
      toast.success("Exam deleted successfully");
      fetchDashboardData(user.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Lecturer Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.first_name} {profile?.last_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-2xl font-bold">{stats.totalExams}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                  <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{stats.avgScore}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Complaints</p>
                  <p className="text-2xl font-bold">{stats.pendingComplaints}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">My Exams</h2>
              <Button onClick={() => navigate("/exam-creator")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No exams created yet</p>
              ) : (
                <div className="space-y-4">
                  {exams.slice(0, 5).map((exam) => (
                    <div key={exam.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{exam.title}</h3>
                        <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                          {exam.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <span>Duration: {exam.duration_minutes} min</span>
                        <span>Attempts: {exam.exam_attempts?.length || 0}</span>
                      </div>
                      <div className="flex gap-2">
                        {exam.status === 'draft' && (
                          <Button size="sm" onClick={() => publishExam(exam.id)}>
                            Publish
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => navigate(`/exam-creator?examId=${exam.id}`)}>
                          {exam.status === 'published' ? 'View' : 'Edit'}
                        </Button>
                        {exam.status === 'published' && (
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/exam-submissions?examId=${exam.id}`)}>
                            View Submissions
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteExam(exam.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/exam-creator")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Exam
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/complaint-management")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Complaints
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/schedule-exam")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Exam
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate("/lecturer-analytics")}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <CourseMaterialsUpload />
          
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">My Uploaded Materials</h2>
            </CardHeader>
            <CardContent>
              <CourseMaterialsList canDelete={true} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}