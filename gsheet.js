/* Вход через Google и личная Google Таблица каждого пользователя.
   Права только drive.file: приложение видит лишь файл, который создало само. */
(function(){
  const CID=(window.APP_CONFIG&&window.APP_CONFIG.googleClientId)||'';
  const SCOPE='openid email profile https://www.googleapis.com/auth/drive.file';
  const TK='gs-token', PK='fruit-google', B='https://sheets.googleapis.com/v4/spreadsheets';
  const err=(code,m)=>Object.assign(new Error(m||code),{code});
  const enc=encodeURIComponent;
  let gsi=null, sid=null;
  const loadGsi=()=>gsi||(gsi=new Promise((res,rej)=>{
    if(window.google&&google.accounts) return res();
    const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true;
    s.onload=res; s.onerror=()=>{ gsi=null; rej(err('server_unavailable')); }; document.head.appendChild(s);
  }));
  const saved=()=>{ try{ const t=JSON.parse(localStorage.getItem(TK)); return t&&t.exp>Date.now()+60000?t:null; }catch(e){ return null; } };
  const profile=()=>{ try{ return JSON.parse(localStorage.getItem(PK)); }catch(e){ return null; } };

  /* Вызывать только из обработчика нажатия (иначе браузер блокирует окно Google). */
  function connect(hint){
    return loadGsi().then(()=>new Promise((res,rej)=>{
      const c=google.accounts.oauth2.initTokenClient({
        client_id:CID, scope:SCOPE, hint:hint||undefined,
        callback:r=>{
          if(r.error) return rej(err('needs_reauth',r.error));
          try{ localStorage.setItem(TK,JSON.stringify({v:r.access_token,exp:Date.now()+(+r.expires_in||3600)*1000})); }catch(e){}
          res(r.access_token);
        },
        error_callback:e=>rej(err('needs_reauth',e&&e.type))
      });
      c.requestAccessToken({prompt:hint?'':'select_account'});
    }));
  }
  async function signIn(){
    const tok=await connect();
    const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+tok}});
    if(!r.ok) throw err('tool_error');
    const u=await r.json();
    const p={sub:u.sub,email:u.email||'',name:u.name||u.email||''};
    localStorage.setItem(PK,JSON.stringify(p)); return p;
  }
  function signOut(){ try{ localStorage.removeItem(TK); localStorage.removeItem(PK); }catch(e){} sid=null; }

  async function api(url,opt){
    const t=saved(); if(!t) throw err('needs_reauth');
    const r=await fetch(url,Object.assign({},opt,{headers:Object.assign({Authorization:'Bearer '+t.v,'Content-Type':'application/json'},opt&&opt.headers)}));
    if(r.status===401){ try{ localStorage.removeItem(TK); }catch(e){} throw err('needs_reauth'); }
    if(r.status===404){ sid=null; try{ localStorage.removeItem('gs-sheet:'+(profile()||{}).sub); }catch(e){} throw err('tool_error','not found'); }
    if(!r.ok){
      let m='http '+r.status; try{ const j=await r.json(); m=(j.error&&(j.error.message||j.error))||m; }catch(e){}
      throw err(r.status===403?'blocked_by_policy':'tool_error',String(m).slice(0,300));
    }
    return r.status===204?null:r.json();
  }

  const HEAD={
    'Партии':['ID','Дата','Фрукт','кг','Цена закупа','Доставка','Прочее','Порча','Вес ящика','Цена в валюте','Валюта','Курс'],
    'Продажи':['ID','ID партии','Дата','кг','Цена','Оплата','Покупатель','Оплачено Kaspi','Оплачено наличными','Город','Ящики','Доставка','Цена в валюте','Валюта','Курс','Оплатить до'],
    'Расходы':['ID','Дата','Категория','Сумма','Заметка'],
    'Поставщики':['Поставщик','Телефон','Фрукт','Дата','Количество','Цена','Сумма','Оплачено','Долг','Оплатить до']
  };
  async function create(){
    const names=Object.keys(HEAD).concat(['Итоги','_data']);
    const r=await api(B,{method:'POST',body:JSON.stringify({properties:{title:'Altyn Sauda',locale:'ru_RU'},
      sheets:names.map(n=>({properties:Object.assign({title:n,gridProperties:{frozenRowCount:n==='_data'||n==='Итоги'?0:1}},n==='_data'?{hidden:true}:{})}))})});
    const data=Object.keys(HEAD).map(n=>({range:`'${n}'!A1:${String.fromCharCode(64+HEAD[n].length)}1`,values:[HEAD[n]]}));
    data.push({range:"'Итоги'!I3:J6",values:[['Курсы валют',''],['USD',''],['EUR',''],['Дата курса','']]});
    await api(`${B}/${r.spreadsheetId}/values:batchUpdate`,{method:'POST',body:JSON.stringify({valueInputOption:'RAW',data})});
    return r.spreadsheetId;
  }
  async function ensure(){
    if(sid) return sid;
    const p=profile(); if(!p) throw err('needs_reauth');
    const k='gs-sheet:'+p.sub; sid=localStorage.getItem(k);
    if(!sid){
      const q=enc("name='Altyn Sauda' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const r=await api('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id)&orderBy=createdTime');
      sid=r.files&&r.files[0]&&r.files[0].id;
    }
    if(!sid) sid=await create();
    try{ localStorage.setItem(k,sid); }catch(e){}
    return sid;
  }

  const DATA="'_data'!A:A";
  const docRef={
    async get(){
      const id=await ensure();
      const r=await api(`${B}/${id}/values/${enc(DATA)}`);
      const txt=(r.values||[]).map(x=>x[0]||'').join('');
      if(!txt) return {exists:false,data:()=>null};
      const d=JSON.parse(txt); return {exists:true,data:()=>d};
    },
    async set(d){
      const id=await ensure(); const txt=JSON.stringify(d), ch=[];
      for(let i=0;i<txt.length;i+=40000) ch.push([txt.slice(i,i+40000)]);
      await api(`${B}/${id}/values/${enc(DATA)}:clear`,{method:'POST',body:'{}'});
      await api(`${B}/${id}/values/${enc("'_data'!A1")}?valueInputOption=RAW`,{method:'PUT',body:JSON.stringify({values:ch})});
    }
  };
  /* Подмена mcp: существующий код синхронизации вызывает callTool('Google Sheets', ...) */
  const mcp={ async callTool(srv,name,a){
    const id=await ensure();
    if(name==='update_values') return api(`${B}/${id}/values/${enc(a.range)}?valueInputOption=USER_ENTERED`,{method:'PUT',body:JSON.stringify({range:a.range,values:a.values})});
    if(name==='batch_clear_values') return api(`${B}/${id}/values:batchClear`,{method:'POST',body:JSON.stringify({ranges:a.ranges})});
    throw err('tool_error');
  }};

  window.GS={ enabled:!!CID, profile, hasToken:()=>!!saved(), connect, signIn, signOut, docRef, mcp,
    url:()=>sid?'https://docs.google.com/spreadsheets/d/'+sid+'/edit':'' };
})();
