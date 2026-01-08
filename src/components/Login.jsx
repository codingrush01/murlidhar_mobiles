import { useRef, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
// Import Firebase Auth
import { auth } from "../utils/firebase"; 
import { signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const container = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Added password state
  const [loading, setLoading] = useState(false);

  useGSAP(() => {
    gsap.from(".animate-item", {
      y: 20,
      opacity: 0,
      stagger: 0.12,
      duration: 1,
      ease: "power4.out",
      delay: 0.5,
    });
  }, { scope: container });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Firebase Authentication Check
      await signInWithEmailAndPassword(auth, email, password);
      
      toast.success("Login successful!");
      
      // Delay for "Sleek" transition
      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    } catch (error) {
      console.error(error.code);
      // Clean Apple-style error messaging
      const message = error.code === 'auth/invalid-credential' 
        ? "Invalid email or password." 
        : "Something went wrong. Please try again.";
        
      toast.error("Authentication Failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={container} className="h-lvh grid place-content-center w-full bg-background overflow-hidden">
      <Card className="w-[350px] shadow-none border-0 text-center bg-transparent">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight animate-item">Login</CardTitle>
          <CardDescription className="animate-item">Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        
        <CardContent className="shadow-none">
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2 text-left animate-item">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@gmail.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow-none focus-visible:ring-1"
                />
              </div>

              <div className="grid gap-2 text-left animate-item">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow-none focus-visible:ring-1" 
                />
              </div>

              <div className="animate-item w-full">
                <Button 
                  disabled={loading} 
                  type="submit" 
                  className="w-full transition-all active:scale-95 font-medium"
                >
                  {loading ? "Verifying..." : "Login"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex-col gap-2 animate-item">
          <p className="text-xs text-muted-foreground opacity-70">Secured by Firebase</p>
        </CardFooter>
      </Card>
    </div>
  );
}