# API Updates для соответствия OpenAPI Specification v0.1.0

## Обзор изменений

Фронтенд был обновлен для соответствия новой OpenAPI спецификации TRC Backend v0.1.0. Все изменения направлены на улучшение типизации, добавление новых эндпоинтов и приведение в соответствие с актуальной структурой API.

## Основные изменения

### 1. Обновленные типы данных (schemas.ts)

#### Корзина (Cart)
- **CartItemResponse**: Новый тип для ответов API корзины
- **CartSummary**: Обновлена структура с опциональными полями
- **CartResponse**: Новая структура ответа с items и summary
- **CartItemOut**: Упрощенная структура для совместимости
- **CartStateOut**: Старая структура для deprecated endpoints

#### Образы (Outfits)  
- **OutfitItemCreate**: Новая структура для создания элементов образа
- **OutfitCreate**: Обновлена структура с новыми полями (tags, season, occasion, outfit_type)
- **OutfitUpdate**: Добавлены новые поля для обновления
- **OutfitOut**: Приведена в соответствие с API

#### Пользователи (Users)
- **UserCreate**: Базовая структура для регистрации
- **ProfileOut**: Обновлены типы массивов (favorite_colors, favorite_brands)
- **TokensOut**: Новый тип для ответов обновления токенов

#### Валидация
- **HTTPValidationError**: Структура ошибок валидации
- **ValidationError**: Детали ошибок валидации

### 2. Обновленные API методы

#### Корзина (cart.ts)
```typescript
// Новые методы
getCart(): Promise<CartResponse>
addToCart(data: CartItemCreate): Promise<CartItemResponse>
updateCartItem(itemId: number, data: CartItemUpdate): Promise<CartItemResponse>
getCartSummary(): Promise<CartSummary>

// Deprecated методы для совместимости
getCartState(): Promise<CartStateOut>
addToCartOld(), updateCartItemOld(), removeFromCartOld(), clearCartOld()
```

#### Пользователи (users.ts)
```typescript
// Управление пользователями (admin)
listUsers(): Promise<UserOut[]>
getUser(userId: number): Promise<UserOut>
createUserAdmin(data: UserCreateAdmin): Promise<UserOut>
updateUserAdmin(userId: number, data: UserUpdateAdmin): Promise<UserOut>
deleteUser(userId: number): Promise<void>

// Контент пользователей
toggleFavorite(userId: number, itemId: number)
listFavorites(userId: number): Promise<ItemOut[]>
getUserHistory(userId: number, limit?: number): Promise<ItemOut[]>
```

#### Авторизация (auth.ts)
```typescript
// Новые методы
refreshTokenApi(refreshToken: string): Promise<TokensOut>

// Обновленные методы
registerApi() - теперь использует UserCreate тип
loginApi() - улучшена обработка ошибок
```

#### Профиль (profile.ts)
```typescript
// Новые эндпоинты
getProfile(): Promise<ProfileOut>
updateProfile(data: ProfileUpdate): Promise<ProfileOut>
deleteProfile(): Promise<void>
getMe(): Promise<ProfileOut> // альтернативный эндпоинт
```

### 3. Новые API endpoints

#### Health Check
```typescript
// Новый API для проверки состояния
healthApi.readinessCheck()
```

### 4. Улучшения типизации

#### types/cart.ts
- Переработан для использования типов из schemas.ts
- Сохранены дополнительные утилитарные типы:
  - `CartNotification`
  - `CartState` 
  - `CartItemWithActions`
  - `CartMetrics`

#### API Client (client.ts)
- Улучшена обработка обновления токенов
- Добавлено автоматическое перенаправление на страницу входа при ошибке авторизации
- Обновлены типы для refresh token endpoint

### 5. Обратная совместимость

Все изменения поддерживают обратную совместимость:
- Старые API методы корзины помечены как deprecated, но сохранены
- Существующие компоненты продолжают работать без изменений
- Новые типы дополняют, а не заменяют существующие

## Использование

### Новый API корзины
```typescript
import { useCart } from '../hooks/useCart';

const { cart, addToCart, updateQuantity } = useCart();

// Добавление товара
await addToCart({ variant_id: 123, quantity: 2, notes: 'Срочно' });

// Обновление количества
await updateQuantity(itemId, 3);
```

### Работа с пользователями
```typescript
import { listUsers, toggleFavorite } from '../api/users';

// Получение списка пользователей (админ)
const users = await listUsers();

// Добавление в избранное
await toggleFavorite(userId, itemId);
```

### Управление профилем
```typescript
import { getProfile, updateProfile } from '../api/profile';

// Получение профиля
const profile = await getProfile();

// Обновление профиля
await updateProfile({ 
  first_name: 'Иван',
  favorite_colors: ['red', 'blue']
});
```

## Рекомендации для разработки

1. **Используйте новые API методы** для корзины вместо deprecated
2. **Проверяйте типизацию** - все методы имеют строгие типы
3. **Обрабатывайте ошибки** - добавлены детальные типы ошибок валидации
4. **Тестируйте авторизацию** - улучшена логика обновления токенов

## Миграция

Для полной миграции на новые API:

1. Замените вызовы `cartApi.getCartState()` на `cartApi.getCart()`
2. Обновите типы в компонентах с `CartItem` на `CartItemResponse`
3. Используйте новые поля в образах (tags, season, occasion)
4. Обновите обработку ошибок с новыми типами валидации

## Совместимость

- ✅ Все существующие компоненты работают без изменений
- ✅ Deprecated методы API поддерживаются
- ✅ Новые типы опциональны для существующего кода
- ✅ Автоматическая обработка авторизации улучшена

## Следующие шаги

1. Постепенная миграция компонентов на новые API методы
2. Использование новых полей в образах для расширенной функциональности
3. Внедрение админ-панели с управлением пользователями
4. Добавление health checks для мониторинга 