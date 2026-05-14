import Header from './components/Header';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import AISection from './components/AISection';
import Network from './components/Network';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="antialiased">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <AISection />
        <Network />
      </main>
      <Footer />
    </div>
  );
}
