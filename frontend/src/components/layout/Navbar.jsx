import React, { useEffect, useState, useRef } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home, LayoutList, MapPin,
  HelpCircle, Info, Menu, X, LogOut, User
} from "lucide-react"

import myLogo from "../../pictures/logofolder/logo.png"
import useAuthStore from "../../store/authStore"

const NAV_ITEMS = [
  { name: "Home",         url: "/",            icon: Home       },
  { name: "Feed",         url: "/feed",        icon: LayoutList },
  { name: "Map",          url: "/map",         icon: MapPin     },
  { name: "How It Works", url: "/how-it-works", icon: HelpCircle },
  { name: "About",        url: "/about",       icon: Info       },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location  = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const pathname = location.pathname
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [isMounted,  setIsMounted]  = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  const [visible, setVisible] = useState(true)
  const [lastScroll, setLastScroll] = useState(0)
  const menuRef = useRef(null)

  /* ── Mount guard (prevents SSR mismatch) ── */
  useEffect(() => {
    setIsMounted(true)
    setWindowWidth(window.innerWidth)
  }, [])

  /* ── Hide-on-scroll listener ── */
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY
      setScrolled(current > 10)

      if (current < lastScroll) {
        setVisible(true)   // scrolling UP → show
      } else if (current > 100) {
        setVisible(false)  // scrolling DOWN → hide
      }
      setLastScroll(current)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScroll])

  /* ── Resize listener — close menu + track width ── */
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      if (window.innerWidth >= 1024) setMenuOpen(false)
    }
    window.addEventListener("resize", handleResize, { passive: true })
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  /* ── Close menu on route change ── */
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  /* ── Close menu on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  /* ── Lock body scroll when mobile menu open ── */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const isDesktop = windowWidth >= 1024
  const isTablet  = windowWidth >= 768 && windowWidth < 1024
  const isMobile  = windowWidth < 768

  /* Don't render until mounted — prevents hydration issues */
  if (!isMounted) return null

  return (
    <>
      {/* 
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        NAVBAR SHELL — fixed positioning
        id used by globals.css override
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      */}
      <header
        id="jana-sunuwaai-navbar"
        ref={menuRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          transform: visible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* 
          ═══════════════════════════
          DESKTOP (≥1024px)
          3-zone CSS Grid layout
          ═══════════════════════════
        */}
        {isDesktop && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              maxWidth: "1280px",
              margin: "0 auto",
              padding: "0 32px",
            }}
          >
            {/* Zone 1 — Logo */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <img
                src={myLogo}
                alt="Jana Sunuwa Logo"
                style={{
                  height: "120px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  padding: "16px 0",
                }}
              />
            </Link>

            {/* Zone 2 — Tubelight pill */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px",
              borderRadius: "9999px",
              backgroundColor: scrolled
                ? "rgba(255,255,255,0.98)"
                : "rgba(255,255,255,0.90)",
              backdropFilter: "blur(12px)",
              border: "1px solid #E5E7EB",
              boxShadow: scrolled
                ? "0 4px 20px rgba(0,0,0,0.12)"
                : "0 2px 8px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.3s ease, background-color 0.3s ease",
            }}>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.url
                return (
                  <Link
                    key={item.name}
                    to={item.url}
                    style={{
                      position: "relative",
                      padding: "8px 20px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#1B4FD8" : "#6B7280",
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="lamp-desktop"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "9999px",
                          backgroundColor: "#EFF6FF",
                          zIndex: -1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        {/* Glow beam */}
                        <div style={{
                          position: "absolute",
                          top: "-8px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: "32px",
                          height: "4px",
                          backgroundColor: "#1B4FD8",
                          borderRadius: "0 0 4px 4px",
                        }}>
                          <div style={{
                            position: "absolute",
                            width: "48px",
                            height: "24px",
                            backgroundColor: "rgba(27,79,216,0.15)",
                            borderRadius: "9999px",
                            filter: "blur(8px)",
                            top: "-8px",
                            left: "-8px",
                          }} />
                        </div>
                      </motion.div>
                    )}
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* Zone 3 — Buttons/User Profile */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              justifyContent: "flex-end",
            }}>
              {isAuthenticated ? (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 8px", borderRadius: "9999px", backgroundColor: "rgba(0,0,0,0.03)" }}>
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid #E5E7EB" }} />
                    ) : (
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#1B4FD8", color: "#fff", display: "flex", alignItems: "center", justifyCenter: "center" }}>
                        <User size={16} />
                      </div>
                    )}
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{user?.name?.split(' ')[0]}</span>
                  </div>
                  <button
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#6B7280", display: "flex", alignItems: "center", gap: "4px",
                      fontSize: "13px", fontWeight: 500, padding: "8px",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.color = "#1B4FD8"}
                    onMouseLeave={(e) => e.target.style.color = "#6B7280"}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  style={{
                    border: "1px solid #1B4FD8",
                    color: "#1B4FD8",
                    backgroundColor: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "background-color 0.2s",
                  }}
                >
                  Login
                </Link>
              )}
              <Link
                to="/report"
                style={{
                  backgroundColor: "#F97316",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(249,115,22,0.35)",
                  transition: "background-color 0.2s",
                }}
              >
                Report Issue
              </Link>
            </div>
          </div>
        )}

        {/* 
          ═══════════════════════════
          TABLET (768px–1023px)
          ═══════════════════════════
        */}
        {isTablet && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 16px",
            padding: "12px 20px",
            borderRadius: "16px",
            backgroundColor: scrolled
              ? "rgba(255,255,255,0.98)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid #E5E7EB",
            boxShadow: scrolled
              ? "0 4px 20px rgba(0,0,0,0.12)"
              : "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <Link to="/" style={{
              display: "flex", alignItems: "center",
              gap: "8px", textDecoration: "none",
            }}>
              <img
                src={myLogo}
                alt="Jana Sunuwa Logo"
                style={{
                  height: "100px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  padding: "12px 0",
                }}
              />
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                color: "#1B4FD8",
              }}
              aria-label="Toggle menu"
            >
              {menuOpen
                ? <X size={22} />
                : <Menu size={22} />
              }
            </button>
          </div>
        )}

        {/* 
          ═══════════════════════════
          MOBILE (<768px)
          ═══════════════════════════
        */}
        {isMobile && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 12px",
            padding: "10px 16px",
            borderRadius: "16px",
            backgroundColor: scrolled
              ? "rgba(255,255,255,0.98)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <Link to="/" style={{
              display: "flex", alignItems: "center",
              gap: "8px", textDecoration: "none",
            }}>
              <img
                src={myLogo}
                alt="Jana Sunuwa Logo"
                style={{
                  height: "80px",
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                  padding: "8px 0",
                }}
              />
            </Link>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Link
                to="/report"
                style={{
                  backgroundColor: "#F97316",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Report
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "none", border: "none",
                  cursor: "pointer", padding: "6px",
                  borderRadius: "8px", color: "#1B4FD8",
                  display: "flex", alignItems: "center",
                }}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        )}

        {/* 
          ═══════════════════════════
          SLIDE-DOWN DRAWER
          tablet + mobile only
          ═══════════════════════════
        */}
        <AnimatePresence>
          {menuOpen && !isDesktop && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{    opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{
                margin: "8px 16px 0",
                borderRadius: "16px",
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                overflow: "hidden",
              }}
            >
              {NAV_ITEMS.map((item, i) => {
                const isActive = pathname === item.url
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.url}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 20px",
                      borderBottom: i < NAV_ITEMS.length - 1
                        ? "1px solid #F3F4F6"
                        : "none",
                      backgroundColor: isActive ? "#EFF6FF" : "transparent",
                      color: isActive ? "#1B4FD8" : "#374151",
                      textDecoration: "none",
                      fontSize: "15px",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <Icon size={18} />
                    {item.name}
                    {isActive && (
                      <span style={{
                        marginLeft: "auto",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#1B4FD8",
                      }} />
                    )}
                  </Link>
                )
              })}

              {/* Auth buttons at bottom of drawer */}
              <div style={{
                padding: "16px",
                backgroundColor: "#F9FAFB",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                borderTop: "1px solid #E5E7EB",
              }}>
                {isAuthenticated ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                    ) : (
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#1B4FD8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={20} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{user?.name}</p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { logout(); navigate('/login'); }}
                      style={{ background: "none", border: "none", padding: "8px", color: "#6B7280" }}
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    style={{
                      display: "block",
                      textAlign: "center",
                      border: "1px solid #1B4FD8",
                      color: "#1B4FD8",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 500,
                      textDecoration: "none",
                      backgroundColor: "#fff",
                    }}
                  >
                    Login
                  </Link>
                )}
                <Link
                  to="/report"
                  style={{
                    display: "block",
                    textAlign: "center",
                    backgroundColor: "#F97316",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Report Issue
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
