import { ChevronLeft, Clock, Share2, Flame, MessageCircle, ThumbsUp, Bookmark } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

// ─── Mock full article content by news ID ───
const articleContent: Record<number, { paragraphs: string[]; image?: { position: number; caption: string } }> = {
  1: {
    paragraphs: [
      '英超冠军争夺战进入白热化阶段，阿森纳在最关键的时刻遭遇了重大打击。俱乐部官方在周三发布的伤情报告中确认，球队核心球员布卡约·萨卡因右大腿后侧肌肉拉伤，将缺席至少两场比赛。',
      '据队医团队透露，萨卡是在上轮对阵布莱顿的比赛中受伤的。当时他在一次高速突破后感到不适，随后被替换下场。赛后核磁共振检查显示为二级肌肉拉伤，预计恢复期为两到三周。',
      '这对阿森纳来说无疑是巨大的损失。本赛季萨卡在英超联赛中贡献了12粒进球和8次助攻，是球队进攻端最具威胁的球员。他的缺阵将直接影响阿森纳在即将到来的曼城一战中的战术部署。',
      '阿尔特塔在新闻发布会上表示："萨卡的缺阵是一个打击，但我们有足够深度的阵容来应对。特罗萨德和恩凯蒂亚都做好了准备，他们一直在训练中表现出色。"',
      '从历史数据来看，没有萨卡的阿森纳胜率从72%下降至54%，场均预期进球数从2.3降至1.6。这些数字足以说明萨卡对球队体系的重要性。',
      '不过也有分析人士指出，阿森纳本赛季在多线作战中已经展现了更强的轮换深度。特罗萨德在替补出场时场均参与1.2个进球，表现可圈可点。加上厄德高的回归，球队中场创造力并未受到太大影响。',
      'Foretell数据模型显示，即便萨卡缺阵，阿森纳在主场对阵曼城的不败概率仍然达到58.3%，主要得益于主场优势和曼城近期客场表现的波动。但需要警惕的是，曼城在近5场关键对决中保持全胜，心理优势明显。',
    ],
    image: { position: 2, caption: '萨卡在上轮比赛中受伤离场，队友们表示关切' },
  },
  2: {
    paragraphs: [
      'NBA交易截止日仅剩不到一周，湖人队的交易动态成为全联盟最受关注的焦点。据ESPN资深记者沃纳罗斯基报道，湖人管理层正在积极探索多条交易路径，核心目标是补强外线投射能力。',
      '消息人士透露，湖人目前与至少三支球队保持着密切接触。球队愿意用首轮选秀权和年轻球员作为筹码，换取一位能够立即提升阵容实力的射手。据悉，他们的首选目标是一位场均三分命中率超过40%的全明星级球员。',
      '本赛季湖人的三分命中率仅排在联盟第22位，这已经成为制约球队更进一步的最大短板。勒布朗·詹姆斯和安东尼·戴维斯的内线统治力毋庸置疑，但缺乏稳定的外线火力让湖人在面对强队时常常陷入被动。',
      '湖人主帅哈姆表示："我们需要的是能在关键时刻命中投篮的球员，我相信管理层正在为球队做最好的规划。"',
      '从Foretell交易预测模型来看，湖人在截止日前完成至少一笔交易的概率高达78%。如果能够成功引进目标射手，湖人在季后赛首轮的晋级概率将从目前的52%提升至67%。',
    ],
    image: { position: 2, caption: '湖人管理层正在积极运作交易以补强阵容' },
  },
  3: {
    paragraphs: [
      'Foretell大数据分析团队利用自研的预测模型，对本轮英超6场焦点赛事进行了全面的赛前数据前瞻。以下是核心发现和建议。',
      '本轮英超最大的看点无疑是阿森纳主场对阵曼城。两队近10场交锋各胜4场平2场，势均力敌。从进球预期值（xG）来看，阿森纳本赛季主场场均xG为2.34，而曼城客场场均xG为1.89，主队占据一定优势。',
      '利物浦客场挑战切尔西是另一场值得关注的对决。利物浦本赛季客场胜率高达73%，但切尔西在斯坦福桥的防守表现同样出色，场均仅失0.7球。模型预测这场比赛大概率出现小球（总进球2球以下概率58%）。',
      '控球率方面，本轮6场比赛中最悬殊的预计是曼城对阵阿森纳，曼城预计控球率55-58%，但阿森纳的反击效率全联盟第一，控球劣势并不意味着场面被动。',
      '射门效率数据显示，本轮预计射正率最高的球队是利物浦（场均射正5.8次），最低的是布莱顿（场均射正3.2次）。角球数据方面，曼城以场均7.1个角球领跑，远超联赛平均的5.2个。',
      '综合以上数据维度，Foretell模型本轮最看好的投注方向是：阿森纳不败（概率62%）、利物浦vs切尔西小2.5球（概率58%）、纽卡斯尔主场胜（概率64%）。以上建议仅供参考，投注需理性。',
    ],
    image: { position: 1, caption: 'Foretell 数据模型多维度分析本轮英超焦点战' },
  },
  4: {
    paragraphs: [
      '皇家马德里官方在今日训练后发布声明，确认巴西球星维尼修斯已经完全恢复并参加了全队合练，将随队出征本周末对阵巴塞罗那的国家德比。',
      '维尼修斯此前因左腿腓骨肌肉疲劳缺席了上一场联赛，引发了外界对他能否出战国家德比的担忧。不过皇马队医表示，经过一周的恢复性训练，维尼修斯已经达到了比赛状态，没有任何伤病隐患。',
      '安切洛蒂在新闻发布会上表示："维尼修斯的状态非常好，他不仅会出战国家德比，而且会首发登场。他在这种大赛中总能展现出最好的自己。"',
      '本赛季维尼修斯在西甲联赛中已经打入14球并贡献7次助攻，是皇马进攻端最依仗的球员。在过去5场对阵巴萨的比赛中，维尼修斯贡献了3球2助攻，对巴萨后防线构成了巨大威胁。',
      '巴萨方面需要重点部署如何限制维尼修斯的发挥。上赛季国家德比中，巴萨使用坎塞洛一对一盯防维尼修斯取得了不错的效果，本场比赛预计巴萨会继续采用类似的防守策略。',
      '从Foretell赔率模型来看，维尼修斯的复出使皇马主场胜赔从2.10下降至1.95，市场明显看好皇马在主场拿下三分。',
    ],
    image: { position: 2, caption: '维尼修斯在训练中表现活跃，状态良好' },
  },
  5: {
    paragraphs: [
      '本赛季NBA常规赛最令人期待的对决之一即将上演——东部榜首波士顿凯尔特人将在主场迎战西部领头羊俄克拉荷马雷霆。这场比赛被外界视为"总决赛预演"。',
      '凯尔特人本赛季展现出了统治级的表现，进攻效率排名联盟第一（每百回合117.8分），防守效率同样位列前三。塔图姆和布朗的双核组合日趋成熟，波尔津吉斯的加盟更是为球队增添了一个可靠的第三得分点。',
      '雷霆则是本赛季最大的惊喜。年仅21岁的亚历山大已经成长为MVP级别的球员，场均31.2分领跑得分榜。霍尔姆格伦的内线保护能力和多特的三分投射为球队提供了全面的进攻火力。',
      '两队在攻防两端的数据不相上下：凯尔特人净效率+10.2位列联盟第一，雷霆+9.8紧随其后。本赛季首次交锋中，凯尔特人在客场以112-108险胜，亚历山大虽然砍下38分但最后时刻失误葬送好局。',
      '这场比赛的关键对位是亚历山大vs怀特/布朗的持球攻防对决，以及波尔津吉斯vs霍尔姆格伦的内线攻守博弈。根据Foretell模型，凯尔特人主场胜率约55%，但考虑到雷霆本赛季客场胜率高达68%，这将是一场势均力敌的对决。',
    ],
  },
  6: {
    paragraphs: [
      '在近期的欧冠夺冠赔率市场中，拜仁慕尼黑的赔率出现了一波显著的异常下降，从开赛初期的12.00降至目前的7.50，降幅达到37.5%。这种幅度的赔率变化在赛季中段极为罕见，通常意味着市场掌握了某些关键信息。',
      'Foretell赔率监控系统捕捉到，这轮赔率调整始于上周二，主要由亚洲盘口率先发起，随后欧洲主流博彩公司跟进调整。从资金流向来看，过去7天有超过常规水平3倍的资金流入拜仁夺冠方向。',
      '分析其中可能的原因：首先，拜仁在冬窗完成了一笔关键引援，补强了此前薄弱的中场防守环节。其次，球队在近10场比赛中9胜1平保持不败，进攻火力全开的同时防守端也趋于稳固。',
      '从对阵签表来看，拜仁在淘汰赛阶段的对手相对有利，八强对手实力在本届参赛队伍中处于中游水平。如果顺利前进，拜仁很可能避开皇马和曼城，直到决赛才会遭遇最强对手。',
      '然而也有分析师持不同观点。他们指出拜仁在近几个赛季的欧冠淘汰赛中多次出现关键时刻发挥失常的情况，球队的心理素质和临场应变能力仍然是一个不确定因素。',
      'Foretell综合模型目前给出拜仁夺冠概率为13.8%，位列所有参赛球队第三位，仅次于曼城（18.2%）和皇马（15.5%）。综合赔率异动和基本面分析，拜仁确实存在被市场低估的可能。',
    ],
    image: { position: 3, caption: 'Foretell 赔率监控系统检测到拜仁夺冠赔率异常下降' },
  },
  7: {
    paragraphs: [
      '意甲联赛进入后半程，国际米兰以5分的领先优势稳居榜首，但接下来的赛程安排将是对他们冠军成色的终极考验。',
      '国米目前32轮过后积74分，领先第二名那不勒斯5分。从数据层面来看，国米本赛季的统治力毋庸置疑：场均控球率58.3%联赛第一，场均预期进球2.1位列前三，防守端场均仅失0.65球更是鹤立鸡群。',
      '但接下来的6轮赛程堪称"魔鬼赛程"：先客场挑战尤文图斯，随后主场迎战AC米兰，再客场面对亚特兰大。三场关键战全部在15天内完成，对球队的体能和阵容深度提出了严峻考验。',
      '国米主帅因扎吉对此保持警觉："我们知道接下来的比赛非常困难，但球队的状态和信心都在最佳水平。重要的是一场一场去踢，不要过多考虑积分榜的情况。"',
      '从Foretell预测模型来看，国米在剩余6轮中预计可以拿到13分（4胜1平1负），足以保住领先优势。不过那不勒斯同期预计可以拿到15分，这意味着积分差距可能会缩小到3分，争冠悬念将一直保持到最后几轮。',
    ],
  },
  8: {
    paragraphs: [
      'CBA常规赛已经落下帷幕，季后赛对阵形势正式出炉。广东宏远和辽宁队分别以常规赛前两名的身份锁定上下半区的头号种子位置，两支传统豪强有望在总决赛舞台再次上演巅峰对决。',
      '广东队本赛季表现强势，常规赛取得38胜14负的战绩，进攻效率和防守效率均位列联盟前三。球队核心组合稳定，内外线火力均衡，板凳深度也是联赛最好的之一。',
      '辽宁队同样实力不俗，36胜16负排名第二。赵继伟的组织能力和付豪的内线统治力为球队提供了稳定的攻防体系。值得一提的是，辽宁在季后赛阶段历来表现优于常规赛，"季后赛辽宁"的名号并非浪得虚名。',
      '从半区形势来看，广东在上半区的主要对手是浙江广厦和北京首钢，辽宁在下半区需要面对新疆队和山东队的挑战。两支球队会师总决赛的概率被Foretell模型评估为42%。',
      '如果两队最终在总决赛相遇，这将是CBA历史上第15次"辽粤大战"，也是近10年来第8次在总决赛舞台交锋。上赛季总决赛辽宁4-2击败广东，广东势必在本赛季寻求复仇。',
      '从投注价值来看，Foretell模型认为广东夺冠的概率为28%，略高于辽宁的25%。但考虑到季后赛的不确定性，建议投注者保持理性，关注每轮系列赛的具体走势再做判断。',
    ],
    image: { position: 2, caption: 'CBA季后赛对阵形势图' },
  },
};

// ─── Tag color mapping ───
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

export default function NewsDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const news = location.state as any;

  if (!news) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#F7F8FA]">
        <p className="text-gray-500 text-[15px]">无资讯数据</p>
        <button onClick={() => navigate('/news')} className="mt-4 text-emerald-600 text-[14px] font-bold">返回资讯</button>
      </div>
    );
  }

  const content = articleContent[news.id] || {
    paragraphs: [news.summary, '详细内容加载中，请稍后再试...'] as string[],
    image: undefined as { position: number; caption: string } | undefined,
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">
      {/* ── Header ── */}
      <header className="bg-white/90 backdrop-blur-md px-3 py-2 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_8px_rgba(0,0,0,0.03)] shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[16px] font-bold text-gray-900">资讯详情</h1>
        <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <Share2 size={18} />
        </button>
      </header>

      {/* ── Article Content ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {/* Hero banner area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-gradient-to-br from-gray-900 to-gray-800 px-5 pt-6 pb-8"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mt-10 -mr-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/8 rounded-full blur-2xl -mb-12 -ml-8" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              {news.tag && (
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", tagColor(news.tag))}>
                  {news.tag}
                </span>
              )}
              {news.isHot && <Flame size={12} className="text-orange-400" />}
            </div>
            <h1 className="text-[20px] font-black text-white leading-snug mb-4">{news.title}</h1>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[11px] font-black">
                {news.source.charAt(0)}
              </div>
              <div>
                <span className="text-[13px] text-gray-300 font-medium">{news.source}</span>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <Clock size={10} />
                  <span>{news.time}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Article body */}
        <div className="px-5 pt-6 space-y-0">
          {content.paragraphs.map((p, i) => (
            <div key={i}>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="text-[15px] text-gray-700 leading-[1.9] font-medium mb-5"
              >
                {p}
              </motion.p>

              {/* Inline image placeholder */}
              {content.image && content.image.position === i && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 + 0.1 }}
                  className="mb-6 rounded-2xl overflow-hidden border border-gray-100"
                >
                  {/* SVG illustration placeholder */}
                  <div className="bg-gradient-to-br from-gray-100 to-gray-50 h-[180px] flex items-center justify-center relative">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-20">
                      <rect x="8" y="16" width="64" height="48" rx="6" stroke="#9CA3AF" strokeWidth="2" />
                      <circle cx="28" cy="34" r="6" stroke="#9CA3AF" strokeWidth="2" />
                      <path d="M8 52 L28 38 L44 48 L58 32 L72 44 V58 C72 61.3137 69.3137 64 66 64 H14 C10.6863 64 8 61.3137 8 58 V52Z" fill="#E5E7EB" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[12px] text-gray-500 font-medium bg-white/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        {news.source} 配图
                      </span>
                    </div>
                  </div>
                  <div className="bg-white px-3 py-2">
                    <p className="text-[11px] text-gray-500 font-medium">{content.image.caption}</p>
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {/* Source & disclaimer */}
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              来源：{news.source} · 以上内容仅供参考，不构成投注建议。数据分析由 Foretell AI 模型提供。
            </p>
          </div>

          {/* Interaction bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-around py-4 mt-4 bg-white rounded-2xl border border-gray-100/80 shadow-sm"
          >
            {[
              { icon: <ThumbsUp size={18} />, label: '有用', count: '128' },
              { icon: <MessageCircle size={18} />, label: '评论', count: '36' },
              { icon: <Bookmark size={18} />, label: '收藏', count: '84' },
              { icon: <Share2 size={18} />, label: '分享', count: '' },
            ].map((action, i) => (
              <button key={i} className="flex flex-col items-center gap-1 text-gray-500 hover:text-emerald-600 transition-colors active:scale-95">
                {action.icon}
                <span className="text-[10px] font-medium">{action.count || action.label}</span>
              </button>
            ))}
          </motion.div>

          {/* Related articles hint */}
          <div className="mt-6 mb-4">
            <h3 className="text-[14px] font-bold text-gray-800 mb-3">相关推荐</h3>
            <div className="space-y-2">
              {['更多赛事分析请关注 Foretell 策略推送', '每日早报与晚间策略，小绿助手定时送达'].map((text, i) => (
                <div key={i} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[13px] text-gray-500 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
