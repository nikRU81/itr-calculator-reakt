import type {
  CompanyStandards,
  Project,
  PositionGroupNorm,
  PositionDistribution,
  ScaleBasedStandards,
  MonthlyDynamics,
} from '../types';

export async function loadCompanyStandards(): Promise<CompanyStandards> {
  const response = await fetch('/data/company_standards.json');
  if (!response.ok) {
    throw new Error('Failed to load company standards');
  }
  return response.json();
}

export async function loadProjects(): Promise<Project[]> {
  const response = await fetch('/data/projects_analysis.json');
  if (!response.ok) {
    throw new Error('Failed to load projects');
  }
  return response.json();
}

export async function loadPositionNorms(): Promise<PositionGroupNorm[]> {
  const response = await fetch('/data/position_group_norms.json');
  if (!response.ok) {
    throw new Error('Failed to load position norms');
  }
  return response.json();
}

export async function loadPositionDistribution(): Promise<PositionDistribution[]> {
  const response = await fetch('/data/position_distribution.json');
  if (!response.ok) {
    throw new Error('Failed to load position distribution');
  }
  return response.json();
}

export async function loadScaleBasedStandards(): Promise<ScaleBasedStandards> {
  const response = await fetch('/data/scale_based_standards.json');
  if (!response.ok) {
    throw new Error('Failed to load scale-based standards');
  }
  return response.json();
}

export async function loadMonthlyDynamics(): Promise<MonthlyDynamics> {
  const response = await fetch('/data/monthly_dynamics.json');
  if (!response.ok) {
    throw new Error('Failed to load monthly dynamics');
  }
  return response.json();
}
