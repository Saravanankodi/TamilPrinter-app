import type { SVGProps } from "react";
const Download = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.333}
      d="M8 10V2m6 8v2.667c0 .736-.597 1.333-1.333 1.333H3.333A1.334 1.334 0 0 1 2 12.667V10M4.667 6.666 8 9.999l3.334-3.333"
    />
  </svg>
);
export default Download;
