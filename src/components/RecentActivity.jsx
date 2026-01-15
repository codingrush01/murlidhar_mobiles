"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import { Package, Clock, ArrowUpRight } from "lucide-react";
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

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [shopMap, setShopMap] = useState({});
  const [modelMap, setModelMap] = useState({});
  const [filter, setFilter] = useState("7d");
  const [search, setSearch] = useState(""); // NEW

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

  const ActivityRow = ({ a }) => (
    <div className="flex items-center gap-4 p-3 rounded-xl border bg-muted/30">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Package className="h-4 w-4" />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium">Stock updated</p>
        <p className="text-xs text-muted-foreground">
          Model:{" "}
          <span className="font-medium">
            {modelMap[a.model_id] || "Unknown"}
          </span>{" "}
          • Shop:{" "}
          <span className="font-medium">
            {shopMap[a.shop_id] || "Unknown"}
          </span>
        </p>
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
  );

  return (
    <Card className="rounded-[2rem] shadow-none h-full bg-muted/20">
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

          <DialogContent className="max-w-5xl h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Inventory Activity</DialogTitle>
            </DialogHeader>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-3 mt-2">
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList>
                  <TabsTrigger value="7d">7 Days</TabsTrigger>
                  <TabsTrigger value="30d">Month</TabsTrigger>
                  <TabsTrigger value="1y">Year</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* 🔍 SEARCH */}
              <Input
                placeholder="Search by model or shop..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:max-w-xs"
              />
            </div>

            {/* LIST */}
            <div className="mt-4 space-y-3 overflow-y-auto h-full pr-2">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No activity found.
                </p>
              )}
              {filtered.map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {activities.slice(0, 8).map((a) => (
          <ActivityRow key={a.id} a={a} />
        ))}
      </CardContent>
    </Card>
  );
}
