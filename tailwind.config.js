/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          void: '#0A0E0F',      // الخلفية الأساسية - أسود مختبري عميق
          panel: '#11171A',     // ألواح البطاقات
          edge: '#1D2628',      // الحدود الدقيقة
          steel: '#5C6E72',     // نص ثانوي
          mist: '#9AABA8',      // نص هادئ
          paper: '#E9EDE9',     // نص أساسي فاتح
        },
        signal: {
          phosphor: '#5EE6A8',  // أخضر فسفوري - حالة النجاح/التدريب النشط
          amber: '#E6A85E',     // كهرماني - تحذيرات/انتظار
          crimson: '#E65E6E',   // أحمر - أخطاء
          cyan: '#5ECFE6',      // سماوي - معلومات/روابط
        },
      },
      fontFamily: {
        display: ['"IBM Plex Sans Arabic"', '"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(94,230,168,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(94,230,168,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
      },
      boxShadow: {
        glow: '0 0 24px rgba(94,230,168,0.15)',
      },
    },
  },
  plugins: [],
}
