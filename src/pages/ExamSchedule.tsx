import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ExamSchedule() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("status", "published")
      .order("start_time", { ascending: true });

    if (!error && data) {
      setExams(data);
    }
    setIsLoading(false);
  };

  const examsOnSelectedDate = exams.filter(exam => {
    if (!selectedDate) return false;
    const examDate = new Date(exam.start_time);
    return examDate.toDateString() === selectedDate.toDateString();
  });

  const examDates = exams.map(exam => new Date(exam.start_time));

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
          <h1 className="text-2xl font-bold text-primary">Exam Schedule</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <h2 className="text-xl font-semibold">Calendar</h2>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{ examDay: examDates }}
                modifiersClassNames={{ examDay: "bg-primary/20 font-bold" }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {selectedDate ? `Exams on ${selectedDate.toLocaleDateString()}` : "All Upcoming Exams"}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {examsOnSelectedDate.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No exams scheduled for this date
                </p>
              ) : (
                examsOnSelectedDate.map((exam) => {
                  const now = new Date();
                  const startTime = new Date(exam.start_time);
                  const endTime = new Date(exam.end_time);
                  
                  let status = 'Upcoming';
                  let variant: 'default' | 'secondary' | 'destructive' = 'default';
                  
                  if (now >= startTime && now <= endTime) {
                    status = 'Active';
                    variant = 'default';
                  } else if (now > endTime) {
                    status = 'Ended';
                    variant = 'destructive';
                  }

                  return (
                    <div key={exam.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">{exam.title}</h3>
                        </div>
                        <Badge variant={variant}>{status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Duration: {exam.duration_minutes} min</span>
                        </div>
                        <div>
                          <span className="font-medium">Total Marks:</span> {exam.total_marks}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Start:</span> {startTime.toLocaleString()}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">End:</span> {endTime.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">All Upcoming Exams</h2>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No exams scheduled</p>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{exam.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exam.start_time).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{exam.duration_minutes} min</Badge>
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
