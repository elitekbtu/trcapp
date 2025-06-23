# Исправления фронтенда для соответствия OpenAPI v0.1.0

## Обзор

Фронтенд приложения TRC был полностью обновлен для соответствия новой OpenAPI спецификации v0.1.0. Все изменения направлены на улучшение типизации, исправление ошибок компиляции и приведение кода к единому стилю.

## Основные исправления

### 1. Схемы API (frontend/src/api/schemas.ts)

**Проблемы:**
- Дублирование интерфейса `OutfitOut` с конфликтующими типами
- Несоответствие типов `owner_id` (string vs number)
- Отсутствие новых типов для корзины

**Исправления:**
- Удален дублирующий интерфейс `OutfitOut`
- Добавлены новые типы для корзины: `CartItemResponse`, `CartSummary`, `CartResponse`
- Добавлены типы для образов: `OutfitItemCreate`, `OutfitCreate`, `OutfitUpdate`
- Исправлены конфликты типов

### 2. Типы корзины (frontend/src/types/cart.ts)

**Проблемы:**
- Неправильное использование `export type` синтаксиса
- Отсутствие типа `CartItemResponse`

**Исправления:**
- Переписан на использование `import type` с re-export
- Добавлен псевдоним `CartItem = CartItemResponse` для совместимости
- Исправлен тип `CartItemWithActions`

### 3. Компонент корзины (frontend/src/components/cart/CartItem.tsx)

**Проблемы:**
- Отсутствие проверок на `undefined` для опциональных полей
- Неправильные типы свойств

**Исправления:**
- Добавлены проверки `?? false` и `?? true` для булевых полей
- Добавлены проверки `?? 0` для числовых полей
- Исправлены все обращения к свойствам объекта

### 4. Утилиты корзины (frontend/src/utils/cart.ts)

**Проблемы:**
- Ошибки смешивания операторов `&&` и `??`
- Отсутствие проверок на `undefined`

**Исправления:**
- Добавлены скобки для правильного порядка операций: `((item.is_reserved ?? false) && ...)`
- Добавлены проверки на `undefined` для всех опциональных полей
- Исправлены типы функций

### 5. Сводка корзины (frontend/src/components/cart/CartSummary.tsx)

**Проблемы:**
- Отсутствие проверок на `undefined` для `summary.total`

**Исправления:**
- Добавлены проверки `?? 0` для всех числовых полей
- Исправлены условия проверки

### 6. Основные компоненты

**frontend/src/components/Main/Cart.tsx:**
- Исправлены проверки `cart.summary.items_count`

**frontend/src/features/cart/CartDrawer.tsx:**
- Исправлены проверки `cart.summary.items_count`

**frontend/src/components/Main/Items/ItemDetail.tsx:**
- Исправлены проверки `c.likes ?? 0`

**frontend/src/components/Main/Outfits/OutfitDetail.tsx:**
- Исправлены проверки `c.likes ?? 0`

### 7. Настройки профиля (frontend/src/components/Main/Settings.tsx)

**Проблемы:**
- Неправильные типы для `favorite_colors` и `favorite_brands` (string vs string[])

**Исправления:**
- Изменены типы на массивы `string[]`
- Упрощена обработка данных профиля

### 8. Административные компоненты

**frontend/src/components/Admin/UserForm.tsx:**
- Исправлены импорты: `createUser` → `createUserAdmin`, `updateUser` → `updateUserAdmin`

**frontend/src/components/Admin/OutfitForm.tsx:**
- Полностью переписан для работы с новой структурой `OutfitCreate`
- Заменены отдельные массивы ID на единый массив `items`
- Добавлены новые поля: `tags`, `season`, `occasion`, `outfit_type`
- Заменены компоненты Select на обычные HTML select элементы

### 9. Список образов (frontend/src/components/Main/Outfits/OutfitsList.tsx)

**Проблемы:**
- Обращение к несуществующим свойствам `tops`, `bottoms`, `footwear`, `accessories`

**Исправления:**
- Заменено на `Object.values(data.items).flat()[0]` для получения первого элемента

### 10. API методы

**frontend/src/api/users.ts:**
- Добавлены методы для управления пользователями и их контентом

**frontend/src/api/profile.ts:**
- Создан новый файл для работы с профилем

**frontend/src/api/auth.ts:**
- Добавлен метод обновления токенов

## Результат

✅ Все ошибки TypeScript исправлены
✅ Сборка проходит успешно
✅ Код приведен к единому стилю
✅ Добавлены необходимые проверки на undefined
✅ Обновлена структура данных в соответствие с новой API

## Команды для проверки

```bash
# Проверка типов
cd frontend && npm run build

# Запуск в режиме разработки
cd frontend && npm run dev
```

## Примечания

1. Все изменения обратно совместимы
2. Добавлены проверки на undefined для повышения надежности
3. Код стал более типизированным и безопасным
4. Структура данных приведена в соответствие с OpenAPI спецификацией 