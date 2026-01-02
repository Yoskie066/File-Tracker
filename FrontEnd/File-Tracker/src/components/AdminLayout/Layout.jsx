import { useState } from "react";
import { Outlet } from "react-router-dom";
import Footer from "../AdminLayout/Footer";
import Header from "../AdminLayout/Header";
import Sidebar from "../AdminLayout/Sidebar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6 lg:ml-72">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}