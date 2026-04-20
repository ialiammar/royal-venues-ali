import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { notFound } from "next/navigation";
import ReviewForm from "./ReviewForm"; // <--- We import the new form here!

// --- THE DYNAMIC SEO ENGINE ---
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: venue } = await supabase.from('venues').select('*').eq('id', id).single();
  
  if (!venue) return { title: 'Venue Not Found' };

  return {
    title: `${venue.name} | Royal Venues`,
    description: `Book ${venue.name} in ${venue.city}. Starting at Rs. ${venue.starting_price?.toLocaleString()} per head.`,
    openGraph: {
      title: `${venue.name} | Royal Venues`,
      description: venue.description.substring(0, 150) + "...",
      images: venue.images && venue.images.length > 0 ? [venue.images[0]] : [],
      type: "website",
    }
  };
}

export default async function VenueDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch Venue
  const { data: venue, error: venueError } = await supabase.from('venues').select('*').eq('id', id).single();
  if (venueError || !venue) notFound();

    // --- THE INVISIBLE VIEW TRACKER ---
  // We do NOT use 'await' here so it fires in the background and doesn't slow down the page load!
  supabase.rpc('increment_views', { v_id: Number(id) }).then();

  // Fetch Reviews specifically for this venue
  const { data: reviews } = await supabase.from('reviews').select('*').eq('venue_id', id).order('created_at', { ascending: false });
  const liveReviews = reviews || [];

  const getWhatsAppLink = (phone: string, venueName: string) => {
    let cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '92' + cleanPhone.substring(1);
    const message = `Hi! I found *${venueName}* on *Royal Venues*. I would like to ask about availability and packages.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const whatsappLink = getWhatsAppLink(venue.phone, venue.name);

  return (
    <div className="min-h-screen bg-[#1F0E13] text-[#F8F6F0] font-sans pb-24 md:pb-0">
      
      <nav className="px-4 py-4 md:px-8 border-b border-[#D4AF37]/20 bg-[#4A000F] sticky top-0 z-50 shadow-md flex items-center justify-between">
        <Link href="/" className="text-[#D4AF37] text-sm font-bold flex items-center gap-2">
          <span>&larr;</span> Back
        </Link>
        <div className="text-xl font-bold tracking-widest text-[#D4AF37] uppercase">
          Royal <span className="text-[#F8F6F0]">Venues</span>
        </div>
        <div className="w-10"></div>
      </nav>

      <main className="w-full max-w-5xl mx-auto md:py-8">
        
        <div className="w-full h-[35vh] md:h-[50vh] relative md:rounded-t-xl overflow-hidden bg-[#4A000F] border-b-4 border-[#D4AF37]">
          {venue.images && venue.images.length > 0 ? (
            <img src={venue.images[0]} alt="Thumbnail" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-[#D4AF37]/50 font-bold tracking-widest">NO IMAGE</div>
          )}
        </div>

        {venue.images && venue.images.length > 1 && (
          <div className="bg-[#1a0a0e] py-3 md:py-4 px-4 overflow-hidden border-b border-[#D4AF37]/20">
            <style dangerouslySetInnerHTML={{__html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
            <div className="flex gap-3 overflow-x-auto snap-x no-scrollbar">
              {venue.images.slice(1).map((img: string, idx: number) => (
                <div key={idx} className="min-w-[140px] md:min-w-[200px] h-[100px] md:h-[140px] rounded border border-[#D4AF37]/30 snap-start overflow-hidden flex-shrink-0 bg-[#4A000F]">
                  <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

       <div className="px-5 py-6 md:px-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-[#D4AF37] mb-3 leading-tight drop-shadow-md">{venue.name}</h1>
            
            {/* --- UPGRADED LOCATION & VIEWS BAR --- */}
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-semibold">
              <span className="text-[#F8F6F0]/70 flex items-center gap-2">
                📍 {venue.street}, {venue.area}, {venue.city}
              </span>
              
              {/* Vertical Divider (Hidden on small mobile) */}
              <span className="hidden md:block text-[#D4AF37]/30">|</span>
              
              <span className="flex items-center gap-1.5 text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20 shadow-lg">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                {venue.views || 0} People viewing
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white/5 p-6 rounded-xl border border-[#D4AF37]/10">
                <h3 className="text-sm text-[#D4AF37] font-bold uppercase tracking-wider mb-4">About the Venue</h3>
                <p className="text-[#F8F6F0]/90 leading-relaxed text-sm md:text-base whitespace-pre-wrap">{venue.description}</p>
              </div>

              {/* --- NEW REVIEWS SECTION --- */}
              <div className="bg-white/5 p-6 rounded-xl border border-[#D4AF37]/10">
                <h3 className="text-sm text-[#D4AF37] font-bold uppercase tracking-wider mb-4 flex justify-between items-center">
                  Guest Reviews
                  <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-1 rounded text-xs">{liveReviews.length} Total</span>
                </h3>
                
                {liveReviews.length === 0 ? (
                  <p className="text-[#F8F6F0]/50 text-sm italic">No reviews yet. Be the first to share your experience!</p>
                ) : (
                  <div className="space-y-4">
                    {liveReviews.map((review) => (
                      <div key={review.id} className="border-b border-[#D4AF37]/10 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-[#F8F6F0]">{review.author_name}</span>
                          <span className="text-[#D4AF37] text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                        </div>
                        <p className="text-[#F8F6F0]/70 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* The Interactive Form */}
                <ReviewForm venueId={venue.id} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#4A000F] p-6 rounded-xl border border-[#D4AF37]/30 shadow-2xl">
                <h3 className="text-sm text-[#D4AF37] font-bold uppercase tracking-wider mb-4 border-b border-[#D4AF37]/20 pb-3">Pricing (Per Head)</h3>
                <div className="space-y-4 text-sm md:text-base">
                  {venue.price_1 && <div className="flex justify-between"><span>1 Dish</span><span className="font-bold text-[#D4AF37]">Rs. {venue.price_1.toLocaleString()}</span></div>}
                  {venue.price_2 && <div className="flex justify-between"><span>2 Dish</span><span className="font-bold text-[#D4AF37]">Rs. {venue.price_2.toLocaleString()}</span></div>}
                  {venue.price_3 && <div className="flex justify-between"><span>3 Dish</span><span className="font-bold text-[#D4AF37]">Rs. {venue.price_3.toLocaleString()}</span></div>}
                  {!venue.price_1 && !venue.price_2 && !venue.price_3 && <div className="text-[#F8F6F0]/50 italic text-sm text-center">Contact for customized menus.</div>}
                </div>
              </div>

              <div className="hidden md:block bg-gradient-to-br from-[#D4AF37] to-[#B8962E] p-6 rounded-xl shadow-xl text-[#4A000F] text-center">
                <h2 className="text-lg font-bold mb-1">Check Availability</h2>
                <p className="text-xs mb-5 opacity-90 font-semibold">Contact management directly.</p>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#1F0E13] text-[#D4AF37] py-3 rounded-lg font-bold hover:bg-black transition-colors mb-3">
                  Message on WhatsApp
                </a>
                <a href={`tel:${venue.phone}`} className="block w-full bg-transparent border-2 border-[#1F0E13] text-[#1F0E13] py-3 rounded-lg font-bold hover:bg-[#1F0E13] hover:text-[#D4AF37] transition-colors">
                  📞 Call {venue.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1F0E13]/95 backdrop-blur-md border-t border-[#D4AF37]/30 p-4 z-50 flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <a href={`tel:${venue.phone}`} className="flex-1 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] py-3 rounded-lg font-bold flex items-center justify-center gap-2">📞 Call</a>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex-[2] bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-[#4A000F] py-3 rounded-lg font-bold flex items-center justify-center shadow-lg">WhatsApp</a>
      </div>
    </div>
  );
}