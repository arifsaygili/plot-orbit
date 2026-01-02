"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  ActionIcon,
  Tooltip,
  Anchor,
  Input,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconRefresh, IconCheck } from "@tabler/icons-react";
import { slugify, randomizeSlug, isValidSlug } from "@/lib/slugify";
import { post } from "@/lib/http";

interface RegisterFormValues {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

interface RegisterResponse {
  user: { id: string; email: string };
  tenant: { id: string; name: string; slug: string };
}

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const form = useForm<RegisterFormValues>({
    mode: "uncontrolled",
    initialValues: {
      tenantName: "",
      tenantSlug: "",
      name: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
    validate: {
      tenantName: (value) => {
        if (!value || value.length < 2) return "Organizasyon adı en az 2 karakter olmalı";
        if (value.length > 64) return "Organizasyon adı en fazla 64 karakter olabilir";
        return null;
      },
      tenantSlug: (value) => {
        if (!value || value.length < 3) return "URL en az 3 karakter olmalı";
        if (value.length > 32) return "URL en fazla 32 karakter olabilir";
        if (!/^[a-z0-9-]+$/.test(value)) return "Sadece küçük harf, rakam ve tire kullanın";
        return null;
      },
      email: (value) => {
        if (!value) return "E-posta gerekli";
        if (!/^\S+@\S+\.\S+$/.test(value)) return "Geçerli bir e-posta adresi girin";
        return null;
      },
      password: (value) => {
        if (!value || value.length < 8) return "Şifre en az 8 karakter olmalı";
        return null;
      },
      acceptTerms: (value) => {
        if (!value) return "Kullanım şartlarını kabul etmelisiniz";
        return null;
      },
    },
  });

  // Auto-generate slug from tenant name
  const handleTenantNameChange = useCallback(
    (value: string) => {
      form.setFieldValue("tenantName", value);
      if (!isSlugManuallyEdited) {
        const slug = slugify(value);
        form.setFieldValue("tenantSlug", slug);
      }
    },
    [form, isSlugManuallyEdited]
  );

  // Handle manual slug edit
  const handleSlugChange = useCallback(
    (value: string) => {
      const cleanValue = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      form.setFieldValue("tenantSlug", cleanValue);
      setIsSlugManuallyEdited(true);
      if (fieldErrors.tenantSlug) {
        setFieldErrors((prev) => ({ ...prev, tenantSlug: "" }));
      }
    },
    [form, fieldErrors.tenantSlug]
  );

  // Randomize slug
  const handleRandomizeSlug = useCallback(() => {
    const currentSlug = form.getValues().tenantSlug;
    if (currentSlug) {
      const newSlug = randomizeSlug(currentSlug);
      form.setFieldValue("tenantSlug", newSlug);
      setIsSlugManuallyEdited(true);
    }
  }, [form]);


  async function handleSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    setApiError(null);
    setFieldErrors({});

    const response = await post<RegisterResponse>("/api/auth/register", {
      tenantName: values.tenantName,
      tenantSlug: values.tenantSlug,
      name: values.name || undefined,
      email: values.email,
      password: values.password,
    });

    if (!response.ok) {
      setIsLoading(false);

      // Handle specific error codes
      if (response.errorCode === "TENANT_SLUG_TAKEN") {
        setFieldErrors({ tenantSlug: "Bu URL zaten kullanılıyor" });
        setApiError("Bu organizasyon URL'si zaten alınmış. Lütfen farklı bir URL deneyin.");
        form.setFieldError("tenantSlug", "Bu URL zaten kullanılıyor");
        return;
      }

      if (response.errorCode === "EMAIL_TAKEN") {
        setFieldErrors({ email: "Bu e-posta zaten kayıtlı" });
        setApiError("Bu e-posta adresi zaten bir hesapla ilişkili.");
        form.setFieldError("email", "Bu e-posta zaten kayıtlı");
        return;
      }

      // Handle validation errors from server
      if (response.details?.fieldErrors) {
        const serverFieldErrors = response.details.fieldErrors as Record<string, string[]>;
        const newFieldErrors: Record<string, string> = {};
        for (const [field, errors] of Object.entries(serverFieldErrors)) {
          if (errors && errors.length > 0) {
            newFieldErrors[field] = errors[0];
            form.setFieldError(field, errors[0]);
          }
        }
        setFieldErrors(newFieldErrors);
        setApiError("Lütfen formdaki hataları düzeltin.");
        return;
      }

      // Generic error
      setApiError(response.error || "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      return;
    }

    // Success
    notifications.show({
      title: "Hesap oluşturuldu!",
      message: "Hoş geldiniz! Dashboard'a yönlendiriliyorsunuz...",
      color: "teal",
      icon: <IconCheck size={16} />,
    });

    router.push("/dashboard");
  }

  const currentSlug = form.getValues().tenantSlug;
  const isSlugValid = isValidSlug(currentSlug);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <div>
          <Text fz="xl" fw={600} c="dark.8">
            Hesabını oluştur
          </Text>
          <Text fz="sm" c="dimmed" mt={4}>
            KML'yi yükle, 1 dakikada orbit video ve Reels hazırla.
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
          label="Organizasyon Adı"
          placeholder="Şirket veya proje adı"
          required
          disabled={isLoading}
          {...form.getInputProps("tenantName")}
          onChange={(e) => handleTenantNameChange(e.currentTarget.value)}
        />

        <div>
          <Input.Wrapper
            label="Organizasyon URL"
            required
            error={form.errors.tenantSlug || fieldErrors.tenantSlug}
            description={
              <Text fz="xs" c="dimmed">
                Her organizasyon izole bir ortamda çalışır (tenant izolasyonu).
              </Text>
            }
          >
            <Group gap="xs" wrap="nowrap" mt={4}>
              <TextInput
                placeholder="sirket-adi"
                disabled={isLoading}
                leftSection={
                  <Text fz="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
                    parselshot.com/t/
                  </Text>
                }
                leftSectionWidth={120}
                styles={{
                  input: { paddingLeft: 120 },
                }}
                style={{ flex: 1 }}
                value={form.getValues().tenantSlug}
                onChange={(e) => handleSlugChange(e.currentTarget.value)}
                error={!!form.errors.tenantSlug || !!fieldErrors.tenantSlug}
              />
              <Tooltip label="Rastgele URL oluştur">
                <ActionIcon
                  variant="light"
                  color="gray"
                  size="lg"
                  onClick={handleRandomizeSlug}
                  disabled={isLoading || !currentSlug}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Input.Wrapper>
          {currentSlug && isSlugValid && !form.errors.tenantSlug && !fieldErrors.tenantSlug && (
            <Text fz="xs" c="teal" mt={4}>
              URL kullanılabilir
            </Text>
          )}
        </div>

        <TextInput
          label="Adınız"
          placeholder="Ad Soyad"
          disabled={isLoading}
          {...form.getInputProps("name")}
        />

        <TextInput
          label="E-posta"
          placeholder="ornek@email.com"
          type="email"
          required
          disabled={isLoading}
          error={form.errors.email || fieldErrors.email}
          {...form.getInputProps("email")}
          onChange={(e) => {
            form.setFieldValue("email", e.currentTarget.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }
          }}
        />

        <PasswordInput
          label="Şifre"
          placeholder="En az 8 karakter"
          required
          disabled={isLoading}
          {...form.getInputProps("password")}
        />

        <Checkbox
          label={
            <Text fz="sm">
              <Anchor href="#" fz="sm">
                Kullanım şartlarını
              </Anchor>{" "}
              ve{" "}
              <Anchor href="#" fz="sm">
                Gizlilik politikasını
              </Anchor>{" "}
              kabul ediyorum
            </Text>
          }
          disabled={isLoading}
          {...form.getInputProps("acceptTerms", { type: "checkbox" })}
          error={form.errors.acceptTerms}
        />

        <Button
          type="submit"
          fullWidth
          size="md"
          color="teal"
          loading={isLoading}
          mt="sm"
        >
          Hesabı Oluştur
        </Button>

        <Text fz="sm" c="dimmed" ta="center">
          Zaten hesabın var mı?{" "}
          <Anchor component={Link} href="/login" fw={500}>
            Giriş Yap
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
