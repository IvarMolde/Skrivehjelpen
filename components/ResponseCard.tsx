
import React, { useMemo } from 'react';
import { BotMessage } from '../types';
import Spinner from './Spinner';

interface ResponseCardProps {
    message: BotMessage;
    onListen: () => void;
    onStop: () => void;
}

const SpeakerIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

const StopIcon: React.FC<{className?: string}> = ({className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563C9.252 14.437 9 14.185 9 13.874V9.563Z" />
    </svg>
);

const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
        if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-semibold mt-4 mb-2 text-slate-800 dark:text-slate-200">{line.substring(3)}</h2>;
        }
        if (line.trim() === '') {
            return <br key={index} />;
        }
        return <p key={index} className="mb-2">{line}</p>;
    });
};

const ResponseCard: React.FC<ResponseCardProps> = ({ message, onListen, onStop }) => {
    const isAudioLoading = message.audioState === 'generating';
    const isAudioPlaying = message.audioState === 'playing';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-full animate-fade-in">
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                {renderContent(message.response)}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center">
                <button
                    onClick={isAudioPlaying ? onStop : onListen}
                    disabled={isAudioLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-sky-600 hover:bg-sky-700 text-white"
                >
                    {isAudioLoading ? (
                        <>
                            <Spinner className="w-4 h-4" />
                            <span>Genererer...</span>
                        </>
                    ) : isAudioPlaying ? (
                        <>
                            <StopIcon className="w-5 h-5" />
                            <span>Stopp</span>
                        </>
                    ) : (
                        <>
                            <SpeakerIcon className="w-5 h-5" />
                            <span>Lytt til tilbakemelding</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ResponseCard;
