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

async function ensureAuth(hint){
  if(!settled) await settle;
  let u=auth.currentUser;
  if(u&&hint&&low(u.email)!==low(hint)){ await signOut(auth); u=null; }
  if(!u){
    const p=new GoogleAuthProvider(); if(hint) p.setCustomParameters({login_hint:hint});
    try{ u=(await signInWithPopup(auth,p)).user; }
    catch(e){ const err=new Error(e&&e.code==='auth/popup-blocked'?'Браузер заблокировал окно входа. Разрешите всплывающие окна и повторите.':e&&e.code==='auth/popup-closed-by-user'?'Вход отменён.':'Не удалось войти: '+((e&&e.code)||'ошибка')); err.code=e&&e.code; throw err; }
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
      status:'pending', createdAt:serverTimestamp()
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
  respond:(id,status)=>updateDoc(doc(db,'deals',id),{status,respondedAt:serverTimestamp()})
};
window.dispatchEvent(new Event('deals-ready'));
