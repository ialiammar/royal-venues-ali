"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) { router.push("/login"); return; }
      setUser(session.user);

      const { data: venueData } = await supabase.from('venues').select('*').eq('owner_id', session.user.id).single(); 
      if (venueData) setVenue(venueData);
      setLoading(false);
    }
    loadDashboard();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDelete = async () => {
    if (!confirm("DANGER: Are you absolutely sure you want to permanently delete your listing?")) return;
    const { error } = await supabase.from('venues').delete().eq('id', venue.id);
    if (!error) setVenue(null);
  };

  if (loading) return <div className="min-h-screen bg-[#1F0E13] flex items-center justify-center text-[#D4AF37] font-bold tracking-widest uppercase">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#1F0E13] text-[#F8F6F0] font-sans flex flex-col">
      <nav className="p-4 md:p-6 border-b border-[#D4AF37]/20 bg-[#4A000F] shadow-md flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold tracking-widest text-[#D4AF37] uppercase">
          Royal <span className="text-[#F8F6F0]">Venues</span> <span className="text-[10px] md:text-xs text-[#F8F6F0]/50 tracking-normal ml-2">Partner Hub</span>
        </Link>
        <button onClick={handleSignOut} className="text-xs md:text-sm text-[#D4AF37] hover:text-white transition-colors font-bold border border-[#D4AF37]/30 px-3 py-1 rounded">Log Out</button>
      </nav>

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-[#D4AF37] mb-1">Welcome, {user?.user_metadata?.full_name || "Partner"}</h1>
          <p className="text-[#F8F6F0]/60 text-sm md:text-base">Manage your listing and track your performance.</p>
        </div>

        {!venue ? (
          <div className="bg-[#4A000F] border border-[#D4AF37]/30 rounded-xl p-8 md:p-12 text-center shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-[#D4AF37] mb-2">You haven't listed a palace yet.</h2>
            <Link href="/partner" className="inline-block mt-4 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#4A000F] px-8 py-4 rounded font-bold hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all uppercase">Create Your Listing</Link>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-[#D4AF37]/20 p-6 rounded-xl text-center shadow-lg">
                <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-2">Total Views</div>
                <div className="text-3xl md:text-5xl font-bold text-white">{venue.views || 0}</div>
              </div>
              <div className="bg-white/5 border border-[#D4AF37]/20 p-6 rounded-xl text-center shadow-lg">
                <div className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest mb-2">Status</div>
                {venue.is_approved ? (
                  <div className="text-lg md:text-xl font-bold text-green-500 mt-2 md:mt-4 flex items-center justify-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active & Live</div>
                ) : (
                  <div className="text-lg md:text-xl font-bold text-orange-400 mt-2 md:mt-4 flex flex-col items-center justify-center"><span>Pending Review</span><span className="text-[10px] text-orange-400/70 font-normal mt-1">Awaiting admin approval</span></div>
                )}
              </div>
            </div>

            <div className="bg-[#4A000F] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 h-56 md:h-auto bg-black relative">
                {venue.images && venue.images.length > 0 ? <img src={venue.images[0]} className="w-full h-full object-cover opacity-80" /> : <div className="flex items-center justify-center h-full text-[#D4AF37]/30 text-xs">NO IMAGE</div>}
                <div className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded uppercase ${venue.is_approved ? 'bg-[#D4AF37] text-[#4A000F]' : 'bg-orange-500 text-white'}`}>{venue.is_approved ? 'Live on App' : 'In Review'}</div>
              </div>
              
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] mb-2">{venue.name}</h2>
                <p className="text-[#F8F6F0]/70 text-sm md:text-base mb-6">📍 {venue.street}, {venue.city}</p>
                
                <div className="flex flex-col gap-1 mb-6 text-sm text-[#F8F6F0]/90">
                  <div className="flex items-center gap-2"><span className="text-[#D4AF37]">📞 Contact:</span> {venue.phone}</div>
                  <div className="flex items-center gap-2"><span className="text-[#D4AF37]">💰 Starts At:</span> Rs. {venue.starting_price?.toLocaleString() || "N/A"}</div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 mt-auto">
                  <Link href={`/venue/${venue.id}`} className="flex-1 text-center border border-[#D4AF37] text-[#D4AF37] py-3 rounded font-bold hover:bg-[#D4AF37] hover:text-[#4A000F] transition-colors text-sm shadow-lg">View Live Page</Link>
                  
                  {/* --- THE NEW FULL EDIT BUTTON --- */}
                  <Link href="/dashboard/edit" className="flex-1 text-center bg-white/10 text-white py-3 rounded font-bold hover:bg-white/20 transition-colors text-sm shadow-lg">
                    Edit Full Listing
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-red-900/30">
                   <button onClick={handleDelete} className="text-red-500 text-xs font-bold hover:underline flex items-center gap-1 transition-colors hover:text-red-400">⚠️ Delete This Listing Permanently</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}