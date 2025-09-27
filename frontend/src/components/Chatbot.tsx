"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { SEND_MESSAGE } from '@/lib/mutations';
// We'll need a query to get conversation history, let's assume one exists for now
// import { GET_CONVERSATION_MESSAGES } from '@/lib/queries';

// Dummy query for now
const GET_CONVERSATION_MESSAGES = SEND_MESSAGE;


type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // This would be used to load a past conversation.
  // const { loading: historyLoading } = useQuery(GET_CONVERSATION_MESSAGES, {
  //   variables: { id: conversationId },
  //   skip: !conversationId,
  //   onCompleted: (data) => {
  //     setMessages(data.conversation.messages);
  //   }
  // });

  const [sendMessage, { loading }] = useMutation(SEND_MESSAGE, {
    onCompleted: (data) => {
      setMessages((prev) => [...prev, data.sendMessage]);
    },
    onError: (error) => {
        setMessages((prev) => [...prev, {role: 'assistant', content: `Error: ${error.message}`}]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user' as const, content: inputValue };
    setMessages((prev) => [...prev, userMessage]);

    sendMessage({
        variables: {
            message: inputValue,
            conversationId: conversationId,
        }
    });

    setInputValue('');
  };

  return (
    <>
      {/* Chat Widget Container */}
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${isOpen ? 'w-96 h-[32rem]' : 'w-16 h-16'}`}>
        {isOpen ? (
          // Expanded Chat Window
          <div className="flex flex-col h-full bg-white rounded-lg shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-4 bg-indigo-600 text-white rounded-t-lg">
              <h3 className="font-bold">Qiyal AI Assistant</h3>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200" aria-label="Close Chat">&times;</button>
            </div>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((msg, index) => (
                <div key={index} className={`my-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {msg.content}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask something..."
                  className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
                  {loading ? '...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // Floating Action Button (FAB)
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110"
            aria-label="Open Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default Chatbot;