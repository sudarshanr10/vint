import React from "react";
import { auth, provider, signInWithGoogle } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const handleLogin = async () => {
    try{
        const result = await signInWithGoogle();
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if(!credential)
        {
          throw new Error("No Google Credential Returned");
        }

        const idToken = credential.idToken;
        console.log("Google OAuth2 ID Token:", idToken)
        const res = await fetch("http://localhost:8000/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ token: idToken })
        });
        
        const data = await res.json();
        if(!res.ok)
        {
          throw new Error(data.detail || "Backend Authentication Failed");
        }
        localStorage.setItem("jwt", data.access_token);
        navigate("/dashboard");
    }catch(err){
        console.error("Login error:", err);
        alert("Google login failed. Please try again.");
    }
};
 return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Login</h1>
      <button onClick={handleLogin} style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
        Sign in with Google
      </button>
    </div>
  );
}
export default LoginPage;
