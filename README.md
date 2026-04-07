# 🍔 Fast Food Delivery System - Backend

Professional backend API for fast food delivery system with Telegram Mini App integration.

## 🚀 Features

- ✅ **Authentication & Authorization** - JWT-based auth with role management (User, Delivery, Admin)
- ✅ **Order Management** - Complete order lifecycle from creation to delivery
- ✅ **Food & Category Management** - CRUD operations with image support
- ✅ **Real-time Updates** - Socket.io integration ready
- ✅ **Telegram Bot Integration** - Seamless login and notifications
- ✅ **Professional Error Handling** - Centralized error management
- ✅ **Request Validation** - Zod schema validation
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Pagination** - Efficient data fetching
- ✅ **Security** - Helmet, CORS, sanitization

## 📁 Project Structure

```
fast-food/
├── src/
│   ├── config/
│   │   └── env.config.ts          # Environment validation
│   ├── db/
│   │   ├── schema.ts               # Drizzle ORM schema
│   │   └── index.ts                # Database connection
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── validate.middleware.ts  # Zod validation
│   │   ├── error.middleware.ts     # Error handler
│   │   ├── logger.middleware.ts    # Request logger
│   │   └── rateLimit.middleware.ts # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── food.routes.ts
│   │   ├── order.routes.ts
│   │   ├── admin.routes.ts
│   │   └── delivery.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── food.controller.ts
│   │   ├── order.controller.ts
│   │   ├── admin.controller.ts
│   │   └── delivery.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── food.service.ts
│   │   ├── order.service.ts
│   │   ├── admin.service.ts
│   │   └── delivery.service.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── order.validator.ts
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── ApiResponse.ts
│   │   ├── asyncHandler.ts
│   │   ├── jwt.utils.ts
│   │   ├── password.utils.ts
│   │   ├── pagination.utils.ts
│   │   └── orderNumber.utils.ts
│   ├── types/
│   │   └── express.d.ts
│   ├── app.ts
│   └── index.ts
├── drizzle/                        # Migrations
├── uploads/                        # File uploads
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

## 🛠️ Installation

### 1. Clone and Install

```bash
cd fast-food
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` file:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/fastfood_db

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-change-this-in-production

TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_ADMIN_CHAT_ID=your-admin-chat-id

CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
```

### 3. Database Setup

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push

# Open Drizzle Studio (optional)
npm run db:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

#### Telegram Login
```http
POST /auth/telegram-login
Content-Type: application/json

{
  "telegramId": "123456789",
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "phoneNumber": "+998901234567"
}
```

#### Admin Login
```http
POST /auth/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Foods

#### Get All Categories
```http
GET /foods/categories
```

#### Get All Foods
```http
GET /foods?page=1&limit=10
```

#### Get Foods by Category
```http
GET /foods/category/:categoryId?page=1&limit=10
```

#### Get Food Details
```http
GET /foods/:id
```

### Orders (Requires Authentication)

#### Create Order
```http
POST /orders
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "items": [
    {
      "foodId": 1,
      "quantity": 2,
      "notes": "No onions",
      "addons": [
        {
          "addonId": 1,
          "quantity": 1
        }
      ]
    }
  ],
  "deliveryAddress": "Tashkent, Chilonzor 12",
  "deliveryLatitude": "41.2995",
  "deliveryLongitude": "69.2401",
  "phoneNumber": "+998901234567",
  "notes": "Call before delivery",
  "paymentMethod": "cash"
}
```

#### Get User Orders
```http
GET /orders?page=1&limit=10
Authorization: Bearer {access_token}
```

#### Get Order Details
```http
GET /orders/:id
Authorization: Bearer {access_token}
```

#### Cancel Order
```http
PATCH /orders/:id/cancel
Authorization: Bearer {access_token}
```

### Admin (Requires Admin Role)

#### Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer {admin_access_token}
```

#### Get All Orders
```http
GET /admin/orders?page=1&limit=10&status=pending
Authorization: Bearer {admin_access_token}
```

#### Update Order Status
```http
PATCH /admin/orders/:id/status
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "status": "confirmed"
}
```

#### Assign Delivery
```http
PATCH /admin/orders/:id/assign-delivery
Authorization: Bearer {admin_access_token}
Content-Type: application/json

{
  "deliveryId": 5
}
```

### Delivery (Requires Delivery Role)

#### Get Assigned Orders
```http
GET /delivery/orders
Authorization: Bearer {delivery_access_token}
```

#### Accept Order
```http
PATCH /delivery/orders/:id/accept
Authorization: Bearer {delivery_access_token}
```

#### Complete Delivery
```http
PATCH /delivery/orders/:id/complete
Authorization: Bearer {delivery_access_token}
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request throttling
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **Zod** - Input validation
- **SQL Injection Protection** - Drizzle ORM

## 📊 Database Schema

### Main Tables
- `users` - User accounts (User, Delivery, Admin)
- `admins` - Admin accounts
- `categories` - Food categories
- `foods` - Food items
- `addons` - Additional items (sauces, drinks)
- `orders` - Customer orders
- `order_items` - Order line items
- `order_item_addons` - Addons for order items
- `promo_codes` - Discount codes
- `ratings` - Order ratings
- `notifications` - User notifications
- `refresh_tokens` - JWT refresh tokens
- `user_addresses` - Saved addresses
- `delivery_zones` - Delivery areas
- `settings` - System settings
- `working_hours` - Business hours

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=strong-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-strong-secret
```

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 👨‍💻 Author

Fast Food Delivery System Backend

---

Made with ❤️ using Node.js, Express, TypeScript, Drizzle ORM, and PostgreSQL
# fast-food-app-backend
