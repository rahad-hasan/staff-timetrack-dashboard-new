import { getSingleProject } from "@/actions/projects/action";
import SingleProject from "./SingleProject";

const SingleProjectServer = async ({ id }: { id: string }) => {

    const result = await getSingleProject({
        id: id,
    });

    return (
        <div>
            <SingleProject data={result?.data}></SingleProject>
        </div>
    );
};

export default SingleProjectServer;