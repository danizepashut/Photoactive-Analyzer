
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
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRtl = lang === 'he';

  const checkKeyStatus = async () => {
    // Check both the environment variable and the helper function
    const envKeyExists = !!process.env.API_KEY && process.env.API_KEY !== "undefined" && process.env.API_KEY !== "";
    
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      try {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected || envKeyExists);
      } catch (e) {
        setHasKey(envKeyExists);
      }
    } else {
      setHasKey(envKeyExists);
    }
  };

  useEffect(() => {
    checkKeyStatus();
    // Re-check periodically in case the user sets it in the background
    const interval = setInterval(checkKeyStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Per instructions: assume success to avoid race conditions
      setHasKey(true);
    }
  };

  const t = {
    he: {
      title: "PHOTOACTIVE",
      subtitle: "מערכת אבחון מערכתית",
      setupRequired: "נדרשת הגדרת מפתח API (Paid Project)",
      setupBtn: "לחץ כאן לבחירת מפתח",
      alreadyDone: "כבר הגדרתי, המשך לאפליקציה",
      billingLink: "מידע על חיוב וחשבונות (Billing)",
      uploadPrompt: "העלו צילום לאבחון עומק",
      analyzing: "המוח הפוטואקטיבי מנתח שכבות...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      error: "חלה שגיאה. וודא שבחרת מפתח מפרויקט בתשלום (Paid) עם Billing פעיל.",
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Systemic Diagnosis System",
      setupRequired: "API Key Setup Required (Paid Project)",
      setupBtn: "Click to select API Key",
      alreadyDone: "I've set the key, proceed",
      billingLink: "Billing & Documentation",
      uploadPrompt: "Upload photo for deep diagnosis",
      analyzing: "Deconstructing systemic layers...",
      startBtn: "Start Deep Diagnosis",
      placeholder: "Photo title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you at that moment.”",
      reset: "New Diagnosis",
      error: "An error occurred. Ensure you selected a key from a Paid project.",
    }
  }[lang];

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
      // Always create a fresh instance
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. בצע ניתוח מערכתי חודר של 5 השכבות: טכנית, רגשית, תקשורתית, אור וזהות. החזר תגובה בפורמט JSON בלבד בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli, a world-class systemic photo analyst. Your tone is deep, direct, and uncompromising. You look for the 'Systemic Pain' and provide a 'Corrective Action'. Return ONLY a valid JSON object.",
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
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API key not found")) {
        setHasKey(false);
        setErrorMessage("המפתח לא נמצא או שאינו תקין. אנא בחר מפתח שוב.");
      } else {
        setErrorMessage(err.message || t.error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // While checking, show a simple loader
  if (hasKey === null) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // If no key is detected, show the setup screen
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center animate-in fade-in duration-500" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full space-y-10 bg-white/[0.03] p-12 rounded-[48px] border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white">{t.title}</h1>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">{t.subtitle}</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-slate-400 text-lg font-medium">{t.setupRequired}</p>
            <button 
              onClick={handleOpenKeySelector}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
            >
              {t.setupBtn}
            </button>
            
            <button 
              onClick={() => setHasKey(true)}
              className="w-full py-4 border border-white/10 hover:bg-white/5 text-slate-400 rounded-2xl font-bold text-sm transition-all"
            >
              {t.alreadyDone}
            </button>

            <div className="pt-4">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                className="text-xs text-blue-400/50 hover:text-blue-400 transition-colors underline underline-offset-4"
              >
                {t.billingLink}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-[#050505] text-[#f8fafc] font-sans selection:bg-blue-500/30 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="h-20 px-8 border-b border-white/5 flex items-center justify-between backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-blue-600/20">P</div>
          <h1 className="text-xl font-black tracking-[0.2em]">{t.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-all tracking-widest"
          >
            {lang === 'he' ? 'English' : 'עברית'}
          </button>
          <button onClick={handleOpenKeySelector} title="Change API Key" className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white/[0.03] p-8 rounded-[40px] border border-white/5 relative overflow-hidden group shadow-xl">
            <div className="absolute inset-0 bg-blue-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
            <h2 className="text-3xl font-black mb-1 relative z-10">{t.subtitle}</h2>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] relative z-10">Systemic Methodology • Eldad Rafaeli</p>
          </div>

          <div 
            className={`relative aspect-[4/5] bg-white/[0.01] rounded-[56px] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer shadow-inner
              ${isDragging ? 'border-blue-500 bg-blue-500/5 scale-[1.01]' : 'border-white/10'}
              ${selectedImage ? 'border-solid border-white/5' : 'hover:border-white/20'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative group">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Preview" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }}
                    className="w-16 h-16 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-2xl"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 space-y-6 opacity-30 group-hover:opacity-100 transition-opacity">
                <div className="w-24 h-24 mx-auto rounded-[32px] border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-blue-600/20 group-hover:border-blue-500/50 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.7} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                </div>
                <p className="text-2xl font-black tracking-tight">{t.uploadPrompt}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center z-50 overflow-hidden animate-in fade-in duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/80 animate-[scan_2s_ease-in-out_infinite]"></div>
                <div className="w-24 h-24 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-8 shadow-[0_0_50px_rgba(37,99,235,0.2)]"></div>
                <p className="text-2xl font-black animate-pulse tracking-widest uppercase text-white">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700">
              <input 
                type="text"
                placeholder={t.placeholder}
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 focus:outline-none focus:border-blue-600 transition-all text-xl font-medium shadow-lg"
              />
              <button 
                onClick={onAnalyze}
                className="w-full py-7 bg-white text-black rounded-3xl font-black text-2xl hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_60px_rgba(0,0,0,0.5)] active:scale-95"
              >
                {t.startBtn}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold text-center leading-relaxed animate-in zoom-in duration-300">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-7">
          {!report ? (
            <div className="h-full flex flex-col items-center justify-center bg-white/[0.01] rounded-[64px] p-16 text-center opacity-10 border-2 border-dashed border-white/5">
              <h3 className="text-4xl md:text-5xl font-black leading-tight max-w-2xl italic tracking-tighter">{t.quote}</h3>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-left-12 duration-1000">
              <div className="bg-white/[0.03] p-12 rounded-[64px] border border-white/5 relative overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.07] blur-[150px] -z-10 rounded-full" />
                <h2 className="text-5xl md:text-7xl font-black mb-10 leading-[0.85] text-white tracking-tighter drop-shadow-2xl">{report.finalFeedback.hook}</h2>
                <div className="h-px bg-white/10 mb-10"></div>
                <p className="text-2xl md:text-3xl text-slate-300 italic font-medium leading-relaxed pr-10 border-r-4 border-blue-600/50">{report.initialImpression}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-white/[0.02] p-10 rounded-[44px] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500"></div>
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-6 opacity-60 group-hover:opacity-100 transition-opacity">{key} Layer</h4>
                    <p className="text-xl leading-relaxed font-semibold text-slate-100">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.03] p-14 rounded-[64px] border border-white/5 space-y-16 shadow-2xl relative backdrop-blur-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Psychological Profile</h4>
                    <p className="text-4xl font-black text-white leading-none tracking-tighter">{report.painProfile.name}</p>
                    <p className="text-xl text-slate-400 leading-relaxed italic font-medium">{report.painProfile.reason}</p>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Corrective Action</h4>
                    <p className="text-3xl font-bold leading-tight text-white/90 drop-shadow-lg">{report.finalFeedback.solution}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-white/5">
                  <button onClick={() => { setSelectedImage(null); setReport(null); }} className="flex-1 py-7 border border-white/10 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-7 bg-blue-600 text-white rounded-[32px] font-black text-center text-sm uppercase tracking-[0.2em] hover:bg-blue-500 shadow-[0_20px_60px_rgba(37,99,235,0.4)] transition-all">
                    Talk to Eldad
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 text-center">
        <div className="opacity-10 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[2em]">PhotoActive Systemic Diagnosis • System v3.1</p>
          <div className="flex justify-center gap-10 text-[8px] font-bold uppercase tracking-widest">
            <span className="hover:text-blue-500 transition-colors cursor-default">Confidential Analysis</span>
            <span className="hover:text-blue-500 transition-colors cursor-default">Systemic Truth</span>
            <span className="hover:text-blue-500 transition-colors cursor-default">Direct Insight</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        body::-webkit-scrollbar {
          width: 8px;
        }
        body::-webkit-scrollbar-track {
          background: #050505;
        }
        body::-webkit-scrollbar-thumb {
          background: #1a1a1a;
          border-radius: 10px;
        }
        body::-webkit-scrollbar-thumb:hover {
          background: #252525;
        }
      `}</style>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
