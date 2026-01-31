
import React, { useState, useRef, useEffect } from 'react';
import { CameraIcon, UploadIcon, LoadingIcon, XIcon } from './components/Icons';
import { geminiService } from './services/geminiService';
import { PhotoActiveAnalysis, ImageData, HistoryItem } from './types';

type Language = 'he' | 'en';

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
    sidebarDesc: "ניתוח המבוסס על חמש שכבות האבחון: טכניקה, רגש, תקשורת, אור וזהות.",
    history: "ארכיון אבחונים",
    noHistory: "אין אבחונים קודמים",
    technical: "השכבה הטכנית",
    emotional: "השכבה הרגשית",
    communication: "השכבה התקשורתית",
    light: "שכבת האור והצל",
    identity: "שכבת הזהות",
    profile: "פרופיל אמן",
    insight: "תובנה עמוקה",
    solution: "הצעה לשינוי",
    cta: "שיחה אישית עם אלדד",
    reset: "אבחון חדש"
  },
  en: {
    title: "PHOTOACTIVE",
    subtitle: "Deep Photo Diagnosis",
    methodology: "Eldad Rafaeli Methodology",
    uploadPrompt: "Drag a photo here or click to browse",
    analyzing: "Analyzing diagnostic layers...",
    startBtn: "Start Deep Diagnosis",
    placeholder: "Photo title (optional)",
    quote: "“The camera is only a mirror. And it returns what is in you at that moment.”",
    sidebarDesc: "Analysis based on the five diagnostic layers: technical, emotional, communication, light, and identity.",
    history: "Analysis Archive",
    noHistory: "No past records",
    technical: "Technical Layer",
    emotional: "Emotional Layer",
    communication: "Communication Layer",
    light: "Light & Shadow",
    identity: "Identity Layer",
    profile: "Artist Profile",
    insight: "Deep Insight",
    solution: "Proposed Solution",
    cta: "Talk with Eldad",
    reset: "New Diagnosis"
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('he');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [photoName, setPhotoName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<PhotoActiveAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRtl = lang === 'he';
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('photoactive_v2_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (newReport: PhotoActiveAnalysis, img: ImageData) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      name: photoName || (isRtl ? "ללא שם" : "Untitled"),
      timestamp: Date.now(),
      report: newReport,
      image: img,
      lang
    };
    const updated = [item, ...history].slice(0, 15);
    setHistory(updated);
    localStorage.setItem('photoactive_v2_history', JSON.stringify(updated));
  };

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

  const onAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await geminiService.analyzePhoto(selectedImage, lang, photoName);
      setReport(res);
      saveToHistory(res, selectedImage);
    } catch (e) {
      console.error(e);
      alert("Error analyzing photo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setReport(null);
    setPhotoName('');
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-[#f8fafc] selection:bg-blue-500/30 font-sans ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
              <CameraIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">{t.title}</h1>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{t.methodology}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white/5 p-1 rounded-full border border-white/10 text-[10px] font-bold">
              <button onClick={() => setLang('he')} className={`px-3 py-1.5 rounded-full transition-all ${lang === 'he' ? 'bg-white text-black' : 'text-slate-400'}`}>HE</button>
              <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-full transition-all ${lang === 'en' ? 'bg-white text-black' : 'text-slate-400'}`}>EN</button>
            </div>
            {selectedImage && (
              <button onClick={reset} className="text-slate-400 hover:text-white transition-colors">
                <XIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Col - Interaction */}
        <div className="lg:col-span-4 space-y-8">
          <section className="glass p-8 rounded-[32px] border-white/10">
            <h2 className="text-2xl font-bold mb-3">{t.subtitle}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{t.sidebarDesc}</p>
          </section>

          <div 
            className={`group relative aspect-[4/5] rounded-[40px] overflow-hidden glass border-2 transition-all duration-500 ${isAnalyzing ? 'border-blue-500 animate-pulse' : 'border-white/5 hover:border-white/20'}`}
            onClick={() => !selectedImage && fileInputRef.current?.click()}
          >
            {selectedImage ? (
              <img src={selectedImage.previewUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center cursor-pointer">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                  <UploadIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-400" />
                </div>
                <p className="font-bold text-lg mb-2">{t.uploadPrompt}</p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <LoadingIcon className="w-12 h-12 text-blue-500 mb-6" />
                <p className="font-bold text-xl">{t.analyzing}</p>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {selectedImage && !report && !isAnalyzing && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
              <input 
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-lg focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button 
                onClick={onAnalyze}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-xl hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98]"
              >
                {t.startBtn}
              </button>
            </div>
          )}

          {/* History */}
          <section className="glass p-6 rounded-[32px] border-white/5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">{t.history}</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {history.length === 0 ? <p className="text-slate-600 italic text-sm">{t.noHistory}</p> : history.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5 group"
                  onClick={() => { setReport(item.report); setSelectedImage(item.image); setPhotoName(item.name); }}
                >
                  <img src={item.image.previewUrl} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Col - Results */}
        <div className="lg:col-span-8">
          {!report ? (
            <div className="h-full flex flex-col justify-center items-center p-12 glass border-dashed border-2 border-white/5 rounded-[48px] opacity-40">
              <h2 className="text-3xl md:text-5xl font-black text-center mb-8 leading-tight">{t.quote}</h2>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Hook Card */}
              <div className="glass p-12 md:p-16 rounded-[48px] border-blue-500/20 bg-gradient-to-br from-blue-500/[0.03] to-transparent shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] pointer-events-none" />
                <span className="inline-block px-4 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black tracking-widest uppercase mb-8">EL'DAD INSIGHT</span>
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1]">{report.finalFeedback.hook}</h2>
                <p className="text-xl md:text-2xl text-slate-300 italic font-medium">“{report.initialImpression}”</p>
              </div>

              {/* Layers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-8 rounded-[32px] border-white/5 hover:bg-white/[0.02] transition-colors">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t.technical} · {report.layers.technical.score}/10</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.layers.technical.pros.map((p, i) => <span key={i} className="text-[11px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold">{p}</span>)}
                    {report.layers.technical.cons.map((c, i) => <span key={i} className="text-[11px] bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full font-bold">{c}</span>)}
                  </div>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 hover:bg-white/[0.02] transition-colors">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t.emotional}</h4>
                  <p className="text-xl font-bold mb-2">{report.layers.emotional.feeling}</p>
                  <p className="text-sm text-slate-400 italic">“{report.layers.emotional.depth}”</p>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 hover:bg-white/[0.02] transition-colors">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t.communication}</h4>
                  <p className="text-xl font-bold mb-2">{report.layers.communication.story}</p>
                  <p className="text-sm text-slate-400">POV: {report.layers.communication.pov}</p>
                </div>

                <div className="glass p-8 rounded-[32px] border-white/5 hover:bg-white/[0.02] transition-colors">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t.light}</h4>
                  <p className="text-xl font-bold mb-2">{report.layers.light.type}</p>
                  <p className="text-sm text-slate-400">{report.layers.light.description}</p>
                </div>

                <div className="glass p-10 rounded-[32px] border-white/5 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-8 bg-white/[0.01]">
                   <div className="flex-1">
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{t.identity}</h4>
                    <p className="text-2xl font-black mb-4">{report.layers.identity.signature}</p>
                    <p className="text-lg text-slate-400 italic">“{report.layers.identity.uniqueness}”</p>
                   </div>
                   <div className="bg-white text-black p-8 rounded-[32px] min-w-[240px] text-center shadow-2xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] block mb-2 opacity-50">{t.profile}</span>
                    <p className="text-2xl font-black">{report.painProfile.name}</p>
                   </div>
                </div>
              </div>

              {/* Deep Analysis & Solution */}
              <div className="glass p-12 md:p-20 rounded-[64px] border-white/10 space-y-12">
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">{t.insight}</h4>
                  <p className="text-2xl md:text-4xl font-medium leading-snug">{report.finalFeedback.insight}</p>
                </div>
                <div className="h-px bg-white/5" />
                <div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8">{t.solution}</h4>
                  <p className="text-2xl md:text-4xl font-medium leading-snug mb-12">{report.finalFeedback.solution}</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="https://photoactive.co.il/" target="_blank" className="flex-1 py-5 bg-blue-500 text-white rounded-full font-black text-center text-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      {t.cta}
                    </a>
                    <button onClick={reset} className="flex-1 py-5 bg-white/5 border border-white/10 text-white rounded-full font-black text-xl hover:bg-white/10 transition-all">
                      {t.reset}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="py-20 text-center border-t border-white/5 opacity-30">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">PhotoActive • Systemic Photo Diagnosis • Eldad Rafaeli</p>
      </footer>
    </div>
  );
};

export default App;
