import * as React from "react";
import type { SVGProps } from "react";
const SvgInfo = (props: SVGProps<SVGSVGElement>) => (
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
      d="M1.5 9c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5S13.14 1.5 9 1.5 1.5 4.86 1.5 9M9 6v3m0 3h.008"
    />
  </svg>
);
export default SvgInfo;
