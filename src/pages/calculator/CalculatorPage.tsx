import { useState, useEffect, useMemo } from 'react';
import { Calculator, Users, Briefcase, PieChart, Truck, HardHat, Globe, Shield, Ruler, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import MetricCard from '../../components/ui/MetricCard';
import { useStore } from '../../store/useStore';
import { loadCalculatorConfig } from '../../utils/calculator';

// Определение масштабов проекта
// Коэффициенты рассчитаны на основе ПОМЕСЯЧНОГО анализа 74 реальных проектов:
// - K_prorab: 1 прораб на K рабочих (медиана помесячных данных)
// - K_master: 1 мастер на K рабочих (медиана помесячных данных)
// - K_sklad: 1 кладовщик на K рабочих (медиана помесячных данных)
// Данные: январь-октябрь 2025
const PROJECT_SCALES = [
  { code: 'S', name: 'Малый', minWorkers: 0, maxWorkers: 50, color: '#f59e0b', K_prorab: 22, K_master: 14, K_sklad: 32 },
  { code: 'M', name: 'Средний', minWorkers: 50, maxWorkers: 150, color: '#10b981', K_prorab: 78, K_master: 24, K_sklad: 72 },
  { code: 'L', name: 'Крупный', minWorkers: 150, maxWorkers: 300, color: '#06b6d4', K_prorab: 169, K_master: 19, K_sklad: 81 },
  { code: 'XL', name: 'Очень крупный', minWorkers: 300, maxWorkers: Infinity, color: '#4f46e5', K_prorab: 90, K_master: 24, K_sklad: 494 },
];

// Условные факторы
interface ConditionalFactors {
  hasVehicles: boolean;
  vehicleCount: number;
  hasScaffolding: boolean;
  scaffoldingArea: number;
  hasForeignWorkers: boolean;
  foreignWorkerCount: number;
  hasSecurity: boolean;
  securityPosts: number;
  hasDesignWork: boolean;
}

// Результат расчёта по новой методике
interface MethodologyResult {
  scale: typeof PROJECT_SCALES[0];
  mandatory: {
    name: string;
    formula: string;
    count: number;
    details: string;
  }[];
  conditional: {
    name: string;
    enabled: boolean;
    formula: string;
    count: number;
    details: string;
  }[];
  totalMandatory: number;
  totalConditional: number;
  totalITR: number;
}

export default function CalculatorPage() {
  const [workersCount, setWorkersCount] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<MethodologyResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Условные факторы
  const [factors, setFactors] = useState<ConditionalFactors>({
    hasVehicles: false,
    vehicleCount: 0,
    hasScaffolding: false,
    scaffoldingArea: 0,
    hasForeignWorkers: false,
    foreignWorkerCount: 0,
    hasSecurity: false,
    securityPosts: 0,
    hasDesignWork: false,
  });

  const { calculatorConfig, setCalculatorConfig } = useStore();

  useEffect(() => {
    loadCalculatorConfig().then((config) => {
      setCalculatorConfig(config);
    });
  }, [setCalculatorConfig]);

  // Автоопределение масштаба проекта
  const detectedScale = useMemo(() => {
    if (workersCount <= 0) return null;
    return PROJECT_SCALES.find(
      s => workersCount >= s.minWorkers && workersCount < s.maxWorkers
    ) || PROJECT_SCALES[PROJECT_SCALES.length - 1];
  }, [workersCount]);

  // Расчёт по методике
  const calculateByMethodology = () => {
    if (workersCount <= 0 || !detectedScale) return;

    setCalculating(true);

    setTimeout(() => {
      const scale = detectedScale;

      // Обязательные должности
      const mandatory = [
        {
          name: 'Руководитель проекта',
          formula: '1 на проект',
          count: 1,
          details: 'Всегда 1 человек на проект',
        },
        {
          name: 'Производитель работ',
          formula: `ceil(${workersCount} / ${scale.K_prorab})`,
          count: Math.ceil(workersCount / scale.K_prorab),
          details: `K_прораб для масштаба ${scale.code} = ${scale.K_prorab}`,
        },
        {
          name: 'Мастер',
          formula: `ceil(${workersCount} / ${scale.K_master})`,
          count: Math.ceil(workersCount / scale.K_master),
          details: `K_мастер для масштаба ${scale.code} = ${scale.K_master}`,
        },
        {
          name: 'Специалист по охране труда',
          formula: `ceil(${workersCount} / 50)`,
          count: Math.ceil(workersCount / 50),
          details: 'По законодательству РФ: 1 на 50 работников',
        },
      ];

      // Рассчитаем промежуточный итог ИТР для спец. по общим вопросам
      const tempITR = mandatory.reduce((sum, m) => sum + m.count, 0);

      mandatory.push({
        name: 'Специалист по общим вопросам',
        formula: `ceil(${tempITR} / 15)`,
        count: Math.max(1, Math.ceil(tempITR / 15)),
        details: 'Административная поддержка: 1 на 15 ИТР',
      });

      mandatory.push({
        name: 'Кладовщик / Специалист ОМТС',
        formula: `ceil(${workersCount} / ${scale.K_sklad})`,
        count: Math.ceil(workersCount / scale.K_sklad),
        details: `K_склад для масштаба ${scale.code} = ${scale.K_sklad}`,
      });

      // Условные должности
      const conditional = [
        {
          name: 'Водитель / Механик',
          enabled: factors.hasVehicles,
          formula: factors.hasVehicles ? `ceil(${factors.vehicleCount} / 3)` : '—',
          count: factors.hasVehicles ? Math.max(1, Math.ceil(factors.vehicleCount / 3)) : 0,
          details: factors.hasVehicles
            ? `1 механик на 3 единицы техники (${factors.vehicleCount} ед.)`
            : 'Автотранспорт не используется',
        },
        {
          name: 'Инспектор строительных лесов',
          enabled: factors.hasScaffolding,
          formula: factors.hasScaffolding ? `ceil(${factors.scaffoldingArea} / 500)` : '—',
          count: factors.hasScaffolding ? Math.max(1, Math.ceil(factors.scaffoldingArea / 500)) : 0,
          details: factors.hasScaffolding
            ? `1 инспектор на 500 м² лесов (${factors.scaffoldingArea} м²)`
            : 'Строительные леса не используются',
        },
        {
          name: 'Специалист по сопровождению групп',
          enabled: factors.hasForeignWorkers,
          formula: factors.hasForeignWorkers ? `ceil(${factors.foreignWorkerCount} / 50)` : '—',
          count: factors.hasForeignWorkers ? Math.max(1, Math.ceil(factors.foreignWorkerCount / 50)) : 0,
          details: factors.hasForeignWorkers
            ? `1 специалист на 50 иностранных рабочих (${factors.foreignWorkerCount} чел.)`
            : 'Иностранные рабочие не привлекаются',
        },
        {
          name: 'Сотрудник службы безопасности',
          enabled: factors.hasSecurity,
          formula: factors.hasSecurity ? `${factors.securityPosts} × 2` : '—',
          count: factors.hasSecurity ? factors.securityPosts * 2 : 0,
          details: factors.hasSecurity
            ? `2 человека на пост для сменной работы (${factors.securityPosts} постов)`
            : 'Охрана объекта не требуется',
        },
        {
          name: 'Инженер-конструктор',
          enabled: factors.hasDesignWork,
          formula: factors.hasDesignWork ? '1' : '—',
          count: factors.hasDesignWork ? 1 : 0,
          details: factors.hasDesignWork
            ? 'Минимум 1 специалист для проектных работ'
            : 'Проектные работы на площадке не ведутся',
        },
      ];

      const totalMandatory = mandatory.reduce((sum, m) => sum + m.count, 0);
      const totalConditional = conditional.reduce((sum, c) => sum + c.count, 0);

      setResult({
        scale,
        mandatory,
        conditional,
        totalMandatory,
        totalConditional,
        totalITR: totalMandatory + totalConditional,
      });
      setCalculating(false);
    }, 300);
  };

  const updateFactor = <K extends keyof ConditionalFactors>(
    key: K,
    value: ConditionalFactors[K]
  ) => {
    setFactors(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Параметры расчёта */}
      <Card title="Параметры расчёта" className="animate-fade-in-up">
        <div className="space-y-6">
          {/* Количество рабочих */}
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <Input
              label="Численность рабочих"
              type="number"
              value={workersCount}
              onChange={(value) => setWorkersCount(value as number)}
              placeholder="Введите количество рабочих"
              min={1}
              required
            />

            {/* Автоопределение масштаба */}
            {detectedScale && workersCount > 0 && (
              <div className="p-4 rounded-lg border-2" style={{ borderColor: detectedScale.color, backgroundColor: `${detectedScale.color}15` }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Масштаб проекта:</span>
                  <span
                    className="font-bold text-lg px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: detectedScale.color }}
                  >
                    {detectedScale.code}
                  </span>
                  <span className="font-semibold" style={{ color: detectedScale.color }}>
                    {detectedScale.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {detectedScale.minWorkers}–{detectedScale.maxWorkers === Infinity ? '∞' : detectedScale.maxWorkers} рабочих
                </p>
              </div>
            )}
          </div>

          {/* Условные факторы */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary-600" />
              Условные факторы
              <span className="text-sm font-normal text-slate-500">(влияют на расчёт дополнительных должностей)</span>
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Автотранспорт */}
              <div className={`p-4 rounded-lg border-2 transition-all ${factors.hasVehicles ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factors.hasVehicles}
                    onChange={(e) => updateFactor('hasVehicles', e.target.checked)}
                    className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <Truck className={`w-5 h-5 ${factors.hasVehicles ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${factors.hasVehicles ? 'text-amber-900' : 'text-slate-600'}`}>
                    Автотранспорт
                  </span>
                </label>
                {factors.hasVehicles && (
                  <div className="mt-3 pl-8">
                    <Input
                      label="Количество единиц техники"
                      type="number"
                      value={factors.vehicleCount}
                      onChange={(value) => updateFactor('vehicleCount', value as number)}
                      min={1}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Строительные леса */}
              <div className={`p-4 rounded-lg border-2 transition-all ${factors.hasScaffolding ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factors.hasScaffolding}
                    onChange={(e) => updateFactor('hasScaffolding', e.target.checked)}
                    className="w-5 h-5 rounded text-cyan-500 focus:ring-cyan-500"
                  />
                  <HardHat className={`w-5 h-5 ${factors.hasScaffolding ? 'text-cyan-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${factors.hasScaffolding ? 'text-cyan-900' : 'text-slate-600'}`}>
                    Строительные леса
                  </span>
                </label>
                {factors.hasScaffolding && (
                  <div className="mt-3 pl-8">
                    <Input
                      label="Площадь лесов (м²)"
                      type="number"
                      value={factors.scaffoldingArea}
                      onChange={(value) => updateFactor('scaffoldingArea', value as number)}
                      min={1}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Иностранные рабочие */}
              <div className={`p-4 rounded-lg border-2 transition-all ${factors.hasForeignWorkers ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factors.hasForeignWorkers}
                    onChange={(e) => updateFactor('hasForeignWorkers', e.target.checked)}
                    className="w-5 h-5 rounded text-violet-500 focus:ring-violet-500"
                  />
                  <Globe className={`w-5 h-5 ${factors.hasForeignWorkers ? 'text-violet-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${factors.hasForeignWorkers ? 'text-violet-900' : 'text-slate-600'}`}>
                    Иностранные рабочие
                  </span>
                </label>
                {factors.hasForeignWorkers && (
                  <div className="mt-3 pl-8">
                    <Input
                      label="Количество иностр. рабочих"
                      type="number"
                      value={factors.foreignWorkerCount}
                      onChange={(value) => updateFactor('foreignWorkerCount', value as number)}
                      min={1}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Охрана объекта */}
              <div className={`p-4 rounded-lg border-2 transition-all ${factors.hasSecurity ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factors.hasSecurity}
                    onChange={(e) => updateFactor('hasSecurity', e.target.checked)}
                    className="w-5 h-5 rounded text-red-500 focus:ring-red-500"
                  />
                  <Shield className={`w-5 h-5 ${factors.hasSecurity ? 'text-red-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${factors.hasSecurity ? 'text-red-900' : 'text-slate-600'}`}>
                    Охрана объекта
                  </span>
                </label>
                {factors.hasSecurity && (
                  <div className="mt-3 pl-8">
                    <Input
                      label="Количество постов"
                      type="number"
                      value={factors.securityPosts}
                      onChange={(value) => updateFactor('securityPosts', value as number)}
                      min={1}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {/* Проектные работы */}
              <div className={`p-4 rounded-lg border-2 transition-all ${factors.hasDesignWork ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={factors.hasDesignWork}
                    onChange={(e) => updateFactor('hasDesignWork', e.target.checked)}
                    className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <Ruler className={`w-5 h-5 ${factors.hasDesignWork ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${factors.hasDesignWork ? 'text-emerald-900' : 'text-slate-600'}`}>
                    Проектные работы
                  </span>
                </label>
                {factors.hasDesignWork && (
                  <p className="mt-2 pl-8 text-sm text-emerald-700">
                    Будет добавлен инженер-конструктор
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка расчёта */}
          <div className="flex justify-center pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={calculateByMethodology}
              disabled={workersCount <= 0 || calculating}
            >
              <Calculator className="w-5 h-5" />
              {calculating ? 'Выполняется расчёт...' : 'Рассчитать численность ИТР'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Результаты */}
      {result && (
        <>
          {/* Метрики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            <MetricCard
              label="Численность рабочих"
              value={workersCount}
              icon={<Users className="w-6 h-6" />}
              color="#4f46e5"
            />
            <MetricCard
              label="Обязательные ИТР"
              value={result.totalMandatory}
              icon={<Briefcase className="w-6 h-6" />}
              color="#10b981"
            />
            <MetricCard
              label="Условные ИТР"
              value={result.totalConditional}
              icon={<PieChart className="w-6 h-6" />}
              color="#f59e0b"
            />
            <MetricCard
              label="Всего ИТР"
              value={result.totalITR}
              icon={<Calculator className="w-6 h-6" />}
              color={result.scale.color}
            />
          </div>

          {/* Таблица обязательных должностей */}
          <Card
            title="🟢 Обязательные должности"
            className="animate-slide-in-right"
          >
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Должность</th>
                    <th className="text-center">Формула</th>
                    <th className="text-center">Количество</th>
                  </tr>
                </thead>
                <tbody>
                  {result.mandatory.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.details}</div>
                      </td>
                      <td className="text-center font-mono text-sm text-slate-600">
                        {item.formula}
                      </td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-50 font-bold">
                    <td colSpan={2}>Итого обязательных</td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-green-600 text-white rounded-lg font-semibold">
                        {result.totalMandatory}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Таблица условных должностей */}
          <Card
            title="🟡 Условные должности"
            className="animate-slide-in-right"
          >
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Должность</th>
                    <th className="text-center">Условие</th>
                    <th className="text-center">Формула</th>
                    <th className="text-center">Количество</th>
                  </tr>
                </thead>
                <tbody>
                  {result.conditional.map((item, index) => (
                    <tr key={index} className={!item.enabled ? 'opacity-50' : ''}>
                      <td>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.details}</div>
                      </td>
                      <td className="text-center">
                        {item.enabled ? (
                          <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            ✓ Да
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                            Нет
                          </span>
                        )}
                      </td>
                      <td className="text-center font-mono text-sm text-slate-600">
                        {item.formula}
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg font-semibold ${
                          item.count > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {item.count}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50 font-bold">
                    <td colSpan={3}>Итого условных</td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-amber-500 text-white rounded-lg font-semibold">
                        {result.totalConditional}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Итоговый результат */}
          <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div
                  className="p-4 rounded-xl text-white"
                  style={{ backgroundColor: result.scale.color }}
                >
                  <Calculator className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Рекомендуемая численность ИТР
                  </h3>
                  <p className="text-slate-600">
                    Масштаб проекта: <span className="font-semibold">{result.scale.name} ({result.scale.code})</span>
                  </p>
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-5xl font-bold text-white px-8 py-4 rounded-xl"
                  style={{ backgroundColor: result.scale.color }}
                >
                  {result.totalITR}
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {result.totalMandatory} обязательных + {result.totalConditional} условных
                </p>
              </div>
            </div>

            {/* Детали расчёта */}
            <div className="mt-6 pt-6 border-t border-primary-200">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showDetails ? 'Скрыть детали расчёта' : 'Показать детали расчёта'}
              </button>

              {showDetails && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
{`Расчёт численности ИТР (${workersCount} рабочих)
Масштаб проекта: ${result.scale.name} (${result.scale.code})

═══════════════════════════════════════════════════
ОБЯЗАТЕЛЬНЫЕ ДОЛЖНОСТИ (${result.totalMandatory} чел.)
═══════════════════════════════════════════════════
${result.mandatory.map(m => `• ${m.name}: ${m.count} чел.\n  Формула: ${m.formula}\n  ${m.details}`).join('\n\n')}

═══════════════════════════════════════════════════
УСЛОВНЫЕ ДОЛЖНОСТИ (${result.totalConditional} чел.)
═══════════════════════════════════════════════════
${result.conditional.map(c => `• ${c.name}: ${c.count} чел. ${c.enabled ? '✓' : '✗'}\n  ${c.details}`).join('\n\n')}

═══════════════════════════════════════════════════
ИТОГО: ${result.totalITR} ИТР
═══════════════════════════════════════════════════

Коэффициенты для масштаба ${result.scale.code}:
• K_прораб = ${result.scale.K_prorab} (1 прораб на ${result.scale.K_prorab} рабочих)
• K_мастер = ${result.scale.K_master} (1 мастер на ${result.scale.K_master} рабочих)
• K_склад = ${result.scale.K_sklad} (1 кладовщик на ${result.scale.K_sklad} рабочих)

Данные основаны на анализе ${calculatorConfig?.metadata?.projects_count || 74} проектов`}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Информационная карточка */}
      {!result && calculatorConfig && (
        <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calculator className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Как работает калькулятор?
              </h3>
              <div className="space-y-3 text-slate-700">
                <p>
                  Калькулятор использует <span className="font-semibold text-primary-600">новую методику расчёта</span>,
                  основанную на анализе {calculatorConfig.metadata.projects_count} реальных проектов.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      🟢 Обязательные должности
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Рассчитываются автоматически по численности рабочих с учётом масштаба проекта
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                      🟡 Условные должности
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Добавляются при наличии специфических условий (техника, леса, охрана и т.д.)
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                  <h4 className="font-semibold text-slate-800">Масштабы проектов:</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PROJECT_SCALES.map(scale => (
                      <span
                        key={scale.code}
                        className="px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: scale.color }}
                      >
                        {scale.code}: {scale.name} ({scale.minWorkers}–{scale.maxWorkers === Infinity ? '∞' : scale.maxWorkers})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
