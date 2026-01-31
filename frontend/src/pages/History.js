import { useState, useEffect } from "react";
import axios from "axios";
import { Copy, Download, Heart, Calendar, Tag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleCopyAll = (prompts) => {
    const allText = prompts.join("\n\n");
    navigator.clipboard.writeText(allText);
    toast.success("All prompts copied to clipboard!");
  };

  const handleDownload = (generation) => {
    const content = generation.prompts.join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `microstock-prompts-${generation.keyword}-${new Date(generation.created_at).getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded successfully!");
  };

  const handleSaveFavorite = async (generation, promptText) => {
    try {
      await axios.post(`${API}/favorites`, {
        prompt_generation_id: generation.id,
        prompt_text: promptText,
        keyword: generation.keyword,
        style: generation.style,
      });
      toast.success("Saved to favorites!");
    } catch (error) {
      console.error("Error saving favorite:", error);
      toast.error("Failed to save favorite");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF]"></div>
          <p className="text-[#A1A1AA] mt-4 font-inter">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-manrope font-bold text-4xl md:text-5xl tracking-tight text-white mb-2">
          Generation History
        </h1>
        <p className="text-[#A1A1AA] font-inter text-lg">
          View all your previously generated prompts
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-[#121212] border border-[#333] rounded-lg p-12 text-center">
          <div className="inline-block p-4 bg-[#1E1E1E] rounded-full mb-4">
            <Calendar size={32} className="text-[#007AFF]" />
          </div>
          <h3 className="font-manrope font-semibold text-xl text-white mb-2">
            No History Yet
          </h3>
          <p className="text-[#A1A1AA] font-inter">
            Start generating prompts to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map((generation) => (
            <div
              key={generation.id}
              data-testid={`history-item-${generation.id}`}
              className="bg-[#121212] border border-[#333] rounded-lg p-6 hover:border-[#555] transition-all animate-fade-in"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#333]">
                <div className="flex-1">
                  <h3 className="font-manrope font-bold text-xl text-white mb-2">
                    {generation.keyword}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="flex items-center gap-1 text-[#A1A1AA] font-inter">
                      <Tag size={14} />
                      {generation.style}
                    </span>
                    <span className="flex items-center gap-1 text-[#A1A1AA] font-inter">
                      <Zap size={14} />
                      {generation.provider} • {generation.model}
                    </span>
                    <span className="flex items-center gap-1 text-[#A1A1AA] font-inter">
                      <Calendar size={14} />
                      {formatDate(generation.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid={`copy-all-${generation.id}`}
                    onClick={() => handleCopyAll(generation.prompts)}
                    variant="outline"
                    size="sm"
                    className="border-[#333] bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy All
                  </Button>
                  <Button
                    data-testid={`download-${generation.id}`}
                    onClick={() => handleDownload(generation)}
                    variant="outline"
                    size="sm"
                    className="border-[#333] bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Prompts */}
              <div className="space-y-3">
                {generation.prompts.map((prompt, index) => (
                  <div
                    key={index}
                    data-testid={`history-prompt-${generation.id}-${index}`}
                    className="bg-[#0A0A0A] border border-[#333] rounded-lg p-4 group hover:border-[#555] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-jetbrains text-sm text-gray-300 leading-relaxed flex-1">
                        {prompt}
                      </p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(prompt)}
                          className="p-2 rounded-full hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleSaveFavorite(generation, prompt)}
                          className="p-2 rounded-full hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-[#FF3B30] transition-colors"
                        >
                          <Heart size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;