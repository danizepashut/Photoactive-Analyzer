
import React, { useState, useRef, useEffect } from 'react';
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
  painProfile: string;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      openCamera: "צילום חי",
      capture: "צלם עכשיו",
      error: "משהו השתבש בניתוח. ייתכן שהתמונה נחסמה מטעמי בטיחות או שישנה תקלה זמנית."
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Deep Diagnosis",
      uploadPrompt: "Drag photo here or click to select",
      analyzing: "Diving deep into the layers...",
      startBtn: "Start Diagnosis",
      placeholder: "Title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you.”",
      reset: "New Diagnosis",
      openCamera: "Live Camera",
      capture: "Capture",
      error: "Something went wrong. The photo might have been blocked for safety or there's a temporary issue."
    }
  }[lang];

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
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

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setErrorMessage("גישה למצלמה נדחתה.");
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
      setErrorMessage(null);
    }
  };

  const onAnalyze = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    setErrorMessage(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use Gemini 3 Pro for maximum reasoning depth
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. בצע ניתוח מעמיק, מערכתי ופילוסופי של 5 השכבות: טכנית, רגשית, תקשורתית, אור וצל, וזהות. החזר את התשובה ב-JSON בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli. Your diagnosis is sharp, poetic, and uncompromising. You see through the image into the soul of the photographer. Identify patterns of fear, safe choices, or moments of true presence. Return ONLY strictly valid JSON matching the schema.",
          responseMimeType: "application/json",
          // Maximum thinking budget for the deepest possible diagnosis
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
              painProfile: { type: Type.STRING },
              finalFeedback: {
                type: Type.OBJECT,
                properties: {
                  hook: { type: Type.STRING },
                  insight: { type: Type.STRING },
                  solution: { type: Type.STRING }
                }
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
      setErrorMessage(t.error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setReport(null);
    setPhotoName('');
    setIsCameraActive(false);
    setErrorMessage(null);
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#f8fafc] ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tighter cursor-pointer" onClick={reset}>{t.title}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-all">
            {lang === 'he' ? 'EN' : 'HE'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[32px] border-white/10 shadow-xl">
            <h2 className="text-2xl font-bold">{t.subtitle}</h2>
            <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">Eldad Rafaeli Methodology</p>
          </div>

          <div 
            onClick={() => !selectedImage && !isCameraActive && fileInputRef.current?.click()}
            className={`relative aspect-[4/5] rounded-[40px] overflow-hidden glass border-2 transition-all duration-700 flex items-center justify-center cursor-pointer shadow-2xl ${selectedImage ? 'border-white/10' : 'border-white/5 border-dashed hover:border-white/20'}`}
          >
            {isCameraActive ? (
              <div className="absolute inset-0 bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); capturePhoto(); }} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-12 py-4 rounded-full font-black shadow-2xl hover:scale-105 transition-transform">
                  {t.capture}
                </button>
              </div>
            ) : selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/10 transition-all">
                  <UploadIcon className="w-8 h-8 text-slate-500" />
                </div>
                <p className="font-bold opacity-60 text-lg">{t.uploadPrompt}</p>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="mt-6 text-blue-400 text-sm font-black border border-blue-400/30 px-8 py-2.5 rounded-full hover:bg-blue-400/10 transition-all">
                  {t.openCamera}
                </button>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center">
                <LoadingIcon className="w-16 h-16 text-blue-500 mb-8" />
                <p className="font-black text-xl text-center px-12 leading-relaxed animate-pulse">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <canvas ref={canvasRef} className="hidden" />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder={t.placeholder} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-blue-500 transition-all text-lg" />
              <button onClick={onAnalyze} className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-400 transition-all shadow-blue-500/20 shadow-2xl active:scale-[0.98]">
                {t.startBtn}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold leading-relaxed animate-in fade-in">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 h-full">
          {!report ? (
            <div className="h-full flex flex-col items-center justify-center glass border-dashed border-2 border-white/5 rounded-[48px] opacity-30 p-12 text-center group">
              <h2 className="text-3xl md:text-5xl font-black leading-tight max-w-2xl transition-all group-hover:opacity-100">{t.quote}</h2>
            </div>
          ) : (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              {/* Top Result Card */}
              <div className="glass p-12 md:p-16 rounded-[56px] border-blue-500/20 shadow-2xl bg-gradient-to-br from-blue-500/[0.03] to-transparent relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 blur-[100px]" />
                <h2 className="text-4xl md:text-7xl font-black mb-10 leading-[1.05] tracking-tight">{report.finalFeedback.hook}</h2>
                <div className="flex items-start gap-4">
                  <span className="text-5xl opacity-20 font-serif leading-none">“</span>
                  <p className="text-2xl md:text-3xl text-slate-300 italic font-medium leading-relaxed">{report.initialImpression}</p>
                </div>
              </div>

              {/* Grid of Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="glass p-10 rounded-[40px] hover:bg-white/[0.02] transition-all border-white/5 shadow-lg group">
                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 opacity-70 group-hover:opacity-100 transition-opacity">
                      {key === 'technical' ? 'Technical Layer' : 
                       key === 'emotional' ? 'Emotional Layer' : 
                       key === 'communication' ? 'Communication Layer' : 
                       key === 'light' ? 'Light & Shadow' : 'Identity Layer'}
                    </h4>
                    <p className="text-xl leading-relaxed font-medium">{value as string}</p>
                  </div>
                ))}
                
                <div className="glass p-10 rounded-[40px] md:col-span-2 border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex-1">
                    <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">פרופיל אמן</h4>
                    <p className="text-3xl font-black tracking-tight">{report.painProfile}</p>
                  </div>
                  <div className="h-full w-px bg-white/5 hidden md:block" />
                  <div className="text-center md:text-right">
                    <p className="text-xs uppercase font-black opacity-30 mb-2">PhotoActive Diagnosis</p>
                    <p className="font-mono text-[10px] opacity-20">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Final Insight Section */}
              <div className="glass p-16 md:p-24 rounded-[72px] border-white/10 space-y-16 shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/[0.02] blur-[120px]" />
                
                <div className="relative">
                  <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10">תובנה עמוקה</h4>
                  <p className="text-3xl md:text-5xl font-medium leading-[1.2]">{report.finalFeedback.insight}</p>
                </div>
                
                <div className="h-px bg-white/5" />
                
                <div className="relative">
                  <h4 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 text-blue-400">הצעה לשינוי</h4>
                  <p className="text-3xl md:text-5xl font-black leading-[1.2] text-white underline decoration-blue-500/30 underline-offset-8 decoration-4">{report.finalFeedback.solution}</p>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row gap-6">
                  <button onClick={reset} className="flex-1 py-6 border border-white/10 rounded-full font-black text-xl hover:bg-white/5 transition-all">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-6 bg-blue-600 text-white rounded-full font-black text-center text-xl shadow-2xl shadow-blue-500/20 hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    שיחה אישית עם אלדד
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-20 text-center border-t border-white/5 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[1em]">PhotoActive • Systemic Diagnosis • Eldad Rafaeli</p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
