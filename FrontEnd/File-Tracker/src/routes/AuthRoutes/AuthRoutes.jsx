import {Routes, Route} from 'react-router-dom';
import FacultyLogin from '../../pages/Auth/FacultyAuth/Login';
import FacultyRegister from '../../pages/Auth/FacultyAuth/Register';
import AdminLogin from '../../pages/Auth/AdminAuth/AdminLogin';
import AdminRegister from '../../pages/Auth/AdminAuth/AdminRegister';

const AuthRoutes = () => {
  return (
    <>
        <Routes>
            <Route path='/' element={<FacultyLogin/>}/>
            <Route path='/login' element={<FacultyLogin/>}/>
            <Route path='/register' element={<FacultyRegister/>}/>
            <Route path='/admin-login' element={<AdminLogin/>}/>
            <Route path='/admin-register' element={<AdminRegister/>}/>
        </Routes>
    </>
  )
}

export default AuthRoutes;