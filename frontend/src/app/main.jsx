import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../assets/styles/index.css";

// React 앱을 #root에 렌더링
const rootElement = document.getElementById("root");
createRoot(rootElement).render(<App />);
