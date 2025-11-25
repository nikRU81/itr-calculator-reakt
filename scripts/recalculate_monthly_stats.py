#!/usr/bin/env python3
"""
Скрипт для пересчёта статистики ИТР с использованием помесячных данных.

Текущий метод (неправильный):
- Считает уникальных людей за весь период (Январь-Октябрь)
- Это завышает количество, т.к. люди работают несколько месяцев

Правильный метод:
- Для каждого проекта+месяца считаем уникальных ИТР и рабочих
- Вычисляем K коэффициент за каждый месяц
- Агрегируем через средневзвешенное (взвешенное по количеству рабочих)
"""

import json
from pathlib import Path
from collections import defaultdict
import statistics

# Пути к файлам данных
DATA_DIR = Path(__file__).parent.parent / "public" / "data"
ITR_FILE = DATA_DIR / "itr_data_2025.json"
WORKERS_FILE = DATA_DIR / "workers_data_2025.json"
PROJECTS_OUTPUT = DATA_DIR / "projects_analysis.json"
POSITION_OUTPUT = DATA_DIR / "position_distribution.json"

# Порядок месяцев
MONTHS_ORDER = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]

# Классификация масштаба проекта
def get_project_scale(avg_workers: float) -> str:
    if avg_workers < 50:
        return "Small"
    elif avg_workers < 150:
        return "Medium"
    elif avg_workers < 300:
        return "Large"
    else:
        return "Very Large"


def load_json(filepath: Path) -> list:
    """Загружает JSON файл."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(filepath: Path, data: list) -> None:
    """Сохраняет JSON файл с форматированием."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def calculate_monthly_stats():
    """Основная функция расчёта помесячной статистики."""
    print("Загрузка данных...")
    itr_data = load_json(ITR_FILE)
    workers_data = load_json(WORKERS_FILE)

    print(f"  ITR записей: {len(itr_data)}")
    print(f"  Workers записей: {len(workers_data)}")

    # Группируем ITR по проекту и месяцу
    # Структура: {project: {month: {position_group: set(personnel_numbers)}}}
    itr_by_project_month = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))
    itr_hours_by_project_month = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

    for record in itr_data:
        project = record['project']
        month = record['month']
        position_group = record['position_group']
        personnel_number = record['personnel_number']
        hours = record.get('hours', 0)

        itr_by_project_month[project][month][position_group].add(personnel_number)
        itr_hours_by_project_month[project][month][position_group] += hours

    # Группируем Workers по проекту и месяцу
    # Структура: {project: {month: set(personnel_numbers)}}
    workers_by_project_month = defaultdict(lambda: defaultdict(set))
    workers_hours_by_project_month = defaultdict(lambda: defaultdict(int))

    for record in workers_data:
        project = record['project']
        month = record['month']
        personnel_number = record['personnel_number']
        hours = record.get('hours', 0)

        workers_by_project_month[project][month].add(personnel_number)
        workers_hours_by_project_month[project][month] += hours

    # Получаем все проекты
    all_projects = set(itr_by_project_month.keys()) | set(workers_by_project_month.keys())
    print(f"\nВсего проектов: {len(all_projects)}")

    # Рассчитываем статистику для каждого проекта
    projects_analysis = []
    position_distribution = []

    # Для расчёта средневзвешенных K коэффициентов по масштабам
    k_by_scale_position = defaultdict(lambda: defaultdict(list))

    for project in sorted(all_projects):
        # Собираем помесячные данные
        monthly_workers = []  # [(month, count)]
        monthly_itr = []  # [(month, count)]
        monthly_hours_workers = []
        monthly_hours_itr = []
        monthly_itr_per_100 = []  # [(month, ratio, workers_count)]

        # Помесячная статистика по должностям
        # {position_group: [(month, itr_count, workers_count, K)]}
        position_monthly = defaultdict(list)

        for month in MONTHS_ORDER:
            workers_count = len(workers_by_project_month[project].get(month, set()))
            workers_hours = workers_hours_by_project_month[project].get(month, 0)

            if workers_count > 0:
                monthly_workers.append((month, workers_count))
                monthly_hours_workers.append(workers_hours)

                # Считаем ITR за этот месяц
                itr_count_total = 0
                itr_hours_total = 0

                for position_group, personnel_set in itr_by_project_month[project].get(month, {}).items():
                    itr_count = len(personnel_set)
                    itr_count_total += itr_count
                    itr_hours_total += itr_hours_by_project_month[project][month][position_group]

                    # K коэффициент для этой должности в этом месяце
                    K = workers_count / itr_count if itr_count > 0 else None
                    position_monthly[position_group].append({
                        'month': month,
                        'itr_count': itr_count,
                        'workers_count': workers_count,
                        'K': K
                    })

                if itr_count_total > 0:
                    monthly_itr.append((month, itr_count_total))
                    monthly_hours_itr.append(itr_hours_total)
                    itr_per_100 = (itr_count_total / workers_count) * 100
                    monthly_itr_per_100.append((month, itr_per_100, workers_count))

        if not monthly_workers:
            continue

        # Рассчитываем средневзвешенные показатели для проекта
        total_workers_weight = sum(w[1] for w in monthly_workers)
        avg_workers = total_workers_weight / len(monthly_workers) if monthly_workers else 0

        # Средневзвешенное ITR per 100 workers
        if monthly_itr_per_100:
            weighted_sum = sum(ratio * weight for _, ratio, weight in monthly_itr_per_100)
            total_weight = sum(weight for _, _, weight in monthly_itr_per_100)
            avg_itr_per_100 = weighted_sum / total_weight if total_weight > 0 else 0
        else:
            avg_itr_per_100 = 0

        # Медианные значения для более устойчивой оценки
        itr_counts = [itr[1] for itr in monthly_itr]
        workers_counts = [w[1] for w in monthly_workers]

        median_itr = statistics.median(itr_counts) if itr_counts else 0
        median_workers = statistics.median(workers_counts) if workers_counts else 0

        # Общие часы (сумма за все месяцы)
        total_workers_hours = sum(monthly_hours_workers)
        total_itr_hours = sum(monthly_hours_itr)

        # FTE (Full-Time Equivalent) - 200 часов в месяц
        workers_fte = round(total_workers_hours / 200, 2)
        itr_fte = round(total_itr_hours / 200, 2)

        # Уникальные люди за весь период (для справки)
        unique_itr = set()
        for month_data in itr_by_project_month[project].values():
            for personnel_set in month_data.values():
                unique_itr.update(personnel_set)

        unique_workers = set()
        for month_personnel in workers_by_project_month[project].values():
            unique_workers.update(month_personnel)

        project_scale = get_project_scale(avg_workers)

        # Формируем запись для projects_analysis
        project_record = {
            "project": project,
            "itr_count": len(unique_itr),  # Уникальные ИТР за период (для совместимости)
            "itr_count_avg_monthly": round(statistics.mean(itr_counts), 1) if itr_counts else 0,
            "itr_count_median_monthly": round(median_itr, 1),
            "itr_hours": total_itr_hours,
            "workers_count": len(unique_workers),  # Уникальные рабочие за период
            "workers_count_avg_monthly": round(avg_workers, 1),
            "workers_count_median_monthly": round(median_workers, 1),
            "workers_hours": total_workers_hours,
            "itr_per_100_workers": round(avg_itr_per_100, 2),  # Средневзвешенный показатель
            "itr_fte": itr_fte,
            "workers_fte": workers_fte,
            "project_scale": project_scale,
            "months_active": len(monthly_workers)
        }
        projects_analysis.append(project_record)

        # Формируем записи для position_distribution
        for position_group, monthly_data in position_monthly.items():
            if not monthly_data:
                continue

            # Считаем средневзвешенное количество ИТР этой должности
            weighted_itr_sum = sum(d['itr_count'] * d['workers_count'] for d in monthly_data)
            total_weight = sum(d['workers_count'] for d in monthly_data)
            avg_itr_count = weighted_itr_sum / total_weight if total_weight > 0 else 0

            # Медиана количества ИТР
            itr_counts_pos = [d['itr_count'] for d in monthly_data]
            median_itr_count = statistics.median(itr_counts_pos) if itr_counts_pos else 0

            # K коэффициенты (только где есть ИТР)
            k_values = [d['K'] for d in monthly_data if d['K'] is not None]
            if k_values:
                avg_k = statistics.mean(k_values)
                median_k = statistics.median(k_values)

                # Добавляем в статистику по масштабам
                k_by_scale_position[project_scale][position_group].append({
                    'project': project,
                    'K_avg': avg_k,
                    'K_median': median_k,
                    'avg_workers': avg_workers,
                    'months': len(k_values)
                })
            else:
                avg_k = None
                median_k = None

            position_record = {
                "project": project,
                "position_group": position_group,
                "count": len(set().union(*(
                    itr_by_project_month[project].get(m, {}).get(position_group, set())
                    for m in MONTHS_ORDER
                ))),  # Уникальные за период (для совместимости)
                "count_avg_monthly": round(avg_itr_count, 2),
                "count_median_monthly": round(median_itr_count, 1),
                "K_avg": round(avg_k, 1) if avg_k else None,
                "K_median": round(median_k, 1) if median_k else None,
                "project_scale": project_scale,
                "avg_workers_monthly": round(avg_workers, 1)
            }
            position_distribution.append(position_record)

    # Сортируем projects_analysis по workers_count_avg_monthly (убывание)
    projects_analysis.sort(key=lambda x: x['workers_count_avg_monthly'], reverse=True)

    # Сортируем position_distribution по project, затем position_group
    position_distribution.sort(key=lambda x: (x['project'], x['position_group']))

    # Сохраняем результаты
    print("\nСохранение результатов...")
    save_json(PROJECTS_OUTPUT, projects_analysis)
    print(f"  Сохранено {len(projects_analysis)} проектов в {PROJECTS_OUTPUT.name}")

    save_json(POSITION_OUTPUT, position_distribution)
    print(f"  Сохранено {len(position_distribution)} записей в {POSITION_OUTPUT.name}")

    # Выводим сводную статистику по K коэффициентам
    print("\n" + "="*60)
    print("СВОДНАЯ СТАТИСТИКА K КОЭФФИЦИЕНТОВ ПО МАСШТАБАМ")
    print("="*60)

    for scale in ["Small", "Medium", "Large", "Very Large"]:
        print(f"\n### Масштаб: {scale}")
        positions_data = k_by_scale_position.get(scale, {})

        if not positions_data:
            print("  Нет данных")
            continue

        for position_group in sorted(positions_data.keys()):
            projects_k = positions_data[position_group]
            if not projects_k:
                continue

            # Взвешенное среднее K (взвешенное по avg_workers)
            total_weight = sum(p['avg_workers'] for p in projects_k)
            weighted_k = sum(p['K_median'] * p['avg_workers'] for p in projects_k) / total_weight if total_weight > 0 else 0

            # Медиана K
            k_medians = [p['K_median'] for p in projects_k]
            overall_median_k = statistics.median(k_medians)

            min_k = min(k_medians)
            max_k = max(k_medians)

            print(f"\n  {position_group}:")
            print(f"    Проектов: {len(projects_k)}")
            print(f"    K средневзвеш: {weighted_k:.1f}")
            print(f"    K медиана:     {overall_median_k:.1f}")
            print(f"    K диапазон:    {min_k:.1f} - {max_k:.1f}")

    # Выводим рекомендуемые коэффициенты
    print("\n" + "="*60)
    print("РЕКОМЕНДУЕМЫЕ КОЭФФИЦИЕНТЫ ДЛЯ КАЛЬКУЛЯТОРА")
    print("="*60)

    key_positions = ["Мастер", "Производитель работ", "Кладовщик / Работник склада / Специалист ОМТС"]

    for position in key_positions:
        print(f"\n{position}:")
        for scale in ["Small", "Medium", "Large", "Very Large"]:
            positions_data = k_by_scale_position.get(scale, {})
            if position in positions_data:
                projects_k = positions_data[position]
                k_medians = [p['K_median'] for p in projects_k]
                if k_medians:
                    median_k = statistics.median(k_medians)
                    print(f"  {scale:12s}: K = {median_k:.0f} ({len(projects_k)} проектов)")

    return projects_analysis, position_distribution


if __name__ == "__main__":
    calculate_monthly_stats()
