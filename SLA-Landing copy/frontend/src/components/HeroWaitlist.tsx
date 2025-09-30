import React, { useState } from 'react';
import { motion } from 'framer-motion';

const HeroWaitlist: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('Successfully joined the waitlist!');
        setFormData({ name: '', email: '', company: '', role: '' });
      } else {
        alert('Failed to join waitlist. Please try again.');
      }
    } catch (error) {
      alert('Error joining waitlist. Please try again.');
    }
  };

  return (
    <section id="heroWaitlist" className="py-20">
      <div className="max-w-7xl mx-auto px-6 pl-4">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-6 items-end"
        >
          {/* Name Input */}
          <div className="flex-1">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors"
              placeholder="Name"
            />
          </div>

          {/* Email Input */}
          <div className="flex-1">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors"
              placeholder="Email"
            />
          </div>

          {/* Company Input */}
          <div className="flex-1">
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors"
              placeholder="Company"
            />
          </div>

          {/* Role Input */}
          <div className="flex-1">
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors"
              placeholder="Role"
            />
          </div>

          {/* Submit Button */}
          <div className="md:w-auto">
            <button
              type="submit"
              className="w-full md:w-auto py-3 px-6 bg-gray-900 text-white hover:bg-green-600 transition-colors duration-300"
            >
              Join Waitlist
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default HeroWaitlist;
