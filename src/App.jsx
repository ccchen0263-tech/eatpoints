import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, Store, CreditCard, History, Search, CheckCircle, Loader2 } from 'lucide-react';

// --- 連線設定：這是你的保險箱鑰匙 ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lijnwvpwdmzyckwvivjg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '[請在 Vercel 設定你的 ANON KEY]';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function EatPointsApp() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [phone, setPhone] = useState('');
  const [userData, setUserData] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [coupons, setCoupons] = useState([]);

  // 動作：查詢會員
  const fetchUser = async (targetPhone) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', targetPhone)
      .single();

    if (data) {
      setUserData(data);
    } else {
      // 如果找不到人，我們就現場幫他辦一張卡！
      const { data: newUser } = await supabase
        .from('users')
        .insert([{ phone: targetPhone, points: 0 }])
        .select()
        .single();
      setUserData(newUser);
    }
    setLoading(false);
  };

  // 動作：幫客人累點
  const handleAddPoints = async () => {
    if (!userData || !amount) return;
    setLoading(true);
    const earnedPoints = Math.floor(parseInt(amount) / 10);
    const newTotal = userData.points + earnedPoints;

    const { error } = await supabase
      .from('users')
      .update({ points: newTotal })
      .eq('id', userData.id);

    if (!error) {
      setUserData({ ...userData, points: newTotal });
      setShowToast(true);
      setAmount('');
      setTimeout(() => setShowToast(false), 3000);
    }
    setLoading(false);
  };

  // 動作：兌換優惠
  const handleRedeemCoupon = async (couponId, cost) => {
    if (!userData || userData.points < cost) {
      alert('點數不足');
      return;
    }
    setLoading(true);
    const newTotal = userData.points - cost;

    const { error } = await supabase
      .from('users')
      .update({ points: newTotal })
      .eq('id', userData.id);

    if (!error) {
      setUserData({ ...userData, points: newTotal });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCoupons = async () => {
      const { data } = await supabase.from('coupons').select('*');
      if (data) setCoupons(data);
    };
    fetchCoupons();
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 pb-10">
      {/* 頂部切換 */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center">
        <div className="text-xl font-bold text-orange-600">食點通 EatPoints</div>
        <button
          onClick={() => setIsAdmin(!isAdmin)}
          className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2"
        >
          {isAdmin ? <Store size={16} /> : <User size={16} />}
          切換至 {isAdmin ? '顧客模式' : '店員模式'}
        </button>
      </div>

      <div className="max-w-md mx-auto p-6">
        {isAdmin ? (
          /* 店員模式 */
          <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-orange-100 space-y-4">
            <div className="text-lg font-bold">店員累點系統</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="輸入手機號碼"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 p-3 bg-stone-100 rounded-xl outline-none border focus:border-orange-400"
              />
              <button
                onClick={() => fetchUser(phone)}
                className="bg-stone-800 text-white px-4 rounded-xl font-bold"
              >
                搜尋
              </button>
            </div>
            {userData && (
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                <div className="text-sm">會員手機：{userData.phone}</div>
                <div className="text-xl font-bold">現有點數：{userData.points} pt</div>
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="text-center text-sm text-stone-500 mb-1">輸入消費金額</div>
                  <div className="text-4xl font-mono font-bold text-center text-orange-600 mb-4">
                    ${amount || '0'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAmount((prev) => prev + n)}
                        className="h-12 bg-white rounded-lg font-bold shadow-sm"
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setAmount('')}
                      className="col-span-3 bg-red-50 text-red-500 rounded-lg font-bold"
                    >
                      清除
                    </button>
                  </div>
                  <button
                    onClick={handleAddPoints}
                    disabled={loading}
                    className="w-full mt-4 bg-orange-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2"
                  >
                    {loading && <Loader2 className="animate-spin" size={20} />}
                    確認累點
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 顧客模式 */
          <div className="space-y-6 text-center">
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-8 rounded-[2rem] text-white shadow-xl">
              <div className="opacity-80 text-sm mb-4">測試模式：請輸入手機查詢您的點數</div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="輸入手機號碼"
                className="w-full p-2 mb-4 text-stone-800 rounded-lg text-center"
              />
              <button
                onClick={() => fetchUser(phone)}
                className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold"
              >
                查詢/登入
              </button>
              {userData && (
                <div className="mt-8">
                  <div className="text-5xl font-black">
                    {userData.points.toLocaleString()}
                  </div>
                  <div className="text-xl">pt</div>
                  <div className="mt-6 bg-white p-4 rounded-2xl inline-block shadow-inner">
                    <div className="w-32 h-32 bg-stone-800 rounded-lg flex items-center justify-center text-[10px] text-white">
                      [{userData.phone} QR]
                    </div>
                  </div>
                </div>
              )}
            </div>
            {userData && (
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <div className="font-bold mb-4 text-stone-600">熱門兌換</div>
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl mb-2">
                    <div>
                      <div className="font-bold text-stone-800">{coupon.title}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-orange-600 font-medium">{coupon.points_cost} 點</span>
                      <button
                        onClick={() => handleRedeemCoupon(coupon.id, coupon.points_cost)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
                      >
                        立即兌換
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 成功彈窗 */}
      {showToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3">
          <CheckCircle size={20} />
          數據已成功存入雲端保險箱！
        </div>
      )}
    </div>
  );
}
