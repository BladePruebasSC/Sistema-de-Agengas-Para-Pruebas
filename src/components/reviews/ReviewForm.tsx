import React, { useState } from 'react';
import { Star, MessageSquare, User, Phone } from 'lucide-react';
import { useAppointments } from '../../context/AppointmentContext';
import { services } from '../../utils/mockData';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSuccess, onCancel }) => {
  const { createReview, barbers, adminSettings } = useAppointments();
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    rating: 0,
    comment: '',
    service_used: services[0]?.id || '',
    barber_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const truncated = numbers.slice(0, 10);
    const matches = truncated.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!matches) return '';
    const formatted = matches.slice(1).filter(Boolean).join('-');
    const remaining = 12 - formatted.length;
    return formatted + '_'.repeat(Math.max(0, remaining));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({
      ...prev,
      client_phone: formatted
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'client_phone') return;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData({
      ...formData,
      rating
    });
    if (errors.rating) {
      setErrors({
        ...errors,
        rating: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.client_name.trim()) {
      newErrors.client_name = 'El nombre es obligatorio';
    }
    
    if (!formData.client_phone.trim() || formData.client_phone.includes('_')) {
      newErrors.client_phone = 'El teléfono es obligatorio';
    } else if (!/^\d{3}-\d{3}-\d{4}$/.test(formData.client_phone)) {
      newErrors.client_phone = 'Formato: 555-123-4567';
    }
    
    if (formData.rating === 0) {
      newErrors.rating = 'Debe seleccionar una calificación';
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = 'El comentario es obligatorio';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'El comentario debe tener al menos 10 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const cleanPhone = formData.client_phone.replace(/\D/g, '');
      const serviceName = services.find(s => s.id === formData.service_used)?.name || formData.service_used;
      
      await createReview({
        client_name: formData.client_name.trim(),
        client_phone: cleanPhone,
        rating: formData.rating,
        comment: formData.comment.trim(),
        service_used: serviceName,
        barber_id: formData.barber_id || undefined
      });
      
      // Limpiar formulario
      setFormData({
        client_name: '',
        client_phone: '',
        rating: 0,
        comment: '',
        service_used: services[0]?.id || '',
        barber_id: ''
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <MessageSquare className="h-6 w-6 text-red-600 mr-2" />
        <h2 className="text-xl font-semibold">Deja tu Reseña</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Nombre completo
              </div>
            </label>
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              className={`block w-full p-3 border ${
                errors.client_name ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
              placeholder="Tu nombre completo"
            />
            {errors.client_name && (
              <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                Teléfono
              </div>
            </label>
            <input
              type="text"
              name="client_phone"
              value={formData.client_phone}
              onChange={handlePhoneChange}
              className={`block w-full p-3 border ${
                errors.client_phone ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
              placeholder="000-000-0000"
            />
            {errors.client_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.client_phone}</p>
            )}
          </div>
        </div>

        {/* Servicio utilizado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Servicio utilizado
          </label>
          <select
            name="service_used"
            value={formData.service_used}
            onChange={handleChange}
            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          >
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - ${service.price}
              </option>
            ))}
          </select>
        </div>

        {/* Barbero (opcional) */}
        {adminSettings.multiple_barbers_enabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barbero (opcional)
            </label>
            <select
              name="barber_id"
              value={formData.barber_id}
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Seleccionar barbero</option>
              {barbers.map(barber => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Calificación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calificación
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className={`p-1 transition-colors ${
                  star <= formData.rating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                <Star className="h-8 w-8 fill-current" />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {formData.rating > 0 ? `${formData.rating} de 5 estrellas` : 'Selecciona una calificación'}
            </span>
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Comentario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comentario
          </label>
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            rows={4}
            className={`block w-full p-3 border ${
              errors.comment ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
            placeholder="Cuéntanos sobre tu experiencia..."
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Mínimo 10 caracteres. Actual: {formData.comment.length}
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Tu reseña será visible públicamente una vez que sea aprobada. 
          Nos reservamos el derecho de moderar el contenido.
        </p>
      </div>
    </div>
  );
};

export default ReviewForm;