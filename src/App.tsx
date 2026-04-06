import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Assistant from './pages/Assistant';
import Bookkeeping from './pages/Bookkeeping';
import Profile from './pages/Profile';
import RecordBet from './pages/RecordBet';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 sm:p-4 flex items-center justify-center">
      <div className="w-full h-[100dvh] sm:h-[844px] sm:max-h-[90vh] max-w-[390px] bg-[#F7F8FA] text-gray-900 font-sans selection:bg-emerald-100 relative sm:rounded-[3rem] sm:border-[8px] sm:border-gray-900 overflow-hidden shadow-2xl flex flex-col">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Assistant />} />
              <Route path="bookkeeping" element={<Bookkeeping />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="/record-bet" element={<RecordBet />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}
