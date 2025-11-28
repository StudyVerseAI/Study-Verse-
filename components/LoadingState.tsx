
import React, { useState, useEffect } from 'react';
import { AppMode } from '../types';
import { Sparkles, BrainCircuit, FileText, BookOpen } from 'lucide-react';

interface LoadingStateProps {
  mode: AppMode;
}

const LoadingState: React.FC<LoadingStateProps> = ({ mode }) => {
  const [message, setMessage] = useState('');
  
  // Specific messages based on the mode
  const messages = {
    [AppMode.SUMMARY]: [
      "Analyzing key concepts...",
      "Synthesizing main points...",
      "Structuring summary...",
      "Finalizing study notes..."
    ],
    [AppMode.QUIZ]: [
      "Designing challenging questions...",
      "Randomizing options...",
      "Drafting explanations...",
      "Calibrating difficulty..."
    ],
    [AppMode.ESSAY]: [
      "Brainstorming thesis...",
      "Structuring arguments...",
      "Drafting body paragraphs...",
      "Polishing conclusion..."
    ],
    [AppMode.TUTOR]: ["Connecting to AI Tutor..."],
    [AppMode.DASHBOARD]: ["Loading..."],
    [AppMode.PROFILE]: ["Saving..."]
  };

  useEffect(() => {
    const modeMessages = messages[mode] || ["Processing..."];
    let i = 0;
    setMessage(modeMessages[0]);
    
    const interval = setInterval(() => {
      i = (i + 1) % modeMessages.length;
      setMessage(modeMessages[i]);
    }, 2000);

    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
      <div className="relative mb-8">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl animate-pulse"></div>
        
        <div className="relative bg-white p-6 rounded-full shadow-lg border border-primary-50">
           {mode === AppMode.QUIZ ? <BrainCircuit className="w-10 h-10 text-primary-500 animate-pulse" /> :
            mode === AppMode.ESSAY ? <BookOpen className="w-10 h-10 text-primary-500 animate-pulse" /> :
            <FileText className="w-10 h-10 text-primary-500 animate-pulse" />
           }
        </div>
        
        {/* Orbiting Sparkle */}
        <div className="absolute -top-2 -right-2 animate-spin duration-3000">
           <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2 animate-pulse">
        Generating {mode === AppMode.SUMMARY ? 'Summary' : mode === AppMode.QUIZ ? 'Quiz' : 'Essay'}
      </h3>
      
      <p className="text-slate-500 text-sm font-medium bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 transition-all duration-300">
        {message}
      </p>

      <div className="mt-8 flex gap-2">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default LoadingState;
