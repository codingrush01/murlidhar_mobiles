"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/firebase";
import { Trash2 } from "lucide-react";
import { deleteDoc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Plus,
  Minus,
  Search,
  PackagePlus,
} from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import AdvancedSummaryDialog from "../components/summary-dialog";
import { ReorderSheet } from "@/components/ReorderSheet";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import InfiniteScroll from "react-infinite-scroll-component";

const PAGE_SIZE = 50;

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [reorderItem, setReorderItem] = useState(null);

  const [user, setUser] = useState(null);
  const [userShopId, setUserShopId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [settings, setSettings] = useState({ low_stock_qty: 5 });

  const [shopMap, setShopMap] = useState({});
  const [modelMap, setModelMap] = useState({});
  const [brandMap, setBrandMap] = useState({});
  const [types, setTypes] = useState([]); 
  const [typeMap, setTypeMap] = useState({});

  
  // --- Auth & User Role ---
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setUserShopId(null);
        setUserRole(null);
        return;
      }
      setUser(u);

      const userQuery = query(collection(db, "users"), where("email", "==", u.email));
      const userSnap = await getDocs(userQuery);

      if (userSnap.empty) {
        setUserRole("admin");
        setUserShopId(null);
        return;
      }

      const userDoc = userSnap.docs[0].data();
      const { shopId, role } = userDoc;

      if (role === "admin" || !shopId) {
        setUserRole("admin");
        setUserShopId(null);
      } else {
        setUserRole("owner");
        setUserShopId(shopId);
      }
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    if (!userRole) return;
  
    let constraints = [];
  
    if (userRole === "owner" && userShopId) {
      constraints.push(where("shop_id", "==", userShopId));
    }
  
    constraints.push(orderBy("updatedAt", "desc"));
    constraints.push(limit(PAGE_SIZE));
  
    const q = query(collection(db, "inventory"), ...constraints);
  
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      }));
  
      // 🔥 LIVE UPDATE ONLY FIRST PAGE
      setInventory(prev => {
        const rest = prev.slice(PAGE_SIZE);
        return [...data, ...rest];
      });
  
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
    });
  
    return () => unsub();
  }, [userRole, userShopId]);
  

  // --- Maps ---
  useEffect(() => {
    return onSnapshot(collection(db, "shops"), (snap) => {
      const map = {};
      snap.docs.forEach((d) => (map[d.id] = d.data().shopName));
      setShopMap(map);
    });
  }, []);

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
      snap.docs.forEach((d) => (map[d.id] = d.data().name));
      setBrandMap(map);
    });
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
  }, []);


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

  const updateField = async (id, data) => {
    // ✅ 1. Optimistic UI update
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...data } : item
      )
    );
  
    let updater = "Unknown";
    if (user) {
      if (userRole === "admin") updater = `Admin (${user.email})`;
      else if (userRole === "owner" && userShopId) {
        const shopName = shopMap[userShopId] || userShopId;
        updater = `Owner (${user.email}) - ${shopName}`;
      }
    }
  
    // ✅ 2. Firestore update
    await updateDoc(doc(db, "inventory", id), {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: updater,
    });
  };
  const deleteStock = async (id) => {
    if (!confirm("Delete this batch permanently?")) return;
    await deleteDoc(doc(db, "inventory", id));
  };
  
  
  
  const fetchInventory = async (reset = false) => {
    if (!userRole) return;
  
    let constraints = [];
  
    if (userRole === "owner" && userShopId) {
      constraints.push(where("shop_id", "==", userShopId));
    }

    // ✅ ALWAYS last ordering
    constraints.push(orderBy("updatedAt", "desc"));
    constraints.push(limit(PAGE_SIZE));
  
    if (!reset && lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
  
    const q = query(collection(db, "inventory"), ...constraints);
    const snap = await getDocs(q);
  
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
    setInventory(prev => reset ? data : [...prev, ...data]);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setHasMore(snap.docs.length === PAGE_SIZE);
  };
  
  useEffect(() => {
    setInventory([]);
    setLastDoc(null);
    setHasMore(true);
    fetchInventory(true);
  }, [search, userRole, userShopId]);
  
  const displayed = useMemo(() => {
    const lowQty = settings?.low_stock_qty ?? 5;
  
    // 🔍 Split search into keywords
    const keywords = search.trim().toLowerCase().split(/\s+/);
  
    return inventory.filter((i) => {
      // 🔎 Keyword match (CLIENT SIDE)
      const matchesSearch =
        !keywords.length ||
        keywords.every(k =>
          i.searchKey?.toLowerCase().includes(k)
        );
  
      if (!matchesSearch) return false;
  
      // 📦 Stock tabs
      if (tab === "low") return i.qty < lowQty;
      if (tab === "healthy") return i.qty >= lowQty;
  
      return true;
    });
  }, [inventory, search, tab, shopMap, modelMap, brandMap, settings]);
  
  return (
    <Card className="rounded-[2rem] shadow-none border-none bg-transparent">
      <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
        <div className="flex gap-2 max-w-xl w-full">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search brand, model, store..."
              className="pl-9 shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value.toLowerCase())}
            />
          </div>
          <AdvancedSummaryDialog inventory={inventory} />
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="bg-transparent">
            <TabsTrigger className="border-0 
           dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="all">All</TabsTrigger>
            <TabsTrigger className="border-0 
           dark:data-[state=active]:bg-input/0
            transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5"   value="low">Low Stock</TabsTrigger>
            <TabsTrigger 
            className="border-0 
            dark:data-[state=active]:bg-input/0
             transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="healthy">Healthy</TabsTrigger>
          </TabsList>
        </Tabs>

        <InfiniteScroll
          dataLength={inventory.length}
          next={fetchInventory}
          hasMore={hasMore}
          loader={<p className="text-center py-4">Loading more items...</p>}
          scrollableTarget="scrollableDiv"
        >
          {/* HEADER ROW - Desktop */}
          <div className="hidden lg:grid grid-cols-10 text-xs text-muted-foreground mb-2 gap-2 text-center ">
            <div>Brand</div>
            <div>Model</div>
            <div>cover</div>
            <div>Store</div>
            <div>batch</div>
            <div>Price</div>
            <div className="text-center col-span-2">Qty</div>
            <div className="text-center">Total</div>
            <div className="text-center">More</div>
          </div>

          <div className="space-y-2">
           
          {displayed.map((i) => {
              const total = i.qty * i.price;
              const lowQty = settings?.low_stock_qty ?? 5;
              const low = i.qty < lowQty;

              return (
                <div key={i.id}>
                  {/* Desktop / Tablet */}
                  <div className="hidden lg:grid grid-cols-10 items-center gap-2 border-b border-border/50 p-3 shadow-none text-center relative">
                    <div>{brandMap[i.brand_id] ?? "—"}</div>
                    <div className="font-medium">{modelMap[i.model_id]}</div>
                    {/* cover type */}
                   
                    <div>{typeMap[i.type_id] ?? "—"}</div>

                    <div>{shopMap[i.shop_id]}</div>
                    <Badge variant="secondary" className="py-1.5">
                    Batch {i.batch_no}
                    </Badge>

                    <Input
                      type="number"
                      className="h-8"
                      value={i.price}
                      onChange={(e) => updateField(i.id, { price: Number(e.target.value) })}
                    />

          
    <div className="flex items-center justify-center flex-col lg:flex-row pr-4 gap-[0.5em] md:gap-2  col-span-2">
                <Button
                  size="icon"
                  variant="outline"
                  disabled={i.qty === 0}
                  onClick={() => updateField(i.id, { qty: i.qty - 1 })}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-8 text-center font-bold ">{i.qty}</span>

                <Button
                  size="icon"
                  onClick={() => updateField(i.id, { qty: i.qty + 1 })}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

                        <div className="flex items-center justify-center">
                          <span className="font-semibold tabular-nums">₹{total}</span>
                        </div>

                     {/* Stock status indicator */}
                    <div
                      className={`
                        absolute left-0 top-0 h-full w-[3px]
                        ${low ? "bg-red-500" : "bg-emerald-500"}
                      `}
                    />


                        <div className="text-center">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4  text-primary"  />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="
                            group
                          text-muted-foreground
                          hover:text-primary
                          hover:bg-primary/10
                          focus:text-primary
                          focus:bg-primary/10
                            "
                            onClick={() => setReorderItem(i)}
                          >
                            <PackagePlus className="
                             h-4 w-4 mr-2
                          text-muted-foreground
                          group-hover:text-primary
                          group-focus:text-primary
                            " />
                            Sotck Adjustment batch
                          </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteStock(i.id)}
                          className="
                          group
                          text-muted-foreground
                          hover:text-destructive
                          hover:bg-destructive/10
                          focus:text-destructive
                          focus:bg-destructive/10
                                                "
                          >
                          <Trash2 className=" h-4 w-4 mr-2
                          text-muted-foreground
                          group-hover:text-destructive
                          group-focus:text-destructive" />
                          Delete Batch
                        </DropdownMenuItem>
                         
                        </DropdownMenuContent>
                      </DropdownMenu>
              
                        </div>


                  </div>

                  {/* Mobile / Tablet card */}
                  <div className="lg:hidden border border-border/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">{brandMap[i.brand_id] ?? "—"}</span>
                     
                      <span className="text-sm text-muted-foreground">{shopMap[i.shop_id]}</span>
                     
                     
                    </div>
                    <div className="flex justify-between">
                      <div className="flex gap-1">
                        <span>{modelMap[i.model_id]}</span>
                        <Badge className="w-fit py-1 h-fit " variant="outline">{typeMap[i.type_id]}</Badge>
                        <Badge className="w-fit py-1 h-fit " variant="outline">{[i.batch_no]}</Badge>
                      </div>
                      <div>

                      price:
                      <Input
                        type="number"
                        className="ml-1 h-8 w-20"
                        value={i.price}
                        onChange={(e) => updateField(i.id, { price: Number(e.target.value) })}
                      />
                      </div>

                    </div>
                    <div className="flex justify-between items-center ">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={i.qty === 0}
                          onClick={() => updateField(i.id, { qty: i.qty - 1 })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{i.qty}</span>
                        <Button
                          size="icon"
                          onClick={() => updateField(i.id, { qty: i.qty + 1 })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 ">
                        <Badge
                          className={low ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}
                        >
                          {low ? "Low Stock" : "Healthy"}
                        </Badge>
                        <div className="h-4 bg-secondary w-px mx-1 block" />

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setReorderItem(i)}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteStock(i.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </InfiniteScroll>

        {reorderItem && (
          <ReorderSheet
            item={reorderItem}
            brandMap={brandMap}
            modelMap={modelMap}
            shopMap={shopMap}
            onClose={() => setReorderItem(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
