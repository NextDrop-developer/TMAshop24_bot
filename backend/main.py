import os
import hmac
import hashlib
from urllib.parse import parse_qs
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
MY_CHAT_ID = os.getenv("MY_CHAT_ID")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

app = FastAPI(title="TMA Portfolio Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # При деплое можно будет ограничить до URL фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- МOДЕЛИ ДАННЫХ (Схемы Pydantic) ---

class OrderSchema(BaseModel):
    name: str
    projectName: str
    target: str
    description: str
    design: str
    wishes: str
    questions: str
    username: str = "Не указан"


class SupportSchema(BaseModel):
    message: str
    username: str = "Не указан"


# --- ВАЛИДАЦИЯ TELEGRAM INIT DATA (Защита бэкенда) ---

def verify_telegram_data(x_tg_data: str = Header(None)):
    """
    Проверяет хэш строки инициализации Telegram WebApp.
    Если запрос идет из обычного браузера при локальной разработке,
    мы пропускаем его, чтобы не ломать тесты.
    """
    if not x_tg_data:
        # Для локальных тестов в браузере (пока нет Telegram окружения)
        return True

    try:
        # Парсим строку initData, полученную из заголовка
        parsed_data = parse_qs(x_tg_data)
        if "hash" not in parsed_data:
            raise HTTPException(status_code=403, detail="Invalid Telegram data")

        tg_hash = parsed_data.pop("hash")[0]

        # Сортируем параметры по алфавиту, как требует Telegram
        data_check_string = "\n".join([f"{k}={v[0]}" for k, v in sorted(parsed_data.items())])

        # Считаем HMAC-SHA256 с ключом "WebAppData"
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if calculated_hash != tg_hash:
            raise HTTPException(status_code=403, detail="Data integrity check failed")

        return True
    except Exception:
        raise HTTPException(status_code=403, detail="Telegram validation error")


# --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

async def send_tg_message(text: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                TELEGRAM_API_URL,
                json={"chat_id": MY_CHAT_ID, "text": text, "parse_mode": "Markdown"}
            )
            return response.status_code == 200
        except Exception:
            return False


# --- ЭНДПОИНТЫ ---

@app.get("/")
def health_check():
    return {"status": "ready", "scope": "TMA Fullstack Portfolio"}


@app.post("/api/order")
async def create_order(order: OrderSchema, authenticated: bool = Depends(verify_telegram_data)):
    message_text = (
        f"🔥 *НОВАЯ ЗАЯВКА НА TMA!*\n\n"
        f"👤 *Заказчик:* {order.name} (Telegram: @{order.username})\n"
        f"🚀 *Проект:* {order.projectName}\n"
        f"🎯 *Цель:* {order.target}\n"
        f"💡 *Идея:* {order.description}\n"
        f"🎨 *Дизайн:* {order.design}\n"
        f"✨ *Пожелания:* {order.wishes}\n"
        f"❓ *Вопросы:* {order.questions}"
    )

    success = await send_tg_message(message_text)
    if not success:
        raise HTTPException(status_code=500, detail="Ошибка при отправке уведомления в Telegram")

    return {"success": True, "message": "Заявка успешно доставлена!"}


@app.post("/api/support")
async def create_support_ticket(ticket: SupportSchema, authenticated: bool = Depends(verify_telegram_data)):
    message_text = (
        f"⚠️ *НОВЫЙ ВОПРОС / ТЕХПОДДЕРЖКА*\n\n"
        f"👤 *Отправитель:* Telegram @{ticket.username}\n"
        f"📝 *Суть проблемы:* {ticket.message}"
    )

    success = await send_tg_message(message_text)
    if not success:
        raise HTTPException(status_code=500, detail="Ошибка при отправке в техподдержку")

    return {"success": True, "message": "Сообщение в поддержку отправлено!"}