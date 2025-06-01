import React, { useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { services } from '../utils/mockData';
import { useAppointments } from '../context/AppointmentContext';
import { Phone, CreditCard, MessageSquare, Calendar, Clock, Scissors } from 'lucide-react';

interface BookingFormProps {
  selectedDate: Date;
  selectedTime: string;
  onSuccess: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  selectedDate,
  selectedTime,
  onSuccess
}) => {
  const { createAppointment } = useAppointments();
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    bankAccount: '',
    service: services[0].id
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Name is required';
    }
    
    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = 'Phone number is required';
    } else if (!/^\d{3}-\d{3}-\d{4}$/.test(formData.clientPhone)) {
      newErrors.clientPhone = 'Phone format: 555-123-4567';
    }
    
    if (!formData.bankAccount.trim()) {
      newErrors.bankAccount = 'Bank account is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Create appointment
    const selectedService = services.find(s => s.id === formData.service)?.name || '';
    
    createAppointment({
      date: selectedDate,
      time: selectedTime,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      service: selectedService,
      confirmed: true
    });
    
    // Simulate WhatsApp message
    const appointmentDate = format(selectedDate, 'MMMM d, yyyy');
    const appointmentTime = selectedTime;
    
    toast.success(
      <div>
        <p className="font-bold">Appointment Confirmed!</p>
        <p>WhatsApp confirmation sent to {formData.clientPhone}</p>
      </div>,
      { duration: 5000 }
    );
    
    // Reset form and notify parent
    onSuccess();
  };
  
  const selectedServiceDetails = services.find(s => s.id === formData.service);
  
  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Complete Your Booking</h2>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-2">Appointment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Calendar className="text-gray-600 mr-2 h-5 w-5" />
              <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <Clock className="text-gray-600 mr-2 h-5 w-5" />
              <span>{selectedTime}</span>
            </div>
            <div className="flex items-center">
              <Scissors className="text-gray-600 mr-2 h-5 w-5" />
              <span>{selectedServiceDetails?.name || 'Service'}</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Service
              </label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              >
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - ${service.price} ({service.duration} min)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className={`block w-full p-2 border ${
                  errors.clientName ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="John Doe"
              />
              {errors.clientName && (
                <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number
                </div>
              </label>
              <input
                type="text"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                className={`block w-full p-2 border ${
                  errors.clientPhone ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="555-123-4567"
              />
              {errors.clientPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Bank Account for Confirmation
                </div>
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                className={`block w-full p-2 border ${
                  errors.bankAccount ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="Enter your bank account"
              />
              {errors.bankAccount && (
                <p className="mt-1 text-sm text-red-600">{errors.bankAccount}</p>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex items-center">
            <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-sm text-gray-600">
              A confirmation message will be sent to your WhatsApp after booking.
            </p>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow transition duration-200 ease-in-out transform hover:scale-105"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;