
import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
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
const UploadIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 3 3m-3-3v12.75" />
  </svg>
);

const LoadingIcon = ({ className = "w-6 h-6" }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const App = () => {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [selectedImage, setSelectedImage] = useState<{base64: string, mimeType: string, previewUrl: string} | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRtl = lang === 'he';

  const t = {
    he: {
      title: "PHOTOACTIVE",
      subtitle: "אבחון עומק פוטואקטיב",
      uploadPrompt: "גררו צילום לכאן או לחצו לבחירה",
      analyzing: "המוח הפוטואקטיבי צולל לעומק השכבות (חשיבה עמוקה מקסימלית)...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      openCamera: "צילום חי",
      capture: "צלם עכשיו",
      error: "חלה שגיאה בניתוח. ייתכן שהתמונה נחסמה מטעמי בטיחות או שישנה בעיית תקשורת זמנית."
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Deep Photo Diagnosis",
      uploadPrompt: "Drag photo here or click to select",
      analyzing: "Diving deep into diagnostic layers (Max Deep Thinking active)...",
      startBtn: "Start Deep Diagnosis",
      placeholder: "Title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you at that moment.”",
      reset: "New Diagnosis",
      openCamera: "Live Camera",
      capture: "Capture",
      error: "Analysis error. The image might have been flagged or there's a connection issue."
    }
  }[lang];

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        base64: reader.result as string,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      });
      setReport(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("גישה למצלמה נדחתה.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      setSelectedImage({ base64, mimeType: 'image/jpeg', previewUrl: base64 });
      const stream = video.srcObject as MediaStream;
      if (stream) stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
      setError(null);
    }
  };

  const onAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      // Access API key safely via window.process
      const apiKey = (window as any).process?.env?.API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      
      // Using gemini-3-pro-preview for ABSOLUTE depth
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. ניתוח פילוסופי ומערכתי חודר של 5 השכבות: טכנית, רגשית, תקשורתית, אור וזהות. החזר JSON בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli. Your diagnosis is sharp, profound, and uncompromising. See beyond the surface. Analyze the photographer's psyche. Return ONLY valid JSON.",
          responseMimeType: "application/json",
          // Maximum thinking budget for the deepest possible logic
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
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "reason"]
              },
              finalFeedback: {
                type: Type.OBJECT,
                properties: {
                  hook: { type: Type.STRING },
                  insight: { type: Type.STRING },
                  solution: { type: Type.STRING }
                },
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
      console.error("Deep Analysis Error:", err);
      // If the error message mentions "entity not found", it might be a model availability issue
      if (err.message?.includes("entity was not found")) {
        setError("המודל Gemini 3 Pro אינו זמין כרגע במפתח זה. וודא שהמפתח תומך במודלים אלו.");
      } else {
        setError(t.error);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setReport(null);
    setPhotoName('');
    setIsCameraActive(false);
    setError(null);
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#f8fafc] ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 h-20 px-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter cursor-pointer" onClick={reset}>{t.title}</h1>
        <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-all">
          {lang === 'he' ? 'ENGLISH VIEW' : 'תצוגה בעברית'}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[32px] shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">{t.subtitle}</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Deep Systemic Analysis</p>
          </div>

          <div 
            onClick={() => !selectedImage && !isCameraActive && fileInputRef.current?.click()}
            className={`relative aspect-[4/5] rounded-[48px] overflow-hidden glass border-2 transition-all duration-700 flex items-center justify-center cursor-pointer shadow-2xl ${selectedImage ? 'border-white/10' : 'border-white/5 border-dashed hover:border-white/20'}`}
          >
            {isCameraActive ? (
              <div className="absolute inset-0 bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); capturePhoto(); }} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-4 rounded-full font-black shadow-2xl hover:scale-105 active:scale-95 transition-transform">
                  {t.capture}
                </button>
              </div>
            ) : selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="p-12 text-center flex flex-col items-center group">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 group-hover:border-blue-500/50 transition-all">
                  <UploadIcon className="w-8 h-8 text-slate-500 group-hover:text-blue-400" />
                </div>
                <p className="font-bold text-xl opacity-60 leading-relaxed mb-8">{t.uploadPrompt}</p>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="text-blue-400 text-sm font-black border border-blue-400/30 px-10 py-3 rounded-full hover:bg-blue-400/10 transition-all">
                  {t.openCamera}
                </button>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center">
                <LoadingIcon className="w-16 h-16 text-blue-500 mb-8" />
                <p className="font-black text-xl animate-pulse leading-relaxed">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <canvas ref={canvasRef} className="hidden" />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder={t.placeholder} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 focus:outline-none focus:border-blue-500 transition-all text-lg shadow-inner" />
              <button onClick={onAnalyze} className="w-full py-6 bg-white text-black rounded-3xl font-black text-2xl hover:bg-blue-400 transition-all shadow-2xl active:scale-[0.98]">
                {t.startBtn}
              </button>
            </div>
          )}

          {error && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold text-center animate-in zoom-in">
              {error}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 h-full">
          {!report ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass border-dashed border-2 border-white/5 rounded-[64px] opacity-30 p-16 text-center">
              <h2 className="text-4xl md:text-6xl font-black leading-[1.1] max-w-2xl text-glow">{t.quote}</h2>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="glass p-12 md:p-20 rounded-[64px] border-blue-500/20 shadow-2xl bg-gradient-to-br from-blue-500/[0.04] to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[120px] -z-10" />
                <h2 className="text-4xl md:text-7xl font-black mb-12 leading-[1] tracking-tighter">{report.finalFeedback.hook}</h2>
                <div className="flex items-start gap-4">
                  <span className="text-6xl opacity-20 font-serif -mt-4">“</span>
                  <p className="text-2xl md:text-3xl text-slate-300 italic font-medium leading-relaxed">{report.initialImpression}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="glass p-10 rounded-[40px] hover:bg-white/[0.03] transition-all border-white/5 shadow-lg group">
                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      {key === 'technical' ? 'Technical Layer' : 
                       key === 'emotional' ? 'Emotional Layer' : 
                       key === 'communication' ? 'Communication Layer' : 
                       key === 'light' ? 'Light & Shadow' : 'Identity Layer'}
                    </h4>
                    <p className="text-xl leading-relaxed font-medium">{value}</p>
                  </div>
                ))}
                
                <div className="glass p-12 rounded-[48px] md:col-span-2 border-white/10 bg-gradient-to-l from-white/[0.02] to-transparent flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="flex-1 text-center md:text-right">
                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-6">פרופיל אמן מאובחן</h4>
                    <p className="text-4xl font-black tracking-tight mb-2">{report.painProfile.name}</p>
                    <p className="text-slate-400 text-lg italic">{report.painProfile.reason}</p>
                  </div>
                </div>
              </div>

              <div className="glass p-16 md:p-24 rounded-[80px] border-white/10 space-y-20 relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[150px] -z-10" />
                
                <div className="relative">
                  <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12">תובנה עמוקה</h4>
                  <p className="text-3xl md:text-5xl font-medium leading-[1.15] tracking-tight">{report.finalFeedback.insight}</p>
                </div>
                
                <div className="h-px bg-white/10" />
                
                <div className="relative">
                  <h4 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] mb-12">הצעה לשינוי וצמיחה</h4>
                  <p className="text-3xl md:text-5xl font-black leading-[1.15] tracking-tight text-white border-r-4 border-blue-500 pr-8">{report.finalFeedback.solution}</p>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-8">
                  <button onClick={reset} className="flex-1 py-7 border border-white/10 rounded-full font-black text-xl hover:bg-white/5 transition-all active:scale-95">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-7 bg-blue-600 text-white rounded-full font-black text-center text-xl shadow-2xl shadow-blue-500/20 hover:bg-blue-500 hover:scale-[1.03] active:scale-95 transition-all">
                    שיחה אישית עם אלדד
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-24 text-center border-t border-white/5 opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[1.5em]">PhotoActive • Deep Systemic Diagnosis • Eldad Rafaeli</p>
      </footer>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
