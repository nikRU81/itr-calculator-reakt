import { useStore } from './store/useStore';
import Layout from './components/layout/Layout';
import CalculatorPage from './pages/calculator/CalculatorPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import StandardsPage from './pages/standards/StandardsPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import LaborPage from './pages/labor/LaborPage';
import type { PageRoute } from './types';

const pageConfig: Record<
  PageRoute,
  { title: string; subtitle: string; component: React.ComponentType }
> = {
  calculator: {
    title: 'Калькулятор численности ИТР',
    subtitle: 'Рассчитайте рекомендуемую численность инженерно-технических работников для вашего проекта',
    component: CalculatorPage,
  },
  analytics: {
    title: 'Аналитика проектов',
    subtitle: 'Анализ проектов по численности ИТР и рабочих',
    component: AnalyticsPage,
  },
  projects: {
    title: 'Динамика по проектам',
    subtitle: 'Изменение численности по месяцам',
    component: ProjectsPage,
  },
  dynamics: {
    title: 'Динамика по проектам',
    subtitle: 'Изменение численности по месяцам',
    component: ProjectsPage,
  },
  labor: {
    title: 'Соотношение ИТР',
    subtitle: 'Анализ соотношения ИТР к рабочим',
    component: LaborPage,
  },
  standards: {
    title: 'Нормативы компании',
    subtitle: 'Стандарты численности и распределение по должностям',
    component: StandardsPage,
  },
};

function App() {
  const { currentPage, setCurrentPage, sidebarCollapsed, toggleSidebar } = useStore();

  const config = pageConfig[currentPage];
  const PageComponent = config.component;

  return (
    <Layout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      title={config.title}
      subtitle={config.subtitle}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={toggleSidebar}
    >
      <PageComponent />
    </Layout>
  );
}

export default App;
