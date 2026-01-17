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
import { Badge } from "./ui/badge";
import { Link } from "react-router-dom";



export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [brandMap, setBrandMap] = useState({});

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
  useEffect(() => {
    return onSnapshot(collection(db, "phone_brands"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = d.data().name;
      });
      setBrandMap(map);
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

const ActivityRow = ({ a, detailed = false }) => {
  return (
    <div
      className="
        group relative rounded-2xl border border-border/40
        bg-muted/20 p-4
        hover:bg-muted/40 hover:border-border/60
        transition-all
      "
    >
      <div className="flex gap-4 items-start">
        {/* ICON */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
          <Package className="h-4 w-4" />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 space-y-1.5">
          {/* MODEL / BRAND */}
          <div className="flex flex-wrap items-center gap-2">
    
              <h2 className="text-md font-bold">
                {brandMap[a.brand_id]}
              </h2>


            <div className="flex gap-1 flex-wrap">


            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
              {modelMap[a.model_id] || "Unknown model"}
            </Badge>

            {detailed && a.batch_no && (
              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                 #{a.batch_no}
              </Badge>
            )}
            </div>

          </div>

          {/* META BADGES */}
          <div className="flex flex-wrap gap-1.5">
         

            <Badge variant="outline" className="text-[11px]">
              {typeMap[a.type_id] || "Unknown cover"}
            </Badge>

           
          </div>
        </div>

        {/* QTY + TIME */}
        <div className="text-right shrink-0 space-y-1">
          <div className="flex gap-1">

        <Badge variant="outline" className="px-2 py-0.5 text-xs">
              {shopMap[a.shop_id] || "Unknown shop"}
        </Badge>
        <Badge className="px-2 py-0.5 text-xs">
            Qty {a.qty}
        </Badge>
        </div>

          <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {a.updatedAt?.toDate().toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* UPDATED BY – DIALOG ONLY */}
      {detailed && a.updatedBy && (
        <div className="mt-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
          Updated by{" "}
          <span className="font-medium text-foreground">
            {formatUpdatedBy(a.updatedBy)}
          </span>
        </div>
      )}
    </div>
  );
};




  return (
    <Card className="rounded-[2rem] shadow-none h-full bg-muted/20 max-w-full w-full ">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </CardTitle>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="gap-1">
              View all <ArrowUpRight className="h-4 w-4" />
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-full w-full max-w-full h-dvh rounded-none  overflow-hidden ">
            <DialogHeader>
              <DialogTitle>Story Book</DialogTitle>
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
                      className="md:max-w-full pl-8"
                    />
                </div>
            </div>

            {/* LIST */}
            <ScrollArea className="mt-4   border-0  h-[80%]">
              {filtered.length === 0 && (
                <div className="h-[50%]   w-full flex flex-col items-center justify-center  ">

                <InfoIcon className="text-muted-foreground" size="38"  aria-label="Information" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No activity logs found. 
                </p>
                </div>
              )}
               <div className="mt-4    h-[calc(100vh-100px)] pb-4">
              <div className="space-y-1.5 ">
              {filtered.map((a) => (
                <ActivityRow key={a.id} a={a} detailed={true} />
              ))}
              </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <ScrollArea className="h-72 w-full px-0">

      <CardContent className="space-y-1 pt-2 " >
        
      {activities.length === 0 ? (
            <div className="h-full  w-full flex flex-col items-center justify-center">
              <InfoIcon className="text-muted-foreground" size={38} aria-label="Information" />
              <p className="mt-4 text-sm text-muted-foreground text-center">
                No activity logs found.
              </p>
              <Link to="/stock-entery">
                 <Button variant="link">Create One!</Button>
              </Link>
            </div>
          ) : (
            activities.slice(0, 5).map((a) => <ActivityRow key={a.id} a={a} />)
          )}

        {/* {activities.slice(0, 5).map((a) => (
          <ActivityRow key={a.id} a={a}  />
        ))} */}
      </CardContent>
      </ScrollArea>

    </Card>
  );
}
