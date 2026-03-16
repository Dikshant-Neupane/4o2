import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp, ThumbsDown, Copy, Share2, Link as LinkIcon,
  Sparkles, MapPin, ShieldCheck, AlertTriangle, Send,
  Clock, CheckCircle2, Brain, BellRing, ExternalLink
} from 'lucide-react';

import Footer from '../components/layout/Footer';
import SeverityBadge from '../components/ui/SeverityBadge';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAuthStore from '../store/authStore';
import { mockReports } from '../mocks/mockReports';
import {
  pageVariants, fadeUp, staggerContainer, cardVariants, buttonSpring,
  shineClasses, useReducedMotionSafe, viewportOnce, duration, easing, spring
} from '../lib/motion';

// Fix Leaflet default icon (use CDN to avoid Rollup resolve issues)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ReportDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();
  const prefersReduced = useReducedMotionSafe();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState(null);

  const [commentsList, setCommentsList] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    console.log('[DETAIL] Mounted:', id);
    fetchReport();
    fetchComments();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getById(id);
      if (res.data) {
        setReport(res.data);
        setLikes(res.data.upvotes || res.data.likes || 0);
        setDislikes(res.data.dislikes || 0);
        console.log('[DETAIL] Report loaded:', id);
      }
    } catch (err) {
      const mock = mockReports.find(r => r.id === Number(id) || r.id === id) || mockReports[0];
      setReport(mock);
      setLikes(mock.upvotes || 0);
      setDislikes(mock.dislikes || 0);
      console.log('[DETAIL] Report loaded (mock):', mock.id);
    } finally { setLoading(false); }
  };

  const fetchComments = async () => {
    try {
      const res = await commentsApi.getComments(id);
      // Bug 3b: Normalize — ensure we always get an array
      const rawComments = res.data;
      const safe = Array.isArray(rawComments) ? rawComments : rawComments?.comments ?? [];
      setCommentsList(safe);
    } catch (err) {
      console.warn('[DETAIL] Comments fetch failed, using mock:', err.message);
      setCommentsList([
        { id: 'c1', user: { name: 'Aarav Sharma' }, text: 'I pass by this daily! Needs urgent attention.', created_at: '2026-03-14T08:00:00Z' },
        { id: 'c2', user: { name: 'Priya Adhikari' }, text: 'Reported this to the ward office too. Thanks for posting.', created_at: '2026-03-14T10:30:00Z' },
        { id: 'c3', user: { name: 'Bikash Tamang' }, text: 'My bike tire got damaged here yesterday.', created_at: '2026-03-14T14:15:00Z' },
      ]);
    }
    console.log('[DETAIL] Comments loaded');
  };

  const handleVote = async (action) => {
    if (!isAuthenticated) { toast('Login to vote', { icon: '🔒' }); return; }
    console.log('[VOTE] Cast:', action);
    if (action === 'like') {
      if (userVote === 'like') return;
      setLikes(prev => prev + 1);
      if (userVote === 'dislike') setDislikes(prev => prev - 1);
      setUserVote('like');
    } else {
      if (userVote === 'dislike') return;
      setDislikes(prev => prev + 1);
      if (userVote === 'like') setLikes(prev => prev - 1);
      setUserVote('dislike');
    }
    try { await votesApi.castVote(id, action); } catch (err) {
      if (err.response?.status === 409) { console.warn('[VOTE] Duplicate'); toast('Already voted', { icon: '⚠️' }); }
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    console.log('[COMMENT] Submitted');
    try { await commentsApi.addComment(id, { text: newComment }); } catch (err) { /* Mock add */ }
    setCommentsList(prev => [
      ...prev,
      { id: 'c' + Date.now(), user: { name: 'You' }, text: newComment, created_at: new Date().toISOString() },
    ]);
    setNewComment('');
    setSubmittingComment(false);
  };

  const handleCopy = (text) => { navigator.clipboard.writeText(text).then(() => toast.success('Copied!')); };

  if (loading) return (
    <div className="flex flex-col bg-gray-50 h-full">
      <div className="flex-grow flex items-center justify-center"><LoadingSpinner size="lg" /></div>
      <Footer />
    </div>
  );

  if (error || !report) return (
    <div className="flex flex-col bg-gray-50 h-full">
      <div className="flex-grow flex items-center justify-center"><p className="text-red-600 font-medium">{error || 'Report not found.'}</p></div>
      <Footer />
    </div>
  );

  const lat = report.location?.lat || 27.7172;
  const lng = report.location?.lng || 85.3240;
  const address = report.location?.address || 'Kathmandu';
  const severity = (report.ai_severity || 'medium').toUpperCase();
  const shortId = String(report.id).substring(0, 8).toUpperCase();
  const shareUrl = window.location.href;
  const imageUrl = report.images?.[0] || report.image || '/Waterleak.png';

  const timelineSteps = [
    { label: 'Submitted', icon: CheckCircle2, date: report.created_at, done: true },
    { label: 'AI Analyzed', icon: Brain, date: report.updated_at, done: !!report.ai_severity },
    { label: 'Active Case', icon: Clock, date: null, done: report.status === 'in-progress' || report.status === 'resolved' },
    { label: 'Citizen Notified', icon: BellRing, date: null, done: report.status === 'resolved' },
  ];

  return (
    <div className="flex flex-col bg-gray-50 h-full">

      <motion.main
        className="flex-grow py-8 sm:py-12"
        variants={pageVariants}
        initial={prefersReduced ? false : 'hidden'}
        animate="visible"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ═══════ LEFT COLUMN ═══════ */}
            <motion.div className="flex-grow min-w-0 space-y-8" variants={staggerContainer}>

              {/* IMAGE SECTION */}
              <motion.div
                className="relative rounded-2xl overflow-hidden shadow-lg"
                variants={fadeUp}
                initial={prefersReduced ? false : { opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: easing.entrance }}
              >
                <img src={imageUrl} alt={report.title} className="w-full h-[400px] object-cover" />
                <motion.div
                  className="absolute top-4 left-4"
                  initial={prefersReduced ? false : { x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: duration.normal }}
                >
                  <SeverityBadge severity={severity} />
                </motion.div>
                <motion.div
                  className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm"
                  initial={prefersReduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: duration.normal }}
                >
                  {(report.ai_priority_score || 91.4)}% confidence
                </motion.div>
              </motion.div>

              {/* TITLE + BADGES */}
              <motion.div className="space-y-3" variants={fadeUp}>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{report.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={severity} />
                  <StatusBadge status={report.status?.toUpperCase().replace('-', '_')} />
                  {report.verified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Routed to: <span className="font-bold text-gray-900">{report.ai_department || 'Roads Division'}</span>
                </p>
                {report.description && (
                  <p className="text-gray-700 text-sm leading-relaxed mt-2">{report.description}</p>
                )}
              </motion.div>

              {/* AI ANALYSIS CARD */}
              <motion.div
                className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-6 space-y-4"
                variants={fadeUp}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#1B4FD8]" />
                  <h3 className="font-bold text-gray-900">AI Analysis</h3>
                </div>
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  variants={staggerContainer}
                  initial={prefersReduced ? false : 'hidden'}
                  whileInView="visible"
                  viewport={viewportOnce}
                >
                  {[
                    { label: 'Detection Confidence', value: report.ai_detection_confidence ? `${Math.round(report.ai_detection_confidence * 100)}%` : 'N/A' },
                    { label: 'Width Estimate', value: report.width_cm ? `${report.width_cm} cm` : 'N/A' },
                    { label: 'Depth Estimate', value: report.depth_cm ? `${report.depth_cm} cm` : 'N/A' },
                    { label: 'Surface Area', value: report.area_sqm ? `${report.area_sqm} sqm` : 'N/A' },
                    { label: 'Road Type', value: report.road_type || 'N/A' },
                    { label: 'Weather', value: report.weather || 'N/A' },
                  ].map((item, i) => (
                    <motion.div key={i} className="bg-white rounded-lg p-3 border border-blue-100" variants={cardVariants}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-base font-bold text-gray-900">{item.value}</p>
                    </motion.div>
                  ))}
                </motion.div>
                {report.ai_summary && (
                  <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-blue-100 italic">"{report.ai_summary}"</p>
                )}
              </motion.div>

              {/* MAP SECTION */}
              <motion.div className="space-y-2" variants={fadeUp}>
                <h3 className="font-bold text-gray-900">Location</h3>
                <div className="h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                  <MapContainer center={[lat, lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                    <Marker position={[lat, lng]}>
                      <Popup>{address}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                  <a
                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#1B4FD8] hover:text-blue-800 flex items-center gap-1"
                  >
                    Full Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>

              {/* CLUSTER ALERT */}
              {report.cluster_id && (
                <motion.div
                  className="bg-[#FEF3C7] border border-[#FCD34D] rounded-xl p-5 flex items-start gap-3"
                  variants={fadeUp}
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-yellow-800">Part of a cluster of reports</p>
                    <p className="text-sm text-yellow-700 mt-1">Multiple similar issues have been reported in this area.</p>
                    <Link to="/feed" className="inline-block mt-2 text-sm font-bold text-yellow-800 underline hover:text-yellow-900">View Cluster Map</Link>
                  </div>
                </motion.div>
              )}

              {/* VOTING SECTION */}
              <motion.div className="bg-white border border-gray-200 rounded-xl p-5" variants={fadeUp}>
                <h3 className="font-bold text-gray-900 mb-4">Was this report helpful?</h3>
                <div className="flex items-center gap-4">
                  <motion.button
                    onClick={() => handleVote('like')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-bold text-sm transition-all ${
                      userVote === 'like'
                        ? 'border-[#16A34A] bg-green-50 text-[#16A34A]'
                        : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                    }`}
                    whileTap={prefersReduced ? {} : { scale: 1.3 }}
                    transition={spring.bounce}
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <motion.span key={likes} initial={prefersReduced ? false : { y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                      {likes}
                    </motion.span>
                  </motion.button>
                  <motion.button
                    onClick={() => handleVote('dislike')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-bold text-sm transition-all ${
                      userVote === 'dislike'
                        ? 'border-[#DC2626] bg-red-50 text-[#DC2626]'
                        : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                    }`}
                    whileTap={prefersReduced ? {} : { scale: 1.3 }}
                    transition={spring.bounce}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <motion.span key={dislikes} initial={prefersReduced ? false : { y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                      {dislikes}
                    </motion.span>
                  </motion.button>
                </div>
              </motion.div>

              {/* COMMENTS SECTION */}
              <motion.div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6" variants={fadeUp}>
                <h3 className="font-bold text-gray-900">Comments ({commentsList.length})</h3>

                <div className="space-y-4">
                  <AnimatePresence>
                    {(Array.isArray(commentsList) ? commentsList : []).map(comment => (
                      <motion.div
                        key={comment.id}
                        className="flex items-start gap-3"
                        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: duration.normal }}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1B4FD8] flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase">
                          {comment.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{comment.user?.name || 'Anonymous'}</span>
                            <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {isAuthenticated ? (
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1B4FD8]/15 focus:border-[#1B4FD8] resize-none transition-shadow"
                    />
                    <motion.button
                      onClick={handleCommentSubmit}
                      disabled={submittingComment || !newComment.trim()}
                      className={`px-4 py-2 bg-[#1B4FD8] text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors self-end ${shineClasses}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="text-center py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      <Link to="/login" className="text-[#1B4FD8] font-semibold hover:text-blue-800">Login</Link> to add a comment
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* ═══════ RIGHT SIDEBAR ═══════ */}
            <motion.aside
              className="w-full lg:w-[320px] flex-shrink-0 space-y-6"
              initial={prefersReduced ? false : { x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: duration.normal, ease: easing.entrance }}
            >

              {/* METADATA CARD */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 space-y-5 sticky top-24">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Report ID</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[#1B4FD8]">#{shortId}</span>
                    <motion.button onClick={() => handleCopy(`#${shortId}`)} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" whileTap={{ scale: 0.9 }}>
                      <Copy className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(report.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(report.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Status Timeline */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status Timeline</p>
                  <ol className="space-y-0">
                    {timelineSteps.map((step, index) => {
                      const StepIcon = step.icon;
                      return (
                        <motion.li
                          key={index}
                          className="relative flex items-start gap-3"
                          initial={prefersReduced ? false : { opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: duration.normal }}
                        >
                          <div className="flex flex-col items-center">
                            <motion.div
                              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                step.done ? 'bg-[#1B4FD8] text-white' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                              }`}
                              animate={step.done && index === timelineSteps.filter(s => s.done).length - 1 && !prefersReduced
                                ? { scale: [1, 1.2, 1] }
                                : {}
                              }
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <StepIcon className="w-3.5 h-3.5" />
                            </motion.div>
                            {index < timelineSteps.length - 1 && (
                              <div className={`w-0.5 h-6 ${step.done ? 'bg-[#1B4FD8]' : 'bg-gray-200'}`} />
                            )}
                          </div>
                          <div className="pt-0.5">
                            <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                            {step.date && step.done && (
                              <p className="text-[10px] text-gray-400">{new Date(step.date).toLocaleDateString()}</p>
                            )}
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                </div>
              </div>

              {/* SHARE CARD */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center space-y-4">
                <p className="text-sm font-bold text-gray-700">Share this report</p>
                <div className="flex flex-col gap-2">
                  <motion.button onClick={() => handleCopy(shareUrl)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm transition-colors" whileTap={{ scale: 0.95 }}>
                    <LinkIcon className="w-4 h-4" /> Copy Link
                  </motion.button>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm transition-colors">
                    <Share2 className="w-4 h-4" /> Facebook
                  </a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this civic issue on Jana Sunuwaai')}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 text-sm transition-colors">
                    <Share2 className="w-4 h-4" /> Share on X
                  </a>
                </div>
              </div>
            </motion.aside>

          </div>
        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default ReportDetail;
