import { useState, type FormEvent } from 'react';
import { UserConfig } from '../lib/firebase.ts';
import { PlusCircle, Wallet, Tag, Calendar, MessageSquare, Check } from 'lucide-react';
import { cn } from '../lib/utils.ts';
import { motion } from 'motion/react';

interface ExpenseFormProps {
  config: UserConfig;
}

export function ExpenseForm({ config }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('飲食');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ['飲食', '交通', '購物', '娛樂', '醫療', '居住', '其他'];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setLoading(true);
    try {
      const res = await fetch('/api/notion/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.notionApiKey,
          databaseId: config.notionDatabaseId,
          properties: {
            'Name': {
              title: [{ text: { content: description } }]
            },
            'Amount': {
              number: parseFloat(amount)
            },
            'Category': {
              select: { name: category }
            },
            'Date': {
              date: { start: date }
            }
          }
        }),
      });

      if (!res.ok) throw new Error('新增失敗');

      setSuccess(true);
      setAmount('');
      setDescription('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('新增失敗，請檢查資料庫屬性名稱是否包含 Name, Amount, Category, Date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">新增支出</h2>
        <p className="text-slate-500 text-sm">輸入金額與細節，資料將同步至 Notion。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="relative group">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-medium text-slate-300 group-focus-within:text-indigo-500 transition-colors">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-[2rem] border-2 border-slate-100 bg-white px-12 py-8 text-5xl font-bold tracking-tight text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-100 transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                <MessageSquare size={12} />
                項目描述
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-50 bg-white px-5 py-4 text-sm font-medium outline-none focus:border-indigo-500 transition-all shadow-sm"
                placeholder="例如：午餐、捷運、超商..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
                <Calendar size={12} />
                日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-50 bg-white px-5 py-4 text-sm font-medium outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
              <Tag size={12} />
              分類
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm border-2",
                    category === c
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-50 text-slate-500 hover:border-slate-100"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "group relative w-full overflow-hidden rounded-[1.5rem] bg-indigo-600 py-5 font-bold text-white transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-200 mt-4",
            success && "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-200"
          )}
        >
          <div className="flex items-center justify-center gap-2 text-lg">
            {loading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : success ? (
              <>
                <Check size={24} />
                成功新增！
              </>
            ) : (
              <>
                <PlusCircle size={24} className="transition-transform group-hover:rotate-90" />
                同步至 Notion 資料庫
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
}
