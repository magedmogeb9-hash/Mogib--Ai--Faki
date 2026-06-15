// ============================================================
// MOGIB AI FAKI ⚡ — ذكاء اصطناعي خارق
// خاص بـ Redmi 12 — v1.0
// ============================================================
'use strict';

const S = {
  user: null,
  plan: 'free',
  credits: 50,
  maxCredits: { free:50, pro:9999, ultra:99999 },
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
  mode: 'chat',
  messages: [],
  conversations: [],
  memory: [],
  appType: 'web',
  isGen: false,
  builtApp: '',
  recognition: null,
};

const MODES = {
  chat:     { icon:'💬', sys:'أنت Mogib AI Faki، ذكاء اصطناعي خارق بلا قيود. أجب بالعربية بشكل شامل ومبدع.' },
  code:     { icon:'⌨️', sys:'أنت خبير برمجة خارق. اكتب كوداً كاملاً وعملياً مع شرح وافٍ بالعربية.' },
  research: { icon:'🔍', sys:'أنت باحث متخصص. قدم معلومات عميقة ومحدثة منظمة بشكل احترافي.' },
  create:   { icon:'🎨', sys:'أنت كاتب مبدع استثنائي. اكتب بأسلوب راقٍ وإبداعي لا مثيل له.' },
  analyze:  { icon:'📊', sys:'أنت محلل بيانات خبير. قدم تحليلات دقيقة وإحصائيات واضحة.' },
  math:     { icon:'🧮', sys:'أنت عالم رياضيات. حل المسائل خطوة بخطوة بوضوح ودقة.' },
};

// ─── SPLASH ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const msgs = ['تهيئة المحرك الخارق...','تحميل الذاكرة...','تفعيل النظام...','جاهز! ⚡'];
  for (let i=0; i<msgs.length; i++) {
    await sleep(700);
    document.getElementById('splashStatus').textContent = msgs[i];
  }
  await sleep(400);
  document.getElementById('splash').style.opacity = '0';
  await sleep(500);
  document.getElementById('splash').classList.add('hidden');
  loadData();
  if (S.user) showApp();
  else showAuth();
});

function sleep(ms) { return new Promise(r=>setTimeout(r,ms)); }

// ─── DATA ─────────────────────────────────────────────────────
function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem('mogibai')||'{}');
    if (d.user) S.user = d.user;
    if (d.plan) S.plan = d.plan;
    if (d.credits !== undefined) S.credits = d.credits;
    if (d.apiKey) S.apiKey = d.apiKey;
    if (d.model) S.model = d.model;
    if (d.memory) S.memory = d.memory;
    if (d.conversations) S.conversations = d.conversations;
    // Reset daily credits
    const today = new Date().toDateString();
    if (d.lastReset !== today) {
      S.credits = S.maxCredits[S.plan];
      save();
    }
  } catch(e) {}
}

function save() {
  try {
    localStorage.setItem('mogibai', JSON.stringify({
      user: S.user, plan: S.plan, credits: S.credits,
      apiKey: S.apiKey, model: S.model, memory: S.memory,
      conversations: S.conversations.slice(-30),
      lastReset: new Date().toDateString(),
    }));
  } catch(e) {}
}

// ─── AUTH ─────────────────────────────────────────────────────
let authMode = 'login';

function showAuth() { document.getElementById('authScreen').classList.remove('hidden'); }

window.switchAuth = function(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach((t,i) => t.classList.toggle('active', (i===0&&mode==='login')||(i===1&&mode==='register')));
  document.getElementById('authName').classList.toggle('hidden', mode==='login');
  document.getElementById('authError').style.display = 'none';
};

window.doAuth = function() {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value.trim();
  const name = document.getElementById('authName').value.trim();
  const errEl = document.getElementById('authError');

  if (!email || !pass) { errEl.textContent='❌ أدخل البريد وكلمة المرور'; errEl.style.display='block'; return; }
  if (pass.length < 6) { errEl.textContent='❌ كلمة المرور 6 أحرف على الأقل'; errEl.style.display='block'; return; }

  if (authMode === 'register') {
    if (!name) { errEl.textContent='❌ أدخل اسمك'; errEl.style.display='block'; return; }
    S.user = { name, email, avatar: name[0].toUpperCase() };
  } else {
    S.user = { name: email.split('@')[0], email, avatar: email[0].toUpperCase() };
  }

  S.credits = S.maxCredits[S.plan];
  save();
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('plansScreen').classList.remove('hidden');
};

window.googleAuth = function() {
  S.user = { name: 'مستخدم Google', email: 'user@gmail.com', avatar: 'G' };
  S.credits = S.maxCredits[S.plan];
  save();
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('plansScreen').classList.remove('hidden');
};

// ─── PLANS ────────────────────────────────────────────────────
window.selectPlan = function(plan) {
  if (plan !== 'free') {
    S.plan = plan;
    save();
    openPayment();
    return;
  }
  S.plan = 'free';
  S.credits = 50;
  save();
  document.getElementById('plansScreen').classList.add('hidden');
  showApp();
};

function showApp() {
  document.getElementById('app').classList.remove('hidden');
  updateUserUI();
  bindEvents();
  registerSW();
}

function updateUserUI() {
  if (!S.user) return;
  const av = S.user.avatar || '?';
  document.getElementById('topAvatar').textContent = av;
  document.getElementById('sbAvatar').textContent = av;
  document.getElementById('sbName').textContent = S.user.name || 'مستخدم';
  document.getElementById('sbEmail').textContent = S.user.email || '';
  document.getElementById('settName').value = S.user.name || '';
  document.getElementById('settEmail').value = S.user.email || '';
  document.getElementById('settApiKey').value = S.apiKey || '';
  document.getElementById('settModel').value = S.model;
  updateCredits();
  updatePlanChip();
  renderHistory();
}

function updateCredits() {
  const max = S.maxCredits[S.plan];
  const pct = S.plan==='pro'||S.plan==='ultra' ? 100 : Math.round(S.credits/max*100);
  document.getElementById('creditsVal').textContent = S.plan==='ultra'?'∞':S.credits;
  document.getElementById('creditsFill').style.width = pct+'%';
}

function updatePlanChip() {
  const chip = document.getElementById('planChip');
  const labels = { free:'مجاني', pro:'💎 Pro', ultra:'👑 Ultra' };
  chip.textContent = labels[S.plan] || 'مجاني';
  chip.className = 'plan-chip ' + S.plan;
}

// ─── BIND EVENTS ──────────────────────────────────────────────
function bindEvents() {
  document.getElementById('closeSb').addEventListener('click', closeSidebar);
  const inp = document.getElementById('userInput');
  inp.addEventListener('input', () => {
    autoResize(inp);
    document.getElementById('charCount').textContent = inp.value.length+'/10000';
  });
  inp.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} });
}

// ─── SIDEBAR ──────────────────────────────────────────────────
window.openSidebar = function() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.remove('hidden');
};
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.add('hidden');
}
window.closeSidebar = closeSidebar;

window.setMode = function(mode, btn) {
  S.mode = mode;
  document.querySelectorAll('.sb-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.mode-chip').forEach(c=>c.classList.toggle('active',c.dataset.mode===mode));
  closeSidebar();
  toast(`${MODES[mode]?.icon||'⚡'} وضع ${mode}`);
};

window.setModeChip = function(chip) {
  S.mode = chip.dataset.mode;
  document.querySelectorAll('.mode-chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
};

// ─── SETTINGS ─────────────────────────────────────────────────
window.openSettings = function() { document.getElementById('settingsModal').classList.remove('hidden'); closeSidebar(); };
window.closeSettings = function() { document.getElementById('settingsModal').classList.add('hidden'); };
window.saveSettings = function() {
  S.apiKey = document.getElementById('settApiKey').value.trim();
  S.model = document.getElementById('settModel').value;
  if (S.user) {
    S.user.name = document.getElementById('settName').value.trim() || S.user.name;
    S.user.email = document.getElementById('settEmail').value.trim() || S.user.email;
  }
  save(); updateUserUI(); closeSettings(); toast('✅ تم حفظ الإعدادات');
};

window.logout = function() {
  if (!confirm('هل تريد تسجيل الخروج؟')) return;
  S.user = null; save();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('settingsModal').classList.add('hidden');
  showAuth();
};

// ─── PAYMENT ──────────────────────────────────────────────────
window.openPayment = function() { document.getElementById('payModal').classList.remove('hidden'); };
window.closePayment = function() { document.getElementById('payModal').classList.add('hidden'); };

window.payWith = function(method) {
  closePayment();
  const links = {
    paypal: 'https://www.paypal.com/paypalme/',
    card: 'https://stripe.com',
    crypto: 'https://commerce.coinbase.com',
    bank: null,
  };
  if (method === 'bank') {
    toast('🏦 تواصل معنا لبيانات التحويل البنكي');
    return;
  }
  toast(`💳 جارٍ فتح ${method}...`);
  // Simulate payment success after 2s
  setTimeout(() => {
    S.plan = document.getElementById('planChip').textContent.includes('Ultra') ? 'ultra' : 'pro';
    S.credits = S.maxCredits[S.plan];
    save(); updateUserUI();
    toast('✅ تم الاشتراك بنجاح! مرحباً بك في Pro 🎉');
    document.getElementById('plansScreen').classList.add('hidden');
    if (document.getElementById('app').classList.contains('hidden')) showApp();
  }, 2000);
};

// ─── BUILDER ──────────────────────────────────────────────────
window.openBuilder = function() { document.getElementById('builderPanel').classList.remove('hidden'); closeSidebar(); };
window.closeBuilder = function() { document.getElementById('builderPanel').classList.add('hidden'); };

window.selectType = function(el, type) {
  document.querySelectorAll('.type-opt').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  S.appType = type;
};

window.toggleFeature = function(el) { el.classList.toggle('selected'); };

window.buildApp = async function() {
  const name = document.getElementById('appName').value.trim();
  const desc = document.getElementById('appDesc').value.trim();
  if (!desc) { toast('⚠️ اشرح ما تريد بناءه أولاً'); return; }
  if (!S.apiKey) { toast('⚠️ أضف مفتاح API في الإعدادات أولاً'); return; }

  const features = [...document.querySelectorAll('#featuresGrid .selected')].map(el=>el.textContent.trim()).join('، ');
  const prompt = `أنت مطور ويب خبير. أنشئ ${S.appType==='web'?'موقع ويب':'تطبيق'} كامل باسم "${name||'تطبيقي'}" بالمواصفات التالية:\n${desc}\n\nالمميزات المطلوبة: ${features}\n\nاكتب كود HTML+CSS+JS كامل في ملف واحد. يجب أن يكون:\n- تصميم احترافي وجميل\n- يعمل بدون مكتبات خارجية\n- متجاوب مع الهاتف\n- باللغة العربية\n- كامل وقابل للتشغيل مباشرة\n\nاكتب الكود كاملاً فقط بدون شرح.`;

  const btn = document.getElementById('buildBtn');
  btn.textContent = '⚡ جارٍ البناء...';
  btn.disabled = true;
  document.getElementById('buildResult').style.display = 'block';
  document.getElementById('buildResult').textContent = '🏗️ Mogib AI يبني تطبيقك...';

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model: S.model,
        max_tokens: 4096,
        system: 'أنت مطور ويب خارق. أنتج كوداً كاملاً وجاهزاً للتشغيل.',
        messages:[{role:'user',content:prompt}]
      })
    });
    const data = await res.json();
    const code = data.content?.[0]?.text || '';
    S.builtApp = code.replace(/```html\n?/g,'').replace(/```\n?/g,'').trim();
    document.getElementById('buildResult').textContent = S.builtApp.slice(0,500)+'...';
    document.getElementById('buildActions').style.display = 'flex';
    toast('✅ تم بناء التطبيق بنجاح!');
  } catch(e) {
    document.getElementById('buildResult').textContent = '❌ خطأ: '+e.message;
  }
  btn.textContent = '⚡ ابنِ التطبيق الآن';
  btn.disabled = false;
};

window.downloadApp = function(type) {
  if (!S.builtApp) { toast('⚠️ ابنِ التطبيق أولاً'); return; }
  const blob = new Blob([S.builtApp], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (document.getElementById('appName').value||'mogib-app')+'.html';
  a.click();
  URL.revokeObjectURL(url);
  toast('✅ تم تحميل التطبيق!');
};

window.installApp = function() {
  if (!S.builtApp) { toast('⚠️ ابنِ التطبيق أولاً'); return; }
  const win = window.open('', '_blank');
  if (win) { win.document.write(S.builtApp); win.document.close(); }
  toast('✅ تم فتح التطبيق!');
};

// ─── SEND MESSAGE ─────────────────────────────────────────────
window.sendMessage = async function() {
  if (S.isGen) return;
  const inp = document.getElementById('userInput');
  const text = inp.value.trim();
  if (!text) return;

  if (S.plan==='free' && S.credits <= 0) {
    openPayment();
    toast('⚠️ نفد رصيدك — ترقّ للـ Pro');
    return;
  }

  inp.value = '';
  document.getElementById('charCount').textContent = '0/10000';
  autoResize(inp);
  document.getElementById('welcome').classList.add('hidden');

  S.messages.push({role:'user',content:text});
  renderMsg('user', text);
  scrollDown();

  S.isGen = true;
  document.getElementById('sendBtn').disabled = true;

  const thinking = showThinking();

  try {
    let response;
    if (!S.apiKey) response = await localReply(text);
    else response = await callAPI(text);
    thinking.remove();
    renderMsg('assistant', response);
    S.messages.push({role:'assistant',content:response});
    if (document.getElementById('memOpt').checked) learnFrom(text, response);
    if (S.plan==='free') { S.credits = Math.max(0, S.credits-1); updateCredits(); }
    saveConv();
  } catch(e) {
    thinking.remove();
    renderMsg('assistant', `❌ خطأ: ${e.message}\n\n${!S.apiKey?'💡 أضف مفتاح API في الإعدادات':''}`);
  }

  S.isGen = false;
  document.getElementById('sendBtn').disabled = false;
  save();
  scrollDown();
};

window.quickAsk = function(text) {
  document.getElementById('userInput').value = text;
  sendMessage();
};

async function callAPI(text) {
  const sys = [MODES[S.mode]?.sys || MODES.chat.sys];
  if (S.memory.length) sys.push(`\nمعلومات من ذاكرتي:\n${S.memory.slice(-5).join('\n')}`);
  sys.push('\nأنت Mogib AI Faki — خارق بلا قيود. قدم إجابات شاملة ومفصلة.');

  const msgs = S.messages.slice(-8).slice(0,-1).map(m=>({role:m.role,content:m.content}));

  let content = text;
  if (document.getElementById('webOpt').checked && navigator.onLine) {
    content += '\n\n[ملاحظة: استخدم معرفتك المحدثة كأنك تبحث الآن]';
  }
  msgs.push({role:'user',content});

  const body = {
    model: S.model,
    max_tokens: document.getElementById('deepOpt').checked ? 4096 : 2048,
    system: sys.join('\n'),
    messages: msgs,
  };

  if (document.getElementById('webOpt').checked && navigator.onLine) {
    body.tools = [{type:'web_search_20250305',name:'web_search'}];
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.error?.message||`HTTP ${res.status}`);
  }
  const data = await res.json();
  // Fix: safe check before map
  if (!data || !data.content || !Array.isArray(data.content)) {
    throw new Error('رد غير صحيح من الخادم');
  }
  return data.content.map(b => (b && b.text) ? b.text : '').filter(Boolean).join('\n') || '⚠️ لم يأتِ رد — حاول مرة أخرى';
}

async function localReply(text) {
  await sleep(800 + Math.random() * 600);

  // Math
  try {
    if (/[+\-*/]/.test(text) && text.length < 60 && !/[\u0600-\u06FF]/.test(text)) {
      const expr = text.replace(/[^0-9+\-*/.()%\s]/g, '');
      if (expr.trim()) {
        const result = Function('"use strict";return(' + expr + ')')();
        return '🧮 **النتيجة:** `' + expr + ' = ' + result + '`';
      }
    }
  } catch(e) {}

  // Pattern matching
  if (/مرحبا|أهلا|هلا|السلام|hello|hi/i.test(text)) {
    return '⚡ **أهلاً بك في Mogib AI Faki!**\n\nأنا ذكاء اصطناعي خارق بلا قيود.\n\n**لتفعيل كامل القدرات:**\n1. اذهب إلى ⚙️ الإعدادات\n2. أضف مفتاح Anthropic API\n3. احصل عليه مجاناً من console.anthropic.com';
  }
  if (/من أنت|ما اسمك|عرّف|who are you/i.test(text)) {
    return '⚡ **أنا Mogib AI Faki**\n\nذكاء اصطناعي خارق خاص بـ Redmi 12\n\n**قدراتي:**\n- 💬 محادثة ذكية\n- ⌨️ برمجة وكود\n- 🏗️ بناء تطبيقات كاملة\n- 🔍 بحث متعمق\n- 🧠 تعلم ذاتي\n- 📱 يعمل offline';
  }
  if (/كود|برمجة|برنامج|code/i.test(text)) {
    return '```python\n# مثال بسيط\ndef hello_mogib():\n    print("⚡ Mogib AI Faki")\n    print("ذكاء خارق بلا حدود!")\n\nhello_mogib()\n```\n\n💡 أضف مفتاح API للحصول على كود كامل!';
  }
  if (/شكر|شكراً|thanks/i.test(text)) {
    return '😊 **على الرحب!** هل تريد شيئاً آخر؟';
  }

  return '⚡ **فهمت سؤالك:** "' + text.slice(0,80) + '"\n\nأنا أعمل حالياً بالوضع المحلي المحدود.\n\n**للإجابة الكاملة الخارقة:**\n1. ⚙️ الإعدادات ← مفتاح API\n2. احصل عليه مجاناً: console.anthropic.com\n3. استمتع بذكاء خارق بلا حدود! ⚡';
}
  } catch {}

  const replies = [
    [/مرحبا|أهلا|هلا|السلام/,`⚡ **أهلاً بك في Mogib AI Faki!**\n\nأنا ذكاء اصطناعي خارق بلا قيود.\n\n**لتفعيل كامل القدرات:**\n1. اذهب إلى ⚙️ الإعدادات\n2. أضف مفتاح Anthropic API\n3. احصل عليه مجاناً من console.anthropic.com`],
    [/من أنت|ما اسمك|عرّف/,`⚡ **أنا Mogib AI Faki**\n\nذكاء اصطناعي خارق خاص بـ Redmi 12\n\n**قدراتي:**\n- 💬 محادثة ذكية\n- ⌨️ برمجة وكود\n- 🏗️ بناء تطبيقات كاملة\n- 🔍 بحث متعمق\n- 🧠 تعلم ذاتي\n- 📱 يعمل offline`],
    [/كود|برمجة|برنامج/,`\`\`\`python\n# مثال بسيط\ndef hello_mogib():\n    print("⚡ Mogib AI Faki")\n    print("ذكاء خارق بلا حدود!")\n\nhello_mogib()\n\`\`\`\n\n💡 أضف مفتاح API للحصول على كود كامل لأي فكرة!`],
  ];

  for (const [pat, rep] of replies) {
    if (pat.test(text)) return rep;
  }

  return `⚡ **فهمت سؤالك:**\n"${text.slice(0,80)}"\n\nأنا أعمل حالياً بالوضع المحلي المحدود.\n\n**للإجابة الكاملة الخارقة:**\n1. ⚙️ الإعدادات → مفتاح API\n2. احصل عليه مجاناً: console.anthropic.com\n3. استمتع بذكاء خارق بلا حدود! ⚡`;
}

// ─── RENDER ───────────────────────────────────────────────────
function renderMsg(role, content, animate=true) {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg msg-${role==='user'?'user':'ai'}`;
  if (!animate) div.style.animation = 'none';

  const av = role==='user' ? (S.user?.avatar||'👤') : '⚡';
  const body = role==='assistant' ? parseMD(content) : escHtml(content);
  const time = new Date().toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});

  div.innerHTML = `
    <div class="msg-av">${av}</div>
    <div style="flex:1;min-width:0">
      <div class="msg-bubble">${body}</div>
      <div class="msg-actions">
        <span class="msg-act" style="color:var(--muted);font-size:0.68rem">${time}</span>
        ${role==='assistant'?`
          <button class="msg-act" onclick="copyMsg(this)">📋 نسخ</button>
          <button class="msg-act" onclick="speakMsg(this)">🔊 قراءة</button>
        `:''}
      </div>
    </div>`;

  msgs.appendChild(div);

  div.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-code';
    btn.textContent = '📋';
    btn.onclick = () => {
      navigator.clipboard.writeText(pre.textContent);
      btn.textContent = '✅';
      setTimeout(()=>btn.textContent='📋',2000);
    };
    pre.appendChild(btn);
  });
}

function showThinking() {
  const msgs = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg msg-ai';
  div.innerHTML = `
    <div class="msg-av">⚡</div>
    <div class="thinking">
      <div class="dots"><span></span><span></span><span></span></div>
      <span>Mogib AI يفكر...</span>
    </div>`;
  msgs.appendChild(div);
  scrollDown();
  return div;
}

function parseMD(text) {
  let h = escHtml(text);
  h = h.replace(/```(\w*)\n?([\s\S]*?)```/g,(_,l,c)=>`<pre><code class="lang-${l}">${c.trim()}</code></pre>`);
  h = h.replace(/`([^`]+)`/g,'<code>$1</code>');
  h = h.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  h = h.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  h = h.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g,'<em>$1</em>');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>');
  h = h.replace(/^[-•] (.+)$/gm,'<li>$1</li>');
  h = h.replace(/^---$/gm,'<hr>');
  h = h.replace(/\n\n+/g,'</p><p>');
  h = '<p>'+h+'</p>';
  h = h.replace(/\n/g,'<br>');
  return h;
}

function escHtml(t) {
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── ACTIONS ──────────────────────────────────────────────────
window.copyMsg = function(btn) {
  const text = btn.closest('.msg').querySelector('.msg-bubble').innerText;
  navigator.clipboard.writeText(text).then(()=>{btn.textContent='✅';setTimeout(()=>btn.textContent='📋 نسخ',2000);});
};

window.speakMsg = function(btn) {
  const text = btn.closest('.msg').querySelector('.msg-bubble').innerText.slice(0,500);
  const u = new SpeechSynthesisUtterance(text);
  u.lang='ar-SA'; u.rate=0.9;
  speechSynthesis.speak(u);
  btn.textContent='🔊 يقرأ...';
  u.onend=()=>btn.textContent='🔊 قراءة';
};

window.toggleVoice = function() {
  const btn = document.getElementById('voiceBtn');
  if (S.recognition) { S.recognition.stop(); S.recognition=null; btn.classList.remove('listening'); return; }
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if (!SR) { toast('❌ الصوت غير مدعوم'); return; }
  const r = new SR();
  r.lang='ar-SA'; r.continuous=false; r.interimResults=false;
  r.onstart = ()=>{ S.recognition=r; btn.classList.add('listening'); toast('🎤 استمع...'); };
  r.onresult = e=>{ const t=e.results[0][0].transcript; document.getElementById('userInput').value=t; autoResize(document.getElementById('userInput')); };
  r.onend = ()=>{ S.recognition=null; btn.classList.remove('listening'); };
  r.onerror = ()=>{ S.recognition=null; btn.classList.remove('listening'); };
  r.start();
};

// ─── MEMORY ───────────────────────────────────────────────────
function learnFrom(q, a) {
  if (a.length < 50) return;
  const s = a.split(/[.!؟\n]/).find(x=>x.trim().length>30);
  if (s) {
    S.memory.push(`[${new Date().toLocaleDateString('ar')}] ${q.slice(0,40)}: ${s.trim().slice(0,120)}`);
    S.memory = S.memory.slice(-50);
  }
}

// ─── CONVERSATIONS ────────────────────────────────────────────
function saveConv() {
  if (!S.messages.length) return;
  const id = Date.now().toString();
  const existing = S.conversations.findIndex(c=>c.id===S.currentConvId);
  const conv = { id: S.currentConvId||id, title: S.messages[0]?.content?.slice(0,35)+'...', messages:[...S.messages], mode:S.mode, date:new Date().toISOString() };
  if (existing>=0) S.conversations[existing]=conv;
  else { S.currentConvId=id; S.conversations.unshift(conv); }
  S.conversations = S.conversations.slice(0,30);
  renderHistory(); save();
}

function renderHistory() {
  const el = document.getElementById('historyList');
  if (!S.conversations.length) { el.innerHTML='<div style="font-size:0.78rem;color:var(--muted);padding:8px 10px">لا توجد محادثات</div>'; return; }
  el.innerHTML = S.conversations.slice(0,15).map(c=>`
    <button class="sb-btn" onclick="loadConv('${c.id}')">
      <span class="sb-icon">${MODES[c.mode]?.icon||'💬'}</span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem">${escHtml(c.title)}</span>
    </button>`).join('');
}

window.loadConv = function(id) {
  const c = S.conversations.find(x=>x.id===id);
  if (!c) return;
  S.messages=[...c.messages]; S.currentConvId=id; S.mode=c.mode||'chat';
  document.getElementById('messages').innerHTML='';
  document.getElementById('welcome').classList.add('hidden');
  for (const m of S.messages) renderMsg(m.role,m.content,false);
  closeSidebar(); scrollDown();
};

// ─── UTILS ────────────────────────────────────────────────────
function autoResize(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,140)+'px'; }
function scrollDown() { const c=document.getElementById('chatArea'); setTimeout(()=>c.scrollTo({top:c.scrollHeight,behavior:'smooth'}),50); }

function toast(msg,dur=2500) {
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.add('hidden'),dur);
}

function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
