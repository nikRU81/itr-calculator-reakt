#!/bin/bash
# Скрипт для push в GitHub с инструкциями

echo "================================================"
echo "📤 Push в GitHub Repository"
echo "================================================"
echo ""
echo "Репозиторий: https://github.com/nikRU81/itr-calculator-reakt"
echo "Ветка: main"
echo ""
echo "🔐 Для push нужен Personal Access Token от GitHub"
echo ""
echo "Как создать токен:"
echo "1. Зайдите на GitHub: https://github.com/settings/tokens"
echo "2. Нажмите 'Generate new token (classic)'"
echo "3. Выберите scopes: ✓ repo (все под-пункты)"
echo "4. Нажмите 'Generate token'"
echo "5. СКОПИРУЙТЕ токен (он больше не появится!)"
echo ""
echo "================================================"
echo ""

# Запрашиваем username
read -p "Введите ваш GitHub username (nikRU81): " username
username=${username:-nikRU81}

echo ""
echo "Теперь выполните команду:"
echo ""
echo "  git push -u origin main"
echo ""
echo "Когда появится запрос:"
echo "  Username: введите '$username'"
echo "  Password: вставьте ваш Personal Access Token (не пароль!)"
echo ""
echo "================================================"
echo ""

# Проверяем текущее состояние
echo "📊 Текущее состояние репозитория:"
git status
echo ""
git log --oneline -3
echo ""
echo "================================================"
echo ""
echo "Готовы к push? Выполните: git push -u origin main"
