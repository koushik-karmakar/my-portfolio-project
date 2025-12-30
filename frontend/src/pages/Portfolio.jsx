import React, { useState, useEffect } from "react";
import Navbar from "../components/Portfolio/Navbar.jsx";
import Hero from "../components/Portfolio/Hero.jsx";
import About from "../components/Portfolio/About.jsx";
import Skills from "../components/Portfolio/Skills.jsx";
import EducationExperience from "../components/Portfolio/Edu_Exp.jsx";
import Portfolios from "../components/Portfolio/Portfolio.jsx";
import Contact from "../components/Portfolio/Contact.jsx";

function Portfolio() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "home",
        "about",
        "skills",
        "education",
        "portfolio",
        "contact",
      ];

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="font-mono bg-gray-900 text-gray-100 min-h-screen">
      <Navbar activeSection={activeSection} />
      <main>
        <Hero />
        <About />
        <Skills />
        <EducationExperience />
        <Portfolios />
        <Contact />
      </main>
      <footer className="bg-gray-800 py-6 text-center text-gray-400 text-sm">
        <p>© {new Date().getFullYear()} Koushik Karmakar. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Portfolio;
