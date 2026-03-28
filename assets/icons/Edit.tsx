import * as React from "react";
import type { SVGProps } from "react";
const SvgEdit = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    fill="none"
    {...props}
  >
    <path
      fill="currentcolor"
      fillRule="evenodd"
      d="M14.502.642a2.19 2.19 0 0 0-3.1 0L1.058 10.987a2.2 2.2 0 0 0-.6 1.12L.03 14.25a1.46 1.46 0 0 0 1.72 1.72l2.144-.43a2.2 2.2 0 0 0 1.12-.599L15.359 4.598a2.19 2.19 0 0 0 0-3.1zm-2.067 1.033a.73.73 0 0 1 1.034 0l.856.856a.73.73 0 0 1 0 1.034l-1.952 1.952-1.89-1.89zM9.45 4.661 2.09 12.02a.73.73 0 0 0-.199.373l-.429 2.145 2.145-.43a.73.73 0 0 0 .373-.199l7.36-7.359z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgEdit;
