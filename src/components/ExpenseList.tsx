import { useEffect, useState } from 'react';
import { UserConfig } from '../lib/firebase.ts';
import { NotionPage } from '../types.ts';
import { formatCurrency, cn } from '../lib/utils.ts';
import { Calendar, Tag, RefreshCcw, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface ExpenseListProps {
  config: UserConfig;
}

export function ExpenseList({ config }: ExpenseListProps) {
  const [items, setItems] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notion/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.notionApiKey,
          databaseId: config.notionDatabaseId,
          limit: 20,
        }),
      });
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, [config]);

  const totalAmount = items.reduce((acc, item) => {
    const amount = item.properties.Amount?.number || 0;
    return acc + amount;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">最近交易</h2>
          <p className="text-slate-500 text-sm">與您的 Notion 資料庫即時同步</p>
        </div>
        <button
          onClick={fetchRecent}
          disabled={loading}
          className="rounded-full bg-white p-3 text-slate-400 shadow-sm border-2 border-slate-50 hover:text-slate-900 hover:border-slate-200 active:rotate-180 transition-all duration-500"
        >
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 bg-white rounded-3xl border-2 border-slate-100 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
              近期總開支
            </h3>
            <div className="text-4xl font-bold text-slate-900 tracking-tighter">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Live from Notion
            </span>
          </div>
        </div>

        <div className="col-span-1 bg-emerald-50 rounded-3xl p-8 flex flex-col justify-center border-2 border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">交易數量</p>
          <p className="text-4xl font-bold text-emerald-900">{items.length}</p>
          <p className="text-[10px] text-emerald-700 mt-2 font-medium">最近同步於 {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">歷史記錄</h3>
          <a
            href={`https://www.notion.so/${config.notionDatabaseId.replace(/-/g, '')}`}
            target="_blank"
            className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Notion 查看 <ExternalLink size={10} />
          </a>
        </div>

        <div className="space-y-5">
          {loading && items.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-slate-100 rounded" />
                  <div className="h-3 w-1/4 bg-slate-50 rounded" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                <Calendar size={32} />
              </div>
              <p className="text-slate-400 text-sm font-medium">這裏還沒有任何記錄</p>
            </div>
          ) : (
            items.map((item, index) => {
              const name = item.properties.Name?.title?.[0]?.plain_text || '無標題';
              const amount = item.properties.Amount?.number || 0;
              const category = item.properties.Category?.select?.name || '未分類';
              const date = item.properties.Date?.date?.start || '';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                      <Tag size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-none mb-1 group-hover:translate-x-1 transition-transform">{name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{category}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="italic">{date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="font-bold text-rose-500 text-lg group-hover:scale-110 transition-transform">
                    {formatCurrency(amount)}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
