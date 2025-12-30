import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return Math.min(oldProgress + 2, 100);
      });
    }, 30);

    const dotsTimer = setInterval(() => {
      setDots((oldDots) => (oldDots.length >= 3 ? "" : oldDots + "."));
    }, 500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(dotsTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-linear-to-br from-gray-900 to-black z-50 flex flex-col items-center justify-center">
      <div className="relative mb-10">
        <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin">
          <div className="absolute inset-4 rounded-full border-2 border-gray-700"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xl font-semibold text-white">🚀</div>
        </div>
      </div>

      <div className="w-80 max-w-full mb-6">
        <div className="flex justify-between text-white mb-2"></div>

        <div className="text-center text-gray-500 text-sm mt-3">
          Loading projects and modules{dots}
        </div>
      </div>
    </div>
  );
}
