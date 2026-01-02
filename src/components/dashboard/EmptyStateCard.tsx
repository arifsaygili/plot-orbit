"use client";

import Link from "next/link";
import {
  Paper,
  Stack,
  Text,
  Button,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";

interface EmptyStateCardProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  disabled?: boolean;
}

export function EmptyStateCard({
  icon: Icon = IconInbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  disabled = false,
}: EmptyStateCardProps) {
  return (
    <Paper shadow="sm" radius="lg" p="xl" withBorder>
      <Stack align="center" gap="md" py="lg">
        <Box
          p="md"
          style={{
            background: "var(--mantine-color-gray-1)",
            borderRadius: "50%",
          }}
        >
          <ThemeIcon size={48} radius="xl" variant="light" color="gray">
            <Icon size={24} />
          </ThemeIcon>
        </Box>

        <Stack align="center" gap={4}>
          <Text fz="md" fw={600} c="dark.6">
            {title}
          </Text>
          <Text fz="sm" c="dimmed" ta="center" maw={280}>
            {description}
          </Text>
        </Stack>

        {actionLabel && (
          actionHref ? (
            <Button
              variant="light"
              color="teal"
              size="sm"
              component={Link}
              href={actionHref}
              disabled={disabled}
            >
              {actionLabel}
            </Button>
          ) : (
            <Button
              variant="light"
              color="teal"
              size="sm"
              onClick={onAction}
              disabled={disabled}
            >
              {actionLabel}
            </Button>
          )
        )}
      </Stack>
    </Paper>
  );
}
