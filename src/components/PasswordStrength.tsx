import { useMemo } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = useMemo(() => {
    return [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "Contains uppercase letter", valid: /[A-Z]/.test(password) },
      { label: "Contains lowercase letter", valid: /[a-z]/.test(password) },
      { label: "Contains number", valid: /\d/.test(password) },
      { label: "Contains special character", valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
    ];
  }, [password]);

  const strength = checks.filter(check => check.valid).length;
  const strengthLabel = strength === 0 ? "" : 
                       strength <= 2 ? "Weak" :
                       strength <= 3 ? "Fair" :
                       strength <= 4 ? "Good" : "Strong";

  const strengthColor = strength === 0 ? "" :
                       strength <= 2 ? "text-destructive" :
                       strength <= 3 ? "text-yellow-600" :
                       strength <= 4 ? "text-blue-600" : "text-primary";

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength:</span>
        <span className={`text-sm font-medium ${strengthColor}`}>
          {strengthLabel}
        </span>
      </div>
      
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            strength <= 2 ? "bg-destructive" :
            strength <= 3 ? "bg-yellow-500" :
            strength <= 4 ? "bg-blue-500" : "bg-primary"
          }`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            {check.valid ? (
              <CheckCircle className="h-3 w-3 text-primary" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={check.valid ? "text-primary" : "text-muted-foreground"}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}