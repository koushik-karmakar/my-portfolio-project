// src/components/Navbar.jsx
import { SiGithub } from "react-icons/si";

const Navbar = ({ activeSection }) => {
  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "education", label: "Resume" },
    { id: "portfolio", label: "Projects" },
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full"></div>
          <span className="text-xl font-bold">Koushik Karmakar</span>
          <span className="text-gray-400 text-sm hidden md:inline">
            | Full Stack Developer
          </span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`cursor-pointer text-sm transition-colors ${
                  activeSection === item.id
                    ? "text-purple-400 font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <a
            href="https://github.com/kkcoder2024"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <SiGithub className="w-5 h-5" />
            <span className="text-sm">GitHub</span>
          </a>

          {/* Mobile menu button */}
          {/* <button className="md:hidden text-gray-300 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button> */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
