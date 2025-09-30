import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Twitter, Linkedin, Github, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="bg-dark-900 text-white">
      <div className="container-custom py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-6">
              <Truck className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold text-primary-500">
                smpl logistics
              </span>
            </div>
            
            <p className="text-dark-300 mb-6 max-w-md">
              Transforming logistics with intelligent technology. We're building the future of 
              supply chain management with AI-powered solutions.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-dark-300">
                <Mail className="w-4 h-4" />
                <span>hello@smpllogistics.com</span>
              </div>
              <div className="flex items-center gap-3 text-dark-300">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-dark-300">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </motion.div>

          {/* Platform Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">Platform</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('waitlist')}
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Waitlist
                </button>
              </li>
              <li>
                <a 
                  href="#pricing" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a 
                  href="#api" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  API
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">Company</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#about-us" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  About Us
                </a>
              </li>
              <li>
                <a 
                  href="#careers" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Careers
                </a>
              </li>
              <li>
                <a 
                  href="#blog" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Blog
                </a>
              </li>
              <li>
                <a 
                  href="#press" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Press
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="text-dark-300 hover:text-primary-400 transition-colors duration-200"
                >
                  Contact
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-6 text-white">Connect</h4>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/smpllogistics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dark-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/smpllogistics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dark-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/smpllogistics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-dark-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
            
            <div className="mt-6">
              <h5 className="text-sm font-medium text-dark-400 mb-3">Newsletter</h5>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 bg-dark-800 border border-dark-700 rounded-l-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-r-lg transition-colors duration-200">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-dark-800"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-dark-400 text-sm">
              © {currentYear} smpl logistics. All rights reserved.
            </p>
            
            <div className="flex space-x-6 text-sm text-dark-400">
              <a href="#privacy" className="hover:text-primary-400 transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#terms" className="hover:text-primary-400 transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#cookies" className="hover:text-primary-400 transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
