

import React, { useState, useEffect } from 'react';
import { AppMode, StudyRequestData, INITIAL_FORM_DATA, QuizQuestion, HistoryItem, UserProfile } from './types';
import InputForm from './components/InputForm';
import ResultsView from './components/ResultsView';
import QuizView from './components/QuizView';
import TutorChat from './components/TutorChat';
import ProfileView from './components/ProfileView';
import Auth from './components/Auth';
import PremiumModal from './components/PremiumModal';
import LoadingState from './components/LoadingState'; 
import NotesView from './components/NotesView';
import { GeminiService } from './services/geminiService';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  BookOpen, 
  FileText, 
  BrainCircuit, 
  MessageCircle, 
  Sparkles, 
  AlertCircle, 
  GraduationCap, 
  Menu, 
  X,
  ChevronRight,
  LayoutDashboard,
  ArrowLeft,
  Calendar,
  Eye,
  LogOut,
  Zap,
  Crown,
  Plus,
  Clock
} from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // App State
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [formData, setFormData] = useState<StudyRequestData>(INITIAL_FORM_DATA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Profile State
  const initialProfileState: UserProfile = {
    displayName: '',
    phoneNumber: '',
    institution: '',
    bio: '',
    photoURL: '',
    learningGoal: '',
    learningStyle: 'Visual',
    credits: 100,
    planType: 'Free'
  };
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfileState);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dashboardView, setDashboardView] = useState<AppMode | 'OVERVIEW'>('OVERVIEW');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  
  // Content States
  const [summaryContent, setSummaryContent] = useState('');
  const [essayContent, setEssayContent] = useState('');
  const [quizData, setQuizData] = useState<QuizQuestion[] | null>(null);
  const [existingQuizScore, setExistingQuizScore] = useState<number | undefined>(undefined);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        setIsNewUser(false);
        setUserProfile(initialProfileState);
        setMode(AppMode.DASHBOARD); // Reset to dashboard if logged out
      }
    });
    return () => unsubscribe();
  }, []);

  // Profile Persistence Listener
  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem(`profile_${user.uid}`);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setUserProfile(prev => ({ 
            ...initialProfileState, 
            ...parsed,
            displayName: parsed.displayName || user.displayName || '',
            photoURL: parsed.photoURL || user.photoURL || '' 
          }));
        } catch (e) {
          console.error("Failed to parse profile", e);
        }
      } else {
        setUserProfile({
           ...initialProfileState,
           displayName: user.displayName || '',
           photoURL: user.photoURL || '',
           credits: 100
        });
      }
    }
  }, [user]);

  // History Persistence: Load Logic
  useEffect(() => {
    const storageKey = user ? `history_${user.uid}` : 'history_guest';
    const savedHistory = localStorage.getItem(storageKey);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory)) {
          setHistory(parsedHistory);
        }
      } catch (e) {
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  }, [user]);

  // History Persistence: Save Logic
  useEffect(() => {
    const storageKey = user ? `history_${user.uid}` : 'history_guest';
    localStorage.setItem(storageKey, JSON.stringify(history));
  }, [history, user]);

  // Close sidebar on mode change for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleProfileSave = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (user) {
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
    }
    if (isNewUser) {
      setIsNewUser(false);
      setShowAuthModal(false);
      setMode(AppMode.DASHBOARD);
    }
  };

  const handleSignUpSuccess = () => {
    setIsNewUser(true);
    setUserProfile(initialProfileState);
    setShowAuthModal(false);
  };

  const handlePaymentSuccess = (creditsToAdd: number, planName: 'STARTER' | 'SCHOLAR' | 'ACHIEVER') => {
    const updatedProfile = { 
      ...userProfile, 
      credits: userProfile.credits + creditsToAdd,
      planType: planName
    };
    handleProfileSave(updatedProfile);
  };

  const handleFormChange = (field: keyof StudyRequestData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.subject || !formData.gradeClass || !formData.chapterName) {
      setError("Please fill in at least Subject, Class, and Chapter Name.");
      return false;
    }
    setError(null);
    return true;
  };

  const addToHistory = (type: AppMode, content: any) => {
    const newId = Date.now().toString();
    const newItem: HistoryItem = {
      id: newId,
      type,
      title: formData.chapterName || 'Untitled Chapter',
      subtitle: `${formData.gradeClass} • ${formData.subject}`,
      timestamp: Date.now(),
      content,
      formData: { ...formData }
    };
    setHistory(prev => [newItem, ...prev]);
    setCurrentHistoryId(newId);
  };

  const handleQuizComplete = (score: number) => {
    if (currentHistoryId) {
      setHistory(prev => prev.map(item => 
        item.id === currentHistoryId ? { ...item, score } : item
      ));
    }
  };

  const deductCredit = () => {
    if (userProfile.credits > 0) {
      const updatedProfile = { ...userProfile, credits: userProfile.credits - 1 };
      handleProfileSave(updatedProfile);
      return true;
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (userProfile.credits <= 0) {
      setError("You have used all your free generations (100/100). Upgrade to Premium for more.");
      return;
    }

    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setExistingQuizScore(undefined);
    setCurrentHistoryId(null);

    try {
      if (mode === AppMode.SUMMARY) {
        setSummaryContent('');
        const stream = await GeminiService.generateSummaryStream(formData);
        
        let text = '';
        for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
                text += c.text;
                setSummaryContent(text);
            }
        }
        addToHistory(AppMode.SUMMARY, text);
        deductCredit();

      } else if (mode === AppMode.ESSAY) {
        setEssayContent('');
        const stream = await GeminiService.generateEssayStream(formData);
        
        let text = '';
         for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
                text += c.text;
                setEssayContent(text);
            }
        }
        addToHistory(AppMode.ESSAY, text);
        deductCredit();

      } else if (mode === AppMode.QUIZ) {
        setQuizData(null);
        const questions = await GeminiService.generateQuiz(formData);
        setQuizData(questions);
        addToHistory(AppMode.QUIZ, questions);
        deductCredit();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate content. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (item.formData) {
      setFormData(item.formData);
    }
    setCurrentHistoryId(item.id);

    if (item.type === AppMode.SUMMARY) {
      setSummaryContent(item.content);
      setMode(AppMode.SUMMARY);
    } else if (item.type === AppMode.ESSAY) {
      setEssayContent(item.content);
      setMode(AppMode.ESSAY);
    } else if (item.type === AppMode.QUIZ) {
      setQuizData(item.content);
      setExistingQuizScore(item.score);
      setMode(AppMode.QUIZ);
    } else if (item.type === AppMode.TUTOR) {
      setMode(AppMode.TUTOR);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMode(AppMode.DASHBOARD);
      setDashboardView('OVERVIEW');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Nav Items Configuration
  const navItems = [
    { id: AppMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppMode.SUMMARY, label: 'Summary Generator', icon: FileText },
    { id: AppMode.QUIZ, label: 'Quiz Creator', icon: BrainCircuit },
    { id: AppMode.ESSAY, label: 'Essay Writer', icon: BookOpen },
    { id: AppMode.NOTES, label: 'Notes & Schedule', icon: Calendar },
    { id: AppMode.TUTOR, label: 'AI Tutor', icon: MessageCircle },
  ];

  const renderDashboard = () => {
    // Determine the count for Notes locally
    const noteCount = (() => {
       try {
         const key = user ? `notes_${user.uid}` : 'notes_guest';
         const saved = localStorage.getItem(key);
         return saved ? JSON.parse(saved).length : 0;
       } catch { return 0; }
    })();

    const stats = {
      summaries: history.filter(h => h.type === AppMode.SUMMARY).length,
      quizzes: history.filter(h => h.type === AppMode.QUIZ).length,
      essays: history.filter(h => h.type === AppMode.ESSAY).length,
      chats: history.filter(h => h.type === AppMode.TUTOR).length,
    };

    const dashboardCards = [
      { id: AppMode.SUMMARY, label: 'Summaries Created', count: stats.summaries, icon: FileText, color: 'text-amber-800', bg: 'bg-[#FDF5E6]' },
      { id: AppMode.QUIZ, label: 'Quizzes Created', count: stats.quizzes, icon: BrainCircuit, color: 'text-amber-700', bg: 'bg-[#FDF5E6]' },
      { id: AppMode.ESSAY, label: 'Essays Created', count: stats.essays, icon: BookOpen, color: 'text-amber-600', bg: 'bg-[#FDF5E6]' },
      { id: AppMode.TUTOR, label: 'AI Tutor Chats', count: stats.chats, icon: MessageCircle, color: 'text-amber-900', bg: 'bg-[#FDF5E6]' },
      { id: AppMode.NOTES, label: 'Notes Created', count: noteCount, icon: Calendar, color: 'text-emerald-700', bg: 'bg-[#FDF5E6]' },
    ];

    if (dashboardView !== 'OVERVIEW') {
      const filteredHistory = history.filter(h => h.type === dashboardView);
      const categoryLabel = dashboardCards.find(c => c.id === dashboardView)?.label.replace(' Created', '').replace(' Chats', '') || 'History';
      const getSingularName = (view: AppMode) => {
        switch(view) {
            case AppMode.SUMMARY: return 'Summary';
            case AppMode.QUIZ: return 'Quiz';
            case AppMode.ESSAY: return 'Essay';
            case AppMode.TUTOR: return 'Chat';
            default: return 'Item';
        }
      };

      return (
        <div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <button 
            onClick={() => setDashboardView('OVERVIEW')}
            className="flex items-center text-slate-500 hover:text-primary-600 mb-8 transition-all hover:-translate-x-1 group"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3 border border-slate-100 group-hover:border-primary-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <h3 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary-400" />
            {categoryLabel} History
          </h3>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-24 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/60 border-dashed animate-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Clock className="w-8 h-8 text-primary-300" />
              </div>
              <p className="text-slate-500 font-medium mb-6">No {categoryLabel.toLowerCase()} found yet.</p>

              <button
                onClick={() => {
                  setSummaryContent('');
                  setEssayContent('');
                  setQuizData(null);
                  setExistingQuizScore(undefined);
                  setCurrentHistoryId(null);
                  setError(null);
                  setMode(dashboardView);
                  setDashboardView('OVERVIEW');
                }}
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary-500/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New {getSingularName(dashboardView)}
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredHistory.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex justify-between items-center group cursor-pointer"
                  style={{ animationDelay: `${idx * 50}ms` }}
                  onClick={() => loadHistoryItem(item)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center bg-primary-100 text-primary-600`}>
                      {item.type === AppMode.QUIZ ? <BrainCircuit className="w-5 h-5" /> :
                       item.type === AppMode.SUMMARY ? <FileText className="w-5 h-5" /> :
                       item.type === AppMode.ESSAY ? <BookOpen className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-primary-700 transition-colors text-lg">{item.title}</h4>
                      <p className="text-sm text-slate-500 flex items-center gap-3">
                        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-xs">{item.subtitle}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        {item.type === AppMode.QUIZ && item.score !== undefined && (
                          <span className="flex items-center gap-1 text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded-full text-xs">
                            Score: {item.score}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <Eye className="w-5 h-5 text-primary-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // DASHBOARD OVERVIEW
    return (
      <div className="relative min-h-[600px]">
        {/* Floating Background Blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 space-y-8">
          {/* Welcome Card */}
          <div className="animate-fade-in-up bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/40 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">
                      Welcome, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">{user ? (userProfile.displayName || 'Scholar') : 'Guest'}</span>!
                    </h3>
                    <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
                      {user ? "Your AI learning engine is idling. Ready to accelerate your studies?" : "Sign in to access advanced features like Notes, Scheduling, and Saving History."}
                    </p>
                    {user && (
                       <div className="mt-4 flex items-center gap-2 text-primary-700 bg-primary-50/80 backdrop-blur-sm px-3 py-1.5 rounded-lg w-fit border border-primary-100">
                          <Zap className="w-4 h-4 fill-primary-500 text-primary-500" />
                          <span className="font-semibold text-sm">{userProfile.credits} generations remaining</span>
                       </div>
                    )}
                  </div>
                  <div className="hidden md:block animate-pulse">
                     <Sparkles className="w-8 h-8 text-primary-400" />
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => {
                       if (!user) setShowAuthModal(true);
                       else setMode(AppMode.TUTOR);
                    }}
                    className="group relative px-6 py-3 bg-slate-900 text-white rounded-xl font-medium overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/20"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="flex items-center gap-2 relative z-10">
                      <MessageCircle className="w-5 h-5" />
                      Chat with AI Tutor
                    </span>
                  </button>
                  {!user && (
                    <button 
                        onClick={() => setShowAuthModal(true)}
                        className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        Sign In / Sign Up
                    </button>
                  )}
                </div>
              </div>
          </div>

          {/* Stats List (Vertical) */}
          <div className="flex flex-col gap-4">
            {dashboardCards.map((stat, idx) => (
              <button 
                key={idx} 
                onClick={() => {
                    if (!user) setShowAuthModal(true);
                    else if (stat.id === AppMode.NOTES) setMode(AppMode.NOTES);
                    else setDashboardView(stat.id as AppMode);
                }}
                className={`group relative p-6 rounded-2xl bg-[#FFFAF0] border border-stone-100/60 shadow-sm hover:shadow-md transition-all duration-300 text-left w-full overflow-hidden flex items-center justify-between`}
                style={{ animationDelay: `${(idx + 1) * 150}ms` }}
              >
                 <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} shadow-sm border border-stone-100`}>
                      <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                      <span className="text-3xl font-bold text-slate-800 tracking-tight">
                        {stat.count}
                      </span>
                    </div>
                 </div>
                 
                 {user && (stat.id === AppMode.TUTOR || stat.id === AppMode.NOTES) ? (
                     <div className="flex items-center gap-1 px-3 py-1 bg-primary-100/50 rounded-full text-xs font-semibold text-primary-700">
                        <span>{stat.id === AppMode.NOTES ? 'Open Notes' : 'View History'}</span>
                        <ChevronRight className="w-3 h-3" />
                    </div>
                 ) : user && (
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-400 transition-colors" />
                 )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (mode === AppMode.DASHBOARD) {
      return renderDashboard();
    }

    if (mode === AppMode.PROFILE) {
      return (
        <ProfileView 
          profile={userProfile} 
          email={user?.email || null} 
          onSave={handleProfileSave} 
          isOnboarding={isNewUser}
        />
      );
    }

    if (mode === AppMode.NOTES) {
      return (
        <NotesView 
          userId={user?.uid || null} 
          onDeductCredit={deductCredit}
        />
      );
    }

    if (mode === AppMode.TUTOR) {
      return <TutorChat />;
    }

    // Loading View
    if (loading) {
      return <LoadingState mode={mode} />;
    }

    const showEmptyState = !loading && 
      ((mode === AppMode.SUMMARY && !summaryContent) ||
       (mode === AppMode.ESSAY && !essayContent) ||
       (mode === AppMode.QUIZ && !quizData));

    // Hide input form if viewing a completed quiz from history to focus on results
    const showInputForm = !(mode === AppMode.QUIZ && existingQuizScore !== undefined);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {showInputForm && (
            <InputForm 
              data={formData} 
              mode={mode}
              onChange={handleFormChange} 
              disabled={loading}
            />
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {showEmptyState && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
             <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary-500" />
             </div>
             <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to Start?</h3>
             <p className="text-slate-500 mb-8 max-w-md mx-auto">
               Enter your study details above and let AI generate your personalized content.
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <button 
                onClick={handleGenerate}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary-500/25 flex items-center gap-2"
               >
                 <Sparkles className="w-5 h-5" />
                 Generate Now
               </button>
             </div>
          </div>
        )}

        {mode === AppMode.SUMMARY && summaryContent && (
          <ResultsView content={summaryContent} isLoading={loading} title={formData.chapterName} />
        )}
        
        {mode === AppMode.ESSAY && essayContent && (
          <ResultsView content={essayContent} isLoading={loading} title={formData.chapterName} />
        )}

        {mode === AppMode.QUIZ && quizData && (
          <QuizView 
            questions={quizData} 
            onReset={() => setQuizData(null)}
            onComplete={handleQuizComplete}
            existingScore={existingQuizScore}
          />
        )}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-sans selection:bg-primary-100 selection:text-primary-900 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} shadow-2xl lg:shadow-none`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                 <GraduationCap className="w-6 h-6 text-white" />
               </div>
               <div>
                 <h1 className="text-xl font-bold text-slate-900 tracking-tight">Study Verse AI</h1>
                 <p className="text-xs text-slate-500 font-medium">AI Study Companion</p>
               </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
            {navItems.map((item) => {
              const isActive = mode === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    // Auth Check for nav items except Dashboard
                    if (item.id !== AppMode.DASHBOARD && !user) {
                      setShowAuthModal(true);
                      setIsSidebarOpen(false); // Close sidebar on mobile
                    } else {
                      setMode(item.id);
                      setDashboardView('OVERVIEW');
                      setSummaryContent('');
                      setEssayContent('');
                      setQuizData(null);
                      setExistingQuizScore(undefined);
                      setCurrentHistoryId(null);
                      setError(null);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.label}
                  {!user && item.id !== AppMode.DASHBOARD && (
                     <div className="ml-auto">
                        <ArrowLeft className="w-3 h-3 text-slate-300 rotate-180" />
                     </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-100 space-y-3">
            {user ? (
               <>
                <button
                   onClick={() => setMode(AppMode.PROFILE)} 
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${mode === AppMode.PROFILE ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center overflow-hidden">
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-primary-700 text-xs">{(userProfile.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <p className="text-sm font-medium truncate">{userProfile.displayName || 'Scholar'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
               </>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
              >
                Sign In
              </button>
            )}
             
            {user && (
              <button 
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-200 to-yellow-400 hover:from-amber-300 hover:to-yellow-500 text-amber-900 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade Plan
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
             >
               <Menu className="w-6 h-6" />
             </button>
             <h2 className="text-lg font-bold text-slate-800">
               {/* Show Study Verse AI on Mobile or when Dashboard is active, otherwise show nav label */}
               {mode === AppMode.DASHBOARD ? 'Study Verse AI' : 
                (navItems.find(n => n.id === mode)?.label || 'Study Verse AI')}
             </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-700">{userProfile.credits}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAuthModal && (
        <Auth 
          onClose={() => setShowAuthModal(false)} 
          onSignUpSuccess={handleSignUpSuccess}
        />
      )}
      
      {showPremiumModal && (
        <PremiumModal 
          onClose={() => setShowPremiumModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default App;
