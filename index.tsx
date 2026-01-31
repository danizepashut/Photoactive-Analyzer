
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-40">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 3 3m-3-3v12.75" />
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
      subtitle: "אבחון עומק פוטואקטיב",
      uploadPrompt: "גררו צילום לכאן או לחצו לבחירה",
      analyzing: "המוח הפוטואקטיבי צולל לעומק השכבות...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      change: "החלף צילום",
      error: "חלה שגיאה בניתוח. וודאו שהגדרתם API Key תקין ושהתמונה ברורה."
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Deep Photo Diagnosis",
      uploadPrompt: "Drag a photo here or click to select",
      analyzing: "Diving deep into diagnostic layers...",
      startBtn: "Start Deep Diagnosis",
      placeholder: "Photo title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you at that moment.”",
      reset: "New Diagnosis",
      change: "Change Photo",
      error: "Analysis error. Please check your API key and image clarity."
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
      // Accessing process.env.API_KEY safely
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API Key is missing from environment.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. בצע ניתוח מערכתי חודר של 5 השכבות: טכנית, רגשית, תקשורתית, אור וזהות. החזר תגובה בפורמט JSON בלבד בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli, a world-class systemic photo analyst. Your tone is professional, deep, and uncompromising. You see beyond the technical into the psychological layers of the creator. Return ONLY a valid JSON object.",
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 32768 },
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
      setErrorMessage(err.message.includes("API Key") ? "מפתח API חסר או לא תקין. וודא שהוא מוגדר בהגדרות הפרויקט." : t.error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="h-20 px-8 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-50">
        <h1 className="text-2xl font-black tracking-tighter tracking-widest">{t.title}</h1>
        <button 
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          className="px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-colors"
        >
          {lang === 'he' ? 'English' : 'עברית'}
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-8">
          <div className="glass p-8 rounded-[32px]">
            <h2 className="text-2xl font-bold mb-1">{t.subtitle}</h2>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">Methodology by Eldad Rafaeli</p>
          </div>

          <div 
            className={`photo-frame relative aspect-[4/5] glass rounded-[48px] overflow-hidden flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer
              ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/5'}
              ${selectedImage ? 'border-solid' : 'hover:border-white/20'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <div className="w-full h-full relative group">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setReport(null); }}
                  className="absolute top-6 left-6 w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                  title={t.change}
                >
                  <XMarkIcon />
                </button>
              </div>
            ) : (
              <div className="text-center p-12 space-y-6">
                <UploadIcon />
                <p className="text-lg font-medium opacity-60 max-w-[200px] mx-auto leading-relaxed">{t.uploadPrompt}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                <p className="text-xl font-bold animate-pulse">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
          />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <input 
                type="text"
                placeholder={t.placeholder}
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-blue-500 transition-colors text-lg"
              />
              <button 
                onClick={onAnalyze}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-400 transition-all shadow-xl active:scale-[0.98]"
              >
                {t.startBtn}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold text-center animate-in zoom-in">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Right Column: Report */}
        <div className="lg:col-span-7">
          {!report ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass rounded-[60px] p-12 text-center opacity-30 border-dashed border-2 border-white/5">
              <h3 className="text-4xl md:text-6xl font-black leading-tight max-w-2xl text-glow">{t.quote}</h3>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
              {/* Main Insight */}
              <div className="glass p-12 rounded-[60px] border-blue-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -z-10" />
                <h2 className="text-4xl md:text-7xl font-black mb-10 leading-none tracking-tighter text-glow">{report.finalFeedback.hook}</h2>
                <p className="text-2xl md:text-3xl text-slate-300 italic font-medium leading-relaxed border-r-4 border-white/10 pr-8">{report.initialImpression}</p>
              </div>

              {/* Diagnostic Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="glass p-8 rounded-[32px] hover:bg-white/5 transition-colors group">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4 opacity-50 group-hover:opacity-100">
                      {key === 'technical' ? 'Layer 01: Technical' : 
                       key === 'emotional' ? 'Layer 02: Emotional' : 
                       key === 'communication' ? 'Layer 03: Comm' : 
                       key === 'light' ? 'Layer 04: Light' : 'Layer 05: Identity'}
                    </h4>
                    <p className="text-xl leading-relaxed font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {/* Pain & Solution */}
              <div className="glass p-12 rounded-[60px] border-white/10 space-y-12 shadow-2xl">
                <div>
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-6">פרופיל אבחוני</h4>
                  <p className="text-4xl font-black mb-2">{report.painProfile.name}</p>
                  <p className="text-xl text-slate-400 leading-relaxed italic">{report.painProfile.reason}</p>
                </div>
                
                <div className="h-px bg-white/10" />

                <div>
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-6">הצעה לשינוי מערכתי</h4>
                  <p className="text-3xl font-bold leading-tight text-white">{report.finalFeedback.solution}</p>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => { setSelectedImage(null); setReport(null); }} className="flex-1 py-6 border border-white/10 rounded-3xl font-black text-lg hover:bg-white/5 transition-all">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-6 bg-blue-600 text-white rounded-3xl font-black text-center text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20">
                    שיחה עם אלדד
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-12 text-center opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[2em]">PhotoActive System • v2.5</p>
      </footer>
    </div>
  );
};

// Render
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
