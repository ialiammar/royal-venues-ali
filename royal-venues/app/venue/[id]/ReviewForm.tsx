"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ReviewForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('reviews').insert([{
      venue_id: Number(venueId), // <--- Safely converted to a Number!
      author_name: author,
      rating: rating,
      comment: comment
    }]);

    if (error) {
      alert("Failed to submit review.");
    } else {
      setAuthor("");
      setComment("");
      setRating(5);
      router.refresh(); // Instantly reloads the page to show the new review!
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-[#4A000F] p-6 rounded-xl border border-[#D4AF37]/30 shadow-xl mt-8">
      <h3 className="text-lg font-bold text-[#D4AF37] mb-4">Leave a Review</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#F8F6F0]/70 mb-1 uppercase tracking-widest font-bold">Your Name</label>
            <input required type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-black/40 text-[#F8F6F0] p-3 rounded outline-none border border-transparent focus:border-[#D4AF37]/50" placeholder="e.g. Ali" />
          </div>
          <div>
            <label className="block text-xs text-[#F8F6F0]/70 mb-1 uppercase tracking-widest font-bold">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full bg-black/40 text-[#F8F6F0] p-3 rounded outline-none border border-transparent focus:border-[#D4AF37]/50 cursor-pointer appearance-none">
              <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
              <option value="4">⭐⭐⭐⭐ (4/5)</option>
              <option value="3">⭐⭐⭐ (3/5)</option>
              <option value="2">⭐⭐ (2/5)</option>
              <option value="1">⭐ (1/5)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#F8F6F0]/70 mb-1 uppercase tracking-widest font-bold">Your Experience</label>
          <textarea required rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-black/40 text-[#F8F6F0] p-3 rounded outline-none border border-transparent focus:border-[#D4AF37]/50" placeholder="How was the food, decor, and management?"></textarea>
        </div>

        <button disabled={isSubmitting} type="submit" className="bg-[#D4AF37] text-[#4A000F] font-bold py-3 rounded hover:brightness-110 transition-all disabled:opacity-50">
          {isSubmitting ? "Posting..." : "Post Review"}
        </button>
      </form>
    </div>
  );
}