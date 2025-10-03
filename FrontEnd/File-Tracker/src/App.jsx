import AuthRoutes from "./routes/AuthRoutes/AuthRoutes";
import FacultyRoutes from "./routes/FacultyRoutes/FacultyRoutes";
import AdminRoutes from "./routes/AdminRoutes/AdminRoutes";

function App() {
  return (
    <>
      <AuthRoutes/>
      <FacultyRoutes/>
      <AdminRoutes/>
    </>
  );
}

export default App;
