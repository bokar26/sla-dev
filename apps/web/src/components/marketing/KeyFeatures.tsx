import React from 'react';
import { motion } from 'framer-motion';

// Import preview images
import monitorImg from '/images/Preview-Monitor.png';
import sourceImg from '/images/Preview-Source.png';
import fulfillImg from '/images/Preview-Fulfill.png';

const KeyFeatures: React.FC = () => {
  const features = [
    {
      id: 'monitor',
      title: 'Monitor',
      description: 'Track the KPIs that matter—cost, lead time, on-time delivery, emissions and more. SLA Suggestions turn signals into actions so teams boost optimization and hit quarterly goals.',
      image: monitorImg,
      imageAlt: 'Monitor dashboards preview',
      order: 'text-first' // text left, image right
    },
    {
      id: 'source',
      title: 'Source',
      description: 'Source smarter with AI + data matching that goes beyond keywords to real capability fit. Get instant cost estimates, compare options, and save vendors—all in one place. Teams are seeing ~30% product cost reductions from insights that drive vendor pricing down.',
      image: sourceImg,
      imageAlt: 'Sourcing preview',
      order: 'image-first' // image left, text right
    },
    {
      id: 'fulfill',
      title: 'Fulfill',
      description: 'Plan shipments from a saved quote, a saved vendor, or manual details. SLA Route Optimization selects the best lane, mode, and carrier—customers ship ~29% faster on average.',
      image: fulfillImg,
      imageAlt: 'Fulfillment planner preview',
      order: 'text-first' // text left, image right
    }
  ];

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left mb-10 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-6 sm:mb-8">
            Key Features
          </h2>
        </motion.div>

        <div className="space-y-14 lg:space-y-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Text Content */}
              <div className={`lg:col-span-5 ${
                feature.order === 'image-first' ? 'order-1 lg:order-2' : 'order-1'
              }`}>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Image Content */}
              <div className={`lg:col-span-7 ${
                feature.order === 'image-first' ? 'order-2 lg:order-1' : 'order-2'
              }`}>
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={feature.image}
                    alt={feature.imageAlt}
                    loading="lazy"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default KeyFeatures;
