import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EmailVerification() {
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Get email from session or localStorage
    const getEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };
    getEmail();
  }, []);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("No email found. Please try registering again.");
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-verified`
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to resend email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <Header />
      
      <div className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md shadow-strong text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
                <Mail className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-muted-foreground">
              We've sent a verification link to your email address
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {email && (
              <p className="text-sm text-muted-foreground">
                Verification email sent to: <strong>{email}</strong>
              </p>
            )}
            
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">Check your inbox</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">Click the verification link</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm">Return to login</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or click below to resend.
            </p>
          </CardContent>
          
          <CardFooter className="space-y-4">
            <Button 
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline" 
              className="w-full"
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              Already verified?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}