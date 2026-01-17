"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Plus, Pencil, Trash2, Check, ChevronsUpDown, PlusIcon 
} from "lucide-react";
import { db } from "@/utils/firebase";
import {
  collection, addDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch
} from "firebase/firestore";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { where, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce"; 
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
// or implement a small debounce hook



export default function StockEntry() {
  const container = useRef(null);
  const [open, setOpen] = useState(false);
  const [batchNo, setBatchNo] = useState("");
  const [showBatches, setShowBatches] = useState(false);

  // DATA
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shops, setShops] = useState([]);
  const [models, setModels] = useState([]);
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
  const [newQty, setNewQty] = useState("");

  const [existingInventory, setExistingInventory] = useState(null);
  const [userShopId, setUserShopId] = useState(null);
  const [isShopUser, setIsShopUser] = useState(false);

  // BATCH STATE
  const [batchExists, setBatchExists] = useState(false);
  const [existingBatchItem, setExistingBatchItem] = useState(null);

  const debouncedBatchNo = useDebounce(batchNo, 300);
const debouncedModelName = useDebounce(modelName, 300);
  // GSAP animation
  useGSAP(() => {
    gsap.from(container.current.children, {
      y: 30,
      opacity: 0,
      stagger: 0.15,
      duration: 1,
      ease: "expo.out",
    });
  }, []);

  // AUTH + AUTO-SELECT SHOP FOR SHOP USERS
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return setUserShopId(null) || setIsShopUser(false);

      const snap = await getDocs(query(collection(db, "shops"), where("email", "==", u.email)));
      if (!snap.empty) {
        const shopDoc = snap.docs[0];
        setUserShopId(shopDoc.id);
        setIsShopUser(true);
        setSelectedShop(shopDoc.id); // auto-select shop
      } else {
        setUserShopId(null);
        setIsShopUser(false);
      }
    });

    return () => unsub();
  }, []);

  // DATA SYNC
  useEffect(() => {
    const unsubCats = onSnapshot(query(collection(db, "phone_cover_types"), orderBy("createdAt", "desc")), (snap) => setCats(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBrands = onSnapshot(query(collection(db, "phone_brands"), orderBy("createdAt", "desc")), (snap) => setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubShops = onSnapshot(query(collection(db, "shops"), orderBy("shopName", "asc")), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setShops(isShopUser && userShopId ? data.filter(s => s.id === userShopId) : data);
    });
    const unsubModels = onSnapshot(query(collection(db, "phone_models"), orderBy("createdAt", "desc")), (snap) => setModels(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => [unsubCats, unsubBrands, unsubShops, unsubModels, unsubInventory].forEach(u => u());
  }, [isShopUser, userShopId]);

  // FILTERS
  // const filteredModels = models.filter(m => m.brandId === selectedBrand && m.name.toLowerCase().includes(modelName.toLowerCase()));
  // const filteredBatches = inventory.filter(i => {
  //   const model = models.find(m => m.id === i.model_id);
  //   return i.shop_id === selectedShop && i.brand_id === selectedBrand && i.type_id === selectedCat &&
  //     model && model.name.toLowerCase() === modelName.toLowerCase() &&
  //     i.batch_no.toLowerCase().includes(batchNo.toLowerCase());
  // });

  const filteredModels = models.filter(
    m => m.brandId === selectedBrand && m.name.toLowerCase().includes(debouncedModelName.toLowerCase())
  );

  const filteredBatches = inventory.filter(i => {
    const model = models.find(m => m.id === i.model_id);
    return i.shop_id === selectedShop &&
          i.brand_id === selectedBrand &&
          i.type_id === selectedCat &&
          model && model.name.toLowerCase() === debouncedModelName.toLowerCase() &&
          i.batch_no.toLowerCase().includes(debouncedBatchNo.toLowerCase());
  });
    
  // AUTO FETCH EXISTING INVENTORY
  useEffect(() => {
    if (!selectedShop || !selectedBrand || !modelName || !selectedCat) return;

    const model = models.find(m => m.brandId === selectedBrand && m.name.toLowerCase() === modelName.toLowerCase());
    if (!model) return;

    const invId = `${selectedShop}_${model.id}_${selectedCat}`;
    const inv = inventory.find(i => i.id === invId);

    if (inv) {
      setExistingInventory(inv);
      setPrice(inv.price);
      setNewQty("");
    } else {
      setExistingInventory(null);
      setPrice("");
      setQty("");
    }
  }, [selectedShop, selectedBrand, modelName, selectedCat, inventory, models]);

  // BATCH EXIST CHECK
  useEffect(() => {
    if (!batchNo || !selectedShop || !selectedBrand || !modelName || !selectedCat) {
      setBatchExists(false);
      setExistingBatchItem(null);
      setExistingInventory(null);
      setNewQty("");
      return;
    }
    const model = models.find(m => m.brandId === selectedBrand && m.name.toLowerCase() === modelName.toLowerCase());
    if (!model) return;

    const invId = `${selectedShop}_${model.id}_${selectedCat}_${batchNo}`;
    const found = inventory.find(i => i.id === invId);

    if (found) {
      setBatchExists(true);
      setExistingBatchItem(found);
      setExistingInventory(found);
      setPrice(found.price);
      setNewQty("");
    } else {
      setBatchExists(false);
      setExistingBatchItem(null);
      setExistingInventory(null);
      setNewQty("");
    }
  }, [batchNo, selectedShop, selectedBrand, modelName, selectedCat, inventory, models]);

  // ATTR CRUD
  const handleCreateAttr = async (type) => {
    const name = type === "cats" ? inputCat : inputBrand;
    if (!name.trim()) return;
    const coll = type === "cats" ? "phone_cover_types" : "phone_brands";
    await addDoc(collection(db, coll), { name: name.trim(), normalizedName: name.toLowerCase(), createdAt: serverTimestamp() });
    type === "cats" ? setInputCat("") : setInputBrand("");
    toast.success("Created");
  };

  const handleEditAttr = async (coll, id, oldName) => {
    const newName = prompt("Edit name", oldName);
    if (!newName) return;
    await updateDoc(doc(db, coll, id), { name: newName });
  };

  const handleDeleteAttr = async (coll, id) => {
    await deleteDoc(doc(db, coll, id));
    toast.success("Deleted");
  };

  // SAVE INVENTORY
  const handleSaveStock = async () => {
    if (!batchNo.trim()) return toast.error("Batch number required");
    if (isShopUser && selectedShop !== userShopId) return toast.error("Cannot add inventory for another shop");
    if (!selectedShop || !selectedBrand || !modelName || !selectedCat || !price) return toast.error("Complete all fields");

    const batch = writeBatch(db);

    // MODEL
    let model = models.find(m => m.brandId === selectedBrand && m.name.toLowerCase() === modelName.toLowerCase());
    if (!model) {
      const modelRef = doc(collection(db, "phone_models"));
      model = { id: modelRef.id };
      batch.set(modelRef, { name: modelName, normalizedName: modelName.toLowerCase(), brandId: selectedBrand, createdAt: serverTimestamp() });
    }

    const inventoryId = `${selectedShop}_${model.id}_${selectedCat}_${batchNo}`;
    const invRef = doc(db, "inventory", inventoryId);

    const brandName = brands.find(b => b.id === selectedBrand)?.name || "";
    const typeName = cats.find(c => c.id === selectedCat)?.name || "";
    const shopName = shops.find(s => s.id === selectedShop)?.shopName || "";

    const oldQty = existingInventory?.qty || 0;
    const addedQty = Number(newQty || 0);
    let finalQty = existingInventory ? (addedQty <= 0 ? null : oldQty + addedQty) : addedQty || Number(qty);

    if (existingInventory && addedQty <= 0) return toast.error("Enter quantity to add");
    if (existingInventory) toast.info(`Merged ${oldQty} + ${addedQty} = ${finalQty}`);

    batch.set(invRef, {
      batch_no: batchNo,
      shop_id: selectedShop,
      brand_id: selectedBrand,
      model_id: model.id,
      type_id: selectedCat,
      price: Number(price),
      qty: finalQty,
      searchKey: `${brandName} ${modelName} ${typeName} ${shopName}`.toLowerCase().trim(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    await batch.commit();
    toast.success(existingInventory ? "Inventory updated" : "Inventory created");

    // RESET FORM
    setModelName(""); setPrice(""); setQty(""); setNewQty(""); setSelectedCat(""); setExistingInventory(null); setBatchNo("");
  };

  // ---------------- UI ----------------
  return (
    <div ref={container} className="container-gsap p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-tight">Stock Entry</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="px-4 gap-2 shadow-none  active:scale-95 transition-transform">
              <Plus className="h-5 w-5" /> Categories
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-full rounded-none h-full block max-w-[100%] w-full">
            <DialogTitle className=" h-fit">Categories & Brands</DialogTitle>
            <Tabs defaultValue="cats" className="mt-4 w-full">
              <TabsList className="grid grid-cols-2 gap-2 bg-transparent">
                <TabsTrigger value="cats" className="border-0 
            dark:data-[state=active]:bg-input/0
             transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5">Cover Types</TabsTrigger>
                <TabsTrigger value="brands"className="border-0 
            dark:data-[state=active]:bg-input/0
             transition-all data-[state=active]:shadow-none data-[state=active]:text-primary text-primary/50  pt-0.5">Brands</TabsTrigger>
              </TabsList>
              {/* Cats */}
              <TabsContent value="cats" className="space-y-4 ">
                <div className="flex gap-2">
                  <Input value={inputCat} onChange={e => setInputCat(e.target.value)} className="flex-1" placeholder="New cover type" />
                  <Button onClick={() => handleCreateAttr("cats")}><PlusIcon /> Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cats.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-1 border rounded-full">
                      <span>{c.name}</span>
                      <Pencil className="h-4 w-4 cursor-pointer" onClick={() => handleEditAttr("phone_cover_types", c.id, c.name)} />
                      <DeleteConfirm onConfirm={() => handleDeleteAttr("phone_cover_types", c.id)} />
                    </div>
                  ))}
                </div>
              </TabsContent>
              {/* Brands */}
              <TabsContent value="brands" className="space-y-4 ">
                <div className="flex gap-2">
                  <Input value={inputBrand} onChange={e => setInputBrand(e.target.value)} placeholder="New brand" className="flex-1" />
                  <Button onClick={() => handleCreateAttr("brands")}><PlusIcon /> Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brands.map(b => (
                    <div key={b.id} className="flex items-center gap-2 px-3 py-1 border rounded-full">
                      <span>{b.name}</span>
                      <Pencil className="h-4 w-4 cursor-pointer" onClick={() => handleEditAttr("phone_brands", b.id, b.name)} />
                      <DeleteConfirm onConfirm={() => handleDeleteAttr("phone_brands", b.id)} />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* FORM */}
      <div className="space-y-6 w-full md:w-md mx-auto">
        <div className="flex gap-2 flex-wrap">
          {shops.map(s => (
            <Button key={s.id} className="rounded-3xl shadow-none" variant={selectedShop === s.id ? "default" : "outline"} disabled={isShopUser} onClick={() => setSelectedShop(s.id)}>{s.shopName}</Button>
          ))}
        </div>

        <BatchInput batchNo={batchNo} setBatchNo={setBatchNo} showBatches={showBatches} setShowBatches={setShowBatches} filteredBatches={filteredBatches} setExistingInventory={setExistingInventory} setPrice={setPrice} />

        <Combobox options={brands} value={selectedBrand} setValue={setSelectedBrand} placeholder="Brand" />

        <ModelInput modelName={modelName} setModelName={setModelName} filteredModels={filteredModels} setShowModels={() => {}} />

        <Combobox options={cats} value={selectedCat} setValue={setSelectedCat} placeholder="Cover Type" />

        <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" />

        {existingInventory && (
          <div className="space-y-1">
            <Label>Existing Quantity</Label>
            <Input value={existingInventory.qty} disabled className="bg-muted cursor-not-allowed" />
          </div>
        )}

        <div className="space-y-1">
          <Label>{existingInventory ? "Add Quantity" : "Quantity"}</Label>
          <Input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} placeholder={existingInventory ? "Enter additional quantity" : "Quantity"} />
        </div>

        <Button onClick={handleSaveStock} className="w-full">Save Inventory</Button>
      </div>
    </div>
  );
}

/* ------------------- BATCH INPUT ------------------- */
function BatchInput({ batchNo, setBatchNo, showBatches, setShowBatches, filteredBatches, setExistingInventory, setPrice }) {
  return (
    <div className="relative">
      <Input value={batchNo} onChange={e => { setBatchNo(e.target.value); setShowBatches(true); }} onFocus={() => setShowBatches(true)} placeholder="Batch Number" />
      {showBatches && batchNo && filteredBatches.length > 0 && (
        <div className="absolute z-20 mt-1 bg-background border w-full rounded-md shadow max-h-48 overflow-auto">
          {filteredBatches.map(b => (
            <button key={b.id} className="block w-full px-3 py-2 text-left hover:bg-muted/10" onClick={() => { setBatchNo(b.batch_no); setExistingInventory(b); setPrice(b.price); setShowBatches(false); }}>
              {b.batch_no} <span className="ml-2 text-xs text-muted-foreground">(Qty: {b.qty})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------- MODEL INPUT ------------------- */
function ModelInput({ modelName, setModelName, filteredModels }) {
  const [showModels, setShowModels] = useState(false);
  return (
    <div className="relative">
      <Input value={modelName} onChange={e => { setModelName(e.target.value); setShowModels(true); }} onFocus={() => setShowModels(true)} placeholder="Model" />
      {showModels && modelName && filteredModels.length > 0 && (
        <div className="absolute z-20 mt-1 bg-background border w-full rounded-md shadow">
          {filteredModels.map(m => (
            <button key={m.id} className="block w-full px-3 py-2 text-left hover:bg-muted/10" onClick={() => { setModelName(m.name); setShowModels(false); }}>
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------- DELETE CONFIRM ------------------- */
function DeleteConfirm({ onConfirm }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild><Trash2 className="h-4 w-4 cursor-pointer text-red-500" /></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete?</AlertDialogTitle>
          <AlertDialogDescription>This item may exist in inventory. Deleting it will affect all related stock.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive/20 text-destructive hover:bg-destructive/30" onClick={onConfirm}>Delete Anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ------------------- COMBOBOX ------------------- */
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
                <CommandItem key={o.id} onSelect={() => { setValue(o.id); setOpen(false); }}>
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
