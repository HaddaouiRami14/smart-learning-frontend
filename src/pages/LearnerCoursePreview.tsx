import React, { useState, useEffect, useCallback ,useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
  ChevronLeft, BookOpen, Clock, PlayCircle, FileText, Download,
  AlertCircle, Eye, Film, FileType, Image as ImageIcon,
  Music, Archive, HelpCircle, CheckCircle, XCircle, Award, RotateCcw,
  Code, Lightbulb, Play, Type, FileText as FileTextIcon
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const API_BASE = "http://localhost:8080/api/learner/courses";
const ENROLLMENT_API = "http://localhost:8080/api/learner/enrollments";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface Resource { id: number; fileName: string; fileSize: number; resourceType: string; }
interface Chapter { id: number; title: string; content: string; orderIndex: number; resources: Resource[]; createdAt: string; }
interface Course { id: number; title: string; description: string; category: string; price: number; level: string; imageUrl: string; isActive: boolean; chapters: Chapter[]; }

interface QuizOption { id: number; optionText: string; isCorrect?: boolean; orderIndex: number; }
interface QuizQuestion {
  id: number; questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'EDITOR_ANSWER';
  orderIndex: number; points: number; options: QuizOption[]; correctAnswer?: string;
}
interface Quiz { id: number; title: string; description: string; passingScore: number; questions: QuizQuestion[]; }
interface QuizResult {
  quizId: number; totalQuestions: number; correctAnswers: number; score: number; passed: boolean; passingScore: number;
  questionResults: {
    questionId: number; questionText: string; selectedOptionId: number | null;
    selectedOptionIds: number[] | null; textAnswer: string | null;
    correctOptionId: number | null; correctOptionIds: number[] | null;
    correctAnswer: string | null; isCorrect: boolean;
  }[];
}
interface ExerciseTestCase { id: number; input: string; expectedOutput: string | null; isHidden: boolean; orderIndex: number; }
interface Exercise { id: number; title: string; description: string; language: 'PYTHON' | 'JAVASCRIPT' | 'JAVA'; starterCode: string; hints: string; points: number; testCases: ExerciseTestCase[]; }
interface ExerciseResult { exerciseId: number; testsPassed: number; totalTests: number; score: number; passed: boolean; executionTime: number; testResults: { testNumber: number; passed: boolean; input: string | null; expectedOutput: string | null; actualOutput: string | null; isHidden: boolean; status: string; errorMessage: string | null; }[]; }
interface Enrollment { id: number; courseId: number; progression: number; dateInscription: string; }

const levelConfig: Record<string, { label: string; color: string }> = {
  BEGINNER:     { label: "Beginner",     color: "bg-green-500/20 text-green-300 border-green-500/30" },
  INTERMEDIATE: { label: "Intermediate", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  ADVANCED:     { label: "Advanced",     color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

const getUserId = (): number | null => {
  try { const stored = localStorage.getItem('user'); if (!stored) return null; return JSON.parse(stored).id ?? null; }
  catch { return null; }
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

const LearnerCoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();
  const { theme } = useTheme();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [unlockedChapters, setUnlockedChapters] = useState<Set<number>>(new Set());
  const [chapterQuizPassed, setChapterQuizPassed] = useState<{ [chapterId: number]: boolean }>({});
  const [chapterExercisePassed, setChapterExercisePassed] = useState<{ [chapterId: number]: boolean }>({});

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});           // TRUE_FALSE
  const [quizMultiAnswers, setQuizMultiAnswers] = useState<{ [key: number]: number[] }>({}); // MULTIPLE_CHOICE
  const [quizTextAnswers, setQuizTextAnswers] = useState<{ [key: number]: string }>({});    // SHORT_ANSWER / EDITOR_ANSWER
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [exerciseCode, setExerciseCode] = useState('');
  const [exerciseResult, setExerciseResult] = useState<ExerciseResult | null>(null);
  const [runningCode, setRunningCode] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const isEnrollingRef = useRef(false);

const notifyProgressUpdated = () => {
    window.dispatchEvent(new CustomEvent('progressUpdated'));
};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyProgressDetail = useCallback((detail: any, sortedChapters: Chapter[]) => {
    const quizPassed: { [id: number]: boolean } = {};
    const exercisePassed: { [id: number]: boolean } = {};
    const unlockedSet = new Set<number>();
    if (sortedChapters.length > 0) unlockedSet.add(sortedChapters[0].id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.entries(detail.chapterProgress || {}).forEach(([chId, prog]: any) => {
      const id = Number(chId);
      if (prog.quizPassed === true) quizPassed[id] = true;
      if (prog.exercisePassed === true) exercisePassed[id] = true;
      if (prog.completed === true) {
        unlockedSet.add(id);
        const idx = sortedChapters.findIndex(c => c.id === id);
        if (idx !== -1 && idx + 1 < sortedChapters.length) unlockedSet.add(sortedChapters[idx + 1].id);
      }
    });
    setChapterQuizPassed(quizPassed);
    setChapterExercisePassed(exercisePassed);
    setUnlockedChapters(unlockedSet);
    if (detail.progression !== undefined)
      setEnrollment(prev => prev ? { ...prev, progression: detail.progression } : prev);
    const lastUnlocked = sortedChapters.filter(c => unlockedSet.has(c.id)).pop();
    if (lastUnlocked) setSelectedChapter(lastUnlocked);
  }, []);

 
    const enrollUser = async (): Promise<Enrollment | null> => {
      if (!userId || !courseId) return null;
      try {
        const check = await axios.get(
          `${ENROLLMENT_API}/${userId}/course/${courseId}`,
          { headers: getAuthHeaders() }
        );
        return check.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (checkErr: any) {
        if (checkErr.response?.status === 404) {
          try {
            const res = await axios.post(
              `${ENROLLMENT_API}/${userId}/enroll/${courseId}`,
              {},
              { headers: getAuthHeaders() }
            );
            return res.data;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (enrollErr: any) {
            if (enrollErr.response?.status === 409 || enrollErr.response?.status === 500) {
              const retry = await axios.get(
                `${ENROLLMENT_API}/${userId}/course/${courseId}`,
                { headers: getAuthHeaders() }
              );
              return retry.data;
            }
            return null;
          }
        }
        return null;
      }
    };

  const loadEnrollment = useCallback(async (sortedChapters: Chapter[]) => {
    if (!userId || !courseId) return;
    try {
      const enrollRes = await axios.get(`${ENROLLMENT_API}/${userId}/course/${courseId}`, { headers: getAuthHeaders() });
      setEnrollment(enrollRes.data);
      try {
        const detailRes = await axios.get(`${ENROLLMENT_API}/${userId}/progress/${courseId}`, { headers: getAuthHeaders() });
        applyProgressDetail(detailRes.data, sortedChapters);
      } catch {
        setUnlockedChapters(new Set([sortedChapters[0].id]));
        setSelectedChapter(sortedChapters[0]);
      }
    } 
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   catch (err: any) {
    
      if (err.response?.status === 404) {
        
        if (isEnrollingRef.current) {
          console.log("Inscription déjà en cours, on ignore.");
          return;
        }
        
        isEnrollingRef.current = true;

        try {
          const newEnrollment = await enrollUser();
          if (newEnrollment) setEnrollment(newEnrollment);
          if (sortedChapters.length > 0) {
            setUnlockedChapters(new Set([sortedChapters[0].id]));
            setSelectedChapter(sortedChapters[0]);
          }
        } finally {
          isEnrollingRef.current = false;
        }
    } else {
        console.error('Failed to load enrollment:', err);
        if (sortedChapters.length > 0) {
            setUnlockedChapters(new Set([sortedChapters[0].id]));
            setSelectedChapter(sortedChapters[0]);
        }
    }
    } 
  }, [userId, courseId, applyProgressDetail]);

  const markCompletedAndUnlock = useCallback(async (chapterId: number, itemType: 'Q' | 'E') => {
    if (!userId || !courseId) return;
    try {
      const res = await axios.post(
        `${ENROLLMENT_API}/${userId}/complete/${courseId}`,
        { item: `${chapterId}:${itemType}` },
        { headers: getAuthHeaders() }
      );
      applyProgressDetail(res.data, chapters);
    } catch (err) { console.error('Failed to mark item completed:', err); }
  }, [userId, courseId, chapters, applyProgressDetail]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [courseRes, chaptersRes] = await Promise.all([
          axios.get(`${API_BASE}/${courseId}`, { headers: getAuthHeaders() }),
          axios.get(`${API_BASE}/${courseId}/chapters`, { headers: getAuthHeaders() }),
        ]);
        setCourse(courseRes.data);
        const sorted = chaptersRes.data.sort((a: Chapter, b: Chapter) => a.orderIndex - b.orderIndex);
        setChapters(sorted);
        if (sorted.length > 0) await loadEnrollment(sorted);
        setError(null);
      } catch { setError('Error loading course'); }
      finally { setLoading(false); }
    };
    load();
  }, [courseId, loadEnrollment]);

  useEffect(() => {
    if (selectedChapter) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadQuiz(selectedChapter.id);
      loadExercise(selectedChapter.id);
      loadResources(selectedChapter.id);
      setQuizResult(null); setQuizAnswers({}); setQuizMultiAnswers({}); setQuizTextAnswers({});
      setShowQuiz(false); setExerciseResult(null); setShowHints(false); setResources([]);
    }
  }, [selectedChapter]);

  const loadResources = async (chapterId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/${courseId}/chapters/${chapterId}/resources`, { headers: getAuthHeaders() });
      setResources(res.data || []);
    } catch { setResources([]); }
  };

  const loadQuiz = async (chapterId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/${courseId}/chapters/${chapterId}/quiz?includeAnswers=false`, { headers: getAuthHeaders() });
      setQuiz(res.data || null);
    } catch { setQuiz(null); }
  };

  const loadExercise = async (chapterId: number) => {
    try {
      const res = await axios.get(`${API_BASE}/${courseId}/chapters/${chapterId}/exercises`, { headers: getAuthHeaders() });
      if (res.data?.length > 0) { setExercise(res.data[0]); setExerciseCode(res.data[0].starterCode); }
      else { setExercise(null); setExerciseCode(''); }
    } catch { setExercise(null); setExerciseCode(''); }
  };

  const handlePreviewResource = async (resource: Resource) => {
    try {
      setLoadingPreview(true);
      setPreviewResource(resource);
      const response = await axios.get(
        `${API_BASE}/${courseId}/chapters/${selectedChapter?.id}/resources/${resource.id}/download`,
        { headers: getAuthHeaders(), responseType: 'blob' }
      );
      const mimeTypes: Record<string, string> = {
        PDF: 'application/pdf',
        IMAGE: response.data.type || 'image/png',
        VIDEO: response.data.type || 'video/mp4',
        AUDIO: response.data.type || 'audio/mpeg',
        DOCUMENT: 'application/octet-stream',
      };
      const blob = new Blob([response.data], { type: mimeTypes[resource.resourceType] || 'application/octet-stream' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError('Erreur lors du chargement de la preview');
      setPreviewResource(null);
    } finally { setLoadingPreview(false); }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewResource(null);
    setPreviewUrl(null);
  };

  const handleDownloadResource = async (resourceId: number, fileName: string) => {
    try {
      const response = await axios.get(
        `${API_BASE}/${courseId}/chapters/${selectedChapter?.id}/resources/${resourceId}/download`,
        { headers: getAuthHeaders(), responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link);
    } catch { setError('Erreur lors du téléchargement'); }
  };

  const handleTrueFalseAnswer = (questionId: number, optionId: number) =>
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionId }));

  const handleMultiAnswer = (questionId: number, optionId: number) => {
    const current = quizMultiAnswers[questionId] || [];
    setQuizMultiAnswers(prev => ({
      ...prev,
      [questionId]: current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId],
    }));
  };

  const handleTextAnswer = (questionId: number, answer: string) =>
    setQuizTextAnswers(prev => ({ ...prev, [questionId]: answer }));

  const submitQuiz = async () => {
    if (!quiz || !selectedChapter) return;
    for (const q of quiz.questions) {
      if (q.questionType === 'TRUE_FALSE' && quizAnswers[q.id] === undefined) { setError('Please answer all questions'); return; }
      if (q.questionType === 'MULTIPLE_CHOICE' && (!quizMultiAnswers[q.id] || quizMultiAnswers[q.id].length === 0)) { setError('Please answer all questions'); return; }
      if ((q.questionType === 'SHORT_ANSWER' || q.questionType === 'EDITOR_ANSWER') && !quizTextAnswers[q.id]?.trim()) { setError('Please answer all questions'); return; }
    }
    try {
      setSubmittingQuiz(true); setError(null);
      const response = await axios.post(
        `${API_BASE}/${courseId}/chapters/${selectedChapter.id}/quiz/${quiz.id}/submit`,
        { answers: quizAnswers, multiAnswers: quizMultiAnswers, textAnswers: quizTextAnswers },
        { headers: getAuthHeaders() }
      );
      setQuizResult(response.data);
      if (response.data.passed) {
    const detailRes = await axios.get(
        `${ENROLLMENT_API}/${userId}/progress/${courseId}`,
        { headers: getAuthHeaders() }
    );
    applyProgressDetail(detailRes.data, chapters);
    notifyProgressUpdated(); 
}
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) { setError(err.response?.data?.message || 'Error submitting quiz'); }
    finally { setSubmittingQuiz(false); }
  };

  const retakeQuiz = () => {
    setQuizResult(null); setQuizAnswers({}); setQuizMultiAnswers({}); setQuizTextAnswers({});
    setShowQuiz(true);
    window.scrollTo({ top: document.getElementById('quiz-section')?.offsetTop || 0, behavior: 'smooth' });
  };

  const runExercise = async () => {
    if (!exercise || !selectedChapter) return;
    try {
      setRunningCode(true); setError(null);
      const response = await axios.post(
        `${API_BASE}/${courseId}/chapters/${selectedChapter.id}/exercises/${exercise.id}/submit`,
        { code: exerciseCode },
        { headers: getAuthHeaders() }
      );
      setExerciseResult(response.data);
      if (response.data.passed) {
    const detailRes = await axios.get(
        `${ENROLLMENT_API}/${userId}/progress/${courseId}`,
        { headers: getAuthHeaders() }
    );
    applyProgressDetail(detailRes.data, chapters);
    notifyProgressUpdated(); 
}
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) { setError(err.response?.data?.message || 'Error running code'); }
    finally { setRunningCode(false); }
  };

  const getLanguageForMonaco = (lang: string) =>
    ({ 'PYTHON': 'python', 'JAVASCRIPT': 'javascript', 'JAVA': 'java' }[lang] || 'python');

  const estimateReadingTime = (content: string) =>
    Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

  const getResourceIconComponent = (type: string) => ({
    'VIDEO':    <Film     className="w-5 h-5 text-purple-500" />,
    'PDF':      <FileType className="w-5 h-5 text-red-500" />,
    'IMAGE':    <ImageIcon className="w-5 h-5 text-blue-500" />,
    'DOCUMENT': <FileText className="w-5 h-5 text-blue-500" />,
    'AUDIO':    <Music    className="w-5 h-5 text-green-500" />,
    'ARCHIVE':  <Archive  className="w-5 h-5 text-orange-500" />,
  }[type] || <FileText className="w-5 h-5 text-gray-500" />);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getQuestionTypeLabel = (type: string) => ({
    'MULTIPLE_CHOICE': 'Multiple Choice',
    'TRUE_FALSE':      'True/False',
    'SHORT_ANSWER':    'Short Answer',
    'EDITOR_ANSWER':   'Editor Answer',
  }[type] || type);

  const getQuestionTypeColor = (type: string) => ({
    'MULTIPLE_CHOICE': 'bg-purple-100 text-purple-700',
    'TRUE_FALSE':      'bg-indigo-100 text-indigo-700',
    'SHORT_ANSWER':    'bg-amber-100 text-amber-700',
    'EDITOR_ANSWER':   'bg-teal-100 text-teal-700',
  }[type] || 'bg-slate-100 text-slate-700');

  const progressPercent = enrollment?.progression ?? 0;
  const currentChapterQuizPassed = selectedChapter ? (chapterQuizPassed[selectedChapter.id] || false) : false;
  const currentChapterExercisePassed = selectedChapter ? (chapterExercisePassed[selectedChapter.id] || false) : false;
  const levelInfo = course?.level ? levelConfig[course.level] : null;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p>Loading course...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <AlertCircle className="w-20 h-20 text-red-500 mb-4" />
      <p>Course not found</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>

          <div className="flex items-center gap-3">
            {progressPercent === 100 ? (
              <>
                {/* Statut Completed */}
                <span className="flex items-center gap-2 px-4 py-1.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold border border-green-300 dark:border-green-700">
                  <CheckCircle className="w-4 h-4" />
                  Completed
                </span>
                {/* Bouton Preview Course */}
                <button
                  onClick={() => {
                    setPreviewMode(true);
                    setSelectedChapter(chapters[0] || null);
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                >
                  <Eye className="w-4 h-4" />
                  Preview Course
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground font-medium">Your Progress</span>
                <div className="w-40 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-indigo-600">{progressPercent}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div className="relative w-full bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 overflow-hidden">
        {course.imageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${course.imageUrl})` }}
          />
        )}
        <div className="relative max-w-7xl mx-auto px-8 py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              {/* Category + Level badges */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20">
                  {course.category}
                </span>
                {levelInfo && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${levelInfo.color}`}>
                    {levelInfo.label}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">
                {course.title}
              </h1>
              <p className="text-gray-300 text-base mb-6 max-w-2xl leading-relaxed">
                {course.description}
              </p>
              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Price + Progress boxes */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-5 text-center min-w-[160px]">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Price</p>
                {course.price === 0 ? (
                  <p className="text-2xl font-extrabold text-green-400">Free</p>
                ) : (
                  <p className="text-2xl font-extrabold text-white">
                    ${course.price.toFixed(2)}
                    <span className="text-sm font-normal text-gray-400 ml-1">USD</span>
                  </p>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-5 text-center min-w-[160px]">
                  {progressPercent === 100 ? (
                    <>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Status</p>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Award className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-lg font-extrabold text-green-400">Completed</p>
                        <p className="text-xs text-gray-400">{chapters.length}/{chapters.length} chapters</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Progress</p>
                      <p className="text-2xl font-extrabold text-indigo-400">{progressPercent}%</p>
                      <div className="w-full h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{unlockedChapters.size}/{chapters.length} chapters</p>
                    </>
                  )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-4 gap-8">

        {/* Sidebar */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6" /> Course Content
              </h2>
              <p className="text-indigo-100 mt-2">{chapters.length} chapter{chapters.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {chapters.map((chapter, index) => {
                const isUnlocked = previewMode || unlockedChapters.has(chapter.id);
                const isSelected = selectedChapter?.id === chapter.id;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => isUnlocked && setSelectedChapter(chapter)}
                    disabled={!isUnlocked}
                    className={`w-full text-left p-5 border-b border-border transition-all
                      ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-600' : ''}
                      ${isUnlocked && !isSelected ? 'hover:bg-muted cursor-pointer' : ''}
                      ${!isUnlocked ? 'opacity-50 cursor-not-allowed bg-muted' : ''}
                    `}
                  >
                    <div className="flex gap-4 items-center">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                        ${isSelected ? 'bg-indigo-600 text-white' : isUnlocked ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground/50'}
                      `}>
                        {isUnlocked ? index + 1 : '🔒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold mb-1
                          ${isSelected ? 'text-indigo-600' : isUnlocked ? 'text-foreground' : 'text-muted-foreground'}
                        `}>
                          {chapter.title}
                        </p>
                        {!isUnlocked && (
                          <p className="text-xs text-muted-foreground">Complete previous chapter to unlock</p>
                        )}
                        {isUnlocked && (
                          <div className="flex items-center gap-2 text-xs">
                            {chapterQuizPassed[chapter.id] && (
                              <span className="text-green-600 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Quiz
                              </span>
                            )}
                            {chapterExercisePassed[chapter.id] && (
                              <span className="text-green-600 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Exercise
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>


        
        {/* Chapter content */}
        <div className="lg:col-span-3 space-y-6">
          {(progressPercent < 100 || previewMode) && selectedChapter && (
            <>
              {/* ✅ Bandeau Preview Mode */}
                {previewMode && (
                  <div className="flex items-center justify-between px-6 py-4 bg-green-500/10 border-2 border-green-300 dark:border-green-700 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">Preview Mode</p>
                        <p className="text-xs text-muted-foreground">Read-only — your progress is saved</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                    >
                      <XCircle className="w-4 h-4" />
                      Exit Preview
                    </button>
                  </div>
                )}
              {/* Chapter title */}
              <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
                <h1 className="text-4xl font-extrabold text-foreground">{selectedChapter.title}</h1>
              </div>

              {/* Chapter body */}
              <div
                className="bg-card rounded-2xl shadow-xl p-10 border border-border prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedChapter.content || '<p>No content</p>' }}
              />

              {/* ── Resources ───────────────────────────────────────────────── */}
              {resources.length > 0 && (
                <div className="bg-card rounded-2xl shadow-xl p-8 border-2 border-blue-200 dark:border-blue-900">
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-500" />
                    Chapter Resources
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                      {resources.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getResourceIconComponent(resource.resourceType)}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{resource.fileName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {resource.resourceType} • {formatFileSize(resource.fileSize)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          {['PDF', 'IMAGE', 'VIDEO', 'AUDIO'].includes(resource.resourceType) && (
                            <button
                              onClick={() => handlePreviewResource(resource)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors font-medium"
                            >
                              <Eye className="w-4 h-4" /> Preview
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadResource(resource.id, resource.fileName)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors font-medium"
                          >
                            <Download className="w-4 h-4" /> Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Preview Modal */}
                  {previewResource && (
                    <div
                      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                      onClick={closePreview}
                    >
                      <div
                        className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted rounded-t-2xl flex-shrink-0">
                          <div className="flex items-center gap-3 min-w-0">
                            {getResourceIconComponent(previewResource.resourceType)}
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{previewResource.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {previewResource.resourceType} • {formatFileSize(previewResource.fileSize)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleDownloadResource(previewResource.id, previewResource.fileName)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors font-medium"
                            >
                              <Download className="w-4 h-4" /> Download
                            </button>
                            <button
                              onClick={closePreview}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Modal body */}
                        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted min-h-0">
                          {loadingPreview ? (
                            <div className="flex flex-col items-center gap-4 py-20">
                              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                              <p className="text-muted-foreground text-sm">Loading preview...</p>
                            </div>
                          ) : previewUrl ? (
                            <>
                              {previewResource.resourceType === 'PDF' && (
                                <iframe src={previewUrl} className="w-full h-full min-h-[70vh]" title={previewResource.fileName} />
                              )}
                              {previewResource.resourceType === 'IMAGE' && (
                                <img src={previewUrl} alt={previewResource.fileName} className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md m-4" />
                              )}
                              {previewResource.resourceType === 'VIDEO' && (
                                <video src={previewUrl} controls autoPlay className="max-w-full max-h-[75vh] rounded-lg shadow-md m-4">
                                  Your browser does not support video playback.
                                </video>
                              )}
                              {previewResource.resourceType === 'AUDIO' && (
                                <div className="flex flex-col items-center gap-6 py-16 px-8">
                                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-xl">
                                    <Music className="w-12 h-12 text-white" />
                                  </div>
                                  <p className="text-foreground font-medium text-lg">{previewResource.fileName}</p>
                                  <audio src={previewUrl} controls autoPlay className="w-full max-w-md">
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                              <AlertCircle className="w-10 h-10 text-red-400" />
                              <p>Failed to load preview.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Quiz ────────────────────────────────────────────────────── */}
              {quiz && (
                <div id="quiz-section" className="bg-card rounded-2xl shadow-xl p-8 border-2 border-purple-200 dark:border-purple-900">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 dark:bg-purple-950 rounded-xl">
                      <HelpCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{quiz.title}</h3>
                      {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}
                      <p className="text-sm text-purple-600 font-medium mt-2">
                        Passing Score: {quiz.passingScore}% • {quiz.questions.length} Questions
                      </p>
                    </div>
                  </div>

                  {/* Already passed state */}
                  {currentChapterQuizPassed && !quizResult && !showQuiz ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950">
                        <CheckCircle className="w-9 h-9 text-green-600" />
                      </div>
                      <p className="text-green-700 dark:text-green-400 font-semibold text-lg">Quiz Already Passed!</p>
                      <p className="text-muted-foreground text-sm">You completed this quiz in a previous session.</p>
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="mt-2 px-6 py-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-lg font-medium hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                      >
                        Retake Anyway
                      </button>
                    </div>

                  ) : !showQuiz && !quizResult ? (
                    <div className="text-center py-8">
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        Start Quiz
                      </button>
                    </div>

                  ) : showQuiz && !quizResult ? (
                    <div className="space-y-6">
                      {quiz.questions.map((q, qi) => (
                        <div key={q.id} className="border-2 border-purple-100 dark:border-purple-900 rounded-xl p-6 bg-card">
                          <div className="flex items-start gap-3 mb-4">
                            <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">Q{qi + 1}</span>
                            <div className="flex-1">
                              <p className="text-lg font-semibold text-foreground">{q.questionText}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getQuestionTypeColor(q.questionType)}`}>
                                {getQuestionTypeLabel(q.questionType)}
                              </span>
                            </div>
                          </div>

                          {/* MULTIPLE_CHOICE */}
                          {q.questionType === 'MULTIPLE_CHOICE' && (
                            <div className="space-y-3 ml-12">
                              <p className="text-xs text-purple-600 font-medium mb-2">Select all that apply</p>
                              {q.options.map((o, oi) => {
                                const isSelected = (quizMultiAnswers[q.id] || []).includes(o.id);
                                return (
                                  <label key={o.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${isSelected ? 'border-purple-600 bg-purple-50 dark:bg-purple-950' : 'border-border hover:border-purple-300 hover:bg-muted'}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => handleMultiAnswer(q.id, o.id)} className="w-5 h-5 text-purple-600 rounded" />
                                    <span className="font-medium text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                                    <span className="text-foreground font-medium">{o.optionText}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* TRUE_FALSE */}
                          {q.questionType === 'TRUE_FALSE' && (
                            <div className="space-y-3 ml-12">
                              {q.options.map((o, oi) => {
                                const isSelected = quizAnswers[q.id] === o.id;
                                return (
                                  <label key={o.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${isSelected ? 'border-purple-600 bg-purple-50 dark:bg-purple-950' : 'border-border hover:border-purple-300 hover:bg-muted'}`}>
                                    <input type="radio" name={`q-${q.id}`} checked={isSelected} onChange={() => handleTrueFalseAnswer(q.id, o.id)} className="w-5 h-5 text-purple-600" />
                                    <span className="font-medium text-muted-foreground">{String.fromCharCode(65 + oi)}.</span>
                                    <span className="text-foreground font-medium">{o.optionText}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* SHORT_ANSWER */}
                          {q.questionType === 'SHORT_ANSWER' && (
                            <div className="ml-12">
                              <div className="flex items-center gap-2 mb-2 text-amber-600">
                                <Type className="w-4 h-4" />
                                <span className="text-sm font-medium">Enter your short answer below:</span>
                              </div>
                              <input
                                type="text"
                                value={quizTextAnswers[q.id] || ''}
                                onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full px-4 py-3 border-2 border-amber-200 dark:border-amber-800 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-background text-foreground"
                              />
                            </div>
                          )}

                          {/* EDITOR_ANSWER */}
                          {q.questionType === 'EDITOR_ANSWER' && (
                            <div className="ml-12">
                              <div className="flex items-center gap-2 mb-2 text-teal-600">
                                <FileTextIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Write your detailed answer below:</span>
                              </div>
                              <div className="border-2 border-teal-200 dark:border-teal-800 rounded-lg overflow-hidden [&_.ck-editor__editable]:!bg-background [&_.ck-editor__editable]:!text-foreground [&_.ck-toolbar]:!bg-muted [&_.ck-toolbar]:!border-border">
                                <CKEditor
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  editor={ClassicEditor as any}
                                  data={quizTextAnswers[q.id] || ''}
                                  onChange={(event, editor) => handleTextAnswer(q.id, editor.getData())}
                                  config={{
                                    licenseKey: 'GPL',
                                    toolbar: ['heading', '|', 'bold', 'italic', 'underline', '|', 'link', '|', 'bulletedList', 'numberedList', '|', 'blockQuote', '|', 'undo', 'redo'],
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                        </div>
                      )}

                      <button
                        onClick={submitQuiz}
                        disabled={submittingQuiz}
                        className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                      >
                        {submittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                      </button>
                    </div>
                  ) : null}

                  {/* Quiz Results */}
                  {quizResult && (
                    <div className="mt-6 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-900 bg-card">
                      <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${quizResult.passed ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'} mb-4`}>
                          {quizResult.passed
                            ? <Award className="w-10 h-10 text-green-600" />
                            : <XCircle className="w-10 h-10 text-red-600" />}
                        </div>
                        <h4 className="text-2xl font-bold text-foreground">
                          {quizResult.passed ? '🎉 Congratulations!' : '📚 Keep Learning!'}
                        </h4>
                        <p className="text-muted-foreground mt-1">
                          You scored {quizResult.score}% ({quizResult.correctAnswers}/{quizResult.totalQuestions} correct)
                        </p>
                        <p className={`text-sm font-medium ${quizResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                          Passing score: {quizResult.passingScore}%
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h5 className="font-semibold text-foreground mb-3">Question Review:</h5>
                        {quizResult.questionResults.map((r, idx) => {
                          const question = quiz.questions.find(q => q.id === r.questionId);
                          return (
                            <div key={r.questionId} className={`p-4 rounded-lg border-2 ${r.isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950'}`}>
                              <div className="flex items-start gap-3">
                                {r.isCorrect
                                  ? <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                  : <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{idx + 1}. {r.questionText}</p>

                                  {question?.questionType === 'MULTIPLE_CHOICE' && (<>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Your answers: {(r.selectedOptionIds || []).length > 0
                                        ? (r.selectedOptionIds || []).map(id => question.options.find(o => o.id === id)?.optionText).filter(Boolean).join(', ')
                                        : 'Not answered'}
                                    </p>
                                    {!r.isCorrect && (
                                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                        Correct answers: {(r.correctOptionIds || []).map(id => question.options.find(o => o.id === id)?.optionText).filter(Boolean).join(', ')}
                                      </p>
                                    )}
                                  </>)}

                                  {question?.questionType === 'TRUE_FALSE' && (<>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Your answer: {question.options.find(o => o.id === r.selectedOptionId)?.optionText || 'Not answered'}
                                    </p>
                                    {!r.isCorrect && (
                                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                        Correct answer: {question.options.find(o => o.id === r.correctOptionId)?.optionText}
                                      </p>
                                    )}
                                  </>)}

                                  {(question?.questionType === 'SHORT_ANSWER' || question?.questionType === 'EDITOR_ANSWER') && (<>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Your answer: <span dangerouslySetInnerHTML={{ __html: r.textAnswer || 'Not answered' }} />
                                    </p>
                                    {!r.isCorrect && (
                                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                        Expected answer: <span dangerouslySetInnerHTML={{ __html: r.correctAnswer || '' }} />
                                      </p>
                                    )}
                                  </>)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={retakeQuiz}
                        className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" /> Retake Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Exercise ─────────────────────────────────────────────────── */}
              {exercise && (
                <div className="bg-card rounded-2xl shadow-xl p-8 border-2 border-indigo-200 dark:border-indigo-900">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950 rounded-xl">
                      <Code className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-foreground">{exercise.title}</h3>
                        {currentChapterExercisePassed && (
                          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" /> Completed
                          </span>
                        )}
                      </div>
                      {exercise.description && <p className="text-muted-foreground">{exercise.description}</p>}
                      <button
                        onClick={() => setShowHints(!showHints)}
                        className="mt-1 text-sm text-blue-600 font-medium flex items-center gap-1"
                      >
                        <Lightbulb className="w-4 h-4" />
                        {showHints ? 'Hide Hints' : 'Show Hints'}
                      </button>
                      {showHints && (
                        <p className="mt-1 text-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">{exercise.hints}</p>
                      )}
                    </div>
                  </div>

                  <Editor
                    height="300px"
                    language={getLanguageForMonaco(exercise.language)}
                    value={exerciseCode}
                    onChange={setExerciseCode}
                    theme="vs-dark"
                  />

                  <button
                    onClick={runExercise}
                    disabled={runningCode}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {runningCode ? 'Running...' : 'Run Code'}
                  </button>

                  {exerciseResult && (
                    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-xl border border-indigo-200 dark:border-indigo-800">
                      <h4 className="font-semibold text-lg mb-2 text-foreground">Exercise Results</h4>
                      <p className="text-muted-foreground">Score: {exerciseResult.score}/{exerciseResult.totalTests} tests passed</p>
                      {exerciseResult.testResults.map(tr => (
                        <div key={tr.testNumber} className={`mt-2 p-3 rounded-lg border-2 ${tr.passed ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
                          <p className="text-sm font-medium text-foreground">Test {tr.testNumber}: {tr.passed ? '✅ Passed' : '❌ Failed'}</p>
                          {!tr.isHidden && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <p>Input: {tr.input}</p>
                              <p>Expected: {tr.expectedOutput}</p>
                              <p>Got: {tr.actualOutput}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnerCoursePreview;