import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export default function ProjectCard({ project, index }) {
  return (
    <Link
      key={index}
      to={project.to}
      className={`block p-6 rounded-2xl bg-linear-to-br ${project.color} transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/10 active:scale-95`}
    >
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">{project.name}</h3>
        <div className="inline-flex items-center text-white/90">
          <span>View Project</span>
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

ProjectCard.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
  index: PropTypes.number,
};
