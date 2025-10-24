import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Disclaimer = () => {
  return (
    <Alert className="bg-muted border-border">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <strong>Informational Analysis Only:</strong> This platform provides estimated probabilities and statistical analysis for educational purposes. 
        Not betting advice. No guarantees. Outcomes are uncertain. Please gamble responsibly. 18+ or per local regulations. 
        Not available where prohibited.
      </AlertDescription>
    </Alert>
  );
};
