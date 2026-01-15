"use client";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";

import { auth } from "../utils/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const container = useRef(null);
  const [email, setEmail] = useState("");
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

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reset email", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={container} className="h-lvh grid place-content-center w-full bg-background overflow-hidden">
      <Card className="w-[350px] shadow-none border-0 text-center bg-transparent">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight animate-item">Forgot Password</CardTitle>
          <CardDescription className="animate-item">Enter your email to receive a password reset link</CardDescription>
        </CardHeader>

        <CardContent className="shadow-none">
          <form onSubmit={handleReset}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2 text-left animate-item">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow-none focus-visible:ring-1"
                />
              </div>

              <div className="animate-item w-full">
                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full transition-all active:scale-95 font-medium"
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center animate-item">
                Remembered?{" "}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-primary underline p-0 text-xs"
                >
                  Login
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
