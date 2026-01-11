import SingleProjectServer from '@/components/ProjectManagement/Projects/SingleProject/SingleProjectServer';
import SingleProjectSkeleton from '@/skeleton/projectManagement/project/SingleProjectSkeleton';
import { Suspense } from 'react';
// import SingleProjectClientInfoSkeleton from "@/skeleton/projectManagement/project/SingleProjectClientInfoSkeleton";
interface PageProps {
    params: Promise<{ id: string }>;
}
const ProjectSinglePage = async ({ params }: PageProps) => {
    const { id } = await params;

    return (
        <div>
            <Suspense fallback={ <SingleProjectSkeleton/>}>
                <SingleProjectServer id={id}></SingleProjectServer>
            </Suspense>
        </div>
    );
};

export default ProjectSinglePage;