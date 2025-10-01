import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StudentComplaint() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [requiresAdmin, setRequiresAdmin] = useState(false);

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "Click the 'Forgot Password' link on the login page. Enter your email address and follow the instructions sent to your inbox."
    },
    {
      question: "Why can't I access my exam?",
      answer: "Exams are only accessible during their scheduled time window. Check the exam start and end times. If the issue persists during the scheduled time, contact support."
    },
    {
      question: "My exam submission failed. What should I do?",
      answer: "Make sure to click 'Submit Exam' before the timer expires. If you experienced a technical issue, file a complaint immediately with details. Late submissions may not be accepted."
    },
    {
      question: "When will my exam results be available?",
      answer: "Results are typically available within 24-48 hours after exam completion. You'll receive a notification when results are published."
    },
    {
      question: "What browsers are supported?",
      answer: "We recommend using the latest versions of Chrome, Firefox, or Edge for the best experience. Safari may have compatibility issues."
    },
    {
      question: "How do I check my lecturer's approval status?",
      answer: "Lecturer accounts require admin approval. You'll receive an email notification once your account is approved or if additional information is needed."
    }
  ];

  const handleGetAIResponse = async () => {
    if (!title || !description) {
      toast.error("Please fill in both title and description");
      return;
    }

    setIsSubmitting(true);
    setAiResponse(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("complaint-ai-response", {
        body: {
          complaintTitle: title,
          complaintDescription: description
        }
      });

      if (error) throw error;

      if (data.requiresAdmin) {
        setAiResponse(data.response.replace("ADMIN_REQUIRED:", "").trim());
        setRequiresAdmin(true);
      } else {
        setAiResponse(data.response);
        setRequiresAdmin(false);
      }
    } catch (error: any) {
      console.error("AI response error:", error);
      toast.error("Failed to get AI response. Please submit your complaint directly.");
      setRequiresAdmin(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to submit a complaint");
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("complaints")
        .insert({
          student_id: session.user.id,
          title,
          description,
          priority,
          status: "pending"
        });

      if (error) throw error;

      toast.success("Complaint submitted successfully! An admin will review it soon.");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAiResponse(null);
      setRequiresAdmin(false);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/student-dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary">File a Complaint</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Submit Your Complaint</h2>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Try AI assistance first - it might resolve your issue instantly!
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of your issue"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your complaint"
                    rows={6}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleGetAIResponse}
                    disabled={isSubmitting || !title || !description}
                    variant="outline"
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Getting AI Response..." : "Try AI Assistant"}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title || !description}
                    className="flex-1"
                  >
                    Submit to Admin
                  </Button>
                </div>

                {aiResponse && (
                  <Alert className={requiresAdmin ? "border-orange-500" : "border-green-500"}>
                    <div className="flex items-start gap-3">
                      {requiresAdmin ? (
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <div className="flex-1">
                        <AlertTitle className="mb-2">
                          {requiresAdmin ? "Admin Attention Required" : "AI Response"}
                        </AlertTitle>
                        <AlertDescription className="text-sm">{aiResponse}</AlertDescription>
                        {requiresAdmin && (
                          <div className="mt-3">
                            <Badge variant="outline" className="bg-orange-50">
                              This issue needs admin review
                            </Badge>
                          </div>
                        )}
                        {!requiresAdmin && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground">
                              If this doesn't solve your issue, you can still submit to admin.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-sm">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
