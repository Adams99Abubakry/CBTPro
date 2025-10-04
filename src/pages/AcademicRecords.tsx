import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AcademicRecords() {
  const navigate = useNavigate();
  const [examAttempts, setExamAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAcademicRecords();
  }, []);

  const fetchAcademicRecords = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        exams (
          title,
          total_marks,
          description
        )
      `)
      .eq("student_id", session.user.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: false });

    if (!error && data) {
      setExamAttempts(data);
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/student-dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">Academic Records</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">Exam History</h2>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Records
            </Button>
          </CardHeader>
          <CardContent>
            {examAttempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No exam records found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examAttempts.map((attempt) => {
                    const percentage = Math.round((attempt.score / attempt.total_marks) * 100);
                    const passed = percentage >= 50;
                    
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium">{attempt.exams?.title}</TableCell>
                        <TableCell>{new Date(attempt.submitted_at).toLocaleDateString()}</TableCell>
                        <TableCell>{attempt.score}/{attempt.total_marks}</TableCell>
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
