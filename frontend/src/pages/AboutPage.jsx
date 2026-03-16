import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Zap, Users } from 'lucide-react';
import { fadeUp, staggerContainer, pageVariants, useReducedMotionSafe } from '../lib/motion';

const AboutPage = () => {
  const prefersReduced = useReducedMotionSafe();

  const team = [
    { id: 1, color: 'bg-[#1B4FD8]', initials: 'B1', name: 'Anushtha Lamichhane', role: 'Backend Lead', bio: 'API & database architecture' },
    { id: 2, color: 'bg-[#0F6E56]', initials: 'B2', name: 'Dikshnat Neupane', role: 'AI Engineer', bio: 'AI pipeline & model training' },
    { id: 3, color: 'bg-[#854F0B]', initials: 'F1', name: 'Bibek Magar', role: 'Frontend Lead', bio: 'Report wizard & user flow' },
    { id: 4, color: 'bg-[#534AB7]', initials: 'F2', name: 'Swastik Rawat', role: 'UI Developer', bio: 'Community feed & maps' },
  ];

  const techStack = [
    'FastAPI', 'PostgreSQL', 'PostGIS', 'Redis', 'Celery',
    'React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'YOLOv8'
  ];

  return (
    <>
      <motion.div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-24"
        variants={pageVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        {/* HERO SECTION */}
        <section className="text-center space-y-6">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight"
            variants={fadeUp}
          >
            Built for Kathmandu. <br className="hidden md:block" />
            <span className="text-[#1B4FD8]">Built by its citizens.</span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
            variants={fadeUp}
          >
            Jana Sunuwaai is a student project that uses AI to make civic reporting faster, smarter, and actually useful.
          </motion.p>
        </section>

        {/* MISSION SECTION */}
        <section>
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white rounded-3xl p-8 lg:p-12 border border-[#E5E7EB] shadow-sm"
            variants={fadeUp}
          >
            <div className="border-l-4 border-[#F97316] pl-6 py-2">
              <h2 className="text-2xl md:text-3xl font-bold italic text-gray-800 leading-snug">
                "We believe every pothole reported is a step toward a better city."
              </h2>
            </div>
            
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-xl text-[#F97316] shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Hyperlocal</h3>
                  <p className="text-gray-600">Built specifically for Nepal's roads and infrastructure.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl text-[#1B4FD8] shrink-0">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">AI-powered</h3>
                  <p className="text-gray-600">Not just a feedback form. Instant detection and routing.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 rounded-xl text-green-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Community-driven</h3>
                  <p className="text-gray-600">Citizens verify each other to establish ground truth.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* TEAM SECTION */}
        <section className="space-y-12">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">The Team</h2>
          </div>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial={prefersReduced ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true }}
          >
            {team.map((member) => (
              <motion.div 
                key={member.id}
                className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow"
                variants={fadeUp}
              >
                <div className={`flex items-center justify-center w-16 h-16 rounded-full text-white font-bold text-xl uppercase ${member.color} shrink-0`}>
                  {member.initials}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                  <span className="text-xs font-semibold text-[#1B4FD8] uppercase tracking-wider mb-1">{member.role}</span>
                  <p className="text-sm text-gray-600">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* TECH STACK SECTION */}
        <section className="space-y-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What we built it with</h2>
          </div>
          <motion.div 
            className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto"
            initial={prefersReduced ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {techStack.map((tech) => (
              <div 
                key={tech}
                className="bg-[#F8F9FC] border border-[#E5E7EB] rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-[#1B4FD8] hover:text-[#1B4FD8] transition-colors cursor-default"
              >
                {tech}
              </div>
            ))}
          </motion.div>
        </section>
      </motion.div>
    </>
  );
};

export default AboutPage;
