import * as React from "react";
import type { SVGProps } from "react";
const SvgDelete = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    {...props}
  >
    <path
      stroke="currentcolor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.333}
      d="M6.667 7.334v4m2.666-4v4m3.334-7.333v9.333c0 .736-.598 1.333-1.334 1.333H4.667a1.334 1.334 0 0 1-1.334-1.333V4.001M2 4h12M5.333 4V2.667c0-.736.598-1.333 1.334-1.333h2.666c.736 0 1.334.597 1.334 1.333v1.334"
    />
  </svg>
);
export default SvgDelete;
