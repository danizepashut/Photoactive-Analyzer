export interface PhotoActiveAnalysis {
  initialImpression: string;
  layers: {
    technical: { score: number; pros: string[]; cons: string[] };
    emotional: { feeling: string; depth: string };
    communication: { story: string; pov: string };
    light: { type: string; description: string };
    identity: { signature: string; uniqueness: string };
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

export interface ImageData {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  report: PhotoActiveAnalysis;
  image: ImageData;
  lang: 'he' | 'en';
}
