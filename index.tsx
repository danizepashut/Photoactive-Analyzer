
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

// --- App Component ---
const App = () => {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [selectedImage, setSelectedImage] = useState<{base64: string, mimeType: string, previewUrl: string} | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Fix: Added explicit type to report state to prevent type inference issues during rendering
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isRtl = lang === 'he';

  const t = {
    he: {
      title: "PHOTOACTIVE",
      subtitle: "אבחון עומק פוטואקטיב",
      uploadPrompt: "גררו צילום לכאן או לחצו לבחירה",
      analyzing: "מנתח שכבות אבחון...",
      startBtn: "התחל אבחון עומק",
      placeholder: "שם הצילום (לא חובה)",
      quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
      reset: "אבחון חדש",
      openCamera: "צילום חי",
      capture: "צלם עכשיו"
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Deep Diagnosis",
      uploadPrompt: "Drag photo here or click to select",
      analyzing: "Analyzing layers...",
      startBtn: "Start Diagnosis",
      placeholder: "Title (optional)",
      quote: "“The camera is only a mirror. It returns what is in you.”",
      reset: "New Diagnosis",
      openCamera: "Live Camera",
      capture: "Capture"
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
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("גישה למצלמה נדחתה.");
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
    }
  };

  const onAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      // Corrected: Initializing GoogleGenAI with apiKey from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `אבחן את הצילום "${photoName || 'ללא שם'}" לפי מתודולוגיית פוטואקטיב (5 שכבות). השתמש בשפה חדה, פואטית ואותנטית. החזר JSON בעברית.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli. Be direct, profound, and systemic. Use PhotoActive methodology. Analyze Technical, Emotional, Communication, Light, and Identity layers. Return strictly valid JSON.",
          responseMimeType: "application/json",
          // Corrected: Using thinkingConfig with a reasonable budget for deep multimodal analysis
          thinkingConfig: { thinkingBudget: 20000 },
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

      // Corrected: Accessing response content directly via .text property
      const result = JSON.parse(response.text || '{}');
      setReport(result);
    } catch (err) {
      console.error("Analysis Error:", err);
      alert("שגיאה בניתוח התמונה. נסה שוב או בדוק חיבור.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#f8fafc] ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <h1 className="text-xl font-black">{t.title}</h1>
        <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase">
          {lang === 'he' ? 'EN' : 'HE'}
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[32px]">
            <h2 className="text-2xl font-bold">{t.subtitle}</h2>
          </div>

          <div 
            onClick={() => !selectedImage && !isCameraActive && fileInputRef.current?.click()}
            className={`relative aspect-[4/5] rounded-[40px] overflow-hidden glass border-2 transition-all flex items-center justify-center cursor-pointer ${selectedImage ? 'border-white/10' : 'border-white/5 border-dashed hover:border-white/20'}`}
          >
            {isCameraActive ? (
              <div className="absolute inset-0 bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); capturePhoto(); }} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-10 py-4 rounded-full font-black">
                  {t.capture}
                </button>
              </div>
            ) : selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="p-8 text-center flex flex-col items-center">
                <UploadIcon className="w-12 h-12 text-slate-500 mb-4" />
                <p className="font-bold opacity-60">{t.uploadPrompt}</p>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="mt-6 text-blue-400 text-xs font-black border border-blue-400/30 px-6 py-2 rounded-full hover:bg-blue-400/10">
                  {t.openCamera}
                </button>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
                <LoadingIcon className="w-12 h-12 text-blue-500 mb-4" />
                <p className="font-black">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
          <canvas ref={canvasRef} className="hidden" />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4">
              <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder={t.placeholder} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-blue-500" />
              <button onClick={onAnalyze} className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-400 transition-colors">
                {t.startBtn}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          {!report ? (
            <div className="h-full flex items-center justify-center glass border-dashed border-2 border-white/5 rounded-[48px] opacity-30 p-12">
              <h2 className="text-3xl font-black text-center leading-tight">{t.quote}</h2>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6">
              <div className="glass p-10 rounded-[40px] border-blue-500/20 shadow-2xl bg-gradient-to-br from-blue-500/[0.03] to-transparent">
                <h2 className="text-4xl font-black mb-6 leading-tight">{report.finalFeedback.hook}</h2>
                <p className="text-xl text-slate-300 italic">"{report.initialImpression}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fix: Explicitly ensuring value is a string during iteration to resolve 'unknown' ReactNode error */}
                {Object.entries(report.layers).map(([key, value]) => (
                  <div key={key} className="glass p-8 rounded-[32px] hover:bg-white/[0.02] transition-colors border-white/5">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">{key}</h4>
                    <p className="text-lg leading-relaxed">{value as string}</p>
                  </div>
                ))}
                <div className="glass p-8 rounded-[32px] md:col-span-2 border-white/5 bg-white/[0.01]">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">פרופיל אמן</h4>
                  <p className="text-2xl font-black">{report.painProfile}</p>
                </div>
              </div>

              <div className="glass p-12 rounded-[56px] border-white/10 space-y-10 shadow-2xl">
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">תובנה עמוקה</h4>
                  <p className="text-2xl md:text-3xl font-medium leading-snug">{report.finalFeedback.insight}</p>
                </div>
                <div className="h-px bg-white/5" />
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6">הצעה לשינוי</h4>
                  <p className="text-2xl md:text-3xl font-bold leading-snug text-blue-400">{report.finalFeedback.solution}</p>
                </div>
                <button onClick={() => { setSelectedImage(null); setReport(null); }} className="w-full py-5 border border-white/10 rounded-2xl font-black text-xl hover:bg-white/5">
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

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
