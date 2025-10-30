import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ClientsTable from "@/components/ProjectManagement/Clients/ClientsTable";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddClientModal from "@/components/ProjectManagement/Clients/AddClientModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const ClientsPage = () => {

    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Clients</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the Clients list available here
                    </p>
                </div>

                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Client</span></Button>
                            </DialogTrigger>
                            <AddClientModal></AddClientModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <SelectUserDropDown users={users}></SelectUserDropDown>
            <ClientsTable></ClientsTable>
        </div>
    );
};

export default ClientsPage;