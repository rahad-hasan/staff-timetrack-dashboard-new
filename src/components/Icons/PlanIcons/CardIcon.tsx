const CardIcon = ({
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
      viewBox="0 0 25 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 10C1 6.02033 1 4.03049 2.1844 2.70201C2.37384 2.48953 2.58263 2.29302 2.80839 2.11473C4.2199 1 6.3341 1 10.5625 1H13.9375C18.1659 1 20.2801 1 21.6916 2.11473C21.9173 2.29302 22.1262 2.48953 22.3156 2.70201C23.5 4.03049 23.5 6.02033 23.5 10C23.5 13.9797 23.5 15.9695 22.3156 17.298C22.1262 17.5105 21.9173 17.7069 21.6916 17.8852C20.2801 19 18.1659 19 13.9375 19H10.5625C6.3341 19 4.2199 19 2.80839 17.8852C2.58263 17.7069 2.37384 17.5105 2.1844 17.298C1 15.9695 1 13.9797 1 10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.5H11.6875"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.0625 14.5H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 6.625H23.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CardIcon;
