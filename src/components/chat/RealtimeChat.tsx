import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Image as ImageIcon, 
  Store, 
  User, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  X, 
  ExternalLink,
  MessageSquare,
  Clock,
  Loader2
} from 'lucide-react';
import type { ChatThread, ChatMessage, Store as StoreType } from '../../types';
import { 
  subscribeUserChats, 
  subscribeMessages, 
  sendChatMessage, 
  getOrCreateChatThread 
} from '../../lib/firestoreService';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { useAuth } from '../../context/AuthContext';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface RealtimeChatProps {
  initialStoreId?: string | null;
  initialStoreName?: string | null;
  stores: StoreType[];
}

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  initialStoreId,
  initialStoreName,
  stores
}) => {
  const { userProfile } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStoreOwner = userProfile?.role === 'owner';
  const currentUid = userProfile?.uid || 'guest_buyer';
  const currentName = userProfile?.name || 'Customer';

  // Listen to threads
  useEffect(() => {
    const unsub = subscribeUserChats(
      currentUid, 
      isStoreOwner, 
      userProfile?.storeId, 
      (fetched) => {
        setThreads(fetched);
        // If initialStoreId provided and no active chat, open it
        if (initialStoreId && !activeChatId) {
          const targetId = isStoreOwner ? initialStoreId : `${currentUid}_${initialStoreId}`;
          setActiveChatId(targetId);
        } else if (fetched.length > 0 && !activeChatId && window.innerWidth >= 768) {
          setActiveChatId(fetched[0].chatId);
        }
      }
    );
    return () => unsub();
  }, [currentUid, isStoreOwner, userProfile?.storeId, initialStoreId]);

  // Handle direct creation from initialStoreId if not in threads yet
  useEffect(() => {
    if (initialStoreId && !isStoreOwner) {
      const storeObj = stores.find(s => s.storeId === initialStoreId);
      const storeName = storeObj?.storeName || initialStoreName || 'Official Store';
      getOrCreateChatThread(currentUid, currentName, initialStoreId, storeName).then(chatId => {
        setActiveChatId(chatId);
      });
    }
  }, [initialStoreId, isStoreOwner, currentUid, currentName, stores, initialStoreName]);

  // Listen to messages for the active thread
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => unsub();
  }, [activeChatId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedImageFile) || !activeChatId) return;

    setSendingMessage(true);
    let uploadedImageUrl = '';

    try {
      if (selectedImageFile) {
        setUploadingImage(true);
        uploadedImageUrl = await uploadToCloudinary(selectedImageFile, 'image');
        setUploadingImage(false);
      }

      await sendChatMessage(activeChatId, currentUid, inputText.trim(), uploadedImageUrl);

      setInputText('');
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
      setUploadingImage(false);
    }
  };

  const activeThread = threads.find(t => t.chatId === activeChatId) || (
    initialStoreId ? {
      chatId: `${currentUid}_${initialStoreId}`,
      customerId: currentUid,
      customerName: currentName,
      storeId: initialStoreId,
      storeName: initialStoreName || 'Store Seller',
      lastMessage: '',
      updatedAt: new Date().toISOString()
    } : null
  );

  // Helper to render text with clickable links
  const renderFormattedText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-800 break-all inline-flex items-center gap-0.5"
          >
            {part} <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[78vh] min-h-[500px]">
      {/* Left Sidebar: Threads List (WhatsApp style) */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 ${
        activeChatId ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              {isStoreOwner ? 'Customer Inquiries' : 'Seller Chats'}
            </span>
          </div>
          <span className="text-[11px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
            {threads.length} Active
          </span>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {threads.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 stroke-1 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No active conversations</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Browse products and click "Chat with Seller" to start a direct thread.
              </p>
            </div>
          ) : (
            threads.map(t => {
              const isSelected = t.chatId === activeChatId;
              const displayName = isStoreOwner ? (t.customerName || 'Customer') : (t.storeName || 'Store');
              return (
                <div
                  key={t.chatId}
                  onClick={() => setActiveChatId(t.chatId)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                    {isStoreOwner ? (
                      <User className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <Store className="w-5 h-5 text-emerald-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{displayName}</h4>
                        {!isStoreOwner && <VerifiedBadge size="xs" />}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {t.lastMessage || 'Click to view chat'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Conversation Window */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${
        !activeChatId ? 'hidden md:flex' : 'flex'
      }`}>
        {activeThread ? (
          <>
            {/* Conversation Header */}
            <div className="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="md:hidden p-1 text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center">
                  {isStoreOwner ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                      {isStoreOwner ? activeThread.customerName || 'Customer' : activeThread.storeName || 'Official Seller'}
                    </h3>
                    {!isStoreOwner && <VerifiedBadge size="xs" />}
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Online • Real-time response
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Starter Chips */}
            <div className="bg-slate-100 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-slate-400 shrink-0 font-medium">Quick ask:</span>
              <button
                onClick={() => setInputText('Is this product available in stock right now?')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 shrink-0"
              >
                In Stock?
              </button>
              <button
                onClick={() => setInputText('How many days does it take to deliver to Dhaka?')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 shrink-0"
              >
                Delivery Time?
              </button>
              <button
                onClick={() => setInputText('Can you offer any extra discount for multiple items?')}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 shrink-0"
              >
                Special Discount?
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Start conversation with the seller</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Ask questions regarding size, color, authenticity, or delivery arrangements.
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === currentUid;
                  return (
                    <div
                      key={msg.messageId}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender store label with VerifiedBadge for incoming seller responses */}
                      {!isMe && !isStoreOwner && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 px-1">
                          <span>{activeThread.storeName || 'Official Store'}</span>
                          <VerifiedBadge size="xs" />
                        </div>
                      )}
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs ${
                        isMe 
                          ? 'bg-emerald-700 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}>
                        {/* Attached Image */}
                        {msg.imageUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden max-h-60 bg-slate-900/10">
                            <img 
                              src={msg.imageUrl} 
                              alt="Attachment" 
                              className="w-full h-auto object-cover rounded-xl"
                            />
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.text && (
                          <p className={`text-xs leading-relaxed break-words ${isMe ? 'text-white' : 'text-slate-800'}`}>
                            {renderFormattedText(msg.text)}
                          </p>
                        )}

                        {/* Timestamp & Status */}
                        <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                          isMe ? 'text-emerald-200' : 'text-slate-400'
                        }`}>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-emerald-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview before sending */}
            {imagePreviewUrl && (
              <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImageFile(null);
                      setImagePreviewUrl(null);
                    }}
                    className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-slate-600 font-medium">
                  {uploadingImage ? 'Uploading via Cloudinary...' : 'Ready to attach with message'}
                </span>
              </div>
            )}

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image from Cloudinary"
                className="p-2 rounded-full text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Type a message or paste URL..."
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-emerald-600"
              />

              <button
                type="submit"
                disabled={sendingMessage || (!inputText.trim() && !selectedImageFile)}
                className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-full transition-all shadow-xs"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <MessageSquare className="w-16 h-16 stroke-1 text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Choose an active store thread from the left or visit any product page to chat directly with verified merchants.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
