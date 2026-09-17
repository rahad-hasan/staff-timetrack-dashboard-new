const LockIcon = ({
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
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.7088 2.49534C14.8165 1.55382 12.5009 1 10 1C7.4991 1 5.1835 1.55382 3.29116 2.49535C2.36318 2.95706 1.89919 3.18792 1.4496 3.91379C1 4.63966 1 5.34248 1 6.74814V10.2371C1 15.9205 5.54236 19.0804 8.173 20.4338C8.9067 20.8113 9.2735 21 10 21C10.7265 21 11.0933 20.8113 11.8269 20.4338C14.4576 19.0804 19 15.9205 19 10.2371V6.74815C19 5.34249 19 4.63966 18.5504 3.91379C18.1008 3.18792 17.6368 2.95706 16.7088 2.49534Z"
        stroke="#0788F3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 8V8.99998M9 8.5C9 8.76522 9.1054 9.01958 9.2929 9.20708C9.4804 9.39468 9.7348 9.49998 10 9.49998C10.2652 9.49998 10.5196 9.39468 10.7071 9.20708C10.8946 9.01958 11 8.76522 11 8.5C11 8.23479 10.8946 7.98043 10.7071 7.7929C10.5196 7.60536 10.2652 7.5 10 7.5C9.7348 7.5 9.4804 7.60536 9.2929 7.7929C9.1054 7.98043 9 8.23479 9 8.5Z"
        stroke="#0788F3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.75 13H9.25L10 9.5L10.75 13Z"
        stroke="#0788F3"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default LockIcon;
