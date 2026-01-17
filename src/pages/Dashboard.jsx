import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../utils/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { Store, ArrowUpRight, Activity, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InventoryValueChart from "@/components/InventoryValueChart";
import RecentActivity from "@/components/RecentActivity";

export default function Dashboard() {
  const container = useRef(null);

  const [shops, setShops] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [settings, setSettings] = useState({ low_stock_value: 1000 });
  const [totals, setTotals] = useState({ totalQty: 0, totalValue: 0 });
  const [stats, setStats] = useState({ shopCount: 0, inventoryCount: 0 });


  
  // --- Recalculate total inventory stats ---
  useEffect(() => {
    let qty = 0, value = 0;
    inventory.forEach(i => { qty += i.qty; value += i.qty * i.price; });
    setTotals({ totalQty: qty, totalValue: value });
    setStats(prev => ({ ...prev, inventoryCount: inventory.length }));
  }, [inventory]);

  // --- Merge shops listener (shop data + count) ---
  useEffect(() => {
    const unsubShops = onSnapshot(collection(db, "shops"), (snap) => {
      const shopData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setShops(shopData);
      setStats(prev => ({ ...prev, shopCount: snap.size }));
    });

    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    return () => { unsubShops(); unsubInventory(); unsubSettings(); };
  }, []);

  // --- Memoize shop stats for performance ---
  const shopStats = useMemo(() => {
    return shops.map(shop => {
      const shopInventory = inventory.filter(i => i.shop_id === shop.id);
      return {
        ...shop,
        totalQty: shopInventory.reduce((s, i) => s + i.qty, 0),
        totalValue: shopInventory.reduce((s, i) => s + i.qty * i.price, 0),
      };
    });
  }, [shops, inventory]);

  return (
    <div ref={container} className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Overview's</h1>
        <p className="text-muted-foreground">Everything happening across your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Stores Card */}
        <Card className="stat-card border-border/50 group relative overflow-hidden shadow-none bg-white dark:bg-zinc-900 rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Stores
            </CardTitle>
            <div className="p-3 rounded-2xl bg-sky-500/10 transition-colors group-hover:bg-sky-500/20">
              <Store className="h-5 w-5 text-sky-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold tabular-nums">{stats.shopCount}</div>
              <span className="text-xs font-medium text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                Live <Activity className="h-3 w-3 animate-pulse" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 group-hover:text-primary transition-colors cursor-default">
              View all locations <ArrowUpRight className="h-3 w-3" />
            </p>
          </CardContent>
        </Card>

        {/* Shops Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {shopStats.length === 0 ? (
            <p className="col-span-full text-center py-4 text-muted-foreground">No shops available</p>
          ) : (
            shopStats.map(shop => {
              const isLow = shop.totalValue < settings.low_stock_value;
              return (
                <Card key={shop.id} className="stat-card border-border/50 group relative overflow-hidden shadow-none bg-white dark:bg-zinc-900 flex-1 rounded-[2rem]">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{shop.shopName}</CardTitle>
                    <div className={`p-3 rounded-2xl transition-colors ${isLow ? "bg-red-500/10 group-hover:bg-red-500/20" : "bg-emerald-500/10 group-hover:bg-emerald-500/20"}`}>
                      {isLow ? <ArrowDownRight className="h-5 w-5 text-red-500" /> : <ArrowUpRight className="h-5 w-5 text-emerald-500" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold tabular-nums">₹{shop.totalValue.toLocaleString()}</div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${isLow ? "text-red-500 bg-red-500/10" : "text-emerald-600 bg-emerald-500/10"}`}>
                        {isLow ? "Low Stock" : "Healthy"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Total Qty: <span className="font-semibold">{shop.totalQty}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <hr className="border-border/40" />

      {/* Charts / Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[400px] rounded-[2rem] bg-muted/20 flex items-center justify-center text-muted-foreground">
          {inventory.length === 0 ? "No inventory data to display" : <InventoryValueChart />}
        </div>
        <div className="h-[400px] rounded-[2rem] flex items-center justify-center text-muted-foreground">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
