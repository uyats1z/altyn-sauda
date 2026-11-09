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

  /* ===== шаблон таблицы: заголовки, формулы, оформление ===== */
  const TPL='6';
  const GREEN={red:0.18,green:0.451,blue:0.2745}, WHITE={red:1,green:1,blue:1}, BLUE={blue:1}, GRAY={red:0.365,green:0.42,blue:0.376};
  const M='#,##0 "₸"', MD='#,##0 "₸";-#,##0 "₸";"-"', DT='dd.mm.yyyy', USD='"$"#,##0;-"$"#,##0', EUR='"€"#,##0;-"€"#,##0';
  const H={
    'Партии':['ID партии','Дата','Фрукт','Закуплено, кг','Цена закупа, ₸/кг','Доставка, ₸','Другие расходы, ₸','Списано, кг','Вес ящика, кг','Цена закупа в валюте (за кг)','Валюта','Курс, ₸',
      'Вложено всего, ₸','Себестоимость 1 кг, ₸','Продано, кг','Выручка, ₸','Остаток, кг','Прибыль, ₸','Таможня, ₸','Таможня во вложено?'],
    'Продажи':['ID продажи','ID партии','Дата','Продано, кг','Цена, ₸/кг','Оплата','Покупатель','Вернул на Kaspi, ₸','Вернул наличными, ₸','Город','Ящиков','Доставка, ₸','Цена в валюте (за кг)','Валюта','Курс, ₸','Оплатить до',
      'Фрукт','Сумма, ₸','Себестоимость, ₸','Наценка, ₸','Остаток долга, ₸'],
    'Расходы':['ID','Дата','На что','Сумма, ₸','Комментарий'],
    'Поставщики':['Поставщик','Телефон','Партия','Дата','Сколько взяли','По чём','Сумма, ₸','Оплачено, ₸','Долг, ₸','Оплатить до']
  };
  const AF=(c)=>`=ARRAYFORMULA(IF(LEN(A2:A);${c};))`;
  const FORM={
    'Партии':{M:AF('D2:D*E2:E+F2:F+G2:G+IF(T2:T="да";S2:S;0)'),N:AF('IF(D2:D=0;0;M2:M/D2:D)'),O:AF("SUMIF('Продажи'!B2:B;A2:A;'Продажи'!D2:D)"),P:AF("SUMIF('Продажи'!B2:B;A2:A;'Продажи'!R2:R)"),Q:AF('D2:D-O2:O-H2:H'),R:AF("P2:P-M2:M-SUMIF('Продажи'!B2:B;A2:A;'Продажи'!L2:L)")},
    'Продажи':{Q:AF("IFERROR(VLOOKUP(B2:B;'Партии'!A2:N;3;FALSE);\"\")"),R:AF('D2:D*E2:E'),S:AF("D2:D*IFERROR(VLOOKUP(B2:B;'Партии'!A2:N;14;FALSE);0)"),T:AF('R2:R-S2:S-L2:L'),U:AF('IF(F2:F="Под реализацию";R2:R-H2:H-I2:I;0)')}
  };
  const SUMCOL2=(val)=>`=ARRAYFORMULA(IF(LEN(A15:A);SUMIF('Партии'!C2:C;A15:A;'Партии'!${val}2:${val});))`;
  const ITOGI=[
    ['Итоги по всем партиям'],
    ['Данные заполняет приложение: столбцы A–I на листе «Партии» и A–L на листе «Продажи». Остальное считают формулы.'],
    ['','','в $','в €','','','','в $'],
    ['Вложено всего, ₸',"=SUM('Партии'!M2:M)",'=IF($J$4>0;B4/$J$4;"")','=IF($J$5>0;B4/$J$5;"")','','Получено на Kaspi, ₸',"=SUMIF('Продажи'!F2:F;\"Kaspi\";'Продажи'!R2:R)+SUM('Продажи'!H2:H)",'=IF($J$4>0;G4/$J$4;"")'],
    ['Выручка, ₸',"=SUM('Продажи'!R2:R)",'=IF($J$4>0;B5/$J$4;"")','=IF($J$5>0;B5/$J$5;"")','','Получено наличными, ₸',"=SUMIF('Продажи'!F2:F;\"Наличные\";'Продажи'!R2:R)+SUM('Продажи'!I2:I)",'=IF($J$4>0;G5/$J$4;"")'],
    ['Прибыль, ₸','=B5-B4-G7-G8','=IF($J$4>0;B6/$J$4;"")','=IF($J$5>0;B6/$J$5;"")','','Должны вам, ₸',"=SUM('Продажи'!U2:U)",'=IF($J$4>0;G6/$J$4;"")'],
    ['Продано, кг',"=SUM('Продажи'!D2:D)",'','','','Доставка покупателям, ₸',"=SUM('Продажи'!L2:L)",'=IF($J$4>0;G7/$J$4;"")'],
    ['Продано, ящиков',"=SUM('Продажи'!K2:K)",'','','','Общие расходы, ₸',"=SUM('Расходы'!D2:D)",'=IF($J$4>0;G8/$J$4;"")'],
    ['Остаток, кг',"=SUM('Партии'!Q2:Q)",'','','','Под реализацию: вы должны, ₸',"=SUM('Поставщики'!I2:I)",'=IF($J$4>0;G9/$J$4;"")'],
    ['Остаток, ящиков',"=IFERROR(SUM(ARRAYFORMULA(IF('Партии'!I2:I>0;'Партии'!Q2:Q/'Партии'!I2:I;0)));0)"],
    ['Списано, кг',"=SUM('Партии'!H2:H)"],
    ['Списано, ящиков',"=IFERROR(SUM(ARRAYFORMULA(IF('Партии'!I2:I>0;'Партии'!H2:H/'Партии'!I2:I;0)));0)"],
    [],
    ['Фрукт','Вложено, ₸','Выручка, ₸','Прибыль, ₸','','Покупатель','Долг, ₸'],
    ["=IFERROR(SORT(UNIQUE(FILTER('Партии'!C2:C;LEN('Партии'!C2:C))));\"\")",SUMCOL2('M'),SUMCOL2('P'),SUMCOL2('R'),'',"=IFERROR(SORT(UNIQUE(FILTER('Продажи'!G2:G;'Продажи'!U2:U>0)));\"\")","=ARRAYFORMULA(IF(LEN(F15:F);SUMIF('Продажи'!G2:G;F15:F;'Продажи'!U2:U);))"]
  ];
  const COLS={ // [формат, синий текст]
    'Партии':[[0,1],[DT,1],[0,1],[0,1],[M,1],[M,1],[M,1],[0,1],[0,1],['#,##0.00',1],[0,1],['#,##0.00 "₸"',1],[M],[M],[0],[MD],[0],[MD],[M,1],[0,1]],
    'Продажи':[[0,1],[0,1],[DT,1],[0,1],[M,1],[0,1],[0,1],[M,1],[M,1],[0,1],[0,1],[M,1],['#,##0.00',1],[0,1],['#,##0.00 "₸"',1],[DT,1],[0],[M],[M],[MD],[MD]],
    'Расходы':[[0],[DT],[0],[M],[0]],
    'Поставщики':[[0],[0],[0],[DT],[0],[0],[MD],[MD],[MD],[DT]]
  };
  const WID={
    'Партии':[110,90,150,115,115,115,115,115,100,115,115,115,115,115,115,115,115,115,115,130],
    'Продажи':[110,110,90,110,110,110,150,130,130,110,90,110,115,115,115,105,150,120,120,120,130],
    'Расходы':[140,140,140,140,220],
    'Поставщики':[140,140,140,140,170,170,120,120,120,120],
    'Итоги':[200,140,110,110,30,220,140,100,110,120,120,170,110,80,90,90,130]
  };
  const colL=n=>String.fromCharCode(65+n);
  async function applyTemplate(id){
    const meta=await api(`${B}/${id}?fields=sheets.properties(sheetId,title)`);
    const sid_={}; meta.sheets.forEach(s=>sid_[s.properties.title]=s.properties.sheetId);
    const data=[];
    Object.keys(H).forEach(n=>data.push({range:`'${n}'!A1:${colL(H[n].length-1)}1`,values:[H[n]]}));
    Object.keys(FORM).forEach(n=>Object.keys(FORM[n]).forEach(c=>data.push({range:`'${n}'!${c}2`,values:[[FORM[n][c]]]})));
    data.push({range:"'Итоги'!A1:H15",values:ITOGI});
    { const P="'Партии'!", per=(r)=>`;${P}$B$2:$B;">="&$M${r};${P}$B$2:$B;"<="&TODAY())`;
      const row=(r,label,from)=>[label,from,`=COUNTIFS(${P}$B$2:$B;">="&$M${r};${P}$B$2:$B;"<="&TODAY())`,`=SUMIFS(${P}$D$2:$D${per(r)}`,
        `=IFERROR(SUM(ARRAYFORMULA(IF((${P}$B$2:$B>=$M${r})*(${P}$B$2:$B<=TODAY())*(${P}$I$2:$I>0);${P}$D$2:$D/${P}$I$2:$I;0)));0)`,`=SUMIFS(${P}$M$2:$M${per(r)}`];
      data.push({range:"'Итоги'!L3:Q7",values:[['Партии за период','С даты','Партий','Кг','Ящиков','Вложено, ₸'],
        row(4,'Сегодня','=TODAY()'),row(5,'Эта неделя (7 дней)','=TODAY()-6'),row(6,'Этот месяц','=DATE(YEAR(TODAY());MONTH(TODAY());1)'),
        ['Считается по дате партии на листе «Партии».','','','','','']]}); }
    data.push({range:"'Итоги'!I3:I6",values:[['Курс валют'],['1 $, ₸'],['1 €, ₸'],['Обновлён']]});
    await api(`${B}/${id}/values:batchClear`,{method:'POST',body:JSON.stringify({ranges:["'Итоги'!A1:H1000"]})});
    await api(`${B}/${id}/values:batchUpdate`,{method:'POST',body:JSON.stringify({valueInputOption:'USER_ENTERED',data})});
    const rq=[{repeatCell:{range:{sheetId:sid_['Итоги'],startRowIndex:0,endRowIndex:1000,startColumnIndex:0,endColumnIndex:8},cell:{},fields:'userEnteredFormat'}}]; const R=(s,r0,r1,c0,c1,cell,fields)=>rq.push({repeatCell:{range:{sheetId:sid_[s],startRowIndex:r0,endRowIndex:r1,startColumnIndex:c0,endColumnIndex:c1},cell:{userEnteredFormat:cell},fields:'userEnteredFormat('+fields+')'}});
    const HD={backgroundColor:GREEN,textFormat:{bold:true,foregroundColor:WHITE},verticalAlignment:'MIDDLE',wrapStrategy:'WRAP'};
    Object.keys(COLS).forEach(n=>{
      R(n,0,1,0,COLS[n].length,HD,'backgroundColor,textFormat,verticalAlignment,wrapStrategy');
      COLS[n].forEach((c,k)=>{ const f={textFormat:{foregroundColor:c[1]?BLUE:{red:0,green:0,blue:0}}}; if(c[0]) f.numberFormat={type:c[0]===DT?'DATE':'NUMBER',pattern:c[0]};
        R(n,1,1000,k,k+1,f,'numberFormat,textFormat.foregroundColor'); });
    });
    ['Партии','Продажи'].forEach(n=>rq.push({updateDimensionProperties:{range:{sheetId:sid_[n],dimension:'ROWS',startIndex:0,endIndex:1},properties:{pixelSize:42},fields:'pixelSize'}}));
    Object.keys(WID).forEach(n=>WID[n].forEach((w,k)=>rq.push({updateDimensionProperties:{range:{sheetId:sid_[n],dimension:'COLUMNS',startIndex:k,endIndex:k+1},properties:{pixelSize:w},fields:'pixelSize'}})));
    const T='Итоги', NF=(p)=>({numberFormat:{type:'NUMBER',pattern:p}});
    R(T,0,1,0,1,{textFormat:{bold:true,fontSize:14}},'textFormat');
    R(T,1,2,0,1,{textFormat:{italic:true,foregroundColor:GRAY}},'textFormat');
    R(T,2,3,2,9,{textFormat:{bold:true,foregroundColor:GRAY}},'textFormat');
    R(T,3,12,0,1,{textFormat:{bold:true}},'textFormat'); R(T,3,9,5,6,{textFormat:{bold:true}},'textFormat');
    R(T,3,6,1,2,NF(MD),'numberFormat'); R(T,3,6,2,3,NF(USD),'numberFormat'); R(T,3,6,3,4,NF(EUR),'numberFormat');
    R(T,3,9,6,7,NF(MD),'numberFormat'); R(T,3,9,7,8,NF(USD),'numberFormat');
    R(T,3,5,9,10,{numberFormat:{type:'NUMBER',pattern:'#,##0.00 "₸"'},textFormat:{foregroundColor:BLUE}},'numberFormat,textFormat.foregroundColor');
    R(T,2,3,11,17,HD,'backgroundColor,textFormat,verticalAlignment,wrapStrategy'); R(T,3,6,11,12,{textFormat:{bold:true}},'textFormat');
    R(T,3,6,12,13,{numberFormat:{type:'DATE',pattern:DT}},'numberFormat'); R(T,3,6,16,17,NF(MD),'numberFormat'); R(T,3,6,14,15,NF('#,##0'),'numberFormat'); R(T,3,6,15,16,NF('#,##0'),'numberFormat');
    R(T,6,7,11,12,{textFormat:{italic:true,foregroundColor:GRAY}},'textFormat');
    R(T,13,14,0,4,HD,'backgroundColor,textFormat'); R(T,13,14,5,7,HD,'backgroundColor,textFormat');
    R(T,14,1000,1,4,NF(MD),'numberFormat'); R(T,14,1000,6,7,NF(MD),'numberFormat');
    await api(`${B}/${id}:batchUpdate`,{method:'POST',body:JSON.stringify({requests:rq})});
    try{ localStorage.setItem('gs-tpl:'+id,TPL); }catch(e){}
  }
  async function create(){
    const names=Object.keys(H).concat(['Итоги','_data']);
    const r=await api(B,{method:'POST',body:JSON.stringify({properties:{title:'SAM',locale:'ru_RU',timeZone:'Asia/Almaty'},
      sheets:names.map(n=>({properties:Object.assign({title:n,gridProperties:{frozenRowCount:n==='_data'||n==='Итоги'?0:1}},n==='_data'?{hidden:true}:{})}))})});
    await applyTemplate(r.spreadsheetId);
    return r.spreadsheetId;
  }
  async function ensure(){
    if(sid) return sid;
    const p=profile(); if(!p) throw err('needs_reauth');
    const k='gs-sheet:'+p.sub; sid=localStorage.getItem(k);
    if(!sid){
      const q=enc("(name='SAM' or name='Altyn Sauda') and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
      const r=await api('https://www.googleapis.com/drive/v3/files?q='+q+'&fields=files(id)&orderBy=createdTime');
      sid=r.files&&r.files[0]&&r.files[0].id;
    }
    if(!sid) sid=await create();
    try{ localStorage.setItem(k,sid); }catch(e){}
    if(localStorage.getItem('gs-tpl:'+sid)!==TPL){ try{ await applyTemplate(sid); }catch(e){ if(e&&e.code==='needs_reauth') throw e; console.warn('template',e); } }
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

  async function reapply(){ const id=await ensure(); await applyTemplate(id); }
  window.GS={ reapply, enabled:!!CID, profile, hasToken:()=>!!saved(), connect, signIn, signOut, docRef, mcp,
    url:()=>sid?'https://docs.google.com/spreadsheets/d/'+sid+'/edit':'' };
})();
