import React from "react";
import { auth, provider, signInWithGoogle } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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
        //Set app's JWT in browser for future authenticated API calls
        localStorage.setItem("jwt", data.access_token);
        navigate("/dashboard");
    }catch(err){
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
