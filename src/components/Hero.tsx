import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Clock, Shield, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Advanced Computer-Based Testing Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Empower educators and students with a comprehensive, secure, and intuitive testing solution. 
            Create, manage, and take exams with confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="hero" size="xl" asChild>
              <Link to="/register">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/demo">Watch Demo</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            <Card className="p-6 text-center hover:shadow-medium transition-shadow animate-scale-in">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Rich Question Types</h3>
              <p className="text-sm text-muted-foreground">Support for images, audio, video, and mathematical formulas</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-medium transition-shadow animate-scale-in">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Timed Exams</h3>
              <p className="text-sm text-muted-foreground">Real-time countdown with auto-submit and time management</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-medium transition-shadow animate-scale-in">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Anti-Cheating</h3>
              <p className="text-sm text-muted-foreground">Full-screen mode, tab monitoring, and webcam supervision</p>
            </Card>

            <Card className="p-6 text-center hover:shadow-medium transition-shadow animate-scale-in">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Instant Results</h3>
              <p className="text-sm text-muted-foreground">Immediate scoring with detailed analytics and certificates</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};