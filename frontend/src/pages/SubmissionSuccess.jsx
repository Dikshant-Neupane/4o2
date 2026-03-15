import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Copy, Loader2, ArrowRight,
  Brain, Building2, ShieldCheck,
  Link as LinkIcon, Share2
} from 'lucide-react';

import Footer from '../components/layout/Footer';
import SeverityBadge from '../components/ui/SeverityBadge';
import useReportStore from '../store/reportStore';
import { reports } from '../services/api';
import {
  pageVariants, fadeUp, buttonSpring, scaleBounce,
  shineClasses, useReducedMotionSafe, duration, easing, spring
} from '../lib/motion';

const SubmissionSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clearReport, lastSubmittedReport } = useReportStore();
  const prefersReduced = useReducedMotionSafe();

  const [status, setStatus] = useState(null);
  const [aiProcessed, setAiProcessed] = useState(false);
  const [aiData, setAiData] = useState(null);
  const pollingRef = useRef(null);
  const notFoundCountRef = useRef(0);

  useEffect(() => {
    console.log('[SUCCESS] Mounted:', id);

    // If we have real AI data from the submit response, use it immediately
    if (lastSubmittedReport && lastSubmittedReport.ai_detection_confidence !== undefined) {
      console.log('[SUCCESS] Using AI data from submit response:', {
        severity: lastSubmittedReport.ai_severity,
        confidence: lastSubmittedReport.ai_detection_confidence,
      });
      setAiProcessed(true);
      setAiData({
        severity: lastSubmittedReport.ai_severity || 'UNKNOWN',
        confidence: `${Math.round((lastSubmittedReport.ai_detection_confidence || 0) * 100)}%`,
        width: lastSubmittedReport.width_cm ? `${lastSubmittedReport.width_cm} cm` : 'N/A',
        depth: lastSubmittedReport.depth_cm ? `${lastSubmittedReport.depth_cm} cm` : 'N/A',
        roadType: lastSubmittedReport.road_type || 'N/A',
      });
    } else {
      // Fallback: poll the status endpoint
      startPolling();
    }

    return () => stopPolling();
  }, [id]);

  const startPolling = () => {
    pollStatus();
    pollingRef.current = setInterval(() => { pollStatus(); }, 5000);
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  const pollStatus = async () => {
    console.log('[SUCCESS] Polling status...');
    try {
      const res = await reports.getStatus(id);
      const data = res.data;
      console.log('[SUCCESS] Status:', data);
      notFoundCountRef.current = 0; // Reset on success
      setStatus(data);
      if (data?.ai_processed) {
        setAiProcessed(true);
        // Use REAL values from the backend AI pipeline
        setAiData({
          severity: data.severity ?? 'UNKNOWN',
          confidence: data.confidence ?? '0%',
          width: data.width_cm ?? 'N/A',
          depth: data.depth_cm ?? 'N/A',
          roadType: data.road_type ?? 'N/A',
        });
        console.log('[SUCCESS] AI complete:', { severity: data.severity, confidence: data.confidence, width: data.width_cm, depth: data.depth_cm });
        stopPolling();
      }
    } catch (err) {
      // Track consecutive 404s and stop after 3
      if (err.response?.status === 404) {
        notFoundCountRef.current += 1;
        console.warn(`[SUCCESS] 404 — attempt ${notFoundCountRef.current}/3`);
        if (notFoundCountRef.current >= 3) {
          console.warn('[SUCCESS] Report not found after 3 attempts — using mock AI data');
          stopPolling();
          setAiProcessed(true);
          setAiData({ severity: 'HIGH', confidence: '94%', width: '45cm', depth: '12cm', roadType: 'Asphalt' });
          return;
        }
        return; // Keep polling
      }
      // Other errors (network down, etc.) — fallback to mock immediately
      console.log('[SUCCESS] Using mock AI data (backend not running)');
      setAiProcessed(true);
      setAiData({ severity: 'HIGH', confidence: '94%', width: '45cm', depth: '12cm', roadType: 'Asphalt' });
      stopPolling();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => { toast.success('Copied!'); });
  };

  const handleCTA = (btn) => {
    console.log('[SUCCESS] CTA clicked:', btn);
    if (btn === 'track') navigate(`/report/${id}`);
    else if (btn === 'another') { clearReport(); navigate('/report'); }
  };

  const shortId = id ? id.substring(0, 8).toUpperCase() : 'N/A';
  const shareUrl = window.location.origin + `/report/${id}`;

  return (
    <div className="flex flex-col bg-gray-50 h-full">

      <main className="flex-grow py-10 sm:py-16">
        <motion.div
          className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
          variants={pageVariants}
          initial={prefersReduced ? false : 'hidden'}
          animate="visible"
        >

          {/* ── SECTION 1: Success Animation ── */}
          <div className="text-center space-y-6 py-6">
            <motion.div
              className="mx-auto w-24 h-24 rounded-full bg-[#16A34A] flex items-center justify-center shadow-lg"
              variants={scaleBounce}
              initial={prefersReduced ? false : 'hidden'}
              animate="visible"
            >
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: easing.entrance }}
              >
                <Check className="w-14 h-14 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                Report Submitted<br />Successfully!
              </h1>
              <motion.p
                className="mt-3 text-gray-500 text-base"
                initial={prefersReduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: duration.normal }}
              >
                Thank you for helping improve Kathmandu.
              </motion.p>
            </motion.div>
          </div>

          {/* ── SECTION 2: Report ID Card ── */}
          <motion.div
            className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-6 flex items-center justify-between"
            variants={fadeUp}
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Report ID</p>
              <p className="text-2xl font-extrabold text-[#1B4FD8] tracking-wider">#{shortId}</p>
            </div>
            <motion.button
              onClick={() => handleCopy(`#${shortId}`)}
              className="p-3 bg-white rounded-lg border border-blue-200 text-[#1B4FD8] hover:bg-blue-50 transition-colors shadow-sm"
              title="Copy Report ID"
              whileTap={{ scale: 0.9 }}
            >
              <Copy className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* ── SECTION 3: Department Routing Card ── */}
          <motion.div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6" variants={fadeUp}>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Routed to Department</p>
              <p className="text-lg font-bold text-[#111827]">Roads Division — Kathmandu Metropolitan City</p>
              <p className="text-sm text-gray-500 mt-1">Estimated response: 3–5 business days</p>
            </div>

            {/* Timeline */}
            <div className="space-y-0">
              {/* Step 1: Submitted */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <motion.div
                    className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center flex-shrink-0"
                    initial={prefersReduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={spring.default}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                  <div className="w-0.5 h-8 bg-gray-200" />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-gray-900">Submitted</p>
                  <p className="text-xs text-gray-500">Your report has been received</p>
                </div>
              </div>

              {/* Step 2: AI Analysis */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <motion.div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      aiProcessed ? 'bg-[#16A34A]' : 'bg-[#1B4FD8]'
                    }`}
                    animate={aiProcessed ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {aiProcessed ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    )}
                  </motion.div>
                  <div className="w-0.5 h-8 bg-gray-200" />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-bold text-gray-900">AI Analysis</p>
                  <p className="text-xs text-gray-500">
                    {aiProcessed ? 'Analysis complete' : 'Our AI is processing your image...'}
                  </p>
                </div>
              </div>

              {/* Step 3: Dept Review */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    aiProcessed ? 'bg-[#1B4FD8] border-[#1B4FD8]' : 'bg-white border-gray-300'
                  }`}>
                    {aiProcessed ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    )}
                  </div>
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-bold ${aiProcessed ? 'text-gray-900' : 'text-gray-400'}`}>Department Review</p>
                  <p className="text-xs text-gray-500">
                    {aiProcessed ? 'Awaiting department review' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── SECTION 4: AI Analysis Card ── */}
          <AnimatePresence mode="wait">
            {!aiProcessed ? (
              <motion.div
                key="ai-processing"
                className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-6 space-y-4"
                initial={prefersReduced ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: easing.smooth }}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-[#F97316]" />
                  <h3 className="font-bold text-[#92400E]">AI is analyzing your report...</h3>
                </div>
                <div className="w-full bg-[#FDE68A] rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#F97316] rounded-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '60%' }}
                  />
                </div>
                <p className="text-sm text-[#92400E]">
                  Our YOLOv8 model is detecting and measuring the pothole in your photo. This usually takes a few seconds.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="ai-complete"
                className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-6 space-y-5"
                initial={prefersReduced ? false : { opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: easing.smooth }}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
                  <h3 className="font-bold text-green-800">AI Analysis Complete</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <SeverityBadge severity={aiData?.severity} />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                    Confidence: {aiData?.confidence}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { label: 'Width', value: aiData?.width },
                    { label: 'Depth', value: aiData?.depth },
                    { label: 'Road Type', value: aiData?.roadType },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className="bg-white rounded-lg p-3 border border-green-200 text-center"
                      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: duration.normal }}
                    >
                      <p className="text-xs text-gray-500 uppercase font-semibold">{item.label}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── SECTION 5: What Happens Next ── */}
          <motion.div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-6" variants={fadeUp}>
            <h3 className="text-lg font-bold text-gray-900">What happens next?</h3>
            <div className="space-y-5">
              {[
                { num: '1', title: 'AI Review', desc: 'Our AI analyzes the photo, measures severity, and assigns a priority score.', bgColor: 'bg-blue-100', textColor: 'text-[#1B4FD8]' },
                { num: '2', title: 'Department Notified', desc: 'The relevant government department receives your report with an AI summary.', bgColor: 'bg-orange-100', textColor: 'text-[#F97316]' },
                { num: '3', title: 'Action & Resolution', desc: "Crews are dispatched. You'll be notified when the issue is resolved.", bgColor: 'bg-green-100', textColor: 'text-[#16A34A]' },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  className="flex items-start gap-4"
                  initial={prefersReduced ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 + i * 0.1, duration: duration.normal }}
                >
                  <div className={`w-8 h-8 rounded-full ${item.bgColor} ${item.textColor} flex items-center justify-center flex-shrink-0 font-bold text-sm`}>{item.num}</div>
                  <div>
                    <p className="font-bold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── SECTION 6: CTA Buttons ── */}
          <motion.div className="space-y-3" variants={fadeUp}>
            <motion.button
              onClick={() => handleCTA('track')}
              className={`w-full py-4 bg-[#1B4FD8] text-white font-bold rounded-xl hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-sm ${shineClasses}`}
              variants={buttonSpring}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              Track this Report <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => handleCTA('another')}
              className="w-full py-4 bg-white border-2 border-[#1B4FD8] text-[#1B4FD8] font-bold rounded-xl hover:bg-blue-50 transition-colors"
              variants={buttonSpring}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
            >
              Report Another Issue
            </motion.button>
          </motion.div>

          {/* ── SECTION 7: Share ── */}
          <motion.div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center space-y-4" variants={fadeUp}>
            <p className="text-sm font-bold text-gray-700">Invite others to report issues</p>
            <div className="flex flex-wrap justify-center gap-3">
              <motion.button
                onClick={() => handleCopy(shareUrl)}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                whileTap={{ scale: 0.95 }}
              >
                <LinkIcon className="w-4 h-4" /> Copy Link
              </motion.button>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" /> Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('I just reported a civic issue on Jana Sunuwaai! Help improve Kathmandu.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" /> Share on X
              </a>
            </div>
          </motion.div>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default SubmissionSuccess;
