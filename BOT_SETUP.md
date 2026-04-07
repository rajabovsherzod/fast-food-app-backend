# 🤖 Telegram Bot Sozlash - Qadamma-Qadam

## ✅ Tayyor! Bot kodi allaqachon yozilgan

Bot tokeni `.env` fayliga qo'shilgan: `8699401512:AAH9KCFMe8ter9JkfSHh7Yzc_PRopcSVhKw`

## 🚀 Ishga Tushirish

### 1️⃣ Backend'ni ishga tushiring

**Terminal 1:**
```bash
cd fast-food/backend
npm run dev
```

Backend `http://localhost:3000` da ishga tushadi ✅

### 2️⃣ User App'ni ishga tushiring

**Terminal 2:**
```bash
cd fast-food/user-app
npm run dev
```

User app `http://localhost:5173` da ishga tushadi ✅

### 3️⃣ ngrok'ni ishga tushiring

**Terminal 3:**
```bash
ngrok http 5173
```

Natija:
```
Forwarding: https://abc123.ngrok.io -> http://localhost:5173
```

Bu URL'ni nusxalab oling! 📋

### 4️⃣ Bot'ni ishga tushiring

**Terminal 4:**
```bash
cd fast-food/backend
npm run bot
```

Natija:
```
🤖 Telegram Bot starting...
✅ Telegram Bot is running!
📱 Web App URL: http://localhost:5173
🔗 Open your bot in Telegram and send /start
```

## 📱 Telegram'da Test Qilish

### Oddiy usul (Menu Button)

1. Telegram'da [@BotFather](https://t.me/BotFather) ni oching
2. `/setmenubutton` yuboring
3. Botingizni tanlang
4. ngrok URL'ni yuboring (masalan: `https://abc123.ngrok.io`)
5. Tayyor! ✅

Endi botingizni ochganingizda pastda "Menu" tugmasi ko'rinadi.

### To'liq usul (Keyboard Buttons)

Bot allaqachon keyboard bilan sozlangan:
- 📱 Kontaktni yuborish
- 🍔 Menyu

Faqat botingizni oching va `/start` yuboring!

## 🎯 Bot Kommandalari

- `/start` - Botni ishga tushirish, keyboard ko'rsatish
- `/menu` - Menyuni ochish
- `/help` - Yordam
- `/orders` - Buyurtmalar

## 🔧 .env Konfiguratsiyasi

`.env` faylida:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=8699401512:AAH9KCFMe8ter9JkfSHh7Yzc_PRopcSVhKw
TELEGRAM_ADMIN_CHAT_ID=  # Admin chat ID (ixtiyoriy)
WEB_APP_URL=http://localhost:5173  # Yoki ngrok URL
```

## 📝 ngrok URL'ni Yangilash

ngrok har safar yangi URL beradi. Yangilash uchun:

1. `.env` faylida `WEB_APP_URL` ni yangilang
2. Bot'ni qayta ishga tushiring (`Ctrl+C` va `npm run bot`)
3. BotFather'da menu button URL'ni yangilang

## 🎉 Test Qilish

1. Telegram'da botingizni oching
2. `/start` yuboring
3. "📱 Kontaktni yuborish" tugmasini bosing (ixtiyoriy)
4. "🍔 Menyu" tugmasini bosing
5. Mini app ochiladi! 🎊

## 🔄 User Flow

```
User opens bot
    ↓
/start command
    ↓
Shows keyboard:
  - 📱 Kontaktni yuborish
  - 🍔 Menyu
    ↓
User clicks "🍔 Menyu"
    ↓
Mini app opens (ngrok URL)
    ↓
Auto-login via Telegram
    ↓
User browses menu
    ↓
User adds to cart
    ↓
User places order
    ↓
Real-time tracking
```

## 🎨 Bot Xususiyatlari

✅ Keyboard buttons
✅ Contact sharing
✅ Web App integration
✅ Commands (/start, /menu, /help, /orders)
✅ Uzbek language
✅ Emoji support
✅ Error handling
✅ Graceful shutdown

## ⚠️ Muhim Eslatmalar

1. **ngrok URL har safar o'zgaradi** - har gal yangilang
2. **Backend ishlab turishi kerak** - port 3000
3. **User app ishlab turishi kerak** - port 5173
4. **Bot alohida terminal'da ishlaydi** - `npm run bot`
5. **HTTPS kerak** - ngrok avtomatik HTTPS beradi

## 🚀 Production'ga Deploy

### 1. User app'ni deploy qiling (Vercel/Netlify)

```bash
cd fast-food/user-app
npm run build
vercel --prod
```

Natija: `https://your-app.vercel.app`

### 2. .env'ni yangilang

```env
WEB_APP_URL=https://your-app.vercel.app
```

### 3. BotFather'da URL'ni yangilang

```
/setmenubutton
[Bot tanlash]
https://your-app.vercel.app
```

### 4. Bot'ni production serverda ishga tushiring

```bash
npm run bot
```

Yoki PM2 bilan:

```bash
pm2 start "npm run bot" --name telegram-bot
pm2 save
```

## ✅ Checklist

- [ ] Backend ishga tushdi (port 3000)
- [ ] User app ishga tushdi (port 5173)
- [ ] ngrok ishga tushdi
- [ ] Bot ishga tushdi (`npm run bot`)
- [ ] BotFather'da menu button sozlandi
- [ ] Telegram'da bot test qilindi
- [ ] Kontakt sharing ishlaydi
- [ ] Mini app ochiladi
- [ ] Auto-login ishlaydi
- [ ] Buyurtma berish ishlaydi

## 🎊 Tayyor!

Botingiz ishga tushdi! Telegram'da oching va `/start` yuboring! 🍔🍕🍟
