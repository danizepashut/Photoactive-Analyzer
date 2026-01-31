
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Interfaces ---
interface AnalysisReport {
  initialImpression: string;
  layers: {
    technical: string;
    emotional: string;
    communication: string;
    light: string;
    identity: string;
  };
  painProfile: {
    name: string;
    reason: string;
  };
  finalFeedback: {
    hook: string;
    insight: string;
    solution: string;
  };
}

const App = () => {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [selectedImage, setSelectedImage] = useState<{base64: string, mimeType: string, previewUrl: string} | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRtl = lang === 'he';

  const t = {
    he: {
      title: "PHOTOACTIVE",
      subtitle: "מערכת אבחון מערכתית",
      uploadPrompt: "גררו או העלו צילום לאבחון",
      analyzing: "המוח הפוטואקטיבי מנתח שכבות...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      error: "נדרשת הגדרת מפתח API בתשלום (Paid Project) כדי להמשיך.",
      fixKey: "עדכון הגדרות חיבור"
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Systemic Diagnosis System",
      uploadPrompt: "Drag or upload photo for diagnosis",
      analyzing: "Deconstructing systemic layers...",
      startBtn: "Start Deep Diagnosis",
      placeholder: "Photo title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you at that moment.”",
      reset: "New Diagnosis",
      error: "A paid API Key project is required to continue.",
      fixKey: "Update Connection Settings"
    }
  }[lang];

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setErrorMessage(null);
    }
  };

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        base64: reader.result as string,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      });
      setReport(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const onAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // Create a fresh instance to ensure the latest API key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. בצע ניתוח מערכתי חודר של 5 השכבות: טכנית, רגשית, תקשורתית, אור וזהות. זהה את ה'כאב המערכתי' והצע 'פעולה מתקנת'. החזר תגובה בפורמט JSON בלבד בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli, a world-class systemic photo analyst. Your tone is deep, direct, artistic, and uncompromising. You see the invisible layers of identity. Return ONLY a valid JSON object.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              initialImpression: { type: Type.STRING },
              layers: {
                type: Type.OBJECT,
                properties: {
                  technical: { type: Type.STRING },
                  emotional: { type: Type.STRING },
                  communication: { type: Type.STRING },
                  light: { type: Type.STRING },
                  identity: { type: Type.STRING }
                }
              },
              painProfile: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } },
                required: ["name", "reason"]
              },
              finalFeedback: {
                type: Type.OBJECT,
                properties: { hook: { type: Type.STRING }, insight: { type: Type.STRING }, solution: { type: Type.STRING } },
                required: ["hook", "insight", "solution"]
              }
            },
            required: ["initialImpression", "layers", "painProfile", "finalFeedback"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setReport(result);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      // If error suggests missing project/key, trigger the selector
      if (err.message?.includes("entity was not found") || err.message?.includes("API key")) {
        setErrorMessage(t.error);
        handleOpenKeySelector();
      } else {
        setErrorMessage(err.message || "שגיאת מערכת. נסה שוב.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#050505] text-[#f8fafc] font-sans selection:bg-blue-500/30 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navigation */}
      <nav className="h-20 px-10 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-blue-600/30">P</div>
          <h1 className="text-2xl font-black tracking-[0.3em] hidden sm:block">{t.title}</h1>
        </div>
        <button 
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          className="px-6 py-2.5 rounded-full border border-white/10 text-[11px] font-black uppercase hover:bg-white/5 transition-all tracking-[0.2em]"
        >
          {lang === 'he' ? 'English' : 'עברית'}
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-10">
          <div className="bg-gradient-to-br from-white/[0.05] to-transparent p-10 rounded-[48px] border border-white/10 shadow-2xl">
            <h2 className="text-4xl font-black mb-2 tracking-tight">{t.subtitle}</h2>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">Systemic Methodology • Eldad Rafaeli</p>
            </div>
          </div>

          <div 
            className={`relative aspect-[4/5] bg-white/[0.01] rounded-[64px] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed transition-all duration-500 cursor-pointer group shadow-2xl
              ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.02]' : 'border-white/10'}
              ${selectedImage ? 'border-solid border-white/5' : 'hover:border-white/20'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative group">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Preview" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }}
                    className="w-20 h-20 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center hover:rotate-90 transition-all shadow-3xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 space-y-8 opacity-40 group-hover:opacity-100 transition-all">
                <div className="w-28 h-28 mx-auto rounded-[40px] border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-blue-600/10 group-hover:border-blue-500/40 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor" className="w-14 h-14"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                </div>
                <p className="text-3xl font-black tracking-tight">{t.uploadPrompt}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center z-50 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/60 shadow-[0_0_20px_blue] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                <div className="w-24 h-24 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin mb-10"></div>
                <p className="text-2xl font-black animate-pulse tracking-[0.2em] uppercase">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
              <input 
                type="text"
                placeholder={t.placeholder}
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-[32px] p-8 focus:outline-none focus:border-blue-600 transition-all text-2xl font-bold shadow-inner"
              />
              <button 
                onClick={onAnalyze}
                className="w-full py-9 bg-white text-black rounded-[32px] font-black text-2xl hover:bg-blue-600 hover:text-white transition-all shadow-[0_30px_90px_rgba(0,0,0,0.6)] active:scale-95"
              >
                {t.startBtn}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="space-y-6 animate-in zoom-in duration-500">
              <div className="p-10 bg-red-500/10 border border-red-500/30 rounded-[40px] text-red-400 text-lg font-bold text-center leading-relaxed backdrop-blur-md">
                {errorMessage}
              </div>
              <button 
                onClick={handleOpenKeySelector}
                className="w-full py-6 border-2 border-blue-500/40 text-blue-400 rounded-[32px] text-xs font-black uppercase tracking-[0.3em] hover:bg-blue-500/10 transition-all"
              >
                {t.fixKey}
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7">
          {!report ? (
            <div className="h-full flex flex-col items-center justify-center bg-white/[0.01] rounded-[80px] p-20 text-center border-2 border-dashed border-white/5 opacity-20">
              <h3 className="text-5xl font-black leading-tight italic tracking-tighter max-w-2xl">{t.quote}</h3>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
              {/* Main Headline */}
              <div className="bg-white/[0.03] p-16 rounded-[72px] border border-white/10 relative overflow-hidden shadow-3xl backdrop-blur-md">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/[0.08] blur-[180px] -z-10 rounded-full" />
                <h2 className="text-6xl md:text-8xl font-black mb-12 leading-[0.8] tracking-tighter drop-shadow-2xl">{report.finalFeedback.hook}</h2>
                <div className="h-1 w-24 bg-blue-600 mb-12"></div>
                <p className="text-3xl text-slate-200 italic font-medium leading-snug">{report.initialImpression}</p>
              </div>

              {/* Layers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-white/[0.02] p-12 rounded-[56px] border border-white/5 hover:bg-white/[0.06] hover:border-white/20 transition-all group shadow-xl">
                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.6em] mb-6 opacity-60 group-hover:opacity-100">{key} Layer</h4>
                    <p className="text-2xl leading-relaxed font-bold text-white/90">{value}</p>
                  </div>
                ))}
              </div>

              {/* Bottom Insight Card */}
              <div className="bg-white/[0.03] p-16 rounded-[80px] border border-white/5 space-y-16 shadow-3xl relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                  <div className="space-y-8">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em]">Systemic Pain Profile</h4>
                    <p className="text-5xl font-black text-white tracking-tighter">{report.painProfile.name}</p>
                    <p className="text-2xl text-slate-400 italic font-medium leading-relaxed">{report.painProfile.reason}</p>
                  </div>
                  <div className="space-y-8">
                    <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.6em]">The Corrective Path</h4>
                    <p className="text-4xl font-black text-white leading-tight drop-shadow-xl">{report.finalFeedback.solution}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-8 pt-12 border-t border-white/10">
                  <button onClick={() => { setSelectedImage(null); setReport(null); }} className="flex-1 py-8 border-2 border-white/10 rounded-[40px] font-black text-sm uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-8 bg-blue-600 text-white rounded-[40px] font-black text-center text-sm uppercase tracking-[0.3em] hover:bg-blue-500 shadow-[0_30px_100px_rgba(37,99,235,0.4)] transition-all">
                    Talk to Eldad
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-24 text-center">
        <div className="opacity-10 space-y-6">
          <p className="text-[11px] font-black uppercase tracking-[2.5em]">PhotoActive Systemic Diagnosis • v6.0 PRO</p>
          <div className="flex justify-center gap-14 text-[9px] font-black uppercase tracking-[0.4em]">
            <span>Confidential</span>
            <span>Uncompromising</span>
            <span>Truth</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(450px); opacity: 0; }
        }
        body::-webkit-scrollbar { width: 10px; }
        body::-webkit-scrollbar-track { background: #050505; }
        body::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 20px; border: 3px solid #050505; }
        body::-webkit-scrollbar-thumb:hover { background: #252525; }
      `}</style>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
