import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, CheckCircle, Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import MetricCard from '../../components/ui/MetricCard';
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
        // Sort by ITR per 100 workers
        const sorted = [...projectsData].sort(
          (a, b) => b.itr_per_100_workers - a.itr_per_100_workers
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка данных...</p>
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

  // Categorize projects by ratio
  const optimalRange = { min: 8, max: 12 };
  const optimalProjects = projects.filter(
    (p) => p.itr_per_100_workers >= optimalRange.min && p.itr_per_100_workers <= optimalRange.max
  );
  const lowProjects = projects.filter((p) => p.itr_per_100_workers < optimalRange.min);
  const highProjects = projects.filter((p) => p.itr_per_100_workers > optimalRange.max);

  // Prepare data for charts
  const top10Projects = projects.slice(0, 10);

  const top10Data = top10Projects.map((p) => ({
    name: p.project.length > 30 ? p.project.substring(0, 30) + '...' : p.project,
    'ИТР/100': Number(p.itr_per_100_workers.toFixed(2)),
    fullName: p.project,
  }));

  const distributionData = projects.map((p, index) => ({
    index: index + 1,
    ratio: p.itr_per_100_workers,
    name: p.project,
    workers: p.workers_count,
  }));

  // Distribution by scale
  const scaleAnalysis = projects.reduce((acc, project) => {
    const scale = project.project_scale;
    if (!acc[scale]) {
      acc[scale] = { count: 0, totalRatio: 0, projects: [] as Project[] };
    }
    acc[scale].count++;
    acc[scale].totalRatio += project.itr_per_100_workers;
    acc[scale].projects.push(project);
    return acc;
  }, {} as Record<string, { count: number; totalRatio: number; projects: Project[] }>);

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
    'Количество': data.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <Users className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Анализ соотношения ИТР к рабочим
            </h3>
            <p className="text-slate-700">
              Детальный анализ показателей ИТР/100 рабочих по {projects.length} проектам
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        <MetricCard
          label="Среднее соотношение"
          value={avgRatio.toFixed(2)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="#4f46e5"
        />
        <MetricCard
          label="Медиана"
          value={medianRatio.toFixed(2)}
          icon={<CheckCircle className="w-6 h-6" />}
          color="#10b981"
        />
        <MetricCard
          label="Минимум"
          value={minRatio.toFixed(2)}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="#06b6d4"
        />
        <MetricCard
          label="Максимум"
          value={maxRatio.toFixed(2)}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="#f59e0b"
        />
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-right">
        <Card title="Оптимальное соотношение">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-green-600 mb-2">{optimalProjects.length}</div>
            <p className="text-sm text-slate-600 mb-3">
              Проектов ({optimalRange.min}-{optimalRange.max} ИТР/100)
            </p>
            <div className="text-2xl font-semibold text-slate-900">
              {((optimalProjects.length / projects.length) * 100).toFixed(1)}%
            </div>
          </div>
        </Card>
        <Card title="Низкое соотношение">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-orange-600 mb-2">{lowProjects.length}</div>
            <p className="text-sm text-slate-600 mb-3">Проектов (&lt;{optimalRange.min} ИТР/100)</p>
            <div className="text-2xl font-semibold text-slate-900">
              {((lowProjects.length / projects.length) * 100).toFixed(1)}%
            </div>
          </div>
        </Card>
        <Card title="Высокое соотношение">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">{highProjects.length}</div>
            <p className="text-sm text-slate-600 mb-3">Проектов (&gt;{optimalRange.max} ИТР/100)</p>
            <div className="text-2xl font-semibold text-slate-900">
              {((highProjects.length / projects.length) * 100).toFixed(1)}%
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Projects */}
        <Card title="Топ-10 проектов с максимальным ИТР/100" className="animate-fade-in-up">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top10Data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-sm mb-1">{data.fullName}</p>
                        <p className="text-xs text-slate-600">ИТР/100: {data['ИТР/100']}</p>
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

        {/* Scale Analysis */}
        <Card title="Среднее соотношение по масштабу" className="animate-fade-in-up">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={scaleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="Ср. ИТР/100" fill="#4f46e5" label={{ position: 'top' }} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card title="Распределение соотношения ИТР/100 по всем проектам" className="animate-slide-in-right">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="index"
              label={{ value: 'Проекты (отсортировано по убыванию)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis label={{ value: 'ИТР/100 рабочих', angle: -90, position: 'insideLeft' }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-sm mb-1">{data.name}</p>
                      <p className="text-xs text-slate-600">ИТР/100: {data.ratio.toFixed(2)}</p>
                      <p className="text-xs text-slate-600">Рабочих: {data.workers}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="ratio" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-slate-100 rounded-lg">
          <p className="text-sm text-slate-700">
            <strong>Оптимальный диапазон (зеленая зона):</strong> {optimalRange.min}-
            {optimalRange.max} ИТР на 100 рабочих
          </p>
        </div>
      </Card>

      {/* Projects Table */}
      <Card title="Детальная таблица соотношений" className="animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Рейтинг</th>
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
                const statusColor = isOptimal ? 'bg-green-100 text-green-700' : isLow ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';
                const statusText = isOptimal ? 'Оптимально' : isLow ? 'Низкое' : 'Высокое';
                return (
                  <tr key={index}>
                    <td className="text-center text-slate-600">#{index + 1}</td>
                    <td className="font-medium text-slate-900 max-w-xs truncate">
                      {project.project}
                    </td>
                    <td className="text-center">{project.workers_count}</td>
                    <td className="text-center text-primary-600 font-semibold">
                      {project.itr_count}
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold">
                        {project.itr_per_100_workers.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold ${statusColor}`}
                      >
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

      {/* Info Card */}
      <Card className="bg-slate-50 border-slate-200 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-200 rounded-lg">
            <Building2 className="w-6 h-6 text-slate-600" />
          </div>
          <div className="text-sm text-slate-700">
            <p className="mb-2">
              <strong>Интерпретация показателей:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong className="text-green-700">Оптимальное соотношение</strong> (
                {optimalRange.min}-{optimalRange.max}): Сбалансированное управление проектом
              </li>
              <li>
                <strong className="text-orange-700">Низкое соотношение</strong> (&lt;
                {optimalRange.min}): Возможна недостаточность ИТР для эффективного управления
              </li>
              <li>
                <strong className="text-blue-700">Высокое соотношение</strong> (&gt;
                {optimalRange.max}): Возможна избыточность ИТР или малый масштаб проекта
              </li>
              <li>
                Рекомендуемое базовое значение для расчетов: <strong>{medianRatio.toFixed(2)}</strong> (медиана)
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
