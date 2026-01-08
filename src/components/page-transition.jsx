import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageTransition({ children }) {
  const curtainRef = useRef(null);

  useEffect(() => {
    // 1. Initial State: Curtain covers screen
    gsap.set(curtainRef.current, { scaleY: 1 });

    // 2. The Reveal: Apple-style "Expo" slide up
    gsap.to(curtainRef.current, {
      scaleY: 0,
      transformOrigin: "top", 
      duration: 1.2,          // Smooth, luxury speed
      ease: "expo.inOut",    
      delay: 0.1,
    });
  }, []); // Re-runs every time key changes in App.jsx

  return (
    <>
      <div 
        ref={curtainRef}
        className="fixed inset-0 z-[9999] bg-zinc-50/10 pointer-events-none origin-top"
      />
      
      <div className="relative min-h-screen w-full">
        {children}
      </div>
    </>
  );
}