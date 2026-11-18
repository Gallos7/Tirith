import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/apiClient";

export const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        setIsLoading(true);

        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await apiClient.post("/auth/login", formData, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            await login(response.data.access_token, response.data.refresh_token, rememberMe);
            navigate("/dashboard");

        } catch (error) {
            setError(error.response?.data?.detail || "Invalid credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const payload = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password
            };

            await apiClient.post("/users/register", payload);
            setSuccessMsg("Account created successfully! Please log in.");
            setIsLogin(true);
            setPassword("");
        } catch (err) {
            setError(err.response?.data?.detail || "Registration failed. Email might be taken.");
        } finally {
            setIsLoading(false);
        }
    };

    // Borderless dark theme: uses #1e242f on inputs so they stand out cleanly against the #151a23 canvas
    const inputStyles = "w-full px-3.5 py-2.5 bg-[#1e242f] border border-gray-700/80 rounded-md text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] transition-colors";
    const labelStyles = "block text-sm font-medium text-gray-300 mb-1.5";
    const btnStyles = "cursor-pointer disabled:cursor-not-allowed w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-[#0d9488] hover:bg-[#0f766e] focus:outline-none disabled:opacity-50 transition-colors mt-2";

    return (
        <div className="min-h-screen bg-[#151a23] flex flex-col items-center justify-center px-4 py-12 font-sans text-gray-100">
            <div className="w-full max-w-sm">
                {/* Stacked Header */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <img
                        src="/favicon.png"
                        alt="Tirith Logo"
                        className="w-20 h-20 mb-4 drop-shadow-[0_0_15px_rgba(13,148,136,0.6)]"
                    />
                    <h1 className="text-6xl leading-none tracking-wide text-gray-100 font-['Pinyon_Script']">
                        Tirith
                    </h1>
                    <p className="mt-3 text-sm italic text-gray-400 font-serif tracking-wide">
                        {isLogin ? '"Speak, friend, and enter."' : '"I am looking for someone to share in an adventure."'}
                    </p>
                </div>

                {/* Alerts */}
                {error && <div className="mb-5 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-md">{error}</div>}
                {successMsg && <div className="mb-5 p-3 bg-teal-900/30 border border-[#0d9488]/50 text-[#0d9488] text-sm rounded-md">{successMsg}</div>}

                {/* Borderless Form */}
                <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className={labelStyles}>First name</label>
                                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputStyles} />
                            </div>
                            <div className="flex-1">
                                <label className={labelStyles}>Last name</label>
                                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputStyles} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={labelStyles}>Email address</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-medium text-gray-300">Password</label>
                            {isLogin && (
                                <Link to="/forgot-password" className="text-xs text-[#0d9488] hover:underline cursor-pointer" tabIndex="-1">
                                    Forgot password?
                                </Link>
                            )}
                        </div>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputStyles} pr-10`} />
                            <EyeIconButton show={showPassword} toggle={() => setShowPassword(!showPassword)} />
                        </div>
                    </div>

                    {isLogin && (
                        <div className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-[#1e242f] text-[#0d9488] focus:ring-[#0d9488] focus:ring-offset-[#151a23] cursor-pointer"
                            />
                            <label htmlFor="rememberMe" className="ml-2 block text-gray-400 cursor-pointer hover:text-gray-300">
                                Keep me logged in
                            </label>
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} className={btnStyles}>
                        {isLoading ? "Processing..." : (isLogin ? "Mellon" : "Create account")}
                    </button>
                </form>

                {/* Bottom Toggle */}
                <div className="mt-8 text-sm text-center text-gray-500">
                    {isLogin ? "New to Tirith? " : "Already have an account? "}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}
                        className="cursor-pointer font-medium text-[#0d9488] hover:text-[#0f766e] transition-colors"
                    >
                        {isLogin ? "Create an account" : "Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Reusable SVG Icon Component ---
const EyeIconButton = ({ show, toggle }) => (
    <button
        type="button"
        onClick={toggle}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
    >
        {show ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
        )}
    </button>
);