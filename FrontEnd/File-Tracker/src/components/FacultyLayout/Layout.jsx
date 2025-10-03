import { Outlet } from "react-router-dom";
import Footer from "../FacultyLayout/Footer";
import Header from "../FacultyLayout/Header";

export default function Layout() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer/>
    </>
  );
}