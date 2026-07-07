"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import { receiptsApi } from "@/lib/api";

export default function VerifyReceiptPage() {
  const params = useParams();
  const token = params.token as string;
  const [result, setResult] = useState<{
    valid: boolean;
    status: string;
    receiptNumber?: string;
    receiptType?: string;
    voyagexReference?: string;
    generatedAt?: string;
    metadata?: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await receiptsApi.verify(token);
        setResult(response.data?.data ?? response.data);
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setError(message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };
    if (token) verify();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Verification Error</h1>
          <p className="text-sm text-gray-500 mt-2">{error || "Unable to verify receipt"}</p>
        </div>
      </div>
    );
  }

  const isValid = result.valid && result.status === "VALID";
  const meta = result.metadata as Record<string, string | number> | undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-lg w-full shadow-sm">
        <div className="text-center mb-6">
          {isValid ? (
            <FaCheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
          ) : (
            <FaTimesCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
          )}
          <h1 className="text-2xl font-bold text-gray-900">
            {isValid ? "Valid Receipt" : result.status === "INVALID" ? "Invalid Receipt" : result.status}
          </h1>
          <p className="text-sm text-gray-500 mt-1">VoyageX Receipt Verification</p>
        </div>

        <div className="space-y-3 text-sm">
          {result.receiptNumber && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Receipt Number</span>
              <span className="font-medium">{result.receiptNumber}</span>
            </div>
          )}
          {result.receiptType && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">{result.receiptType}</span>
            </div>
          )}
          {result.voyagexReference && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Reference</span>
              <span className="font-medium text-xs">{result.voyagexReference}</span>
            </div>
          )}
          {meta?.grossAmount !== undefined && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Amount</span>
              <span className="font-medium">Rs {Number(meta.grossAmount).toLocaleString()}</span>
            </div>
          )}
          {result.generatedAt && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Generated</span>
              <span className="font-medium">{new Date(result.generatedAt).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Status</span>
            <span className={`font-medium ${isValid ? "text-green-600" : "text-red-600"}`}>
              {result.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
