
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

  // Check key on mount
  useEffect(() => {
    const checkStatus = async () => {
      // @ts-ignore
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setHasKey(true);
      }
    };
    checkStatus();
  }, []);

  const handleSetupKey = async () => {
    // @ts-ignore
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Per instructions: assume success and proceed immediately to mitigate race conditions
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
      // Create fresh instance before call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High quality reasoning for systemic analysis
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `בצע אבחון פוטואקטיבי לצילום "${photoName || 'ללא שם'}" לפי המתודולוגיה של אלדד רפאלי. 
            נתח 5 שכבות: טכנית, רגשית, תקשורתית, אור וזהות.
            זהה 'כאב מערכתי' והצע 'פעולה מתקנת'. 
            החזר תוצאה בפורמט JSON בלבד בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli. Your analysis is precise, deep, and looks for the 'systemic pain'. You provide uncompromising truth. Return ONLY valid JSON.",
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
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("entity was not found") || err.message?.includes("API key")) {
        setHasKey(false);
        setErrorMessage("יש לבחור מפתח API תקין מפרויקט בתשלום (Paid).");
      } else {
        setErrorMessage("שגיאה בניתוח: " + (err.message || "נסה שוב בעוד רגע"));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- RENDERING ---

  // 1. Initial Key Selection Screen (Matching user screenshot)
  if (!hasKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6" dir="rtl">
        <div className="bg-[#111111] border border-white/5 rounded-[32px] p-12 max-w-sm w-full text-center shadow-2xl">
          <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-4">PHOTOACTIVE</h1>
          <p className="text-slate-400 text-sm mb-10">נדרשת הגדרת מפתח API</p>
          <button 
            onClick={handleSetupKey}
            className="w-full py-4 bg-[#2563eb] text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-lg mb-8 active:scale-95"
          >
            הגדרת מפתח מערכת
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            className="text-slate-600 text-[10px] uppercase tracking-widest hover:text-blue-400 transition-colors"
          >
            מידע על חיוב וחשבונות
          </a>
        </div>
      </div>
    );
  }

  // 2. Main App Screen (Simple, effective, clean)
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col selection:bg-blue-500/30" dir="rtl">
      {/* Top Bar */}
      <nav className="h-20 px-10 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs">P</div>
          <h1 className="text-xl font-black tracking-[0.2em]">PHOTOACTIVE</h1>
        </div>
        <button 
          onClick={() => setHasKey(false)} 
          className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:text-white border border-white/10 rounded-full transition-all uppercase tracking-widest"
        >
          הגדרות חיבור
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Side: Photo Control */}
        <div className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight">אבחון מערכתי</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Methodology • Eldad Rafaeli</p>
          </div>

          <div 
            className={`relative aspect-[4/5] bg-[#0a0a0a] rounded-[56px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden shadow-2xl
              ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}
              ${selectedImage ? 'border-solid border-white/5' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative group">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }} 
                    className="p-5 bg-red-500 rounded-full shadow-2xl hover:scale-110 transition-transform"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 opacity-30 group-hover:opacity-100 transition-opacity">
                <div className="w-20 h-20 mx-auto rounded-3xl border border-white/10 flex items-center justify-center bg-white/5 mb-4">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <p className="text-2xl font-black">גררו צילום לכאן</p>
                <p className="text-xs uppercase tracking-widest">או לחצו לבחירת קובץ</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center z-50">
                <div className="w-16 h-16 border-2 border-white/5 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                <p className="text-xl font-black uppercase tracking-[0.3em] animate-pulse">מנתח שכבות עומק...</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
              <input 
                type="text" 
                placeholder="שם הצילום (לא חובה)" 
                value={photoName} 
                onChange={(e) => setPhotoName(e.target.value)} 
                className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 text-xl font-bold focus:border-blue-500 outline-none transition-all"
              />
              <button 
                onClick={onAnalyze} 
                className="w-full py-8 bg-white text-black rounded-3xl font-black text-2xl hover:bg-blue-600 hover:text-white transition-all shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
              >
                התחל אבחון עומק
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center font-bold animate-in zoom-in duration-300">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Side: Analysis Results */}
        <div className="lg:pt-16">
          {!report ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 border-2 border-dashed border-white/5 rounded-[56px] p-12">
              <h3 className="text-4xl font-light italic leading-tight">״המצלמה היא רק מראה. <br/> והיא מחזירה את מה שיש בך <br/> באותו רגע.״</h3>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
              {/* Headline */}
              <div className="bg-[#111] p-12 rounded-[56px] border border-white/5 shadow-2xl">
                <h2 className="text-5xl font-black mb-8 leading-tight tracking-tighter">{report.finalFeedback.hook}</h2>
                <div className="h-px bg-white/10 mb-8"></div>
                <p className="text-2xl text-slate-300 italic font-medium leading-relaxed">{report.initialImpression}</p>
              </div>

              {/* 5 Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="bg-[#0c0c0c] p-8 rounded-[40px] border border-white/5 hover:bg-white/[0.05] transition-all group">
                    <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em] mb-4 opacity-50 group-hover:opacity-100">{key} Layer</h4>
                    <p className="text-lg font-bold leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>

              {/* Pain & Solution */}
              <div className="bg-gradient-to-br from-[#111] to-black p-12 rounded-[56px] border border-white/10 space-y-12 shadow-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Systemic Pain</h4>
                    <p className="text-4xl font-black text-white">{report.painProfile.name}</p>
                    <p className="text-lg text-slate-400 italic font-medium">{report.painProfile.reason}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">The Action</h4>
                    <p className="text-3xl font-black text-white leading-tight">{report.finalFeedback.solution}</p>
                  </div>
                </div>

                <button 
                  onClick={() => { setSelectedImage(null); setReport(null); }} 
                  className="w-full py-6 border border-white/10 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  אבחון חדש
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 text-center opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[2em]">PhotoActive Systemic Analyzer • Eldad Rafaeli</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
