"use client";

import {
  Container,
  Stack,
  Title,
  Text,
  Group,
} from "@mantine/core";
import { IconMovie } from "@tabler/icons-react";
import { VideoList } from "@/components/videos";

export default function VideosPage() {
  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Page Header */}
        <div>
          <Group gap="sm" mb={4}>
            <IconMovie size={28} color="var(--mantine-color-teal-6)" />
            <Title order={2} c="dark.7">
              Videolar
            </Title>
          </Group>
          <Text fz="md" c="dark.4">
            Kaydettiğin videoları yönet ve indir
          </Text>
        </div>

        <VideoList />
      </Stack>
    </Container>
  );
}
