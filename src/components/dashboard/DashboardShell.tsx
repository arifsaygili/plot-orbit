"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Button,
  Menu,
  Avatar,
  Stack,
  Skeleton,
  Tooltip,
  ThemeIcon,
  Divider,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconVideo,
  IconLayoutDashboard,
  IconFiles,
  IconMovie,
  IconBrandInstagram,
  IconSettings,
  IconPlus,
  IconChevronDown,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { getMe, type CurrentUser } from "@/client/api/meClient";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "KML'ler", href: "/kml", icon: IconFiles },
  { label: "Videolar", href: "/videos", icon: IconMovie },
  { label: "Reels", href: "/reels", icon: IconBrandInstagram, disabled: true },
  { label: "Ayarlar", href: "/settings", icon: IconSettings, disabled: true },
];

function Logo() {
  return (
    <Group gap="xs">
      <ThemeIcon size={36} radius="md" variant="filled" color="teal">
        <IconVideo size={22} />
      </ThemeIcon>
      <Text fw={600} fz="lg" c="dark.7">
        ParselShot
      </Text>
    </Group>
  );
}

function UserMenu({ user, isLoading }: { user: CurrentUser | null; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton height={36} width={120} radius="md" />;
  }

  const displayName = user?.name || user?.email?.split("@")[0] || "Hesap";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Button
          variant="subtle"
          color="gray"
          rightSection={<IconChevronDown size={14} />}
          leftSection={
            <Avatar size="sm" radius="xl" color="teal">
              {initials}
            </Avatar>
          }
        >
          <Text fz="sm" fw={500} truncate maw={100}>
            {displayName}
          </Text>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {user && (
          <>
            <Menu.Label>{user.email}</Menu.Label>
            {user.tenant && (
              <Menu.Label>
                <Text fz="xs" c="dimmed">
                  {user.tenant.name}
                </Text>
              </Menu.Label>
            )}
            <Menu.Divider />
          </>
        )}
        <Menu.Item leftSection={<IconUser size={14} />} disabled>
          Profil
        </Menu.Item>
        <Menu.Item leftSection={<IconSettings size={14} />} disabled>
          Ayarlar
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={14} />}
          component={Link}
          href="/api/auth/logout"
        >
          Çıkış Yap
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const result = await getMe();
        if (result.ok && result.user) {
          setUser(result.user);
        }
      } catch {
        // Silently fail - user menu will show generic state
      } finally {
        setIsLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  const handleNavClick = () => {
    close();
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: "var(--mantine-color-gray-0)",
          minHeight: "100vh",
        },
      }}
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Box visibleFrom="sm">
              <Logo />
            </Box>
            <Box hiddenFrom="sm">
              <Logo />
            </Box>
          </Group>

          <Group gap="sm">
            <Button
              leftSection={<IconPlus size={16} />}
              color="teal"
              size="sm"
              component={Link}
              href="/kml"
            >
              Yeni Video
            </Button>
            <UserMenu user={user} isLoading={isLoadingUser} />
          </Group>
        </Group>
      </AppShell.Header>

      {/* Navbar */}
      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <Tooltip key={item.href} label="Yakında" position="right">
                  <NavLink
                    label={item.label}
                    leftSection={<Icon size={18} color="var(--mantine-color-gray-5)" />}
                    disabled
                    styles={{
                      root: {
                        borderRadius: "var(--mantine-radius-md)",
                      },
                      label: {
                        color: "var(--mantine-color-gray-5)",
                        fontWeight: 500,
                      },
                    }}
                  />
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={item.href}
                component={Link}
                href={item.href}
                label={item.label}
                leftSection={<Icon size={18} />}
                active={isActive}
                onClick={handleNavClick}
                styles={{
                  root: {
                    borderRadius: "var(--mantine-radius-md)",
                  },
                  label: {
                    color: isActive ? undefined : "var(--mantine-color-dark-6)",
                    fontWeight: 500,
                  },
                }}
                color="teal"
              />
            );
          })}
        </Stack>

        <Divider my="md" />

        {/* Free Plan Notice */}
        <Box
          p="sm"
          style={{
            background: "var(--mantine-color-teal-0)",
            borderRadius: "var(--mantine-radius-md)",
          }}
        >
          <Text fz="xs" c="teal.8" fw={500}>
            Free Plan
          </Text>
          <Text fz="xs" c="teal.7">
            1 video ücretsiz. Upgrade yakında.
          </Text>
        </Box>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
