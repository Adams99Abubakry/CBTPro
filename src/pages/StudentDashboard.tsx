import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Award, TrendingUp, LogOut, MessageSquare, Plus, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);
  const [examAttempts, setExamAttempts] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profile?.user_type !== "student") {
      toast.error("Access denied. Student privileges required.");
      navigate("/");
      return;
    }

    setUser(session.user);
    setProfile(profile);
    setIsLoading(false);

    // Fetch exams, attempts, and complaints
    await Promise.all([
      fetchExams(),
      fetchExamAttempts(session.user.id),
      fetchComplaints(session.user.id)
    ]);
  };

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("status", "published")
      .order("start_time", { ascending: true });

    if (!error && data) {
      setExams(data);
    }
  };

  const fetchExamAttempts = async (userId: string) => {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        exams (
          title,
          total_marks
        )
      `)
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setExamAttempts(data);
    }
  };

  const fetchComplaints = async (userId: string) => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        complaint_responses (
          *,
          profiles (
            first_name,
            last_name,
            user_type
          )
        )
      `)
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComplaints(data);
    }
  };


  const startExam = async (examId: string) => {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    // Check if exam is currently active
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);

    if (now < startTime) {
      toast.error("Exam hasn't started yet");
      return;
    }

    if (now > endTime) {
      toast.error("Exam has ended");
      return;
    }

    // Check if student already attempted this exam
    const existingAttempt = examAttempts.find(attempt => attempt.exam_id === examId);
    if (existingAttempt) {
      toast.error("You have already attempted this exam");
      return;
    }

    // Create new attempt
    const { data, error } = await supabase
      .from("exam_attempts")
      .insert({
        exam_id: examId,
        student_id: user.id,
        total_marks: exam.total_marks
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to start exam");
    } else {
      toast.success("Exam started successfully");
      navigate(`/exam/${examId}/attempt/${data.id}`);
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
          <h1 className="text-2xl font-bold text-primary">Student Dashboard</h1>
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
                  <p className="text-sm text-muted-foreground">Available Exams</p>
                  <p className="text-2xl font-bold">{exams.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Exams Completed</p>
                  <p className="text-2xl font-bold">{examAttempts.filter(a => a.status === 'submitted' || a.status === 'graded').length}</p>
                </div>
                <Award className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {examAttempts.length > 0 
                      ? Math.round(examAttempts.reduce((acc, attempt) => acc + (attempt.score || 0), 0) / examAttempts.length) + '%'
                      : '0%'
                    }
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Complaints</p>
                  <p className="text-2xl font-bold">{complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Available Exams</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {exams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No exams available</p>
              ) : (
                exams.map((exam) => {
                  const now = new Date();
                  const startTime = new Date(exam.start_time);
                  const endTime = new Date(exam.end_time);
                  const hasAttempted = examAttempts.some(attempt => attempt.exam_id === exam.id);
                  
                  let status = 'Not Started';
                  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
                  
                  if (now < startTime) {
                    status = 'Upcoming';
                    variant = 'default';
                  } else if (now > endTime) {
                    status = 'Ended';
                    variant = 'destructive';
                  } else if (hasAttempted) {
                    status = 'Completed';
                    variant = 'secondary';
                  } else {
                    status = 'Available';
                    variant = 'default';
                  }

                  return (
                    <div key={exam.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{exam.title}</h3>
                        <Badge variant={variant}>{status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                        <span>Duration: {exam.duration_minutes} min</span>
                        <span>Total: {exam.total_marks} marks</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        <span>Start: {new Date(exam.start_time).toLocaleString()}</span>
                      </div>
                      {!hasAttempted && now >= startTime && now <= endTime && (
                        <Button size="sm" className="mt-2" onClick={() => startExam(exam.id)}>
                          Start Exam
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Exam Results</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {examAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No exam attempts yet</p>
              ) : (
                examAttempts.map((attempt) => (
                  <div key={attempt.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{attempt.exams?.title}</h3>
                      <Badge variant={attempt.status === 'graded' ? 'default' : 'secondary'}>
                        {attempt.status === 'graded' ? 'Graded' : attempt.status === 'submitted' ? 'Submitted' : 'In Progress'}
                      </Badge>
                    </div>
                    {attempt.score !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Score: {attempt.score}/{attempt.total_marks}
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round((attempt.score / attempt.total_marks) * 100)}%
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'Not submitted'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-xl font-semibold">My Complaints</h2>
              <Button size="sm" onClick={() => navigate("/student-complaint")}>
                <Plus className="h-4 w-4 mr-2" />
                New Complaint with AI
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {complaints.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No complaints submitted</p>
              ) : (
                complaints.map((complaint) => (
                  <div key={complaint.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{complaint.title}</h3>
                      <Badge variant={
                        complaint.status === 'resolved' ? 'default' : 
                        complaint.status === 'in_review' ? 'secondary' : 
                        'destructive'
                      }>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Priority: {complaint.priority}</span>
                      <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                    {complaint.complaint_responses && complaint.complaint_responses.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">Responses:</h4>
                        {complaint.complaint_responses.map((response: any) => (
                          <div key={response.id} className="bg-muted p-2 rounded text-sm mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">
                                {response.profiles?.first_name} {response.profiles?.last_name}
                                {response.is_admin_response && (
                                  <Badge variant="outline" className="ml-2 text-xs">Admin</Badge>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(response.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{response.response_text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/student-complaint")}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit New Complaint with AI
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Academic Records
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Check Exam Schedule
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertCircle className="h-4 w-4 mr-2" />
                Help & Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}