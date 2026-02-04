import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import SendMessage from "@/pages/SendMessage";
import Inbox from "@/pages/Inbox";
import MessageDetail from "@/pages/MessageDetail";

function App() {
  return (
    <div className="App min-h-screen bg-white">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SendMessage />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<MessageDetail />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-center" richColors />
    </div>
  );
}

export default App;
