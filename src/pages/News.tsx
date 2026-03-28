import { useState } from 'react';
import { Settings, TrendingUp, Flame, Clock, ChevronRight, ExternalLink, Zap, Star, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

type NewsCategory = 'hot' | 'football' | 'basketball' | 'analysis';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  source: string;
  time: string;
  category: NewsCategory;
  tag?: string;
  isHot?: boolean;
}

export default function News() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NewsCategory>('hot');

  const newsItems: NewsItem[] = [
    { id: 1, title: '阿森纳核心萨卡伤缺两周，对阵曼城成疑', summary: '英超冠军争夺战关键时刻，阿森纳宣布萨卡因大腿拉伤将缺席至少两场比赛，这可能影响接下来对阵曼城的关键战。', source: '天空体育', time: '12分钟前', category: 'football', tag: '伤病', isHot: true },
    { id: 2, title: 'NBA交易截止日前瞻：湖人或追逐全明星射手', summary: '据多方消息源透露，湖人队正在积极运作交易，目标锁定一位全明星级别的外线射手以补强阵容。', source: 'ESPN', time: '35分钟前', category: 'basketball', tag: '转会' },
    { id: 3, title: '本周末英超焦点战数据前瞻', summary: '利用大数据模型分析本轮英超6场焦点赛事的走势，包含进球预期值、控球率、射门效率等多维度数据。', source: 'Foretell', time: '1小时前', category: 'analysis', tag: '数据', isHot: true },
    { id: 4, title: '皇马确认维尼修斯复出，国家德比全力出击', summary: '皇马官方确认维尼修斯已完成全队合练，将出战本周末的国家德比战。巴萨防线面临巨大考验。', source: '马卡报', time: '2小时前', category: 'football', tag: '复出' },
    { id: 5, title: '凯尔特人 vs 雷霆：东西部榜首直接对话', summary: '本赛季常规赛最受期待的对决之一即将上演，两队攻防效率均位列联盟前三。', source: 'NBA官网', time: '3小时前', category: 'basketball' },
    { id: 6, title: '欧冠淘汰赛赔率异动分析：拜仁被低估？', summary: '从最新的市场赔率变化来看，拜仁慕尼黑的夺冠赔率出现异常下降，机构可能掌握了关键信息。', source: 'Foretell', time: '4小时前', category: 'analysis', tag: '赔率', isHot: true },
    { id: 7, title: '意甲争冠形势：国米优势明显但变数仍存', summary: '国米目前领先第二名5分，但接下来的赛程难度明显加大，连续对阵尤文和米兰的双线考验将是关键。', source: '米兰体育报', time: '5小时前', category: 'football' },
    { id: 8, title: 'CBA季后赛对阵出炉，广东辽宁有望会师决赛', summary: 'CBA常规赛收官战结束，季后赛对阵形势明朗。广东和辽宁分居上下半区，有望在总决赛舞台再次相遇。', source: 'CBA官网', time: '6小时前', category: 'basketball', tag: '季后赛' },
  ];

  const filtered = activeTab === 'hot'
    ? newsItems.filter(n => n.isHot || newsItems.indexOf(n) < 4)
    : newsItems.filter(n => n.category === activeTab);

  const tagColor = (tag?: string) => {
    if (!tag) return '';
    const map: Record<string, string> = {
      '伤病': 'bg-red-50 text-red-600 border-red-100',
      '转会': 'bg-blue-50 text-blue-600 border-blue-100',
      '数据': 'bg-violet-50 text-violet-600 border-violet-100',
      '复出': 'bg-emerald-50 text-emerald-600 border-emerald-100',
      '赔率': 'bg-amber-50 text-amber-600 border-amber-100',
      '季后赛': 'bg-orange-50 text-orange-600 border-orange-100',
    };
    return map[tag] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const categoryIcons: Record<NewsCategory, React.ReactNode> = {
    hot: <Flame size={14} />,
    football: <span className="text-[12px]">⚽</span>,
    basketball: <span className="text-[12px]">🏀</span>,
    analysis: <BarChart3 size={14} />,
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-3 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
        <h1 className="text-xl font-bold text-gray-900">资讯</h1>
        <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <Settings size={20} />
        </button>
      </header>

      {/* Category Tabs */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="flex bg-gray-200/50 p-1 rounded-xl">
          {([
            { key: 'hot', label: '热门' },
            { key: 'football', label: '足球' },
            { key: 'basketball', label: '篮球' },
            { key: 'analysis', label: '分析' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2 text-[13px] font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-1",
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              )}
            >
              {categoryIcons[tab.key]}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2.5 pb-8">
        {/* Featured Card (first item) */}
        {filtered.length > 0 && activeTab === 'hot' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg mb-3 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mt-10 -mr-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -mb-8 -ml-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-amber-400" />
                <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">焦点资讯</span>
              </div>
              <h3 className="text-[16px] font-bold leading-snug mb-2">{filtered[0].title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2">{filtered[0].summary}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[11px] text-gray-500">{filtered[0].source} · {filtered[0].time}</span>
                <ChevronRight size={16} className="text-gray-500" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular News Items */}
        {(activeTab === 'hot' ? filtered.slice(1) : filtered).map((item, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  {item.tag && (
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", tagColor(item.tag))}>
                      {item.tag}
                    </span>
                  )}
                  {item.isHot && (
                    <Flame size={12} className="text-orange-500" />
                  )}
                </div>
                <h3 className="text-[14px] font-bold text-gray-900 leading-snug mb-1.5 line-clamp-2">{item.title}</h3>
                <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-2">{item.summary}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[11px] text-gray-400">{item.source}</span>
                  <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />
                  <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                    <Clock size={10} />
                    {item.time}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
