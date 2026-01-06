import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Maximize, Eye, EyeOff, Shield, ShieldAlert, MonitorX, Copy, MousePointerClick, Keyboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
  
  // Anti-cheating states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalViolations, setTotalViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(true);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  
  // Important: some event listeners are registered once (useEffect([])), so we track the
  // live violation count via a ref to avoid stale-closure bugs (e.g. always showing 1/3).
  const violationCountRef = useRef(0);
  const submitExamRef = useRef<() => Promise<void>>(async () => {});
  const violationTimeoutRef = useRef<NodeJS.Timeout>();
  const MAX_VIOLATIONS = 3;

  useEffect(() => {
    if (examId && attemptId) {
      fetchExamData();
    }
  }, [examId, attemptId]);

  const startExam = async () => {
    if (!rulesAccepted) {
      toast.error("Please accept the exam rules to continue");
      return;
    }
    
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowRulesModal(false);
      setExamStarted(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast.error('Please allow fullscreen mode to start the exam');
    }
  };

  // Anti-cheating: Tab visibility detection (only after exam started)
  useEffect(() => {
    if (!examStarted) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting) {
        logViolation('tab_switch', 'User switched tabs or minimized window');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmitting, examStarted]);

  // Anti-cheating: Fullscreen monitoring (only after exam started)
  useEffect(() => {
    if (!examStarted) return;
    
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      
      if (!isNowFullscreen && !isSubmitting && exam) {
        logViolation('fullscreen_exit', 'User exited fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isSubmitting, exam, examStarted]);

  // Anti-cheating: Disable copy/paste and right-click (only after exam started)
  useEffect(() => {
    if (!examStarted) return;
    
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('copy_attempt', 'User attempted to copy content');
      toast.error('Copying is disabled during the exam');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('right_click', 'User attempted right-click');
      toast.error('Right-click is disabled during the exam');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts
      if (
        (e.ctrlKey || e.metaKey) && 
        ['c', 'v', 'x', 'a', 'p', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        logViolation('copy_attempt', `User attempted keyboard shortcut: ${e.key}`);
        toast.error('Keyboard shortcuts are disabled during the exam');
      }
      // Disable F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        logViolation('copy_attempt', 'User attempted to open DevTools');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('paste', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('paste', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted]);

  // Anti-cheating: Blur detection (window focus loss) - only after exam started
  useEffect(() => {
    if (!examStarted) return;
    
    const handleBlur = () => {
      if (!isSubmitting && exam) {
        logViolation('tab_switch', 'Window lost focus');
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isSubmitting, exam, examStarted]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            void submitExamRef.current();
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
        }, {
          onConflict: 'attempt_id,question_id'
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

      toast.success(`Exam submitted successfully!`);
      navigate(`/exam-results?score=${correctAnswers}&total=${totalMarks}&title=${encodeURIComponent(exam.title)}`);
    } catch (error) {
      console.error("Error submitting exam:", error);
      toast.error("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep a live reference for event listeners / timers that were registered earlier.
  submitExamRef.current = submitExam;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast.error('Please enable fullscreen mode to start the exam');
    }
  };

  const logViolation = async (type: string, details: string) => {
    const newTotal = violationCountRef.current + 1;
    violationCountRef.current = newTotal;
    setTotalViolations(newTotal);

    // Show warning banner for a short period
    setShowWarning(true);
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
    violationTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 5000);

    // Log to database
    try {
      await supabase.from("exam_violations").insert({
        attempt_id: attemptId,
        violation_type: type,
        violation_count: newTotal,
        details,
      });
    } catch (error) {
      console.error("Error logging violation:", error);
    }

    // Auto-submit if too many violations
    if (newTotal >= MAX_VIOLATIONS) {
      toast.error(
        `Maximum violations reached (${newTotal}/${MAX_VIOLATIONS}). Exam will be auto-submitted.`,
      );
      await submitExamRef.current();
    } else {
      toast.warning(
        `Violation detected: ${details}. (${newTotal}/${MAX_VIOLATIONS} warnings)`,
      );
    }
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
    <>
      {/* Anti-Cheating Rules Modal */}
      <Dialog open={showRulesModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-destructive/10">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Exam Rules & Anti-Cheating Policy</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Please read and accept these rules before starting your exam
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                This exam is monitored. The following actions are prohibited:
              </h3>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                  <MonitorX className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Exiting Fullscreen Mode</p>
                    <p className="text-sm text-muted-foreground">You must remain in fullscreen throughout the exam</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                  <Eye className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Switching Tabs or Windows</p>
                    <p className="text-sm text-muted-foreground">Do not navigate away from this page during the exam</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                  <Copy className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Copying, Pasting, or Cutting Text</p>
                    <p className="text-sm text-muted-foreground">All clipboard operations are disabled and monitored</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                  <MousePointerClick className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Right-Clicking</p>
                    <p className="text-sm text-muted-foreground">Context menu is disabled during the exam</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                  <Keyboard className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Using Keyboard Shortcuts</p>
                    <p className="text-sm text-muted-foreground">Ctrl/Cmd + C, V, X, A, P, S and F12 are blocked</p>
                  </div>
                </div>
              </div>
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> After {MAX_VIOLATIONS} violations, your exam will be automatically submitted with your current answers.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-start space-x-3 p-4 border rounded-lg bg-primary/5">
              <Checkbox 
                id="accept-rules" 
                checked={rulesAccepted}
                onCheckedChange={(checked) => setRulesAccepted(checked === true)}
              />
              <label 
                htmlFor="accept-rules" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                I have read and understood the exam rules. I agree to abide by the anti-cheating policy and understand that violations will be recorded and may result in automatic submission of my exam.
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/student-dashboard")}>
              Cancel & Return
            </Button>
            <Button 
              onClick={startExam} 
              disabled={!rulesAccepted}
              className="gap-2"
            >
              <Maximize className="h-4 w-4" />
              Accept & Start Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">{exam.title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              {isFullscreen ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-destructive" />}
              <span className="text-xs">{isFullscreen ? 'Monitored' : 'Not Fullscreen'}</span>
            </div>
            {totalViolations > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-orange-600 font-medium">
                  Warnings: {totalViolations}/{MAX_VIOLATIONS}
                </span>
              </div>
            )}
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

      {showWarning && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive" className="max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Violation Detected!</strong> This exam is being monitored. Avoid:
              • Switching tabs • Exiting fullscreen • Copying text • Right-clicking
              {totalViolations >= MAX_VIOLATIONS - 1 && (
                <span className="block mt-2 font-bold">⚠️ Next violation will auto-submit your exam!</span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!isFullscreen && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="max-w-4xl mx-auto bg-orange-50 border-orange-200">
            <Maximize className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Please enter fullscreen mode for exam integrity</span>
              <Button size="sm" onClick={requestFullscreen} variant="outline">
                Enter Fullscreen
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

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
    </>
  );
}