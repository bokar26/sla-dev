import React from 'react';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  return (
    <section className="min-h-screen relative overflow-hidden">
      {/* Background Image - Full Screen with Early Fade */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="/images/factory-background.png"
            alt="Factory Background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        {/* White fade overlay - starts before halfway for clean white left side */}
        <div className="absolute left-0 top-0 w-3/5 h-full bg-gradient-to-r from-white via-white to-transparent"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between py-20">
        <div className="w-full max-w-7xl mx-auto px-6 pl-4">
          {/* Navigation */}
          <div className="mb-36">
            <nav className="text-sm font-light tracking-wider">
              <a href="#about" className="hover:text-green-600 transition-colors">ABOUT</a>
              <span className="mx-3 text-gray-400">|</span>
              <a href="#waitlist" className="hover:text-green-600 transition-colors">WAITLIST</a>
              <span className="mx-3 text-gray-400">|</span>
              <a href="#demo" className="hover:text-green-600 transition-colors">DEMO</a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="text-left mb-24">
            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-8xl md:text-9xl font-bold text-gray-900 mb-4 tracking-tight"
            >
              SLA
            </motion.h1>
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-700 font-light tracking-wide mb-16 italic"
            >
              Sourcing made simple. Courtesy of SLA.
            </motion.p>

            {/* Call to Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex gap-16 md:gap-24"
            >
              <a
                href="#demo"
                className="text-gray-900 hover:text-green-600 transition-colors underline underline-offset-4 decoration-2 hover:decoration-green-600"
              >
                BOOK DEMO
              </a>
              <a
                href="#waitlist"
                className="text-gray-900 hover:text-green-600 transition-colors underline underline-offset-4 decoration-2 hover:decoration-green-600"
              >
                JOIN WAITLIST
              </a>
            </motion.div>
          </div>

          {/* Bottom Descriptive Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-left"
          >
            <div className="text-left">
              <p className="text-sm text-gray-600 font-light tracking-wide leading-relaxed">
                AI-Powered Access to 10,000+ Factories and Suppliers
              </p>
              <p className="text-xs text-gray-600 font-light tracking-wide leading-relaxed mt-2 italic">
                Seamlessly save, monitor, and manage factories through your personal dashboard.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
