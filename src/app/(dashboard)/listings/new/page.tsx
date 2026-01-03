import { Stack, Title, Text, Group } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { ListingForm } from "@/components/listings";

export const metadata = {
  title: "Yeni İlan | Plot Orbit",
};

export default function NewListingPage() {
  return (
    <Stack gap="lg" h="100%">
      <Group gap="xs">
        <IconPlus size={28} />
        <Title order={2}>Yeni İlan Oluştur</Title>
      </Group>
      <Text c="dimmed">
        Haritadan parsel seçin ve ilan bilgilerini girin.
      </Text>

      <ListingForm />
    </Stack>
  );
}
