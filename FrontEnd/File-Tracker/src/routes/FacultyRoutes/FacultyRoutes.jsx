import { Route ,Routes } from "react-router-dom";
import Layout from "../../components/FacultyLayout/Layout";
import FacultyLoaded from "../../pages/Faculty/FacultyLoaded";
import FileUpload from "../../pages/Faculty/FileUpload";
import FileHistory from "../../pages/Faculty/FileHistory";
import TaskDeliverables from "../../pages/Faculty/TaskDeliverables";
import Notification from "../../pages/Faculty/Notification";

const FacultyRoutes = () => {
  return (
    <>
        <Routes> 
          <Route element={<Layout />}>
              <Route path="/faculty-loaded" element={<FacultyLoaded />} />
              <Route path="/file-upload" element={<FileUpload />} />
              <Route path="/file-history" element={<FileHistory />} />
              <Route path="/task-deliverables" element={<TaskDeliverables />} />
              <Route path="/notification" element={<Notification />} />
          </Route>
        </Routes>
    </>
  )
}

export default FacultyRoutes;
