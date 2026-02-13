// components/Logo.jsx or in your layout/page
import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/white-logo.png"  // Note: starts with "/" for public folder
      alt="Your Logo"
      width={150}  // Adjust based on your logo size
      height={50}  // Adjust based on your logo size
      priority
    />
  );
}