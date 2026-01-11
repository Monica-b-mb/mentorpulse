import React from "react";

export default function Footer() {
  return (
    <footer className="text-center py-3" style={{ color: "#6c757d" }}>
      © {new Date().getFullYear()} Mentor Pulse
    </footer>
  );
}

