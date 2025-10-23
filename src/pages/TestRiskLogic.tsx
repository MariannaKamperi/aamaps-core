import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { runRiskLogicTests } from "@/utils/riskCalculations";
import { useState } from "react";

const TestRiskLogic = () => {
  const [results, setResults] = useState<any>(null);

  const handleRunTests = () => {
    const testResults = runRiskLogicTests();
    setResults(testResults);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Test Risk Logic</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Risk Calculation Tests</CardTitle>
          <CardDescription>
            Test the three core risk calculation functions with sample data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleRunTests}>Run Tests</Button>
          
          {results && (
            <div className="mt-6 space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Inherent Risk Score</h3>
                <p className="text-2xl font-bold text-primary">{results.inherent_risk}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Assurance Coverage Score</h3>
                <p className="text-2xl font-bold text-primary">{results.assurance_coverage}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Residual Risk</h3>
                <p className="text-2xl font-bold text-primary">
                  {results.residual_risk_score} ({results.residual_risk_level})
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestRiskLogic;
