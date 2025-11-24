"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Home, MoreVertical, Edit2, Trash2, Check, Copy, Sun, Moon, Zap, 
  MessageSquare, User, Send, Paperclip, ChevronRight, Users, LayoutGrid, 
  ChevronLeft, BrainCircuit, Activity, Sparkles, FolderPlus, Folder, 
  FolderOpen, ChevronDown, MoreHorizontal, Share, Archive, X, RotateCcw, 
  FileText, Image as ImageIcon, ExternalLink, Menu 
} from 'lucide-react';

// --- TYPES ---
interface Message {
  text: string;
  sender: "ai" | "user";
  time: string;
  files?: string[];
  raw?: string;
}

interface ChatSession {
  messages: Message[];
  title: string;
  lastUpdated: string;
  folderId: string | null;
  archived: boolean;
  agentId: string;
}

interface FolderType {
  id: string;
  name: string;
}

// --- CONSTANTS ---
const USER_AVATAR = "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg";

// --- ROBUST MARKDOWN SHIM v4 ---
const simpleMarkdown = {
  parse: (text: string) => {
    if (!text) return '';

    // 1. Helper: Inline Formatting
    const formatInline = (str: string) => {
      return str
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
        .replace(/__([\s\S]*?)__/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
        .replace(/\*([\s\S]*?)\*/g, '<em class="italic opacity-90">$1</em>')
        .replace(/_([\s\S]*?)_/g, '<em class="italic opacity-90">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-black/20 px-1 rounded font-mono text-xs">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-sky-400 hover:underline">$1</a>');
    };

    // 2. Helper: Auto-Bold Headers
    const autoBold = (str: string) => {
        const match = str.match(/^([A-ZÀ-ÖØ-Þ0-9\s&/-]{3,}:)(.*)/);
        if (match) {
            return `<strong class="font-bold text-slate-900 dark:text-white">${match[1]}</strong>${formatInline(match[2])}`;
        }
        return formatInline(str);
    };

    const lines = text.split('\n');
    let output = '';
    let tableBuffer: string[] = [];
    let inList = false;

    const flushTable = () => {
        if (tableBuffer.length === 0) return;
        
        if (tableBuffer.length < 2) {
            tableBuffer.forEach(line => {
                output += `<div class="mb-1">${formatInline(line)}</div>`;
            });
            tableBuffer = [];
            return;
        }

        let html = '<div class="overflow-x-auto my-3 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"><table class="w-full text-left border-collapse text-xs">';
        
        const headerCols = tableBuffer[0].split('|');
        const headerCells = headerCols.filter(c => c.trim()).map(c => c.trim());
        
        html += '<thead class="bg-slate-100 dark:bg-white/10"><tr>';
        headerCells.forEach(cell => {
            html += `<th class="p-2 border-b border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-white">${formatInline(cell)}</th>`;
        });
        html += '</tr></thead><tbody>';

        for (let i = 2; i < tableBuffer.length; i++) {
            const rowCols = tableBuffer[i].split('|');
            const rowCells = rowCols.filter(c => c.trim()).map(c => c.trim());
            html += '<tr class="border-b border-slate-200 dark:border-white/5 last:border-0 hover:bg-slate-100/50 dark:hover:bg-white/5">';
            rowCells.forEach(cell => {
                html += `<td class="p-2 opacity-90">${formatInline(cell)}</td>`;
            });
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        
        output += html;
        tableBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('|') && line.endsWith('|')) {
            if (inList) { output += '</ul>'; inList = false; }
            tableBuffer.push(line);
            continue;
        }
        flushTable();

        if (line.match(/^[-*]\s/)) {
            if (!inList) { output += '<ul class="list-disc ml-4 my-2 space-y-1">'; inList = true; }
            const content = line.replace(/^[-*]\s+/, '');
            output += `<li>${autoBold(content)}</li>`; 
            continue;
        }
        
        if (inList && line !== '') { output += '</ul>'; inList = false; }

        if (line === '') {
            output += '<div class="h-2"></div>';
        } else if (line.startsWith('### ')) {
            output += `<h3 class="text-lg font-bold mt-3 mb-1 text-slate-800 dark:text-white">${formatInline(line.replace(/^###\s/, ''))}</h3>`;
        } else if (line.startsWith('## ')) {
            output += `<h2 class="text-xl font-bold mt-4 mb-2 border-b border-white/10 pb-1 text-slate-800 dark:text-white">${formatInline(line.replace(/^##\s/, ''))}</h2>`;
        } else {
            output += `<div class="mb-1 leading-relaxed">${autoBold(line)}</div>`;
        }
    }
    
    flushTable();
    if (inList) output += '</ul>';

    return output;
  }
};

// --- AGENT DATABASE ---
const AGENTS_DB: Record<string, any> = {
  "tony-ai": {
    name: "Tony AI",
    role: "Sales Advisor",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Tony-AI-strategiest.png",
    description: "Il tuo consulente vendite digitale con 30 anni di esperienza. Analizzo i dati e ottimizzo il funnel.",
    primaryColor: "#0ea5e9", 
    accentColor: "#22d3ee"
  },
  "mike-ai": {
    name: "Mike AI",
    role: "Marketing Manager",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Mike-AI-digital-marketing-mg.png",
    description: "Il tuo stratega di marketing. Definisco funnel e strategie integrate per scalare il business.",
    primaryColor: "#3b82f6",
    accentColor: "#60a5fa"
  },
  "lara-ai": {
    name: "Lara AI",
    role: "Social Media Mgr",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Lara-AI-social-strategiest.png",
    description: "Gestisco i tuoi social media, creo calendari editoriali e massimizzo l'engagement.",
    primaryColor: "#ec4899",
    accentColor: "#f472b6"
  },
  "simone-ai": {
    name: "Simone AI",
    role: "SEO Copywriter",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Simone-AI-seo-copy.png",
    description: "Scrivo contenuti ottimizzati SEO che scalano le classifiche di Google e attraggono traffico.",
    primaryColor: "#10b981",
    accentColor: "#34d399"
  },
  "niko-ai": {
    name: "Niko AI",
    role: "SEO Strategist",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Niko-AI.png",
    description: "Architetto della tua presenza online. Analizzo il sito e pianifico la strategia SEO tecnica.",
    primaryColor: "#f59e0b",
    accentColor: "#fbbf24"
  },
  "valentina-ai": {
    name: "Valentina AI",
    role: "SEO Optimizer",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/03/Valentina-AI-AI-SEO-optimizer.png",
    description: "Ottimizzo i contenuti esistenti per massimizzare il posizionamento e il CTR.",
    primaryColor: "#8b5cf6",
    accentColor: "#a78bfa"
  },
  "alex-ai": {
    name: "Alex AI",
    role: "Ads Specialist",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/03/David-AI-Ai-Specialist-social-ads.png",
    description: "Gestisco le tue campagne pubblicitarie su Meta, Google e LinkedIn per il massimo ROI.",
    primaryColor: "#ef4444",
    accentColor: "#f87171"
  },
  "aladino-ai": {
    name: "Aladino AI",
    role: "New Products",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Aladdin-AI-consultant.png",
    description: "Invento nuovi prodotti e servizi ad alta marginalità per differenziarti sul mercato.",
    primaryColor: "#6366f1",
    accentColor: "#818cf8"
  },
  "jim-ai": {
    name: "Jim AI",
    role: "Sales Coach",
    image: "https://www.ai-scaleup.com/wp-content/uploads/2025/02/Jim-AI-%E2%80%93-AI-Coach.png",
    description: "Alleno il tuo team di vendita con simulazioni e role-play per chiudere più contratti.",
    primaryColor: "#f97316",
    accentColor: "#fb923c"
  }
};

// --- AGENT ROSTER LIST ---
const AI_TEAM_LIST = [
    { id: "mike-ai", href: "#" },
    { id: "tony-ai", href: "#" },
    { id: "lara-ai", href: "#" },
    { id: "simone-ai", href: "#" },
    { id: "niko-ai", href: "#" },
    { id: "valentina-ai", href: "#" },
    { id: "alex-ai", href: "#" },
    { id: "aladino-ai", href: "#" },
    { id: "jim-ai", href: "#" },
];

// --- MOCK USER BUTTON (Header - Icon Version) ---
const MockUserButton = () => (
  <button className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-sky-400/50 hover:ring-sky-400 transition-all shadow-[0_0_15px_rgba(14,165,233,0.6)] group">
    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <User size={20} className="text-sky-200" />
    </div>
  </button>
);

export default function App() {
  // --- STATE ---
  const [activeAgentId, setActiveAgentId] = useState<string>("tony-ai");
  const currentAgent = AGENTS_DB[activeAgentId] || AGENTS_DB["tony-ai"];

  const [messages, setMessages] = useState<Message[]>([]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarMode, setSidebarMode] = useState<'chats' | 'agents'>('chats');
  const [useMemory, setUseMemory] = useState(true);
  const [chats, setChats] = useState<Record<string, ChatSession>>({});
  const [currentChatId, setCurrentChatId] = useState("default");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [renamingChat, setRenamingChat] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set());
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(true);
  
  // Folder State
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedChatId, setDraggedChatId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // --- REFS ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const CURRENT_NAMESPACE = useRef("");

  const N8N_ENDPOINT = "https://n8n-c2lq.onrender.com/webhook/0c898053-01f4-494d-b013-165c8a9023d1/chat?action=sendMessage";

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setIsDark(savedTheme === 'dark');
    else setIsDark(true);

    // Mobile Responsive Check
    if (window.innerWidth < 768) {
        setSidebarVisible(false);
    }

    const generateUUID = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

    let namespace = localStorage.getItem("Namespace");
    if (!namespace) {
      namespace = generateUUID();
      localStorage.setItem("Namespace", namespace);
    }
    CURRENT_NAMESPACE.current = namespace;

    const savedChats = localStorage.getItem("tony-ai-chats");
    if (savedChats) {
      try {
        // Cast the parsed JSON to the specific type to fix the TS error
        const parsedChats = JSON.parse(savedChats) as Record<string, ChatSession>;
        setChats(parsedChats);
        if (Object.keys(parsedChats).length > 0) {
          const sorted = Object.entries(parsedChats).sort(
            ([, a], [, b]) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
          );
          const recentChatId = sorted[0][0];
          setCurrentChatId(recentChatId);
          setMessages(parsedChats[recentChatId].messages || []);
          if(parsedChats[recentChatId].agentId) {
              setActiveAgentId(parsedChats[recentChatId].agentId);
          }
        } else {
          initNewChatForAgent(currentAgent);
        }
      } catch (e) {
        console.error("Failed to parse saved chats", e);
        initNewChatForAgent(currentAgent);
      }
    } else {
        initNewChatForAgent(currentAgent);
    }

    const savedFolders = localStorage.getItem("tony-ai-folders");
    if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders));
        } catch(e) { console.error("Failed to parse folders", e)}
    }
  }, []);

  useEffect(() => {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem("theme", "dark");
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [inputValue]);

  useEffect(() => {
      if (isCreatingFolder && newFolderInputRef.current) {
          newFolderInputRef.current.focus();
      }
  }, [isCreatingFolder]);

  // --- AGENT SWITCHING LOGIC ---
  const switchAgent = (agentId: string) => {
      setActiveAgentId(agentId);
      const newAgent = AGENTS_DB[agentId];
      setSidebarVisible(true); 
      // setSidebarMode('chats'); // Keep tabs stable
      initNewChatForAgent(newAgent, agentId);
  }

  const initNewChatForAgent = (agent: any, specificAgentId?: string) => {
      const targetAgentId = specificAgentId || activeAgentId;
      const newChatId = "chat_" + Date.now();
      
      let messageText = `Ciao! Sono **${agent.name}**. ${agent.description} Come posso aiutarti?`;
      
      if (agent.name === "Tony AI") {
          messageText = `Ciao! Sono **Tony AI**.
Il tuo consulente vendite digitale con 30 anni di esperienza. Analizzo i dati e ottimizzo il funnel.

30 anni di esperienza nel mondo commerciale. Sono qui per aiutarti a sviluppare strategie di vendita efficaci e implementare processi che massimizzino i tuoi risultati commerciali.

Posso supportarti in queste aree principali:
- **STRATEGIA E ACQUISIZIONE**: Sviluppo di strategie commerciali, identificazione target ideale, lead generation e ottimizzazione del funnel di vendita.
- **CUSTOMER MANAGEMENT**: Gestione clienti VIP, programmi di fidelizzazione, strategie di upsell/cross-sell e riduzione del churn.
- **TEAM E PROCESSI**: Formazione team vendite, ottimizzazione CRM, creazione di script e gestione performance commerciali.

Per poter sviluppare la strategia commerciale più efficace per te, ho bisogno che mi rispondi nel modo più preciso possibile ad alcune domande che chiameremo **'DOMANDE DI TONY AI'**. Disponi già di queste domande e delle relative risposte?

In alternativa, preferisci una consulenza completa per sviluppare un sales plan strutturato, oppure vuoi concentrarti su una delle 3 aree specifiche sopra menzionate?`;
      }

      const welcomeMsg: Message = {
        text: messageText,
        sender: "ai",
        time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      };
      
      setCurrentChatId(newChatId);
      setMessages([welcomeMsg]);
      
      setChats(prev => {
          const newChat = {
              messages: [welcomeMsg],
              title: `Missione con ${agent.name}`, 
              lastUpdated: new Date().toISOString(),
              folderId: null,
              archived: false,
              agentId: targetAgentId
          };
          const newChats = { [newChatId]: newChat, ...prev }; 
          localStorage.setItem("tony-ai-chats", JSON.stringify(newChats));
          return newChats;
      });
  }

  // --- CHAT STATE HELPER ---
  const updateChatState = (chatId: string, updates: Partial<ChatSession>) => {
      setChats(prev => {
          const existing = prev[chatId] || { 
              messages: [], 
              lastUpdated: new Date().toISOString(), 
              title: "Nuova Missione", 
              folderId: null, 
              archived: false, 
              agentId: activeAgentId 
          };
          const updatedChat = { ...existing, ...updates };
          const newChats = { ...prev, [chatId]: updatedChat };
          localStorage.setItem("tony-ai-chats", JSON.stringify(newChats));
          return newChats;
      });
  };

  const createNewChat = () => {
    initNewChatForAgent(currentAgent);
    setSidebarVisible(true); 
    setSidebarMode('chats');
  }

  const loadChat = (chatId: string) => {
    if (!chats[chatId]) return;
    setCurrentChatId(chatId);
    setMessages(chats[chatId].messages || []);
    if (chats[chatId].agentId && chats[chatId].agentId !== activeAgentId) {
        setActiveAgentId(chats[chatId].agentId);
    }
    setActiveMenu(null);
    if (window.innerWidth < 768) {
        setSidebarVisible(false);
    }
  }

  // --- FOLDER LOGIC ---
  const confirmCreateFolder = () => {
      if (!newFolderName.trim()) {
          setIsCreatingFolder(false);
          return;
      }
      const newFolder = { id: `folder_${Date.now()}`, name: newFolderName };
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      localStorage.setItem("tony-ai-folders", JSON.stringify(updatedFolders));
      setExpandedFolders(prev => new Set(prev).add(newFolder.id));
      setIsCreatingFolder(false);
      setNewFolderName("");
  }

  const cancelCreateFolder = () => {
      setIsCreatingFolder(false);
      setNewFolderName("");
  }

  const startCreateFolder = () => {
      setIsCreatingFolder(true);
      setNewFolderName("");
  }

  const toggleFolder = (folderId: string) => {
      setExpandedFolders(prev => {
          const next = new Set(prev);
          if (next.has(folderId)) next.delete(folderId);
          else next.add(folderId);
          return next;
      });
  }

  const deleteFolder = (folderId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Eliminare cartella? Le chat torneranno nella lista principale.")) return;
      
      const updatedChats = { ...chats };
      Object.keys(updatedChats).forEach(key => {
          if (updatedChats[key].folderId === folderId) {
              updatedChats[key].folderId = null;
          }
      });
      setChats(updatedChats);
      localStorage.setItem("tony-ai-chats", JSON.stringify(updatedChats));

      const updatedFolders = folders.filter(f => f.id !== folderId);
      setFolders(updatedFolders);
      localStorage.setItem("tony-ai-folders", JSON.stringify(updatedFolders));
  }

  // --- CONTEXT MENU ACTIONS ---
  const deleteChat = (chatIdToDelete: string, e: React.MouseEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
    }

    setActiveMenu(null);
    
    if (!confirm("Sei sicuro di voler eliminare questa chat?")) return;
    
    const updatedChats = { ...chats };
    if (!updatedChats[chatIdToDelete]) return;

    delete updatedChats[chatIdToDelete];
    const remainingIds = Object.keys(updatedChats);

    if (remainingIds.length === 0) {
        const agent = AGENTS_DB[activeAgentId] || AGENTS_DB["tony-ai"];
        const newChatId = "chat_" + Date.now();
        const welcomeMsg: Message = {
            text: `Ciao! Sono **${agent.name}**. ${agent.description} Come posso aiutarti?`,
            sender: "ai",
            time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        };
        
        const newChatState = {
            [newChatId]: {
                messages: [welcomeMsg],
                title: `Missione con ${agent.name}`, 
                lastUpdated: new Date().toISOString(),
                folderId: null,
                archived: false,
                agentId: activeAgentId
            }
        };
        
        localStorage.setItem("tony-ai-chats", JSON.stringify(newChatState));
        setChats(newChatState);
        setCurrentChatId(newChatId);
        setMessages([welcomeMsg]);
    } else {
        localStorage.setItem("tony-ai-chats", JSON.stringify(updatedChats));
        
        if (chatIdToDelete === currentChatId) {
             const sorted = remainingIds.sort((a,b) => {
                 const timeA = new Date(updatedChats[a].lastUpdated).getTime() || 0;
                 const timeB = new Date(updatedChats[b].lastUpdated).getTime() || 0;
                 return timeB - timeA;
             });
             const nextId = sorted[0];
             setCurrentChatId(nextId);
             setMessages(updatedChats[nextId].messages || []);
        }
        
        setChats(updatedChats);
    }
  }

  const archiveChat = (chatId: string) => {
      updateChatState(chatId, { archived: !chats[chatId]?.archived });
      setActiveMenu(null);
  }

  const shareChat = (chatId: string) => {
      const url = `${window.location.origin}/chat/${chatId}`;
      navigator.clipboard.writeText(url);
      alert("Link copiato negli appunti: " + url);
      setActiveMenu(null);
  }

  const startRenaming = (chatId: string) => {
    setRenamingChat(chatId);
    setRenameValue(chats[chatId]?.title || "");
    setActiveMenu(null);
  }

  const confirmRename = (chatId: string) => {
    if (!renameValue.trim()) {
      setRenamingChat(null);
      return;
    }
    updateChatState(chatId, { title: renameValue.trim() });
    setRenamingChat(null);
    setRenameValue("");
  }

  // --- DRAG & DROP LOGIC ---
  const handleDragStart = (e: React.DragEvent, chatId: string) => {
      e.dataTransfer.setData("chatId", chatId);
      setDraggedChatId(chatId);
  }

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
      e.preventDefault();
      setDragOverFolderId(folderId);
  }

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
      e.preventDefault();
      setDragOverFolderId(null);
      const chatId = e.dataTransfer.getData("chatId");
      if (!chatId || !chats[chatId]) return;
      if (chats[chatId].folderId === targetFolderId) return;

      updateChatState(chatId, { folderId: targetFolderId });
      
      if (targetFolderId) {
          setExpandedFolders(prev => new Set(prev).add(targetFolderId));
      }
      setDraggedChatId(null);
  }

  // --- MESSAGING ---
  const formatMessageText = (text: string) => {
    if (!text) return '';
    try {
      return simpleMarkdown.parse(text);
    } catch (e) { return text }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;
    
    const userMessage: Message = { 
        text: inputValue, 
        sender: "user", 
        time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        files: selectedFiles.map(f => f.name)
    };
    
    setMessages((prev) => {
        const newMsgs = [...prev, userMessage];
        updateChatState(currentChatId, { 
            messages: newMsgs, 
            lastUpdated: new Date().toISOString(), 
            title: chats[currentChatId]?.title || (inputValue.slice(0, 30) || "Nuova Missione") 
        });
        return newMsgs;
    });
    
    setInputValue("");
    setSelectedFiles([]);
    setIsLoading(true);
    
    setMessages((prev) => [...prev, { text: "...", sender: "ai", time: "", raw: "" }]);

    try {
      const sessionId = localStorage.getItem("tony-ai-session-id") || "session_" + Date.now();
      
      const response = await fetch(N8N_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: inputValue + (selectedFiles.length ? ` [Attached: ${selectedFiles.map(f => f.name).join(', ')}]` : ''),
          sessionId: sessionId,
          useMemory: useMemory,
          metadata: { namespace: CURRENT_NAMESPACE.current, source: activeAgentId },
        }),
      });

      if (!response.body) throw new Error("No response");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let rawText = "";
      let isFirstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        
        for (const line of lines) {
            const trimmed = line.replace(/^data:\s?/, "").trim();
            if (!trimmed) continue;
            try {
                const obj = JSON.parse(trimmed);
                if (obj.type === 'item' && typeof obj.content === 'string') {
                      if (isFirstChunk) {
                         setMessages(prev => {
                             const newMsgs = [...prev]; 
                             newMsgs[newMsgs.length - 1] = { text: obj.content, sender: 'ai', time: '', raw: obj.content }; 
                             return newMsgs;
                         });
                         isFirstChunk = false;
                     } else {
                         rawText += obj.content;
                         setMessages(prev => {
                             const newMsgs = [...prev]; 
                             newMsgs[newMsgs.length - 1].text = rawText; 
                             return newMsgs;
                         });
                     }
                }
            } catch (e) {}
        }
      }
      
      setMessages(prev => {
        const newMsgs = [...prev]; 
        newMsgs[newMsgs.length - 1].time = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
        if(!newMsgs[newMsgs.length - 1].text || newMsgs[newMsgs.length - 1].text === "...") newMsgs[newMsgs.length - 1].text = "Risposta completata.";
        
        updateChatState(currentChatId, { messages: newMsgs, lastUpdated: new Date().toISOString() });
        return newMsgs;
      });
      
    } catch (error) {
      console.error(error);
      setMessages(prev => {
         const newMsgs = [...prev]; 
         if (newMsgs[newMsgs.length - 1].text === "...") {
            newMsgs[newMsgs.length - 1].text = "Errore di connessione. Il server n8n potrebbe non essere raggiungibile.";
         }
         return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  }

  const sortedChats = Object.entries(chats).sort(([, a], [, b]) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  }
  
    const removeFile = (index: number) => {
      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  } 

   // --- COPY HANDLER (RICH TEXT + UNWRAPPED TABLES) ---
  const handleCopyMessage = async (text: string, index: number) => {
    try {
      let htmlContent = formatMessageText(text);

      // INJECT INLINE STYLES
      htmlContent = htmlContent
        // 1. UNWRAP TABLE: Remove the surrounding DIV completely
        .replace(/<div class="overflow-x-auto[^>]*>/g, "")
        .replace(/<\/table><\/div>/g, "</table>")
        
        // 2. Text Formatting
        .replace(/<strong[^>]*>/g, '<strong style="font-weight: 700; color: #0f172a;">')
        .replace(/<em[^>]*>/g, '<em style="font-style: italic; color: #334155;">')
        .replace(/<code[^>]*>/g, '<code style="background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; border: 1px solid #e2e8f0;">')
        .replace(/<ul[^>]*>/g, '<ul style="margin-left: 20px; list-style-type: disc; padding-left: 20px; margin-bottom: 10px;">')
        .replace(/<li[^>]*>/g, '<li style="margin-bottom: 4px;">')
        .replace(/<h3[^>]*>/g, '<h3 style="font-size: 18px; font-weight: bold; margin-top: 15px; margin-bottom: 5px; color: #0f172a;">')
        .replace(/<h2[^>]*>/g, '<h2 style="font-size: 22px; font-weight: bold; border-bottom: 2px solid #e2e8f0; margin-top: 20px; margin-bottom: 10px; color: #0f172a;">')

        // 3. Table Formatting
        .replace(/<table[^>]*>/g, '<table style="border-collapse: collapse; width: 100%; border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 14px; margin: 10px 0;">')
        .replace(/<thead[^>]*>/g, '<thead style="background-color: #f1f5f9;">')
        .replace(/<th[^>]*>/g, '<th style="border: 1px solid #94a3b8; padding: 10px; text-align: left; font-weight: bold; background-color: #f1f5f9; color: #0f172a;">')
        .replace(/<td[^>]*>/g, '<td style="border: 1px solid #cbd5e1; padding: 8px; color: #334155;">');

      const finalHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #0f172a; line-height: 1.6;">
          ${htmlContent}
        </body>
        </html>
      `;

      const blobHtml = new Blob([finalHtml], { type: "text/html" });
      const blobText = new Blob([text], { type: "text/plain" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        }),
      ]);

      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);

    } catch (err) {
      console.error("Rich copy failed", err);
      navigator.clipboard.writeText(text);
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    }
  };
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        :root {
            --brand-dark: #020617;
            --brand-primary: #0ea5e9;
            --font-tech: 'Rajdhani', sans-serif;
        }
        body { font-family: var(--font-tech); background-color: #f8fafc; color: #0f172a; overflow: hidden; }
        .dark body { background-color: var(--brand-dark); color: #f8fafc; }
        
        .glass-panel { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05); }
        .dark .glass-panel { background: rgba(2, 6, 23, 0.85); border: 1px solid rgba(14, 165, 233, 0.15); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4); }

        @keyframes brain-float { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
        .animate-float { animation: brain-float 6s ease-in-out infinite; }
        
        @keyframes brain-wave-flow { 0% { background-position: 0% 50%; opacity: 0.2; } 50% { background-position: 100% 50%; opacity: 0.5; } 100% { background-position: 0% 50%; opacity: 0.2; } }
        .brainwave-overlay { background: linear-gradient(90deg, transparent, rgba(14,165,233,0.3), transparent, rgba(34,211,238,0.3), transparent); background-size: 200% 100%; animation: brain-wave-flow 3s linear infinite; pointer-events: none; }

        @keyframes synapse-pulse { 0% { box-shadow: 0 -10px 40px rgba(14,165,233,0.1); border-top-color: rgba(14,165,233,0.3); } 50% { box-shadow: 0 -20px 60px rgba(14,165,233,0.4); border-top-color: rgba(14,165,233,0.8); } 100% { box-shadow: 0 -10px 40px rgba(14,165,233,0.1); border-top-color: rgba(14,165,233,0.3); } }
        .synapse-active { animation: synapse-pulse 1.5s ease-in-out infinite; position: relative; }

        @keyframes neural-grid-move { 0% { transform: translateY(0); } 100% { transform: translateY(50px); } }
        .neural-grid-active { 
            background-image: linear-gradient(0deg, transparent 24%, rgba(14, 165, 233, 0.05) 25%, rgba(14, 165, 233, 0.05) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, 0.05) 75%, rgba(14, 165, 233, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(14, 165, 233, 0.05) 25%, rgba(14, 165, 233, 0.05) 26%, transparent 27%, transparent 74%, rgba(14, 165, 233, 0.05) 75%, rgba(14, 165, 233, 0.05) 76%, transparent 77%, transparent);
            background-size: 50px 50px;
            animation: neural-grid-move 3s linear infinite;
        }
        
        @keyframes synapse-beam { 0% { opacity: 0; transform: translateY(20px) scale(0.8); } 50% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-20px) scale(1.2); } }
        .synapse-beam::before { content: ''; position: absolute; width: 100%; height: 100%; top: 0; left: 0; background: radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%); animation: synapse-beam 2s infinite; pointer-events: none; z-index: -1; }

        .markdown-body table { width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.5em 0; border-radius: 12px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.2); font-size: 0.95em; }
        .dark .markdown-body table { border-color: rgba(30, 41, 59, 0.8); }
        .markdown-body th { background-color: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 12px 16px; border-bottom: 2px solid rgba(148, 163, 184, 0.3); }
        .dark .markdown-body th { background-color: #1e293b; color: #cbd5e1; border-bottom-color: rgba(51, 65, 85, 0.8); }
        .markdown-body td { padding: 12px 16px; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
        .dark .markdown-body td { border-bottom-color: rgba(51, 65, 85, 0.4); }
        .markdown-body tr:nth-child(even) { background-color: rgba(241, 245, 249, 0.4); }
        .dark .markdown-body tr:nth-child(even) { background-color: rgba(30, 41, 59, 0.3); }
        
        .markdown-body p { margin-bottom: 1.25em; line-height: 1.6; }
        .markdown-body strong { font-weight: 700; color: inherit; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1.25em; }
        
        .btn-electric {
           background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
           box-shadow: 0 0 15px rgba(14,165,233,0.5);
           transition: all 0.3s ease;
        }
        .btn-electric:hover {
           box-shadow: 0 0 25px rgba(14,165,233,0.8);
           transform: translateY(-1px);
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(30, 41, 59, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(14, 165, 233, 0.5); }
      `}</style>

      <div className={`flex h-screen w-full bg-tech-grid azure-glow-bg ${isDark ? 'dark' : ''}`}>
        
        <div className={`glass-panel flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 
                        ${sidebarVisible ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0'} 
                        fixed md:relative h-full border-r border-sky-100 dark:border-sky-900/30`}>
            
            <div className="p-6 border-b border-sky-100 dark:border-sky-900/30 bg-gradient-to-b from-white/50 to-transparent dark:from-sky-900/20">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer">
                            <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-cyan-300 shadow-lg shadow-sky-400/20 group-hover:shadow-sky-400/50 transition-all duration-300">
                                <img src={currentAgent.image} className="w-full h-full rounded-full object-cover bg-slate-900" alt={currentAgent.name} />
                            </div>
                            <div className="absolute bottom-0.5 right-0 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide font-tech">AI TEAM</h2>
                    </div>
                    <button onClick={() => setSidebarVisible(false)} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors md:hidden">
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <button 
                    onClick={createNewChat}
                    className="w-full py-3.5 px-4 btn-electric text-white font-bold rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider text-sm border border-white/10"
                >
                    <MessageSquare size={18} strokeWidth={2.5} /> Nuova Missione
                </button>
            </div>

            <div className="flex p-2 gap-1 mx-4 mt-4 bg-slate-100/80 dark:bg-slate-900/50 rounded-xl border border-sky-200/50 dark:border-sky-700/30 shadow-inner">
                <button 
                    onClick={() => setSidebarMode('chats')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-2
                    ${sidebarMode === 'chats' 
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-100 dark:border-sky-600/30' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <LayoutGrid size={14} /> Missioni
                </button>
                <button 
                    onClick={() => setSidebarMode('agents')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-2
                    ${sidebarMode === 'agents' 
                        ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-sky-100 dark:border-sky-600/30' 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <Users size={14} /> AI Team
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 mt-2 custom-scrollbar"
                 onDragOver={(e) => handleDragOver(e, null)} 
                 onDrop={(e) => handleDrop(e, null)}
            >
                
                {sidebarMode === 'chats' && (
                    <div className="animate-in fade-in duration-300 space-y-3">
                        
                        {isCreatingFolder ? (
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-sky-400 flex gap-2 items-center animate-in fade-in slide-in-from-top-2">
                                <input 
                                    ref={newFolderInputRef}
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmCreateFolder()}
                                    placeholder="Nome cartella..."
                                    className="flex-1 bg-transparent text-sm focus:outline-none text-slate-800 dark:text-white placeholder-slate-400"
                                />
                                <button onClick={confirmCreateFolder} className="p-1 text-green-500 hover:bg-green-500/10 rounded"><Check size={14}/></button>
                                <button onClick={cancelCreateFolder} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X size={14}/></button>
                            </div>
                        ) : (
                            <button 
                                onClick={startCreateFolder}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-sky-500 border border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-400 rounded-lg transition-all"
                            >
                                <FolderPlus size={14} /> Nuova Cartella
                            </button>
                        )}

                        {folders.map(folder => {
                            const isExpanded = expandedFolders.has(folder.id);
                            const isDragTarget = dragOverFolderId === folder.id;
                            const folderChats = Object.entries(chats).filter(([, c]) => c.folderId === folder.id);

                            return (
                                <div key={folder.id} 
                                     className={`rounded-xl border transition-all duration-300 overflow-hidden mb-1
                                     ${isDragTarget 
                                        ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30 shadow-[0_0_15px_rgba(14,165,233,0.3)] scale-[1.02]' 
                                        : 'border-slate-300 dark:border-slate-700 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'}`}
                                     onDragOver={(e) => handleDragOver(e, folder.id)}
                                     onDrop={(e) => handleDrop(e, folder.id)}
                                >
                                    <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5"
                                         onClick={() => toggleFolder(folder.id)}>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {isExpanded ? <FolderOpen size={16} className="text-sky-500" /> : <Folder size={16} className="text-slate-500" />}
                                            {folder.name}
                                            <span className="text-[10px] text-slate-500 font-mono bg-white/50 dark:bg-black/20 px-1.5 rounded-full">{folderChats.length}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={(e) => deleteFolder(folder.id, e)} className="p-1 text-slate-400 hover:text-red-500 rounded"><Trash2 size={12}/></button>
                                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}/>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-slate-50/50 dark:bg-black/20 p-1 space-y-1 border-t border-slate-200 dark:border-slate-700">
                                            {folderChats.length === 0 && <div className="text-[10px] text-slate-400 text-center py-2 italic">Trascina qui le chat</div>}
                                            {folderChats.sort(([,a], [,b]) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).map(([id, chat]) => {
                                                const isActive = id === currentChatId;
                                                return (
                                                    <div key={id} 
                                                         onClick={() => loadChat(id)}
                                                         draggable
                                                         onDragStart={(e) => handleDragStart(e, id)}
                                                         className={`group flex justify-between items-center p-1.5 rounded-lg cursor-pointer border transition-all duration-200 ml-2
                                                         ${isActive 
                                                            ? 'bg-white dark:bg-slate-800 border-l-2 border-l-sky-500 border-y-transparent border-r-transparent shadow-sm' 
                                                            : 'border-transparent hover:bg-white/60 dark:hover:bg-white/5'}`}>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`text-xs font-medium truncate ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                {chat.title}
                                                            </h4>
                                                        </div>
                                                        <button onClick={(e) => deleteChat(id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500"><Trash2 size={10}/></button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        <div className="space-y-1 pt-2">
                            {Object.entries(chats)
                                .filter(([, c]) => !c.folderId && (showArchived ? c.archived : !c.archived))
                                .sort(([, a], [, b]) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                                .map(([id, chat]) => {
                                const isActive = id === currentChatId;
                                const isMenuOpen = activeMenu === id;
                                
                                return (
                                    <div key={id} 
                                         onClick={() => loadChat(id)}
                                         draggable
                                         onDragStart={(e) => handleDragStart(e, id)}
                                         className={`group relative p-3 rounded-xl cursor-pointer border transition-all duration-300
                                         ${isActive 
                                            ? 'bg-gradient-to-r from-sky-50 to-white dark:from-sky-900/30 dark:to-slate-900/30 border-sky-200 dark:border-sky-500/50 shadow-sm border-l-4 border-l-sky-500' 
                                            : 'border-transparent hover:bg-white/60 dark:hover:bg-white/5 hover:translate-x-1'}`}>
                                        
                                        {renamingChat === id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    autoFocus
                                                    className="w-full bg-transparent border-b border-sky-500 focus:outline-none text-sm"
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && confirmRename(id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <button onClick={(e) => {e.stopPropagation(); confirmRename(id)}} className="text-green-500"><Check size={14}/></button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-300'}`}>
                                                        {pinnedChats.has(id) && "📌 "}{chat.archived && "📦 "}{chat.title || "Nuova Strategia"}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        {new Date(chat.lastUpdated).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})} • {new Date(chat.lastUpdated).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                    </p>
                                                </div>
                                                
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : id) }} 
                                                        className={`p-1.5 rounded-md text-slate-400 hover:text-sky-500 hover:bg-sky-100 dark:hover:bg-white/10 transition-all ${isMenuOpen ? 'bg-sky-100 dark:bg-white/10 text-sky-500' : 'opacity-0 group-hover:opacity-100'}`}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>

                                                    {isMenuOpen && (
                                                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                            <button onClick={(e) => { e.stopPropagation(); shareChat(id) }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/50">
                                                                <Share size={16} /> Condividi
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); startRenaming(id) }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                                                                <Edit2 size={16} /> Rinomina
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); archiveChat(id) }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                                                                {chat.archived ? <RotateCcw size={16} /> : <Archive size={16} />} {chat.archived ? 'Ripristina' : 'Archivia'}
                                                            </button>
                                                            <button onClick={(e) => deleteChat(id, e)} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-sm text-red-500 border-t border-slate-100 dark:border-slate-700/50">
                                                                <Trash2 size={16} /> Elimina
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 mt-4">
                            <button 
                                onClick={() => setShowArchived(!showArchived)}
                                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2"
                            >
                                <Archive size={12} /> {showArchived ? "Nascondi Archiviati" : "Mostra Archiviati"}
                            </button>
                        </div>
                    </div>
                )}

                {sidebarMode === 'agents' && (
                    <div className="space-y-2 animate-in fade-in duration-300 px-1">
                         {AI_TEAM_LIST.map((agentItem, idx) => {
                             const agentData = AGENTS_DB[agentItem.id] || {};
                             return (
                                 <div key={idx} onClick={() => switchAgent(agentItem.id)} className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all duration-300 group cursor-pointer hover:shadow-md dark:hover:shadow-sky-900/20 ${activeAgentId === agentItem.id ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-500/50' : 'bg-white/40 dark:bg-white/5 border-transparent hover:bg-white/80 dark:hover:bg-white/10'}`}>
                                     <div className="flex items-center gap-3">
                                         <div className={`w-10 h-10 rounded-full p-0.5 transition-all duration-300 ${activeAgentId === agentItem.id ? 'bg-gradient-to-tr from-sky-500 to-cyan-400' : 'bg-slate-200 dark:bg-slate-700'}`}><img src={agentData.image} className="w-full h-full rounded-full object-cover bg-white" alt={agentData.name}/></div>
                                         <div><h4 className={`text-sm font-bold transition-colors ${activeAgentId === agentItem.id ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-200'}`}>{agentData.name}</h4><p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{agentData.role}</p></div>
                                     </div>
                                     <button onClick={(e) => { e.stopPropagation(); window.open(agentItem.href, '_blank'); }} className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors"><ExternalLink size={14} /></button>
                                 </div>
                             )
                         })}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-sky-100 dark:border-sky-900/30 bg-white/30 dark:bg-black/20 backdrop-blur-sm"><div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-sky-100 dark:border-white/5"><div className="flex items-center gap-2"><Zap size={16} className="text-sky-500" fill="currentColor" /><span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Memory Core</span></div><button onClick={() => { setUseMemory(!useMemory); localStorage.setItem("tony-ai-use-memory", String(!useMemory)) }} className={`w-10 h-5 rounded-full relative transition-all duration-300 ${useMemory ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-slate-300 dark:bg-slate-600'}`}><div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${useMemory ? 'left-5.5' : 'left-0.5'}`}></div></button></div></div>
        </div>

        <div className={`flex-1 flex flex-col relative h-full overflow-hidden transition-colors duration-1000 ${isLoading ? 'bg-sky-50/50 dark:bg-sky-950/20 neural-grid-active' : 'bg-slate-50/50 dark:bg-transparent'}`}>
            
            <div className="sticky top-4 z-50 px-4 md:px-8">
                <div className={`w-full max-w-6xl mx-auto rounded-2xl p-1 shadow-2xl transition-all duration-500 animate-float overflow-hidden relative ${isDark ? 'bg-slate-800/95 border border-sky-500/30 shadow-[0_0_50px_rgba(14,165,233,0.15)]' : 'bg-sky-100/90 border border-sky-300 shadow-[0_10px_40px_rgba(14,165,233,0.25)]'} backdrop-blur-xl`}>
                    <div className="absolute inset-0 pointer-events-none opacity-40 brainwave-overlay"></div>
                    <div className="relative flex items-center justify-between p-3 md:p-4 rounded-xl z-10">
                        <div className="flex items-center gap-4 md:gap-6">
                            <button onClick={() => setSidebarVisible(!sidebarVisible)} className="p-3 rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/40 hover:scale-110 hover:shadow-sky-500/60 transition-all active:scale-95 border-t border-white/20 md:hidden flex items-center justify-center"><Menu size={24} strokeWidth={3} /></button>
                            <button onClick={() => setSidebarVisible(!sidebarVisible)} className="p-3 rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/40 hover:scale-110 hover:shadow-sky-500/60 transition-all active:scale-95 border-t border-white/20 hidden md:flex items-center justify-center"><ChevronRight size={24} strokeWidth={3} /></button>

                            <div className="flex items-center gap-4 md:gap-6">
                                <div className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full border-[3px] border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.6)] overflow-hidden bg-slate-950 ${isLoading ? 'animate-pulse shadow-sky-300 ring-2 ring-sky-500/50' : ''}`}><img src={currentAgent.image} className="w-full h-full object-cover" alt="Hero" /><div className="absolute inset-0 bg-sky-500/10 mix-blend-overlay"></div></div>
                                <div><div className="flex items-center gap-3 mb-1"><h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none drop-shadow-md">{currentAgent.name}</h1>{isLoading ? <span className="flex items-center gap-2 px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/50 text-sky-400 text-[10px] font-bold tracking-widest uppercase animate-pulse"><BrainCircuit size={12} /> Thinking...</span> : <span className="px-2 py-0.5 rounded bg-sky-500 text-white text-[10px] font-bold tracking-widest shadow-[0_0_10px_rgba(14,165,233,0.5)] uppercase">Online</span>}</div><p className={`text-sm leading-tight max-w-md font-medium hidden lg:block opacity-90 ${isDark ? 'text-sky-100' : 'text-slate-600'}`}>"{currentAgent.description}"</p></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full bg-slate-200/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition text-slate-600 dark:text-slate-300">{isDark ? <Sun size={20}/> : <Moon size={20}/>}</button>
                            <div className="h-8 w-px bg-slate-300 dark:bg-white/10 mx-2 hidden sm:block"></div>
                            <a href="/" className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all border-t border-white/20 flex items-center justify-center group"><Home size={22} strokeWidth={2.5} className="group-hover:scale-110 transition-transform"/></a>
                            <div className="hidden sm:block"><MockUserButton /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 z-10 custom-scrollbar relative pt-4">
                <div className="max-w-6xl mx-auto space-y-6 pb-4 relative z-10">
                    {messages.map((message, index) => (
                        <div key={index} className={`flex gap-4 ${message.sender === 'user' ? 'flex-row-reverse' : ''} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-md ring-2 ring-white dark:ring-slate-800 overflow-hidden ${message.sender === 'ai' ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {message.sender === 'ai' ? (
                                    <img src={currentAgent.image} alt="AI" className="w-full h-full object-cover"/> 
                                ) : (
                                    <img src={USER_AVATAR} alt="User" className="w-full h-full object-cover"/>
                                )}
                            </div>
                            <div className={`relative max-w-[90%] sm:max-w-[85%] p-5 rounded-2xl text-sm sm:text-base shadow-sm hover:shadow-md transition-shadow duration-300 ${message.sender === 'ai' 
                                ? 'glass-panel rounded-tl-none border-l-4 border-l-sky-500 text-slate-800 dark:text-slate-100 bg-white/80 dark:bg-slate-800/80' 
                                : 'bg-white dark:bg-gradient-to-r dark:from-sky-500 dark:to-blue-600 text-slate-900 dark:text-white rounded-tr-none border border-sky-400 shadow-sm'}`}>
                                {message.text === "..." ? (
                                    <div className="flex items-center gap-2"><Activity size={16} className="text-sky-500 animate-pulse" /><span className="text-xs font-mono text-sky-500 animate-pulse">ANALYZING...</span></div>
                                ) : (
                                    <div className={`markdown-body ${message.sender === 'user' ? 'text-inherit' : 'text-inherit'}`}>
                                        {message.sender === 'ai' && !isLoading && (
  <button 
    onClick={() => handleCopyMessage(message.text, index)} 
    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-sky-100 dark:hover:bg-white/10 rounded text-slate-400 hover:text-sky-600"
    title="Copy formatted"
  >
    {copiedMessageIndex === index ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
  </button>
)}
                                        {message.files && message.files.length > 0 && <div className="flex flex-wrap gap-2 mb-3">{message.files.map((file, fIdx) => <div key={fIdx} className="flex items-center gap-2 p-2 rounded-lg bg-white/10 border border-white/20 text-xs"><FileText size={14} /><span className="truncate max-w-[150px]">{file}</span></div>)}</div>}
                                        <div dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }} />
                                    </div>
                                )}
                                <div className={`text-[10px] mt-2 text-right font-mono opacity-70 ${message.sender === 'user' ? 'text-inherit' : 'text-slate-400'}`}>{message.time}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className={`shrink-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-brand-dark dark:via-brand-dark/95 dark:to-transparent z-20 sticky bottom-0 transition-all duration-1000 ${isLoading ? 'synapse-active pb-10 synapse-beam' : ''}`}>
                <div className={`max-w-6xl mx-auto relative glass-panel rounded-2xl p-1.5 shadow-2xl border border-sky-200 dark:border-sky-500/20 focus-within:border-sky-400 focus-within:shadow-[0_0_30px_rgba(56,189,248,0.25)] transition-all duration-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl ${isLoading ? 'border-sky-400 shadow-[0_0_50px_rgba(14,165,233,0.3)]' : ''}`}>
                    {selectedFiles.length > 0 && <div className="flex flex-wrap gap-2 p-3 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-black/20">{selectedFiles.map((file, idx) => <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 text-xs font-medium text-slate-700 dark:text-sky-100 shadow-sm animate-in fade-in zoom-in">{file.type.startsWith('image/') ? <ImageIcon size={14} className="text-sky-500"/> : <FileText size={14} className="text-sky-500"/>}<span className="max-w-[120px] truncate">{file.name}</span><button onClick={() => removeFile(idx)} className="p-0.5 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"><X size={12}/></button></div>)}</div>}
                    <div className="relative flex items-end gap-3 bg-white/50 dark:bg-slate-900/60 rounded-xl p-3">
                        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        <button onClick={handleUploadClick} className="p-3 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-all"><Paperclip size={22} /></button>
                        <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} disabled={isLoading} placeholder={isLoading ? "Elaborazione neurale in corso..." : "Scrivi il tuo messaggio..."} rows={1} className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 resize-none py-3 px-4 leading-tight font-tech text-base font-medium"/>
                        <button onClick={sendMessage} disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading} className={`p-3 btn-electric text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg ${isLoading ? 'animate-pulse' : ''}`}>{isLoading ? <Sparkles size={22} className="animate-spin" /> : <Send size={22} strokeWidth={2.5} />}</button>
                    </div>
                </div>
                <div className="text-center mt-3 transition-opacity duration-500"><p className={`text-[10px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 ${isLoading ? 'text-sky-400 font-bold' : 'text-slate-400'}`}><span>AI TEAM SECURE CHANNEL</span><span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-sky-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span><span>{isLoading ? 'NEURAL PROCESSING ACTIVE...' : 'ENCRYPTED'}</span></p></div>
            </div>

        </div>
      </div>
    </>
  );
}





