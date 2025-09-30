import React from 'react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center bg-white py-20">
      <div className="max-w-7xl mx-auto px-6 pl-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 text-left"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            ABOUT SLA
          </h2>
          <p className="text-base md:text-lg text-gray-700 max-w-5xl leading-relaxed font-medium">
            SLA is an AI-powered factory sourcing platform built for brands, manufacturers, and sourcing teams who want to cut through the noise of global production.
          </p>
          <p className="text-base md:text-lg text-gray-700 max-w-5xl leading-relaxed mt-6 font-medium">
            Search products, regions, etc, and SLA surfaces the most relevant and suitable factory at the top of your search.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-16"
        >
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">SEARCH & DISCOVER</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Find factories worldwide with AI-ranked results. The best-fit option is highlighted at the top, with a scrollable list of other vetted matches.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">SAVE & ORGANIZE</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Add promising factories to your personal dashboard, where you can revisit profiles, compare options, and track your sourcing pipeline.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">DEEP RESEARCH</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Get auto-generated product breakdowns that function like a complete tech pack, as to move straight to production with minimal back-and-forth.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">QUOTE GENERATION</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Generate price quotes based on raw material costs and specific factory data. SLA can also suggest logistics strategies for more accurate landed costs.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">KNOWLEDGE LIBRARY</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Access compiled data on materials, use cases, and regional production strengths, helping you refine designs and sourcing choices down to the smallest detail.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-left"
        >
          <p className="text-base md:text-lg text-gray-700 max-w-5xl leading-relaxed font-medium mb-6">
            SLA isn't just a sourcing tool or even a sourcing platform. It's a sourcing partner.
          </p>
          <p className="text-base md:text-lg text-gray-700 max-w-5xl leading-relaxed font-medium">
            By combining AI-driven recommendations with dashboards, material intelligence, and logistics insights, SLA simplifies the entire path from product idea to production.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
