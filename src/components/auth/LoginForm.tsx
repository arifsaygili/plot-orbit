"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Alert,
  Checkbox,
  Group,
  Anchor,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { post } from "@/lib/http";

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginResponse {
  user: { id: string; email: string; name?: string };
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },
    validate: {
      email: (value) => {
        if (!value) return "E-posta gerekli";
        if (!/^\S+@\S+\.\S+$/.test(value)) return "Geçerli bir e-posta adresi girin";
        return null;
      },
      password: (value) => (!value ? "Şifre gerekli" : null),
    },
  });

  async function handleSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setApiError(null);

    const response = await post<LoginResponse>("/api/auth/login", {
      email: values.email,
      password: values.password,
    });

    if (!response.ok) {
      setIsLoading(false);
      setApiError(response.error || "E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
      return;
    }

    // Success
    notifications.show({
      title: "Giriş başarılı!",
      message: "Hoş geldiniz!",
      color: "teal",
      icon: <IconCheck size={16} />,
    });

    router.push(returnUrl);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <div>
          <Text fz="xl" fw={600} c="dark.8">
            Hesabına Giriş Yap
          </Text>
          <Text fz="sm" c="dimmed" mt={4}>
            Devam etmek için giriş yapın
          </Text>
        </div>

        {apiError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            radius="md"
          >
            {apiError}
          </Alert>
        )}

        <TextInput
          label="E-posta"
          placeholder="ornek@email.com"
          type="email"
          required
          disabled={isLoading}
          {...form.getInputProps("email")}
        />

        <PasswordInput
          label="Şifre"
          placeholder="Şifrenizi girin"
          required
          disabled={isLoading}
          {...form.getInputProps("password")}
        />

        <Group justify="space-between">
          <Checkbox
            label="Beni hatırla"
            disabled={isLoading}
            {...form.getInputProps("remember", { type: "checkbox" })}
          />
          <Anchor fz="sm" href="#" c="teal">
            Şifremi unuttum
          </Anchor>
        </Group>

        <Button
          type="submit"
          fullWidth
          size="md"
          color="teal"
          loading={isLoading}
          mt="sm"
        >
          Giriş Yap
        </Button>

        <Text fz="sm" c="dimmed" ta="center">
          Hesabın yok mu?{" "}
          <Anchor component={Link} href="/register" fw={500}>
            Kayıt Ol
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
