import React, { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useNavigate } from "react-router-dom";

function PlaidLinkButton({ onSuccess }) {
    const navigate = useNavigate();
    const [linkToken, setLinkToken] = useState(null);
    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if(!jwt)
        {
            navigate("/");
            return;
        }
        fetch("http://localhost:8000/plaid/link_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwt}`,
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log("got link token:", data.link_token);
            setLinkToken(data.link_token);
        })
         
        .catch(error => {
            console.error("Error fetching link token:", error);
        })
    }, [navigate]);

        const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: async (public_token, metadata) => {
            try{
                const jwt = localStorage.getItem("jwt");
                if (!jwt) {
                    navigate("/");
                    return;
                }
                const response = await fetch("http://localhost:8000/plaid/set_access_token", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwt}`
                    },
                    body: JSON.stringify({ public_token })
                });
                if(!response.ok)
                {
                    throw new Error("Failed to exchange public token for access token");
                }
                console.log("✅ Successfully exchanged public token");
                onSuccess?.(public_token);
            }catch(error) {
                console.error("Error exchanging tokens", error);
                alert("Failed to connect bank account. Please try again.");
            }
        },
        onExit: (error, metadata) => {
            if (error){
                console.warn("Plaid exited with error", error);
            }
        }
    });
    return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      {ready ? "Connect a Bank Account" : "Loading…"}
    </button>
  );
}

export default PlaidLinkButton;