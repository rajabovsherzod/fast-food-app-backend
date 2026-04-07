import TelegramBot from "node-telegram-bot-api";
import env from "@/config/env.config";
import db from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || "";
const WEB_APP_URL = env.WEB_APP_URL || "http://localhost:5173";

if (!BOT_TOKEN) {
  console.log("⚠️  TELEGRAM_BOT_TOKEN not configured. Bot will not start.");
  process.exit(0);
}

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("\n╔════════════════════════════════════════════════════════════════╗");
console.log("║                    TELEGRAM BOT STARTING                       ║");
console.log("╚════════════════════════════════════════════════════════════════╝");
console.log("🤖 Bot Token:", BOT_TOKEN.substring(0, 10) + "..." + BOT_TOKEN.substring(BOT_TOKEN.length - 5));
console.log("📱 Web App URL:", WEB_APP_URL);
console.log("🔗 This URL will be sent to users when they click the menu button");
console.log("╔════════════════════════════════════════════════════════════════╗\n");

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "Foydalanuvchi";

  // Foydalanuvchi telefon raqamini ulashganini tekshirish
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, msg.from?.id.toString() || ""));

  if (!user || !user.phoneNumber) {
    // Telefon raqam yo'q - so'rash
    const keyboard = {
      keyboard: [
        [
          {
            text: "📱 Telefon raqamni ulashish",
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };

    await bot.sendMessage(
      chatId,
      `🍔 Assalomu alaykum, ${firstName}!\n\n` +
        `Fast Food yetkazib berish xizmatiga xush kelibsiz!\n\n` +
        `Buyurtma berish uchun telefon raqamingizni ulashing.\n` +
        `Bu buyurtmalarni yetkazib berish uchun kerak bo'ladi.\n\n` +
        `📱 "Telefon raqamni ulashish" tugmasini bosing.`,
      { reply_markup: keyboard }
    );
  } else {
    // Telefon raqam bor - menyu ko'rsatish
    const keyboard = {
      keyboard: [
        [
          {
            text: "🍔 Buyurtma berish",
            web_app: { url: WEB_APP_URL },
          },
        ],
      ],
      resize_keyboard: true,
    };

    await bot.sendMessage(
      chatId,
      `🍔 Assalomu alaykum, ${firstName}!\n\n` +
        `Fast Food yetkazib berish xizmatiga xush kelibsiz!\n\n` +
        `Buyurtma berish uchun "🍔 Buyurtma berish" tugmasini bosing.\n\n` +
        `Tez, mazali va sifatli! 🚀`,
      { reply_markup: keyboard }
    );
  }
});

// /menu command
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    keyboard: [
      [
        {
          text: "🍔 Buyurtma berish",
          web_app: { url: WEB_APP_URL },
        },
      ],
    ],
    resize_keyboard: true,
  };

  await bot.sendMessage(
    chatId,
    "🍕 Menyuni ochish uchun tugmani bosing:",
    { reply_markup: keyboard }
  );
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `📖 Yordam\n\n` +
      `Mavjud komandalar:\n` +
      `/start - Botni ishga tushirish\n` +
      `/menu - Menyuni ochish\n` +
      `/orders - Buyurtmalarim\n` +
      `/test - Test inline button (cache bypass)\n` +
      `/help - Yordam\n\n` +
      `Buyurtma berish uchun "🍔 Buyurtma berish" tugmasini bosing.`
  );
});

// /orders command
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `📦 Buyurtmalaringizni ko'rish uchun menyuni oching va "Buyurtmalar" bo'limiga o'ting.`,
    {
      reply_markup: {
        keyboard: [
          [
            {
              text: "🍔 Menyu",
              web_app: { url: WEB_APP_URL },
            },
          ],
        ],
        resize_keyboard: true,
      },
    }
  );
});

// /test command - Send inline button with WebApp (bypasses cache)
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    `🧪 Test: Inline button orqali app ochish\n\n` +
      `Bu button cache qilinmaydi va har doim yangi URL ishlatadi.\n\n` +
      `URL: ${WEB_APP_URL}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🍔 App-ni Ochish (Test)",
              web_app: { url: WEB_APP_URL },
            },
          ],
        ],
      },
    }
  );
});

// Handle contact sharing
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;

  if (contact && msg.from) {
    console.log('📱 Contact shared:', {
      telegramId: msg.from.id.toString(),
      phoneNumber: contact.phone_number,
    });

    // Save phone number to database
    const phoneNumber = contact.phone_number.startsWith("+")
      ? contact.phone_number
      : `+${contact.phone_number}`;

    try {
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, msg.from.id.toString()));

      if (existingUser) {
        console.log('👤 Updating existing user phone:', existingUser.id);
        // Update phone number (replace temporary if exists)
        await db
          .update(users)
          .set({ phoneNumber, updatedAt: new Date() })
          .where(eq(users.id, existingUser.id));
        console.log('✅ Phone number updated successfully');
      } else {
        console.log('👤 Creating new user with phone');
        // Create new user with phone number
        await db.insert(users).values({
          telegramId: msg.from.id.toString(),
          firstName: msg.from.first_name,
          lastName: msg.from.last_name,
          username: msg.from.username,
          phoneNumber,
          role: "user",
        });
        console.log('✅ User created successfully');
      }

      await bot.sendMessage(
        chatId,
        `✅ Rahmat! Telefon raqamingiz saqlandi.\n\n` +
          `📱 Telefon: ${phoneNumber}\n\n` +
          `Endi buyurtma berishingiz mumkin!`,
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "🍔 Buyurtma berish",
                  web_app: { url: WEB_APP_URL },
                },
              ],
            ],
            resize_keyboard: true,
          },
        }
      );
    } catch (error) {
      console.error('❌ Error saving phone number:', error);
      await bot.sendMessage(
        chatId,
        `❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring yoki /start buyrug'ini yuboring.`
      );
    }
  }
});

// Handle text messages
bot.on("message", async (msg) => {
  // Skip if it's a command or contact
  if (msg.text?.startsWith("/") || msg.contact) return;

  const chatId = msg.chat.id;

  // Check for menu button text
  if (msg.text === "🍔 Buyurtma berish" || msg.text === "🍔 Menyu") {
    await bot.sendMessage(
      chatId,
      "Menyuni ochish uchun tugmani bosing:",
      {
        reply_markup: {
          keyboard: [
            [
              {
                text: "🍔 Buyurtma berish",
                web_app: { url: WEB_APP_URL },
              },
            ],
          ],
          resize_keyboard: true,
        },
      }
    );
    return;
  }

  // Default response
  await bot.sendMessage(
    chatId,
    `Buyurtma berish uchun "🍔 Buyurtma berish" tugmasini bosing yoki /menu kommandasini yuboring.`
  );
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("❌ Polling error:", error);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping bot...");
  bot.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Stopping bot...");
  bot.stopPolling();
  process.exit(0);
});

console.log("✅ Telegram Bot is running!");
console.log(`📱 Web App URL: ${WEB_APP_URL}`);
console.log("🔗 Open your bot in Telegram and send /start");

export default bot;
