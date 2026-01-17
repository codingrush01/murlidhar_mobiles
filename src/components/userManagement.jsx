// "use client";

// import { useEffect, useState } from "react";
// import { db } from "@/utils/firebase";
// import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// import {
//   doc,
//   onSnapshot,
//   addDoc,
//   collection,
//   serverTimestamp,
//   query,
//   where,
//   getDocs,
// } from "firebase/firestore";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { toast } from "sonner";

// const auth = getAuth();

// async function createAuthUser(email, password) {
//   try {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );

//     console.log("Auth user created:", userCredential.user.uid);
//     return userCredential.user;
//   } catch (error) {
//     console.error("Auth error:", error.message);
//     throw error;
//   }
// }

// export default function UserManagement({ shop }) {
//   const auth = getAuth();
//   const authUser = auth.currentUser;

//   const [userDoc, setUserDoc] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [usedEmails, setUsedEmails] = useState([]);
//   const [shops, setShops] = useState([]);
//   const [ownerCount, setOwnerCount] = useState(0);

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     role: "staff",
//     shopId: "",
//   });

//   /* 🔐 Load current user */
//   useEffect(() => {
//     if (!authUser?.uid) return;

//     const ref = doc(db, "users", authUser.uid);
//     return onSnapshot(ref, (snap) => {
//       setUserDoc(snap.exists() ? snap.data() : null);
//       setLoading(false);
//     });
//   }, [authUser?.uid]);

//   /* 🧠 Load used emails from users table */
//   useEffect(() => {
//     if (userDoc?.role !== "admin") return;

//     const q = query(collection(db, "users"));
//     return onSnapshot(q, (snap) => {
//       const emails = snap.docs
//         .map((d) => d.data().email)
//         .filter(Boolean);

//       setUsedEmails(emails);
//     });
//   }, [userDoc?.role]);

//   useEffect(() => {
//     if (userDoc?.role !== "admin") return;
  
//     const q = query(
//       collection(db, "users"),
//       where("role", "==", "owner")
//     );
  
//     return onSnapshot(q, (snap) => {
//       setOwnerCount(snap.size);
//     });
    
//   }, [userDoc?.role]);
//   // if (ownerSnap.size >= 3) {
//   //   toast.error("You have already created 3 shop owners");
//   //   return;
//   // }
  

//   /* 🏪 Load shops (admin only) */
//   useEffect(() => {
//     if (userDoc?.role !== "admin") return;

//     return onSnapshot(collection(db, "shops"), (snap) => {
//       setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
//     });
//   }, [userDoc?.role]);

//   const isAdmin = userDoc?.role === "admin";

//   /* 🧠 Auto-fill email for owner */
//   useEffect(() => {
//     if (form.role !== "owner") return;

//     const selected = shops.find((s) => s.id === form.shopId);
//     if (selected?.email) {
//       setForm((f) => ({ ...f, email: selected.email }));
//     }
//   }, [form.role, form.shopId, shops]);

//   /* ➕ Create user */
//   const createUser = async () => {
//     if (!isAdmin) return;

//     if (!form.name || !form.email || !form.role) {
//       toast.error("Please fill all fields");
//       return;
//     }

//     if (form.role === "owner" && !form.shopId) {
//       toast.error("Select a shop for owner");
//       return;
//     }

//     try {
//       setSaving(true);

//       /* 🔍 Duplicate email check */
//       const emailQuery = query(
//         collection(db, "users"),
//         where("email", "==", form.email)
//       );
//       const emailSnap = await getDocs(emailQuery);

//       if (!emailSnap.empty) {
//         toast.error("User with this email already exists");
//         return;
//       }

//       /* 🔒 Owner limit */
//       if (form.role === "owner") {
//         const ownerQuery = query(
//           collection(db, "users"),
//           where("role", "==", "owner")
//         );
//         const ownerSnap = await getDocs(ownerQuery);

//         if (ownerSnap.size >= 3) {
//           toast.error("You have already created 3 shop owners");
//           return;
//         }
//       }

//       /* 🔒 Staff limit */
//       // if (form.role === "staff") {
//       //   const staffQuery = query(
//       //     collection(db, "users"),
//       //     where("role", "==", "staff"),
//       //     where("shopId", "==", shop?.id)
//       //   );
//       //   const staffSnap = await getDocs(staffQuery);

//       //   if (!staffSnap.empty) {
//       //     toast.error("You have already created 3 shop owners");
//       //     return;
//       //   }
//       // }

//       /* 🔒 Optional: global staff limit */
// if (form.role === "staff") {
//   const staffQuery = query(
//     collection(db, "users"),
//     where("role", "==", "staff")
//   );
//   const staffSnap = await getDocs(staffQuery);

//   if (staffSnap.size >= 10) {
//     toast.error("Maximum staff limit reached");
//     return;
//   }
// }

//       await addDoc(collection(db, "users"), {
//         name: form.name,
//         email: form.email,
//         role: form.role,
//         shopId: form.role === "owner" ? form.shopId : null,

//         // shopId:
//         //   form.role === "owner"
//         //     ? form.shopId
//         //     : form.role === "staff"
//         //     ? shop?.id ?? null
//         //     : null,
//         status: "pending",
//         createdAt: serverTimestamp(),
//       });

//       await createAuthUser(form.email, "123456");

//       toast.success("User created successfully");

//       setForm({
//         name: "",
//         email: "",
//         role: "staff",
//         shopId: "",
//       });
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to create user");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) return <p className="text-sm">Loading user…</p>;

//   /* ✅ FILTER SHOPS WHOSE EMAIL IS ALREADY USED */
//   const availableShops = shops.filter(
//     (s) => s.email && !usedEmails.includes(s.email)
//   );

//   return (
//     <div className="space-y-4">
//       <div className="rounded-xl border p-4 text-sm space-y-1">
//         <p>Email: <strong>{userDoc?.email}</strong></p>
//         <p>Role: <strong>{userDoc?.role}</strong></p>
//       </div>

//       {isAdmin && (
//         <div className="rounded-xl border p-6 space-y-6">
//           <h2 className="text-lg font-semibold">Create User</h2>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <Label>Name</Label>
//               <Input
//                 value={form.name}
//                 onChange={(e) =>
//                   setForm({ ...form, name: e.target.value })
//                 }
//               />
//             </div>

//             <div>
//               <Label>Role</Label>
//               {/* <Select
//                 value={form.role}
//                 onValueChange={(value) =>
//                   setForm({ ...form, role: value, shopId: "" })
//                 }
//               >
//                 <SelectTrigger>
//                   <SelectValue placeholder="Select role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="owner">Owner</SelectItem>
//                   <SelectItem value="staff">Staff</SelectItem>
//                 </SelectContent>
//               </Select> */}
//               <Select
//   value={form.role}
//   onValueChange={(value) =>
//     setForm({ ...form, role: value, shopId: "" })
//   }
// >
//   <SelectTrigger>
//     <SelectValue placeholder="Select role" />
//   </SelectTrigger>

//   <SelectContent>
//     {ownerCount < 3 && (
//       <SelectItem value="owner">Owner</SelectItem>
//     )}

//     <SelectItem value="staff">Staff</SelectItem>
//   </SelectContent>
// </Select>

//             </div>

//             {form.role === "owner" && (
//               <div>
//                 <Label>Shop (Owner)</Label>
//                 <Select
//                   value={form.shopId}
//                   onValueChange={(value) =>
//                     setForm({ ...form, shopId: value })
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select shop email" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {availableShops.length === 0 && (
//                       <div className="px-3 py-2 text-sm text-muted-foreground">
//                         All shop emails are already used
//                       </div>
//                     )}

//                     {availableShops.map((s) => (
//                       <SelectItem key={s.id} value={s.id}>
//                         {s.email}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             <div>
//               <Label>Email</Label>
//               <Input
//                 value={form.email}
//                 disabled={form.role === "owner"}
//                 onChange={(e) =>
//                   setForm({ ...form, email: e.target.value })
//                 }
//               />
//             </div>
//           </div>

//           <div className="flex justify-end">
//             <Button onClick={createUser} disabled={saving}>
//               {saving ? "Creating..." : "Create User"}
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

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
  deleteDoc,
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
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

export default function UserManagement({ shop }) {
  const authUser = auth.currentUser;

  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usedEmails, setUsedEmails] = useState([]);
  const [shops, setShops] = useState([]);
  const [ownerCount, setOwnerCount] = useState(0);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "staff",
    shopId: "",
  });

  /* 🔐 Current user */
  useEffect(() => {
    if (!authUser?.uid) return;

    const ref = doc(db, "users", authUser.uid);
    return onSnapshot(ref, (snap) => {
      setUserDoc(snap.exists() ? snap.data() : null);
      setLoading(false);
    });
  }, [authUser?.uid]);

  const isAdmin = userDoc?.role === "admin";

  /* 👥 All users */
  useEffect(() => {
    if (!isAdmin) return;

    return onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setUsers(list);
      setUsedEmails(list.map((u) => u.email).filter(Boolean));
    });
  }, [isAdmin]);

  /* 👑 Owner count */
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "users"), where("role", "==", "owner"));
    return onSnapshot(q, (snap) => setOwnerCount(snap.size));
  }, [isAdmin]);

  /* 🏪 Shops */
  useEffect(() => {
    if (!isAdmin) return;

    return onSnapshot(collection(db, "shops"), (snap) => {
      setShops(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [isAdmin]);

  /* 🧠 Autofill owner email */
  useEffect(() => {
    if (form.role !== "owner") return;

    const selected = shops.find((s) => s.id === form.shopId);
    if (selected?.email) {
      setForm((f) => ({ ...f, email: selected.email }));
    }
  }, [form.role, form.shopId, shops]);

  /* ➕ Create user */
  const createUser = async () => {
    if (!isAdmin) return;

    if (!form.name || !form.email) {
      toast.error("Fill all fields");
      return;
    }

    if (form.role === "owner" && ownerCount >= 3) {
      toast.error("Max 3 owners allowed");
      return;
    }
    const staffCount = users.filter(u => u.role === "staff").length;

    if (form.role === "staff" && staffCount >= 3) {
      toast.error("Max 3 staff allowed");
      return;
    }

    try {
      setSaving(true);

      const emailCheck = query(
        collection(db, "users"),
        where("email", "==", form.email)
      );
      const emailSnap = await getDocs(emailCheck);
      if (!emailSnap.empty) {
        toast.error("Email already exists");
        return;
      }

      await addDoc(collection(db, "users"), {
        name: form.name,
        email: form.email,
        role: form.role,
        shopId: form.role === "owner" ? form.shopId : null,
        status: "active",
        createdAt: serverTimestamp(),
      });

      await createAuthUser(form.email, "123456");

      toast.success("User created");

      setForm({ name: "", email: "", role: "staff", shopId: "" });
    } catch (e) {
      toast.error("Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  /* ❌ Remove user (Firestore only) */
  const removeUser = async (id) => {
    if (!confirm("Remove this user?")) return;

    await deleteDoc(doc(db, "users", id));
    toast.success("User removed (Auth requires backend)");
  };

  if (loading) return <p>Loading…</p>;

  const availableShops = shops.filter(
    (s) => s.email && !usedEmails.includes(s.email)
  );

  return (
    <div className="space-y-6">
      {/* Current User */}
      <div className="rounded-xl border p-4 text-sm space-y-1">
        <p>Email: <strong>{userDoc?.email}</strong></p>
        <p>Role: <strong>{userDoc?.role}</strong></p>
      </div>

      {/* CREATE USER */}
      {isAdmin && (
        <div className="rounded-xl border p-6 space-y-6">
          <h2 className="text-lg font-semibold">Create User</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v, shopId: "" })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ownerCount < 3 && <SelectItem value="owner">Owner</SelectItem>}
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>

            {form.role === "owner" && (
              <Select
                value={form.shopId}
                onValueChange={(v) => setForm({ ...form, shopId: v })}
              >
                <SelectTrigger><SelectValue placeholder="Shop" /></SelectTrigger>
                <SelectContent>
                  {availableShops.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              placeholder="Email"
              disabled={form.role === "owner"}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <Button onClick={createUser} disabled={saving}>
            {saving ? "Creating..." : "Create User"}
          </Button>
        </div>
      )}

      {/* USERS LIST */}
      {isAdmin && (
        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Users</h2>

          {users.map((u) => (
            <div
              key={u.id}
              className="flex justify-between items-center border-b pb-2 text-sm"
            >
              <div>
                <p><strong>{u.name}</strong></p>
                <p>{u.email} — {u.role}</p>
              </div>

              {u.id !== authUser?.uid && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeUser(u.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
