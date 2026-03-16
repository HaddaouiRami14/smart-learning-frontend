import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Plus, Edit2, Trash2, BookOpen, FileText, Clock } from 'lucide-react';

const API_BASE = "http://localhost:8080/api/formateur/courses"; 

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseAndChapters();
  }, [courseId]);

  const loadCourseAndChapters = async () => {
    try {
      setLoading(true);
      
      const courseResponse = await axios.get(
        `${API_BASE}/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setCourse(courseResponse.data);
      
      try {
        const chaptersResponse = await axios.get(
          `${API_BASE}/${courseId}/chapters`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setChapters(chaptersResponse.data);
      } catch (err) {
        setChapters([]);
      }
      
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du cours');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = () => {
    navigate(`/courses/${courseId}/chapters/new`);
  };

  const handleEditChapter = (e,chapterId) => {
    e.stopPropagation(); // ← Empêche la navigation vers ChapterDetail
    navigate(`/courses/${courseId}/chapters/${chapterId}/edit`);
  };

  const handleDeleteChapter = async (e, chapterId) => {
    e.stopPropagation(); // ← Empêche la navigation vers ChapterDetail
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce chapitre?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE}/${courseId}/chapters/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      setChapters(chapters.filter(c => c.id !== chapterId));
    } catch (err) {
      setError('Erreur lors de la suppression du chapitre');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-slate-600 text-lg">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">Cours non trouvé</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux cours
          </button>
        </div>
      </div>
    );
  }

  const handleViewChapter = (chapterId) => {
  navigate(`/courses/${courseId}/chapters/${chapterId}`);
};



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/trainer')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Retour aux cours</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row gap-8 p-8">
            {course.imageUrl && (
              <img 
                src={course.imageUrl} 
                alt={course.title} 
                className="w-full md:w-72 h-64 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">{course.title}</h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">{course.description}</p>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                  {course.category}
                </span>
                <span className="text-3xl font-bold text-emerald-600">
                  ${course.price}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Chapters Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Chapitres du cours</h2>
              <p className="text-slate-600 mt-1">{chapters.length} chapitre{chapters.length !== 1 ? 's' : ''}</p>
            </div>
            <button 
              onClick={handleCreateChapter}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Créer un chapitre
            </button>
          </div>

          {chapters.length > 0 ? (
            <div className="grid gap-4">
              {chapters.map((chapter, index) => (
                <div 
                  key={chapter.id} 
                  onClick={() => handleViewChapter(chapter.id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-200"
                >
                  <div className="p-6">
                    {/* Chapter Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                            Chapitre {index + 1}
                          </span>
                          {chapter.resources && chapter.resources.length > 0 && (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              📎 {chapter.resources.length} ressource{chapter.resources.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{chapter.title}</h3>
                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(chapter.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Chapter Content Preview */}
                    <div  className="bg-slate-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
                      {chapter.content ? (
                        <div 
                          className="text-slate-600 text-sm line-clamp-3"
                          dangerouslySetInnerHTML={{ 
                            __html: chapter.content.substring(0, 250) + (chapter.content.length > 250 ? '...' : '')
                          }}
                        />
                      ) : (
                        <p className="text-slate-400 italic">Pas de contenu</p>
                      )}
                    </div>

                    {/* Chapter Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleEditChapter(e, chapter.id)}
                        className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors duration-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        Éditer
                      </button>
                      <button 
                        onClick={(e) => handleDeleteChapter(e, chapter.id)}
                        className="flex items-center gap-2 flex-1 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-6">Aucun chapitre créé pour ce cours</p>
              <button 
                onClick={handleCreateChapter}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Créer le premier chapitre
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;