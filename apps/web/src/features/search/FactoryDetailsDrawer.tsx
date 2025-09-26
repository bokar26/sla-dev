import React from 'react';
import { X, MapPin, Phone, Mail, Award, Clock, Package, Users, Building, ExternalLink } from 'lucide-react';
import { Factory as FactoryType } from '../../types/factory';

interface FactoryDetailsDrawerProps {
  factory: FactoryType | null;
  onCreateQuote: () => void;
  onClose: () => void;
}

export const FactoryDetailsDrawer: React.FC<FactoryDetailsDrawerProps> = ({
  factory,
  onCreateQuote,
  onClose,
}) => {
  if (!factory) return null;

  const formatCapacity = (capacity?: number) => {
    if (!capacity) return 'Not specified';
    if (capacity >= 1000000) return `${(capacity / 1000000).toFixed(1)}M units/month`;
    if (capacity >= 1000) return `${(capacity / 1000).toFixed(0)}K units/month`;
    return `${capacity} units/month`;
  };

  const formatLeadTime = (days?: number) => {
    if (!days) return 'Not specified';
    if (days < 30) return `${days} days`;
    const weeks = Math.round(days / 7);
    return `${weeks} weeks`;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Factory Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-3">{factory.name}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              {factory.city && factory.country ? `${factory.city}, ${factory.country}` : factory.country || 'Location not specified'}
            </div>
            {factory.contact_email && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                {factory.contact_email}
              </div>
            )}
            {factory.contact_phone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mr-2" />
                {factory.contact_phone}
              </div>
            )}
          </div>
        </div>

        {/* Specialties */}
        {factory.specialties && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Product Specialties
            </h4>
            <p className="text-sm text-muted-foreground">{factory.specialties}</p>
          </div>
        )}

        {/* Materials */}
        {factory.materials && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Materials Handled</h4>
            <p className="text-sm text-muted-foreground">{factory.materials}</p>
          </div>
        )}

        {/* Certifications */}
        {factory.certifications && factory.certifications.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Certifications
            </h4>
            <div className="flex flex-wrap gap-2">
              {factory.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs rounded-md"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Capacity & Lead Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Building className="w-4 h-4 mr-2" />
              Monthly Capacity
            </h4>
            <p className="text-sm text-muted-foreground">
              {formatCapacity(factory.max_monthly_capacity)}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Lead Time
            </h4>
            <p className="text-sm text-muted-foreground">
              {formatLeadTime(factory.standard_lead_time)}
            </p>
          </div>
        </div>

        {/* Past Clients */}
        {factory.past_clients && factory.past_clients.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Past Clients
            </h4>
            <div className="flex flex-wrap gap-2">
              {factory.past_clients.slice(0, 6).map((client, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-md"
                >
                  {client}
                </span>
              ))}
              {factory.past_clients.length > 6 && (
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                  +{factory.past_clients.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quality Control */}
        {factory.quality_control_processes && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Quality Control</h4>
            <p className="text-sm text-muted-foreground">{factory.quality_control_processes}</p>
          </div>
        )}

        {/* Customization Capabilities */}
        {factory.customization_capabilities && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Customization</h4>
            <p className="text-sm text-muted-foreground">{factory.customization_capabilities}</p>
          </div>
        )}

        {/* Alibaba Integration */}
        {factory.source === 'alibaba' && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <span className="w-4 h-4 mr-2 text-orange-500">🅰</span>
              Alibaba Integration
            </h4>
            <div className="space-y-2">
              {factory.storefrontUrl && (
                <a
                  href={factory.storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Alibaba
                </a>
              )}
              <div className="text-xs text-muted-foreground">
                This factory is sourced from Alibaba.com. You can contact them directly through the Alibaba platform.
              </div>
            </div>
          </div>
        )}

        {/* Match Score */}
        {factory.score && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Match Score</h4>
            <div className="flex items-center">
              <div className="flex-1 bg-muted rounded-full h-2 mr-3">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.min(factory.score * 100, 100)}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(factory.score * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <button
          onClick={onCreateQuote}
          className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium focus-visible:ring-2 focus-visible:ring-ring"
        >
          Create Quote
        </button>
      </div>
    </div>
  );
};
