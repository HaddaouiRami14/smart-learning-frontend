import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { 
  ChevronLeft, BookOpen, Clock, PlayCircle, FileText, Download, 
  AlertCircle, Eye, Sparkles, Film, FileType, Image as ImageIcon, 
  Music, Archive, HelpCircle, CheckCircle, XCircle, Award, RotateCcw, 
  Code, Lightbulb, Play, Loader, Type, FileText as FileTextIcon
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const API_BASE = "http://localhost:8080/api/formateur/courses";

interface Resource { id: number; fileName: string; fileSize: number; resourceType: string; }
interface Chapter { id: number; title: string; content: string; orderIndex: number; resources: Resource[]; createdAt: string; }
interface Course { id: number; title: string; description: string; category: string; price: number; imageUrl: string; isActive: boolean; chapters: Chapter[]; }

interface QuizOption { id: number; optionText: string; isCorrect?: boolean; orderIndex: number; }
interface QuizQuestion { 
  id: number; 
  questionText: string; 
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'EDITOR_ANSWER'; 
  orderIndex: number; 
  points: number; 
  options: QuizOption[]; 
  correctAnswer?: string;
}
interface Quiz { id: number; title: string; description: string; passingScore: number; questions: QuizQuestion[]; }
interface QuizResult { 
  quizId: number; 
  totalQuestions: number; 
  correctAnswers: number; 
  score: number; 
  passed: boolean; 
  passingScore: number; 
  questionResults: { 
    questionId: number; 
    questionText: string; 
    selectedOptionId: number | null;
    selectedOptionIds: number[] | null;
    textAnswer: string | null;
    correctOptionId: number | null;
    correctOptionIds: number[] | null;
    correctAnswer: string | null;
    isCorrect: boolean; 
  }[]; 
}

interface ExerciseTestCase { id: number; input: string; expectedOutput: string | null; isHidden: boolean; orderIndex: number; }
interface Exercise { id: number; title: string; description: string; language: 'PYTHON' | 'JAVASCRIPT' | 'JAVA'; starterCode: string; hints: string; points: number; testCases: ExerciseTestCase[]; }
interface ExerciseResult { exerciseId: number; testsPassed: number; totalTests: number; score: number; passed: boolean; executionTime: number; testResults: { testNumber: number; passed: boolean; input: string | null; expectedOutput: string | null; actualOutput: string | null; isHidden: boolean; status: string; errorMessage: string | null; }[]; }

const CoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizMultiAnswers, setQuizMultiAnswers] = useState<{ [key: number]: number[] }>({});
  const [quizTextAnswers, setQuizTextAnswers] = useState<{ [key: number]: string }>({});
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


  const loadResources = async (chapterId: number) => {
    try {
      const res = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}/resources`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setResources(res.data || []);
    } catch { setResources([]); }
  };

  const handlePreviewResource = async (resource: Resource) => {
    try {
      setLoadingPreview(true);
      setPreviewResource(resource);
      const response = await axios.get(
        `${API_BASE}/${courseId}/chapters/${selectedChapter?.id}/resources/${resource.id}/download`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, responseType: 'blob' }
      );
      const mimeTypes: Record<string, string> = {
        PDF: 'application/pdf',
        IMAGE: response.data.type || 'image/png',
        VIDEO: response.data.type || 'video/mp4',
        AUDIO: response.data.type || 'audio/mpeg',
        DOCUMENT: 'application/octet-stream',
      };
      const blob = new Blob([response.data], {
        type: mimeTypes[resource.resourceType] || 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch {
      setError('Erreur lors du chargement de la preview');
      setPreviewResource(null);
    } finally {
      setLoadingPreview(false);
    }
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch { setError('Erreur lors du téléchargement'); }
  };


  useEffect(() => { loadCourseAndChapters(); }, [courseId]);

  useEffect(() => {
    if (selectedChapter) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadQuiz(selectedChapter.id);
      loadExercise(selectedChapter.id);
      loadResources(selectedChapter.id);
      setQuizResult(null);
      setQuizAnswers({});
      setQuizMultiAnswers({});
      setQuizTextAnswers({});
      setShowQuiz(false);
      setExerciseResult(null);
      setShowHints(false);
      setResources([]);
    }
  }, [selectedChapter]);


  const loadCourseAndChapters = async () => {
    try {
      setLoading(true);
      const courseResponse = await axios.get(`${API_BASE}/${courseId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setCourse(courseResponse.data);
      const chaptersResponse = await axios.get(`${API_BASE}/${courseId}/chapters`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      const sortedChapters = chaptersResponse.data.sort((a: Chapter, b: Chapter) => a.orderIndex - b.orderIndex);
      setChapters(sortedChapters);
      if (sortedChapters.length > 0) setSelectedChapter(sortedChapters[0]);
      setError(null);
    } catch (err) {
      setError('Error loading course');
      console.error(err);
    } finally { setLoading(false); }
  };

  const loadQuiz = async (chapterId: number) => {
    try {
      const quizResponse = await axios.get(`${API_BASE}/${courseId}/chapters/${chapterId}/quiz?includeAnswers=false`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setQuiz(quizResponse.data || null);
    } catch { setQuiz(null); }
  };

  const loadExercise = async (chapterId: number) => {
    try {
      const exerciseResponse = await axios.get(`${API_BASE}/${courseId}/chapters/${chapterId}/exercises`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (exerciseResponse.data?.length > 0) {
        setExercise(exerciseResponse.data[0]);
        setExerciseCode(exerciseResponse.data[0].starterCode);
      } else {
        setExercise(null);
        setExerciseCode('');
      }
    } catch { setExercise(null); setExerciseCode(''); }
  };


  const handleTrueFalseAnswer = (questionId: number, optionId: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleMultiAnswer = (questionId: number, optionId: number) => {
    const current = quizMultiAnswers[questionId] || [];
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    setQuizMultiAnswers(prev => ({ ...prev, [questionId]: updated }));
  };

  const handleTextAnswer = (questionId: number, answer: string) => {
    setQuizTextAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const submitQuiz = async () => {
    if (!quiz || !selectedChapter) return;
    for (const q of quiz.questions) {
      if (q.questionType === 'TRUE_FALSE') {
        if (quizAnswers[q.id] === undefined) { setError('Please answer all questions'); return; }
      } else if (q.questionType === 'MULTIPLE_CHOICE') {
        if (!quizMultiAnswers[q.id] || quizMultiAnswers[q.id].length === 0) { setError('Please answer all questions'); return; }
      } else {
        if (!quizTextAnswers[q.id]?.trim()) { setError('Please answer all questions'); return; }
      }
    }
    try {
      setSubmittingQuiz(true); setError(null);
      const answersPayload = {
        answers: quizAnswers,
        multiAnswers: quizMultiAnswers,
        textAnswers: quizTextAnswers,
      };
      const response = await axios.post(
        `${API_BASE}/${courseId}/chapters/${selectedChapter.id}/quiz/${quiz.id}/submit`,
        answersPayload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }
      );
      setQuizResult(response.data);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      setError('Error submitting quiz');
      console.error(err);
    } finally { setSubmittingQuiz(false); }
  };

  const retakeQuiz = () => {
    setQuizResult(null);
    setQuizAnswers({});
    setQuizMultiAnswers({});
    setQuizTextAnswers({});
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
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }
      );
      setExerciseResult(response.data);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error running code');
      console.error(err);
    } finally { setRunningCode(false); }
  };


  const getLanguageForMonaco = (lang: string) =>
    ({ 'PYTHON': 'python', 'JAVASCRIPT': 'javascript', 'JAVA': 'java' }[lang] || 'python');

  const estimateReadingTime = (content: string) =>
    Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200);

  const getResourceIconComponent = (type: string) => ({
    'VIDEO':    <Film      className="w-5 h-5 text-purple-500" />,
    'PDF':      <FileType  className="w-5 h-5 text-red-500"    />,
    'IMAGE':    <ImageIcon className="w-5 h-5 text-blue-500"   />,
    'DOCUMENT': <FileText  className="w-5 h-5 text-blue-500"   />,
    'AUDIO':    <Music     className="w-5 h-5 text-green-500"  />,
    'ARCHIVE':  <Archive   className="w-5 h-5 text-orange-500" />,
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


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
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

  const currentIndex = chapters.findIndex(c => c.id === selectedChapter?.id);


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
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full">
            <Eye className="w-4 h-4" /> Preview Mode
          </div>
        </div>
      </div>

      {/* Course Hero Banner */}
      {course && (
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
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/20">
                    {course.category}
                  </span>
                  {course.isActive ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">Active</span>
                  ) : (
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">Inactive</span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">{course.title}</h1>
                <p className="text-gray-300 text-base mb-6 max-w-2xl leading-relaxed">{course.description}</p>
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
              <div className="flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-6 text-center min-w-[160px]">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Price</p>
                {course.price === 0 ? (
                  <p className="text-3xl font-extrabold text-green-400">Free</p>
                ) : (
                  <p className="text-3xl font-extrabold text-white">
                    ${course.price}
                    <span className="text-sm font-normal text-gray-400 ml-1">USD</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-4 gap-8">

        {/* Sidebar */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6" /> Course Content</h2>
              <p className="text-indigo-100 mt-2">{chapters.length} chapter{chapters.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`w-full text-left p-5 border-b border-border transition-all ${selectedChapter?.id === chapter.id ? 'bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-600' : 'hover:bg-muted'}`}
                >
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedChapter?.id === chapter.id ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold mb-2 ${selectedChapter?.id === chapter.id ? 'text-indigo-600' : 'text-foreground'}`}>
                        {chapter.title}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chapter content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChapter && (
            <>
              {/* Title card */}
              <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
                <h1 className="text-4xl font-extrabold text-foreground">{selectedChapter.title}</h1>
              </div>

              {/* Chapter body */}
              <div
                className="bg-card rounded-2xl shadow-xl p-10 border border-border prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedChapter.content || '<p>No content</p>' }}
              />

              {/* Resources */}
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
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadResource(resource.id, resource.fileName)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors font-medium"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resource Preview Modal */}
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
                              <Download className="w-4 h-4" />
                              Download
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

              {/* Quiz */}
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

                  {!showQuiz ? (
                    <div className="text-center py-8">
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                      >
                        Start Quiz
                      </button>
                    </div>
                  ) : (
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
                                  <label key={o.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50 dark:bg-purple-950' : 'border-border hover:border-purple-300 hover:bg-muted'}`}>
                                    <input type="checkbox" value={o.id} checked={isSelected} onChange={() => handleMultiAnswer(q.id, o.id)} className="w-5 h-5 text-purple-600 rounded" />
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
                                  <label key={o.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-purple-600 bg-purple-50 dark:bg-purple-950' : 'border-border hover:border-purple-300 hover:bg-muted'}`}>
                                    <input type="radio" name={`q-${q.id}`} value={o.id} checked={isSelected} onChange={() => handleTrueFalseAnswer(q.id, o.id)} className="w-5 h-5 text-purple-600" />
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
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          {error}
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
                  )}

                  {/* Quiz Results */}
                  {quizResult && (
                    <div className="mt-6 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-900 bg-card">
                      <div className="text-center mb-6">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${quizResult.passed ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'} mb-4`}>
                          {quizResult.passed ? <Award className="w-10 h-10 text-green-600" /> : <XCircle className="w-10 h-10 text-red-600" />}
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

                                  {question?.questionType === 'MULTIPLE_CHOICE' && (
                                    <>
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
                                    </>
                                  )}

                                  {question?.questionType === 'TRUE_FALSE' && (
                                    <>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Your answer: {question.options.find(o => o.id === r.selectedOptionId)?.optionText || 'Not answered'}
                                      </p>
                                      {!r.isCorrect && (
                                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                          Correct answer: {question.options.find(o => o.id === r.correctOptionId)?.optionText}
                                        </p>
                                      )}
                                    </>
                                  )}

                                  {(question?.questionType === 'SHORT_ANSWER' || question?.questionType === 'EDITOR_ANSWER') && (
                                    <>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Your answer: <span dangerouslySetInnerHTML={{ __html: r.textAnswer || 'Not answered' }} />
                                      </p>
                                      {!r.isCorrect && (
                                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                          Expected answer: <span dangerouslySetInnerHTML={{ __html: r.correctAnswer || '' }} />
                                        </p>
                                      )}
                                    </>
                                  )}
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
                        <RotateCcw className="w-4 h-4" />
                        Retake Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Exercise */}
              {exercise && (
                <div className="bg-card rounded-2xl shadow-xl p-8 border-2 border-indigo-200 dark:border-indigo-900">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-950 rounded-xl">
                      <Code className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{exercise.title}</h3>
                      {exercise.description && <p className="text-muted-foreground">{exercise.description}</p>}
                      <button onClick={() => setShowHints(!showHints)} className="mt-1 text-sm text-blue-600 font-medium flex items-center gap-1">
                        <Lightbulb className="w-4 h-4" />
                        {showHints ? 'Hide Hints' : 'Show Hints'}
                      </button>
                      {showHints && <p className="mt-1 text-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">{exercise.hints}</p>}
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

export default CoursePreview;