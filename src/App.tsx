/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getUserConfig, UserConfig, logout, signInWithGoogle } from './lib/firebase.ts';
import { NotionSetup } from './components/NotionSetup.tsx';
import { ExpenseForm } from './components/ExpenseForm.tsx';
import { ExpenseList } from './components/ExpenseList.tsx';
import { LogIn, LogOut, Wallet, Settings, ListPlus, PieChart as PieChartIcon, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'settings'>('add');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const config = await getUserConfig(u.uid);
        setUserConfig(config);
      } else {
        setUserConfig(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleConfigSaved = (config: UserConfig) => {
    setUserConfig(config);
    setActiveTab('add');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-50">
            <Wallet size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Notion 記帳助手</h1>
            <p className="text-zinc-500">將您的開支無縫同步至 Notion，跨智慧裝置隨時追蹤。</p>
          </div>
          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 px-6 py-3.5 font-semibold text-zinc-50 transition-all hover:bg-zinc-800 active:scale-95"
          >
            <LogIn size={20} />
            使用 Google 帳戶登入
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 p-4 md:px-8 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white font-bold text-xl">
            N
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Notion Ledger</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Syncing with Notion</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 pr-3 rounded-full border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} alt="Avatar" />
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold leading-tight">{user.displayName}</p>
            <p className="text-[10px] text-slate-400 leading-tight">Google Connected</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl pb-32 pt-6 px-4 md:px-8">
        <AnimatePresence mode="wait">
          {!userConfig ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto"
            >
              <NotionSetup userId={user.uid} onSaved={handleConfigSaved} />
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 space-y-4">
                <NavCard 
                  active={activeTab === 'add'} 
                  onClick={() => setActiveTab('add')}
                  icon={<ListPlus size={24} />}
                  label="新增支出"
                  description="快速記帳"
                  color="bg-indigo-600"
                />
                <NavCard 
                  active={activeTab === 'list'} 
                  onClick={() => setActiveTab('list')}
                  icon={<PieChartIcon size={24} />}
                  label="明細查看"
                  description="最近記錄"
                  color="bg-emerald-600"
                />
                <NavCard 
                  active={activeTab === 'settings'} 
                  onClick={() => setActiveTab('settings')}
                  icon={<SettingsIcon size={24} />}
                  label="系統設定"
                  description="Notion 連接"
                  color="bg-slate-900"
                />
              </div>

              <div className="md:col-span-3">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === 'add' && (
                    <ExpenseForm config={userConfig} />
                  )}
                  {activeTab === 'list' && (
                    <ExpenseList config={userConfig} />
                  )}
                  {activeTab === 'settings' && (
                    <NotionSetup
                      userId={user.uid}
                      onSaved={handleConfigSaved}
                      initialConfig={userConfig}
                    />
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation - preserved but hidden on desktop */}
      {userConfig && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-slate-100 bg-white/90 p-2 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-around gap-2">
            <NavButton
              active={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
              icon={<ListPlus size={20} />}
              label="明細"
            />
            <NavButton
              active={activeTab === 'add'}
              onClick={() => setActiveTab('add')}
              icon={<div className="rounded-full bg-black p-3 text-white shadow-lg -mt-8 border-4 border-white"><ListPlus size={24} /></div>}
              label="記帳"
              isMain
            />
            <NavButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<SettingsIcon size={20} />}
              label="設定"
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function NavCard({ 
  active, 
  onClick, 
  icon, 
  label, 
  description,
  color 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: ReactNode; 
  label: string;
  description: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-5 rounded-3xl border-2 transition-all group flex flex-col gap-4",
        active 
          ? cn(color, "text-white border-transparent shadow-lg scale-[1.02]") 
          : "bg-white text-slate-900 border-slate-100 hover:border-slate-300 shadow-sm"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
        active ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
      )}>
        {icon}
      </div>
      <div>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5")}>{description}</p>
        <h3 className="text-lg font-bold">{label}</h3>
      </div>
    </button>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  isMain = false
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  isMain?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors relative h-12 w-16 justify-center",
        active ? "text-zinc-900" : "text-zinc-400",
        isMain && "h-16"
      )}
    >
      {icon}
      <span className={cn("text-[10px] font-medium", isMain && "mt-1")}>{label}</span>
      {active && !isMain && (
        <motion.div
          layoutId="tab"
          className="absolute -top-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-zinc-900"
        />
      )}
    </button>
  );
}

