import * as React from "react";
import type { SVGProps } from "react";
const SvgDoc = (props: SVGProps<SVGSVGElement>) => (
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
      d="M3.5 12.833a1.167 1.167 0 0 1-1.167-1.167V2.333c0-.644.523-1.167 1.167-1.167h4.666c.373 0 .731.148.994.412l2.093 2.093a1.4 1.4 0 0 1 .413.995v7c0 .644-.522 1.167-1.166 1.167z"
    />
    <path
      stroke="currentcolor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.167}
      d="M8.167 1.166v2.917c0 .322.261.583.583.583h2.917m-5.833.583H4.667m4.667 2.334H4.667m4.667 2.333H4.667"
    />
  </svg>
);
export default SvgDoc;
