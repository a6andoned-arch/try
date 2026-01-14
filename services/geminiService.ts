import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import { Message } from "../types";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from "../utils/audioUtils";

/**
 * Access the API Key exclusively from process.env.API_KEY.
 * In a Vite environment, this is injected by the 'define' block in vite.config.ts.
 */
const getApiKey = () => {
  return process.env.API_KEY;
};

const createClient = () => {
  const key = getApiKey();
  if (!key) {
    console.error("Gemini API Key is missing. Ensure process.env.API_KEY is defined.");
  }
  return new GoogleGenAI({ apiKey: key || '' });
};

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  image?: string
): Promise<string> => {
  const ai = createClient();
  try {
    const parts: any[] = [];
    if (image) {
      const cleanBase64 = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      parts.push({
        inlineData: { data: cleanBase64, mimeType: "image/jpeg" }
      });
    }
    parts.push({ text: newMessage });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { role: 'user', parts: parts },
      config: {
        systemInstruction: "You are Nexus, a world-class AI assistant. You are concise, brilliant, and helpful.",
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    if (error.message?.includes('API_KEY_INVALID')) return "Invalid API Key. Please check your Netlify environment variables.";
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = createClient();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned.");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
}

export interface LiveSessionCallbacks {
  onAudioData: (buffer: AudioBuffer) => void;
  onClose: () => void;
  onError: (error: any) => void;
  onInterrupted: () => void;
}

export const connectLiveSession = async (
  callbacks: LiveSessionCallbacks
): Promise<{
  sendAudio: (data: Float32Array) => void;
  disconnect: () => void;
}> => {
  const ai = createClient();
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const sources = new Set<AudioBufferSourceNode>();
  let nextStartTime = 0;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: "You are Nexus. Keep voice responses short and human-like.",
    },
    callbacks: {
      onopen: () => console.log("Nexus Live Online"),
      onmessage: async (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          try {
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(
              base64ToUint8Array(base64Audio),
              outputAudioContext,
              24000,
              1
            );

            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.addEventListener('ended', () => sources.delete(source));
            
            source.start(nextStartTime);
            nextStartTime += audioBuffer.duration;
            sources.add(source);
            callbacks.onAudioData(audioBuffer);
          } catch (e) {
            console.error("Live Audio Error", e);
          }
        }

        if (message.serverContent?.interrupted) {
          sources.forEach(s => { try { s.stop(); } catch {} });
          sources.clear();
          nextStartTime = 0;
          callbacks.onInterrupted();
        }
      },
      onclose: () => callbacks.onClose(),
      onerror: (err) => callbacks.onError(err)
    }
  });

  return {
    sendAudio: (data: Float32Array) => {
      const pcmBlob = createPcmBlob(data);
      sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    },
    disconnect: () => {
      sessionPromise.then(session => session.close());
      outputAudioContext.close();
    }
  };
};