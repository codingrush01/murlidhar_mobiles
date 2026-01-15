"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import { Package, Clock, ArrowUpRight, Search, InfoIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // NEW
import { ScrollArea } from "./ui/scroll-area";

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [modelMap, setModelMap] = useState({});
  const [filter, setFilter] = useState("7d");
  const [search, setSearch] = useState(""); // NEW

    const [types, setTypes] = useState([]); 
    const [typeMap, setTypeMap] = useState({});
  // 🔹 Inventory
  useEffect(() => {
    const q = query(
      collection(db, "inventory"),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      setActivities(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    });
  }, []);

  // type 
    useEffect(() => {
      const q = query(collection(db, "phone_cover_types")); // ✅ CHECK THIS NAME
    
      return onSnapshot(q, (snap) => {
        const map = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          map[d.id] = data.name; // ✅ CHECK FIELD NAME
        });
    
        setTypeMap(map);
      });
    }, []);

  // 🔹 Shops
  useEffect(() => {
    return onSnapshot(collection(db, "shops"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().shopName));
      setShopMap(map);
    });
  }, []);

  // 🔹 Models
  useEffect(() => {
    return onSnapshot(collection(db, "phone_models"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().name));
      setModelMap(map);
    });
  }, []);

  // 🔹 Date + Search filter
  const filtered = useMemo(() => {
    const now = new Date();
    const days =
      filter === "7d" ? 7 : filter === "30d" ? 30 : 365;

    return activities.filter((a) => {
      const date = a.updatedAt?.toDate();
      if (!date) return false;

      const inDateRange = (now - date) / 86400000 <= days;

      const modelName = modelMap[a.model_id]?.toLowerCase() || "";
      const shopName = shopMap[a.shop_id]?.toLowerCase() || "";
      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        modelName.includes(searchText) ||
        shopName.includes(searchText);

      return inDateRange && matchesSearch;
    });
  }, [activities, filter, search, modelMap, shopMap]);
  
  // Utility function to format updatedBy
function formatUpdatedBy(updatedBy) {
  if (!updatedBy) return "";

  // Split by " - " to separate owner info and shop name
  const [ownerPart, shopPart] = updatedBy.split(" - ");

  if (!shopPart) return updatedBy; // fallback

  // Extract text inside parentheses, if exists
  const ownerMatch = ownerPart.match(/\(([^)]+)\)/);
  const owner = ownerMatch ? ownerMatch[1] : ownerPart;

  // Return final formatted string
  return `${shopPart} (Owner: ${owner})`;
}


  const ActivityRow = ({ a }) => (
    <div className="p-3 rounded-xl border border-border/50 bg-muted/30 ">
      <div className="flex flex-container-row  items-start gap-4 ">

      <div className="p-2 rounded-lg bg-blue-500/50 text-blue-200">
        <Package className="h-4 w-4" />
      </div>

      <div className="flex-1 pb-2">
        <p className="text-sm font-medium">Stock updated</p>
        <div className="text-xs text-muted-foreground">
          Model:{" "}
          <span className="font-medium">
            {modelMap[a.model_id] || "Unknown"}
            <br />
          </span>{" "}
          Shop:{" "}
          <span className="font-medium">
            {shopMap[a.shop_id] || "Unknown"}
          </span>
          <br />
          cover:{" "}
          <span className="font-medium">
            {typeMap[a.type_id] || "Unknown"}
          </span>
   
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold">Qty: {a.qty}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
          <Clock className="h-3 w-3" />
          {a.updatedAt?.toDate().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            })}
        </p>
     
      </div>
      </div>

      <p className="border-t pb-0 py-2 text-center border-border/50 text-xs text-muted-foreground flex items-center gap-1 justify-end">{"updated by: "}<strong> {formatUpdatedBy(a.updatedBy)}</strong></p>
      </div>

  );

  return (
    <Card className="rounded-[2rem] shadow-none h-full bg-muted/20 max-w-full w-full ">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </CardTitle>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowUpRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-none sm:max-w-full max-w-full w-full  h-lvh overflow-hidden block ">
            <DialogHeader>
              <DialogTitle>Inventory Activity</DialogTitle>
            </DialogHeader>

            {/* FILTERS */}
            <div className="flex flex-col justify-between w-full  max-w-full  md:flex-row gap-3 mt-6 ">
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className=" bg-transparent">
                  <TabsTrigger value="7d" className=" dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5 border-0">7 Days</TabsTrigger>
                  <TabsTrigger value="30d" className=" dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5 border-0">Month</TabsTrigger>
                  <TabsTrigger value="1y" className=" dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5 border-0">Year</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* 🔍 SEARCH */}
                 <div className="mr-auto flex relative flex-1 w-full">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by model or shop..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="md:max-w-xs pl-8"
                    />
                </div>
            </div>

            {/* LIST */}
            <ScrollArea className="mt-4  border-0  h-[80%]">
              {filtered.length === 0 && (
                <div className="h-[50%]   w-full flex flex-col items-center justify-center">

                <InfoIcon className="text-muted-foreground" size="38"  aria-label="Information" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No activity logs found. 
                </p>
                </div>
              )}
               <ScrollArea className="mt-4    h-[calc(100vh-100px)]">
              <div className="space-y-1.5 ">
              {filtered.map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
              </div>
              </ScrollArea>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <ScrollArea className="h-72 w-full px-0">

      <CardContent className="space-y-1 pt-2 " >
        {activities.slice(0, 5).map((a) => (
          <ActivityRow key={a.id}  a={{
            ...a,
            updatedBy: a.updatedBy ? a.updatedBy.split(" - ")[1] : " ", 
          }} />
        ))}
      </CardContent>
      </ScrollArea>

    </Card>
  );
}
