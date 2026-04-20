import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Lock, Shield, User, Key, BarChart3, Trophy, 
  ChevronRight, Timer, CheckCircle2, XCircle, 
  ArrowLeft, AlertTriangle, List, Plus, Trash2,
  Calendar, Award, Briefcase, Zap, Cpu, Settings,
  LogOut, Globe, ClipboardList, Info, Download, FileSpreadsheet,
  TrendingUp, Activity, Frown, PartyPopper, AlertCircle
} from 'lucide-react';
import { AlfaButton } from './components/AlfaButton';
import { AlfaInput } from './components/AlfaInput';
import { AlfaCard } from './components/AlfaCard';
import { supabase } from './lib/supabaseClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

// --- Types ---
type Screen = 'login' | 'dashboard' | 'months' | 'exam' | 'result' | 'review' | 'admin_dashboard' | 'admin_users' | 'admin_exams' | 'admin_exam_edit' | 'admin_questions' | 'admin_results' | 'leaderboard' | 'stats';
type Lang = 'ar' | 'en';

interface ExamResult {
  examId: string;
  monthName: { ar: string, en: string };
  score: number;
  rawScore: number;
  maxScore: number;
  date: string;
}

interface UserData {
  id: string;
  name: string;
  employeeId: string;
  password?: string;
  region: string;
  totalScore: number;
  lastScore: number;
  badges: string[];
  role: 'user' | 'admin';
  examResults: ExamResult[];
  allowedRetakes?: string[]; // IDs of exams the user is allowed to retake
}

interface ExamMonth {
  id: string;
  name: { ar: string, en: string };
  status: 'locked' | 'active';
  score?: number;
  duration: number; // in seconds
  questions: string[]; // array of question IDs
  points: number;
  type?: 'monthly' | 'training';
  groupName?: string;
}

interface Question {
  id: string;
  text: { ar: string, en: string };
  type: 'tf' | 'mc';
  options?: { ar: string[], en: string[] };
  correctAnswer: string;
  category: { ar: string, en: string };
  points: number;
}

// --- Translations ---
const translations = {
  ar: {
    appName: "ALFA QUEZ",
    subtitle: "LABORATORIES EMPLOYEE PORTAL",
    login: "تسجيل الدخول",
    empName: "اسم الموظف",
    empCode: "كود الموظف",
    region: "المنطقة",
    password: "كلمة المرور",
    passwordPlaceholder: "الباسورد",
    activeExams: "الاختبارات النشطة",
    startExam: "ابدأ الاختبار",
    welcome: "مرحباً",
    latestResult: "آخر نتيجة",
    totalExp: "إجمالي النقاط",
    insights: "تحليلات الأداء",
    leaderboard: "لوحة الشرف",
    months: "أشهر التقييم",
    back: "عودة",
    next: "التالي",
    finish: "إنهاء",
    result: "النتيجة",
    passed: "تم الاجتياز",
    failed: "لم يتم الاجتياز",
    review: "مراجعة الإجابات",
    adminPanel: "لوحة التحكم",
    logout: "تسجيل الخروج",
    true: "صواب",
    false: "خطأ",
    progress: "التقدم",
    timeRemaining: "الوقت المتبقي",
    score: "الدرجة",
    training: "التدريب",
    monthlyExams: "اختبارات التقييم الشهري",
    timesUp: "انتهى الوقت!",
    retakeNotAllowed: "لقد أتممت هذا الاختبار بالفعل وغير مسموح بالإعادة",
    allowRetake: "سماح بالإعادة",
    groupName: "اسم المجموعة",
  },
  en: {
    appName: "ALFA QUEZ",
    subtitle: "LABORATORIES EMPLOYEE PORTAL",
    login: "Login",
    empName: "Employee Name",
    empCode: "Employee Code",
    region: "Area / Region",
    password: "Password",
    passwordPlaceholder: "Password",
    activeExams: "Active Exams",
    startExam: "Start Exam",
    welcome: "Welcome",
    latestResult: "Latest Result",
    totalExp: "Total Points",
    insights: "Performance Insights",
    leaderboard: "Leaderboard",
    months: "Assessment Months",
    back: "Back",
    next: "Next",
    finish: "Finish",
    result: "Result",
    passed: "Passed",
    failed: "Failed",
    review: "Review Answers",
    adminPanel: "Admin Panel",
    logout: "Logout",
    true: "True",
    false: "False",
    progress: "Progress",
    timeRemaining: "Time Remaining",
    score: "Score",
    training: "Training",
    monthlyExams: "Monthly Assessment Exams",
    timesUp: "Time's Up!",
    retakeNotAllowed: "You have already completed this exam and retakes are not allowed",
    allowRetake: "Allow Retake",
    groupName: "Group Name",
  }
};

const MOCK_REGIONS = [
  { id: 'r1', name: { ar: 'المدن الجديده', en: 'New Cities' }, password: '1101' },
  { id: 'r2', name: { ar: 'مصر الجديده', en: 'Heliopolis' }, password: '1102' },
  { id: 'r3', name: { ar: 'المهندسين', en: 'Mohandessin' }, password: '1103' },
  { id: 'r4', name: { ar: 'القاهره الجديده', en: 'New Cairo' }, password: '1104' },
  { id: 'r5', name: { ar: 'فيصل & الهرم', en: 'Faisal & Haram' }, password: '1105' },
  { id: 'r6', name: { ar: 'مدينه الشيخ زايد', en: 'Sheikh Zayed City' }, password: '1106' },
  { id: 'r7', name: { ar: 'مدينة نصر', en: 'Nasr City' }, password: '1107' },
  { id: 'r8', name: { ar: 'شرق القاهره 1', en: 'East Cairo 1' }, password: '1108' },
  { id: 'r9', name: { ar: 'زهراء المعادي', en: 'Zahraa El Maadi' }, password: '1109' },
  { id: 'r10', name: { ar: 'منطقه الدلتا 1', en: 'Delta Region 1' }, password: '1110' },
  { id: 'r11', name: { ar: 'وسط البلد', en: 'Downtown' }, password: '1111' },
  { id: 'r12', name: { ar: 'شرق القاهره 2', en: 'East Cairo 2' }, password: '1112' },
  { id: 'r13', name: { ar: 'منطقه الدلتا 2', en: 'Delta Region 2' }, password: '1113' },
  { id: 'r14', name: { ar: 'منطقه المعادي', en: 'Maadi Region' }, password: '1114' },
  { id: 'r15', name: { ar: 'منطقه جنوب الصعيد', en: 'South Upper Egypt' }, password: '1115' },
  { id: 'r16', name: { ar: 'منطقه شمال الجيزه', en: 'North Giza' }, password: '1116' },
  { id: 'r17', name: { ar: 'منطقه حدائق اكتوبر', en: 'October Gardens' }, password: '1117' },
  { id: 'r18', name: { ar: 'منطقه شبرا', en: 'Shoubra Region' }, password: '1118' },
  { id: 'r19', name: { ar: 'منطقه شمال الصعيد', en: 'North Upper Egypt' }, password: '1119' },
  { id: 'r20', name: { ar: 'مدينه السادس من اكتوبر', en: '6th of October City' }, password: '1120' },
  { id: 'r21', name: { ar: 'الاسكندريه & البحيره', en: 'Alexandria & Beheira' }, password: '1121' },
  { id: 'r22', name: { ar: 'منطقه وسط الصعيد', en: 'Central Upper Egypt' }, password: '1122' },
  { id: 'r23', name: { ar: 'مدن القناه', en: 'Canal Cities' }, password: '1123' },
  { id: 'training', name: { ar: 'منطقة التدريب', en: 'Training Area' }, password: 'train123' },
];

// --- Mock Data ---
const MOCK_MONTHS: ExamMonth[] = [
  { id: '1', name: { ar: 'يناير', en: 'January' }, status: 'active', duration: 300, questions: ['q1', 'q2'], points: 100, type: 'monthly' },
  { id: '2', name: { ar: 'فبراير', en: 'February' }, status: 'active', duration: 300, questions: ['q1', 'q3'], points: 100, type: 'monthly' },
  { id: '3', name: { ar: 'مارس', en: 'March' }, status: 'active', duration: 600, questions: ['q2', 'q3'], points: 100, type: 'monthly' },
  { id: 'T1', name: { ar: 'تدريب المهارات الأساسية', en: 'Basic Skills Training' }, status: 'active', duration: 300, questions: ['q1', 'q2'], points: 100, type: 'training', groupName: 'Group A' },
];

const MOCK_QUESTIONS: Question[] = [
  { 
    id: 'q1', 
    text: { ar: 'هل يجب تعقيم الأدوات بعد كل عينة؟', en: 'Should tools be sterilized after every sample?' }, 
    type: 'tf', 
    correctAnswer: 'True',
    category: { ar: 'إجراءات المختبر', en: 'Lab Procedures' },
    points: 50
  },
  { 
    id: 'q2', 
    text: { ar: 'ما هو اللون القياسي لعينات الدم الوريدي؟', en: 'What is the standard color for venous blood samples?' }, 
    type: 'mc', 
    options: { ar: ['أحمر', 'أزرق', 'أخضر', 'أسود'], en: ['Red', 'Blue', 'Green', 'Black'] }, 
    correctAnswer: 'Red',
    category: { ar: 'أساسيات التحليل', en: 'Analysis Basics' },
    points: 50
  },
  { 
    id: 'q3', 
    text: { ar: 'يتم حفظ العينات في درجة حرارة الغرفة لمجمعات الأنسجة.', en: 'Samples are stored at room temperature for tissue clusters.' }, 
    type: 'tf', 
    correctAnswer: 'False',
    category: { ar: 'التخزين', en: 'Storage' },
    points: 50
  },
];

const MOCK_PROGRESS = [
  { name: 'Jan', score: 65 },
  { name: 'Feb', score: 75 },
  { name: 'Mar', score: 85 },
  { name: 'Apr', score: 82 },
  { name: 'May', score: 90 },
];

// --- Sub-Components ---

const AlfaLogo = () => (
  <div className="flex flex-col items-center scale-[0.85] sm:scale-100 py-0 -mt-2 sm:-mt-6">
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-1 sm:mb-6">
      <div className="absolute inset-0 flex items-center justify-center group cursor-pointer transition-transform duration-500 hover:scale-110">
         <motion.div 
            animate={{ 
              opacity: [0.9, 1, 0.9],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full flex items-center justify-center relative" 
         >
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-white flex items-center justify-center shadow-[0_15px_60px_rgba(0,112,243,0.25)] border border-alfa-neon-blue/20 relative overflow-hidden">
               <img 
                 src="/logo.png" 
                 alt="ALFA Logo" 
                 referrerPolicy="no-referrer"
                 className="w-full h-full object-contain" 
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/alfa/200/200';
                 }}
               />
            </div>
         </motion.div>
      </div>
    </div>
    <div className="text-center">
      <div className="inline-block px-8 py-3 sm:px-12 sm:py-5 rounded-full border border-alfa-neon-blue/10 bg-white/40 shadow-[0_10px_35px_rgba(0,112,243,0.12)] backdrop-blur-3xl relative overflow-hidden group">
        <h1 className="text-alfa-blue text-3xl sm:text-6xl font-black tracking-tighter font-logo relative z-10 transition-all duration-700 drop-shadow-[0_6px_10px_rgba(0,112,243,0.2)] uppercase">
           Alfa <span className="text-alfa-neon-blue alfa-text-neon">Quez</span>
        </h1>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-alfa-neon-blue/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <div className="inline-block px-5 py-1.5 rounded-full border border-alfa-neon-blue/10 bg-white/30 backdrop-blur-md shadow-sm">
          <p className="text-[10px] sm:text-[13px] font-black text-alfa-blue uppercase tracking-tight font-logo">
            Design by : <span className="text-alfa-neon-blue alfa-text-neon">islam alsapaa</span>
          </p>
        </div>
        <div className="inline-block px-5 py-1.5 rounded-full border border-alfa-neon-blue/10 bg-white/30 backdrop-blur-md shadow-sm">
          <p className="text-[10px] sm:text-[13px] font-black text-alfa-blue uppercase tracking-tight font-logo">
            Content developed by : <span className="text-alfa-neon-blue alfa-text-neon">training team</span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

// --- Top-Level Components to prevent re-mounting flicker ---
const ExamScreen = ({ 
  activeExam, 
  questions, 
  examStep, 
  setExamStep, 
  answers, 
  setAnswers, 
  completeExam, 
  lang, 
  isRtl, 
  text, 
  getExamQuestions,
  setScreen
}: any) => {
    const [timer, setTimer] = React.useState(activeExam?.duration || 300);
    const [isTimeUp, setIsTimeUp] = React.useState(false);

    React.useEffect(() => {
        let interval: any;
        if (timer > 0 && !isTimeUp) {
            interval = setInterval(() => setTimer((t: number) => t - 1), 1000);
        } else if (timer === 0 && !isTimeUp) {
            setIsTimeUp(true);
        }
        return () => clearInterval(interval);
    }, [timer, isTimeUp]);

    if (!activeExam) return null;
    const examQs = getExamQuestions(activeExam);
    const q = examQs[examStep];
    if (!q) return (
      <div className="h-full flex items-center justify-center p-6 sm:p-12 text-center bg-transparent" dir={isRtl ? 'rtl' : 'ltr'}>
          <AlfaCard className="p-8 sm:p-14 max-w-sm border-alfa-neon-red/20 shadow-neon-red">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-alfa-neon-red/10 flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-alfa-neon-red/30 shadow-[0_0_30px_rgba(217,27,66,0.2)]">
                <AlertTriangle className="w-8 h-8 sm:w-12 sm:h-12 text-alfa-neon-red" />
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-alfa-blue mb-4 uppercase font-logo">{lang === 'ar' ? 'بيانات مفقودة' : 'Data Missing'}</h1>
              <p className="text-xs sm:text-base font-black opacity-30 mb-8 uppercase tracking-widest">{lang === 'ar' ? 'هذا الاختبار لا يحتوي على أسئلة حالياً.' : 'No questions found for this exam module.'}</p>
              <AlfaButton onClick={() => setScreen('months')} variant="outline" className="w-full">{text.back}</AlfaButton>
          </AlfaCard>
      </div>
    );
    const progress = ((examStep + 1) / examQs.length) * 100;
    
    return (
        <div className="h-full p-6 sm:p-12 max-w-2xl mx-auto flex flex-col gap-6 sm:gap-10 font-alfa overscroll-none" dir={isRtl ? 'rtl' : 'ltr'}>
            <header className="flex justify-between items-center gap-4 bg-white/30 backdrop-blur-xl p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] border border-alfa-neon-blue/10 shadow-lg relative z-[60]">
                <div className="flex flex-col gap-0.5 sm:gap-1">
                  <div className="text-[8px] sm:text-[10px] font-black opacity-40 uppercase tracking-[0.3em] font-logo">{text.progress}: {examStep + 1}/{examQs.length}</div>
                  <div className="h-1.5 w-20 sm:w-32 bg-alfa-blue/5 rounded-full overflow-hidden border border-alfa-blue/10 p-0.5">
                    <motion.div className="h-full bg-alfa-neon-blue rounded-full shadow-[0_0_10px_rgba(0,112,243,0.4)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-alfa-blue font-black bg-alfa-blue p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl border border-alfa-neon-blue/30 relative overflow-hidden group min-w-[90px] sm:min-w-[140px] justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-alfa-blue to-alfa-neon-blue/20" />
                    <Timer className={`w-4 h-4 sm:w-6 sm:h-6 text-alfa-neon-blue relative z-10 ${timer < 60 ? 'animate-bounce text-red-500' : 'animate-pulse'}`} />
                    <span className={`font-logo tabular-nums tracking-widest whitespace-nowrap text-sm sm:text-xl text-white relative z-10 ${timer < 60 ? 'text-alfa-red' : ''}`}>
                        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </header>
            
            <div className="relative flex-1 flex flex-col min-h-0">
                <AnimatePresence>
                    {isTimeUp && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="absolute inset-0 z-50 bg-alfa-blue/90 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center"
                        >
                            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-alfa-neon-red/10 flex items-center justify-center mb-6 sm:mb-8 border border-alfa-neon-red/30 shadow-[0_0_50px_rgba(217,27,66,0.5)]">
                                <AlertCircle className="w-12 h-12 sm:w-20 sm:h-20 text-alfa-neon-red" />
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-white mb-4 uppercase font-logo tracking-tighter">{text.timesUp}</h1>
                            <p className="text-sm sm:text-xl text-white/60 font-black uppercase tracking-widest mb-10">{lang === 'ar' ? 'يمكنك رؤية نتيجتك الآن' : 'You can see your result now'}</p>
                            <AlfaButton onClick={completeExam} className="w-full max-w-xs h-16 sm:h-20 text-lg sm:text-2xl shadow-neon-blue">
                                {text.result}
                            </AlfaButton>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AlfaCard className="flex-1 flex flex-col justify-center min-h-[300px] sm:min-h-[450px] border-alfa-neon-blue/5 !p-4 sm:!p-8">
                     <div className="mb-4 sm:mb-8 text-center">
                        <div className="inline-block px-3 py-1 rounded-full border border-alfa-neon-blue/10 bg-alfa-neon-blue/5 mb-3 sm:mb-5">
                           <span className="text-[8px] sm:text-[10px] text-alfa-neon-blue font-black tracking-[0.3em] uppercase font-logo">{lang === 'ar' ? q.category.ar : q.category.en}</span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-black leading-tight text-alfa-blue tracking-tight">{lang === 'ar' ? q.text.ar : q.text.en}</h1>
                     </div>
                     
                     <div className="flex flex-col gap-2.5 sm:gap-4 mt-2 max-w-xl mx-auto w-full">
                        {q.type === 'tf' ? [text.true, text.false].map(opt => (
                            <button key={opt} disabled={isTimeUp} onClick={() => setAnswers({...answers, [q.id]: opt === text.true ? 'True' : 'False'})} className={`group h-12 sm:h-18 rounded-[0.8rem] sm:rounded-2xl text-xs sm:text-lg font-black transition-all duration-500 flex items-center justify-between px-5 sm:px-8 border-2 overflow-hidden relative ${answers[q.id] === (opt === text.true ? 'True' : 'False') ? 'bg-alfa-blue text-white border-alfa-neon-blue shadow-lg' : 'bg-white/40 backdrop-blur-md text-alfa-blue border-white hover:border-alfa-neon-blue/40'} ${isTimeUp ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {answers[q.id] === (opt === text.true ? 'True' : 'False') && <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue opacity-50" />}
                                <span className="relative z-10 uppercase">{opt}</span>
                                <div className="relative z-10">
                                   {answers[q.id] === (opt === text.true ? 'True' : 'False') ? <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-alfa-neon-blue" /> : <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-alfa-blue/5 group-hover:border-alfa-neon-blue/20" />}
                                </div>
                            </button>
                        )) : (lang === 'ar' ? q.options?.ar : q.options?.en)?.map((opt, optIdx) => {
                            const enOpt = q.options?.en?.[optIdx] || opt;
                            return (
                              <button key={optIdx} disabled={isTimeUp} onClick={() => setAnswers({...answers, [q.id]: enOpt})} className={`group h-12 sm:h-18 rounded-[0.8rem] sm:rounded-2xl text-sm sm:text-xl font-black transition-all duration-500 flex items-center justify-between px-5 sm:px-8 border-2 overflow-hidden relative ${answers[q.id] === enOpt ? 'bg-alfa-blue text-white border-alfa-neon-blue shadow-lg' : 'bg-white/40 backdrop-blur-md text-alfa-blue border-white hover:border-alfa-neon-blue/40'} ${isTimeUp ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  {answers[q.id] === enOpt && <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue opacity-50" />}
                                  <span className="relative z-10 uppercase">{opt}</span>
                                  <div className="relative z-10">
                                     {answers[q.id] === enOpt ? <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-alfa-neon-blue" /> : <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-alfa-blue/5 group-hover:border-alfa-neon-blue/20" />}
                                  </div>
                              </button>
                            );
                        })}
                     </div>
                </AlfaCard>
            </div>
            
            <div className="shrink-0 flex gap-3 pt-1">
                {examStep < examQs.length - 1 ? (
                  <AlfaButton className="w-full h-12 sm:h-18 text-sm sm:text-xl font-logo !rounded-[1.2rem] sm:!rounded-[2rem] shadow-lg" onClick={() => setExamStep(examStep + 1)} disabled={!answers[q.id] || isTimeUp}>
                    {text.next}
                  </AlfaButton>
                ) : (
                  <AlfaButton className="w-full h-12 sm:h-18 text-sm sm:text-xl font-logo !rounded-[1.2rem] sm:!rounded-[2rem] bg-emerald-600 shadow-xl" onClick={completeExam} disabled={!answers[q.id] || isTimeUp}>
                    {text.finish}
                  </AlfaButton>
                )}
            </div>
        </div>
    );
  };

export default function App() {
  const [screen, setScreenState] = useState<Screen>('login');
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [lang, setLang] = useState<Lang>('ar');
  const [user, setUser] = useState<UserData | null>(null);

  const setScreen = (newScreen: Screen, pushHistory: boolean = true) => {
    if (pushHistory) {
      setScreenHistory(prev => [...prev, screen]);
    }
    setScreenState(newScreen);
  };

  const goBack = () => {
    if (screen === 'exam') return; // Don't allow back during exam
    if (screenHistory.length > 0) {
      const prevScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory(prev => prev.slice(0, -1));
      setScreenState(prevScreen);
    }
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      goBack();
      // Push state again to keep the listener active
      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [screen, screenHistory]);

  // Stateful Data
  const [dbStatus, setDbStatus] = useState<{status: 'idle'|'syncing'|'connected'|'error'|'empty', details?: string}>({ status: 'idle' });
  const [users, setUsers] = useState<UserData[]>([
    { id: 'admin', name: 'Super Admin', employeeId: 'admin', password: 'admin', region: 'r1', totalScore: 99999, lastScore: 100, badges: ['Admin'], role: 'admin', examResults: [] },
    { id: 'u1', name: 'User 1', employeeId: '1234', password: '1101', region: 'r1', totalScore: 0, lastScore: 0, badges: [], role: 'user', examResults: [] }
  ]);
  const [exams, setExams] = useState<ExamMonth[]>(MOCK_MONTHS);
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  
  // Exam State
  const [activeExam, setActiveExam] = useState<ExamMonth | null>(null);
  const [examStep, setExamStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [categoryTab, setCategoryTab] = useState<'monthly' | 'training'>('monthly');
  
  // Admin Editing State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editingExam, setEditingExam] = useState<ExamMonth | null>(null);
  
  const isRtl = lang === 'ar';
  const text = translations[lang];

  // Fetch Data from Supabase
  useEffect(() => {
    async function fetchData() {
      setDbStatus({ status: 'syncing' });
      try {
        const tableNames = ['exams', 'exam', 'EXAMS'];
        let examsRaw: any[] = [];
        let errorToThrow = null;
        let successfulTable = 'exams';

        for (const tName of tableNames) {
           const { data, error } = await supabase.from(tName).select('*');
           if (!error && data && data.length > 0) {
              examsRaw = data;
              successfulTable = tName;
              break;
           }
           if (error) errorToThrow = error;
        }

        if (examsRaw.length === 0 && errorToThrow) throw errorToThrow;

        if (examsRaw && examsRaw.length > 0) {
          const processedExams = examsRaw.map(e => ({
            ...e,
            id: String(e.id),
            name: typeof e.name === 'object' ? e.name : { ar: e.name_ar || e.name || e.id, en: e.name_en || e.name || e.id },
            status: e.status || 'active',
            type: e.type || 'monthly',
            duration: e.duration || 300,
            points: e.points || 100,
            questions: Array.isArray(e.questions) ? e.questions : [],
            groupName: e.group_name || e.groupName || ''
          }));
          setExams(processedExams);
          setDbStatus({ status: 'connected', details: `${processedExams.length} Exams from "${successfulTable}"` });
        } else {
          setDbStatus({ status: 'empty', details: `Synced with "${successfulTable}", but 0 rows returned. Using Offline Data.` });
        }

        const { data: questionsData, error: qError } = await supabase.from('questions').select('*');
        if (qError) console.error("Questions Error:", qError);
        if (questionsData && questionsData.length > 0) {
          const mappedQuestions = questionsData.map(q => ({
            ...q,
            id: String(q.id),
            examid: String(q.exam_id || q.examid || q.examId || ''),
            text: typeof q.text === 'object' ? q.text : { ar: q.text_ar || q.question || q.text || '', en: q.text_en || q.question || q.text || '' },
            correctAnswer: String(q.correct_answer || q.correctAnswer || q.correctanswer || ''),
            options: typeof q.options === 'object' ? q.options : { 
                ar: [q.option1, q.option2, q.option3, q.option4].filter(Boolean), 
                en: [q.option1, q.option2, q.option3, q.option4].filter(Boolean) 
            },
            points: Number(q.points || 10)
          }));
          setQuestions(mappedQuestions as Question[]);
        }

        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData && usersData.length > 0) {
          const mappedUsers = usersData.map(u => ({
            ...u,
            employeeId: u.employee_id || u.employeeId,
            totalScore: Number(u.total_score || u.totalScore || 0),
            lastScore: Number(u.last_score || u.lastScore || 0),
            examResults: Array.isArray(u.exam_results || u.examResults) ? (u.exam_results || u.examResults) : []
          }));
          setUsers(mappedUsers as UserData[]);
        }

      } catch (err: any) {
        console.error("Fetch Error:", err);
        setDbStatus({ status: 'error', details: err.message });
      }
    }
    fetchData();

    // Setup Real-time subscriptions
    const channels = [
      supabase.channel('users_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData()).subscribe(),
      supabase.channel('exams_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, () => fetchData()).subscribe(),
      supabase.channel('questions_channel').on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => fetchData()).subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const employeeIdCode = formData.get('employeeId') as string;
    const password = formData.get('password') as string;
    const regionId = formData.get('region') as string;
    
    // Admin override
    if (employeeIdCode === 'admin' && password === 'admin') {
      setUser({ id: 'admin', name: 'Admin', role: 'admin' } as UserData);
      setScreen('dashboard');
      return;
    }

    const region = MOCK_REGIONS.find(r => r.id === regionId);
    
    if (region && password === region.password) {
      if (!name || !employeeIdCode) {
        alert(lang === 'ar' ? 'برجاء ادخال الاسم والكود' : 'Please enter Name and Code');
        return;
      }

      let foundUser = users.find(u => u.employeeId === employeeIdCode);
      
      if (!foundUser) {
        // Create a new user dynamically in Supabase too
        const newUser: UserData = {
          id: 'u' + Date.now(),
          name: name,
          employeeId: employeeIdCode,
          region: regionId,
          totalScore: 0,
          lastScore: 0,
          badges: [],
          role: 'user',
          examResults: []
        };

        const { error } = await supabase.from('users').insert([{
            id: newUser.id,
            name: newUser.name,
            employee_id: newUser.employeeId,
            region: newUser.region,
            role: 'user'
        }]);

        if (error) console.error("Create User Error:", error);

        setUsers(prev => [...prev, newUser]);
        setUser(newUser);
      } else {
        setUser(foundUser);
      }
      
      setScreen('dashboard');
    } else {
      alert(lang === 'ar' ? 'فشل تسجيل الدخول: بيانات المنطقه او الباسورد غير صحيحه' : 'Login Failed: Invalid Region password or Region selection');
    }
  };

  const getExamQuestions = (exam: ExamMonth | null) => {
    if (!exam) return [];
    return questions.filter(q => 
        q.examid === exam.id || 
        (Array.isArray(exam.questions) && exam.questions.includes(q.id))
    );
  };

  const handleStartExam = (exam: ExamMonth) => {
    // Check if user already finished this exam
    const hasFinished = (user?.examResults || []).some(r => r.examId === exam.id);
    const isAllowedRetake = (user?.allowedRetakes || []).includes(exam.id);

    if (hasFinished && !isAllowedRetake && user?.role !== 'admin') {
        alert(text.retakeNotAllowed);
        return;
    }

    const examQs = getExamQuestions(exam);
    
    if (examQs.length === 0) {
        alert(lang === 'ar' ? "لا توجد أسئلة لهذا الاختبار حالياً." : "No questions found for this exam yet.");
        return;
    }

    setActiveExam(exam);
    setExamStep(0);
    setAnswers({});
    setScreen('exam');
  };

  const toggleRetake = (userId: string, examId: string) => {
    setUsers(users.map(u => {
        if (u.id === userId) {
            const retakes = u.allowedRetakes || [];
            if (retakes.includes(examId)) {
                return { ...u, allowedRetakes: retakes.filter(id => id !== examId) };
            } else {
                return { ...u, allowedRetakes: [...retakes, examId] };
            }
        }
        return u;
    }));
  };

  const calculateScore = () => {
    if (!activeExam) return 0;
    let earnedPoints = 0;
    let totalPossiblePoints = 0;
    const examQs = getExamQuestions(activeExam);
    examQs.forEach(q => {
      totalPossiblePoints += (q.points || 0);
      if (answers[q.id] === q.correctAnswer) {
        earnedPoints += (q.points || 0);
      }
    });
    if (totalPossiblePoints === 0) return 0;
    return Math.round((earnedPoints / totalPossiblePoints) * 100);
  };

  const completeExam = async () => {
    if (!activeExam || !user) return;
    const { score, earned, total } = calculateResultData();
    
    // Save to Supabase (Gracefully handle failures)
    try {
        const { error } = await supabase
            .from('results')
            .insert([{
                user_id: user.id,
                exam_id: activeExam.id,
                score: score,
                raw_score: earned,
                max_score: total
            }]);

        if (error) console.error("Error saving result to Supabase:", error);

        // Update user score in Supabase
        const newTotalScore = (user.totalScore || 0) + score;
        await supabase
            .from('users')
            .update({ total_score: newTotalScore, last_score: score })
            .eq('id', user.id);
    } catch (err) {
        console.error("Database operation failed:", err);
    }

    // ALWAYS proceed to result screen
    setScreen('result');
  };

  const calculateResultData = () => {
    if (!activeExam) return { score: 0, earned: 0, total: 0 };
    const examQs = getExamQuestions(activeExam);
    let earnedPoints = 0;
    let totalPossiblePoints = 0;

    examQs.forEach(q => {
      totalPossiblePoints += q.points;
      if (answers[q.id] === q.correctAnswer) {
        earnedPoints += q.points;
      }
    });

    const score = totalPossiblePoints === 0 ? 0 : Math.round((earnedPoints / totalPossiblePoints) * 100);
    return { score, earned: earnedPoints, total: totalPossiblePoints };
  };

  // --- UI Screens ---

  const LoginScreen = () => {
    const [loginMode, setLoginMode] = useState<'user' | 'admin' | null>(null);
    const [selectedRegion, setSelectedRegion] = useState(MOCK_REGIONS[0].id);

    return (
      <div className="min-h-screen py-12 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-transparent font-alfa" dir={isRtl ? 'rtl' : 'ltr'}>
          {/* Extreme Blue Ambient Neon Glows */}
          <div className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] alfa-ambient-blue blur-[120px] rounded-full opacity-40" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] alfa-ambient-blue blur-[120px] rounded-full opacity-40" />

          {/* Lang Toggle at Top Right */}
          <div className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} z-[100]`}>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
                className="w-10 h-10 rounded-xl bg-white/40 border border-alfa-neon-blue/30 flex items-center justify-center text-alfa-neon-blue shadow-lg backdrop-blur-3xl"
              >
                  <Globe className="w-5 h-5" />
              </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-0 sm:mb-4 relative z-10 transition-all duration-700">
              <AlfaLogo />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="w-full max-w-sm flex flex-col gap-2 relative z-10 mt-2 sm:mt-6">
              {!loginMode ? (
                <div className="flex flex-col gap-6 p-4 mt-4">
                   <button onClick={() => setLoginMode('admin')} className="relative h-[70px] bg-alfa-blue/80 backdrop-blur-md border border-alfa-neon-blue rounded-[1.5rem] hover:bg-alfa-blue/90 transition-all flex items-center justify-center gap-4 overflow-hidden shadow-[0_0_20px_rgba(0,112,243,0.5)] group active:scale-95">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-alfa-neon-blue/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out" />
                      <Shield className="w-7 h-7 text-alfa-neon-blue drop-shadow-[0_0_8px_rgba(0,112,243,0.8)]" /> 
                      <span className="text-white font-black text-lg tracking-widest alfa-text-neon uppercase font-logo">Administrator</span>
                   </button>
                   <button onClick={() => setLoginMode('user')} className="relative h-[70px] bg-alfa-blue/80 backdrop-blur-md border border-alfa-neon-blue rounded-[1.5rem] hover:bg-alfa-blue/90 transition-all flex items-center justify-center gap-4 overflow-hidden shadow-[0_0_20px_rgba(0,112,243,0.5)] group active:scale-95">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-alfa-neon-blue/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out" />
                      <User className="w-7 h-7 text-alfa-neon-blue drop-shadow-[0_0_8px_rgba(0,112,243,0.8)]" /> 
                      <span className="text-white font-black text-lg tracking-widest alfa-text-neon uppercase font-logo">Employee User</span>
                   </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="flex flex-col gap-2 p-2 relative">
                  <button type="button" onClick={() => setLoginMode(null)} className="mb-2 text-white/50 text-[10px] font-black uppercase underline">Back</button>
                  {loginMode === 'user' && (
                    <>
                      <AlfaInput label={text.empName} name="name" neon className="h-12" icon={<User className="w-5 h-5"/>} />
                      <AlfaInput label={text.empCode} name="employeeId" neon className="h-12" icon={<ClipboardList className="w-5 h-5"/>} />
                      <div className="flex flex-col gap-1 sm:gap-2.5">
                        <label className="text-[10px] sm:text-[11px] font-black opacity-30 uppercase tracking-[0.25em] px-3">{text.region}</label>
                        <div className="relative group rounded-[1.2rem] sm:rounded-[1.6rem] flex items-center h-[50px] sm:h-[68px] transition-all duration-500 alfa-neon-glass-input">
                            <div className="absolute left-5 sm:left-7 text-alfa-blue group-focus-within:text-alfa-neon-blue transition-colors duration-500 z-10 pointer-events-none">
                              <Globe className="w-5 h-5" />
                            </div>
                            <select 
                                name="region" 
                                value={selectedRegion} 
                                onChange={(e) => setSelectedRegion(e.target.value)} 
                                className="w-full h-full bg-transparent pl-12 sm:pl-16 pr-6 font-black text-alfa-blue outline-none text-base sm:text-2xl cursor-pointer appearance-none"
                            >
                                {MOCK_REGIONS.map(r => <option key={r.id} value={r.id} className="text-black font-bold">{lang === 'ar' ? r.name.ar : r.name.en}</option>)}
                            </select>
                        </div>
                      </div>
                    </>
                  )}
                  <AlfaInput label={text.password} name="password" neon className="h-12" placeholder={text.passwordPlaceholder} type="password" icon={<Lock className="w-5 h-5"/>} />
                  {/* Hidden input for employeeId if in admin mode */}
                  {loginMode === 'admin' && <input type="hidden" name="employeeId" value="admin" />}
                  <AlfaButton type="submit" className="w-full mt-2 h-14 text-xl shadow-xl alfa-neon-blue">
                      {text.login}
                  </AlfaButton>
                </form>
              )}
          </motion.div>
      </div>
    );
  };

  const DashboardScreen = () => (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 min-h-full font-alfa overscroll-none" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex justify-between items-center mb-0 sm:mb-2 shrink-0 alfa-glass p-4 sm:p-6 rounded-[2rem] sm:rounded-[3rem] border-white/80 relative overflow-hidden">
            <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-xl border border-cyan-400/50 shadow-[inset_0_0_5px_white]">
                    <User className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400" />
                </div>
                <div>
                   <h2 className="text-[8px] sm:text-[10px] text-white/50 font-black uppercase tracking-[0.3em] font-logo mb-0">👋 {text.welcome}</h2>
                   <h1 className="text-sm sm:text-xl font-black tracking-tight leading-tight text-white">{user?.name}</h1>
                </div>
            </div>
            <div className="flex gap-2 sm:gap-3 relative z-10">
                <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="w-9 h-9 sm:w-12 sm:h-12 bg-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg border border-cyan-400/50 shadow-[inset_0_0_5px_white] transition-all">
                    <Globe className="w-4 h-4 sm:w-6 h-6 text-cyan-400" />
                </button>
                <button onClick={() => setScreen('login')} className="w-9 h-9 sm:w-12 sm:h-12 bg-alfa-red/80 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg border border-cyan-400/50 shadow-[inset_0_0_5px_white] transition-all">
                    <LogOut className="w-4 h-4 sm:w-6 h-6 text-white" />
                </button>
            </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 shrink-0">
            <AlfaCard title={`📈 ${user?.lastScore}%`} subtitle={text.latestResult} className="border-l-4 border-l-alfa-neon-blue !p-4 sm:!p-6" />
            <AlfaCard title={`⭐ ${user?.totalScore?.toLocaleString() ?? '0'}`} subtitle={text.totalExp} className="border-l-4 border-l-emerald-500 !p-4 sm:!p-6" />
            <AlfaCard title="🎖️ Elite" subtitle="RANK" className="hidden lg:block border-l-4 border-l-amber-500 !p-4 sm:!p-6" />
            <AlfaCard title="💎 7" subtitle="BADGES" className="hidden lg:block border-l-4 border-l-purple-500 !p-4 sm:!p-6" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-6 flex-1 min-h-0">
            <AlfaCard title={text.insights} className="lg:col-span-2 flex flex-col h-full bg-alfa-blue/[0.02]">
                <div className="flex-1 w-full min-h-[80px] sm:min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_PROGRESS}>
                        <defs>
                          <linearGradient id="colorAlfa" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0070f3" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0070f3" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey="score" stroke="#0070f3" strokeWidth={4} fill="url(#colorAlfa)" animationDuration={2000} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
                <div className="mt-2 p-2 sm:p-4 bg-alfa-neon-blue/5 rounded-xl border border-alfa-neon-blue/10 backdrop-blur-sm">
                    <p className="text-[9px] sm:text-sm italic font-black text-alfa-blue opacity-70 leading-relaxed font-logo">
                        {lang === 'ar' ? "أداءك في تحاليل المختبر تطور بشكل ملحوظ. استمر في التميز." : "Lab analytics performance is peaking. Maintain excellence."}
                    </p>
                </div>
            </AlfaCard>

            <AlfaCard title={text.leaderboard} className="flex flex-col h-full">
                <div className="flex flex-col gap-2 flex-1 overflow-hidden h-full">
                    {users.filter(u => u.role === 'user').sort((a,b) => b.totalScore - a.totalScore).slice(0, 3).map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/50 border border-alfa-neon-blue/5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-[9px] sm:text-xs font-black shadow-inner ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-alfa-blue/5 text-alfa-blue'}`}>
                                    {i + 1}
                                </div>
                                <span className="font-black text-sm sm:text-xl text-alfa-blue tracking-tight">{p.name.split(' ')[0]}</span>
                            </div>
                            <span className="font-black text-xs sm:text-lg text-alfa-neon-blue font-logo">{p.totalScore}</span>
                        </div>
                    ))}
                </div>
            </AlfaCard>
        </div>

        <div className="shrink-0 pt-2 sm:pt-4">
            <button onClick={() => setScreen('months')} className="w-full h-14 sm:h-20 bg-alfa-blue text-white rounded-[2rem] sm:rounded-[3rem] font-logo flex items-center justify-center gap-3 sm:gap-4 shadow-[0_15px_30px_rgba(0,40,85,0.2)] hover:shadow-alfa-neon-blue/20 transition-all active:scale-[0.98] group overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
               <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-alfa-neon-blue group-hover:scale-125 transition-transform" />
               <span className="text-sm sm:text-xl uppercase tracking-[0.2em]">{text.startExam}</span>
            </button>
        </div>
    </div>
  );

  const MonthsScreen = () => {
    // تصفية الامتحانات بناءً على النوع
    const monthlyExams = exams.filter(e => (e.type || 'monthly') === 'monthly');
    const trainingExams = exams.filter(e => e.type === 'training');
    const currentList = categoryTab === 'monthly' ? monthlyExams : trainingExams;

    return (
        <div className="p-6 sm:p-12 max-w-6xl mx-auto flex flex-col gap-6 sm:gap-12 min-h-full font-alfa overscroll-none" dir={isRtl ? 'rtl' : 'ltr'}>
             <header className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-alfa-blue p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue via-alfa-neon-blue/20 to-alfa-blue" />
                <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                    <button onClick={() => setScreen('dashboard')} className="w-10 h-10 sm:w-16 sm:h-16 bg-white/10 flex items-center justify-center rounded-xl sm:rounded-2xl shadow-lg border border-white/20 text-white active:scale-95 transition-all">
                        <ArrowLeft className={`w-5 h-5 sm:w-8 sm:h-8 ${isRtl ? 'rotate-180' : ''}`} />
                    </button>
                    <h1 className="text-xl sm:text-3xl font-black text-white tracking-tighter uppercase font-logo">📅 {text.months}</h1>
                </div>
                
                <div className="flex bg-white/10 rounded-2xl p-1.5 border border-white/20 relative z-10 w-full sm:w-auto">
                    <button 
                        onClick={() => setCategoryTab('monthly')}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${categoryTab === 'monthly' ? 'bg-white text-alfa-blue shadow-xl' : 'text-white/60 hover:text-white'}`}
                    >
                        {text.monthlyExams}
                    </button>
                    <button 
                        onClick={() => setCategoryTab('training')}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${categoryTab === 'training' ? 'bg-white text-alfa-blue shadow-xl' : 'text-white/60 hover:text-white'}`}
                    >
                        {text.training}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 flex-1 overflow-y-auto pb-6 px-1 overscroll-contain">
                {currentList.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-40">
                        <p className="font-black uppercase tracking-widest">{lang === 'ar' ? 'لا توجد اختبارات حالياً' : 'No Exams Available'}</p>
                    </div>
                ) : (
                    currentList.map(m => {
                        const hasFinished = (user?.examResults || []).some(r => r.examId === m.id);
                        const isAllowedRetake = (user?.allowedRetakes || []).includes(m.id);
                        const isDisabled = m.status === 'locked' || (hasFinished && !isAllowedRetake && user?.role !== 'admin');

                        return (
                            <div key={m.id} onClick={() => !isDisabled && handleStartExam(m)} className={`group relative p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] alfa-glass flex flex-col justify-between aspect-square transition-all duration-700 cursor-pointer shadow-xl border-white/40 ${isDisabled ? 'opacity-40 grayscale-[0.8] cursor-not-allowed' : 'hover:scale-[1.03] hover:-translate-y-1 active:scale-95 border-alfa-neon-blue/5 hover:border-alfa-neon-blue/30'}`}>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-alfa-neon-blue/5 blur-3xl rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex justify-between items-start relative z-10">
                                    <span className="text-2xl sm:text-5xl font-black text-alfa-blue/5 font-logo italic group-hover:text-alfa-neon-blue/8 transition-colors tracking-tighter">{m.id}</span>
                                    {m.status === 'locked' ? <Lock className="w-4 h-4 sm:w-6 sm:h-6 opacity-20" /> : <div className="p-1.5 sm:p-3 bg-alfa-neon-blue/5 rounded-xl group-hover:bg-alfa-neon-blue/10 transition-colors shadow-inner"><Shield className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-alfa-blue group-hover:text-alfa-neon-blue transition-colors" /></div>}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-black text-sm sm:text-2xl text-alfa-blue leading-tight tracking-tight uppercase group-hover:text-alfa-neon-blue transition-colors">
                                        {lang === 'ar' ? (m.name?.ar || m.name_ar) : (m.name?.en || m.name_en)}
                                    </h3>
                                    <p className={`text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] mt-1 sm:mt-2 ${hasFinished ? 'text-emerald-500' : 'text-alfa-blue/40 font-logo'}`}>
                                        {hasFinished ? (isAllowedRetake ? (lang === 'ar' ? 'متاح للإعادة' : 'Retake Available') : (lang === 'ar' ? 'تم الانتهاء' : 'Completed')) : (m.status === 'locked' ? 'Locked' : 'Available')}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
  };

  const ResultScreen = () => {
    const { score, earned, total } = calculateResultData();
    const passed = score >= 50;

    useEffect(() => {
        if (score === 100) {
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
            const interval: any = setInterval(function() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        } else if (score >= 90) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }, [score]);

    const getResultUI = () => {
        if (score === 100) return {
            icon: <Trophy className="w-16 h-16 sm:w-20 sm:h-20" />,
            color: 'text-yellow-500',
            msg: lang === 'ar' ? '🏆 العلامة الكاملة! أسطوري!' : '🏆 Full Mark! Legendary!',
            style: 'shadow-[0_0_40px_rgba(234,179,8,0.3)]'
        };
        if (score >= 90) return {
            icon: <PartyPopper className="w-16 h-16 sm:w-20 sm:h-20" />,
            color: 'text-emerald-500',
            msg: lang === 'ar' ? '🥳 ممتاز جداً! اقتربت من الكمال' : '🥳 Excellent! Near perfection',
            style: ''
        };
        if (score < 70) return {
            icon: <XCircle className="w-16 h-16 sm:w-20 sm:h-20" />,
            color: 'text-red-600',
            msg: lang === 'ar' ? '😢 للأسف.. أداء ضعيف جداً' : '😢 Sadly.. very poor performance',
            style: 'opacity-80 grayscale-[0.5]'
        };
        if (score < 80) return {
            icon: <Frown className="w-16 h-16 sm:w-20 sm:h-20" />,
            color: 'text-orange-500',
            msg: lang === 'ar' ? '💔 نتيجة غير مرضية.. حاول بجد أكثر' : '💔 Unsatisfactory.. try harder next time',
            style: ''
        };
        return {
            icon: passed ? <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20" /> : <XCircle className="w-16 h-16 sm:w-20 sm:h-20" />,
            color: passed ? 'text-green-500' : 'text-alfa-red',
            msg: passed ? (lang === 'ar' ? 'ناجح! استمر في التقدم' : 'Passed! Keep going') : (lang === 'ar' ? 'لم تجتاز.. حاول مرة أخرى' : 'Failed.. try again'),
            style: ''
        };
    };

    const ui = getResultUI();

    return (
        <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col items-center justify-center text-center gap-6 sm:gap-8" dir={isRtl ? 'rtl' : 'ltr'}>
            <motion.div 
                initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] alfa-glass flex items-center justify-center shadow-2xl border-white/60 ${ui.color} ${ui.style}`}
            >
                {ui.icon}
            </motion.div>
            
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col gap-2">
                <h2 className="text-alfa-blue/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] font-display">{activeExam?.name.ar} / {activeExam?.name.en}</h2>
                <h1 className="text-3xl sm:text-5xl font-black text-alfa-blue tracking-tight">
                    {score === 100 ? (lang === 'ar' ? 'مذهل!' : 'Amazing!') : (passed ? text.passed : text.failed)}
                </h1>
                <p className="font-black text-alfa-text-secondary text-sm sm:text-lg max-w-[280px] sm:max-w-none">
                    {ui.msg}
                </p>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-4 w-full">
                <div className="alfa-glass p-6 sm:p-8 rounded-[2rem] flex flex-col items-center justify-center border-white/40 shadow-lg">
                    <span className={`text-4xl sm:text-5xl font-black tracking-tighter ${ui.color}`}>{score}%</span>
                    <span className="text-[10px] sm:text-xs font-black text-alfa-blue/30 uppercase tracking-widest mt-2">{lang === 'ar' ? 'النسبة' : 'Percentage'}</span>
                </div>
                <div className="alfa-glass p-6 sm:p-8 rounded-[2rem] flex flex-col items-center justify-center border-white/40 shadow-lg">
                    <span className="text-3xl sm:text-4xl font-black text-alfa-blue tracking-tighter">{earned}/{total}</span>
                    <span className="text-[10px] sm:text-xs font-black text-alfa-blue/30 uppercase tracking-widest mt-2">{lang === 'ar' ? 'النقاط' : 'Score'}</span>
                </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-col gap-3 w-full mt-4">
                <AlfaButton variant="outline" className="w-full h-14 font-black" onClick={() => setScreen('review')}>{text.review}</AlfaButton>
                <AlfaButton className="w-full h-14 font-black" onClick={() => setScreen('dashboard')}>{text.back}</AlfaButton>
            </motion.div>
        </div>
    );
  };

  const ReviewScreen = () => {
    if (!activeExam) return null;
    const examQs = getExamQuestions(activeExam);
    return (
    <div className="min-h-screen p-6 max-w-lg mx-auto flex flex-col gap-6 transition-all" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="flex items-center gap-4">
        <button onClick={() => setScreen('result')} className="w-10 h-10 alfa-glass rounded-xl flex items-center justify-center shadow-md">
            <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <h1 className="text-2xl font-black text-alfa-blue">{text.review}</h1>
      </header>
      <div className="space-y-6 overflow-y-auto max-h-[70vh] px-1 pb-10">
        {examQs.map((q, i) => {
          const isCorrect = answers[q.id] === q.correctAnswer;
          return (
            <AlfaCard key={q.id} title={`${lang === 'ar' ? 'السؤال' : 'Question'} ${i + 1}`} className="border-white/80">
              <p className="font-bold text-alfa-blue mb-4 leading-relaxed">{lang === 'ar' ? q.text.ar : q.text.en}</p>
              <div className="flex flex-col gap-3">
                <div className={`p-5 rounded-2xl bg-white/40 border border-white/60 flex justify-between items-center ${isCorrect ? 'text-emerald-600' : 'text-alfa-red'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{lang === 'ar' ? 'إجابتك' : 'Your Answer'}</span>
                  <span className="font-black text-lg">{answers[q.id] || '---'}</span>
                </div>
                {!isCorrect && (
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex justify-between items-center text-emerald-600">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{lang === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer'}</span>
                    <span className="font-black text-lg">{q.correctAnswer}</span>
                  </div>
                )}
              </div>
            </AlfaCard>
          );
        })}
      </div>
      <AlfaButton className="w-full mt-auto" onClick={() => setScreen('dashboard')}>{text.back}</AlfaButton>
    </div>
  );
};

const AdminResults = () => {
    const exportToCSV = () => {
        const headers = ["Region,Name,Employee ID,Total Score,Exams Taken\n"];
        const rows = [...MOCK_REGIONS].flatMap(region => {
            const regionUsers = users.filter(u => u.role === 'user' && u.region === region.id);
            return regionUsers.map(u => `${lang === 'ar' ? region.name.ar : region.name.en},${u.name},${u.employeeId},${u.totalScore},${(u.examResults || []).length}\n`);
        });
        
        const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'employee_results_by_region.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-12 max-w-6xl mx-auto flex flex-col gap-10 pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-alfa-blue p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue/20" />
            <div className="flex items-center gap-4 relative z-10">
                <button onClick={() => setScreen('admin_dashboard')} className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 alfa-glass rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all text-white border-white/20">
                    <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white">{lang === 'ar' ? 'نتائج المناطق' : 'Regional Results'}</h1>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">Analytics & Export</p>
                </div>
            </div>
            <AlfaButton onClick={exportToCSV} variant="outline" className="h-12 sm:h-14 px-6 relative z-10 bg-white/10 text-white border-white/20">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> {lang === 'ar' ? 'تصدير إكسيل' : 'Export Excel'}
            </AlfaButton>
        </header>

            <div className="space-y-12">
                {MOCK_REGIONS.map(region => {
                    const regionUsers = users.filter(u => u.role === 'user' && u.region === region.id);
                    if (regionUsers.length === 0) return null;
                    
                    const avgScore = regionUsers.length > 0 
                        ? Math.round(regionUsers.reduce((acc, u) => acc + (u.lastScore || 0), 0) / regionUsers.length) 
                        : 0;

                    return (
                        <div key={region.id} className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <div>
                                    <h2 className="text-xl font-black text-alfa-blue">{lang === 'ar' ? region.name.ar : region.name.en}</h2>
                                    <p className="text-[9px] font-black text-alfa-blue/40 uppercase tracking-[0.2em]">{regionUsers.length} Employees</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-alfa-blue">{avgScore}%</span>
                                    <p className="text-[8px] font-black text-alfa-blue/30 uppercase tracking-widest">{lang === 'ar' ? 'متوسط الأداء' : 'Region Performance'}</p>
                                </div>
                            </div>

                            <AlfaCard className="overflow-hidden border-white shadow-xl p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse" dir={isRtl ? 'rtl' : 'ltr'}>
                                        <thead className="bg-alfa-blue/5 border-b border-alfa-blue/10">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-alfa-blue/50 text-center">{lang === 'ar' ? 'الموظف' : 'Employee'}</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-alfa-blue/50 text-center">{lang === 'ar' ? 'الكود' : 'ID'}</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-alfa-blue/50 text-center">{lang === 'ar' ? 'آخر اختبار' : 'Last Exam'}</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-alfa-blue/50 text-center">{lang === 'ar' ? 'إجمالي النقاط' : 'Score'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-alfa-blue/5">
                                            {regionUsers.sort((a,b) => b.totalScore - a.totalScore).map(u => {
                                                const uResults = u.examResults || [];
                                                const lastResult = uResults[uResults.length - 1];
                                                return (
                                                    <tr key={u.id} className="hover:bg-alfa-blue/[0.02] transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3 justify-center sm:justify-start">
                                                                <div className="w-8 h-8 rounded-lg bg-alfa-blue/5 flex items-center justify-center font-black text-alfa-blue text-[10px]">{u.name[0]}</div>
                                                                <span className="font-black text-alfa-blue text-sm">{u.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-black text-alfa-blue/40 text-[10px] font-mono">{u.employeeId}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex flex-col gap-1 items-center">
                                                                {(u.examResults || []).length > 0 ? (
                                                                    (u.examResults || []).map(res => {
                                                                        const isAllowed = (u.allowedRetakes || []).includes(res.examId);
                                                                        const exName = exams.find(e => e.id === res.examId)?.name[lang as 'ar'|'en'] || 'Exam';
                                                                        return (
                                                                            <div key={res.examId} className="flex items-center gap-2 bg-alfa-blue/5 p-2 rounded-lg w-full justify-between min-w-[120px]">
                                                                                <div className="flex flex-col items-start px-2">
                                                                                    <span className="text-[8px] font-black opacity-40 uppercase truncate max-w-[60px]">{exName}</span>
                                                                                    <span className="font-black text-alfa-blue text-xs">{res.score}%</span>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => toggleRetake(u.id, res.examId)} 
                                                                                    className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${isAllowed ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-alfa-blue/10 text-alfa-blue/40 border border-transparent'}`}
                                                                                >
                                                                                    {isAllowed ? 'Allowed' : 'Allow Retake'}
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <span className="text-[9px] font-black opacity-20">---</span>
                                                                )}
                                                            </div>
                                                         </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="font-black text-alfa-blue text-sm">{u?.totalScore?.toLocaleString() ?? '0'}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </AlfaCard>
                        </div>
                    );
                })}
            </div>

            <AlfaCard title={lang === 'ar' ? 'مساهمة المناطق' : 'Regional Share'}>
                <div className="h-64 sm:h-80 w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_REGIONS.map(r => ({ name: lang === 'ar' ? r.name.ar : r.name.en, score: users.filter(u => u.region === r.id).reduce((acc, u) => acc + u.totalScore, 0) }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00285510" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#00285540' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#00285540' }} />
                            <Tooltip contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 10px 30px rgba(0,40,85,0.08)', fontWeight: 900 }} />
                            <Area type="monotone" dataKey="score" stroke="#002855" strokeWidth={4} fill="#002855" fillOpacity={0.05} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </AlfaCard>
        </div>
    );
};

  const AdminDashboard = () => (
    <div className="p-3 sm:p-10 max-w-6xl mx-auto flex flex-col gap-6 sm:gap-10 h-full overflow-hidden font-alfa overscroll-none" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0 bg-white/30 backdrop-blur-xl p-5 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] border border-alfa-neon-blue/10 shadow-lg">
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-4xl font-black text-alfa-blue tracking-tighter uppercase font-logo">{text.adminPanel}</h1>
              <p className="text-[10px] sm:text-xs font-black opacity-30 uppercase tracking-[0.4em] mt-1">System Core Interface</p>
            </div>
            <div className="flex gap-3">
                <AlfaButton variant="outline" onClick={() => setScreen('dashboard')} className="h-12 sm:h-16 px-6 sm:px-10 !rounded-2xl sm:!rounded-3xl border-alfa-neon-blue/20 text-alfa-blue">{text.back}</AlfaButton>
                <AlfaButton variant="danger" onClick={() => setScreen('login')} className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center !p-0 !rounded-2xl sm:!rounded-3xl shadow-neon-red border-alfa-neon-red/30"><LogOut className="w-6 h-6 sm:w-8 sm:h-8" /></AlfaButton>
            </div>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 shrink-0">
            {[
              { scr: 'admin_users', icon: User, title: lang === 'ar' ? '👥 إدارة المستخدمين' : '👥 Users', desc: `${users.length} Active Node`, color: 'alfa-neon-blue' },
              { scr: 'admin_exams', icon: ClipboardList, title: lang === 'ar' ? '📝 إدارة الاختبارات' : '📝 Exams', desc: `${exams.length} Modules`, color: 'emerald-500' },
              { scr: 'admin_questions', icon: List, title: lang === 'ar' ? '📚 بنك الأسئلة' : '📚 Library', desc: `${questions.length} Entry`, color: 'amber-500' },
              { scr: 'admin_results', icon: BarChart3, title: lang === 'ar' ? '📊 تقارير النتائج' : '📊 Telemetry', desc: 'Archive Access', color: 'purple-500' },
            ].map((btn, i) => (
              <button key={i} onClick={() => setScreen(btn.scr as any)} className="group text-start p-0 outline-none">
                <AlfaCard className={`h-full border-transparent group-hover:border-${btn.color}/30 transition-all duration-500 flex flex-col items-center py-6 sm:py-10 shadow-xl group-hover:shadow-[0_20px_50px_rgba(0,112,243,0.15)] group-active:scale-95`}>
                    <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-${btn.color}/5 flex items-center justify-center mb-4 border border-${btn.color}/10 group-hover:scale-110 transition-transform`}>
                        <btn.icon className={`w-6 h-6 sm:w-10 sm:h-10 text-${btn.color}/60 group-hover:text-${btn.color} transition-colors`} />
                    </div>
                    <h3 className="font-black text-alfa-blue text-[11px] sm:text-xl uppercase tracking-tight group-hover:text-alfa-neon-blue">{btn.title}</h3>
                    <p className="text-[7px] sm:text-xs font-black opacity-20 mt-1 uppercase tracking-widest group-hover:opacity-40">{btn.desc}</p>
                </AlfaCard>
              </button>
            ))}
        </div>

        <AlfaCard title="Network Activity Telemetry" subtitle="REALTIME ANALYTICS" className="flex-1 min-h-0 bg-alfa-blue/[0.02] p-4 sm:p-10 relative">
             <div className="h-full w-full min-h-[150px]">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_PROGRESS}>
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', fontStyle: 'normal', fontWeight: '900' }} />
                    <Area type="monotone" dataKey="score" stroke="#0070f3" strokeWidth={5} fill="#0070f3" fillOpacity={0.08} />
                  </AreaChart>
               </ResponsiveContainer>
             </div>
             
             {/* Radical Database Solution: Maintenance Actions */}
             <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={async () => {
                    if (!confirm('Are you sure you want to initialize the database with sample data? This will add initial exams and questions.')) return;
                    setDbStatus({ status: 'syncing', details: 'Seeding Database...' });
                    try {
                      const { error: exErr } = await supabase.from('exams').insert([
                        { id: '1', name: { ar: 'يناير 2026', en: 'January 2026' }, status: 'active', duration: 1800, questions: ['q1', 'q2'], points: 100, type: 'monthly' }
                      ]);
                      if (exErr) throw exErr;

                      const { error: qErr } = await supabase.from('questions').insert([
                        { id: 'q1', examid: '1', text: { ar: 'هل يجب غسل اليدين قبل سحب العينة؟', en: 'Wash hands before sampling?' }, type: 'tf', correctAnswer: 'True', points: 50 },
                        { id: 'q2', examid: '1', text: { ar: 'ما هو اللون القياسي لأنبوب السيترات؟', en: 'Standard Citrate tube color?' }, type: 'mc', options: { ar: ['أزرق', 'أحمر', 'أسود'], en: ['Blue', 'Red', 'Black'] }, correctAnswer: 'Blue', points: 50 }
                      ]);
                      if (qErr) throw qErr;
                      
                      alert('Database Seeded Successfully!');
                      window.location.reload();
                    } catch (err: any) {
                      alert('Seed Error: ' + err.message);
                    }
                  }}
                  className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/20 transition-all" title="Seed Database">
                  <Zap className="w-5 h-5" />
                </button>
                <div className={`p-2 rounded-lg ${dbStatus.status === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'} border border-current/20 font-black text-[10px] flex items-center gap-2`}>
                   <Activity className="w-4 h-4" /> {dbStatus.status.toUpperCase()}
                </div>
             </div>
        </AlfaCard>
    </div>
  );

  const AdminUsers = () => {
    const [name, setName] = useState('');
    const [empId, setEmpId] = useState('');
    const [pass, setPass] = useState('');
    const [regionId, setRegionId] = useState(MOCK_REGIONS[0].id);
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const handleSaveUser = () => {
      if (!name || !empId) return;
      if (editingUserId) {
          setUsers(users.map(u => u.id === editingUserId ? { ...u, name, employeeId: empId, role, region: regionId } : u));
      } else {
          const newUser: UserData = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            employeeId: empId,
            region: regionId,
            totalScore: 0,
            lastScore: 0,
            badges: [],
            role,
            examResults: []
          };
          setUsers([...users, newUser]);
      }
      setName(''); setEmpId(''); setPass(''); setRole('user'); setRegionId(MOCK_REGIONS[0].id); setEditingUserId(null); setShowForm(false);
    };

    const deleteUser = (id: string) => {
        if (id === 'admin') return;
        setUsers(users.filter(u => u.id !== id));
    };

    const startEdit = (u: UserData) => {
        setName(u.name);
        setEmpId(u.employeeId);
        setPass(u.password || '');
        setRole(u.role);
        setRegionId(u.region || MOCK_REGIONS[0].id);
        setEditingUserId(u.id);
        setShowForm(true);
    };

    return (
        <div className="p-3 sm:p-6 lg:p-12 max-w-5xl mx-auto flex flex-col gap-4 sm:gap-8 h-full overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <header className="flex items-center justify-between shrink-0 bg-alfa-blue p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue/20" />
                <div className="flex items-center gap-4 relative z-10">
                    <button onClick={() => setScreen('admin_dashboard')} className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 alfa-glass rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all text-white border-white/20"><ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`}/></button>
                    <h1 className="text-xl sm:text-2xl font-black text-white">{lang === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h1>
                </div>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="relative z-10 w-10 h-10 sm:w-14 sm:h-14 bg-emerald-500 text-white rounded-xl shadow-lg border border-white/20 flex items-center justify-center active:scale-90 transition-transform">
                    <Plus className="w-6 h-6" />
                  </button>
                )}
            </header>

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="shrink-0 overflow-hidden">
                  <AlfaCard className="border-alfa-blue/5 p-4 sm:p-6 shadow-2xl bg-white/90">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black text-alfa-blue uppercase tracking-tighter">{editingUserId ? (lang === 'ar' ? 'تعديل مستخدم' : 'Edit User') : (lang === 'ar' ? 'إضافة موظف' : 'Add Employee')}</h2>
                        <button onClick={() => setShowForm(false)} className="text-alfa-red p-2"><XCircle className="w-6 h-6" /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <AlfaInput label={lang === 'ar' ? 'الأسم' : 'Name'} value={name} onChange={(e) => setName(e.target.value)} className="h-14 sm:h-16" />
                          <AlfaInput label={lang === 'ar' ? 'كود الموظف' : 'Employee ID'} value={empId} onChange={(e) => setEmpId(e.target.value)} className="h-14 sm:h-16" />
                          
                          <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-2">{lang === 'ar' ? 'المنطقة' : 'Region'}</label>
                              <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="h-[55px] sm:h-[65px] alfa-glass border-alfa-neon-blue/10 rounded-2xl px-6 font-black text-alfa-blue outline-none text-sm">
                                  {MOCK_REGIONS.map(r => (
                                      <option key={r.id} value={r.id}>{lang === 'ar' ? `${r.name.ar} (${r.password})` : `${r.name.en} (${r.password})`}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                      <div className="flex gap-4 mt-6">
                          <AlfaButton onClick={handleSaveUser} className="flex-1 h-14 font-black shadow-xl"><CheckCircle2 className="w-5 h-5 mr-1" /> {editingUserId ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'تنفيذ الإضافة' : 'Confirm Add')}</AlfaButton>
                          <AlfaButton variant="outline" onClick={() => { setShowForm(false); setEditingUserId(null); setName(''); setEmpId(''); }} className="h-14">
                              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                          </AlfaButton>
                      </div>
                  </AlfaCard>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto min-h-0 py-2 space-y-3 px-1">
                {users.map(u => (
                    <motion.div layout key={u.id} className="alfa-glass rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-6 flex justify-between items-center transition-all bg-white/40 border-white shadow-xl">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center font-black ${u.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-alfa-blue'}`}>
                                {u.role === 'admin' ? <Shield className="w-5 h-5 sm:w-6 sm:h-6" /> : <User className="w-5 h-5 sm:w-6 sm:h-6" />}
                            </div>
                            <div>
                                <h3 className="font-black text-alfa-blue text-sm sm:text-lg leading-tight uppercase tracking-tight">{u.name}</h3>
                                <p className="text-[8px] sm:text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-0.5 sm:mt-1">
                                    ID: {u.employeeId} • {MOCK_REGIONS.find(r => r.id === u.region)?.name[lang as 'ar'|'en'] || u.region} 
                                    <span className="text-alfa-neon-blue ml-2">PASS: {MOCK_REGIONS.find(r => r.id === u.region)?.password}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            <button onClick={() => startEdit(u)} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/60 text-alfa-blue hover:scale-105 transition-transform shadow-sm"><Settings className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                            <button onClick={() => deleteUser(u.id)} disabled={u.id === 'admin'} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 text-alfa-red hover:scale-105 transition-transform disabled:opacity-20 shadow-sm"><Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /></button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
  };

  const LeaderboardScreen = () => (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto flex flex-col gap-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex items-center gap-4 mb-4 shrink-0 bg-alfa-blue p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue/20" />
            <button onClick={() => setScreen('dashboard')} className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 alfa-glass rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all text-white border-white/20 relative z-10">
                <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight relative z-10">{lang === 'ar' ? 'أفضل الموظفين' : 'Top Employees'}</h1>
        </header>
        <div className="space-y-4">
            {users.filter(u => u.role === 'user').sort((a,b) => b.totalScore - a.totalScore).map((u, i) => (
                <div key={u.id} className="alfa-glass rounded-[2rem] p-6 flex justify-between items-center bg-white/40 border-white shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-alfa-blue'}`}>
                           {i + 1}
                        </div>
                        <div>
                            <h3 className="font-black text-alfa-blue text-lg sm:text-2xl leading-tight">{u.name}</h3>
                            <p className="text-[10px] sm:text-xs font-black opacity-30 uppercase tracking-[0.2em]">{u.employeeId}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="font-black text-sm sm:text-xl text-alfa-blue block">{u?.totalScore?.toLocaleString() ?? '0'} pt</span>
                        <span className="text-[10px] sm:text-xs font-black opacity-20 uppercase tracking-[0.3em]">Total Points</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const StatsScreen = () => (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto flex flex-col gap-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex items-center gap-4 mb-4 shrink-0 bg-alfa-blue p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue/20" />
            <button onClick={() => setScreen('dashboard')} className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 alfa-glass rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all text-white border-white/20 relative z-10">
                <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight relative z-10">📉 {lang === 'ar' ? 'إحصائياتي' : 'My Statistics'}</h1>
        </header>
        <div className="grid grid-cols-2 gap-4">
            <AlfaCard title={`${user?.lastScore}%`} subtitle={text.latestResult} />
            <AlfaCard title={user?.totalScore?.toLocaleString() ?? '0'} subtitle={text.totalExp} />
        </div>
        <AlfaCard title="📈 Monthly Performance">
            <div className="h-48 w-full mt-4">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_PROGRESS}>
                    <Area type="monotone" dataKey="score" stroke="#002855" strokeWidth={3} fill="#002855" fillOpacity={0.05} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
        </AlfaCard>
    </div>
  );

  const AlfaBottomNav = () => {
    if (screen === 'login' || screen === 'exam') return null;
    
    const adminItems = [
        { id: 'admin_dashboard', icon: <Cpu className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '📊 الرئسيه' : '📊 Main' },
        { id: 'admin_results', icon: <Activity className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '📈 النتائج' : '📈 Results' },
        { id: 'admin_users', icon: <User className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '👥 الموظفين' : '👥 Users' },
        { id: 'admin_exams', icon: <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '📝 الاختبارات' : '📝 Exams' },
    ];

    const userItems = [
        { id: 'months', icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '📝 الاختبارات' : '📝 Exams' },
        { id: 'stats', icon: <Activity className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '📈 النتائج' : '📈 Results' },
        { id: 'dashboard', icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '📊 الإحصائيات' : '📊 Stats' },
        { id: 'leaderboard', icon: <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />, label: lang === 'ar' ? '🏆 الأفضل' : '🏆 Top' },
    ];

    const items = user?.role === 'admin' ? adminItems : userItems;

    return (
        <div className="w-full z-[100] bg-white/95 backdrop-blur-3xl border-t-2 border-alfa-blue/10 shadow-[0_-20px_60px_rgba(0,40,85,0.1)] px-2 pb-safe shrink-0">
            <div className="max-w-2xl mx-auto h-20 sm:h-24 flex items-center justify-around translate-y-[-2px]">
                {items.map(item => {
                    const isActive = screen === item.id || (item.id === 'admin_dashboard' && screen === 'admin_dashboard') || (item.id === 'dashboard' && screen === 'dashboard');
                    return (
                        <button key={item.id} onClick={() => setScreen(item.id as Screen)} className={`relative flex flex-col items-center gap-1 sm:gap-2 px-4 h-full justify-center transition-all duration-500 group ${isActive ? 'text-alfa-blue' : 'text-alfa-blue/20 hover:text-alfa-blue/40'}`}>
                            <div className={`transition-all duration-500 flex items-center justify-center ${isActive ? 'scale-110' : 'opacity-60'}`}>
                                <div className={`p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-gradient-to-br from-alfa-blue to-alfa-neon-blue text-white shadow-[0_10px_20px_rgba(0,112,243,0.3)] rotate-0' : 'bg-transparent rotate-0'}`}>
                                    {item.icon}
                                </div>
                            </div>
                            <span className={`text-[10px] sm:text-sm font-black uppercase tracking-widest transition-all duration-500 ${isActive ? 'opacity-100 scale-110 text-alfa-blue' : 'opacity-30'}`}>{item.label}</span>
                            {isActive && (
                                <motion.div layoutId="nav-glow" className="absolute top-0 w-20 h-2 bg-gradient-to-r from-alfa-neon-blue via-white to-alfa-neon-blue rounded-full shadow-[0_0_30px_rgba(0,112,243,1)]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
  };

  const AdminExams = () => {
    const deleteExam = (id: string) => {
        setExams(exams.filter(e => e.id !== id));
    };

    const toggleExam = (id: string) => {
        setExams(exams.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'locked' : 'active' } : e));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto flex flex-col gap-6" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-alfa-blue p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue/20" />
            <div className="flex items-center gap-4 relative z-10">
                <button onClick={() => setScreen('admin_dashboard')} className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 alfa-glass rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all text-white border-white/20">
                    <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
                <h1 className="text-xl sm:text-2xl font-black text-white">{lang === 'ar' ? 'إدارة الاختبارات' : 'Exam Management'}</h1>
            </div>
            <AlfaButton onClick={() => setScreen('admin_exam_edit')} variant="primary" className="h-12 sm:h-14 px-6 text-sm relative z-10 shadow-lg">
                <Plus className="w-4 h-4 mr-1" /> {lang === 'ar' ? 'اختبار جديد' : 'New'}
            </AlfaButton>
        </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center alfa-glass rounded-[3rem] border-dashed border-2 border-alfa-blue/10">
                        <div className="w-20 h-20 rounded-full bg-alfa-blue/5 flex items-center justify-center mb-6">
                            <ClipboardList className="w-10 h-10 text-alfa-blue/20" />
                        </div>
                        <h2 className="text-2xl font-black text-alfa-blue mb-2">{lang === 'ar' ? 'لا توجد اختبارات في قاعدة البيانات' : 'No Exams in Database'}</h2>
                        <p className="text-xs font-black opacity-30 uppercase tracking-widest mb-8 max-w-sm">
                            {lang === 'ar' ? 'قاعدة البيانات متصلة ولكنها لا تعيد أي سجلات. قد تكون بسبب حماية RLS أو الجداول فارغة.' : 'Connection is active but no rows returned. This is usually due to RLS policies or empty tables.'}
                        </p>
                        <AlfaButton 
                            onClick={async () => {
                                try {
                                    const { data, error } = await supabase.from('exams').insert([
                                        { id: 'ex1', name: { ar: 'اختبار تجريبي', en: 'Demo Exam' }, status: 'active', duration: 300, questions: [], points: 100, type: 'monthly' }
                                    ]).select();
                                    if (error) throw error;
                                    alert('Successfully added a demo exam row!');
                                    window.location.reload();
                                } catch (e: any) {
                                    const errorMsg = e.message || 'Unknown Error';
                                    let helpfulTip = "This confirms that RLS is ENABLED and blocking writes.";
                                    if (errorMsg.includes('policy')) {
                                        helpfulTip = "SOLVE THIS: Go to Supabase SQL Editor and run: ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;";
                                    }
                                    alert('Failed to add: ' + errorMsg + '\n\n' + helpfulTip);
                                }
                            }}
                            variant="primary" 
                            className="h-14 px-10 shadow-xl"
                        >
                            <Zap className="w-5 h-5 mr-2" /> {lang === 'ar' ? 'إنشاء اختبار تجريبي الآن' : 'Create Demo Exam Row'}
                        </AlfaButton>
                    </div>
                ) : exams.map(e => (
                    <AlfaCard key={e.id} className="relative group overflow-hidden border-white/80 p-6 rounded-[2.5rem]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[8px] font-black opacity-20 uppercase tracking-[0.3em]">CODE: {e.id}</span>
                                <h3 className="text-lg font-black text-alfa-blue mt-0.5 leading-tight">{lang === 'ar' ? e.name.ar : e.name.en}</h3>
                            </div>
                            <button onClick={() => toggleExam(e.id)} className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${e.status === 'active' ? 'bg-emerald-100 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-red-50 text-alfa-red opacity-40'}`}>
                                {e.status === 'active' ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-alfa-blue/30 uppercase tracking-widest"><Timer className="w-3.5 h-3.5" /> {e.duration / 60}m</div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-alfa-blue/30 uppercase tracking-widest"><List className="w-3.5 h-3.5" /> {e.questions.length} Qs</div>
                        </div>

                        <div className="flex gap-2">
                            <AlfaButton variant="outline" className="flex-1 h-10 text-xs rounded-xl" onClick={() => {setEditingExam(e); setScreen('admin_exam_edit')}}>{lang === 'ar' ? 'تعديل' : 'Edit'}</AlfaButton>
                            <button onClick={() => deleteExam(e.id)} className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-alfa-red hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </AlfaCard>
                ))}
            </div>
        </div>
    );
  };

  const AdminExamEdit = () => {
    const [arName, setArName] = useState(editingExam?.name.ar || '');
    const [enName, setEnName] = useState(editingExam?.name.en || '');
    const [duration, setDuration] = useState(editingExam?.duration || 300);
    const [status, setStatus] = useState<'active' | 'locked'>(editingExam?.status || 'active');
    const [totalPoints, setTotalPoints] = useState(editingExam?.points || 100);
    const [selectedQs, setSelectedQs] = useState<string[]>(editingExam?.questions || []);
    const [examType, setExamType] = useState<'monthly' | 'training'>(editingExam?.type || 'monthly');
    const [groupName, setGroupName] = useState(editingExam?.groupName || '');

    const saveExam = () => {
        const id = editingExam?.id || (exams.length + 1).toString();
        const updatedExam: ExamMonth = {
            id,
            name: { ar: arName, en: enName },
            duration: Number(duration),
            status,
            questions: selectedQs,
            points: totalPoints,
            type: examType,
            groupName
        };

        if (editingExam) {
            setExams(exams.map(e => e.id === id ? updatedExam : e));
        } else {
            setExams([...exams, updatedExam]);
        }
        setEditingExam(null);
        setScreen('admin_exams');
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-12 max-w-6xl mx-auto overflow-y-auto flex flex-col gap-8 pb-24" dir={isRtl ? 'rtl' : 'ltr'}>
            <header className="flex items-center gap-4">
                <button onClick={() => {setEditingExam(null); setScreen('admin_exams')}} className="w-10 h-10 alfa-glass rounded-xl flex items-center justify-center shadow-md"><ArrowLeft className={isRtl ? 'rotate-180' : ''}/></button>
                <h1 className="text-2xl font-black text-alfa-blue">{editingExam ? (lang === 'ar' ? 'تعديل اختبار' : 'Edit Exam') : (lang === 'ar' ? 'إنشاء اختبار جديد' : 'New Exam')}</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="flex flex-col gap-6">
                    <AlfaCard title="Basic Info" className="border-alfa-blue/5">
                        <div className="flex flex-col gap-6 mt-4">
                            <div className="flex bg-alfa-blue/5 rounded-2xl p-1.5 border border-alfa-blue/10">
                                <button 
                                    onClick={() => setExamType('monthly')}
                                    className={`flex-1 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${examType === 'monthly' ? 'bg-white text-alfa-blue shadow-xl' : 'text-alfa-blue/40'}`}
                                >
                                    Monthly
                                </button>
                                <button 
                                    onClick={() => setExamType('training')}
                                    className={`flex-1 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${examType === 'training' ? 'bg-white text-alfa-blue shadow-xl' : 'text-alfa-blue/40'}`}
                                >
                                    Training
                                </button>
                            </div>
                            {examType === 'training' && (
                                <AlfaInput label={text.groupName} value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                            )}
                            <AlfaInput label="Arabic Name" value={arName} onChange={(e) => setArName(e.target.value)} />
                            <AlfaInput label="English Name" value={enName} onChange={(e) => setEnName(e.target.value)} />
                            <div className="grid grid-cols-2 gap-4">
                                <AlfaInput label="Duration (Seconds)" type="number" value={duration.toString()} onChange={(e) => setDuration(Number(e.target.value))} />
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-black opacity-30 mt-1 uppercase tracking-widest px-2">Total Score</label>
                                    <AlfaInput label="Total Points" type="number" value={totalPoints.toString()} onChange={(e) => setTotalPoints(Number(e.target.value))} />
                                </div>
                            </div>
                        </div>
                    </AlfaCard>
                    <AlfaButton onClick={saveExam} className="w-full h-16 shadow-2xl">{lang === 'ar' ? 'حفظ الاختبار' : 'Save Exam'}</AlfaButton>
                </div>

                <AlfaCard title="Questions Selection" subtitle={`${selectedQs.length} items checked`} className="border-alfa-blue/5 flex flex-col">
                    <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2 mt-4 pb-4">
                        {questions.map(q => {
                            const isSelected = selectedQs.includes(q.id);
                            return (
                                <button key={q.id} onClick={() => setSelectedQs(isSelected ? selectedQs.filter(id => id !== q.id) : [...selectedQs, q.id])} className={`w-full text-start p-5 rounded-[1.5rem] border-2 transition-all duration-300 ${isSelected ? 'bg-alfa-blue text-white shadow-xl border-alfa-blue' : 'alfa-glass text-alfa-blue border-transparent hover:border-white/60'}`}>
                                    <p className="font-bold text-sm leading-snug mb-2">{lang === 'ar' ? q?.text?.ar : q?.text?.en}</p>
                                    <span className={`text-[9px] uppercase tracking-widest font-black ${isSelected ? 'opacity-60' : 'opacity-30'}`}>{q?.type} • {lang === 'ar' ? q?.category?.ar : q?.category?.en}</span>
                                </button>
                            );
                        })}
                    </div>
                </AlfaCard>
            </div>
        </div>
    );
  };

  const AdminQuestions = () => {
    const [isAddModal, setIsAddModal] = useState(false);
    const [newQ, setNewQ] = useState<Partial<Question>>({ type: 'mc', category: { ar: 'عام', en: 'General' }, points: 5 });
    const [mcOptions, setMcOptions] = useState(['', '', '']);

    const deleteQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const addQuestion = () => {
        if (!newQ.text?.ar || !newQ.correctAnswer) return;
        const q: Question = {
            id: 'q' + (questions.length + 1),
            text: newQ.text as any,
            type: newQ.type as any,
            correctAnswer: newQ.correctAnswer,
            category: newQ.category as any,
            points: newQ.points || 0,
            options: newQ.type === 'mc' ? { ar: mcOptions, en: mcOptions } : undefined
        };
        setQuestions([...questions, q]);
        setIsAddModal(false);
        setNewQ({ type: 'mc', category: { ar: 'عام', en: 'General' } });
        setMcOptions(['', '', '']);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-12 max-w-5xl mx-auto overflow-y-auto flex flex-col gap-6 pb-32" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-alfa-blue p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-alfa-neon-blue/40 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-alfa-blue to-alfa-neon-blue/20" />
            <div className="flex items-center gap-4 relative z-10">
                <button onClick={() => setScreen('admin_dashboard')} className="w-10 h-10 sm:w-14 sm:h-14 bg-white/10 alfa-glass rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-all text-white border-white/20">
                    <ArrowLeft className={`w-6 h-6 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
                <h1 className="text-xl sm:text-2xl font-black text-white">{lang === 'ar' ? 'بنك الأسئلة' : 'Question Bank'}</h1>
            </div>
            <AlfaButton onClick={() => setIsAddModal(true)} className="h-12 sm:h-14 px-6 text-sm relative z-10 shadow-lg">
                <Plus className="w-4 h-4 mr-1" /> {lang === 'ar' ? 'سؤال جديد' : 'New'}
            </AlfaButton>
        </header>

            <AnimatePresence>
                {isAddModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-end p-4 bg-alfa-blue/10 backdrop-blur-sm">
                        <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="h-full w-full max-w-md alfa-glass rounded-[2.5rem] p-8 overflow-y-auto shadow-[0_0_50px_rgba(0,40,85,0.15)] border-l-2 border-l-alfa-blue/20">
                            <h2 className="text-2xl font-black text-alfa-blue mb-8 tracking-tight">{lang === 'ar' ? 'إضافة سؤال جديد' : 'Add Question'}</h2>
                            <div className="flex flex-col gap-6">
                                <AlfaInput label={lang === 'ar' ? 'نص السؤال (بالعربي)' : 'Question (Arabic)'} value={newQ.text?.ar} onChange={(e) => setNewQ({...newQ, text: {ar: e.target.value, en: e.target.value} as any})} />
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-2">{lang === 'ar' ? 'نوع السؤال' : 'Question Type'}</label>
                                    <select value={newQ.type} onChange={(e) => {
                                        const type = e.target.value as any;
                                        setNewQ({...newQ, type, correctAnswer: type === 'tf' ? 'True' : ''});
                                    }} className="w-full h-14 alfa-glass rounded-2xl px-5 font-black text-alfa-blue outline-none border-none shadow-md">
                                        <option value="tf">{lang === 'ar' ? 'صح أم خطأ' : 'True / False'}</option>
                                        <option value="mc">{lang === 'ar' ? 'اختيارات متعددة' : 'Multiple Choice'}</option>
                                    </select>
                                </div>

                                {newQ.type === 'mc' && (
                                    <div className="space-y-4 p-4 rounded-3xl bg-alfa-blue/5 border border-alfa-blue/10">
                                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest text-center">{lang === 'ar' ? 'الخيارات المتاحة' : 'Options'}</p>
                                        {mcOptions.map((opt, i) => (
                                            <AlfaInput key={i} label={`${lang === 'ar' ? 'الخيار' : 'Option'} ${i + 1}`} value={opt} onChange={(e) => {
                                                const newOps = [...mcOptions];
                                                newOps[i] = e.target.value;
                                                setMcOptions(newOps);
                                                // Reset correct answer if it's no longer in options
                                                if (newQ.correctAnswer === opt) setNewQ({...newQ, correctAnswer: ''});
                                            }} />
                                        ))}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <AlfaInput label={lang === 'ar' ? 'الدرجة' : 'Score Points'} type="number" value={newQ.points?.toString()} onChange={(e) => setNewQ({...newQ, points: Number(e.target.value)})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black opacity-40 uppercase tracking-widest px-2">{lang === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer'}</label>
                                    {newQ.type === 'tf' ? (
                                        <select value={newQ.correctAnswer} onChange={(e) => setNewQ({...newQ, correctAnswer: e.target.value})} className="w-full h-14 alfa-glass rounded-2xl px-5 font-black text-alfa-blue outline-none border-none shadow-md">
                                            <option value="True">{lang === 'ar' ? 'صح' : 'True'}</option>
                                            <option value="False">{lang === 'ar' ? 'خطأ' : 'False'}</option>
                                        </select>
                                    ) : (
                                        <select value={newQ.correctAnswer} onChange={(e) => setNewQ({...newQ, correctAnswer: e.target.value})} className="w-full h-14 alfa-glass rounded-2xl px-5 font-black text-alfa-blue outline-none border-none shadow-md">
                                            <option value="" disabled>{lang === 'ar' ? 'اختر الإجابة' : 'Select answer'}</option>
                                            {mcOptions.filter(o => o.trim()).map((opt, i) => (
                                                <option key={i} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 mt-8">
                                    <AlfaButton onClick={addQuestion} className="w-full h-14 shadow-lg">{lang === 'ar' ? 'حفظ السؤال' : 'Save Question'}</AlfaButton>
                                    <AlfaButton variant="outline" onClick={() => setIsAddModal(false)} className="w-full h-14 opacity-50">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</AlfaButton>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {questions.map(q => (
                    <AlfaCard key={q.id} className="relative border-white shadow-xl rounded-[2.5rem] p-6">
                        <div className="flex justify-between items-start mb-4">
                             <div>
                                <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">{lang === 'ar' ? q?.category?.ar : q?.category?.en} • {q?.type}</span>
                                <h3 className="text-lg font-black text-alfa-blue mt-0.5 leading-tight">{lang === 'ar' ? q?.text?.ar : q?.text?.en}</h3>
                             </div>
                             <button className="p-3 rounded-xl bg-red-50 text-alfa-red hover:bg-red-100" onClick={() => deleteQuestion(q.id)}>
                                <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(lang === 'ar' ? q.options?.ar : q.options?.en || [text.true, text.false])?.map(opt => (
                                <div key={opt} className={`px-4 py-2 rounded-lg text-xs font-black border ${opt === q.correctAnswer || (q.type === 'tf' && (opt === text.true ? 'True' : 'False') === q.correctAnswer) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white/40 border-transparent opacity-40'}`}>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </AlfaCard>
                ))}
            </div>
        </div>
    );
  };


  const ExamScreenProxy = () => (
    <ExamScreen 
        activeExam={activeExam}
        questions={questions}
        examStep={examStep}
        setExamStep={setExamStep}
        answers={answers}
        setAnswers={setAnswers}
        completeExam={completeExam}
        lang={lang}
        isRtl={isRtl}
        text={text}
        getExamQuestions={getExamQuestions}
        setScreen={setScreen}
    />
  );

  return (
    <div className="h-screen w-full flex flex-col select-none bg-alfa-bg text-alfa-text alfa-app-border overflow-hidden">
       <main className="flex-1 overflow-y-auto w-full relative">
           <AnimatePresence mode="wait">
            {screen === 'login' && <LoginScreen key="login" />}
            {screen === 'dashboard' && <DashboardScreen key="dashboard" />}
            {screen === 'months' && <MonthsScreen key="months" />}
            {screen === 'exam' && <ExamScreenProxy key="exam" />}
            {screen === 'result' && <ResultScreen key="result" />}
            {screen === 'review' && <ReviewScreen key="review" />}
            {screen === 'leaderboard' && <LeaderboardScreen key="leaderboard" />}
            {screen === 'stats' && <StatsScreen key="stats" />}
            {screen === 'admin_dashboard' && <AdminDashboard key="admin" />}
            {screen === 'admin_users' && <AdminUsers key="admin_users" />}
            {screen === 'admin_exams' && <AdminExams key="admin_exams" />}
            {screen === 'admin_exam_edit' && <AdminExamEdit key="admin_exam_edit" />}
            {screen === 'admin_questions' && <AdminQuestions key="admin_questions" />}
            {screen === 'admin_results' && <AdminResults key="admin_results" />}
           </AnimatePresence>
       </main>
       
       <AlfaBottomNav />
    </div>
  );
}
