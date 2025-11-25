import { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  TrendingUp,
  Building2,
  Table,
  PieChart as PieChartIcon,
  BookOpen,
  CheckCircle,
  HelpCircle,
  XCircle,
  Calculator,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
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
const PROJECT_SCALES = [
  { code: 'S', name: 'Малый', workers: 'до 50', color: '#f59e0b', K_prorab: 15, K_master: 10, K_sklad: 30 },
  { code: 'M', name: 'Средний', workers: '50–150', color: '#10b981', K_prorab: 20, K_master: 12, K_sklad: 40 },
  { code: 'L', name: 'Крупный', workers: '150–300', color: '#06b6d4', K_prorab: 25, K_master: 15, K_sklad: 50 },
  { code: 'XL', name: 'Очень крупный', workers: '300+', color: '#4f46e5', K_prorab: 30, K_master: 18, K_sklad: 60 },
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

export default function StandardsPage() {
  const [companyStandards, setCompanyStandards] = useState<CompanyStandards | null>(null);
  const [positionNorms, setPositionNorms] = useState<PositionGroupNorm[]>([]);
  const [scaleStandards, setScaleStandards] = useState<ScaleBasedStandards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Демо калькулятор
  const [demoWorkers, setDemoWorkers] = useState(100);
  const [demoScale, setDemoScale] = useState<'S' | 'M' | 'L' | 'XL'>('M');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [standards, norms, scaleData] = await Promise.all([
          loadCompanyStandards(),
          loadPositionNorms(),
          loadScaleBasedStandards(),
        ]);
        setCompanyStandards(standards);
        setPositionNorms(norms);
        setScaleStandards(scaleData);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Всего проектов"
          value={companyStandards.total_projects}
          icon={<Building2 className="w-5 h-5" />}
          color="#4f46e5"
        />
        <MetricCard
          label="Численность ИТР"
          value={companyStandards.total_itr}
          icon={<Briefcase className="w-5 h-5" />}
          color="#10b981"
        />
        <MetricCard
          label="Численность рабочих"
          value={companyStandards.total_workers}
          icon={<Users className="w-5 h-5" />}
          color="#06b6d4"
        />
        <MetricCard
          label="Медиана ИТР/100"
          value={companyStandards.itr_per_100_workers_median.toFixed(2)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#f59e0b"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultTab="methodology">
        <TabsList>
          <Tab value="methodology" icon={<BookOpen className="w-4 h-4" />}>
            Методика
          </Tab>
          <Tab value="calculator" icon={<Calculator className="w-4 h-4" />}>
            Демо расчёт
          </Tab>
          <Tab value="positions" icon={<Table className="w-4 h-4" />}>
            Должности
          </Tab>
          <Tab value="overview" icon={<PieChartIcon className="w-4 h-4" />}>
            Статистика
          </Tab>
        </TabsList>

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
              <div className="overflow-x-auto">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Масштаб</th>
                      <th>Код</th>
                      <th>Численность рабочих</th>
                      <th>K_прораб</th>
                      <th>K_мастер</th>
                      <th>K_склад</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROJECT_SCALES.map((scale) => (
                      <tr key={scale.code}>
                        <td>
                          <span
                            className="inline-flex items-center gap-1 font-semibold"
                            style={{ color: scale.color }}
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: scale.color }}
                            />
                            {scale.name}
                          </span>
                        </td>
                        <td className="font-mono font-bold">{scale.code}</td>
                        <td className="font-semibold">{scale.workers}</td>
                        <td className="text-center">{scale.K_prorab}</td>
                        <td className="text-center">{scale.K_master}</td>
                        <td className="text-center">{scale.K_sklad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                K — количество рабочих на одного специалиста. Например, K_мастер=15 означает 1 мастер на 15 рабочих.
              </p>
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
                  <div className="font-mono">⌈200/25⌉ = <strong>8</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Мастер</div>
                  <div className="font-mono">⌈200/15⌉ = <strong>14</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Специалист по ОТ</div>
                  <div className="font-mono">⌈200/50⌉ = <strong>4</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Кладовщик</div>
                  <div className="font-mono">⌈200/50⌉ = <strong>4</strong></div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-slate-500 text-xs">Спец. по общ. вопросам</div>
                  <div className="font-mono">⌈31/15⌉ = <strong>3</strong></div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-primary-100 rounded-lg text-center">
                <span className="text-primary-800 font-bold">ИТОГО обязательные: 34 чел ИТР</span>
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
