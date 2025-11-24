// Type definitions for ITR Calculator

// Calculator Types
export interface CalculatorConfig {
  base_itr_per_100_workers: number;
  position_group_percentages: Record<string, number>;
  metadata: {
    source: string;
    projects_count: number;
    data_period: string;
  };
}

export interface CalculatorResult {
  project_name: string;
  workers_count: number;
  total_itr_recommended: number;
  itr_per_100_workers: number;
  position_breakdown: PositionBreakdown[];
  justification: string;
}

export interface PositionBreakdown {
  position_group: string;
  recommended_count: number;
  percentage: number;
  calculation_details: string;
}

// Company Standards Types
export interface CompanyStandards {
  total_projects: number;
  total_itr: number;
  total_workers: number;
  average_itr_per_100_workers: number;
  median_itr_per_100_workers: number;
  min_itr_per_100_workers: number;
  max_itr_per_100_workers: number;
  position_groups_stats: PositionGroupStat[];
  scale_distribution: ScaleDistribution;
}

export interface PositionGroupStat {
  position_group: string;
  total_count: number;
  percentage: number;
  avg_per_project: number;
}

export interface ScaleDistribution {
  Small: number;
  Medium: number;
  Large: number;
  'Very Large': number;
}

// Project Types
export interface Project {
  project: string;
  workers_count: number;
  itr_count: number;
  itr_per_100_workers: number;
  workers_fte: number;
  scale: 'Small' | 'Medium' | 'Large' | 'Very Large';
  position_distribution?: Record<string, number>;
}

// Position Types
export interface PositionDistribution {
  position_group: string;
  total_employees: number;
  percentage_of_total_itr: number;
  avg_per_project: number;
  present_in_projects: number;
}

export interface PositionGroupNorm {
  position_group: string;
  total_employees: number;
  percentage_of_total_itr: number;
  avg_per_project: number;
  present_in_projects: number;
}

// Scale-Based Standards Types
export interface ScaleBasedStandards {
  [scale: string]: {
    projects_count: number;
    avg_workers: number;
    avg_itr: number;
    avg_itr_per_100_workers: number;
    median_itr_per_100_workers: number;
  };
}

// ITR Data Types
export interface ITRRecord {
  project: string;
  position: string;
  position_group: string;
  month: string;
  hours: number;
  fte: number;
}

// Worker Data Types
export interface WorkerRecord {
  project: string;
  month: string;
  worker_count: number;
  hours: number;
  fte: number;
}

// Monthly Dynamics Types
export interface MonthlyDynamics {
  [project: string]: {
    months: string[];
    itr_counts: number[];
    worker_counts: number[];
    itr_per_100: number[];
  };
}

// Data Statistics Types
export interface DataStatistics {
  itr_data: {
    total_records: number;
    unique_projects: number;
    unique_positions: number;
    date_range: {
      start: string;
      end: string;
    };
  };
  workers_data: {
    total_records: number;
    unique_projects: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface BarChartDataPoint {
  name: string;
  value: number;
  label?: string;
}

export interface LineChartDataPoint {
  month: string;
  itr: number;
  workers: number;
  ratio: number;
}

// Filter Types
export interface ProjectFilters {
  scale?: string[];
  minWorkers?: number;
  maxWorkers?: number;
  minITR?: number;
  maxITR?: number;
  searchQuery?: string;
}

// Navigation Types
export type PageRoute =
  | 'calculator'
  | 'analytics'
  | 'projects'
  | 'standards'
  | 'dynamics'
  | 'labor';

// UI Component Types
export interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps {
  label?: string;
  type?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export interface SelectProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

// Store Types (Zustand)
export interface AppState {
  // Calculator state
  projectName: string;
  workersCount: number;
  calculatorResult: CalculatorResult | null;

  // Data state
  calculatorConfig: CalculatorConfig | null;
  companyStandards: CompanyStandards | null;
  projects: Project[];
  positionNorms: PositionGroupNorm[];

  // Filter state
  projectFilters: ProjectFilters;

  // UI state
  currentPage: PageRoute;
  sidebarCollapsed: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setProjectName: (name: string) => void;
  setWorkersCount: (count: number) => void;
  setCalculatorResult: (result: CalculatorResult | null) => void;
  setCalculatorConfig: (config: CalculatorConfig) => void;
  setCompanyStandards: (standards: CompanyStandards) => void;
  setProjects: (projects: Project[]) => void;
  setPositionNorms: (norms: PositionGroupNorm[]) => void;
  setProjectFilters: (filters: ProjectFilters) => void;
  setCurrentPage: (page: PageRoute) => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
