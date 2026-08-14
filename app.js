const els={
  installBtn:document.getElementById('installBtn'),
  startBtn:document.getElementById('startBtn'),
  stopBtn:document.getElementById('stopBtn'),
  statusDot:document.getElementById('statusDot'),
  statusText:document.getElementById('statusText'),
  orderTitle:document.getElementById('orderTitle'),
  orderMeta:document.getElementById('orderMeta'),
  lat:document.getElementById('lat'),
  lng:document.getElementById('lng'),
  accuracy:document.getElementById('accuracy'),
  lastUpdate:document.getElementById('lastUpdate'),
  customerName:document.getElementById('customerName'),
  customerAddress:document.getElementById('customerAddress'),
  openMapsBtn:document.getElementById('openMapsBtn'),
  distanceText:document.getElementById('distanceText'),
  ajaxUrl:document.getElementById('ajaxUrl'),
  driverToken:document.getElementById('driverToken'),
  saveConfig:document.getElementById('saveConfig'),
  testConfig:document.getElementById('testConfig')
};

let watchId=null;
let wakeLock=null;
let installPrompt=null;
let lastSent=0;
let map=null, driverMarker=null, customerMarker=null, line=null;
let customerLat=null, customerLng=null;


const qs=new URLSearchParams(location.search);
const urlToken=qs.get('token')||qs.get('driver_token')||'';
const urlAjax=qs.get('ajax')||'';

const saved=JSON.parse(localStorage.getItem('fgDeliveryConfig')||'{}');
els.ajaxUrl.value=urlAjax||saved.ajaxUrl||'';
els.driverToken.value=urlToken||saved.driverToken||'';

function toast(msg){
  const t=document.createElement('div');
  t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(),2600);
}
function setLive(live,msg){
  els.statusDot.classList.toggle('live',live);
  els.statusText.textContent=msg;
}
function saveConfig(){
  const cfg={ajaxUrl:els.ajaxUrl.value.trim(),driverToken:els.driverToken.value.trim()};
  localStorage.setItem('fgDeliveryConfig',JSON.stringify(cfg));
  toast('Configuración guardada');
}
els.saveConfig.addEventListener('click',saveConfig);

async function acquireWakeLock(){
  try{
    if('wakeLock' in navigator){
      wakeLock=await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release',()=>{});
    }
  }catch(e){}
}
async function releaseWakeLock(){
  try{ if(wakeLock) await wakeLock.release(); }catch(e){}
  wakeLock=null;
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && watchId!==null) acquireWakeLock();
});


function haversineKm(lat1,lon1,lat2,lon2){
  const R=6371, toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function updateMap(driverLat=null,driverLng=null){
  if(!window.L) return;
  if(!map) map=L.map('miniMap').setView([14.0818,-87.2068],13);
  if(!map._fgTiles){
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
    map._fgTiles=true;
  }
  const pts=[];
  if(customerLat!=null&&customerLng!=null){
    const p=[customerLat,customerLng];
    if(!customerMarker) customerMarker=L.marker(p).addTo(map).bindPopup('Destino del cliente');
    else customerMarker.setLatLng(p);
    pts.push(p);
  }
  if(driverLat!=null&&driverLng!=null){
    const p=[driverLat,driverLng];
    if(!driverMarker) driverMarker=L.marker(p).addTo(map).bindPopup('Tu ubicación');
    else driverMarker.setLatLng(p);
    pts.push(p);
  }
  if(line){line.remove();line=null;}
  if(pts.length===2){
    line=L.polyline(pts,{dashArray:'8 8'}).addTo(map);
    map.fitBounds(L.latLngBounds(pts).pad(.25));
  }else if(pts.length===1){
    map.setView(pts[0],16);
  }
}

async function loadDeliveryInfo(){
  const ajax=els.ajaxUrl.value.trim(), token=els.driverToken.value.trim();
  if(!ajax||!token) return;
  try{
    let url=ajax+'?action=fg_driver_order_info&token='+encodeURIComponent(token);
    let r=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});
    let data=await r.json();

    if(!data.success){
      url=ajax+'?action=fg_get_driver_delivery_info&token='+encodeURIComponent(token);
      r=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});
      data=await r.json();
    }
    if(!data.success) return;

    const d=data.data;
    els.orderTitle.textContent='Pedido #'+d.order_id;
    const customer=d.customer||d.customer_name||'Cliente';
    els.orderMeta.textContent=customer+' · '+(d.status||'');
    els.customerName.textContent=customer;
    els.customerAddress.textContent=d.address||'Destino GPS del cliente';

    document.querySelectorAll('.stepper button').forEach(b=>{
      b.classList.toggle('active', b.dataset.status===d.status);
      b.disabled = !['En camino','Entregado'].includes(b.dataset.status);
    });

    if(d.customer_lat!=null&&d.customer_lng!=null&&d.customer_lat!==''&&d.customer_lng!==''){
      customerLat=Number(d.customer_lat); customerLng=Number(d.customer_lng);
      els.openMapsBtn.href='https://www.google.com/maps?q='+customerLat+','+customerLng;
      els.openMapsBtn.classList.remove('disabled');
      updateMap();
    }
  }catch(e){}
}

async function sendLocation(pos){
  const now=Date.now();
  if(now-lastSent<7000) return;
  lastSent=now;

  const {latitude,longitude,accuracy}=pos.coords;
  els.lat.textContent=latitude.toFixed(6);
  els.lng.textContent=longitude.toFixed(6);
  els.accuracy.textContent=Math.round(accuracy)+' m';
  els.lastUpdate.textContent=new Date().toLocaleTimeString();
  updateMap(latitude,longitude);
  if(customerLat!=null&&customerLng!=null){
    const km=haversineKm(latitude,longitude,customerLat,customerLng);
    els.distanceText.textContent='Distancia: '+km.toFixed(2)+' km';
  }

  const ajax=els.ajaxUrl.value.trim();
  const token=els.driverToken.value.trim();
  if(!ajax||!token){
    setLive(false,'Falta configurar URL o token');
    return;
  }

  const body=new URLSearchParams({
    action:'fg_update_driver_location',
    token,
    lat:String(latitude),
    lng:String(longitude),
    accuracy:String(accuracy)
  });

  try{
    const r=await fetch(ajax,{
      method:'POST',
      mode:'cors',
      credentials:'omit',
      headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
      body
    });
    const data=await r.json();
    if(data.success){
      setLive(true,'Rastreo activo');
    }else{
      setLive(false,data?.data?.message||'No se pudo actualizar');
    }
  }catch(e){
    setLive(false,'No se pudo conectar con WordPress. Revisa CORS, HTTPS y la URL AJAX.');
  }
}

function geoError(err){
  setLive(false,'Error GPS: '+(err.message||'permiso denegado'));
  els.startBtn.disabled=false; els.stopBtn.disabled=true;
}

els.startBtn.addEventListener('click',async()=>{
  saveConfig();
  if(!navigator.geolocation){
    toast('Este navegador no permite geolocalización');
    return;
  }
  await acquireWakeLock();
  setLive(false,'Solicitando permiso GPS…');
  watchId=navigator.geolocation.watchPosition(
    sendLocation,
    geoError,
    {enableHighAccuracy:true,maximumAge:2000,timeout:15000}
  );
  els.startBtn.disabled=true; els.stopBtn.disabled=false;
});

els.stopBtn.addEventListener('click',async()=>{
  if(watchId!==null) navigator.geolocation.clearWatch(watchId);
  watchId=null;
  await releaseWakeLock();
  els.startBtn.disabled=false; els.stopBtn.disabled=true;
  setLive(false,'Rastreo detenido');
});

els.testConfig.addEventListener('click',async()=>{
  const ajax=els.ajaxUrl.value.trim(), token=els.driverToken.value.trim();
  if(!ajax||!token){toast('Configura URL y token');return;}
  try{
    const url=ajax+'?action=fg_driver_order_info&token='+encodeURIComponent(token);
    const r=await fetch(url,{mode:'cors',credentials:'omit',cache:'no-store'});
    const data=await r.json();
    toast(data.success?'Conexión correcta':'Error: '+(data?.data?.message||'sin respuesta'));
  }catch(e){toast('No se pudo conectar');}
});

document.querySelectorAll('.stepper button').forEach(btn=>{
  btn.addEventListener('click',async()=>{
    const status=btn.dataset.status;
    if(!['En camino','Entregado'].includes(status)) return;

    const ajax=els.ajaxUrl.value.trim(), token=els.driverToken.value.trim();
    if(!ajax||!token){toast('Configura URL y token');return;}

    try{
      const body=new URLSearchParams({
        action:'fg_driver_update_status',
        token,
        status
      });
      const r=await fetch(ajax,{
        method:'POST',
        mode:'cors',
        credentials:'omit',
        headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'},
        body
      });
      const data=await r.json();
      if(data.success){
        document.querySelectorAll('.stepper button').forEach(b=>b.classList.toggle('active',b.dataset.status===status));
        toast('Pedido actualizado: '+status);
        loadDeliveryInfo();
      }else{
        toast(data?.data?.message||'No se pudo actualizar');
      }
    }catch(e){
      toast('No se pudo conectar con WordPress');
    }
  });
});

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); installPrompt=e;
  els.installBtn.classList.remove('hidden');
});
els.installBtn.addEventListener('click',async()=>{
  if(!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt=null;
  els.installBtn.classList.add('hidden');
});

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}

if(urlToken){
  els.orderMeta.textContent='Token del delivery cargado desde el enlace privado.';
}
loadDeliveryInfo();
els.saveConfig.addEventListener('click',()=>setTimeout(loadDeliveryInfo,150));


setInterval(loadDeliveryInfo,5000);
