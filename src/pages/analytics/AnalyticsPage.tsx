import { useState, useEffect } from 'react';
import {
  BarChart3,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Filter,
} from 'lucide-react';
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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scaleFilter, setScaleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const projectsData = await loadProjects();
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((project) =>
        project.project.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply scale filter
    if (scaleFilter !== 'all') {
      filtered = filtered.filter((project) => project.project_scale === scaleFilter);
    }

    setFilteredProjects(filtered);
  }, [searchQuery, scaleFilter, projects]);

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
  const totalProjects = filteredProjects.length;
  const totalITR = filteredProjects.reduce((sum, p) => sum + p.itr_count, 0);
  const totalWorkers = filteredProjects.reduce((sum, p) => sum + p.workers_count, 0);
  const avgRatio =
    totalWorkers > 0
      ? filteredProjects
          .filter((p) => p.itr_per_100_workers !== null)
          .reduce((sum, p) => sum + p.itr_per_100_workers!, 0) /
        filteredProjects.filter((p) => p.itr_per_100_workers !== null).length
      : 0;

  // Prepare data for charts
  const scaleDistribution = filteredProjects.reduce((acc, project) => {
    const scale = project.project_scale;
    if (!acc[scale]) {
      acc[scale] = 0;
    }
    acc[scale]++;
    return acc;
  }, {} as Record<string, number>);

  const scaleData = Object.entries(scaleDistribution).map(([scale, count]) => ({
    name:
      scale === 'Small'
        ? 'Малый'
        : scale === 'Medium'
        ? 'Средний'
        : scale === 'Large'
        ? 'Большой'
        : 'Очень большой',
    count,
    scale,
  }));

  const scatterData = filteredProjects
    .filter((p) => p.itr_per_100_workers !== null && p.workers_count > 0)
    .map((p) => ({
      x: p.workers_count,
      y: p.itr_count,
      z: p.itr_per_100_workers!,
      name: p.project,
      scale: p.project_scale,
    }));

  const SCALE_COLORS = {
    Small: '#f59e0b',
    Medium: '#10b981',
    Large: '#06b6d4',
    'Very Large': '#4f46e5',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Аналитика проектов</h3>
            <p className="text-slate-700">
              Анализ {totalProjects} проектов по численности ИТР и рабочих
            </p>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
        <MetricCard
          label="Всего проектов"
          value={totalProjects}
          icon={<Building2 className="w-6 h-6" />}
          color="#4f46e5"
        />
        <MetricCard
          label="Общая численность ИТР"
          value={totalITR}
          icon={<Briefcase className="w-6 h-6" />}
          color="#10b981"
        />
        <MetricCard
          label="Общая численность рабочих"
          value={totalWorkers}
          icon={<Users className="w-6 h-6" />}
          color="#06b6d4"
        />
        <MetricCard
          label="Среднее ИТР/100"
          value={avgRatio.toFixed(2)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="#f59e0b"
        />
      </div>

      {/* Filters */}
      <Card title="Фильтры" className="animate-slide-in-right">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по названию проекта..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={scaleFilter}
              onChange={(e) => setScaleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">Все масштабы</option>
              <option value="Small">Малый</option>
              <option value="Medium">Средний</option>
              <option value="Large">Большой</option>
              <option value="Very Large">Очень большой</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scale Distribution */}
        <Card title="Распределение по масштабу" className="animate-fade-in-up">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scaleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#4f46e5"
                label={{ position: 'top' }}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Scatter Plot */}
        <Card title="Соотношение рабочих и ИТР" className="animate-fade-in-up">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Рабочие"
                label={{ value: 'Рабочие', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="ИТР"
                label={{ value: 'ИТР', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 400]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                        <p className="font-semibold text-sm mb-1">{data.name}</p>
                        <p className="text-xs text-slate-600">Рабочие: {data.x}</p>
                        <p className="text-xs text-slate-600">ИТР: {data.y}</p>
                        <p className="text-xs text-slate-600">
                          Соотношение: {data.z.toFixed(2)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={scatterData} fill="#4f46e5" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Projects Table */}
      <Card title={`Список проектов (${totalProjects})`} className="animate-slide-in-right">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Проект</th>
                <th className="text-center">Масштаб</th>
                <th className="text-center">Рабочие</th>
                <th className="text-center">ИТР</th>
                <th className="text-center">ИТР/100</th>
                <th className="text-center">FTE ИТР</th>
                <th className="text-center">FTE Рабочие</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => {
                const scaleName =
                  project.project_scale === 'Small'
                    ? 'Малый'
                    : project.project_scale === 'Medium'
                    ? 'Средний'
                    : project.project_scale === 'Large'
                    ? 'Большой'
                    : 'Очень большой';
                const scaleColor =
                  SCALE_COLORS[project.project_scale as keyof typeof SCALE_COLORS];
                return (
                  <tr key={index}>
                    <td className="font-medium text-slate-900 max-w-xs truncate">
                      {project.project}
                    </td>
                    <td className="text-center">
                      <span
                        className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-semibold text-white"
                        style={{ backgroundColor: scaleColor }}
                      >
                        {scaleName}
                      </span>
                    </td>
                    <td className="text-center">{project.workers_count}</td>
                    <td className="text-center">
                      <span className="font-semibold text-primary-600">{project.itr_count}</span>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold">
                        {project.itr_per_100_workers !== null
                          ? project.itr_per_100_workers.toFixed(2)
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="text-center text-slate-600">{project.itr_fte.toFixed(2)}</td>
                    <td className="text-center text-slate-600">
                      {project.workers_fte.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <Card className="bg-slate-50 border-slate-200">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="text-sm font-semibold text-slate-700">Масштабы проектов:</div>
          {Object.entries(SCALE_COLORS).map(([scale, color]) => {
            const scaleName =
              scale === 'Small'
                ? 'Малый (< 50)'
                : scale === 'Medium'
                ? 'Средний (50-100)'
                : scale === 'Large'
                ? 'Большой (100-200)'
                : 'Очень большой (> 200)';
            return (
              <div key={scale} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-sm text-slate-700">{scaleName}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
