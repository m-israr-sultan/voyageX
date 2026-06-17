"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaUpload, 
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaImage,
  FaInfoCircle,
} from "react-icons/fa";
import { verificationsApi, uploadApi } from "@/lib/api";
import { compressDocument } from "@/lib/imageCompression";

export default function AgencyVerificationPage() {
  const [checklist, setChecklist] = useState<any>(null);
  const [myDocs, setMyDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("success");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<string>("");
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [checklistRes, docsRes] = await Promise.all([
        verificationsApi.getMyChecklist(), 
        verificationsApi.getMyDocuments()
      ]);
      if (checklistRes.data.success) setChecklist(checklistRes.data.data);
      if (docsRes.data.success) setMyDocs(docsRes.data.data || []);
    } catch (err: any) {
      console.error("Error fetching verification data:", err);
      setError(err.response?.data?.message || "Failed to load verification data");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (docType: string) => { 
    setUploadType(docType); 
    fileInputRef.current?.click(); 
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setMessageType("error");
      setMessage("Only JPG, PNG, or PDF files are allowed");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessageType("error");
      setMessage("File size must be less than 5MB");
      return false;
    }
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadType) return;
    
    if (!validateFile(file)) {
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    setUploading(uploadType);
    setMessage("");
    try {
      const fileToUpload = file.type.startsWith("image/")
        ? await compressDocument(file)
        : file;

      const formData = new FormData();
      formData.append("file", fileToUpload);
      const uploadRes = await uploadApi.uploadDocument(formData);
      if (uploadRes.data.success) {
        const fileUrl = uploadRes.data.data?.url || uploadRes.data.data || uploadRes.data?.path || "";
        const fileKey = uploadRes.data.data?.key || "";
        await verificationsApi.uploadDocuments({
          type: uploadType,
          fileUrl,
          fileKey,
          fileName: file.name,
          fileSize: fileToUpload.size,
          mimeType: fileToUpload.type,
        } as any);
        setMessageType("success");
        setMessage("Document uploaded! Pending admin review.");
        setTimeout(() => setMessage(""), 3000);
        fetchData();
      }
    } catch (err: any) { 
      setMessageType("error");
      setMessage(err.response?.data?.message || "Upload failed"); 
      setTimeout(() => setMessage(""), 3000);
    } finally { 
      setUploading(null); 
      setUploadType(""); 
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const getDocStatus = (docType: string) => {
    const doc = myDocs.find((d) => d.type === docType);
    if (!doc) return "MISSING";
    return doc.status;
  };

  const getDocFile = (docType: string) => {
    return myDocs.find((d) => d.type === docType);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": 
        return <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full"><FaCheckCircle className="w-3 h-3" /> Approved</span>;
      case "REJECTED": 
        return <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-0.5 rounded-full"><FaTimesCircle className="w-3 h-3" /> Rejected</span>;
      case "PENDING": 
        return <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium bg-yellow-50 px-2 py-0.5 rounded-full"><FaClock className="w-3 h-3" /> Pending Review</span>;
      default: 
        return <span className="inline-flex items-center gap-1 text-gray-400 text-xs font-medium bg-gray-50 px-2 py-0.5 rounded-full"><FaExclamationTriangle className="w-3 h-3" /> Not Uploaded</span>;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith("image/")) return <FaImage className="w-4 h-4" />;
    return <FaFileAlt className="w-4 h-4" />;
  };

  const requiredDocs = [
    { type: "CNIC_FRONT", label: "Owner CNIC Front", icon: "🪪", description: "Clear photo of business owner's CNIC front side" },
    { type: "CNIC_BACK", label: "Owner CNIC Back", icon: "🪪", description: "Clear photo of business owner's CNIC back side" },
    { type: "NOC", label: "NOC Certificate (Required)", icon: "📋", description: "No Objection Certificate from Tourism Department — mandatory for agencies" },
    { type: "RECOMMENDATION_LETTER", label: "Business Registration", icon: "📄", description: "SECP registration or chamber of commerce certificate" },
  ];

  const optionalDocs = [
    { type: "CERTIFICATE", label: "Tax Certificate (NTN)", icon: "🏛️", description: "FBR tax certificate (recommended)" },
    { type: "BUSINESS_LICENSE", label: "Additional License", icon: "📜", description: "Any other business license or permit" },
  ];

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
          <div className="h-2 bg-gray-100 rounded-full animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="divide-y">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div>
                    <div className="h-4 w-32 bg-gray-200 rounded mb-1 animate-pulse"></div>
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agency Verification</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Submit documents to get your agency verified</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load verification data</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const approvedCount = requiredDocs.filter((d) => getDocStatus(d.type) === "APPROVED").length;
  const totalRequired = requiredDocs.length;
  const isFullyVerified = approvedCount === totalRequired;
  const progressPercentage = (approvedCount / totalRequired) * 100;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agency Verification</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Submit documents to get your agency verified</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          messageType === "success" ? "bg-green-100 text-green-700" : 
          messageType === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
        }`}>
          {messageType === "success" && <FaCheckCircle className="w-4 h-4" />}
          {messageType === "error" && <FaExclamationTriangle className="w-4 h-4" />}
          {messageType === "info" && <FaInfoCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* Verification Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Verification Progress</h2>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isFullyVerified ? "bg-green-500" : "bg-[#008A1E]"}`}
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
          <span className="text-sm font-medium text-gray-600">{approvedCount}/{totalRequired}</span>
        </div>
        {isFullyVerified ? (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-2">
            <FaCheckCircle className="w-3 h-3" /> Congratulations! Your agency is verified.
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-2">
            Upload all {totalRequired} required documents to get your agency verified badge
          </p>
        )}
      </div>

      {/* Required Documents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-900">Required Documents ({totalRequired})</h2>
          <p className="text-xs text-gray-500 mt-0.5">Mandatory for agency verification</p>
        </div>
        <div className="divide-y divide-gray-100">
          {requiredDocs.map((doc) => {
            const status = getDocStatus(doc.type);
            const isUploaded = status !== "MISSING";
            const docFile = getDocFile(doc.type);
            return (
              <div key={doc.type} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{doc.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                    <p className="text-xs text-gray-500">{doc.description}</p>
                    <div className="mt-1">{getStatusBadge(status)}</div>
                    {status === "REJECTED" && docFile?.adminNote && (
                      <p className="text-xs text-red-600 mt-1">Reason: {docFile.adminNote}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {docFile && status !== "MISSING" && (
                    <button
                      onClick={() => setPreviewDoc(docFile)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1"
                    >
                      <FaEye className="w-3 h-3" /> View
                    </button>
                  )}
                  {(!isUploaded || status === "REJECTED") && (
                    <button 
                      onClick={() => handleUploadClick(doc.type)} 
                      disabled={uploading === doc.type}
                      className="px-3 py-1.5 bg-[#008A1E] text-white rounded-lg text-xs font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {uploading === doc.type ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaUpload className="w-3 h-3" />}
                      {status === "REJECTED" ? "Re-upload" : "Upload"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Documents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-900">Optional Documents</h2>
          <p className="text-xs text-gray-500 mt-0.5">Recommended for faster verification</p>
        </div>
        <div className="divide-y divide-gray-100">
          {optionalDocs.map((doc) => {
            const status = getDocStatus(doc.type);
            const docFile = getDocFile(doc.type);
            return (
              <div key={doc.type} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{doc.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                    <p className="text-xs text-gray-500">{doc.description}</p>
                    <div className="mt-1">{getStatusBadge(status)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {docFile && status !== "MISSING" && (
                    <button
                      onClick={() => setPreviewDoc(docFile)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1"
                    >
                      <FaEye className="w-3 h-3" /> View
                    </button>
                  )}
                  {(status === "MISSING" || status === "REJECTED") && (
                    <button 
                      onClick={() => handleUploadClick(doc.type)} 
                      disabled={uploading === doc.type}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {uploading === doc.type ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaUpload className="w-3 h-3" />}
                      {status === "REJECTED" ? "Re-upload" : "Upload"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Why Get Verified?</h4>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Get a "Verified Agency" badge on your profile</li>
              <li>• Appear higher in search results</li>
              <li>• Build trust with travelers</li>
              <li>• Access to premium features and priority support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileUpload} className="hidden" />

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Document Preview</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto max-h-[60vh]">
              <p className="text-sm text-gray-600 mb-3">
                <strong>Type:</strong> {previewDoc.type?.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Status:</strong> {previewDoc.status}
              </p>
              {previewDoc.fileUrl && (
                previewDoc.mimeType?.startsWith("image/") ? (
                  <img src={previewDoc.fileUrl} alt="Document" className="w-full rounded-lg border" />
                ) : (
                  <a 
                    href={previewDoc.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm"
                  >
                    <FaFileAlt className="w-4 h-4" /> Open Document
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}