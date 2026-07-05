import React, { useState, useEffect } from 'react';

function App() {
  // Управление экранами: 'welcome', 'menu', 'order', 'about', 'support', 'thanks'
  const [screen, setScreen] = useState('welcome');

  // Данные формы заказа
  const [formData, setFormData] = useState({
    name: '',
    projectName: '',
    target: '',
    description: '',
    design: '',
    wishes: '',
    questions: ''
  });

  // Данные формы поддержки
  const [supportMessage, setSupportMessage] = useState('');

  // Имя пользователя из Telegram
  const [tgUsername, setTgUsername] = useState('Не указан');
  const [tgInitData, setTgInitData] = useState('');

  // Подхватываем данные из Telegram при старте приложения
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand(); // Расширяем приложение на весь экран телефона

      if (tg.initDataUnsafe?.user?.username) {
        setTgUsername(tg.initDataUnsafe.user.username);
      }
      if (tg.initData) {
        setTgInitData(tg.initData); // Сохраняем строку для валидации на бэке
      }
    }
  }, []);

  // Изменение полей формы заказа
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Отправка формы заказа на FastAPI
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tg-Data': tgInitData // Передаем данные защиты в заголовок
        },
        body: JSON.stringify({ ...formData, username: tgUsername })
      });

      if (response.ok) {
        setScreen('thanks');
        // Очищаем форму
        setFormData({ name: '', projectName: '', target: '', description: '', design: '', wishes: '', questions: '' });
      } else {
        alert('Ошибка при отправке заявки. Попробуйте еще раз.');
      }
    } catch (error) {
      alert('Не удалось связаться с сервером.');
    }
  };

  // Отправка сообщения в техподдержку
  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tg-Data': tgInitData
        },
        body: JSON.stringify({ message: supportMessage, username: tgUsername })
      });

      if (response.ok) {
        alert('Ваш вопрос успешно отправлен в поддержку!');
        setSupportMessage('');
        setScreen('menu');
      } else {
        alert('Ошибка при отправке. Попробуйте еще раз.');
      }
    } catch (error) {
      alert('Не удалось связаться с сервером.');
    }
  };

  return (
    <div className="app-container">

      {/* 1. ГЛАВНЫЙ ЭКРАН ПРИВЕТСТВИЯ */}
      {screen === 'welcome' && (
        <div className="screen welcome-screen">
          <h1 className="fade-in">It’s not only about the look, but the functional.</h1>
          <button className="btn btn-primary animate-btn" onClick={() => setScreen('menu')}>
            Заказать TMA
          </button>
        </div>
      )}

      {/* 2. ГЛАВНОЕ МЕНЮ */}
      {screen === 'menu' && (
        <div className="screen menu-screen">
          <h2>Меню инженера</h2>
          <div className="menu-grid">
            <button className="menu-btn" onClick={() => setScreen('order')}>
              <span>01.</span> Заполнить заявку на TMA
            </button>
            <button className="menu-btn" onClick={() => setScreen('about')}>
              <span>02.</span> О разработчике (Стек 24/7)
            </button>
            <button className="menu-btn" onClick={() => setScreen('support')}>
              <span>03.</span> Личные вопросы / Поддержка
            </button>
            <a href="https://t.me/твой_основной_юзернейм" target="_blank" rel="noreferrer" className="menu-btn client-link">
              <span>04.</span> Контакт (Связаться в ЛС)
            </a>
          </div>
          <button className="btn btn-secondary back-btn" onClick={() => setScreen('welcome')}>← Назад</button>
        </div>
      )}

      {/* 3. ЭКРАН ОФОРМЛЕНИЯ ЗАЯВКИ */}
      {screen === 'order' && (
        <div className="screen form-screen">
          <h2>Новая заявка</h2>
          <form onSubmit={handleOrderSubmit}>
            <input type="text" name="name" placeholder="Ваше имя" required value={formData.name} onChange={handleInputChange} />
            <input type="text" name="projectName" placeholder="Название проекта / TMA" required value={formData.projectName} onChange={handleInputChange} />
            <input type="text" name="target" placeholder="Для чего нужно (Цель приложения)" required value={formData.target} onChange={handleInputChange} />
            <textarea name="description" placeholder="Описание вашей идеи" required value={formData.description} onChange={handleInputChange} />
            <input type="text" name="design" placeholder="Пожелания по дизайну / Цветам" required value={formData.design} onChange={handleInputChange} />
            <textarea name="wishes" placeholder="Личные желания / Особенности" value={formData.wishes} onChange={handleInputChange} />
            <input type="text" name="questions" placeholder="Вопросы (если есть)" value={formData.questions} onChange={handleInputChange} />

            <button type="submit" className="btn btn-primary">Отправить заявку</button>
          </form>
          <button className="btn btn-secondary" onClick={() => setScreen('menu')}>Назад в меню</button>
        </div>
      )}

      {/* 4. ЭКРАН "О НАС" */}
      {screen === 'about' && (
        <div className="screen about-screen">
          <h2>О разработчике</h2>
          <div className="about-text">
            <p>Я — автономный Fullstack-инженер, специализирующийся на проектировании и запуске высоконагруженных <strong>Telegram Mini Apps (TMA)</strong>.</p>
            <p>Мой стек — это бескомпромиссная связка <strong>React + TypeScript</strong> на фронтенде для плавного UX и асинхронный <strong>FastAPI (Python)</strong> на бэкенде для мгновенной обработки запросов.</p>
            <p>Создаю независимые, отказоустойчивые веб-автоматизации и архитектуры, готовые к работе в продакшене 24/7. Логика, скорость и безопасность — главные приоритеты.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setScreen('menu')}>Назад в меню</button>
        </div>
      )}

      {/* 5. ЭКРАН ПОДДЕРЖКИ */}
      {screen === 'support' && (
        <div className="screen form-screen">
          <h2>Техподдержка / Вопросы</h2>
          <form onSubmit={handleSupportSubmit}>
            <textarea
              placeholder="Опишите вашу проблему или специфический вопрос напрямую разработчику..."
              required
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Отправить сообщение</button>
          </form>
          <button className="btn btn-secondary" onClick={() => setScreen('menu')}>Назад в меню</button>
        </div>
      )}

      {/* 6. ЭКРАН "СПАСИБО" */}
      {screen === 'thanks' && (
        <div className="screen thanks-screen">
          <h2>Заявка отправлена!</h2>
          <p>Спасибо! Архитектура вашей идеи уже анализируется. В ближайшее время я свяжусь с вами в Telegram для обсуждения деталей.</p>
          <button className="btn btn-primary" onClick={() => setScreen('menu')}>В меню</button>
        </div>
      )}

    </div>
  );
}

export default App;