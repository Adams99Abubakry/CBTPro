import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

interface QualificationFormProps {
  onSubmit: (qualifications: QualificationData) => void;
  isLoading?: boolean;
}

export interface QualificationData {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: number;
  experienceYears: number;
  additionalQualifications: string;
}

export function QualificationForm({ onSubmit, isLoading }: QualificationFormProps) {
  const [formData, setFormData] = useState<QualificationData>({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    graduationYear: new Date().getFullYear(),
    experienceYears: 0,
    additionalQualifications: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof QualificationData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-strong">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Lecturer Qualification Form</h2>
        <p className="text-muted-foreground">
          Please provide your educational background and experience
        </p>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution/University *</Label>
            <Input
              id="institution"
              value={formData.institution}
              onChange={(e) => handleInputChange("institution", e.target.value)}
              placeholder="University of Example"
              required
              className="transition-all focus:shadow-soft"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Highest Degree *</Label>
              <Select 
                value={formData.degree} 
                onValueChange={(value) => handleInputChange("degree", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
                  <SelectItem value="master">Master's Degree</SelectItem>
                  <SelectItem value="phd">PhD/Doctorate</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year *</Label>
              <Select 
                value={formData.graduationYear.toString()} 
                onValueChange={(value) => handleInputChange("graduationYear", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fieldOfStudy">Field of Study *</Label>
            <Input
              id="fieldOfStudy"
              value={formData.fieldOfStudy}
              onChange={(e) => handleInputChange("fieldOfStudy", e.target.value)}
              placeholder="Computer Science, Mathematics, etc."
              required
              className="transition-all focus:shadow-soft"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experienceYears">Years of Teaching Experience</Label>
            <Input
              id="experienceYears"
              type="number"
              min="0"
              max="50"
              value={formData.experienceYears}
              onChange={(e) => handleInputChange("experienceYears", parseInt(e.target.value) || 0)}
              placeholder="0"
              className="transition-all focus:shadow-soft"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="additionalQualifications">Additional Qualifications</Label>
            <Textarea
              id="additionalQualifications"
              value={formData.additionalQualifications}
              onChange={(e) => handleInputChange("additionalQualifications", e.target.value)}
              placeholder="Certifications, publications, awards, etc."
              className="min-h-[100px] transition-all focus:shadow-soft"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            variant="hero" 
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Qualifications"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}