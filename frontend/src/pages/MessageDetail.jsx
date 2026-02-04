import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Lock, ArrowLeft, Mail, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessage();
  }, [id]);

  const fetchMessage = async () => {
    try {
      const response = await axios.get(`${API}/message/${id}`);
      setMessage(response.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setError("Message not found or has expired");
      } else {
        setError("Failed to load message");
      }
      toast.error("Failed to load message");
    } finally {
      setLoading(false);
    }
  };

  const formatFullDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">SecureBridge</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 md:py-20">
          <div className="animate-pulse" data-testid="loading-state">
            <div className="h-8 bg-gray-100 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-8" />
            <div className="h-64 bg-gray-50 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">SecureBridge</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 md:py-20">
          <Card className="border border-red-100 bg-red-50/50 p-8 text-center" data-testid="error-state">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Message Not Found</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Link to="/inbox">
              <Button 
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                data-testid="return-to-inbox-btn"
              >
                Return to Inbox
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="message-detail-page">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">SecureBridge</span>
          </div>
          <Link to="/inbox">
            <Button 
              variant="ghost" 
              className="text-slate-600 hover:text-slate-900 hover:bg-gray-100"
              data-testid="back-to-inbox-btn"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inbox
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        {/* Secure Connection Badge */}
        <div className="flex justify-center mb-6">
          <div 
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
            data-testid="secure-connection-badge"
          >
            <Lock className="h-3 w-3" />
            Secure Connection
          </div>
        </div>

        {/* Message Card */}
        <Card className="border border-gray-100 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden" data-testid="message-card">
          {/* Card Header */}
          <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="h-4 w-4 text-[#2563EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight mb-1" data-testid="message-subject">
                  {message.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span data-testid="message-recipient">To: {message.recipient_email}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span data-testid="message-date">{formatFullDate(message.created_at)}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 md:p-10">
            <div 
              className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap"
              data-testid="message-body"
            >
              {message.body}
            </div>
          </div>
        </Card>

        {/* Return Button */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline"
            onClick={() => navigate("/inbox")}
            className="border-gray-200 text-slate-700 hover:bg-gray-50"
            data-testid="return-to-inbox-bottom-btn"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Inbox
          </Button>
        </div>
      </main>
    </div>
  );
}
