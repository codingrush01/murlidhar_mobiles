"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { BarChart3 } from "lucide-react";

export default function AdvancedSummaryDialog({ inventory }) {
  const [shops, setShops] = useState([]);
  const [brandMap, setBrandMap] = useState({});
  const [modelMap, setModelMap] = useState({});
  const [coverTypeMap, setCoverTypeMap] = useState({});
  const [lowStockQty, setLowStockQty] = useState(5);

  /* ------------------ LOAD LOOKUPS ------------------ */

  useEffect(() => {
    return onSnapshot(collection(db, "shops"), (snap) => {
      setShops(
        snap.docs.map((d) => ({
          id: d.id,
          name: d.data().shopName,
        }))
      );
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "phone_brands"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().name));
      setBrandMap(map);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "phone_models"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[d.id] = {
          name: data.name,
          brandId: data.brandId,
        };
      });
      setModelMap(map);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "phone_cover_types"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().name));
      setCoverTypeMap(map);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setLowStockQty(snap.data().low_stock_qty ?? 5);
      }
    });
  }, []);

  /* ------------------ GROUP INVENTORY ------------------ */

  const inventoryByShop = useMemo(() => {
    const grouped = {};
    inventory.forEach((i) => {
      if (!grouped[i.shop_id]) grouped[i.shop_id] = [];
      grouped[i.shop_id].push(i);
    });
    return grouped;
  }, [inventory]);

  /* ------------------ SUMMARY ------------------ */

  const summaryByShop = useMemo(() => {
    const result = {};

    Object.entries(inventoryByShop).forEach(([shopId, items]) => {
      const models = {};

      items.forEach((item) => {
        const modelId = item.model_id;
        const typeId = item.type_id;

        if (!models[modelId]) models[modelId] = {};
        if (!models[modelId][typeId]) {
          models[modelId][typeId] = {
            qty: 0,
            prices: new Set(),
          };
        }

        models[modelId][typeId].qty += item.qty;
        models[modelId][typeId].prices.add(item.price);
      });

      result[shopId] = models;
    });

    return result;
  }, [inventoryByShop]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          <p className="hidden sm:block">Advanced Summary</p>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-full w-full max-w-full h-lvh rounded-none block overflow-hidden">
        <DialogHeader>
          <DialogTitle>Inventory Summary</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={shops[1]?.id} className="mt-6 h-full">
          <TabsList className="bg-transparent">
            {shops.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5">
                {s.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {shops.map((s) => (
            <TabsContent key={s.id} value={s.id}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
                {summaryByShop[s.id] &&
                  Object.entries(summaryByShop[s.id]).map(
                    ([modelId, covers]) => {
                      const model = modelMap[modelId];

                      return (
                        <div
                          key={modelId}
                          className="rounded-lg border p-4 space-y-2 bg-muted/20"
                        >
                          <p className="text-sm text-muted-foreground">
                            {brandMap[model?.brandId] || "—"}
                          </p>

                          <p className="font-medium">
                            {model?.name || "Loading..."}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {Object.entries(covers).map(
                              ([typeId, data]) => {
                                const prices = [...data.prices].sort(
                                  (a, b) => a - b
                                );
                                const priceLabel =
                                  prices.length === 1
                                    ? `₹${prices[0]}`
                                    : `₹${prices[0]}–₹${
                                        prices[prices.length - 1]
                                      }`;

                                return (
                                  <Badge key={typeId} variant="secondary">
                                    {coverTypeMap[typeId]} 
                                    <span>
                                    ({data.qty}) 
                                    </span>
                                    {priceLabel}
                                  </Badge>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
