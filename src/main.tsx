import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Initialize Firebase
import "./config/firebase";

createRoot(document.getElementById("root")!).render(<App />);
