"use client";

import { useEffect, useState } from "react";
import { db } from "@/utils/firebase";

import { doc, onSnapshot, setDoc, serverTimestamp, getCountFromServer ,collection, getDoc } from "firebase/firestore";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  Settings,
  Moon,
  User,
  Package,
  Database,
  BarChart3,
  Loader2,
  InfoIcon,
} from "lucide-react";
import UserManagement from "./userManagement";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
// { darkMode, setDarkMode 
export default function SettingsDialog({ user, shop , darkMode = false,
  setDarkMode = () => {}  }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  
  const [lowStockQty, setLowStockQty] = useState(5);
  const [lowStockValue, setLowStockValue] = useState(1000);

  // const [darkMode, setDarkMode] = useState(false);
  const AVG_SIZES = {
    inventory: 1900,
    users: 1200,
    orders: 2400,
    settings: 800,
  };

  
  // Firestore index overhead (~35%)
  const INDEX_OVERHEAD = 1.35;
  
  // Free tier limit
  const FREE_TIER_MB = 1024;
  
  const [storage, setStorage] = useState({
    usedMB: 0,
    remainingMB: FREE_TIER_MB,
    loading: true,
  });
  

  const [isShopUser, setIsShopUser] = useState(null); 
  const [userRole, setUserRole] = useState(null); 

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uidOrEmail = user.email || user.uid;
        setIsShopUser(uidOrEmail);

        // console.log("Auth state changed, user:", uidOrEmail);

        // Fetch role from Firestore (example: collection "users", doc = uid)
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserRole(data.role); // assume field is "role": "owner" | "admin"
          // console.log("User role:", data.role);
        } else {
          // console.log("No role info found");
          setUserRole(null);
        }
      } else {
        setIsShopUser(null);
        setUserRole(null);
        // console.log("No user logged in");
      }
    });

    return () => unsubscribe();
  }, []);



  useEffect(() => {
    const calculateStorage = async () => {
      try {
        const inventory = await getCountFromServer(collection(db, "inventory"));
        const users = await getCountFromServer(collection(db, "shops"));
        const orders = await getCountFromServer(collection(db, "orders"));
        const settings = await getCountFromServer(collection(db, "settings"));
  
        const totalBytes =
          inventory.data().count * AVG_SIZES.inventory +
          users.data().count * AVG_SIZES.users +
          orders.data().count * AVG_SIZES.orders +
          settings.data().count * AVG_SIZES.settings;
  
        const estimatedBytes = totalBytes * INDEX_OVERHEAD;
        const usedMB = +(estimatedBytes / 1024 / 1024).toFixed(2);
  
        setStorage({
          usedMB,
          remainingMB: +(FREE_TIER_MB - usedMB).toFixed(2),
          loading: false,
        });
      } catch (err) {
        console.error("Storage calculation failed", err);
      }
    };
  
    if (open) calculateStorage();
  }, [open]);
  

  /* 🔹 Save settings */
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      await setDoc(
        doc(db, "settings", "global"),
        {
          low_stock_qty: Number(lowStockQty),
          low_stock_value: Number(lowStockValue),
          // dark_mode: darkMode,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="px-4 gap-2 shadow-none  active:scale-95 transition-transform">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-full h-full rounded-none block max-w-full w-full">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="user" className="w-full mt-6">
          <TabsList className="grid grid-cols-5 gap-1 bg-transparent">
            <TabsTrigger value="user" className="border-0 
           dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" >
              <User className="h-4 w-4" />
              <p className="sm:block hidden">user</p>
            </TabsTrigger>
            {/* {console.log(isShopUser, userRole)} */}

            {/* Only show inventory tab if user is admin */}
            {userRole === "admin" && (
              <TabsTrigger
                value="inventory"
                className="border-0 
                dark:data-[state=active]:bg-input/0
                 transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" 
              >
                <Package className="h-4 w-4" />
                <p className="sm:block hidden">Inventory</p>
              </TabsTrigger>
            )}
            <TabsTrigger value="appearance" className="border-0 
           dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" >
              <Moon className="h-4 w-4" />
              <p className="sm:block hidden">Appearance</p>
            </TabsTrigger>
            <TabsTrigger value="storage" className="border-0 
           dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" >
              <Database className="h-4 w-4"  />
              <p className="sm:block hidden">Storage</p>
            </TabsTrigger>
            <TabsTrigger value="about" className="border-0 
           dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" >
              <InfoIcon className="h-4 w-4"  />
              <p className="sm:block hidden">Information</p>
            </TabsTrigger>
          
          </TabsList>

          <ScrollArea className=" h-[calc(100vh-200px)]">

          {/* 👤 USER */}
          <TabsContent value="user" className="space-y-4">
            <div className="rounded-xl border p-4 text-sm space-y-1">
              <UserManagement  shop={shop} />
            </div>
          </TabsContent>

          {/* 📦 INVENTORY */}
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Label>Low Stock Quantity</Label>
                <p className="text-xs text-muted-foreground">
                  Qty below this is marked low
                </p>
              </div>
              <Input
                type="number"
                className="w-24"
                value={lowStockQty}
                onChange={(e) => setLowStockQty(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Label>Low Stock Value (₹)</Label>
                <p className="text-xs text-muted-foreground">
                  Total value below this is marked low
                </p>
              </div>
              <Input
                type="number"
                className="w-28"
                value={lowStockValue}
                onChange={(e) => setLowStockValue(e.target.value)}
              />
            </div>
          </TabsContent>

          {/* 🎨 APPEARANCE */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <Label>Dark Mode</Label>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </TabsContent>


            <TabsContent value="storage" className="space-y-3">
              <div className="rounded-xl border p-4 text-sm space-y-4">
                <p className="font-medium">Storage Usage</p>
                <Separator />

                {storage.loading ? (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating usage…
                  </p>
                ) : (
                  <div className="space-y-4">
              {(() => {
                const total = storage.usedMB + storage.remainingMB;
                const usedPercentage = total > 0 ? Math.round((storage.usedMB / total) * 100) : 0;
                const availablePercentage = 100 - usedPercentage;

                return (
                  <>
                    {/* Progress Bar Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{usedPercentage}% Used</span>
                        <span className="text-muted-foreground">{availablePercentage}% Available</span>
                      </div>
                      <Progress
                        value={usedPercentage} 
                        className="h-2" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-tight">Used %</p>
                        <p className="text-lg font-bold">{usedPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-tight">Available %</p>
                        <p className="text-lg font-bold">{availablePercentage}%</p>
                      </div>
                    </div>

                    {/* <p className="text-[10px] italic text-muted-foreground border-t pt-2">
                      Calculated based on a total capacity of {total} MB
                    </p> */}
                  </>
                );
              })()}
            </div>
    )}
  </div>
          </TabsContent>
            <TabsContent value="about" className="space-y-3">
              <div className="rounded-xl border p-4 text-sm space-y-4">
              <h3 className="text-base font-semibold">Batch</h3>

              <p className="text-muted-foreground">
                Batch Number format:
                <br />
                <span className="font-medium text-foreground">
                  B{`(batch)`} S{`(shop)`} N{`(Number)`} – [date-001]
                </span>
              </p>

              <p className="text-xs text-muted-foreground">
              Example:{" "}
              <span className="font-medium">
                BS1-[{new Date().toISOString().slice(0, 10)}-001]
              </span>
            </p>

              </div>
          </TabsContent>
          </ScrollArea>

        </Tabs>

      
          {userRole === "admin" &&  (
          <Button
            onClick={saveSettings}
            className="w-full mt-4 gap-2"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}