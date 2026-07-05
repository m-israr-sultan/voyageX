"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { FaPlus, FaTimes } from "react-icons/fa";

// Country data
const countries = [
  { code: "+1", name: "United States", flag: "/US flag.png" },
  { code: "+44", name: "United Kingdom", flag: "/UK flag.png" },
  { code: "+92", name: "Pakistan", flag: "/PK flag.png" },
  { code: "+91", name: "India", flag: "/IN flag.png" },
  { code: "+86", name: "China", flag: "/CN flag.png" },
  { code: "+81", name: "Japan", flag: "/JP flag.png" },
  { code: "+49", name: "Germany", flag: "/DE flag.png" },
  { code: "+33", name: "France", flag: "/FR flag.png" },
  { code: "+39", name: "Italy", flag: "/IT flag.png" },
  { code: "+34", name: "Spain", flag: "/ES flag.png" },
  { code: "+61", name: "Australia", flag: "/AU flag.png" },
  { code: "+55", name: "Brazil", flag: "/BR flag.png" },
  { code: "+7", name: "Russia", flag: "/RU flag.png" },
  { code: "+82", name: "South Korea", flag: "/KR flag.png" },
  { code: "+20", name: "Egypt", flag: "/EG flag.png" },
  { code: "+27", name: "South Africa", flag: "/ZA flag.png" },
  { code: "+52", name: "Mexico", flag: "/MX flag.png" },
  { code: "+54", name: "Argentina", flag: "/AR flag.png" },
];

// Northern Regions for validation
const northernRegions = [
  "HUNZA", "SKARDU", "GILGIT", "NAGAR", "GHIZER", "SWAT", "KALAM", 
  "CHITRAL", "NARAN", "KAGHAN", "MURREE", "ABBOTTABAD", "NEELUM_VALLEY", 
  "MUZAFFARABAD", "RAWALAKOT"
];

export default function GuideRegistrationPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries[2]);
  
  // Tag states for languages and specialities
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [specialities, setSpecialities] = useState<string[]>([]);
  const [specialityInput, setSpecialityInput] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    location: "",
    region: "",
    bio: "",
    password: "",
    agreeTerms: false,
  });
  
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    location: "",
    region: "",
    languages: "",
    specialities: "",
    password: "",
  });
  
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone.replace(/\D/g, ""));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
    setApiError("");
    setSuccessMessage("");
  };

  const addLanguage = () => {
    const trimmed = languageInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setLanguageInput("");
      setErrors({ ...errors, languages: "" });
    } else if (trimmed && languages.includes(trimmed)) {
      setErrors({ ...errors, languages: "This language already exists" });
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  const addSpeciality = () => {
    const trimmed = specialityInput.trim();
    if (trimmed && !specialities.includes(trimmed)) {
      setSpecialities([...specialities, trimmed]);
      setSpecialityInput("");
      setErrors({ ...errors, specialities: "" });
    } else if (trimmed && specialities.includes(trimmed)) {
      setErrors({ ...errors, specialities: "This speciality already exists" });
    }
  };

  const removeSpeciality = (spec: string) => {
    setSpecialities(specialities.filter(s => s !== spec));
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      cnic: "",
      location: "",
      region: "",
      languages: "",
      specialities: "",
      password: "",
    };
    let hasError = false;

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
      hasError = true;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
      hasError = true;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
      hasError = true;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Invalid phone number";
      hasError = true;
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = "CNIC is required";
      hasError = true;
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
      hasError = true;
    }

    if (!formData.region) {
      newErrors.region = "Please select a region (Northern Areas only)";
      hasError = true;
    } else if (!northernRegions.includes(formData.region)) {
      newErrors.region = "Region must be a Northern Area (Hunza, Skardu, Gilgit, Swat, etc.)";
      hasError = true;
    }

    if (languages.length === 0) {
      newErrors.languages = "At least one language is required";
      hasError = true;
    }

    if (specialities.length === 0) {
      newErrors.specialities = "At least one speciality is required";
      hasError = true;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    }

    if (!formData.agreeTerms) {
      alert("Please agree to Terms of use and Privacy Policy");
      return;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const response = await authApi.registerGuide({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        languages: languages,
        specialities: specialities,
        location: formData.location,
        region: formData.region,
        bio: formData.bio,
      });

      const result = response.data;

      if (result.success) {
        setSuccessMessage("Registration successful! Please check your email for OTP verification.");
        sessionStorage.setItem("resetContact", formData.email);
        setTimeout(() => {
          router.push("/otp");
        }, 2000);
      } else {
        setApiError(result.message || "Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      const message = error.response?.data?.message || error.message || "Registration failed.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#008A1E] flex flex-row justify-start items-start pt-[53px] px-4 lg:px-0 overflow-x-hidden">
      <button onClick={() => router.back()} className="ml-4 lg:ml-[84px] flex-shrink-0">
        <svg className="w-7 h-6 transform rotate-180" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M27.0607 13.0607C27.6464 12.4749 27.6464 11.5251 27.0607 10.9393L17.5147 1.3934C16.9289 0.807611 15.9792 0.807611 15.3934 1.3934C14.8076 1.97919 14.8076 2.92893 15.3934 3.51472L23.8787 12L15.3934 20.4853C14.8076 21.0711 14.8076 22.0208 15.3934 22.6066C15.9792 23.1924 16.9289 23.1924 17.5147 22.6066L27.0607 13.0607ZM0 13.5H26V10.5H0V13.5Z" fill="white"/>
        </svg>
      </button>

      <div className="w-full max-w-[743px] bg-white rounded-2xl p-6 lg:p-8 lg:pl-[90px] lg:pr-[90px] mx-4 lg:mx-0">
        <h1 className="text-2xl lg:text-3xl font-medium text-gray-900 mb-6">Sign up for Guide</h1>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        {apiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className={`w-full h-14 px-4 rounded-xl border ${errors.firstName ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className={`w-full h-14 px-4 rounded-xl border ${errors.lastName ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              className={`w-full h-14 px-4 rounded-xl border ${errors.email ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone number *</label>
            <div className="relative">
              <button type="button" onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-gray-100 px-2 py-1.5 rounded-lg hover:bg-gray-200 z-10">
                <Image src={selectedCountry.flag} alt={selectedCountry.name} width={24} height={16} className="object-contain" />
                <span className="text-sm font-medium">{selectedCountry.code}</span>
                <svg className={`w-4 h-4 transition-transform ${showCountryDropdown ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none">
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className={`w-full h-14 pl-[130px] pr-4 rounded-xl border ${errors.phone ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
              {showCountryDropdown && (
                <div className="absolute top-full left-3 mt-1 w-64 max-h-60 overflow-y-auto bg-white border rounded-xl shadow-lg z-50">
                  {countries.map((country) => (
                    <button key={country.code} type="button" onClick={() => handleCountrySelect(country)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                      <Image src={country.flag} alt={country.name} width={24} height={16} className="object-contain" />
                      <span className="text-sm font-medium">{country.code}</span>
                      <span className="text-sm text-gray-600">{country.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNIC *</label>
            <input type="text" name="cnic" value={formData.cnic} onChange={handleChange} placeholder="12345-1234567-1"
              className={`w-full h-14 px-4 rounded-xl border ${errors.cnic ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
            {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (City/Town) *</label>
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Karimabad, Hunza"
              className={`w-full h-14 px-4 rounded-xl border ${errors.location ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region (Northern Areas) *</label>
            <select name="region" value={formData.region} onChange={handleChange}
              className={`w-full h-14 px-4 rounded-xl border ${errors.region ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`}>
              <option value="">Select Region</option>
              <option value="HUNZA">Hunza Valley</option>
              <option value="SKARDU">Skardu</option>
              <option value="GILGIT">Gilgit</option>
              <option value="NAGAR">Nagar</option>
              <option value="GHIZER">Ghizer</option>
              <option value="SWAT">Swat</option>
              <option value="KALAM">Kalam</option>
              <option value="CHITRAL">Chitral</option>
              <option value="NARAN">Naran</option>
              <option value="KAGHAN">Kaghan</option>
              <option value="MURREE">Murree</option>
              <option value="ABBOTTABAD">Abbottabad</option>
              <option value="NEELUM_VALLEY">Neelum Valley</option>
              <option value="MUZAFFARABAD">Muzaffarabad</option>
              <option value="RAWALAKOT">Rawalakot</option>
            </select>
            {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {languages.map((lang) => (
                <span key={lang} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm">
                  {lang}
                  <button type="button" onClick={() => removeLanguage(lang)} className="hover:text-red-500">
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
                placeholder="Type language (e.g., English, Urdu) and press Enter"
                className="flex-1 h-14 px-4 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008A1E]" />
              <button type="button" onClick={addLanguage} className="px-4 h-14 bg-gray-100 rounded-xl hover:bg-gray-200">
                <FaPlus />
              </button>
            </div>
            {errors.languages && <p className="text-red-500 text-xs mt-1">{errors.languages}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialities *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {specialities.map((spec) => (
                <span key={spec} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                  {spec}
                  <button type="button" onClick={() => removeSpeciality(spec)} className="hover:text-red-500">
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={specialityInput} onChange={(e) => setSpecialityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpeciality())}
                placeholder="Type speciality (e.g., Hiking, Photography) and press Enter"
                className="flex-1 h-14 px-4 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008A1E]" />
              <button type="button" onClick={addSpeciality} className="px-4 h-14 bg-gray-100 rounded-xl hover:bg-gray-200">
                <FaPlus />
              </button>
            </div>
            {errors.specialities && <p className="text-red-500 text-xs mt-1">{errors.specialities}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3}
              placeholder="Tell travelers about yourself, your experience, and what makes your tours special..."
              className="w-full px-4 py-3 rounded-xl border border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008A1E] resize-none" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-2 text-sm text-gray-600">
                <Image src="/icon.png" alt="" width={18} height={16} />
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
              className={`w-full h-14 px-4 rounded-xl border ${errors.password ? "border-red-500" : "border-gray-400"} focus:outline-none focus:ring-2 focus:ring-[#008A1E]`} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            <p className="text-xs text-gray-500 mt-1">Use 8 or more characters with a mix of letters, numbers & symbols</p>
          </div>

          <div className="flex items-start gap-3 mt-4">
            <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
              className="w-5 h-5 mt-0.5 rounded border-gray-300 text-[#008A1E] focus:ring-[#008A1E]" />
            <label className="text-sm lg:text-base text-gray-800">
              By creating an account, I agree to our{" "}
              <span className="text-[#0B7693] cursor-pointer hover:underline">Terms of use</span> and{" "}
              <span className="text-[#0B7693] cursor-pointer hover:underline">Privacy Policy</span>
            </label>
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full h-14 bg-[#008A1E] text-white text-xl lg:text-2xl font-medium rounded-2xl px-8 py-4 flex items-center justify-center gap-2 hover:bg-[#006816] transition-colors disabled:opacity-50 mt-6">
            {isLoading ? "Signing up..." : "Sign up"}
            <svg className="w-[18.67px] h-4" viewBox="0 0 19 16" fill="none">
              <path d="M18.7071 8.70711C19.0976 8.31658 19.0976 7.68342 18.7071 7.29289L12.3431 0.928932C11.9526 0.538408 11.3195 0.538408 10.9289 0.928932C10.5384 1.31946 10.5384 1.95262 10.9289 2.34315L16.5858 8L10.9289 13.6569C10.5384 14.0474 10.5384 14.6805 10.9289 15.0711C11.3195 15.4616 11.9526 15.4616 12.3431 15.0711L18.7071 8.70711ZM0 9H18V7H0V9Z" fill="white"/>
            </svg>
          </button>

          <p className="text-center lg:text-right text-gray-500 text-base lg:text-lg mt-4">
            Already have Account{" "}
            <Link href="/login" className="text-[#008A1E] hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}