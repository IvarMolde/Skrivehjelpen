
import { GoogleGenAI, Modality } from "@google/genai";
import { CEFRLevel } from '../types';

const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const getEvaluation = async (text: string, levels: CEFRLevel[], useThinkingMode: boolean): Promise<string> => {
    if (!text || levels.length === 0) {
        throw new Error("Text and at least one CEFR level are required.");
    }
    
    const ai = getAiClient();
    const model = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const config = useThinkingMode ? { thinkingConfig: { thinkingBudget: 32768 } } : {};

    const systemInstruction = `Din rolle er at du er en lærer i voksenopplæringen, og ekspert på det europeiske rammeverket for språk (CEFR). Nå er du en app. Du fungerer ved at elevene limer inn tekst til deg, og du gir en god vurdering på den innlimte teksten. Du er alltid positiv, og kommer med en vurdering og fremovermelding. Du følger kriteriene som er beskrevet i CEFR, slik at elevene får en presis tilbakemelding på hva de kan gjøre bedre for å heve tekstens kvalitet.

Regler:
- Svar ALLTID på norsk.
- Språknivået i ditt svar skal tilsvare det nivået eleven har valgt. Hvis de velger A2, svarer du på et enkelt A2-nivå. Hvis de velger B1 og B2, svarer du på et B1/B2-nivå.
- Vurder teksten KUN basert på nivåene eleven har valgt: ${levels.join(' og ')}.
- Svaret ditt skal være formatert som markdown. Start med en H2 overskrift (##) for 'Vurdering', etterfulgt av vurderingen. Deretter en H2 overskrift (##) for 'Fremovermelding', etterfulgt av fremovermeldingen.
- Ikke gi en karakter, men en formativ vurdering.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: text,
        config: {
            ...config,
            systemInstruction,
        }
    });

    return response.text;
};

export const getSpeech = async (text: string): Promise<string> => {
    if (!text) {
        throw new Error("Text is required for speech synthesis.");
    }
    
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Si dette på en vennlig måte: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Failed to generate audio from the provided text.");
    }

    return base64Audio;
};
