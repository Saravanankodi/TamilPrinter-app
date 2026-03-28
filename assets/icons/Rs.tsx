import * as React from "react";
import type { SVGProps } from "react";
const SvgRs = (props: SVGProps<SVGSVGElement>) => (
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
      strokeWidth={1.167}
      d="M3.5 1.75h7m-7 2.917h7m-7 2.916 4.958 4.667M3.5 7.583h1.75m0 0c3.89 0 3.89-5.833 0-5.833"
    />
  </svg>
);
export default SvgRs;
