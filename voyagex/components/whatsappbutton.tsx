// components/WhatsAppButton.tsx
'use client';
import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
  return (
    <a
      href="https://wa.me/923199052314?text=Hello, I want to inquire about VoyageX services."
      target="_blank"
      rel="noreferrer"
      className="
        fixed
        bottom-5
        right-5
        w-[60px]
        h-[60px]
        bg-[#25D366]
        rounded-full
        shadow-lg
        flex
        items-center
        justify-center
        text-white
        text-2xl
        hover:bg-green-600
        transition-all
        z-50
      "
    >
      <FaWhatsapp />
    </a>
  );
};

export default WhatsAppButton;