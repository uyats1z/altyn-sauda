/* Публичные настройки. Client ID не секрет (его видно в любом приложении с входом через Google).
   Вставьте сюда Client ID из Google Cloud Console (OAuth client ID, тип Web application).
   Пока он пустой, приложение работает с локальным входом по паролю. */
window.APP_CONFIG = Object.assign({ googleClientId: '' }, window.APP_CONFIG || {});
