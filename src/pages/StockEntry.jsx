"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronsUpDown,
} from "lucide-react";

import { db } from "@/utils/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { where, getDocs } from "firebase/firestore";


export default function StockEntry() {
  const [open, setOpen] = useState(false);

  // DATA
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shops, setShops] = useState([]);
  const [models, setModels] = useState([]);
  const [showModels, setShowModels] = useState(false);

  const [inventory, setInventory] = useState([]);

  // FORM
  const [inputCat, setInputCat] = useState("");
  const [inputBrand, setInputBrand] = useState("");

  const [selectedShop, setSelectedShop] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [selectedCat, setSelectedCat] = useState("");

  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");

  const [existingInventory, setExistingInventory] = useState(null);

  const [userShopId, setUserShopId] = useState(null);
const [isShopUser, setIsShopUser] = useState(false);


useEffect(() => {
  const auth = getAuth();

  const unsub = onAuthStateChanged(auth, async (u) => {
    if (!u) {
      setUserShopId(null);
      setIsShopUser(false);
      return;
    }

    const q = query(
      collection(db, "shops"),
      where("email", "==", u.email)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const shopDoc = snap.docs[0];
      setUserShopId(shopDoc.id);
      setIsShopUser(true);

      // 🔥 auto-select shop for shop users
      setSelectedShop(shopDoc.id);
    } else {
      // admin
      setUserShopId(null);
      setIsShopUser(false);
    }
  });

  return () => unsub();
}, []);


  /* -------------------- DATA SYNC -------------------- */
  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, "phone_cover_types"), orderBy("createdAt", "desc")),
        (s) => setCats(s.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        query(collection(db, "phone_brands"), orderBy("createdAt", "desc")),
        (s) => setBrands(s.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
      // onSnapshot(
      //   query(collection(db, "shops"), orderBy("shopName", "asc")),
      //   (s) => setShops(s.docs.map(d => ({ id: d.id, ...d.data() })))
      // ),

      onSnapshot(
        query(collection(db, "shops"), orderBy("shopName", "asc")),
        (s) => {
          const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      
          if (isShopUser && userShopId) {
            setShops(data.filter(shop => shop.id === userShopId));
          } else {
            setShops(data);
          }
        }
      )

      ,
      onSnapshot(
        query(collection(db, "phone_models"), orderBy("createdAt", "desc")),
        (s) => setModels(s.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(
        collection(db, "inventory"),
        (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() })))
      ),
    ];

    return () => unsubs.forEach(u => u());
  },  [isShopUser, userShopId]);


  /* -------------------- MODEL SUGGESTIONS -------------------- */
  const filteredModels = models.filter(
    m =>
      m.brandId === selectedBrand &&
      m.name.toLowerCase().includes(modelName.toLowerCase())
  );

  /* -------------------- AUTO FETCH INVENTORY -------------------- */
  useEffect(() => {
    if (!selectedShop || !selectedBrand || !modelName || !selectedCat) return;

    const model = models.find(
      m =>
        m.brandId === selectedBrand &&
        m.name.toLowerCase() === modelName.toLowerCase()
    );
    if (!model) return;

    const invId = `${selectedShop}_${model.id}_${selectedCat}`;
    const inv = inventory.find(i => i.id === invId);

    if (inv) {
      setExistingInventory(inv);
      setPrice(inv.price);
      setQty(inv.qty);
    } else {
      setExistingInventory(null);
      setPrice("");
      setQty("");
    }
  }, [selectedShop, selectedBrand, modelName, selectedCat]);

  /* -------------------- ATTR CRUD -------------------- */
  const handleCreateAttr = async (type) => {
    const name = type === "cats" ? inputCat : inputBrand;
    const coll = type === "cats" ? "phone_cover_types" : "phone_brands";
    if (!name.trim()) return;

    await addDoc(collection(db, coll), {
      name: name.trim(),
      normalizedName: name.toLowerCase(),
      createdAt: serverTimestamp(),
    });

    type === "cats" ? setInputCat("") : setInputBrand("");
    toast.success("Created");
  };

  const handleEditAttr = async (coll, id, oldName) => {
    const newName = prompt("Edit name", oldName);
    if (!newName) return;
    await updateDoc(doc(db, coll, id), { name: newName });
  };

  const handleDeleteAttr = async (coll, id) => {
    if (!confirm("Delete this item?")) return;
    await deleteDoc(doc(db, coll, id));
    toast.success("Deleted");
  };

  /* -------------------- SAVE LOGIC -------------------- */
  const handleSaveStock = async () => {
    if (isShopUser && selectedShop !== userShopId) {
      return toast.error("You cannot add inventory for another shop");
    }

    if (!selectedShop || !selectedBrand || !modelName || !selectedCat || !price || !qty) {
      return toast.error("Complete all fields");
    }


    const batch = writeBatch(db);

    let model = models.find(
      m =>
        m.brandId === selectedBrand &&
        m.name.toLowerCase() === modelName.toLowerCase()
    );

    if (!model) {
      const modelRef = doc(collection(db, "phone_models"));
      model = { id: modelRef.id };

      batch.set(modelRef, {
        name: modelName,
        normalizedName: modelName.toLowerCase(),
        brandId: selectedBrand,
        createdAt: serverTimestamp(),
      });
    }

    const inventoryId = `${selectedShop}_${model.id}_${selectedCat}`;
    const invRef = doc(db, "inventory", inventoryId);

    batch.set(
      invRef,
      {
        shop_id: selectedShop,
        brand_id: selectedBrand,
        model_id: model.id,
        type_id: selectedCat,
        price: Number(price),
        qty: Number(qty),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
    toast.success(existingInventory ? "Inventory updated" : "Inventory created");

    setModelName("");
    setPrice("");
    setQty("");
    setSelectedCat("");
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

      <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">
              Stock Entery
              </h1>
           
            </div>
      {/* <Label>Select Shop</Label> */}
      <Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
  <Button variant="default" className="px-4 gap-2 shadow-none  active:scale-95 transition-transform">
  <Plus className="h-5 w-5" />
      Categories
    </Button>
  </DialogTrigger>

  <DialogContent className="sm:max-w-full rounded-none h-full block max-w-[100%] w-full">
    <DialogTitle className=" h-fit">Categories & Brands</DialogTitle>

    <Tabs defaultValue="cats" className="mt-4 w-full md:w-fit">
      <TabsList className="grid grid-cols-2 gap-2 bg-transparent">
        <TabsTrigger value="cats" className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5">Cover Types</TabsTrigger>
        <TabsTrigger value="brands" className="transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50 pt-0.5">Brands</TabsTrigger>
      </TabsList>

      {/* -------- COVER TYPES -------- */}
      <TabsContent value="cats" className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={inputCat}
            onChange={(e) => setInputCat(e.target.value)}
            placeholder="New cover type"
          />
          <Button onClick={() => handleCreateAttr("cats")}>Add</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-3 py-1 border rounded-full"
            >
              <span>{c.name}</span>
              <Pencil
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  handleEditAttr("phone_cover_types", c.id, c.name)
                }
              />
              <Trash2
                className="h-4 w-4 cursor-pointer text-red-500"
                onClick={() =>
                  handleDeleteAttr("phone_cover_types", c.id)
                }
              />
            </div>
          ))}
        </div>
      </TabsContent>

      {/* -------- BRANDS -------- */}
      <TabsContent value="brands" className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={inputBrand}
            onChange={(e) => setInputBrand(e.target.value)}
            placeholder="New brand"
          />
          <Button onClick={() => handleCreateAttr("brands")}>Add</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-2 px-3 py-1 border rounded-full"
            >
              <span>{b.name}</span>
              <Pencil
                className="h-4 w-4 cursor-pointer"
                onClick={() =>
                  handleEditAttr("phone_brands", b.id, b.name)
                }
              />
              <Trash2
                className="h-4 w-4 cursor-pointer text-red-500"
                onClick={() =>
                  handleDeleteAttr("phone_brands", b.id)
                }
              />
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  </DialogContent>
      </Dialog>
      </div>


          <div className="space-y-6 w-full md:w-md mx-auto">

      <div className="flex gap-2 flex-wrap">
        {/* {shops.map(s => (
          <Button
          className="rounded-3xl shadow-none"
            key={s.id}
            variant={selectedShop === s.id ? "default" : "outline"}
            onClick={() => setSelectedShop(s.id)}
          >
            {s.shopName}
          </Button>
        ))} */}
        {shops.map(s => (
  <Button
    key={s.id}
    className="rounded-3xl shadow-none"
    variant={selectedShop === s.id ? "default" : "outline"}
    disabled={isShopUser}
    onClick={() => setSelectedShop(s.id)}
  >
    {s.shopName}
  </Button>
))}

      </div>

      <Combobox  className="max-w-full" options={brands} value={selectedBrand} setValue={setSelectedBrand} placeholder="Brand" />

      <div className="relative">
        <Input
          value={modelName}
          onChange={(e) => {
            setModelName(e.target.value);
            setShowModels(true);
          }}
          onFocus={() => setShowModels(true)}
          placeholder="Model"
        />

        {showModels && modelName && filteredModels.length > 0 && (
          <div className="absolute z-20 mt-1 bg-white border w-full rounded-md shadow">
            {filteredModels.map((m) => (
              <button
                key={m.id}
                className="block w-full px-3 py-2 text-left hover:bg-zinc-100"
                onClick={() => {
                  setModelName(m.name);
                  setShowModels(false); // 🔥 hide after select
                }}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Combobox options={cats} value={selectedCat} setValue={setSelectedCat} placeholder="Cover Type" />

      <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" />
      <Input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Quantity" />

      {existingInventory && (
        <p className="text-xs text-muted-foreground">
          Existing inventory loaded — editing will override
        </p>
      )}

      <Button onClick={handleSaveStock} className="w-full">
        Save Inventory
      </Button>
    </div>
    </div>

    
  );
}

/* -------------------- COMBOBOX -------------------- */
function Combobox({ options, value, setValue, placeholder }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover align="start" open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value ? options.find(o => o.id === value)?.name : placeholder}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {options.map(o => (
                <CommandItem
                  key={o.id}
                  onSelect={() => {
                    setValue(o.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
