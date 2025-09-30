import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../landing-components/Header';
import Hero from '../landing-components/Hero';
import HeroStatsRow from '../components/landing/HeroStatsRow';
import About from '../landing-components/About';
import KeyFeatures from '../components/marketing/KeyFeatures';
import Demo from '../landing-components/Demo';
import ScrollNavigation from '../landing-components/ScrollNavigation';
export default function Landing() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    // Listen for the login event and navigate to dashboard
    const handleLogin = () => {
      navigate('/app/supply-center');
    };

    window.addEventListener('open-login', handleLogin);
    return () => window.removeEventListener('open-login', handleLogin);
  }, [navigate]);

  useEffect(() => {
    // Auto-open login modal when ?login=1 is present
    const params = new URLSearchParams(search);
    if (params.get('login') === '1') {
      // Dispatch event to open login modal
      const ev = new CustomEvent('open-login');
      window.dispatchEvent(ev);
    }
  }, [search]);

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-white">
      <Header />
      <main>
        <Hero />
        <HeroStatsRow />
        <About />
        <KeyFeatures />
        <Demo />
      </main>
      <ScrollNavigation />
    </div>
  );
}
