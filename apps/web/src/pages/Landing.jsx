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
        
        {/* E-Commerce Solutions Section */}
        <section id="ecommerce" className="border-t mt-24 pt-20 pb-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold">E-Commerce Solutions</h2>
            <p className="mt-3 text-lg text-gray-600">
              Find and maximize margins on winning products instantly this Q4.
            </p>

            <div className="mt-8">
              <a
                href="/ecommerce"
                className="inline-flex items-center rounded-xl border border-gray-900 px-5 py-3 font-semibold hover:bg-gray-900 hover:text-white transition"
                aria-label="Open mobile app landing page"
              >
                Explore the Mobile App
              </a>
            </div>
          </div>
        </section>
      </main>
      <ScrollNavigation />
    </div>
  );
}
