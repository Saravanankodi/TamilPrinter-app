import * as React from "react";
import type { SVGProps } from "react";
const SvgAvgOrder = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12.372 9.269A5.833 5.833 0 1 1 4.667 1.65"
    />
    <path
      stroke="currentcolor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.167}
      d="M12.833 7A5.836 5.836 0 0 0 7 1.165v5.833z"
    />
  </svg>
);
export default SvgAvgOrder;
