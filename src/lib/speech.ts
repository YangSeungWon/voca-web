export class SpeechService {
  private static instance: SpeechService;
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  
  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }
  
  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }
  
  private loadVoices(): void {
    if (!this.synthesis) return;
    
    const loadVoicesList = () => {
      this.voices = this.synthesis!.getVoices();
      // Prefer US English voice
      this.selectedVoice = this.voices.find(voice => 
        voice.lang === 'en-US' && voice.name.includes('Google')
      ) || this.voices.find(voice => 
        voice.lang === 'en-US'
      ) || this.voices.find(voice => 
        voice.lang.startsWith('en')
      ) || this.voices[0];
    };
    
    loadVoicesList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoicesList;
    }
  }
  
  public speak(text: string, rate: number = 0.9): void {
    if (!this.synthesis || !text) return;
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    this.synthesis.speak(utterance);
  }
  
  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
  
  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
  
  public setVoice(voiceName: string): void {
    const voice = this.voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
    }
  }
  
  public isSupported(): boolean {
    return this.synthesis !== null;
  }
}

// Convenience function
export const speak = (text: string, rate?: number): void => {
  SpeechService.getInstance().speak(text, rate);
};