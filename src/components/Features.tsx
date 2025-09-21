import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BarChart3, 
  FileText, 
  Globe, 
  Smartphone, 
  Eye,
  Download,
  Shuffle,
  Timer
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Admin, Lecturer, and Student roles with specific permissions and capabilities",
    badge: "Core Feature"
  },
  {
    icon: Timer,
    title: "Advanced Timer System", 
    description: "Real-time countdown, auto-submit on timeout, and customizable exam duration",
    badge: "Essential"
  },
  {
    icon: Shuffle,
    title: "Question Randomization",
    description: "Randomize question order and shuffle answer choices for enhanced security",
    badge: "Anti-Cheat"
  },
  {
    icon: FileText,
    title: "Rich Media Support",
    description: "Images, audio, video, and mathematical formulas in questions",
    badge: "Advanced"
  },
  {
    icon: Eye,
    title: "Proctoring Features",
    description: "Full-screen mode, tab monitoring, and optional webcam surveillance",
    badge: "Security"
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Comprehensive performance analytics and exportable reports (CSV/PDF)",
    badge: "Insights"
  },
  {
    icon: Download,
    title: "Digital Certificates",
    description: "Automated certificate generation with QR codes for verification",
    badge: "Credentialing"
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Support for multiple languages with easy localization",
    badge: "Global"
  },
  {
    icon: Smartphone,
    title: "Responsive Design",
    description: "Optimized for desktop, tablet, and mobile devices",
    badge: "Accessibility"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-muted/50 to-background">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Testing Solution
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, manage, and deliver secure online examinations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-medium transition-all duration-300 hover:scale-105 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {feature.badge}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};