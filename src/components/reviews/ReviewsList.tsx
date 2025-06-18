import React, { useState } from 'react';
import { Star, User, Calendar, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppointments } from '../../context/AppointmentContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewsListProps {
  showAll?: boolean;
  limit?: number;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ showAll = false, limit = 6 }) => {
  const { getApprovedReviews, getAverageRating } = useAppointments();
  const [showAllReviews, setShowAllReviews] = useState(showAll);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  
  const approvedReviews = getApprovedReviews();
  const averageRating = getAverageRating();
  const displayedReviews = showAllReviews ? approvedReviews : approvedReviews.slice(0, limit);

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (approvedReviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aún no hay reseñas</h3>
        <p className="text-gray-600">Sé el primero en dejar una reseña sobre nuestros servicios.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Reseñas de Clientes</h2>
            <p className="text-red-100">Lo que dicen nuestros clientes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {renderStars(Math.round(averageRating), 'lg')}
            </div>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="text-sm text-red-100">
              {approvedReviews.length} reseña{approvedReviews.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de reseñas */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const shouldTruncate = review.comment.length > 150;
            
            return (
              <div
                key={review.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Header de la reseña */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{review.client_name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(review.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {renderStars(review.rating, 'sm')}
                </div>

                {/* Servicio y barbero */}
                <div className="mb-3">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {review.service_used}
                  </span>
                  {review.barber && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full ml-2">
                      Atendido por {review.barber.name}
                    </span>
                  )}
                </div>

                {/* Comentario */}
                <div className="text-gray-700">
                  <p className="leading-relaxed">
                    {isExpanded || !shouldTruncate 
                      ? review.comment 
                      : truncateText(review.comment)
                    }
                  </p>
                  
                  {shouldTruncate && (
                    <button
                      onClick={() => toggleReviewExpansion(review.id)}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                    >
                      {isExpanded ? (
                        <>
                          Ver menos <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Ver más <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón para mostrar más reseñas */}
        {!showAll && approvedReviews.length > limit && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAllReviews(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Ver todas las reseñas ({approvedReviews.length})
            </button>
          </div>
        )}

        {showAllReviews && !showAll && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAllReviews(false)}
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Ver menos reseñas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsList;