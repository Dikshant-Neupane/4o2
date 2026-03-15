import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, MapPin, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { Accordion, AccordionItem } from '../components/ui/Accordion';
import { fadeUp, staggerContainer, pageVariants, useReducedMotionSafe } from '../lib/motion';

const HowItWorksPage = () => {
  const prefersReduced = useReducedMotionSafe();
  const [activeAccordion, setActiveAccordion] = useState('q1');

  const steps = [
    {
      id: 1,
      icon: Camera,
      title: 'Take a photo',
      desc: 'Point your phone at any pothole or civic issue. A clear photo gives our AI the best results.',
    },
    {
      id: 2,
      icon: MapPin,
      title: 'Share your location',
      desc: 'Allow GPS or drag the pin manually on the map. Accuracy to within 8 meters.',
    },
    {
      id: 3,
      icon: Sparkles,
      title: 'AI analyzes instantly',
      desc: 'YOLOv8 detects severity, estimates size, classifies road type — all in under 3 seconds.',
    },
    {
      id: 4,
      icon: Building2,
      title: 'Routed to the right department',
      desc: 'Your report lands directly with the responsible government body. No middlemen.',
    },
  ];

  const aiFeatures = [
    'Detection confidence score',
    'Pothole severity (Low / Medium / High / Critical)',
    'Estimated width in cm',
    'Estimated depth in cm',
    'Surface area in sqm',
    'Road type (Major / Minor / Highway / Rural)',
    'Surface material (Asphalt / Concrete / Gravel)',
    'Weather condition at time of report',
  ];

  const faqs = [
    {
      id: 'q1',
      q: 'Is Jana Sunuwaai free to use?',
      a: 'Yes, completely free for all citizens of Kathmandu.'
    },
    {
      id: 'q2',
      q: 'How long does it take for my report to be reviewed?',
      a: 'Most reports are reviewed by the relevant department within 3–5 business days.'
    },
    {
      id: 'q3',
      q: 'What happens if the AI is wrong?',
      a: 'Reports with low confidence (below 60%) are flagged for human review before being sent to any department.'
    },
    {
      id: 'q4',
      q: 'Can I report issues anonymously?',
      a: 'You need a phone number to submit — this prevents spam and helps departments follow up if needed.'
    },
    {
      id: 'q5',
      q: 'Which areas does Jana Sunuwaai cover?',
      a: 'Currently Kathmandu valley only. More cities coming soon.'
    }
  ];

  return (
    <>
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-24"
        variants={pageVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        {/* HERO SECTION */}
        <section className="text-center space-y-6">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#1B4FD8] tracking-tight"
            variants={fadeUp}
          >
            How Jana Sunuwaai works
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            variants={fadeUp}
          >
            From photo to government desk in under 60 seconds
          </motion.p>
        </section>

        {/* STEP-BY-STEP VERTICAL TIMELINE */}
        <section>
          <motion.div 
            className="relative flex flex-col gap-6"
            variants={staggerContainer}
            initial={prefersReduced ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute left-8 top-12 bottom-12 border-l-2 border-dashed border-[#BFDBFE] z-0" />

            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div 
                  key={step.id} 
                  className="relative z-10 flex flex-col lg:flex-row gap-6 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                  variants={fadeUp}
                >
                  <div className="flex-shrink-0 flex items-center justify-center bg-[#1B4FD8] text-white rounded-full w-10 h-10 font-bold shadow-sm">
                    {step.id}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-grow">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Icon className="w-8 h-8 text-[#1B4FD8]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm lg:text-base">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* AI EXPLANATION SECTION */}
        <motion.section 
          className="bg-[#EFF6FF] rounded-3xl p-8 lg:p-12 border border-blue-100 shadow-sm"
          initial={prefersReduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="w-8 h-8 text-[#1B4FD8]" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What our AI detects</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/60 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                <span className="text-gray-800 font-medium text-sm md:text-base">{feature}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* FAQ SECTION */}
        <motion.section
          initial={prefersReduced ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2 shadow-sm max-w-3xl mx-auto">
            <Accordion>
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  title={faq.q}
                  activeValue={activeAccordion}
                  onToggle={setActiveAccordion}
                >
                  {faq.a}
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
};

export default HowItWorksPage;
