// components/Skills.jsx
import React from "react";
// Use only verified available icons from react-icons/si
import {
  SiJavascript,
  SiReact,
  SiApache,
  SiChatbot,
  SiPhp,
  SiMongodb,
  SiMysql,
  SiTailwindcss,
  SiBootstrap,
  SiHtml5,
  SiCss3,
  SiGit,
  SiGithub,
  SiCloudinary,
  SiPostman,
  SiExpress,
  SiCanva,
  SiGooglechrome,
} from "react-icons/si";

// Import from other icon sets for icons not available in 'si'
import {
  FaNodeJs,
  FaTerminal,
  FaMicrosoft, // For VS Code alternative
} from "react-icons/fa";
import { DiVisualstudio } from "react-icons/di";

const Skills = () => {
  const skillCategories = [
    {
      title: "Programming Languages",
      skills: [
        {
          name: "JavaScript",
          icon: <SiJavascript className="w-5 h-5 text-yellow-400" />,
        },
        {
          name: "Node.js",
          icon: <FaNodeJs className="w-5 h-5 text-green-500" />,
        },
        { name: "Express", icon: <SiExpress className="w-5 h-5 text-gray-300" /> },
        {
          name: "React.js",
          icon: <SiReact className="w-5 h-5 text-cyan-400" />,
        },
        { name: "PHP", icon: <SiPhp className="w-5 h-5 text-purple-400" /> },
        
      ],
    },
    {
      title: "Databases",
      skills: [
        {
          name: "MongoDB",
          icon: <SiMongodb className="w-5 h-5 text-green-500" />,
        },

        { name: "MySQL", icon: <SiMysql className="w-5 h-5 text-blue-500" /> },
      ],
    },
    {
      title: "Frontend & UI",
      skills: [
        {
          name: "Tailwind CSS",
          icon: <SiTailwindcss className="w-5 h-5 text-teal-400" />,
        },
        {
          name: "Bootstrap",
          icon: <SiBootstrap className="w-5 h-5 text-purple-500" />,
        },
        {
          name: "React Bootstrap",
          icon: <SiBootstrap className="w-5 h-5 text-blue-400" />,
        },
        {
          name: "HTML/CSS",
          icon: (
            <>
              <SiHtml5 className="w-5 h-5 text-orange-500" />
              <SiCss3 className="w-5 h-5 text-blue-500" />
            </>
          ),
        },
        { name: "Canva", icon: <SiCanva className="w-5 h-5 text-blue-600" /> },
      ],
    },
    {
      title: "Development Tools",
      skills: [
        {
          name: "VS Code",
          icon: <DiVisualstudio className="w-5 h-5 text-blue-500" />,
        },
        {
          name: "GitHub",
          icon: <SiGithub className="w-5 h-5 text-gray-300" />,
        },

        {
          name: "Postman",
          icon: <SiPostman className="w-5 h-5 text-orange-500" />,
        },
        { name: "Git", icon: <SiGit className="w-5 h-5 text-red-500" /> },
        {
          name: "Cloudinary",
          icon: <SiCloudinary className="w-5 h-5 text-blue-500" />,
        },
      ],
    },
  ];

  const tools = [
    {
      name: "VS Code",
      icon: <DiVisualstudio className="w-10 h-10 text-blue-500" />,
      color: "hover:border-blue-500",
    },
    {
      name: "AI Agent",
      icon: <SiChatbot className="w-10 h-10 text-red-400" />,
      color: "hover:border-red-500",
    },
    {
      name: "Google Chrome",
      icon: <SiGooglechrome className="w-10 h-10 text-yellow-500" />,
      color: "hover:border-yellow-500",
    },
    {
      name: "Postman",
      icon: <SiPostman className="w-10 h-10 text-orange-500" />,
      color: "hover:border-orange-500",
    },
    {
      name: "Xampp",
      icon: <SiApache className="w-10 h-10 text-purple-500" />,
      color: "hover:border-purple-500",
    },
    {
      name: "Github",
      icon: <SiGithub className="w-10 h-10 text-blue-400" />,
      color: "hover:border-blue-400",
    },
    {
      name: "Git",
      icon: <SiGit className="w-10 h-10 text-red-500" />,
      color: "hover:border-red-500",
    },
    {
      name: "Terminal",
      icon: <FaTerminal className="w-10 h-10 text-green-500" />,
      color: "hover:border-green-500",
    },
  ];

  return (
    <section id="skills" className="py-16 px-4 bg-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Professional Skillset
          </h1>
          <div className="w-24 h-1 bg-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Technologies and tools I work with on a daily basis
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {skillCategories.map((category, catIndex) => (
            <div key={catIndex} className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-6 text-purple-400 border-b border-gray-700 pb-3">
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <div
                    key={skillIndex}
                    className="flex items-center space-x-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 
                             border border-gray-700 rounded-lg text-sm font-medium transition-all 
                             duration-200 hover:border-purple-500 hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-center">{skill.icon}</div>
                    <span className="ml-1">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tools Section */}
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Tools I Use</h2>
            <div className="w-20 h-1 bg-blue-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {tools.map((tool, index) => (
              <div
                key={index}
                className={`flex flex-col items-center p-4 bg-gray-800 hover:bg-gray-700 
                         rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer 
                         border border-gray-700 ${tool.color}`}
              >
                <div className="mb-3">{tool.icon}</div>
                <span className="text-sm font-medium text-center">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>

          {/* Daily Development Stack */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Daily Development Stack
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center space-x-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <SiJavascript className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="font-medium">JavaScript</span>
              </div>
              <div className="flex items-center space-x-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <SiReact className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="font-medium">React.js</span>
              </div>
              <div className="flex items-center space-x-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FaNodeJs className="w-5 h-5 text-green-400" />
                </div>
                <span className="font-medium">Node.js</span>
              </div>
              <div className="flex items-center space-x-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <SiTailwindcss className="w-5 h-5 text-purple-400" />
                </div>
                <span className="font-medium">Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
