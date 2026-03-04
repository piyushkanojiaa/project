import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SignInPageProps {
    className?: string;
}

// Simplified version without React Three Fiber - using CSS animations instead
const MatrixBackground: React.FC<{ reverse?: boolean }> = ({ reverse = false }) => {
    return (
        <div className="absolute inset-0 overflow-hidden bg-black">
            <div className={`matrix-rain ${reverse ? 'reverse' : ''}`}>
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="matrix-column"
                        style={{
                            left: `${i * 2}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`,
                        }}
                    >
                        {[...Array(10)].map((_, j) => (
                            <span
                                key={j}
                                className="matrix-char"
                                style={{
                                    opacity: Math.random() * 0.8 + 0.2,
                                }}
                            >
                                {String.fromCharCode(33 + Math.floor(Math.random() * 94))}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
            <style jsx>{`
                .matrix-rain {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
                .matrix-column {
                    position: absolute;
                    top: -100%;
                    font-family: monospace;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.8);
                    animation: fall linear infinite;
                }
                .matrix-column.reverse {
                    animation: fallReverse linear infinite;
                }
                .matrix-char {
                    display: block;
                    line-height: 1.4;
                }
                @keyframes fall {
                    to {
                        transform: translateY(200vh);
                    }
                }
                @keyframes fallReverse {
                    from {
                        transform: translateY(200vh);
                    }
                    to {
                        transform: translateY(-100%);
                    }
                }
            `}</style>
        </div>
    );
};

function MiniNavbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center pl-6 pr-6 py-3 backdrop-blur-sm rounded-full border border-[#333] bg-[#1f1f1f57] w-[calc(100%-2rem)] sm:w-auto">
            <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">
                <Link to="/" className="flex items-center">
                    <div className="relative w-5 h-5">
                        <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2"></span>
                        <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2"></span>                        <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2"></span>
                        <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2"></span>
                    </div>
                </Link>

                <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm">
                    <Link to="/" className="text-gray-300 hover:text-white transition">Home</Link>
                    <Link to="/about" className="text-gray-300 hover:text-white transition">About</Link>
                    <Link to="/analytics" className="text-gray-300 hover:text-white transition">Analytics</Link>
                </nav>

                <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                    <Link to="/login" className="px-4 py-2 text-xs sm:text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200">
                        Back to Login
                    </Link>
                    <Link to="/dashboard" className="px-4 py-2 text-xs sm:text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 transition-all duration-200">
                        Dashboard
                    </Link>
                </div>

                <button className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none" onClick={toggleMenu}>
                    {isOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    )}
                </button>
            </div>
        </header>
    );
}

export const SignInFlow = ({ className }: SignInPageProps) => {
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<"email" | "code" | "success">("email");
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [showMatrix, setShowMatrix] = useState(true);
    const [reverseMatrix, setReverseMatrix] = useState(false);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            setStep("code");
        }
    };

    useEffect(() => {
        if (step === "code") {
            setTimeout(() => {
                codeInputRefs.current[0]?.focus();
            }, 500);
        }
    }, [step]);

    const handleCodeChange = (index: number, value: string) => {
        if (value.length <= 1) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            if (value && index < 5) {
                codeInputRefs.current[index + 1]?.focus();
            }

            if (index === 5 && value) {
                const isComplete = newCode.every(digit => digit.length === 1);
                if (isComplete) {
                    setReverseMatrix(true);
                    setTimeout(() => {
                        setShowMatrix(false);
                    }, 50);
                    setTimeout(() => {
                        setStep("success");
                    }, 2000);
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const handleBackClick = () => {
        setStep("email");
        setCode(["", "", "", "", "", ""]);
        setReverseMatrix(false);
        setShowMatrix(true);
    };

    return (
        <div className={cn("flex w-[100%] flex-col min-h-screen bg-black relative", className)}>
            <div className="absolute inset-0 z-0">
                {showMatrix && <MatrixBackground reverse={reverseMatrix} />}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.7)_0%,_transparent_100%)]" />
                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col flex-1">
                <MiniNavbar />

                <div className="flex flex-1 flex-col lg:flex-row">
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <div className="w-full mt-[150px] max-w-sm px-4">
                            <AnimatePresence mode="wait">
                                {step === "email" ? (
                                    <motion.div
                                        key="email-step"
                                        initial={{ opacity: 0, x: -100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="space-y-1">
                                            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome to Orbital Guard</h1>
                                            <p className="text-[1.8rem] text-white/70 font-light">Sign in to continue</p>
                                        </div>

                                        <div className="space-y-4">
                                            <button className="backdrop-blur-[2px] w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors">
                                                <span className="text-lg">G</span>
                                                <span>Sign in with Google</span>
                                            </button>

                                            <div className="flex items-center gap-4">
                                                <div className="h-px bg-white/10 flex-1" />
                                                <span className="text-white/40 text-sm">or</span>
                                                <div className="h-px bg-white/10 flex-1" />
                                            </div>

                                            <form onSubmit={handleEmailSubmit}>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        placeholder="info@orbitalguard.ai"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full backdrop-blur-[1px] bg-transparent text-white border-1 border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border focus:border-white/30 text-center"
                                                        required
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="absolute right-1.5 top-1.5 text-white w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                                    >
                                                        →
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        <p className="text-xs text-white/40 pt-10">
                                            By signing in, you agree to secure satellite monitoring and collision avoidance services.
                                        </p>
                                    </motion.div>
                                ) : step === "code" ? (
                                    <motion.div
                                        key="code-step"
                                        initial={{ opacity: 0, x: 100 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 100 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="space-y-1">
                                            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">We sent you a code</h1>
                                            <p className="text-[1.25rem] text-white/50 font-light">Please enter it</p>
                                        </div>

                                        <div className="w-full">
                                            <div className="relative rounded-full py-4 px-5 border border-white/10 bg-transparent">
                                                <div className="flex items-center justify-center">
                                                    {code.map((digit, i) => (
                                                        <div key={i} className="flex items-center">
                                                            <div className="relative">
                                                                <input
                                                                    ref={(el) => {
                                                                        codeInputRefs.current[i] = el;
                                                                    }}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    maxLength={1}
                                                                    value={digit}
                                                                    onChange={e => handleCodeChange(i, e.target.value)}
                                                                    onKeyDown={e => handleKeyDown(i, e)} className="w-8 text-center text-xl bg-transparent text-white border-none focus:outline-none focus:ring-0 appearance-none"
                                                                    style={{ caretColor: 'transparent' }}
                                                                />
                                                                {!digit && (
                                                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                                                                        <span className="text-xl text-white/30">0</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {i < 5 && <span className="text-white/20 text-xl">|</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex w-full gap-3">
                                            <motion.button
                                                onClick={handleBackClick}
                                                className="rounded-full bg-white text-black font-medium px-8 py-3 hover:bg-white/90 transition-colors w-[30%]"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                Back
                                            </motion.button>
                                            <motion.button
                                                className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 ${code.every(d => d !== "")
                                                    ? "bg-white text-black border-transparent hover:bg-white/90 cursor-pointer"
                                                    : "bg-[#111] text-white/50 border-white/10 cursor-not-allowed"
                                                    }`}
                                                disabled={!code.every(d => d !== "")}
                                            >
                                                Continue
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success-step"
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                                        className="space-y-6 text-center"
                                    >
                                        <div className="space-y-1">
                                            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">You're in!</h1>
                                            <p className="text-[1.25rem] text-white/50 font-light">Welcome to Mission Control</p>
                                        </div>

                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.5, delay: 0.5 }}
                                            className="py-10"
                                        >
                                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </motion.div>

                                        <Link to="/dashboard">
                                            <motion.button
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1 }}
                                                className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors"
                                            >
                                                Continue to Dashboard
                                            </motion.button>
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInFlow;
