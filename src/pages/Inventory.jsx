"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/firebase";
import { Loader2, Trash2 } from "lucide-react";
import { deleteDoc, writeBatch } from "firebase/firestore";
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

// new: Debounce hook to optimize search input
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE = 30;

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [reorderItem, setReorderItem] = useState(null);

  const [user, setUser] = useState(null);
  const [userShopId, setUserShopId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300); // new: debounce search

  const [tab, setTab] = useState("all");
  const [settings, setSettings] = useState({ low_stock_qty: 5 });

  const [shopMap, setShopMap] = useState({});
  const [modelMap, setModelMap] = useState({});
  const [brandMap, setBrandMap] = useState({});
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

  
  // --- Safer Inventory Loading (No onSnapshot) ---
  useEffect(() => {
    // We only run this if we have a userRole
    if (!userRole) return;

    const loadInitialData = async () => {
      // Reset state for a fresh load/search
      setInventory([]);
      setLastDoc(null);
      setHasMore(true);

      // Call your existing fetchInventory function with reset = true
      await fetchInventory(true);
    };

    loadInitialData();

    // Note: We removed the unsub/onSnapshot entirely to save your 50k reads.
    // The UI updates instantly because updateField handles the local state.
  }, [debouncedSearch, userRole, userShopId]);
  // --- Maps (optimized: fetch once instead of live listener) ---
  useEffect(() => {
    const fetchAllMaps = async () => {
      // 1. Try to load from Cache first to save 100s of reads
      const cached = sessionStorage.getItem("inventory_metadata");
      if (cached) {
        const { shops, models, brands, types, settings } = JSON.parse(cached);
        setShopMap(shops); setModelMap(models); setBrandMap(brands); setTypeMap(types); setSettings(settings);
        return; 
      }
  
      try {
        // 2. If no cache, fetch all in PARALLEL (faster)
        const [sSnap, mSnap, bSnap, tSnap, setSnap] = await Promise.all([
          getDocs(collection(db, "shops")),
          getDocs(collection(db, "phone_models")),
          getDocs(collection(db, "phone_brands")),
          getDocs(collection(db, "phone_cover_types")),
          getDocs(collection(db, "settings"))
        ]);
  
        const maps = {
          shops: Object.fromEntries(sSnap.docs.map(d => [d.id, d.data().shopName])),
          models: Object.fromEntries(mSnap.docs.map(d => [d.id, d.data().name])),
          brands: Object.fromEntries(bSnap.docs.map(d => [d.id, d.data().name])),
          types: Object.fromEntries(tSnap.docs.map(d => [d.id, d.data().name])),
          settings: setSnap.docs.find(d => d.id === "global")?.data() || { low_stock_qty: 5 }
        };
  
        // 3. Set State & Cache it for the rest of the session
        setShopMap(maps.shops); setModelMap(maps.models); 
        setBrandMap(maps.brands); setTypeMap(maps.types); setSettings(maps.settings);
        // sessionStorage.setItem("inventory_metadata", JSON.stringify(maps));
        
      } catch (e) {
        console.error("Failed to fetch metadata", e);
      }
    };
  
    fetchAllMaps();
  }, []);



const updateField = async (id, data) => {
  // Store the original state in case we need to undo
  const originalInventory = [...inventory];
  const currentItem = inventory.find(item => item.id === id);
  if (!currentItem) return;

  // 1. INSTANT UI UPDATE (Optimistic)
  setInventory(prev =>
    prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...data };
        if (data.qty !== undefined) updatedItem.old_qty = item.qty;
        return updatedItem;
      }
      return item;
    })
  );

  // 2. FIRESTORE UPDATE
  try {
    let updater = "Unknown";
    if (user) {
      const rolePrefix = userRole === "admin" ? "Admin" : "Owner";
      const shopSuffix = userShopId ? ` - ${shopMap[userShopId] || userShopId}` : "";
      updater = `${rolePrefix} (${user.email})${shopSuffix}`;
    }

    const invRef = doc(db, "inventory", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: updater,
    };

    if (data.qty !== undefined) updateData.old_qty = currentItem.qty;

    await updateDoc(invRef, updateData);
    // Success! No further action needed because UI is already updated.

  } catch (error) {
    console.error("Update failed:", error);
    
    // 3. ROLLBACK (The Safety Net)
    // If the database fails, put the old data back so the user isn't lied to
    setInventory(originalInventory);
    alert("Failed to sync with server. Please check your connection.");
  }
};
// <--- Ensure this brace is closed!

const deleteStock = async (id) => {
  if (!confirm("Delete this batch permanently?")) return;
  try {
    await deleteDoc(doc(db, "inventory", id));
    setInventory(prev => prev.filter(item => item.id !== id));
  } catch (error) {
    console.error("Delete failed:", error);
  }
};

  // const fetchInventory = async (reset = false) => {
  //   if (!userRole) return;
  
  //   let constraints = [];
  
  //   // 1. Permissions (Always first)
  //   if (userRole === "owner" && userShopId) {
  //     constraints.push(where("shop_id", "==", userShopId));
  //   }
  
  //   // 2. Direct DB Search Logic
  //   if (debouncedSearch.trim()) {
  //     const searchTerms = debouncedSearch.toLowerCase().trim().split(/[\s_/]+/);
  //     const firstWord = searchTerms[0];
    
  //     // Firestore "starts-with" query
  //     constraints.push(where("searchKey", ">=", firstWord));
  //     constraints.push(where("searchKey", "<=", firstWord + "\uf8ff"));
  //     constraints.push(orderBy("searchKey"));
  //   } 
  //   else {
  //     // Default sort by time when not searching
  //     constraints.push(orderBy("updatedAt", "desc"));
  //   }
  
  //   constraints.push(limit(PAGE_SIZE));
    
  //   if (!reset && lastDoc) {
  //     constraints.push(startAfter(lastDoc));
  //   }
  
  //   try {
  //     const q = query(collection(db, "inventory"), ...constraints);
  //     const snap = await getDocs(q);
  
  //     const newData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  //     setInventory(prev => {
  //       if (reset) return newData;
  //       const existingIds = new Set(prev.map(item => item.id));
  //       const filteredNewData = newData.filter(item => !existingIds.has(item.id));
  //       return [...prev, ...filteredNewData];
  //     });
  
  //     setLastDoc(snap.docs[snap.docs.length - 1] || null);
  //     setHasMore(snap.docs.length === PAGE_SIZE);
  //   } catch (error) {
  //     console.error("Firestore Query Error:", error);
  //   }
  // };
  // // old: useEffect reset on every search
  // // new: use debouncedSearch to avoid too many fetches
  // useEffect(() => {
  //   setInventory([]);
  //   setLastDoc(null);
  //   setHasMore(true);
  //   fetchInventory(true);
  // }, [debouncedSearch, userRole, userShopId]);

  // // --- Displayed Inventory (client-side filter) ---
  
  // // d2
  // // const displayed = useMemo(() => {
  // //   const lowQty = settings?.low_stock_qty ?? 5;
  // //   if (!debouncedSearch.trim()) {
  // //     return inventory.filter(i => {
  // //       if (tab === "low") return i.qty < lowQty;
  // //       if (tab === "healthy") return i.qty >= lowQty;
  // //       return true;
  // //     });
  // //   }
  
  // //   // Split search into words (handles "pixel 8a" or "pixel_8a")
  // //   const keywords = debouncedSearch.trim().toLowerCase().split(/[\s_]+/);
  
  // //   return inventory.filter(i => {
  // //     // Clean the DB searchKey by replacing underscores with spaces for comparison
  // //     const dbKey = (i.searchKey || "").toLowerCase().replace(/_/g, " ");
      
  // //     // Check if EVERY keyword from search is inside the DB key
  // //     const matchesSearch = keywords.every(k => dbKey.includes(k));
      
  // //     if (!matchesSearch) return false;
  
  // //     if (tab === "low") return i.qty < lowQty;
  // //     if (tab === "healthy") return i.qty >= lowQty;
  // //     return true;
  // //   });
  // // }, [inventory, debouncedSearch, tab, shopMap, modelMap, brandMap, settings]);
  // // d3
  // // const displayed = useMemo(() => {
  // //   const lowQty = settings?.low_stock_qty ?? 5;
  // //   if (!debouncedSearch.trim()) {
  // //     return inventory.filter(i => {
  // //       if (tab === "low") return i.qty < lowQty;
  // //       if (tab === "healthy") return i.qty >= lowQty;
  // //       return true;
  // //     });
  // //   }
  
  // //   // UPDATED: Added / to the regex split
  // //   const keywords = debouncedSearch.trim().toLowerCase().split(/[\s_/]+/);
  
  // //   return inventory.filter(i => {
  // //     // UPDATED: Clean the dbKey to replace both underscores and slashes with spaces
  // //     // This ensures that "note_11" or "note/11" can both be found
  // //     const dbKey = (i.searchKey || "").toLowerCase().replace(/[/_]/g, " ");
      
  // //     const matchesSearch = keywords.every(k => dbKey.includes(k));
      
  // //     if (!matchesSearch) return false;
  
  // //     if (tab === "low") return i.qty < lowQty;
  // //     if (tab === "healthy") return i.qty >= lowQty;
  // //     return true;
  // //   });
  // // }, [inventory, debouncedSearch, tab, settings]); // Removed unused maps from dependency array

  // // d4
  // const displayed = useMemo(() => {
  //   const lowQty = settings?.low_stock_qty ?? 5;
    
  //   // 1. Filter by Tab (All, Low, or Healthy)
  //   let filtered = inventory.filter(i => {
  //     if (tab === "low") return i.qty < lowQty;
  //     if (tab === "healthy") return i.qty >= lowQty;
  //     return true;
  //   });
  
  //   // 2. If no search, show everything from that tab
  //   if (!search.trim()) return filtered;
  
  //   // 3. Simple Search: Check if the raw searchKey contains your search text
  //   return filtered.filter(i => {
  //     const dbKey = (i.searchKey || "").toLowerCase();
  //     const searchText = search.toLowerCase().trim();
      
  //     return dbKey.includes(searchText);
  //   });
  // }, [inventory, search, tab, settings]);

  const fetchInventory = async (reset = false) => {
    if (!userRole) return;

    let constraints = [];

    if (userRole === "owner" && userShopId) {
      constraints.push(where("shop_id", "==", userShopId));
    }

    // We fetch everything ordered by time to show the newest data as it is in the DB
    constraints.push(orderBy("updatedAt", "desc"));
    constraints.push(limit(PAGE_SIZE));

    if (!reset && lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    try {
      const q = query(collection(db, "inventory"), ...constraints);
      const snap = await getDocs(q);

      const newData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setInventory(prev => {
        if (reset) return newData;
        const existingIds = new Set(prev.map(item => item.id));
        const filteredNewData = newData.filter(item => !existingIds.has(item.id));
        return [...prev, ...filteredNewData];
      });

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Firestore Query Error:", error);
    }
  };

  // Only refetch when the user or shop changes
  useEffect(() => {
    setInventory([]);
    setLastDoc(null);
    setHasMore(true);
    fetchInventory(true);
  }, [userRole, userShopId]);

  // Instant local filter that searches inside the searchKey string
  const displayed = useMemo(() => {
    const lowQty = settings?.low_stock_qty ?? 5;
    
    let filtered = inventory.filter(i => {
      if (tab === "low") return i.qty < lowQty;
      if (tab === "healthy") return i.qty >= lowQty;
      return true;
    });

    if (!search.trim()) return filtered;

    const searchText = search.toLowerCase().trim();

    return filtered.filter(i => {
      // Accesses the raw data field as it exists in your database
      const dbKey = (i.searchKey || "").toLowerCase();
      
      // Matches any part of the string (e.g., "g34" inside "motorola g34/g45...")
      return dbKey.includes(searchText);
    });
  }, [inventory, search, tab, settings]);
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
          loader={<p className="text-center py-4"><Loader2/> Loading more items...</p>}
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
          {displayed.length === 0 ? (
    <p className="text-center py-4 text-muted-foreground">
      {search
        ? `No matching items found for "${search}"`
        : tab === "low"
        ? "No low stock items"
        : tab === "healthy"
        ? "No healthy stock items"
        : "Inventory is empty"}
    </p>
  ) : (

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
                      defaultValue={i.price} // Use defaultValue instead of value
                      onBlur={(e) => {
                        const newPrice = Number(e.target.value);
                        if (newPrice !== i.price) {
                          updateField(i.id, { price: newPrice });
                        }
                      }}
                    />
                    {/* <Input
                      type="number"
                      className="h-8"
                      value={i.price}
                      onChange={(e) => updateField(i.id, { price: Number(e.target.value) })}
                    /> */}

          
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
                            Stock Adjustment
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
                    <div className="flex justify-between ">
                      <span className="font-semibold">{brandMap[i.brand_id] ?? "—"}</span>
                     
                      <span className="text-sm text-muted-foreground">{shopMap[i.shop_id]}</span>
                     
                     
                    </div>
                    <div className="flex justify-between">
                      <div className="flex justify-between flex-col">

                        <span>{modelMap[i.model_id]}</span>
                      <div className="flex gap-1 flex-wrap ">
                        <Badge className="w-fit py-1 h-fit " variant="outline">{typeMap[i.type_id]}</Badge>
                        <Badge className="w-fit py-1 h-fit " variant="outline">{[i.batch_no]}</Badge>
                      </div>
                      


                      </div>
                        <div className="flex-1  items-end justify-end flex">

                      price:
                      <Input
                        type="number"
                        className="ml-1 h-8 w-20"
                        value={i.price}
                        onChange={(e) => updateField(i.id, { price: Number(e.target.value) })}
                      />
                        </div>

                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Qty controls */}
                        <div className="flex items-center gap-2 sm:justify-start">
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

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                          <Badge
                            className={
                              low
                                ? "bg-red-500/10 text-red-600"
                                : "bg-emerald-500/10 text-emerald-600"
                            }
                          >
                            {low ? "Low" : "Healthy"}
                          </Badge>

                          <div className="hidden sm:block h-4 bg-secondary w-px mx-1" />

                          <Button
                            size="icon"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() => setReorderItem(i)}
                          >
                            <PackagePlus className="h-4 w-4" />
                          </Button>

                          <Button
                            size="icon"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
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
           )}
        </InfiniteScroll>
        {reorderItem && (
          <ReorderSheet
            item={reorderItem}
            brandMap={brandMap}
            modelMap={modelMap}
            shopMap={shopMap}
            onUpdate={(id, newData) => {
              setInventory(prev => 
                prev.map(item => item.id === id ? { ...item, ...newData } : item)
              );
            }}
            onClose={() => setReorderItem(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}
