import ProjectCard from "./Todo/ProjectCard";

const projects = [
  {
    name: "Weather App",
    color: "from-blue-400 to-cyan-400",
    to: "/weather-app",
  },
  { name: "Todo App", color: "from-green-400 to-emerald-500", to: "/todo" },
  { name: "Search App", color: "from-purple-400 to-pink-500", to: "#" },
  {
    name: "Personal Portfolio",
    color: "from-orange-400 to-red-500",
    to: "/portfolio",
  },
  { name: "Chat App", color: "from-yellow-400 to-amber-500", to: "/whisper" },
  { name: "Blog / CMS", color: "from-indigo-400 to-violet-500", to: "#" },
  { name: "Task Manager", color: "from-teal-400 to-blue-500", to: "#" },
  { name: "E-commerce Store", color: "from-rose-400 to-pink-500", to: "#" },
];

export default function ProjectsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.map((project, index) => (
        <ProjectCard key={index} project={project} index={index} />
      ))}
    </div>
  );
}
