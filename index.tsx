
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if key is already there on start
  useEffect(() => {
    const checkKeyStatus = async () => {
      // @ts-ignore
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasKey(true);
      }
    };
    checkKeyStatus();
  }, []);

  const handleInitialSetup = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Proceed immediately to app to avoid race conditions
      setHasKey(true);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        base64: reader.result as string,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      });
      setReport(null);
    };
    reader.readAsDataURL(file);
  };

  const executeAnalysis = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. נתח 5 שכבות: טכנית, רגשית, תקשורתית, אור וזהות. זהה את ה'כאב המערכתי' והצע 'פעולה מתקנת'. החזר תוצאה בפורמט JSON בלבד בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli. Your analysis is deep, systemic, and uncompromising. You look for the hidden truth in every image. Return ONLY valid JSON.",
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
                properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }
              },
              finalFeedback: {
                type: Type.OBJECT,
                properties: { hook: { type: Type.STRING }, insight: { type: Type.STRING }, solution: { type: Type.STRING } }
              }
            },
            required: ["initialImpression", "layers", "painProfile", "finalFeedback"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setReport(result);
    } catch (err) {
      console.error("Analysis failed", err);
      // Silent recovery - just stop analyzing and let user try again
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- RENDERING ---

  // 1. Initial Access Screen (The clean entry)
  if (!hasKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6" dir="rtl">
        <div className="bg-[#111111] border border-white/5 rounded-[32px] p-12 max-w-sm w-full text-center shadow-2xl">
          <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-4">PHOTOACTIVE</h1>
          <p className="text-slate-500 text-sm mb-10">נדרשת הגדרת מפתח API</p>
          <button 
            onClick={handleInitialSetup}
            className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-lg active:scale-95"
          >
            הגדרת מפתח מערכת
          </button>
          <div className="mt-8">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-slate-700 text-[10px] uppercase tracking-widest hover:text-blue-500">
              מידע על חיוב וחשבונות
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Workbench (The "Beautiful Model")
  return (
    <div className="min-h-screen bg-black text-white font-['Assistant'] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="h-20 px-10 flex items-center justify-between border-b border-white/5">
        <h1 className="text-xl font-black tracking-[0.2em]">PHOTOACTIVE</h1>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm">P</div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-8 lg:p-16 gap-16 items-center">
        
        {/* Left Side: Quote (Only shown when not looking at report) */}
        <div className={`flex-1 text-right transition-opacity duration-1000 ${report ? 'opacity-20 hidden lg:block' : 'opacity-100'}`}>
          <h2 className="text-3xl lg:text-5xl font-bold text-[#333] italic leading-tight select-none">
            ״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״
          </h2>
        </div>

        {/* Right Side: Interface Area */}
        <div className="w-full lg:max-w-[460px] space-y-8">
          
          {/* Upload Box */}
          <div 
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`relative aspect-square rounded-[40px] overflow-hidden bg-[#080808] border border-white/5 cursor-pointer group transition-all duration-500 shadow-2xl
              ${!selectedImage ? 'hover:border-white/10' : 'border-white/10'}`}
          >
            {selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Uploaded" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <p className="text-xs font-black uppercase tracking-[0.3em]">לחצו להעלאת צילום</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-20">
                <div className="w-10 h-10 border-2 border-white/5 border-t-white rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-black tracking-[0.4em] animate-pulse">מנתח שכבות עומק...</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])} />

          {/* Controls */}
          <div className={`space-y-4 transition-all duration-500 ${report ? 'hidden' : 'block'}`}>
            <input 
              type="text" 
              placeholder="שם הצילום (לא חובה)" 
              value={photoName}
              onChange={(e) => setPhotoName(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 text-lg font-medium focus:outline-none focus:border-white/20 transition-all"
            />
            <button 
              onClick={executeAnalysis}
              disabled={isAnalyzing || !selectedImage}
              className={`w-full py-6 rounded-[24px] font-black text-xl transition-all shadow-xl
                ${selectedImage && !isAnalyzing ? 'bg-white text-black hover:bg-slate-100 active:scale-[0.98]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}
            >
              התחל אבחון עומק
            </button>
          </div>

          {/* Report Display (Simplified & Premium) */}
          {report && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="bg-[#111] p-10 rounded-[40px] border border-white/5">
                <h2 className="text-3xl font-black mb-6">{report.finalFeedback.hook}</h2>
                <p className="text-lg text-slate-400 italic leading-relaxed">{report.initialImpression}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-[#0c0c0c] p-6 rounded-3xl border border-white/5">
                    <h4 className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2">{key}</h4>
                    <p className="text-sm font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-600/5 border border-blue-500/20 p-10 rounded-[40px] space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">כאב מערכתי</h4>
                  <p className="text-2xl font-black">{report.painProfile.name}</p>
                </div>
                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">פעולה מתקנת</h4>
                  <p className="text-xl font-bold">{report.finalFeedback.solution}</p>
                </div>
              </div>

              <button 
                onClick={() => { setReport(null); setSelectedImage(null); setPhotoName(''); }} 
                className="w-full py-4 text-xs font-black uppercase tracking-[0.4em] text-slate-600 hover:text-white transition-all"
              >
                אבחון חדש
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center opacity-5">
        <p className="text-[9px] font-black uppercase tracking-[2em]">PhotoActive Systemic Analyzer</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
