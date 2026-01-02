"use client";

import {
  SimpleGrid,
  Paper,
  Text,
  Group,
  ThemeIcon,
  Skeleton,
  Stack,
} from "@mantine/core";
import {
  IconGift,
  IconMovie,
  IconClock,
} from "@tabler/icons-react";

export interface Stat {
  id: string;
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description?: string;
}

// TODO: Fetch real stats from API
const defaultStats: Stat[] = [
  {
    id: "free-videos",
    label: "Kalan Free Video",
    value: 1,
    icon: IconGift,
    color: "teal",
    description: "Free plan kredisi",
  },
  {
    id: "total-videos",
    label: "Toplam Video",
    value: 0,
    icon: IconMovie,
    color: "blue",
    description: "Oluşturulan videolar",
  },
  {
    id: "last-activity",
    label: "Son İşlem",
    value: "—",
    icon: IconClock,
    color: "gray",
    description: "Son aktivite",
  },
];

interface StatCardProps {
  stat: Stat;
  isLoading?: boolean;
}

function StatCard({ stat, isLoading }: StatCardProps) {
  const Icon = stat.icon;

  if (isLoading) {
    return (
      <Paper shadow="sm" radius="lg" p="lg" withBorder>
        <Stack gap="sm">
          <Skeleton height={20} width={100} />
          <Skeleton height={32} width={60} />
          <Skeleton height={14} width={80} />
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper shadow="sm" radius="lg" p="lg" withBorder>
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fz="sm" c="dimmed" fw={500}>
            {stat.label}
          </Text>
          <Text fz="xl" fw={700} c="dark.7" mt={4}>
            {stat.value}
          </Text>
          {stat.description && (
            <Text fz="xs" c="dimmed" mt={4}>
              {stat.description}
            </Text>
          )}
        </div>
        <ThemeIcon
          size={40}
          radius="md"
          variant="light"
          color={stat.color}
        >
          <Icon size={22} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

interface StatsRowProps {
  stats?: Stat[];
  isLoading?: boolean;
}

export function StatsRow({ stats = defaultStats, isLoading = false }: StatsRowProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} isLoading={isLoading} />
      ))}
    </SimpleGrid>
  );
}
