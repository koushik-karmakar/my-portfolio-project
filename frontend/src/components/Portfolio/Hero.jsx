// components/Hero.js
import React from "react";

const Hero = () => {
  return (
    <section
      id="home"
      className="pt-24 pb-16 sm:pt-34 sm:pb-36 px-4 bg-linear-to-br from-gray-900 to-gray-800"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-sm-12 mb-8 lg:mb-0">
            <div className="mb-6">
              <span className="inline-block px-4 py-1 bg-gray-800 rounded-full text-sm text-gray-300 mb-4">
                Developer
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Koushik <span className="text-purple-400">Karmakar</span>
              </h1>
              <h2 className="text-2xl md:text-3xl  text-gray-300 mb-6">
                Full Stack Developer
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl">
                We appreciate your trust greatly our clients choose us & our
                products because they know we are the best.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() =>
                  document
                    .getElementById("portfolio")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="cursor-pointer px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
              >
                View Work
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("contact")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="cursor-pointer px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
              >
                Contact Me
              </button>
            </div>

            <div className="mt-8 sm:mt-12 p-6 bg-gray-800/50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">3+</div>
                  <div className="text-gray-400 text-sm">Clients</div>
                </div>
                <div className="h-12 w-px bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">1+</div>
                  <div className="text-gray-400 text-sm">Years Experience</div>
                </div>
                <div className="h-12 w-px bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">5+</div>
                  <div className="text-gray-400 text-sm">Projects</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-linear-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                <div className="w-56 h-56 md:w-72 md:h-72 rounded-full bg-linear-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
                  <div className="w-48 h-48 md:w-60 md:h-60 rounded-full bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold">KK</div>
                      <div className="text-sm mt-2">Full Stack Developer</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20"></div>
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
