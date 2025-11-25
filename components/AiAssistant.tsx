import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';
import { startChat } from '../services/geminiService';
import { ChatMessage } from '../types';


const AiAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hello! I'm ConnectAI. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chat) {
            setChat(startChat());
        }
    }, [isOpen, chat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-transform transform hover:scale-110 focus:outline-none z-40"
                aria-label="Toggle AI Assistant"
            >
                <SparklesIcon className="w-8 h-8" />
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-sm h-[60vh] bg-white rounded-lg shadow-2xl flex flex-col z-50">
                    <header className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                            <SparklesIcon className="w-5 h-5 mr-2 text-primary-500" />
                            AI Assistant
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </header>
                    <main className="flex-1 p-4 overflow-y-auto bg-gray-100">
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                                        msg.role === 'user'
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-white text-gray-800 border'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-xs px-4 py-2 rounded-lg bg-white text-gray-800 border">
                                       <span className="animate-pulse">...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </main>
                    <footer className="p-4 border-t bg-white rounded-b-lg">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-black bg-white"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="p-2 bg-primary-500 text-white rounded-lg disabled:bg-primary-300 hover:bg-primary-600 focus:outline-none"
                                disabled={isLoading || !input.trim()}
                            >
                                <SendIcon className="w-6 h-6" />
                            </button>
                        </form>
                    </footer>
                </div>
            )}
        </>
    );
};

export default AiAssistant;
