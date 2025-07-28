import React from "react";
import { signInWithGoogle } from "../firebase";
import { GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/vintlogo.jpg";

function LoginPage() {
  const navigate = useNavigate();
  const handleLogin = async () => {
    try{
        //Open google sign-in popup, when user signs in, we return a credential object
        //Extract the OAuth credential from the object (result)
        const result = await signInWithGoogle();
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if(!credential)
        {
          throw new Error("No Google Credential Returned");
        }
        //Access actual Google-issued ID token, verify against Google's public keys
        //sent to backend via HTTP POST request to /auth/google FastAPI endpoint
        const idToken = credential.idToken;
        const response = await fetch("http://localhost:8000/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token: idToken })
        });
        
        const data = await response.json();
        if(!response.ok)
        {
          throw new Error(data.detail || "Backend Authentication Failed");
        }
        //Set app's JWT in browser for future authenticated API calls
        localStorage.setItem("jwt", data.access_token);
        navigate("/dashboard");
    }catch(err){
        alert("Google login failed. Please try again.");
    }
};
  //Animated background styles
  const animatedBgStyles = `
    .animated-bg-login::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      background: linear-gradient(120deg, #0a1120 0%, #14213d 50%, #2de1a3 100%);
      background-size: 200% 200%;
      animation: gradient-move-login 60s ease-in-out infinite;
      opacity: 0.7;
    }
    @keyframes gradient-move-login {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;

  return (
    <>
      <style>{animatedBgStyles}</style>
      <div className="min-h-screen flex items-center justify-center bg-[#0a1120] animated-bg-login relative overflow-hidden">
        <div className="bg-[#192447]/70 backdrop-blur-md rounded-3xl shadow-2xl px-10 py-12 flex flex-col items-center w-full max-w-md border-2 border-[#2de1a3] animate-fade-in-up relative z-20">
          <img src={Logo} alt="Vint Logo" className="w-32 h-32 mb-8 rounded-2xl shadow-xl border-4 border-[#2de1a3] bg-white animate-fade-in"/>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight drop-shadow">Login</h1>
          <p className="mb-8 text-[#2de1a3] text-lg font-medium">Sign in to track your finances</p>
          <button
            aria-label="Sign in with Google"
            onClick={handleLogin}
            className="flex items-center gap-3 px-7 py-3 bg-[#14213d] border-2 border-[#2de1a3] rounded-xl shadow-lg hover:bg-[#2de1a3] hover:text-[#14213d] hover:scale-105 active:scale-95 transition-all duration-200 text-[#2de1a3] font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#2de1a3]"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.68 2.36 30.74 0 24 0 14.82 0 6.71 5.08 2.69 12.44l7.98 6.2C12.13 12.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.98 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65A14.5 14.5 0 019.5 24c0-1.62.28-3.19.77-4.65l-7.98-6.2A23.93 23.93 0 000 24c0 3.77.9 7.34 2.49 10.49l8.18-5.84z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.14 15.9-5.81l-7.19-5.6c-2.01 1.35-4.6 2.16-8.71 2.16-6.38 0-11.87-2.59-15.33-6.85l-8.18 5.84C6.71 42.92 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
