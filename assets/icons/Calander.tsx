import * as React from "react";
import type { SVGProps } from "react";
const SvgCalander = (props: SVGProps<SVGSVGElement>) => (
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
      d="M6 1.5v3m6-3v3M3.75 3h10.5a1.5 1.5 0 0 1 1.5 1.5V15a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V4.5A1.5 1.5 0 0 1 3.75 3M2.25 7.5h13.5"
    />
  </svg>
);
export default SvgCalander;
