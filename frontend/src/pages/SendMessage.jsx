import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, Send, Inbox, Copy, Check, Shield } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SendMessage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !subject || !body) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/send`, {
        recipient_email: email,
        subject,
        body,
      });
      
      setResult(response.data);
      toast.success("Message sent securely");
      setEmail("");
      setSubject("");
      setBody("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.inbox_url) {
      await navigator.clipboard.writeText(result.inbox_url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
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
          <Link to="/inbox">
            <Button 
              variant="ghost" 
              className="text-slate-600 hover:text-slate-900 hover:bg-gray-100"
              data-testid="view-inbox-btn"
            >
              <Inbox className="h-4 w-4 mr-2" />
              View Inbox
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-3">
            Send Secure Message
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Create a secure, portal-based notification
          </p>
        </div>

        <Card className="border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" data-testid="send-message-card">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              <span>End-to-end secure delivery</span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-gray-200 focus-visible:ring-[#2563EB]"
                  data-testid="recipient-email-input"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Subject
                </label>
                <Input
                  type="text"
                  placeholder="Message subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 border-gray-200 focus-visible:ring-[#2563EB]"
                  data-testid="subject-input"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                  Message Body
                </label>
                <Textarea
                  placeholder="Enter your secure message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  className="border-gray-200 focus-visible:ring-[#2563EB] resize-none"
                  data-testid="message-body-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium shadow-sm hover:shadow transition-all duration-200 active:scale-[0.98]"
                data-testid="send-message-btn"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Secure Message
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Success Result */}
        {result && (
          <Card className="mt-6 border border-green-100 bg-green-50/50" data-testid="success-result-card">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 mb-1">Message Sent Successfully</p>
                  <p className="text-sm text-slate-500 mb-3">Share this secure link with the recipient:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-slate-600 truncate" data-testid="inbox-url">
                      {result.inbox_url}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex-shrink-0 border-gray-200"
                      data-testid="copy-link-btn"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
