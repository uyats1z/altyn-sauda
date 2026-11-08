/* Локальная регистрация и вход. Пароль хранится только в виде PBKDF2-хеша.
   Когда появится сервер, заменить функции register/login/hash на запросы к API. */
(function(){
  const USERS='fruit-users', SESSION='fruit-session', LEGACY='fruit-batches-v1';
  const $=id=>document.getElementById(id);
  const load=(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k))??d; }catch(e){ return d; } };
  const b64=u8=>btoa(String.fromCharCode(...u8));
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));

  async function hash(pw,saltB64){
    if(!(window.crypto&&crypto.subtle)) throw new Error('nocrypto');
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
    const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unb64(saltB64),iterations:150000},key,256);
    return b64(new Uint8Array(bits));
  }
  const norm=s=>s.trim().toLowerCase();
  const users=()=>load(USERS,[]);
  const session=()=>{ const id=localStorage.getItem(SESSION); return users().find(u=>u.id===id)||null; };

  async function register(name,pw){
    const list=users();
    if(list.some(u=>norm(u.login)===norm(name))) throw new Error('exists');
    const salt=b64(crypto.getRandomValues(new Uint8Array(16)));
    const u={id:'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),login:name.trim(),salt,hash:await hash(pw,salt)};
    list.push(u); localStorage.setItem(USERS,JSON.stringify(list));
    // данные, созданные до появления входа, достаются первому пользователю
    if(list.length===1){ const old=localStorage.getItem(LEGACY); if(old) localStorage.setItem(LEGACY+':'+u.id,old); }
    return u;
  }
  async function login(name,pw){
    const u=users().find(x=>norm(x.login)===norm(name));
    if(!u||await hash(pw,u.salt)!==u.hash) throw new Error('bad');
    return u;
  }
  function start(u){ localStorage.setItem(SESSION,u.id); location.reload(); }
  function logout(){ localStorage.removeItem(SESSION); location.reload(); }

  const GP=(window.GS&&GS.enabled)?GS.profile():null;
  window.Auth={ user:()=>GP||session(), google:GP, key:()=>LEGACY+':'+(GP?'g'+GP.sub:(localStorage.getItem(SESSION)||'anon')),
    logout:()=>{ if(GP) GS.signOut(); logout(); } };

  function boot(){
    const u=GP?{login:GP.email||GP.name}:session();
    if(u){
      const lbl=$('acctName'); if(lbl) lbl.textContent=u.login;
      const lo=$('logoutBtn'); if(lo) lo.addEventListener('click',()=>{ if(confirm('Выйти из аккаунта?')) Auth.logout(); });
      const s=document.createElement('script'); s.src='app.js'; document.body.appendChild(s);
      return;
    }
    let mode='login';
    const LANGS=[['ru','Русский'],['kk','Қазақша'],['ky','Кыргызча'],['en','English'],['tr','Türkçe'],['az','Azərbaycan'],['hy','Հայերեն'],['tg','Тоҷикӣ'],['zh','中文']];
    const T={
      title_login:{ru:'Вход',en:'Sign in',kk:'Кіру',tr:'Giriş',az:'Giriş',hy:'Մուտք',tg:'Вуруд',zh:'登录'},
      sub_login:{ru:'Войдите, чтобы продолжить работу',en:'Sign in to continue',kk:'Жұмысты жалғастыру үшін кіріңіз',tr:'Devam etmek için giriş yapın',az:'Davam etmək üçün daxil olun',hy:'Մուտք գործեք՝ շարունակելու համար',tg:'Барои идома додан ворид шавед',zh:'登录后继续使用'},
      title_reg:{ru:'Регистрация',en:'Sign up',kk:'Тіркелу',tr:'Kayıt ol',az:'Qeydiyyat',hy:'Գրանցում',tg:'Сабти ном',zh:'注册'},
      sub_reg:{ru:'Создайте аккаунт — это займёт полминуты',en:'Create an account — it takes half a minute',kk:'Аккаунт жасаңыз — жарты минут алады',tr:'Hesap oluşturun — yarım dakika sürer',az:'Hesab yaradın — yarım dəqiqə çəkir',hy:'Ստեղծեք հաշիվ՝ կպահանջվի կես րոպե',tg:'Ҳисоб эҷод кунед — ним дақиқа мегирад',zh:'创建账户，只需半分钟'},
      tag:{'ru': 'Торговля богата словом, хозяйство — глазом', 'kk': 'Сауда сөзге бай, шаруа көзге бай', 'ky': 'Соода сөзгө бай, чарба көзгө бай', 'en': 'Trade is rich in words, a household in watchful eyes', 'tr': 'Ticaret sözle, iş gözle yürür', 'az': 'Ticarət sözlə, təsərrüfat gözlə', 'hy': 'Առևտուրը՝ խոսքով, տնտեսությունը՝ աչքով', 'tg': 'Савдо бо сухан, хоҷагӣ бо чашм', 'zh': '生意靠口才，家业靠眼力'},
      user:{ru:'Имя пользователя',en:'Username',kk:'Пайдаланушы аты',tr:'Kullanıcı adı',az:'İstifadəçi adı',hy:'Օգտանուն',tg:'Номи корбар',zh:'用户名'},
      user_ph:{ru:'Ваше имя',en:'Your name',kk:'Атыңыз',tr:'Adınız',az:'Adınız',hy:'Ձեր անունը',tg:'Номи шумо',zh:'你的名字'},
      pw:{ru:'Пароль',en:'Password',kk:'Құпиясөз',tr:'Şifre',az:'Parol',hy:'Գաղտնաբառ',tg:'Рамз',zh:'密码'},
      pw_ph:{ru:'Минимум 6 символов',en:'At least 6 characters',kk:'Кемінде 6 таңба',tr:'En az 6 karakter',az:'Ən azı 6 simvol',hy:'Առնվազն 6 նիշ',tg:'Ақалли 6 аломат',zh:'至少 6 个字符'},
      pw2:{ru:'Повторите пароль',en:'Repeat password',kk:'Құпиясөзді қайталаңыз',tr:'Şifreyi tekrarlayın',az:'Parolu təkrarlayın',hy:'Կրկնեք գաղտնաբառը',tg:'Рамзро такрор кунед',zh:'重复密码'},
      pw2_ph:{ru:'Ещё раз пароль',en:'Password again',kk:'Құпиясөзді тағы енгізіңіз',tr:'Şifre tekrar',az:'Parol yenidən',hy:'Գաղտնաբառը նորից',tg:'Рамз боз',zh:'再次输入密码'},
      go_login:{ru:'Войти',en:'Sign in',kk:'Кіру',tr:'Giriş yap',az:'Daxil ol',hy:'Մուտք գործել',tg:'Ворид шудан',zh:'登录'},
      go_reg:{ru:'Создать аккаунт',en:'Create account',kk:'Аккаунт жасау',tr:'Hesap oluştur',az:'Hesab yarat',hy:'Ստեղծել հաշիվ',tg:'Эҷоди ҳисоб',zh:'创建账户'},
      ask_login:{ru:'Нет аккаунта?',en:'No account?',kk:'Аккаунт жоқ па?',tr:'Hesabınız yok mu?',az:'Hesabınız yoxdur?',hy:'Հաշիվ չունե՞ք',tg:'Ҳисоб надоред?',zh:'没有账户？'},
      sw_login:{ru:'Зарегистрируйтесь',en:'Sign up',kk:'Тіркеліңіз',tr:'Kayıt olun',az:'Qeydiyyatdan keçin',hy:'Գրանցվեք',tg:'Сабти ном кунед',zh:'立即注册'},
      ask_reg:{ru:'Уже есть аккаунт?',en:'Already have an account?',kk:'Аккаунтыңыз бар ма?',tr:'Zaten hesabınız var mı?',az:'Artıq hesabınız var?',hy:'Արդեն ունե՞ք հաշիվ',tg:'Аллакай ҳисоб доред?',zh:'已有账户？'},
      sw_reg:{ru:'Войдите',en:'Sign in',kk:'Кіріңіз',tr:'Giriş yapın',az:'Daxil olun',hy:'Մուտք գործեք',tg:'Ворид шавед',zh:'去登录'},
      e_name:{ru:'Введите имя (минимум 2 символа).',en:'Enter a name (at least 2 characters).',kk:'Атыңызды енгізіңіз (кемінде 2 таңба).',tr:'Bir ad girin (en az 2 karakter).',az:'Ad daxil edin (ən azı 2 simvol).',hy:'Մուտքագրեք անունը (առնվազն 2 նիշ):',tg:'Ном ворид кунед (ақалли 2 аломат).',zh:'请输入名字（至少 2 个字符）。'},
      e_pw:{ru:'Пароль — минимум 6 символов.',en:'Password must be at least 6 characters.',kk:'Құпиясөз кемінде 6 таңба болуы керек.',tr:'Şifre en az 6 karakter olmalı.',az:'Parol ən azı 6 simvol olmalıdır.',hy:'Գաղտնաբառը պետք է լինի առնվազն 6 նիշ:',tg:'Рамз бояд ақалли 6 аломат бошад.',zh:'密码至少 6 个字符。'},
      e_match:{ru:'Пароли не совпадают.',en:'Passwords do not match.',kk:'Құпиясөздер сәйкес емес.',tr:'Şifreler eşleşmiyor.',az:'Parollar uyğun gəlmir.',hy:'Գաղտնաբառերը չեն համընկնում:',tg:'Рамзҳо мувофиқ нестанд.',zh:'两次密码不一致。'},
      e_exists:{ru:'Такой пользователь уже есть.',en:'This user already exists.',kk:'Мұндай пайдаланушы бар.',tr:'Bu kullanıcı zaten var.',az:'Belə istifadəçi artıq var.',hy:'Այդպիսի օգտատեր արդեն կա:',tg:'Чунин корбар аллакай ҳаст.',zh:'该用户已存在。'},
      e_bad:{ru:'Неверное имя или пароль.',en:'Wrong name or password.',kk:'Аты немесе құпиясөз қате.',tr:'Ad veya şifre hatalı.',az:'Ad və ya parol yanlışdır.',hy:'Անունը կամ գաղտնաբառը սխալ է:',tg:'Ном ё рамз нодуруст аст.',zh:'用户名或密码错误。'},
      e_crypto:{ru:'Откройте через https или localhost (браузер блокирует шифрование).',en:'Open via https or localhost (the browser blocks encryption).',kk:'https немесе localhost арқылы ашыңыз (браузер шифрлауды бұғаттайды).',tr:'https veya localhost ile açın (tarayıcı şifrelemeyi engelliyor).',az:'https və ya localhost ilə açın (brauzer şifrələməni bloklayır).',hy:'Բացեք https-ով կամ localhost-ով (դիտարկիչը արգելափակում է գաղտնագրումը):',tg:'Тавассути https ё localhost кушоед (браузер рамзгузорӣро манъ мекунад).',zh:'请通过 https 或 localhost 打开（浏览器阻止了加密）。'}
    };
    const GT={"g_btn": {"ru": "Войти через Google", "en": "Sign in with Google", "kk": "Google арқылы кіру", "ky": "Google аркылуу кирүү", "tr": "Google ile giriş yap", "az": "Google ilə daxil ol", "hy": "Մուտք Google-ով", "tg": "Бо Google ворид шудан", "zh": "使用 Google 登录"}, "g_sub": {"ru": "Данные хранятся в вашей личной Google Таблице", "en": "Your data is stored in your own Google Sheet", "kk": "Деректер өзіңіздің жеке Google Кестеңізде сақталады", "ky": "Маалымат өзүңүздүн жеке Google Таблицаңызда сакталат", "tr": "Verileriniz kendi Google Tablonuzda saklanır", "az": "Məlumatlar şəxsi Google Cədvəlinizdə saxlanılır", "hy": "Տվյալները պահվում են ձեր անձնական Google Աղյուսակում", "tg": "Маълумот дар ҷадвали шахсии Google-и шумо нигоҳ дошта мешавад", "zh": "数据保存在您自己的 Google 表格中"}, "g_err": {"ru": "Не удалось войти через Google. Попробуйте ещё раз.", "en": "Could not sign in with Google. Please try again.", "kk": "Google арқылы кіру мүмкін болмады. Қайталап көріңіз.", "ky": "Google аркылуу кирүү мүмкүн болгон жок. Кайра аракет кылыңыз.", "tr": "Google ile giriş yapılamadı. Tekrar deneyin.", "az": "Google ilə daxil olmaq mümkün olmadı. Yenidən cəhd edin.", "hy": "Չհաջողվեց մուտք գործել Google-ով: Փորձեք կրկին:", "tg": "Ворид бо Google муяссар нашуд. Бори дигар кӯшиш кунед.", "zh": "无法使用 Google 登录，请重试。"}};
    Object.keys(GT).forEach(k=>{ T[k]=GT[k]; });
    const KY={"title_login": "Кирүү", "sub_login": "Улантуу үчүн кириңиз", "title_reg": "Катталуу", "sub_reg": "Аккаунт түзүңүз — жарым мүнөт эле алат", "user": "Колдонуучу аты", "user_ph": "Атыңыз", "pw": "Сырсөз", "pw_ph": "Эң аз дегенде 6 белги", "pw2": "Сырсөздү кайталаңыз", "pw2_ph": "Сырсөздү дагы бир жолу", "go_login": "Кирүү", "go_reg": "Аккаунт түзүү", "ask_login": "Аккаунтуңуз жокпу?", "sw_login": "Катталыңыз", "ask_reg": "Аккаунтуңуз барбы?", "sw_reg": "Кириңиз", "e_name": "Атыңызды киргизиңиз (эң аз дегенде 2 белги).", "e_pw": "Сырсөз эң аз дегенде 6 белги болушу керек.", "e_match": "Сырсөздөр дал келген жок.", "e_exists": "Мындай колдонуучу бар.", "e_bad": "Аты же сырсөз туура эмес.", "e_crypto": "https же localhost аркылуу ачыңыз (браузер шифрлөөнү бөгөттөйт)."};
    Object.keys(KY).forEach(k=>{ T[k].ky=KY[k]; });
    let lang=localStorage.getItem('sam-lang')||'ru'; if(!LANGS.some(l=>l[0]===lang)) lang='ru';
    const t=k=>(T[k][lang]||T[k].ru);
    const menu=$('authLang'), lbtn=$('langBtn');
    menu.innerHTML=LANGS.map(([v,n])=>`<li role="option"><button type="button" data-v="${v}">${n}</button></li>`).join('');
    const setMenu=o=>{ menu.hidden=!o; lbtn.setAttribute('aria-expanded',o); };
    lbtn.addEventListener('click',e=>{ e.stopPropagation(); setMenu(menu.hidden); });
    document.addEventListener('click',()=>setMenu(false));
    document.addEventListener('keydown',e=>{ if(e.key==='Escape') setMenu(false); });
    menu.addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b) return; lang=b.dataset.v; try{localStorage.setItem('sam-lang',lang);}catch(_){} document.documentElement.lang=lang==='zh'?'zh-CN':lang; setMenu(false); paint(); });
    let lastErr=null;
    const showErr=k=>{ lastErr=k; $('authErr').textContent=k?t(k):''; };
    const box=$('authBox'); box.hidden=false; document.querySelector('.app').hidden=true;
    function paint(){
      const L=mode==='login';
      menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',b.dataset.v===lang));
      $('langCur').textContent=LANGS.find(l=>l[0]===lang)[1];
      $('authTag').textContent=t('tag');
      $('authTitle').textContent=t(L?'title_login':'title_reg');
      $('authSub').textContent=t(L?'sub_login':'sub_reg');
      $('authUserL').textContent=t('user'); $('authName').placeholder=t('user_ph');
      $('authPwL').textContent=t('pw'); $('authPw').placeholder=t('pw_ph');
      $('authPw2L').textContent=t('pw2'); $('authPw2').placeholder=t('pw2_ph');
      $('authGo').textContent=t(L?'go_login':'go_reg');
      $('authAsk').textContent=t(L?'ask_login':'ask_reg');
      $('authSwitch').textContent=t(L?'sw_login':'sw_reg');
      $('authPw2Wrap').hidden=L;
      $('authPw').autocomplete=L?'current-password':'new-password';
      const G=!!(window.GS&&GS.enabled);
      [$('authName'),$('authPw'),$('authPw2')].forEach(i=>{ i.closest('label').hidden=G||(i.id==='authPw2'&&L); });
      $('authGo').hidden=G; document.querySelector('.authfoot').hidden=G; $('googleBtn').hidden=!G;
      if(G){ $('googleTxt').textContent=t('g_btn'); $('authTitle').textContent=t('title_login'); $('authSub').textContent=t('g_sub'); }
      showErr(lastErr);
    }
    function repaintMode(){ lastErr=null; paint(); const f=$('authForm'); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); }
    document.documentElement.lang=lang==='zh'?'zh-CN':lang;
    paint();
    $('googleBtn').addEventListener('click',async()=>{
      showErr(null); $('googleBtn').disabled=true;
      try{
        const p=await GS.signIn();
        // данные, созданные при локальном входе, достаются первому Google-пользователю
        const gk=LEGACY+':g'+p.sub;
        if(!localStorage.getItem(gk)){ const lk=Object.keys(localStorage).find(k=>k.startsWith(LEGACY+':u')); if(lk) localStorage.setItem(gk,localStorage.getItem(lk)); }
        location.reload();
      }catch(ex){ showErr('g_err'); $('googleBtn').disabled=false; }
    });
    $('authEye').addEventListener('click',()=>{ const p=$('authPw'),sh=p.type==='password'; p.type=sh?'text':'password'; $('authPw2').type=p.type; $('authEye').textContent=sh?'🙈':'👁'; });
    $('authSwitch').addEventListener('click',()=>{ mode=mode==='login'?'register':'login'; repaintMode(); });
    $('authForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const name=$('authName').value, pw=$('authPw').value; showErr(null);
      if(name.trim().length<2){ showErr('e_name'); return; }
      if(pw.length<6){ showErr('e_pw'); return; }
      if(mode==='register'&&pw!==$('authPw2').value){ showErr('e_match'); return; }
      $('authGo').disabled=true;
      try{ start(mode==='login'?await login(name,pw):await register(name,pw)); }
      catch(ex){ showErr(ex.message==='nocrypto'?'e_crypto':ex.message==='exists'?'e_exists':ex.message==='bad'?'e_bad':'e_bad'); $('authGo').disabled=false; }
    });
  }
  boot();
})();
