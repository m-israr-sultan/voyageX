  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";
  import Image from "next/image";
  import Link from "next/link";

  export default function RegisterAsPage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = (role: string) => {
      setSelectedRole(role);
      setIsLoading(true);
      
      // Navigate to respective registration form
      switch(role) {
        case "tourist":
          router.push("/register/tourist");
          break;
        case "agency":
          router.push("/register/agency");
          break;
        case "guide":
          router.push("/register/guide");
          break;
        default:
          break;
      }
    };

    return (
      <div className="min-h-screen bg-[#008A1E] flex flex-col justify-center items-center px-4 py-8">
        {/* Header */}
        <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold text-center mt-8 lg:mt-[50px] mb-8 lg:mb-[47px]">
          SIGN UP AS
        </h1>

        {/* Cards Container */}
        <div className="w-full max-w-[1156px] bg-white rounded-3xl shadow-2xl p-6 lg:p-[54px] flex flex-col lg:flex-row gap-6 lg:gap-8 mx-auto">
          
          {/* Tourist Card */}
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
            <h3 className="text-2xl lg:text-3xl font-semibold text-gray-900">Tourist</h3>
            <div className="relative w-[180px] h-[200px] lg:w-[204px] lg:h-[235px] my-8 lg:my-[42px]">
              <Image
                src="/OBJECTS1.png"
                alt="Tourist"
                fill
                className="object-contain"
              />
            </div>
            <button
              onClick={() => handleContinue("tourist")}
              disabled={isLoading && selectedRole === "tourist"}
              className="w-[160px] lg:w-[192px] h-[50px] lg:h-[62px] bg-[#008A1E] text-white text-lg lg:text-2xl font-medium rounded-2xl px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-center gap-2 hover:bg-[#006816] transition-colors disabled:opacity-50"
            >
              Continue
              <svg className="w-4 h-4 lg:w-[18.67px] lg:h-4" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.7071 8.70711C19.0976 8.31658 19.0976 7.68342 18.7071 7.29289L12.3431 0.928932C11.9526 0.538408 11.3195 0.538408 10.9289 0.928932C10.5384 1.31946 10.5384 1.95262 10.9289 2.34315L16.5858 8L10.9289 13.6569C10.5384 14.0474 10.5384 14.6805 10.9289 15.0711C11.3195 15.4616 11.9526 15.4616 12.3431 15.0711L18.7071 8.70711ZM0 9H18V7H0V9Z" fill="white"/>
              </svg>
            </button>
          </div>

          {/* Agency Card */}
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-200">
            <h3 className="text-2xl lg:text-3xl font-semibold text-gray-900">Agency</h3>
            <div className="relative w-[200px] h-[160px] lg:w-[245px] lg:h-[196px] my-8 lg:my-[65px]">
              <Image
                src="/OBJECTS2.png"
                alt="Agency"
                fill
                className="object-contain"
              />
            </div>
            <button
              onClick={() => handleContinue("agency")}
              disabled={isLoading && selectedRole === "agency"}
              className="w-[160px] lg:w-[192px] h-[50px] lg:h-[62px] bg-[#008A1E] text-white text-lg lg:text-2xl font-medium rounded-2xl px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-center gap-2 hover:bg-[#006816] transition-colors disabled:opacity-50"
            >
              Continue
              <svg className="w-4 h-4 lg:w-[18.67px] lg:h-4" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.7071 8.70711C19.0976 8.31658 19.0976 7.68342 18.7071 7.29289L12.3431 0.928932C11.9526 0.538408 11.3195 0.538408 10.9289 0.928932C10.5384 1.31946 10.5384 1.95262 10.9289 2.34315L16.5858 8L10.9289 13.6569C10.5384 14.0474 10.5384 14.6805 10.9289 15.0711C11.3195 15.4616 11.9526 15.4616 12.3431 15.0711L18.7071 8.70711ZM0 9H18V7H0V9Z" fill="white"/>
              </svg>
            </button>
          </div>

          {/* Guide Card */}
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
            <h3 className="text-2xl lg:text-3xl font-semibold text-gray-900">Guide</h3>
            <div className="relative w-[240px] h-[240px] lg:w-[280px] lg:h-[280px] my-4 lg:my-6">
              <Image
                src="/Guide 1.png"
                alt="Guide"
                fill
                className="object-contain"
              />
            </div>
            <button
              onClick={() => handleContinue("guide")}
              disabled={isLoading && selectedRole === "guide"}
              className="w-[160px] lg:w-[192px] h-[50px] lg:h-[62px] bg-[#008A1E] text-white text-lg lg:text-2xl font-medium rounded-2xl px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-center gap-2 hover:bg-[#006816] transition-colors disabled:opacity-50"
            >
              Continue
              <svg className="w-4 h-4 lg:w-[18.67px] lg:h-4" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.7071 8.70711C19.0976 8.31658 19.0976 7.68342 18.7071 7.29289L12.3431 0.928932C11.9526 0.538408 11.3195 0.538408 10.9289 0.928932C10.5384 1.31946 10.5384 1.95262 10.9289 2.34315L16.5858 8L10.9289 13.6569C10.5384 14.0474 10.5384 14.6805 10.9289 15.0711C11.3195 15.4616 11.9526 15.4616 12.3431 15.0711L18.7071 8.70711ZM0 9H18V7H0V9Z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }