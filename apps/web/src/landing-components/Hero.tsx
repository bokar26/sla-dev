import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import LoginDialog from '../components/auth/LoginDialog';

const Hero: React.FC = () => {
  const { user, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const isAuthenticated = !!user;
  
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
      <div className="relative z-10 min-h-screen flex flex-col justify-between py-12 sm:py-16 lg:py-20">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 sm:mt-28 md:mt-0">
          {/* Navigation */}
          <div className="mb-16 sm:mb-24 lg:mb-36 relative z-20">
            <nav className="text-xs sm:text-sm font-medium tracking-wide">
              <a href="#about" className="text-black hover:text-black/80 focus:text-black/90 transition-colors">ABOUT</a>
              <span className="mx-2 sm:mx-3 text-black/60">|</span>
              <a href="#features" className="text-black hover:text-black/80 focus:text-black/90 transition-colors">FEATURES</a>
              <span className="mx-2 sm:mx-3 text-black/60">|</span>
              <a href="#demo" className="text-black hover:text-black/80 focus:text-black/90 transition-colors">DEMO</a>
              <span className="mx-2 sm:mx-3 text-black/60">|</span>
              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="text-black hover:text-black/80 focus:text-black/90 transition-colors"
                >
                  LOGOUT
                </button>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="text-black hover:text-black/80 focus:text-black/90 transition-colors"
                >
                  LOGIN
                </button>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="text-left mb-12 sm:mb-16 lg:mb-24">
            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-8xl 2xl:text-9xl font-bold text-gray-900 mb-4 tracking-tight"
            >
              SLA
            </motion.h1>
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="text-base sm:text-lg lg:text-xl text-gray-700 font-light tracking-wide mb-8 sm:mb-12 lg:mb-16 italic"
            >
              supply made simple
            </motion.p>

            {/* Call to Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 sm:gap-8 lg:gap-16 xl:gap-24"
            >
              <a
                href="#demo"
                className="text-gray-900 hover:text-green-600 transition-colors underline underline-offset-4 decoration-2 hover:decoration-green-600 text-sm sm:text-base"
              >
                BOOK DEMO
              </a>
              <a
                href="#about"
                className="text-gray-900 hover:text-green-600 transition-colors underline underline-offset-4 decoration-2 hover:decoration-green-600 text-sm sm:text-base"
              >
                LEARN MORE
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
              <p className="text-xs sm:text-sm text-gray-600 font-light tracking-wide leading-relaxed">
                Intelligence that moves product faster
              </p>
              <p className="text-xs text-gray-600 font-light tracking-wide leading-relaxed mt-2 italic">
                Seamlessly save, monitor, and manage factories through your personal dashboard.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </section>
  );
};

export default Hero;
