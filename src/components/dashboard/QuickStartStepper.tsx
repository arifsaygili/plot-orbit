"use client";

import Link from "next/link";
import {
  Paper,
  Stepper,
  Button,
  Text,
  Group,
  Badge,
  Stack,
  Tooltip,
  Box,
} from "@mantine/core";
import {
  IconUpload,
  IconEye,
  IconRotate360,
  IconVideo,
  IconPhoto,
  IconClock,
  IconLock,
} from "@tabler/icons-react";

export type StepStatus = "done" | "next" | "locked";

export interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  buttonLabel: string;
  href?: string;
  status: StepStatus;
}

// TODO: Wire these to real data (check if user has KMLs, videos, etc.)
const defaultSteps: QuickStartStep[] = [
  {
    id: "upload",
    title: "KML/KMZ Yükle",
    description: "Harita dosyanı yükle ve parselleri görüntüle",
    icon: IconUpload,
    buttonLabel: "KML Yükle",
    href: "/kml",
    status: "next",
  },
  {
    id: "preview",
    title: "Önizleme & Parsel Seçimi",
    description: "3D haritada parseli seç ve hedefi belirle",
    icon: IconEye,
    buttonLabel: "Önizlemeye Git",
    href: undefined, // Will be dynamic based on KML ID
    status: "locked",
  },
  {
    id: "orbit",
    title: "Orbit Ayarı",
    description: "Kamera yörüngesini ve hızını ayarla",
    icon: IconRotate360,
    buttonLabel: "Orbit Ayarla",
    href: undefined,
    status: "locked",
  },
  {
    id: "record",
    title: "Kayıt Al (Video)",
    description: "Orbit animasyonunu video olarak kaydet",
    icon: IconVideo,
    buttonLabel: "Video Kaydet",
    href: undefined,
    status: "locked",
  },
  {
    id: "gallery",
    title: "Galeri & Reels",
    description: "Videoları görüntüle, indir veya Reels formatında dışa aktar",
    icon: IconPhoto,
    buttonLabel: "Videolar",
    href: "/videos",
    status: "locked",
  },
];

function getStatusBadge(status: StepStatus) {
  switch (status) {
    case "done":
      return (
        <Badge color="green" variant="light" size="sm">
          Tamamlandı
        </Badge>
      );
    case "next":
      return (
        <Badge color="teal" variant="filled" size="sm">
          Şimdi
        </Badge>
      );
    case "locked":
      return (
        <Badge color="gray" variant="light" size="sm" leftSection={<IconLock size={10} />}>
          Kilitli
        </Badge>
      );
  }
}

function getActiveStep(steps: QuickStartStep[]): number {
  const nextIndex = steps.findIndex((s) => s.status === "next");
  if (nextIndex !== -1) return nextIndex;

  const lastDoneIndex = steps.reduce(
    (acc, s, i) => (s.status === "done" ? i : acc),
    -1
  );
  return lastDoneIndex + 1;
}

interface QuickStartStepperProps {
  steps?: QuickStartStep[];
}

export function QuickStartStepper({ steps = defaultSteps }: QuickStartStepperProps) {
  const activeStep = getActiveStep(steps);

  return (
    <Paper shadow="sm" radius="lg" p="xl" withBorder>
      <Group justify="space-between" mb="lg">
        <div>
          <Text fz="lg" fw={600} c="dark.7">
            Hızlı Başlangıç
          </Text>
          <Text fz="sm" c="dimmed">
            5 adımda profesyonel emlak videosu oluştur
          </Text>
        </div>
        <Group gap="xs">
          <IconClock size={14} color="var(--mantine-color-dimmed)" />
          <Text fz="xs" c="dimmed">
            Bu akış 60–90 sn sürer
          </Text>
        </Group>
      </Group>

      <Stepper
        active={activeStep}
        orientation="vertical"
        color="teal"
        size="md"
        styles={{
          stepIcon: {
            borderWidth: 2,
          },
          stepBody: {
            paddingBottom: 24,
          },
          verticalSeparator: {
            marginLeft: 15,
          },
        }}
      >
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLocked = step.status === "locked";
          const isDone = step.status === "done";
          const isNext = step.status === "next";

          return (
            <Stepper.Step
              key={step.id}
              icon={<Icon size={18} />}
              completedIcon={<Icon size={18} />}
              label={
                <Group gap="sm">
                  <Text fw={500}>{step.title}</Text>
                  {getStatusBadge(step.status)}
                </Group>
              }
              description={
                <Stack gap="sm" mt="xs">
                  <Text fz="sm" c="dimmed">
                    {step.description}
                  </Text>
                  {isLocked ? (
                    <Tooltip label="Önceki adımları tamamlayın">
                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        disabled
                        w="fit-content"
                      >
                        {step.buttonLabel}
                      </Button>
                    </Tooltip>
                  ) : step.href ? (
                    <Button
                      size="xs"
                      variant={isNext ? "filled" : "light"}
                      color="teal"
                      component={Link}
                      href={step.href}
                      w="fit-content"
                    >
                      {step.buttonLabel}
                    </Button>
                  ) : (
                    <Tooltip label="Yakında">
                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        disabled
                        w="fit-content"
                      >
                        {step.buttonLabel}
                      </Button>
                    </Tooltip>
                  )}
                </Stack>
              }
            />
          );
        })}
      </Stepper>
    </Paper>
  );
}
