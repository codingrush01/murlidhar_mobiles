import { useState, useRef, useEffect } from "react";
import { db } from "../utils/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Plus, Trash2, Store, MapPin, Phone, Mail, Loader2, StoreIcon, Pencil, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Add AlertDialog components from shadcn
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ShopCreation() {
  const container = useRef(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // New state
  const [shopToDelete, setShopToDelete] = useState(null); // Tracks which shop to delete
  const [editingId, setEditingId] = useState(null);
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    number: "",
    email: ""
  });

  useEffect(() => {
    const q = query(collection(db, "shops"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shopData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShops(shopData);
    });
    return () => unsubscribe();
  }, []);

  useGSAP(() => {
    if (shops.length > 0) {
      gsap.from(".shop-card", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "expo.out"
      });
    }
  }, { dependencies: [shops], scope: container });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "shops", editingId), formData);
        toast.success("Shop updated successfully");
      } else {
        await addDoc(collection(db, "shops"), {
          ...formData,
          createdAt: new Date()
        });
        toast.success("Shop added successfully!");
      }
      resetForm();
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ shopName: "", address: "", number: "", email: "" });
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (shop) => {
    setFormData({
      shopName: shop.shopName,
      address: shop.address,
      number: shop.number,
      email: shop.email
    });
    setEditingId(shop.id);
    setOpen(true);
  };

  // Function called after user clicks "Confirm Delete" in the AlertDialog
  const confirmDelete = async () => {
    if (!shopToDelete) return;
    try {
      await deleteDoc(doc(db, "shops", shopToDelete.id));
      toast.success(`${shopToDelete.shopName} deleted`);
      setShopToDelete(null);
    } catch (error) {
      toast.error("Could not delete shop");
    }
  };

  return (
    <div ref={container} className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Shops</h1>
          <p className="text-muted-foreground">Manage your physical retail locations.</p>
        </div>

        <Dialog open={open} onOpenChange={(val) => { if(!val) resetForm(); setOpen(val); }}>
          <DialogTrigger asChild>
            <Button variant="default" className="px-4 gap-2 shadow-none  active:scale-95 transition-transform">
              <Plus className="h-5 w-5" />
              Add New Shop
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] border-none shadow-2xl backdrop-blur-xl bg-background/90">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingId ? "Edit Shop" : "Register Shop"}</DialogTitle>
              <DialogDescription>Update outlet details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input id="name" required value={formData.shopName} onChange={(e) => setFormData({...formData, shopName: e.target.value})} className="bg-background/50 shadow-none" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-background/50 shadow-none" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" required value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="bg-background/50 shadow-none" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Shop Email</Label>
                <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-background/50 shadow-none" />
              </div>
              <Button disabled={loading} className="w-full h-11 rounded-xl shadow-none">
                {loading ? <Loader2 className="animate-spin mr-2" /> : (editingId ? "Update Shop" : "Save Shop")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <hr className="border-border/50" />

      {/* Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-none shadow-2xl">
          <AlertDialogHeader className="">
            <div className="flex gap-2 flex-row  items-center text-left">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
            <AlertDialogTitle className="text-xl">Are you sure?</AlertDialogTitle>
            You are about to delete <span className="font-bold text-foreground">"{shopToDelete?.shopName}"</span>.
            </div>
            </div>
            
          <hr />

            <AlertDialogDescription className="text-base">
             
              This action <span className="text-destructive font-medium uppercase">cannot be undone</span> and will affect all related categories and inventory items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center w-full gap-3 mt-4">
            <AlertDialogCancel 
            className="transition-all bg-ghost border-0 active:scale-95 flex-1 shadow-none"
            >
                Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="transition-all bg-destructive hover:bg-destructive flex-1 hover:text-destructive-foreground active:scale-95"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shop List Grid */}
      {shops.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center opacity-30">
           <StoreIcon className="h-10 w-10 mb-2" />
           <p>No shops found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Card key={shop.id} className="shop-card group border-border/40 hover:border-primary/40 transition-all shadow-none bg-card/30 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary/20 transition-colors">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-500/10 hover:text-blue-500" onClick={() => handleEdit(shop)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" 
                      onClick={() => {
                        setShopToDelete(shop);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl font-semibold tracking-tight">{shop.shopName}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3 text-muted-foreground/90 pb-6">
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 opacity-50" /> {shop.address}</div>
                <div className="flex items-center gap-3"><Phone className="h-4 w-4 opacity-50" /> {shop.number}</div>
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 opacity-50" /> {shop.email}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}