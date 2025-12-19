/**
 * AAMAPS Risk and Assurance Calculation Utilities
 * Client-side functions for calculating inherent risk, assurance coverage, and residual risk
 */

export type RiskLevel = "Low" | "Medium" | "High";
export type CoverageLevel = "Comprehensive" | "Moderate" | "Limited";

// Convert Low / Medium / High → numeric weights
export const getRiskLevelScore = (level: string): number => {
  switch (level) {
    case 'Low': return 0.5;
    case 'Medium': return 1.5;
    case 'High': return 2.5;
    default: return 1;
  }
};

// Default weights for risk factors
const DEFAULT_WEIGHTS = {
  financial_impact: 0.15,
  legal_compliance_impact: 0.15,
  strategic_significance: 0.2,
  technological_cyber_impact: 0.15,
  new_process_system: 0.1,
  stakeholder_impact: 0.1,
  c_level_concerns: 0.15,
};

// Calculate Inherent Risk Score
export const calculateInherentRisk = (risk: any, weights: any = {}): number => {
  const w = { ...DEFAULT_WEIGHTS, ...weights };
  
  const calc = (field: string) => getRiskLevelScore(risk[field]) * (w as any)[field];
  
  return (
    calc('financial_impact') +
    calc('legal_compliance_impact') +
    calc('strategic_significance') +
    calc('technological_cyber_impact') +
    calc('new_process_system') +
    calc('stakeholder_impact') +
    calc('c_level_concerns')
  );
};

// Convert Assurance Coverage → haircut ratio
export const getCoverageScore = (level: string): number => {
  switch (level) {
    case 'Comprehensive': return 0.95;
    case 'Moderate': return 0.5;
    case 'Limited': return 0.15;
    default: return 0.0;
  }
};

// Residual Risk calculation: Inherent Risk * (1 - haircut)
export const calculateResidualRisk = (inherentRisk: number, haircutRatio: number): number => {
  return inherentRisk * (1 - haircutRatio);
};

// Combined Residual Risk = 80% IA + 20% ERM
export const calculateCombinedResidualRisk = (iaResidual: number, ermResidual: number): number => {
  return (0.8 * iaResidual) + (0.2 * ermResidual);
};

// Get risk level from numeric score
export const getRiskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 1.8) return 'High';
  if (score >= 1.0) return 'Medium';
  return 'Low';
};

// Legacy interfaces for backwards compatibility
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

// ✅ TEST FUNCTION to manually verify risk logic
export function runRiskLogicTests() {
  const testFactors = {
    financial_impact: "High",
    legal_compliance_impact: "Medium",
    strategic_significance: "High",
    technological_cyber_impact: "Medium",
    new_process_system: "Low",
    stakeholder_impact: "High",
    c_level_concerns: "High",
  };

  const inherent = calculateInherentRisk(testFactors);
  const haircutRatio = getCoverageScore('Moderate');
  const iaResidual = calculateResidualRisk(inherent, haircutRatio);
  const combinedResidual = calculateCombinedResidualRisk(iaResidual, 1.5); // Medium ERM

  return {
    inherent_risk: inherent,
    assurance_haircut: haircutRatio,
    ia_residual_risk: iaResidual,
    combined_residual_risk: combinedResidual,
    residual_risk_level: getRiskLevelFromScore(combinedResidual),
  };
}
