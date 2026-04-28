import Link from "next/link";
import { supabase } from "./lib/supabase"; 
import NavModals from "./components/NavModals"; // <--- Imported the interactive buttons!

// --- THE HOMEPAGE SEO ENGINE ---
export const metadata = {
  title: "Royal Venues | Premium Event Directory",
  description: "Find and book the best marriage halls and banquets in Pakistan. Filter by budget and location with zero friction.",
  openGraph: {
    title: "Royal Venues | Find Your Perfect Palace",
    description: "Discover premium marriage halls. Filter by budget and location with zero friction.",
    type: "website",
  }
};

// 1. We look for the search query (q) and the sort preference (sort)
export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string, sort?: string }> }) {
  const { q, sort } = await searchParams;

  // 2. Base Query (Only show approved halls)
  let dbQuery = supabase
    .from('venues')
    .select('*')
    .eq('is_approved', true);

  // 3. Apply Text Search if they typed something
  if (q) {
    dbQuery = dbQuery.or(`name.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%`);
  }

  // 4. THE SORTING ENGINE
  if (sort === 'asc') {
    dbQuery = dbQuery.order('starting_price', { ascending: true });
  } else if (sort === 'desc') {
    dbQuery = dbQuery.order('starting_price', { ascending: false });
  } else {
    dbQuery = dbQuery.order('created_at', { ascending: false });
  }

  const { data: venues, error } = await dbQuery;
  if (error) console.error("Failed to fetch venues:", error);
  const liveVenues = venues || [];

  const getBadgeInfo = (rating: number, reviews: number) => {
    if (rating >= 4.8 && reviews >= 100) return { text: "Best Choice", style: "border-[#D4AF37] text-[#D4AF37] shadow-[0_0_8px_#D4AF37]" };
    if (reviews >= 200) return { text: "Highly Booked", style: "border-[#F8F6F0] text-[#F8F6F0]" };
    if (rating >= 4.5) return { text: "Top Rated", style: "border-[#D4AF37]/70 text-[#D4AF37]" };
    return null; 
  };

  return (
    <div className="min-h-screen bg-[#4A000F] text-[#F8F6F0] font-sans flex flex-col">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between p-4 md:p-6 border-b border-[#D4AF37]/30 bg-[#4A000F] sticky top-0 z-50 shadow-md">
        <div className="text-xl md:text-2xl font-bold tracking-widest text-[#D4AF37] uppercase">
          Royal <span className="text-[#F8F6F0]">Venues</span>
        </div>
        
        {/* --- THE INTERACTIVE MODALS INJECTED HERE --- */}
        <NavModals />

        <Link 
          href="/login" 
          className="text-[10px] md:text-sm px-4 py-2 md:px-6 md:py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#4A000F] font-bold rounded shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all uppercase tracking-wider"
        >
          List Your Venue
        </Link>
      </nav>

      {/* Hero & Search Section */}
      <main className="flex flex-col items-center justify-center text-center px-4 pt-10 pb-8 md:pt-20 md:pb-16 flex-grow">
        <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-6 text-[#D4AF37] drop-shadow-lg leading-tight">
          Find Your Perfect Palace
        </h1>
        <p className="text-xs md:text-xl max-w-2xl mb-8 md:mb-12 text-[#F8F6F0]/80">
          Discover premium marriage halls. Experience luxury and zero friction.
        </p>

        {/* --- ULTRA-SLEEK UNIFIED SEARCH PILL --- */}
        <form action="/" className="w-full max-w-4xl bg-[#F8F6F0] p-1.5 md:p-2 rounded-2xl md:rounded-full border border-[#D4AF37]/50 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center transition-all focus-within:shadow-[0_0_25px_rgba(212,175,55,0.3)]">
          
          {/* Search Input */}
          <div className="flex-1 flex items-center px-4 md:px-6 w-full py-2 md:py-0">
            <svg className="w-5 h-5 text-[#4A000F]/40 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Search city or area..."
              className="w-full bg-transparent text-[#4A000F] font-bold text-sm md:text-base outline-none placeholder-[#4A000F]/40"
            />
          </div>

          {/* Desktop Vertical Divider */}
          <div className="hidden md:block w-px h-8 bg-[#4A000F]/10 mx-2"></div>
          {/* Mobile Horizontal Divider */}
          <div className="md:hidden w-full h-px bg-[#4A000F]/10 my-1"></div>

          {/* Sleek Sort Dropdown */}
          <div className="relative w-full md:w-auto flex items-center px-4 md:px-6 py-2 md:py-0 group cursor-pointer">
            <svg className="w-5 h-5 text-[#4A000F]/40 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
            
            <select 
              name="sort" 
              defaultValue={sort || ""} 
              className="appearance-none bg-transparent text-[#4A000F] font-bold text-sm md:text-base w-full md:w-48 outline-none cursor-pointer pr-6"
            >
              <option value="">Recommended</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
            
            <svg className="w-4 h-4 text-[#4A000F]/50 absolute right-4 md:right-6 pointer-events-none transition-transform group-hover:translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          {/* Action Button */}
          <button type="submit" className="w-full md:w-auto mt-2 md:mt-0 bg-[#4A000F] text-[#D4AF37] px-8 py-3.5 md:py-4 rounded-xl md:rounded-full font-bold hover:bg-black transition-colors uppercase tracking-widest text-sm md:text-base shadow-md">
            Search
          </button>
        </form>

        {/* Clear Filters Button */}
        {(q || sort) && (
          <div className="mt-6">
            <Link href="/" className="text-xs md:text-sm text-[#D4AF37] hover:bg-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-2 rounded-full border border-[#D4AF37]/30 transition-colors">
              &times; Clear Search & Sort
            </Link>
          </div>
        )}
      </main>

      {/* Live Directory Grid */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 border-t border-[#D4AF37]/20">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-[#D4AF37]">
              {(q || sort) ? "Search Results" : "Featured Palaces"}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
          {liveVenues.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[#F8F6F0]/50 italic text-sm md:text-base">No palaces found. Try clearing your search.</p>
            </div>
          ) : (
            liveVenues.map((venue) => {
              const badge = getBadgeInfo(venue.rating, venue.reviews);
              const thumbnail = venue.images && venue.images.length > 0 ? venue.images[0] : null;

              return (
                <div key={venue.id} className="relative bg-[#F8F6F0] rounded-lg overflow-hidden shadow-xl border border-[#D4AF37]/30 transition-transform duration-300 hover:-translate-y-1 flex flex-col">
                  
                  <div className="h-28 md:h-48 bg-[#4A000F] border-b border-[#D4AF37]/20 flex items-center justify-center relative overflow-hidden group">
                    {thumbnail ? (
                      <img src={thumbnail} alt={venue.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="text-[#D4AF37]/50 font-semibold uppercase tracking-widest text-[8px] md:text-xs">No Image</span>
                    )}

                    {badge && (
                      <div className={`absolute top-2 right-2 bg-[#4A000F]/90 backdrop-blur-md border ${badge.style} text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-lg z-10 uppercase tracking-wider`}>
                        {badge.text}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 md:p-6 text-[#4A000F] flex flex-col flex-grow">
                    <h3 className="text-sm md:text-xl font-bold mb-1 leading-tight line-clamp-1">{venue.name}</h3>
                    <p className="text-[9px] md:text-sm font-semibold text-[#4A000F]/70 mb-2 md:mb-4 flex items-center gap-1 line-clamp-1">
                      📍 {venue.area}, {venue.city}
                    </p>

                    <div className="flex flex-col gap-1.5 md:gap-2 mb-3 md:mb-6 flex-grow">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 md:gap-2">
                          <span className="text-[#D4AF37] text-[10px] md:text-sm tracking-widest">★★★★★</span>
                          <span className="text-[10px] md:text-xs font-bold">{venue.rating || "New"}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-[#4A000F]/50 font-bold bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                          <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          {venue.views || 0}
                        </div>
                      </div>
                      
                      <div className="text-[8px] md:text-xs font-bold bg-[#D4AF37]/15 border border-[#D4AF37]/40 inline-block px-1.5 py-0.5 md:px-2 md:py-1 rounded w-fit text-[#4A000F]">
                        ✓ From Rs. {venue.starting_price ? venue.starting_price.toLocaleString() : "N/A"}
                      </div>
                    </div>

                    <Link 
                      href={`/venue/${venue.id}`} 
                      className="mt-auto w-full bg-[#4A000F] text-[#D4AF37] py-2 md:py-3 text-[10px] md:text-sm rounded font-bold hover:bg-[#4A000F]/90 transition-colors shadow-md text-center block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <footer className="w-full bg-[#1F0E13] border-t border-[#D4AF37]/20 py-8 mt-auto text-center">
        <div className="text-[#D4AF37] font-bold tracking-widest uppercase mb-2">Royal Venues</div>
        <p className="text-[#F8F6F0]/40 text-xs">© 2026 Directory. All rights reserved.</p>
      </footer>
    </div>
  );
}