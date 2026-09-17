const ZapIcon = ({
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
      viewBox="0 0 23 33"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.4"
        d="M7.64863 18.0219H2.78617C1.68158 18.0219 1.09278 16.4771 1.82251 15.4937L11.8196 2.01975C12.6014 0.965974 14.0671 1.62185 14.0671 3.02555V13.4544C14.0671 14.2954 14.6417 14.977 15.3507 14.977"
        stroke="#0788F3"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.64941 18.0234C8.35834 18.0234 8.93315 18.705 8.93315 19.546V29.9748C8.93315 31.3786 10.3986 32.0344 11.1804 30.9806L21.1775 17.5068C21.9074 16.5233 21.3185 14.9785 20.2139 14.9785H15.3514"
        stroke="#0788F3"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default ZapIcon;
