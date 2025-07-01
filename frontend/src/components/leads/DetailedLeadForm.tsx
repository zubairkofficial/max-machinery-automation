import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

interface DetailedLeadFormProps {
  apiUrl: string;
  token: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  machineryInterest?: string;
  machineryNotes?: string;
  hasSurplusMachinery: boolean;
  machineryDetails?: {
    types: string[];
    brands: string[];
    condition: string;
    age: string;
    estimatedValue: number;
  };
}

interface VerificationData {
  valid: boolean;
  message?: string;
  verification?: {
    id: string;
    contactEmail?: string;
    contactPhone?: string;
    contactFirstName?: string;
    contactLastName?: string;
    lead?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }
  }
}

const DetailedLeadForm: React.FC<DetailedLeadFormProps> = ({ apiUrl, token }) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const hasSurplusMachinery = watch('hasSurplusMachinery');

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(`${apiUrl}/verification/validate/${token}`);
        setVerification(response.data);
        
        if (response.data.valid && response.data.verification) {
          // Pre-fill data from verification or lead if available
          const v = response.data.verification;
          
          if (v.lead) {
            setValue('firstName', v.lead.firstName);
            setValue('lastName', v.lead.lastName);
            setValue('email', v.lead.email);
            setValue('phone', v.lead.phone);
          } else {
            setValue('firstName', v.contactFirstName || '');
            setValue('lastName', v.contactLastName || '');
            setValue('email', v.contactEmail || '');
            setValue('phone', v.contactPhone || '');
          }
        } else {
          setValidationError(response.data.message || 'Invalid or expired token');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setValidationError('Failed to validate token. Please request a new link.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [apiUrl, token, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const response = await axios.post(`${apiUrl}/verification/complete/${token}`, data);
      
      if (response.data.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError('Failed to submit your information. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p className="font-bold">Error</p>
          <p>{validationError}</p>
        </div>
        <p className="text-center mt-4">
          Please return to <a href="https://machinerymax.com" className="text-blue-600 hover:underline">MachineryMax.com</a> to request a new link.
        </p>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          <p className="font-bold">Thank You!</p>
          <p>Your information has been submitted successfully. Our team will contact you shortly.</p>
        </div>
        <p className="text-center mt-4">
          Return to <a href="https://machinerymax.com" className="text-blue-600 hover:underline">MachineryMax.com</a>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Complete Your Information</h2>
      
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <p>{submitError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Contact Information</h3>
          
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
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
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
            
            <div>
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
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                id="company"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                {...register('company')}
              />
            </div>
            
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                id="jobTitle"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                {...register('jobTitle')}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              id="location"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="City, State"
              {...register('location')}
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Machinery Information</h3>
          
          <div className="mb-4">
            <label htmlFor="machineryInterest" className="block text-sm font-medium text-gray-700 mb-1">
              What type of machinery are you interested in selling?
            </label>
            <select
              id="machineryInterest"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              {...register('machineryInterest')}
            >
              <option value="">-Select-</option>
              <option value="woodworking">Woodworking Equipment</option>
              <option value="metalworking">Metalworking Equipment</option>
              <option value="printing">Printing Equipment</option>
              <option value="packaging">Packaging Equipment</option>
              <option value="manufacturing">Manufacturing Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center">
              <input
                id="hasSurplusMachinery"
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                {...register('hasSurplusMachinery')}
              />
              <label htmlFor="hasSurplusMachinery" className="ml-2 block text-sm font-medium text-gray-700">
                I have surplus machinery to sell
              </label>
            </div>
          </div>
          
          {hasSurplusMachinery && (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Equipment (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['CNC Machines', 'Saws', 'Sanders', 'Edgebanders', 'Drills', 'Lathes', 'Presses', 'Routers', 'Other'].map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        id={`type-${type}`}
                        type="checkbox"
                        value={type}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('machineryDetails.types')}
                      />
                      <label htmlFor={`type-${type}`} className="ml-2 block text-sm text-gray-700">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brands (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['SCM', 'Biesse', 'Homag', 'Felder', 'Powermatic', 'JET', 'Grizzly', 'Laguna', 'Other'].map((brand) => (
                    <div key={brand} className="flex items-center">
                      <input
                        id={`brand-${brand}`}
                        type="checkbox"
                        value={brand}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        {...register('machineryDetails.brands')}
                      />
                      <label htmlFor={`brand-${brand}`} className="ml-2 block text-sm text-gray-700">
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Condition
                  </label>
                  <select
                    id="condition"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    {...register('machineryDetails.condition')}
                  >
                    <option value="">-Select-</option>
                    <option value="excellent">Excellent - Like New</option>
                    <option value="good">Good - Operational</option>
                    <option value="fair">Fair - Needs Minor Repair</option>
                    <option value="poor">Poor - Needs Major Repair</option>
                    <option value="parts">For Parts Only</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Age
                  </label>
                  <select
                    id="age"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    {...register('machineryDetails.age')}
                  >
                    <option value="">-Select-</option>
                    <option value="0-5">0-5 years</option>
                    <option value="6-10">6-10 years</option>
                    <option value="11-20">11-20 years</option>
                    <option value="20+">20+ years</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Value ($)
                </label>
                <input
                  id="estimatedValue"
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  {...register('machineryDetails.estimatedValue', {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="machineryNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="machineryNotes"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Please provide any additional information about your machinery that would be helpful."
              {...register('machineryNotes')}
            ></textarea>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Information'}
        </button>
      </form>
    </div>
  );
};

export default DetailedLeadForm; 