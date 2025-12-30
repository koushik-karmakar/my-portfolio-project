import { useState, useEffect } from "react";
import { AuthContent } from "../components/AuthContent";
import LoadingScreen from "../components/LoadingScreen";
import ProjectsGrid from "../components/ProjectsGrid";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    // return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <AuthContent />

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Project Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Click on any project to explore
          </p>
        </div>

        <ProjectsGrid />
      </div>
    </div>
  );
}
