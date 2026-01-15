"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

export default function InventoryValueChart() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const unsubShops = onSnapshot(collection(db, "shops"), (shopSnap) => {
      const shopMap = {};
      shopSnap.forEach((doc) => {
        shopMap[doc.id] = doc.data().shopName;
      });

      const unsubInventory = onSnapshot(collection(db, "inventory"), (invSnap) => {
        const totals = {};

        invSnap.forEach((doc) => {
          const { shop_id, qty, price } = doc.data();
          const value = Number(qty) * Number(price);

          totals[shop_id] = (totals[shop_id] || 0) + value;
        });

        const formatted = Object.entries(totals).map(([shopId, value]) => ({
          shop: shopMap[shopId] || "Unknown",
          value,
        }));

        setChartData(formatted);
      });

      return () => unsubInventory();
    });

    return () => unsubShops();
  }, []);

  return (
    <Card className="w-full rounded-[2rem] shadow-none h-full bg-muted/20 ">
      <CardHeader>
        <CardTitle>Inventory Value by Shop</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} className="hover:bg-transparent ">
            <XAxis dataKey="shop" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => `₹${v}`} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
