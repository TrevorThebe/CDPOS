import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';

interface AIAssistantProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, toggleOpen }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hello! I am the Cosmo Chef Assistant. Ask me about recipes, allergies, or our menu.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const response = await chatWithAssistant(userMsg, messages.map(m => m.text));
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={toggleOpen}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-cosmo-red text-white shadow-2xl flex items-center justify-center z-50 transition-transform hover:scale-110 active:scale-95 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <div className={`fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-gradient-to-r from-purple-800 to-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
           <div className="flex items-center gap-2">
             <Bot className="w-5 h-5 text-purple-400" />
             <h3 className="font-bold text-white">Chef's Assistant</h3>
           </div>
           <button onClick={toggleOpen} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/95" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-cosmo-red text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700 shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-white dark:bg-gray-800 text-gray-400 rounded-2xl rounded-tl-none p-3 text-xs flex gap-1 items-center shadow-sm border border-gray-200 dark:border-gray-700">
                 <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
                 <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                 <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-200"></span>
               </div>
             </div>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for recipe ideas..." 
              className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="w-10 h-10 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};