import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import useAuth from "@/hooks/useAuth";

type RoleHomeScreenProps = {
  title: string;
  role: string;
};

export default function RoleHomeScreen({ title, role }: RoleHomeScreenProps) {
  const router = useRouter();
  const { user, hasRole, logout } = useAuth();

  const roleValid = useMemo(() => hasRole(role), [hasRole, role]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title} Dashboard</Text>
      <Text style={styles.text}>Hello {user?.fullName ?? "User"}</Text>
      <Text style={styles.text}>Employee Code: {user?.employeeCode ?? "-"}</Text>
      <Text style={styles.text}>Current Role: {user?.role ?? "-"}</Text>
      {!roleValid ? <Text style={styles.warning}>Role mismatch for this tab.</Text> : null}

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F3FAFC",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#29566E",
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: "#345",
  },
  warning: {
    fontSize: 14,
    color: "#B85B5B",
    marginTop: 6,
  },
  button: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: "#2E95A4",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
  },
});
