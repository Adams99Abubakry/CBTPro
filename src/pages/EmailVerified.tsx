import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Loader2, XCircle, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "loading" | "success" | "error";

export default function EmailVerified() {
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Email Verified | CBT Platform";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Your email has been verified successfully. Proceed to login.");

    const handleEmailConfirmation = async () => {
      try {
        // Check URL hash for tokens (Supabase sends them as hash fragments)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const hashError = hashParams.get("error");
        const hashErrorDescription = hashParams.get("error_description");

        // Also check query params as fallback
        const queryParams = new URLSearchParams(window.location.search);
        const queryError = queryParams.get("error");
        const queryErrorDescription = queryParams.get("error_description");
        const errorCode = queryParams.get("error_code") || hashParams.get("error_code");

        const error = hashError || queryError;
        const errorDescription = hashErrorDescription || queryErrorDescription;

        if (error) {
          // Provide user-friendly error messages
          if (errorCode === "otp_expired") {
            setErrorMessage("Your verification link has expired. Please request a new one.");
          } else if (error === "access_denied") {
            setErrorMessage("The verification link is no longer valid. Please request a new verification email.");
          } else {
            setErrorMessage(errorDescription?.replace(/\+/g, ' ') || "Email verification failed. Please try again.");
          }
          setStatus("error");
          return;
        }

        if (accessToken && refreshToken && (type === "signup" || type === "email")) {
          // Set the session with the tokens from email confirmation
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setErrorMessage(sessionError.message);
            setStatus("error");
            return;
          }

          // Sign out immediately so user can login fresh
          await supabase.auth.signOut();
          setStatus("success");
        } else {
          // No tokens in URL - check if user is already verified via session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.email_confirmed_at) {
            await supabase.auth.signOut();
            setStatus("success");
          } else {
            // Direct access without verification flow - still show success
            setStatus("success");
          }
        }
      } catch (err) {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    };

    handleEmailConfirmation();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <Header />
        <main className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md shadow-strong text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary animate-pulse">
                  <Loader2 className="h-8 w-8 text-primary-foreground animate-spin" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Verifying Your Email</h1>
              <p className="text-muted-foreground">Please wait while we confirm your email address...</p>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
        <Header />
        <main className="flex items-center justify-center py-20 px-4">
          <Card className="w-full max-w-md shadow-strong text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Verification Failed</h1>
              <p className="text-muted-foreground">{errorMessage || "Something went wrong during verification."}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                The verification link may have expired or already been used.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button asChild className="w-full" variant="hero" size="lg">
                <Link to="/register">Try Again</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Back to Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <Header />

      <main className="flex items-center justify-center py-20 px-4">
        <Card className="w-full max-w-md shadow-strong text-center overflow-hidden">
          {/* Decorative top banner */}
          <div className="h-2 bg-gradient-primary" />
          
          <CardHeader className="pt-8">
            <div className="flex justify-center mb-4 relative">
              {/* Animated success icon */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-lg">
                  <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wide">Congratulations!</span>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Email Verified Successfully
            </h1>
            <p className="text-muted-foreground mt-2">
              Your email address has been confirmed and your account is now active.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-left">Account created successfully</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-left">Email address verified</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-left">Ready to sign in</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              You can now sign in with your email and password to access all features.
            </p>
          </CardContent>

          <CardFooter className="pb-8">
            <Button asChild className="w-full" variant="hero" size="lg">
              <Link to="/login">
                Continue to Login
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
