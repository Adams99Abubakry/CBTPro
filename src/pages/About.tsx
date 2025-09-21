import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <Header />
      
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About CBT Platform</h1>
            <p className="text-xl text-muted-foreground">
              The future of computer-based testing and assessment
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Our Mission</h2>
              <p className="text-muted-foreground">
                We are dedicated to revolutionizing the way educational assessments are conducted 
                through innovative computer-based testing solutions. Our platform empowers educators 
                to create engaging, secure, and comprehensive examinations while providing students 
                with a modern testing experience.
              </p>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Our Vision</h2>
              <p className="text-muted-foreground">
                To become the leading platform for digital assessments, making quality education 
                accessible and measurable worldwide. We envision a future where testing is 
                efficient, fair, and adaptive to every learner's needs.
              </p>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-8 shadow-soft">
            <h2 className="text-2xl font-semibold mb-6">Why Choose Our Platform?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">✓</span>
                </div>
                <h3 className="font-semibold mb-2">Secure & Reliable</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced security measures ensure test integrity and data protection
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">⚡</span>
                </div>
                <h3 className="font-semibold mb-2">Fast & Efficient</h3>
                <p className="text-sm text-muted-foreground">
                  Streamlined interface for quick test creation and administration
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">📊</span>
                </div>
                <h3 className="font-semibold mb-2">Detailed Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive reporting and insights for better decision making
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}