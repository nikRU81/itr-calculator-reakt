import Card from '../../components/ui/Card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Card className="animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-primary-100 rounded-full mb-4">
            <BarChart3 className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Аналитика проектов</h2>
          <p className="text-slate-600 max-w-md">
            Страница с аналитикой проектов будет реализована в следующей фазе разработки.
            Здесь будут представлены диаграммы распределения проектов по масштабу,
            анализ численности ИТР и другие метрики.
          </p>
        </div>
      </Card>
    </div>
  );
}
