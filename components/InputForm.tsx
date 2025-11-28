
import React from 'react';
import { StudyRequestData, AppMode, DifficultyLevel } from '../types';
import { BookOpen, GraduationCap, School, User, Languages, BookType, HelpCircle, BarChart } from 'lucide-react';

interface InputFormProps {
  data: StudyRequestData;
  mode: AppMode;
  onChange: (field: keyof StudyRequestData, value: string | number) => void;
  disabled?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ data, mode, onChange, disabled }) => {

  const renderInput = (
    label: string, 
    field: keyof StudyRequestData, 
    Icon: React.ElementType, 
    placeholder: string
  ) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={data[field] as string}
          onChange={(e) => onChange(field, e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-60 text-slate-900"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary-600" />
        Study Details
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {renderInput("Subject", "subject", BookType, "e.g. History")}
        {renderInput("Class / Grade", "gradeClass", GraduationCap, "e.g. 10th Grade")}
        {renderInput("Board", "board", School, "e.g. CBSE")}
        {renderInput("Language", "language", Languages, "e.g. English")}
        {renderInput("Chapter Name", "chapterName", BookOpen, "e.g. The French Revolution")}
        {renderInput("Author (Optional)", "author", User, "e.g. NCERT")}

        {/* Quiz Specific Options */}
        {mode === AppMode.QUIZ && (
          <>
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">No. of Questions</label>
              <div className="relative">
                <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  value={data.questionCount || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onChange('questionCount', isNaN(val) ? 0 : val);
                  }}
                  disabled={disabled}
                  min="1"
                  max="50"
                  placeholder="e.g. 10"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-60 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Difficulty</label>
              <div className="relative">
                <BarChart className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={data.difficulty}
                  onChange={(e) => onChange('difficulty', e.target.value as DifficultyLevel)}
                  disabled={disabled}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all disabled:opacity-60 appearance-none text-slate-900"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InputForm;
