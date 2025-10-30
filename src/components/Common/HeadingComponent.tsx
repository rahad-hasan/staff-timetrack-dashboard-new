
const HeadingComponent = ({ heading, subHeading }: { heading: string, subHeading: string }) => {
    return (
        <div>
            <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary ">{heading}</h1>
            <p className="text-sm sm:text-base text-subTextColor mt-1 dark:text-darkTextPrimary">
                {subHeading}
            </p>
        </div>
    );
};

export default HeadingComponent;