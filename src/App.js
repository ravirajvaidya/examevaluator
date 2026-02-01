import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EvaluationPage from './components/EvaluationPage';
import LoginPage from './components/LoginPage';
import PageNotFound from './components/PageNotFound';
import SignUpPage from './components/SignUpPage';
import ProfilePage from './components/ProfilePage';
import ScoresPage from './components/ScoresPage';
import SettingsPage from './components/SettingsPage';
import AdminPage from './components/AdminPage';
import DashboardPage from './components/DashboardPage';

// import Info from './components/Info';
// import ExcelEvaluator from './components/ExcelEvaluator';

function App() {
  return (
    <div className="App">
      {/* <Info></Info> */}
      {/* <ExcelEvaluator></ExcelEvaluator> */}
      {/* <EvaluationPage></EvaluationPage> */}

      <BrowserRouter>
        <Routes>
          <Route path='/signup' element={<SignUpPage />}></Route>
          <Route path='/' element={<LoginPage />}></Route>
          <Route path='/dashboard' element={<DashboardPage />}></Route>
          <Route path='/profile' element={<ProfilePage />}></Route>
          <Route path='/scores' element={<ScoresPage />}></Route>
          <Route path='/settings' element={<SettingsPage />}></Route>
          <Route path='*' element={<PageNotFound />}></Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
