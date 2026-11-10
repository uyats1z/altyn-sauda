(function(){
  const SHEET_ID = (window.APP_CONFIG&&window.APP_CONFIG.sheetId)||'';
  const SHEET_URL = SHEET_ID ? 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit' : '';
  const LS_KEY = Auth.key();
  const PAY = {kaspi:'Kaspi', cash:'Наличные', debt:'Под реализацию'};
  const $ = id => document.getElementById(id);
  const r2 = n => Math.round(n*100)/100;
  function grp(n,dec){ const neg=n<0; n=Math.abs(+n||0); const k=Math.pow(10,dec); const parts=(Math.round(n*k)/k).toFixed(dec).split('.');
    let i=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.'), f=(parts[1]||'').replace(/0+$/,''); return (neg&&(+parts[0]||f)?'−':'')+i+(f?','+f:''); }
  const money = n => grp(n,0) + ' ₸';
  const signed = n => (n>0?'+':'') + money(n);
  const nf = n => grp(n,2);
  const kgf = n => Math.abs(n)>=1000 ? nf(n/1000)+' т' : nf(n)+' кг';
  const qtyf = (kg,box) => box ? `${nf(kg/box)} ящ. (${kgf(kg)})` : kgf(kg);
  const num = v => { if(typeof v==='number') return isFinite(v)?v:0; let s=String(v==null?'':v).trim(); if(!s) return 0;
    if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.');
    else { const pt=s.split('.'); if(pt.length>2||(pt.length===2&&pt[1].length===3)) s=s.replace(/\./g,''); }
    const x=parseFloat(s.replace(/[^\d.\-]/g,'')); return isFinite(x)?x:0; };
  const fmtIn = v => (v===''||v==null||!isFinite(+v)) ? '' : grp(+v,4).replace('−','-');
  const setN = (id,v) => { $(id).value = (v===''||v==null) ? '' : fmtIn(v); };
  function reformat(el,ev){
    let v=el.value, pos=el.selectionStart==null?v.length:el.selectionStart;
    if(ev&&ev.inputType==='insertText'&&(ev.data==='.'||ev.data===',')&&pos>0){ v=v.slice(0,pos-1).replace(/,/g,'')+','+v.slice(pos).replace(/,/g,''); }
    let sig=0; for(let i=0;i<pos;i++) if(/[\d,]/.test(v[i])) sig++;
    const s=v.replace(/[^\d,]/g,''); const ci=s.indexOf(',');
    let int=ci<0?s:s.slice(0,ci); const frac=ci<0?null:s.slice(ci+1).replace(/,/g,'').slice(0,4);
    const lz=(int.match(/^0+(?=\d)/)||[''])[0].length; int=int.slice(lz); sig=Math.max(0,sig-lz);
    const out=int.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(frac!==null?','+frac:'');
    el.value=out; let n=0,i=0; while(i<out.length&&n<sig){ if(/[\d,]/.test(out[i])) n++; i++; }
    try{ el.setSelectionRange(i,i); }catch(e){}
  }
  document.addEventListener('focusin',e=>{ const el=e.target; if(el&&el.matches&&el.matches('input[data-num]')&&el.value) setTimeout(()=>{ try{el.select();}catch(_){} },0); });
  document.addEventListener('input',e=>{ const el=e.target; if(el&&el.matches&&el.matches('input[data-num]')) reformat(el,e); },true);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  const today = () => { const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); };
  const MONTHS={
    ru:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    en:['January','February','March','April','May','June','July','August','September','October','November','December'],
    ky:['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'],
    kk:['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'],
    tg:['январ','феврал','март','апрел','май','июн','июл','август','сентябр','октябр','ноябр','декабр'],
    tr:['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
    hy:['հունվարի','փետրվարի','մարտի','ապրիլի','մայիսի','հունիսի','հուլիսի','օգոստոսի','սեպտեմբերի','հոկտեմբերի','նոյեմբերի','դեկտեմբերի'],
    az:['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr']};
  let lang='ru'; try{ lang=localStorage.getItem('sam-lang')||'ru'; }catch(e){}
  function dparts(s){ const d=new Date(s+'T00:00'); return [d.getDate(),d.getMonth(),d.getFullYear()]; }
  const dshort = s => { if(!s) return ''; const [d,m]=dparts(s); if(lang==='zh') return `${m+1}月${d}日`; if(lang==='hy') return `${MONTHS.hy[m]} ${d}`; return `${d} ${(MONTHS[lang]||MONTHS.ru)[m]}`; };
  const dlong = s => { if(!s) return ''; const [d,m,y]=dparts(s); if(lang==='zh') return `${y}年${m+1}月${d}日`; if(lang==='ru') return `${d} ${MONTHS.ru[m]} ${y} г.`; return `${dshort(s)} ${y}`; };
  const mshort = ym => { const m=+ym.slice(5,7)-1; if(lang==='zh') return `${m+1}月`; const M=(MONTHS[lang]||MONTHS.ru)[m]; return lang==='ru'?['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][m]:M.slice(0,3); };
  const esc = s => { const d=document.createElement('div'); d.textContent=s==null?'':String(s); return d.innerHTML; };
  const key = s => (s||'').trim().toLowerCase();
  function setSeg(el,v){ el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.v===v)); }
  function segVal(el){ const b=el.querySelector('[aria-pressed="true"]'); return b?b.dataset.v:null; }
  let askCb=null;
  function ask(text,sub,cb){ askCb=cb; $('askText').textContent=text; $('askSub').textContent=sub||''; $('askDlg').showModal(); }
  $('askNo').addEventListener('click',()=>{askCb=null;$('askDlg').close();});
  $('askYes').addEventListener('click',()=>{const cb=askCb; askCb=null; $('askDlg').close(); cb&&cb();});
  function segInit(el,cb){ el.addEventListener('click',e=>{const b=e.target.closest('[data-v]'); if(!b||b.disabled) return; setSeg(el,b.dataset.v); cb&&cb(b.dataset.v);}); }

  const CUR={kzt:'₸',usd:'$',eur:'€'}, CURCODE={kzt:'KZT',usd:'USD',eur:'EUR'};
  let state = { batches: [], rates: {usd:0,eur:0,date:''} };
  const fxNum = n => grp(n,0);
  function fx(n){ const r=state.rates||{}; const p=[]; const sg=n<0?'−':''; if(r.usd>0) p.push(sg+'$'+fxNum(Math.abs(n)/r.usd)); if(r.eur>0) p.push(sg+'€'+fxNum(Math.abs(n)/r.eur)); return p.length?'≈ '+p.join(' · '):''; }
  const subfx = n => { const t=fx(n); return t?`<span class="subfx">${t}</span>`:''; };
  const curPrice = (v,c) => c&&c!=='kzt' ? CUR[c]+nf(v) : money(v);
  let tab='batches', open={}, openBuyer={}, editId=null, saleBatch=null, payWho=null;
  let payMode='kaspi', repayMode='kaspi';
  let docRef=null, saving=false, savePending=false, saveTimer=null;
  let mcp=null, syncTimer=null, syncing=false, syncPending=false;
  if(SHEET_URL) $('sheetLink').href = SHEET_URL; else $('sheetLink').hidden = true;

  function migrate(){
    if(!state.rates) state.rates={usd:0,eur:0,date:''};
    if(!Array.isArray(state.expenses)) state.expenses=[];
    if(!state.people||typeof state.people!=='object') state.people={};
    state.batches.forEach(b=>{ if(!Array.isArray(b.supPaid)) b.supPaid=[]; });
    state.batches.forEach(b=>{ b.sales=b.sales||[]; b.sales.forEach(s=>{ if(s.debtor&&!s.buyer) s.buyer=s.debtor; delete s.debtor; if(!s.buyer&&s.city) s.buyer='Покупатель из '+s.city.trim(); s.repaid=s.repaid||[]; }); });
  }
  const repaidSum = s => (s.repaid||[]).reduce((t,r)=>t+r.amount,0);
  const owed = s => s.pay==='debt' ? Math.max(0, r2(s.kg*s.price - repaidSum(s))) : 0;
  const allSales = () => { const a=[]; state.batches.forEach(b=>b.sales.forEach(s=>a.push({s,b}))); return a; };

  const costsSum = l => (l||[]).reduce((t,x)=>t+(x.amount||0),0);
  const extraOf = b => Array.isArray(b.costs) ? costsSum(b.costs) : (b.delivery||0)+(b.other||0);
  function calc(b){
    const purchase=b.kg*b.price, extra=extraOf(b)+(b.customsIn?(b.customs||0):0), cost=purchase+extra, cpk=b.kg>0?cost/b.kg:0;
    const sold=b.sales.reduce((t,x)=>t+x.kg,0), rev=b.sales.reduce((t,x)=>t+x.kg*x.price,0), ship=b.sales.reduce((t,x)=>t+(x.ship||0),0);
    const waste=b.waste||0, left=Math.max(0,r2(b.kg-sold-waste)), profit=rev-cost-ship;
    return {purchase,extra,cost,cpk,sold,rev,ship,waste,left,profit,avg:sold?rev/sold:0,breakeven:left>0&&profit<0?-profit/left:null};
  }

  /* ---------- render ---------- */
  function render(){
    let tc=0,tr=0,tl=0,tp=0;
    state.batches.forEach(b=>{const c=calc(b);tc+=c.cost;tr+=c.rev;tl+=c.left;tp+=c.profit;}); tp-=expTotal();
    $('tProfit').textContent = state.batches.length ? signed(tp) : '0 ₸';
    $('tProfit').className = 'big ' + (tp>=0?'pos':'neg');
    $('tFx').textContent = state.batches.length ? fx(tp) : '';
    const R=state.rates||{}; $('rateTxt').textContent = (R.usd||R.eur) ? [R.usd?'$ '+nf(R.usd):'', R.eur?'€ '+nf(R.eur):''].filter(Boolean).join(' · ') : 'Указать курс';
    $('tCost').textContent=money(tc); $('tRev').textContent=money(tr); $('tLeft').textContent=kgf(tl);
    let k=0,ca=0,d=0; const debtors=new Set(), cashFx={usd:0,eur:0};
    allSales().forEach(({s})=>{
      const sum=s.kg*s.price;
      if(s.pay==='kaspi') k+=sum; else if(s.pay==='cash') ca+=sum;
      if(s.pay==='cash'&&s.priceCur&&s.priceCur!=='kzt'&&s.priceOrig) cashFx[s.priceCur]+=s.kg*s.priceOrig;
      s.repaid.forEach(r=>{ if(r.method==='kaspi') k+=r.amount; else { ca+=r.amount; if(r.cur&&r.cur!=='kzt') cashFx[r.cur]+=r.orig||0; } });
      const o=owed(s); d+=o; if(o>0) debtors.add(key(s.buyer));
    });
    $('tKaspi').textContent=money(k); $('tCash').textContent=money(ca); $('tDebt').textContent=money(d);
    const cf=[cashFx.usd?'$'+fxNum(cashFx.usd):'', cashFx.eur?'€'+fxNum(cashFx.eur):''].filter(Boolean).join(' · ');
    $('tCashFx').textContent = cf ? 'в т.ч. '+cf : '';
    document.querySelectorAll('.dcount').forEach(el=>{el.hidden=!debtors.size; el.textContent=debtors.size;});
    $('openSale').disabled = !state.batches.some(b=>calc(b).left>0);
    document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-selected', t.dataset.tab===tab));
    $('vTitle').textContent={batches:'Партии',sales:'Продажи',buyers:'Покупатели',report:'Отчёт'}[tab];
    $('view').className='v-'+tab;
    $('view').innerHTML = tab==='batches' ? renderBatches() : tab==='sales' ? renderSales() : tab==='report' ? renderReport() : renderBuyers();
  }

  function renderBatches(){
    if(!state.batches.length) return `<div class="empty">Партий пока нет. Нажмите ${document.documentElement.dataset.layout==='mobile'?'«+» → «Новая партия»':'«Новая партия»'}: укажите, сколько заехало и почём.</div>`;
    const list=state.batches.slice().sort((a,b)=>{const la=calc(a).left>0, lb=calc(b).left>0; if(la!==lb) return la?-1:1; return (b.date||'').localeCompare(a.date||'');});
    return list.map(b=>{
      const c=calc(b), isOpen=!!open[b.id];
      const sP=b.kg?Math.min(100,c.sold/b.kg*100):0, wP=b.kg?Math.min(100-sP,c.waste/b.kg*100):0;
      return `<article class="card" data-id="${b.id}">
        <button class="head" data-act="toggle" aria-expanded="${isOpen}">
          <span class="name">${esc(b.name)}</span>
          <span class="right ${c.profit>=0?'pos':'neg'}">${signed(c.profit)}<small>${c.profit>=0?'заработано':'ещё не окупилось'}</small>${subfx(c.profit)}</span>
          <span class="sub">${dshort(b.date)}, ${b.supCredit?`взяли под реализацию у ${esc(b.supplier||'')}: `:''}${qtyf(b.kg,b.boxKg)}, ${b.supCredit?'по':'закуп'} ${b.priceCur&&b.priceCur!=='kzt'?`${curPrice(b.priceOrig,b.priceCur)}/кг по курсу ${nf(b.rate)} = `:''}${money(b.price)}/кг</span>
        </button>
        <div class="bar" aria-hidden="true"><i class="s" style="width:${sP}%"></i><i class="w" style="width:${wP}%"></i></div>
        <div class="legend">${b.deal?dealTag(b.deal):''}<span>Продано ${qtyf(c.sold,b.boxKg)}</span>${c.waste?`<span>Порча ${kgf(c.waste)}</span>`:''}<span>Осталось ${qtyf(c.left,b.boxKg)}</span>${c.left>0?ageTag(b.date,'лежит',5,10):''}</div>
        ${isOpen?`<div class="body">
          <div class="facts">
            <div>Вложено<b>${money(c.cost)}</b>${subfx(c.cost)}</div>
            <div>Себестоимость<b>${money(c.cpk)}/кг</b>${b.boxKg?`<span class="subfx" style="color:var(--muted)">${money(c.cpk*b.boxKg)} за ящик</span>`:''}</div>
            <div>Выручка<b>${money(c.rev)}</b>${subfx(c.rev)}</div>
          </div>
          ${b.customs?`<div class="callout">Таможня: ${b.customsCur&&b.customsCur!=='kzt'?`<b>${CUR[b.customsCur]}${nf(b.customsVal)}</b> по курсу ${nf(b.customsRate)} = `:''}${b.customsUnit==='box'&&b.boxKg?`<b>${money(b.customsVal*(b.customsCur&&b.customsCur!=='kzt'?b.customsRate:1))}</b> за ящик × ${nf(b.kg/b.boxKg)} ящ. = `:''}<b>${money(b.customs)}</b> ${b.customsIn?'(входит в «Вложено» и себестоимость)':'(отдельно, в «Вложено» не входит)'}.</div>`:''}
          ${Array.isArray(b.costs)&&b.costs.length?`<div class="callout">Расходы: ${b.costs.map(x=>`${esc(x.name)} <b>${money(x.amount)}</b>${x.cur&&x.cur!=='kzt'?` (${CUR[x.cur]}${nf(x.orig)})`:''}`).join(', ')}. Всего <b>${money(c.extra)}</b>.</div>`:''}
          ${c.breakeven!==null?`<div class="callout">Чтобы выйти в ноль, остаток продавайте не дешевле <b>${money(c.breakeven)}</b> за кг${b.boxKg?` (<b>${money(c.breakeven*b.boxKg)}</b> за ящик)`:''}.</div>`:''}
          <div class="cardbtns">
            ${c.left>0?`<button class="btn small primary" data-act="sell">Продать</button>`:''}
            <button class="btn small" data-act="edit">Изменить</button>
          </div>
        </div>`:''}
      </article>`;
    }).join('');
  }

  function payTag(s){
    if(s.pay==='debt'){ const o=owed(s); return o>0?`<span class="tag debt">долг ${money(o)}</span>`:`<span class="tag paid">долг закрыт</span>`; }
    return s.pay?`<span class="tag ${s.pay}">${PAY[s.pay]}</span>`:'';
  }

  function renderSales(){
    const all=allSales();
    if(!all.length) return '<div class="empty">Продаж пока нет. Нажмите «Продажа / отправка».</div>';
    all.sort((x,y)=>(y.s.date||'').localeCompare(x.s.date||'')||(y.s.t||0)-(x.s.t||0));
    if(document.documentElement.dataset.layout==='desktop'){
      let rows='', ld='';
      all.forEach(({s,b})=>{
        if(s.date!==ld){ const dt=all.filter(a=>a.s.date===s.date).reduce((t,a)=>t+a.s.kg*a.s.price,0); rows+=`<tr class="dayrow"><td colspan="10">${dshort(s.date)}, всего ${money(dt)}</td></tr>`; ld=s.date; }
        const m=(s.price-calc(b).cpk)*s.kg-(s.ship||0);
        rows+=`<tr data-id="${b.id}"><td>${dshort(s.date)}</td><td>${esc(b.name)}</td><td>${esc(s.buyer||'—')}</td><td>${esc(s.city||'—')}</td>
          <td class="n">${qtyf(s.kg,b.boxKg)}</td><td class="n">${money(s.price)}</td><td class="n"><b>${money(s.kg*s.price)}</b></td>
          <td>${payTag(s).replace('margin-left:6px','')}</td><td class="n ${m>=0?'pos':'neg'}">${signed(m)}</td>
          <td style="white-space:nowrap"><button class="iconbtn" data-act="invoice" data-sale="${s.id}" aria-label="Накладная" title="Накладная"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3"/></svg></button><button class="iconbtn" data-act="delsale" data-sale="${s.id}" aria-label="Удалить продажу">✕</button></td></tr>`;
      });
      return `<div class="tblwrap"><table class="tbl"><thead><tr><th>Дата</th><th>Фрукт</th><th>Покупатель</th><th>Город</th><th class="n">Количество</th><th class="n">Цена/кг</th><th class="n">Сумма</th><th>Оплата</th><th class="n">Заработок</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
    let html='', last='';
    all.forEach(({s,b})=>{
      if(s.date!==last){ const dt=all.filter(a=>a.s.date===s.date).reduce((t,a)=>t+a.s.kg*a.s.price,0); html+=`<div class="day">${dshort(s.date)}, всего ${money(dt)}</div>`; last=s.date; }
      const m=(s.price-calc(b).cpk)*s.kg-(s.ship||0);
      const who=[s.buyer,s.city].filter(Boolean).map(esc).join(', ');
      html+=`<div class="sale" data-id="${b.id}">
        <span class="t">${esc(b.name)}${who?` → ${who}`:''}</span>
        <span class="sum">${money(s.kg*s.price)}<small class="${m>=0?'pos':'neg'}">${signed(m)}</small></span>
        <button class="iconbtn inv" data-act="invoice" data-sale="${s.id}" aria-label="Накладная" title="Накладная"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6 M9 16h3"/></svg></button>
        <button class="iconbtn x" data-act="delsale" data-sale="${s.id}" aria-label="Удалить продажу">✕</button>
        <span class="d">${qtyf(s.kg,b.boxKg)} по ${money(s.price)}/кг${payTag(s)}</span>
      </div>`;
    });
    return html;
  }

  const KZ_CITIES=['Алматы','Астана','Шымкент','Актау','Актобе','Атырау','Караганда','Костанай','Кокшетау','Конаев','Кызылорда','Орал','Павлодар','Петропавловск','Семей','Талдыкорган','Тараз','Туркестан','Усть-Каменогорск','Уральск','Экибастуз','Рудный','Темиртау','Жезказган','Балхаш','Сатпаев','Степногорск','Щучинск','Аркалык','Лисаковск','Хромтау','Жанаозен','Аксу','Аральск','Арыс','Атбасар','Ерейментау','Жаркент','Житикара','Зайсан','Кентау','Капшагай','Курчатов','Кульсары','Риддер','Приозёрск','Сарань','Сарыагаш','Серебрянск','Тобыл','Текели','Шар','Шардара','Шу','Шахтинск','Алтай','Абай','Байконыр','Ушарал','Казалинск','Каражал','Каскелен','Есик','Талгар','Макинск','Акколь','Державинск','Есиль','Каратау','Жетысай','Ленгер','Сарканд','Уштобе','Кандыагаш','Эмба','Форт-Шевченко','Мамлютка','Булаево','Тайынша','Жосалы','Аягоз'];
  function buyerGroups(){
    const g={};
    allSales().forEach(({s,b})=>{
      if(!s.buyer) return; const k=key(s.buyer);
      const p=g[k]=g[k]||{name:s.buyer.trim(),cities:new Set(),items:[],total:0,owed:0,kg:0};
      if(s.city) p.cities.add(s.city.trim());
      p.items.push({s,b}); p.total+=s.kg*s.price; p.owed+=owed(s); p.kg+=s.kg;
    });
    Object.values(g).forEach(p=>p.items.sort((x,y)=>(x.s.date||'').localeCompare(y.s.date||'')||(x.s.t||0)-(y.s.t||0)));
    return g;
  }

  function renderBuyers(){
    const g=Object.values(buyerGroups()).sort((a,b)=>(b.owed-a.owed)||(b.total-a.total));
    if(!g.length) return '<div class="empty">Покупателей пока нет. Вписывайте имя покупателя при продаже, и здесь будет видно, кто сколько взял и сколько должен.</div>';
    return g.map(p=>{
      const k=key(p.name), isOpen=!!openBuyer[k], paid=p.total-p.owed;
      const events=[];
      p.items.forEach(({s,b})=>{
        events.push({date:s.date,t:s.t||0,html:`<div><span>${dshort(s.date)}: ${esc(b.name)} ${qtyf(s.kg,b.boxKg)}${s.city?`, ${esc(s.city)}`:''}${payTag(s)}</span><span>${money(s.kg*s.price)}</span></div>`});
        s.repaid.forEach((r,i)=>events.push({date:r.date,t:r.t||0,html:`<div style="align-items:center"><span class="pos">${dshort(r.date)}: оплата, ${PAY[r.method]}${r.cur&&r.cur!=='kzt'?` ${CUR[r.cur]}${nf(r.orig)} по курсу ${nf(r.rate)}`:''}</span><span class="pos" style="white-space:nowrap">+${money(r.amount)}<button class="iconbtn" data-act="delpay" data-sale="${s.id}" data-i="${i}" aria-label="Удалить оплату">✕</button></span></div>`}));
      });
      events.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.t-a.t);
      return `<article class="card">
        <button class="head" data-act="buyer" data-who="${esc(p.name)}" aria-expanded="${isOpen}">
          <span class="name">${esc(p.name)}</span>
          <span class="right ${p.owed>0?'neg':'pos'}">${p.owed>0?money(p.owed):'0 ₸'}<small>${p.owed>0?'должен':'долгов нет'}</small>${p.owed>0?subfx(p.owed):''}</span>
          <span class="sub">${[...p.cities].map(esc).join(', ')}${p.cities.size?', ':''}взял ${kgf(p.kg)} на ${money(p.total)}, оплатил ${money(paid)}</span>
        </button>
        ${p.owed>0?`<div style="padding:0 14px 10px">${p.items.filter(x=>owed(x.s)>0).map(x=>conLine(x.s,x.b)).join('')}</div>`:''}
          ${(()=>{ const ph=phoneOf(p.name); const btns=[];
          if(p.owed>0) btns.push(`<button class="btn small primary" data-act="paydebt" data-who="${esc(p.name)}">Принять оплату</button>`);
          if(ph) btns.push(`<a class="btn small wa" target="_blank" rel="noopener" href="${waLink(ph, p.owed>0?debtText(p):'Здравствуйте, '+p.name+'!')}">${p.owed>0?'Напомнить':'WhatsApp'}</a>`);
          return btns.length?`<div class="btnrow">${btns.join('')}</div>`:''; })()}
        ${isOpen?`<div class="body hist"><div class="phone"><span>${phoneOf(p.name)?'WhatsApp: '+esc(phoneOf(p.name)):'Номер WhatsApp не указан'}</span><button class="linkbtn" data-act="phone" data-who="${esc(p.name)}">${phoneOf(p.name)?'Изменить':'+ Добавить номер'}</button></div>${events.map(e=>e.html).join('')}</div>`:''}
      </article>`;
    }).join('');
  }


  /* ===== report, expenses, suppliers, phones, invoices ===== */
  const DAY=86400000;
  const iso = d => { const x=new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,10); };
  const dnum = s => s ? Math.round(new Date(s+'T00:00').getTime()/DAY) : 0;
  const daysAgo = s => Math.max(0, dnum(today())-dnum(s));
  const inR = (s,R) => !!s && s>=R[0] && s<=R[1];
  const expTotal = () => (state.expenses||[]).reduce((t,e)=>t+(e.amount||0),0);
  let period='month';
  function periodRange(){
    const t=today();
    if(period==='today') return [t,t];
    if(period==='week'){ const d=new Date(t+'T00:00'); d.setDate(d.getDate()-6); return [iso(d),t]; }
    if(period==='month') return [t.slice(0,8)+'01',t];
    return ['0000-00-00','9999-99-99'];
  }
  function ageTag(date,word,warn,bad){ const d=daysAgo(date); if(!date) return ''; const cls=d>=bad?'debt':d>=warn?'warn':''; return `<span class="tag ${cls}">${word} ${d} дн.</span>`; }
  function oldestDebtTag(p){ const open=p.items.filter(x=>owed(x.s)>0); if(!open.length) return '';
    const dues=open.map(x=>x.s.due).filter(Boolean).sort(); return ' '+(dues.length?dueTag(dues[0]):ageTag(open[0].s.date,'долг',7,14)); }
  function salePriceTxt(s,b){
    const perBox = s.priceUnit==='box'&&b.boxKg;
    const f = s.priceCur&&s.priceCur!=='kzt'&&s.priceOrig;
    const base = perBox ? `${money(s.price*b.boxKg)} за ящик` : `${money(s.price)} за кг`;
    return f ? `${CUR[s.priceCur]}${nf(perBox?s.priceOrig*b.boxKg:s.priceOrig)} ${perBox?'за ящик':'за кг'} (${base})` : base;
  }
  function conLine(s,b){
    const sum=s.kg*s.price, paid=repaidSum(s), o=owed(s);
    return `<div class="supline"><b>${esc(b.name)}</b>, ${dshort(s.date)}: взял <b>${qtyf(s.kg,b.boxKg)}</b> по <b>${salePriceTxt(s,b)}</b>, на ${money(sum)}${paid?`, оплатил ${money(paid)}`:''}. Осталось <b class="neg">${money(o)}</b>.${s.due?`<br>Оплатить до <b>${dshort(s.due)}</b> ${dueTag(s.due)}`:''}</div>`;
  }

  /* phones / WhatsApp */
  const phoneOf = name => { const r=(state.people||{})[key(name)]; return r&&r.phone||''; };
  function waDigits(ph){ let d=String(ph||'').replace(/\D/g,''); if(d.length===11&&d[0]==='8') d='7'+d.slice(1); if(d.length===10) d='7'+d; return d; }
  function waLink(ph,text){ const d=waDigits(ph); text=tr(text); return `https://wa.me/${d}${text?`?text=${encodeURIComponent(text)}`:''}`; }
  function debtText(p){
    const lines=p.items.filter(x=>owed(x.s)>0).map(({s,b})=>{ const paid=repaidSum(s);
      return `• ${b.name} от ${dshort(s.date)}: взяли ${qtyf(s.kg,b.boxKg)} по ${salePriceTxt(s,b)}, на ${money(s.kg*s.price)}${paid?`, оплачено ${money(paid)}`:''}. Осталось ${money(owed(s))}${s.due?`, оплатить до ${dshort(s.due)}`:''}.`; });
    return `Здравствуйте, ${p.name}! Напоминаем об оплате товара, взятого под реализацию, всего ${money(p.owed)}:\n${lines.join('\n')}\nSAM`;
  }
  let phoneKey=null;
  function openPhone(name,kind){
    phoneKey=key(name); $('phoneTitle').textContent=(kind==='sup'?'Поставщик: ':'')+name;
    $('phoneIn').value=phoneOf(name); $('phoneErr').textContent=''; $('phoneDel').hidden=!phoneOf(name);
    $('phonePick').hidden=!('contacts' in navigator && 'ContactsManager' in window);
    $('phoneDlg').showModal();
  }
  $('phonePick').addEventListener('click',async()=>{
    try{ const r=await navigator.contacts.select(['tel'],{multiple:false}); if(r&&r[0]&&r[0].tel&&r[0].tel[0]) $('phoneIn').value=r[0].tel[0]; }
    catch(e){ $('phoneErr').textContent='Контакты недоступны здесь, впишите номер вручную.'; }
  });
  $('phoneSave').addEventListener('click',()=>{
    const v=$('phoneIn').value.trim(); const d=waDigits(v);
    if(d.length<11){ $('phoneErr').textContent='Проверьте номер: нужно 11 цифр, например +7 701 123 45 67.'; return; }
    state.people[phoneKey]=Object.assign({},state.people[phoneKey],{phone:'+'+d}); $('phoneDlg').close(); changed();
  });
  $('phoneDel').addEventListener('click',()=>{ if(state.people[phoneKey]) delete state.people[phoneKey].phone; $('phoneDlg').close(); changed(); });

  /* suppliers */
  const supPaidSum = b => (b.supPaid||[]).reduce((t,r)=>t+r.amount,0);
  const supOwed = b => b.supCredit ? Math.max(0, r2(b.kg*b.price - supPaidSum(b))) : 0;
  function supplierGroups(){
    const g={};
    state.batches.forEach(b=>{ if(!b.supCredit||!b.supplier) return; const k=key(b.supplier);
      const p=g[k]=g[k]||{name:b.supplier.trim(),items:[],owed:0,total:0}; p.items.push({b}); p.owed+=supOwed(b); p.total+=b.kg*b.price; });
    Object.values(g).forEach(p=>p.items.sort((x,y)=>(x.b.date||'').localeCompare(y.b.date||'')));
    return g;
  }

  function dueTag(d){ if(!d) return ''; const left=dnum(d)-dnum(today());
    if(left<0) return `<span class="tag debt">просрочено на ${-left} дн.</span>`;
    if(left===0) return `<span class="tag debt">сегодня</span>`;
    return `<span class="tag ${left<=3?'warn':''}">осталось ${left} дн.</span>`; }
  function supLine(b){
    const f=b.priceCur&&b.priceCur!=='kzt';
    const priceTxt = f ? `${CUR[b.priceCur]}${nf(b.priceOrig)}/кг (${money(b.price)})` : `${money(b.price)}/кг`;
    const paid=supPaidSum(b);
    return `<div class="supline"><b>${esc(b.name)}</b>, ${dshort(b.date)}: взяли <b>${qtyf(b.kg,b.boxKg)}</b> по <b>${priceTxt}</b>, на ${money(b.kg*b.price)}${paid?`, оплатили ${money(paid)}`:''}.<br>Оплатить до <b>${b.supDue?dshort(b.supDue):'—'}</b> ${dueTag(b.supDue)}</div>`;
  }
  /* expenses */
  let expCat='Аренда';
  const expRate = () => { const c=$('expCur').value; return c==='kzt'?1:((state.rates||{})[c]||0); };
  function expUi(){ const c=$('expCur').value, v=num($('expAmt').value), rt=expRate(); $('expHint').textContent = c==='kzt'||!v ? '' : rt>0 ? `1 ${CUR[c]} = ${nf(rt)} ₸, это ${money(v*rt)}` : 'Нет курса: укажите его в «Курс валют»'; }
  $('expCur').addEventListener('change',expUi); $('expAmt').addEventListener('input',expUi);
  function openExp(){ expCat='Аренда'; setSeg($('expCats'),expCat); setN('expAmt',''); $('expCur').value='kzt'; expUi(); $('expNote').value=''; $('expDate').value=today(); $('expErr').textContent=''; $('expDlg').showModal(); }
  segInit($('expCats'),v=>{ expCat=v; });
  $('saveExp').addEventListener('click',()=>{
    const a=num($('expAmt').value); if(a<=0){ $('expErr').textContent='Укажите сумму.'; return; }
    const ec=$('expCur').value, er=expRate(); if(ec!=='kzt'&&!(er>0)){ $('expErr').textContent='Нет курса. Укажите его в «Курс валют».'; return; }
    state.expenses.push({id:uid(),date:$('expDate').value||today(),cat:expCat,amount:r2(a*er),cur:ec,orig:ec==='kzt'?null:a,rate:ec==='kzt'?null:er,note:$('expNote').value.trim(),t:Date.now()});
    $('expDlg').close(); if(tab!=='report'){ tab='report'; } changed();
  });

  /* report */
  function renderReport(){
    const R=periodRange();
    let kg=0,boxes=0,rev=0,margin=0,k=0,ca=0,n=0; const bucket={};
    allSales().forEach(({s,b})=>{
      if(inR(s.date,R)){ const sum=s.kg*s.price; kg+=s.kg; if(b.boxKg) boxes+=s.kg/b.boxKg; rev+=sum; n++;
        margin+=(s.price-calc(b).cpk)*s.kg-(s.ship||0);
        if(s.pay==='kaspi') k+=sum; else if(s.pay==='cash') ca+=sum;
        const bk=period==='all'?s.date.slice(0,7):s.date; bucket[bk]=(bucket[bk]||0)+sum; }
      (s.repaid||[]).forEach(r=>{ if(inR(r.date,R)){ if(r.method==='kaspi') k+=r.amount; else ca+=r.amount; } });
    });
    const exps=state.expenses.filter(e=>inR(e.date,R)).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.t||0)-(a.t||0));
    const ex=exps.reduce((t,e)=>t+e.amount,0);
    let wcost=0, stockKg=0, stockCost=0;
    state.batches.forEach(b=>{ const c=calc(b); if(b.waste&&inR(b.date,R)) wcost+=b.waste*c.cpk; stockKg+=c.left; stockCost+=c.left*c.cpk; });
    wcost=r2(wcost); stockCost=r2(stockCost);
    const net=margin-ex-wcost;
    const seg=`<div class="seg wide repseg">${[['today','Сегодня'],['week','Неделя'],['month','Месяц'],['all','Всё время']].map(([v,l])=>`<button data-act="period" data-v="${v}" aria-pressed="${period===v}">${l}</button>`).join('')}</div>`;
    let keys=[];
    if(period==='week'||period==='month'){ let d=new Date(R[0]+'T00:00'); const end=R[1]; while(iso(d)<=end){ keys.push(iso(d)); d.setDate(d.getDate()+1); } }
    else if(period==='all'){ keys=Object.keys(bucket).sort(); }
    let chart='';
    if(keys.length>1&&keys.some(x=>bucket[x]>0)){
      const W=600,H=170,pad=18,bw=(W-pad*2)/keys.length, mx=Math.max(1,...keys.map(x=>bucket[x]||0));
      const bars=keys.map((x,i)=>{ const v=bucket[x]||0, hgt=Math.round((H-40)*v/mx); const X=pad+i*bw+bw*0.15, w=Math.max(2,bw*0.7);
        const lbl = period==='all' ? mshort(x) : String(+x.slice(8));
        const showL = keys.length<=16 || i%Math.ceil(keys.length/12)===0;
        return `<rect class="bar-r" x="${X}" y="${H-22-hgt}" width="${w}" height="${Math.max(hgt,v?2:0)}" rx="3"><title>${esc(lbl)}: ${money(v)}</title></rect>${showL?`<text x="${X+w/2}" y="${H-6}" text-anchor="middle">${esc(lbl)}</text>`:''}`; }).join('');
      chart=`<div class="chartcard"><div style="font-size:.85rem;color:var(--muted);margin-bottom:6px">Выручка по ${period==='all'?'месяцам':'дням'}</div><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График выручки">${bars}</svg></div>`;
    }
    const sups=Object.values(supplierGroups()).filter(p=>p.owed>0).sort((a,b)=>b.owed-a.owed);
    return `${seg}
      <div class="repbig"><div class="l">Заработали чистыми${period==='all'?'':' за период'}</div><div class="v ${net>=0?'pos':'neg'}">${signed(net)}</div>${subfx(net)}</div>
      ${period==='all'&&stockKg>0?`<div class="callout">Ещё не продано: <b>${kgf(stockKg)}</b> на ${money(stockCost)}. В заработок это не входит. В «Прибыль по всем партиям» эти затраты уже вычтены, поэтому цифры отличаются на эту сумму.</div>`:''}
      <div class="repgrid">
        <div>Продано<b>${kgf(kg)}</b>${boxes?`${nf(boxes)} ящ.`:''}</div>
        <div>Выручка<b>${money(rev)}</b>${n} ${n%10===1&&n%100!==11?'продажа':(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?'продажи':'продаж')}</div>
        <div>Наценка с продаж<b class="${margin>=0?'pos':'neg'}">${signed(margin)}</b></div>
        <div>Пришло на Kaspi<b>${money(k)}</b></div>
        <div>Пришло наличными<b>${money(ca)}</b></div>
        ${wcost?`<div>Порча<b class="neg">−${money(wcost)}</b></div>`:''}
        <div>Общие расходы<b class="${ex?'neg':''}">${ex?'−'+money(ex):money(0)}</b></div>
      </div>
      ${chart}
      <div class="sechead"><h3>Общие расходы</h3><button class="btn small" data-act="addexp">+ Расход</button></div>
      ${exps.length?exps.map(e=>`<div class="row"><div><b>${esc(e.cat)}</b>${e.note?` <span class="m">${esc(e.note)}</span>`:''}<div class="m">${dshort(e.date)}${e.cur&&e.cur!=='kzt'?`, ${CUR[e.cur]}${nf(e.orig)} по курсу ${nf(e.rate)}`:''}</div></div><div style="display:flex;align-items:center"><b class="neg">−${money(e.amount)}</b><button class="iconbtn" data-act="delexp" data-id="${e.id}" aria-label="Удалить расход">✕</button></div></div>`).join(''):'<div class="empty" style="padding:18px">Расходов за этот период нет. Аренду склада, грузчиков, бензин и зарплату записывайте сюда, тогда прибыль будет точной.</div>'}
      <div class="sechead"><h3>Под реализацию: вы должны</h3></div>
      ${sups.length?sups.map(p=>{ const ph=phoneOf(p.name); return `<article class="card"><div class="head" style="cursor:default"><span class="name">${esc(p.name)}</span><span class="right neg">${money(p.owed)}<small>вы должны</small>${subfx(p.owed)}</span></div>
        <div style="padding:0 14px 10px">${p.items.filter(x=>supOwed(x.b)>0).map(x=>supLine(x.b)).join('')}</div>
        <div class="btnrow"><button class="btn small primary" data-act="paysup" data-who="${esc(p.name)}">Оплатить</button>${ph?`<a class="btn small wa" target="_blank" rel="noopener" href="${waLink(ph,'Здравствуйте, '+p.name+'!')}">WhatsApp</a>`:`<button class="btn small" data-act="phone" data-kind="sup" data-who="${esc(p.name)}">+ Номер</button>`}</div></article>`; }).join(''):'<div class="empty" style="padding:18px">Товара под реализацию сейчас нет. Если берёте у поставщика под реализацию, отметьте это при добавлении партии.</div>'}`;
  }

  /* invoice */
  let invDownloads=null; if(window.claude&&window.claude.use) claude.use('downloads').then(d=>{ invDownloads=d; }).catch(()=>{});
  const logoImg=new Image(); logoImg.src='sam-icon-192.png';
  let invBlob=null, invName='';
  /* one-page PDF with the receipt picture (JPEG), page size cw x ch pt */
  function pdfFromJpeg(jpg,pw,ph,cw,ch){
    const enc=new TextEncoder(), parts=[], offs=[]; let len=0;
    const put=x=>{ const u=typeof x==='string'?enc.encode(x):x; parts.push(u); len+=u.length; };
    const obj=(n,body)=>{ offs[n]=len; put(`${n} 0 obj\n`); put(body); put('\nendobj\n'); };
    put('%PDF-1.4\n');
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${cw} ${ch}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`);
    const cs=`q ${cw} 0 0 ${ch} 0 0 cm /Im0 Do Q`;
    obj(4,`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
    offs[5]=len; put(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pw} /Height ${ph} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`); put(jpg); put('\nendstream\nendobj\n');
    const xr=len; put('xref\n0 6\n0000000000 65535 f \n'); for(let i=1;i<=5;i++) put(String(offs[i]).padStart(10,'0')+' 00000 n \n');
    put(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
    return new Blob(parts,{type:'application/pdf'});
  }
  function openInvoice(sid){
    const hit=allSales().find(x=>x.s.id===sid); if(!hit) return; const {s,b}=hit;
    const sum=s.kg*s.price, o=owed(s), box=b.boxKg;
    const qty = box ? `${nf(s.kg/box)} ящ. (${kgf(s.kg)})` : kgf(s.kg);
    const priceTxt = box&&s.priceUnit==='box' ? `${money(s.price*box)}/ящ.` : `${money(s.price)}/кг`;
    const payTxt = s.pay==='debt' ? (o>0?`Под реализацию, осталось ${money(o)}${s.due?`, оплатить до ${dshort(s.due)}`:''}`:'Под реализацию, оплачено') : PAY[s.pay]||'—';
    const ph=s.buyer?phoneOf(s.buyer):'';
    /* vertical receipt */
    const S=3, RW=380, M=18, PADX=26, MAXH=1600;
    const tmp=document.createElement('canvas'); tmp.width=(RW+M*2)*S; tmp.height=MAXH*S; const g=tmp.getContext('2d'); g.scale(S,S);
    const F=(w,sz)=>`${w} ${sz}px Onest, system-ui, -apple-system, "Segoe UI", sans-serif`;
    const X0=M+PADX, X1=M+RW-PADX, CX=M+RW/2;
    let y=M+30;
    const ink='#22201D', mut='#7A756E';
    function wrap(text,font,maxW){ g.font=font; const words=String(text).split(' '); const lines=[]; let cur='';
      words.forEach(w=>{ const t=cur?cur+' '+w:w; if(g.measureText(t).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=t; }); if(cur) lines.push(cur); return lines; }
    function center(t,font,color,lh){ t=tr(t); g.font=font; g.fillStyle=color; g.textAlign='center'; wrap(t,font,X1-X0).forEach(l=>{ g.fillText(l,CX,y); y+=lh; }); g.textAlign='left'; }
    function pair(l,r,fl,fr,cl,cr,lh){ l=tr(l); r=tr(r); g.font=fr; const rw=g.measureText(r).width; const ls=wrap(l,fl,X1-X0-rw-14);
      ls.forEach((t,k)=>{ g.font=fl; g.fillStyle=cl; g.textAlign='left'; g.fillText(t,X0,y); if(k===0){ g.font=fr; g.fillStyle=cr; g.textAlign='right'; g.fillText(r,X1,y); } y+=lh; }); g.textAlign='left'; }
    function left(t,font,color,lh){ t=tr(t); g.font=font; g.fillStyle=color; wrap(t,font,X1-X0).forEach(l=>{ g.fillText(l,X0,y); y+=lh; }); }
    function dash(){ y+=4; g.strokeStyle='#CFCAC2'; g.lineWidth=1; g.setLineDash([5,4]); g.beginPath(); g.moveTo(X0,y); g.lineTo(X1,y); g.stroke(); g.setLineDash([]); y+=22; }
    y+=6;
    if(logoImg.complete&&logoImg.naturalWidth){ const LS=72; g.save(); g.beginPath(); g.arc(CX,y+LS/2,LS/2,0,Math.PI*2); g.clip(); g.drawImage(logoImg,CX-LS/2,y,LS,LS); g.restore(); y+=LS+22; } else y+=10;
    center('SAM',F(800,24),ink,26);
    const num='№ '+String(s.id).slice(-6).toUpperCase();
    const dt=dlong(s.date);
    center(`${num} · ${dt}`,F(400,13),mut,18);
    dash();
    left('Покупатель',F(400,12),mut,18);
    left([s.buyer||'—',s.city].filter(Boolean).join(', '),F(600,16),ink,22);
    if(ph) left(ph,F(400,13),mut,18);
    dash();
    left(b.name,F(600,16),ink,22);
    const qShort = box ? `${nf(s.kg/box)} ящ.` : kgf(s.kg);
    const pShort = box&&s.priceUnit==='box' ? money(s.price*box) : money(s.price)+'/кг';
    pair(`${qShort} × ${pShort}`, money(sum), F(400,14),F(600,15), mut,ink,20);
    if(box) left(`${kgf(s.kg)}, ${money(s.price)} за кг`,F(400,12),'#A39E96',18);
    if(s.ship){ y+=2; left('Доставка за счёт продавца',F(400,12),mut,18); }
    dash();
    pair('ИТОГО',money(sum),F(700,18),F(800,24),ink,ink,30);
    y+=4;
    if(s.pay==='debt'){
      const paid=repaidSum(s);
      pair('Оплата','Под реализацию',F(400,14),F(600,14),mut,ink,20);
      if(paid) pair('Оплачено',money(paid),F(400,14),F(600,14),mut,'#4E7F23',20);
      pair('Осталось оплатить',money(o),F(400,14),F(700,15),mut,o>0?'#C0453A':'#4E7F23',20);
      if(s.due&&o>0) pair('Оплатить до',dshort(s.due),F(400,14),F(700,15),mut,ink,20);
    } else {
      pair('Оплата',PAY[s.pay]||'—',F(400,14),F(600,14),mut,ink,20);
      pair('Статус','Оплачено',F(400,14),F(600,14),mut,'#4E7F23',20);
    }
    dash();
    center('Спасибо за покупку!',F(500,14),ink,20);
    y+=18;
    const RH=y-M;
    /* final canvas: grey backdrop, white receipt with zigzag edges */
    const H=RH+M*2;
    const cv=document.createElement('canvas'); cv.width=(RW+M*2)*S; cv.height=H*S; const o2=cv.getContext('2d'); o2.scale(S,S);
    o2.fillStyle='#EFEDE8'; o2.fillRect(0,0,RW+M*2,H);
    const zz=8, x0=M, x1=M+RW, yt=M, yb=M+RH;
    o2.save(); o2.shadowColor='rgba(0,0,0,.10)'; o2.shadowBlur=10; o2.shadowOffsetY=2;
    o2.beginPath(); o2.moveTo(x0,yt+zz);
    for(let x=x0;x<x1;x+=zz*2){ o2.lineTo(Math.min(x+zz,x1),yt); o2.lineTo(Math.min(x+zz*2,x1),yt+zz); }
    o2.lineTo(x1,yb-zz);
    for(let x=x1;x>x0;x-=zz*2){ o2.lineTo(Math.max(x-zz,x0),yb); o2.lineTo(Math.max(x-zz*2,x0),yb-zz); }
    o2.closePath(); o2.fillStyle='#fff'; o2.fill(); o2.restore();
    o2.save(); o2.clip(); o2.drawImage(tmp,0,0,(RW+M*2)*S,H*S,0,0,RW+M*2,H); o2.restore();
    $('invImg').src=cv.toDataURL('image/png');
    invBlob=null; invName=`chek-${s.date}-${(s.buyer||'pokupatel').replace(/[^\wа-яё]+/gi,'_')}.pdf`;
    const cw=RW+M*2, ch=H;
    cv.toBlob(async bl=>{ try{ invBlob=pdfFromJpeg(new Uint8Array(await bl.arrayBuffer()),cv.width,cv.height,cw,ch); }catch(e){ invBlob=null; } },'image/jpeg',0.92);
    const paidNow=repaidSum(s);
    const tl=['SAM · Чек '+num, dt, '———————', 'Покупатель: '+[s.buyer||'—',s.city].filter(Boolean).join(', '), '', b.name, `${qShort} × ${pShort} = ${money(sum)}`];
    if(box) tl.push(`(${kgf(s.kg)}, ${money(s.price)} за кг)`);
    tl.push('———————', 'ИТОГО: '+money(sum));
    if(s.pay==='debt'){ tl.push('Оплата: под реализацию'); if(paidNow) tl.push('Оплачено: '+money(paidNow)); tl.push('Осталось оплатить: '+money(o)); if(s.due&&o>0) tl.push('Оплатить до: '+dshort(s.due)); }
    else tl.push('Оплата: '+(PAY[s.pay]||'—')+', оплачено');
    tl.push('———————','Спасибо за покупку!');
    const text=tl.join('\n');
    $('invWa').href = ph ? waLink(ph,text) : `https://wa.me/?text=${encodeURIComponent(tr(text))}`;
    $('invSave').hidden=!invDownloads; $('invErr').textContent='';
    $('invDlg').showModal();
  }
  $('invShare').addEventListener('click',async()=>{
    if(!invBlob){ $('invErr').textContent='Чек ещё готовится, нажмите через секунду.'; return; }
    const f=new File([invBlob],invName,{type:'application/pdf'});
    try{
      if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],title:'Чек SAM'}); return; }
    }catch(e){ if(e&&e.name==='AbortError') return; }
    const u=URL.createObjectURL(invBlob), l=document.createElement('a'); l.href=u; l.download=invName; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),30000);
  });
  $('invSave').addEventListener('click',async()=>{
    if(!invDownloads||!invBlob) return;
    try{ await invDownloads.save({filename:invName,data:invBlob}); }
    catch(e){ if(e&&e.code==='declined') return; $('invErr').textContent='Не получилось сохранить PDF здесь. Нажмите «Отправить чек PDF» или отправьте текстом в WhatsApp.'; if(e&&(e.code==='unavailable'||e.code==='not_granted')) $('invSave').hidden=true; }
  });

  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function playEnter(keepFirst){ const v=$('view'); v.classList.remove('enter','keep-first'); void v.offsetWidth; v.classList.add('enter'); if(keepFirst) v.classList.add('keep-first'); }
  function toggleAnimated(card, opening, apply, findCard){
    if(!opening){
      const body=card&&card.querySelector('.body');
      if(body&&!reduceMotion()){ body.style.height=body.offsetHeight+'px'; body.classList.add('collapse'); setTimeout(apply,260); return; }
      apply(); return;
    }
    apply();
    const c=findCard(); const body=c&&c.querySelector('.body'); if(!body) return;
    const h=body.scrollHeight; body.classList.add('expand'); body.style.setProperty('--h',h+'px');
    body.addEventListener('animationend',()=>{ body.classList.remove('expand'); body.style.removeProperty('--h'); },{once:true});
  }
  /* ---------- view events ---------- */
  document.querySelectorAll('.tabs,.bnav').forEach(n=>n.addEventListener('click',e=>{const t=e.target.closest('[data-tab]'); if(t){ const changedTab=tab!==t.dataset.tab; tab=t.dataset.tab; render(); window.scrollTo(0,0); if(changedTab){ const v=$('view'); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); } }}));
  $('view').addEventListener('animationend',e=>{ if(e.target===$('view')) $('view').classList.remove('enter'); });
  document.body.classList.add('appear'); requestAnimationFrame(()=>{ const v=$('view'); v.classList.add('enter'); });
  $('plusBtn').addEventListener('click',()=>{ $('addSale').disabled=$('addCon').disabled=!state.batches.some(b=>calc(b).left>0); $('addDlg').showModal(); });
  $('addSale').addEventListener('click',()=>{ $('addDlg').close(); openSale(null); });
  $('addBatch').addEventListener('click',()=>{ $('addDlg').close(); openBatch(null); });
  $('addExp').addEventListener('click',()=>{ $('addDlg').close(); openExp(); });
  $('addTake').addEventListener('click',()=>{ $('addDlg').close(); openBatch(null,'consign'); });
  $('addCon').addEventListener('click',()=>{ $('addDlg').close(); openSale(null); payMode='debt'; setSeg($('sPay'),'debt'); $('sDueWrap').hidden=false; salePreview(); });
  $('view').addEventListener('click',e=>{
    const el=e.target.closest('[data-act]'); if(!el) return;
    const act=el.dataset.act;
    if(act==='paydebt'){ openPay(el.dataset.who); return; }
    if(act==='paysup'){ openPay(el.dataset.who,'sup'); return; }
    if(act==='phone'){ openPhone(el.dataset.who, el.dataset.kind||'buyer'); return; }
    if(act==='period'){ if(period===el.dataset.v) return; period=el.dataset.v; render(); playEnter(true); return; }
    if(act==='addexp'){ openExp(); return; }
    if(act==='delexp'){ const ex=state.expenses.find(x=>x.id===el.dataset.id); if(!ex) return; ask(`Удалить расход ${money(ex.amount)}?`,`${ex.cat}${ex.note?', '+ex.note:''}, ${dshort(ex.date)}`,()=>{ state.expenses=state.expenses.filter(x=>x!==ex); changed(); }); return; }
    if(act==='invoice'){ openInvoice(el.dataset.sale); return; }
    if(act==='buyer'){ const k=key(el.dataset.who); const card=el.closest('.card');
      toggleAnimated(card, !openBuyer[k], ()=>{ openBuyer[k]=!openBuyer[k]; render(); }, ()=>{ const h2=[...document.querySelectorAll('#view [data-act="buyer"]')].find(x=>key(x.dataset.who)===k); return h2&&h2.closest('.card'); }); return; }
    if(act==='delpay'){
      const hit=allSales().find(x=>x.s.id===el.dataset.sale); const i=+el.dataset.i; if(!hit||!hit.s.repaid[i]) return;
      const r=hit.s.repaid[i];
      ask(`Удалить оплату ${r.cur&&r.cur!=='kzt'?CUR[r.cur]+nf(r.orig)+' ('+money(r.amount)+')':money(r.amount)}?`,`${dshort(r.date)}, ${PAY[r.method]}. Сумма снова станет долгом.`,()=>{hit.s.repaid.splice(i,1);changed();});
      return;
    }
    const card=el.closest('[data-id]'); if(!card) return;
    const b=state.batches.find(x=>x.id===card.dataset.id); if(!b) return;
    if(act==='toggle'){ const id=b.id; toggleAnimated(card, !open[id], ()=>{ open[id]=!open[id]; render(); }, ()=>document.querySelector(`#view .card[data-id="${id}"]`)); }
    else if(act==='sell'){openSale(b.id);}
    else if(act==='edit'){openBatch(b);}
    else if(act==='setwaste'){
      const w=num(card.querySelector('[data-f=waste]').value), sold=calc(b).sold, err=card.querySelector('[data-err]');
      if(w<0||w>b.kg-sold+1e-9){err.textContent='Порчи больше, чем осталось товара.';return;}
      b.waste=w; changed();
    }
    else if(act==='delbatch'){ ask(`Удалить партию «${b.name}»?`,'Вместе с ней удалятся все её продажи и оплаты.',()=>{state.batches=state.batches.filter(x=>x.id!==b.id);changed();}); }
    else if(act==='delsale'){ const sid=el.dataset.sale; ask('Удалить эту продажу?','Оплаты по ней тоже удалятся.',()=>{b.sales=b.sales.filter(s=>s.id!==sid);changed();}); }
  });
  document.querySelectorAll('[data-close]').forEach(x=>x.addEventListener('click',()=>x.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));

  /* ---------- sale dialog ---------- */
  const curBatch = () => state.batches.find(x=>x.id===saleBatch);
  function saleKg(){ const b=curBatch(), q=num($('sQty').value), u=segVal($('sQtyUnit')); return u==='t'?q*1000 : u==='box'?q*(b&&b.boxKg||0) : q; }
  function saleRate(){ const c=segVal($('sCur')); return c==='kzt'?1:num($('sRate').value); }
  function salePriceOrig(){ const b=curBatch(), p=num($('sPrice').value), u=segVal($('sPriceUnit')); return u==='box'&&b&&b.boxKg ? p/b.boxKg : p; }
  function salePriceKg(){ return salePriceOrig()*saleRate(); }
  let sCurPrev='kzt';
  segInit($('sCur'),v=>{
    const oldRate = sCurPrev==='kzt'?1:num($('sRate').value);
    $('sRateWrap').style.visibility = v==='kzt'?'hidden':'visible';
    if(v!=='kzt') setN('sRate',(state.rates&&state.rates[v])||'');
    const newRate = v==='kzt'?1:num($('sRate').value);
    const p=num($('sPrice').value); if(p&&oldRate&&newRate) setN('sPrice',r2(p*oldRate/newRate));
    sCurPrev=v; salePreview();
  });
  $('sRate').addEventListener('input',()=>salePreview());
  function setupUnits(){
    const b=curBatch(); const hasBox=!!(b&&b.boxKg);
    $('sQtyUnit').innerHTML=(hasBox?'<button data-v="box">ящ.</button>':'')+'<button data-v="kg">кг</button><button data-v="t">т</button>';
    $('sPriceUnit').innerHTML='<button data-v="kg">за кг</button>'+(hasBox?'<button data-v="box">за ящ.</button>':'');
    setSeg($('sQtyUnit'),hasBox?'box':'kg');
    const last=b&&b.sales[b.sales.length-1];
    const pu=hasBox&&last&&last.priceUnit==='box'?'box':'kg'; setSeg($('sPriceUnit'),pu);
    setN('sPrice',last ? r2(pu==='box'?last.price*b.boxKg:last.price) : '');
    setSeg($('sCur'),'kzt'); sCurPrev='kzt'; $('sRateWrap').style.visibility='hidden'; setN('sRate','');
  }
  function linkSaleUnit(){ const q=segVal($('sQtyUnit')); const want=q==='box'?'box':'kg'; if(segVal($('sPriceUnit'))!==want){ const btn=$('sPriceUnit').querySelector(`[data-v="${want}"]`); if(btn) btn.click(); } }
  segInit($('sQtyUnit'),()=>{ linkSaleUnit(); salePreview(); });
  segInit($('sPriceUnit'),(v)=>{ const b=curBatch(); const p=num($('sPrice').value); if(p&&b&&b.boxKg) setN('sPrice',r2(v==='box'?p*b.boxKg:p/b.boxKg)); salePreview(); });
  segInit($('sPay'),v=>{payMode=v; $('sDueWrap').hidden=v!=='debt'; salePreview();});
  $('openSale').addEventListener('click',()=>openSale(null));
  let pendingDeal=null;
  function openSale(id){
    pendingDeal=null;
    const avail=state.batches.filter(b=>calc(b).left>0).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    if(!avail.length) return;
    saleBatch = id&&avail.some(b=>b.id===id) ? id : avail[0].id;
    $('saleChips').innerHTML=avail.map(b=>`<button class="chip" data-b="${b.id}" aria-pressed="${b.id===saleBatch}"><b>${esc(b.name)}</b><span>осталось ${qtyf(calc(b).left,b.boxKg)}</span></button>`).join('');
    const sales=allSales();
    $('buyerList').innerHTML=[...new Set(sales.map(x=>x.s.buyer).filter(Boolean).map(s=>s.trim()))].map(n=>`<option value="${esc(n)}">`).join('');
    $('cityList').innerHTML=[...new Set(KZ_CITIES.concat(sales.map(x=>x.s.city).filter(Boolean).map(s=>s.trim())))].map(n=>`<option value="${esc(n)}">`).join('');
    $('sBuyer').value=''; $('sCity').value=''; setN('sQty',''); setN('sShip',''); $('sDate').value=today(); $('sErr').textContent='';
    if(payMode==='debt') payMode='kaspi'; setSeg($('sPay'),payMode); $('sDueWrap').hidden=true;
    { const d=new Date(today()+'T00:00'); d.setDate(d.getDate()+14); $('sDue').value=iso(d); }
    setupUnits(); linkSaleUnit(); salePreview(); $('sMore').open=false;
    $('saleDlg').showModal();
  }
  $('saleChips').addEventListener('click',e=>{
    const c=e.target.closest('[data-b]'); if(!c) return; saleBatch=c.dataset.b;
    $('saleChips').querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===c));
    setupUnits(); linkSaleUnit(); salePreview();
  });
  $('sBuyer').addEventListener('change',()=>{
    if($('sCity').value) return;
    const k=key($('sBuyer').value); const hit=allSales().filter(x=>key(x.s.buyer)===k&&x.s.city).pop();
    if(hit) $('sCity').value=hit.s.city;
  });
  ['sQty','sPrice','sShip'].forEach(i=>$(i).addEventListener('input',salePreview));
  function salePreview(){
    const b=curBatch(); if(!b) return;
    const kg=saleKg(), pk=salePriceKg(), m=(pk-calc(b).cpk)*kg-num($('sShip').value);
    const qu=segVal($('sQtyUnit')), pu=segVal($('sPriceUnit'));
    $('sQtyHint').textContent = kg ? (qu==='kg' ? (b.boxKg?`${nf(kg/b.boxKg)} ящ.`:'') : `= ${nf(kg)} кг`) : (b.boxKg?`ящик ${nf(b.boxKg)} кг`:'');
    $('sPriceCap').textContent = pu==='box'?'Цена за ящик':'Цена за кг';
    const sc=segVal($('sCur'));
    $('sPriceHint').textContent = pk ? [sc!=='kzt'?`= ${money(pu==='box'&&b.boxKg?pk*b.boxKg:pk)}${pu==='box'?'/ящ.':'/кг'}`:'', b.boxKg&&pu!=='box'?`${money(pk*b.boxKg)}/ящ.`:'', b.boxKg&&pu==='box'?`${money(pk)}/кг`:''].filter(Boolean).join(', ') : '';
    $('pSum').textContent=money(kg*pk); $('pMargin').textContent=signed(m); $('pMargin').className=m>=0?'pos':'neg';
  }
  $('saveSale').addEventListener('click',()=>{
    const b=curBatch(); const kg=r2(saleKg()), pk=salePriceKg(), city=$('sCity').value.trim(), buyer=$('sBuyer').value.trim()||(city?'Покупатель из '+city:'');
    if(!b){$('sErr').textContent='Выберите партию.';return;}
    if(segVal($('sCur'))!=='kzt'&&!(saleRate()>0)){$('sErr').textContent='Укажите курс валюты.';return;}
    if(kg<=0||pk<=0){$('sErr').textContent='Укажите количество и цену.';return;}
    const left=calc(b).left; if(kg>left+1e-9){$('sErr').textContent=`В этой партии осталось только ${qtyf(left,b.boxKg)}.`;return;}
    if(payMode==='debt'&&!buyer){$('sErr').textContent='Укажите покупателя, который берёт под реализацию.';return;}
    if(payMode==='debt'&&!$('sDue').value){$('sErr').textContent='Укажите, до какого числа нужно оплатить.';return;}
    const boxes = b.boxKg ? r2(kg/b.boxKg) : null;
    const sc=segVal($('sCur'));
    const doSave=()=>{
      b.sales.push({id:uid(),kg,price:pk,priceCur:sc,priceOrig:sc==='kzt'?null:r2(salePriceOrig()*10000)/10000,rate:sc==='kzt'?null:saleRate(),priceUnit:segVal($('sPriceUnit')),boxes,date:$('sDate').value||today(),t:Date.now(),pay:payMode,due:payMode==='debt'?$('sDue').value:'',buyer,city,ship:num($('sShip').value),repaid:[]});
      $('saleDlg').close(); changed();
    };
    if(!pendingDeal){ doSave(); return; }
    /* сначала отметить заявку принятой, и только потом записывать продажу: без «висящих» продаж и дублей */
    const pd=pendingDeal, btn=$('saveSale'); btn.disabled=true;
    window.Deals.respond(pd.id,'accepted').then(()=>{
      doSave(); const ns=b.sales[b.sales.length-1]; ns.dealId=pd.id; ns.dealRoot=pd.root||pd.id; pendingDeal=null; changed();
      toast('Заявка принята, запись добавлена.'); refreshDeals();
    }).catch(er=>{
      if(er&&er.code==='stale'){ pendingDeal=null; $('saleDlg').close(); refreshDeals(); }
      $('sErr').textContent=(er&&er.code==='stale')?er.message:'Не удалось принять заявку. Проверьте интернет и повторите.'; if(er&&er.code==='stale') toast(er.message);
    }).finally(()=>{ btn.disabled=false; });
  });

  /* ---------- batch dialog ---------- */
  function linkBatchUnit(){ const q=segVal($('bQtyUnit')); setSeg($('bPriceUnit'), q==='box'?'box':'kg'); }
  segInit($('bQtyUnit'),()=>{ const old=segVal($('bPriceUnit')); linkBatchUnit(); const nw=segVal($('bPriceUnit')); const box=num($('bBox').value); const p=num($('bPrice').value);
    if(p&&box&&old!==nw) setN('bPrice', r2(nw==='box'?p*box:p/box)); batchPreview(); });
  segInit($('bPriceUnit'),batchPreview);
  function batchKg(){ const q=num($('bQty').value), u=segVal($('bQtyUnit')), box=num($('bBox').value); return u==='t'?q*1000 : u==='box'?q*box : q; }
  function batchRate(){ return segVal($('bCur'))==='kzt'?1:num($('bRate').value); }
  function batchPriceOrig(){ const p=num($('bPrice').value), u=segVal($('bPriceUnit')), box=num($('bBox').value); return u==='t'?p/1000 : u==='box'?(box?p/box:0) : p; }
  function batchPriceKg(){ return batchPriceOrig()*batchRate(); }
  let bCurPrev='kzt';
  segInit($('bCur'),v=>{
    const oldRate = bCurPrev==='kzt'?1:num($('bRate').value);
    $('bRateWrap').style.display = v==='kzt'?'none':'flex'; $('bRateLbl').textContent = v==='kzt'?'Курс:':`Курс: 1 ${CUR[v]} =`;
    if(v!=='kzt') setN('bRate',(state.rates&&state.rates[v])||'');
    const newRate = v==='kzt'?1:num($('bRate').value);
    const p=num($('bPrice').value); if(p&&oldRate&&newRate) setN('bPrice',r2(p*oldRate/newRate));
    bCurPrev=v; batchPreview();
  });
  $('bRate').addEventListener('input',()=>batchPreview());
  $('openBatch').addEventListener('click',()=>openBatch(null));
  $('openMore').addEventListener('click',()=>$('plusBtn').click());
  function openBatch(b,mode){
    editId=b?b.id:null;
    const con = b ? !!b.supCredit : mode==='consign';
    $('bTitle').textContent = b ? (con?'Изменить: взято под реализацию':'Изменить партию') : (con?'Взять под реализацию':'Новая партия');
    $('saveBatch').textContent = b ? 'Сохранить изменения' : (con?'Записать':'Добавить партию');
    $('bQtyCap').textContent = con ? 'Сколько взяли' : 'Сколько заехало';
    $('bName').value=b?b.name:''; setN('bBox',b&&b.boxKg?b.boxKg:'');
    const foreign = b && b.priceCur && b.priceCur!=='kzt';
    bCurPrev = foreign ? b.priceCur : 'kzt'; setSeg($('bCur'),bCurPrev);
    $('bRateWrap').style.display = foreign?'flex':'none'; if(foreign) $('bRateLbl').textContent=`Курс: 1 ${CUR[b.priceCur]} =`; setN('bRate',foreign ? b.rate : '');
    if(b){ setSeg($('bQtyUnit'),'kg'); setN('bQty',b.kg); setSeg($('bPriceUnit'),'kg'); setN('bPrice',foreign?b.priceOrig:b.price); }
    else { setSeg($('bQtyUnit'),'t'); setN('bQty',''); setSeg($('bPriceUnit'),'kg'); setN('bPrice',''); }
    { const ex=b?extraOf(b):0; const l=b&&Array.isArray(b.costs)?b.costs:(ex?[{name:'Доставка',amount:ex}]:[]); $('bCosts').innerHTML=''; l.forEach(x=>addCostRow(x.name,x.cur&&x.cur!=='kzt'?x.orig:x.amount,x.cur,x.rate)); if(!l.length) addCostRow('',''); const cc=b&&b.customsCur&&b.customsCur!=='kzt'?b.customsCur:'kzt'; setSeg($('bCustomsCur'),cc); setSeg($('bCustomsUnit'),b?(b.customsUnit==='box'?'box':'total'):'box');
      const cv=b&&b.customs?(b.customsVal!=null?b.customsVal:(cc==='kzt'?b.customs:b.customsOrig)):''; setN('bCustoms',cv); setN('bCustomsRate',cc==='kzt'?'':b.customsRate); $('bCustomsIn').checked = b ? !!b.customsIn : true; customsUi(); }
    $('bDate').value=b?b.date:today(); $('bErr').textContent='';
    if(b) linkBatchUnit();
    $('bWasteWrap').hidden=!b; setN('bWaste',b&&b.waste?b.waste:''); $('delBatch').hidden=!b; $('bMore').open=false;
    $('bSup').value=b&&b.supplier?b.supplier:''; setSeg($('bSupPay'), con?'credit':'paid');
    $('bDue').value = b&&b.supDue ? b.supDue : (()=>{ const d=new Date(today()+'T00:00'); d.setDate(d.getDate()+14); return iso(d); })();
    { const dl=b&&b.deal; $('dealWrap').hidden=!(Auth.google&&window.Deals);
      $('bSupEmail').value = (dl&&dl.toEmail) || ((state.people[key(b&&b.supplier||'')]||{}).email||'');
      renderDealInfo(dl); }
    supToggle();
    $('supList').innerHTML=[...new Set(state.batches.map(x=>x.supplier).filter(Boolean).map(s=>s.trim()))].map(n=>`<option value="${esc(n)}">`).join('');
    batchPreview(); $('batchDlg').showModal();
  }
  ['bQty','bPrice','bBox'].forEach(i=>$(i).addEventListener('input',batchPreview));
  const customsCur = () => segVal($('bCustomsCur'));
  const customsUnit = () => segVal($('bCustomsUnit'));
  const customsBoxes = () => { const bx=num($('bBox').value); return bx>0 ? batchKg()/bx : 0; };
  const customsKzt = () => num($('bCustoms').value)*(customsCur()==='kzt'?1:num($('bCustomsRate').value))*(customsUnit()==='box'?customsBoxes():1);
  function customsUi(){ const c=customsCur(), v=num($('bCustoms').value), rt=c==='kzt'?1:num($('bCustomsRate').value); $('bCustomsRateWrap').style.display=c==='kzt'?'none':'flex'; if(c!=='kzt') $('bCustomsRateLbl').textContent=`Курс: 1 ${CUR[c]} =`;
    let t=''; if(v&&rt>0){ const bx=customsBoxes(), per=v*rt; t = customsUnit()==='box' ? (bx>0 ? `${money(per)} × ${nf(bx)} ящ. = ${money(per*bx)}` : 'Укажите вес ящика') : (c!=='kzt' ? '= '+money(per) : ''); }
    $('bCustomsHint').textContent=t; batchPreview(); }
  segInit($('bCustomsCur'),v=>{ if(v!=='kzt'&&!num($('bCustomsRate').value)){ const r=(state.rates||{})[v]; if(r>0) setN('bCustomsRate',r); } customsUi(); });
  ['bCustoms','bCustomsRate','bQty','bBox'].forEach(i=>$(i).addEventListener('input',customsUi));
  segInit($('bCustomsUnit'),customsUi); $('bCustomsIn').addEventListener('change',customsUi);
  const rateFor = (c,batchCtx) => c==='kzt'?1 : (batchCtx&&segVal($('bCur'))===c&&num($('bRate').value)>0 ? num($('bRate').value) : ((state.rates||{})[c]||0));
  const CURSEL = '<option value="kzt">₸</option><option value="usd">$</option><option value="eur">€</option>';
  function costHint(r){ const c=r.querySelector('.cc').value, v=num(r.querySelector('.ca').value), h=r.querySelector('.ch'); const rt=+r.dataset.rate||0;
    h.textContent = c==='kzt' ? '' : (!v ? '' : rt>0 ? `1 ${CUR[c]} = ${nf(rt)} ₸, это ${money(v*rt)}` : 'Нет курса: укажите его в «Курс валют»'); h.style.color = c!=='kzt'&&v&&!(rt>0)?'var(--loss)':'var(--muted)'; }
  function addCostRow(name,amount,cur,rate){
    const d=document.createElement('div'); d.className='costrow'; d.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;align-items:center';
    d.innerHTML='<input class="cn" list="costNames" placeholder="Что за расход" autocomplete="off" style="flex:1;min-width:0"><input class="ca" type="text" data-num inputmode="decimal" placeholder="0" style="width:32%"><select class="cc" aria-label="Валюта" style="width:auto;padding:0 6px">'+CURSEL+'</select><button type="button" class="iconbtn" aria-label="Убрать расход">✕</button><div class="ch" style="flex-basis:100%;font-size:.8rem;color:var(--muted)"></div>';
    d.querySelector('.cn').value=name||''; d.querySelector('.cc').value=cur||'kzt'; d.dataset.rate = (cur&&cur!=='kzt') ? (rate||rateFor(cur,true)) : 1;
    d.querySelector('.ca').value=amount===''||amount==null?'':fmtIn(amount);
    d.querySelector('.cc').addEventListener('change',()=>{ const c=d.querySelector('.cc').value; d.dataset.rate=rateFor(c,true); costHint(d); batchPreview(); });
    d.querySelector('button').addEventListener('click',()=>{ d.remove(); batchPreview(); });
    d.addEventListener('input',()=>{ costHint(d); batchPreview(); }); $('bCosts').appendChild(d); costHint(d);
  }
  $('bAddCost').addEventListener('click',()=>{ addCostRow('',''); const r=$('bCosts').lastChild; r.querySelector('.cn').focus(); });
  const readCosts = () => [...$('bCosts').querySelectorAll('.costrow')].map(r=>{ const c=r.querySelector('.cc').value, v=num(r.querySelector('.ca').value), rt=c==='kzt'?1:(+r.dataset.rate||0);
    return {name:r.querySelector('.cn').value.trim()||'Расход',amount:r2(v*rt),cur:c,orig:c==='kzt'?null:v,rate:c==='kzt'?null:rt,noRate:c!=='kzt'&&v>0&&!(rt>0)}; }).filter(x=>x.amount>0||x.noRate);
  function batchPreview(){
    if(typeof supSummary==='function'&&$('supBox')&&!$('supBox').hidden) supSummary();
    const kg=batchKg(), box=num($('bBox').value), pk=batchPriceKg();
    const ex=costsSum(readCosts()); $('bCostsTotal').textContent = ex ? 'всего '+money(ex) : ''; const cost=kg*pk+ex+($('bCustomsIn').checked?customsKzt():0);
    const qu=segVal($('bQtyUnit')), pu=segVal($('bPriceUnit'));
    $('bQtyHint').textContent = kg ? (qu==='kg'?(box?`${nf(kg/box)} ящ.`:''):`= ${nf(kg)} кг`)+(qu!=='box'&&box&&qu!=='kg'?`, ${nf(kg/box)} ящ.`:'') : '';
    const isCon = segVal($('bSupPay'))==='credit';
    $('bPriceCap').textContent = (isCon?'По чём взяли ':'Цена закупа ') + (pu==='box'?'за ящик':'за кг');
    const bc=segVal($('bCur'));
    $('bPriceHint').textContent = pk&&(pu!=='kg'||bc!=='kzt') ? `= ${money(pk)}/кг` : '';
    $('pCost').textContent=money(cost);
    $('pCpk').textContent = kg ? money(cost/kg)+'/кг'+(box?`, ${money(cost/kg*box)}/ящ.`:'') : '—';
  }
  function supToggle(){ $('supBox').hidden = segVal($('bSupPay'))!=='credit'; supSummary(); }
  function supSummary(){
    if(segVal($('bSupPay'))!=='credit'){ $('supSum').textContent=''; return; }
    const kg=batchKg(), box=num($('bBox').value), pk=batchPriceKg(), bc=segVal($('bCur'));
    if(!kg||!pk){ $('supSum').textContent=''; return; }
    const po=batchPriceOrig();
    const priceTxt = bc!=='kzt' ? `${CUR[bc]}${nf(po)}/кг (${money(pk)})` : `${money(pk)}/кг`;
    $('supSum').innerHTML = `Взяли <b>${qtyf(kg,box||null)}</b> по <b>${esc(priceTxt)}</b>, к оплате <b>${money(kg*pk)}</b>${$('bDue').value?` до <b>${dshort($('bDue').value)}</b>`:''}`;
  }
  segInit($('bSupPay'),supToggle);
  $('bSup').addEventListener('change',()=>{ const e=(state.people[key($('bSup').value)]||{}).email; if(e&&!$('bSupEmail').value) $('bSupEmail').value=e; });
  ['bQty','bPrice','bBox','bRate','bDue'].forEach(i=>$(i).addEventListener('input',supSummary));
  $('bDue').addEventListener('change',supSummary);
  $('delBatch').addEventListener('click',()=>{ const b=state.batches.find(x=>x.id===editId); if(!b) return; $('batchDlg').close();
    ask(`Удалить партию «${b.name}»?`,'Вместе с ней удалятся все её продажи и оплаты.',()=>{state.batches=state.batches.filter(x=>x.id!==b.id);changed();}); });
  $('saveBatch').addEventListener('click',()=>{
    const name=$('bName').value.trim(), kg=r2(batchKg()), price=batchPriceKg(), box=num($('bBox').value);
    if((segVal($('bQtyUnit'))==='box'||segVal($('bPriceUnit'))==='box')&&!box){$('bErr').textContent='Укажите вес одного ящика.';return;}
    if(readCosts().some(x=>x.noRate)){$('bErr').textContent='Для расхода в валюте нет курса. Укажите его в «Курс валют».';return;}
    if(customsUnit()==='box'&&num($('bCustoms').value)>0&&!(num($('bBox').value)>0)){$('bErr').textContent='Для таможни за ящик укажите вес одного ящика.';return;}
    if(customsCur()!=='kzt'&&num($('bCustoms').value)>0&&!(num($('bCustomsRate').value)>0)){$('bErr').textContent='Укажите курс валюты для таможни.';return;}
    if(segVal($('bCur'))!=='kzt'&&!(batchRate()>0)){$('bErr').textContent='Укажите курс валюты.';return;}
    if(!name||kg<=0||price<=0){$('bErr').textContent='Укажите фрукт, количество и цену закупа.';return;}
    const bc=segVal($('bCur'));
    const supName=$('bSup').value.trim(), supCredit=segVal($('bSupPay'))==='credit';
    if(supCredit&&!supName){$('bErr').textContent='Укажите поставщика, у которого взяли под реализацию.'; return;}
    if(supCredit&&!$('bDue').value){$('bErr').textContent='Укажите, до какого числа нужно оплатить.'; return;}
    const supEmail=supCredit&&!$('dealWrap').hidden ? $('bSupEmail').value.trim().toLowerCase() : '';
    if(supEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supEmail)){$('bErr').textContent='Проверьте email поставщика.'; return;}
    if(supEmail&&Auth.google&&supEmail===String(Auth.google.email||'').toLowerCase()){$('bErr').textContent='Это ваш собственный email. Укажите email поставщика.'; return;}
    const fields={supplier:supName,supCredit,supDue:supCredit?$('bDue').value:'',name,kg,price,priceCur:bc,priceOrig:bc==='kzt'?null:r2(batchPriceOrig()*10000)/10000,rate:bc==='kzt'?null:batchRate(),boxKg:box||null,costs:readCosts().map(({noRate,...x})=>x),customs:r2(customsKzt()),customsVal:num($('bCustoms').value),customsUnit:customsUnit(),customsIn:$('bCustomsIn').checked,customsCur:customsCur(),customsOrig:customsCur()==='kzt'?null:num($('bCustoms').value),customsRate:customsCur()==='kzt'?null:num($('bCustomsRate').value),delivery:costsSum(readCosts()),other:0,date:$('bDate').value||today()};
    if(editId){
      const b=state.batches.find(x=>x.id===editId); const c=calc(b); const w=num($('bWaste').value);
      if(w<0||kg+1e-9<c.sold+w){$('bErr').textContent=`Уже продано ${kgf(c.sold)}${w?` и списано ${kgf(w)}`:''}, вес партии не может быть меньше.`;return;}
      fields.waste=w; Object.assign(b,fields);
    } else { const b=Object.assign({id:uid(),sales:[],waste:0},fields); state.batches.push(b); open[b.id]=true; tab='batches'; }
    const saved=editId?state.batches.find(x=>x.id===editId):state.batches[state.batches.length-1];
    if(supEmail){ state.people[key(supName)]=Object.assign({},state.people[key(supName)],{email:supEmail}); }
    $('batchDlg').close(); changed();
    if(supEmail) maybeSendDeal(saved,supEmail);
  });

  /* ---------- payment dialog ---------- */
  segInit($('payMethod'),v=>{repayMode=v;});
  let payMode2='buyer';
  const payGroup = () => payMode2==='sup' ? supplierGroups()[payWho] : buyerGroups()[payWho];
  const payCurV = () => segVal($('payCur'));
  const payRateV = () => payCurV()==='kzt' ? 1 : num($('payRate').value);
  function payUpdate(){
    const p=payGroup(); if(!p) return;
    const c=payCurV(), r=payRateV();
    $('payRateWrap').style.visibility = c==='kzt'?'hidden':'visible';
    $('payAmtCap').textContent = (payMode2==='sup'?'Сколько заплатили, ':'Сколько отдал, ') + CUR[c];
    $('payAmt').placeholder = c==='kzt' ? fmtIn(r2(p.owed)) : (r>0 ? fmtIn(r2(p.owed/r)) : '');
    $('payOwedFx').textContent = c!=='kzt'&&r>0 ? `= ${CUR[c]}${nf(p.owed/r)} по курсу ${nf(r)}` : fx(p.owed);
    const a=num($('payAmt').value);
    $('payHint').textContent = c!=='kzt'&&a&&r>0 ? `= ${money(a*r)}` : '';
  }
  segInit($('payCur'),v=>{
    if(v!=='kzt'){ setN('payRate',(state.rates&&state.rates[v])||''); repayMode='cash'; setSeg($('payMethod'),'cash'); }
    setN('payAmt',''); payUpdate();
  });
  ['payRate','payAmt'].forEach(i=>$(i).addEventListener('input',payUpdate));
  function openPay(who,mode){
    payMode2=mode==='sup'?'sup':'buyer';
    payWho=key(who); const p=payGroup(); if(!p) return;
    $('payTitle').textContent=(payMode2==='sup'?'Вы платите: ':'Оплата: ')+p.name; $('payOwed').textContent=money(p.owed);
    setN('payAmt',''); $('payDate').value=today(); $('payErr').textContent='';
    setSeg($('payCur'),'kzt'); setN('payRate','');
    setSeg($('payMethod'),repayMode); payUpdate(); $('payDlg').showModal();
  }
  $('savePay').addEventListener('click',()=>{
    const p=payGroup(); const c=payCurV(), rate=payRateV(), orig=num($('payAmt').value);
    if(c!=='kzt'&&!(rate>0)){$('payErr').textContent='Укажите курс.';return;}
    if(!p||orig<=0){$('payErr').textContent='Укажите сумму.';return;}
    let amt=r2(orig*rate);
    if(amt>p.owed+1){$('payErr').textContent = c==='kzt' ? `${payMode2==='sup'?'Вы должны':'Должен'} только ${money(p.owed)}.` : `Должен только ${money(p.owed)}, это ${CUR[c]}${nf(p.owed/rate)}.`;return;}
    amt=Math.min(amt,p.owed);
    const date=$('payDate').value||today(), t=Date.now();
    for(const it of p.items){
      if(amt<=0.001) break;
      const o = payMode2==='sup' ? supOwed(it.b) : owed(it.s); if(o<=0) continue;
      const part=r2(Math.min(o,amt)); const rec={amount:part,method:repayMode,date,t};
      if(c!=='kzt'){ rec.cur=c; rec.rate=rate; rec.orig=r2(part/rate); }
      (payMode2==='sup' ? it.b.supPaid : it.s.repaid).push(rec); amt-=part;
    }
    $('payDlg').close(); changed();
  });

  /* ---------- rates ---------- */
  $('rateBtn').addEventListener('click',()=>{ setN('rUsd',state.rates.usd||''); setN('rEur',state.rates.eur||''); $('rErr').textContent=''; $('rateDlg').showModal(); });
  $('saveRate').addEventListener('click',()=>{
    const u=num($('rUsd').value), e=num($('rEur').value);
    if(u<0||e<0||(!u&&!e)){ $('rErr').textContent='Укажите хотя бы курс доллара.'; return; }
    state.rates={usd:u,eur:e,date:today()}; $('rateDlg').close(); changed();
  });

  /* ---------- заявки на согласие (под реализацию) ---------- */
  let toastT=null;
  function toast(t){ const el=$('toast'); el.textContent=t; el.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{el.hidden=true;},5000); }
  const DEAL_ST={pending:'ждёт согласия',accepted:'поставщик согласен',declined:'поставщик отклонил',cancelled:'отозвана вами'};
  function dealTag(d){ const c={pending:'warn',accepted:'paid',declined:'debt'}[d.status]; return c!==undefined?`<span class="tag ${c}">${DEAL_ST[d.status]}</span>`:''; }
  function renderDealInfo(d){
    const el=$('bDealInfo'); if(!d){ el.innerHTML=''; return; }
    const btn = d.status==='pending' ? '<button type="button" class="btn small" data-di="cancel">Отозвать заявку</button>'
      : (d.status==='declined'||d.status==='cancelled') ? '<button type="button" class="btn small" data-di="resend">Отправить снова</button>' : '';
    el.innerHTML = esc(dealInfoText(d)) + (btn?`<div class="btnrow" style="margin-top:6px">${btn}</div>`:'');
  }
  $('bDealInfo').addEventListener('click',async e=>{
    const el=e.target.closest('[data-di]'); if(!el) return;
    const b=state.batches.find(x=>x.id===editId); if(!b||!b.deal) return;
    try{
      if(el.dataset.di==='cancel'){ await window.Deals.ensureAuth(Auth.google.email); await window.Deals.respond(b.deal.id,'cancelled'); b.deal.status='cancelled'; changed(); renderDealInfo(b.deal); toast('Заявка отозвана.'); refreshDeals(); }
      else if(el.dataset.di==='resend'){ b.deal.fp=''; await maybeSendDeal(b,b.deal.toEmail); renderDealInfo(b.deal); }
    }catch(er){ toast((er&&er.message)||'Не удалось выполнить действие. Проверьте интернет.'); if(er&&er.code==='stale') refreshDeals(); }
  });
  function dealInfoText(d){ return `Заявка поставщику ${d.toEmail}: ${DEAL_ST[d.status]||d.status}.`; }
  const dealFp = (b,email) => [b.name,b.kg,b.price,b.supDue,b.boxKg||'',email].join('|');
  async function maybeSendDeal(b,email){
    if(!b||!window.Deals||!Auth.google) return;
    const fp=dealFp(b,email), old=b.deal;
    if(old&&old.fp===fp&&!old.staleId) return;
    try{
      await window.Deals.ensureAuth(Auth.google.email); /* вход первым действием, пока жив жест пользователя */
      if(old&&old.staleId){ try{ await window.Deals.respond(old.staleId,'cancelled'); }catch(e){} delete old.staleId; changed(); }
      if(old&&old.fp===fp) return;
      const root=old?(old.root||old.id):null;
      const id=await window.Deals.send({fromEmail:Auth.google.email,fromName:Auth.google.name||Auth.google.email,toEmail:email,toName:b.supplier,fruit:b.name,kg:b.kg,boxKg:b.boxKg,price:b.price,due:b.supDue,date:b.date,root});
      b.deal={id,status:'pending',toEmail:email,fp,root:root||id}; changed();
      /* старую заявку отзываем после создания новой; если не вышло, запомним и повторим */
      if(old&&old.status==='pending'){ try{ await window.Deals.respond(old.id,'cancelled'); }catch(e){ if(!e||e.code!=='stale'){ b.deal.staleId=old.id; changed(); } } }
      toast(root?'Изменение отправлено поставщику. Пока он не согласился, действуют прежние условия.':'Заявка отправлена поставщику. Он увидит её в приложении.');
      refreshDeals();
    }catch(e){ toast((e&&e.message)||'Не удалось отправить заявку.'); }
  }
  let dealsCache={incoming:[],outgoing:[]};
  const saleOfDeal = d => { const r=d.root||d.id; return allSales().find(x=>x.s.dealRoot===r); };
  async function refreshDeals(){
    const du=window.Deals&&window.Deals.user();
    if(!window.Deals||!Auth.google||!du||String(du.email||'').toLowerCase()!==String(Auth.google.email||'').toLowerCase()){ dealsCache={incoming:[],outgoing:[]}; renderDealBar(); return; }
    try{
      const [inc,out]=await Promise.all([window.Deals.incoming(),window.Deals.outgoing()]);
      dealsCache={incoming:inc,outgoing:out}; let ch=false;
      out.forEach(d=>{ const b=state.batches.find(x=>x.deal&&x.deal.id===d.id); if(b&&b.deal.status!==d.status){ b.deal.status=d.status; ch=true; } });
      if(ch) changed();
    }catch(e){}
    renderDealBar(); if($('dealsDlg').open) renderDeals();
  }
  function renderDealBar(){
    const bar=$('dealBar'); bar.hidden=!(Auth.google&&window.Deals);
    const n=dealsCache.incoming.length; $('dealCount').hidden=!n; $('dealCount').textContent=n;
  }
  function renderDeals(){
    const inc=dealsCache.incoming, out=dealsCache.outgoing.slice().sort((a,b)=>((b.createdAt&&b.createdAt.seconds)||0)-((a.createdAt&&a.createdAt.seconds)||0));
    const qty=d=>qtyf(d.kg,d.boxKg||null);
    let h=`<div class="dealsec">Входящие</div>`;
    h+=inc.length?inc.map(d=>{ const ex=saleOfDeal(d); return `<div class="dealcard"><div><b>${esc(d.fromName||d.fromEmail)}</b> (${esc(d.fromEmail)}) ${ex?`меняет условия. Сейчас у вас записано: ${kgf(ex.s.kg)} по ${money(ex.s.price)}/кг. Новые условия:`:'берёт у вас под реализацию:'}<br><b>${esc(d.fruit)}</b>, ${qty(d)} по ${money(d.price)}/кг, на ${money(d.kg*d.price)}${d.due?`, оплатить до ${dshort(d.due)}`:''}</div>
      <div class="btnrow"><button class="btn small primary" data-deal="accept" data-id="${esc(d.id)}">Принять</button><button class="btn small" data-deal="decline" data-id="${esc(d.id)}">Отклонить</button></div></div>`; }).join(''):'<div class="empty" style="padding:12px">Новых заявок нет.</div>';
    h+=`<div class="dealsec">Мои заявки</div>`;
    h+=out.length?out.map(d=>{ const ph=phoneOf(d.toName||''); const link=`${location.origin}${location.pathname}`;
      const wa=ph?`<a class="btn small wa" target="_blank" rel="noopener" href="${waLink(ph,`Здравствуйте! Взял у вас под реализацию ${d.fruit}, ${qty(d)} по ${money(d.price)}/кг. Подтвердите, пожалуйста, в SAM (вход через Google ${d.toEmail}): ${link}`)}">Напомнить в WhatsApp</a>`:'';
      return `<div class="dealcard"><div><b>${esc(d.toName||d.toEmail)}</b> (${esc(d.toEmail)}): ${esc(d.fruit)}, ${qty(d)} по ${money(d.price)}/кг ${dealTag(d)}</div>${d.status==='pending'?`<div class="btnrow"><button class="btn small" data-deal="cancel" data-id="${esc(d.id)}">Отозвать</button>${wa}</div>`:''}</div>`; }).join(''):'<div class="empty" style="padding:12px">Вы пока не отправляли заявок. Они создаются, когда вы берёте товар под реализацию и указываете email поставщика.</div>';
    $('dealsBody').innerHTML=h;
  }
  $('dealBar').addEventListener('click',async()=>{
    try{ await window.Deals.ensureAuth(Auth.google.email); }catch(e){ toast((e&&e.message)||'Не удалось войти.'); return; }
    await refreshDeals(); renderDeals(); $('dealsDlg').showModal();
  });
  $('dealsBody').addEventListener('click',async e=>{
    const el=e.target.closest('[data-deal]'); if(!el) return;
    const d=[...dealsCache.incoming,...dealsCache.outgoing].find(x=>x.id===el.dataset.id); if(!d) return;
    const act=el.dataset.deal;
    try{
      if(act==='decline'){ if(!confirm('Отклонить заявку от '+(d.fromName||d.fromEmail)+'?')) return; await window.Deals.respond(d.id,'declined'); toast('Заявка отклонена.'); await refreshDeals(); }
      else if(act==='cancel'){ await window.Deals.ensureAuth(Auth.google.email); await window.Deals.respond(d.id,'cancelled'); toast('Заявка отозвана.'); await refreshDeals(); }
      else if(act==='accept'){
        const ex=saleOfDeal(d);
        if(ex){
          const {s:sl,b:bt}=ex; if(d.kg>calc(bt).left+sl.kg+1e-9){ toast(`В партии «${bt.name}» не хватает товара для нового количества.`); return; }
          $('dealsDlg').close();
          ask('Изменить уже записанную продажу?',`Было: ${kgf(sl.kg)} по ${money(sl.price)}/кг. Станет: ${kgf(d.kg)} по ${money(d.price)}/кг.`,async()=>{
            try{ await window.Deals.respond(d.id,'accepted');
              sl.kg=r2(d.kg); sl.price=d.price; sl.priceCur='kzt'; sl.priceOrig=null; sl.rate=null; sl.boxes=bt.boxKg?r2(sl.kg/bt.boxKg):null; if(d.due) sl.due=d.due;
              changed(); toast('Условия обновлены в вашей записи.'); refreshDeals();
            }catch(er){ if(er&&er.code==='stale'){ toast(er.message); refreshDeals(); } else toast('Не удалось принять изменение. Проверьте интернет и повторите.'); } });
          return;
        }
        const avail=state.batches.filter(b=>calc(b).left>0);
        if(!avail.length){ $('dealsDlg').close(); ask('На складе нет товара для записи','Принять заявку без записи в продажи? Продажу можно добавить позже вручную.',async()=>{ try{ await window.Deals.respond(d.id,'accepted'); toast('Заявка принята.'); refreshDeals(); }catch(er){ toast('Не удалось принять заявку.'); } }); return; }
        const fk=key(d.fruit), match=avail.find(b=>key(b.name)===fk)||avail[0];
        $('dealsDlg').close(); openSale(match.id);
        payMode='debt'; setSeg($('sPay'),'debt'); $('sDueWrap').hidden=false;
        $('sBuyer').value=d.fromName||d.fromEmail; setSeg($('sQtyUnit'),'kg'); setSeg($('sPriceUnit'),'kg'); setSeg($('sCur'),'kzt');
        setN('sQty',d.kg); setN('sPrice',d.price); if(d.due) $('sDue').value=d.due; salePreview();
        pendingDeal=d;
      }
    }catch(er){ if(er&&er.code==='stale'){ toast(er.message); await refreshDeals(); } else toast('Не удалось выполнить действие. Проверьте интернет и повторите.'); }
  });
  window.addEventListener('deals-ready',()=>{ if(window.Deals) window.Deals.ready().then(refreshDeals); });
  if(window.Deals) window.Deals.ready().then(refreshDeals);
  renderDealBar();

  /* ---------- persistence ---------- */
  function changed(){ render(); clearTimeout(saveTimer); saveTimer=setTimeout(save,400); scheduleSync(); }
  async function save(){
    const ts=Date.now();
    try{localStorage.setItem(LS_KEY,JSON.stringify(state)); localStorage.setItem(LS_KEY+':ts',String(ts));}catch(e){}
    if(!docRef){ $('status').textContent='Данные хранятся в этом браузере'; return; }
    if(saving){savePending=true;return;}
    saving=true;
    try{ await docRef.set({batches:state.batches,rates:state.rates,expenses:state.expenses,people:state.people,_ts:ts}); $('status').textContent='Сохранено в вашем аккаунте'; }
    catch(err){ $('status').textContent='Не удалось сохранить в аккаунт ('+(err&&err.code||'ошибка')+'), копия есть в этом браузере.'; }
    saving=false; if(savePending){savePending=false;save();}
  }
  function loadLocal(){ try{const s=JSON.parse(localStorage.getItem(LS_KEY)||'null'); if(s&&Array.isArray(s.batches)) state={batches:s.batches,rates:s.rates||{usd:0,eur:0,date:''},expenses:s.expenses||[],people:s.people||{}};}catch(e){} }

  /* ---------- Google Sheets sync ---------- */
  function setSync(s,txt){ $('syncBtn').dataset.s=s; $('syncTxt').textContent=txt; if($('syncDlg').open) fillSyncDlg(); }
  function fillSyncDlg(){
    const s=$('syncBtn').dataset.s; $('syncInfo').dataset.s=s;
    $('syncInfoTxt').textContent = s==='idle' ? 'Изменения отправляются сами' : $('syncTxt').textContent;
    $('syncInfoSub').textContent = $('status').textContent;
    $('syncNow').hidden = !mcp;
  }
  function syncErrMsg(err){ return {needs_reauth:'Переподключите Google Sheets',server_not_connected:'Подключите Google Sheets',selection_required:'Выберите аккаунт Google Sheets',
        not_in_manifest:'Доступ к таблице не разрешён',approval_required:'Нужно разрешение, нажмите',blocked_by_policy:'Доступ запрещён политикой',
        server_unavailable:'Google недоступен, нажмите ещё раз',tool_error:'Таблица отклонила запись'}[err&&err.code]||'Не отправлено, нажмите ещё раз'; }
  function scheduleSync(){ if(!mcp) return; clearTimeout(syncTimer); setSync('busy','Ждёт отправки'); syncTimer=setTimeout(syncSheet,1500); }
  const costsText = b => { const l=Array.isArray(b.costs)?b.costs:[{name:'Доставка',amount:b.delivery||0},{name:'Другие расходы',amount:b.other||0}]; return safeText(l.filter(x=>x.amount).map(x=>`${String(x.name||'Расход').replace(/[;:]/g,' ').trim()}: ${r2(x.amount)}`).join('; ')); };
  const safeText = s => /^[=+\-@']/.test(s) ? "'"+s : s;
  async function syncSheet(){
    if(!mcp){ setSync('err','Таблица недоступна'); return; }
    if(syncing){syncPending=true;return;}
    syncing=true; setSync('busy','Отправляю…');
    const bRows=state.batches.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||''))
      .map(b=>["'"+b.id,b.date,safeText(b.name),b.kg,b.price,b.delivery||0,b.other||0,b.waste||0,b.boxKg||'',b.priceCur&&b.priceCur!=='kzt'?b.priceOrig:'',CURCODE[b.priceCur||'kzt'],b.priceCur&&b.priceCur!=='kzt'?b.rate:'']);
    const cRows=state.batches.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(b=>[b.customs||0,b.customsIn?'да':'нет',costsText(b)]);
    const sRows=[];
    state.batches.forEach(b=>b.sales.forEach(s=>{
      const rk=s.repaid.filter(r=>r.method==='kaspi').reduce((t,r)=>t+r.amount,0);
      const rc=s.repaid.filter(r=>r.method!=='kaspi').reduce((t,r)=>t+r.amount,0);
      sRows.push(["'"+s.id,"'"+b.id,s.date,s.kg,s.price,s.pay?PAY[s.pay]:'',s.buyer?safeText(s.buyer):'',rk,rc,s.city?safeText(s.city):'',s.boxes||'',s.ship||0,s.priceCur&&s.priceCur!=='kzt'?s.priceOrig:'',CURCODE[s.priceCur||'kzt'],s.priceCur&&s.priceCur!=='kzt'?s.rate:'',s.pay==='debt'&&s.due?s.due:'']);
    }));
    sRows.sort((a,b)=>String(a[2]).localeCompare(String(b[2])));
    try{
      if(bRows.length) await mcp.callTool('Google Sheets','update_values',{spreadsheetId:SHEET_ID,range:`'Партии'!A2:L${bRows.length+1}`,values:bRows},{cache:false});
      if(cRows.length) await mcp.callTool('Google Sheets','update_values',{spreadsheetId:SHEET_ID,range:`'Партии'!S2:U${cRows.length+1}`,values:cRows},{cache:false});
      if(sRows.length) await mcp.callTool('Google Sheets','update_values',{spreadsheetId:SHEET_ID,range:`'Продажи'!A2:P${sRows.length+1}`,values:sRows},{cache:false});
      await mcp.callTool('Google Sheets','batch_clear_values',{spreadsheetId:SHEET_ID,ranges:[`'Партии'!A${bRows.length+2}:L`,`'Партии'!S${cRows.length+2}:U`,`'Продажи'!A${sRows.length+2}:P`]},{cache:false});
      const eRows=(state.expenses||[]).slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(e=>["'"+e.id,e.date,safeText(e.cat||''),e.amount,e.note?safeText(e.note):'']);
      const pRows=state.batches.filter(b=>b.supCredit&&b.supplier).map(b=>[safeText(b.supplier),phoneOf(b.supplier)?"'"+phoneOf(b.supplier):'',safeText(b.name),b.date,qtyf(b.kg,b.boxKg),b.priceCur&&b.priceCur!=='kzt'?`${CUR[b.priceCur]}${nf(b.priceOrig)}/кг (${money(b.price)})`:`${money(b.price)}/кг`,r2(b.kg*b.price),r2(supPaidSum(b)),supOwed(b),b.supDue||'']);
      if(eRows.length) await mcp.callTool('Google Sheets','update_values',{spreadsheetId:SHEET_ID,range:`'Расходы'!A2:E${eRows.length+1}`,values:eRows},{cache:false});
      if(pRows.length) await mcp.callTool('Google Sheets','update_values',{spreadsheetId:SHEET_ID,range:`'Поставщики'!A2:J${pRows.length+1}`,values:pRows},{cache:false});
      await mcp.callTool('Google Sheets','batch_clear_values',{spreadsheetId:SHEET_ID,ranges:[`'Расходы'!A${eRows.length+2}:E`,`'Поставщики'!A${pRows.length+2}:J`]},{cache:false});
      const R=state.rates||{};
      await mcp.callTool('Google Sheets','update_values',{spreadsheetId:SHEET_ID,range:`'Итоги'!J4:J6`,values:[[R.usd||''],[R.eur||''],[R.date||'']]},{cache:false});
      setSync('ok','Таблица обновлена в '+new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}));
    }catch(err){
      const msg=syncErrMsg(err); if(err&&err.message&&err.code!=='needs_reauth') $('status').textContent=err.message;
      setSync('err',msg);
    }
    syncing=false; if(syncPending){syncPending=false;syncSheet();}
  }
  if(SHEET_URL) $('sheetBtn').href = SHEET_URL; else $('sheetBtn').hidden = true;
  /* ===== languages ===== */
  const I18N = {"Вводите курс сами, как в обменнике или банке. Новые партии и продажи в валюте возьмут этот курс, у старых остаётся курс, по которому их записали.": ["Enter the rate yourself, as at an exchange office or bank. New batches and sales in foreign currency will use this rate; older ones keep the rate they were saved with.", "请自行输入汇率（参考兑换点或银行）。新的外币批次和销售将使用此汇率，已有记录保留原汇率。", "Бағамды өзіңіз енгізіңіз, айырбастау пунктіндегі немесе банктегідей. Валютадағы жаңа партиялар мен сатылымдар осы бағамды алады, ескілерінде жазылған бағам қалады.", "Қурбро худатон ворид кунед, мисли нуқтаи мубодила ё бонк. Партияҳо ва фурӯшҳои нав бо асъор ин қурбро мегиранд, дар кӯҳнаҳо қурби сабтшуда мемонад.", "Kuru kendiniz girin, döviz bürosu veya bankadaki gibi. Dövizli yeni partiler ve satışlar bu kuru kullanır; eskiler kaydedildikleri kuru korur.", "Փոխարժեքը մուտքագրեք ինքներդ՝ ինչպես փոխանակման կետում կամ բանկում։ Արտարժույթով նոր խմբաքանակներն ու վաճառքները կօգտագործեն այս փոխարժեքը, հներինը կմնա գրանցման պահի փոխարժեքով։", "Məzənnəni özünüz daxil edin, mübadilə məntəqəsində və ya bankda olduğu kimi. Valyutada yeni partiyalar və satışlar bu məzənnəni götürəcək, köhnələrdə qeyd olunan məzənnə qalır.", "Курсту өзүңүз киргизиңиз, алмаштыруу пунктундагыдай же банктагыдай. Валютадагы жаңы партиялар менен сатуулар ушул курсту алат, эскилеринде жазылган курс калат."], "Расходов за этот период нет. Аренду склада, грузчиков, бензин и зарплату записывайте сюда, тогда прибыль будет точной.": ["No expenses for this period. Record warehouse rent, loaders, fuel and salaries here so your profit is accurate.", "本期间没有支出。请在此记录仓库租金、装卸工、油费和工资，这样利润才准确。", "Бұл кезеңде шығыс жоқ. Қойма жалдауын, жүк тасушыларды, жанармай мен жалақыны осында жазыңыз, сонда пайда дәл болады.", "Дар ин давра хароҷот нест. Иҷораи анбор, борбардорон, бензин ва маошро ин ҷо сабт кунед, он гоҳ фоида дақиқ мешавад.", "Bu dönemde gider yok. Depo kirası, hamallar, yakıt ve maaşları buraya yazın, böylece kâr doğru olur.", "Այս ժամանակահատվածում ծախսեր չկան։ Պահեստի վարձը, բեռնակիրներին, վառելիքը և աշխատավարձը գրանցեք այստեղ, որպեսզի շահույթը ճշգրիտ լինի։", "Bu dövrdə xərc yoxdur. Anbar icarəsini, yükdaşıyanları, benzini və maaşı bura yazın, onda mənfəət dəqiq olacaq.", "Бул мезгилде чыгым жок. Кампанын ижарасын, жүк ташуучуларды, бензин менен маянаны ушул жерге жазыңыз, ошондо пайда так болот."], "Покупателей пока нет. Вписывайте имя покупателя при продаже, и здесь будет видно, кто сколько взял и сколько должен.": ["No buyers yet. Enter the buyer's name when selling, and you'll see here who took how much and how much they owe.", "还没有买家。销售时填写买家姓名，这里就会显示谁拿了多少、欠多少。", "Әзірге сатып алушылар жоқ. Сату кезінде сатып алушының атын жазыңыз, сонда кім қанша алғаны және қанша қарызы бар екені көрінеді.", "Ҳоло харидорон нестанд. Ҳангоми фурӯш номи харидорро нависед, он гоҳ дида мешавад, ки кӣ чӣ қадар гирифт ва чӣ қадар қарздор аст.", "Henüz alıcı yok. Satışta alıcının adını yazın; burada kimin ne kadar aldığı ve ne kadar borcu olduğu görünür.", "Գնորդներ դեռ չկան։ Վաճառքի ժամանակ գրեք գնորդի անունը, և այստեղ կերևա՝ ով որքան է վերցրել և որքան է պարտք։", "Hələ alıcı yoxdur. Satışda alıcının adını yazın, burada kimin nə qədər götürdüyü və nə qədər borclu olduğu görünəcək.", "Азырынча сатып алуучулар жок. Сатууда сатып алуучунун атын жазыңыз, ошондо ким канча алганы жана канча карызы бар экени ушул жерден көрүнөт."], "Товара под реализацию сейчас нет. Если берёте у поставщика под реализацию, отметьте это при добавлении партии.": ["No consignment goods right now. If you take goods from a supplier on consignment, use “Take on consignment”.", "目前没有寄售货物。如果从供应商处寄售拿货，请使用“寄售进货”。", "Қазір сатуға алынған тауар жоқ. Жеткізушіден сатуға алсаңыз, мұны партия қосқанда белгілеңіз.", "Ҳоло моли барои фурӯш гирифташуда нест. Агар аз таъминкунанда барои фурӯш гиред, инро ҳангоми илова кардани партия қайд кунед.", "Şu anda konsinye mal yok. Tedarikçiden konsinye alırsanız, parti eklerken bunu belirtin.", "Իրացման ապրանք հիմա չկա։ Եթե մատակարարից վերցնում եք իրացման, նշեք դա խմբաքանակ ավելացնելիս։", "Hazırda realizasiyaya götürülmüş mal yoxdur. Təchizatçıdan realizasiyaya götürsəniz, bunu partiya əlavə edərkən qeyd edin.", "Азыр реализацияга товар жок. Жеткирүүчүдөн реализацияга алсаңыз, партияны кошкондо муну белгилеңиз."], "Не получилось сохранить картинку здесь. Можно отправить накладную в": ["Couldn't save the image here. You can send the invoice to", "此处无法保存图片。可以把单据发送到", "Суретті мұнда сақтау мүмкін болмады. Жүкқұжатты жіберуге болады:", "Тасвирро ин ҷо нигоҳ доштан нашуд. Метавонед бориномаро фиристед ба", "Görsel burada kaydedilemedi. Faturayı gönderebilirsiniz:", "Նկարը այստեղ պահպանել չհաջողվեց։ Կարող եք բեռնագիրն ուղարկել", "Şəkli burada saxlamaq alınmadı. Qaiməni göndərə bilərsiniz:", "Бул жерде сүрөттү сактоо мүмкүн болгон жок. Накладнойду төмөнкүгө жөнөтсөңүз болот:"], "Напоминаем об оплате товара, взятого под реализацию, всего": ["A reminder about payment for goods taken on consignment, total", "提醒您支付寄售货物款项，共计", "Сатуға алынған тауардың төлемі туралы еске саламыз, барлығы", "Дар бораи пардохти моли барои фурӯш гирифташуда хотиррасон мекунем, ҳамагӣ", "Konsinye alınan malın ödemesini hatırlatırız, toplam", "Հիշեցնում ենք իրացման վերցված ապրանքի վճարման մասին, ընդամենը", "Realizasiyaya götürülmüş malın ödənişini xatırladırıq, cəmi", "Реализацияга алынган товар үчүн төлөм жөнүндө эскертебиз, жалпысы"], "Проверьте номер: нужно 11 цифр, например +7 701 123 45 67.": ["Check the number: 11 digits needed, e.g. +7 701 123 45 67.", "请检查号码：需要11位数字，例如 +7 701 123 45 67。", "Нөмірді тексеріңіз: 11 сан керек, мысалы +7 701 123 45 67.", "Рақамро санҷед: 11 рақам лозим аст, масалан +7 701 123 45 67.", "Numarayı kontrol edin: 11 hane gerekli, örn. +7 701 123 45 67.", "Ստուգեք համարը՝ պետք է 11 թվանշան, օրինակ +7 701 123 45 67։", "Nömrəni yoxlayın: 11 rəqəm lazımdır, məsələn +7 701 123 45 67.", "Номерди текшериңиз: 11 сан керек, мисалы +7 701 123 45 67."], "Укажите поставщика, у которого взяли под реализацию.": ["Enter the supplier you took the goods from on consignment.", "请填写寄售拿货的供应商。", "Сатуға алған жеткізушіні көрсетіңіз.", "Таъминкунандаеро, ки аз ӯ барои фурӯш гирифтед, нишон диҳед.", "Konsinye aldığınız tedarikçiyi girin.", "Նշեք մատակարարին, ումից վերցրել եք իրացման։", "Realizasiyaya götürdüyünüz təchizatçını göstərin.", "Реализацияга алган жеткирүүчүнү көрсөтүңүз."], "Контакты недоступны здесь, впишите номер вручную.": ["Contacts aren't available here, enter the number manually.", "此处无法访问通讯录，请手动输入号码。", "Мұнда контактілер қолжетімсіз, нөмірді қолмен енгізіңіз.", "Тамосҳо ин ҷо дастрас нестанд, рақамро дастӣ ворид кунед.", "Kişiler burada kullanılamıyor, numarayı elle girin.", "Կոնտակտներն այստեղ հասանելի չեն, մուտքագրեք համարը ձեռքով։", "Kontaktlar burada əlçatan deyil, nömrəni əl ilə daxil edin.", "Байланыштар бул жерде жеткиликсиз, номерди кол менен жазыңыз."], "Укажите покупателя, который берёт под реализацию.": ["Enter the buyer taking goods on consignment.", "请填写寄售拿货的买家。", "Сатуға алатын сатып алушыны көрсетіңіз.", "Харидореро, ки барои фурӯш мегирад, нишон диҳед.", "Konsinye alan alıcıyı girin.", "Նշեք գնորդին, որը վերցնում է իրացման։", "Realizasiyaya götürən alıcını göstərin.", "Реализацияга алган сатып алуучуну көрсөтүңүз."], "Чтобы выйти в ноль, остаток продавайте не дешевле": ["To break even, sell the rest for no less than", "要保本，剩余货物售价不得低于", "Шығынсыз болу үшін қалғанын мына бағадан арзан сатпаңыз:", "Барои зарар надидан, боқимондаро на арзонтар аз ин фурӯшед:", "Başa baş için kalanı en az şu fiyata satın:", "Զրոյի դուրս գալու համար մնացորդը վաճառեք ոչ պակաս, քան", "Zərərsiz olmaq üçün qalığı bundan ucuz satmayın:", "Нөлгө чыгуу үчүн калганын мындан арзан сатпаңыз"], "Вместе с ней удалятся все её продажи и оплаты.": ["All its sales and payments will be deleted too.", "其所有销售和付款也将被删除。", "Онымен бірге оның барлық сатылымдары мен төлемдері жойылады.", "Ҳамроҳи он ҳамаи фурӯшҳо ва пардохтҳояш нест мешаванд.", "Tüm satışları ve ödemeleri de silinecek.", "Դրա հետ կջնջվեն նաև բոլոր վաճառքներն ու վճարումները։", "Onunla birlikdə bütün satışları və ödənişləri silinəcək.", "Аны менен бирге анын бардык сатуулары жана төлөмдөрү өчөт."], "Продаж пока нет. Нажмите «Продажа / отправка».": ["No sales yet. Tap “Sale / shipment”.", "还没有销售。请点击“销售 / 发货”。", "Әзірге сатылым жоқ. «Сату / жөнелту» басыңыз.", "Ҳоло фурӯш нест. «Фурӯш / ирсол»-ро пахш кунед.", "Henüz satış yok. “Satış / sevkiyat”a dokunun.", "Վաճառքներ դեռ չկան։ Սեղմեք «Վաճառք / առաքում»։", "Hələ satış yoxdur. «Satış / göndəriş» düyməsini basın.", "Азырынча сатуу жок. «Сатуу / жөнөтүү» баскычын басыңыз."], "Укажите фрукт, количество и цену закупа.": ["Enter the fruit, quantity and purchase price.", "请填写水果、数量和进价。", "Жемісті, мөлшерді және сатып алу бағасын көрсетіңіз.", "Мева, миқдор ва нархи харидро нишон диҳед.", "Meyveyi, miktarı ve alış fiyatını girin.", "Նշեք միրգը, քանակը և գնման գինը։", "Meyvəni, miqdarı və alış qiymətini göstərin.", "Жемишти, санын жана сатып алуу баасын көрсөтүңүз."], "Укажите, до какого числа нужно оплатить.": ["Enter the payment due date.", "请填写付款截止日期。", "Қай күнге дейін төлеу керек екенін көрсетіңіз.", "Нишон диҳед, ки то кадом сана бояд пардохт кард.", "Son ödeme tarihini girin.", "Նշեք, թե մինչև որ օրը պետք է վճարել։", "Hansı tarixədək ödəmək lazım olduğunu göstərin.", "Кайсы датага чейин төлөө керектигин көрсөтүңүз."], "Взять под реализацию (у поставщика)": ["Take on consignment (from supplier)", "寄售进货（从供应商）", "Сатуға алу (жеткізушіден)", "Барои фурӯш гирифтан (аз таъминкунанда)", "Konsinye al (tedarikçiden)", "Վերցնել իրացման (մատակարարից)", "Realizasiyaya götürmək (təchizatçıdan)", "Реализацияга алуу (жеткирүүчүдөн)"], "Отдать под реализацию (покупателю)": ["Give on consignment (to buyer)", "寄售给买家", "Сатуға беру (сатып алушыға)", "Барои фурӯш додан (ба харидор)", "Konsinye ver (alıcıya)", "Տալ իրացման (գնորդին)", "Realizasiyaya vermək (alıcıya)", "Реализацияга берүү (сатып алуучуга)"], "Данные сохраняются в вашем аккаунте": ["Data is saved to your account", "数据保存在您的账户中", "Деректер аккаунтыңызда сақталады", "Маълумот дар ҳисоби шумо нигоҳ дошта мешавад", "Veriler hesabınıza kaydediliyor", "Տվյալները պահպանվում են ձեր հաշվում", "Məlumatlar hesabınızda saxlanılır", "Маалымат аккаунтуңузда сакталат"], "Сохранено в вашем аккаунте": ["Saved to your account", "已保存到您的账户", "Аккаунтыңызда сақталды", "Дар ҳисоби шумо нигоҳ дошта шуд", "Hesabınıza kaydedildi", "Պահպանված է ձեր հաշվում", "Hesabınızda saxlanıldı", "Аккаунтуңузга сакталды"], "Данные хранятся в этом браузере": ["Data is stored in this browser", "数据存储在此浏览器中", "Деректер осы браузерде сақталады", "Маълумот дар ҳамин браузер нигоҳ дошта мешавад", "Veriler bu tarayıcıda saklanıyor", "Տվյալները պահվում են այս դիտարկիչում", "Məlumatlar bu brauzerdə saxlanılır", "Маалымат ушул браузерде сакталат"], "Порчи больше, чем осталось товара.": ["Spoilage exceeds the remaining stock.", "损耗超过了剩余库存。", "Бүлінген тауар қалған тауардан көп.", "Моли вайроншуда аз боқимонда зиёд аст.", "Fire, kalan maldan fazla.", "Փչացածը ավելին է, քան մնացած ապրանքը։", "Xarab olan mal qalıqdan çoxdur.", "Бузулган товар калгандан көп."], "укажите, сколько заехало и почём.": ["enter how much arrived and at what price.", "填写到货数量和价格。", "қанша келгенін және бағасын көрсетіңіз.", "нишон диҳед, ки чӣ қадар омад ва бо чӣ нарх.", "ne kadar geldiğini ve fiyatını girin.", "նշեք, թե որքան է եկել և ինչ գնով։", "nə qədər gəldiyini və qiymətini göstərin.", "канча келгенин жана баасын көрсөтүңүз."], "вес партии не может быть меньше.": ["the batch weight can't be less than that.", "批次重量不能少于此数。", "партия салмағы бұдан аз бола алмайды.", "вазни партия аз ин кам буда наметавонад.", "parti ağırlığı bundan az olamaz.", "խմբաքանակի քաշը չի կարող սրանից պակաս լինել։", "partiyanın çəkisi bundan az ola bilməz.", "партиянын салмагы мындан аз болушу мүмкүн эмес."], "Изменить: взято под реализацию": ["Edit: taken on consignment", "编辑：寄售进货", "Өзгерту: сатуға алынған", "Тағйир: барои фурӯш гирифташуда", "Düzenle: konsinye alınan", "Փոփոխել՝ վերցված իրացման", "Dəyişmək: realizasiyaya götürülüb", "Өзгөртүү: реализацияга алынган"], "Не отправлено, нажмите ещё раз": ["Not sent, tap again", "未发送，请再点一次", "Жіберілмеді, қайта басыңыз", "Фиристода нашуд, боз пахш кунед", "Gönderilmedi, tekrar dokunun", "Չուղարկվեց, սեղմեք կրկին", "Göndərilmədi, yenidən basın", "Жөнөтүлгөн жок, дагы бир жолу басыңыз"], "Не удалось сохранить в аккаунт": ["Couldn't save to account", "无法保存到账户", "Аккаунтқа сақтау мүмкін болмады", "Дар ҳисоб нигоҳ доштан нашуд", "Hesaba kaydedilemedi", "Չհաջողվեց պահպանել հաշվում", "Hesaba saxlamaq alınmadı", "Аккаунтка сактоо мүмкүн болгон жок"], "копия есть в этом браузере.": ["a copy is in this browser.", "此浏览器中有副本。", "көшірмесі осы браузерде бар.", "нусха дар ҳамин браузер ҳаст.", "bu tarayıcıda bir kopyası var.", "պատճենն այս դիտարկիչում է։", "surəti bu brauzerdə var.", "көчүрмөсү ушул браузерде бар."], "В этой партии осталось только": ["This batch only has left:", "此批次仅剩", "Бұл партияда тек қалды:", "Дар ин партия танҳо монд:", "Bu partide yalnızca kaldı:", "Այս խմբաքանակում մնացել է միայն", "Bu partiyada yalnız qalıb:", "Бул партияда болгону калды"], "Валюта, доставка, другая дата": ["Currency, delivery, other date", "货币、运费、其他日期", "Валюта, жеткізу, басқа күн", "Асъор, расонидан, санаи дигар", "Döviz, teslimat, başka tarih", "Արժույթ, առաքում, այլ ամսաթիվ", "Valyuta, çatdırılma, başqa tarix", "Валюта, жеткирүү, башка дата"], "Укажите хотя бы курс доллара.": ["Enter at least the dollar rate.", "请至少填写美元汇率。", "Кемінде доллар бағамын көрсетіңіз.", "Ақаллан қурби долларро нишон диҳед.", "En azından dolar kurunu girin.", "Նշեք գոնե դոլարի փոխարժեքը։", "Heç olmasa dollar məzənnəsini göstərin.", "Жок дегенде доллар курсун көрсөтүңүз."], "Доступ к таблице не разрешён": ["Access to the sheet isn't allowed", "不允许访问表格", "Кестеге кіруге рұқсат жоқ", "Дастрасӣ ба ҷадвал иҷозат дода нашудааст", "Tabloya erişime izin verilmedi", "Աղյուսակին հասանելիությունը թույլատրված չէ", "Cədvələ giriş icazəsi yoxdur", "Таблицага мүмкүнчүлүк берилген жок"], "Оплаты по ней тоже удалятся.": ["Its payments will be deleted too.", "其付款也将被删除。", "Оның төлемдері де жойылады.", "Пардохтҳояш низ нест мешаванд.", "Ödemeleri de silinecek.", "Դրա վճարումները նույնպես կջնջվեն։", "Onun ödənişləri də silinəcək.", "Ага байланышкан төлөмдөр да өчөт."], "Ещё: под реализацию, расход": ["More: consignment, expense", "更多：寄售、支出", "Тағы: сатуға, шығыс", "Боз: барои фурӯш, хароҷот", "Daha fazla: konsinye, gider", "Ավելին՝ իրացում, ծախս", "Daha çox: realizasiya, xərc", "Дагы: реализация, чыгым"], "Изменения отправляются сами": ["Changes are sent automatically", "更改会自动发送", "Өзгерістер өздігінен жіберіледі", "Тағйирот худкор фиристода мешаванд", "Değişiklikler otomatik gönderilir", "Փոփոխություններն ուղարկվում են ինքնաշխատ", "Dəyişikliklər avtomatik göndərilir", "Өзгөрүүлөр өзү жөнөтүлөт"], "недоступен, нажмите ещё раз": ["unavailable, tap again", "不可用，请再点一次", "қолжетімсіз, қайта басыңыз", "дастрас нест, боз пахш кунед", "kullanılamıyor, tekrar dokunun", "անհասանելի է, սեղմեք կրկին", "əlçatan deyil, yenidən basın", "жеткиликсиз, дагы бир жолу басыңыз"], "Расход (аренда, грузчики…)": ["Expense (rent, loaders…)", "支出（租金、装卸工…）", "Шығыс (жалдау, жүк тасушылар…)", "Хароҷот (иҷора, борбардорон…)", "Gider (kira, hamallar…)", "Ծախս (վարձ, բեռնակիրներ…)", "Xərc (icarə, yükdaşıyanlar…)", "Чыгым (ижара, жүк ташуучулар…)"], "Расходы: доставка и прочее": ["Costs: delivery and other", "费用：运费及其他", "Шығындар: жеткізу және басқа", "Хароҷот: расонидан ва ғайра", "Masraflar: teslimat ve diğer", "Ծախսեր՝ առաքում և այլն", "Xərclər: çatdırılma və digər", "Чыгымдар: жеткирүү жана башкалар"], "Сумма снова станет долгом.": ["The amount will become debt again.", "该金额将重新计为欠款。", "Сома қайтадан қарызға айналады.", "Маблағ боз қарз мешавад.", "Tutar tekrar borç olur.", "Գումարը կրկին պարտք կդառնա։", "Məbləğ yenidən borc olacaq.", "Сумма кайра карыз болот."], "Укажите количество и цену.": ["Enter quantity and price.", "请填写数量和价格。", "Мөлшер мен бағаны көрсетіңіз.", "Миқдор ва нархро нишон диҳед.", "Miktarı ve fiyatı girin.", "Նշեք քանակը և գինը։", "Miqdarı və qiyməti göstərin.", "Санын жана баасын көрсөтүңүз."], "Доставка за счёт продавца": ["Delivery paid by seller", "运费由卖方承担", "Жеткізу сатушының есебінен", "Расонидан аз ҳисоби фурӯшанда", "Teslimat satıcıya ait", "Առաքումը վաճառողի հաշվին", "Çatdırılma satıcının hesabına", "Жеткирүү сатуучунун эсебинен"], "Доступ запрещён политикой": ["Access blocked by policy", "访问被策略禁止", "Кіру саясатпен тыйым салынған", "Дастрасӣ бо сиёсат манъ аст", "Erişim politika ile engellendi", "Մուտքն արգելված է քաղաքականությամբ", "Giriş siyasət ilə qadağandır", "Мүмкүнчүлүк саясат менен тыюу салынган"], "Нужно разрешение, нажмите": ["Permission needed, tap", "需要授权，请点击", "Рұқсат керек, басыңыз", "Иҷозат лозим, пахш кунед", "İzin gerekli, dokunun", "Թույլտվություն է պետք, սեղմեք", "İcazə lazımdır, basın", "Уруксат керек, басыңыз"], "Под реализацию: вы должны": ["Consignment: you owe", "寄售：您欠款", "Сатуға: сіздің қарызыңыз", "Барои фурӯш: шумо қарздоред", "Konsinye: borcunuz", "Իրացում՝ դուք պարտք եք", "Realizasiya: siz borclusunuz", "Реализация: сиз карызсыз"], "Укажите вес одного ящика.": ["Enter the weight of one box.", "请填写每箱重量。", "Бір жәшіктің салмағын көрсетіңіз.", "Вазни як қуттиро нишон диҳед.", "Bir kasanın ağırlığını girin.", "Նշեք մեկ արկղի քաշը։", "Bir qutunun çəkisini göstərin.", "Бир жашиктин салмагын көрсөтүңүз."], "Партий пока нет. Нажмите": ["No batches yet. Tap", "还没有批次。请点击", "Әзірге партия жоқ. Басыңыз:", "Ҳоло партия нест. Пахш кунед:", "Henüz parti yok. Dokunun:", "Խմբաքանակներ դեռ չկան։ Սեղմեք", "Hələ partiya yoxdur. Basın:", "Азырынча партия жок. Басыңыз"], "Под реализацию, оплачено": ["Consignment, paid", "寄售，已付清", "Сатуға, төленді", "Барои фурӯш, пардохт шуд", "Konsinye, ödendi", "Իրացում, վճարված", "Realizasiya, ödənilib", "Реализация, төлөндү"], "Под реализацию, осталось": ["Consignment, remaining", "寄售，剩余", "Сатуға, қалды", "Барои фурӯш, боқӣ", "Konsinye, kalan", "Իրացում, մնացել է", "Realizasiya, qalıb", "Реализация, калды"], "Поставщик (у кого брали)": ["Supplier (who you took from)", "供应商（从谁拿货）", "Жеткізуші (кімнен алдыңыз)", "Таъминкунанда (аз кӣ гирифтед)", "Tedarikçi (kimden aldınız)", "Մատակարար (ումից եք վերցրել)", "Təchizatçı (kimdən götürdünüz)", "Жеткирүүчү (кимден алдыңыз)"], "Таблица отклонила запись": ["The sheet rejected the write", "表格拒绝了写入", "Кесте жазуды қабылдамады", "Ҷадвал сабтро рад кард", "Tablo yazmayı reddetti", "Աղյուսակը մերժեց գրառումը", "Cədvəl yazını rədd etdi", "Таблица жазууну кабыл албады"], "Отправить данные сейчас": ["Send data now", "立即发送数据", "Деректерді қазір жіберу", "Ҳозир маълумот фиристодан", "Verileri şimdi gönder", "Ուղարկել տվյալները հիմա", "Məlumatları indi göndər", "Маалыматты азыр жөнөтүү"], "Порча, списано всего кг": ["Spoilage, total kg written off", "损耗，共报废公斤", "Бүлінген, барлығы есептен шығарылған кг", "Вайроншуда, ҳамагӣ ҳисоб кардашуда кг", "Fire, toplam düşülen kg", "Փչացած, ընդամենը դուրս գրված կգ", "Xarab, cəmi silinən kq", "Бузулган, жалпысы чыгарылды кг"], "Прибыль по всем партиям": ["Profit across all batches", "所有批次利润", "Барлық партиялар бойынша пайда", "Фоида аз ҳамаи партияҳо", "Tüm partilerden kâr", "Շահույթը բոլոր խմբաքանակներից", "Bütün partiyalar üzrə mənfəət", "Бардык партиялар боюнча пайда"], "Как брали у поставщика": ["How you took from supplier", "从供应商的进货方式", "Жеткізушіден қалай алдыңыз", "Чӣ тавр аз таъминкунанда гирифтед", "Tedarikçiden nasıl aldınız", "Ինչպես եք վերցրել մատակարարից", "Təchizatçıdan necə götürdünüz", "Жеткирүүчүдөн кантип алдыңыз"], "Оплата: под реализацию": ["Payment: consignment", "付款：寄售", "Төлем: сатуға", "Пардохт: барои фурӯш", "Ödeme: konsinye", "Վճարում՝ իրացում", "Ödəniş: realizasiya", "Төлөм: реализация"], "взяли под реализацию у": ["taken on consignment from", "寄售进货自", "сатуға алынды:", "барои фурӯш гирифта шуд аз", "konsinye alındı:", "վերցված իրացման՝", "realizasiyaya götürülüb:", "реализацияга алдык, кимден"], "Настройки: тема, цвет, Google Таблица": ["Settings: theme, color, Google Sheet", "设置：主题、颜色、Google 表格", "Баптаулар: тақырып, түс, Google Кесте", "Танзимот: мавзӯъ, ранг, Ҷадвали Google", "Ayarlar: tema, renk, Google Tablo", "Կարգավորումներ՝ թեմա, գույն, Google Աղյուսակ", "Ayarlar: tema, rəng, Google Cədvəl", "Жөндөөлөр: тема, түс, Google Таблица"], "Вес одного ящика, кг": ["Weight of one box, kg", "每箱重量，公斤", "Бір жәшіктің салмағы, кг", "Вазни як қуттӣ, кг", "Bir kasanın ağırlığı, kg", "Մեկ արկղի քաշը, կգ", "Bir qutunun çəkisi, kq", "Бир жашиктин салмагы, кг"], "Взять под реализацию": ["Take on consignment", "寄售进货", "Сатуға алу", "Барои фурӯш гирифтан", "Konsinye al", "Վերցնել իրացման", "Realizasiyaya götürmək", "Реализацияга алуу"], "Выбрать из контактов": ["Pick from contacts", "从通讯录选择", "Контактілерден таңдау", "Аз тамосҳо интихоб", "Kişilerden seç", "Ընտրել կոնտակտներից", "Kontaktlardan seç", "Байланыштардан тандоо"], "Красный, как логотип": ["Red, like the logo", "红色（同标志）", "Қызыл, логотиптегідей", "Сурх, мисли логотип", "Kırmızı, logo gibi", "Կարմիր, ինչպես լոգոն", "Qırmızı, loqo kimi", "Кызыл, логотиптей"], "Удалить эту продажу?": ["Delete this sale?", "删除此销售？", "Бұл сатылымды жою керек пе?", "Ин фурӯшро нест кунем?", "Bu satış silinsin mi?", "Ջնջե՞լ այս վաճառքը", "Bu satış silinsin?", "Бул сатууну өчүрөсүзбү?"], "Укажите курс валюты.": ["Enter the exchange rate.", "请填写汇率。", "Валюта бағамын көрсетіңіз.", "Қурби асъорро нишон диҳед.", "Döviz kurunu girin.", "Նշեք փոխարժեքը։", "Valyuta məzənnəsini göstərin.", "Валюта курсун көрсөтүңүз."], "Доставка покупателю, ₸ (если платите вы)": ["Delivery to buyer, ₸ (if you pay)", "给买家的运费，₸（如由您支付）", "Сатып алушыға жеткізу, ₸ (егер сіз төлесеңіз)", "Расонидан ба харидор, ₸ (агар шумо пардохт кунед)", "Alıcıya teslimat, ₸ (siz ödüyorsanız)", "Առաքում գնորդին, ₸ (եթե վճարում եք դուք)", "Alıcıya çatdırılma, ₸ (siz ödəyirsinizsə)", "Сатып алуучуга жеткирүү, ₸ (өзүңүз төлөсөңүз)"], "Доставка покупателям": ["Delivery to buyers", "给买家的运费", "Сатып алушыларға жеткізу", "Расонидан ба харидорон", "Alıcılara teslimat", "Առաքում գնորդներին", "Alıcılara çatdırılma", "Сатып алуучуларга жеткирүү"], "Сохранить изменения": ["Save changes", "保存更改", "Өзгерістерді сақтау", "Тағйиротро нигоҳ доштан", "Değişiklikleri kaydet", "Պահպանել փոփոխությունները", "Dəyişiklikləri saxla", "Өзгөрүүлөрдү сактоо"], "Спасибо за покупку!": ["Thank you for your purchase!", "感谢您的购买！", "Сатып алғаныңызға рахмет!", "Ташаккур барои харид!", "Satın aldığınız için teşekkürler!", "Շնորհակալություն գնման համար։", "Alış üçün təşəkkür edirik!", "Сатып алганыңыз үчүн рахмат!"], "Таблица обновлена в": ["Sheet updated at", "表格更新于", "Кесте жаңартылды:", "Ҷадвал навсозӣ шуд дар", "Tablo güncellendi:", "Աղյուսակը թարմացվել է", "Cədvəl yeniləndi:", "Таблица жаңыртылды:"], "Учёт партий фруктов": ["Fruit batch tracker", "水果批次记账", "Жеміс партияларының есебі", "Ҳисоби партияҳои мева", "Meyve parti takibi", "Մրգերի խմբաքանակների հաշվառում", "Meyvə partiyalarının uçotu", "Жемиш партияларынын эсеби"], "Другая дата, порча": ["Other date, spoilage", "其他日期、损耗", "Басқа күн, бүлінген", "Санаи дигар, вайроншуда", "Başka tarih, fire", "Այլ ամսաթիվ, փչացած", "Başqa tarix, xarab", "Башка дата, бузулган"], "Заработали чистыми": ["Net earnings", "净赚", "Таза табыс", "Даромади холис", "Net kazanç", "Զուտ վաստակ", "Xalis qazanc", "Таза пайда"], "Продажа / отправка": ["Sale / shipment", "销售 / 发货", "Сату / жөнелту", "Фурӯш / ирсол", "Satış / sevkiyat", "Վաճառք / առաքում", "Satış / göndəriş", "Сатуу / жөнөтүү"], "Сохранить картинку": ["Save image", "保存图片", "Суретті сақтау", "Тасвирро нигоҳ доштан", "Görseli kaydet", "Պահպանել նկարը", "Şəkli saxla", "Сүрөттү сактоо"], "Таблица недоступна": ["Sheet unavailable", "表格不可用", "Кесте қолжетімсіз", "Ҷадвал дастрас нест", "Tablo kullanılamıyor", "Աղյուսակն անհասանելի է", "Cədvəl əlçatan deyil", "Таблица жеткиликсиз"], "Осталось оплатить": ["Left to pay", "尚需支付", "Төлеуге қалды", "Пардохт кардан боқӣ", "Ödenecek kalan", "Մնացել է վճարել", "Ödəniləcək qalıq", "Төлөнүүгө калды"], "Сколько заплатили": ["How much you paid", "支付了多少", "Қанша төледіңіз", "Чӣ қадар пардохтед", "Ne kadar ödediniz", "Որքան եք վճարել", "Nə qədər ödədiniz", "Канча төлөдүңүз"], "Выберите аккаунт": ["Choose an account", "请选择账户", "Аккаунтты таңдаңыз", "Ҳисобро интихоб кунед", "Hesap seçin", "Ընտրեք հաշիվ", "Hesab seçin", "Аккаунтту тандаңыз"], "Выберите партию.": ["Choose a batch.", "请选择批次。", "Партияны таңдаңыз.", "Партияро интихоб кунед.", "Bir parti seçin.", "Ընտրեք խմբաքանակ։", "Partiya seçin.", "Партияны тандаңыз."], "Наценка с продаж": ["Markup on sales", "销售加价", "Сатылымнан үстеме", "Иловапулӣ аз фурӯш", "Satış kârı", "Վաճառքի հավելագին", "Satışdan əlavə dəyər", "Сатуудан үстөк баа"], "Пришло наличными": ["Received in cash", "现金收入", "Қолма-қол түсті", "Нақд омад", "Nakit gelen", "Ստացվել է կանխիկ", "Nağd daxil olub", "Накталай түштү"], "Синхронизировать": ["Sync", "同步", "Синхрондау", "Ҳамоҳангсозӣ", "Senkronize et", "Համաժամեցնել", "Sinxronlaşdır", "Шайкештирүү"], "ещё не окупилось": ["not paid off yet", "尚未回本", "әлі өтелмеді", "ҳоло пардохт нашудааст", "henüz kendini çıkarmadı", "դեռ չի փակվել", "hələ özünü ödəməyib", "азырынча актала элек"], "Добавить запись": ["Add entry", "添加记录", "Жазба қосу", "Сабт илова кардан", "Kayıt ekle", "Ավելացնել գրառում", "Qeyd əlavə et", "Жазуу кошуу"], "Добавить партию": ["Add batch", "添加批次", "Партия қосу", "Партия илова кардан", "Parti ekle", "Ավելացնել խմբաքանակ", "Partiya əlavə et", "Партия кошуу"], "Записать расход": ["Record expense", "记录支出", "Шығысты жазу", "Хароҷотро сабт кардан", "Gideri kaydet", "Գրանցել ծախսը", "Xərci yaz", "Чыгымды жазуу"], "Из какой партии": ["From which batch", "来自哪个批次", "Қай партиядан", "Аз кадом партия", "Hangi partiden", "Որ խմբաքանակից", "Hansı partiyadan", "Кайсы партиядан"], "Изменить партию": ["Edit batch", "编辑批次", "Партияны өзгерту", "Партияро тағйир додан", "Partiyi düzenle", "Փոփոխել խմբաքանակը", "Partiyanı dəyiş", "Партияны өзгөртүү"], "Открыть таблицу": ["Open sheet", "打开表格", "Кестені ашу", "Ҷадвалро кушодан", "Tabloyu aç", "Բացել աղյուսակը", "Cədvəli aç", "Таблицаны ачуу"], "Открыть Google Таблицу": ["Open Google Sheet", "打开 Google 表格", "Google Кестені ашу", "Ҷадвали Google-ро кушодан", "Google Tabloyu aç", "Բացել Google Աղյուսակը", "Google Cədvəli aç", "Google Таблицаны ачуу"], "Сколько заехало": ["How much arrived", "到货多少", "Қанша келді", "Чӣ қадар омад", "Ne kadar geldi", "Որքան է եկել", "Nə qədər gəldi", "Канча келди"], "Удалить продажу": ["Delete sale", "删除销售", "Сатылымды жою", "Фурӯшро нест кардан", "Satışı sil", "Ջնջել վաճառքը", "Satışı sil", "Сатууну өчүрүү"], "Астана, Актау…": ["Astana, Aktau…", "阿斯塔纳、阿克套…", "Астана, Ақтау…", "Остона, Актау…", "Astana, Aktav…", "Աստանա, Ակտաու…", "Astana, Aktau…", "Бишкек, Ош…"], "В какой валюте": ["In which currency", "以何种货币", "Қай валютада", "Бо кадом асъор", "Hangi para biriminde", "Որ արժույթով", "Hansı valyutada", "Кайсы валютада"], "График выручки": ["Revenue chart", "收入图表", "Түсім графигі", "Ҷадвали даромад", "Ciro grafiği", "Հասույթի գծապատկեր", "Gəlir qrafiki", "Түшкөн акчанын графиги"], "Добавить номер": ["Add number", "添加号码", "Нөмір қосу", "Рақам илова кардан", "Numara ekle", "Ավելացնել համար", "Nömrə əlavə et", "Номер кошуу"], "Имя поставщика": ["Supplier name", "供应商名称", "Жеткізуші аты", "Номи таъминкунанда", "Tedarikçi adı", "Մատակարարի անունը", "Təchizatçının adı", "Жеткирүүчүнүн аты"], "Номер телефона": ["Phone number", "电话号码", "Телефон нөмірі", "Рақами телефон", "Telefon numarası", "Հեռախոսահամար", "Telefon nömrəsi", "Телефон номери"], "Переподключите": ["Reconnect", "请重新连接", "Қайта қосыңыз", "Аз нав пайваст кунед", "Yeniden bağlayın", "Վերամիացրեք", "Yenidən qoşun", "Кайра туташтырыңыз"], "Под реализацию": ["Consignment", "寄售", "Сатуға", "Барои фурӯш", "Konsinye", "Իրացման", "Realizasiya", "Реализация"], "Принять оплату": ["Accept payment", "收款", "Төлем қабылдау", "Қабули пардохт", "Ödeme al", "Ընդունել վճարում", "Ödəniş qəbul et", "Төлөмдү кабыл алуу"], "Сохранить курс": ["Save rate", "保存汇率", "Бағамды сақтау", "Қурбро нигоҳ доштан", "Kuru kaydet", "Պահպանել փոխարժեքը", "Məzənnəni saxla", "Курсту сактоо"], "Удалить оплату": ["Delete payment", "删除付款", "Төлемді жою", "Пардохтро нест кардан", "Ödemeyi sil", "Ջնջել վճարումը", "Ödənişi sil", "Төлөмдү өчүрүү"], "Удалить партию": ["Delete batch", "删除批次", "Партияны жою", "Партияро нест кардан", "Partiyi sil", "Ջնջել խմբաքանակը", "Partiyanı sil", "Партияны өчүрүү"], "Удалить расход": ["Delete expense", "删除支出", "Шығысты жою", "Хароҷотро нест кардан", "Gideri sil", "Ջնջել ծախսը", "Xərci sil", "Чыгымды өчүрүү"], "Укажите сумму.": ["Enter the amount.", "请填写金额。", "Соманы көрсетіңіз.", "Маблағро нишон диҳед.", "Tutarı girin.", "Նշեք գումարը։", "Məbləği göstərin.", "Сумманы көрсөтүңүз."], "Всего вложено": ["Total invested", "总投入", "Барлығы салынды", "Ҳамагӣ сармоягузорӣ", "Toplam yatırım", "Ընդամենը ներդրված", "Cəmi qoyulub", "Жалпы салынган"], "Должен сейчас": ["Owes now", "当前欠款", "Қазір қарызы", "Ҳоло қарздор", "Şu anki borç", "Հիմա պարտք է", "İndi borcu", "Азыр карыз"], "Должен только": ["Owes only", "仅欠", "Тек қарызы", "Танҳо қарздор", "Sadece borçlu", "Պարտք է միայն", "Yalnız borcu", "Болгону карыз"], "Ждёт отправки": ["Waiting to send", "等待发送", "Жіберуді күтуде", "Интизори фиристодан", "Gönderilmeyi bekliyor", "Սպասում է ուղարկման", "Göndərilməyi gözləyir", "Жөнөтүүнү күтүүдө"], "Общие расходы": ["General expenses", "日常支出", "Жалпы шығыстар", "Хароҷоти умумӣ", "Genel giderler", "Ընդհանուր ծախսեր", "Ümumi xərclər", "Жалпы чыгымдар"], "Оплатил сразу": ["Paid at once", "已当即付款", "Бірден төледім", "Дарҳол пардохтам", "Hemen ödedim", "Վճարել եմ միանգամից", "Dərhal ödədim", "Дароо төлөдү"], "Себестоимость": ["Cost price", "成本价", "Өзіндік құн", "Арзиши аслӣ", "Maliyet", "Ինքնարժեք", "Maya dəyəri", "Өздүк баасы"], "Сколько взяли": ["How much you took", "拿了多少", "Қанша алдыңыз", "Чӣ қадар гирифтед", "Ne kadar aldınız", "Որքան եք վերցրել", "Nə qədər götürdünüz", "Канча алдык"], "Сколько отдал": ["How much paid", "付了多少", "Қанша берді", "Чӣ қадар дод", "Ne kadar ödedi", "Որքան է տվել", "Nə qədər verdi", "Канча берди"], "Удалить номер": ["Delete number", "删除号码", "Нөмірді жою", "Рақамро нест кардан", "Numarayı sil", "Ջնջել համարը", "Nömrəni sil", "Номерди өчүрүү"], "Укажите курс.": ["Enter the rate.", "请填写汇率。", "Бағамды көрсетіңіз.", "Қурбро нишон диҳед.", "Kuru girin.", "Նշեք փոխարժեքը։", "Məzənnəni göstərin.", "Курсту көрсөтүңүз."], "Цена в валюте": ["Price in currency", "外币价格", "Валютадағы баға", "Нарх бо асъор", "Döviz fiyatı", "Գինը արժույթով", "Valyutada qiymət", "Валютадагы баасы"], "Что записать?": ["What to record?", "要记录什么？", "Не жазамыз?", "Чиро сабт кунем?", "Ne kaydedilsin?", "Ի՞նչ գրանցել", "Nə yazaq?", "Эмнени жазуу керек?"], "Яблоки, апорт": ["Apples, Aport", "苹果，阿波尔特", "Алма, апорт", "Себ, апорт", "Elma, aport", "Խնձոր, ապորտ", "Alma, aport", "Алма, апорт"], "необязательно": ["optional", "可选", "міндетті емес", "ихтиёрӣ", "isteğe bağlı", "ոչ պարտադիր", "məcburi deyil", "милдеттүү эмес"], "просрочено на": ["overdue by", "已逾期", "мерзімі өтті:", "мӯҳлат гузашт:", "gecikti:", "ուշացել է", "gecikib:", "мөөнөтү өтүп кетти:"], "Здравствуйте": ["Hello", "您好", "Сәлеметсіз бе", "Салом", "Merhaba", "Բարև Ձեզ", "Salam", "Саламатсызбы"], "Новая партия": ["New batch", "新批次", "Жаңа партия", "Партияи нав", "Yeni parti", "Նոր խմբաքանակ", "Yeni partiya", "Жаңы партия"], "По чём взяли": ["Price taken at", "进价", "Қаншаға алдыңыз", "Бо чӣ нарх гирифтед", "Alış fiyatı", "Ինչ գնով եք վերցրել", "Neçəyə götürdünüz", "Канчадан алдык"], "Указать курс": ["Set rate", "设置汇率", "Бағам көрсету", "Қурбро нишон додан", "Kuru belirle", "Նշել փոխարժեքը", "Məzənnəni göstər", "Курсту көрсөтүү"], "Цена за ящик": ["Price per box", "每箱价格", "Жәшік бағасы", "Нархи як қуттӣ", "Kasa fiyatı", "Գինը մեկ արկղի համար", "Qutunun qiyməti", "Бир жашиктин баасы"], "Цена закупа": ["Purchase price", "进价", "Сатып алу бағасы", "Нархи харид", "Alış fiyatı", "Գնման գին", "Alış qiyməti", "Сатып алуу баасы"], "Дата закупа": ["Purchase date", "进货日期", "Сатып алу күні", "Санаи харид", "Alış tarihi", "Գնման ամսաթիվ", "Alış tarixi", "Сатып алган дата"], "Как оплатил": ["How paid", "付款方式", "Қалай төледі", "Чӣ тавр пардохт", "Nasıl ödedi", "Ինչպես է վճարել", "Necə ödədi", "Кантип төлөдү"], "Комментарий": ["Comment", "备注", "Түсініктеме", "Шарҳ", "Yorum", "Մեկնաբանություն", "Şərh", "Комментарий"], "Оплатить до": ["Pay by", "付款截止", "Төлеу мерзімі", "Пардохт то", "Son ödeme", "Վճարել մինչև", "Ödəmə tarixi", "Чейин төлөө"], "Отправить в WhatsApp": ["Send via WhatsApp", "通过 WhatsApp 发送", "WhatsApp-қа жіберу", "Ба WhatsApp фиристодан", "WhatsApp ile gönder", "Ուղարկել WhatsApp-ով", "WhatsApp ilə göndər", "WhatsApp аркылуу жөнөтүү"], "Отправить в": ["Send to", "发送到", "Жіберу:", "Фиристодан ба", "Gönder:", "Ուղարկել", "Göndər:", "Жөнөтүү:"], "Уже продано": ["Already sold", "已售出", "Сатылып қойды", "Аллакай фурӯхта шуд", "Zaten satıldı", "Արդեն վաճառված է", "Artıq satılıb", "Мурун сатылды"], "долг закрыт": ["debt closed", "欠款已结清", "қарыз жабылды", "қарз пӯшида шуд", "borç kapandı", "պարտքը փակված է", "borc bağlanıb", "карыз жабылды"], "кг по курсу": ["kg at rate", "公斤，汇率", "кг бағам бойынша", "кг бо қурби", "kg, kur", "կգ փոխարժեքով", "kq məzənnə ilə", "кг курс боюнча"], "Вы платите": ["You pay", "您付款给", "Сіз төлейсіз", "Шумо пардохт мекунед", "Siz ödüyorsunuz", "Դուք վճարում եք", "Siz ödəyirsiniz", "Сиз төлөйсүз"], "Выручка по месяцам": ["Revenue by month", "按月收入", "Айлар бойынша түсім", "Даромад аз рӯи моҳҳо", "Aylara göre ciro", "Հասույթն ըստ ամիսների", "Aylar üzrə gəlir", "Айлар боюнча түшкөн акча"], "Выручка по дням": ["Revenue by day", "按日收入", "Күндер бойынша түсім", "Даромад аз рӯи рӯзҳо", "Günlere göre ciro", "Հասույթն ըստ օրերի", "Günlər üzrə gəlir", "Күндөр боюнча түшкөн акча"], "Должны вам": ["Owed to you", "别人欠您", "Сізге қарыз", "Ба шумо қарздоранд", "Size borçlar", "Ձեզ պարտք են", "Sizə borclar", "Сизге карыздар"], "Количество": ["Quantity", "数量", "Мөлшері", "Миқдор", "Miktar", "Քանակ", "Miqdar", "Саны"], "Курс валют": ["Exchange rates", "汇率", "Валюта бағамы", "Қурби асъор", "Döviz kurları", "Փոխարժեքներ", "Valyuta məzənnələri", "Валюта курсу"], "Отправляю…": ["Sending…", "正在发送…", "Жіберілуде…", "Фиристода истодааст…", "Gönderiliyor…", "Ուղարկվում է…", "Göndərilir…", "Жөнөтүлүүдө…"], "Подключите": ["Connect", "请连接", "Қосыңыз", "Пайваст кунед", "Bağlayın", "Միացրեք", "Qoşun", "Туташтырыңыз"], "Покупатели": ["Buyers", "买家", "Сатып алушылар", "Харидорон", "Alıcılar", "Գնորդներ", "Alıcılar", "Сатып алуучулар"], "Покупатель": ["Buyer", "买家", "Сатып алушы", "Харидор", "Alıcı", "Գնորդ", "Alıcı", "Сатып алуучу"], "Поставщики": ["Suppliers", "供应商", "Жеткізушілер", "Таъминкунандагон", "Tedarikçiler", "Մատակարարներ", "Təchizatçılar", "Жеткирүүчүлөр"], "Фиолетовый": ["Purple", "紫色", "Күлгін", "Бунафш", "Mor", "Մանուշակագույն", "Bənövşəyi", "Күлгүн"], "Цена за кг": ["Price per kg", "每公斤价格", "Кг бағасы", "Нархи як кг", "Kg fiyatı", "Գինը մեկ կգ-ի համար", "Kq qiyməti", "кг баасы"], "долгов нет": ["no debts", "无欠款", "қарыз жоқ", "қарз нест", "borç yok", "պարտք չկա", "borc yoxdur", "карыздар жок"], "заработано": ["earned", "已赚", "табылды", "ба даст омад", "kazanıldı", "վաստակված", "qazanılıb", "тапкан"], "Всё время": ["All time", "全部时间", "Барлық уақыт", "Ҳама вақт", "Tüm zamanlar", "Ամբողջ ժամանակ", "Bütün vaxt", "Бардык убакыт"], "Вы должны": ["You owe", "您欠", "Сіздің қарызыңыз", "Шумо қарздоред", "Borcunuz", "Դուք պարտք եք", "Siz borclusunuz", "Сиз карызсыз"], "вы должны": ["you owe", "您欠", "сіздің қарызыңыз", "шумо қарздоред", "borcunuz", "դուք պարտք եք", "siz borclusunuz", "сиз карызсыз"], "Загрузка…": ["Loading…", "加载中…", "Жүктелуде…", "Боргирӣ…", "Yükleniyor…", "Բեռնվում է…", "Yüklənir…", "Жүктөлүүдө…"], "Заработок": ["Earnings", "收益", "Табыс", "Даромад", "Kazanç", "Վաստակ", "Qazanc", "Киреше"], "Компьютер": ["Computer", "电脑", "Компьютер", "Компютер", "Bilgisayar", "Համակարգիչ", "Kompüter", "Компьютер"], "НАКЛАДНАЯ": ["INVOICE", "发货单", "ЖҮКҚҰЖАТ", "БОРНОМА", "FATURA", "ԲԵՌՆԱԳԻՐ", "QAİMƏ", "НАКЛАДНАЯ"], "Накладная": ["Invoice", "发货单", "Жүкқұжат", "Борнома", "Fatura", "Բեռնագիր", "Qaimə", "Накладная"], "На складе": ["In stock", "库存", "Қоймада", "Дар анбор", "Stokta", "Պահեստում", "Anbarda", "Кампада"], "Напомнить": ["Remind", "提醒", "Еске салу", "Хотиррасон", "Hatırlat", "Հիշեցնել", "Xatırlat", "Эскертүү"], "Настройки": ["Settings", "设置", "Баптаулар", "Танзимот", "Ayarlar", "Կարգավորումներ", "Ayarlar", "Жөндөөлөр"], "Оранжевый": ["Orange", "橙色", "Қызғылт сары", "Норинҷӣ", "Turuncu", "Նարնջագույն", "Narıncı", "Кызгылт сары"], "Поставщик": ["Supplier", "供应商", "Жеткізуші", "Таъминкунанда", "Tedarikçi", "Մատակարար", "Təchizatçı", "Жеткирүүчү"], "Пришло на": ["Received on", "收到于", "Түсті:", "Омад ба", "Gelen:", "Ստացվել է", "Daxil olub:", "Түштү"], "Сохранить": ["Save", "保存", "Сақтау", "Нигоҳ доштан", "Kaydet", "Պահպանել", "Saxla", "Сактоо"], "за период": ["for the period", "本期间", "кезеңде", "дар давра", "dönem için", "ժամանակահատվածում", "dövr üzrə", "мезгил үчүн"], "и списано": ["and written off", "并报废", "және есептен шығарылды", "ва ҳисоб карда шуд", "ve düşüldü", "և դուրս գրված", "və silinib", "жана чыгарылды"], "не указан": ["not set", "未填写", "көрсетілмеген", "нишон дода нашудааст", "belirtilmedi", "նշված չէ", "göstərilməyib", "көрсөтүлгөн эмес"], "Грузчики": ["Loaders", "装卸工", "Жүк тасушылар", "Борбардорон", "Hamallar", "Բեռնակիրներ", "Yükdaşıyanlar", "Жүк ташуучулар"], "Записать": ["Record", "记录", "Жазу", "Сабт кардан", "Kaydet", "Գրանցել", "Yaz", "Жазуу"], "Зарплата": ["Salary", "工资", "Жалақы", "Маош", "Maaş", "Աշխատավարձ", "Maaş", "Маяна"], "Изменить": ["Edit", "编辑", "Өзгерту", "Тағйир додан", "Düzenle", "Փոփոխել", "Dəyiş", "Өзгөртүү"], "Наличные": ["Cash", "现金", "Қолма-қол", "Нақд", "Nakit", "Կանխիկ", "Nağd", "Накталай"], "Оплатить": ["Pay", "付款", "Төлеу", "Пардохт кардан", "Öde", "Վճարել", "Ödə", "Төлөө"], "Оплачено": ["Paid", "已付", "Төленді", "Пардохт шуд", "Ödendi", "Վճարված", "Ödənilib", "Төлөндү"], "Осталось": ["Left", "剩余", "Қалды", "Боқӣ", "Kalan", "Մնացել է", "Qalıb", "Калды"], "за ящик": ["per box", "每箱", "жәшігі", "барои як қуттӣ", "kasa başı", "մեկ արկղի համար", "qutusu", "жашик үчүн"], "к оплате": ["to pay", "应付", "төлеуге", "барои пардохт", "ödenecek", "վճարման", "ödəniləcək", "төлөнүүгө"], "например": ["e.g.", "例如", "мысалы", "масалан", "örn.", "օրինակ", "məsələn", "мисалы"], "оплатили": ["paid", "已付", "төледіңіз", "пардохт шуд", "ödendi", "վճարվել է", "ödənilib", "төлөштү"], "оплачено": ["paid", "已付", "төленді", "пардохт шуд", "ödendi", "վճարված", "ödənilib", "төлөндү"], "осталось": ["left", "剩余", "қалды", "боқӣ", "kalan", "մնացել է", "qalıb", "калды"], "по курсу": ["at the rate of", "按汇率", "бағам бойынша", "бо қурби", "kurla", "փոխարժեքով", "məzənnə ilə", "курс боюнча"], "Вложено": ["Invested", "投入", "Салынды", "Сармоя", "Yatırılan", "Ներդրված", "Qoyulub", "Салынды"], "Выручка": ["Revenue", "收入", "Түсім", "Даромад", "Ciro", "Հասույթ", "Gəlir", "Түшкөн акча"], "Закрыть": ["Close", "关闭", "Жабу", "Пӯшидан", "Kapat", "Փակել", "Bağla", "Жабуу"], "Зелёный": ["Green", "绿色", "Жасыл", "Сабз", "Yeşil", "Կանաչ", "Yaşıl", "Жашыл"], "Открыть": ["Open", "打开", "Ашу", "Кушодан", "Aç", "Բացել", "Aç", "Ачуу"], "Продажи": ["Sales", "销售", "Сатылымдар", "Фурӯшҳо", "Satışlar", "Վաճառքներ", "Satışlar", "Сатуулар"], "Продано": ["Sold", "已售", "Сатылды", "Фурӯхта шуд", "Satıldı", "Վաճառված", "Satılıb", "Сатылды"], "Продать": ["Sell", "出售", "Сату", "Фурӯхтан", "Sat", "Վաճառել", "Sat", "Сатуу"], "Разделы": ["Sections", "栏目", "Бөлімдер", "Бахшҳо", "Bölümler", "Բաժիններ", "Bölmələr", "Бөлүмдөр"], "Расходы": ["Expenses", "支出", "Шығыстар", "Хароҷот", "Giderler", "Ծախսեր", "Xərclər", "Чыгымдар"], "Светлая": ["Light", "浅色", "Ашық", "Равшан", "Açık", "Բաց", "Açıq", "Жарык"], "Сегодня": ["Today", "今天", "Бүгін", "Имрӯз", "Bugün", "Այսօր", "Bu gün", "Бүгүн"], "Сколько": ["How much", "多少", "Қанша", "Чӣ қадар", "Ne kadar", "Որքան", "Nə qədər", "Канча"], "Таблица": ["Sheet", "表格", "Кесте", "Ҷадвал", "Tablo", "Աղյուսակ", "Cədvəl", "Таблица"], "Телефон": ["Phone", "电话", "Телефон", "Телефон", "Telefon", "Հեռախոս", "Telefon", "Телефон"], "Удалить": ["Delete", "删除", "Жою", "Нест кардан", "Sil", "Ջնջել", "Sil", "Өчүрүү"], "Цена/кг": ["Price/kg", "单价/公斤", "Баға/кг", "Нарх/кг", "Fiyat/kg", "Գին/կգ", "Qiymət/kq", "Баасы/кг"], "продажа": ["sale", "笔销售", "сатылым", "фурӯш", "satış", "վաճառք", "satış", "сатуу"], "продажи": ["sales", "笔销售", "сатылым", "фурӯш", "satış", "վաճառք", "satış", "сатуулар"], "продаж": ["sales", "笔销售", "сатылым", "фурӯш", "satış", "վաճառք", "satış", "сатуу"], "сегодня": ["today", "今天", "бүгін", "имрӯз", "bugün", "այսօր", "bu gün", "бүгүн"], "Аренда": ["Rent", "租金", "Жалдау", "Иҷора", "Kira", "Վարձ", "İcarə", "Ижара"], "Бензин": ["Fuel", "油费", "Жанармай", "Бензин", "Yakıt", "Վառելիք", "Benzin", "Бензин"], "Должен": ["Owes", "欠款", "Қарызы", "Қарздор", "Borçlu", "Պարտք է", "Borclu", "Карыз"], "должен": ["owes", "欠款", "қарызы бар", "қарздор", "borçlu", "պարտք է", "borcludur", "карыз"], "Другое": ["Other", "其他", "Басқа", "Дигар", "Diğer", "Այլ", "Digər", "Башка"], "На что": ["What for", "用途", "Не үшін", "Барои чӣ", "Ne için", "Ինչի համար", "Nəyə", "Эмне үчүн"], "Неделя": ["Week", "本周", "Апта", "Ҳафта", "Hafta", "Շաբաթ", "Həftə", "Жума"], "Оплата": ["Payment", "付款", "Төлем", "Пардохт", "Ödeme", "Վճարում", "Ödəniş", "Төлөм"], "оплата": ["payment", "付款", "төлем", "пардохт", "ödeme", "վճարում", "ödəniş", "төлөм"], "Отмена": ["Cancel", "取消", "Болдырмау", "Бекор", "İptal", "Չեղարկել", "Ləğv et", "Жокко чыгаруу"], "Партии": ["Batches", "批次", "Партиялар", "Партияҳо", "Partiler", "Խմբաքանակներ", "Partiyalar", "Партиялар"], "Расход": ["Expense", "支出", "Шығыс", "Хароҷот", "Gider", "Ծախս", "Xərc", "Чыгым"], "Статус": ["Status", "状态", "Күйі", "Ҳолат", "Durum", "Կարգավիճակ", "Status", "Статус"], "Тёмная": ["Dark", "深色", "Қараңғы", "Торик", "Koyu", "Մուգ", "Tünd", "Караңгы"], "в т.ч.": ["incl.", "其中", "оның ішінде", "аз ҷумла", "dahil", "այդ թվում", "o cümlədən", "анын ичинде"], "ошибка": ["error", "错误", "қате", "хато", "hata", "սխալ", "xəta", "ката"], "только": ["only", "仅", "тек", "танҳо", "yalnızca", "միայն", "yalnız", "болгону"], "Взяли": ["Taken", "已拿", "Алынды", "Гирифта шуд", "Alındı", "Վերցված", "Götürülüb", "Алдык"], "взяли": ["took", "拿了", "алды", "гирифтанд", "aldı", "վերցրել են", "götürüb", "алдык"], "Город": ["City", "城市", "Қала", "Шаҳр", "Şehir", "Քաղաք", "Şəhər", "Шаар"], "ИТОГО": ["TOTAL", "合计", "БАРЛЫҒЫ", "ҲАМАГӢ", "TOPLAM", "ԸՆԴԱՄԵՆԸ", "CƏMİ", "ЖАЛПЫ"], "Месяц": ["Month", "本月", "Ай", "Моҳ", "Ay", "Ամիս", "Ay", "Ай"], "Номер": ["Number", "号码", "Нөмір", "Рақам", "Numara", "Համար", "Nömrə", "Номер"], "Отчёт": ["Report", "报告", "Есеп", "Ҳисобот", "Rapor", "Հաշվետվություն", "Hesabat", "Отчёт"], "Порча": ["Spoilage", "损耗", "Бүлінген", "Вайроншуда", "Fire", "Փչացած", "Xarab", "Бузулган"], "Синий": ["Blue", "蓝色", "Көк", "Кабуд", "Mavi", "Կապույտ", "Mavi", "Көк"], "Сумма": ["Amount", "金额", "Сома", "Маблағ", "Tutar", "Գումար", "Məbləğ", "Сумма"], "Фрукт": ["Fruit", "水果", "Жеміс", "Мева", "Meyve", "Միրգ", "Meyvə", "Жемиш"], "всего": ["total", "共", "барлығы", "ҳамагӣ", "toplam", "ընդամենը", "cəmi", "бардыгы"], "закуп": ["purchase", "进价", "сатып алу", "харид", "alış", "գնում", "alış", "сатып алуу"], "лежит": ["in stock", "已放", "жатыр", "мондааст", "bekliyor", "պահվում է", "qalıb", "жатат"], "Авто": ["Auto", "自动", "Авто", "Худкор", "Otomatik", "Ավտո", "Avto", "Авто"], "Дата": ["Date", "日期", "Күні", "Сана", "Tarih", "Ամսաթիվ", "Tarix", "Дата"], "Курс": ["Rate", "汇率", "Бағам", "Қурб", "Kur", "Փոխարժեք", "Məzənnə", "Курс"], "Тема": ["Theme", "主题", "Тақырып", "Мавзӯъ", "Tema", "Թեմա", "Tema", "Тема"], "Цвет": ["Color", "颜色", "Түс", "Ранг", "Renk", "Գույն", "Rəng", "Түс"], "Цена": ["Price", "价格", "Баға", "Нарх", "Fiyat", "Գին", "Qiymət", "Баасы"], "взял": ["took", "拿了", "алды", "гирифт", "aldı", "վերցրել է", "götürüb", "алды"], "долг": ["debt", "欠款", "қарыз", "қарз", "borç", "պարտք", "borc", "карыз"], "ящик": ["box", "箱", "жәшік", "қуттӣ", "kasa", "արկղ", "qutu", "жашик"], "Имя": ["Name", "姓名", "Аты", "Ном", "Ad", "Անուն", "Ad", "Аты"], "дн.": ["d.", "天", "күн", "рӯз", "gün", "օր", "gün", "күн."], "ящ.": ["box.", "箱", "жәш.", "қут.", "kasa", "արկղ", "qutu", "жаш."], "кг": ["kg", "公斤", "кг", "кг", "kg", "կգ", "kq", "кг"], "это": ["that is", "即", "бұл", "ин", "bu", "դա", "bu", "бул"], "до": ["by", "截至", "дейін", "то", "kadar", "մինչև", "qədər", "чейин"], "на": ["for", "共", "үшін", "барои", "için", "համար", "üçün", "үчүн"], "от": ["from", "于", "бастап", "аз", "tarihli", "ից", "tarixli", "баштап"], "по": ["at", "按", "бойынша", "бо", "fiyatı", "գնով", "qiymətilə", "боюнча"], "и": ["and", "和", "және", "ва", "ve", "և", "və", "жана"], "оплатил": ["paid", "已付", "төледі", "пардохт кард", "ödedi", "վճարել է", "ödəyib", "төлөдү"], "за кг": ["per kg", "每公斤", "кг үшін", "барои 1 кг", "kg başı", "մեկ կգ-ի համար", "kq üçün", "кг үчүн"], "за ящ.": ["per box", "每箱", "жәшігі", "барои қуттӣ", "kasa başı", "մեկ արկղի", "qutu üçün", "жаш. үчүн"], "за т": ["per t", "每吨", "т үшін", "барои 1 т", "ton başı", "մեկ տ-ի համար", "ton üçün", "тонна үчүн"], "т": ["t", "吨", "т", "т", "t", "տ", "t", "т"], "Вид": ["View", "视图", "Көрініс", "Намуд", "Görünüm", "Տեսք", "Görünüş", "Түрү"], "Язык": ["Language", "语言", "Тіл", "Забон", "Dil", "Լեզու", "Dil", "Тил"], "Заявки на согласие": ["Consent requests", "同意请求", "Келісім өтінімдері", "Дархостҳои розигӣ", "Onay talepleri", "Համաձայնության հայտեր", "Razılıq sorğuları", "Макулдук өтүнмөлөрү"], "Расходы на партию, ₸ (доставка и др.)": ["Batch expenses, ₸ (delivery etc.)", "批次费用，₸（运费等）", "Партия шығындары, ₸ (жеткізу және т.б.)", "Хароҷоти партия, ₸ (расонидан ва ғ.)", "Parti giderleri, ₸ (nakliye vb.)", "Խմբաքանակի ծախսեր, ₸ (առաքում և այլն)", "Partiya xərcləri, ₸ (çatdırılma və s.)", "Партия чыгымдары, ₸ (жеткирүү ж.б.)"], "Таможня": ["Customs", "海关", "Кеден", "Гумрук", "Gümrük", "Մաքսատուն", "Gömrük", "Бажы"], "за всю партию": ["for the whole batch", "整批", "бүкіл партияға", "барои тамоми партия", "tüm parti için", "ամբողջ խմբաքանակի համար", "bütün partiya üçün", "бүт партия үчүн"], "Включать таможню в «Вложено» и себестоимость": ["Include customs in “Invested” and cost price", "将海关费用计入“投入”和成本价", "Кедендік төлемді «Салынды» және өзіндік құнға қосу", "Гумрукро ба «Сармоя» ва арзиши аслӣ дохил кардан", "Gümrüğü «Yatırılan» ve maliyete dahil et", "Ներառել մաքսատունը «Ներդրված» և ինքնարժեքի մեջ", "Gömrüyü «Qoyulub» və maya dəyərinə daxil et", "Бажыны «Салынды» жана өздүк баасына кошуу"], "(входит в «Вложено» и себестоимость)": ["(included in “Invested” and cost price)", "（计入“投入”和成本价）", "(«Салынды» және өзіндік құнға кіреді)", "(ба «Сармоя» ва арзиши аслӣ дохил мешавад)", "(«Yatırılan» ve maliyete dahildir)", "(ներառված է «Ներդրված» և ինքնարժեքի մեջ)", "(«Qoyulub» və maya dəyərinə daxildir)", "(«Салынды» жана өздүк баасына кирет)"], "(отдельно, в «Вложено» не входит)": ["(separate, not included in “Invested”)", "（单独计算，不计入“投入”）", "(бөлек, «Салынды» құрамына кірмейді)", "(алоҳида, ба «Сармоя» дохил намешавад)", "(ayrı, «Yatırılan» içine dahil değildir)", "(առանձին, «Ներդրված»-ի մեջ չի մտնում)", "(ayrıca, «Qoyulub»-a daxil deyil)", "(өзүнчө, «Салынды» ичине кирбейт)"], "Email поставщика (Google), чтобы он согласился в приложении": ["Supplier’s email (Google), so they can agree in the app", "供应商的邮箱（Google），以便其在应用内确认", "Жеткізушінің email-ы (Google), қолданбада келісім беру үшін", "Email-и таъминкунанда (Google), то ӯ дар барнома розӣ шавад", "Tedarikçinin e-postası (Google), uygulamada onaylayabilmesi için", "Մատակարարի email-ը (Google), որպեսզի նա համաձայնի հավելվածում", "Təchizatçının e-poçtu (Google), tətbiqdə razılıq verməsi üçün", "Жеткирүүчүнүн email-и (Google), колдонмодо макул болуш үчүн"], "Проверьте email поставщика.": ["Check the supplier’s email.", "请检查供应商的邮箱。", "Жеткізушінің email-ын тексеріңіз.", "Email-и таъминкунандаро санҷед.", "Tedarikçinin e-postasını kontrol edin.", "Ստուգեք մատակարարի email-ը։", "Təchizatçının e-poçtunu yoxlayın.", "Жеткирүүчүнүн email-ин текшериңиз."], "Это ваш собственный email. Укажите email поставщика.": ["This is your own email. Enter the supplier’s email.", "这是您自己的邮箱，请填写供应商的邮箱。", "Бұл сіздің өз email-іңіз. Жеткізушінің email-ын көрсетіңіз.", "Ин email-и худи шумост. Email-и таъминкунандаро нишон диҳед.", "Bu sizin kendi e-postanız. Tedarikçinin e-postasını girin.", "Սա ձեր սեփական email-ն է։ Նշեք մատակարարի email-ը։", "Bu sizin öz e-poçtunuzdur. Təchizatçının e-poçtunu göstərin.", "Бул өзүңүздүн email-иңиз. Жеткирүүчүнүн email-ин көрсөтүңүз."], "Обновить оформление таблицы": ["Refresh sheet formatting", "更新表格格式", "Кесте безендірілуін жаңарту", "Тарҳи ҷадвалро навсозӣ кардан", "Tablo düzenini güncelle", "Թարմացնել աղյուսակի ձևավորումը", "Cədvəlin tərtibatını yenilə", "Таблицанын жасалгасын жаңыртуу"], "Обновляю…": ["Updating…", "更新中…", "Жаңартылуда…", "Навсозӣ шуда истодааст…", "Güncelleniyor…", "Թարմացնում եմ…", "Yenilənir…", "Жаңыртылууда…"], "Готово, откройте таблицу": ["Done, open the sheet", "完成，请打开表格", "Дайын, кестені ашыңыз", "Тайёр, ҷадвалро кушоед", "Tamam, tabloyu açın", "Պատրաստ է, բացեք աղյուսակը", "Hazırdır, cədvəli açın", "Даяр, таблицаны ачыңыз"], "Не вышло, нажмите ещё раз": ["Failed, tap again", "未成功，请再点一次", "Болмады, қайта басыңыз", "Нашуд, боз пахш кунед", "Olmadı, tekrar basın", "Չստացվեց, նորից սեղմեք", "Alınmadı, yenidən basın", "Болгон жок, дагы бир жолу басыңыз"], "Аккаунт": ["Account", "账号", "Аккаунт", "Ҳисоб", "Hesap", "Հաշիվ", "Hesab", "Аккаунт"], "Данные видны только этому пользователю на этом устройстве": ["Data is visible only to this user on this device", "数据仅对该设备上的此用户可见", "Деректерді осы құрылғыда тек осы пайдаланушы көреді", "Маълумотро танҳо ҳамин корбар дар ҳамин дастгоҳ мебинад", "Veriler yalnızca bu cihazda bu kullanıcıya görünür", "Տվյալները տեսանելի են միայն այս օգտատիրոջը այս սարքում", "Məlumatları yalnız bu istifadəçi bu cihazda görür", "Маалыматты ушул түзмөктө ушул колдонуучу гана көрөт"], "Выйти": ["Log out", "退出", "Шығу", "Баромадан", "Çıkış yap", "Դուրս գալ", "Çıxış", "Чыгуу"], "Выйти из аккаунта?": ["Log out of your account?", "退出账号？", "Аккаунттан шығасыз ба?", "Аз ҳисоб мебароед?", "Hesaptan çıkılsın mı?", "Դուրս գա՞լ հաշվից։", "Hesabdan çıxırsınız?", "Аккаунттан чыгасызбы?"], "Резервная копия": ["Backup", "备份", "Сақтық көшірме", "Нусхаи эҳтиётӣ", "Yedek", "Պահուստային պատճեն", "Ehtiyat nüsxə", "Резервдик көчүрмө"], "Скачать копию (JSON)": ["Download backup (JSON)", "下载备份（JSON）", "Көшірмені жүктеу (JSON)", "Боргирии нусха (JSON)", "Yedeği indir (JSON)", "Ներբեռնել պատճենը (JSON)", "Nüsxəni yüklə (JSON)", "Көчүрмөнү жүктөп алуу (JSON)"], "Загрузить копию": ["Restore from backup", "导入备份", "Көшірмені жүктеп салу", "Боркунии нусха", "Yedeği yükle", "Վերբեռնել պատճենը", "Nüsxəni yüklə", "Көчүрмөнү жүктөө"], "Заменить текущие данные данными из файла?": ["Replace current data with the data from the file?", "用文件中的数据替换当前数据？", "Ағымдағы деректерді файлдағы деректермен ауыстыру керек пе?", "Маълумоти ҷориро бо маълумоти файл иваз кунем?", "Mevcut veriler dosyadaki verilerle değiştirilsin mi?", "Փոխարինե՞լ ընթացիկ տվյալները ֆայլի տվյալներով։", "Cari məlumatlar fayldakı məlumatlarla əvəz edilsin?", "Учурдагы маалыматты файлдагы маалымат менен алмаштыруу керекпи?"], "Не удалось прочитать файл копии.": ["Couldn’t read the backup file.", "无法读取备份文件。", "Көшірме файлын оқу мүмкін болмады.", "Файли нусхаро хондан нашуд.", "Yedek dosyası okunamadı.", "Պատճենի ֆայլը կարդալ չհաջողվեց։", "Nüsxə faylını oxumaq alınmadı.", "Көчүрмө файлын окуу мүмкүн болгон жок."], "Отправить чек PDF": ["Send receipt PDF", "发送收据 PDF", "Чекті PDF жіберу", "Фиристодани чеки PDF", "Fişi PDF olarak gönder", "Ուղարկել PDF կտրոնը", "Qəbzi PDF göndər", "Чекти PDF жөнөтүү"], "WhatsApp текстом": ["WhatsApp as text", "通过 WhatsApp 发送文字", "WhatsApp-қа мәтінмен", "WhatsApp бо матн", "WhatsApp ile metin olarak", "WhatsApp տեքստով", "WhatsApp ilə mətnlə", "WhatsApp текст менен"], "Чек": ["Receipt", "收据", "Чек", "Чек", "Fiş", "Կտրոն", "Qəbz", "Чек"], "Чек SAM": ["SAM receipt", "SAM 收据", "SAM чегі", "Чеки SAM", "SAM fişi", "SAM-ի կտրոն", "SAM qəbzi", "SAM чеги"], "Чек ещё готовится, нажмите через секунду.": ["The receipt is still being prepared, tap again in a second.", "收据仍在生成中，请稍后再点一次。", "Чек әлі дайындалып жатыр, бір секундтан кейін басыңыз.", "Чек ҳанӯз тайёр мешавад, баъди як сония пахш кунед.", "Fiş hâlâ hazırlanıyor, bir saniye sonra basın.", "Կտրոնը դեռ պատրաստվում է, սեղմեք մեկ վայրկյան հետո։", "Qəbz hələ hazırlanır, bir saniyə sonra basın.", "Чек дагы даярдалып жатат, бир секунддан кийин басыңыз."], "Не получилось сохранить PDF здесь. Нажмите «Отправить чек PDF» или отправьте текстом в WhatsApp.": ["Couldn’t save the PDF here. Tap “Send receipt PDF” or send it as text via WhatsApp.", "此处无法保存 PDF。请点“发送收据 PDF”，或通过 WhatsApp 发送文字。", "PDF-ті мұнда сақтау мүмкін болмады. «Чекті PDF жіберу» түймесін басыңыз немесе WhatsApp-қа мәтінмен жіберіңіз.", "PDF-ро ин ҷо нигоҳ доштан нашуд. «Фиристодани чеки PDF»-ро пахш кунед ё бо матн ба WhatsApp фиристед.", "PDF-ը այստեղ պահպանել չհաջողվեց։ Սեղմեք «Ուղարկել PDF կտրոնը» կամ ուղարկեք տեքստով WhatsApp-ով։", "PDF-i burada kaydedemedik. «Fişi PDF olarak gönder» düğmesine basın veya WhatsApp ile metin olarak gönderin.", "PDF-i burada saxlamaq alınmadı. «Qəbzi PDF göndər» düyməsinə basın və ya WhatsApp ilə mətnlə göndərin.", "PDF-ти бул жерде сактоо мүмкүн болгон жок. «Чекти PDF жөнөтүү» баскычын басыңыз же WhatsApp аркылуу текст менен жөнөтүңүз."], "Покупатель из": ["Buyer from", "来自以下城市的买家：", "Сатып алушы:", "Харидор аз", "Alıcı:", "Գնորդ՝", "Alıcı:", "Сатып алуучу:"], "Нет курса: укажите его в «Курс валют»": ["No rate: set it in “Exchange rates”", "没有汇率：请在“汇率”中填写", "Бағам жоқ: оны «Валюта бағамы» бөлімінде көрсетіңіз", "Қурб нест: онро дар «Қурби асъор» нишон диҳед", "Kur yok: «Döviz kurları» bölümünde girin", "Փոխարժեք չկա՝ նշեք այն «Փոխարժեքներ» բաժնում", "Məzənnə yoxdur: onu «Valyuta məzənnələri» bölməsində göstərin", "Курс жок: аны «Валюта курсу» бөлүмүндө көрсөтүңүз"], "Нет курса. Укажите его в «Курс валют».": ["No rate. Set it in “Exchange rates”.", "没有汇率。请在“汇率”中填写。", "Бағам жоқ. Оны «Валюта бағамы» бөлімінде көрсетіңіз.", "Қурб нест. Онро дар «Қурби асъор» нишон диҳед.", "Kur yok. «Döviz kurları» bölümünde girin.", "Փոխարժեք չկա։ Նշեք այն «Փոխարժեքներ» բաժնում։", "Məzənnə yoxdur. Onu «Valyuta məzənnələri» bölməsində göstərin.", "Курс жок. Аны «Валюта курсу» бөлүмүндө көрсөтүңүз."], "Для расхода в валюте нет курса. Укажите его в «Курс валют».": ["There is no rate for the foreign-currency expense. Set it in “Exchange rates”.", "外币支出没有汇率。请在“汇率”中填写。", "Валютадағы шығыс үшін бағам жоқ. Оны «Валюта бағамы» бөлімінде көрсетіңіз.", "Барои хароҷот бо асъор қурб нест. Онро дар «Қурби асъор» нишон диҳед.", "Dövizli gider için kur yok. «Döviz kurları» bölümünde girin.", "Արտարժույթով ծախսի համար փոխարժեք չկա։ Նշեք այն «Փոխարժեքներ» բաժնում։", "Valyutada xərc üçün məzənnə yoxdur. Onu «Valyuta məzənnələri» bölməsində göstərin.", "Валютадагы чыгым үчүн курс жок. Аны «Валюта курсу» бөлүмүндө көрсөтүңүз."], "Укажите вес ящика": ["Enter the box weight", "请填写每箱重量", "Жәшік салмағын көрсетіңіз", "Вазни қуттиро нишон диҳед", "Kasa ağırlığını girin", "Նշեք արկղի քաշը", "Qutunun çəkisini göstərin", "Жашиктин салмагын көрсөтүңүз"], "Для таможни за ящик укажите вес одного ящика.": ["For customs per box, enter the weight of one box.", "按箱计海关费用时，请填写每箱重量。", "Жәшік бойынша кеден үшін бір жәшіктің салмағын көрсетіңіз.", "Барои гумрук аз рӯи қуттӣ вазни як қуттиро нишон диҳед.", "Kasa başına gümrük için bir kasanın ağırlığını girin.", "Արկղի համար մաքսատան դեպքում նշեք մեկ արկղի քաշը։", "Qutu üzrə gömrük üçün bir qutunun çəkisini göstərin.", "Жашик боюнча бажы үчүн бир жашиктин салмагын көрсөтүңүз."], "Укажите курс валюты для таможни.": ["Enter the exchange rate for customs.", "请填写海关费用的汇率。", "Кеден үшін валюта бағамын көрсетіңіз.", "Қурби асъорро барои гумрук нишон диҳед.", "Gümrük için döviz kurunu girin.", "Նշեք մաքսատան համար արժույթի փոխարժեքը։", "Gömrük üçün valyuta məzənnəsini göstərin.", "Бажы үчүн валюта курсун көрсөтүңүз."], "Что за расход": ["What expense", "什么支出", "Не шығыс", "Хароҷот чӣ аст", "Ne gideri", "Ինչ ծախս է", "Nə xərc", "Кандай чыгым"], "Убрать расход": ["Remove expense", "移除支出", "Шығысты алып тастау", "Хароҷотро хориҷ кардан", "Gideri kaldır", "Հանել ծախսը", "Xərci çıxar", "Чыгымды алып салуу"], "Доставка": ["Delivery", "运费", "Жеткізу", "Расонидан", "Teslimat", "Առաքում", "Çatdırılma", "Жеткирүү"], "Склад": ["Warehouse", "仓库", "Қойма", "Анбор", "Depo", "Պահեստ", "Anbar", "Кампа"], "Прочее": ["Other", "其他", "Басқа", "Дигар", "Diğer", "Այլ", "Digər", "Башка"], "Погрузка / разгрузка": ["Loading / unloading", "装卸", "Тиеу / түсіру", "Бор кардан / фуровардан", "Yükleme / boşaltma", "Բեռնում / բեռնաթափում", "Yükləmə / boşaltma", "Жүктөө / түшүрүү"], "Другие расходы": ["Other expenses", "其他支出", "Басқа шығындар", "Дигар хароҷот", "Diğer giderler", "Այլ ծախսեր", "Digər xərclər", "Башка чыгымдар"], "Ещё не продано": ["Not yet sold", "尚未售出", "Әлі сатылмаған", "Ҳанӯз фурӯхта нашудааст", "Henüz satılmadı", "Դեռ չի վաճառվել", "Hələ satılmayıb", "Дагы сатыла элек"], "В заработок это не входит. В «Прибыль по всем партиям» эти затраты уже вычтены, поэтому цифры отличаются на эту сумму.": ["This is not part of earnings. These costs are already deducted in “Profit across all batches”, so the figures differ by this amount.", "这部分不计入收入。这些成本已从“所有批次利润”中扣除，因此数字相差此金额。", "Бұл табысқа кірмейді. «Барлық партиялар бойынша пайда» ішінде бұл шығындар алынып тасталған, сондықтан сандар осы соммаға ерекшеленеді.", "Ин ба даромад дохил намешавад. Дар «Фоида аз ҳамаи партияҳо» ин хароҷот аллакай тарҳ шудааст, барои ҳамин рақамҳо ба ин маблағ фарқ мекунанд.", "Bu kazanca dahil değildir. «Tüm partilerden kâr» içinde bu masraflar zaten düşülmüştür, bu yüzden rakamlar bu tutar kadar farklıdır.", "Սա չի մտնում եկամտի մեջ։ «Շահույթը բոլոր խմբաքանակներից» բաժնում այս ծախսերն արդեն հանված են, ուստի թվերը տարբերվում են այս գումարով։", "Bu qazanca daxil deyil. «Bütün partiyalar üzrə mənfəət» daxilində bu xərclər artıq çıxılıb, ona görə rəqəmlər bu məbləğ qədər fərqlənir.", "Бул киреше болуп эсептелбейт. «Бардык партиялар боюнча пайда» ичинен бул чыгымдар мурунтан эле чегерилген, ошондуктан сандар ушул сумма менен айырмаланат."], "Заявка поставщику": ["Request to supplier", "给供应商的申请", "Жеткізушіге өтінім", "Дархост ба таъминкунанда", "Tedarikçiye talep", "Հայտ մատակարարին", "Təchizatçıya sorğu", "Жеткирүүчүгө өтүнмө"], "ждёт согласия": ["awaiting consent", "等待同意", "келісімді күтуде", "интизори розигӣ", "onay bekliyor", "սպասում է համաձայնության", "razılığı gözləyir", "макулдукту күтүүдө"], "поставщик согласен": ["supplier agreed", "供应商已同意", "жеткізуші келісті", "таъминкунанда розӣ шуд", "tedarikçi kabul etti", "մատակարարը համաձայն է", "təchizatçı razılaşdı", "жеткирүүчү макул болду"], "поставщик отклонил": ["supplier declined", "供应商已拒绝", "жеткізуші бас тартты", "таъминкунанда рад кард", "tedarikçi reddetti", "մատակարարը մերժել է", "təchizatçı imtina etdi", "жеткирүүчү баш тартты"], "отозвана вами": ["withdrawn by you", "您已撤回", "сіз қайтарып алдыңыз", "шумо бозпас гирифтед", "siz geri çektiniz", "ետ է կանչվել ձեր կողմից", "siz geri götürdünüz", "сиз кайтарып алдыңыз"], "Отозвать заявку": ["Withdraw request", "撤回申请", "Өтінімді қайтарып алу", "Дархостро бозпас гирифтан", "Talebi geri çek", "Ետ կանչել հայտը", "Sorğunu geri götür", "Өтүнмөнү кайтарып алуу"], "Отправить снова": ["Send again", "重新发送", "Қайта жіберу", "Бори дигар фиристодан", "Tekrar gönder", "Նորից ուղարկել", "Yenidən göndər", "Кайра жөнөтүү"], "Заявка отозвана.": ["Request withdrawn.", "申请已撤回。", "Өтінім қайтарып алынды.", "Дархост бозпас гирифта шуд.", "Talep geri çekildi.", "Հայտը ետ է կանչվել։", "Sorğu geri götürüldü.", "Өтүнмө кайтарып алынды."], "Не удалось выполнить действие. Проверьте интернет.": ["Couldn’t complete the action. Check your internet connection.", "操作失败。请检查网络。", "Әрекетті орындау мүмкін болмады. Интернетті тексеріңіз.", "Амалро иҷро кардан нашуд. Интернетро санҷед.", "Գործողությունը չհաջողվեց կատարել։ Ստուգեք ինտերնետը։", "İşlemi gerçekleştiremedik. İnterneti kontrol edin.", "Əməliyyatı yerinə yetirmək alınmadı. İnterneti yoxlayın.", "Аракетти аткаруу мүмкүн болгон жок. Интернетти текшериңиз."], "Не удалось выполнить действие. Проверьте интернет и повторите.": ["Couldn’t complete the action. Check your internet connection and try again.", "操作失败。请检查网络后重试。", "Әрекетті орындау мүмкін болмады. Интернетті тексеріп, қайталаңыз.", "Амалро иҷро кардан нашуд. Интернетро санҷед ва такрор кунед.", "Գործողությունը չհաջողվեց կատարել։ Ստուգեք ինտերնետը և կրկնեք։", "İşlemi gerçekleştiremedik. İnterneti kontrol edip tekrar deneyin.", "Əməliyyatı yerinə yetirmək alınmadı. İnterneti yoxlayıb təkrar edin.", "Аракетти аткаруу мүмкүн болгон жок. Интернетти текшерип, кайталаңыз."], "Изменение отправлено поставщику. Пока он не согласился, действуют прежние условия.": ["The change was sent to the supplier. Until they agree, the previous terms apply.", "修改已发送给供应商。在其同意之前，仍按原条件执行。", "Өзгеріс жеткізушіге жіберілді. Ол келіспегенше бұрынғы шарттар күшінде.", "Тағйирот ба таъминкунанда фиристода шуд. То розӣ нашавад, шартҳои пештара амал мекунанд.", "Değişiklik tedarikçiye gönderildi. O kabul edene kadar önceki koşullar geçerlidir.", "Փոփոխությունն ուղարկվել է մատակարարին։ Մինչև նրա համաձայնությունը գործում են նախկին պայմանները։", "Dəyişiklik təchizatçıya göndərildi. O razılaşana qədər əvvəlki şərtlər qüvvədədir.", "Өзгөртүү жеткирүүчүгө жөнөтүлдү. Ал макул болмоюнча мурунку шарттар күчүндө."], "Заявка отправлена поставщику. Он увидит её в приложении.": ["The request was sent to the supplier. They will see it in the app.", "申请已发送给供应商，对方将在应用内看到。", "Өтінім жеткізушіге жіберілді. Ол оны қолданбада көреді.", "Дархост ба таъминкунанда фиристода шуд. Ӯ онро дар барнома мебинад.", "Talep tedarikçiye gönderildi. Tedarikçi bunu uygulamada görecek.", "Հայտն ուղարկվել է մատակարարին։ Նա այն կտեսնի հավելվածում։", "Sorğu təchizatçıya göndərildi. O, bunu tətbiqdə görəcək.", "Өтүнмө жеткирүүчүгө жөнөтүлдү. Ал аны колдонмодо көрөт."], "Не удалось отправить заявку.": ["Couldn’t send the request.", "无法发送申请。", "Өтінімді жіберу мүмкін болмады.", "Дархостро фиристодан нашуд.", "Talep gönderilemedi.", "Հայտը ուղարկել չհաջողվեց։", "Sorğunu göndərmək alınmadı.", "Өтүнмөнү жөнөтүү мүмкүн болгон жок."], "Входящие": ["Incoming", "收到的", "Кіріс", "Воридотӣ", "Gelen", "Մուտքային", "Gələnlər", "Кирүүчү"], "Мои заявки": ["My requests", "我的申请", "Менің өтінімдерім", "Дархостҳои ман", "Taleplerim", "Իմ հայտերը", "Sorğularım", "Менин өтүнмөлөрүм"], "Новых заявок нет.": ["No new requests.", "没有新申请。", "Жаңа өтінімдер жоқ.", "Дархостҳои нав нест.", "Yeni talep yok.", "Նոր հայտեր չկան։", "Yeni sorğu yoxdur.", "Жаңы өтүнмөлөр жок."], "Вы пока не отправляли заявок. Они создаются, когда вы берёте товар под реализацию и указываете email поставщика.": ["You haven’t sent any requests yet. They are created when you take goods on consignment and enter the supplier’s email.", "您还没有发送过申请。当您寄售取货并填写供应商邮箱时会自动创建。", "Сіз әлі өтінім жібермедіңіз. Олар сатуға тауар алып, жеткізушінің email-ын көрсеткенде жасалады.", "Шумо ҳанӯз дархост нафиристодаед. Онҳо ҳангоми барои фурӯш гирифтани мол ва нишон додани email-и таъминкунанда сохта мешаванд.", "Henüz talep göndermediniz. Talepler, malı konsinye aldığınızda ve tedarikçinin e-postasını girdiğinizde oluşturulur.", "Դուք դեռ հայտ չեք ուղարկել։ Դրանք ստեղծվում են, երբ ապրանք եք վերցնում իրացման և նշում մատակարարի email-ը։", "Siz hələ sorğu göndərməmisiniz. Onlar mal realizasiyaya götürülərkən və təchizatçının e-poçtu göstərilərkən yaradılır.", "Сиз азырынча өтүнмө жөнөткөн жоксуз. Алар товарды реализацияга алып, жеткирүүчүнүн email-ин көрсөткөндө түзүлөт."], "меняет условия. Сейчас у вас записано:": ["is changing the terms. Currently recorded on your side:", "正在修改条件。您当前的记录是：", "шарттарды өзгертеді. Қазір сізде жазылғаны:", "шартҳоро иваз мекунад. Ҳоло дар сабти шумо:", "koşulları değiştiriyor. Şu anda sizde kayıtlı olan:", "փոխում է պայմանները։ Այժմ ձեր մոտ գրանցված է՝", "şərtləri dəyişir. Hazırda sizdə qeyd olunan:", "шарттарды өзгөртөт. Азыр сизде жазылганы:"], "Новые условия:": ["New terms:", "新条件：", "Жаңа шарттар:", "Шартҳои нав:", "Yeni koşullar:", "Նոր պայմանները՝", "Yeni şərtlər:", "Жаңы шарттар:"], "берёт у вас под реализацию:": ["is taking from you on consignment:", "向您寄售取货：", "сізден сатуға тауар алады:", "аз шумо барои фурӯш мол мегирад:", "sizden konsinye mal alıyor:", "ձեզանից իրացման ապրանք է վերցնում՝", "sizdən realizasiyaya mal götürür:", "сизден реализацияга товар алат:"], "оплатить до": ["pay by", "付款截止", "төлеу мерзімі:", "пардохт то", "ödeme tarihi:", "վճարել մինչև", "ödəmə tarixi:", "төлөө мөөнөтү:"], "Принять": ["Accept", "接受", "Қабылдау", "Қабул кардан", "Kabul et", "Ընդունել", "Qəbul et", "Кабыл алуу"], "Отклонить": ["Decline", "拒绝", "Бас тарту", "Рад кардан", "Reddet", "Մերժել", "İmtina et", "Баш тартуу"], "Напомнить в WhatsApp": ["Remind via WhatsApp", "通过 WhatsApp 提醒", "WhatsApp арқылы еске салу", "Дар WhatsApp хотиррасон кардан", "WhatsApp’tan hatırlat", "Հիշեցնել WhatsApp-ով", "WhatsApp ilə xatırlat", "WhatsApp аркылуу эскертүү"], "Взял у вас под реализацию": ["I took from you on consignment", "我向您寄售取货", "Сізден сатуға тауар алдым", "Аз шумо барои фурӯш мол гирифтам", "Sizden konsinye mal aldım", "Ձեզանից իրացման ապրանք եմ վերցրել", "Sizdən realizasiyaya mal götürdüm", "Сизден реализацияга товар алдым"], "Подтвердите, пожалуйста, в SAM (вход через Google": ["Please confirm in SAM (sign in with Google", "请在 SAM 中确认（使用 Google 登录", "SAM-да растаңыз (Google арқылы кіру:", "Лутфан, дар SAM тасдиқ кунед (воридшавӣ тавассути Google", "Lütfen SAM’de onaylayın (Google ile giriş:", "Խնդրում եմ հաստատեք SAM-ում (մուտք Google-ով՝", "Zəhmət olmasa SAM-da təsdiqləyin (Google ilə giriş:", "Сураныч, SAM’де ырастаңыз (Google аркылуу кирүү:"], "Отклонить заявку от": ["Decline the request from", "拒绝来自以下用户的申请：", "Мына адамның өтінімінен бас тарту:", "Дархостро рад кардан аз", "Şu kişiden gelen talebi reddet:", "Մերժել հայտը՝", "Bu şəxsdən gələn sorğudan imtina et:", "Мындан келген өтүнмөнү четке кагуу:"], "Заявка отклонена.": ["Request declined.", "申请已拒绝。", "Өтінім қабылданбады.", "Дархост рад карда шуд.", "Talep reddedildi.", "Հայտը մերժվել է։", "Sorğudan imtina edildi.", "Өтүнмө четке кагылды."], "Заявка принята.": ["Request accepted.", "申请已接受。", "Өтінім қабылданды.", "Дархост қабул шуд.", "Talep kabul edildi.", "Հայտն ընդունվել է։", "Sorğu qəbul edildi.", "Өтүнмө кабыл алынды."], "Заявка принята, запись добавлена.": ["Request accepted, entry added.", "已接受申请，记录已添加。", "Өтінім қабылданды, жазба қосылды.", "Дархост қабул шуд, сабт илова гардид.", "Talep kabul edildi, kayıt eklendi.", "Հայտն ընդունվել է, գրառումն ավելացվել է։", "Sorğu qəbul edildi, qeyd əlavə olundu.", "Өтүнмө кабыл алынды, жазуу кошулду."], "Продажа записана, но заявка не отметилась принятой. Откройте «Заявки» и повторите.": ["The sale was recorded, but the request wasn’t marked as accepted. Open “Requests” and try again.", "销售已记录，但申请未标记为已接受。请打开“申请”后重试。", "Сатылым жазылды, бірақ өтінім қабылданған деп белгіленбеді. «Өтінімдер» бөлімін ашып, қайталаңыз.", "Фурӯш сабт шуд, аммо дархост ҳамчун қабулшуда қайд нашуд. «Дархостҳо»-ро кушоед ва такрор кунед.", "Satış kaydedildi, ancak talep kabul edildi olarak işaretlenmedi. «Talepler» bölümünü açıp tekrar deneyin.", "Վաճառքը գրանցվել է, բայց հայտը ընդունված չի նշվել։ Բացեք «Հայտեր» բաժինը և կրկնեք։", "Satış qeyd olundu, lakin sorğu qəbul edilmiş kimi işarələnmədi. «Sorğular» bölməsini açıb təkrar edin.", "Сатуу жазылды, бирок өтүнмө кабыл алынды деп белгиленген жок. «Өтүнмөлөр» бөлүмүн ачып, кайталаңыз."], "Не удалось принять заявку.": ["Couldn’t accept the request.", "无法接受申请。", "Өтінімді қабылдау мүмкін болмады.", "Дархостро қабул кардан нашуд.", "Talep kabul edilemedi.", "Հայտն ընդունել չհաջողվեց։", "Sorğunu qəbul etmək alınmadı.", "Өтүнмөнү кабыл алуу мүмкүн болгон жок."], "Не удалось войти.": ["Couldn’t sign in.", "无法登录。", "Кіру мүмкін болмады.", "Ворид шудан нашуд.", "Giriş yapılamadı.", "Մուտք գործել չհաջողվեց։", "Daxil olmaq alınmadı.", "Кирүү мүмкүн болгон жок."], "Не удалось войти:": ["Couldn’t sign in:", "无法登录：", "Кіру мүмкін болмады:", "Ворид шудан нашуд:", "Giriş yapılamadı:", "Մուտք գործել չհաջողվեց՝", "Daxil olmaq alınmadı:", "Кирүү мүмкүн болгон жок:"], "Браузер заблокировал окно входа. Разрешите всплывающие окна и повторите.": ["The browser blocked the sign-in window. Allow pop-ups and try again.", "浏览器拦截了登录窗口。请允许弹出窗口后重试。", "Браузер кіру терезесін бұғаттады. Қалқымалы терезелерге рұқсат беріп, қайталаңыз.", "Браузер равзанаи воридшавиро манъ кард. Равзанаҳои пайдошавандаро иҷозат диҳед ва такрор кунед.", "Tarayıcı giriş penceresini engelledi. Açılır pencerelere izin verip tekrar deneyin.", "Բրաուզերն արգելափակել է մուտքի պատուհանը։ Թույլատրեք թռուցիկ պատուհանները և կրկնեք։", "Brauzer giriş pəncərəsini blokladı. Açılan pəncərələrə icazə verib təkrar edin.", "Браузер кирүү терезесин бөгөттөдү. Калкып чыгуучу терезелерге уруксат берип, кайталаңыз."], "Вход отменён.": ["Sign-in cancelled.", "登录已取消。", "Кіру тоқтатылды.", "Воридшавӣ бекор карда шуд.", "Giriş iptal edildi.", "Մուտքը չեղարկվեց։", "Giriş ləğv edildi.", "Кирүү жокко чыгарылды."], "Войдите тем же Google-аккаунтом, что и в приложении (": ["Sign in with the same Google account as in the app (", "请使用与应用相同的 Google 账号登录（", "Қолданбадағы Google аккаунтымен кіріңіз (", "Бо ҳамон ҳисоби Google, ки дар барнома аст, ворид шавед (", "Uygulamadakiyle aynı Google hesabıyla giriş yapın (", "Մուտք գործեք հավելվածի նույն Google հաշվով (", "Tətbiqdəki eyni Google hesabı ilə daxil olun (", "Колдонмодогу Google аккаунт менен киришиңиз ("], "В партии": ["In batch", "在批次", "Партияда", "Дар партияи", "Partide", "Խմբաքանակում", "Partiyada", "Партияда"], "не хватает товара для нового количества.": ["not enough stock for the new quantity.", "库存不足以满足新数量。", "жаңа көлемге тауар жеткіліксіз.", "барои миқдори нав мол намерасад.", "yeni miktar için yeterli mal yok.", "նոր քանակի համար ապրանքը բավարար չէ։", "yeni miqdar üçün mal çatmır.", "жаңы санга товар жетишсиз."], "Изменить уже записанную продажу?": ["Change the sale that is already recorded?", "修改已记录的销售？", "Жазылып қойған сатылымды өзгерту керек пе?", "Фурӯши аллакай сабтшударо тағйир диҳем?", "Zaten kaydedilmiş satış değiştirilsin mi?", "Փոխե՞լ արդեն գրանցված վաճառքը։", "Artıq qeyd olunmuş satış dəyişdirilsin?", "Мурунтан жазылган сатууну өзгөртөбүзбү?"], "Было:": ["Was:", "原来：", "Болған:", "Буд:", "Önceki:", "Եղել է՝", "Əvvəl:", "Мурда:"], "Станет:": ["Will be:", "改为：", "Болады:", "Мешавад:", "Yeni:", "Կդառնա՝", "Olacaq:", "Болот:"], "Условия обновлены в вашей записи.": ["The terms were updated in your entry.", "您的记录中的条件已更新。", "Жазбаңыздағы шарттар жаңартылды.", "Шартҳо дар сабти шумо навсозӣ шуданд.", "Koşullar kaydınızda güncellendi.", "Պայմանները թարմացվել են ձեր գրառման մեջ։", "Şərtlər qeydinizdə yeniləndi.", "Шарттар жазууңузда жаңыртылды."], "Не удалось принять изменение. Проверьте интернет и повторите.": ["Couldn’t accept the change. Check your internet connection and try again.", "无法接受修改。请检查网络后重试。", "Өзгерісті қабылдау мүмкін болмады. Интернетті тексеріп, қайталаңыз.", "Тағйиротро қабул кардан нашуд. Интернетро санҷед ва такрор кунед.", "Değişiklik kabul edilemedi. İnterneti kontrol edip tekrar deneyin.", "Փոփոխությունն ընդունել չհաջողվեց։ Ստուգեք ինտերնետը և կրկնեք։", "Dəyişikliyi qəbul etmək alınmadı. İnterneti yoxlayıb təkrar edin.", "Өзгөртүүнү кабыл алуу мүмкүн болгон жок. Интернетти текшерип, кайталаңыз."], "На складе нет товара для записи": ["No stock in the warehouse to record", "库存中没有可记录的货物", "Жазу үшін қоймада тауар жоқ", "Барои сабт дар анбор мол нест", "Kayıt için depoda mal yok", "Գրառման համար պահեստում ապրանք չկա", "Qeyd üçün anbarda mal yoxdur", "Жазуу үчүн кампада товар жок"], "Принять заявку без записи в продажи? Продажу можно добавить позже вручную.": ["Accept the request without adding it to sales? You can add the sale manually later.", "接受申请但不记入销售？之后可手动添加销售。", "Өтінімді сатылымдарға жазбай қабылдау керек пе? Сатылымды кейін қолмен қосуға болады.", "Дархостро бе сабт ба фурӯшҳо қабул кунем? Фурӯшро баъдтар дастӣ илова кардан мумкин аст.", "Talep satışlara kaydedilmeden kabul edilsin mi? Satışı daha sonra elle ekleyebilirsiniz.", "Ընդունե՞լ հայտն առանց վաճառքներում գրանցելու։ Վաճառքը կարելի է հետո ավելացնել ձեռքով։", "Sorğu satışlara yazılmadan qəbul edilsin? Satışı sonra əl ilə əlavə etmək olar.", "Өтүнмөнү сатууларга жазбай кабыл алабызбы? Сатууну кийин кол менен кошсо болот."], "Всего": ["Total", "共计", "Барлығы", "Ҳамагӣ", "Toplam", "Ընդամենը", "Cəmi", "Жалпысы"], "Валюта": ["Currency", "货币", "Валюта", "Асъор", "Para birimi", "Արժույթ", "Valyuta", "Валюта"]};
  const LANG_IDX={en:0,zh:1,kk:2,tg:3,tr:4,hy:5,az:6,ky:7};
  const UNIT_T={en:'t',zh:'吨',kk:'т',tg:'т',tr:'t',hy:'տ',az:'t',ky:'т'};
  const LANGS=[['az','Azərbaycan dili','Азербайджанский'],['en','English','Английский'],['hy','Հայերեն','Армянский'],['kk','Қазақ тілі','Казахский'],['ky','Кыргызча','Кыргызский'],['zh','中文','Китайский'],['ru','Русский','Русский'],['tg','Тоҷикӣ','Таджикский'],['tr','Türkçe','Турецкий']];
  let trRe=null, trMap=null;
  function buildTr(){
    if(lang==='ru'||!(lang in LANG_IDX)){ trRe=null; return; }
    const i=LANG_IDX[lang]; trMap=new Map(); const keys=Object.keys(I18N).sort((a,b)=>b.length-a.length);
    keys.forEach(k=>trMap.set(k,I18N[k][i]));
    const escR=k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    trRe=new RegExp('(?<![\\u0400-\\u04FF])(?:'+keys.map(escR).join('|')+')(?![\\u0400-\\u04FF])','g');
  }
  function tr(s){
    if(!trRe||!s||!/[А-Яа-яЁё]/.test(s)) return s;
    return s.replace(trRe,m=>trMap.get(m)).replace(/(\d) т(?![\u0400-\u04FFA-Za-z])/g,'$1 '+UNIT_T[lang]);
  }
  const TR_ATTRS=['placeholder','title','aria-label','alt'];
  const SKIP_TAGS={SCRIPT:1,STYLE:1,TEXTAREA:1,OPTION:1,DATALIST:1};
  function trText(n,force){
    const p=n.parentNode; if(!p||SKIP_TAGS[p.nodeName]) return;
    if(!force&&n.__out!==undefined&&n.nodeValue===n.__out) return;
    if(!(force&&n.__src!==undefined)) n.__src=n.nodeValue;
    const out=tr(n.__src); n.__out=out; if(n.nodeValue!==out) n.nodeValue=out;
  }
  function trAttrs(el,force){
    if(!el.getAttribute) return;
    TR_ATTRS.forEach(a=>{ if(!el.hasAttribute(a)) return; const v=el.getAttribute(a); el.__at=el.__at||{}; const st=el.__at[a];
      if(!force&&st&&st.out===v) return; const src=(force&&st)?st.src:v; const out=tr(src); el.__at[a]={src,out}; if(out!==v) el.setAttribute(a,out); });
  }
  function trTree(root,force){
    if(root.nodeType===3){ trText(root,force); return; }
    if(root.nodeType!==1) return; if(SKIP_TAGS[root.nodeName]) return;
    trAttrs(root,force);
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    let n; while((n=w.nextNode())){ if(n.nodeType===3) trText(n,force); else trAttrs(n,force); }
  }
  const trObs=new MutationObserver(ms=>{ for(const m of ms){
    if(m.type==='childList') m.addedNodes.forEach(n=>trTree(n,false));
    else if(m.type==='characterData') trText(m.target,false);
    else if(m.type==='attributes') trAttrs(m.target,false); } });
  function applyLang(){
    buildTr(); document.documentElement.lang = lang==='zh'?'zh-CN':lang;
    trTree(document.body,true); document.title = tr('Учёт партий фруктов');
    renderLangSeg();
  }
  function renderLangSeg(){
    $('langSeg').innerHTML = LANGS.map(([v,n,ru])=>`<button data-v="${v}" aria-pressed="${v===lang}">${n}</button>`).join('');
  }
  $('langSeg').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b||b.dataset.v===lang) return;
    lang=b.dataset.v; try{ localStorage.setItem('sam-lang',lang); }catch(_){}
    render(); applyLang(); });
  /* theme & accent */
  const PREF_KEY='sam-look';
  const origTheme=document.documentElement.getAttribute('data-theme');
  let look={theme:'auto',accent:'red'}; try{ look=Object.assign(look,JSON.parse(localStorage.getItem(PREF_KEY)||'{}')); }catch(e){}
  function applyLook(){
    const root=document.documentElement;
    if(look.theme==='auto'){ if(origTheme) root.setAttribute('data-theme',origTheme); else root.removeAttribute('data-theme'); }
    else root.setAttribute('data-theme',look.theme);
    if(look.accent==='red') root.removeAttribute('data-accent'); else root.setAttribute('data-accent',look.accent);
    setSeg($('themeSeg'),look.theme); setSeg($('accentSeg'),look.accent);
  }
  function saveLook(){
    try{ localStorage.setItem(PREF_KEY,JSON.stringify(look)); }catch(e){}
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){ applyLook(); return; }
    if(document.startViewTransition){ try{ document.startViewTransition(()=>applyLook()); return; }catch(e){} }
    const root=document.documentElement; root.classList.add('theme-anim'); applyLook();
    clearTimeout(saveLook.t); saveLook.t=setTimeout(()=>root.classList.remove('theme-anim'),500);
  }
  segInit($('themeSeg'),v=>{ look.theme=v; saveLook(); });
  $('accentSeg').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(!b) return; look.accent=b.dataset.v; saveLook(); });
  applyLook();
  $('syncBtn').addEventListener('click',()=>{ fillSyncDlg(); $('syncDlg').showModal(); });
  $('syncNow').addEventListener('click',async()=>{
    clearTimeout(syncTimer);
    if(Auth.google&&!GS.hasToken()){
      try{ await GS.connect(Auth.google.email); await cloudLoad(); }catch(e){ setSync('err','Переподключите Google Sheets'); }
      fillSyncDlg(); return;
    }
    syncSheet(); fillSyncDlg(); });
  if(Auth.google){ $('tplNow').hidden=false; $('tplNow').addEventListener('click',async()=>{
    const b=$('tplNow'); b.disabled=true; const t0=b.textContent; b.textContent='Обновляю…';
    try{ if(!GS.hasToken()) await GS.connect(Auth.google.email); await GS.reapply(); b.textContent='Готово, откройте таблицу'; }
    catch(e){ b.textContent=(e&&e.code!=='needs_reauth'&&e.message)||'Не вышло, нажмите ещё раз'; }
    setTimeout(()=>{ b.textContent=t0; b.disabled=false; },12000); }); }
  /* Google: подтянуть данные из личной таблицы (новее — выигрывает) */
  async function cloudLoad(){
    const snap=await docRef.get(); const d=snap.exists?snap.data():null;
    const lts=+localStorage.getItem(LS_KEY+':ts')||0;
    if(d&&Array.isArray(d.batches)&&(d._ts||0)>lts){
      state={batches:d.batches,rates:d.rates||{usd:0,eur:0,date:''},expenses:d.expenses||[],people:d.people||{}}; migrate();
      try{ localStorage.setItem(LS_KEY,JSON.stringify(state)); localStorage.setItem(LS_KEY+':ts',String(d._ts)); }catch(e){}
      render();
    } else await save();
    $('status').textContent='Данные сохраняются в вашем аккаунте';
    const u=GS.url(); if(u){ $('sheetBtn').href=u; $('sheetBtn').hidden=false; }
    syncSheet();
  }

  /* ---------- backup ---------- */
  $('bkExport').addEventListener('click',()=>{
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
    a.download='fruit-batches-'+new Date().toISOString().slice(0,10)+'.json';
    a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
  $('bkImport').addEventListener('click',()=>$('bkFile').click());
  $('bkFile').addEventListener('change',async e=>{
    const f=e.target.files[0]; e.target.value=''; if(!f) return;
    try{
      const s=JSON.parse(await f.text());
      if(!s||!Array.isArray(s.batches)) throw 0;
      if(!confirm('Заменить текущие данные данными из файла?')) return;
      state={batches:s.batches,rates:s.rates||{usd:0,eur:0,date:''},expenses:s.expenses||[],people:s.people||{}};
      migrate(); changed();
    }catch(err){ alert('Не удалось прочитать файл копии.'); }
  });

  /* ---------- boot ---------- */
  const LAYOUT_KEY='fruit-layout';
  let layoutPref='auto';
  const mq=window.matchMedia('(max-width: 819px)');
  function applyLayout(){
    const v=(layoutPref==='auto'?mq.matches:layoutPref==='mobile')?'mobile':'desktop';
    setSeg($('layoutSeg'),layoutPref);
    if(document.documentElement.dataset.layout!==v){ document.documentElement.dataset.layout=v; render(); }
  }
  if(mq.addEventListener) mq.addEventListener('change',applyLayout); else mq.addListener(applyLayout);
  segInit($('layoutSeg'),v=>{ layoutPref=v; try{localStorage.setItem(LAYOUT_KEY,v);}catch(e){} applyLayout(); });

  buildTr(); trObs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:TR_ATTRS});
  loadLocal(); migrate(); applyLayout(); render(); applyLang();
  (async()=>{
    if(Auth.google){
      mcp=GS.mcp; docRef=GS.docRef; setSync('idle','Синхронизировать');
      try{ await cloudLoad(); }
      catch(e){ $('status').textContent=(e&&e.code!=='needs_reauth'&&e.message)||'Данные хранятся в этом браузере'; setSync('err',syncErrMsg(e)); }
      return;
    }
    if(!window.claude||!window.claude.use){ $('status').textContent='Данные хранятся в этом браузере'; setSync('idle','Открыть таблицу'); return; }
    claude.use('mcp').then(m=>{ mcp=m; setSync('idle', m?'Синхронизировать':'Открыть таблицу'); }).catch(()=>{});
    const timer=setTimeout(()=>{ if(!docRef) $('status').textContent='Данные хранятся в этом браузере'; },10000);
    try{
      const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]);
      const id=user?await user.id():null; clearTimeout(timer);
      if(!db||!id){ $('status').textContent='Данные хранятся в этом браузере'; return; }
      const ref=db.collection('data/users/'+id).doc('batches');
      const snap=await ref.get(); docRef=ref;
      if(snap.exists){ const d=snap.data(); if(d&&Array.isArray(d.batches)){ state=JSON.parse(JSON.stringify({batches:d.batches,rates:d.rates||{usd:0,eur:0,date:''},expenses:d.expenses||[],people:d.people||{}})); migrate(); } render(); $('status').textContent='Сохранено в вашем аккаунте'; }
      else if(state.batches.length) save();
      else $('status').textContent='Данные сохраняются в вашем аккаунте';
    }catch(e){ clearTimeout(timer); $('status').textContent='Данные хранятся в этом браузере'; }
  })();
})();
