
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
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<{base64: string, mimeType: string, previewUrl: string} | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if key is already selected
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSetupKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success and move to app immediately as per instructions
      setHasKey(true);
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
      if (err.message?.includes("entity was not found")) {
        setHasKey(false);
        setErrorMessage("נא להגדיר מפתח תקין מפרויקט בתשלום.");
      } else {
        setErrorMessage("שגיאה בניתוח. נסה שוב.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- RENDERING ---

  // 1. Initial Access Screen (Exact match to initial design)
  if (!hasKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6" dir="rtl">
        <div className="bg-[#111111] border border-white/5 rounded-[32px] p-12 max-w-md w-full text-center shadow-2xl">
          <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-4">PHOTOACTIVE</h1>
          <p className="text-slate-400 text-sm mb-8">נדרשת הגדרת מפתח API</p>
          <button 
            onClick={handleSetupKey}
            className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-lg mb-6"
          >
            הגדרת מפתח מערכת
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            className="text-slate-500 text-xs hover:text-blue-400 transition-colors"
          >
            מידע על חיוב וחשבונות
          </a>
        </div>
      </div>
    );
  }

  // 2. Main App Screen
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col" dir="rtl">
      {/* Navbar */}
      <nav className="h-20 px-8 border-b border-white/5 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-widest">PHOTOACTIVE</h1>
        <button onClick={() => setHasKey(false)} className="text-xs text-slate-500 hover:text-white uppercase tracking-tighter">הגדרות חיבור</button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 py-12">
        {/* Upload Side */}
        <div className="space-y-8">
          <div 
            className={`aspect-[4/5] bg-[#0a0a0a] rounded-[48px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all
              ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}
              ${selectedImage ? 'border-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative group rounded-[48px] overflow-hidden">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }} className="p-4 bg-red-500 rounded-full">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-40">
                <p className="text-2xl font-bold">העלו צילום לאבחון</p>
                <p className="text-sm mt-2">גררו קובץ לכאן</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center rounded-[48px]">
                <div className="w-12 h-12 border-2 border-t-blue-500 border-white/10 rounded-full animate-spin mb-4"></div>
                <p className="text-lg font-bold animate-pulse">מנתח שכבות...</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="שם הצילום (לא חובה)" 
                value={photoName} 
                onChange={(e) => setPhotoName(e.target.value)} 
                className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 text-white"
              />
              <button 
                onClick={onAnalyze} 
                className="w-full py-6 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-600 hover:text-white transition-all"
              >
                התחל אבחון עומק
              </button>
            </div>
          )}

          {errorMessage && <p className="text-red-500 text-center font-bold">{errorMessage}</p>}
        </div>

        {/* Report Side */}
        <div>
          {!report ? (
            <div className="h-full flex items-center justify-center text-center opacity-20 italic">
              <h3 className="text-3xl font-light">״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״</h3>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="bg-[#111] p-10 rounded-[48px] border border-white/5">
                <h2 className="text-4xl font-black mb-6">{report.finalFeedback.hook}</h2>
                <p className="text-xl text-slate-300 italic leading-relaxed">{report.initialImpression}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-[#111] p-6 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] uppercase tracking-widest text-blue-500 font-bold mb-2">{key}</h4>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-600/10 p-10 rounded-[48px] border border-blue-500/20 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">כאב מערכתי</h4>
                  <p className="text-2xl font-black">{report.painProfile.name}</p>
                  <p className="text-sm text-slate-400 mt-2">{report.painProfile.reason}</p>
                </div>
                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">פעולה מתקנת</h4>
                  <p className="text-xl font-bold">{report.finalFeedback.solution}</p>
                </div>
              </div>

              <button onClick={() => { setSelectedImage(null); setReport(null); }} className="w-full py-4 border border-white/10 rounded-2xl text-slate-500 font-bold hover:text-white transition-colors">
                אבחון חדש
              </button>
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
