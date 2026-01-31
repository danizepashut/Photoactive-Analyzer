
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

// --- Icons ---
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 opacity-20">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

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
      analyzing: "המוח הפוטואקטיבי מפרק את השכבות...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      change: "החלף צילום",
      error: "חלה שגיאה בניתוח. בדקו את הגדרות ה-Secrets."
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
      change: "Change Photo",
      error: "Analysis error. Check your Secrets settings."
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
      // Direct access from environment
      const apiKey = process.env.API_KEY;
      
      if (!apiKey || apiKey === "") {
        throw new Error("מפתח API חסר. לחץ על אייקון המנעול (🔒) בסרגל השמאלי והוסף API_KEY.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. בצע ניתוח מערכתי חודר של 5 השכבות: טכנית, רגשית, תקשורתית, אור וזהות. החזר תגובה בפורמט JSON בלבד בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli, a world-class systemic photo analyst. Your tone is deep, direct, and uncompromising. You see beyond the aesthetic into the psychological layers of the creator. Return ONLY a valid JSON object.",
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
      setErrorMessage(err.message.includes("API_KEY") ? err.message : "שגיאת תקשורת עם המודל. וודאו שהמפתח תקין.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#050505] text-[#f8fafc] ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="h-20 px-8 border-b border-white/5 flex items-center justify-between backdrop-blur-xl sticky top-0 z-50">
        <h1 className="text-2xl font-black tracking-[0.2em]">{t.title}</h1>
        <button 
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-all"
        >
          {lang === 'he' ? 'English' : 'עברית'}
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Column */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white/5 p-8 rounded-[32px] border border-white/5">
            <h2 className="text-2xl font-bold mb-1">{t.subtitle}</h2>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">Methodology by Eldad Rafaeli</p>
          </div>

          <div 
            className={`relative aspect-[4/5] bg-white/[0.02] rounded-[48px] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/5'}
              ${selectedImage ? 'border-solid' : 'hover:border-white/10'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }}
                  className="absolute top-6 left-6 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                >
                  <XMarkIcon />
                </button>
              </div>
            ) : (
              <div className="text-center p-12 space-y-6">
                <UploadIcon />
                <p className="text-lg font-medium opacity-40 max-w-[200px] mx-auto leading-relaxed">{t.uploadPrompt}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div>
                <p className="text-xl font-bold animate-pulse tracking-wide">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4">
              <input 
                type="text"
                placeholder={t.placeholder}
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-blue-500 transition-all text-lg"
              />
              <button 
                onClick={onAnalyze}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-400 transition-all shadow-2xl active:scale-[0.98]"
              >
                {t.startBtn}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center leading-relaxed">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Report Column */}
        <div className="lg:col-span-7">
          {!report ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white/[0.01] rounded-[60px] p-12 text-center opacity-20 border-dashed border-2 border-white/5">
              <h3 className="text-4xl md:text-5xl font-black leading-tight max-w-2xl">{t.quote}</h3>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Hook & Impression */}
              <div className="bg-white/5 p-12 rounded-[60px] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10" />
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-none tracking-tight text-white drop-shadow-2xl">{report.finalFeedback.hook}</h2>
                <p className="text-xl md:text-2xl text-slate-400 italic font-medium leading-relaxed border-r-4 border-blue-600/30 pr-8">{report.initialImpression}</p>
              </div>

              {/* Grid of Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-white/5 p-8 rounded-[32px] border border-white/5 hover:bg-white/[0.08] transition-all group">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 opacity-50">
                      {key.toUpperCase()} LAYER
                    </h4>
                    <p className="text-lg leading-relaxed font-medium text-slate-200">{value}</p>
                  </div>
                ))}
              </div>

              {/* Diagnosis & Action */}
              <div className="bg-white/5 p-12 rounded-[60px] border border-white/10 space-y-12 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">פרופיל פסיכולוגי</h4>
                    <p className="text-3xl font-black mb-2 text-white">{report.painProfile.name}</p>
                    <p className="text-lg text-slate-400 leading-relaxed italic">{report.painProfile.reason}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6">פעולה מתקנת</h4>
                    <p className="text-2xl font-bold leading-tight text-white">{report.finalFeedback.solution}</p>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => { setSelectedImage(null); setReport(null); }} className="flex-1 py-6 border border-white/10 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-6 bg-blue-600 text-white rounded-3xl font-black text-center text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl">
                    שיחה עם אלדד
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center opacity-10">
        <p className="text-[8px] font-black uppercase tracking-[1.5em]">PhotoActive System • Systemic Diagnosis</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
