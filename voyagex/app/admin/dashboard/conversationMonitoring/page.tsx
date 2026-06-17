"use client";

import { useState, useEffect } from "react";
import { FaSearch, FaSpinner, FaEnvelope, FaEye, FaTimes, FaUser, FaBuilding, FaExclamationTriangle } from "react-icons/fa";
import { messagesApi } from "@/lib/api";

const FLAG_PREFIX = "[VoyageX:";
const isFlagged = (content: string) => content?.startsWith(FLAG_PREFIX);

export default function ConversationMonitoringPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    let list = conversations;
    if (showFlaggedOnly) {
      list = list.filter((c) =>
        c.messages?.some((m: any) => isFlagged(m.content))
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const users = c.users || [];
        return users.some((u: any) =>
          `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
        );
      });
    }
    setFiltered(list);
  }, [search, conversations, showFlaggedOnly]);

  const fetchConversations = async () => {
    try {
      const response = await messagesApi.getAllConversations();
      const result = response.data;
      if (result.success && result.data) {
        const list = result.data.conversations || result.data || [];
        setConversations(Array.isArray(list) ? list : []);
        setFiltered(Array.isArray(list) ? list : []);
      }
    } catch (err) { console.error("Error fetching conversations:", err); }
    finally { setLoading(false); }
  };

  const viewConversation = async (conv: any) => {
    setSelectedConv(conv);
    setMessagesLoading(true);
    try {
      const response = await messagesApi.getMessages(conv.id);
      const result = response.data;
      if (result.success && result.data) {
        const msgs = result.data.messages || result.data || [];
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch (err) { console.error("Error fetching messages:", err); }
    finally { setMessagesLoading(false); }
  };

  const getUserName = (user: any) => {
    if (!user) return "Unknown";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown";
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-red-50 text-red-700 border-red-200",
      GUIDE: "bg-blue-50 text-blue-700 border-blue-200",
      AGENCY: "bg-purple-50 text-purple-700 border-purple-200",
      TRAVELER: "bg-green-50 text-green-700 border-green-200",
    };
    return `px-2 py-0.5 rounded text-xs font-medium border ${styles[role] || "bg-gray-50 text-gray-600 border-gray-200"}`;
  };

  const getParticipants = (conv: any) => conv.users || [];

  const getMessageBubble = (msg: any, users: any[]) => {
    const sender = users.find((u: any) => u.id === msg.senderId);
    return { senderName: getUserName(sender), senderRole: sender?.role };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="ml-2.5 text-sm text-gray-500">Loading conversations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Conversation Monitor</h1>
          <p className="text-sm text-gray-500 mt-0.5">{conversations.length} conversations on the platform</p>
        </div>
        {conversations.some((c) => c.messages?.some((m: any) => isFlagged(m.content))) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
            <FaExclamationTriangle className="w-3 h-3" />
            {conversations.filter((c) => c.messages?.some((m: any) => isFlagged(m.content))).length} conversation(s) with flagged messages
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Search by name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        <button
          onClick={() => setShowFlaggedOnly((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
            showFlaggedOnly
              ? "bg-red-600 text-white border-red-600"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <FaExclamationTriangle className="w-3 h-3" />
          {showFlaggedOnly ? "Show All" : "Flagged Only"}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{filtered.length} conversation{filtered.length !== 1 ? "s" : ""} found</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <FaEnvelope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No conversations found</p>
            <p className="text-xs text-gray-400 mt-1">Conversations appear when users message each other</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((conv) => {
              const users = getParticipants(conv);
              return (
                <div key={conv.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {users.map((u: any) => (
                        <span key={u.id} className="flex items-center gap-1.5">
                          {u.role === "AGENCY" ? <FaBuilding className="w-3 h-3 text-purple-500" /> : <FaUser className="w-3 h-3 text-gray-400" />}
                          <span className="text-sm font-medium text-gray-900">{getUserName(u)}</span>
                          <span className={getRoleBadge(u.role)}>{u.role}</span>
                        </span>
                      ))}
                      {users.length === 2 && <span className="text-gray-300 text-xs mx-1">↔</span>}
                    </div>
                    {conv.messages?.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1 truncate">Last: {conv.messages[conv.messages.length - 1]?.content?.slice(0, 80)}</p>
                    )}
                  </div>
                  <button onClick={() => viewConversation(conv)}
                    className="ml-4 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1 flex-shrink-0">
                    <FaEye className="w-3 h-3" /> View
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedConv && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">
                Conversation — {getParticipants(selectedConv).map((u: any) => getUserName(u)).join(" & ")}
              </h3>
              <button onClick={() => { setSelectedConv(null); setMessages([]); }} className="text-gray-400 hover:text-gray-600"><FaTimes className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-3 min-h-[300px]">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full"><FaSpinner className="w-5 h-5 text-gray-400 animate-spin" /></div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No messages in this conversation</p>
              ) : (
                messages.map((msg) => {
                  const { senderName, senderRole } = getMessageBubble(msg, getParticipants(selectedConv));
                  const flagged = isFlagged(msg.content);
                  return (
                    <div key={msg.id} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-900">{senderName}</span>
                        <span className={getRoleBadge(senderRole)}>{senderRole}</span>
                        <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                        {flagged && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            <FaExclamationTriangle className="w-2.5 h-2.5" /> Flagged
                          </span>
                        )}
                      </div>
                      <div className={`rounded-lg px-3 py-2 text-sm border ${
                        flagged
                          ? "bg-red-50 text-red-900 border-red-200"
                          : "bg-white text-gray-800 border-gray-100"
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}