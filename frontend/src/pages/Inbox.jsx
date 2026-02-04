import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Plus, Mail, Clock, ChevronRight, Inbox as InboxIcon } from "lucide-react";
import { format, parseISO } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return format(date, "h:mm a");
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return format(date, "EEEE");
      } else {
        return format(date, "MMM d");
      }
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">SecureBridge</span>
          </div>
          <Link to="/">
            <Button 
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm hover:shadow transition-all duration-200"
              data-testid="compose-message-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            Inbox
          </h1>
          <p className="text-slate-500 text-sm">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3" data-testid="loading-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <Card className="border border-gray-100 p-12 text-center" data-testid="empty-inbox">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
              <InboxIcon className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              Your secure inbox is empty. Start by sending a message.
            </p>
            <Link to="/">
              <Button 
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                data-testid="send-first-message-btn"
              >
                Send First Message
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2" data-testid="message-list">
            {messages.map((message) => (
              <Link 
                key={message.id} 
                to={`/inbox/${message.id}`}
                className="block"
                data-testid={`message-item-${message.id}`}
              >
                <Card className={`border border-gray-100 hover:border-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer group ${
                  !message.is_read ? "bg-white" : "bg-gray-50/50"
                }`}>
                  <div className="flex items-center gap-4 p-4">
                    {/* Unread indicator */}
                    <div className="flex-shrink-0 w-2 flex justify-center">
                      {!message.is_read && (
                        <div 
                          className="h-2 w-2 rounded-full bg-[#2563EB] animate-pulse-subtle" 
                          data-testid={`unread-indicator-${message.id}`}
                        />
                      )}
                    </div>

                    {/* Mail icon */}
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                      !message.is_read ? "bg-blue-50" : "bg-gray-100"
                    }`}>
                      <Mail className={`h-4 w-4 ${
                        !message.is_read ? "text-[#2563EB]" : "text-slate-400"
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`truncate ${
                          !message.is_read 
                            ? "font-semibold text-slate-900" 
                            : "font-medium text-slate-600"
                        }`}>
                          {message.subject}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${
                        !message.is_read ? "text-slate-600" : "text-slate-400"
                      }`}>
                        {message.recipient_email}
                      </p>
                    </div>

                    {/* Date & Arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
