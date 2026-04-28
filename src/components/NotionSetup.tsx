import { useState, type FormEvent } from 'react';
import { saveUserConfig, UserConfig } from '../lib/firebase.ts';
import { Settings, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils.ts';

interface NotionSetupProps {
  userId: string;
  onSaved: (config: UserConfig) => void;
  initialConfig?: UserConfig | null;
}

export function NotionSetup({ userId, onSaved, initialConfig }: NotionSetupProps) {
  const [apiKey, setApiKey] = useState(initialConfig?.notionApiKey || '');
  const [dbId, setDbId] = useState(initialConfig?.notionDatabaseId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey || !dbId) {
      setError('請填寫所有欄位');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate with server
      const res = await fetch('/api/notion/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apiKey, databaseId: dbId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '驗證失敗，請檢查 Token 與 ID');

      await saveUserConfig(userId, {
        notionApiKey: apiKey,
        notionDatabaseId: dbId,
      });

      onSaved({
        notionApiKey: apiKey,
        notionDatabaseId: dbId,
        updatedAt: new Date(),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">連接您的 Notion</h2>
        <p className="text-sm text-slate-500">
          設定 Integration Token 與 Database ID 以開啟自動同步功能。
        </p>
      </div>

      <div className="rounded-3xl bg-indigo-50/50 p-6 border-2 border-indigo-100/50">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Info size={20} />
          </div>
          <div className="text-xs text-indigo-950 space-y-3">
            <p className="font-bold text-sm uppercase tracking-wider">設定指南</p>
            <ol className="list-decimal ml-4 space-y-1.5 font-medium leading-relaxed">
              <li>造訪 <a href="https://www.notion.so/my-integrations" target="_blank" className="underline font-bold">Notion Integrations</a> 建立新 Integration。</li>
              <li>複製 <span className="bg-white px-1 rounded border border-indigo-100">Internal Integration Token</span>。</li>
              <li>在 Notion 中建立包含 <span className="font-bold italic">Name, Amount (Number), Category (Select), Date</span> 的資料庫。</li>
              <li>在資料庫右上角「...」 → 「Add connections」加入您的 Integration。</li>
              <li>從資料庫連結中取得 ID（32 位元字串）。</li>
            </ol>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
            Integration Token
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-4 text-sm font-mono transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none shadow-sm"
            placeholder="secret_..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
            Database ID
          </label>
          <input
            type="text"
            value={dbId}
            onChange={(e) => setDbId(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-4 text-sm font-mono transition-all focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none shadow-sm"
            placeholder="32 characters ID"
          />
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-600 border-2 border-rose-100">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-2xl bg-black py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50 shadow-xl",
            loading && "cursor-not-allowed"
          )}
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <>
              <CheckCircle2 size={20} />
              儲存並開始同步
            </>
          )}
        </button>
      </form>
    </div>
  );
}
