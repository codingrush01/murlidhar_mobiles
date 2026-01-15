"use client";

import { useState } from "react";
import { db } from "@/utils/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangleIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ReorderSheet({
  item,
  brandMap,
  modelMap,
  shopMap,
  onClose,
}) {
  const [price, setPrice] = useState(item.price);
  const [addQty, setAddQty] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!addQty || Number(addQty) <= 0) {
      return toast.error("Enter quantity to add");
    }

    try {
      setLoading(true);

      await updateDoc(doc(db, "inventory", item.id), {
        price: Number(price),
        qty: item.qty + Number(addQty),
        updatedAt: serverTimestamp(),
      });

      toast.success("Stock reordered successfully");
      onClose();
    } catch (err) {
      toast.error("Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Reorder Stock</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 px-4">
          {/* READ ONLY INFO */}
          <Info label="Brand" value={brandMap[item.brand_id]} />
          <Info label="Model" value={modelMap[item.model_id]} />
          <Info label="Store" value={shopMap[item.shop_id]} />

          {/* PRICE */}
          <div>
            <label className="text-xs text-muted-foreground">Price</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
            {/* QTY ROW */}
            <div className="grid grid-cols-2 gap-3">
            {/* OLD QTY */}
            <div>
                <label className="text-xs text-muted-foreground">
                Current Qty
                </label>
                <Input
                type="number"
                value={item.qty}
                disabled
                className="bg-muted cursor-not-allowed"
                />
            </div>

            {/* ADD QTY */}
            <div>
                <label className="text-xs text-muted-foreground">
                Add Qty
                </label>
                <Input
                type="number"
                value={addQty}
                onChange={(e) => setAddQty(e.target.value)}
                placeholder="+ Qty"
                />
            </div>
            </div>

            {/* FINAL QTY */}
            <Alert>
            <AlertDescription className="text-xs flex justify-between items-center">
                <span>
                <AlertTriangleIcon fill="yellow" /> Final quantity after reorder
                </span>
                <span className="font-semibold">
                {item.qty} + {Number(addQty) || 0} ={" "}
                <span className="text-primary">
                    {item.qty + (Number(addQty) || 0)}
                </span>
                </span>
            </AlertDescription>
            </Alert>


          {/* SAVE */}
          <Button className="w-full" onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Stock
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value ?? "—"}</p>
    </div>
  );
}
