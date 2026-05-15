import { useEffect, useState } from "react";

import Header from "./components/Header";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import AISection from "./components/AISection";
import Network from "./components/Network";
import Footer from "./components/Footer";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [screen, setScreen] = useState<"home" | "admin">(
    window.location.hash === "#admin" ? "admin" : "home"
  );

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(window.location.hash === "#admin" ? "admin" : "home");
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  if (screen === "admin") {
    return <AdminDashboard />;
  }

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