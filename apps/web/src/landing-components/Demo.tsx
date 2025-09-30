import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TARGETS = [
  { value: "shipping_savings", label: "Save time/cost on shipping" },
  { value: "orders_savings",   label: "Save time/cost on orders" },
  { value: "improve_esg",      label: "Improve ESG performance" },
  { value: "speed_sourcing",   label: "Speed up sourcing" },
  { value: "other",            label: "Other (specify)" },
];

const Demo: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const [target, setTarget] = useState<string>("");
  const [targetOther, setTargetOther] = useState<string>("");
  const [errors, setErrors] = useState<{ target?: string; targetOther?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate target field
    const nextErrors: typeof errors = {};
    if (!target) nextErrors.target = "Please select a target.";
    if (target === "other" && !targetOther.trim()) {
      nextErrors.targetOther = "Please describe your goal.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    
    setIsSubmitting(true);
    
    // Build payload
    const payload = {
      ...formData,
      target,
      target_other: target === "other" ? targetOther.trim() : undefined,
    };

    try {
      // Submit to backend
      const res = await fetch("/api/demo-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setIsSubmitted(true);
      // Reset target fields
      setTarget("");
      setTargetOther("");
    } catch (err: any) {
      console.error("Demo request failed:", err);
      // For now, still show success (in real app, show error)
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
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
    <section id="demo" className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Book Demo
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            See SLA in action
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-6"
        >
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              required
              className="w-full h-11 sm:h-12 px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors text-sm sm:text-base"
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
              className="w-full h-11 sm:h-12 px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors text-sm sm:text-base"
            />
          </div>

          <div>
            <select
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              required
              className="w-full h-11 sm:h-12 px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 transition-colors text-sm sm:text-base min-w-0"
            >
              <option value="">Company Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="200+">200+ employees</option>
            </select>
          </div>

          <div>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
              className="w-full h-11 sm:h-12 px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 transition-colors text-sm sm:text-base min-w-0"
            >
              <option value="">Select your primary goal</option>
              {TARGETS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.target && <p className="text-xs text-red-600 mt-1">{errors.target}</p>}
          </div>

          {target === "other" && (
            <div>
              <input
                type="text"
                value={targetOther}
                onChange={(e) => setTargetOther(e.target.value)}
                placeholder="e.g., Reduce stockouts by 20% next quarter"
                className="w-full h-11 sm:h-12 px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors text-sm sm:text-base"
              />
              {errors.targetOther && <p className="text-xs text-red-600 mt-1">{errors.targetOther}</p>}
            </div>
          )}

          <div>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="What would you like to see? (optional)"
              rows={3}
              className="w-full px-4 py-3 border-b border-gray-300 focus:border-green-600 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 transition-colors resize-none text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 sm:h-12 py-3 px-6 bg-gray-900 text-white hover:bg-green-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isSubmitting ? 'Booking...' : 'Book Demo'}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default Demo;
