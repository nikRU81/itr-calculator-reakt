import { useState, useEffect } from 'react';
import { Calculator, Users, Briefcase, PieChart } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import MetricCard from '../../components/ui/MetricCard';
import { useStore } from '../../store/useStore';
import { ITRCalculator, loadCalculatorConfig } from '../../utils/calculator';

export default function CalculatorPage() {
  const [projectName, setProjectName] = useState('');
  const [workersCount, setWorkersCount] = useState<number>(0);
  const [calculating, setCalculating] = useState(false);
  const [calculator, setCalculator] = useState<ITRCalculator | null>(null);

  const { calculatorResult, setCalculatorResult, calculatorConfig, setCalculatorConfig } = useStore();

  useEffect(() => {
    loadCalculatorConfig().then((config) => {
      setCalculatorConfig(config);
      setCalculator(new ITRCalculator(config));
    });
  }, [setCalculatorConfig]);

  const handleCalculate = () => {
    if (!calculator || !projectName || workersCount <= 0) {
      return;
    }

    setCalculating(true);

    // Simulate calculation delay for UX
    setTimeout(() => {
      const result = calculator.calculate(projectName, workersCount);
      setCalculatorResult(result);
      setCalculating(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card title="Параметры расчета" className="animate-fade-in-up">
        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="Название проекта"
            value={projectName}
            onChange={(value) => setProjectName(value as string)}
            placeholder="Введите название проекта"
            required
          />
          <Input
            label="Количество рабочих"
            type="number"
            value={workersCount}
            onChange={(value) => setWorkersCount(value as number)}
            placeholder="Введите количество рабочих"
            min={1}
            required
          />
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCalculate}
            disabled={!projectName || workersCount <= 0 || calculating}
          >
            <Calculator className="w-5 h-5" />
            {calculating ? 'Выполняется расчет...' : 'Рассчитать численность ИТР'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {calculatorResult && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            <MetricCard
              label="Количество рабочих"
              value={calculatorResult.workers_count}
              icon={<Users className="w-6 h-6" />}
              color="#4f46e5"
            />
            <MetricCard
              label="Рекомендуемое ИТР"
              value={calculatorResult.total_itr_recommended}
              icon={<Briefcase className="w-6 h-6" />}
              color="#10b981"
            />
            <MetricCard
              label="ИТР на 100 рабочих"
              value={calculatorResult.itr_per_100_workers.toFixed(2)}
              icon={<PieChart className="w-6 h-6" />}
              color="#06b6d4"
            />
            <MetricCard
              label="Группы должностей"
              value={calculatorResult.position_breakdown.length}
              icon={<Calculator className="w-6 h-6" />}
              color="#f59e0b"
            />
          </div>

          {/* Position Breakdown Table */}
          <Card title="Распределение по группам должностей" className="animate-slide-in-right">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Группа должностей</th>
                    <th className="text-center">Процент (%)</th>
                    <th className="text-center">Рекомендуемое количество</th>
                  </tr>
                </thead>
                <tbody>
                  {calculatorResult.position_breakdown.map((item, index) => (
                    <tr key={index}>
                      <td className="font-medium text-slate-900">{item.position_group}</td>
                      <td className="text-center">{item.percentage.toFixed(1)}%</td>
                      <td className="text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 bg-primary-100 text-primary-700 rounded-lg font-semibold">
                          {item.recommended_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold">
                    <td>ИТОГО</td>
                    <td className="text-center">100%</td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 bg-primary-600 text-white rounded-lg font-semibold">
                        {calculatorResult.total_itr_recommended}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Justification */}
          <Card title="Обоснование расчета" className="animate-fade-in-up">
            <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-lg font-mono">
              {calculatorResult.justification}
            </pre>
          </Card>
        </>
      )}

      {/* Info Card */}
      {!calculatorResult && calculatorConfig && (
        <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 border-primary-200 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Calculator className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Как работает калькулятор?
              </h3>
              <p className="text-slate-700 mb-3">
                Калькулятор использует базовый норматив{' '}
                <span className="font-bold text-primary-600">
                  {calculatorConfig.base_itr_per_100_workers.toFixed(2)} ИТР на 100 рабочих
                </span>
                , рассчитанный на основе анализа {calculatorConfig.metadata.projects_count} реальных
                проектов за период {calculatorConfig.metadata.data_period}.
              </p>
              <p className="text-sm text-slate-600">
                Распределение по группам должностей выполняется автоматически с учетом статистики
                компании и округлением вверх для обеспечения достаточной численности персонала.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
