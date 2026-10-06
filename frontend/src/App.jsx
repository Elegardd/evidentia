// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Spline from '@splinetool/react-spline';
import './index.css';

import AdminDashboard from './components/AdminDashboard';
import OfficerDashboard from './components/OfficerDashboard';

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// 1. SECURITY INACTIVITY AUTO-TIMEOUT HANDLER
const InactivityHandler = ({ timeoutInSeconds, onLogout }) => {
  useEffect(() => {
    let timer;
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(onLogout, timeoutInSeconds * 1000);
    };

    const events = ["mousemove", "mousedown", "keypress", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [onLogout, timeoutInSeconds]);

  return null;
};


// 2. CORE APPLICATION WORKSPACE 
export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [view, setView] = useState("login"); // "login" or "forgot_password"
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'error' or 'success'
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeResetLink, setActiveResetLink] = useState("");

  // UPDATE: Dynamic reactive state markers for managing structural clock metrics
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [totalLockoutDuration, setTotalLockoutDuration] = useState(0);

  // LAZY STATE COMPLIANCE: Reads state parameters from persistence layer
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("evidentia_session");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // UPDATE: Active tracking loop handling state calculations down to the exact second
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setLockoutTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setMessage("");
          setMessageType("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // Clear feedback message overlays automatically after 4 seconds
  useEffect(() => {
    if (!message) return;
    const messageTimer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);

    return () => clearTimeout(messageTimer);
  }, [message]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    // UPDATE: Soft block interface submittals if lock mechanism is explicitly ticking
    if (lockoutTimeLeft > 0) {
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      // const response = await axios.post("http://localhost:8081/login.php", formData);
      const response = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/login.php",
        formData, {
        headers: {
          "ngrok-skip-browser-warning": "ayakerrtssss"
        }
      });

      if (response.data.status === "success" || response.data.status === "connection success") {

        const userData = response.data.user;

        if (userData && userData.role) {
          // This saves the complete object: id, username, full_name, role, AND sub_role into localStorage
          localStorage.setItem("evidentia_session", JSON.stringify(userData));
          setUser(userData); // Triggers immediately direct to the user
        } else {
          setMessageType("error");
          setMessage("Authorization structure missing from response payload.");
        }

        // const userRole = response.data.role || response.data.user?.role;
        // const userData = { username: username, role: userRole };
        // localStorage.setItem("evidentia_session", JSON.stringify(userData));
        // setUser(userData);
      } else {
        setMessageType("error");
        setMessage(response.data.message || "Invalid authentication criteria.");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      if (err.response && err.response.data) {
        const data = err.response.data;
        setMessage(data.message || "Invalid username or password.");

        if (data.lockout_until) {
          const secondsRemaining = Math.max(0, data.lockout_until - Math.floor(Date.now() / 1000));
          setLockoutTimeLeft(secondsRemaining);
          setTotalLockoutDuration(secondsRemaining); // Retained for progress calculations
        }
      } else {
        setMessage("Invalid username or password.");
      }
    }
  };

  // INTEGRATED RECOVERY LINK LOGIC HERE CORRECLTY
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", resetEmail);

    try {
      // const response = await axios.post("http://localhost:8081/request_reset.php", formData);
      const response = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/request_reset.php",
        formData, {
        headers: {
          "ngrok-skip-browser-warning": "ayakerrtssss"
        }
      });

      if (response.data.status === "success") {
        setMessageType("success");
        setMessage("Recovery link compiled successfully.");
        setResetEmail("");

        // Capture the real URL string sent by your PHP script safely inside the async wrapper
        if (response.data.debug_link) {
          setActiveResetLink(response.data.debug_link);
        } else {
          // Fallback redirect if no debugging url is appended by the API
          setTimeout(() => setView("login"), 3000);
        }
      } else {
        setMessageType("error");
        setMessage(response.data.message || "Target identity not located within system registries.");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Connection fault with authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("evidentia_session");
    setUser(null);
    setUsername("");
    setPassword("");
    setView("login");
    setMessageType("success");
    setMessage("Session ended securely.");
  };

  // 3. PERSISTENT WORKSPACE SCREEN VIEW COMPILING
  if (user) {
    const IDLE_TIMEOUT_SECONDS = 900; // 15-Minute security lifecycle tracker

    if (user.role === 'admin') {
      return (
        <>
          <InactivityHandler timeoutInSeconds={IDLE_TIMEOUT_SECONDS} onLogout={handleLogout} />
          <AdminDashboard activeUser={user} onLogout={handleLogout} />
        </>
      );
    } else if (user.role === 'officer') {
      return (
        <>
          <InactivityHandler timeoutInSeconds={IDLE_TIMEOUT_SECONDS} onLogout={handleLogout} />
          <OfficerDashboard activeUser={user} onLogout={handleLogout} />
        </>
      );
    }
  }

  // 4. MAIN USER PORTAL DISPLAY INTERFACE
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      <div className={`absolute inset-0 w-full h-full z-0 transition-opacity duration-700 ease-in-out ${splineLoaded ? 'opacity-100' : 'opacity-0'}`}>
        <Spline
          // scene="https://prod.spline.design/y9kiQ0qCdATiQ1s0/scene.splinecode"
          scene="https://prod.spline.design/8z1DQ8eWmkaOnZ4z/scene.splinecode"
          // scene="https://prod.spline.design/PiKPIho3wMQ1ZoFe/scene.splinecode"

          // scene="https://prod.spline.design/PiKPIho3wMQ1ZoFe/scene.splinecode"
          // scene="https://prod.spline.design/fyKP5gxeJ0N1Ae9c/scene.splinecode"
          // scene="https://prod.spline.design/FBB4nfclSJeOSSQ6/scene.splinecode"
          onLoad={() => setSplineLoaded(true)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-32 bg-gradient-to-br from-transparent via-slate-950/100 to-slate-950 pointer-events-none filter blur-sm" />
      </div>

      {/* SKELETON PRELOAD COOLDOWN ELEMENT */}
      {!splineLoaded && (
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* FOREGROUND GLASSMORPHIC LOGIN/RESET CARD CONTAINER */}
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-10 relative z-10 mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent select-none tracking-tight">
            EviChain
          </h1>
          <p className="text-slate-400 mt-2 text-xs sm:text-sm uppercase tracking-widest font-bold select-none px-2">
            Secured Digital Evidence
          </p>
        </div>

        {view === "login" ? (
          /* STANDARD SIGN IN INTERFACE MODE */
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div>
              <input
                type="text"
                placeholder="Username or Email Address"
                className="w-full px-4 py-3.5 sm:py-4 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/40 transition-all font-sans text-sm sm:text-base"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
                disabled={lockoutTimeLeft > 0} // UPDATE: Input prevention toggle rules
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3.5 sm:py-4 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/40 transition-all font-sans text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={lockoutTimeLeft > 0} // UPDATE: Input prevention toggle rules
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => { setView("forgot_password"); setMessage(""); }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors bg-transparent border-none outline-none cursor-pointer"
              >
                Forgot Credentials?
              </button>
            </div>

            {/* UPDATE: Dynamic button states reacting based on active lockout timer metrics */}
            <button 
              type="submit" 
              disabled={lockoutTimeLeft > 0}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 disabled:from-red-950/40 disabled:to-red-900/20 disabled:text-red-400 border disabled:border-red-500/30 text-white font-black rounded-xl shadow-lg transition-all text-xs sm:text-sm tracking-wide uppercase active:scale-[0.99]"
            >
              {lockoutTimeLeft > 0 ? `Terminal Paused (${formatTime(lockoutTimeLeft)})` : "Sign In"}
            </button>

            {/* <button type="submit" className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black rounded-xl shadow-lg shadow-blue-900/20 transition-all text-xs sm:text-sm tracking-wide uppercase active:scale-[0.99]">
              Sign In
            </button> */}
          </form>
        ) : (
          /* FORGOT PASSWORD ACCESS PIPELINE INTERFACE MODE */
          <form onSubmit={handleForgotPasswordRequest} className="space-y-4 sm:space-y-6">
            <div className="mb-2">
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Provide the account's registered email coordinates. System gateways will compile a one-time secure authentication link.
              </p>
            </div>

            <div>
              <input
                type="email"
                placeholder="Registered Email Address"
                className="w-full px-4 py-3.5 sm:py-4 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/40 transition-all font-sans text-sm sm:text-base"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => { setView("login"); setMessage(""); }}
                className="font-semibold text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
              >
                ← Return to Login
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-black rounded-xl shadow-lg transition-all text-xs sm:text-sm tracking-wide uppercase active:scale-[0.99]"
            >
              {isSubmitting ? "Generating Link Token..." : "Send Recovery Directive"}
            </button>
          </form>
        )}

        {/* FEEDBACK SYSTEM CONTAINER MATRIX */}
        {message && (
          <div className={`mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-xl text-center font-bold border-2 transition-all text-xs sm:text-sm ${messageType === "error"
            ? "border-red-500/30 bg-red-950/40 text-red-400"
            : "border-emerald-500/30 bg-emerald-950/40 text-emerald-400"
            }`}>
              <div>
              {message}
              {lockoutTimeLeft > 0 && (
                <div className="mt-3 font-mono text-base tracking-widest text-red-300 animate-pulse">
                  {formatTime(lockoutTimeLeft)}
                </div>
              )}
            </div>

            {lockoutTimeLeft > 0 && totalLockoutDuration > 0 && (
              <div className="w-full bg-slate-950/80 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800/50">
                <div 
                  className="bg-gradient-to-r from-red-500 to-amber-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(lockoutTimeLeft / totalLockoutDuration) * 100}%` }}
                />
              </div>
            )}
            {/* <div>{message}</div> */}

            {/* If a real reset link exists, render it as a direct action button */}
            {activeResetLink && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20">
                <a
                  href={activeResetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs tracking-wide uppercase transition-colors"
                >
                  Open Password Reset Interface Link →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}