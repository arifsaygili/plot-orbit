"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Stack,
  Title,
  Text,
  Button,
  Group,
  Paper,
  SimpleGrid,
  Skeleton,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconRocket,
  IconPlayerPlay,
  IconInfoCircle,
  IconGift,
  IconMovie,
  IconClock,
} from "@tabler/icons-react";
import {
  QuickStartStepper,
  StatsRow,
  RecentItemsCard,
  type RecentItem,
} from "@/components/dashboard";

// TODO: Fetch real data from APIs
interface DashboardData {
  recentKmls: RecentItem[];
  recentVideos: RecentItem[];
  stats: {
    freeVideosRemaining: number;
    totalVideos: number;
    lastActivity: string | null;
  };
}

function HeroSection() {
  const handleSampleKml = () => {
    notifications.show({
      title: "Yakında",
      message: "Örnek KML özelliği yakında aktif olacak.",
      color: "blue",
      icon: <IconInfoCircle size={16} />,
    });
  };

  return (
    <Paper
      shadow="sm"
      radius="lg"
      p="xl"
      withBorder
      style={{
        background: "linear-gradient(135deg, var(--mantine-color-teal-0) 0%, var(--mantine-color-white) 100%)",
      }}
    >
      <Stack gap="md">
        <div>
          <Title order={2} c="dark.7">
            Bugün ne üretelim?
          </Title>
          <Text fz="md" c="dimmed" mt="xs">
            KML'yi yükle → Parseli seç → Orbit → Video'yu indir veya Reels hazırla.
          </Text>
        </div>

        <Group gap="sm">
          <Button
            size="md"
            color="teal"
            leftSection={<IconRocket size={18} />}
            component={Link}
            href="/kml"
          >
            Hızlı Başlat
          </Button>
          <Button
            size="md"
            variant="light"
            color="gray"
            leftSection={<IconPlayerPlay size={18} />}
            onClick={handleSampleKml}
          >
            Örnek KML ile dene
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function LoadingState() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Skeleton height={140} radius="lg" />
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Skeleton height={100} radius="lg" />
          <Skeleton height={100} radius="lg" />
          <Skeleton height={100} radius="lg" />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Skeleton height={300} radius="lg" />
          <Skeleton height={300} radius="lg" />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    recentKmls: [],
    recentVideos: [],
    stats: {
      freeVideosRemaining: 1,
      totalVideos: 0,
      lastActivity: null,
    },
  });

  useEffect(() => {
    // TODO: Fetch real data from APIs
    // For now, simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Hero / Welcome Section */}
        <HeroSection />

        {/* Stats Row */}
        <StatsRow
          stats={[
            {
              id: "free-videos",
              label: "Kalan Free Video",
              value: data.stats.freeVideosRemaining,
              icon: IconGift,
              color: "teal",
              description: "Free plan kredisi",
            },
            {
              id: "total-videos",
              label: "Toplam Video",
              value: data.stats.totalVideos,
              icon: IconMovie,
              color: "blue",
              description: "Oluşturulan videolar",
            },
            {
              id: "last-activity",
              label: "Son İşlem",
              value: data.stats.lastActivity || "—",
              icon: IconClock,
              color: "gray",
              description: "Son aktivite",
            },
          ]}
        />

        {/* Quick Start Stepper */}
        <QuickStartStepper />

        {/* Recent Items */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <RecentItemsCard
            title="Son KML'ler"
            type="kml"
            items={data.recentKmls}
            viewAllHref="/kml"
            createHref="/kml"
          />
          <RecentItemsCard
            title="Son Videolar"
            type="video"
            items={data.recentVideos}
            viewAllHref="/videos"
            createHref="/kml"
          />
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
