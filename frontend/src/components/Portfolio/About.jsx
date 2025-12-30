// components/About.js
import React from "react";

const About = () => {
  return (
    <section id="about" className="py-16 px-4 bg-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">About Me</h2>
          <div className="w-24 h-1 bg-purple-500 mx-auto"></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/3">
            <p className="text-gray-300 mb-6">
              Hi, my name is{" "}
              <span className="text-purple-400 font-semibold">
                Koushik Karmakar
              </span>{" "}
              and I'm a Software Developer who loves transforming ideas into
              reliable, scalable products. Over time, I've explored several
              technologies and found my passion in building high-performance
              systems and intuitive user experiences.
            </p>
            <p className="text-gray-300 mb-6">
              I'm proficient in{" "}
              <span className="text-yellow-400 italic">JavaScript</span>,{" "}
              <span className="text-blue-400">React</span>,{" "}
              <span className="text-green-400">Node.js</span> and{" "}
              <span className="text-orange-400">PHP</span> – and I enjoy working
              across both backend and frontend stacks. I also have solid
              experience with databases such as{" "}
              <span className="text-orange-400">MySQL</span> and{" "}
              <span className="text-green-400">MongoDB</span>, and I regularly
              use <span className="text-cyan-400">Mongoose</span> for efficient
              data modeling and database interactions in Node.js applications.
            </p>
            <p className="text-gray-300 mb-6">
              My key areas of interest include developing{" "}
              <span className="text-purple-400">Web Applications</span>,{" "}
              <span className="text-purple-400">Software Development</span>, and
              exploring new ways to bridge on-chain and off-chain systems.
            </p>
            <p className="text-gray-300">
              Whenever possible, I love building projects with{" "}
              <span className="text-green-400">Node.js</span> and modern
              frameworks like <span className="text-cyan-400">React.js</span>,{" "}
              <span className="text-cyan-400">Express.js</span>.
            </p>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 pb-4 border-b border-gray-700">
                Personal Info
              </h3>
              <div className="space-y-4">
                <div className="flex">
                  <span className="w-32 text-gray-400">Name:</span>
                  <span className="font-medium">Koushik Karmakar</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-400">Nationality:</span>
                  <span className="font-medium">Indian</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-400">Phone:</span>
                  <span className="font-medium">+91 93390-90783</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-400">Email:</span>
                  <span className="font-medium text-purple-400">
                    koushik9339mail@gmail.com
                  </span>
                </div>

                <div className="flex">
                  <span className="w-32 text-gray-400">Freelance:</span>
                  <span className="font-medium text-green-400">Available</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-gray-400">Language:</span>
                  <span className="font-medium">Bengali, Hindi, English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
