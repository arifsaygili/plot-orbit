"use client";

import { Box, Container, Grid, Paper, Stack, Text, Group, ThemeIcon, List } from "@mantine/core";
import { IconVideo, IconCheck, IconUpload, IconDeviceMobile } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  mode: "login" | "register";
}

function Logo() {
  return (
    <Group gap="xs">
      <ThemeIcon size={40} radius="md" variant="filled" color="teal">
        <IconVideo size={24} />
      </ThemeIcon>
      <Text fw={600} fz="xl" c="dark.7">
        ParselShot
      </Text>
    </Group>
  );
}

function MarketingPanel({ mode }: { mode: "login" | "register" }) {
  const features = [
    { icon: IconUpload, text: "KML/KMZ dosyanı yükle" },
    { icon: IconVideo, text: "Otomatik orbit animasyonu" },
    { icon: IconDeviceMobile, text: "Reels'e hazır 9:16 çıktı" },
  ];

  return (
    <Stack h="100%" justify="space-between" p={{ base: "md", md: "xl" }}>
      <Logo />

      <Stack gap="xl">
        <Box>
          <Text fz={{ base: 28, md: 36 }} fw={700} c="dark.8" lh={1.2}>
            {mode === "register" ? (
              <>
                Hemen başla,
                <br />
                ilk videonu oluştur.
              </>
            ) : (
              <>
                Parselini yükle,
                <br />
                videon hazır.
              </>
            )}
          </Text>
          <Text fz="lg" c="dimmed" mt="md">
            {mode === "register"
              ? "Ücretsiz hesabını oluştur ve emlak ilanların için profesyonel videolar üretmeye başla."
              : "Emlak ilanlarınız için profesyonel orbit videoları saniyeler içinde oluşturun."}
          </Text>
        </Box>

        <List spacing="md" size="md" center icon={null}>
          {features.map((feature, index) => (
            <List.Item
              key={index}
              icon={
                <ThemeIcon size={24} radius="xl" color="teal" variant="light">
                  <IconCheck size={14} />
                </ThemeIcon>
              }
            >
              <Text c="dark.6">{feature.text}</Text>
            </List.Item>
          ))}
        </List>

        {mode === "register" && (
          <Paper p="md" radius="md" bg="teal.0" withBorder={false}>
            <Group gap="xs" mb="xs">
              <Text fw={600} fz="sm" c="teal.8">
                Free Plan
              </Text>
            </Group>
            <Text fz="sm" c="teal.7">
              1 video ücretsiz oluştur, kaliteyi test et.
            </Text>
          </Paper>
        )}
      </Stack>

      <Text fz="sm" c="dimmed">
        © 2025 ParselShot. Tüm hakları saklıdır.
      </Text>
    </Stack>
  );
}

export function AuthShell({ children, mode }: AuthShellProps) {
  return (
    <Box
      mih="100vh"
      style={{
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      }}
    >
      <Container size="xl" p={0} h="100vh">
        <Grid gutter={0} h="100%">
          {/* Left Panel - Marketing (hidden on mobile) */}
          <Grid.Col
            span={{ base: 12, md: 5, lg: 6 }}
            display={{ base: "none", md: "block" }}
            style={{
              background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
            }}
          >
            <Box h="100vh" p={{ base: "md", lg: "xl" }}>
              <MarketingPanel mode={mode} />
            </Box>
          </Grid.Col>

          {/* Right Panel - Form */}
          <Grid.Col span={{ base: 12, md: 7, lg: 6 }}>
            <Box
              h={{ base: "auto", md: "100vh" }}
              mih="100vh"
              p={{ base: "md", sm: "xl", lg: "2rem" }}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "#ffffff",
              }}
            >
              {/* Mobile Logo */}
              <Box display={{ base: "block", md: "none" }} mb="xl" ta="center">
                <Logo />
                <Text fz="lg" fw={600} c="dark.7" mt="lg">
                  {mode === "register" ? "Hemen başla!" : "Tekrar hoş geldin!"}
                </Text>
                <Text fz="sm" c="dimmed">
                  {mode === "register"
                    ? "KML yükle • Orbit animasyonu • Reels çıktısı"
                    : "Devam etmek için giriş yap"}
                </Text>
              </Box>

              {/* Form Card */}
              <Paper
                shadow="xl"
                radius="lg"
                p={{ base: "lg", sm: "xl" }}
                w="100%"
                maw={440}
                withBorder
                style={{ borderColor: "var(--mantine-color-gray-2)" }}
              >
                {children}
              </Paper>

              {/* Security Note */}
              <Text fz="xs" c="dimmed" ta="center" mt="xl" maw={300}>
                Verileriniz 256-bit şifreleme ve tenant izolasyonu ile korunur.
              </Text>
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
