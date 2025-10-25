
import React, { useState, useCallback } from 'react';
import { CEFRLevel, BotMessage } from './types';
import { CEFR_LEVELS } from './constants';
import { getEvaluation, getSpeech } from './services/geminiService';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import ResponseCard from './components/ResponseCard';
import Spinner from './components/Spinner';

const Header = () => (
    <header className="w-full text-center py-6 bg-white dark:bg-slate-800 shadow-md">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Skrivehjelpen</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Få tilbakemelding på teksten din basert på CEFR-nivåer.</p>
    </header>
);

const LevelSelector: React.FC<{ selectedLevels: CEFRLevel[]; onToggle: (level: CEFRLevel) => void }> = ({ selectedLevels, onToggle }) => (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 my-4">
        {CEFR_LEVELS.map(level => {
            const isSelected = selectedLevels.includes(level);
            return (
                <button
                    key={level}
                    onClick={() => onToggle(level)}
                    className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-200 ease-in-out transform hover:scale-105 ${
                        isSelected 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                >
                    {level}
                </button>
            );
        })}
    </div>
);

const ThinkingModeToggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <div className="flex items-center justify-center gap-3 my-4 text-sm text-slate-600 dark:text-slate-400">
        <span className={!enabled ? 'font-semibold text-sky-600' : ''}>Standardmodus</span>
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                enabled ? 'bg-sky-600' : 'bg-gray-300'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
        </button>
        <span className={enabled ? 'font-semibold text-sky-600' : ''}>Tenkemodus (For komplekse tekster)</span>
    </div>
);

const App: React.FC = () => {
    const [text, setText] = useState<string>('');
    const [selectedLevels, setSelectedLevels] = useState<CEFRLevel[]>([]);
    const [useThinkingMode, setUseThinkingMode] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<BotMessage | null>(null);
    const { play, stop, isPlaying } = useAudioPlayer();

    const handleLevelToggle = useCallback((level: CEFRLevel) => {
        setSelectedLevels(prev => {
            const isSelected = prev.includes(level);
            if (isSelected) {
                return prev.filter(l => l !== level);
            }
            if (prev.length < 2) {
                return [...prev, level];
            }
            // If 2 are already selected, this click does nothing for a new level
            return prev;
        });
    }, []);

    const handleSubmit = async () => {
        if (!text.trim()) {
            setError('Vennligst skriv inn en tekst.');
            return;
        }
        if (selectedLevels.length === 0) {
            setError('Vennligst velg minst ett nivå (A1, A2, B1, eller B2).');
            return;
        }

        setError(null);
        setIsLoading(true);
        setMessage(null);

        try {
            const responseText = await getEvaluation(text, selectedLevels, useThinkingMode);
            setMessage({
                id: new Date().toISOString(),
                response: responseText,
                isEvaluating: false,
                audioState: 'idle'
            });
        } catch (e) {
            const err = e as Error;
            setError(`En feil oppstod: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleListen = useCallback(async () => {
        if (!message) return;

        setMessage(m => m ? { ...m, audioState: 'generating' } : null);
        try {
            const audioB64 = await getSpeech(message.response);
            await play(audioB64);
        } catch (e) {
            const err = e as Error;
            setError(`Kunne ikke generere tale: ${err.message}`);
            setMessage(m => m ? { ...m, audioState: 'error' } : null);
        }
    }, [message, play]);
    
    // Effect to update message audioState based on player's isPlaying state
    React.useEffect(() => {
        setMessage(m => {
            if (!m) return null;
            const newAudioState = isPlaying ? 'playing' : 'idle';
            if (m.audioState === newAudioState || m.audioState === 'generating' && isPlaying) {
                 return { ...m, audioState: 'playing' };
            }
            if (m.audioState === 'playing' && !isPlaying) {
                 return { ...m, audioState: 'idle' };
            }
            return m;
        });
    }, [isPlaying]);


    return (
        <div className="min-h-screen flex flex-col items-center bg-slate-100 dark:bg-slate-900 font-sans">
            <Header />

            <main className="w-full max-w-3xl mx-auto p-4 flex-grow">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">1. Velg nivå (opptil 2)</h2>
                    <LevelSelector selectedLevels={selectedLevels} onToggle={handleLevelToggle} />
                    
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2 mt-6">2. Skriv inn teksten din</h2>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Lim inn teksten din her..."
                        className="w-full h-48 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    />
                    <ThinkingModeToggle enabled={useThinkingMode} onToggle={() => setUseThinkingMode(p => !p)} />
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center justify-center w-full sm:w-auto bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                        {isLoading ? (
                           <>
                            <Spinner className="mr-2"/> Vurderer...
                           </>
                        ) : "Få tilbakemelding"}
                    </button>
                </div>
                
                {error && (
                    <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                        <strong className="font-bold">Feil: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="mt-8">
                    {message && <ResponseCard message={message} onListen={handleListen} onStop={stop} />}
                </div>
            </main>
            
            <footer className="w-full text-center py-4 text-sm text-slate-500 dark:text-slate-400">
                Drevet av Google Gemini
            </footer>
        </div>
    );
};

export default App;
