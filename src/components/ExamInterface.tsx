import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Monitor,
  AlertTriangle
} from "lucide-react";

// Mock exam data
const mockQuestions = [
  {
    id: 1,
    question: "What is the primary purpose of object-oriented programming?",
    options: [
      "To make code run faster",
      "To organize code into reusable and maintainable structures",
      "To reduce memory usage",
      "To eliminate all bugs"
    ],
    marked: false
  },
  {
    id: 2,
    question: "Which of the following best describes inheritance in OOP?",
    options: [
      "Creating new objects from existing ones",
      "Hiding implementation details",
      "Allowing a class to inherit properties and methods from another class",
      "Preventing unauthorized access to data"
    ],
    marked: true
  },
  {
    id: 3,
    question: "What is polymorphism in object-oriented programming?",
    options: [
      "The ability to have multiple constructors",
      "The ability of different objects to respond to the same interface",
      "The process of creating new classes",
      "The technique of data hiding"
    ],
    marked: false
  }
];

export const ExamInterface = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-submit exam when time runs out
          alert("Time's up! Exam submitted automatically.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerVariant = () => {
    if (timeLeft < 300) return "destructive"; // Last 5 minutes
    if (timeLeft < 900) return "warning"; // Last 15 minutes
    return "timer";
  };

  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const toggleMark = () => {
    // In real implementation, this would update the question's marked status
    console.log("Toggle mark for question", currentQuestion + 1);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Exam Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b mb-6">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">Object-Oriented Programming Exam</h1>
              <Badge variant="outline">Question {currentQuestion + 1} of {mockQuestions.length}</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant={getTimerVariant()} 
                size="sm"
                className="font-mono"
              >
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(timeLeft)}
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Monitor className="h-4 w-4 mr-2" />
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </Button>
            </div>
          </div>
          
          <Progress value={progress} className="mt-4" />
        </div>
      </div>

      {/* Warning Banner */}
      <div className="container mx-auto mb-6">
        <Card className="p-4 bg-warning/10 border-warning/20">
          <div className="flex items-center gap-2 text-warning-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Full-screen mode is enabled. Switching tabs will be detected.
            </span>
          </div>
        </Card>
      </div>

      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    Question {currentQuestion + 1}
                  </h2>
                  <Button
                    variant={mockQuestions[currentQuestion].marked ? "warning" : "outline"}
                    size="sm"
                    onClick={toggleMark}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    {mockQuestions[currentQuestion].marked ? "Marked" : "Mark for Review"}
                  </Button>
                </div>
                
                <p className="text-lg mb-6">
                  {mockQuestions[currentQuestion].question}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {mockQuestions[currentQuestion].options.map((option, index) => (
                  <Card 
                    key={index}
                    className={`p-4 cursor-pointer border-2 transition-all hover:shadow-soft ${
                      selectedAnswers[currentQuestion] === index 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        selectedAnswers[currentQuestion] === index 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {selectedAnswers[currentQuestion] === index && (
                          <div className="w-full h-full rounded-full bg-primary-foreground scale-50" />
                        )}
                      </div>
                      <span className="font-medium text-sm">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span>{option}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex gap-2">
                  {currentQuestion === mockQuestions.length - 1 ? (
                    <Button variant="success" size="lg">
                      Submit Exam
                    </Button>
                  ) : (
                    <Button 
                      variant="exam"
                      onClick={() => setCurrentQuestion(Math.min(mockQuestions.length - 1, currentQuestion + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Question Navigator</h3>
              <div className="grid grid-cols-3 gap-2">
                {mockQuestions.map((q, index) => (
                  <Button
                    key={q.id}
                    variant={
                      index === currentQuestion 
                        ? "default" 
                        : selectedAnswers[index] !== undefined 
                        ? "success" 
                        : q.marked 
                        ? "warning" 
                        : "outline"
                    }
                    size="sm"
                    className="h-10 w-10 p-0"
                    onClick={() => setCurrentQuestion(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              <div className="mt-6 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-warning rounded"></div>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-border rounded"></div>
                  <span>Not Answered</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};