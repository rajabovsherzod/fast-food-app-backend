# 🐳 Docker Setup Guide

## 📦 Docker Desktop bilan Ishga Tushirish

### 1. Docker Desktop O'rnatish

Docker Desktop ni yuklab oling va o'rnating:
- **Windows/Mac**: https://www.docker.com/products/docker-desktop

### 2. Docker Compose bilan Ishga Tushirish

```bash
cd fast-food

# Barcha servislarni ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f

# Faqat backend loglarini ko'rish
docker-compose logs -f backend

# Faqat postgres loglarini ko'rish
docker-compose logs -f postgres
```

### 3. Database Migration

```bash
# Container ichida migration qilish
docker-compose exec backend npm run db:push

# Yoki local dan:
npm run db:push
```

### 4. Servislarni To'xtatish

```bash
# To'xtatish
docker-compose down

# To'xtatish va volumelarni o'chirish
docker-compose down -v
```

### 5. Qayta Build Qilish

```bash
# Qayta build qilish
docker-compose up -d --build

# Faqat backend ni qayta build qilish
docker-compose up -d --build backend
```

## 🧪 Test Qilish

### Health Check
```bash
curl http://localhost:3000/health
```

### Telegram Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{
    "telegramId": "123456789",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+998901234567"
  }'
```

### Get Categories
```bash
curl http://localhost:3000/api/v1/foods/categories
```

## 📊 Docker Desktop da Ko'rish

1. Docker Desktop ni oching
2. **Containers** bo'limiga o'ting
3. `fastfood-backend` va `fastfood-postgres` containerlarini ko'rasiz
4. Har birini bosib, loglarni va statsni ko'rishingiz mumkin

## 🔧 Useful Commands

```bash
# Barcha containerlarni ko'rish
docker ps

# Backend container ichiga kirish
docker-compose exec backend sh

# Postgres container ichiga kirish
docker-compose exec postgres psql -U postgres -d fastfood_db

# Database backup
docker-compose exec postgres pg_dump -U postgres fastfood_db > backup.sql

# Database restore
docker-compose exec -T postgres psql -U postgres fastfood_db < backup.sql

# Volumelarni ko'rish
docker volume ls

# Networkni ko'rish
docker network ls
```

## 🗄️ PostgreSQL ga Kirish

### Container ichidan:
```bash
docker-compose exec postgres psql -U postgres -d fastfood_db
```

### Local dan (agar psql o'rnatilgan bo'lsa):
```bash
psql -h localhost -U postgres -d fastfood_db
```

Password: `postgres`

## 📝 Environment Variables

Docker Compose da environment variables `docker-compose.yml` faylida belgilangan.

Agar o'zgartirish kerak bo'lsa:

1. `docker-compose.yml` ni tahrirlang
2. Qayta ishga tushiring:
```bash
docker-compose down
docker-compose up -d
```

## 🚀 Production Setup

Production uchun alohida `docker-compose.prod.yml` yarating:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Ishga tushirish:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🎉 Tayyor!

Docker Desktop da barcha servislar ishga tushdi!

**Keyingi qadamlar:**
1. Postman da test qilish
2. Test data qo'shish
3. Frontend yaratish

---

**Yordam kerak bo'lsa:**
- Docker Desktop da Containers bo'limini oching
- Loglarni real-time ko'ring
- Stats va metricslarni monitoring qiling
