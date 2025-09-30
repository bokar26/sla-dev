import React from 'react';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  return (
    <section id="about" className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 sm:mb-16 text-left"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-6 sm:mb-8">
            About SLA
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-5xl leading-relaxed font-medium">
            SLA is a data-driven supply chain operating system. We unify vendors, quotes, logistics, and finances into one source of truth, then apply data-informed algorithms to optimize cost, time, and ESG performance so you hit your quarterly targets.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16"
        >
          {/* Left Column */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Unified supply data</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                All your supply signals in one place — vendor profiles, RFQs and quotes, POs, shipments, and financials — continuously synced and queryable
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Intelligence that moves product faster</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Algorithms surface the next best action, flag bottlenecks before they escalate, and recommend faster routes or suppliers to keep lead times tight
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Sourcing & supplier match</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Find and rank factories by fit, capability, compliance, capacity, and historical performance, not just keywords
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Quote & landed-cost modeling</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Generate and compare quotes using real inputs — materials, MOQs, routes, duties — with transparent landed cost projections and margin impact
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Fulfillment & logistics optimization</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Plan routes, balance speed vs cost, and create shipment docs with one click while tracking on-time rates and exception risk
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Finance & margin control</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Tie every decision to dollars with real-time views of COGS, margin, cash cycle, and budget vs actuals across vendors and SKUs
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">ESG & sustainability tracking</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Track supplier certifications, emissions proxies, and material choices; monitor progress toward sustainability and compliance targets
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Targets, KPIs, and accountability</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Set quarterly goals for cost savings, time savings, and ESG; monitor live KPIs; get automated alerts when variances appear and recommendations to close gaps
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 sm:mt-16 text-left"
        >
          <div className="mb-6 sm:mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Your command dashboard</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              A single, role-aware dashboard to manage the entire supply chain — search, quote, fulfill, reconcile — with audit trails and collaboration built in
            </p>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 max-w-5xl leading-relaxed font-medium italic">
            your real time command center for supply operations
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
