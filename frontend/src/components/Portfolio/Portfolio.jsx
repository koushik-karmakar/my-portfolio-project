// components/Portfolio.js
import React from "react";

const Portfolios = () => {
  const projects = [
    {
      title: "E-Commerce Platform",
      category: "FULL-STACK",
      description:
        "Complete online shopping platform with React, Node.js, and MongoDB. Features include user authentication, payment integration, admin dashboard, and real-time inventory management.",
      color: "from-purple-600/20 to-pink-600/20",
      technologies: [
        "React.js",
        "Node.js",
        "MongoDB",
        "Tailwind CSS",
        "Cloudinary",
      ],
      liveLink: "https://your-ecommerce-demo.com",
      githubLink: "https://github.com/yourusername/ecommerce-platform",
    },
    {
      title: "Task Management App",
      category: "WEB APPLICATION",
      description:
        "Productivity application with drag-and-drop task management, team collaboration features, and real-time updates using WebSockets.",
      color: "from-blue-600/20 to-cyan-600/20",
      technologies: [
        "React.js",
        "Express.js",
        "Socket.io",
        "MySQL",
        "TailwindCss",
      ],
      liveLink: "https://taskmanager-demo.com",
      githubLink: "https://github.com/yourusername/task-management-app",
    },
    {
      title: "Portfolio Website",
      category: "FRONTEND",
      description:
        "Responsive portfolio website built with React and Tailwind CSS, featuring dark/light mode, smooth animations, and optimized performance.",
      color: "from-green-600/20 to-emerald-600/20",
      technologies: ["React.js", "Tailwind CSS", "React Router"],
      liveLink: "https://yourportfolio.com",
      githubLink: "https://github.com/yourusername/portfolio-website",
    },
    {
      title: "Weather Dashboard",
      category: "WEB APPLICATION",
      description:
        "Real-time weather application with location-based forecasts, interactive maps, and historical data visualization.",
      color: "from-orange-600/20 to-red-600/20",
      technologies: ["React.js", "Weather API", "Chart.js", "Geolocation API"],
      liveLink: "https://weather-dashboard-demo.com",
      githubLink: "https://github.com/yourusername/weather-dashboard",
    },
    {
      title: "Blog Platform",
      category: "FULL-STACK",
      description:
        "Content management system for bloggers with rich text editor, comment system, user roles, and SEO optimization.",
      color: "from-indigo-600/20 to-purple-600/20",
      technologies: ["Next.js", "Node.js", "MongoDB", "Mongoose", "Cloudinary"],
      liveLink: "https://blog-platform-demo.com",
      githubLink: "https://github.com/yourusername/blog-platform",
    },

    {
      title: "Real-time Chat App",
      category: "REAL-TIME",
      description:
        "Instant messaging application with real-time messaging, file sharing, group chats, and video calling capabilities.",
      color: "from-teal-600/20 to-blue-600/20",
      technologies: ["React.js", "Node.js", "Socket.io", "MongoDB"],
      liveLink: "https://chat-app-demo.com",
      githubLink: "https://github.com/yourusername/chat-application",
    },
  ];

  return (
    <section id="portfolio" className="py-16 px-4 bg-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">My Portfolio</h2>
          <div className="w-24 h-1 bg-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            A selection of my recent projects across different domains
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className={`bg-linear-to-br ${project.color} rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-[1.02]`}
            >
              <div className="p-6">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-gray-900/50 text-gray-300 rounded-full text-xs font-medium">
                    {project.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                <p className="text-gray-300 mb-4">{project.description}</p>
                <button className="cursor-pointer text-purple-400 hover:text-purple-300 font-medium text-sm flex items-center">
                  View Project
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolios;
