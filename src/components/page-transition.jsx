import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageTransition({ children }) {
  const curtainRef = useRef(null);

  useEffect(() => {
    gsap.set(curtainRef.current, { opacity: 1 });

    gsap.to(curtainRef.current, {
      opacity: 0,
      transformOrigin: "top", 
      duration: .45,        
      ease: "expo.inOut",    
      delay: 0.1,
    });
  }, []); 

  return (
    <>
      <div 
        ref={curtainRef}
        className="fixed inset-0 z-[9999] bg-background pointer-events-none origin-top"
      />
      
      <div className="relative min-h-screen w-full">
        {children}
      </div>
    </>
  );
}