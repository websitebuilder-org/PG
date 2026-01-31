import { useState } from "react";
import axios from "axios";
import { Loader2, Copy, Download, Heart, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Model options based on provider
const MODEL_OPTIONS = {
  openai: [
    { value: "gpt-5.2", label: "GPT-5.2" },
    { value: "gpt-5.1", label: "GPT-5.1 (Recommended)" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4.1", label: "GPT-4.1" },
  ],
  claude: [
    { value: "claude-4-sonnet-20250514", label: "Claude 4 Sonnet (Recommended)" },
    { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
    { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
  ],
  gemini: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Recommended)" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
    { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  ],
};

// Style images from design guidelines
const STYLE_OPTIONS = [
  {
    value: "photo",
    label: "Photography",
    image: "https://images.unsplash.com/photo-1694177038818-aa526243d2c4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxtaWNyb3N0b2NrJTIwcGhvdG9ncmFwaHklMjBzdHVkaW98ZW58MHx8fHwxNzY5ODE3MDcwfDA&ixlib=rb-4.1.0&q=85",
  },
  {
    value: "illustration",
    label: "Illustration",
    image: "https://images.unsplash.com/photo-1707999494560-f534cc79298c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxkaWdpdGFsJTIwaWxsdXN0cmF0aW9uJTIwYXJ0JTIwY29uY2VwdHxlbnwwfHx8fDE3Njk4MTcwNzJ8MA&ixlib=rb-4.1.0&q=85",
  },
  {
    value: "vector",
    label: "Vector",
    image: "https://images.unsplash.com/photo-1715528233539-5fe70a4e0d71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwzfHx2ZWN0b3IlMjBhcnQlMjBpbGx1c3RyYXRpb24lMjBmbGF0JTIwZGVzaWdufGVufDB8fHx8MTc2OTgxNzA3MXww&ixlib=rb-4.1.0&q=85",
  },
  {
    value: "logo",
    label: "Logo",
    image: "https://images.unsplash.com/photo-1760037028636-6f42428aeeee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHw0fHxtaW5pbWFsaXN0JTIwbG9nbyUyMGRlc2lnbiUyMGJyYW5kaW5nfGVufDB8fHx8MTc2OTgxNzA3M3ww&ixlib=rb-4.1.0&q=85",
  },
];

const Dashboard = () => {
  const [formData, setFormData] = useState({
    keyword: "",
    style: "photo",
    provider: "openai",
    model: "gpt-5.1",
    quantity: 5,
    outputFormat: "text",
    apiKey: "",
    useEmergentKey: true,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleProviderChange = (provider) => {
    const defaultModels = {
      openai: "gpt-5.1",
      claude: "claude-4-sonnet-20250514",
      gemini: "gemini-2.5-pro",
      groq: "llama-3.3-70b-versatile",
    };

    setFormData({
      ...formData,
      provider,
      model: defaultModels[provider],
    });
  };

  const handleGenerate = async () => {
    if (!formData.keyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    if (!formData.useEmergentKey && !formData.apiKey.trim()) {
      toast.error("Please provide an API key or use Emergent key");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/generate`, {
        keyword: formData.keyword,
        style: formData.style,
        provider: formData.provider,
        model: formData.model,
        quantity: parseInt(formData.quantity),
        output_format: formData.outputFormat,
        api_key: formData.useEmergentKey ? null : formData.apiKey,
        use_emergent_key: formData.useEmergentKey,
      });

      setResult(response.data);
      toast.success(`Generated ${response.data.prompts.length} prompts successfully!`);
    } catch (error) {
      console.error("Error generating prompts:", error);
      toast.error(error.response?.data?.detail || "Failed to generate prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleCopyAll = () => {
    const allText = result.prompts.join("\n\n");
    navigator.clipboard.writeText(allText);
    toast.success("All prompts copied to clipboard!");
  };

  const handleDownload = () => {
    const content = result.prompts.join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `microstock-prompts-${formData.keyword}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded successfully!");
  };

  const handleSaveFavorite = async (promptText) => {
    try {
      await axios.post(`${API}/favorites`, {
        prompt_generation_id: result.id,
        prompt_text: promptText,
        keyword: result.keyword,
        style: result.style,
      });
      toast.success("Saved to favorites!");
    } catch (error) {
      console.error("Error saving favorite:", error);
      toast.error("Failed to save favorite");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-manrope font-bold text-4xl md:text-5xl tracking-tight text-white mb-2">
          Generate Microstock Prompts
        </h1>
        <p className="text-[#A1A1AA] font-inter text-lg">
          Create professional, SEO-optimized prompts for stock platforms
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Generator Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Keyword Input */}
          <div className="bg-[#121212] border border-[#333] rounded-lg p-6">
            <Label htmlFor="keyword" className="text-white font-inter font-medium mb-2 block">
              Keyword / Theme
            </Label>
            <Input
              id="keyword"
              data-testid="keyword-input"
              placeholder="e.g., sunset landscape, business meeting, coffee shop"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              className="bg-[#0A0A0A] border-[#333] text-white focus:border-[#007AFF] font-inter"
            />
          </div>

          {/* Style Selection */}
          <div className="bg-[#121212] border border-[#333] rounded-lg p-6">
            <Label className="text-white font-inter font-medium mb-4 block">Style</Label>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <div
                  key={style.value}
                  data-testid={`style-${style.value}`}
                  onClick={() => setFormData({ ...formData, style: style.value })}
                  className={`relative h-28 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    formData.style === style.value
                      ? "border-[#007AFF]"
                      : "border-[#333] hover:border-[#555]"
                  }`}
                >
                  <img
                    src={style.image}
                    alt={style.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/30 flex items-end p-3">
                    <span className="text-white font-inter font-medium text-sm">
                      {style.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Provider & Model */}
          <div className="bg-[#121212] border border-[#333] rounded-lg p-6 space-y-4">
            <div>
              <Label htmlFor="provider" className="text-white font-inter font-medium mb-2 block">
                AI Provider
              </Label>
              <Select value={formData.provider} onValueChange={handleProviderChange}>
                <SelectTrigger
                  id="provider"
                  data-testid="provider-select"
                  className="bg-[#0A0A0A] border-[#333] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-[#333]">
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="gemini">Gemini (Google)</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model" className="text-white font-inter font-medium mb-2 block">
                Model
              </Label>
              <Select
                value={formData.model}
                onValueChange={(value) => setFormData({ ...formData, model: value })}
              >
                <SelectTrigger
                  id="model"
                  data-testid="model-select"
                  className="bg-[#0A0A0A] border-[#333] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-[#333]">
                  {MODEL_OPTIONS[formData.provider].map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="use-emergent" className="text-white font-inter font-medium">
                Use Emergent Key
              </Label>
              <Switch
                id="use-emergent"
                data-testid="emergent-key-switch"
                checked={formData.useEmergentKey}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, useEmergentKey: checked })
                }
              />
            </div>

            {!formData.useEmergentKey && (
              <div>
                <Label htmlFor="apiKey" className="text-white font-inter font-medium mb-2 block">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  data-testid="api-key-input"
                  type="password"
                  placeholder="Enter your API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="bg-[#0A0A0A] border-[#333] text-white focus:border-[#007AFF] font-jetbrains text-sm"
                />
              </div>
            )}
          </div>

          {/* Quantity & Format */}
          <div className="bg-[#121212] border border-[#333] rounded-lg p-6 space-y-4">
            <div>
              <Label htmlFor="quantity" className="text-white font-inter font-medium mb-2 block">
                Number of Prompts
              </Label>
              <Input
                id="quantity"
                data-testid="quantity-input"
                type="number"
                min="1"
                max="20"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-[#0A0A0A] border-[#333] text-white focus:border-[#007AFF] font-inter"
              />
            </div>

            <div>
              <Label htmlFor="format" className="text-white font-inter font-medium mb-2 block">
                Output Format
              </Label>
              <Select
                value={formData.outputFormat}
                onValueChange={(value) => setFormData({ ...formData, outputFormat: value })}
              >
                <SelectTrigger
                  id="format"
                  data-testid="format-select"
                  className="bg-[#0A0A0A] border-[#333] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121212] border-[#333]">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            data-testid="generate-button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-[#007AFF] hover:bg-[#0051A8] text-white font-manrope font-semibold py-6 text-lg rounded-lg btn-primary-glow active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Prompts"
            )}
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="bg-[#121212] border border-[#333] rounded-lg p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-manrope font-bold text-2xl text-white">Generated Prompts</h2>
                  <p className="text-[#A1A1AA] font-inter text-sm mt-1">
                    {result.prompts.length} prompts for "{result.keyword}"
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    data-testid="copy-all-button"
                    onClick={handleCopyAll}
                    variant="outline"
                    size="sm"
                    className="border-[#333] bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]"
                  >
                    <Copy size={16} className="mr-2" />
                    Copy All
                  </Button>
                  <Button
                    data-testid="download-button"
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="border-[#333] bg-[#1E1E1E] text-white hover:bg-[#2A2A2A]"
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {result.prompts.map((prompt, index) => (
                  <div
                    key={index}
                    data-testid={`prompt-item-${index}`}
                    className="bg-[#0A0A0A] border border-[#333] rounded-lg p-4 group hover:border-[#555] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-jetbrains text-sm text-gray-300 leading-relaxed flex-1">
                        {prompt}
                      </p>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          data-testid={`copy-prompt-${index}`}
                          onClick={() => handleCopy(prompt)}
                          className="p-2 rounded-full hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          data-testid={`favorite-prompt-${index}`}
                          onClick={() => handleSaveFavorite(prompt)}
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
          ) : (
            <div className="bg-[#121212] border border-[#333] rounded-lg p-12 text-center">
              <div className="inline-block p-4 bg-[#1E1E1E] rounded-full mb-4">
                <ChevronDown size={32} className="text-[#007AFF]" />
              </div>
              <h3 className="font-manrope font-semibold text-xl text-white mb-2">
                Ready to Generate
              </h3>
              <p className="text-[#A1A1AA] font-inter">
                Fill in the form and click generate to create professional microstock prompts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
