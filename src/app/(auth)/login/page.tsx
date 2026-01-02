"use client";

import { Suspense } from "react";
import { Center, Loader } from "@mantine/core";
import { AuthShell, LoginForm } from "@/components/auth";

function LoginContent() {
  return (
    <AuthShell mode="login">
      <LoginForm />
    </AuthShell>
  );
}

function LoginLoading() {
  return (
    <Center h="100vh" bg="gray.0">
      <Loader color="teal" size="lg" />
    </Center>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
