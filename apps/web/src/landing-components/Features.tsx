import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Map, Users, Zap, Shield, Clock, Target } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Get intelligent recommendations and predictive analytics for your logistics operations",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Monitor performance metrics and track shipments with live dashboards",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Map,
      title: "Smart Routing",
      description: "Optimize delivery routes and reduce costs with intelligent pathfinding",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamlessly coordinate with your team and partners in real-time",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process thousands of logistics decisions in milliseconds",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee",
      color: "from-red-500 to-red-600"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-dark-800 mb-6">
            Meet <span className="text-gradient">SLA</span> - Your Smart Logistics Assistant
          </h2>
          <p className="text-lg md:text-xl text-dark-600 max-w-3xl mx-auto">
            Powered by advanced AI, SLA transforms how you manage logistics operations with 
            intelligent automation and real-time insights.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl border border-dark-100 card-hover"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-dark-800 mb-4">
                {feature.title}
              </h3>
              
              <p className="text-dark-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-r from-primary-50 to-primary-100 rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Clock className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-dark-800 mb-2">24/7 Availability</h3>
              <p className="text-dark-600">Always ready to assist, no matter the time</p>
            </div>
            
            <div className="flex flex-col items-center">
              <Target className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-dark-800 mb-2">99% Accuracy</h3>
              <p className="text-dark-600">Reliable predictions and recommendations</p>
            </div>
            
            <div className="flex flex-col items-center">
              <Zap className="w-12 h-12 text-primary-600 mb-4" />
              <h3 className="text-xl font-semibold text-dark-800 mb-2">Instant Response</h3>
              <p className="text-dark-600">Get answers and solutions in real-time</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
