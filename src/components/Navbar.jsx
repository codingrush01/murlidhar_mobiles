import { useRef } from "react";
import { Link, useLocation } from "react-router-dom"; // 1. Added useLocation
import { auth } from "../utils/firebase"; 
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LogOut, Package2, LayoutDashboard, Box, StoreIcon } from "lucide-react";
import { Button } from "./ui/button";

export default function Navbar({ user }) {
  const navRef = useRef(null);
  const location = useLocation(); // 2. Track current path

  useGSAP(() => {
    gsap.from(navRef.current, {
      y: -0,
      opacity: 1,
      duration: 1.2,
      ease: "expo.out",
    });
  }, { scope: navRef });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  // 3. Helper to check if link is active
  const isActive = (path) => location.pathname === path;

  // 4. Shared style for Nav Links
  const navItemStyles = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-out
    transition-all active:scale-90
    ${isActive(path) 
      ? " text-primary" 
      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}
  `;

  return (
    <header 
      ref={navRef}
      className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-[80px] items-center justify-between px-6 mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
             <Package2 className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 p-1 rounded-full ">
          <Link to="/dashboard" className={navItemStyles("/dashboard")}>
            <LayoutDashboard className={`h-4 w-4 ${isActive("/dashboard") ? "animate-pulse" : ""}`} />
            Dashboard
          </Link>
          
          <Link to="/inventory" className={navItemStyles("/inventory")}>
            <Box className="h-4 w-4" />
            Inventory
          </Link>
          
          <Link to="/shops" className={navItemStyles("/shops")}>
            <StoreIcon className="h-4 w-4" />
            Stores
          </Link>
        {/* User Actions */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        </nav>

      </div>
    </header>
  );
}