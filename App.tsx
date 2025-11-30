
import React, { useState, useEffect } from 'react';
import { AppMode, StudyRequestData, INITIAL_FORM_DATA, QuizQuestion, HistoryItem, UserProfile } from './types';
import InputForm from './components/InputForm';
import ResultsView from './components/ResultsView';
import QuizView from './components/QuizView';
import TutorChat from './components/TutorChat';
import ProfileView from './components/ProfileView';
import Auth from './components/Auth';
import PremiumModal from './components/PremiumModal';
import LoadingState from './components/LoadingState'; // Import new Loading Component
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
  TrendingUp,
  Clock,
  ArrowLeft,
  Calendar,
  Eye,
  LogOut,
  Loader2,
  UserCircle,
  PlayCircle,
  LogIn,
  Zap,
  Crown,
  Plus
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
    credits: 100 // Default free plan credits
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
          // Merge with initial state to ensure new fields (like credits) exist
          // IMPORTANT: If credits exist in parsed, use them. If not (old user), use default.
          setUserProfile(prev => ({ 
            ...initialProfileState, 
            ...parsed,
            // Ensure displayName/photoURL are synced if missing in storage but present in Auth
            displayName: parsed.displayName || user.displayName || '',
            photoURL: parsed.photoURL || user.photoURL || '' 
          }));
        } catch (e) {
          console.error("Failed to parse profile", e);
        }
      } else {
        // Initialize defaults for new profile with 100 credits
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
        console.error("Failed to parse history from local storage", e);
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

  // Update Profile and Save to LocalStorage
  const handleProfileSave = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    if (user) {
      localStorage.setItem(`profile_${user.uid}`, JSON.stringify(newProfile));
    }
    // If saving during onboarding, exit onboarding mode
    if (isNewUser) {
      setIsNewUser(false);
      setShowAuthModal(false);
      setMode(AppMode.DASHBOARD);
    }
  };

  const handleSignUpSuccess = () => {
    // This is called from the Auth component (modal)
    setIsNewUser(true);
    // Initialize profile for new user with 100 credits
    setUserProfile(initialProfileState);
    setShowAuthModal(false);
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
    // Check Auth First
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check Credits
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

  const handleTrySample = async () => {
    // Check Auth First
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check Credits
    if (userProfile.credits <= 0) {
      setError("You have used all your free generations (100/100). Upgrade to Premium for more.");
      return;
    }

    // 1. Set sample data based on mode
    let sampleData: StudyRequestData = { ...INITIAL_FORM_DATA };

    if (mode === AppMode.SUMMARY) {
      sampleData = {
        subject: 'History',
        gradeClass: '10th Grade',
        board: 'CBSE',
        language: 'English',
        chapterName: 'The French Revolution',
        author: 'NCERT'
      };
    } else if (mode === AppMode.QUIZ) {
      sampleData = {
        subject: 'Science',
        gradeClass: '8th Grade',
        board: 'General',
        language: 'English',
        chapterName: 'Solar System',
        questionCount: 5,
        difficulty: 'Easy'
      };
    } else if (mode === AppMode.ESSAY) {
       sampleData = {
        subject: 'Literature',
        gradeClass: 'High School',
        board: 'General',
        language: 'English',
        chapterName: 'Romeo and Juliet',
        author: 'Shakespeare'
      };
    } else if (mode === AppMode.TUTOR) {
      setMode(AppMode.TUTOR);
      return; 
    }

    setFormData(sampleData);

    // 2. Validate manually since state update is async
    if (!sampleData.subject || !sampleData.gradeClass || !sampleData.chapterName) return;

    // 3. Trigger generation logic directly with the sample data
    setLoading(true);
    setError(null);
    setExistingQuizScore(undefined);
    setCurrentHistoryId(null);

    try {
      if (mode === AppMode.SUMMARY) {
        setSummaryContent('');
        const stream = await GeminiService.generateSummaryStream(sampleData);
        let text = '';
        for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
                text += c.text;
                setSummaryContent(text);
            }
        }
        
        const newId = Date.now().toString();
        const newItem: HistoryItem = {
            id: newId,
            type: AppMode.SUMMARY,
            title: sampleData.chapterName,
            subtitle: `${sampleData.gradeClass} • ${sampleData.subject}`,
            timestamp: Date.now(),
            content: text,
            formData: sampleData
          };
          setHistory(prev => [newItem, ...prev]);
          setCurrentHistoryId(newId);
          deductCredit();

      } else if (mode === AppMode.ESSAY) {
        setEssayContent('');
        const stream = await GeminiService.generateEssayStream(sampleData);
        let text = '';
         for await (const chunk of stream) {
            const c = chunk as GenerateContentResponse;
            if (c.text) {
                text += c.text;
                setEssayContent(text);
            }
        }
        const newId = Date.now().toString();
        const newItem: HistoryItem = {
            id: newId,
            type: AppMode.ESSAY,
            title: sampleData.chapterName,
            subtitle: `${sampleData.gradeClass} • ${sampleData.subject}`,
            timestamp: Date.now(),
            content: text,
            formData: sampleData
        };
        setHistory(prev => [newItem, ...prev]);
        setCurrentHistoryId(newId);
        deductCredit();

      } else if (mode === AppMode.QUIZ) {
        setQuizData(null);
        const questions = await GeminiService.generateQuiz(sampleData);
        setQuizData(questions);
        const newId = Date.now().toString();
        const newItem: HistoryItem = {
            id: newId,
            type: AppMode.QUIZ,
            title: sampleData.chapterName,
            subtitle: `${sampleData.gradeClass} • ${sampleData.subject}`,
            timestamp: Date.now(),
            content: questions,
            formData: sampleData
        };
        setHistory(prev => [newItem, ...prev]);
        setCurrentHistoryId(newId);
        deductCredit();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate sample content.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (item.formData) {
      setFormData(item.formData);
    }
    
    // Set current ID so updates apply to the correct item
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
      // History state will be cleared by the useEffect [user] hook
      setMode(AppMode.DASHBOARD);
      setDashboardView('OVERVIEW');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderDashboard = () => {
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
                      {user ? "Your AI learning engine is idling. Ready to accelerate your studies?" : "Sign in to save your summaries, quizzes, and essays."}
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
                 
                 {user && stat.id === AppMode.TUTOR && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-primary-100/50 rounded-full text-xs font-semibold text-primary-700">
                        <span>View History</span>
                        <ChevronRight className="w-3 h-3" />
                    </div>
                 )}
                 {user && stat.id !== AppMode.TUTOR && (
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
        />
      );
    }

    if (mode === AppMode.TUTOR) {
        if (!user) {
            return (
                <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Sign in to Chat</h3>
                    <p className="text-slate-500 max-w-sm mb-6">
                        You need to be signed in to have a conversation with the AI Tutor.
                    </p>
                    <button 
                        onClick={() => setShowAuthModal(true)}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-md"
                    >
                        Sign In / Sign Up
                    </button>
                </div>
            )
        }
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

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <InputForm 
          data={formData} 
          mode={mode}
          onChange={handleFormChange} 
          disabled={loading}
        />

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
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold text-md shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                Generate {mode === AppMode.SUMMARY ? 'Summary' : mode === AppMode.QUIZ ? 'Quiz' : 'Essay'}
              </button>
              
              <button 
                onClick={handleTrySample}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-primary-600 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Try a Sample
              </button>
             </div>
          </div>
        )}

        {!showEmptyState && (
            <>
                {mode === AppMode.SUMMARY && (
                  <ResultsView 
                    title="Chapter Summary" 
                    content={summaryContent} 
                    isLoading={loading} 
                  />
                )}

                {mode === AppMode.ESSAY && (
                  <ResultsView 
                    title="Essay Outline" 
                    content={essayContent} 
                    isLoading={loading} 
                  />
                )}

                {mode === AppMode.QUIZ && quizData && (
                   <QuizView 
                      questions={quizData} 
                      onReset={() => {
                        setQuizData(null);
                        setExistingQuizScore(undefined);
                      }}
                      onComplete={handleQuizComplete}
                      existingScore={existingQuizScore}
                   />
                )}
                 
                 {!loading && (
                    <div className="flex justify-end gap-3">
                       <button 
                        onClick={handleTrySample}
                        className="text-sm text-slate-500 font-medium hover:text-primary-600 flex items-center gap-1"
                      >
                        <PlayCircle className="w-3 h-3" />
                        Try Another Sample
                      </button>
                       <button 
                        onClick={handleGenerate}
                        className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        Regenerate Content
                      </button>
                    </div>
                 )}
            </>
        )}
      </div>
    );
  };

  const navItems = [
    { id: AppMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppMode.SUMMARY, label: 'Summaries', icon: FileText },
    { id: AppMode.QUIZ, label: 'Quizzes', icon: BrainCircuit },
    { id: AppMode.ESSAY, label: 'Essay Outline', icon: BookOpen },
    { id: AppMode.TUTOR, label: 'AI Tutor', icon: MessageCircle },
  ];

  // Only show profile if logged in
  const profileItem = { id: AppMode.PROFILE, label: 'My Profile', icon: UserCircle };

  const getTitle = () => {
    if (mode === AppMode.PROFILE) return 'My Profile';
    const item = navItems.find(i => i.id === mode);
    return item?.label || 'Study Verse';
  };

  const handleLogoClick = () => {
    setMode(AppMode.DASHBOARD);
    setDashboardView('OVERVIEW');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Onboarding View for New Users (Authenticated but IsNewUser flag is true)
  if (user && isNewUser) {
    return (
      <div className="min-h-screen bg-[#FFFAF0] flex flex-col font-sans text-slate-900">
        <header className="bg-white/90 backdrop-blur-lg border-b border-slate-100 h-16 flex items-center justify-center px-4">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                 <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Study<span className="text-primary-600">Verse</span>
              </h1>
            </div>
        </header>
        <main className="flex-1 p-6">
           <ProfileView 
              profile={userProfile} 
              email={user.email} 
              onSave={handleProfileSave} 
              isOnboarding={true}
            />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-sans text-slate-900 overflow-x-hidden">
      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <Auth 
            onSignUpSuccess={handleSignUpSuccess} 
            onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Premium Modal Overlay */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={handleLogoClick}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 transition-transform group-hover:scale-105">
                 <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-slate-900">
                Study<span className="text-primary-600">Verse</span>
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             {!user && (
                 <button 
                    onClick={() => setShowAuthModal(true)}
                    className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                 >
                    Sign In
                 </button>
             )}
             {user && (
               <div className="flex items-center gap-2 text-sm font-medium text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
                  <Zap className="w-3 h-3 fill-primary-500 text-primary-500" />
                  {userProfile.credits}
               </div>
             )}
             <button 
               onClick={() => setShowPremiumModal(true)}
               className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 hover:bg-primary-50 hover:text-primary-600 px-4 py-1.5 rounded-full border border-slate-100 transition-colors"
             >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              v2.1 Premium
            </button>
          </div>
        </div>
      </header>

      {/* Overlay for Sidebar */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Animated Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
                 <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Study<span className="text-primary-600">Verse</span>
              </h1>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              {navItems.map((item) => {
                const isActive = mode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === AppMode.TUTOR && mode !== AppMode.TUTOR && user) {
                         // Add chat history entry trigger only if logged in
                        const newHistoryItem: HistoryItem = {
                          id: Date.now().toString(),
                          type: AppMode.TUTOR,
                          title: 'Chat Session',
                          subtitle: 'AI Tutor',
                          timestamp: Date.now()
                        };
                        setHistory(prev => [newHistoryItem, ...prev]);
                      }

                      // RESET CONTENT STATES to ensure a fresh view for new generations
                      if (item.id === AppMode.SUMMARY || item.id === AppMode.ESSAY || item.id === AppMode.QUIZ) {
                          setSummaryContent('');
                          setEssayContent('');
                          setQuizData(null);
                          setExistingQuizScore(undefined);
                          setCurrentHistoryId(null);
                          setError(null);
                          // We intentionally do NOT reset formData so users retain context
                      }
                      
                      setMode(item.id);
                      if (item.id === AppMode.DASHBOARD) {
                        setDashboardView('OVERVIEW');
                      }
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span className="font-medium text-[15px]">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-primary-400" />}
                  </button>
                );
              })}
              
              <div className="pt-4 mt-2 border-t border-slate-50">
                 <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setShowPremiumModal(true);
                    }}
                    className="w-full group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                  >
                    <div className="flex items-center gap-3.5">
                      <Crown className="w-5 h-5 text-amber-500" />
                      <span className="font-medium text-[15px]">Premium Plans</span>
                    </div>
                  </button>
              </div>
          </nav>

          <div 
             className="p-6 border-t border-slate-50 bg-slate-50/50 flex-shrink-0 transition-colors"
          >
             {user ? (
                 <div className="flex flex-col gap-4">
                    <div 
                        className="flex items-center gap-3 px-2 cursor-pointer hover:bg-slate-100 p-2 rounded-lg -mx-2 transition-colors"
                        onClick={() => {
                            setMode(AppMode.PROFILE);
                            setIsSidebarOpen(false);
                        }}
                    >
                       {userProfile.photoURL ? (
                          <img src={userProfile.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                       ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold border border-primary-200">
                            {userProfile.displayName?.[0] || user.email?.[0].toUpperCase()}
                          </div>
                       )}
                       <div className="flex-1 overflow-hidden">
                         <p className="text-sm font-semibold text-slate-800 truncate">{userProfile.displayName || user.email?.split('@')[0]}</p>
                         <p className="text-xs text-slate-500 truncate">{user.email}</p>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-lg transition-all text-sm font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                 </div>
             ) : (
                 <button 
                    onClick={() => {
                        setIsSidebarOpen(false);
                        setShowAuthModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-xl transition-all text-sm font-medium shadow-md shadow-primary-500/20"
                 >
                    <LogIn className="w-4 h-4" />
                    Sign In to Profile
                 </button>
             )}
          </div>
        </div>
      </aside>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
             {navItems.find(i => i.id === mode)?.icon ? 
               React.createElement(navItems.find(i => i.id === mode)!.icon, { className: "w-8 h-8 text-primary-500" }) :
               mode === AppMode.PROFILE && <UserCircle className="w-8 h-8 text-primary-500" />
             }
             {getTitle()}
          </h2>
          <p className="text-slate-500 mt-2">
            {mode === AppMode.DASHBOARD && dashboardView === 'OVERVIEW' && "Overview of your learning progress and study materials."}
            {mode === AppMode.DASHBOARD && dashboardView !== 'OVERVIEW' && "Review your past generated content."}
            {mode === AppMode.SUMMARY && "Generate comprehensive summaries for any chapter."}
            {mode === AppMode.QUIZ && "Test your knowledge with AI-generated questions."}
            {mode === AppMode.ESSAY && "Get detailed essay outlines and structures."}
            {mode === AppMode.TUTOR && "Chat with your personal AI study companion."}
            {mode === AppMode.PROFILE && "Manage your personal details and account settings."}
          </p>
        </div>

        {/* Main Content Area */}
        <div className="max-w-5xl mx-auto min-h-[500px]">
            {renderContent()}
        </div>

      </main>
    </div>
  );
};

export default App;
