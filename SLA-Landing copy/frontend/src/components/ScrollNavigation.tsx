import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ScrollNavigation: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<'hero' | 'heroWaitlist' | 'about' | 'waitlist' | 'demo'>('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Get all section elements
      const sections = document.querySelectorAll('section');
      let currentSectionName: 'hero' | 'heroWaitlist' | 'about' | 'waitlist' | 'demo' = 'hero';
      
      // Check each section to see which one is currently in view
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        // If scroll position is within this section's bounds
        if (scrollY >= sectionTop - 100 && scrollY < sectionTop + sectionHeight - 100) {
          const id = section.id;
          if (id === 'heroWaitlist') currentSectionName = 'heroWaitlist';
          else if (id === 'about') currentSectionName = 'about';
          else if (id === 'waitlist') currentSectionName = 'waitlist';
          else if (id === 'demo') currentSectionName = 'demo';
          else currentSectionName = 'hero'; // Default for hero section (no id)
        }
      });
      
      setCurrentSection(currentSectionName);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getNextSection = () => {
    switch (currentSection) {
      case 'hero': return { label: 'WAITLIST', href: '#heroWaitlist', direction: 'down' };
      case 'heroWaitlist': return { label: 'ABOUT', href: '#about', direction: 'down' };
      case 'about': return { label: 'WAITLIST', href: '#waitlist', direction: 'down' };
      case 'waitlist': return { label: 'DEMO', href: '#demo', direction: 'down' };
      case 'demo': return { label: 'TOP', href: '#top', direction: 'up' };
      default: return { label: 'WAITLIST', href: '#heroWaitlist', direction: 'down' };
    }
  };

  const nextSection = getNextSection();

  const handleNavigation = () => {
    if (nextSection.href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      document.querySelector(nextSection.href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed right-8 bottom-16 z-50"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-center cursor-pointer"
          onClick={handleNavigation}
        >
          <div className="text-green-400 mb-2">
            <svg 
              className="w-6 h-6 mx-auto" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ transform: nextSection.direction === 'up' ? 'rotate(180deg)' : 'none' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 font-light tracking-wider">{nextSection.label}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScrollNavigation;
