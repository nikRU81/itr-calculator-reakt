import Card from '../../components/ui/Card';
import { Users } from 'lucide-react';

export default function LaborPage() {
  return (
    <div className="space-y-6">
      <Card className="animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-primary-100 rounded-full mb-4">
            <Users className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Соотношение ИТР</h2>
          <p className="text-slate-600 max-w-md">
            Страница с соотношением ИТР будет реализована в следующей фазе разработки.
            Здесь будут представлены диаграммы и таблицы с анализом соотношения
            ИТР к рабочим по различным проектам и периодам.
          </p>
        </div>
      </Card>
    </div>
  );
}
