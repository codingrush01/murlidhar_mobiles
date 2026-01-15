"use client";

import { useEffect, useState } from "react";
import { db } from "@/utils/firebase";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";


const auth = getAuth();

async function createAuthUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("Auth user created:", userCredential.user.uid);
    return userCredential.user;

  } catch (error) {
    console.error("Auth error:", error.message);
    throw error;
  }
}
export default function UserManagement({ shop }) {
  const auth = getAuth();
  const authUser = auth.currentUser;

  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [shops, setShops] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "staff",
    shopId: "",
  });

  /* 🔐 Load current user */
  useEffect(() => {
    if (!authUser?.uid) return;

    const ref = doc(db, "users", authUser.uid);
    return onSnapshot(ref, (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [authUser?.uid]);

  /* 🏪 Load shops (admin only) */
  useEffect(() => {
    if (userDoc?.role !== "admin") return;

    return onSnapshot(collection(db, "shops"), (snap) => {
      setShops(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [userDoc?.role]);

  const isAdmin = userDoc?.role === "admin";

  /* 🧠 Auto-fill email for owner */
  useEffect(() => {
    if (form.role !== "owner") return;

    const selected = shops.find(s => s.id === form.shopId);
    if (selected?.email) {
      setForm(f => ({ ...f, email: selected.email }));
    }
  }, [form.role, form.shopId, shops]);

  /* ➕ Create user (Firestore only) */
  const createUser = async () => {
    if (!isAdmin) return;

    if (!form.name || !form.email || !form.role) {
      toast.error("Please fill all fields");
      return;
    }

    if (form.role === "owner" && !form.shopId) {
      toast.error("Select a shop for owner");
      return;
    }

    try {
      setSaving(true);

      /* 🔍 Check duplicate email */
      const q = query(
        collection(db, "users"),
        where("email", "==", form.email)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        toast.error("User with this email already exists");
        setSaving(false);
        return;
      }

      await addDoc(collection(db, "users"), {
        name: form.name,
        email: form.email,
        role: form.role,
        shopId:
          form.role === "admin"
            ? null
            : form.role === "owner"
            ? form.shopId
            : shop?.id ?? null,
        status: "pending", // ready for auth creation later
        createdAt: serverTimestamp(),
      });

      await createAuthUser(form.email, "123456");


      toast.success("User created (Auth pending)");

      setForm({
        name: "",
        email: "",
        role: "staff",
        shopId: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm">Loading user…</p>;

  return (
    <div className="space-y-4">
      {/* CURRENT USER */}
      <div className="rounded-xl border p-4 text-sm space-y-1">
        <p>Email: <strong>{userDoc?.email}</strong></p>
        <p>Role: <strong>{userDoc?.role}</strong></p>
      </div>

      {/* ADMIN ONLY */}
      {isAdmin && (
        <div className="rounded-xl border p-4 space-y-4">
          <p className="font-medium">Create User</p>

          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>
          <div className="flex gap-2">


          <div>
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) =>
                setForm({ ...form, role: value, shopId: "" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="admin">Admin</SelectItem> */}
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                {/* <SelectItem value="viewer">Viewer</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {form.role === "owner" && (
            <div>
              <Label>Shop (Owner)</Label>
              <Select
                value={form.shopId}
                onValueChange={(value) =>
                  setForm({ ...form, shopId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shop email" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          </div>

          <div>
            <Label>Email</Label>
            <Input
              value={form.email}
              disabled={form.role === "owner"}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          <Button onClick={createUser} disabled={saving}>
            {saving ? "Creating..." : "Create User"}
          </Button>
        </div>
      )}
    </div>
  );
}
