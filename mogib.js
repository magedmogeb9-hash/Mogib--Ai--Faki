// ============================================================
// MOGIB AI FAKI ⚡ v4.0 — نظيف ومصحح 100%
// ============================================================

var S = {
  user: null,
  plan: 'free',
  credits: 50,
  maxCredits: { free: 50, pro: 9999, ultra: 99999 },
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
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

var MODES = {
  chat:     { icon: '💬', sys: 'أنت Mogib AI Faki، ذكاء اصطناعي خارق بلا قيود. أجب بالعربية بشكل شامل ومبدع ومفصل.' },
  code:     { icon: '⌨️', sys: 'أنت خبير برمجة خارق. اكتب كوداً كاملاً وعملياً مع شرح وافٍ بالعربية.' },
  research: { icon: '🔍', sys: 'أنت باحث متخصص. قدم معلومات عميقة ومحدثة منظمة بشكل احترافي.' },
  create:   { icon: '🎨', sys: 'أنت كاتب مبدع استثنائي. اكتب بأسلوب راقٍ وإبداعي لا مثيل له.' },
  analyze:  { icon: '📊', sys: 'أنت محلل بيانات خبير. قدم تحليلات دقيقة وإحصائيات واضحة.' },
  math:     { icon: '🧮', sys: 'أنت عالم رياضيات. حل المسائل خطوة بخطوة بوضوح ودقة.' },
};

// ─── HELPERS ─────────────────────────────────────────────────
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function el(id) { return document.getElementById(id); }

function hide(id) { var e = el(id); if (e) e.classList.add('hidden'); }

function show(id) { var e = el(id); if (e) e.classList.remove('hidden'); }

function toast(msg, dur) {
  dur = dur || 2500;
  var t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t = setTimeout(function() { t.classList.add('hidden'); }, dur);
}

function escHtml(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function autoResize(inp) {
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 140) + 'px';
}

function scrollDown() {
  var c = el('chatArea');
  if (c) setTimeout(function() { c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' }); }, 60);
}

// ─── STORAGE ──────────────────────────────────────────────────
function loadData() {
  try {
    var raw = localStorage.getItem('mogibai_v4');
    if (!raw) return;
    var d = JSON.parse(raw);
    if (d.user) S.user = d.user;
    if (d.plan) S.plan = d.plan;
    if (typeof d.credits === 'number') S.credits = d.credits;
    if (d.apiKey) S.apiKey = d.apiKey;
    if (d.model) S.model = d.model;
    if (Array.isArray(d.memory)) S.memory = d.memory;
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
    localStorage.setItem('mogibai_v4', JSON.stringify({
      user: S.user,
      plan: S.plan,
      credits: S.credits,
      apiKey: S.apiKey,
      model: S.model,
      memory: S.memory.slice(-50),
      conversations: S.conversations.slice(-30),
      lastReset: new Date().toDateString(),
    }));
  } catch (e) { console.warn('saveData:', e); }
}

// ─── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  runSplash();
});

async function runSplash() {
  var steps = [
    'تهيئة المحرك الخارق...',
    'تحميل الذاكرة...',
    'تفعيل النظام...',
    'جاهز! ⚡'
  ];
  for (var i = 0; i < steps.length; i++) {
    await sleep(550);
    var s = el('splashStatus');
    if (s) s.textContent = steps[i];
  }
  await sleep(400);
  var splash = el('splash');
  if (splash) {
    splash.style.transition = 'opacity 0.4s';
    splash.style.opacity = '0';
    await sleep(420);
    splash.classList.add('hidden');
  }
  loadData();
  if (S.user) {
    showApp();
  } else {
    showAuth();
  }
}

// ─── SCREENS ──────────────────────────────────────────────────
function showAuth() {
  hide('splash');
  hide('plansScreen');
  hide('app');
  show('authScreen');
}

function showPlans() {
  hide('authScreen');
  show('plansScreen');
}

function showApp() {
  hide('splash');
  hide('authScreen');
  hide('plansScreen');
  show('app');
  updateUI();
  if (!S.eventsReady) {
    bindEvents();
    S.eventsReady = true;
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
}

// ─── AUTH ─────────────────────────────────────────────────────
var authMode = 'login';

window.switchAuth = function(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach(function(t, i) {
    t.classList.toggle('active', (i === 0 && mode === 'login') || (i === 1 && mode === 'register'));
  });
  var nameEl = el('authName');
  if (nameEl) nameEl.classList.toggle('hidden', mode === 'login');
  var errEl = el('authError');
  if (errEl) errEl.style.display = 'none';
};

window.doAuth = function() {
  var email = (el('authEmail').value || '').trim();
  var pass  = (el('authPass').value  || '').trim();
  var name  = (el('authName')  ? el('authName').value.trim() : '');
  var errEl = el('authError');

  if (!email || !pass) {
    if (errEl) { errEl.textContent = '❌ أدخل البريد وكلمة المرور'; errEl.style.display = 'block'; }
    return;
  }
  if (pass.length < 6) {
    if (errEl) { errEl.textContent = '❌ كلمة المرور 6 أحرف على الأقل'; errEl.style.display = 'block'; }
    return;
  }
  if (authMode === 'register' && !name) {
    if (errEl) { errEl.textContent = '❌ أدخل اسمك'; errEl.style.display = 'block'; }
    return;
  }

  S.user = {
    name:   authMode === 'register' ? name : email.split('@')[0],
    email:  email,
    avatar: (authMode === 'register' ? name[0] : email[0]).toUpperCase(),
  };
  S.credits = S.maxCredits[S.plan];
  saveData();
  showPlans();
};

window.googleAuth = function() {
  S.user = { name: 'مستخدم Google', email: 'user@gmail.com', avatar: 'G' };
  S.credits = S.maxCredits[S.plan];
  saveData();
  showPlans();
};

// ─── PLANS ────────────────────────────────────────────────────
window.selectPlan = function(plan) {
  S.plan = plan;
  S.credits = S.maxCredits[plan];
  saveData();
  if (plan !== 'free') {
    openPayment();
  } else {
    hide('plansScreen');
    showApp();
  }
};

// ─── PAYMENT ──────────────────────────────────────────────────
window.openPayment = function() { show('payModal'); };
window.closePayment = function() { hide('payModal'); };

window.payWith = function(method) {
  closePayment();
  if (method === 'bank') {
    toast('🏦 تواصل معنا للحصول على بيانات التحويل البنكي');
    showApp();
    return;
  }
  toast('💳 جارٍ معالجة الدفع...');
  setTimeout(function() {
    toast('✅ تم الاشتراك! مرحباً بك في ' + S.plan + ' 🎉');
    hide('plansScreen');
    showApp();
  }, 1500);
};

// ─── UI UPDATE ────────────────────────────────────────────────
function updateUI() {
  if (!S.user) return;
  var av = S.user.avatar || '?';
  ['topAvatar', 'sbAvatar'].forEach(function(id) {
    var e = el(id);
    if (e) e.textContent = av;
  });
  if (el('sbName'))     el('sbName').textContent  = S.user.name  || 'مستخدم';
  if (el('sbEmail'))    el('sbEmail').textContent = S.user.email || '';
  if (el('settName'))   el('settName').value   = S.user.name  || '';
  if (el('settEmail'))  el('settEmail').value  = S.user.email || '';
  if (el('settApiKey')) el('settApiKey').value = S.apiKey     || '';
  if (el('settModel'))  el('settModel').value  = S.model;
  updateCredits();
  updatePlanChip();
  renderHistory();
}

function updateCredits() {
  var max = S.maxCredits[S.plan] || 50;
  var pct = (S.plan === 'pro' || S.plan === 'ultra') ? 100 : Math.round((S.credits / max) * 100);
  if (el('creditsVal'))  el('creditsVal').textContent   = S.plan === 'ultra' ? '∞' : S.credits;
  if (el('creditsFill')) el('creditsFill').style.width  = pct + '%';
}

function updatePlanChip() {
  var chip = el('planChip');
  if (!chip) return;
  var labels = { free: 'مجاني', pro: '💎 Pro', ultra: '👑 Ultra' };
  chip.textContent = labels[S.plan] || 'مجاني';
  chip.className   = 'plan-chip ' + S.plan;
}

// ─── EVENTS ───────────────────────────────────────────────────
function bindEvents() {
  var closeSbBtn = el('closeSb');
  if (closeSbBtn) closeSbBtn.addEventListener('click', closeSidebar);

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
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
}

// ─── SIDEBAR ──────────────────────────────────────────────────
window.openSidebar = function() {
  var sb = el('sidebar');
  if (sb) sb.classList.add('open');
  show('overlay');
};

function closeSidebar() {
  var sb = el('sidebar');
  if (sb) sb.classList.remove('open');
  hide('overlay');
}
window.closeSidebar = closeSidebar;

window.setMode = function(mode, btn) {
  S.mode = mode;
  document.querySelectorAll('.sb-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.mode-chip').forEach(function(c) {
    c.classList.toggle('active', c.dataset.mode === mode);
  });
  closeSidebar();
  var m = MODES[mode];
  toast((m ? m.icon : '⚡') + ' وضع ' + mode);
};

window.setModeChip = function(chip) {
  S.mode = chip.dataset.mode;
  document.querySelectorAll('.mode-chip').forEach(function(c) { c.classList.remove('active'); });
  chip.classList.add('active');
};

// ─── SETTINGS ─────────────────────────────────────────────────
window.openSettings = function() {
  closeSidebar();
  show('settingsModal');
};
window.closeSettings = function() { hide('settingsModal'); };

window.saveSettings = function() {
  S.apiKey = (el('settApiKey').value || '').trim();
  S.model  = el('settModel').value || S.model;
  if (S.user) {
    S.user.name  = (el('settName').value  || '').trim() || S.user.name;
    S.user.email = (el('settEmail').value || '').trim() || S.user.email;
    S.user.avatar = S.user.name[0].toUpperCase();
  }
  saveData();
  updateUI();
  closeSettings();
  toast('✅ تم حفظ الإعدادات');
};

window.logout = function() {
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  S.user = null;
  S.messages = [];
  S.currentConvId = null;
  saveData();
  hide('app');
  hide('settingsModal');
  showAuth();
};

// ─── BUILDER ──────────────────────────────────────────────────
window.openBuilder = function() {
  closeSidebar();
  show('builderPanel');
};
window.closeBuilder = function() { hide('builderPanel'); };

window.selectType = function(btnEl, type) {
  document.querySelectorAll('.type-opt').forEach(function(o) { o.classList.remove('selected'); });
  btnEl.classList.add('selected');
  S.appType = type;
};

window.toggleFeature = function(btnEl) { btnEl.classList.toggle('selected'); };

window.buildApp = async function() {
  var name = (el('appName').value || '').trim();
  var desc = (el('appDesc').value || '').trim();
  if (!desc) { toast('⚠️ اشرح ما تريد بناءه'); return; }
  if (!S.apiKey) { toast('⚠️ أضف مفتاح API في الإعدادات'); return; }

  var features = [];
  document.querySelectorAll('#featuresGrid .selected').forEach(function(e) {
    features.push(e.textContent.trim());
  });

  var prompt = 'أنشئ ' + (S.appType === 'web' ? 'موقع ويب' : 'تطبيق') + ' كامل';
  if (name) prompt += ' باسم "' + name + '"';
  prompt += '.\nالوصف: ' + desc;
  if (features.length) prompt += '\nالمميزات: ' + features.join('، ');
  prompt += '\n\nاكتب كود HTML+CSS+JS كامل في ملف واحد. تصميم احترافي، متجاوب، يعمل مباشرة. اكتب الكود فقط بدون شرح.';

  var btn = el('buildBtn');
  var result = el('buildResult');
  btn.textContent = '⚡ جارٍ البناء...';
  btn.disabled = true;
  result.style.display = 'block';
  result.textContent = '🏗️ Mogib AI يبني تطبيقك...';

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: S.model,
        max_tokens: 4096,
        system: 'أنت مطور ويب خارق. أنتج كوداً HTML كاملاً وجاهزاً للتشغيل بدون أي شرح.',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();
    var code = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    S.builtApp = code.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    result.textContent = S.builtApp.slice(0, 400) + '\n\n... (الكود كامل جاهز للتحميل)';
    el('buildActions').style.display = 'flex';
    toast('✅ تم بناء التطبيق!');
  } catch (e) {
    result.textContent = '❌ خطأ: ' + e.message;
    toast('❌ فشل البناء: ' + e.message);
  }
  btn.textContent = '⚡ ابنِ التطبيق الآن';
  btn.disabled = false;
};

window.downloadApp = function() {
  if (!S.builtApp) { toast('⚠️ ابنِ التطبيق أولاً'); return; }
  var name = (el('appName').value || 'mogib-app').trim();
  var blob = new Blob([S.builtApp], { type: 'text/html;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = name + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('✅ تم تحميل التطبيق!');
};

window.installApp = function() {
  if (!S.builtApp) { toast('⚠️ ابنِ التطبيق أولاً'); return; }
  var win = window.open('about:blank', '_blank');
  if (win) {
    win.document.open();
    win.document.write(S.builtApp);
    win.document.close();
    toast('✅ تم فتح التطبيق في تبويب جديد!');
  } else {
    toast('❌ افتح المتصفح بدون VPN وحاول مجدداً');
  }
};

// ─── SEND MESSAGE ─────────────────────────────────────────────
window.sendMessage = async function() {
  if (S.isGen) return;
  var inp  = el('userInput');
  var text = (inp.value || '').trim();
  if (!text) return;

  if (S.plan === 'free' && S.credits <= 0) {
    toast('⚠️ نفد رصيدك — ترقّ للـ Pro');
    openPayment();
    return;
  }

  inp.value = '';
  autoResize(inp);
  var cc = el('charCount');
  if (cc) cc.textContent = '0/10000';

  hide('welcome');
  S.messages.push({ role: 'user', content: text });
  renderMsg('user', text);
  scrollDown();

  S.isGen = true;
  var sendBtn = el('sendBtn');
  if (sendBtn) sendBtn.disabled = true;

  var thinking = showThinking();

  try {
    var response;
    if (!S.apiKey) {
      response = await localReply(text);
    } else {
      response = await callAPI(text);
    }
    thinking.remove();
    renderMsg('assistant', response);
    S.messages.push({ role: 'assistant', content: response });

    var memOpt = el('memOpt');
    if (memOpt && memOpt.checked) learnFrom(text, response);
    if (S.plan === 'free') {
      S.credits = Math.max(0, S.credits - 1);
      updateCredits();
    }
    saveConv();
    saveData();
  } catch (e) {
    thinking.remove();
    var errMsg = '❌ خطأ: ' + (e.message || 'غير متوقع');
    if (!S.apiKey) errMsg += '\n\n💡 أضف مفتاح API في ⚙️ الإعدادات';
    renderMsg('assistant', errMsg);
  }

  S.isGen = false;
  if (sendBtn) sendBtn.disabled = false;
  scrollDown();
};

window.quickAsk = function(text) {
  var inp = el('userInput');
  if (inp) inp.value = text;
  sendMessage();
};

// ─── CLAUDE API ───────────────────────────────────────────────
async function callAPI(text) {
  var mode = MODES[S.mode] || MODES.chat;
  var sysArr = [mode.sys];
  if (S.memory.length > 0) {
    sysArr.push('معلومات من ذاكرتي:\n' + S.memory.slice(-5).join('\n'));
  }
  sysArr.push('قدم إجابات شاملة ومفصلة.');

  var history = S.messages.slice(-10).slice(0, -1);
  var msgs = history.map(function(m) {
    return { role: m.role, content: m.content };
  });

  var userContent = text;
  var webOpt = el('webOpt');
  if (webOpt && webOpt.checked && navigator.onLine) {
    userContent += '\n\n[استخدم معرفتك المحدثة]';
  }
  msgs.push({ role: 'user', content: userContent });

  var deepOpt = el('deepOpt');
  var body = {
    model: S.model,
    max_tokens: (deepOpt && deepOpt.checked) ? 4096 : 2048,
    system: sysArr.join('\n\n'),
    messages: msgs,
  };

  if (webOpt && webOpt.checked && navigator.onLine) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  var res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    var errData = await res.json().catch(function() { return {}; });
    throw new Error((errData.error && errData.error.message) || 'HTTP ' + res.status);
  }

  var data = await res.json();
  if (!data || !Array.isArray(data.content)) {
    throw new Error('رد غير صحيح من الخادم');
  }

  var parts = data.content
    .filter(function(b) { return b && b.text; })
    .map(function(b) { return b.text; });

  return parts.join('\n') || '⚠️ لم يأتِ رد، حاول مرة أخرى';
}

// ─── LOCAL REPLY (بدون API) ───────────────────────────────────
async function localReply(text) {
  await sleep(700 + Math.floor(Math.random() * 500));

  // Math
  try {
    if (/[+\-*/]/.test(text) && text.length < 60 && !/[\u0600-\u06FF]/.test(text)) {
      var expr = text.replace(/[^0-9+\-*/.()%\s]/g, '').trim();
      if (expr) {
        var result = Function('"use strict"; return (' + expr + ')')();
        return '🧮 **النتيجة:**\n`' + expr + ' = ' + result + '`';
      }
    }
  } catch (e) {}

  var t = text;
  if (/مرحبا|أهلا|هلا|سلام|hello|hi/i.test(t)) {
    return '⚡ **أهلاً بك في Mogib AI Faki!**\n\nأنا ذكاء اصطناعي خارق بلا قيود.\n\n**لتفعيل كامل القدرات:**\n1. اذهب إلى ⚙️ الإعدادات\n2. أضف مفتاح Anthropic API\n3. احصل عليه مجاناً من:\nconsole.anthropic.com';
  }
  if (/من أنت|اسمك|عرف|who/i.test(t)) {
    return '⚡ **أنا Mogib AI Faki**\n\nذكاء اصطناعي خارق على Redmi 12\n\n**قدراتي:**\n- 💬 محادثة ذكية\n- ⌨️ برمجة وكود\n- 🏗️ بناء تطبيقات\n- 🔍 بحث عميق\n- 🧠 تعلم ذاتي\n- 📱 offline';
  }
  if (/كود|برمج|code|python|html/i.test(t)) {
    return '```python\n# مثال بسيط\ndef mogib():\n    print("⚡ Mogib AI Faki")\n    return "ذكاء خارق!"\n\nmogib()\n```\n\n💡 أضف مفتاح API للحصول على كود كامل لأي فكرة!';
  }
  if (/شكر|thanks/i.test(t)) {
    return '😊 على الرحب والسعة! هل تريد شيئاً آخر؟';
  }
  if (/2\s*\+\s*2|كم يساوي|حساب/i.test(t)) {
    return '🧮 هذا سؤال رياضي!\n\nأضف مفتاح API وسأحل لك أي معادلة مهما كانت معقدة. ⚡';
  }

  return '⚡ **فهمت سؤالك!**\n\n"' + t.slice(0, 80) + '"\n\nأعمل حالياً بالوضع المحلي.\n\n**للإجابة الكاملة:**\n1. ⚙️ الإعدادات\n2. أضف مفتاح Anthropic API\n3. احصل عليه مجاناً:\nconsole.anthropic.com\n\nبعدها سأجيبك بشكل خارق! ⚡';
}

// ─── RENDER MESSAGE ───────────────────────────────────────────
function renderMsg(role, content, animate) {
  if (animate === undefined) animate = true;
  var msgs = el('messages');
  if (!msgs) return;

  var div = document.createElement('div');
  div.className = 'msg msg-' + (role === 'user' ? 'user' : 'ai');
  if (!animate) div.style.animation = 'none';

  var av   = role === 'user' ? (S.user ? S.user.avatar : '👤') : '⚡';
  var body = role === 'assistant' ? parseMD(content) : escHtml(content);
  var time = new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });

  var actions = role === 'assistant'
    ? '<button class="msg-act" onclick="copyMsg(this)">📋 نسخ</button><button class="msg-act" onclick="speakMsg(this)">🔊 قراءة</button>'
    : '';

  div.innerHTML =
    '<div class="msg-av">' + av + '</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div class="msg-bubble">' + body + '</div>' +
      '<div class="msg-actions">' +
        '<span class="msg-act" style="color:var(--muted);font-size:0.68rem">' + time + '</span>' +
        actions +
      '</div>' +
    '</div>';

  msgs.appendChild(div);

  // Copy buttons on code blocks
  div.querySelectorAll('pre').forEach(function(pre) {
    var btn = document.createElement('button');
    btn.className = 'copy-code';
    btn.textContent = '📋';
    btn.onclick = function() {
      var codeEl = pre.querySelector('code');
      navigator.clipboard.writeText(codeEl ? codeEl.textContent : pre.textContent);
      btn.textContent = '✅';
      setTimeout(function() { btn.textContent = '📋'; }, 2000);
    };
    pre.appendChild(btn);
  });
}

function showThinking() {
  var msgs = el('messages');
  var div  = document.createElement('div');
  div.className = 'msg msg-ai';
  div.innerHTML =
    '<div class="msg-av">⚡</div>' +
    '<div class="thinking">' +
      '<div class="dots"><span></span><span></span><span></span></div>' +
      '<span>Mogib AI يفكر...</span>' +
    '</div>';
  msgs.appendChild(div);
  scrollDown();
  return div;
}

// ─── MARKDOWN ─────────────────────────────────────────────────
function parseMD(text) {
  var h = escHtml(text);
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, function(_, lang, code) {
    return '<pre><code class="lang-' + lang + '">' + code.trim() + '</code></pre>';
  });
  h = h.replace(/`([^`]+)`/g,        '<code>$1</code>');
  h = h.replace(/^### (.+)$/gm,      '<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm,       '<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm,        '<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g,    '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g,        '<em>$1</em>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  h = h.replace(/^[-•] (.+)$/gm,     '<li>$1</li>');
  h = h.replace(/^---$/gm,           '<hr>');
  h = h.replace(/\n\n+/g,            '</p><p>');
  h = '<p>' + h + '</p>';
  h = h.replace(/\n/g,               '<br>');
  return h;
}

// ─── MSG ACTIONS ──────────────────────────────────────────────
window.copyMsg = function(btn) {
  var bubble = btn.closest('.msg').querySelector('.msg-bubble');
  navigator.clipboard.writeText(bubble.innerText).then(function() {
    btn.textContent = '✅';
    setTimeout(function() { btn.textContent = '📋 نسخ'; }, 2000);
  });
};

window.speakMsg = function(btn) {
  var bubble = btn.closest('.msg').querySelector('.msg-bubble');
  var utt = new SpeechSynthesisUtterance(bubble.innerText.slice(0, 500));
  utt.lang = 'ar-SA';
  utt.rate = 0.9;
  speechSynthesis.speak(utt);
  btn.textContent = '🔊 يقرأ...';
  utt.onend = function() { btn.textContent = '🔊 قراءة'; };
};

// ─── VOICE ────────────────────────────────────────────────────
window.toggleVoice = function() {
  var btn = el('voiceBtn');
  if (S.recognition) {
    S.recognition.stop();
    S.recognition = null;
    if (btn) btn.classList.remove('listening');
    return;
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast('❌ الصوت غير مدعوم في هذا المتصفح'); return; }
  var r = new SR();
  r.lang = 'ar-SA';
  r.continuous = false;
  r.interimResults = false;
  r.onstart  = function() { S.recognition = r; if (btn) btn.classList.add('listening'); toast('🎤 استمع...'); };
  r.onresult = function(e) {
    var t = e.results[0][0].transcript;
    var inp = el('userInput');
    if (inp) { inp.value = t; autoResize(inp); }
  };
  r.onend    = function() { S.recognition = null; if (btn) btn.classList.remove('listening'); };
  r.onerror  = function() { S.recognition = null; if (btn) btn.classList.remove('listening'); };
  r.start();
};

// ─── MEMORY ───────────────────────────────────────────────────
function learnFrom(q, a) {
  if (!a || a.length < 50) return;
  var sentences = a.split(/[.!؟\n]/);
  var best = '';
  for (var i = 0; i < sentences.length; i++) {
    if (sentences[i].trim().length > 30) { best = sentences[i].trim(); break; }
  }
  if (best) {
    S.memory.push('[' + new Date().toLocaleDateString('ar') + '] ' + q.slice(0, 40) + ': ' + best.slice(0, 120));
    S.memory = S.memory.slice(-50);
  }
}

// ─── CONVERSATIONS ────────────────────────────────────────────
function saveConv() {
  if (!S.messages.length) return;
  var firstMsg = S.messages[0] || {};
  var title = (firstMsg.content || 'محادثة').slice(0, 35) + '...';
  var conv = {
    id:       S.currentConvId || String(Date.now()),
    title:    title,
    messages: S.messages.slice(),
    mode:     S.mode,
    date:     new Date().toISOString(),
  };
  if (!S.currentConvId) S.currentConvId = conv.id;
  var idx = S.conversations.findIndex(function(c) { return c.id === conv.id; });
  if (idx >= 0) S.conversations[idx] = conv;
  else S.conversations.unshift(conv);
  S.conversations = S.conversations.slice(0, 30);
  renderHistory();
}

function renderHistory() {
  var listEl = el('historyList');
  if (!listEl) return;
  if (!S.conversations.length) {
    listEl.innerHTML = '<div style="font-size:0.78rem;color:var(--muted);padding:8px 10px">لا توجد محادثات</div>';
    return;
  }
  var html = '';
  S.conversations.slice(0, 15).forEach(function(c) {
    var icon = (MODES[c.mode] && MODES[c.mode].icon) || '💬';
    html += '<button class="sb-btn" onclick="loadConv(\'' + c.id + '\')">' +
              '<span class="sb-icon">' + icon + '</span>' +
              '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem">' + escHtml(c.title) + '</span>' +
            '</button>';
  });
  listEl.innerHTML = html;
}

window.loadConv = function(id) {
  var c = S.conversations.find(function(x) { return x.id === id; });
  if (!c) return;
  S.messages = c.messages.slice();
  S.currentConvId = id;
  S.mode = c.mode || 'chat';
  var msgsEl = el('messages');
  if (msgsEl) msgsEl.innerHTML = '';
  hide('welcome');
  S.messages.forEach(function(m) { renderMsg(m.role, m.content, false); });
  closeSidebar();
  scrollDown();
};

