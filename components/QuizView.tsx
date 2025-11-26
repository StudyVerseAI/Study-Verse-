
import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Award } from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
  onReset: () => void;
  onComplete?: (score: number) => void;
  existingScore?: number;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onReset, onComplete, existingScore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Initialize view if there's an existing score (viewing history)
  useEffect(() => {
    if (existingScore !== undefined) {
      setScore(existingScore);
      setQuizCompleted(true);
    } else {
      // Reset state for new quiz
      setCurrentIndex(0);
      setScore(0);
      setQuizCompleted(false);
      setShowResult(false);
      setSelectedOption(null);
    }
  }, [existingScore, questions]);

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      const finalScore = score + (selectedOption === currentQuestion.correctAnswerIndex ? 0 : 0); // Score is already updated in handleOptionSelect
      setQuizCompleted(true);
      if (onComplete) {
        onComplete(score);
      }
    }
  };

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    let message = "Good effort!";
    if (percentage >= 80) message = "Excellent work!";
    else if (percentage >= 50) message = "Keep practicing!";

    return (
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {existingScore !== undefined ? 'Past Result' : 'Quiz Completed!'}
        </h2>
        <p className="text-slate-500 mb-8">{message}</p>
        
        <div className="text-4xl font-bold text-slate-900 mb-2">{score} / {questions.length}</div>
        <p className="text-sm text-slate-400 uppercase tracking-wide font-medium mb-8">Score Achieved</p>

        <button
          onClick={onReset}
          className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {existingScore !== undefined ? 'Retake Quiz' : 'Take Another Quiz'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <div 
          className="bg-primary-600 h-1.5 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-1 rounded">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-slate-500">Score: {score}</span>
        </div>

        <h3 className="text-xl font-semibold text-slate-800 mb-6">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let optionClass = "border-slate-200 hover:border-primary-300 hover:bg-slate-50";
            let icon = null;

            if (showResult) {
              if (idx === currentQuestion.correctAnswerIndex) {
                optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500";
                icon = <CheckCircle className="w-5 h-5 text-emerald-600" />;
              } else if (idx === selectedOption) {
                optionClass = "border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500";
                icon = <XCircle className="w-5 h-5 text-rose-600" />;
              } else {
                optionClass = "border-slate-100 opacity-50";
              }
            } else if (selectedOption === idx) {
               optionClass = "border-primary-500 bg-primary-50 ring-1 ring-primary-500";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex justify-between items-center ${optionClass}`}
              >
                <span className="font-medium">{option}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-2">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Explanation</span>
              <p className="text-slate-700">{currentQuestion.explanation}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="inline-flex items-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/20"
              >
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
