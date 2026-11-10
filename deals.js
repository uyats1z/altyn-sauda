/* Заявки на согласие по товару «под реализацию».
   Хранятся в Firebase Firestore (общий для пользователей сервер); сами данные учёта остаются в таблице пользователя. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,collection,doc,addDoc,updateDoc,query,where,getDocs,serverTimestamp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const firebaseConfig={
  apiKey:'AIzaSyB5wJnnAGgZNOqT59adf5dhh2CkJjcjVWM',
  authDomain:'altyn-sauda-d5a70.firebaseapp.com',
  projectId:'altyn-sauda-d5a70',
  storageBucket:'altyn-sauda-d5a70.firebasestorage.app',
  messagingSenderId:'476583765233',
  appId:'1:476583765233:web:fd9e9fde746ae244357550'
};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app), col=collection(db,'deals');
const low=s=>String(s||'').trim().toLowerCase();
let settled=false;
const settle=new Promise(res=>{ onAuthStateChanged(auth,()=>{ settled=true; res(); }); });
const settleT=()=>Promise.race([settle,new Promise((_,rej)=>setTimeout(()=>rej(new Error('Сервер заявок не отвечает. Проверьте интернет и повторите.')),10000))]);
const AUTH_MSG={
  'auth/popup-blocked':'Браузер заблокировал окно входа. Нажмите ещё раз или разрешите всплывающие окна.',
  'auth/popup-closed-by-user':'Вход отменён.',
  'auth/cancelled-popup-request':'Вход отменён. Нажмите ещё раз.',
  'auth/network-request-failed':'Нет связи с сервером входа. Проверьте интернет.',
  'auth/unauthorized-domain':'Этот адрес сайта не разрешён для входа (auth/unauthorized-domain). Его нужно добавить в Firebase: Authentication, Settings, Authorized domains.',
  'auth/operation-not-supported-in-this-environment':'В этом браузере вход через окно не поддерживается. Откройте сайт в Safari или Chrome.'
};

async function ensureAuth(hint){
  if(!settled) await settleT();
  let u=auth.currentUser;
  if(u&&hint&&low(u.email)!==low(hint)){ await signOut(auth); u=null; }
  if(!u){
    const p=new GoogleAuthProvider(); if(hint) p.setCustomParameters({login_hint:hint});
    try{ u=(await signInWithPopup(auth,p)).user; }
    catch(e){ const err=new Error((e&&AUTH_MSG[e.code])||'Не удалось войти: '+((e&&e.code)||'ошибка')); err.code=e&&e.code; throw err; }
    if(hint&&low(u.email)!==low(hint)){ await signOut(auth); throw new Error('Войдите тем же Google-аккаунтом, что и в приложении ('+hint+').'); }
  }
  return u;
}
const pick=d=>Object.assign({id:d.id},d.data());
window.Deals={
  ready:()=>settle,
  user:()=>auth.currentUser,
  ensureAuth,
  async send(d){
    const u=await ensureAuth(d.fromEmail);
    const ref=await addDoc(col,{
      fromUid:u.uid, fromEmail:low(u.email), fromName:String(d.fromName||'').slice(0,100),
      toEmail:low(d.toEmail), toName:String(d.toName||'').slice(0,100),
      fruit:String(d.fruit||'').slice(0,100), kg:+d.kg, boxKg:d.boxKg?+d.boxKg:null, price:+d.price, due:d.due||'', date:d.date||'',
      status:'pending', root:d.root||null, createdAt:serverTimestamp()
    });
    return ref.id;
  },
  async incoming(){
    const u=auth.currentUser; if(!u) return [];
    const s=await getDocs(query(col,where('toEmail','==',low(u.email)),where('status','==','pending')));
    return s.docs.map(pick);
  },
  async outgoing(){
    const u=auth.currentUser; if(!u) return [];
    const s=await getDocs(query(col,where('fromUid','==',u.uid)));
    return s.docs.map(pick);
  },
  async respond(id,status){
    try{ await updateDoc(doc(db,'deals',id),{status,respondedAt:serverTimestamp()}); }
    catch(e){
      if(e&&e.code==='permission-denied'){ const err=new Error('Заявка уже обработана или отозвана. Список обновлён.'); err.code='stale'; throw err; }
      throw e;
    }
  }
};
window.dispatchEvent(new Event('deals-ready'));
