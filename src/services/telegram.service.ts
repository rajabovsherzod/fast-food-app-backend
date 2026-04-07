import TelegramBot from "node-telegram-bot-api";
import env from "@/config/env.config";

let bot: TelegramBot | null = null;

export const initializeTelegramBot = () => {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log("⚠️  Telegram bot token not configured, skipping bot initialization");
    return null;
  }

  try {
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, { polling: false });
    console.log("✅ Telegram bot initialized");
    return bot;
  } catch (error) {
    console.error("❌ Failed to initialize Telegram bot:", error);
    return null;
  }
};

export const sendOrderNotification = async (
  chatId: string,
  order: any,
  status: string
) => {
  if (!bot || !chatId) return;

  const statusEmojis: Record<string, string> = {
    pending: "⏳",
    confirmed: "✅",
    preparing: "👨‍🍳",
    ready: "🍽️",
    delivering: "🚚",
    delivered: "✅",
    cancelled: "❌",
  };

  const statusTexts: Record<string, string> = {
    pending: "Buyurtma qabul qilindi",
    confirmed: "Buyurtma tasdiqlandi",
    preparing: "Buyurtma tayyorlanmoqda",
    ready: "Buyurtma tayyor",
    delivering: "Buyurtma yo'lda",
    delivered: "Buyurtma yetkazildi",
    cancelled: "Buyurtma bekor qilindi",
  };

  const emoji = statusEmojis[status] || "📦";
  const statusText = statusTexts[status] || status;

  const message = `
${emoji} ${statusText}

📋 Buyurtma raqami: ${order.orderNumber}
💰 Summa: ${order.totalPrice} so'm
📍 Manzil: ${order.deliveryAddress}

${status === "delivering" ? "🚚 Yetkazuvchi yo'lda!" : ""}
${status === "delivered" ? "✅ Yoqimli ishtaha!" : ""}
  `.trim();

  try {
    await bot.sendMessage(chatId, message);
    console.log(`📱 Telegram notification sent to ${chatId}: ${statusText}`);
  } catch (error) {
    console.error("❌ Failed to send Telegram notification:", error);
  }
};

export const sendAdminNotification = async (order: any) => {
  if (!bot || !env.TELEGRAM_ADMIN_CHAT_ID) return;

  const message = `
🆕 YANGI BUYURTMA!

📋 Raqam: ${order.orderNumber}
👤 Mijoz: ${order.phoneNumber}
💰 Summa: ${order.totalPrice} so'm
📍 Manzil: ${order.deliveryAddress}
📝 Izoh: ${order.notes || "Yo'q"}

⏰ Vaqt: ${new Date(order.createdAt).toLocaleString("uz-UZ")}
  `.trim();

  try {
    await bot.sendMessage(env.TELEGRAM_ADMIN_CHAT_ID, message);
    console.log("📱 Admin notification sent via Telegram");
  } catch (error) {
    console.error("❌ Failed to send admin notification:", error);
  }
};

export const sendDeliveryNotification = async (
  chatId: string,
  order: any
) => {
  if (!bot || !chatId) return;

  const message = `
🚚 YANGI YETKAZISH TOPSHIRIG'I

📋 Buyurtma: ${order.orderNumber}
📍 Manzil: ${order.deliveryAddress}
📞 Telefon: ${order.phoneNumber}
💰 Summa: ${order.totalPrice} so'm
💵 To'lov: ${order.paymentMethod === "cash" ? "Naqd" : "Karta"}

${order.notes ? `📝 Izoh: ${order.notes}` : ""}
  `.trim();

  try {
    await bot.sendMessage(chatId, message);
    console.log(`📱 Delivery notification sent to ${chatId}`);
  } catch (error) {
    console.error("❌ Failed to send delivery notification:", error);
  }
};

export const sendBroadcast = async (
  chatId: string,
  message: string,
  imageUrl?: string | null
): Promise<boolean> => {
  if (!bot || !chatId) return false;
  try {
    if (imageUrl) {
      await bot.sendPhoto(chatId, imageUrl, {
        caption: message,
        parse_mode: "HTML",
      });
    } else {
      await bot.sendMessage(chatId, message, { parse_mode: "HTML" });
    }
    return true;
  } catch {
    return false;
  }
};

export const getTelegramBot = () => bot;
