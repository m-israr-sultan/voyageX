"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaPaperPlane,
  FaArrowLeft,
  FaEnvelope,
  FaCheck,
  FaCheckDouble,
  FaEllipsisV,
  FaStar,
  FaMapMarkerAlt,
  FaUser,
  FaBuilding,
  FaBriefcase,
} from "react-icons/fa";

import { messagesApi } from "@/lib/api";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { getUser } from "@/lib/auth";
import { getImageUrl } from "@/lib/image-utils";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  _pending?: boolean;   // optimistic — not yet confirmed by server
  _failed?: boolean;    // send failed, can retry
  _tempId?: string;     // client-side temp ID before server assigns real ID
}

interface Conversation {
  id: string;
  recipient: any;
  messages: Message[];
}

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const currentUser = getUser();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const conversationId = params.id as string;

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const response = await messagesApi.getMessages(conversationId);
      const result = response.data;
      if (result.success && result.data) {
        const messagesList = result.data.messages || result.data || [];
        const users = result.data.users || [];
        const otherUser = users.find((u: any) => u.id !== currentUser?.id) || result.data.recipient || {};
        setConversation((prev) => ({
          id: conversationId,
          recipient: prev?.recipient ?? otherUser,
          // Keep pending/failed local messages that haven't been confirmed yet
          messages: [
            ...((Array.isArray(messagesList) ? messagesList : []) as Message[]),
            ...((prev?.messages ?? []) as Message[]).filter((m) => m._pending || m._failed),
          ],
        }));
      } else if (!silent) {
        setError(result.message || "Conversation not found");
      }
    } catch (err: any) {
      if (!silent) {
        setError(err.response?.data?.message || err.message || "Failed to load conversation. Please try again.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [conversationId, currentUser?.id]);

  // Initial load
  useEffect(() => {
    if (conversationId) loadMessages(false);
  }, [conversationId, loadMessages]);

  // Visibility-aware polling — sync new messages every 20 s when tab is active
  useEffect(() => {
    const startPoll = () => {
      if (pollRef.current) return;
      pollRef.current = setInterval(() => {
        if (document.visibilityState === "visible") loadMessages(true);
      }, 20_000);
    };
    const stopPoll = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
    const onVisibility = () => document.visibilityState === "visible" ? startPoll() : stopPoll();

    startPoll();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stopPoll(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [loadMessages]);

  // Reload messages on reconnect
  useEffect(() => {
    const onOnline = () => loadMessages(true);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  useEffect(() => {
    if (!loading) messageInputRef.current?.focus();
  }, [loading]);

  const trySend = async (content: string, tempId: string, attempt = 0): Promise<void> => {
    const MAX_SEND_RETRIES = 2;
    try {
      const response = await messagesApi.sendMessage({ conversationId, content });
      const result = response.data;
      if (result.success && result.data) {
        // Replace optimistic message with real one from server
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m._tempId === tempId ? { ...result.data, _pending: false } : m
            ),
          };
        });
      }
    } catch (err: any) {
      if (attempt < MAX_SEND_RETRIES) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        return trySend(content, tempId, attempt + 1);
      }
      // Mark as failed after exhausting retries
      setConversation((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m._tempId === tempId ? { ...m, _pending: false, _failed: true } : m
          ),
        };
      });
      setError("Message failed to send. Tap to retry.");
    }
  };

  const handleSendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !conversationId) return;
    setSending(true);
    setError(null);
    setNewMessage("");

    // Optimistic insertion
    const tempId = `temp_${Date.now()}`;
    const optimistic: Message = {
      id: tempId, _tempId: tempId,
      senderId: currentUser?.id ?? "",
      receiverId: "", content,
      createdAt: new Date().toISOString(),
      read: false, _pending: true,
    };
    setConversation((prev) => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);

    await trySend(content, tempId);
    setSending(false);
  };

  const handleRetryFailed = async (msg: Message) => {
    if (!msg._failed || !msg.content || !msg._tempId) return;
    setConversation((prev) => {
      if (!prev) return prev;
      return { ...prev, messages: prev.messages.map((m) => m._tempId === msg._tempId ? { ...m, _failed: false, _pending: true } : m) };
    });
    await trySend(msg.content, msg._tempId!);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const recipient = conversation?.recipient;
  const isAgency = recipient?.role === "AGENCY";
  const isGuide = recipient?.role === "GUIDE";
  const isTraveler = recipient?.role === "TRAVELER";

  const getRecipientName = (): string => {
    if (!recipient) return "";
    if (isAgency) return recipient.name || recipient.agencyName || "Agency";
    const first = recipient.firstName || "";
    const last = recipient.lastName || "";
    const full = `${first} ${last}`.trim();
    return full || recipient.email || "User";
  };

  const getRecipientImage = (): string => {
    if (!recipient) return "/guid-placeholder.jpg";
    if (isAgency) return recipient.logo ? getImageUrl(recipient.logo) : "/agency-placeholder.jpg";
    return recipient.avatar ? getImageUrl(recipient.avatar) : "/guid-placeholder.jpg";
  };

  const getRecipientLocation = (): string => {
    if (!recipient) return "";
    if (isAgency) {
      return [recipient.city, recipient.country].filter(Boolean).join(", ") || "Pakistan";
    }
    return recipient.location || "Pakistan";
  };

  const getRecipientSubtitle = (): string => {
    if (!recipient) return "";
    if (isAgency) return `${recipient.totalPackages || 0} packages`;
    if (isGuide) return `${(recipient.pricePerDay || 0).toLocaleString()} PKR/day`;
    return "Traveler";
  };

  const getRecipientRating = (): number => {
    return recipient?.rating || 0;
  };

  const getProfileLink = (): string => {
    if (!recipient) return "#";
    if (isAgency) return `/agency/${recipient.slug || recipient.id}`;
    if (isGuide) return `/guide/${recipient.slug || recipient.id}`;
    return "#";
  };

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const getMessageStatusIcon = (msg: Message) => {
    if (msg.read) return <FaCheckDouble className="w-3 h-3 text-blue-500" />;
    return <FaCheck className="w-3 h-3 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mb-4"></div>
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {error || "Conversation not found"}
            </h1>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
            >
              <FaArrowLeft /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recipientName = getRecipientName();
  const messages = conversation.messages || [];

  return (
    <div className="min-h-screen bg-[#F2F4F7] overflow-x-hidden">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 min-[375px]:px-4 py-6 sm:py-8 overflow-x-hidden">
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium transition-colors text-sm sm:text-base"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100dvh-9rem)] sm:h-[calc(100vh-12rem)] min-h-0 max-h-[800px] flex flex-col">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-white gap-2 min-w-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <Link href={getProfileLink()} className="relative shrink-0">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={getRecipientImage()}
                    alt={recipientName}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = isAgency
                        ? "/agency-placeholder.jpg"
                        : "/guid-placeholder.jpg";
                    }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={getProfileLink()} className="hover:text-[#008A1E] transition-colors">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <h2 className="text-base sm:text-xl font-bold text-gray-900 truncate max-w-full">{recipientName}</h2>
                    {isAgency && recipient?.isVerified && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0">Verified</span>
                    )}
                    {!isTraveler && renderStars(getRecipientRating())}
                  </div>
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-gray-600 mt-0.5">
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <FaMapMarkerAlt className="w-3 h-3 shrink-0" />
                    <span className="truncate">{getRecipientLocation()}</span>
                  </span>
                  <span className="hidden min-[375px]:inline text-gray-300">•</span>
                  {isAgency ? (
                    <span className="inline-flex items-center gap-1 min-w-0"><FaBriefcase className="w-3 h-3 shrink-0" /><span className="truncate">{getRecipientSubtitle()}</span></span>
                  ) : isGuide ? (
                    <span className="text-[#008A1E] font-medium truncate">{getRecipientSubtitle()}</span>
                  ) : (
                    <span className="text-gray-500">Traveler</span>
                  )}
                </div>
              </div>
            </div>
            {/* Phone/video call buttons removed — VoyageX text messaging only */}
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 bg-gray-50 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FaEnvelope className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                <p className="text-gray-500 mt-2">Start a conversation with {recipientName}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMyMessage = message.senderId === currentUser?.id;
                  return (
                    <div key={message.id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%] min-w-0">
                        {!isMyMessage && (
                          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                            <Image
                              src={getRecipientImage()}
                              alt={recipientName}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = isAgency
                                  ? "/agency-placeholder.jpg"
                                  : "/guid-placeholder.jpg";
                              }}
                            />
                          </div>
                        )}
                        <div
                          onClick={() => message._failed ? handleRetryFailed(message) : undefined}
                          className={`px-3 sm:px-4 py-2 rounded-2xl min-w-0 ${
                            isMyMessage
                              ? message._failed
                                ? "bg-red-500 text-white rounded-br-none cursor-pointer"
                                : message._pending
                                  ? "bg-[#008A1E]/60 text-white rounded-br-none"
                                  : "bg-[#008A1E] text-white rounded-br-none"
                              : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                          }`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                              isMyMessage ? "text-green-100" : "text-gray-500"
                            }`}
                          >
                            {message._failed ? (
                              <span className="text-xs text-red-100">⚠ Tap to retry</span>
                            ) : message._pending ? (
                              <span className="text-xs opacity-70">Sending…</span>
                            ) : (
                              <>
                                <span>
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isMyMessage && getMessageStatusIcon(message)}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${recipientName}...`}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#008A1E] focus:bg-white transition-colors text-sm sm:text-base"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-[#008A1E] text-white rounded-full flex items-center justify-center hover:bg-[#006816] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}