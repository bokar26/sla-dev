import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'factories', label: 'Factories', icon: '🏭' },
    { id: 'quotes', label: 'Quotes', icon: '💰' },
    { id: 'demo-requests', label: 'Demo Requests', icon: '📋' },
    { id: 'jobs', label: 'Jobs', icon: '⚙️' },
    { id: 'feature-flags', label: 'Feature Flags', icon: '🚩' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '📝' },
    { id: 'webhooks', label: 'Webhooks', icon: '🔗' },
  ];

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#2c3e50',
      color: 'white',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #34495e',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600'
        }}>
          🔧 Admin Panel
        </h2>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: '12px',
          color: '#bdc3c7'
        }}>
          SocFlow Management
        </p>
      </div>

      {/* User Info */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #34495e',
        backgroundColor: '#34495e'
      }}>
        <div style={{ fontSize: '14px', color: '#ecf0f1' }}>
          <div style={{ fontWeight: '500' }}>{user?.name || user?.email}</div>
          <div style={{ fontSize: '12px', color: '#bdc3c7' }}>
            {user?.role || 'Admin'}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ padding: '10px 0' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: 'none',
              backgroundColor: activeTab === item.id ? '#3498db' : 'transparent',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.2s',
              borderLeft: activeTab === item.id ? '3px solid #2980b9' : '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = '#34495e';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ marginRight: '10px', fontSize: '16px' }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#c0392b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e74c3c';
          }}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
