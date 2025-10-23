/**
 * AAMAPS Risk and Assurance Calculation Utilities
 * Client-side functions for calculating inherent risk, assurance coverage, and residual risk
 */

export type RiskLevel = "Low" | "Medium" | "High";
export type CoverageLevel = "Comprehensive" | "Moderate" | "Limited";

export interface RiskWeight {
  factor_name: string;
  weight: number;
}

export interface RiskFactors {
  [key: string]: RiskLevel;
}

export interface AssuranceCoverage {
  coverage_level: CoverageLevel;
  provider_type: string;
}

/**
 * 1️⃣ Calculate Inherent Risk Score
 * Excel logic: =IF(M8="Low",0.5*$M$5,IF(M8="Medium",1.5*$M$5,2.5*$M$5))+...
 * 
 * @param factors - Object mapping factor names to risk levels (Low/Medium/High)
 * @param weights - Array of weight objects with factor_name and weight properties
 * @returns Calculated inherent risk score rounded to 2 decimal places
 */
export function calculateInherentRisk(
  factors: RiskFactors,
  weights: RiskWeight[]
): number {
  const multiplierMap: Record<RiskLevel, number> = {
    Low: 0.5,
    Medium: 1.5,
    High: 2.5,
  };

  let score = 0;

  for (const key in factors) {
    const factorLevel = factors[key];
    const multiplier = multiplierMap[factorLevel] || 0;
    const weight = weights.find((w) => w.factor_name === key)?.weight || 0;
    score += multiplier * weight;
  }

  return parseFloat(score.toFixed(2));
}

/**
 * 2️⃣ Calculate Assurance Coverage Score
 * Excel logic: =IF(Y8="Comprehensive",95%*$Y$5,IF(Y8="Moderate",50%*$Y$5,0%*$Y$5))+...
 * 
 * @param coverages - Array of coverage objects with coverage_level and provider_type
 * @param weights - Array of weight objects with factor_name and weight properties
 * @returns Total assurance coverage score rounded to 2 decimal places
 */
export function calculateAssuranceCoverage(
  coverages: AssuranceCoverage[],
  weights: RiskWeight[]
): number {
  const multiplierMap: Record<CoverageLevel, number> = {
    Comprehensive: 0.95,
    Moderate: 0.5,
    Limited: 0,
  };

  let totalScore = 0;

  for (const coverage of coverages) {
    const multiplier = multiplierMap[coverage.coverage_level] || 0;
    const weight =
      weights.find((w) => w.factor_name === coverage.provider_type + "_Assurance")?.weight || 0;
    totalScore += multiplier * weight;
  }

  return parseFloat(totalScore.toFixed(2));
}

/**
 * 3️⃣ Calculate Residual Risk
 * Formula: (IA weight × IA risk value) + (ERM weight × ERM risk value)
 * 
 * @param iaRisk - Internal Audit residual risk level (Low/Medium/High)
 * @param ermRisk - ERM residual risk level (Low/Medium/High)
 * @param weights - Array of weight objects with factor_name and weight properties
 * @returns Object with combined score and risk level
 */
export function calculateResidualRisk(
  iaRisk: RiskLevel,
  ermRisk: RiskLevel,
  weights: RiskWeight[]
): { score: number; level: RiskLevel } {
  const valueMap: Record<RiskLevel, number> = {
    Low: 1,
    Medium: 3,
    High: 5,
  };

  const iaValue = valueMap[iaRisk] || 0;
  const ermValue = valueMap[ermRisk] || 0;

  const iaWeight =
    weights.find((w) => w.factor_name === "InternalAudit_ResidualWeight")?.weight || 0.8;
  const ermWeight =
    weights.find((w) => w.factor_name === "ERM_ResidualWeight")?.weight || 0.2;

  const combined = iaWeight * iaValue + ermWeight * ermValue;

  let level: RiskLevel = "Low";
  if (combined >= 3.6) level = "High";
  else if (combined >= 2.1) level = "Medium";

  return {
    score: parseFloat(combined.toFixed(2)),
    level,
  };
}
