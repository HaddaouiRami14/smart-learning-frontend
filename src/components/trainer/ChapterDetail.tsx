import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X, ChevronLeft, AlertCircle, Loader, Download, Trash2, Edit2, BookOpen } from 'lucide-react';

const API_BASE = "http://localhost:8080/api/formateur/courses";

interface Chapter {
  id: number;
  title: string;
  content: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface Resource {
  id: number;
  fileName: string;
  resourceType: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

const ChapterDetail = () => {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (chapterId && courseId) {
      loadChapterAndResources();
    }
  }, [courseId, chapterId]);

  const loadChapterAndResources = async () => {
    try {
      setLoading(true);

      // Charger le chapitre
      const chapterResponse = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setChapter(chapterResponse.data);

      // Charger les ressources
      const resourcesResponse = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}/resources`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setResources(resourcesResponse.data);

      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du chapitre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResource = async (resourceId: number, fileName: string) => {
    try {
      const response = await axios.get(
        `${API_BASE}/${courseId}/chapters/${chapterId}/resources/${resourceId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      setError('Erreur lors du téléchargement');
      console.error(err);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE}/${courseId}/chapters/${chapterId}/resources/${resourceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResources(resources.filter((r) => r.id !== resourceId));
      setError(null);
    } catch (err) {
      setError('Erreur lors de la suppression de la ressource');
      console.error(err);
    }
  };

  const handleEditChapter = () => {
    navigate(`/courses/${courseId}/chapters/${chapterId}/edit`);
  };

  const handleDeleteChapter = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce chapitre?')) {
      return;
    }

    try {
      await axios.delete(
        `${API_BASE}/${courseId}/chapters/${chapterId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError('Erreur lors de la suppression du chapitre');
      console.error(err);
    }
  };

  const getResourceIcon = (resourceType: string) => {
    const iconMap: Record<string, string> = {
      'VIDEO': '🎥',
      'PDF': '📄',
      'IMAGE': '🖼️',
      'DOCUMENT': '📝',
      'AUDIO': '🎵',
      'ARCHIVE': '📦',
      'OTHER': '📎',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Chargement du chapitre...</p>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 text-lg mb-4">Chapitre non trouvé</p>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour au cours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Retour au cours</span>
          </button>
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors duration-200"
            title="Fermer"
          >
            <X className="w-6 h-6 text-red-600" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Erreur</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Chapter Header Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-8 border-b border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{chapter.title}</h1>
                <p className="text-slate-600 text-sm">
                  Créé le {formatDate(chapter.createdAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleEditChapter}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                  title="Éditer le chapitre"
                >
                  <Edit2 className="w-4 h-4" />
                  Éditer
                </button>
                <button
                  onClick={handleDeleteChapter}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition-colors"
                  title="Supprimer le chapitre"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Contenu
            </h2>
            <div
              className="prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-lg p-6 border border-slate-200"
              dangerouslySetInnerHTML={{ __html: chapter.content || '<p class="text-slate-500 italic">Aucun contenu</p>' }}
            />
          </div>
        </div>

        {/* Resources Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 border-b border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900">
              📎 Ressources ({resources.length})
            </h2>
          </div>

          <div className="p-8">
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-3xl flex-shrink-0">
                        {getResourceIcon(resource.resourceType)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {resource.fileName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {resource.resourceType} • {formatFileSize(resource.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleDownloadResource(resource.id, resource.fileName)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <Download className="w-4 h-4" />
                        Télécharger
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-8">
                Aucune ressource disponible pour ce chapitre
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterDetail;