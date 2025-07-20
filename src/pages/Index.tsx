
import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { Login } from "@/components/Login";
import { ApiKeyInput } from "@/components/ApiKeyInput";

const Index = () => {
  // Force login page to show first - never auto-login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    // Check if API key exists
    const apiKey = localStorage.getItem("openrouter_api_key");
    setHasApiKey(!!apiKey);
  };

  const handleApiKeySet = () => {
    setHasApiKey(true);
  };

  // Always show login page first
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show API key input if no key is set
  if (!hasApiKey) {
    return <ApiKeyInput onApiKeySet={handleApiKeySet} />;
  }

  // Show main chat interface after login and API key setup
  return <ChatInterface />;
};

export default Index;
