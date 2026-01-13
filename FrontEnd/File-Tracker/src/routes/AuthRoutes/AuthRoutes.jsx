import {Routes, Route} from 'react-router-dom';
import FacultyLogin from '../../pages/Auth/FacultyAuth/Login';
import FacultyForgotPassword from '../../pages/Auth/FacultyAuth/ForgotPassword';
import AdminLogin from '../../pages/Auth/AdminAuth/AdminLogin';
import AdminForgotPassword from '../../pages/Auth/AdminAuth/AdminForgotPassword';

const AuthRoutes = () => {
  return (
    <>
        <Routes>
            <Route path='/' element={<FacultyLogin/>}/>
            <Route path='/login' element={<FacultyLogin/>}/>
            <Route path='/forgot-password' element={<FacultyForgotPassword/>}/>
            <Route path='/admin-login' element={<AdminLogin/>}/>
            <Route path='/admin-forgot-password' element={<AdminForgotPassword/>}/>
        </Routes>
    </>
  )
}

export default AuthRoutes;