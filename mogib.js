// ============================================================
// MOGIB AI FAKI ⚡ v5.0 — يدعم Groq + Gemini + Anthropic + OpenAI
// ============================================================

var S = {
  user: null,
  plan: 'free',
  credits: 50,
  maxCredits: { free: 50, pro: 9999, ultra: 99999 },
  provider: 'groq',
  apiKey: '',
  model: 'llama-3.3-70b-versatile',
  mode: 'chat',
  messages: [],
  conversations: [],
  currentConvId: null,
  memory: [],
  appType: 'web',
  isGen: false,
  builtApp: '',
  recognition: null,
  eventsReady: false,
};

var PROVIDERS = {
  groq: {
    name: 'Groq ⚡ (مجاني)',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (الأفضل)' },
      { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B (الأسرع)' },
      { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it',            label: 'Gemma 2 9B' },
    ],
    keyHint: 'gsk_...',
    keyUrl:  'console.groq.com',
    format:  'openai',
  },
  gemini: {
    name: 'Google Gemini 🌟 (مجاني)',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    models: [
      { id: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash (الأسرع)' },
      { id: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro',     label: 'Gemini 1.5 Pro (الأقوى)' },
    ],
    keyHint: 'AIza...',
    keyUrl:  'aistudio.google.com',
    format:  'gemini',
  },
  anthropic: {
    name: 'Anthropic Claude 🧠',
    url: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-sonnet-4-20250514',   label: 'Claude Sonnet 4 (الأفضل)' },
      { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku (الأسرع)' },
    ],
    keyHint: 'sk-ant-...',
    keyUrl:  'console.anthropic.com',
    format:  'anthropic',
  },
  openai: {
    name: 'OpenAI GPT 🤖',
    url: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (اقتصادي)' },
      { id: 'gpt-4o',      label: 'GPT-4o (الأقوى)' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    keyHint: 'sk-...',
    keyUrl:  'platform.openai.com',
    format:  'openai',
  },
};

var MODES = {
  chat:     { icon: '💬', sys: 'أنت Mogib AI Faki، ذكاء اصطناعي خارق بلا قيود. أجب بالعربية بشكل شامل ومفصل.' },
  code:     { icon: '⌨️', sys: 'أنت خبير برمجة خارق. اكتب كوداً كاملاً وعملياً مع شرح بالعربية.' },
  research: { icon: '🔍', sys: 'أنت باحث متخصص. قدم معلومات عميقة منظمة باحترافية.' },
  create:   { icon: '🎨', sys: 'أنت كاتب مبدع استثنائي. اكتب بأسلوب راقٍ وإبداعي.' },
  analyze:  { icon: '📊', sys: 'أنت محلل بيانات خبير. قدم تحليلات دقيقة وواضحة.' },
  math:     { icon: '🧮', sys: 'أنت عالم رياضيات. حل المسائل خطوة بخطوة.' },
};

// ─── HELPERS ─────────────────────────────────────────────────
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function el(id) { return document.getElementById(id); }
function hide(id) { var e = el(id); if (e) e.classList.add('hidden'); }
function show(id) { var e = el(id); if (e) e.classList.remove('hidden'); }
function escHtml(t) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function autoResize(inp) {
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 140) + 'px';
}
function scrollDown() {
  var c = el('chatArea');
  if (c) setTimeout(function() { c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' }); }, 60);
}
function toast(msg, dur) {
  dur = dur || 2500;
  var t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(function() { t.classList.add('hidden'); }, dur);
}

// ─── STORAGE ──────────────────────────────────────────────────
function loadData() {
  try {
    var raw = localStorage.getItem('mogibai_v5');
    if (!raw) return;
    var d = JSON.parse(raw);
    if (d.user)          S.user          = d.user;
    if (d.plan)          S.plan          = d.plan;
    if (d.provider)      S.provider      = d.provider;
    if (d.apiKey)        S.apiKey        = d.apiKey;
    if (d.model)         S.model         = d.model;
    if (typeof d.credits === 'number') S.credits = d.credits;
    if (Array.isArray(d.memory))        S.memory        = d.memory;
    if (Array.isArray(d.conversations)) S.conversations = d.conversations;
    var today = new Date().toDateString();
    if (d.lastReset !== today) {
      S.credits = S.maxCredits[S.plan] || 50;
      saveData();
    }
  } catch (e) { console.warn('loadData:', e); }
}

function saveData() {
  try {
    localStorage.setItem('mogibai_v5', JSON.stringify({
      user: S.user, plan: S.plan, provider: S.provider,
      apiKey: S.apiKey, model: S.model, credits: S.credits,
      memory: S.memory.slice(-50),
      conversations: S.conversations.slice(-30),
      lastReset: new Date().toDateString(),
    }));
  } catch (e) {}
}

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() { runSplash(); });

async function runSplash() {
  var steps = ['تهيئة المحرك الخارق...','تحميل الذاكرة...','تفعيل النظام...','جاهز! ⚡'];
  for (var i = 0; i < steps.length; i++) {
    await sleep(550);
    var s = el('splashStatus');
    if (s) s.textContent = steps[i];
  }
  await sleep(350);
  var splash = el('splash');
  if (splash) {
    splash.style.transition = 'opacity 0.4s';
    splash.style.opacity = '0';
    await sleep(420);
    splash.classList.add('hidden');
  }
  loadData();
  if (S.user) showApp();
  else showAuth();
}

// ─── SCREENS ──────────────────────────────────────────────────
function showAuth() {
  hide('splash'); hide('plansScreen'); hide('app'); hide('settingsModal');
  show('authScreen');
}
function showPlans() {
  hide('authScreen');
  show('plansScreen');
}
function showApp() {
  hide('splash'); hide('authScreen'); hide('plansScreen');
  show('app');
  updateUI();
  if (!S.eventsReady) { bindEvents(); S.eventsReady = true; }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
}

// ─── AUTH ─────────────────────────────────────────────────────
var authMode = 'login';
window.switchAuth = function(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach(function(t, i) {
    t.classList.toggle('active', (i===0&&mode==='login')||(i===1&&mode==='register'));
  });
  var n = el('authName');
  if (n) n.classList.toggle('hidden', mode === 'login');
  var e = el('authError');
  if (e) e.style.display = 'none';
};

window.doAuth = function() {
  var email = (el('authEmail').value||'').trim();
  var pass  = (el('authPass').value||'').trim();
  var name  = el('authName') ? (el('authName').value||'').trim() : '';
  var errEl = el('authError');
  if (!email||!pass) { if(errEl){errEl.textContent='❌ أدخل البريد وكلمة المرور';errEl.style.display='block';} return; }
  if (pass.length<6) { if(errEl){errEl.textContent='❌ كلمة المرور 6 أحرف على الأقل';errEl.style.display='block';} return; }
  if (authMode==='register'&&!name) { if(errEl){errEl.textContent='❌ أدخل اسمك';errEl.style.display='block';} return; }
  S.user = {
    name:   authMode==='register' ? name : email.split('@')[0],
    email:  email,
    avatar: (authMode==='register' ? name[0] : email[0]).toUpperCase(),
  };
  S.credits = S.maxCredits[S.plan];
  saveData();
  showPlans();
};

window.googleAuth = function() {
  S.user = { name:'مستخدم Google', email:'user@gmail.com', avatar:'G' };
  S.credits = S.maxCredits[S.plan];
  saveData();
  showPlans();
};

// ─── PLANS ────────────────────────────────────────────────────
window.selectPlan = function(plan) {
  S.plan = plan;
  S.credits = S.maxCredits[plan];
  saveData();
  if (plan !== 'free') { openPayment(); return; }
  hide('plansScreen');
  showApp();
};

window.openPayment  = function() { show('payModal'); };
window.closePayment = function() { hide('payModal'); };
window.payWith = function(method) {
  closePayment();
  if (method === 'bank') { toast('🏦 تواصل معنا للتحويل البنكي'); showApp(); return; }
  toast('💳 جارٍ معالجة الدفع...');
  setTimeout(function() {
    toast('✅ تم الاشتراك! مرحباً في ' + S.plan + ' 🎉');
    hide('plansScreen');
    showApp();
  }, 1500);
};

// ─── UI ───────────────────────────────────────────────────────
function updateUI() {
  if (!S.user) return;
  var av = S.user.avatar || '?';
  ['topAvatar','sbAvatar'].forEach(function(id){ var e=el(id); if(e) e.textContent=av; });
  if (el('sbName'))    el('sbName').textContent  = S.user.name  || 'مستخدم';
  if (el('sbEmail'))   el('sbEmail').textContent = S.user.email || '';
  if (el('settName'))  el('settName').value  = S.user.name  || '';
  if (el('settEmail')) el('settEmail').value = S.user.email || '';
  if (el('settApiKey')) el('settApiKey').value = S.apiKey || '';
  updateProviderUI();
  updateCredits();
  updatePlanChip();
  renderHistory();
}

function updateProviderUI() {
  var prov = PROVIDERS[S.provider] || PROVIDERS.groq;
  // Update provider selector
  var sel = el('providerSelect');
  if (sel) sel.value = S.provider;
  // Update model selector
  var msel = el('modelSelect');
  if (msel) {
    msel.innerHTML = prov.models.map(function(m) {
      return '<option value="' + m.id + '">' + m.label + '</option>';
    }).join('');
    msel.value = S.model;
    if (!msel.value) { msel.selectedIndex = 0; S.model = msel.value; }
  }
  // Update key hint
  var hint = el('apiKeyHint');
  if (hint) hint.textContent = 'احصل على مفتاح مجاني: ' + prov.keyUrl;
  var inp = el('settApiKey');
  if (inp) inp.placeholder = prov.keyHint;
}

function updateCredits() {
  var max = S.maxCredits[S.plan] || 50;
  var pct = (S.plan==='pro'||S.plan==='ultra') ? 100 : Math.round((S.credits/max)*100);
  if (el('creditsVal'))  el('creditsVal').textContent  = S.plan==='ultra' ? '∞' : S.credits;
  if (el('creditsFill')) el('creditsFill').style.width = pct + '%';
}

function updatePlanChip() {
  var chip = el('planChip');
  if (!chip) return;
  var labels = { free:'مجاني', pro:'💎 Pro', ultra:'👑 Ultra' };
  chip.textContent = labels[S.plan] || 'مجاني';
  chip.className   = 'plan-chip ' + S.plan;
}

// ─── EVENTS ───────────────────────────────────────────────────
function bindEvents() {
  var csb = el('closeSb');
  if (csb) csb.addEventListener('click', closeSidebar);
  var ovr = el('overlay');
  if (ovr) ovr.addEventListener('click', closeSidebar);
  var inp = el('userInput');
  if (inp) {
    inp.addEventListener('input', function() {
      autoResize(inp);
      var cc = el('charCount');
      if (cc) cc.textContent = inp.value.length + '/10000';
    });
    inp.addEventListener('keydown', function(e) {
      if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }
  // Provider change
  var psel = el('providerSelect');
  if (psel) psel.addEventListener('change', function() {
    S.provider = this.value;
    var prov = PROVIDERS[S.provider] || PROVIDERS.groq;
    S.model = prov.models[0].id;
    updateProviderUI();
  });
  // Model change
  var msel = el('modelSelect');
  if (msel) msel.addEventListener('change', function() { S.model = this.value; });
}

// ─── SIDEBAR ──────────────────────────────────────────────────
window.openSidebar = function() { var sb=el('sidebar'); if(sb) sb.classList.add('open'); show('overlay'); };
function closeSidebar() { var sb=el('sidebar'); if(sb) sb.classList.remove('open'); hide('overlay'); }
window.closeSidebar = closeSidebar;

window.setMode = function(mode, btn) {
  S.mode = mode;
  document.querySelectorAll('.sb-btn').forEach(function(b){ b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.mode-chip').forEach(function(c){ c.classList.toggle('active', c.dataset.mode===mode); });
  closeSidebar();
  var m = MODES[mode];
  toast((m?m.icon:'⚡') + ' وضع ' + mode);
};
window.setModeChip = function(chip) {
  S.mode = chip.dataset.mode;
  document.querySelectorAll('.mode-chip').forEach(function(c){ c.classList.remove('active'); });
  chip.classList.add('active');
};

// ─── SETTINGS ─────────────────────────────────────────────────
window.openSettings = function() { closeSidebar(); show('settingsModal'); };
window.closeSettings = function() { hide('settingsModal'); };
window.saveSettings = function() {
  S.provider = (el('providerSelect') ? el('providerSelect').value : S.provider);
  S.apiKey   = (el('settApiKey').value||'').trim();
  S.model    = el('modelSelect') ? el('modelSelect').value : S.model;
  if (S.user) {
    S.user.name  = (el('settName').value||'').trim()  || S.user.name;
    S.user.email = (el('settEmail').value||'').trim() || S.user.email;
    S.user.avatar = S.user.name[0].toUpperCase();
  }
  saveData(); updateUI(); closeSettings();
  toast('✅ تم الحفظ — المزود: ' + (PROVIDERS[S.provider]||{name:S.provider}).name);
};
window.logout = function() {
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  S.user=null; S.messages=[]; S.currentConvId=null;
  saveData(); hide('app'); hide('settingsModal'); showAuth();
};

// ─── BUILDER ──────────────────────────────────────────────────
window.openBuilder  = function() { closeSidebar(); show('builderPanel'); };
window.closeBuilder = function() { hide('builderPanel'); };
window.selectType   = function(b, t) {
  document.querySelectorAll('.type-opt').forEach(function(o){ o.classList.remove('selected'); });
  b.classList.add('selected'); S.appType = t;
};
window.toggleFeature = function(b) { b.classList.toggle('selected'); };

window.buildApp = async function() {
  var name = (el('appName').value||'').trim();
  var desc = (el('appDesc').value||'').trim();
  if (!desc) { toast('⚠️ اشرح ما تريد بناءه'); return; }
  if (!S.apiKey) { toast('⚠️ أضف مفتاح API في الإعدادات'); return; }
  var feats = [];
  document.querySelectorAll('#featuresGrid .selected').forEach(function(e){ feats.push(e.textContent.trim()); });
  var prompt = 'أنشئ ' + (S.appType==='web'?'موقع ويب':'تطبيق') + ' كامل';
  if (name) prompt += ' باسم "' + name + '"';
  prompt += '.\nالوصف: ' + desc;
  if (feats.length) prompt += '\nالمميزات: ' + feats.join('، ');
  prompt += '\n\nاكتب كود HTML+CSS+JS كامل في ملف واحد. تصميم احترافي متجاوب. اكتب الكود فقط.';
  var btn = el('buildBtn');
  var res = el('buildResult');
  btn.textContent='⚡ جارٍ البناء...'; btn.disabled=true;
  res.style.display='block'; res.textContent='🏗️ Mogib AI يبني تطبيقك...';
  try {
    var code = await callAI(prompt, 'أنت مطور ويب خارق. أنتج كوداً HTML كاملاً جاهزاً بدون شرح.', 4096);
    S.builtApp = code.replace(/```html\n?/g,'').replace(/```\n?/g,'').trim();
    res.textContent = S.builtApp.slice(0,400) + '\n...(الكود كامل جاهز)';
    el('buildActions').style.display='flex';
    toast('✅ تم بناء التطبيق!');
  } catch(e) { res.textContent='❌ خطأ: '+e.message; toast('❌ '+e.message); }
  btn.textContent='⚡ ابنِ التطبيق الآن'; btn.disabled=false;
};

window.downloadApp = function() {
  if (!S.builtApp) { toast('⚠️ ابنِ أولاً'); return; }
  var name = (el('appName').value||'mogib-app').trim();
  var blob = new Blob([S.builtApp], {type:'text/html;charset=utf-8'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href=url; a.download=name+'.html';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url); toast('✅ تم تحميل التطبيق!');
};
window.installApp = function() {
  if (!S.builtApp) { toast('⚠️ ابنِ أولاً'); return; }
  var win = window.open('about:blank','_blank');
  if (win) { win.document.open(); win.document.write(S.builtApp); win.document.close(); toast('✅ فُتح في تبويب جديد!'); }
  else toast('❌ افتح بدون VPN وحاول مجدداً');
};

// ─── SEND ─────────────────────────────────────────────────────
window.sendMessage = async function() {
  if (S.isGen) return;
  var inp  = el('userInput');
  var text = (inp.value||'').trim();
  if (!text) return;
  if (S.plan==='free' && S.credits<=0) { toast('⚠️ نفد رصيدك — ترقّ للـ Pro'); openPayment(); return; }
  inp.value=''; autoResize(inp);
  var cc=el('charCount'); if(cc) cc.textContent='0/10000';
  hide('welcome');
  S.messages.push({role:'user', content:text});
  renderMsg('user', text);
  scrollDown();
  S.isGen=true;
  var sb=el('sendBtn'); if(sb) sb.disabled=true;
  var thinking=showThinking();
  try {
    var mode = MODES[S.mode] || MODES.chat;
    var sys  = mode.sys;
    if (S.memory.length) sys += '\n\nمن ذاكرتي:\n' + S.memory.slice(-5).join('\n');
    var deepOpt=el('deepOpt');
    var response = await callAI(text, sys, (deepOpt&&deepOpt.checked)?4096:2048);
    thinking.remove();
    renderMsg('assistant', response);
    S.messages.push({role:'assistant', content:response});
    var memOpt=el('memOpt'); if(memOpt&&memOpt.checked) learnFrom(text, response);
    if (S.plan==='free') { S.credits=Math.max(0,S.credits-1); updateCredits(); }
    saveConv(); saveData();
  } catch(e) {
    thinking.remove();
    var em='❌ خطأ: '+(e.message||'غير متوقع');
    if (!S.apiKey) em+='\n\n💡 أضف مفتاح API في ⚙️ الإعدادات';
    renderMsg('assistant', em);
  }
  S.isGen=false;
  var sb2=el('sendBtn'); if(sb2) sb2.disabled=false;
  scrollDown();
};
window.quickAsk = function(text) { var i=el('userInput'); if(i) i.value=text; sendMessage(); };

// ─── AI CALLER — يدعم كل المزودين ────────────────────────────
async function callAI(userText, systemPrompt, maxTokens) {
  maxTokens = maxTokens || 2048;
  var prov = PROVIDERS[S.provider] || PROVIDERS.groq;

  // ── Groq & OpenAI (OpenAI format) ──────────────────────────
  if (prov.format === 'openai') {
    var msgs = [{ role:'system', content: systemPrompt }];
    var hist = S.messages.slice(-8).slice(0,-1);
    hist.forEach(function(m){ msgs.push({role:m.role, content:m.content}); });
    msgs.push({role:'user', content:userText});
    var res = await fetch(prov.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + S.apiKey,
      },
      body: JSON.stringify({ model:S.model, messages:msgs, max_tokens:maxTokens }),
    });
    if (!res.ok) {
      var e = await res.json().catch(function(){return{};});
      throw new Error((e.error&&e.error.message)||'HTTP '+res.status);
    }
    var data = await res.json();
    return data.choices[0].message.content || '⚠️ لم يأتِ رد';
  }

  // ── Gemini ─────────────────────────────────────────────────
  if (prov.format === 'gemini') {
    var url = prov.url.replace('{model}', S.model) + '?key=' + S.apiKey;
    var parts = [];
    var hist2 = S.messages.slice(-8).slice(0,-1);
    hist2.forEach(function(m){
      parts.push({ role: m.role==='assistant'?'model':'user', parts:[{text:m.content}] });
    });
    parts.push({ role:'user', parts:[{text: systemPrompt+'\n\n'+userText}] });
    var res2 = await fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ contents: parts, generationConfig:{maxOutputTokens:maxTokens} }),
    });
    if (!res2.ok) {
      var e2 = await res2.json().catch(function(){return{};});
      throw new Error((e2.error&&e2.error.message)||'HTTP '+res2.status);
    }
    var data2 = await res2.json();
    return data2.candidates[0].content.parts[0].text || '⚠️ لم يأتِ رد';
  }

  // ── Anthropic ──────────────────────────────────────────────
  if (prov.format === 'anthropic') {
    var hist3 = S.messages.slice(-8).slice(0,-1);
    var msgs3 = hist3.map(function(m){return{role:m.role,content:m.content};});
    msgs3.push({role:'user',content:userText});
    var body = { model:S.model, max_tokens:maxTokens, system:systemPrompt, messages:msgs3 };
    var webOpt=el('webOpt');
    if (webOpt&&webOpt.checked&&navigator.onLine) body.tools=[{type:'web_search_20250305',name:'web_search'}];
    var res3 = await fetch(prov.url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body),
    });
    if (!res3.ok) {
      var e3 = await res3.json().catch(function(){return{};});
      throw new Error((e3.error&&e3.error.message)||'HTTP '+res3.status);
    }
    var data3 = await res3.json();
    if (!data3||!Array.isArray(data3.content)) throw new Error('رد غير صحيح');
    return data3.content.filter(function(b){return b&&b.text;}).map(function(b){return b.text;}).join('\n')||'⚠️ لم يأتِ رد';
  }

  throw new Error('مزود غير معروف: ' + S.provider);
}

// ─── LOCAL REPLY (بدون مفتاح) ────────────────────────────────
async function localReply(text) {
  await sleep(700 + Math.floor(Math.random()*500));
  try {
    if (/[+\-*/]/.test(text)&&text.length<60&&!/[\u0600-\u06FF]/.test(text)) {
      var expr=text.replace(/[^0-9+\-*/.()%\s]/g,'').trim();
      if (expr) { var r=Function('"use strict";return('+expr+')')(); return '🧮 **النتيجة:**\n`'+expr+' = '+r+'`'; }
    }
  } catch(e){}
  if (/مرحبا|أهلا|هلا|سلام|hello|hi/i.test(text))
    return '⚡ **أهلاً في Mogib AI Faki!**\n\n**لتفعيل كامل القدرات أضف مفتاحاً مجانياً:**\n\n🥇 **Groq (الأفضل مجاناً):**\nconsole.groq.com\n\n🌟 **Google Gemini:**\naistudio.google.com\n\nاذهب لـ ⚙️ الإعدادات وأضف المفتاح!';
  if (/من أنت|اسمك|who/i.test(text))
    return '⚡ **أنا Mogib AI Faki**\n\nيدعم:\n- 🟠 Groq (مجاني)\n- 🌟 Gemini (مجاني)\n- 🧠 Anthropic Claude\n- 🤖 OpenAI GPT';
  if (/كود|برمج|code/i.test(text))
    return '```python\ndef mogib():\n    print("⚡ Mogib AI Faki")\nmogib()\n```\n\n💡 أضف مفتاح Groq المجاني للكود الكامل!';
  return '⚡ أعمل بالوضع المحلي.\n\n**أضف مفتاحاً مجانياً:**\n🥇 Groq: console.groq.com\n🌟 Gemini: aistudio.google.com\n\nثم اذهب لـ ⚙️ الإعدادات ⚡';
}

// ─── RENDER ───────────────────────────────────────────────────
function renderMsg(role, content, animate) {
  if (animate===undefined) animate=true;
  var msgs=el('messages'); if(!msgs) return;
  var div=document.createElement('div');
  div.className='msg msg-'+(role==='user'?'user':'ai');
  if (!animate) div.style.animation='none';
  var av   = role==='user' ? (S.user?S.user.avatar:'👤') : '⚡';
  var body = role==='assistant' ? parseMD(content) : escHtml(content);
  var time = new Date().toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
  var acts = role==='assistant'
    ? '<button class="msg-act" onclick="copyMsg(this)">📋 نسخ</button><button class="msg-act" onclick="speakMsg(this)">🔊 قراءة</button>'
    : '';
  div.innerHTML=
    '<div class="msg-av">'+av+'</div>'+
    '<div style="flex:1;min-width:0">'+
      '<div class="msg-bubble">'+body+'</div>'+
      '<div class="msg-actions">'+
        '<span class="msg-act" style="color:var(--muted);font-size:0.68rem">'+time+'</span>'+acts+
      '</div>'+
    '</div>';
  msgs.appendChild(div);
  div.querySelectorAll('pre').forEach(function(pre){
    var btn=document.createElement('button');
    btn.className='copy-code'; btn.textContent='📋';
    btn.onclick=function(){
      var c=pre.querySelector('code');
      navigator.clipboard.writeText(c?c.textContent:pre.textContent);
      btn.textContent='✅'; setTimeout(function(){btn.textContent='📋';},2000);
    };
    pre.appendChild(btn);
  });
}

function showThinking() {
  var msgs=el('messages');
  var div=document.createElement('div');
  div.className='msg msg-ai';
  var prov=PROVIDERS[S.provider]||PROVIDERS.groq;
  div.innerHTML='<div class="msg-av">⚡</div><div class="thinking"><div class="dots"><span></span><span></span><span></span></div><span>'+prov.name+' يفكر...</span></div>';
  msgs.appendChild(div); scrollDown(); return div;
}

function parseMD(text) {
  var h=escHtml(text);
  h=h.replace(/```(\w*)\n?([\s\S]*?)```/g,function(_,l,c){return '<pre><code class="lang-'+l+'">'+c.trim()+'</code></pre>';});
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
  h=h.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  h=h.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  h=h.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  h=h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h=h.replace(/\*(.+?)\*/g,'<em>$1</em>');
  h=h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  h=h.replace(/^[-•] (.+)$/gm,'<li>$1</li>');
  h=h.replace(/^---$/gm,'<hr>');
  h=h.replace(/\n\n+/g,'</p><p>');
  h='<p>'+h+'</p>';
  h=h.replace(/\n/g,'<br>');
  return h;
}

window.copyMsg=function(btn){
  var b=btn.closest('.msg').querySelector('.msg-bubble');
  navigator.clipboard.writeText(b.innerText).then(function(){btn.textContent='✅';setTimeout(function(){btn.textContent='📋 نسخ';},2000);});
};
window.speakMsg=function(btn){
  var b=btn.closest('.msg').querySelector('.msg-bubble');
  var u=new SpeechSynthesisUtterance(b.innerText.slice(0,500));
  u.lang='ar-SA'; u.rate=0.9; speechSynthesis.speak(u);
  btn.textContent='🔊 يقرأ...'; u.onend=function(){btn.textContent='🔊 قراءة';};
};
window.toggleVoice=function(){
  var btn=el('voiceBtn');
  if(S.recognition){S.recognition.stop();S.recognition=null;if(btn)btn.classList.remove('listening');return;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('❌ الصوت غير مدعوم');return;}
  var r=new SR(); r.lang='ar-SA'; r.continuous=false; r.interimResults=false;
  r.onstart=function(){S.recognition=r;if(btn)btn.classList.add('listening');toast('🎤 استمع...');};
  r.onresult=function(e){var t=e.results[0][0].transcript;var i=el('userInput');if(i){i.value=t;autoResize(i);}};
  r.onend=function(){S.recognition=null;if(btn)btn.classList.remove('listening');};
  r.onerror=function(){S.recognition=null;if(btn)btn.classList.remove('listening');};
  r.start();
};

function learnFrom(q,a){
  if(!a||a.length<50) return;
  var s=a.split(/[.!؟\n]/);
  var best='';
  for(var i=0;i<s.length;i++){if(s[i].trim().length>30){best=s[i].trim();break;}}
  if(best){S.memory.push('['+new Date().toLocaleDateString('ar')+'] '+q.slice(0,40)+': '+best.slice(0,120));S.memory=S.memory.slice(-50);}
}

function saveConv(){
  if(!S.messages.length) return;
  var title=(S.messages[0].content||'محادثة').slice(0,35)+'...';
  var conv={id:S.currentConvId||String(Date.now()),title:title,messages:S.messages.slice(),mode:S.mode,date:new Date().toISOString()};
  if(!S.currentConvId) S.currentConvId=conv.id;
  var idx=S.conversations.findIndex(function(c){return c.id===conv.id;});
  if(idx>=0) S.conversations[idx]=conv; else S.conversations.unshift(conv);
  S.conversations=S.conversations.slice(0,30);
  renderHistory();
}
function renderHistory(){
  var listEl=el('historyList'); if(!listEl) return;
  if(!S.conversations.length){listEl.innerHTML='<div style="font-size:0.78rem;color:var(--muted);padding:8px 10px">لا توجد محادثات</div>';return;}
  var html='';
  S.conversations.slice(0,15).forEach(function(c){
    var icon=(MODES[c.mode]&&MODES[c.mode].icon)||'💬';
    html+='<button class="sb-btn" onclick="loadConv(\''+c.id+'\')"><span class="sb-icon">'+icon+'</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem">'+escHtml(c.title)+'</span></button>';
  });
  listEl.innerHTML=html;
}
window.loadConv=function(id){
  var c=S.conversations.find(function(x){return x.id===id;});
  if(!c) return;
  S.messages=c.messages.slice(); S.currentConvId=id; S.mode=c.mode||'chat';
  var m=el('messages'); if(m) m.innerHTML='';
  hide('welcome');
  S.messages.forEach(function(msg){renderMsg(msg.role,msg.content,false);});
  closeSidebar(); scrollDown();
};
