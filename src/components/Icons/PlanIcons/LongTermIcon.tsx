const LongTermIcon = ({
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
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 6H16C17.4142 6 18.1213 6 18.5607 5.56066C19 5.12132 19 4.41421 19 3V1.5"
        stroke="#0788F3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 10C1 5.02943 5.0293 1 10 1C13.571 1 16.0948 2.73053 18 5.08371M19 10C19 14.9705 14.9707 19 10 19C6.42904 19 3.90524 17.2694 2 14.9162"
        stroke="#0788F3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 14H4C2.58579 14 1.87868 14 1.43934 14.4393C1 14.8786 1 15.5857 1 17V18.5"
        stroke="#0788F3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LongTermIcon;
