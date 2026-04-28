"use client";

import { useState } from "react";

export default function NavModals() {
  const [activeModal, setActiveModal] = useState<"about" | "contact" | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <>
      {/* Sleek Minimalist Navbar Buttons */}
      <div className="flex gap-4 md:gap-6 items-center">
        <button 
          onClick={() => setActiveModal("about")}
          className="text-xs md:text-sm font-medium tracking-wide text-[#F8F6F0]/80 hover:text-[#D4AF37] transition-colors duration-300"
        >
          About Us
        </button>
        <button 
          onClick={() => setActiveModal("contact")}
          className="text-xs md:text-sm px-6 py-2 bg-[#D4AF37] text-[#4A000F] font-semibold tracking-wide rounded-full shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] hover:-translate-y-0.5 transition-all duration-300"
        >
          Contact
        </button>
      </div>

      {/* Modal Overlay (Darker, softer blur) */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a0005]/80 backdrop-blur-md animate-in fade-in duration-300">
          
          {/* Modal Card - Clean, Rounded, No Harsh Borders */}
          <div className="bg-[#F8F6F0] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 relative text-[#4A000F]">
            
            {/* Minimal Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 text-[#4A000F] hover:bg-black/10 transition-colors duration-300 z-10"
            >
              ✕
            </button>

            {/* --- About Modal --- */}
            {activeModal === "about" && (
              <div className="p-8 md:p-10">
                <h2 className="text-2xl font-semibold tracking-tight text-[#4A000F] mb-6">
                  About <span className="text-[#D4AF37]">Royal Venues</span>
                </h2>
                <div className="space-y-5 text-sm leading-relaxed text-gray-600">
                  <p>
                    Developed as a comprehensive <span className="font-semibold text-[#D4AF37]">University Project</span>, this platform reimagines the event management space.
                  </p>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                    <p className="mb-2"><strong className="text-[#4A000F] font-medium">Developed By:</strong> <br/>[Ali Ammar / Tayyab Saghir]</p>
                    <p className="mb-2"><strong className="text-[#4A000F] font-medium">Course:</strong> <br/>[Web Engineering]</p>
                    <p><strong className="text-[#4A000F] font-medium">Objective:</strong> <br/>To engineer a seamless, high-end digital experience for booking luxury event spaces.</p>
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    
                  </p>
                </div>
              </div>
            )}

            {/* --- Contact Modal --- */}
            {activeModal === "contact" && (
              <div className="p-8 md:p-10">
                <h2 className="text-2xl font-semibold tracking-tight text-[#4A000F] mb-2">
                  Get In Touch
                </h2>
                <p className="mb-8 text-sm text-gray-500">Reach out for business inquiries or project details.</p>
                
                <div className="space-y-4">
                  {/* Clean Contact Rows */}
                  <div className="group flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-black/5 hover:border-[#D4AF37]/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Email</span>
                      <span className="font-medium text-sm">ranaaliammarrajput@gmail.com</span>
                    </div>
                    <button onClick={() => handleCopy("ranaliammarrajput@gmail.com", "email")} className="text-xs font-semibold text-[#D4AF37] hover:text-[#4A000F] transition-colors">
                      {copiedItem === "email" ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="group flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-black/5 hover:border-[#D4AF37]/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Phone</span>
                      <span className="font-medium text-sm">+92 325 9735356</span>
                    </div>
                    <button onClick={() => handleCopy("+923259735356", "phone")} className="text-xs font-semibold text-[#D4AF37] hover:text-[#4A000F] transition-colors">
                      {copiedItem === "phone" ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="group flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-black/5 hover:border-[#D4AF37]/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1 text-green-600">WhatsApp</span>
                      <a href="https://wa.me/923259735356" target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline">Chat with us ↗</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}