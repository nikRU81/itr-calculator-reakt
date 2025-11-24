import { create } from 'zustand';
import type { AppState } from '../types';

export const useStore = create<AppState>((set) => ({
  // Calculator state
  projectName: '',
  workersCount: 0,
  calculatorResult: null,

  // Data state
  calculatorConfig: null,
  companyStandards: null,
  projects: [],
  positionNorms: [],

  // Filter state
  projectFilters: {},

  // UI state
  currentPage: 'calculator',
  sidebarCollapsed: true,
  loading: false,
  error: null,

  // Actions
  setProjectName: (name: string) => set({ projectName: name }),
  setWorkersCount: (count: number) => set({ workersCount: count }),
  setCalculatorResult: (result) => set({ calculatorResult: result }),
  setCalculatorConfig: (config) => set({ calculatorConfig: config }),
  setCompanyStandards: (standards) => set({ companyStandards: standards }),
  setProjects: (projects) => set({ projects }),
  setPositionNorms: (norms) => set({ positionNorms: norms }),
  setProjectFilters: (filters) => set({ projectFilters: filters }),
  setCurrentPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
