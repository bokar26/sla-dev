import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Demo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate demo booking
    setTimeout(() => {
      setIsSubmitted(true);
      setIsSubmitting(false);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <section id="demo" className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Demo Booked
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            We'll contact you within 24 hours to schedule your SLA demo.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-gray-900 hover:text-green-600 transition-colors underline underline-offset-4 decoration-2 hover:decoration-green-600"
          >
            Book Another
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="demo" className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md mx-auto px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Book Demo
          </h2>
          <p className="text-gray-600">
            See SLA in action
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email Address"
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors"
            />
          </div>

          <div>
            <select
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 transition-colors"
            >
              <option value="">Company Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="200+">200+ employees</option>
            </select>
          </div>

          <div>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="What would you like to see? (optional)"
              rows={3}
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-gray-900 text-white hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Booking...' : 'Book Demo'}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default Demo;
