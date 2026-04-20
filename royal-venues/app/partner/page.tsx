"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import Cropper from "react-easy-crop";

export default function PartnerPortal() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Text Data State
  const [formData, setFormData] = useState({
    name: "", street: "", area: "", city: "", 
    description: "", phone: "", email: "",
    price_1: "", price_2: "", price_3: ""
  });

  // Image State
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);

  // Cropper State
  const [isCropping, setIsCropping] = useState(false);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const combinedFiles = [...files, ...selectedFiles].slice(0, 6);
      const newPreviews = combinedFiles.map(file => URL.createObjectURL(file));
      setFiles(combinedFiles);
      setPreviews(newPreviews);
    }
  };

  // Open Cropper
  const openCropper = (index: number) => {
    setCropIndex(index);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setIsCropping(true);
  };
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Process the Crop
  const confirmCrop = async () => {
    if (cropIndex === null || !croppedAreaPixels) return;
    const croppedFile = await getCroppedImg(previews[cropIndex], croppedAreaPixels, files[cropIndex].name);
    
    if (croppedFile) {
      const newPreviewUrl = URL.createObjectURL(croppedFile);
      const updatedFiles = [...files];
      updatedFiles[cropIndex] = croppedFile;
      const updatedPreviews = [...previews];
      updatedPreviews[cropIndex] = newPreviewUrl;

      setFiles(updatedFiles);
      setPreviews(updatedPreviews);
    }
    setIsCropping(false);
  };

  // Remove Image
  const removeImage = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    const newPreviews = previews.filter((_, index) => index !== indexToRemove);
    setFiles(newFiles);
    setPreviews(newPreviews);
    if (thumbnailIndex === indexToRemove) setThumbnailIndex(0);
    else if (thumbnailIndex > indexToRemove) setThumbnailIndex(thumbnailIndex - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length < 2) return alert("You must upload at least 2 images (Thumbnail + 1 Gallery Image).");
    setIsSubmitting(true);

    const filesToUpload = [...files];
    const selectedThumbnail = filesToUpload.splice(thumbnailIndex, 1)[0];
    filesToUpload.unshift(selectedThumbnail);

    const uploadedImageUrls: string[] = [];
    for (const file of filesToUpload) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('venue_images').upload(fileName, file);
      
      if (uploadError) {
        alert("Upload failed.");
        setIsSubmitting(false);
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('venue_images').getPublicUrl(fileName);
      uploadedImageUrls.push(publicUrl);
    }

    const prices = [Number(formData.price_1), Number(formData.price_2), Number(formData.price_3)].filter(p => p > 0);
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

    // --- THE NEW AUTH CHECK & SAVE LOGIC ---
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("You must be logged in to list a venue.");
      setIsSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase.from('venues').insert([{ 
      owner_id: session.user.id, // Links this venue to the logged-in owner
      name: formData.name, street: formData.street, area: formData.area, city: formData.city,
      description: formData.description, phone: formData.phone, email: formData.email,
      price_1: formData.price_1 || null, price_2: formData.price_2 || null, price_3: formData.price_3 || null,
      starting_price: startingPrice, images: uploadedImageUrls 
    }]);

    if (dbError) {
      alert("Database Error.");
      setIsSubmitting(false);
      return;
    }
    
    // Route to Dashboard instead of Homepage
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#4A000F] text-[#F8F6F0] font-sans flex flex-col pb-12 relative">
      
      {/* CROPPER MODAL */}
      {isCropping && cropIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#1a1a1a] p-4 rounded-lg border border-[#D4AF37]">
            <h3 className="text-[#D4AF37] font-bold text-lg mb-4 text-center">Drag to Move & Adjust Size</h3>
            
            <div className="relative w-full h-[400px] bg-black rounded">
              <Cropper
                image={previews[cropIndex]}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9} 
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-6 flex items-center gap-4 px-4">
              <span className="text-white font-bold">-</span>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
              <span className="text-white font-bold">+</span>
            </div>

            <div className="flex justify-between mt-6 gap-4">
              <button onClick={() => setIsCropping(false)} className="w-full py-3 bg-red-600/20 text-red-500 font-bold rounded hover:bg-red-600/40 transition">Cancel</button>
              <button onClick={confirmCrop} className="w-full py-3 bg-[#D4AF37] text-[#4A000F] font-bold rounded hover:brightness-110 transition">Save Adjustments</button>
            </div>
          </div>
        </div>
      )}

      {/* STANDARD FORM WITH PREVIOUS LAYOUT */}
      <nav className="p-6 border-b border-[#D4AF37]/30 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-widest text-[#D4AF37] uppercase hover:opacity-80">
          Royal <span className="text-[#F8F6F0]">Venues</span>
        </Link>
        <span className="text-[#D4AF37] font-semibold">Partner Portal</span>
      </nav>

      <main className="flex-grow flex items-center justify-center p-4 md:p-6 mt-4 md:mt-8">
        <div className="w-full max-w-3xl bg-[#F8F6F0] rounded-lg shadow-2xl overflow-hidden border border-[#D4AF37]/50">
          <div className="bg-[#D4AF37] p-4 md:p-8 text-center">
            <h1 className="text-xl md:text-3xl font-bold text-[#4A000F]">Venue Registration</h1>
            <p className="text-[#4A000F]/80 text-xs md:text-sm mt-1 md:mt-2">All fields marked * are required.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-8 flex flex-col gap-6 text-[#4A000F]">
            
            {/* Section 1: Visuals */}
            <div className="bg-[#D4AF37]/10 p-4 md:p-6 rounded border border-[#D4AF37]/30">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-[#D4AF37]/30 pb-2">1. Visuals</h2>
              <p className="text-[10px] md:text-xs text-gray-600 mb-3">Upload up to 6 images. Click on an image to set it as your main thumbnail.</p>
              
              <div className="mb-4 md:mb-6 relative">
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={files.length >= 6} />
                <div className={`w-full p-3 md:p-4 text-sm md:text-base text-center border-2 border-dashed rounded font-bold transition-colors ${files.length >= 6 ? 'border-gray-400 text-gray-400 bg-gray-100' : 'border-[#D4AF37] text-[#D4AF37] bg-white hover:bg-[#D4AF37]/5'}`}>
                  {files.length >= 6 ? "Maximum 6 images reached" : "+ Click to Select Images"}
                </div>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                  {previews.map((preview, index) => (
                    <div key={index} className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 md:border-4 transition-all ${thumbnailIndex === index ? 'border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.6)]' : 'border-transparent hover:border-[#D4AF37]/50'}`}>
                      <img src={preview} onClick={() => setThumbnailIndex(index)} className="w-full h-full object-cover" />
                      
                      {thumbnailIndex === index && (
                        <div className="absolute top-0 left-0 w-full bg-[#D4AF37] text-[#4A000F] text-[8px] md:text-[10px] font-bold text-center py-1 uppercase tracking-widest">Thumbnail</div>
                      )}

                      <button type="button" onClick={(e) => { e.stopPropagation(); openCropper(index); }} className="absolute bottom-1 left-1 bg-black/80 text-[#D4AF37] text-[10px] md:text-xs font-bold px-2 py-1 rounded backdrop-blur hover:bg-black">
                        ✂️ Adjust
                      </button>

                      <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full text-[10px] md:text-xs font-bold flex items-center justify-center hover:bg-red-700">X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Venue Name *</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="e.g. The Pearl Banquet" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Description / Details *</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="Describe your hall, special features, parking, etc..." />
              </div>
            </div>

            {/* Section 3: Exact Location */}
            <div className="bg-[#D4AF37]/10 p-4 md:p-6 rounded border border-[#D4AF37]/30">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-[#D4AF37]/30 pb-2">2. Exact Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Street Address *</label>
                  <input required type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" placeholder="123 Main Road" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Area / Society *</label>
                  <input required type="text" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" placeholder="Johar Town" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">City *</label>
                  <input required type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" placeholder="Lahore" />
                </div>
              </div>
            </div>

            {/* Section 4: Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Phone Number *</label>
                <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="03XX-XXXXXXX" />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">Email (Optional)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none focus:ring-1 focus:ring-[#D4AF37]" placeholder="owner@venue.com" />
              </div>
            </div>

            {/* Section 5: Pricing */}
            <div className="bg-[#D4AF37]/10 p-4 md:p-6 rounded border border-[#D4AF37]/30">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 border-b border-[#D4AF37]/30 pb-2">3. Pricing (Per Head)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">1 Dish Price (PKR)</label>
                  <input type="number" value={formData.price_1} onChange={(e) => setFormData({...formData, price_1: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" placeholder="1500" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">2 Dish Price (PKR)</label>
                  <input type="number" value={formData.price_2} onChange={(e) => setFormData({...formData, price_2: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" placeholder="2200" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold mb-1 md:mb-2">3 Dish Price (PKR)</label>
                  <input type="number" value={formData.price_3} onChange={(e) => setFormData({...formData, price_3: e.target.value})} className="w-full p-2.5 md:p-3 text-sm md:text-base border border-[#D4AF37]/50 rounded outline-none" placeholder="3000" />
                </div>
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="mt-2 w-full bg-[#4A000F] text-[#D4AF37] py-3 md:py-4 rounded font-bold text-base md:text-lg hover:bg-[#4A000F]/90 transition-colors shadow-lg disabled:opacity-50">
              {isSubmitting ? "Uploading Images..." : "Publish Venue to Directory"}
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
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      const file = new File([blob], fileName, { type: "image/jpeg" });
      resolve(file);
    }, "image/jpeg");
  });
}