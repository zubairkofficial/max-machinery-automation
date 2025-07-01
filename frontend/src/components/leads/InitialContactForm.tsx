import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface InitialContactFormProps {
  apiUrl: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  intention?: string;
  timeline?: string;
  details?: string;
}

const InitialContactForm: React.FC<InitialContactFormProps> = ({ apiUrl }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await axios.post(`${apiUrl}/verification/send`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });
      
      if (response.data.success) {
        setSubmitSuccess(true);
        reset();
      } else {
        setSubmitError('Failed to send verification. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Request a Free Consultation</h2>
      
      {submitSuccess ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <p>Thank you for your interest! We've sent you a verification link. Please check your email and phone for instructions to complete your information.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <p>{submitError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
              <input
                id="firstName"
                type="text"
                className={`w-full px-3 py-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                {...register('firstName', { required: 'First name is required' })}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
              <input
                id="lastName"
                type="text"
                className={`w-full px-3 py-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                {...register('lastName', { required: 'Last name is required' })}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
            <input
              id="email"
              type="email"
              className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          
          <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
            <input
              id="phone"
              type="tel"
              className={`w-full px-3 py-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10,}$/,
                  message: 'Please enter a valid phone number (at least 10 digits)'
                }
              })}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                id="city"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                {...register('city')}
              />
            </div>
            
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                id="state"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                {...register('state')}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="intention" className="block text-sm font-medium text-gray-700 mb-1">What would you like to do?</label>
            <select
              id="intention"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              {...register('intention')}
            >
              <option value="">-None-</option>
              <option value="sell_surplus">Sell surplus equipment</option>
              <option value="sell_small_facility">Sell a complete facility (small shop)</option>
              <option value="sell_large_facility">Sell a complete facility (large shop)</option>
              <option value="learn_more">Learn more about our process</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">What is your timeline?</label>
            <select
              id="timeline"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              {...register('timeline')}
            >
              <option value="">-None-</option>
              <option value="urgent">Urgently</option>
              <option value="2-4_weeks">2-4 weeks</option>
              <option value="4+_weeks">Longer than 4 weeks</option>
            </select>
          </div>
          
          <div className="mb-6">
            <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">Tell Us More</label>
            <textarea
              id="details"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="The more details you provide, the faster we can tailor our services to meet your needs."
              {...register('details')}
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  );
};

export default InitialContactForm; 