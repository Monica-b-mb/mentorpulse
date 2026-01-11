import React from "react";
import useSidebar from "../Sidebar/useSidebar";

export default function Navbar() {
  const { toggle } = useSidebar();

  return (
    <header className="d-flex align-items-center justify-content-between px-3 py-2 bg-white shadow-sm">
      <div className="d-flex align-items-center">
        <button
          className="btn btn-outline-secondary d-md-none me-2"
          onClick={toggle}
          aria-label="Toggle menu"
        >
          <i className="bi bi-list" />
        </button>
        <h5 className="mb-0">Mentor Pulse</h5>
      </div>

      <div>{/* right side: avatar/notifications (future) */}</div>
    </header>
  );
}
