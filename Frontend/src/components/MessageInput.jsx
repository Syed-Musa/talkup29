import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../Store/useChatStore";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { Image, X } from "lucide-react";
import { mlAxios } from "../lib/mlAxios";
import getMlSocket from "../lib/mlSocket";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const { sendMessage, setTyping } = useChatStore();
  const debounceRef = useRef(null);
  const SUGGEST_DEBOUNCE_MS = 120;
  const typingTimeout = useRef(null);
  const documentInputRef = useRef(null);
  const [documentPreview, setDocumentPreview] = useState(null);

  // --- File handlers ---
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("pdf")) {
      toast.error("Please select a valid PDF file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDocumentPreview(reader.result);
    reader.readAsText(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Send message ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuggestions([]);
    } catch (error) {
      console.log("failed to send message", error);
    }
  };

  // --- REST autocomplete (debounced) ---
  useEffect(() => {
    const val = text.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val) {
      setSuggestions([]);
      setActiveIndex(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await mlAxios.post("/autocomplete", { text: val });
        const list = (res && res.data && res.data.suggestions) || [];
        setSuggestions(list);
        setActiveIndex(list.length > 0 ? 0 : null);
      } catch (err) {
        console.debug("ml autocomplete error", err?.message || err);
        setSuggestions([]);
        setActiveIndex(null);
      }
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  // --- Socket.IO autocomplete ---
  useEffect(() => {
    const socket = getMlSocket();
    if (!socket) return;

    socket.on("autocomplete_suggestions", (data) => {
      const list = (data && data.suggestions) || [];
      setSuggestions(list);
      setActiveIndex(list.length > 0 ? 0 : null);
    });

    return () => {
      socket.off("autocomplete_suggestions");
    };
  }, []);

  const applySuggestion = (sugg) => {
    setText((prev) =>
      prev && !prev.endsWith(" ") ? prev + " " + sugg : prev + sugg
    );
    setSuggestions([]);
    setActiveIndex(null);
    setTimeout(() => {
      try {
        inputRef.current?.focus();
        const len = (inputRef.current?.value || "").length;
        inputRef.current?.setSelectionRange(len, len);
      } catch (e) {}
    }, 0);
  };

  const onInputKeyDown = (e) => {
    if (!suggestions || suggestions.length === 0) return;
    const len = suggestions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % len));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev === null ? len - 1 : (prev - 1 + len) % len
      );
    } else if (e.key === "Tab") {
      if (activeIndex !== null && suggestions[activeIndex]) {
        e.preventDefault();
        applySuggestion(suggestions[activeIndex]);
      }
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    setTyping(true);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      setTyping(false);
    }, 700);

    // Emit to socket for real-time suggestions
    const socket = getMlSocket();
    if (socket && val.trim()) {
      socket.emit("sentence_autocomplete", { text: val.trim() });
    }
  };

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative">
          <input
            ref={inputRef}
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md p-2"
            placeholder="Type a message..."
            value={text}
            onChange={handleInputChange}
            onKeyDown={onInputKeyDown}
            autoComplete="off"
          />

          {suggestions && suggestions.length > 0 && text && (
            <div className="absolute left-0 right-0 bottom-full mb-2 z-50">
              <div className="bg-base-200 rounded-lg shadow-md divide-y border border-base-300 max-h-52 overflow-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      i === activeIndex
                        ? "bg-base-300 font-medium"
                        : "hover:bg-base-300"
                    } ${i === 0 ? "rounded-t-lg" : ""} ${
                      i === suggestions.length - 1 ? "rounded-b-lg" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
