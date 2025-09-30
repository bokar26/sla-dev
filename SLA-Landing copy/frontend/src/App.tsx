import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import HeroWaitlist from './components/HeroWaitlist';
import About from './components/About';
import Waitlist from './components/Waitlist';
import Demo from './components/Demo';
import ScrollNavigation from './components/ScrollNavigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Hero />
          <HeroWaitlist />
          <About />
          <Waitlist />
          <Demo />
        </main>
        <ScrollNavigation />
      </div>
    </Router>
  );
}

export default App;
