import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Features } from "@/components/Features";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/10">
      <Header />
      
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Platform Features</h1>
            <p className="text-xl text-muted-foreground">
              Discover everything our CBT platform has to offer
            </p>
          </div>
          
          <Features />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}