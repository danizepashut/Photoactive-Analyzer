
import React, { useState, useRef } from 'react';
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
      uploadPrompt: "העלו צילום לאבחון עומק",
      analyzing: "המוח הפוטואקטיבי מנתח שכבות...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      error: "חלה שגיאה בניתוח. וודא שהגדרת מפתח API תקין (Paid Project).",
      fixKey: "לחץ כאן להגדרת המפתח"
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Systemic Diagnosis System",
      uploadPrompt: "Upload photo for deep diagnosis",
      analyzing: "Deconstructing systemic layers...",
      startBtn: "Start Deep Diagnosis",
      placeholder: "Photo title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you at that moment.”",
      reset: "New Diagnosis",
      error: "Analysis error. Ensure your API Key is valid and from a paid project.",
      fixKey: "Click here to fix connection"
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
          systemInstruction: "You are Eldad Rafaeli, a world-class systemic photo analyst. Your tone is deep, direct, and uncompromising. Return ONLY valid JSON.",
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
      console.error(err);
      setErrorMessage(t.error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#050505] text-[#f8fafc] font-sans ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="h-20 px-8 border-b border-white/5 flex items-center justify-between backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs shadow-lg shadow-blue-600/20">P</div>
          <h1 className="text-xl font-black tracking-[0.2em]">{t.title}</h1>
        </div>
        <button 
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-all tracking-widest"
        >
          {lang === 'he' ? 'English' : 'עברית'}
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white/[0.03] p-8 rounded-[40px] border border-white/5 shadow-xl">
            <h2 className="text-3xl font-black mb-1">{t.subtitle}</h2>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Methodology • Eldad Rafaeli</p>
          </div>

          <div 
            className={`relative aspect-[4/5] bg-white/[0.01] rounded-[56px] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10'}
              ${selectedImage ? 'border-solid border-white/5' : 'hover:border-white/20'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative group">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-12 opacity-30 hover:opacity-100 transition-opacity">
                <div className="w-20 h-20 mx-auto rounded-3xl border border-white/10 flex items-center justify-center bg-white/5 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={0.7} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                </div>
                <p className="text-xl font-bold">{t.uploadPrompt}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center z-50">
                <div className="w-16 h-16 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-8"></div>
                <p className="text-xl font-black uppercase tracking-widest">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4">
              <input type="text" placeholder={t.placeholder} value={photoName} onChange={(e) => setPhotoName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-6 text-xl font-medium" />
              <button onClick={onAnalyze} className="w-full py-7 bg-white text-black rounded-3xl font-black text-2xl hover:bg-blue-600 hover:text-white transition-all">{t.startBtn}</button>
            </div>
          )}

          {errorMessage && (
            <div className="space-y-4">
              <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold text-center leading-relaxed">
                {errorMessage}
              </div>
              <button onClick={handleOpenKeySelector} className="w-full py-4 border border-blue-500/30 text-blue-400 rounded-2xl text-xs font-black uppercase tracking-widest">
                {t.fixKey}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          {!report ? (
            <div className="h-full flex flex-col items-center justify-center bg-white/[0.01] rounded-[64px] p-16 text-center opacity-10 border-2 border-dashed border-white/5">
              <h3 className="text-4xl md:text-5xl font-black italic">{t.quote}</h3>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="bg-white/[0.03] p-12 rounded-[64px] border border-white/5 shadow-2xl backdrop-blur-sm">
                <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tighter">{report.finalFeedback.hook}</h2>
                <div className="h-px bg-white/10 mb-10"></div>
                <p className="text-2xl text-slate-300 italic leading-relaxed">{report.initialImpression}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-white/[0.02] p-10 rounded-[44px] border border-white/5 hover:bg-white/[0.05] transition-all">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-4">{key} Layer</h4>
                    <p className="text-xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/[0.03] p-14 rounded-[64px] border border-white/5 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Systemic Pain</h4>
                    <p className="text-3xl font-black">{report.painProfile.name}</p>
                    <p className="text-lg text-slate-400 italic">{report.painProfile.reason}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Corrective Action</h4>
                    <p className="text-2xl font-bold">{report.finalFeedback.solution}</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedImage(null); setReport(null); }} className="w-full py-7 border border-white/10 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all">
                  {t.reset}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
