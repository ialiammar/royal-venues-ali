"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function AuthPortal() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (isLogin) {
      // --- SIGN IN ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }
    } else {
      // --- SIGN UP WITH PROFILE DATA ---
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: name,
            phone_number: phone,
          }
        }
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }
    }

    // Route to the new Dashboard control panel!
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#4A000F] text-[#F8F6F0] font-sans flex flex-col">
      
      <nav className="p-4 md:p-6 border-b border-[#D4AF37]/30 flex justify-center md:justify-start items-center">
        <Link href="/" className="text-2xl font-bold tracking-widest text-[#D4AF37] uppercase hover:opacity-80">
          Royal <span className="text-[#F8F6F0]">Venues</span>
        </Link>
      </nav>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#F8F6F0] rounded-xl shadow-2xl overflow-hidden border border-[#D4AF37]/50">
          
          <div className="flex border-b border-[#D4AF37]/30 text-sm md:text-base">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(""); }}
              className={`flex-1 py-4 font-bold transition-colors ${isLogin ? 'bg-[#D4AF37] text-[#4A000F]' : 'bg-transparent text-[#4A000F]/50 hover:bg-[#D4AF37]/10'}`}
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(""); }}
              className={`flex-1 py-4 font-bold transition-colors ${!isLogin ? 'bg-[#D4AF37] text-[#4A000F]' : 'bg-transparent text-[#4A000F]/50 hover:bg-[#D4AF37]/10'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-6 md:p-8 flex flex-col gap-4 text-[#4A000F]">
            
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-[#4A000F]">
                {isLogin ? "Welcome Back" : "Partner Registration"}
              </h2>
              <p className="text-[#4A000F]/70 text-sm mt-1">
                {isLogin ? "Log in to view your dashboard." : "Join to list your venue."}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* ONLY show Name and Phone if creating an account */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-bold mb-1">Full Name</label>
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white border border-[#D4AF37]/50 rounded outline-none focus:border-[#D4AF37]" placeholder="e.g. Ali Ammar" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Phone Number</label>
                  <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 bg-white border border-[#D4AF37]/50 rounded outline-none focus:border-[#D4AF37]" placeholder="03XX-XXXXXXX" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold mb-1">Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-white border border-[#D4AF37]/50 rounded outline-none focus:border-[#D4AF37]" placeholder="vendor@example.com" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-white border border-[#D4AF37]/50 rounded outline-none focus:border-[#D4AF37]" placeholder="Min 6 characters" />
            </div>

            <button disabled={loading} type="submit" className="mt-2 w-full bg-[#4A000F] text-[#D4AF37] py-3.5 rounded font-bold text-lg hover:bg-[#4A000F]/90 transition-colors shadow-lg disabled:opacity-50">
              {loading ? "Processing..." : (isLogin ? "Go to Dashboard" : "Create Account")}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}