'use strict';
/* ================================================================
   DUSHELL — DASHBOARD ANALÍTICO v2 (dashboard.js)
   Orientado a SESSÃO: o perfil NUNCA é trocado aqui dentro.
   Ordem de decisão do perfil:
     1) rota ?perfil=comprador|fornecedor   (vence sempre)
     2) sessão salva pelo index.html (localStorage)
     3) nada → tela de bloqueio (zero dados expostos)
   Dados: sessão do protótipo (localStorage) com fallback p/ mock.
   Rotas opcionais: &go=... (destaque/retorno) e &secao=... (foco).
   ================================================================ */

/* ---------- 1. ROTA E SESSÃO ---------- */
var QS = (function(){ try{ return new URLSearchParams(location.search); }catch(e){ return {get:function(){return null;}}; } })();
var PERFIL_ROTA = QS.get('perfil');           // 'comprador' | 'fornecedor'
var SECAO = QS.get('secao') || '';
var GO = QS.get('go') || '';

var SESSAO = null;
try {
  var _raw = localStorage.getItem('dushell_sessao');
  if (_raw) { SESSAO = JSON.parse(_raw); }
} catch(e){ SESSAO = null; }
if (SESSAO && (!SESSAO.user || !SESSAO.quotes || !SESSAO.perfil)) { SESSAO = null; }

var PERFIL = null;                            // 'comprador' | 'fornecedor'
if (PERFIL_ROTA === 'comprador' || PERFIL_ROTA === 'fornecedor') {
  PERFIL = PERFIL_ROTA;
} else if (SESSAO && (SESSAO.perfil === 'buyer' || SESSAO.perfil === 'supplier')) {
  PERFIL = SESSAO.perfil === 'supplier' ? 'fornecedor' : 'comprador';
}

/* ---------- 2. BASE DE DADOS: sessão > mock ---------- */
var D = {
  origem: 'mock',
  buyer: 'Comercial Silva Ltda.',
  buyerShort: 'Comercial Silva',
  demoSup: 'sup-horiz',
  userShort: '',
  suppliers: {
    'sup-horiz':{short:'Cavalo de Ferro', ini:'CF', city:'Campinas/SP'},
    'sup-forte':{short:'Alunizando o Mundo', ini:'AM', city:'Jundiaí/SP'},
    'sup-eletro':{short:'EletroSul', ini:'ES', city:'Curitiba/PR'},
    'sup-safe':{short:'SafeGuard', ini:'SG', city:'São Paulo/SP'},
    'sup-pack':{short:'PackMax', ini:'PX', city:'Ribeirão Preto/SP'},
    'sup-hidro':{short:'HidroVale', ini:'HV', city:'Betim/MG'}
  },
  prodCat: {
    'PAR-M8-001':'Fixação','PAR-M8-060':'Fixação','PAR-12-014':'Fixação','ARR-8-001':'Fixação','POR-8-001':'Fixação',
    'ELT-CF-250':'Elétrica','ELT-DJ-025':'Elétrica',
    'EPI-LV-NIT':'EPI','EPI-CP-002':'EPI','EPI-OC-001':'EPI',
    'FER-CF-316':'Ferramentas','FER-FD-750':'Ferramentas',
    'EMB-CX-4030':'Embalagens','EMB-FT-048':'Embalagens',
    'HID-TE-025':'Hidráulica','HID-RG-012':'Hidráulica',
    'LIM-DT-5L':'Limpeza','LIM-AL-5L':'Limpeza'
  },
  prodName: {
    'PAR-M8-001':'Parafuso Sextavado M8×40','PAR-M8-060':'Parafuso Sextavado M8×60','PAR-12-014':'Parafuso Rosca Furadeira 12×25',
    'ARR-8-001':'Arruela Lisa 8 mm','POR-8-001':'Porca Sextavada 8 mm','ELT-CF-250':'Cabo Flexível 2,5 mm²',
    'ELT-DJ-025':'Disjuntor DIN 25 A','EPI-LV-NIT':'Luva Nitrílica','EPI-CP-002':'Capacete Classe B','EPI-OC-001':'Óculos de Proteção',
    'FER-CF-316':'Chave de Fenda 3/16','FER-FD-750':'Furadeira 750 W',
    'EMB-CX-4030':'Caixa Ondulado 40×30×25','EMB-FT-048':'Fita Adesiva 48 mm',
    'HID-TE-025':'Tê PVC 25 mm','HID-RG-012':'Registro Gaveta 1/2','LIM-DT-5L':'Detergente 5 L','LIM-AL-5L':'Álcool 70% 5 L'
  },
  quotes: [], orders: [],
  /* histórico simulado p/ séries (complementa a sessão) */
  histBuyer: [
    {date:'12/12/2024', total:540,  cat:'Fixação'},
    {date:'20/01/2025', total:880,  cat:'Elétrica'},
    {date:'05/02/2025', total:1250, cat:'Fixação'},
    {date:'18/02/2025', total:420,  cat:'EPI'},
    {date:'09/03/2025', total:1610, cat:'Fixação'},
    {date:'22/03/2025', total:310,  cat:'Hidráulica'},
    {date:'14/04/2025', total:980,  cat:'Ferramentas'},
    {date:'26/04/2025', total:730,  cat:'Fixação'}
  ],
  propSeries: [
    {m:'Dez',env:3,ace:1},{m:'Jan',env:4,ace:1},{m:'Fev',env:5,ace:2},
    {m:'Mar',env:4,ace:1},{m:'Abr',env:5,ace:2},{m:'Mai',env:3,ace:2}
  ],
  demandHist: [{cat:'Ferramentas',qty:340},{cat:'EPI',qty:80},{cat:'Hidráulica',qty:150}],
  notifsMock: {
    buyer:[
      {t:'Proposta recebida', d:'Alunizando o Mundo respondeu à cotação COT-000118.', w:'há 2 h', ic:'mail-check'},
      {t:'Proposta recebida', d:'Cavalo de Ferro respondeu à cotação COT-000118.', w:'ontem, 11:02', ic:'mail-check'},
      {t:'Cotação aguardando', d:'A cotação COT-000124 ainda aguarda resposta dos fornecedores.', w:'ontem, 16:40', ic:'hourglass'},
      {t:'Pedido em andamento', d:'O pedido PED-000457 está em processamento pelo fornecedor.', w:'09/05', ic:'truck'}
    ],
    supplier:[
      {t:'Nova cotação recebida', d:'COT-000119 · Construtora Vale Verde — 3 itens direcionados à sua empresa.', w:'hoje, 08:30', ic:'file-text'},
      {t:'Proposta aguardando decisão', d:'Sua proposta na COT-000117 aguarda decisão do comprador.', w:'ontem, 09:12', ic:'hourglass'},
      {t:'Solicitação de produto aprovada', d:'PR-000031 (Mangueira Pneumática 8 mm) aprovada.', w:'06/05', ic:'badge-check'},
      {t:'Pedido concluído', d:'O pedido PED-000449 foi concluído.', w:'30/04', ic:'check-circle-2'}
    ]
  },
  /* mock de cotações/pedidos caso não haja sessão */
  mockQuotes: [
    {id:'COT-000117', date:'02/05/2025 11:48', buyer:'Mercado Bom Preço Ltda.', status:'respondida',
     items:[{sku:'PAR-M8-001',qty:1000}], notified:['sup-horiz'],
     proposals:[{sup:'sup-horiz', sentAt:'02/05/2025 12:31', lines:{'PAR-M8-001':{price:0.40,term:6}}}]},
    {id:'COT-000118', date:'05/05/2025 09:14', buyer:'Comercial Silva Ltda.', status:'respondida',
     items:[{sku:'PAR-M8-001',qty:500},{sku:'PAR-12-014',qty:300},{sku:'FER-CF-316',qty:120}], notified:['sup-horiz','sup-forte'],
     proposals:[
       {sup:'sup-horiz', sentAt:'05/05/2025 11:02', lines:{'PAR-M8-001':{price:0.42,term:5},'PAR-12-014':{price:0.28,term:5},'FER-CF-316':{price:6.90,term:8}}},
       {sup:'sup-forte', sentAt:'05/05/2025 16:40', lines:{'PAR-M8-001':{price:0.39,term:7},'PAR-12-014':{price:0.31,term:6},'FER-CF-316':null}}
     ]},
    {id:'COT-000121', date:'08/05/2025 10:27', buyer:'Comercial Silva Ltda.', status:'parcial',
     items:[{sku:'ELT-CF-250',qty:10},{sku:'ELT-DJ-025',qty:80}], notified:['sup-eletro','sup-safe'],
     proposals:[{sup:'sup-eletro', sentAt:'08/05/2025 13:05', lines:{'ELT-CF-250':{price:389.90,term:4},'ELT-DJ-025':{price:27.40,term:4}}}]},
    {id:'COT-000124', date:'09/05/2025 16:52', buyer:'Comercial Silva Ltda.', status:'aguardando',
     items:[{sku:'EPI-LV-NIT',qty:20},{sku:'LIM-AL-5L',qty:10}], notified:['sup-safe'], proposals:[]},
    {id:'COT-000119', date:'10/05/2025 08:30', buyer:'Construtora Vale Verde S.A.', status:'aguardando',
     items:[{sku:'PAR-M8-060',qty:800,sup:'sup-horiz'},{sku:'ARR-8-001',qty:1600,sup:'sup-horiz'}], notified:['sup-horiz'], proposals:[]}
  ],
  mockOrders: [
    {id:'PED-000449', date:'30/04/2025', quote:'COT-000109', sup:'sup-horiz', buyer:'Comercial Silva Ltda.', buyerShort:'Comercial Silva', items:[{sku:'PAR-M8-001',qty:200}], total:172, status:'concl'},
    {id:'PED-000457', date:'09/05/2025', quote:'COT-000111', sup:'sup-safe', buyer:'Comercial Silva Ltda.', buyerShort:'Comercial Silva', items:[{sku:'EPI-CP-002',qty:40}], total:1240, status:'proc'}
  ]
};

if (SESSAO) {
  D.origem = 'sessao';
  D.quotes = SESSAO.quotes || [];
  D.orders = SESSAO.orders || [];
  D.notifs = SESSAO.notifs || D.notifsMock;
  if (SESSAO.buyerCompany) { D.buyer = SESSAO.buyerCompany; D.buyerShort = SESSAO.buyerShort || SESSAO.buyerCompany; }
  if (SESSAO.demoSup) { D.demoSup = SESSAO.demoSup; }
  if (SESSAO.user) { D.userShort = SESSAO.user.short || ''; }
} else {
  D.quotes = D.mockQuotes;
  D.orders = D.mockOrders;
  D.notifs = D.notifsMock;
}
/* sessões antigas sem buyerCompany: deriva dos dados */
if (!SESSAO || !SESSAO.buyerCompany) {
  var _b = D.quotes.filter(function(q){ return q.buyerShort; })[0];
  if (_b && D.origem==='mock') { D.buyer = _b.buyer || D.buyer; D.buyerShort = _b.buyerShort || D.buyerShort; }
}

/* ---------- 3. UTILITÁRIOS ---------- */
function money(v){ return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function fmtN(v){ return Number(v).toLocaleString('pt-BR'); }
function pct(v){ return Math.round(v)+'%'; }
function kfmt(v){ return v>=1000 ? (v/1000).toFixed(1).replace('.',',')+'k' : String(v); }
function pad2(n){ return ('0'+n).slice(-2); }
function parseDT(s){ var m=String(s).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/); return m?new Date(+m[3],+m[2]-1,+m[1],+m[4],+m[5]):null; }
function parseD(s){ var m=String(s).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m?new Date(+m[3],+m[2]-1,+m[1]):null; }
function refreshIcons(){ try{ if(window.lucide&&lucide.createIcons){ lucide.createIcons(); } }catch(e){} }
function countdownInfo(){
  var now=new Date(), t=new Date(now); t.setHours(18,30,0,0);
  if(t<=now){ t.setDate(t.getDate()+1); }
  var d=t-now; return Math.floor(d/3600000)+'h '+pad2(Math.floor((d%3600000)/60000))+'min';
}
function itemsForSup(q,sid){ return (q.items||[]).filter(function(it){ return !it.sup || it.sup===sid; }); }
function indexURL(go){ return 'index.html?retomar=1' + (go?('&go='+encodeURIComponent(go)):''); }
var GC = { a:'#2563EB', b:'#0D1E4A', c:'#5B8DEF', d:'#93B4F5', e:'#C9D9F8', ok:'#15803D' };

/* ---------- 4. GRÁFICOS SVG PUROS ---------- */
function barChartSVG(series){
  var w=560,h=230,pl=8,pb=26,pt=18,pr=8,cw=w-pl-pr,ch=h-pt-pb;
  var max=Math.max.apply(null,series.map(function(s){return s.v;}).concat([1]));
  var step=cw/series.length, bw=Math.min(38,step*0.52);
  var bars=series.map(function(s,i){
    var bh=Math.max(3,(s.v/max)*ch), x=pl+i*step+(step-bw)/2, y=pt+ch-bh;
    return '<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+bh+'" rx="6" fill="'+GC.a+'" opacity=".92"><title>'+s.m+' · '+money(s.v)+'</title></rect>'
      +'<text class="axv" x="'+(pl+i*step+step/2)+'" y="'+(y-6)+'" text-anchor="middle">'+kfmt(s.v)+'</text>'
      +'<text class="ax" x="'+(pl+i*step+step/2)+'" y="'+(h-8)+'" text-anchor="middle">'+s.m+'</text>';
  }).join('');
  return '<svg class="chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Volume por mês">'
    +'<line class="grid" x1="'+pl+'" y1="'+(pt+ch)+'" x2="'+(w-pr)+'" y2="'+(pt+ch)+'"/>'+bars+'</svg>';
}
function lineChart2SVG(series){
  var w=560,h=230,pl=8,pb=26,pt=16,pr=8,cw=w-pl-pr,ch=h-pt-pb;
  var max=Math.max.apply(null,series.map(function(s){return Math.max(s.a,s.b);}).concat([1]));
  var step=cw/Math.max(1,series.length-1);
  function pts(k){ return series.map(function(s,i){ return {x:pl+i*step,y:pt+ch-(s[k]/max)*ch,v:s[k],m:s.m}; }); }
  function poly(p,color){
    var line=p.map(function(q,i){ return (i?'L':'M')+q.x+' '+q.y; }).join(' ');
    var dots=p.map(function(q){ return '<circle cx="'+q.x+'" cy="'+q.y+'" r="4" fill="#fff" stroke="'+color+'" stroke-width="2.5"><title>'+q.m+' · '+q.v+'</title></circle>'; }).join('');
    return '<path d="'+line+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round"/>'+dots;
  }
  var labels=series.map(function(s,i){ return '<text class="ax" x="'+(pl+i*step)+'" y="'+(h-8)+'" text-anchor="middle">'+s.m+'</text>'; }).join('');
  var grid=[.25,.5,.75].map(function(f){ var y=pt+ch-ch*f; return '<line class="grid" x1="'+pl+'" y1="'+y+'" x2="'+(w-pr)+'" y2="'+y+'" stroke-dasharray="3 5"/>'; }).join('');
  return '<svg class="chart" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Propostas enviadas e aceitas por mês">'
    +grid+poly(pts('a'),GC.a)+poly(pts('b'),GC.ok)+labels
    +'<g font-family="Archivo,sans-serif" font-size="11.5" font-weight="600">'
    +'<rect x="'+pl+'" y="0" width="10" height="10" rx="3" fill="'+GC.a+'"/><text x="'+(pl+15)+'" y="9" fill="#44506E">Enviadas</text>'
    +'<rect x="'+(pl+92)+'" y="0" width="10" height="10" rx="3" fill="'+GC.ok+'"/><text x="'+(pl+107)+'" y="9" fill="#44506E">Aceitas</text></g></svg>';
}
function donutSVG(segs){
  var total=segs.reduce(function(a,s){ return a+s.v; },0)||1;
  var r=54,cx=78,cy=78,sw=20,C=2*Math.PI*r,acc=0,cols=[GC.a,GC.b,GC.c,GC.d,GC.e];
  var arcs=segs.map(function(s,i){
    var len=(s.v/total)*C;
    var el='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+cols[i%5]+'" stroke-width="'+sw+'"'
      +' stroke-dasharray="'+len+' '+(C-len)+'" stroke-dashoffset="'+(-acc)+'" transform="rotate(-90 '+cx+' '+cy+')">'
      +'<title>'+s.label+' · '+pct(s.v/total*100)+'</title></circle>';
    acc+=len; return el;
  }).join('');
  return '<svg width="156" height="156" viewBox="0 0 156 156" role="img" aria-label="Distribuição">'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#EDF1F9" stroke-width="'+sw+'"/>'+arcs
    +'<text x="'+cx+'" y="'+(cy-2)+'" text-anchor="middle" font-family="Sora,sans-serif" font-size="19" font-weight="700" fill="#0D1E4A">'+kfmt(total)+'</text>'
    +'<text x="'+cx+'" y="'+(cy+16)+'" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" letter-spacing="1" fill="#8A94AE">TOTAL</text></svg>';
}
function ringSVG(p, color, center, sub){
  var r=42,cx=60,cy=60,sw=11,C=2*Math.PI*r;
  var len=Math.max(.01,Math.min(100,p)/100*C);
  return '<svg viewBox="0 0 120 120" role="img" aria-label="'+sub+'">'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#EDF1F9" stroke-width="'+sw+'"/>'
    +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="'+sw+'" stroke-linecap="round" stroke-dasharray="'+len+' '+(C-len)+'" transform="rotate(-90 '+cx+' '+cy+')"/>'
    +'<text x="'+cx+'" y="'+(cy+2)+'" text-anchor="middle" font-family="Sora,sans-serif" font-size="21" font-weight="700" fill="#0D1E4A">'+center+'</text>'
    +'<text x="'+cx+'" y="'+(cy+21)+'" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" letter-spacing="1" fill="#8A94AE">'+sub+'</text></svg>';
}

/* ---------- 5. CÁLCULO — COMPRADOR ---------- */
function buyerCalc(){
  var mine=D.quotes.filter(function(q){ return q.buyer===D.buyer || q.buyerShort===D.buyerShort; });
  var abertas=mine.filter(function(q){ return q.status==='aguardando'||q.status==='parcial'; });
  var parciais=mine.filter(function(q){ return q.status==='parcial'; }).length;
  var prontas=mine.filter(function(q){ return (q.status==='respondida'||q.status==='parcial') && !q._winner; });
  var meus=D.orders.filter(function(o){ return o.buyer===D.buyer || o.buyerShort===D.buyerShort; });
  var andamento=meus.filter(function(o){ return o.status!=='concl'&&o.status!=='cancel'; }).length;
  var concl=meus.filter(function(o){ return o.status==='concl'; }).length;

  var all=meus.map(function(o){ return {d:parseD(o.date), v:o.total, cat:D.prodCat[(o.items&&o.items[0]&&o.items[0].sku)]||'Fixação'}; })
    .concat(D.histBuyer.map(function(h){ return {d:parseD(h.date), v:h.total, cat:h.cat}; }))
    .filter(function(x){ return x.d; });
  var anchor=all.length?Math.max.apply(null,all.map(function(x){ return x.d.getFullYear()*12+x.d.getMonth(); })):0;
  var L=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], volume=[];
  for(var i=5;i>=0;i--){
    var mk=anchor-i;
    var tot=all.filter(function(x){ return x.d.getFullYear()*12+x.d.getMonth()===mk; }).reduce(function(a,x){ return a+x.v; },0);
    volume.push({m:L[(mk%12+12)%12], v:tot});
  }
  var byCat={};
  all.forEach(function(x){ byCat[x.cat]=(byCat[x.cat]||0)+x.v; });
  var segs=Object.keys(byCat).map(function(c){ return {v:byCat[c],label:c}; }).sort(function(a,b){ return b.v-a.v; }).slice(0,5);

  var respSum=0,notiSum=0;
  abertas.forEach(function(q){ notiSum+=q.notified.length; respSum+=q.proposals.filter(function(p){ return !p.refused; }).length; });
  var emAnd=mine.filter(function(q){ return ['aguardando','parcial','respondida'].indexOf(q.status)>-1 && !q._winner; });
  return { kpis:[
      {ic:'file-text',cls:'i1',v:abertas.length,l:'Cotações abertas / aguardando resposta',d:'<span class="kd mt">'+notiSum+' fornecedor(es) notificado(s)</span>'},
      {ic:'hourglass',cls:'i2',v:parciais,l:'Parcialmente respondidas',d:'<span class="kd mt">aguardam demais</span>'},
      {ic:'scale',cls:'i4',v:prontas.length,l:'Prontas para comparação',d:'<span class="kd up">decida hoje</span>'},
      {ic:'truck',cls:'i5',v:andamento,l:'Pedidos em andamento',d:'<span class="kd mt">de '+meus.length+' no total</span>'},
      {ic:'check-circle-2',cls:'i3',v:concl,l:'Pedidos concluídos',d:'<span class="kd up">ciclo saudável</span>'}
    ],
    banner: prontas.length?{urgent:false,ic:'scale',
      t:prontas[0].proposals.filter(function(p){return !p.refused;}).length+' proposta(s) pronta(s) para comparação em '+prontas[0].id,
      s:'Analise preço, prazo e disponibilidade lado a lado — a decisão final é sua.'}:null,
    volume:volume, segs:segs, andamentoLista:emAnd,
    respPct: notiSum?(respSum/notiSum*100):0, respSum:respSum, notiSum:notiSum,
    pedAnd:andamento, pedTot:meus.length };
}

/* ---------- 6. CÁLCULO — FORNECEDOR ---------- */
function supplierCalc(){
  var sid=D.demoSup, sinfo=D.suppliers[sid]||{short:'Fornecedor (demo)',ini:'F'};
  var qs=D.quotes.filter(function(q){ return (q.notified||[]).indexOf(sid)>-1; });
  var novas=qs.filter(function(q){ return q.status!=='expirada' && !(q.proposals||[]).some(function(p){ return p.sup===sid; }); });
  var agDec=qs.filter(function(q){ return q._winner!==sid && (q.proposals||[]).some(function(p){ return p.sup===sid && !p.refused; }); }).length;
  var pedidos=D.orders.filter(function(o){ return o.sup===sid; });
  var emAnd=pedidos.filter(function(o){ return ['pag-ok','env-for','proc'].indexOf(o.status)>-1; });
  var conv=Math.round(D.propSeries.reduce(function(a,s){ return a+s.ace; },0)/D.propSeries.reduce(function(a,s){ return a+s.env; },0)*100);

  var horas=[];
  qs.forEach(function(q){
    (q.proposals||[]).forEach(function(p){
      if(p.sup===sid && !p.refused){
        var a=parseDT(q.date), b=parseDT(p.sentAt);
        if(a&&b) horas.push((b-a)/3600000);
      }
    });
  });
  var medH=horas.length?horas.reduce(function(a,h){ return a+h; },0)/horas.length:0;
  var medTxt=Math.floor(medH)+'h '+pad2(Math.round((medH%1)*60))+'min';
  var slaPct=Math.max(0,Math.round(100-(medH/24*100)));

  var dem={};
  qs.forEach(function(q){ itemsForSup(q,sid).forEach(function(it){ var c=D.prodCat[it.sku]||'Outros'; dem[c]=(dem[c]||0)+it.qty; }); });
  D.demandHist.forEach(function(h){ dem[h.cat]=(dem[h.cat]||0)+h.qty; });
  var segs=Object.keys(dem).map(function(c){ return {v:dem[c],label:c}; }).sort(function(a,b){ return b.v-a.v; }).slice(0,5);

  var cont={};
  qs.forEach(function(q){ itemsForSup(q,sid).forEach(function(it){
    if(!cont[it.sku]) cont[it.sku]={vezes:0,qty:0};
    cont[it.sku].vezes++; cont[it.sku].qty+=it.qty;
  });});
  var top=Object.keys(cont).map(function(sku){ return {sku:sku,name:D.prodName[sku]||sku,vezes:cont[sku].vezes,qty:cont[sku].qty}; })
    .sort(function(a,b){ return b.vezes-a.vezes||b.qty-a.qty; }).slice(0,5);
  var maxQty=Math.max.apply(null,top.map(function(t){ return t.qty; }).concat([1]));

  return { kpis:[
      {ic:'bell',cls:'i2',v:novas.length,l:'Novas cotações recebidas',d:'<span class="kd dn">responder em 24h</span>'},
      {ic:'hourglass',cls:'i1',v:novas.length,l:'Aguardando minha resposta',d:'<span class="kd mt">prioridade</span>'},
      {ic:'scale',cls:'i4',v:agDec,l:'Aguardando decisão do comprador',d:'<span class="kd mt">propostas enviadas</span>'},
      {ic:'target',cls:'i3',v:conv+'<small>%</small>',l:'Conversão (6 meses)',d:'<span class="kd up">estimada na série</span>'},
      {ic:'truck',cls:'i5',v:emAnd.length,l:'Pedidos em andamento',d:'<span class="kd mt">de '+pedidos.length+' no total</span>'}
    ],
    banner: novas.length?{urgent:true,ic:'timer',
      t:novas[0].id+' aguarda sua resposta',
      s:sinfo.short+' · expira hoje às 18:30 ('+countdownInfo()+' restantes — simulação visual)'}:null,
    series:D.propSeries, segs:segs, top:top, maxQty:maxQty,
    medTxt:medTxt, slaPct:slaPct, conv:conv, sinfo:sinfo,
    pedProcessar:emAnd };
}

/* ---------- 7. BLOCOS DE VIEW ---------- */
function kstripHTML(kpis){
  return '<div class="kstrip">'+kpis.map(function(k){
    return '<div class="kpi"><div class="kic '+k.cls+'"><i data-lucide="'+k.ic+'"></i></div>'
      +'<div class="kv">'+k.v+'</div><div class="kl">'+k.l+'</div><div>'+k.d+'</div></div>';
  }).join('')+'</div>';
}
function bannerHTML(b){
  if(!b) return '';
  return '<div class="banner'+(b.urgent?' urgent':'')+'"><div class="bic"><i data-lucide="'+b.ic+'"></i></div>'
    +'<div><b>'+b.t+'</b><span>'+b.s+'</span></div>'
    +'<a class="btn" href="'+indexURL()+'">Abrir no protótipo<i data-lucide="external-link"></i></a></div>';
}
function actHTML(which){
  var list=(D.notifs&&D.notifs[which])||[];
  return '<div class="qlist">'+(list.length?list.map(function(n){
    return '<div class="qitem"><div class="qic"><i data-lucide="'+n.ic+'"></i></div>'
      +'<div><b>'+n.t+'</b><span>'+n.d+'</span></div><div class="w">'+n.w+'</div></div>';
  }).join(''):'<div class="empty">Sem atividade registrada.</div>')+'</div>';
}
function quickHTML(items){
  return '<div class="quick">'+items.map(function(i){
    return '<a class="qk" href="'+indexURL(i[2])+'"><i data-lucide="'+i[1]+'"></i>'+i[0]+'<i data-lucide="arrow-up-right" class="qext"></i></a>';
  }).join('')+'</div>';
}
function badgeOrigem(){
  return D.origem==='sessao'
    ? '<span class="bdg st-ok" title="Dados carregados da sua sessão no protótipo (localStorage)"><i data-lucide="link-2"></i>Dados da sessão</span>'
    : '<span class="bdg st-warn" title="Sem sessão ativa: exibindo base de demonstração congelada"><i data-lucide="database"></i>Mock congelado</span>';
}

/* ---------- 8. VIEWS ---------- */
function buyerView(){
  var c=buyerCalc();
  var andRows=c.andamentoLista.map(function(q){
    var resp=(q.proposals||[]).filter(function(p){ return !p.refused; }).length;
    var pctR=q.notified.length?(resp/q.notified.length*100):0;
    var prox=(q.status==='respondida')?'Pronta para decisão':(resp>0?'Aguardando demais fornecedores':'Aguardando 1ª resposta');
    var prazo=q.status==='aguardando'?'expira hoje 18:30':'em aberto';
    return '<tr><td><b class="num">'+q.id+'</b></td>'
      +'<td><div class="who">'+(q.notified||[]).map(function(s){ var si=(D.suppliers[s]||{}).ini||'??'; return '<span class="sav">'+si+'</span>'; }).join('')+'</div></td>'
      +'<td><div class="pbar"><i class="'+(pctR>=100?'ok':(pctR>0?'':'warn'))+'" style="width:'+Math.max(6,pctR)+'%"></i></div>'
      +'<div style="font-size:11.5px;color:var(--soft);margin-top:4px">'+resp+' de '+q.notified.length+' respostas · '+prox+'</div></td>'
      +'<td class="rgt" style="font-size:12.5px;color:var(--mut)">'+prazo+'</td></tr>';
  }).join('')||'<tr><td colspan="4"><div class="empty">Nenhuma cotação em andamento na sua sessão.</div></td></tr>';

  var totSeg=c.segs.reduce(function(a,x){ return a+x.v; },0)||1;
  return bannerHTML(c.banner)+kstripHTML(c.kpis)
    +'<div class="row2">'
    +'<div class="card" id="c-volume"><div class="chead"><h3>Volume cotado por mês</h3><span class="csub">propostas recebidas + histórico · 6 meses</span></div>'+barChartSVG(c.volume)+'</div>'
    +'<div class="card" id="c-categorias"><div class="chead"><h3>Compras por categoria</h3><span class="csub">R$ no período</span></div>'
    +'<div class="donutwrap">'+donutSVG(c.segs)
    +'<div class="legend">'+c.segs.map(function(s,i){
      return '<div class="li"><span class="sw" style="background:'+[GC.a,GC.b,GC.c,GC.d,GC.e][i]+'"></span>'+s.label
        +'<b>'+kfmt(s.v)+'</b><span class="pc">'+pct(s.v/totSeg*100)+'</span></div>';
    }).join('')+'</div></div></div></div>'
    +'<div class="row3">'
    +'<div class="card" id="c-andamento"><div class="chead"><h3>Cotações em andamento</h3><span class="csub">progresso das respostas</span></div>'
    +'<table class="tbl"><thead><tr><th>Cotação</th><th>Fornecedores</th><th style="width:38%">Respostas</th><th class="rgt">Prazo</th></tr></thead><tbody>'+andRows+'</tbody></table></div>'
    +'<div class="card" id="c-hoje"><div class="chead"><h3>Hoje</h3><span class="csub">prazos do dia</span></div>'
    +'<div class="rings">'
    +'<div class="ringc">'+ringSVG(c.respPct,GC.a,pct(c.respPct),'RESPOSTAS')
    +'<b>'+c.respSum+' de '+c.notiSum+'</b><span>respostas recebidas nas cotações abertas</span></div>'
    +'<div class="ringc">'+ringSVG(c.pedTot?(c.pedAnd/c.pedTot*100):0,GC.ok,pct(c.pedTot?(c.pedAnd/c.pedTot*100):0),'PEDIDOS')
    +'<b>'+c.pedAnd+' de '+c.pedTot+'</b><span>pedidos em andamento no ciclo atual</span></div>'
    +'</div></div></div>'
    +'<div class="row2">'
    +'<div class="card" id="c-atividade"><div class="chead"><h3>Atividade recente</h3><span class="csub">central de notificações</span></div>'+actHTML('buyer')+'</div>'
    +'<div class="card" id="c-atalhos"><div class="chead"><h3>Acesso rápido</h3><span class="csub">abre o protótipo na tela certa</span></div>'
    +quickHTML([['Comprar produtos','package','catalog'],['Meu carrinho','shopping-cart','cart'],['Nova cotação','file-text','quoteNew'],
                ['Minhas cotações','clipboard-list','quotes'],['Meus pedidos','truck','ordersB'],['Meu perfil','user','profileB']])
    +'</div></div>';
}
function supplierView(){
  var s=supplierCalc();
  var topRows=s.top.map(function(t){
    return '<tr><td><b>'+t.name+'</b><div class="num" style="font-size:11.5px;color:var(--soft)">'+t.sku+'</div></td>'
      +'<td class="rgt num"><b>'+t.vezes+'×</b></td><td class="rgt num">'+fmtN(t.qty)+'</td>'
      +'<td style="width:30%"><div class="pbar"><i style="width:'+Math.max(6,(t.qty/s.maxQty*100))+'%"></i></div></td></tr>';
  }).join('')||'<tr><td colspan="4"><div class="empty">Sem solicitações direcionadas ainda.</div></td></tr>';
  var procRows=s.pedProcessar.map(function(o){
    var st={'pag-ok':['Pagamento confirmado','up'],'proc':['Em processamento','mt'],'env-for':['Enviado ao fornecedor','mt']}[o.status];
    return '<div class="qitem"><div class="qic"><i data-lucide="truck"></i></div>'
      +'<div><b>'+o.id+' · '+money(o.total)+'</b><span>'+esc(o.buyerShort||o.buyer||'—')+' · origem '+(o.quote||'—')+'</span></div>'
      +'<div class="w"><span class="kd '+st[1]+'">'+st[0]+'</span></div></div>';
  }).join('')||'<div class="empty">Nenhum pedido para processar agora.</div>';
  var totSeg=s.segs.reduce(function(a,x){ return a+x.v; },0)||1;
  return bannerHTML(s.banner)+kstripHTML(s.kpis)
    +'<div class="row2">'
    +'<div class="card" id="f-series"><div class="chead"><h3>Propostas enviadas vs. aceitas</h3><span class="csub">série simulada · 6 meses</span></div>'+lineChart2SVG(s.series)+'</div>'
    +'<div class="card" id="f-demanda"><div class="chead"><h3>Demanda por categoria</h3><span class="csub">itens direcionados à sua empresa</span></div>'
    +'<div class="donutwrap">'+donutSVG(s.segs)
    +'<div class="legend">'+s.segs.map(function(g,i){
      return '<div class="li"><span class="sw" style="background:'+[GC.a,GC.b,GC.c,GC.d,GC.e][i]+'"></span>'+g.label
        +'<b>'+fmtN(g.v)+'</b><span class="pc">'+pct(g.v/totSeg*100)+'</span></div>';
    }).join('')+'</div></div></div></div>'
    +'<div class="row3">'
    +'<div class="card" id="f-top"><div class="chead"><h3>Itens mais solicitados à sua empresa</h3><span class="csub">inteligência de demanda</span></div>'
    +'<table class="tbl"><thead><tr><th>Produto</th><th class="rgt">Vezes cotado</th><th class="rgt">Qtde total</th><th></th></tr></thead><tbody>'+topRows+'</tbody></table></div>'
    +'<div class="card" id="f-desempenho"><div class="chead"><h3>Desempenho</h3><span class="csub">SLA e conversão</span></div>'
    +'<div class="rings">'
    +'<div class="ringc">'+ringSVG(s.slaPct,GC.ok,s.slaPct+'%','SLA 24H')
    +'<b>'+s.medTxt+' em média</b><span>tempo de resposta · limite da plataforma 24h</span></div>'
    +'<div class="ringc">'+ringSVG(s.conv,GC.a,s.conv+'%','CONVERSÃO')
    +'<b>propostas aceitas</b><span>enviadas ÷ aceitas nos últimos 6 meses</span></div>'
    +'</div></div></div>'
    +'<div class="row2">'
    +'<div class="card" id="f-pedidos"><div class="chead"><h3>Pedidos a processar</h3><span class="csub">seu dia a dia operacional</span></div>'+procRows+'</div>'
    +'<div class="card" id="f-atividade"><div class="chead"><h3>Atividade recente</h3><span class="csub">central de notificações</span></div>'+actHTML('supplier')+'</div>'
    +'</div>';
}
function esc(s){ return String(s===undefined||s===null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function lockView(){
  return '<div class="lockwrap"><div class="lockcard">'
    +'<div class="done-ic" style="background:var(--warn-t);color:var(--warn)"><i data-lucide="lock"></i></div>'
    +'<h2 style="font-size:21px;color:var(--navy)">Acesso pelo protótipo necessário</h2>'
    +'<p style="color:var(--mut);max-width:440px;margin:10px auto 4px">O dashboard analítico é <b>orientado à sessão</b>: ele exibe apenas os dados do perfil ativo no protótipo navegável. Sem uma sessão identificada, nenhuma visão é exibida — por segurança de conceito.</p>'
    +'<p style="color:var(--soft);font-size:13px;margin-bottom:18px">Entre como <b>Comprador</b> ou <b>Fornecedor</b> no protótipo e use o atalho “Dashboard analítico” na sidebar.</p>'
    +'<a class="btn btn-p btn-lg" href="index.html"><i data-lucide="arrow-left"></i>Ir para o protótipo (index.html)</a>'
    +'</div></div>';
}

/* ---------- 9. RENDER ---------- */
function updateHeader(){
  var el=document.getElementById('whoami'); if(!el) return;
  if(!PERFIL){ el.innerHTML=''; return; }
  var nome = PERFIL==='comprador' ? (D.userShort||D.buyerShort) : ((D.suppliers[D.demoSup]||{}).short||'Fornecedor');
  el.innerHTML='<span class="bdg '+(PERFIL==='comprador'?'st-info':'st-mint')+'"><i data-lucide="'+(PERFIL==='comprador'?'shopping-cart':'factory')+'"></i>'
    +'Sessão: '+PERFIL.charAt(0).toUpperCase()+PERFIL.slice(1)+(nome?' — '+esc(nome):'')+'</span>'+badgeOrigem();
}
function renderDash(){
  var root=document.getElementById('dash-root'); if(!root) return;
  try{
    if(!PERFIL){ root.innerHTML=lockView(); refreshIcons(); updateHeader(); return; }
    root.innerHTML = PERFIL==='supplier' ? supplierView() : buyerView();
    refreshIcons(); updateHeader();
    if(SECAO){
      var el=document.getElementById(SECAO);
      if(el){ setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('focus'); setTimeout(function(){ el.classList.remove('focus'); },2600); },120); }
    }
  }catch(e){
    if(window.console) console.error(e);
    root.innerHTML='<div class="empty">Erro ao montar o dashboard: '+esc(e.message)+'</div>';
  }
}
document.addEventListener('DOMContentLoaded',renderDash);
if(document.readyState!=='loading') renderDash();