type Schemas = import("./generated/backend").components["schemas"];

export type User = Schemas["UserResponse"];
export type CurrentUser = Schemas["CurrentUserResponse"];
export type Genre = Schemas["Genre"];
export type UpdateUserDto = Schemas["UpdateUserDto"];
/** Profile fields of `UpdateUserDto`; the password changes through its own route. */
export type UpdateMeInputs = Pick<
  UpdateUserDto,
  "avatar" | "genreIds" | "onboarded" | "username" | "roomInvitePolicy"
>;
export type ChangePasswordInputs = { currentPassword: string; newPassword: string };

export const MAX_FAVORITE_GENRES = 10;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
