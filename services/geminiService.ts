import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import { Message } from "../types";
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from "../utils/audioUtils";

// Ensure API Key is present
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("API_KEY is missing from environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

// --- Chat Service ---

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  image?: string
): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview";
    
    // Construct parts
    const parts: any[] = [];
    
    // Add image if exists
    if (image) {
      // Remove data url prefix if present
      const cleanBase64 = image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: "image/jpeg" // Simplifying assumption for demo, robust apps detect type
        }
      });
    }

    parts.push({ text: newMessage });

    // For a robust chat, we would convert the `history` to Content objects
    // But for this simple clone, we will just send the current prompt context
    // or use a chat session if we wanted full history. 
    // Here we use single-turn with context for simplicity in this function, 
    // but in a real app use `ai.chats.create`.
    
    // Let's use ai.chats.create for proper history handling if we were persisting it,
    // but here we are stateless per request in this function.
    // We will just do a generateContent for the "turn".
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: "You are a helpful, clever, and precise AI assistant. You can see images if provided.",
      }
    });

    return response.text || "No response text generated.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash-image';
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: prompt }] },
            config: {
                 // specific config if needed, default is usually fine for flash-image
            }
        });

        // The response for flash-image generateContent usually contains the image in inlineData
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated in response");
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        throw error;
    }
}

// --- Live Service ---

export interface LiveSessionCallbacks {
  onAudioData: (buffer: AudioBuffer) => void;
  onClose: () => void;
  onError: (error: any) => void;
}

export const connectLiveSession = async (
  callbacks: LiveSessionCallbacks
): Promise<{
  sendAudio: (data: Float32Array) => void;
  disconnect: () => void;
}> => {
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // This helps track playback timing
  let nextStartTime = 0;

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: "You are a witty and helpful voice assistant named Nexus. Keep responses concise and conversational.",
    },
    callbacks: {
      onopen: () => {
        console.log("Live Session Connected");
      },
      onmessage: async (message: LiveServerMessage) => {
        // Handle Audio
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            try {
                // Synchronize playback
                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(base64Audio),
                    outputAudioContext,
                    24000,
                    1
                );

                callbacks.onAudioData(audioBuffer);

                // We play it here or let the component play it? 
                // Better to let the service manage the context timing to avoid gaps.
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.start(nextStartTime);
                nextStartTime += audioBuffer.duration;
            } catch (e) {
                console.error("Error decoding audio chunk", e);
            }
        }
        
        // Handle interruptions
        if (message.serverContent?.interrupted) {
            console.log("Model interrupted");
            nextStartTime = 0;
            // In a full implementation we would stop all currently playing sources
        }
      },
      onclose: () => {
        console.log("Live Session Closed");
        callbacks.onClose();
      },
      onerror: (err) => {
        console.error("Live Session Error", err);
        callbacks.onError(err);
      }
    }
  });

  return {
    sendAudio: (data: Float32Array) => {
      const pcmBlob = createPcmBlob(data);
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    },
    disconnect: () => {
      sessionPromise.then(session => session.close());
      inputAudioContext.close();
      outputAudioContext.close();
    }
  };
};
