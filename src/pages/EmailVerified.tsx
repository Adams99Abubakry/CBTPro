import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";

export default function EmailVerified() {
  useEffect(() => {
    // SEO: title and meta description
    document.title = "Email Verified | CBT Platform";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Congratulations! Your email has been verified successfully. Proceed to login.");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <Header />

      <main className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md shadow-strong text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
                <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Email Verified Successfully</h1>
            <p className="text-muted-foreground">Your email address has been confirmed.</p>
          </CardHeader>

          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You can now sign in with your email and password.
            </p>
          </CardContent>

          <CardFooter>
            <Button asChild className="w-full" variant="hero" size="lg">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
