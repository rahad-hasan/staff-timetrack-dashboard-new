"use client"
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TrackerChatBot = () => {
    const [chatOpen, setChatOpen] = useState<boolean>(false);
    const [inputMessage, setInputMessage] = useState<string>("");
    const [messages, setMessages] = useState<{ sender: string, content: string }[]>([]);
    const [isBotTyping, setIsBotTyping] = useState<boolean>(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleSendMessage = () => {
        if (inputMessage.trim() !== "") {
            setMessages([
                ...messages,
                { sender: "user", content: inputMessage }
            ]);
            setInputMessage("");

            // Simulate bot typing
            setIsBotTyping(true);

            // Simulate a bot response after a short delay
            setTimeout(() => {
                setMessages(prevMessages => [
                    ...prevMessages,
                    { sender: "bot", content: "How can I assist you with that?" }
                ]);
                setIsBotTyping(false); // Stop typing after response
            }, 2000);
        }
    };

    // Scroll to the bottom when new messages are added
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    return (
        <div className="relative">
            <AnimatePresence>
                {chatOpen && (
                    <motion.div
                        key="chat-window"
                        className="fixed bottom-24 left-2 sm:left-auto top-2 sm:top-auto right-2 sm:right-5 sm:w-[400px] sm:h-[600px] bg-white rounded-lg shadow-xl flex flex-col z-50 overflow-hidden"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-primary
                            [background-image:linear-gradient(135deg,_#308bb2_0%,_#85af76_100%,_#8c8da8_10%)]
                            text-white px-4 py-3 sm:py-8 flex justify-between gap-2 items-center rounded-t-lg">
                            <div>
                                <h2 className="bg-white text-primary text-2xl font-bold h-10 w-10 flex items-center justify-center rounded-full">T</h2>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Tracker</h3>
                                <p className="text-sm">A live chat interface that allows for seamless, natural communication.</p>
                            </div>
                            <div>
                                <button onClick={() => setChatOpen(false)} className="bg-[#ffffff31] p-1 cursor-pointer rounded-full text-white" aria-label="Close chat">
                                    <X size={25} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto space-y-3 no-scrollbar">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {message.sender !== 'user' && (
                                        <div className="flex items-center justify-center bg-gray-100 rounded-full w-10 h-10 mr-2">
                                            <Bot className="text-primary" />
                                        </div>
                                    )}
                                    <div className="max-w-[75%]">
                                        {message.sender !== 'user' && <h2 className="text-base font-semibold dark:text-black">Ai Assistant</h2>}
                                        <div className={`p-2 rounded-lg ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-black'}`}>
                                            <p>{message.content}</p>
                                            <p className={`text-[10px] ${message.sender !== 'user' ? 'text-left' : 'text-right'}`}>8:05 PM</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isBotTyping && (
                                <div className="flex justify-start items-center">
                                    <div className="flex items-center justify-center bg-gray-100 rounded-full w-10 h-10 mr-2">
                                        <Bot className="text-primary" />
                                    </div>
                                    <div className="text-gray-500">Typing...</div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        <div className="p-3 border-t dark:border-gray-200 flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Type..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none dark:text-black"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors disabled:opacity-70 cursor-pointer"
                                disabled={inputMessage.trim() === ""}
                                aria-label="Send message"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div onClick={() => setChatOpen(!chatOpen)} className="bg-primary h-14 w-14 rounded-full flex items-center justify-center drop-shadow-lg cursor-pointer fixed bottom-5 right-5 z-50 hover:scale-105 transition-transform" aria-label={chatOpen ? "Close chat" : "Open chat"}>
                {chatOpen ? (
                    <X className="text-white" size={24} />
                ) : (
                    <MessageSquare className="text-white" size={24} />
                )}
            </div>
        </div>
    );
};

export default TrackerChatBot;
