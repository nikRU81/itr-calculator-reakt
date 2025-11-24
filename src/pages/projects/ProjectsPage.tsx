import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, Briefcase, Filter } from 'lucide-react';
import Card from '../../components/ui/Card';
import { loadMonthlyDynamics } from '../../utils/dataLoader';
import type { MonthlyDynamics } from '../../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';

export default function ProjectsPage() {
  const [dynamicsData, setDynamicsData] = useState<MonthlyDynamics | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await loadMonthlyDynamics();
        setDynamicsData(data);
        // Select first project by default
        if (data.monthly_dynamics.length > 0) {
          setSelectedProject(data.monthly_dynamics[0].project);
        }
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

  if (error || !dynamicsData) {
    return (
      <Card className="bg-red-50 border-red-200">
        <p className="text-red-600">{error || 'Не удалось загрузить данные'}</p>
      </Card>
    );
  }

  // Get unique projects
  const projects = [...new Set(dynamicsData.monthly_dynamics.map((d) => d.project))];

  // Filter data for selected project
  const projectData = dynamicsData.monthly_dynamics.filter(
    (d) => d.project === selectedProject
  );

  // Prepare chart data
  const chartData = projectData.map((record) => ({
    month: record.month,
    'ИТР': record.itr_unique_count,
    'Рабочие': record.workers_unique_count,
    'ИТР/100': Number(record.itr_per_100_workers.toFixed(2)),
    'FTE ИТР': Number(record.itr_fte.toFixed(2)),
    'FTE Рабочие': Number(record.workers_fte.toFixed(2)),
  }));

  // Calculate statistics for selected project
  const avgWorkers =
    projectData.reduce((sum, d) => sum + d.workers_unique_count, 0) / projectData.length;
  const avgITR = projectData.reduce((sum, d) => sum + d.itr_unique_count, 0) / projectData.length;
  const avgRatio =
    projectData.reduce((sum, d) => sum + d.itr_per_100_workers, 0) / projectData.length;
  const months = projectData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Динамика по проектам</h3>
            <p className="text-slate-700">
              Помесячное изменение численности ИТР и рабочих по {projects.length} проектам
            </p>
          </div>
        </div>
      </Card>

      {/* Project Selector */}
      <Card title="Выбор проекта" className="animate-slide-in-right">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent appearance-none bg-white text-base font-medium"
          >
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Key Metrics for Selected Project */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        <Card title="Периодов" className="text-center">
          <div className="py-4">
            <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">{months}</div>
            <p className="text-sm text-slate-600 mt-1">месяцев</p>
          </div>
        </Card>
        <Card title="Ср. рабочих" className="text-center">
          <div className="py-4">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">{avgWorkers.toFixed(0)}</div>
            <p className="text-sm text-slate-600 mt-1">в среднем</p>
          </div>
        </Card>
        <Card title="Ср. ИТР" className="text-center">
          <div className="py-4">
            <Briefcase className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">{avgITR.toFixed(0)}</div>
            <p className="text-sm text-slate-600 mt-1">в среднем</p>
          </div>
        </Card>
        <Card title="Ср. ИТР/100" className="text-center">
          <div className="py-4">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-slate-900">{avgRatio.toFixed(2)}</div>
            <p className="text-sm text-slate-600 mt-1">соотношение</p>
          </div>
        </Card>
      </div>

      {/* Combined Chart - Workers and ITR */}
      <Card title="Динамика численности ИТР и рабочих" className="animate-fade-in-up">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" label={{ value: 'Численность', angle: -90, position: 'insideLeft' }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'ИТР/100', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
                      <p className="font-semibold mb-2">{label}</p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: <strong>{entry.value}</strong>
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="Рабочие" fill="#06b6d4" />
            <Bar yAxisId="left" dataKey="ИТР" fill="#10b981" />
            <Line yAxisId="right" type="monotone" dataKey="ИТР/100" stroke="#f59e0b" strokeWidth={3} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* FTE Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ITR FTE */}
        <Card title="FTE ИТР по месяцам" className="animate-slide-in-right">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="FTE ИТР"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Workers FTE */}
        <Card title="FTE рабочих по месяцам" className="animate-slide-in-right">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="FTE Рабочие"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Ratio Trend */}
      <Card title="Динамика соотношения ИТР/100 рабочих" className="animate-fade-in-up">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'ИТР на 100 рабочих', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="ИТР/100"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-slate-100 rounded-lg">
          <p className="text-sm text-slate-700">
            <strong>Интерпретация:</strong> Стабильное соотношение (около{' '}
            {avgRatio.toFixed(2)}) указывает на устойчивую структуру управления проектом.
            Резкие изменения могут свидетельствовать о реорганизации или изменении масштаба работ.
          </p>
        </div>
      </Card>

      {/* Data Table */}
      <Card title="Детальные данные по месяцам" className="animate-slide-in-right">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Месяц</th>
                <th className="text-center">Рабочие</th>
                <th className="text-center">ИТР</th>
                <th className="text-center">ИТР/100</th>
                <th className="text-center">FTE Рабочие</th>
                <th className="text-center">FTE ИТР</th>
                <th className="text-center">Часы Рабочие</th>
                <th className="text-center">Часы ИТР</th>
              </tr>
            </thead>
            <tbody>
              {projectData.map((record, index) => (
                <tr key={index}>
                  <td className="font-medium text-slate-900">{record.month}</td>
                  <td className="text-center">{record.workers_unique_count}</td>
                  <td className="text-center text-primary-600 font-semibold">
                    {record.itr_unique_count}
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold">
                      {record.itr_per_100_workers.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-center text-slate-600">
                    {record.workers_fte.toFixed(2)}
                  </td>
                  <td className="text-center text-slate-600">{record.itr_fte.toFixed(2)}</td>
                  <td className="text-center text-slate-600">
                    {record.workers_total_hours.toLocaleString()}
                  </td>
                  <td className="text-center text-slate-600">
                    {record.itr_total_hours.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200 animate-fade-in-up">
        <div className="text-sm text-slate-700">
          <p className="mb-2">
            <strong>О показателях:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>FTE (Full-Time Equivalent)</strong> - эквивалент полной занятости, рассчитывается
              как количество отработанных часов / 200 часов
            </li>
            <li>
              <strong>ИТР/100</strong> - количество ИТР на 100 рабочих, ключевой показатель для
              оценки эффективности управления
            </li>
            <li>
              Данные агрегированы по месяцам на основе табелей учёта рабочего времени
            </li>
            <li>
              Используйте фильтр проектов для сравнения динамики между различными объектами
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
