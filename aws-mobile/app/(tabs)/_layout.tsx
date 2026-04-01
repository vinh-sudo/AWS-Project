import { Redirect, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import useAuth from "@/hooks/useAuth";

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2C6E8A",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="LeaderProgress"
        options={{
          title: "Leader",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="NotificationBell"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "notifications" : "notifications-outline"} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
