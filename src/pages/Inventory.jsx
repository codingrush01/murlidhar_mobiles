// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { db } from "@/utils/firebase";
// import {
//   collection,
//   onSnapshot,
//   doc,
//   updateDoc,
//   serverTimestamp,
// } from "firebase/firestore";

// import {
//   Plus,
//   Minus,
//   Search,
//   Package,
//   BarChart3,
//   PackagePlus,
// } from "lucide-react";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";

// import AdvancedSummaryDialog from "../components/summary-dialog";
// import { ReorderSheet } from "@/components/ReorderSheet";


// export default function InventoryPage() {
//     const [inventory, setInventory] = useState([]);
//     const [reorderItem, setReorderItem] = useState(null);

//     const [search, setSearch] = useState("");
//     const [tab, setTab] = useState("all");
  
//     const [settings, setSettings] = useState({
//         low_stock_qty: 5, // fallback
//       });

//     const [shopMap, setShopMap] = useState({});
//     const [modelMap, setModelMap] = useState({});
//     const [brandMap, setBrandMap] = useState({});

//     useEffect(() => {
//         return onSnapshot(collection(db, "inventory"), (snap) => {
//           setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
//         });
//       }, []);
    
//       useEffect(() => {
//         return onSnapshot(collection(db, "shops"), snap => {
//           const map = {};
//           snap.docs.forEach(d => map[d.id] = d.data().shopName);
//           setShopMap(map);
//         });
//       }, []);
    
//       useEffect(() => {
//         return onSnapshot(collection(db, "phone_models"), snap => {
//           const map = {};
//           snap.docs.forEach(d => map[d.id] = d.data().name);
//           setModelMap(map);
//         });
//       }, []);
    
//       useEffect(() => {
//         return onSnapshot(collection(db, "phone_brands"), snap => {
//           const map = {};
//           snap.docs.forEach(d => map[d.id] = d.data().name);
//           setBrandMap(map);
//         });
//       }, []);

//       useEffect(() => {
//         return onSnapshot(doc(db, "settings", "global"), (snap) => {
//           if (snap.exists()) {
//             setSettings(snap.data());
//           }
//         });
//       }, []);

//       const updateField = async (id, data) => {
//         await updateDoc(doc(db, "inventory", id), {
//           ...data,
//           updatedAt: serverTimestamp(),
//         });
//       };

 
      
//       const filtered = useMemo(() => {
//         const lowQty = settings?.low_stock_qty ?? 5;
      
//         return inventory.filter((i) => {
//           const model = modelMap[i.model_id]?.toLowerCase() || "";
//           const shop = shopMap[i.shop_id]?.toLowerCase() || "";
//           const brand = brandMap[i.brand_id]?.toLowerCase() || "";
      
//           const match =
//             model.includes(search) ||
//             shop.includes(search) ||
//             brand.includes(search);
      
//           const isLow = i.qty < lowQty;
      
//           if (tab === "low") return match && isLow;
//           if (tab === "healthy") return match && !isLow;
//           return match;
//         });
//       }, [inventory, search, tab, shopMap, modelMap, brandMap, settings]);
    
//       return (
//         <Card className="rounded-[2rem] shadow-none">
//           <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
//             <div>
//               <CardTitle className="flex items-center gap-2">
//                 <Package className="h-5 w-5" />
//                 Inventory
//               </CardTitle>
//             </div>
    
//             <div className="flex gap-2  max-w-xl w-full">
    
//               <div className="relative flex-1">
//                 <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   placeholder="Search brand, model, store..."
//                   className="pl-9 shadow-none"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value.toLowerCase())}
//                 />
//               </div>
//               <AdvancedSummaryDialog inventory={inventory} />

//             </div>
//           </CardHeader>
    
//           <CardContent>
//             <Tabs value={tab} onValueChange={setTab} className="mb-4">
//               <TabsList className="bg-transparent">
//                 <TabsTrigger className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="all">All</TabsTrigger>
//                 <TabsTrigger className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="low">Low Stock</TabsTrigger>
//                 <TabsTrigger className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="healthy">Healthy</TabsTrigger>
//               </TabsList>
//             </Tabs>
    
//               {/* HEADER ROW */}
//               <div className="grid grid-cols-8 text-xs text-muted-foreground px-2 mb-2">
//                 <div className="">Brand</div>
//                 <div className="">Model</div>
//                 <div className="">Store</div>
//                 <div className="">Price</div>
//                 <div className=" text-center ">Qty</div>
//                 <div className="col-span-1 text-center ">Total</div>
//                 <div className="text-center ">Status</div>
//                 <div className="text-center ">reorder</div>
//               </div>
      
//               {/* ROWS */}
//               <div className="">
//                 {filtered.map((i) => {
//                   const total = i.qty * i.price;
//                   // const low = i.qty < 5;
//                   const lowQty = settings?.low_stock_qty ?? 5;
//                   const low = i.qty < lowQty;
//                   return (
//                     <div
//                       key={i.id}
//                       className="grid grid-cols-8 items-center gap-2 rounded-none border-b border-border/50 p-3"
//                     >
//                       <div className="">{brandMap[i.brand_id] ?? "—"}
//                       </div>
//                       <div className="font-medium ">{modelMap[i.model_id]}</div>
//                       <div className="">{shopMap[i.shop_id]}</div>
      
            
      
//                       {/* PRICE */}
//                       <Input
//                       // className="bg-red-50"
//                         type="number"
//                         className="h-8 "
//                         value={i.price}
//                         onChange={(e) =>
//                           updateField(i.id, { price: Number(e.target.value) })
//                         }
//                       />
//                       {/* QTY : bg-red-500 */}
//                       <div className="  flex items-center justify-end pr-4 gap-2">
//                         <Button
//                           size="icon"
//                           variant="outline"
//                           disabled={i.qty === 0}
//                           onClick={() => updateField(i.id, { qty: i.qty - 1 })}
//                         >
//                           <Minus className="h-4 w-4" />
//                         </Button>
      
//                         <span className="w-8 text-center font-bold">
//                           {i.qty}
//                         </span>
      
//                         <Button
//                           size="icon"
//                           onClick={() => updateField(i.id, { qty: i.qty + 1 })}
//                         >
//                           <Plus className="h-4 w-4" />
//                         </Button>
//                       </div>
      
//                       {/* TOTAL */}
//                       <div className="col-span-1   flex items-center justify-center gap-2">
//                       <span className="font-semibold tabular-nums">₹{total}</span>

//                       </div>
//                       <div className="text-center">
                        
//                       <Badge
//                       className={
//                         low
//                           ? "bg-red-500/10 text-red-600"
//                           : "bg-emerald-500/10 text-emerald-600"
//                       }
//                     >
//                       {low ? "Low Stock" : "Healthy"}
//                     </Badge>
                    
//                       </div>

// <div className="text-center">

//                     <Button
//                       size="icon"
//                       className=""
//                       variant="outline"
//                       onClick={() => setReorderItem(i)}
//                       >
//                       <PackagePlus className="h-4 w-4" />
//                     </Button>
//                       </div>

//                     </div>
//                   );
//                 })}
//                 {reorderItem && (
//                   <ReorderSheet
//                     item={reorderItem}
//                     brandMap={brandMap}
//                     modelMap={modelMap}
//                     shopMap={shopMap}
//                     onClose={() => setReorderItem(null)}
//                   />
//                 )}
//               </div>
//             </CardContent>
//         </Card>
//       );
//     }
    


"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/utils/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Plus,
  Minus,
  Search,
  Package,
  BarChart3,
  PackagePlus,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import AdvancedSummaryDialog from "../components/summary-dialog";
import { ReorderSheet } from "@/components/ReorderSheet";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { query, where, getDocs } from "firebase/firestore";




export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [reorderItem, setReorderItem] = useState(null);

    const [user, setUser] = useState(null);
const [userShopId, setUserShopId] = useState(null);


    const [search, setSearch] = useState("");
    const [tab, setTab] = useState("all");
  
    const [settings, setSettings] = useState({
        low_stock_qty: 5, // fallback
      });

    const [shopMap, setShopMap] = useState({});
    const [modelMap, setModelMap] = useState({});
    const [brandMap, setBrandMap] = useState({});
    useEffect(() => {
      const auth = getAuth();
    
      const unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) {
          console.log("❌ No user logged in");
          setUser(null);
          setUserShopId(null);
          return;
        }
    
        console.log("✅ Logged in user:", u.email);
        setUser(u);
    
        // find shop by email
        const q = query(
          collection(db, "shops"),
          where("email", "==", u.email)
        );
    
        const snap = await getDocs(q);
    
        if (snap.empty) {
          console.error("❌ No shop found for this email");
          setUserShopId(null);
          return;
        }
    
        const shopDoc = snap.docs[0];
        console.log("🏪 Shop found:", shopDoc.data());
    
        // setUserShopId(shopDoc.data().shop_id);
        setUserShopId(shopDoc.id);
      });
    
      return () => unsub();
    }, []);
    
    

    // useEffect(() => {
    //     return onSnapshot(collection(db, "inventory"), (snap) => {
    //       setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    //     });
    //   }, []);

    // useEffect(() => {
    //   if (!userShopId) return;
    
    //   console.log("📦 Listening inventory for shop:", userShopId);
    
    //   return onSnapshot(
    //     query(
    //       collection(db, "inventory"),
    //       where("shop_id", "==", userShopId)
    //     ),
    //     (snap) => {
    //       setInventory(
    //         snap.docs.map(d => ({ id: d.id, ...d.data() }))
    //       );
    //       console.log(userShopId);
    //     }
    //   );
    // }, [userShopId]);
    

    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
      const auth = getAuth();
    
      const unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) {
          console.log("❌ No user logged in");
          setUser(null);
          setUserShopId(null);
          setUserRole(null);
          return;
        }
    
        console.log("✅ Logged in user:", u.email);
        setUser(u);
    
        // 1️⃣ Check users collection for role & shop
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", u.email)
        );
        const userSnap = await getDocs(userQuery);
    
        if (userSnap.empty) {
          console.error("❌ No user document found, defaulting to admin");
          setUserRole("admin");
          setUserShopId(null);
          return;
        }
    
        const userDoc = userSnap.docs[0].data();
        const { shopId, role } = userDoc;
    
        if (role === "admin" || !shopId) {
          setUserRole("admin");
          setUserShopId(null);
          console.log("👑 Admin detected");
        } else {
          setUserRole("owner");
          setUserShopId(shopId); // Firestore doc ID
          console.log("🏪 Shop owner detected, shop doc ID:", shopId);
        }
      });
    
      return () => unsub();
    }, []);

    useEffect(() => {
      if (!userRole) return;
    
      let inventoryQuery;
      if (userRole === "admin") {
        inventoryQuery = collection(db, "inventory"); // all inventory for admin
      } else if (userRole === "owner" && userShopId) {
        inventoryQuery = query(
          collection(db, "inventory"),
          where("shop_id", "==", userShopId) // use Firestore doc ID
        );
      } else {
        console.warn("⚠️ User has no shop assigned and is not admin");
        setInventory([]);
        return;
      }
    
      const unsub = onSnapshot(inventoryQuery, (snap) => {
        setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    
      return () => unsub();
    }, [userRole, userShopId]);
    
   

    
    
      useEffect(() => {
        return onSnapshot(collection(db, "shops"), snap => {
          const map = {};
          snap.docs.forEach(d => map[d.id] = d.data().shopName);
          setShopMap(map);
        });
      }, []);
    
      useEffect(() => {
        return onSnapshot(collection(db, "phone_models"), snap => {
          const map = {};
          snap.docs.forEach(d => map[d.id] = d.data().name);
          setModelMap(map);
        });
      }, []);
    
      useEffect(() => {
        return onSnapshot(collection(db, "phone_brands"), snap => {
          const map = {};
          snap.docs.forEach(d => map[d.id] = d.data().name);
          setBrandMap(map);
        });
      }, []);

      useEffect(() => {
        return onSnapshot(doc(db, "settings", "global"), (snap) => {
          if (snap.exists()) {
            setSettings(snap.data());
          }
        });
      }, []);

      // const updateField = async (id, data) => {
      //   await updateDoc(doc(db, "inventory", id), {
      //     ...data,
      //     updatedAt: serverTimestamp(),
      //   });
      // };

      const updateField = async (id, data) => {
        let updater = "Unknown";
      
        // if user is set, get role and shop
        if (user) {
          if (userRole === "admin") {
            updater = `Admin (${user.email})`;
          } else if (userRole === "owner" && userShopId) {
            const shopName = shopMap[userShopId] || userShopId;
            updater = `Owner (${user.email}) - ${shopName}`;
          }
        }
      
        await updateDoc(doc(db, "inventory", id), {
          ...data,
          updatedAt: serverTimestamp(),
          updatedBy: updater, // <-- this will store who updated it
        });
      };

 
      
      const filtered = useMemo(() => {
        const lowQty = settings?.low_stock_qty ?? 5;
      
        return inventory.filter((i) => {
          const model = modelMap[i.model_id]?.toLowerCase() || "";
          const shop = shopMap[i.shop_id]?.toLowerCase() || "";
          const brand = brandMap[i.brand_id]?.toLowerCase() || "";
      
          const match =
            model.includes(search) ||
            shop.includes(search) ||
            brand.includes(search);
      
          const isLow = i.qty < lowQty;
      
          if (tab === "low") return match && isLow;
          if (tab === "healthy") return match && !isLow;
          return match;
        });
      }, [inventory, search, tab, shopMap, modelMap, brandMap, settings]);
    
      return (
        <Card className="rounded-[2rem] shadow-none border-none">
          <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">
              Inventory
              </h1>
           
            </div>
              {/* <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory
              </CardTitle> */}
            </div>
    
            <div className="flex gap-2  max-w-xl w-full">
    
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
                <TabsTrigger className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="all">All</TabsTrigger>
                <TabsTrigger className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="low">Low Stock</TabsTrigger>
                <TabsTrigger className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5" value="healthy">Healthy</TabsTrigger>
              </TabsList>
            </Tabs>
    
              {/* HEADER ROW */}
              <div className="grid grid-cols-2
                      sm:grid-cols-4
                      md:grid-cols-8 text-xs text-muted-foreground px-2 mb-2">
                <div className="">Brand</div>
                <div className="">Model</div>
                <div className="">Store</div>
                <div className="">Price</div>
                <div className=" text-center ">Qty</div>
                <div className="col-span-1 text-center ">Total</div>
                <div className="text-center ">Status</div>
                <div className="text-center ">reorder</div>
              </div>
      
              {/* ROWS */}
              <div className="">
                {filtered.map((i) => {
                  const total = i.qty * i.price;
                  // const low = i.qty < 5;
                  const lowQty = settings?.low_stock_qty ?? 5;
                  const low = i.qty < lowQty;
                  return (
                    <div
                      key={i.id}
                      className="grid grid-cols-2
                      sm:grid-cols-4
                      md:grid-cols-8
                      items-center gap-2 rounded-none border-b border-border/50 p-3"
                    >
                      <div className="">{brandMap[i.brand_id] ?? "—"}
                      </div>
                      <div className="font-medium ">{modelMap[i.model_id]}</div>
                      <div className="">{shopMap[i.shop_id]}</div>
      
            
      
                      {/* PRICE */}
                      <Input
                      // className="bg-red-50"
                        type="number"
                        className="h-8 "
                        value={i.price}
                        onChange={(e) =>
                          updateField(i.id, { price: Number(e.target.value) })
                        }
                      />
                      {/* QTY : bg-red-500 */}
                      <div className="  flex items-center justify-end pr-4 gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          disabled={i.qty === 0}
                          onClick={() => updateField(i.id, { qty: i.qty - 1 })}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
      
                        <span className="w-8 text-center font-bold">
                          {i.qty}
                        </span>
      
                        <Button
                          size="icon"
                          onClick={() => updateField(i.id, { qty: i.qty + 1 })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
      
                      {/* TOTAL */}
                      <div className="col-span-1   flex items-center justify-center gap-2">
                      <span className="font-semibold tabular-nums">₹{total}</span>

                      </div>
                      <div className="text-center">
                        
                      <Badge
                      className={
                        low
                          ? "bg-red-500/10 text-red-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }
                    >
                      {low ? "Low Stock" : "Healthy"}
                    </Badge>
                    
                      </div>

<div className="text-center">

                    <Button
                      size="icon"
                      className=""
                      variant="outline"
                      onClick={() => setReorderItem(i)}
                      >
                      <PackagePlus className="h-4 w-4" />
                    </Button>
                      </div>

                    </div>
                  );
                })}
                {reorderItem && (
                  <ReorderSheet
                    item={reorderItem}
                    brandMap={brandMap}
                    modelMap={modelMap}
                    shopMap={shopMap}
                    onClose={() => setReorderItem(null)}
                  />
                )}
              </div>
            </CardContent>
        </Card>
      );
    }
    