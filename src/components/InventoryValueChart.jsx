"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// const COLORS = ["#34D399", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];
const COLORS = ["#574964", "#D25353", "#E9B63B", "#696FC7", "#A5B68D"];


export default function InventoryValueChart() {
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState(
    localStorage.getItem("inventoryChartType") || "bar"
  );

  useEffect(() => {
    localStorage.setItem("inventoryChartType", chartType);
  }, [chartType]);

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
          totals[shop_id] = (totals[shop_id] || 0) + Number(qty) * Number(price);
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

  const renderChart = () => {
    if (chartData.length === 0) {
      return <p className="text-muted-foreground text-sm">No inventory data available.</p>;
    }

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="shop" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => `₹${v}`} cursor={{ fill: "rgba(59,130,246,0.1)" }} />
              <Line
                type="monotone"   // smooth line
                dataKey="value"
                stroke={COLORS[4]}
                strokeWidth={3}
                dot={{ r: 4, fill: COLORS[4] }} // visible dots
                activeDot={{ r: 6, stroke:COLORS[4], strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="shop"
                innerRadius={40}
                outerRadius={100}
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} stroke="none" fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `₹${v}`} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "bar":
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="shop" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                fill={COLORS[1]}
                
                background={false} // no white hover
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="w-full rounded-[2rem] shadow-none h-full bg-muted/20">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Inventory Value by Shop</CardTitle>

        {/* ShadCN Select */}
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Chart" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="h-[320px] flex items-center justify-center">
        {renderChart()}
      </CardContent>
    </Card>
  );
}
