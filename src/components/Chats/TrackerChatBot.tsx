"use client"
import { MessageSquare } from "lucide-react";
import { useState } from "react";

const TrackerChatBot = () => {
    const [chatOpen, setChatOpen] = useState<boolean>(true);
    return (
        <div className=" fixed bottom-5 right-5">
            {
                chatOpen &&
                <div>
                    Hello How Are YOU?
                </div>
            }
            <div onClick={() => setChatOpen(!chatOpen)} className=" bg-primary h-16 w-16 rounded-full flex items-center justify-center drop-shadow-lg cursor-pointer">
                <MessageSquare className=" text-white" />
            </div>
        </div>
    );
};

export default TrackerChatBot;