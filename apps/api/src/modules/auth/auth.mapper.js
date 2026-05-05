import { mapUserToDto } from "../users/user.mapper.js";

export function mapAuthResponse({ accessToken, user }) {
  return {
    accessToken,
    tokenType: "Bearer",
    user: mapUserToDto(user)
  };
}
