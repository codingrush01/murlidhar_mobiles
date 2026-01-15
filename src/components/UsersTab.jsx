"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";

export default function UsersTab({ shop, currentUser }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [password, setPassword] = useState("");

  /* 🔹 Load users for this shop */
  useEffect(() => {
    if (!shop?.id) return;

    const q = query(
      collection(db, "users"),
      where("shopIds", "array-contains", shop.id)
    );

    return onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [shop?.id]);

  /* 🔹 Create User */
  const createUser = async () => {
    if (!email || !password || !name) return;

    // 1️⃣ Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // 2️⃣ Create Firestore user doc
    await addDoc(collection(db, "users"), {
      name,
      email,
      role,
      shopIds: [shop.id],
      activeShopId: shop.id,
      createdAt: serverTimestamp(),
    });

    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
  };

  /* 🔹 Delete User */
  const deleteUser = async (id) => {
    await deleteDoc(doc(db, "users", id));
  };

  /* 🔹 Update Role */
  const updateRole = async (id, role) => {
    await updateDoc(doc(db, "users", id), { role });
  };

  return (
    <div className="space-y-6">

      {/* ➕ CREATE USER */}
      <div className="border p-4 rounded-xl space-y-3">
        <h3 className="font-medium">Add User</h3>

        <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />

        <Select value={role} onValueChange={setRole}>
          <SelectItem value="staff">Viewer / Staff</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
        </Select>

        <Input
          type="password"
          placeholder="Temporary Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <Button onClick={createUser}>Create User</Button>
      </div>

      {/* 👥 USER LIST */}
      <div className="border rounded-xl divide-y">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>

            <div className="flex gap-2">
              <Select value={u.role} onValueChange={(r) => updateRole(u.id, r)}>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </Select>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteUser(u.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
