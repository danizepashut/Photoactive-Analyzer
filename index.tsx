
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- INTERFACES ---
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

interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  report: PhotoActiveAnalysis;
  image: ImageData;
  lang: 'he' | 'en';
}

// --- ICONS ---
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

// --- GEMINI SERVICE ---
const MODEL_NAME = 'gemini-3-pro-preview';

const getSystemInstruction = (lang: 'he' | 'en') => {
  const isHe = lang === 'he';
  return `You are Eldad Rafaeli, a legendary photographer and curator. You diagnose photographs using the "PhotoActive" methodology.
Layers: Technical (1-10), Emotional, Communication, Light & Shadow, Identity.
Response must be professional, sharp, and poetic in ${isHe ? 'Hebrew' : 'English'}. Return ONLY valid JSON.`;
};

async function analyzePhoto(image: ImageData, lang: 'he' | 'en' = 'he', photoName?: string): Promise<PhotoActiveAnalysis> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Perform a deep PhotoActive diagnosis for: ${photoName || 'Untitled'}.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { inlineData: { data: image.base64.split(',')[1], mimeType: image.mimeType } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          initialImpression: { type: Type.STRING },
          layers: {
            type: Type.OBJECT,
            properties: {
              technical: { type: Type.OBJECT, properties: { score: { type: Type.NUMBER }, pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["score", "pros", "cons"] },
              emotional: { type: Type.OBJECT, properties: { feeling: { type: Type.STRING }, depth: { type: Type.STRING } }, required: ["feeling", "depth"] },
              communication: { type: Type.OBJECT, properties: { story: { type: Type.STRING }, pov: { type: Type.STRING } }, required: ["story", "pov"] },
              light: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["type", "description"] },
              identity: { type: Type.OBJECT, properties: { signature: { type: Type.STRING }, uniqueness: { type: Type.STRING } }, required: ["signature", "uniqueness"] }
            },
            required: ["technical", "emotional", "communication", "light", "identity"]
          },
          painProfile: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["name", "reason"] },
          finalFeedback: { type: Type.OBJECT, properties: { hook: { type: Type.STRING }, insight: { type: Type.STRING }, solution: { type: Type.STRING } }, required: ["hook", "insight", "solution"] }
        },
        required: ["initialImpression", "layers", "painProfile", "finalFeedback"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("API Failure");
  return JSON.parse(text.trim());
}

// --- APP ---
const translations = {
  he: {
    title: "PHOTOACTIVE",
    subtitle: "אבחון עומק פוטואקטיב",
    methodology: "מתודולוגיית אלדד רפאלי",
    uploadPrompt: "גררו צילום לכאן או לחצו לבחירה",
    analyzing: "המוח הפוטואקטיבי מנתח את השכבות...",
    startBtn: "התחל אבחון עומק",
    placeholder: "שם הצילום (לא חובה)",
    quote: "״המצלמה היא רק מראה. והיא מחזירה את מה שיש בך באותו רגע.״",
    history: "ארכיון אבחונים",
    noHistory: "אין אבחונים קודמים",
    openCamera: "צילום חי מהמצלמה",
    capture: "צלם עכשיו"
  },
  en: {
    title: "PHOTOACTIVE",
    subtitle: "Deep Diagnosis",
    methodology: "Eldad Rafaeli Methodology",
    uploadPrompt: "Drag photo here or click to select",
    analyzing: "Analyzing diagnostic layers...",
    startBtn: "Start Deep Diagnosis",
    placeholder: "Photo title (optional)",
    quote: "“The camera is only a mirror.”",
    history: "Archive",
    noHistory: "No history",
    openCamera: "Live Camera",
    capture: "Capture"
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<PhotoActiveAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isRtl = lang === 'he';
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('photoactive_history_v3');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      setSelectedImage({ base64, mimeType: 'image/jpeg', previewUrl: base64 });
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const onAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzePhoto(selectedImage, lang, photoName);
      setReport(res);
      const item = { id: Date.now().toString(), name: photoName || "Untitled", timestamp: Date.now(), report: res, image: selectedImage, lang };
      const updated = [item, ...history].slice(0, 15);
      setHistory(updated);
      localStorage.setItem('photoactive_history_v3', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
      alert("Error.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setReport(null);
    setPhotoName('');
    setIsCameraActive(false);
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#f8fafc] font-sans ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={reset}>
          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
            <CameraIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-xl font-black">{t.title}</h1>
        </div>
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 text-[10px] font-bold">
          <button onClick={() => setLang('he')} className={`px-3 py-1.5 rounded-full ${lang === 'he' ? 'bg-white text-black' : 'text-slate-400'}`}>HE</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-full ${lang === 'en' ? 'bg-white text-black' : 'text-slate-400'}`}>EN</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[32px] border-white/10">
            <h2 className="text-2xl font-bold mb-3">{t.subtitle}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{t.methodology}</p>
          </div>

          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !selectedImage && !isCameraActive && fileInputRef.current?.click()}
            className={`group relative aspect-[4/5] rounded-[40px] overflow-hidden glass border-2 transition-all cursor-pointer ${isDragging ? 'drag-over' : 'border-white/5'} ${isAnalyzing ? 'animate-pulse' : ''}`}
          >
            {isCameraActive ? (
              <div className="absolute inset-0 bg-black flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button onClick={(e) => { e.stopPropagation(); capturePhoto(); }} className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-full font-black">{t.capture}</button>
              </div>
            ) : selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <UploadIcon className="w-12 h-12 text-slate-500 mb-6 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-lg">{t.uploadPrompt}</p>
                <button onClick={(e) => { e.stopPropagation(); startCamera(); }} className="mt-6 text-blue-400 text-sm border border-blue-400/30 px-6 py-2 rounded-full hover:bg-blue-400/10 transition-colors">
                  {t.openCamera}
                </button>
              </div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <LoadingIcon className="w-12 h-12 text-blue-500 mb-6" />
                <p className="font-bold text-xl">{t.analyzing}</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4">
              <input value={photoName} onChange={(e) => setPhotoName(e.target.value)} placeholder={t.placeholder} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-lg focus:outline-none focus:border-blue-500" />
              <button onClick={onAnalyze} className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-400 transition-all">{t.startBtn}</button>
            </div>
          )}

          <section className="glass p-6 rounded-[32px]">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">{t.history}</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {history.length === 0 ? <p className="text-slate-600 italic text-sm">{t.noHistory}</p> : history.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer" onClick={() => { setReport(item.report); setSelectedImage(item.image); setPhotoName(item.name); }}>
                  <img src={item.image.previewUrl} className="w-12 h-12 rounded-lg object-cover" />
                  <p className="font-bold text-sm truncate">{item.name}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          {!report ? (
            <div className="h-full flex flex-col justify-center items-center p-12 glass border-dashed border-2 border-white/5 rounded-[48px] opacity-40">
              <h2 className="text-3xl md:text-5xl font-black text-center mb-8">{t.quote}</h2>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="glass p-12 rounded-[48px] border-blue-500/20 shadow-2xl">
                <h2 className="text-4xl font-black mb-8 leading-[1.1]">{report.finalFeedback.hook}</h2>
                <p className="text-xl text-slate-300 italic">“{report.initialImpression}”</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(report.layers).map(([key, layer]: [string, any]) => (
                  <div key={key} className="glass p-8 rounded-[32px]">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase mb-6">{key}</h4>
                    <p className="text-lg font-bold">{layer.feeling || layer.type || layer.story || `${layer.score}/10`}</p>
                    <p className="text-sm text-slate-400 mt-2">{layer.depth || layer.description || layer.pov}</p>
                  </div>
                ))}
              </div>

              <div className="glass p-12 rounded-[64px] space-y-12">
                <div><h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8">INSIGHT</h4><p className="text-2xl md:text-4xl">{report.finalFeedback.insight}</p></div>
                <div className="h-px bg-white/5" />
                <div><h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-8">SOLUTION</h4><p className="text-2xl md:text-4xl mb-12">{report.finalFeedback.solution}</p>
                  <button onClick={reset} className="w-full py-5 bg-white text-black rounded-full font-black text-xl">אבחון חדש</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
