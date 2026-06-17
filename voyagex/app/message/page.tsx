"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaEnvelope, FaSpinner, FaUser, FaBuilding, FaArrowLeft } from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { messagesApi } from "@/lib/api";
import { isLoggedIn, getUser } from "../../lib/auth";

export default function ConversationsPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchConversations();
  }, [router]);

  const fetchConversations = async () => {
    try {
      const response = await messagesApi.getConversations();
      const result = response.data;
      if (result.success && result.data) {
        const list = result.data.conversations || result.data || [];
        setConversations(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
  const resolveUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${BASE}/${path.replace(/^\//, "")}`;
  };

  const getRecipient = (conv: any) => {
    if (conv.users && currentUser) {
      return conv.users.find((u: any) => u.id !== currentUser.id) || conv.users[0];
    }
    return conv.recipient || null;
  };

  const getRecipientName = (conv: any): string => {
    const r = getRecipient(conv);
    if (!r) return "Unknown";
    if (r.role === "AGENCY") return r.agencies?.name || r.name || "Agency";
    const first = r.firstName || "";
    const last = r.lastName || "";
    const full = `${first} ${last}`.trim();
    return full || r.email || "User";
  };

  const getRecipientImage = (conv: any): string => {
    const r = getRecipient(conv);
    if (!r) return "/guid-placeholder.jpg";
    if (r.role === "AGENCY") {
      const logo = r.agencies?.logo || r.logo || "";
      return logo ? resolveUrl(logo) : "/agency-placeholder.jpg";
    }
    const avatar = r.avatar || r.guides?.coverImage || "";
    return avatar ? resolveUrl(avatar) : "/guid-placeholder.jpg";
  };

  const getRecipientRole = (conv: any): string => {
    const r = getRecipient(conv);
    if (!r) return "User";
    if (r.role === "AGENCY") return "Agency";
    if (r.role === "GUIDE") return "Guide";
    return "Traveler";
  };

  const getLastMessage = (conv: any): string => {
    if (conv.messages && conv.messages.length > 0) {
      return conv.messages[conv.messages.length - 1].content;
    }
    return "No messages yet";
  };

  const getLastMessageTime = (conv: any): string => {
    if (conv.messages && conv.messages.length > 0) {
      const last = conv.messages[conv.messages.length - 1];
      return new Date(last.createdAt).toLocaleDateString();
    }
    return conv.createdAt ? new Date(conv.createdAt).toLocaleDateString() : "";
  };

  const hasUnread = (conv: any): boolean => {
    if (!conv.messages) return false;
    return conv.messages.some((m: any) => !m.isRead && m.senderId !== currentUser?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-500">Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          {conversations.length > 0 && (
            <span className="text-sm text-gray-500">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <FaEnvelope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No conversations yet</h3>
            <p className="text-gray-500 mt-1">When you message a guide or agency, your conversations will appear here</p>
            <button
              onClick={() => router.push("/guide")}
              className="mt-6 px-6 py-3 bg-[#008A1E] text-white rounded-xl hover:bg-[#006816] transition-colors"
            >
              Find a Guide
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const unread = hasUnread(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/message/${conv.id}`)}
                  className={`w-full bg-white p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 text-left border-b border-gray-100 last:border-b-0 rounded-lg ${unread ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={getRecipientImage(conv)}
                      alt={getRecipientName(conv)}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }}
                    />
                    {unread && (
                      <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`${unread ? 'font-bold' : 'font-semibold'} text-gray-900`}>
                          {getRecipientName(conv)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          getRecipientRole(conv) === "AGENCY" 
                            ? "bg-purple-100 text-purple-700" 
                            : getRecipientRole(conv) === "Guide"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {getRecipientRole(conv)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{getLastMessageTime(conv)}</span>
                    </div>
                    <p className={`text-sm mt-1 truncate ${unread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {getLastMessage(conv)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}