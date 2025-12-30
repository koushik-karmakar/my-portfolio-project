// components/EducationExperience.js
import React from "react";

const EducationExperience = () => {
  const education = [
    {
      title: "Self-Taught Diploma in Computer Technologies",
      institution: "Self-Learning (YouTube & Online Resources)",
      period: "2024 – 2025",
      description:
        "Learned modern web development from scratch through self-directed study and online resources, including React.js, Node.js, Express.js, and MongoDB. Built practical projects focusing on REST APIs, frontend-backend integration, and real-world problem solving.",
    },
    {
      title: "PHP & Laravel Development Training",
      institution: "Ardent Computech Pvt. Ltd.",
      period: "2024",
      description:
        "Completed professional training in PHP and Laravel, focusing on backend development, MVC architecture, database-driven applications, and building secure, scalable web solutions.",
    },
    {
      title: "Higher Secondary (12th) – Science",
      institution: "State Board / Higher Secondary Education",
      period: "2021",
      description:
        "Completed Higher Secondary education with a science background. Currently not graduated from any college, focusing on self-directed learning and professional skill development in software engineering.",
    },
  ];

  const experience = [
    {
      title: "Freelance PHP Developer",
      company: "Independent / Self-Employed",
      period: "2025 – Present",
      description:
        "Worked as an independent freelance PHP developer, building and maintaining dynamic, database-driven web applications using PHP and MySQL. Responsibilities included backend development, CRUD operations, authentication, form handling, and optimizing database queries for performance and reliability.",
    },
    {
      title: "Web Application Developer",
      company: "Confidential Client Projects",
      period: "2019 – 2020",
      description:
        "Worked on multiple client-based web projects under confidentiality, including School management Software and business websites, focusing on backend development, database integration, and application reliability.",
    },
    {
      title: "JavaScript Developer",
      company: "Personal Projects & Independent Work",
      period: "2018 – 2019",
      description:
        "Developed JavaScript-driven web applications through personal projects, including an eCommerce platform, learning modern frontend practices, state management, and reusable component design.",
    },
  ];

  return (
    <section id="education" className="py-16 px-4 bg-gray-900">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Education & Experience
          </h2>
          <div className="w-24 h-1 bg-purple-500 mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Education */}
          <div>
            <h3 className="text-2xl font-bold mb-8 text-center">Education</h3>
            <div className="space-y-8">
              {education.map((item, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center mr-4">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold">E</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <div className="text-gray-400 mb-2">
                        <span className="font-medium">{item.institution}</span>{" "}
                        / {item.period}
                      </div>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <h3 className="text-2xl font-bold mb-8 text-center">Experience</h3>
            <div className="space-y-8">
              {experience.map((item, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mr-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-bold">W</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <div className="text-gray-400 mb-2">
                        <span className="font-medium">{item.company}</span> /{" "}
                        {item.period}
                      </div>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationExperience;
