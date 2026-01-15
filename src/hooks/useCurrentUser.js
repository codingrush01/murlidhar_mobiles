"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/utils/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubFirestore;

    const unsubAuth = onAuthStateChanged(auth, (authUser) => {
      if (!authUser?.email) {
        setUser(null);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("email", "==", authUser.email)
      );

      unsubFirestore = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setUser({
            id: snap.docs[0].id,
            ...snap.docs[0].data(),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      unsubFirestore && unsubFirestore();
    };
  }, []);

  return { user, loading };
}
