import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

import type { components } from "./generated/backend";

export type MovieWithRatings = components["schemas"]["RoomRating"];
export type UserType = components["schemas"]["PublicUser"];
