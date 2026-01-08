import { useState, useEffect, useRef } from "react";
import { db } from "../utils/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Store, ArrowUpRight, Activity, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const container = useRef(null);
  const [stats, setStats] = useState({
    shopCount: 0,
    inventoryCount: 0, // Placeholder for next steps
  });

  // Real-time listener for Shop Count
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "shops"), (snapshot) => {
      setStats((prev) => ({ ...prev, shopCount: snapshot.size }));
    });
    return () => unsubscribe();
  }, []);

  // Apple-style entrance for cards
  useGSAP(() => {
    gsap.from(".stat-card", {
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "expo.out",
    });
  }, { scope: container });

  return (
    <div ref={container} className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Everything happening across your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* STORES COUNT CARD - DUOTONE STYLE */}
        <Card className="stat-card border-border/50 group relative overflow-hidden shadow-none bg-white dark:bg-zinc-900 rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Stores
            </CardTitle>
            {/* The DuoTone Icon Container */}
            <div className="p-3 rounded-2xl bg-sky-500/10 transition-colors group-hover:bg-sky-500/20">
              <Store className="h-5 w-5 text-sky-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold tabular-nums">
                {stats.shopCount}
              </div>
              <span className="text-xs font-medium text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                Live <Activity className="h-3 w-3 animate-pulse" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 group-hover:text-primary transition-colors cursor-default">
              View all locations <ArrowUpRight className="h-3 w-3" />
            </p>
          </CardContent>
          
          {/* Subtle Background Glow for that Apple look */}
          {/* <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-sky-500/5 rounded-full blur-3xl group-hover:bg-sky-500/10 transition-all duration-700" /> */}
        </Card>

        {/* You can duplicate this pattern for other stats like Inventory or Users */}

      </div>

      <hr className="border-border/40" />
      
      {/* Space for future Charts or Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 h-[400px] rounded-[2rem] bg-muted/20 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
            Analytics Chart Coming Soon
         </div>
         <div className="h-[400px] rounded-[2rem] bg-muted/20 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
            Recent Activity
         </div>
      </div>
    </div>
  );
}