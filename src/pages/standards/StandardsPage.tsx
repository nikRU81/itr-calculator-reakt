import Card from '../../components/ui/Card';
import { FileText } from 'lucide-react';

export default function StandardsPage() {
  return (
    <div className="space-y-6">
      <Card className="animate-fade-in-up">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-primary-100 rounded-full mb-4">
            <FileText className="w-12 h-12 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Нормативы компании</h2>
          <p className="text-slate-600 max-w-md">
            Страница с нормативами компании будет реализована в следующей фазе разработки.
            Здесь будут представлены стандарты численности по группам должностей,
            нормативы по масштабу проектов и другие показатели.
          </p>
        </div>
      </Card>
    </div>
  );
}
