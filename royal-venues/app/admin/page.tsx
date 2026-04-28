"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function AdminPanel() {
  // --- THE VAULT LOCK ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const SECRET_KEY = "51214"; // <-- CHANGE THIS TO YOUR SECRET PASSWORD

  const [pendingVenues, setPendingVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingVenues = async () => {
    setLoading(true);
    const { data } = await supabase.from('venues').select('*').eq('is_approved', false).order('created_at', { ascending: false });
    if (data) setPendingVenues(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isUnlocked) fetchPendingVenues();
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === SECRET_KEY) {
      setIsUnlocked(true);
    } else {
      alert("ACCESS DENIED");
      setPasscode("");
    }
  };

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to push ${name} LIVE?`)) return;
    const { error } = await supabase.from('venues').update({ is_approved: true }).eq('id', id);
    if (!error) setPendingVenues(pendingVenues.filter(v => v.id !== id));
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to permanently DELETE this listing?")) return;
    const { error } = await supabase.from('venues').delete().eq('id', id);
    if (!error) setPendingVenues(pendingVenues.filter(v => v.id !== id));
  };

  // --- THE LOCK SCREEN UI ---
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-mono">
        <div className="w-full max-w-sm">
          <div className="text-red-600 text-center mb-6">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            <h1 className="text-xl font-bold tracking-[0.3em] uppercase">Restricted Area</h1>
          </div>
          <form onSubmit={handleUnlock} className="flex flex-col gap-4">
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoFocus className="w-full bg-transparent border-b-2 border-red-900 text-red-500 text-center text-2xl tracking-[0.5em] py-2 outline-none focus:border-red-500 transition-colors" placeholder="••••••••" />
            <button type="submit" className="opacity-0 w-0 h-0 absolute">Submit</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-[#111] flex items-center justify-center text-[#D4AF37] font-bold tracking-widest uppercase">Loading Command Center...</div>;

  return (
    <div className="min-h-screen bg-[#111] text-[#F8F6F0] font-sans flex flex-col">
      <nav className="p-4 md:p-6 border-b border-red-900/50 bg-black shadow-md flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold tracking-widest text-red-600 uppercase">Royal <span className="text-white">Admin</span></Link>
        <div className="text-xs md:text-sm text-red-500 font-bold uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Beast Mode Active</div>
      </nav>

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 border-b border-white/10 pb-6 flex justify-between items-end">
          <div><h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Review Pipeline</h1><p className="text-white/50 text-sm">Halls awaiting your approval before going live.</p></div>
          <div className="bg-red-900/20 text-red-500 border border-red-900/50 px-4 py-2 rounded-lg font-bold text-sm">{pendingVenues.length} Pending</div>
        </div>

        {pendingVenues.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center"><h2 className="text-xl font-bold text-white mb-2">Inbox Zero</h2><p className="text-white/50 text-sm">There are no new venues waiting for approval. Go relax!</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingVenues.map((venue) => (
              <div key={venue.id} className="bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
                <div className="w-full md:w-64 h-48 md:h-auto bg-black relative">
                  {venue.images && venue.images.length > 0 ? <img src={venue.images[0]} className="w-full h-full object-cover opacity-80" /> : <div className="flex items-center justify-center h-full text-white/30 text-xs uppercase tracking-widest">No Image</div>}
                  <div className="absolute top-3 left-3 bg-orange-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase">Needs Review</div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2"><h2 className="text-2xl font-bold text-white">{venue.name}</h2><span className="text-white/40 text-xs">ID: {String(venue.id).substring(0, 8)}</span></div>
                  <p className="text-white/60 text-sm mb-4">📍 {venue.street}, {venue.area}, {venue.city}</p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-black/50 p-3 rounded border border-white/5"><div className="text-[10px] text-white/40 uppercase mb-1">Contact Phone</div><div className="text-sm font-bold text-[#D4AF37]">{venue.phone}</div></div>
                    <div className="bg-black/50 p-3 rounded border border-white/5"><div className="text-[10px] text-white/40 uppercase mb-1">Starting Price</div><div className="text-sm font-bold text-white">Rs. {venue.starting_price?.toLocaleString() || "N/A"}</div></div>
                    <div className="bg-black/50 p-3 rounded border border-white/5"><div className="text-[10px] text-white/40 uppercase mb-1">Total Images</div><div className="text-sm font-bold text-white">{venue.images?.length || 0} Uploaded</div></div>
                  </div>
                  <div className="flex gap-4 mt-auto">
                    <button onClick={() => handleApprove(venue.id, venue.name)} className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-500 transition-colors shadow-lg">✅ Approve & Publish</button>
                    <button onClick={() => handleReject(venue.id)} className="bg-red-900/30 text-red-500 border border-red-900/50 px-6 py-3 rounded font-bold hover:bg-red-900/50 transition-colors">🗑️ Reject (Delete)</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}