const Calender2Icon = ({
  size,
  className = "",
}: {
  size: number;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 23"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5226 0.800781V5.023M6.07812 0.800781V5.023"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.3563 2.91211H9.24523C5.26447 2.91211 3.27411 2.91211 2.03744 4.14877C0.800781 5.38543 0.800781 7.3758 0.800781 11.3566V13.4677C0.800781 17.4484 0.800781 19.4388 2.03744 20.6754C3.27411 21.9121 5.26447 21.9121 9.24523 21.9121H11.3563C15.337 21.9121 17.3275 21.9121 18.5641 20.6754C19.8008 19.4388 19.8008 17.4484 19.8008 13.4677V11.3566C19.8008 7.3758 19.8008 5.38543 18.5641 4.14877C17.3275 2.91211 15.337 2.91211 11.3563 2.91211Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.800781 9.24609H19.8008"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9954 15.0512V17.1623M15.5788 16.1068C15.5788 16.9812 14.8699 17.6901 13.9954 17.6901C13.121 17.6901 12.4121 16.9812 12.4121 16.1068C12.4121 15.2323 13.121 14.5234 13.9954 14.5234C14.8699 14.5234 15.5788 15.2323 15.5788 16.1068Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Calender2Icon;
