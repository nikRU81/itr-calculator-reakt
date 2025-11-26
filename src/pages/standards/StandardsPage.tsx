import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  PieChart as PieChartIcon,
  BookOpen,
  CheckCircle,
  HelpCircle,
  XCircle,
  Calculator,
  Database,
  Filter,
  BarChart3,
  AlertTriangle,
  FileText,
  Grid3X3,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { Tabs, TabsList, Tab, TabsContent } from '../../components/ui/Tabs';
import {
  loadCompanyStandards,
  loadPositionNorms,
  loadScaleBasedStandards,
} from '../../utils/dataLoader';
import type { CompanyStandards, PositionGroupNorm, ScaleBasedStandards } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

// Определение масштабов проекта
// Коэффициенты рассчитаны на основе ПОМЕСЯЧНОГО анализа 74 реальных проектов
// Данные: январь-октябрь 2025
const PROJECT_SCALES = [
  { code: 'S', name: 'Малый', workers: 'до 50', color: '#f59e0b', K_prorab: 22, K_master: 14, K_sklad: 32, scaleKey: 'Small' },
  { code: 'M', name: 'Средний', workers: '50–150', color: '#10b981', K_prorab: 78, K_master: 24, K_sklad: 73, scaleKey: 'Medium' },
  { code: 'L', name: 'Крупный', workers: '150–300', color: '#06b6d4', K_prorab: 169, K_master: 19, K_sklad: 81, scaleKey: 'Large' },
  { code: 'XL', name: 'Очень крупный', workers: '300+', color: '#4f46e5', K_prorab: 90, K_master: 24, K_sklad: 494, scaleKey: 'Very Large' },
];

// Классификация должностей
const POSITION_CLASSIFICATION = {
  mandatory: [
    { name: 'Руководитель проекта', formula: '1 на проект', description: 'Всегда 1, независимо от размера' },
    { name: 'Производитель работ', formula: 'ceil(Рабочие / K_прораб)', description: 'K зависит от масштаба' },
    { name: 'Мастер', formula: 'ceil(Рабочие / K_мастер)', description: 'K зависит от масштаба' },
    { name: 'Специалист по охране труда', formula: 'ceil(Рабочие / 50)', description: 'По законодательству РФ' },
    { name: 'Специалист по общим вопросам', formula: 'ceil(ИТР / 15)', description: 'Административная поддержка' },
    { name: 'Кладовщик / Специалист ОМТС', formula: 'ceil(Рабочие / K_склад)', description: 'K зависит от масштаба' },
  ],
  conditional: [
    { name: 'Водитель / Машинист / Механик', condition: 'Есть автотранспорт', formula: 'ceil(Техника / 3)' },
    { name: 'Инспектор строительных лесов', condition: 'Используются леса', formula: 'ceil(Площадь / 1000)' },
    { name: 'Специалист по сопровождению групп', condition: 'Иностранные рабочие', formula: 'ceil(Иностранцы / 100)' },
    { name: 'Сотрудник службы безопасности', condition: 'Требуется охрана', formula: 'Посты × (4 или 2)' },
    { name: 'Инженер-конструктор', condition: 'Проектные работы', formula: 'ceil(Рабочие / 100)' },
  ],
  excluded: [
    { name: 'Инструктор / Преподаватель', reason: 'Обучение — отдельный процесс, не относится к производственному ИТР' },
  ],
};

// Интерфейс для сводных нормативов по масштабам
interface PositionNormsByScale {
  position_group: string;
  scales: {
    [key: string]: {
      projects_count: number;
      K_median: number;
      K_weighted: number;
      K_avg: number;
      K_min: number;
      K_max: number;
      recommended_K: number;
    };
  };
}

// Интерфейсы для данных (с помесячной статистикой)
interface PositionDistributionRecord {
  project: string;
  position_group: string;
  count: number;
  count_avg_monthly?: number;
  count_median_monthly?: number;
  K_avg?: number | null;
  K_median?: number | null;
  project_scale?: string;
  avg_workers_monthly?: number;
}

interface ProjectAnalysisRecord {
  project: string;
  itr_count: number;
  itr_count_avg_monthly?: number;
  itr_count_median_monthly?: number;
  workers_count: number;
  workers_count_avg_monthly?: number;
  workers_count_median_monthly?: number;
  project_scale: string;
  itr_per_100_workers: number | null;
  months_active?: number;
}

// Объединённые данные проекта
interface ProjectWithPosition {
  project: string;
  workers_count: number;
  workers_count_monthly: number; // Помесячное среднее
  position_count: number;
  position_count_monthly: number; // Помесячное среднее
  project_scale: string;
  ratio: number | null; // рабочих на 1 специалиста (уникальных за период)
  K_monthly: number | null; // K по помесячным данным
}

// Интерфейс для детальных данных расчёта с выбросами
interface MonthlyCalculationDetails {
  generated_at: string;
  description: string;
  methodology: {
    outlier_method: string;
    outlier_formula: string;
    calculation: string;
  };
  positions: PositionDetail[];
}

interface PositionDetail {
  position_group: string;
  scales: {
    [key: string]: ScaleDetail;
  };
}

interface ScaleDetail {
  projects_count: number;
  outliers_count: number;
  statistics: {
    all_data: {
      median: number;
      mean: number;
      min: number;
      max: number;
      std_dev: number;
    };
    without_outliers: {
      median: number | null;
      mean: number | null;
      min: number | null;
      max: number | null;
    };
  };
  outlier_bounds: {
    q1: number | null;
    q3: number | null;
    iqr: number | null;
    lower_bound: number | null;
    upper_bound: number | null;
    outliers: number[];
  };
  projects: ProjectDetail[];
}

interface ProjectDetail {
  project: string;
  K_median: number;
  K_avg: number;
  avg_workers: number;
  months_with_data: number;
  is_outlier: boolean;
  outlier_type: 'low' | 'high' | null;
}

// Интерфейс для тепловой карты
interface MonthlyDynamicsRecord {
  project: string;
  month: string;
  workers_unique_count: number;
  itr_unique_count: number;
}

export default function StandardsPage() {
  const [companyStandards, setCompanyStandards] = useState<CompanyStandards | null>(null);
  const [positionNorms, setPositionNorms] = useState<PositionGroupNorm[]>([]);
  const [scaleStandards, setScaleStandards] = useState<ScaleBasedStandards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Данные для анализа
  const [positionDistribution, setPositionDistribution] = useState<PositionDistributionRecord[]>([]);
  const [projectsAnalysis, setProjectsAnalysis] = useState<ProjectAnalysisRecord[]>([]);
  const [positionNormsByScale, setPositionNormsByScale] = useState<PositionNormsByScale[]>([]);
  const [monthlyDetails, setMonthlyDetails] = useState<MonthlyCalculationDetails | null>(null);
  const [monthlyDynamics, setMonthlyDynamics] = useState<MonthlyDynamicsRecord[]>([]);

  // Фильтры для анализа
  const [selectedPosition, setSelectedPosition] = useState<string>('Мастер');
  const [selectedScale, setSelectedScale] = useState<string>('all');

  // Демо калькулятор
  const [demoWorkers, setDemoWorkers] = useState(100);
  const [demoScale, setDemoScale] = useState<'S' | 'M' | 'L' | 'XL'>('M');

  // Фильтры для детальной вкладки
  const [detailsPosition, setDetailsPosition] = useState<string>('Мастер');
  const [detailsScale, setDetailsScale] = useState<string>('Small');

  // Фильтр месяца для тепловой карты (по умолчанию последний месяц - Октябрь)
  const [heatmapMonth, setHeatmapMonth] = useState<string>('Октябрь');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [standards, norms, scaleData, posDistResp, projAnalResp, posNormsResp, monthlyDetailsResp, monthlyDynResp] = await Promise.all([
          loadCompanyStandards(),
          loadPositionNorms(),
          loadScaleBasedStandards(),
          fetch('/data/position_distribution.json').then(r => r.json()),
          fetch('/data/projects_analysis.json').then(r => r.json()),
          fetch('/data/position_norms_by_scale.json').then(r => r.json()),
          fetch('/data/monthly_calculation_details.json').then(r => r.json()),
          fetch('/data/monthly_dynamics.json').then(r => r.json()),
        ]);
        setCompanyStandards(standards);
        setPositionNorms(norms);
        setScaleStandards(scaleData);
        setPositionDistribution(posDistResp);
        setProjectsAnalysis(projAnalResp);
        setPositionNormsByScale(posNormsResp);
        setMonthlyDetails(monthlyDetailsResp);
        setMonthlyDynamics(monthlyDynResp.monthly_dynamics || []);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Список уникальных должностей
  const uniquePositions = useMemo(() => {
    const positions = new Set(positionDistribution.map(p => p.position_group));
    return Array.from(positions).sort();
  }, [positionDistribution]);

  // Объединённые данные для выбранной должности и масштаба
  const filteredProjectsWithPosition = useMemo(() => {
    if (!selectedPosition) return [];

    // Получаем проекты с выбранной должностью (уже с помесячными данными)
    const positionProjects = positionDistribution.filter(
      p => p.position_group === selectedPosition
    );

    // Объединяем с данными по проектам
    const result: ProjectWithPosition[] = [];

    for (const pp of positionProjects) {
      const projectData = projectsAnalysis.find(pa => pa.project === pp.project);
      if (projectData && projectData.workers_count > 0) {
        // Фильтруем по масштабу (используем масштаб из position_distribution или projects_analysis)
        const scale = pp.project_scale || projectData.project_scale;
        if (selectedScale !== 'all' && scale !== selectedScale) {
          continue;
        }

        // Помесячные данные (новые поля)
        const workersMonthly = pp.avg_workers_monthly || projectData.workers_count_avg_monthly || projectData.workers_count;
        const positionMonthly = pp.count_avg_monthly || pp.count;

        result.push({
          project: pp.project,
          workers_count: projectData.workers_count,
          workers_count_monthly: workersMonthly,
          position_count: pp.count,
          position_count_monthly: positionMonthly,
          project_scale: scale,
          ratio: pp.count > 0 ? projectData.workers_count / pp.count : null,
          K_monthly: pp.K_median || (positionMonthly > 0 ? workersMonthly / positionMonthly : null),
        });
      }
    }

    // Сортируем по помесячному среднему рабочих
    return result.sort((a, b) => a.workers_count_monthly - b.workers_count_monthly);
  }, [selectedPosition, selectedScale, positionDistribution, projectsAnalysis]);

  // Статистика по выбранной должности (с помесячными данными)
  const positionStats = useMemo(() => {
    const data = filteredProjectsWithPosition.filter(p => p.K_monthly !== null && p.K_monthly > 0);
    if (data.length === 0) return null;

    // K коэффициенты из помесячных данных
    const kValues = data.map(p => p.K_monthly as number);
    const totalWorkersMonthly = data.reduce((sum, p) => sum + p.workers_count_monthly, 0);
    const totalPositionsMonthly = data.reduce((sum, p) => sum + p.position_count_monthly, 0);

    // Средневзвешенное K (взвешенное по помесячному среднему рабочих)
    const weightedK = data.reduce((sum, p) => sum + (p.K_monthly || 0) * p.workers_count_monthly, 0) / totalWorkersMonthly;

    // Медиана K
    const sortedK = [...kValues].sort((a, b) => a - b);
    const medianK = sortedK.length % 2 === 0
      ? (sortedK[sortedK.length / 2 - 1] + sortedK[sortedK.length / 2]) / 2
      : sortedK[Math.floor(sortedK.length / 2)];

    // Простое среднее K
    const avgK = kValues.reduce((sum, k) => sum + k, 0) / kValues.length;

    // Также рассчитаем старый показатель (по уникальным за период) для сравнения
    const dataOld = filteredProjectsWithPosition.filter(p => p.ratio !== null && p.ratio > 0);
    const ratiosOld = dataOld.map(p => p.ratio as number);
    const sortedOld = [...ratiosOld].sort((a, b) => a - b);
    const medianOld = sortedOld.length > 0
      ? (sortedOld.length % 2 === 0
        ? (sortedOld[sortedOld.length / 2 - 1] + sortedOld[sortedOld.length / 2]) / 2
        : sortedOld[Math.floor(sortedOld.length / 2)])
      : 0;

    return {
      count: data.length,
      totalWorkersMonthly: Math.round(totalWorkersMonthly),
      totalPositionsMonthly: Math.round(totalPositionsMonthly * 10) / 10,
      weightedK: weightedK.toFixed(1),
      medianK: medianK.toFixed(1),
      avgK: avgK.toFixed(1),
      minK: Math.min(...kValues).toFixed(1),
      maxK: Math.max(...kValues).toFixed(1),
      recommendedK: Math.round(medianK), // Округляем медиану до целого
      // Старые показатели для сравнения
      medianOld: medianOld.toFixed(1),
    };
  }, [filteredProjectsWithPosition]);

  // Автоопределение масштаба по численности
  useEffect(() => {
    if (demoWorkers < 50) setDemoScale('S');
    else if (demoWorkers < 150) setDemoScale('M');
    else if (demoWorkers < 300) setDemoScale('L');
    else setDemoScale('XL');
  }, [demoWorkers]);

  // Расчёт демо
  const calculateDemo = () => {
    const scale = PROJECT_SCALES.find(s => s.code === demoScale)!;
    const results = {
      rukovoditel: 1,
      prorab: Math.ceil(demoWorkers / scale.K_prorab),
      master: Math.ceil(demoWorkers / scale.K_master),
      ot: Math.ceil(demoWorkers / 50),
      sklad: Math.ceil(demoWorkers / scale.K_sklad),
      admin: 0, // Рассчитаем после
    };
    const totalBeforeAdmin = results.rukovoditel + results.prorab + results.master + results.ot + results.sklad;
    results.admin = Math.ceil(totalBeforeAdmin / 15) || 1;
    return {
      ...results,
      total: totalBeforeAdmin + results.admin,
    };
  };

  const demoResults = calculateDemo();

  // Данные для тепловой карты (useMemo должен быть до early returns)
  const heatmapData = useMemo(() => {
    if (!monthlyDynamics.length) return { projects: [], maxWorkers: 0 };

    // Группируем по проектам
    const projectMap = new Map<string, Map<string, number>>();
    let maxWorkers = 0;

    monthlyDynamics.forEach(record => {
      if (!projectMap.has(record.project)) {
        projectMap.set(record.project, new Map());
      }
      const workers = record.workers_unique_count;
      projectMap.get(record.project)!.set(record.month, workers);
      if (workers > maxWorkers) maxWorkers = workers;
    });

    // Преобразуем в массив и сортируем по среднему количеству рабочих
    const projects = Array.from(projectMap.entries())
      .map(([project, months]) => {
        const values = Array.from(months.values()).filter(v => v > 0);
        const avgWorkers = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const totalWorkers = values.reduce((a, b) => a + b, 0);
        return {
          project,
          months: Object.fromEntries(months),
          avgWorkers,
          totalWorkers,
          activeMonths: values.length,
        };
      })
      .filter(p => p.totalWorkers > 0) // Убираем пустые проекты
      .sort((a, b) => b.avgWorkers - a.avgWorkers);

    return { projects, maxWorkers };
  }, [monthlyDynamics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-600 text-sm">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  if (error || !companyStandards || !scaleStandards) {
    return (
      <Card className="bg-red-50 border-red-200">
        <p className="text-red-600">{error || 'Не удалось загрузить данные'}</p>
      </Card>
    );
  }

  // Prepare data for charts
  const scaleDistributionData = Object.entries(companyStandards.scale_distribution).map(
    ([scale, count]) => ({
      name: scale === 'Small' ? 'Малый' : scale === 'Medium' ? 'Средний' : scale === 'Large' ? 'Большой' : 'Очень большой',
      value: count,
      scale: scale,
    })
  );

  const scaleStandardsData = Object.entries(scaleStandards).map(([scale, data]) => ({
    name: scale === 'Small' ? 'Малый' : scale === 'Medium' ? 'Средний' : scale === 'Large' ? 'Большой' : 'Очень большой',
    'Ср. ИТР': data.avg_itr,
    'ИТР/100': Number(data.avg_itr_per_100_workers.toFixed(2)),
  }));

  // Получить цвет масштаба
  const getScaleColor = (scaleKey: string) => {
    const scale = PROJECT_SCALES.find(s => s.scaleKey === scaleKey);
    return scale?.color || '#94a3b8';
  };

  // Порядок месяцев
  const MONTHS_ORDER = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь"];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs defaultTab="analysis">
        <TabsList>
          <Tab value="analysis" icon={<Database className="w-4 h-4" />}>
            Анализ данных
          </Tab>
          <Tab value="details" icon={<FileText className="w-4 h-4" />}>
            Детали расчёта
          </Tab>
          <Tab value="methodology" icon={<BookOpen className="w-4 h-4" />}>
            Методика
          </Tab>
          <Tab value="calculator" icon={<Calculator className="w-4 h-4" />}>
            Демо расчёт
          </Tab>
          <Tab value="positions" icon={<Table className="w-4 h-4" />}>
            Должности
          </Tab>
          <Tab value="heatmap" icon={<Grid3X3 className="w-4 h-4" />}>
            Тепловая карта
          </Tab>
          <Tab value="overview" icon={<PieChartIcon className="w-4 h-4" />}>
            Статистика
          </Tab>
        </TabsList>

        {/* NEW: Data Analysis Tab */}
        <TabsContent value="analysis">
          <div className="space-y-4">
            {/* Фильтры */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                Анализ нормативов по реальным данным
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Выбор должности */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Группа должностей
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {uniquePositions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* Выбор масштаба */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Масштаб проекта
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedScale('all')}
                      className={`px-3 py-2 rounded-lg border-2 transition-all ${
                        selectedScale === 'all'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      Все
                    </button>
                    {PROJECT_SCALES.map((scale) => (
                      <button
                        key={scale.code}
                        onClick={() => setSelectedScale(scale.scaleKey)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all ${
                          selectedScale === scale.scaleKey
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        style={{
                          borderColor: selectedScale === scale.scaleKey ? scale.color : undefined,
                          color: selectedScale === scale.scaleKey ? scale.color : undefined,
                        }}
                      >
                        {scale.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Статистика */}
            {positionStats && (
              <Card className="p-4 bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  Коэффициент K для "{selectedPosition}"
                  <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Помесячные данные
                  </span>
                  {selectedScale !== 'all' && (
                    <span
                      className="text-sm px-2 py-0.5 rounded-full text-white ml-2"
                      style={{ backgroundColor: getScaleColor(selectedScale) }}
                    >
                      {PROJECT_SCALES.find(s => s.scaleKey === selectedScale)?.name}
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-primary-600">{positionStats.count}</div>
                    <div className="text-xs text-slate-600">Проектов</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-600">{positionStats.totalWorkersMonthly}</div>
                    <div className="text-xs text-slate-600">Сумма ср.мес. рабочих</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{positionStats.totalPositionsMonthly}</div>
                    <div className="text-xs text-slate-600">Сумма ср.мес. должн.</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border-2 border-amber-400">
                    <div className="text-2xl font-bold text-amber-600">{positionStats.weightedK}</div>
                    <div className="text-xs text-slate-600">Средневзвеш. K</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center border-2 border-green-400">
                    <div className="text-2xl font-bold text-green-600">{positionStats.medianK}</div>
                    <div className="text-xs text-slate-600">Медиана K</div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Мин K:</span>{' '}
                      <span className="font-semibold">{positionStats.minK}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Макс K:</span>{' '}
                      <span className="font-semibold">{positionStats.maxK}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Ср. K:</span>{' '}
                      <span className="font-semibold">{positionStats.avgK}</span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-400">K по уникальным (старый):</span>{' '}
                      <span className="line-through">{positionStats.medianOld}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-primary-100 rounded-lg">
                    <span className="text-primary-800 font-semibold">
                      Рекомендуемый K = {positionStats.recommendedK}
                    </span>
                    <span className="text-primary-600 text-sm ml-2">
                      (1 специалист на {positionStats.recommendedK} рабочих)
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Таблица проектов */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Проекты с должностью "{selectedPosition}"
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({filteredProjectsWithPosition.length} проектов)
                </span>
              </h3>

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="table text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th>Проект</th>
                      <th className="text-center">Масштаб</th>
                      <th className="text-center">Ср.мес. рабочих</th>
                      <th className="text-center">Ср.мес. должн.</th>
                      <th className="text-center">K (помесячный)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjectsWithPosition.map((project, index) => (
                      <tr key={index}>
                        <td className="font-medium text-slate-900 max-w-[250px] truncate" title={project.project}>
                          {project.project}
                        </td>
                        <td className="text-center">
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: getScaleColor(project.project_scale) }}
                          >
                            {PROJECT_SCALES.find(s => s.scaleKey === project.project_scale)?.code || '?'}
                          </span>
                        </td>
                        <td className="text-center">{Math.round(project.workers_count_monthly)}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-green-100 text-green-700 rounded font-semibold">
                            {project.position_count_monthly.toFixed(1)}
                          </span>
                        </td>
                        <td className="text-center">
                          {project.K_monthly !== null ? (
                            <span className={`font-mono font-semibold ${
                              project.K_monthly < 15 ? 'text-red-600' :
                              project.K_monthly < 30 ? 'text-amber-600' :
                              'text-green-600'
                            }`}>
                              {project.K_monthly.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredProjectsWithPosition.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-slate-500 py-8">
                          Нет проектов с выбранной должностью для данного масштаба
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                <strong>K</strong> — количество рабочих на одного специалиста (по помесячным данным). Чем выше K, тем меньше специалистов нужно.
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab - Detailed calculation with outliers */}
        <TabsContent value="details">
          <div className="space-y-4">
            {/* Методология */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Методология выявления выбросов
              </h3>
              {monthlyDetails && (
                <div className="text-sm text-slate-700 space-y-1">
                  <p><strong>Метод:</strong> {monthlyDetails.methodology.outlier_method}</p>
                  <p><strong>Формула:</strong> {monthlyDetails.methodology.outlier_formula}</p>
                  <p><strong>Расчёт K:</strong> {monthlyDetails.methodology.calculation}</p>
                </div>
              )}
            </Card>

            {/* Фильтры */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                Выбор должности и масштаба
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Выбор должности */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Группа должностей
                  </label>
                  <select
                    value={detailsPosition}
                    onChange={(e) => setDetailsPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {monthlyDetails?.positions.map((pos) => (
                      <option key={pos.position_group} value={pos.position_group}>
                        {pos.position_group}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Выбор масштаба */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Масштаб проекта
                  </label>
                  <div className="flex gap-2">
                    {PROJECT_SCALES.map((scale) => {
                      const posData = monthlyDetails?.positions.find(p => p.position_group === detailsPosition);
                      const hasData = posData?.scales[scale.scaleKey];
                      return (
                        <button
                          key={scale.code}
                          onClick={() => hasData && setDetailsScale(scale.scaleKey)}
                          disabled={!hasData}
                          className={`px-3 py-2 rounded-lg border-2 transition-all ${
                            detailsScale === scale.scaleKey
                              ? 'border-primary-500 bg-primary-50'
                              : hasData
                              ? 'border-slate-200 hover:border-slate-300'
                              : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                          }`}
                          style={{
                            borderColor: detailsScale === scale.scaleKey ? scale.color : undefined,
                            color: detailsScale === scale.scaleKey ? scale.color : undefined,
                          }}
                        >
                          {scale.code}
                          {hasData && (
                            <span className="text-xs ml-1 text-slate-400">
                              ({posData?.scales[scale.scaleKey].projects_count})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Статистика и данные */}
            {(() => {
              const posData = monthlyDetails?.positions.find(p => p.position_group === detailsPosition);
              const scaleData = posData?.scales[detailsScale];
              if (!scaleData) {
                return (
                  <Card className="p-4 text-center text-slate-500">
                    Нет данных для выбранной комбинации должности и масштаба
                  </Card>
                );
              }

              const { statistics, outlier_bounds, projects } = scaleData;
              const outliersCount = projects.filter(p => p.is_outlier).length;

              return (
                <>
                  {/* Статистика */}
                  <Card className="p-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary-600" />
                      Статистика K для "{detailsPosition}"
                      <span
                        className="text-sm px-2 py-0.5 rounded-full text-white ml-2"
                        style={{ backgroundColor: getScaleColor(detailsScale) }}
                      >
                        {PROJECT_SCALES.find(s => s.scaleKey === detailsScale)?.name}
                      </span>
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Все данные */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-700 mb-3">Все данные ({scaleData.projects_count} проектов)</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-slate-500">Медиана</div>
                            <div className="font-bold text-lg">{statistics.all_data.median}</div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-slate-500">Среднее</div>
                            <div className="font-bold text-lg">{statistics.all_data.mean}</div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-slate-500">Мин / Макс</div>
                            <div className="font-bold">{statistics.all_data.min} — {statistics.all_data.max}</div>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <div className="text-xs text-slate-500">Ст. откл.</div>
                            <div className="font-bold">{statistics.all_data.std_dev}</div>
                          </div>
                        </div>
                      </div>

                      {/* Без выбросов */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-700 mb-3">
                          Без выбросов ({scaleData.projects_count - outliersCount} проектов)
                          {outliersCount > 0 && (
                            <span className="text-amber-600 text-xs ml-2">
                              -{outliersCount} выбросов
                            </span>
                          )}
                        </h4>
                        {statistics.without_outliers.median !== null ? (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-white p-2 rounded border-2 border-green-400">
                              <div className="text-xs text-slate-500">Медиана</div>
                              <div className="font-bold text-lg text-green-600">{statistics.without_outliers.median}</div>
                            </div>
                            <div className="bg-white p-2 rounded">
                              <div className="text-xs text-slate-500">Среднее</div>
                              <div className="font-bold text-lg">{statistics.without_outliers.mean}</div>
                            </div>
                            <div className="bg-white p-2 rounded col-span-2">
                              <div className="text-xs text-slate-500">Мин / Макс</div>
                              <div className="font-bold">{statistics.without_outliers.min} — {statistics.without_outliers.max}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-sm">Недостаточно данных для расчёта</div>
                        )}
                      </div>
                    </div>

                    {/* IQR границы */}
                    {outlier_bounds.q1 !== null && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                        <h4 className="font-semibold text-amber-700 mb-2">Границы IQR для выявления выбросов</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Q1:</span>{' '}
                            <span className="font-semibold">{outlier_bounds.q1}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Q3:</span>{' '}
                            <span className="font-semibold">{outlier_bounds.q3}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">IQR:</span>{' '}
                            <span className="font-semibold">{outlier_bounds.iqr}</span>
                          </div>
                          <div className="text-amber-700 font-semibold">
                            Допустимый диапазон: [{outlier_bounds.lower_bound} — {outlier_bounds.upper_bound}]
                          </div>
                        </div>
                        {outlier_bounds.outliers.length > 0 && (
                          <div className="mt-2 text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Выбросы: {outlier_bounds.outliers.map(o => o.toFixed(1)).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>

                  {/* Таблица проектов */}
                  <Card className="p-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                      Детальные данные по проектам
                      <span className="text-sm font-normal text-slate-500 ml-2">
                        ({projects.length} проектов, {outliersCount} выбросов)
                      </span>
                    </h3>

                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="table text-sm">
                        <thead className="sticky top-0 bg-white">
                          <tr>
                            <th>Проект</th>
                            <th className="text-center">Ср.мес. рабочих</th>
                            <th className="text-center">Месяцев данных</th>
                            <th className="text-center">K медиана</th>
                            <th className="text-center">K среднее</th>
                            <th className="text-center">Статус</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.map((project, index) => (
                            <tr
                              key={index}
                              className={project.is_outlier ? 'bg-red-50' : ''}
                            >
                              <td className="font-medium text-slate-900 max-w-[200px] truncate" title={project.project}>
                                {project.project}
                              </td>
                              <td className="text-center">{Math.round(project.avg_workers)}</td>
                              <td className="text-center">{project.months_with_data}</td>
                              <td className="text-center">
                                <span className={`font-mono font-semibold ${
                                  project.is_outlier ? 'text-red-600' : 'text-slate-900'
                                }`}>
                                  {project.K_median}
                                </span>
                              </td>
                              <td className="text-center font-mono text-slate-600">
                                {project.K_avg}
                              </td>
                              <td className="text-center">
                                {project.is_outlier ? (
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    project.outlier_type === 'low'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    <AlertTriangle className="w-3 h-3" />
                                    {project.outlier_type === 'low' ? 'Низкий' : 'Высокий'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    Норма
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-xs text-slate-500 space-y-1">
                      <p><strong>K медиана</strong> — медиана помесячных K коэффициентов для проекта</p>
                      <p><strong>Выброс</strong> — значение K за пределами допустимого диапазона IQR</p>
                      <p className="text-amber-600">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Выбросы не учитываются при расчёте рекомендуемых нормативов
                      </p>
                    </div>
                  </Card>
                </>
              );
            })()}
          </div>
        </TabsContent>

        {/* Methodology Tab */}
        <TabsContent value="methodology">
          <div className="space-y-4">
            {/* Классификация должностей */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Классификация должностей ИТР</h3>

              {/* Обязательные */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">Обязательные должности (6)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table text-sm">
                    <thead>
                      <tr className="bg-green-50">
                        <th>Должность</th>
                        <th>Формула</th>
                        <th>Комментарий</th>
                      </tr>
                    </thead>
                    <tbody>
                      {POSITION_CLASSIFICATION.mandatory.map((pos, i) => (
                        <tr key={i}>
                          <td className="font-medium">{pos.name}</td>
                          <td><code className="bg-slate-100 px-1 rounded text-xs">{pos.formula}</code></td>
                          <td className="text-slate-600 text-xs">{pos.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Условные */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-700">Условные должности (5)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="table text-sm">
                    <thead>
                      <tr className="bg-amber-50">
                        <th>Должность</th>
                        <th>Условие включения</th>
                        <th>Формула</th>
                      </tr>
                    </thead>
                    <tbody>
                      {POSITION_CLASSIFICATION.conditional.map((pos, i) => (
                        <tr key={i}>
                          <td className="font-medium">{pos.name}</td>
                          <td><span className="text-amber-700 text-xs">❓ {pos.condition}</span></td>
                          <td><code className="bg-slate-100 px-1 rounded text-xs">{pos.formula}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Исключаемые */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-700">Исключаемые должности (1)</span>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  {POSITION_CLASSIFICATION.excluded.map((pos, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="font-medium text-red-800">{pos.name}</span>
                      <span className="text-red-600 text-sm">— {pos.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Масштабы проектов */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Определение масштаба проекта</h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {PROJECT_SCALES.map((scale) => (
                  <div
                    key={scale.code}
                    className="p-3 rounded-lg border-2 text-center"
                    style={{ borderColor: scale.color, backgroundColor: `${scale.color}10` }}
                  >
                    <div className="font-bold text-2xl" style={{ color: scale.color }}>{scale.code}</div>
                    <div className="font-semibold text-slate-900">{scale.name}</div>
                    <div className="text-sm text-slate-600">{scale.workers} рабочих</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ПОЛНАЯ ТАБЛИЦА K КОЭФФИЦИЕНТОВ ДЛЯ ВСЕХ ДОЛЖНОСТЕЙ */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Table className="w-5 h-5 text-primary-600" />
                K коэффициенты для всех должностей
                <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Помесячные данные
                </span>
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                K — количество рабочих на одного специалиста. Формула: <code className="bg-slate-100 px-1 rounded">ceil(Рабочие / K)</code>
              </p>
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Должность</th>
                      <th className="text-center" style={{ color: '#f59e0b' }}>S</th>
                      <th className="text-center" style={{ color: '#10b981' }}>M</th>
                      <th className="text-center" style={{ color: '#06b6d4' }}>L</th>
                      <th className="text-center" style={{ color: '#4f46e5' }}>XL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionNormsByScale.map((norm) => (
                      <tr key={norm.position_group}>
                        <td className="font-medium text-slate-900 max-w-[200px]">
                          {norm.position_group}
                        </td>
                        {['Small', 'Medium', 'Large', 'Very Large'].map((scale) => {
                          const scaleData = norm.scales[scale];
                          return (
                            <td key={scale} className="text-center">
                              {scaleData ? (
                                <div>
                                  <span className="font-bold text-lg">{scaleData.recommended_K}</span>
                                  <div className="text-xs text-slate-400">({scaleData.projects_count})</div>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>Значения K рассчитаны на основе медианы помесячных данных</span>
                <span>В скобках — количество проектов с данными</span>
              </div>
            </Card>

            {/* Пример расчёта */}
            <Card className="p-4 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Пример расчёта: проект 200 рабочих (L)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Руководитель проекта</div>
                  <div className="font-mono">1 = <strong>1</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Производитель работ</div>
                  <div className="font-mono">⌈200/169⌉ = <strong>2</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Мастер</div>
                  <div className="font-mono">⌈200/19⌉ = <strong>11</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Специалист по ОТ</div>
                  <div className="font-mono">⌈200/50⌉ = <strong>4</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Кладовщик</div>
                  <div className="font-mono">⌈200/81⌉ = <strong>3</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Спец. по общ. вопросам</div>
                  <div className="font-mono">⌈21/15⌉ = <strong>2</strong></div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-primary-100 rounded-lg text-center">
                <span className="text-primary-800 font-bold">ИТОГО обязательные: 23 чел ИТР</span>
              </div>
              <div className="mt-2 text-xs text-slate-500 text-center">
                Коэффициенты для масштаба L: K_прораб=169, K_мастер=19, K_склад=81
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Demo Calculator Tab */}
        <TabsContent value="calculator">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ввод */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Демо расчёт норматива</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Численность рабочих
                  </label>
                  <input
                    type="number"
                    value={demoWorkers}
                    onChange={(e) => setDemoWorkers(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Масштаб проекта (определяется автоматически)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PROJECT_SCALES.map((scale) => (
                      <button
                        key={scale.code}
                        onClick={() => setDemoScale(scale.code as 'S' | 'M' | 'L' | 'XL')}
                        className={`p-2 rounded-lg border-2 text-center transition-all ${
                          demoScale === scale.code
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold" style={{ color: scale.color }}>{scale.code}</div>
                        <div className="text-xs text-slate-600">{scale.workers}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600 mb-2">Коэффициенты для масштаба {demoScale}:</div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-slate-500">K_прораб</div>
                      <div className="font-bold">{PROJECT_SCALES.find(s => s.code === demoScale)?.K_prorab}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">K_мастер</div>
                      <div className="font-bold">{PROJECT_SCALES.find(s => s.code === demoScale)?.K_master}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">K_склад</div>
                      <div className="font-bold">{PROJECT_SCALES.find(s => s.code === demoScale)?.K_sklad}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Результат */}
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Результат расчёта</h3>

              <div className="space-y-2">
                {[
                  { name: 'Руководитель проекта', value: demoResults.rukovoditel, formula: '1' },
                  { name: 'Производитель работ', value: demoResults.prorab, formula: `⌈${demoWorkers}/${PROJECT_SCALES.find(s => s.code === demoScale)?.K_prorab}⌉` },
                  { name: 'Мастер', value: demoResults.master, formula: `⌈${demoWorkers}/${PROJECT_SCALES.find(s => s.code === demoScale)?.K_master}⌉` },
                  { name: 'Специалист по ОТ', value: demoResults.ot, formula: `⌈${demoWorkers}/50⌉` },
                  { name: 'Кладовщик', value: demoResults.sklad, formula: `⌈${demoWorkers}/${PROJECT_SCALES.find(s => s.code === demoScale)?.K_sklad}⌉` },
                  { name: 'Спец. по общ. вопросам', value: demoResults.admin, formula: `⌈${demoResults.total - demoResults.admin}/15⌉` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <span className="text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-slate-500">{item.formula}</code>
                      <span className="font-bold text-primary-600 w-8 text-right">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-primary-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary-800">ИТОГО обязательных ИТР:</span>
                  <span className="text-2xl font-bold text-primary-600">{demoResults.total}</span>
                </div>
                <div className="text-xs text-primary-600 mt-1">
                  ИТР/100 рабочих: {((demoResults.total / demoWorkers) * 100).toFixed(2)}
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm">
                <div className="font-semibold text-amber-800 mb-1">+ Условные должности</div>
                <div className="text-amber-700 text-xs">
                  При наличии: автотранспорта, строительных лесов, иностранных рабочих, охраны, проектных работ
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card className="p-4">
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="table text-sm">
                <thead className="sticky top-0">
                  <tr>
                    <th>Группа должностей</th>
                    <th className="text-center">Всего</th>
                    <th className="text-center">% от ИТР</th>
                    <th className="text-center">Ср. на проект</th>
                    <th className="text-center">В проектах</th>
                  </tr>
                </thead>
                <tbody>
                  {positionNorms.map((norm, index) => {
                    // Определяем категорию
                    const isMandatory = POSITION_CLASSIFICATION.mandatory.some(m => norm.position_group.includes(m.name.split('/')[0].trim()));
                    const isExcluded = POSITION_CLASSIFICATION.excluded.some(e => norm.position_group.includes(e.name.split('/')[0].trim()));

                    return (
                      <tr key={index} className={isExcluded ? 'bg-red-50' : ''}>
                        <td className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            {isMandatory && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {isExcluded && <XCircle className="w-4 h-4 text-red-500" />}
                            {!isMandatory && !isExcluded && <HelpCircle className="w-4 h-4 text-amber-500" />}
                            {norm.position_group}
                          </div>
                        </td>
                        <td className="text-center">{norm.total_employees}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                            {norm.percentage_of_total_itr.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center">{norm.avg_per_project.toFixed(2)}</td>
                        <td className="text-center text-slate-600">{norm.present_in_projects}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Обязательная</div>
              <div className="flex items-center gap-1"><HelpCircle className="w-3 h-3 text-amber-500" /> Условная</div>
              <div className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-500" /> Исключаемая</div>
            </div>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-primary-600" />
                Тепловая карта: Рабочие по проектам и месяцам
              </h3>

              <div className="text-sm text-slate-600 mb-4">
                Цвет показывает изменение относительно предыдущего месяца:
                <span className="text-green-600 font-medium"> зелёный</span> — рост,
                <span className="text-red-600 font-medium"> красный</span> — падение.
                Всего {heatmapData.projects.length} проектов.
              </div>

              {/* Селектор месяца и легенда */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">Месяц для индикатора:</label>
                  <select
                    value={heatmapMonth}
                    onChange={(e) => setHeatmapMonth(e.target.value)}
                    className="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {MONTHS_ORDER.slice(1).map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                {/* Легенда цветов */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">Падение</span>
                    <div className="flex">
                      {[-0.5, -0.3, -0.15].map((change, i) => (
                        <div
                          key={i}
                          className="w-5 h-4"
                          style={{
                            backgroundColor: `rgba(220, 38, 38, ${Math.abs(change)})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-5 h-4 bg-slate-100 border border-slate-200" title="Без изменений / первый месяц" />
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[0.15, 0.3, 0.5].map((change, i) => (
                        <div
                          key={i}
                          className="w-5 h-4"
                          style={{
                            backgroundColor: `rgba(22, 163, 74, ${change})`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-slate-500">Рост</span>
                  </div>
                </div>
              </div>

              {/* Таблица тепловой карты */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white z-10 text-left p-1 border-b border-r min-w-[250px]">
                        Проект
                      </th>
                      <th className="p-1 border-b border-r text-center min-w-[120px] bg-amber-50">
                        Динамика ({heatmapMonth.slice(0, 3)})
                      </th>
                      {MONTHS_ORDER.map(month => (
                        <th
                          key={month}
                          className={`p-1 border-b text-center min-w-[45px] ${month === heatmapMonth ? 'bg-amber-100 font-bold' : ''}`}
                          title={month}
                        >
                          {month.slice(0, 3)}
                        </th>
                      ))}
                      <th className="p-1 border-b border-l text-center bg-slate-50">Ср.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.projects.map((project, idx) => {
                      // Рассчитываем динамику для выбранного месяца
                      const selectedMonthIdx = MONTHS_ORDER.indexOf(heatmapMonth);
                      const selectedWorkers = project.months[heatmapMonth] || 0;
                      const prevMonthForSelected = selectedMonthIdx > 0 ? MONTHS_ORDER[selectedMonthIdx - 1] : null;
                      const prevWorkersForSelected = prevMonthForSelected ? (project.months[prevMonthForSelected] || 0) : 0;

                      let dynamicsPercent = 0;
                      if (prevMonthForSelected && prevWorkersForSelected > 0 && selectedWorkers > 0) {
                        dynamicsPercent = (selectedWorkers - prevWorkersForSelected) / prevWorkersForSelected;
                      } else if (prevMonthForSelected && prevWorkersForSelected === 0 && selectedWorkers > 0) {
                        dynamicsPercent = 1;
                      } else if (prevMonthForSelected && prevWorkersForSelected > 0 && selectedWorkers === 0) {
                        dynamicsPercent = -1;
                      }

                      // Определяем текст и стиль индикатора динамики
                      let dynamicsLabel = '—';
                      let dynamicsColor = 'text-slate-400';
                      let dynamicsBg = 'bg-slate-50';

                      if (selectedWorkers === 0 && prevWorkersForSelected === 0) {
                        dynamicsLabel = 'Нет данных';
                        dynamicsColor = 'text-slate-400';
                        dynamicsBg = 'bg-slate-50';
                      } else if (dynamicsPercent > 0.2) {
                        dynamicsLabel = '⬆️ Сильный рост';
                        dynamicsColor = 'text-green-700 font-semibold';
                        dynamicsBg = 'bg-green-100';
                      } else if (dynamicsPercent > 0.05) {
                        dynamicsLabel = '↗️ Небольшой рост';
                        dynamicsColor = 'text-green-600';
                        dynamicsBg = 'bg-green-50';
                      } else if (dynamicsPercent >= -0.05) {
                        dynamicsLabel = '➡️ Без динамики';
                        dynamicsColor = 'text-slate-600';
                        dynamicsBg = 'bg-slate-100';
                      } else if (dynamicsPercent >= -0.2) {
                        dynamicsLabel = '↘️ Небольшое снижение';
                        dynamicsColor = 'text-red-600';
                        dynamicsBg = 'bg-red-50';
                      } else {
                        dynamicsLabel = '⬇️ Сильное снижение';
                        dynamicsColor = 'text-red-700 font-semibold';
                        dynamicsBg = 'bg-red-100';
                      }

                      return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td
                          className="sticky left-0 bg-white z-10 p-1 border-r text-left whitespace-nowrap"
                        >
                          {project.project}
                        </td>
                        <td className={`p-1 border-r text-center ${dynamicsBg} ${dynamicsColor} whitespace-nowrap`}>
                          {dynamicsLabel}
                        </td>
                        {MONTHS_ORDER.map((month, monthIdx) => {
                          const workers = project.months[month] || 0;
                          const prevMonth = monthIdx > 0 ? MONTHS_ORDER[monthIdx - 1] : null;
                          const prevWorkers = prevMonth ? (project.months[prevMonth] || 0) : 0;

                          // Рассчитываем изменение относительно предыдущего месяца
                          let changePercent = 0;
                          if (prevMonth && prevWorkers > 0 && workers > 0) {
                            changePercent = (workers - prevWorkers) / prevWorkers;
                          } else if (prevMonth && prevWorkers === 0 && workers > 0) {
                            changePercent = 1; // Новый проект — рост на 100%
                          } else if (prevMonth && prevWorkers > 0 && workers === 0) {
                            changePercent = -1; // Закрытие — падение на 100%
                          }

                          // Определяем цвет: зелёный для роста, красный для падения
                          // Интенсивность от 0.15 до 0.7 в зависимости от силы изменения
                          const absChange = Math.min(Math.abs(changePercent), 1); // Ограничиваем 100%
                          const intensity = 0.15 + absChange * 0.55; // От 0.15 до 0.7

                          let bgColor = '#f1f5f9'; // Нейтральный серый (первый месяц или нет данных)
                          let textColor = '#64748b';

                          if (workers > 0 && monthIdx === 0) {
                            // Первый месяц — нейтральный синий
                            bgColor = 'rgba(79, 70, 229, 0.15)';
                            textColor = '#1e293b';
                          } else if (workers > 0 || (prevWorkers > 0 && workers === 0)) {
                            if (changePercent > 0.02) {
                              // Рост (> 2%) — зелёный
                              bgColor = `rgba(22, 163, 74, ${intensity})`;
                              textColor = intensity > 0.4 ? 'white' : '#166534';
                            } else if (changePercent < -0.02) {
                              // Падение (> 2%) — красный
                              bgColor = `rgba(220, 38, 38, ${intensity})`;
                              textColor = intensity > 0.4 ? 'white' : '#991b1b';
                            } else if (workers > 0) {
                              // Без существенных изменений — нейтральный
                              bgColor = '#e2e8f0';
                              textColor = '#1e293b';
                            }
                          }

                          // Формируем текст подсказки
                          let changeText = '';
                          if (monthIdx > 0 && (workers > 0 || prevWorkers > 0)) {
                            const diff = workers - prevWorkers;
                            const sign = diff > 0 ? '+' : '';
                            const percent = prevWorkers > 0 ? ` (${sign}${Math.round(changePercent * 100)}%)` : '';
                            changeText = `, изм: ${sign}${diff}${percent}`;
                          }

                          return (
                            <td
                              key={month}
                              className="p-1 text-center border"
                              style={{
                                backgroundColor: bgColor,
                                color: workers === 0 ? '#cbd5e1' : textColor,
                              }}
                              title={`${project.project}: ${month} — ${workers} раб.${changeText}`}
                            >
                              {workers > 0 ? workers : '—'}
                            </td>
                          );
                        })}
                        <td className="p-1 text-center border-l bg-slate-50 font-semibold">
                          {Math.round(project.avgWorkers)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                <p>Проекты отсортированы по среднему количеству рабочих (по убыванию)</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Overview/Statistics Tab */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-primary-600 mb-1">
                  {companyStandards.itr_per_100_workers_median.toFixed(2)}
                </div>
                <p className="text-xs text-slate-600">Медиана ИТР/100</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {companyStandards.itr_per_100_workers_min.toFixed(2)}
                </div>
                <p className="text-xs text-slate-600">Минимум ИТР/100</p>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {companyStandards.itr_per_100_workers_max.toFixed(2)}
                </div>
                <p className="text-xs text-slate-600">Максимум ИТР/100</p>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <Card title="Распределение по масштабу" className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={scaleDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {scaleDistributionData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Bar Chart */}
              <Card title="Стандарты по масштабу" className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scaleStandardsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Ср. ИТР" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ИТР/100" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Scale breakdown table */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Детализация по масштабу проекта</h3>
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Масштаб</th>
                      <th className="text-center">Проектов</th>
                      <th className="text-center">Ср. рабочих</th>
                      <th className="text-center">Ср. ИТР</th>
                      <th className="text-center">ИТР/100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(scaleStandards).map(([scale, data]) => {
                      const scaleName =
                        scale === 'Small'
                          ? 'Малый'
                          : scale === 'Medium'
                          ? 'Средний'
                          : scale === 'Large'
                          ? 'Большой'
                          : 'Очень большой';
                      return (
                        <tr key={scale}>
                          <td className="font-medium text-slate-900">{scaleName}</td>
                          <td className="text-center">{data.project_count}</td>
                          <td className="text-center">{data.avg_workers.toFixed(0)}</td>
                          <td className="text-center">{data.avg_itr.toFixed(0)}</td>
                          <td className="text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                              {data.avg_itr_per_100_workers.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
