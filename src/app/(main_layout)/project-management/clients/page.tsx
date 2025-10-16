"use client"
import SearchBar from "@/components/Common/SearchBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import ClientsTable from "@/components/ProjectManagement/Clients/ClientsTable";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddClientModal from "@/components/ProjectManagement/Clients/AddClientModal";


const ClientsPage = () => {
    const handleSearch = (query: string) => {
        console.log("Searching for:", query);
        // Call your API, filter data, etc.
    };

    // project select
    const projects = [
        { name: "Time Tracker", avatar: "https://picsum.photos/200/300" },
        { name: "E-commerce", avatar: "https://picsum.photos/200/300" },
        { name: "Fack News Detection", avatar: "https://picsum.photos/200/300" },
        { name: "Travel Together", avatar: "https://picsum.photos/200/300" }
    ];
    const [projectSearch, setProjectSearch] = useState("");
    const [project, setProject] = useState<string>("Time Tracker");

    const filteredProjects = projects.filter(t => t.name.toLowerCase().includes(projectSearch.toLowerCase()));
    const selectedProject = projects.find((u) => u.name === project);
    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                    <h1 className="text-3xl font-semibold text-headingTextColor">Clients</h1>
                    <p className="text-sm text-subTextColor mt-2">
                        All the Clients list available here
                    </p>
                </div>

                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button><Plus size={20} />Add Client</Button>
                            </DialogTrigger>
                            <AddClientModal></AddClientModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <div className=" flex items-center justify-between">
                <Select onValueChange={setProject} value={project ?? undefined}>
                    <SelectTrigger size={'lg'} className="">
                        {selectedProject ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={selectedProject.avatar} alt={selectedProject.name} />
                                    <AvatarFallback>{selectedProject.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{selectedProject.name}</span>
                            </div>
                        ) : (
                            <SelectValue placeholder="Select user" />
                        )}
                    </SelectTrigger>

                    <SelectContent>
                        <Input
                            type="text"
                            placeholder="Search user..."
                            className="flex-1 border-none focus:ring-0 focus:outline-none"
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                        />
                        {filteredProjects.map(t => (
                            <SelectItem className="px-3 flex items-center gap-2 cursor-pointer" key={t.name} value={t.name}>
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={t.avatar} alt={t.name} />
                                    <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="ml-2">{t.name}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <SearchBar onSearch={handleSearch} />
            </div>
            <ClientsTable></ClientsTable>
        </div>
    );
};

export default ClientsPage;