import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trophy, TrendingUp, Award, Home } from "lucide-react";
import { motion } from "framer-motion";

export default function ExamResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [score, setScore] = useState(0);
  const [totalMarks, setTotalMarks] = useState(100);
  const [examTitle, setExamTitle] = useState("");
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const scoreParam = searchParams.get("score");
    const totalParam = searchParams.get("total");
    const titleParam = searchParams.get("title");
    
    if (scoreParam && totalParam) {
      const scoreValue = parseInt(scoreParam);
      const totalValue = parseInt(totalParam);
      setScore(scoreValue);
      setTotalMarks(totalValue);
      setExamTitle(titleParam || "Exam");
      
      // Pass threshold is 50%
      const percentage = (scoreValue / totalValue) * 100;
      setPassed(percentage >= 50);
    }
  }, [searchParams]);

  const percentage = Math.round((score / totalMarks) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              {passed ? (
                <div className="relative">
                  <Trophy className="h-24 w-24 text-yellow-500 mx-auto" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="h-32 w-32 border-4 border-yellow-500/30 rounded-full" />
                  </motion.div>
                </div>
              ) : (
                <XCircle className="h-24 w-24 text-destructive mx-auto" />
              )}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-destructive'}`}
            >
              {passed ? "Congratulations!" : "Keep Trying!"}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-lg"
            >
              {examTitle}
            </motion.p>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center gap-4 bg-secondary/50 px-8 py-6 rounded-2xl">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                  <p className="text-5xl font-bold text-primary">{score}</p>
                </div>
                <div className="text-4xl text-muted-foreground">/</div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Marks</p>
                  <p className="text-5xl font-bold text-muted-foreground">{totalMarks}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <Badge
                variant={passed ? "default" : "destructive"}
                className="text-2xl px-8 py-3"
              >
                {percentage}%
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Card className="bg-secondary/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    {passed ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-destructive" />
                    )}
                    <div>
                      <p className="font-semibold">Result</p>
                      <p className={`text-lg ${passed ? 'text-green-600' : 'text-destructive'}`}>
                        {passed ? "PASSED" : "FAILED"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Performance</p>
                      <p className="text-lg text-primary">
                        {percentage >= 80 ? "Excellent" : percentage >= 70 ? "Very Good" : percentage >= 60 ? "Good" : percentage >= 50 ? "Average" : "Needs Improvement"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {passed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Well Done!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You've successfully passed this exam. Keep up the great work!
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Don't Give Up!
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Study harder and you'll do better next time. Every challenge is an opportunity to grow!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="pt-4"
            >
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/student-dashboard")}
              >
                <Home className="h-5 w-5 mr-2" />
                Return to Dashboard
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
