import { useState } from 'react';
import { ChevronLeft, Camera, Check, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function AddBet() {
  const navigate = useNavigate();
  const [sport, setSport] = useState<'football' | 'basketball'>('football');
  const [match, setMatch] = useState('');
  const [playType, setPlayType] = useState('');
  const [amount, setAmount] = useState('');
  const [odds, setOdds] = useState('');

  const handleSave = () => {
    if (!match || !amount) {
      alert('请填写完整信息');
      return;
    }
    alert('记账成功！');
    navigate('/bookkeeping');
  };

  const handlePhotoUpload = () => {
    alert('模拟拍照/上传彩票功能');
    setMatch('曼城 vs 利物浦');
    setPlayType('胜平负 - 主胜');
    setOdds('1.85');
    setAmount('1000');
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">
      <header className="bg-white/80 backdrop-blur-md px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">添加记账</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6 pb-8">
        {/* Smart Upload */}
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePhotoUpload}
          className="w-full bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200/60 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center text-emerald-600 hover:bg-emerald-100/50 transition-colors shadow-sm"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
            <ScanLine size={24} className="text-emerald-500" />
          </div>
          <span className="text-[15px] font-bold text-gray-900">拍照智能识别</span>
          <span className="text-[13px] text-gray-500 mt-1">支持竞彩网实体票一键导入</span>
        </motion.button>

        <div className="flex items-center justify-center py-1">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="px-4 text-[13px] text-gray-400 font-medium tracking-widest">或手动输入</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50 space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-3">运动类型</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSport('football')}
                className={cn(
                  "flex-1 py-3 text-[15px] rounded-xl border-2 transition-all duration-300",
                  sport === 'football' ? "bg-emerald-50 border-emerald-500 text-emerald-600 font-bold" : "border-gray-100 text-gray-600 hover:border-gray-200"
                )}
              >
                ⚽️ 足球
              </button>
              <button
                onClick={() => setSport('basketball')}
                className={cn(
                  "flex-1 py-3 text-[15px] rounded-xl border-2 transition-all duration-300",
                  sport === 'basketball' ? "bg-orange-50 border-orange-500 text-orange-600 font-bold" : "border-gray-100 text-gray-600 hover:border-gray-200"
                )}
              >
                🏀 篮球
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-2">比赛</label>
            <input
              type="text"
              value={match}
              onChange={(e) => setMatch(e.target.value)}
              placeholder="例如：曼联 vs 阿森纳"
              className="w-full border-b-2 border-gray-100 py-2.5 text-[16px] text-gray-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-2">玩法 <span className="text-gray-400 font-normal">(不支持超级大混投)</span></label>
            <input
              type="text"
              value={playType}
              onChange={(e) => setPlayType(e.target.value)}
              placeholder="例如：胜平负 - 主胜"
              className="w-full border-b-2 border-gray-100 py-2.5 text-[16px] text-gray-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-5">
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-gray-500 mb-2">赔率</label>
              <input
                type="number"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                placeholder="0.00"
                className="w-full border-b-2 border-gray-100 py-2.5 text-[16px] text-gray-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[13px] font-medium text-gray-500 mb-2">投入金额 (元)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border-b-2 border-gray-100 py-2.5 text-[18px] font-bold text-gray-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
          </div>

          {/* Calculation Preview */}
          {amount && odds && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-50 rounded-2xl p-4 mt-2 flex justify-between items-center border border-gray-100/50">
              <span className="text-[14px] font-medium text-gray-600">预计最高奖金</span>
              <span className="text-2xl font-bold text-red-500">
                ¥{(parseFloat(amount) * parseFloat(odds)).toFixed(2)}
              </span>
            </motion.div>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-[16px] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 mt-8"
        >
          <Check size={20} strokeWidth={2.5} />
          保存记录
        </motion.button>
      </div>
    </div>
  );
}
