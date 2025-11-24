import type { CalculatorConfig, CalculatorResult, PositionBreakdown } from '../types';

export class ITRCalculator {
  private config: CalculatorConfig;

  constructor(config: CalculatorConfig) {
    this.config = config;
  }

  calculateTotalITR(workersCount: number): number {
    const baseRatio = this.config.base_itr_per_100_workers;
    return (workersCount / 100) * baseRatio;
  }

  calculateByPositionGroups(workersCount: number): PositionBreakdown[] {
    const totalITR = this.calculateTotalITR(workersCount);
    const percentages = this.config.position_group_percentages;
    const breakdown: PositionBreakdown[] = [];

    for (const [positionGroup, percentage] of Object.entries(percentages)) {
      const positionITR = (totalITR * percentage) / 100;
      let recommendedCount = Math.ceil(positionITR);

      // Ensure Project Manager has minimum 1
      if (positionGroup === 'ГИП/Руководитель проекта' && recommendedCount < 1) {
        recommendedCount = 1;
      }

      breakdown.push({
        position_group: positionGroup,
        recommended_count: recommendedCount,
        percentage: percentage,
        calculation_details: `${totalITR.toFixed(2)} × ${percentage}% / 100 = ${positionITR.toFixed(2)} ≈ ${recommendedCount}`,
      });
    }

    return breakdown;
  }

  getJustification(projectName: string, workersCount: number): string {
    const totalITR = Math.ceil(this.calculateTotalITR(workersCount));
    const baseRatio = this.config.base_itr_per_100_workers;

    let justification = `Расчет численности ИТР для проекта "${projectName}"\n\n`;
    justification += `Базовый норматив: ${baseRatio.toFixed(2)} ИТР на 100 рабочих\n`;
    justification += `Количество рабочих: ${workersCount}\n`;
    justification += `Расчет: (${workersCount} / 100) × ${baseRatio.toFixed(2)} = ${this.calculateTotalITR(workersCount).toFixed(2)}\n`;
    justification += `Рекомендуемое количество ИТР: ${totalITR} (округлено вверх)\n\n`;
    justification += `Распределение по группам должностей:\n`;

    const breakdown = this.calculateByPositionGroups(workersCount);
    breakdown.forEach((item) => {
      justification += `- ${item.position_group}: ${item.recommended_count} чел. (${item.percentage.toFixed(1)}%)\n`;
    });

    justification += `\nДанные основаны на анализе ${this.config.metadata.projects_count} проектов (${this.config.metadata.data_period})`;

    return justification;
  }

  calculate(projectName: string, workersCount: number): CalculatorResult {
    const totalITR = Math.ceil(this.calculateTotalITR(workersCount));
    const positionBreakdown = this.calculateByPositionGroups(workersCount);
    const justification = this.getJustification(projectName, workersCount);

    return {
      project_name: projectName,
      workers_count: workersCount,
      total_itr_recommended: totalITR,
      itr_per_100_workers: this.config.base_itr_per_100_workers,
      position_breakdown: positionBreakdown,
      justification: justification,
    };
  }
}

export async function loadCalculatorConfig(): Promise<CalculatorConfig> {
  const response = await fetch('/data/calculator_config.json');
  if (!response.ok) {
    throw new Error('Failed to load calculator config');
  }
  return response.json();
}
