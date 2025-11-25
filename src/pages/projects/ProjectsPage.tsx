import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, Briefcase, Filter, BarChart3, Table, Info } from 'lucide-react';
import Card from '../../components/ui/Card';
import { Tabs, TabsList, Tab, TabsContent } from '../../components/ui/Tabs';
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-600 text-sm">Загрузка данных...</p>
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

  const projects = [...new Set(dynamicsData.monthly_dynamics.map((d) => d.project))];
  const projectData = dynamicsData.monthly_dynamics.filter((d) => d.project === selectedProject);

  const chartData = projectData.map((record) => ({
    month: record.month,
    'ИТР': record.itr_unique_count,
    'Рабочие': record.workers_unique_count,
    'ИТР/100': Number(record.itr_per_100_workers.toFixed(2)),
    'FTE ИТР': Number(record.itr_fte.toFixed(2)),
    'FTE Рабочие': Number(record.workers_fte.toFixed(2)),
  }));

  const avgWorkers = projectData.reduce((sum, d) => sum + d.workers_unique_count, 0) / projectData.length;
  const avgITR = projectData.reduce((sum, d) => sum + d.itr_unique_count, 0) / projectData.length;
  const avgRatio = projectData.reduce((sum, d) => sum + d.itr_per_100_workers, 0) / projectData.length;
  const months = projectData.length;

  return (
    <div className="space-y-4">
      {/* Project Selector */}
      <Card className="p-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent appearance-none bg-white font-medium"
          >
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <Calendar className="w-6 h-6 text-primary-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-slate-900">{months}</div>
          <p className="text-xs text-slate-600">Периодов</p>
        </Card>
        <Card className="p-3 text-center">
          <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-slate-900">{avgWorkers.toFixed(0)}</div>
          <p className="text-xs text-slate-600">Ср. рабочих</p>
        </Card>
        <Card className="p-3 text-center">
          <Briefcase className="w-6 h-6 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-slate-900">{avgITR.toFixed(0)}</div>
          <p className="text-xs text-slate-600">Ср. ИТР</p>
        </Card>
        <Card className="p-3 text-center">
          <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-slate-900">{avgRatio.toFixed(2)}</div>
          <p className="text-xs text-slate-600">Ср. ИТР/100</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultTab="main">
        <TabsList>
          <Tab value="main" icon={<BarChart3 className="w-4 h-4" />}>
            Динамика
          </Tab>
          <Tab value="fte" icon={<TrendingUp className="w-4 h-4" />}>
            FTE
          </Tab>
          <Tab value="table" icon={<Table className="w-4 h-4" />}>
            Таблица
          </Tab>
          <Tab value="info" icon={<Info className="w-4 h-4" />}>
            Справка
          </Tab>
        </TabsList>

        {/* Main Chart Tab */}
        <TabsContent value="main">
          <div className="space-y-4">
            {/* Combined Chart */}
            <Card title="Численность ИТР и рабочих" className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Численность', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: 'ИТР/100', angle: 90, position: 'insideRight', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 border border-slate-200 rounded shadow text-xs">
                            <p className="font-semibold mb-1">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: entry.color }}>
                                {entry.name}: <strong>{entry.value}</strong>
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="Рабочие" fill="#06b6d4" />
                  <Bar yAxisId="left" dataKey="ИТР" fill="#10b981" />
                  <Line yAxisId="right" type="monotone" dataKey="ИТР/100" stroke="#f59e0b" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            {/* Ratio Trend */}
            <Card title="Динамика соотношения ИТР/100" className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ИТР/100" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* FTE Tab */}
        <TabsContent value="fte">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ITR FTE */}
            <Card title="FTE ИТР по месяцам" className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="FTE ИТР" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Workers FTE */}
            <Card title="FTE рабочих по месяцам" className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="FTE Рабочие" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table">
          <Card className="p-4">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="table text-sm">
                <thead className="sticky top-0">
                  <tr>
                    <th>Месяц</th>
                    <th className="text-center">Рабочие</th>
                    <th className="text-center">ИТР</th>
                    <th className="text-center">ИТР/100</th>
                    <th className="text-center">FTE Раб.</th>
                    <th className="text-center">FTE ИТР</th>
                  </tr>
                </thead>
                <tbody>
                  {projectData.map((record, index) => (
                    <tr key={index}>
                      <td className="font-medium text-slate-900">{record.month}</td>
                      <td className="text-center">{record.workers_unique_count}</td>
                      <td className="text-center font-semibold text-primary-600">
                        {record.itr_unique_count}
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                          {record.itr_per_100_workers.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-center text-slate-600">{record.workers_fte.toFixed(2)}</td>
                      <td className="text-center text-slate-600">{record.itr_fte.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card className="p-4">
            <div className="text-sm text-slate-700 space-y-3">
              <p className="font-semibold">О показателях:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>FTE (Full-Time Equivalent)</strong> — эквивалент полной занятости,
                  рассчитывается как количество отработанных часов / 200 часов
                </li>
                <li>
                  <strong>ИТР/100</strong> — количество ИТР на 100 рабочих, ключевой показатель для
                  оценки эффективности управления
                </li>
                <li>
                  Данные агрегированы по месяцам на основе табелей учёта рабочего времени
                </li>
              </ul>
              <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600">
                Стабильное соотношение (около {avgRatio.toFixed(2)}) указывает на устойчивую структуру
                управления проектом. Резкие изменения могут свидетельствовать о реорганизации.
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
