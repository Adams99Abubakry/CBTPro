import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ExamInterface() {
  const { examId, attemptId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (examId && attemptId) {
      fetchExamData();
    }
  }, [examId, attemptId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const fetchExamData = async () => {
    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (examError) throw examError;

      // Check if exam is still active
      const now = new Date();
      const endTime = new Date(examData.end_time);
      
      if (now > endTime) {
        toast.error("This exam has ended");
        navigate("/student-dashboard");
        return;
      }

      setExam(examData);

      // Calculate time left
      const remainingTime = Math.floor((endTime.getTime() - now.getTime()) / 1000);
      const examDuration = examData.duration_minutes * 60;
      setTimeLeft(Math.min(remainingTime, examDuration));

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_id", examId)
        .order("question_order");

      if (questionsError) throw questionsError;
      setQuestions(questionsData);

      // Fetch existing answers if any
      const { data: existingAnswers } = await supabase
        .from("exam_answers")
        .select("*")
        .eq("attempt_id", attemptId);

      if (existingAnswers) {
        const answerMap: Record<string, string> = {};
        existingAnswers.forEach(answer => {
          answerMap[answer.question_id] = answer.selected_answer;
        });
        setAnswers(answerMap);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching exam data:", error);
      toast.error("Failed to load exam");
      navigate("/student-dashboard");
    }
  };

  const saveAnswer = async (questionId: string, selectedAnswer: string) => {
    try {
      const { error } = await supabase
        .from("exam_answers")
        .upsert({
          attempt_id: attemptId,
          question_id: questionId,
          selected_answer: selectedAnswer
        });

      if (error) throw error;

      setAnswers(prev => ({
        ...prev,
        [questionId]: selectedAnswer
      }));
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error("Failed to save answer");
    }
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Calculate score
      let correctAnswers = 0;
      let totalMarks = 0;

      for (const question of questions) {
        totalMarks += question.marks;
        const userAnswer = answers[question.id];
        if (userAnswer === question.correct_answer) {
          correctAnswers += question.marks;
        }

        // Update answer with correctness
        await supabase
          .from("exam_answers")
          .upsert({
            attempt_id: attemptId,
            question_id: question.id,
            selected_answer: userAnswer || null,
            is_correct: userAnswer === question.correct_answer
          });
      }

      // Update attempt with score
      const { error: updateError } = await supabase
        .from("exam_attempts")
        .update({
          submitted_at: new Date().toISOString(),
          score: correctAnswers,
          status: 'graded'
        })
        .eq("id", attemptId);

      if (updateError) throw updateError;

      toast.success(`Exam submitted! Your score: ${correctAnswers}/${totalMarks}`);
      navigate("/student-dashboard");
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Exam Not Found</h1>
          <p className="text-muted-foreground mb-4">The exam you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/student-dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">{exam.title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={timeLeft < 300 ? "text-destructive font-bold" : ""}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button variant="destructive" onClick={submitExam} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                Answered: {answeredQuestions}/{questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">
                  Question {currentQuestionIndex + 1}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? 'mark' : 'marks'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-6">{currentQuestion.question_text}</p>

              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => saveAnswer(currentQuestion.id, value)}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="option-a" />
                  <Label htmlFor="option-a" className="flex-1 cursor-pointer">
                    A. {currentQuestion.option_a}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="option-b" />
                  <Label htmlFor="option-b" className="flex-1 cursor-pointer">
                    B. {currentQuestion.option_b}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="C" id="option-c" />
                  <Label htmlFor="option-c" className="flex-1 cursor-pointer">
                    C. {currentQuestion.option_c}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="option-d" />
                  <Label htmlFor="option-d" className="flex-1 cursor-pointer">
                    D. {currentQuestion.option_d}
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <Button
                  key={index}
                  variant={
                    index === currentQuestionIndex
                      ? "default"
                      : answers[questions[index].id]
                      ? "secondary"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className="w-10 h-10"
                >
                  {answers[questions[index].id] && index !== currentQuestionIndex && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {!answers[questions[index].id] && (
                    <span>{index + 1}</span>
                  )}
                  {index === currentQuestionIndex && (
                    <span>{index + 1}</span>
                  )}
                </Button>
              ))}
            </div>

            <Button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}