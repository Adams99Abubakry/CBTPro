import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, MessageSquare, Mail, Phone } from "lucide-react";

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/student-dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">Help & Support</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-semibold">Contact Support</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/student-complaint")}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit a Complaint with AI Assistance
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>support@examportal.edu</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>+1 (555) 123-4567</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I start an exam?</AccordionTrigger>
                <AccordionContent>
                  Navigate to your dashboard and click on "Available Exams". You'll see all published exams. 
                  Click "Start Exam" on any active exam to begin. Make sure the exam is within its scheduled time window.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>What if I lose my internet connection during an exam?</AccordionTrigger>
                <AccordionContent>
                  Your progress is automatically saved. If you lose connection, simply refresh the page and log back in. 
                  Your answers will be preserved, but the timer will continue running.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How can I view my exam results?</AccordionTrigger>
                <AccordionContent>
                  After submitting an exam, you'll be redirected to a results page. You can also view all your exam 
                  results on your dashboard under "Exam Results" or in the "Academic Records" section.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Can I retake an exam?</AccordionTrigger>
                <AccordionContent>
                  Currently, the system allows only one attempt per exam. If you believe you need a retake due to 
                  technical issues, please submit a complaint through our AI-assisted complaint system.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>How do I submit a complaint?</AccordionTrigger>
                <AccordionContent>
                  Click on "Submit New Complaint with AI" from your dashboard or this page. Our AI assistant will 
                  help you draft a clear and effective complaint. You'll receive responses from lecturers or administrators 
                  directly in your complaints section.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>What is the passing score for exams?</AccordionTrigger>
                <AccordionContent>
                  The passing score is typically 50% or higher. However, individual exams may have different passing 
                  criteria set by the lecturer. Check the exam details for specific requirements.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>How can I check the exam schedule?</AccordionTrigger>
                <AccordionContent>
                  Visit the "Exam Schedule" page from your dashboard. You'll see a calendar view with all upcoming 
                  exams highlighted. Click on any date to see exams scheduled for that day.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
