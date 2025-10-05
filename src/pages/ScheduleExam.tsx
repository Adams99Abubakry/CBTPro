import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ScheduleExam() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScheduledExams();

    // Real-time subscription
    const channel = supabase
      .channel('scheduled-exams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exams'
        },
        () => {
          fetchScheduledExams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchScheduledExams = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("exams")
      .select(`
        *,
        exam_attempts (
          id,
          student_id
        )
      `)
      .eq("lecturer_id", session.user.id)
      .order("start_time", { ascending: true });

    if (!error && data) {
      setExams(data);
    }
    setIsLoading(false);
  };

  const getExamStatus = (exam: any) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (now < start) return { label: "Upcoming", variant: "secondary" as const };
    if (now >= start && now <= end) return { label: "Ongoing", variant: "default" as const };
    return { label: "Completed", variant: "outline" as const };
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
          <h1 className="text-2xl font-bold text-primary">Exam Schedule</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">All Scheduled Exams</h2>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No exams scheduled yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Title</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => {
                    const status = getExamStatus(exam);
                    const attemptCount = exam.exam_attempts?.length || 0;

                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(exam.start_time).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(exam.end_time).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {exam.duration_minutes} min
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{attemptCount}</TableCell>
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
