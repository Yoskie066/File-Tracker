import React from "react";

export default function Footer() {
  return (
    <footer className="bg-black text-white text-center py-4 mt-10">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} File Tracker. All rights reserved.
      </p>
    </footer>
  );
}

