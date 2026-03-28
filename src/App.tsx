import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Assistant from './pages/Assistant';
import Bookkeeping from './pages/Bookkeeping';
import Profile from './pages/Profile';
import AddBet from './pages/AddBet';
import Schedule from './pages/Schedule';
import News from './pages/News';
import MatchDetail from './pages/MatchDetail';
import NewsDetail from './pages/NewsDetail';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 sm:p-4 flex items-center justify-center">
      <div className="w-full h-[100dvh] sm:h-[844px] sm:max-h-[90vh] max-w-[390px] bg-[#F7F8FA] text-gray-900 font-sans selection:bg-emerald-100 relative sm:rounded-[3rem] sm:border-[8px] sm:border-gray-900 overflow-hidden shadow-2xl flex flex-col">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Assistant />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="news" element={<News />} />
              <Route path="bookkeeping" element={<Bookkeeping />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/add-bet" element={<AddBet />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/news/:id" element={<NewsDetail />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
