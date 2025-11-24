import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, BarChart3, Table, Info } from 'lucide-react';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
import { Tabs, TabsList, Tab, TabsContent } from '../../components/ui/Tabs';
import { loadProjects } from '../../utils/dataLoader';
import type { Project } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

export default function LaborPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const projectsData = await loadProjects();
        const validProjects = projectsData.filter(
          (p) => p.itr_per_100_workers !== null && p.workers_count > 0
        );
        const sorted = [...validProjects].sort(
          (a, b) => b.itr_per_100_workers! - a.itr_per_100_workers!
        );
        setProjects(sorted);
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

  if (error || !projects.length) {
    return (
      <Card className="bg-red-50 border-red-200">
        <p className="text-red-600">{error || 'Не удалось загрузить данные'}</p>
      </Card>
    );
  }

  // Calculate statistics
  const ratios = projects.map((p) => p.itr_per_100_workers);
  const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  const minRatio = Math.min(...ratios);
  const maxRatio = Math.max(...ratios);
  const medianRatio = [...ratios].sort((a, b) => a - b)[Math.floor(ratios.length / 2)];

  // Categorize projects
  const optimalRange = { min: 8, max: 12 };
  const optimalProjects = projects.filter(
    (p) => p.itr_per_100_workers >= optimalRange.min && p.itr_per_100_workers <= optimalRange.max
  );
  const lowProjects = projects.filter((p) => p.itr_per_100_workers < optimalRange.min);
  const highProjects = projects.filter((p) => p.itr_per_100_workers > optimalRange.max);

  // Chart data
  const top10Data = projects.slice(0, 10).map((p) => ({
    name: p.project.length > 25 ? p.project.substring(0, 25) + '...' : p.project,
    'ИТР/100': Number(p.itr_per_100_workers!.toFixed(2)),
    fullName: p.project,
  }));

  const distributionData = projects.map((p, index) => ({
    index: index + 1,
    ratio: p.itr_per_100_workers,
    name: p.project,
    workers: p.workers_count,
  }));

  // Scale analysis
  const scaleAnalysis = projects.reduce((acc, project) => {
    const scale = project.project_scale;
    if (!acc[scale]) {
      acc[scale] = { count: 0, totalRatio: 0 };
    }
    acc[scale].count++;
    acc[scale].totalRatio += project.itr_per_100_workers;
    return acc;
  }, {} as Record<string, { count: number; totalRatio: number }>);

  const scaleData = Object.entries(scaleAnalysis).map(([scale, data]) => ({
    name:
      scale === 'Small'
        ? 'Малый'
        : scale === 'Medium'
        ? 'Средний'
        : scale === 'Large'
        ? 'Большой'
        : 'Очень большой',
    'Ср. ИТР/100': Number((data.totalRatio / data.count).toFixed(2)),
  }));

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Среднее ИТР/100"
          value={avgRatio.toFixed(2)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="#4f46e5"
        />
        <MetricCard
          label="Медиана"
          value={medianRatio.toFixed(2)}
          icon={<CheckCircle className="w-5 h-5" />}
          color="#10b981"
        />
        <MetricCard
          label="Минимум"
          value={minRatio.toFixed(2)}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="#06b6d4"
        />
        <MetricCard
          label="Максимум"
          value={maxRatio.toFixed(2)}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="#f59e0b"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultTab="overview">
        <TabsList>
          <Tab value="overview" icon={<BarChart3 className="w-4 h-4" />}>
            Обзор
          </Tab>
          <Tab value="distribution" icon={<TrendingUp className="w-4 h-4" />}>
            Распределение
          </Tab>
          <Tab value="table" icon={<Table className="w-4 h-4" />}>
            Таблица
          </Tab>
          <Tab value="info" icon={<Info className="w-4 h-4" />}>
            Справка
          </Tab>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* Category Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">{optimalProjects.length}</div>
                <p className="text-xs text-slate-600 mb-1">Оптимально ({optimalRange.min}-{optimalRange.max})</p>
                <div className="text-lg font-semibold text-slate-900">
                  {((optimalProjects.length / projects.length) * 100).toFixed(0)}%
                </div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">{lowProjects.length}</div>
                <p className="text-xs text-slate-600 mb-1">Низкое (&lt;{optimalRange.min})</p>
                <div className="text-lg font-semibold text-slate-900">
                  {((lowProjects.length / projects.length) * 100).toFixed(0)}%
                </div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{highProjects.length}</div>
                <p className="text-xs text-slate-600 mb-1">Высокое (&gt;{optimalRange.max})</p>
                <div className="text-lg font-semibold text-slate-900">
                  {((highProjects.length / projects.length) * 100).toFixed(0)}%
                </div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top 10 */}
              <Card title="Топ-10 по ИТР/100" className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={top10Data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border border-slate-200 rounded shadow text-xs">
                              <p className="font-semibold mb-1">{data.fullName}</p>
                              <p>ИТР/100: {data['ИТР/100']}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="ИТР/100" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* By Scale */}
              <Card title="По масштабу проектов" className="p-4">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scaleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Ср. ИТР/100" fill="#4f46e5" label={{ position: 'top', fontSize: 10 }} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          <Card title="Распределение ИТР/100 по всем проектам" className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="index"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Проекты (по убыванию)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{ value: 'ИТР/100', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-slate-200 rounded shadow text-xs">
                          <p className="font-semibold mb-1">{data.name}</p>
                          <p>ИТР/100: {data.ratio.toFixed(2)}</p>
                          <p>Рабочих: {data.workers}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="ratio" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600 text-center">
              Оптимальный диапазон: {optimalRange.min}-{optimalRange.max} ИТР на 100 рабочих
            </div>
          </Card>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table">
          <Card className="p-4">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="table text-sm">
                <thead className="sticky top-0">
                  <tr>
                    <th>#</th>
                    <th>Проект</th>
                    <th className="text-center">Рабочие</th>
                    <th className="text-center">ИТР</th>
                    <th className="text-center">ИТР/100</th>
                    <th className="text-center">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, index) => {
                    const isOptimal =
                      project.itr_per_100_workers >= optimalRange.min &&
                      project.itr_per_100_workers <= optimalRange.max;
                    const isLow = project.itr_per_100_workers < optimalRange.min;
                    const statusColor = isOptimal
                      ? 'bg-green-100 text-green-700'
                      : isLow
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700';
                    const statusText = isOptimal ? 'Оптимально' : isLow ? 'Низкое' : 'Высокое';
                    return (
                      <tr key={index}>
                        <td className="text-center text-slate-500 text-xs">#{index + 1}</td>
                        <td className="font-medium text-slate-900 max-w-[180px] truncate">
                          {project.project}
                        </td>
                        <td className="text-center">{project.workers_count}</td>
                        <td className="text-center font-semibold text-primary-600">
                          {project.itr_count}
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold">
                            {project.itr_per_100_workers.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold ${statusColor}`}>
                            {statusText}
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
              <p className="font-semibold">Интерпретация показателей:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-green-700">Оптимальное соотношение</strong> ({optimalRange.min}-{optimalRange.max}):
                  Сбалансированное управление проектом
                </li>
                <li>
                  <strong className="text-orange-700">Низкое соотношение</strong> (&lt;{optimalRange.min}):
                  Возможна недостаточность ИТР для эффективного управления
                </li>
                <li>
                  <strong className="text-blue-700">Высокое соотношение</strong> (&gt;{optimalRange.max}):
                  Возможна избыточность ИТР или малый масштаб проекта
                </li>
                <li>
                  Рекомендуемое базовое значение для расчётов: <strong className="text-primary-600">{medianRatio.toFixed(2)}</strong> (медиана)
                </li>
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
