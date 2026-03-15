import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import useAuth from '../hooks/useAuth';
import Footer from '../components/layout/Footer';

// Wizard Steps
import StepCategory from '../components/report/StepCategory';
import StepGPS from '../components/report/StepGPS';
import StepImage from '../components/report/StepImage';
import StepDescription from '../components/report/StepDescription';
import StepReview from '../components/report/StepReview';

import { pageVariants, stepEnter, useReducedMotionSafe, duration, easing } from '../lib/motion';

const steps = [
  { id: 1, name: 'Category' },
  { id: 2, name: 'Location' },
  { id: 3, name: 'Photo' },
  { id: 4, name: 'Details' },
  { id: 5, name: 'Review' }
];

const ReportWizard = () => {
  const { requireAuth } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const prefersReduced = useReducedMotionSafe();

  useEffect(() => {
    const isAuthed = requireAuth();
    if (isAuthed) {
      setIsAuthChecking(false);
      console.log('[WIZARD] Mounted');
      console.log('[WIZARD] Step:', currentStep);
    }
  }, [requireAuth, currentStep]);

  const handleNext = () => {
    if (currentStep < 5) {
      setDirection(1);
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      console.log('[WIZARD] Step:', nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      console.log('[WIZARD] Step:', prevStep);
    } else {
      navigate('/');
    }
  };

  if (isAuthChecking) return null;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepCategory onNext={handleNext} />;
      case 2: return <StepGPS onNext={handleNext} onBack={handleBack} />;
      case 3: return <StepImage onNext={handleNext} onBack={handleBack} />;
      case 4: return <StepDescription onNext={handleNext} onBack={handleBack} />;
      case 5: return <StepReview onBack={handleBack} />;
      default: return <StepCategory onNext={handleNext} />;
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.25, ease: easing.entrance },
    },
    exit: (dir) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      transition: { duration: duration.fast, ease: easing.exit },
    }),
  };

  return (
    <motion.div
      className="flex flex-col bg-gray-50 h-full"
      variants={pageVariants}
      initial={prefersReduced ? false : 'hidden'}
      animate="visible"
    >
      
      <main className="flex-grow py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Progress Bar (Mobile mostly, visible on all) */}
          <div className="mb-8 lg:hidden">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <div className="text-sm font-medium text-gray-500 mb-2">Step {currentStep} of {steps.length}: {steps[currentStep-1].name}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-[#1B4FD8] h-2 rounded-full"
                initial={false}
                animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                transition={{ duration: duration.normal, ease: easing.smooth }}
              />
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-12">
            
            {/* Left Sidebar: Step Tracker (Desktop) */}
            <div className="hidden lg:block lg:col-span-3">
              <h1 className="text-2xl font-bold text-gray-900 mb-8">Report an Issue</h1>
              <nav aria-label="Progress">
                <ol className="overflow-hidden">
                  {steps.map((step, index) => (
                    <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pb-10' : ''}`}>
                      {index !== steps.length - 1 && (
                        <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      )}
                      
                      <div className="relative flex items-center group">
                        <span className="h-9 flex items-center">
                          {currentStep > step.id ? (
                            <motion.span
                              className="relative z-10 w-8 h-8 flex items-center justify-center bg-[#10B981] rounded-full group-hover:bg-green-600 transition-colors"
                              initial={prefersReduced ? false : { scale: 0.5 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                              <Check className="w-5 h-5 text-white" />
                            </motion.span>
                          ) : currentStep === step.id ? (
                            <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-[#1B4FD8] rounded-full">
                              <motion.span
                                className="h-2.5 w-2.5 bg-[#1B4FD8] rounded-full"
                                layoutId="step-dot"
                              />
                            </span>
                          ) : (
                            <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400 transition-colors">
                              <span className="h-2.5 w-2.5 bg-transparent rounded-full" />
                            </span>
                          )}
                        </span>
                        <span className={`ml-4 text-sm font-medium ${
                          currentStep === step.id ? 'text-[#1B4FD8]' : 
                          currentStep > step.id ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Right Content: Step Form */}
            <div className="lg:col-span-9">
              <div className="bg-white sm:shadow-sm sm:ring-1 sm:ring-gray-900/5 sm:rounded-2xl p-4 sm:p-10 overflow-hidden min-h-[calc(100vh-140px)] sm:min-h-0 pb-24 sm:pb-10 -mx-4 sm:mx-0">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={prefersReduced ? {} : slideVariants}
                    initial={prefersReduced ? false : 'enter'}
                    animate="center"
                    exit="exit"
                  >
                    {renderStep()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
};

export default ReportWizard;
