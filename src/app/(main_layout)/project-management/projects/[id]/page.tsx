import SingleProjectServer from '@/skeleton/projectManagement/project/SingleProject/SingleProjectServer';

interface PageProps {
    params: Promise<{ id: string }>;
}
const ProjectSinglePage = async({ params }: PageProps) => {
    const { id } = await params;

    return (
        <div>
            <SingleProjectServer id={id}></SingleProjectServer>
        </div>
    );
};

export default ProjectSinglePage;