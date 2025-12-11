import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Volume2, Square, ArrowLeft } from 'lucide-react';

interface ResultsViewProps {
  content: string;
  isLoading: boolean;
  title: string;
  onBack: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ content, isLoading, title, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Cleanup speech when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Stop playing if content changes or loading starts
  useEffect(() => {
    if (isLoading) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, [isLoading, content]);

  const toggleSpeech = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      if (!content) return;

      // Simple cleanup to remove markdown symbols for better reading
      const textToRead = content
        .replace(/[*#_`]/g, '') // Remove standard markdown chars
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove URL
        .replace(/\n/g, '. '); // Pause on newlines

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!content && !isLoading) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Create New"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-slate-800 line-clamp-1">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!isLoading && content && (
            <button
              onClick={toggleSpeech}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isPlaying 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
              title={isPlaying ? "Stop reading" : "Read aloud"}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Listen</span>
                </>
              )}
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center text-primary-600 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </div>
        )}
      </div>
      <div className="p-6 min-h-[200px]">
        <div className="markdown-body text-slate-700">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {content === '' && isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 mb-4 animate-spin text-primary-300" />
            <p>Starting generation...</p>
          </div>
        )}
      </div>
      
      {!isLoading && (
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button 
                onClick={onBack}
                className="text-sm font-semibold text-primary-700 hover:text-primary-800 hover:underline"
            >
                Generate Another Version
            </button>
        </div>
      )}
    </div>
  );
};

export default ResultsView;