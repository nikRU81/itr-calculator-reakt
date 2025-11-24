import { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Briefcase,
  TrendingUp,
  BarChart3,
  Building2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
import {
  loadCompanyStandards,
  loadPositionNorms,
  loadScaleBasedStandards,
} from '../../utils/dataLoader';
import type { CompanyStandards, PositionGroupNorm, ScaleBasedStandards } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка данных...</p>
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
    'Ср. рабочих': data.avg_workers,
    'Ср. ИТР': data.avg_itr,
    'ИТР/100': Number(data.avg_itr_per_100_workers.toFixed(2)),
  }));

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Нормативы компании ПОЛАТИ
            </h3>
            <p className="text-slate-700">
              Стандарты численности ИТР основаны на анализе{' '}
              <span className="font-bold text-primary-600">
                {companyStandards.total_projects} проектов
              </span>{' '}
              за период Январь-Октябрь 2025 г.
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        <MetricCard
          label="Всего проектов"
          value={companyStandards.total_projects}
          icon={<Building2 className="w-6 h-6" />}
          color="#4f46e5"
        />
        <MetricCard
          label="Общая численность ИТР"
          value={companyStandards.total_itr}
          icon={<Briefcase className="w-6 h-6" />}
          color="#10b981"
        />
        <MetricCard
          label="Общая численность рабочих"
          value={companyStandards.total_workers}
          icon={<Users className="w-6 h-6" />}
          color="#06b6d4"
        />
        <MetricCard
          label="Среднее ИТР/100 рабочих"
          value={companyStandards.itr_per_100_workers_avg.toFixed(2)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="#f59e0b"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-right">
        <Card title="Медиана">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              {companyStandards.itr_per_100_workers_median.toFixed(2)}
            </div>
            <p className="text-sm text-slate-600">ИТР на 100 рабочих</p>
          </div>
        </Card>
        <Card title="Минимум">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {companyStandards.itr_per_100_workers_min.toFixed(2)}
            </div>
            <p className="text-sm text-slate-600">ИТР на 100 рабочих</p>
          </div>
        </Card>
        <Card title="Максимум">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {companyStandards.itr_per_100_workers_max.toFixed(2)}
            </div>
            <p className="text-sm text-slate-600">ИТР на 100 рабочих</p>
          </div>
        </Card>
      </div>

      {/* Position Norms Table */}
      <Card title="Нормы по группам должностей" className="animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Группа должностей</th>
                <th className="text-center">Всего сотрудников</th>
                <th className="text-center">% от общего ИТР</th>
                <th className="text-center">Среднее на проект</th>
                <th className="text-center">Присутствует в проектах</th>
              </tr>
            </thead>
            <tbody>
              {positionNorms.map((norm, index) => (
                <tr key={index}>
                  <td className="font-medium text-slate-900">{norm.position_group}</td>
                  <td className="text-center">{norm.total_employees}</td>
                  <td className="text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold">
                      {norm.percentage_of_total_itr.toFixed(2)}%
                    </span>
                  </td>
                  <td className="text-center">{norm.avg_per_project.toFixed(2)}</td>
                  <td className="text-center">
                    <span className="text-slate-600">{norm.present_in_projects}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scale Distribution Pie Chart */}
        <Card title="Распределение проектов по масштабу" className="animate-fade-in-up">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scaleDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
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
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {scaleDistributionData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-700">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Scale Standards Bar Chart */}
        <Card title="Стандарты по масштабу проектов" className="animate-fade-in-up">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scaleStandardsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Ср. ИТР" fill="#4f46e5" />
              <Bar dataKey="ИТР/100" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Scale-Based Standards Table */}
      <Card title="Детализированные стандарты по масштабу" className="animate-slide-in-right">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Масштаб</th>
                <th className="text-center">Количество проектов</th>
                <th className="text-center">Ср. рабочих</th>
                <th className="text-center">Ср. ИТР</th>
                <th className="text-center">Ср. ИТР/100</th>
                <th className="text-center">Медиана ИТР/100</th>
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
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold">
                        {data.avg_itr_per_100_workers.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center">{data.avg_itr_per_100_workers.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-200 rounded-lg">
            <BarChart3 className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-sm text-slate-700">
            <p className="mb-2">
              <strong>Как использовать эти нормативы:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Базовый норматив{' '}
                <strong>{companyStandards.itr_per_100_workers_median.toFixed(2)}</strong> ИТР на
                100 рабочих (медиана) подходит для большинства проектов
              </li>
              <li>
                Для малых проектов (до 50 рабочих) коэффициент выше -{' '}
                <strong>
                  {scaleStandards.Small?.avg_itr_per_100_workers.toFixed(2)}
                </strong>
              </li>
              <li>
                Для крупных проектов (более 200 рабочих) коэффициент ниже -{' '}
                <strong>
                  {scaleStandards['Very Large']?.avg_itr_per_100_workers.toFixed(2)}
                </strong>
              </li>
              <li>Распределение по должностям автоматически учитывается калькулятором</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
