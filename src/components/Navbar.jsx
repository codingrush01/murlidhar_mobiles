// import { useRef } from "react";
// import { Link, useLocation } from "react-router-dom"; // 1. Added useLocation
// import { auth } from "../utils/firebase"; 
// import { signOut } from "firebase/auth";
// import { toast } from "sonner";
// import gsap from "gsap";
// import { useGSAP } from "@gsap/react";
// import { LogOut, Package2, LayoutDashboard, Box, StoreIcon, Package2Icon, Warehouse, LayoutPanelTop, FeatherIcon } from "lucide-react";
// import { Button } from "./ui/button";

// export default function Navbar({ user }) {
//   const navRef = useRef(null);
//   const location = useLocation(); // 2. Track current path

//   useGSAP(() => {
//     gsap.from(navRef.current, {
//       y: -0,
//       opacity: 1,
//       duration: 1.2,
//       ease: "expo.out",
//     });
//   }, { scope: navRef });

//   const handleLogout = async () => {
//     try {
//       await signOut(auth);
//       toast.info("Logged out successfully");
//     } catch (error) {
//       toast.error("Error logging out");
//     }
//   };

//   // 3. Helper to check if link is active
//   const isActive = (path) => location.pathname === path;

//   // 4. Shared style for Nav Links
//   const navItemStyles = (path) => `
//     flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out
//     transition-all active:scale-90
//     ${isActive(path) 
//       ? " text-primary bg-muted/10" 
//       : "text-muted-foreground  hover:text-foreground hover:bg-muted/50"}
//   `;

//   return (
//     <header 
//       ref={navRef}
//       className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
//     >
//       <div className=" flex h-[80px]  items-center justify-between px-8 mx-auto">
//         {/* Logo */}
//         <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
//             {/* MarutiMobiles */}
//             <Link to="/dashboard">
//           <div className="flex gap-1  text-green-500 rounded-lg shadow-primary/20">
//            મુરલીધર <FeatherIcon />
//           </div>
//             </Link>
//         </div>

//         {/* Navigation Links */}
//         <nav className=" flex items-center gap-2 p-1 rounded-full ">
//           <Link to="/dashboard" className={navItemStyles("/dashboard")}>
//             <LayoutPanelTop  className={`h-4 w-4 ${isActive("/dashboard") ? "" : ""}`} />
//             <p className="hidden md:block">
//             Dashboard
//             </p>
//           </Link>
          
//           <Link to="/inventory" className={navItemStyles("/inventory")}>
//             <Warehouse className="h-4 w-4" />
//             <p className="hidden md:block">
//             Inventory
//             </p>
//           </Link>
          
//           <Link to="/stock-entery" className={navItemStyles("/stock-entery")}>
//             <Package2Icon className="h-4 w-4" />
//             <p className="hidden md:block">
//             Stock Entery
//             </p>
//           </Link>
//           <Link to="/shops" className={navItemStyles("/shops")}>
//             <StoreIcon className="h-4 w-4" />
//             <p className="hidden md:block">
//             Stores
//             </p>
//           </Link>
//         <div className="flex items-center gap-4">
//           <Button
//             onClick={handleLogout}
//             variant="ghost"
//             size="icon"
//             className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
//           >
//             <LogOut className="h-5 w-5" />
//           </Button>
//         </div>
//         </nav>

//       </div>
//     </header>
//   );
// }


"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  LogOut,
  StoreIcon,
  Package2Icon,
  Warehouse,
  LayoutPanelTop,
  FeatherIcon,
} from "lucide-react";

import { Button } from "./ui/button";

export default function Navbar() {
  const navRef = useRef(null);
  const location = useLocation();
  const [showBottomNav, setShowBottomNav] = useState(true);

  /* ---------------- GSAP ENTRY ---------------- */
  useGSAP(
    () => {
      gsap.from(navRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "expo.out",
      });
    },
    { scope: navRef }
  );

  /* ---------------- SCROLL LOGIC (MOBILE) ---------------- */
  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      setShowBottomNav(currentY < lastY || currentY < 20);
      lastY = currentY;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Logged out successfully");
    } catch {
      toast.error("Error logging out");
    }
  };

  /* ---------------- HELPERS ---------------- */
  const isActive = (path) => location.pathname === path;

  const navItemStyles = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-full
    transition-all active:scale-90
    ${
      isActive(path)
        ? "text-primary bg-muted/10"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    }
  `;

  const bottomItemStyles = (path) => `
    flex items-center justify-center p-2 rounded-full
    transition-all active:scale-90
    ${
      isActive(path)
        ? "text-primary bg-muted/20"
        : "text-muted-foreground hover:text-foreground"
    }
  `;

  return (
    <>
      {/* ================= TOP NAVBAR ================= */}
      <header
        ref={navRef}
        className="sticky top-0 z-40 w-full border-b border-border/50
                   bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-[72px] items-center justify-between px-4 sm:px-8">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-1 font-bold text-lg">
            <span className="text-green-500 flex items-center gap-1">
              મુરલીધર <FeatherIcon className="h-4 w-4" />
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="flex justify-end items-center">

          <nav className="hidden md:flex items-center gap-2 p-1 rounded-full">
            <Link to="/dashboard" className={navItemStyles("/dashboard")}>
              <LayoutPanelTop className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>

            <Link to="/inventory" className={navItemStyles("/inventory")}>
              <Warehouse className="h-4 w-4" />
              <span>Inventory</span>
            </Link>

            <Link to="/stock-entery" className={navItemStyles("/stock-entery")}>
              <Package2Icon className="h-4 w-4" />
              <span>Stock Entry</span>
            </Link>

            <Link to="/shops" className={navItemStyles("/shops")}>
              <StoreIcon className="h-4 w-4" />
              <span>Stores</span>
            </Link>
          </nav>


          {/* Logout (always visible) */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground
                       hover:text-destructive hover:bg-destructive/10
                       active:scale-90"
          >
            <LogOut className="h-5 w-5" />
          </Button>
          </div>

        </div>
      </header>

      {/* ================= BOTTOM NAV (MOBILE ONLY) ================= */}
      <nav
        className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-60
                    flex gap-1 rounded-full border bg-background/90
                    backdrop-blur shadow-xs p-1 border-border/50
                    md:hidden transition-transform duration-300
                    ${showBottomNav ? "translate-y-0" : "translate-y-24"}`}
      >
        <Link to="/dashboard" className={bottomItemStyles("/dashboard")}>
          <LayoutPanelTop className="h-5 w-5" />
        </Link>

        <Link to="/inventory" className={bottomItemStyles("/inventory")}>
          <Warehouse className="h-5 w-5" />
        </Link>

        <Link to="/stock-entery" className={bottomItemStyles("/stock-entery")}>
          <Package2Icon className="h-5 w-5" />
        </Link>

        <Link to="/shops" className={bottomItemStyles("/shops")}>
          <StoreIcon className="h-5 w-5" />
        </Link>
      </nav>
    </>
  );
}
