export const ROLE_DEFAULT_PATHS = {
  ADMIN: "/(tabs)/LeaderProgress",
  MANAGER: "/(tabs)/LeaderProgress",
  EMPLOYEE: "/(tabs)/LeaderProgress",
} as const;

export type RoleDefaultPath = (typeof ROLE_DEFAULT_PATHS)[keyof typeof ROLE_DEFAULT_PATHS];

export const getRoleDefaultPath = (role?: string | null): RoleDefaultPath => {
  if (!role) {
    return "/(tabs)/LeaderProgress";
  }

  const normalizedRole = role.toUpperCase();
  return ROLE_DEFAULT_PATHS[normalizedRole as keyof typeof ROLE_DEFAULT_PATHS] ?? "/(tabs)/LeaderProgress";
};
