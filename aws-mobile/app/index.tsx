import { Redirect } from "expo-router";
import useAuth from "@/hooks/useAuth";

export default function IndexScreen() {
  const { isAuthenticated, getDefaultPath } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={getDefaultPath()} />;
  }

  return <Redirect href="/login" />;
}
