import { Navigate, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LayoutNew from './components/LayoutNew';
import DashboardNew from './pages/DashboardNew';
import FormAnalysisNew from './pages/FormAnalysisNew';
import ReviewAnswersNew from './pages/ReviewAnswersNew';
import HistoryNew from './pages/HistoryNew';
import ProfileNew from './pages/ProfileNew';
import InformationNew from './pages/InformationNew';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuth(!!token);
  }, []);
  
  if (isAuth === null) return <div className="grid h-screen place-items-center"><div className="text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3d9b69] border-r-transparent"></div></div></div>;
  
  return isAuth ? children : <Navigate to="/login" replace/>;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route element={<ProtectedRoute><LayoutNew/></ProtectedRoute>}>
      <Route path="/dashboard" element={<DashboardNew/>}/>
      <Route path="/profile" element={<ProfileNew/>}/>
      <Route path="/information" element={<InformationNew/>}/>
      <Route path="/history" element={<HistoryNew/>}/>
      <Route path="/forms/:formId" element={<FormAnalysisNew/>}/>
      <Route path="/forms/:formId/review" element={<ReviewAnswersNew/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/login" replace/>}/>
  </Routes>;
}
