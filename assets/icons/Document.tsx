import * as React from "react";
import type { SVGProps } from "react";
const SvgDocument = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 17 17"
    fill="none"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.5 16.5A1.5 1.5 0 0 1 3 15V3a1.5 1.5 0 0 1 1.5-1.5h6c.48 0 .94.19 1.278.53l2.691 2.69c.34.34.532.8.531 1.28v9a1.5 1.5 0 0 1-1.5 1.5z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.5 1.5v3.75c0 .414.336.75.75.75H15m-7.5.75H6m6 3H6m6 3H6"
    />
  </svg>
);
export default SvgDocument;
