import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Eye, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  question_order: number;
}

export default function ExamCreator() {
  const navigate = useNavigate();
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    start_time: "",
    end_time: "",
    total_marks: 0
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "A",
      marks: 1,
      question_order: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
    updateTotalMarks([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
    
    if (field === 'marks') {
      updateTotalMarks(updatedQuestions);
    }
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    updateTotalMarks(updatedQuestions);
  };

  const updateTotalMarks = (questionList: Question[]) => {
    const total = questionList.reduce((sum, q) => sum + (q.marks || 0), 0);
    setExamData(prev => ({ ...prev, total_marks: total }));
  };

  const saveExam = async (status: 'draft' | 'published') => {
    if (!examData.title || !examData.start_time || !examData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      // Create the exam
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .insert({
          ...examData,
          lecturer_id: session.user.id,
          status
        })
        .select()
        .single();

      if (examError) {
        toast.error("Failed to create exam");
        return;
      }

      // Create questions
      const questionsToInsert = questions.map(q => ({
        exam_id: exam.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        marks: q.marks,
        question_order: q.question_order
      }));

      const { error: questionsError } = await supabase
        .from("exam_questions")
        .insert(questionsToInsert);

      if (questionsError) {
        toast.error("Failed to save questions");
        return;
      }

      toast.success(`Exam ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
      navigate("/lecturer-dashboard");
    } catch (error) {
      toast.error("Failed to save exam");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/lecturer-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">Create New Exam</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => saveExam('draft')}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => saveExam('published')}
              disabled={isLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish Exam
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Exam Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  value={examData.title}
                  onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter exam title"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={examData.duration_minutes}
                  onChange={(e) => setExamData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                  placeholder="60"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={examData.description}
                onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter exam description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={examData.start_time}
                  onChange={(e) => setExamData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={examData.end_time}
                  onChange={(e) => setExamData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary">Total Marks: {examData.total_marks}</Badge>
              <Badge variant="secondary">Questions: {questions.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-semibold">Questions</h2>
            <Button onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No questions added yet. Click "Add Question" to start.
              </p>
            ) : (
              questions.map((question, index) => (
                <Card key={question.id} className="relative">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <h3 className="text-lg font-medium">Question {index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <div>
                        <Label htmlFor={`marks-${index}`} className="text-sm">Marks:</Label>
                        <Input
                          id={`marks-${index}`}
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`question-${index}`}>Question Text *</Label>
                      <Textarea
                        id={`question-${index}`}
                        value={question.question_text}
                        onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                        placeholder="Enter your question here..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`optionA-${index}`}>Option A *</Label>
                        <Input
                          id={`optionA-${index}`}
                          value={question.option_a}
                          onChange={(e) => updateQuestion(index, 'option_a', e.target.value)}
                          placeholder="Option A"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`optionB-${index}`}>Option B *</Label>
                        <Input
                          id={`optionB-${index}`}
                          value={question.option_b}
                          onChange={(e) => updateQuestion(index, 'option_b', e.target.value)}
                          placeholder="Option B"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`optionC-${index}`}>Option C *</Label>
                        <Input
                          id={`optionC-${index}`}
                          value={question.option_c}
                          onChange={(e) => updateQuestion(index, 'option_c', e.target.value)}
                          placeholder="Option C"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`optionD-${index}`}>Option D *</Label>
                        <Input
                          id={`optionD-${index}`}
                          value={question.option_d}
                          onChange={(e) => updateQuestion(index, 'option_d', e.target.value)}
                          placeholder="Option D"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`correct-${index}`}>Correct Answer *</Label>
                      <Select 
                        value={question.correct_answer} 
                        onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Option A</SelectItem>
                          <SelectItem value="B">Option B</SelectItem>
                          <SelectItem value="C">Option C</SelectItem>
                          <SelectItem value="D">Option D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}