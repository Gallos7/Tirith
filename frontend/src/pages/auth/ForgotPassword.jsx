import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            const response = await apiClient.post('/auth/password/forgot', { email });
            setSuccessMsg(response.data.message);
            setStep(2);
        } catch (err) { setError(err.response?.data?.detail || "Failed to send code."); }
        finally { setIsLoading(false); }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError('');
        try {
            const response = await apiClient.post('/auth/password/reset', {
                email,
                code,
                new_password: newPassword
            });
            setSuccessMsg(response.data.message);
            setStep(3);
        } catch (err) { setError(err.response?.data?.detail || "Failed to reset password."); }
        finally { setIsLoading(false); }
    };

    const inputStyles = "w-full px-3.5 py-2.5 bg-[#1e242f] border border-gray-700/80 rounded-md text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488] transition-colors";
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
                        "I have no memory of this place."
                    </p>
                </div>

                {step === 2 && (
                    <p className="text-sm text-gray-400 mb-5 text-center">
                        We sent a 6-digit code to <span className="font-semibold text-white">{email}</span>
                    </p>
                )}
                {error && <div className="mb-5 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded-md">{error}</div>}
                {successMsg && step === 3 && <div className="mb-5 p-3 bg-teal-900/30 border border-[#0d9488]/50 text-[#0d9488] text-sm rounded-md text-center">{successMsg}</div>}

                {step === 1 && (
                    <form onSubmit={handleRequestCode} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email address</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} />
                        </div>
                        <button type="submit" disabled={isLoading} className={btnStyles}>
                            {isLoading ? 'Sending...' : 'Send Reset Email'}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Verification code</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className={`${inputStyles} text-center font-mono tracking-widest`}
                                placeholder="000000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">New password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`${inputStyles} pr-10`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="cursor-pointer absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className={btnStyles}>
                            {isLoading ? 'Resetting...' : 'Verify & Reset'}
                        </button>
                        <div className="text-center pt-1">
                            <button type="button" onClick={() => setStep(1)} className="cursor-pointer text-xs text-[#0d9488] hover:underline">
                                Need to use a different email?
                            </button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <div className="text-center mt-2">
                        <Link to="/login" className={btnStyles}>Return to Login</Link>
                    </div>
                )}

                {step !== 3 && (
                    <div className="mt-8 text-sm text-center text-gray-500">
                        Remembered your password?{' '}
                        <Link to="/login" className="cursor-pointer font-medium text-[#0d9488] hover:text-[#0f766e] transition-colors">
                            Sign in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};