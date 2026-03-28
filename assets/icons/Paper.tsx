import * as React from "react";
import type { SVGProps } from "react";
const SvgPaper = (props: SVGProps<SVGSVGElement>) => (
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
      d="M5.834 4.666h5.833c.644 0 1.167.523 1.167 1.167v5.833c0 .644-.523 1.167-1.167 1.167H5.834a1.167 1.167 0 0 1-1.167-1.167V5.833c0-.644.523-1.167 1.167-1.167"
    />
    <path
      stroke="currentcolor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.167}
      d="M2.334 9.333a1.17 1.17 0 0 1-1.167-1.167V2.333a1.17 1.17 0 0 1 1.167-1.167h5.833a1.17 1.17 0 0 1 1.167 1.167"
    />
  </svg>
);
export default SvgPaper;
