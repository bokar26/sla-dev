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
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-black">E-Commerce Solutions</h2>
            <p className="mt-6 max-w-3xl text-lg sm:text-xl md:text-2xl text-black">
              Find and maximize margins on winning products instantly this Q4.
            </p>

            <div className="mt-8">
              <a
                href="/ecommerce"
                className="inline-flex items-center rounded-2xl border border-black px-6 py-4 text-base font-semibold text-black hover:bg-black hover:text-white transition"
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
