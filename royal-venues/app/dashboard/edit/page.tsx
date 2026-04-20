"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import Cropper from "react-easy-crop";

// A smart type to handle both Old DB images and New uploaded files
type ImageItem = {
  type: 'existing' | 'new';
  url: string;
  file?: File;
};

export default function EditPortal() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState<string | null>(null);
  
  // Text Data State
  const [formData, setFormData] = useState({
    name: "", street: "", area: "", city: "", 
    description: "", phone: "", email: "",
    price_1: "", price_2: "", price_3: ""
  });

  // Unified Image State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);

  // Cropper State (Only works on 'new' images)
  const [isCropping, setIsCropping] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // 1. Fetch Existing Data on Load
  useEffect(() => {
    async function loadVenueData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: venueData } = await supabase.from('venues').select('*').eq('owner_id', session.user.id).single();
      
      if (venueData) {
        setVenueId(venueData.id);
        
        // Load existing images into the smart array
        if (venueData.images) {
          const loadedImages = venueData.images.map((url: string) => ({ type: 'existing', url }));
          setImages(loadedImages);
        }

        setFormData({
          name: venueData.name || "", street: venueData.street || "", area: venueData.area || "", city: venueData.city || "",
          description: venueData.description || "", phone: venueData.phone || "", email: venueData.email || "",
          price_1: venueData.price_1?.toString() || "", price_2: venueData.price_2?.toString() || "", price_3: venueData.price_3?.toString() || ""
        });
      } else {
        router.push("/dashboard");
      }
      setLoading(false);
    }
    loadVenueData();
  }, [router]);

  // 2. Image Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newItems: ImageItem[] = selectedFiles.map(file => ({
        type: 'new',
        url: URL.createObjectURL(file),
        file: file
      }));
      
      const combined = [...images, ...newItems].slice(0, 6);
      setImages(combined);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove);
    setImages(newImages);
    if (thumbnailIndex === indexToRemove) setThumbnailIndex(0);
    else if (thumbnailIndex > indexToRemove) setThumbnailIndex(thumbnailIndex - 1);
  };

  // 3. Cropper Handlers (For New Images Only)
  const openCropper = (index: number) => {
    if (images[index].type === 'existing') {
      alert("You can only crop newly added images. To change an existing image, delete it and upload it again.");
      return;
    }
    setCropIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(true);
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const confirmCrop = async () => {
    if (cropIndex === null || !croppedAreaPixels) return;
    const targetImg = images[cropIndex];
    if (targetImg.type !== 'new' || !targetImg.file) return;

    const croppedFile = await getCroppedImg(targetImg.url, croppedAreaPixels, targetImg.file.name);
    
    if (croppedFile) {
      const newUrl = URL.createObjectURL(croppedFile);
      const updatedImages = [...images];
      updatedImages[cropIndex] = { type: 'new', file: croppedFile, url: newUrl };
      setImages(updatedImages);
    }
    setIsCropping(false);
  };

  // 4. Submit Engine
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length < 2) return alert("You must have at least 2 images (Thumbnail + 1 Gallery Image).");
    setIsSubmitting(true);

    // Rearrange based on Thumbnail selection
    const imagesToProcess = [...images];
    const selectedThumbnail = imagesToProcess.splice(thumbnailIndex, 1)[0];
    imagesToProcess.unshift(selectedThumbnail);

    const finalUrls: string[] = [];

    // Upload new files, keep existing URLs
    for (const img of imagesToProcess) {
      if (img.type === 'existing') {
        finalUrls.push(img.url);
      } else if (img.type === 'new' && img.file) {
        const fileExt = img.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('venue_images').upload(fileName, img.file);
        
        if (uploadError) {
          alert("Failed to upload new images.");
          setIsSubmitting(false);
          return;
        }
        const { data: { publicUrl } } = supabase.storage.from('venue_images').getPublicUrl(fileName);
        finalUrls.push(publicUrl);
      }
    }

    const prices = [Number(formData.price_1), Number(formData.price_2), Number(formData.price_3)].filter(p => p > 0);
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

    // Save to database & LOCK the listing for Admin review
    const { error: dbError } = await supabase.from('venues').update({ 
      name: formData.name, street: formData.street, area: formData.area, city: formData.city,
      description: formData.description, phone: formData.phone, email: formData.email,
      price_1: formData.price_1 || null, price_2: formData.price_2 || null, price_3: formData.price_3 || null,
      starting_price: startingPrice,
      images: finalUrls,
      is_approved: false 
    }).eq('id', venueId);

    if (dbError) {
      alert("Database Error.");
      setIsSubmitting(false);
      return;
    }
    
    alert("Changes submitted! Your listing is now pending Admin approval.");
    router.push("/dashboard");
  };

  if (loading) return <div className="min-h-screen bg-[#4A000F] flex items-center justify-center text-[#D4AF37] font-bold">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-[#4A000F] text-[#F8F6F0] font-sans flex flex-col pb-12 relative">
      
      {/* CROPPER MODAL */}
      {isCropping && cropIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#1a1a1a] p-4 rounded-lg border border-[#D4AF37]">
            <h3 className="text-[#D4AF37] font-bold text-lg mb-4 text-center">Adjust New Image</h3>
            <div className="relative w-full h-[400px] bg-black rounded">
              <Cropper image={images[cropIndex].url} crop={crop} zoom={zoom} aspect={16 / 9} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <div className="mt-6 flex items-center gap-4 px-4">
              <span className="text-white font-bold">-</span>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
              <span className="text-white font-bold">+</span>
            </div>
            <div className="flex justify-between mt-6 gap-4">
              <button onClick={() => setIsCropping(false)} className="w-full py-3 bg-red-600/20 text-red-500 font-bold rounded">Cancel</button>
              <button onClick={confirmCrop} className="w-full py-3 bg-[#D4AF37] text-[#4A000F] font-bold rounded">Save Adjustments</button>
            </div>
          </div>
        </div>
      )}

      <nav className="p-6 border-b border-[#D4AF37]/30 flex justify-between items-center bg-[#4A000F] sticky top-0 z-50 shadow-md">
        <Link href="/dashboard" className="text-sm font-bold text-[#D4AF37] hover:text-white">&larr; Back to Dashboard</Link>
        <span className="text-[#D4AF37] font-semibold tracking-widest uppercase">Edit Listing</span>
      </nav>

      <main className="flex-grow flex items-center justify-center p-4 md:p-6 mt-4 md:mt-8">
        <div className="w-full max-w-3xl bg-[#F8F6F0] rounded-lg shadow-2xl overflow-hidden border border-[#D4AF37]/50">
          
          <div className="bg-orange-500 p-4 text-center">
            <h1 className="text-lg md:text-xl font-bold text-white">Full Listing Update</h1>
            <p className="text-white/90 text-xs md:text-sm mt-1 font-semibold">Warning: Submitting changes will hide your listing until an Admin re-approves it.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 text-[#4A000F]">
            
            {/* Visuals Section */}
            <div className="bg-[#D4AF37]/10 p-4 md:p-6 rounded border border-[#D4AF37]/30">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-[#D4AF37]/30 pb-2">1. Visuals</h2>
              <p className="text-[10px] md:text-xs text-gray-600 mb-3">Upload up to 6 images. Click on an image to set it as your main thumbnail.</p>
              
              <div className="mb-4 md:mb-6 relative">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={images.length >= 6} />
                <div className={`w-full p-3 md:p-4 text-sm md:text-base text-center border-2 border-dashed rounded font-bold transition-colors ${images.length >= 6 ? 'border-gray-400 text-gray-400 bg-gray-100' : 'border-[#D4AF37] text-[#D4AF37] bg-white hover:bg-[#D4AF37]/5'}`}>
                  {images.length >= 6 ? "Maximum 6 images reached" : "+ Click to Add More Images"}
                </div>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {images.map((img, index) => (
                    <div key={index} className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 md:border-4 transition-all ${thumbnailIndex === index ? 'border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'border-transparent hover:border-[#D4AF37]/50'}`}>
                      <img src={img.url} onClick={() => setThumbnailIndex(index)} className="w-full h-full object-cover" />
                      
                      {thumbnailIndex === index && (
                        <div className="absolute top-0 left-0 w-full bg-[#D4AF37] text-[#4A000F] text-[8px] md:text-[10px] font-bold text-center py-1 uppercase tracking-widest">Thumbnail</div>
                      )}

                      {img.type === 'new' && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); openCropper(index); }} className="absolute bottom-1 left-1 bg-black/80 text-[#D4AF37] text-[10px] md:text-xs font-bold px-2 py-1 rounded backdrop-blur hover:bg-black">✂️ Adjust</button>
                      )}

                      <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full text-[10px] md:text-xs font-bold flex items-center justify-center hover:bg-red-700">X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Venue Name *</label><input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
              <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Description / Details *</label><textarea required rows={5} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
            </div>

            {/* Exact Location */}
            <div className="bg-[#D4AF37]/10 p-4 md:p-6 rounded border border-[#D4AF37]/30">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-[#D4AF37]/30 pb-2">2. Exact Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="col-span-1 md:col-span-3"><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Street Address *</label><input required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
                <div className="col-span-1 md:col-span-2"><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Area / Society *</label><input required type="text" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
                <div className="col-span-1"><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">City *</label><input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Phone Number *</label><input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
              <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Email (Optional)</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
            </div>

            {/* Pricing */}
            <div className="bg-[#D4AF37]/10 p-4 md:p-6 rounded border border-[#D4AF37]/30">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-[#D4AF37]/30 pb-2">3. Pricing (Per Head)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">1 Dish Price (PKR)</label><input type="number" value={formData.price_1} onChange={(e) => setFormData({...formData, price_1: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
                <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">2 Dish Price (PKR)</label><input type="number" value={formData.price_2} onChange={(e) => setFormData({...formData, price_2: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
                <div><label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">3 Dish Price (PKR)</label><input type="number" value={formData.price_3} onChange={(e) => setFormData({...formData, price_3: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" /></div>
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="mt-2 w-full bg-[#4A000F] text-[#D4AF37] py-3 md:py-4 rounded font-bold text-base md:text-lg hover:bg-[#4A000F]/90 transition-colors shadow-lg disabled:opacity-50">
              {isSubmitting ? "Uploading & Processing..." : "Submit Changes for Review"}
            </button>

          </form>
        </div>
      </main>
    </div>
  );
}

// ==========================================
// BACKGROUND MATH ENGINE FOR CROPPING
// ==========================================
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any, fileName: string): Promise<File | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg");
  });
}