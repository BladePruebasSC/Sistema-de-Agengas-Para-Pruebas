import React, { useState } from 'react';
import { Star, User, Calendar, MessageSquare, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAppointments } from '../../context/AppointmentContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ReviewsManagement: React.FC = () => {
  const { reviews, updateReview, deleteReview } = useAppointments();
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const filteredReviews = reviews.filter(review => {
    if (filter === 'approved') return review.is_approved;
    if (filter === 'pending') return !review.is_approved;
    return true;
  });

  const handleApprove = async (reviewId: string) => {
    try {
      await updateReview(reviewId, { is_approved: true });
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      await updateReview(reviewId, { is_approved: false });
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta reseña permanentemente?')) {
      try {
        await deleteReview(reviewId);
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating}/5</span>
      </div>
    );
  };

  const getStatusBadge = (review: any) => {
    if (review.is_approved) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Aprobada
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Eye className="h-3 w-3 mr-1" />
          Pendiente
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Gestión de Reseñas</h3>
        
        {/* Filtros */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'approved'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Aprobadas ({reviews.filter(r => r.is_approved).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              filter === 'pending'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pendientes ({reviews.filter(r => !r.is_approved).length})
          </button>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay reseñas para mostrar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{review.client_name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(review.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(review)}
                  </div>

                  {/* Calificación y servicio */}
                  <div className="flex items-center justify-between mb-3">
                    {renderStars(review.rating)}
                    <div className="flex space-x-2">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {review.service_used}
                      </span>
                      {review.barber && (
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          {review.barber.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comentario */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>

                  {/* Información adicional */}
                  <div className="text-xs text-gray-500 mb-4">
                    <p>Teléfono: {review.client_phone}</p>
                    {review.is_verified && (
                      <p className="text-green-600">✓ Cliente verificado</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                {!review.is_approved ? (
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprobar
                  </button>
                ) : (
                  <button
                    onClick={() => handleReject(review.id)}
                    className="flex items-center px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                  >
                    <EyeOff className="h-4 w-4 mr-1" />
                    Ocultar
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(review.id)}
                  className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;