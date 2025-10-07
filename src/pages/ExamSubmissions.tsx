import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ExamSubmissions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("examId");
  const [exam, setExam] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!examId) {
      navigate("/lecturer-dashboard");
      return;
    }
    fetchSubmissions();
  }, [examId]);

  const fetchSubmissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    try {
      // Fetch exam details
      const { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examData) {
        setExam(examData);
      }

      // Fetch submissions
      const { data: attemptsData, error: attemptsError } = await supabase
        .from("exam_attempts")
        .select("*")
        .eq("exam_id", examId)
        .in("status", ["submitted", "graded"])
        .order("submitted_at", { ascending: false });

      if (attemptsError) throw attemptsError;

      if (!attemptsData || attemptsData.length === 0) {
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      // Fetch student profiles separately
      const studentIds = [...new Set(attemptsData.map(a => a.student_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email")
        .in("user_id", studentIds);

      // Merge data client-side
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const combined = attemptsData.map(attempt => ({
        ...attempt,
        profiles: profilesMap[attempt.student_id]
      }));

      setSubmissions(combined);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch submissions");
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/lecturer-dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Exam Submissions</h1>
            {exam && <p className="text-sm text-muted-foreground">{exam.title}</p>}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Student Submissions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Total Submissions: {submissions.length}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => {
                    const percentage = Math.round((submission.score / submission.total_marks) * 100);
                    const passed = percentage >= 50;
                    
                    return (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.profiles?.first_name} {submission.profiles?.last_name}
                        </TableCell>
                        <TableCell>{submission.profiles?.email}</TableCell>
                        <TableCell>
                          {new Date(submission.submitted_at).toLocaleString()}
                        </TableCell>
                        <TableCell>{submission.score}/{submission.total_marks}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>
                          <Badge variant={passed ? "default" : "destructive"}>
                            {passed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
