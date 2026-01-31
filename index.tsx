
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
interface PhotoActiveAnalysis {
  initialImpression: string;
  layers: {
    technical: { score: number; pros: string[]; cons: string[] };
    emotional: { feeling: string; depth: string };
    communication: { story: string; pov: string };
    light: { type: string; description: string };
    identity: { signature: string; uniqueness: string };
  };
  painProfile: { name: string; reason: string };
  finalFeedback: { hook: string; insight: string; solution: string };
}

interface ImageData {
  base64: string;
  mimeType: string;
  previewUrl: string;
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
const App: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<PhotoActiveAnalysis | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const t = {
    he: {
      title: "PHOTOACTIVE",
      subtitle: "אבחון עומק פוטואקטיב",
      uploadPrompt: "גררו צילום לכאן או לחצו לבחירה",
      analyzing: "מנתח שכבות...",
      startBtn: "התחל אבחון",
      reset: "אבחון חדש",
      cta: "לאתר פוטואקטיב"
    },
    en: {
      title: "PHOTOACTIVE",
      subtitle: "Deep Diagnosis",
      uploadPrompt: "Drag photo here or click to select",
      analyzing: "Analyzing...",
      startBtn: "Start Diagnosis",
      reset: "New Diagnosis",
      cta: "Website"
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
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      setIsCameraActive(false);
    }
  };

  const onAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: selectedImage.base64.split(',')[1], mimeType: selectedImage.mimeType } },
            { text: `בצע אבחון פוטואקטיבי לצילום: ${photoName || 'ללא שם'}. החזר JSON בערבית או עברית בהתאם לשפה.` }
          ]
        },
        config: {
          systemInstruction: "You are Eldad Rafaeli, a legendary photographer. Use PhotoActive methodology. Return JSON ONLY.",
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      setReport(JSON.parse(response.text));
    } catch (e) {
      console.error(e);
      alert("שגיאה בניתוח.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`min-h-screen p-4 md:p-8 flex flex-col items-center bg-[#050505] text-white`} dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <h1 className="text-3xl font-black tracking-tighter">{t.title}</h1>
        <button onClick={() => setLang(lang === 'he' ? 'en' : 'he')} className="text-xs font-bold border border-white/20 px-4 py-2 rounded-full">
          {lang === 'he' ? 'ENGLISH' : 'עברית'}
        </button>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div 
            onClick={() => !selectedImage && fileInputRef.current?.click()}
            className={`aspect-[4/5] glass rounded-[32px] overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all border-2 ${isAnalyzing ? 'border-blue-500 animate-pulse' : 'border-white/5 hover:border-white/20'}`}
          >
            {selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-8">
                <UploadIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold opacity-60">{t.uploadPrompt}</p>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                <LoadingIcon className="w-10 h-10 mb-4" />
                <p className="font-bold">{t.analyzing}</p>
              </div>
            )}
          </div>
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4">
              <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder="שם הצילום..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-blue-500" />
              <button onClick={onAnalyze} className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl">{t.startBtn}</button>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {!report ? (
            <div className="h-full glass rounded-[32px] p-12 flex items-center justify-center opacity-30 border-dashed border-2">
              <p className="text-2xl font-bold text-center italic">"המצלמה היא רק מראה..."</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="glass p-8 rounded-[32px] border-blue-500/30">
                <h2 className="text-3xl font-black mb-4">{report.finalFeedback.hook}</h2>
                <p className="text-xl opacity-80 leading-relaxed italic">"{report.initialImpression}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(report.layers).map(([key, layer]: [string, any]) => (
                  <div key={key} className="glass p-6 rounded-2xl">
                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">{key}</span>
                    <p className="font-bold text-lg mt-1">{layer.feeling || layer.type || layer.story || `${layer.score}/10`}</p>
                  </div>
                ))}
              </div>

              <div className="glass p-8 rounded-[32px] space-y-6">
                <div>
                  <h3 className="text-xs font-black opacity-40 mb-2 uppercase">תובנה</h3>
                  <p className="text-xl leading-snug">{report.finalFeedback.insight}</p>
                </div>
                <div className="h-px bg-white/5" />
                <div>
                  <h3 className="text-xs font-black opacity-40 mb-2 uppercase">פתרון</h3>
                  <p className="text-xl leading-snug">{report.finalFeedback.solution}</p>
                </div>
                <button onClick={() => setReport(null)} className="w-full py-4 border border-white/10 rounded-xl font-bold mt-4">{t.reset}</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
