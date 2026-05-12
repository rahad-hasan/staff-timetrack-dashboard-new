const BellIcon = ({
  size,
  className,
}: {
  size: number;
  className?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 24 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.998 15.8641C17.6373 15.8641 20.2461 15.2211 20.498 12.64C20.498 10.0607 18.6792 10.2266 18.6792 7.06189C18.6792 4.58991 16.0433 1.77734 11.998 1.77734C7.95282 1.77734 5.31689 4.58991 5.31689 7.06189C5.31689 10.2266 3.49805 10.0607 3.49805 12.64C3.751 15.2308 6.35982 15.8641 11.998 15.8641Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        stroke="currentColor"
        d="M14.385 18.5391C13.0208 19.8855 10.8928 19.9014 9.51562 18.5391"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default BellIcon;