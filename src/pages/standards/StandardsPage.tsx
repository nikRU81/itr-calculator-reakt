import { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Briefcase,
  TrendingUp,
  Building2,
  Table,
  PieChart as PieChartIcon,
  Info,
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

export default function StandardsPage() {
  const [companyStandards, setCompanyStandards] = useState<CompanyStandards | null>(null);
  const [positionNorms, setPositionNorms] = useState<PositionGroupNorm[]>([]);
  const [scaleStandards, setScaleStandards] = useState<ScaleBasedStandards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          label="Среднее ИТР/100"
          value={companyStandards.itr_per_100_workers_avg.toFixed(2)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#f59e0b"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultTab="overview">
        <TabsList>
          <Tab value="overview" icon={<PieChartIcon className="w-4 h-4" />}>
            Обзор
          </Tab>
          <Tab value="positions" icon={<Table className="w-4 h-4" />}>
            Должности
          </Tab>
          <Tab value="scale" icon={<FileText className="w-4 h-4" />}>
            По масштабу
          </Tab>
          <Tab value="info" icon={<Info className="w-4 h-4" />}>
            Справка
          </Tab>
        </TabsList>

        {/* Overview Tab */}
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
                  {positionNorms.map((norm, index) => (
                    <tr key={index}>
                      <td className="font-medium text-slate-900">{norm.position_group}</td>
                      <td className="text-center">{norm.total_employees}</td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                          {norm.percentage_of_total_itr.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center">{norm.avg_per_project.toFixed(2)}</td>
                      <td className="text-center text-slate-600">{norm.present_in_projects}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Scale Tab */}
        <TabsContent value="scale">
          <Card className="p-4">
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
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card className="p-4">
            <div className="text-sm text-slate-700 space-y-3">
              <p className="font-semibold">Как использовать нормативы:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  Базовый норматив{' '}
                  <strong className="text-primary-600">
                    {companyStandards.itr_per_100_workers_median.toFixed(2)}
                  </strong>{' '}
                  ИТР на 100 рабочих (медиана) подходит для большинства проектов
                </li>
                <li>
                  Для малых проектов (до 50 рабочих) коэффициент выше —{' '}
                  <strong className="text-primary-600">
                    {scaleStandards.Small?.avg_itr_per_100_workers.toFixed(2)}
                  </strong>
                </li>
                <li>
                  Для крупных проектов (более 200 рабочих) коэффициент ниже —{' '}
                  <strong className="text-primary-600">
                    {scaleStandards['Very Large']?.avg_itr_per_100_workers.toFixed(2)}
                  </strong>
                </li>
                <li>Распределение по должностям автоматически учитывается калькулятором</li>
              </ul>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600">
                  Данные основаны на анализе {companyStandards.total_projects} проектов за период
                  Январь-Октябрь 2025 г.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
