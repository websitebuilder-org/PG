import { useState, useEffect } from "react";
import axios from "axios";
import { Copy, Trash2, Star, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDelete = async (favoriteId) => {
    try {
      await axios.delete(`${API}/favorites/${favoriteId}`);
      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Error deleting favorite:", error);
      toast.error("Failed to remove favorite");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#007AFF]"></div>
          <p className="text-[#A1A1AA] mt-4 font-inter">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-manrope font-bold text-4xl md:text-5xl tracking-tight text-white mb-2">
          Favorite Prompts
        </h1>
        <p className="text-[#A1A1AA] font-inter text-lg">
          Your saved collection of best prompts
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-[#121212] border border-[#333] rounded-lg p-12 text-center">
          <div className="inline-block p-4 bg-[#1E1E1E] rounded-full mb-4">
            <Star size={32} className="text-[#007AFF]" />
          </div>
          <h3 className="font-manrope font-semibold text-xl text-white mb-2">
            No Favorites Yet
          </h3>
          <p className="text-[#A1A1AA] font-inter">
            Save your best prompts to find them easily later
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              data-testid={`favorite-item-${favorite.id}`}
              className="bg-[#121212] border border-[#333] rounded-lg p-5 hover:border-[#555] transition-all group animate-fade-in"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-[#333]">
                <div className="flex-1">
                  <h3 className="font-manrope font-semibold text-lg text-white mb-1">
                    {favorite.keyword}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-[#A1A1AA] font-inter">
                      <Tag size={12} />
                      {favorite.style}
                    </span>
                    <span className="text-[#A1A1AA] font-inter">
                      {formatDate(favorite.saved_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    data-testid={`copy-favorite-${favorite.id}`}
                    onClick={() => handleCopy(favorite.prompt_text)}
                    className="p-2 rounded-full hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    data-testid={`delete-favorite-${favorite.id}`}
                    onClick={() => handleDelete(favorite.id)}
                    className="p-2 rounded-full hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-[#FF3B30] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Prompt Text */}
              <p className="font-jetbrains text-sm text-gray-300 leading-relaxed">
                {favorite.prompt_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;