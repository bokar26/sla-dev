import React from 'react';
import { Truck, ArrowRight } from 'lucide-react';

const Logistics = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Truck className="text-emerald-600" size={32} />
          Logistics
        </h1>
        <p className="text-gray-600">
          Shipping planning has moved to <span className="font-medium text-emerald-600">Fulfillment → Select Quote</span> for a streamlined experience.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="mb-4">
            <Truck size={48} className="mx-auto text-emerald-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Streamlined Shipping Planning</h2>
            <p className="text-gray-600 mb-6">
              Our new shipping planner starts from your saved quotes and provides AI-powered route optimization with live progress updates.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">1</span>
                Select Quote
              </span>
              <ArrowRight size={16} />
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">2</span>
                Destination & Preference
              </span>
              <ArrowRight size={16} />
              <span className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">3</span>
                AI Planning & Options
              </span>
            </div>
          </div>

          <a 
            href="#fulfillment" 
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-white font-medium hover:bg-emerald-700 transition-colors"
          >
            <Truck size={20} />
            Go to Fulfillment
          </a>

          <p className="text-xs text-gray-500 mt-4">
            The new shipping planner provides real-time progress updates and generates invoices, production statements, and packing lists automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Logistics;