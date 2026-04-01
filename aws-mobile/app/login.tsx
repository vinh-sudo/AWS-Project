import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Redirect, useRouter } from "expo-router";

import useAuth from "@/hooks/useAuth";

export default function LoginScreen() {

  const router = useRouter();

  const {
    login,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    getDefaultPath,
  } = useAuth();

  const [employeeCode, setEmployeeCode] =
    useState("");

  const [password, setPassword] =
    useState("");

  useEffect(() => {

    clearError();

  }, []);

  if (isAuthenticated) {

    return (
      <Redirect
        href={getDefaultPath()}
      />
    );

  }

  const handleSignIn =
    async () => {

      try {

        if (
          !employeeCode.trim() ||
          !password.trim()
        ) {

          return;

        }

        console.log("LOGIN TRY:", {
          employeeCode,
          password,
        });

        const result =
          await login({

            employeeCode:
              employeeCode.trim(),

            password:
              password.trim(),

          });

        console.log(
          "LOGIN RESULT:",
          result
        );

        if (result.success) {

          router.replace("/");

        }

      } catch (err: any) {

        console.log(
          "LOGIN ERROR:",
          err
        );

      }

    };

  return (

    <SafeAreaView style={styles.page}>

      <View style={styles.card}>

        <Text style={styles.title}>
          Sign In
        </Text>

        {!!error && (

          <Text style={styles.errorText}>
            {error}
          </Text>

        )}

        <TextInput
          style={styles.input}
          placeholder="Employee Code"
          autoCapitalize="none"
          value={employeeCode}
          onChangeText={(value) => {

            setEmployeeCode(value);

            if (error) {

              clearError();

            }

          }}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(value) => {

            setPassword(value);

            if (error) {

              clearError();

            }

          }}
        />

        <Pressable
          style={[
            styles.button,
            isLoading &&
              styles.buttonDisabled,
          ]}
          onPress={handleSignIn}
          disabled={isLoading}
        >

          {isLoading ? (

            <ActivityIndicator
              color="#fff"
            />

          ) : (

            <Text
              style={
                styles.buttonText
              }
            >
              Sign In
            </Text>

          )}

        </Pressable>

        <View style={styles.logoWrap}>

          <Image
            source={require(
              "@/assets/images/ims.jpg"
            )}
            style={styles.logo}
          />

        </View>

      </View>

    </SafeAreaView>

  );

}

const styles = StyleSheet.create({

  page: {

    flex: 1,

    backgroundColor:
      "#EAF6F6",

    justifyContent:
      "center",

    padding: 20,

  },

  card: {

    backgroundColor:
      "#FFFFFF",

    borderRadius: 20,

    padding: 20,

    borderWidth: 1,

    borderColor:
      "#D7EDF6",

    gap: 10,

  },

  title: {

    fontSize: 28,

    fontWeight: "900",

    color: "#2C6E8A",

    textAlign: "center",

    marginBottom: 8,

  },

  input: {

    borderWidth: 1,

    borderColor:
      "#D7EDF6",

    borderRadius: 12,

    paddingHorizontal: 12,

    paddingVertical: 10,

    backgroundColor:
      "#FFFFFF",

  },

  button: {

    backgroundColor:
      "#3CA9B7",

    borderRadius: 12,

    paddingVertical: 12,

    alignItems: "center",

    marginTop: 6,

  },

  buttonDisabled: {

    opacity: 0.6,

  },

  buttonText: {

    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "700",

  },

  logoWrap: {

    marginTop: 10,

    alignItems: "center",

  },

  logo: {

    width: 92,

    height: 92,

    borderRadius: 16,

    backgroundColor:
      "#FFFFFF",

  },

  errorText: {

    backgroundColor:
      "#FFEBEE",

    color: "#C62828",

    borderWidth: 1,

    borderColor:
      "#FFCDD2",

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,

    textAlign: "center",

  },

});                                   