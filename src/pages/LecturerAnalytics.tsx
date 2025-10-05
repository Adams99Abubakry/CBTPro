import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, BookOpen, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LecturerAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    totalExams: 0,
    totalStudents: 0,
    averageScore: 0,
    passRate: 0,
    examPerformance: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();

    // Real-time subscription
    const channel = supabase
      .channel('analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exam_attempts'
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalytics = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Fetch exams with attempts
    const { data: examsData } = await supabase
      .from("exams")
      .select(`
        *,
        exam_attempts (
          id,
          score,
          total_marks,
          status,
          student_id
        )
      `)
      .eq("lecturer_id", session.user.id);

    if (examsData) {
      const totalExams = examsData.length;
      const allAttempts = examsData.flatMap(exam => exam.exam_attempts || []);
      const completedAttempts = allAttempts.filter((attempt: any) => 
        attempt.status === 'submitted' && attempt.score !== null
      );

      // Get unique students
      const uniqueStudents = new Set(allAttempts.map((a: any) => a.student_id));
      
      // Calculate average score
      const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum: number, a: any) => 
            sum + ((a.score / a.total_marks) * 100), 0
          ) / completedAttempts.length
        : 0;

      // Calculate pass rate (assuming 50% is pass)
      const passedStudents = completedAttempts.filter((a: any) => 
        (a.score / a.total_marks) * 100 >= 50
      );
      const passRate = completedAttempts.length > 0
        ? (passedStudents.length / completedAttempts.length) * 100
        : 0;

      // Exam performance breakdown
      const examPerformance = examsData.map(exam => {
        const attempts = exam.exam_attempts || [];
        const completed = attempts.filter((a: any) => a.status === 'submitted' && a.score !== null);
        const avgExamScore = completed.length > 0
          ? completed.reduce((sum: number, a: any) => sum + ((a.score / a.total_marks) * 100), 0) / completed.length
          : 0;

        return {
          title: exam.title,
          attempts: attempts.length,
          avgScore: Math.round(avgExamScore)
        };
      });

      setAnalytics({
        totalExams,
        totalStudents: uniqueStudents.size,
        averageScore: Math.round(avgScore),
        passRate: Math.round(passRate),
        examPerformance
      });
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
          <h1 className="text-2xl font-bold text-primary">Analytics Dashboard</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Exams</p>
                  <p className="text-3xl font-bold">{analytics.totalExams}</p>
                </div>
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-3xl font-bold">{analytics.totalStudents}</p>
                </div>
                <Users className="h-10 w-10 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold">{analytics.averageScore}%</p>
                </div>
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold">{analytics.passRate}%</p>
                </div>
                <Award className="h-10 w-10 text-primary" />
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Exam Performance Breakdown</h2>
          </CardHeader>
          <CardContent>
            {analytics.examPerformance.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No exam data available</p>
            ) : (
              <div className="space-y-4">
                {analytics.examPerformance.map((exam, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{exam.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {exam.attempts} attempt{exam.attempts !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${exam.avgScore}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {exam.avgScore}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
