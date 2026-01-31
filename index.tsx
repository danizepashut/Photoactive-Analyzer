
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
const CameraIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a48.324 48.324 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

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

const XIcon = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// --- App Component ---
const App = () => {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [selectedImage, setSelectedImage] = useState<{base64: string, mimeType: string, previewUrl: string} | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRtl = lang === 'he';

  const t = {
    he: {
      title: "PHOTOACTIVE",
      subtitle: "אבחון עומק פוטואקטיב",
      uploadPrompt: "גררו צילום לכאן, לחצו לבחירה או צלמו",
      analyzing: "המוח הפוטואקטיבי צולל לעומק השכבות...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      openCamera: "צילום חי",
      capture: "צלם עכשיו",
      change: "החלף צילום",
      error: "חלה שגיאה בניתוח. וודאו שהתמונה ברורה ושהחיבור יציב."
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Deep Photo Diagnosis",
      uploadPrompt: "Drag photo, click to select, or use camera",
      analyzing: "Diving deep into diagnostic layers...",
      startBtn: "Start Deep Diagnosis",
      placeholder: "Title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you at that moment.”",
      reset: "New Diagnosis",
      openCamera: "Live Camera",
      capture: "Capture",
      change: "Change Photo",
      error: "Analysis error. Please check your connection and try again."
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
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
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
      // Accessing process.env.API_KEY directly as required by the platform instructions
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב של אלדד רפאלי. בצע ניתוח מערכתי חודר של 5 השכבות: טכנית, רגשית, תקשורתית, אור וזהות. החזר JSON בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli. Your diagnosis is sharp, profound, and uncompromising. You see beyond the frame into the photographer's psyche. Return ONLY valid JSON.",
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
      console.error("Analysis Error:", err);
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

  const changePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    setReport(null);
    setIsCameraActive(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#f8fafc] ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 h-20 px-8 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter cursor-pointer" onClick={reset}>{t.title}</h1>
        <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase hover:bg-white/5 transition-all">
          {lang === 'he' ? 'ENGLISH' : 'עברית'}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Interaction Column */}
        <div className="lg:col-span-4 space-y-10">
          <div className="glass p-10 rounded-[40px] shadow-2xl">
            <h2 className="text-3xl font-bold mb-3">{t.subtitle}</h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em]">Methodology by Eldad Rafaeli</p>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !selectedImage && !isCameraActive && fileInputRef.current?.click()}
            className={`relative aspect-[4/5] rounded-[56px] overflow-hidden glass border-2 transition-all duration-700 flex items-center justify-center cursor-pointer shadow-2xl ${isDragging ? 'border-blue-500 scale-[1.02] bg-blue-500/5' : ''} ${selectedImage ? 'border-white/10' : 'border-white/5 border-dashed hover:border-white/20'}`}
          >
            {isCameraActive ? (
              <div className="absolute inset-0 bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); capturePhoto(); }} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-14 py-5 rounded-full font-black shadow-2xl hover:scale-105 active:scale-95 transition-transform">
                  {t.capture}
                </button>
              </div>
            ) : selectedImage ? (
              <div className="w-full h-full relative group">
                <img src={selectedImage.previewUrl} className="w-full h-full object-cover" />
                {!report && !isAnalyzing && (
                  <button 
                    onClick={changePhoto}
                    className="absolute top-6 left-6 bg-black/60 backdrop-blur-md text-white p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-xl"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                )}
              </div>
            ) : (
              <div className="p-16 text-center flex flex-col items-center group">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-10 border border-white/10 group-hover:border-blue-500/50 transition-all">
                  <UploadIcon className="w-10 h-10 text-slate-500 group-hover:text-blue-400" />
                </div>
                <p className="font-bold text-xl opacity-60 leading-relaxed mb-10">{t.uploadPrompt}</p>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="text-blue-400 text-sm font-black border border-blue-400/30 px-12 py-4 rounded-full hover:bg-blue-400/10 transition-all">
                  {t.openCamera}
                </button>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-16 text-center">
                <LoadingIcon className="w-20 h-20 text-blue-500 mb-10" />
                <p className="font-black text-2xl animate-pulse leading-relaxed">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <canvas ref={canvasRef} className="hidden" />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-6 duration-500">
              <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder={t.placeholder} className="w-full bg-white/5 border border-white/10 rounded-[32px] p-7 focus:outline-none focus:border-blue-500 transition-all text-xl shadow-inner" />
              <button onClick={onAnalyze} className="w-full py-7 bg-white text-black rounded-[32px] font-black text-2xl hover:bg-blue-400 transition-all shadow-2xl active:scale-[0.98]">
                {t.startBtn}
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-[32px] text-red-400 text-base font-bold text-center animate-in zoom-in">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Report Column */}
        <div className="lg:col-span-8">
          {!report ? (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center glass border-dashed border-2 border-white/5 rounded-[80px] opacity-40 p-20 text-center">
              <h2 className="text-5xl md:text-7xl font-black leading-[1.1] max-w-3xl text-glow">{t.quote}</h2>
            </div>
          ) : (
            <div className="space-y-16 animate-in fade-in slide-in-from-bottom-16 duration-1000">
              {/* Main Insight */}
              <div className="glass p-16 md:p-24 rounded-[80px] border-blue-500/20 shadow-2xl bg-gradient-to-br from-blue-500/[0.05] to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] -z-10" />
                <h2 className="text-5xl md:text-8xl font-black mb-16 leading-[1] tracking-tighter text-glow">{report.finalFeedback.hook}</h2>
                <div className="flex items-start gap-6">
                  <span className="text-8xl opacity-20 font-serif -mt-6">“</span>
                  <p className="text-3xl md:text-4xl text-slate-200 italic font-medium leading-relaxed">{report.initialImpression}</p>
                </div>
              </div>

              {/* Diagnostic Layers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="glass p-12 rounded-[48px] hover:bg-white/[0.04] transition-all border-white/5 shadow-xl group">
                    <h4 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] mb-8 opacity-60 group-hover:opacity-100 transition-opacity">
                      {key === 'technical' ? 'Technical Layer' : 
                       key === 'emotional' ? 'Emotional Layer' : 
                       key === 'communication' ? 'Communication Layer' : 
                       key === 'light' ? 'Light & Shadow' : 'Identity Layer'}
                    </h4>
                    <p className="text-2xl leading-relaxed font-medium text-slate-100">{value}</p>
                  </div>
                ))}
                
                {/* Artist Profile */}
                <div className="glass p-16 rounded-[64px] md:col-span-2 border-white/10 bg-gradient-to-l from-white/[0.03] to-transparent flex flex-col md:flex-row items-center justify-between gap-16">
                  <div className="flex-1">
                    <h4 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.5em] mb-8">פרופיל אמן מאובחן</h4>
                    <p className="text-5xl font-black tracking-tight mb-4">{report.painProfile.name}</p>
                    <p className="text-slate-400 text-xl italic leading-relaxed">{report.painProfile.reason}</p>
                  </div>
                  <div className="hidden md:block w-32 h-px bg-white/10" />
                  <div className="text-center md:text-right">
                    <p className="text-[10px] uppercase font-black opacity-30 mb-3 tracking-[0.6em]">PhotoActive System</p>
                    <p className="font-mono text-sm opacity-20 tracking-widest">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Final Conclusion */}
              <div className="glass p-20 md:p-32 rounded-[96px] border-white/10 space-y-24 relative overflow-hidden shadow-[0_60px_120px_-30px_rgba(0,0,0,0.6)]">
                <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-blue-500/[0.05] blur-[180px] -z-10" />
                
                <div className="relative">
                  <h4 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.6em] mb-16">תובנה עמוקה</h4>
                  <p className="text-4xl md:text-6xl font-medium leading-[1.1] tracking-tight text-slate-100">{report.finalFeedback.insight}</p>
                </div>
                
                <div className="h-px bg-white/10" />
                
                <div className="relative">
                  <h4 className="text-[14px] font-black text-blue-400 uppercase tracking-[0.6em] mb-16">הצעה לשינוי וצמיחה</h4>
                  <p className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight text-white border-r-8 border-blue-500 pr-12">{report.finalFeedback.solution}</p>
                </div>

                <div className="pt-10 flex flex-col sm:flex-row gap-10">
                  <button onClick={reset} className="flex-1 py-8 border border-white/10 rounded-full font-black text-2xl hover:bg-white/5 transition-all active:scale-95">
                    {t.reset}
                  </button>
                  <a href="https://photoactive.co.il/" target="_blank" className="flex-[1.5] py-8 bg-blue-600 text-white rounded-full font-black text-center text-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-500 hover:scale-[1.04] active:scale-95 transition-all">
                    שיחה אישית עם אלדד
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="py-32 text-center border-t border-white/5 opacity-10">
        <p className="text-[11px] font-black uppercase tracking-[2em]">PhotoActive • Deep Systemic Diagnosis • Eldad Rafaeli</p>
      </footer>
    </div>
  );
};

// Render
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
