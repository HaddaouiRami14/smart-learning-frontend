import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import axios from 'axios';
import { 
  X, Save, ChevronLeft, AlertCircle, CheckCircle, Loader, Upload, Plus, 
  Trash2, Download, HelpCircle, CheckSquare, ToggleLeft, Code, Type, FileText
} from 'lucide-react';

const API_BASE = "http://localhost:8080/api/formateur/courses";

interface ContentBlock {
  id: string;
  type: 'text' | 'resource' | 'pending-resource';
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resource?: any;
  file?: File;
}

// Updated interface to support all 4 question types
interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'EDITOR_ANSWER';
  orderIndex: number;
  points: number;
  options: QuizOption[];
  correctAnswer?: string; // For SHORT_ANSWER and EDITOR_ANSWER types
}

interface QuizOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface Quiz {
  title: string;
  description: string;
  passingScore: number;
  questions: QuizQuestion[];
}

interface ExerciseTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

interface Exercise {
  id: string;
  title: string;
  description: string;
  language: 'PYTHON' | 'JAVASCRIPT' | 'JAVA';
  starterCode: string;
  hints: string;
  points: number;
  orderIndex: number;
  timeLimit: number;
  testCases: ExerciseTestCase[];
}

const ChapterEditor = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Quiz state
  const [hasQuiz, setHasQuiz] = useState(false);
  const [loadedQuizId, setLoadedQuizId] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    passingScore: 70,
    questions: []
  });

  // Exercise state
  const [hasExercise, setHasExercise] = useState(false);
  const [loadedExerciseId, setLoadedExerciseId] = useState<number | null>(null);
  const [exercise, setExercise] = useState<Exercise>({
    id: Date.now().toString(),
    title: '',
    description: '',
    language: 'PYTHON',
    starterCode: 'def solution():\n    # Write your code here\n    pass',
    hints: '',
    points: 10,
    orderIndex: 0,
    timeLimit: 10,
    testCases: []
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (chapterId) {
      loadChapter();
    } else {
      addTextBlock();
    }
  }, [courseId, chapterId]);

  const loadChapter = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTitle(response.data.title);
      
      // Load resources
      const resourcesResponse = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}/resources`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const htmlContent = response.data.content || '';
      const initialBlocks: ContentBlock[] = [];
      
      if (htmlContent) {
        initialBlocks.push({
          id: Date.now().toString(),
          type: 'text',
          content: htmlContent
        });
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resourcesResponse.data.forEach((resource: any) => {
        initialBlocks.push({
          id: `resource-${resource.id}`,
          type: 'resource',
          resource
        });
      });
      
      if (initialBlocks.length === 0) {
        initialBlocks.push({
          id: Date.now().toString(),
          type: 'text',
          content: ''
        });
      }
      
      setBlocks(initialBlocks);

      // Load quiz if exists
      try {
        const quizResponse = await axios.get(
          `${API_BASE}/${courseId}/chapters/${chapterId}/quiz?includeAnswers=true`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (quizResponse.data) {
          setHasQuiz(true);
          setLoadedQuizId(quizResponse.data.id);
          setQuiz({
            title: quizResponse.data.title,
            description: quizResponse.data.description || '',
            passingScore: quizResponse.data.passingScore,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            questions: quizResponse.data.questions.map((q: any) => ({
              id: q.id.toString(),
              questionText: q.questionText,
              questionType: q.questionType,
              orderIndex: q.orderIndex,
              points: q.points,
              correctAnswer: q.correctAnswer || '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              options: q.options ? q.options.map((o: any) => ({
                id: o.id.toString(),
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                orderIndex: o.orderIndex
              })) : []
            }))
          });
        }
      } catch (err) {
        console.log('No quiz found for this chapter');
      }

      // Load exercise if exists
      try {
        const exerciseResponse = await axios.get(
          `${API_BASE}/${courseId}/chapters/${chapterId}/exercises`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (exerciseResponse.data && exerciseResponse.data.length > 0) {
          const ex = exerciseResponse.data[0];
          setHasExercise(true);
          setLoadedExerciseId(ex.id);
          setExercise({
            id: ex.id.toString(),
            title: ex.title || '',
            description: ex.description || '',
            language: ex.language,
            starterCode: ex.starterCode || '',
            hints: ex.hints || '',
            points: ex.points,
            orderIndex: ex.orderIndex,
            timeLimit: ex.timeLimit,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            testCases: ex.testCases.map((tc: any) => ({
              id: tc.id.toString(),
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              isHidden: tc.isHidden,
              orderIndex: tc.orderIndex
            }))
          });
        }
      } catch (err) {
        console.log('No exercise found for this chapter');
      }
      
      setError(null);
    } catch (err) {
      setError('Error loading chapter');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTextBlock = () => {
    setBlocks([...blocks, { id: Date.now().toString(), type: 'text', content: '' }]);
  };

  const updateTextBlock = (blockId: string, content: string) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, content } : block
    ));
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      setBlocks([...blocks, {
        id: `pending-${Date.now()}-${Math.random()}`,
        type: 'pending-resource',
        file
      }]);
    });
    e.target.value = '';
  };

  const handleDeleteResource = async (blockId: string, block: ContentBlock) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;

    try {
      if (block.type === 'resource' && block.resource?.id && chapterId) {
        await axios.delete(
          `${API_BASE}/${courseId}/chapters/${chapterId}/resources/${block.resource.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      deleteBlock(blockId);
      setError(null);
    } catch (err) {
      setError('Error deleting resource');
      console.error(err);
    }
  };

  const handleDownloadResource = async (resourceId: number, fileName: string) => {
    try {
      const response = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}/resources/${resourceId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      setError('Error downloading file');
      console.error(err);
    }
  };

  const uploadPendingResources = async (newChapterId: string) => {
    const pendingResources = blocks.filter(b => b.type === 'pending-resource');

    for (const block of pendingResources) {
      if (!block.file) continue;

      try {
        const formData = new FormData();
        formData.append('file', block.file);

        const response = await axios.post(
          `${API_BASE}/${courseId}/chapters/${newChapterId}/resources`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setBlocks(prevBlocks =>
          prevBlocks.map(b =>
            b.id === block.id
              ? { id: `resource-${response.data.id}`, type: 'resource', resource: response.data }
              : b
          )
        );
      } catch (err) {
        setError(`Error uploading ${block.file.name}`);
        console.error(err);
        throw err;
      }
    }
  };

  // Quiz functions - Updated to support all question types
  const addQuestion = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'EDITOR_ANSWER') => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      questionText: '',
      questionType: type,
      orderIndex: quiz.questions.length,
      points: 1,
      correctAnswer: '',
      options: type === 'TRUE_FALSE' 
        ? [
            { id: `${Date.now()}-0`, optionText: 'True', isCorrect: false, orderIndex: 0 },
            { id: `${Date.now()}-1`, optionText: 'False', isCorrect: false, orderIndex: 1 }
          ]
        : type === 'MULTIPLE_CHOICE'
        ? [
            { id: `${Date.now()}-0`, optionText: '', isCorrect: false, orderIndex: 0 },
            { id: `${Date.now()}-1`, optionText: '', isCorrect: false, orderIndex: 1 },
            { id: `${Date.now()}-2`, optionText: '', isCorrect: false, orderIndex: 2 },
            { id: `${Date.now()}-3`, optionText: '', isCorrect: false, orderIndex: 3 }
          ]
        : [] 
    };
    
    setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateQuestion = (questionId: string, field: string, value: any) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateOption = (questionId: string, optionId: string, field: string, value: any) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map(o =>
                o.id === optionId ? { ...o, [field]: value } : o
              )
            }
          : q
      )
    });
  };

  const toggleCorrectAnswer = (questionId: string, optionId: string, questionType: string) => {
  setQuiz({
    ...quiz,
    questions: quiz.questions.map(q => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        options: q.options.map(o => ({
          ...o,
          // TRUE_FALSE → radio (une seule réponse)
          // MULTIPLE_CHOICE → checkbox (plusieurs réponses)
          isCorrect: questionType === 'TRUE_FALSE'
            ? o.id === optionId
            : o.id === optionId ? !o.isCorrect : o.isCorrect
        }))
      };
    })
  });
};

 // ✅ deleteQuestion redevient simple
const deleteQuestion = (questionId: string) => {
  setQuiz({
    ...quiz,
    questions: quiz.questions.filter(q => q.id !== questionId)
  });
};

const saveQuiz = async (savedChapterId: string) => {
  
  if (!hasQuiz) return;
  if (!loadedQuizId && quiz.questions.length === 0) return; 
  
  try {
    const quizData = {
      title: quiz.title || 'Chapter Quiz',
      description: quiz.description || '',
      passingScore: quiz.passingScore,
      questions: quiz.questions.map(q => {
        const baseQuestion = {
          questionText: q.questionText,
          questionType: q.questionType,
          orderIndex: q.orderIndex,
          points: q.points
        };

        if (q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') {
          return {
            ...baseQuestion,
            options: q.options.map(o => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              orderIndex: o.orderIndex
            }))
          };
        }

        return {
          ...baseQuestion,
          correctAnswer: q.correctAnswer || '',
          options: []
        };
      })
    };

    if (loadedQuizId) {
      await axios.put(
        `${API_BASE}/${courseId}/chapters/${savedChapterId}/quiz/${loadedQuizId}`,
        quizData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } else {
      await axios.post(
        `${API_BASE}/${courseId}/chapters/${savedChapterId}/quiz`,
        quizData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
    }
  } catch (err) {
    console.error('Error saving quiz:', err);
    throw err;
  }
};

  const addTestCase = () => {
    const newTestCase: ExerciseTestCase = {
      id: Date.now().toString(),
      input: '',
      expectedOutput: '',
      isHidden: false,
      orderIndex: exercise.testCases.length
    };
    setExercise({ ...exercise, testCases: [...exercise.testCases, newTestCase] });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateTestCase = (testCaseId: string, field: string, value: any) => {
    setExercise({
      ...exercise,
      testCases: exercise.testCases.map(tc =>
        tc.id === testCaseId ? { ...tc, [field]: value } : tc
      )
    });
  };

  const deleteTestCase = (testCaseId: string) => {
    setExercise({
      ...exercise,
      testCases: exercise.testCases.filter(tc => tc.id !== testCaseId)
    });
  };

  const updateLanguage = (lang: 'PYTHON' | 'JAVASCRIPT' | 'JAVA') => {
    const templates = {
      PYTHON: 'def solution():\n    # Write your code here\n    pass',
      JAVASCRIPT: 'function solution() {\n    // Write your code here\n}',
      JAVA: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}'
    };
    
    setExercise({
      ...exercise,
      language: lang,
      starterCode: templates[lang]
    });
  };

  const saveExercise = async (savedChapterId: string) => {
    if (!hasExercise || !exercise.title || exercise.testCases.length === 0) {
      return;
    }

    try {
      const exerciseData = {
        title: exercise.title,
        description: exercise.description,
        language: exercise.language,
        starterCode: exercise.starterCode,
        hints: exercise.hints,
        points: exercise.points,
        orderIndex: exercise.orderIndex,
        timeLimit: exercise.timeLimit,
        testCases: exercise.testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          orderIndex: tc.orderIndex
        }))
      };

      if (loadedExerciseId) {
        await axios.put(
          `${API_BASE}/${courseId}/chapters/${savedChapterId}/exercises/${loadedExerciseId}`,
          exerciseData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        await axios.post(
          `${API_BASE}/${courseId}/chapters/${savedChapterId}/exercises`,
          exerciseData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    } catch (err) {
      console.error('Error saving exercise:', err);
      throw err;
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Chapter title is required');
      return;
    }

    // Validate quiz
    if (hasQuiz && quiz.questions.length > 0) {
      for (const question of quiz.questions) {
        if (!question.questionText.trim()) {
          setError('All quiz questions must have text');
          return;
        }
        
        // Validate options for MULTIPLE_CHOICE and TRUE_FALSE
        if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
          const hasCorrectAnswer = question.options.some(o => o.isCorrect);
          if (!hasCorrectAnswer) {
            setError(`Question "${question.questionText}" must have a correct answer`);
            return;
          }

          if (question.questionType === 'MULTIPLE_CHOICE') {
            for (const option of question.options) {
              if (!option.optionText.trim()) {
                setError('All multiple choice options must have text');
                return;
              }
            }
          }
        }

        // Validate correctAnswer for SHORT_ANSWER and EDITOR_ANSWER
        if (question.questionType === 'SHORT_ANSWER' || question.questionType === 'EDITOR_ANSWER') {
          if (!question.correctAnswer?.trim()) {
            setError(`Question "${question.questionText}" must have a correct answer`);
            return;
          }
        }
      }
    }

    // Validate exercise
    if (hasExercise) {
      if (!exercise.title.trim()) {
        setError('Exercise title is required');
        return;
      }
      if (!exercise.description.trim()) {
        setError('Exercise description is required');
        return;
      }
      if (exercise.testCases.length === 0) {
        setError('At least one test case is required');
        return;
      }
      for (const testCase of exercise.testCases) {
        if (!testCase.input.trim() || !testCase.expectedOutput.trim()) {
          setError('All test cases must have input and expected output');
          return;
        }
      }
    }

    try {
    setLoading(true);

    const textContent = blocks
      .filter(b => b.type === 'text')
      .map(b => b.content)
      .join('\n');

    let finalChapterId = chapterId;

    if (chapterId) {
      await axios.put(
        `${API_BASE}/${courseId}/chapters/${chapterId}`,
        { title: title.trim(), content: textContent },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } else {
      const response = await axios.post(
        `${API_BASE}/${courseId}/chapters`,
        { title: title.trim(), content: textContent },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      finalChapterId = response.data.id;
    }

    if (finalChapterId) {
     if (!hasQuiz && loadedQuizId) {
      console.log('🗑️ Deleting quiz:', loadedQuizId);
        await axios.delete(
          `${API_BASE}/${courseId}/chapters/${finalChapterId}/quiz/${loadedQuizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLoadedQuizId(null); 
        setQuiz({ title: '', description: '', passingScore: 70, questions: [] });
      }

      if (!hasExercise && loadedExerciseId) {
        await axios.delete(
          `${API_BASE}/${courseId}/chapters/${finalChapterId}/exercises/${loadedExerciseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLoadedExerciseId(null); 
      }

      const pendingResources = blocks.filter(b => b.type === 'pending-resource');
      if (pendingResources.length > 0) {
        await uploadPendingResources(finalChapterId);
      }

      await saveQuiz(finalChapterId);
      await saveExercise(finalChapterId);
    }

    setSuccess(true);
    setError(null);
    setTimeout(() => navigate(`/courses/${courseId}`), 1500);
  } catch (err) {
    setError('Error saving chapter');
    console.error(err);
  } finally {
    setLoading(false);
  }
  };

  const getResourceIcon = (resourceType: string) => {
    const iconMap: { [key: string]: string } = {
      'VIDEO': '🎥',
      'PDF': '📄',
      'IMAGE': '🖼️',
      'DOCUMENT': '📝',
      'AUDIO': '🎵',
      'ARCHIVE': '📦',
      'OTHER': '📎'
    };
    return iconMap[resourceType] || '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Helper function to get question type label
  const getQuestionTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'Multiple Choice',
      'TRUE_FALSE': 'True/False',
      'SHORT_ANSWER': 'Short Answer',
      'EDITOR_ANSWER': 'Editor Answer'
    };
    return labels[type] || type;
  };

  // Helper function to get question type color
  const getQuestionTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'MULTIPLE_CHOICE': 'bg-purple-100 text-purple-700',
      'TRUE_FALSE': 'bg-indigo-100 text-indigo-700',
      'SHORT_ANSWER': 'bg-amber-100 text-amber-700',
      'EDITOR_ANSWER': 'bg-teal-100 text-teal-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  if (loading && chapterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading chapter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {chapterId ? '✏️ Edit Chapter' : '✨ Create New Chapter'}
              </h1>
              <p className="text-slate-600 mt-1">
                {chapterId ? 'Update chapter content' : 'Start by filling in the basics'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6 text-red-600" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Success!</p>
              <p className="text-green-700 text-sm">Chapter saved successfully</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-8 space-y-8">
            {/* Title Field */}
            <div className="space-y-3">
              <label htmlFor="title" className="block text-sm font-semibold text-slate-900">
                Chapter Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Introduction to Fundamentals"
                disabled={loading}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-500 placeholder:text-slate-400"
              />
            </div>

            {/* Content Blocks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                📝 Chapter Content
              </h3>

              {blocks.map((block, index) => (
                <div key={block.id} className="space-y-2 border-l-4 border-blue-400 pl-4">
                  {block.type === 'text' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-600">
                          TEXT BLOCK {index + 1}
                        </label>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <CKEditor
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          editor={ClassicEditor as any}
                          data={block.content || ''}
                          onChange={(event, editor) =>
                            updateTextBlock(block.id, editor.getData())
                          }
                          config={{
                            licenseKey: 'GPL',
                            toolbar: [
                              'heading', '|', 'bold', 'italic', 'underline', '|',
                              'link', '|', 'bulletedList', 'numberedList', '|', 'blockQuote',
                              '|', 'undo', 'redo'
                            ],
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {block.type === 'resource' && block.resource && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-600">
                          RESOURCE {index + 1}
                        </label>
                        <button
                          onClick={() => handleDeleteResource(block.id, block)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl">
                            {getResourceIcon(block.resource.resourceType)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {block.resource.fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {block.resource.resourceType} • {formatFileSize(block.resource.fileSize)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadResource(block.resource.id, block.resource.fileName)}
                          className="p-2 text-green-700 bg-white rounded hover:bg-slate-100"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {block.type === 'pending-resource' && block.file && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-slate-600">
                          RESOURCE {index + 1} (Pending)
                        </label>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl">📎</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {block.file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatFileSize(block.file.size)} • <span className="text-yellow-600 font-semibold">Will be uploaded on save</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={addTextBlock}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Text
                </button>

                <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Add Resource
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.mp4,.avi,.mov,.doc,.docx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-purple-600" />
                  Chapter Quiz (Optional)
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Add a quiz to test learner understanding
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-slate-700">Enable Quiz</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={hasQuiz}
                    onChange={(e) => setHasQuiz(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
              </label>
            </div>

            {hasQuiz && (
              <div className="space-y-6">
                {/* Quiz Settings */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={quiz.title || ''}
                      onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                      placeholder="Chapter Quiz"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Passing Score (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={quiz.passingScore}
                      onChange={(e) => setQuiz({ ...quiz, passingScore: parseInt(e.target.value) || 70 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={quiz.description || ''}
                      onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                      placeholder="Quiz instructions..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-4">
                  {quiz.questions.map((question, qIndex) => (
                    <div key={question.id} className="border-2 border-purple-200 rounded-lg p-6 bg-gradient-to-r from-purple-50 to-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
                            Q{qIndex + 1}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.questionType)}`}>
                            {getQuestionTypeLabel(question.questionType)}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Question
                        </label>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) => updateQuestion(question.id, 'questionText', e.target.value)}
                          placeholder="Enter your question..."
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Options for MULTIPLE_CHOICE and TRUE_FALSE */}
                      {(question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Answer Options
                          </label>
                          {question.options.map((option, oIndex) => (
                            <div key={option.id} className="flex items-center gap-3">
                              <button
                                onClick={() => toggleCorrectAnswer(question.id, option.id, question.questionType)}
                                className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-all ${
                                  question.questionType === 'TRUE_FALSE' ? 'rounded-full' : 'rounded-md'
                                } ${
                                  option.isCorrect
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-slate-300 hover:border-green-500'
                                }`}
                              >
                                {option.isCorrect && <CheckSquare className="w-3 h-3 text-white" />}
                              </button>
                              <span className="text-sm font-medium text-slate-600 w-6">
                                {String.fromCharCode(65 + oIndex)}
                              </span>
                              {question.questionType === 'MULTIPLE_CHOICE' ? (
                                <input
                                  type="text"
                                  value={option.optionText}
                                  onChange={(e) => updateOption(question.id, option.id, 'optionText', e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="flex-1 px-3 py-2 bg-slate-100 rounded-lg text-slate-700 font-medium">
                                  {option.optionText}
                                </span>
                              )}
                            </div>
                          ))}
                          <p className="text-xs text-slate-500 mt-2">
                           {question.questionType === 'MULTIPLE_CHOICE'
                                  ? '☑ Click to select one or more correct answers'
                                  : '● Click to select the correct answer'}
                          </p>
                        </div>
                      )}

                      {/* Short Answer Input */}
                      {question.questionType === 'SHORT_ANSWER' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <Type className="w-4 h-4 inline mr-1" />
                            Correct Answer (Short Text)
                          </label>
                          <input
                            type="text"
                            value={question.correctAnswer || ''}
                            onChange={(e) => updateQuestion(question.id, 'correctAnswer', e.target.value)}
                            placeholder="Enter the expected short answer..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                          <p className="text-xs text-slate-500">
                            The student's answer will be compared against this text (case-insensitive)
                          </p>
                        </div>
                      )}

                      {/* Editor Answer (Rich Text) */}
                      {question.questionType === 'EDITOR_ANSWER' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Correct Answer (Rich Text)
                          </label>
                          <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <CKEditor
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              editor={ClassicEditor as any}
                              data={question.correctAnswer || ''}
                              onChange={(event, editor) =>
                                updateQuestion(question.id, 'correctAnswer', editor.getData())
                              }
                              config={{
                                licenseKey: 'GPL',
                                toolbar: [
                                  'heading', '|', 'bold', 'italic', 'underline', '|',
                                  'link', '|', 'bulletedList', 'numberedList', '|', 'blockQuote',
                                  '|', 'undo', 'redo'
                                ],
                              }}
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            The student will provide a rich text answer. This will be reviewed manually or compared.
                          </p>
                        </div>
                      )}

                      {/* Points */}
                      <div className="mt-4 flex items-center gap-3">
                        <label className="text-sm font-medium text-slate-700">Points:</label>
                        <input
                          type="number"
                          min="1"
                          value={question.points}
                          onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 1)}
                          className="w-20 px-3 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Question Buttons - Now with 4 types */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => addQuestion('MULTIPLE_CHOICE')}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Multiple Choice
                  </button>
                  <button
                    onClick={() => addQuestion('TRUE_FALSE')}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add True/False
                  </button>
                  <button
                    onClick={() => addQuestion('SHORT_ANSWER')}
                    className="px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium flex items-center justify-center gap-2"
                  >
                    <Type className="w-5 h-5" />
                    Add Short Answer
                  </button>
                  <button
                    onClick={() => addQuestion('EDITOR_ANSWER')}
                    className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Add Editor Answer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exercise Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Code className="w-6 h-6 text-green-600" />
                  Code Exercise (Optional)
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Add a coding exercise with auto-grading
                </p>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-sm font-medium text-slate-700">Enable Exercise</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={hasExercise}
                    onChange={(e) => setHasExercise(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </div>
              </label>
            </div>

            {hasExercise && (
              <div className="space-y-6">
                {/* Exercise Settings */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Exercise Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={exercise.title || ''}
                      onChange={(e) => setExercise({ ...exercise, title: e.target.value })}
                      placeholder="E.g., Calculate Factorial"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={exercise.description || ''}
                      onChange={(e) => setExercise({ ...exercise, description: e.target.value })}
                      placeholder="Describe the exercise requirements..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Language
                    </label>
                    <select
                      value={exercise.language}
                      onChange={(e) => updateLanguage(e.target.value as 'PYTHON' | 'JAVASCRIPT' | 'JAVA')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="PYTHON">Python</option>
                      <option value="JAVASCRIPT">JavaScript</option>
                      <option value="JAVA">Java</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={exercise.points}
                      onChange={(e) => setExercise({ ...exercise, points: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Starter Code
                    </label>
                    <textarea
                      value={exercise.starterCode || ''}
                      onChange={(e) => setExercise({ ...exercise, starterCode: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-900 text-green-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Hints (Optional)
                    </label>
                    <textarea
                      value={exercise.hints || ''}
                      onChange={(e) => setExercise({ ...exercise, hints: e.target.value })}
                      placeholder="Provide hints to help learners..."
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Test Cases */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">Test Cases</h4>
                    <button
                      onClick={addTestCase}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Test Case
                    </button>
                  </div>

                  {exercise.testCases.map((testCase, tcIndex) => (
                    <div key={testCase.id} className="border-2 border-green-200 rounded-lg p-4 bg-gradient-to-r from-green-50 to-white">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-bold">
                          Test {tcIndex + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={testCase.isHidden}
                              onChange={(e) => updateTestCase(testCase.id, 'isHidden', e.target.checked)}
                              className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-slate-700 font-medium">Hidden Test</span>
                          </label>
                          <button
                            onClick={() => deleteTestCase(testCase.id)}
                            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Input
                          </label>
                          <textarea
                            value={testCase.input}
                            onChange={(e) => updateTestCase(testCase.id, 'input', e.target.value)}
                            placeholder="5"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Expected Output
                          </label>
                          <textarea
                            value={testCase.expectedOutput}
                            onChange={(e) => updateTestCase(testCase.id, 'expectedOutput', e.target.value)}
                            placeholder="120"
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {exercise.testCases.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-green-200 rounded-lg">
                      <p className="text-slate-500 mb-3">No test cases yet</p>
                      <button
                        onClick={addTestCase}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Test Case
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white rounded-xl shadow-lg px-8 py-6 flex items-center justify-end gap-3">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            disabled={loading}
            className="px-6 py-2.5 text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="px-6 py-2.5 text-white font-medium bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Chapter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterEditor;