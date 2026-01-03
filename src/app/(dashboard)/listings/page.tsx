import { Stack, Title, Text, Group } from "@mantine/core";
import { IconMapPin } from "@tabler/icons-react";
import { ListingList } from "@/components/listings";
import { getListings } from "@/server/listings";
import { requireAuth } from "@/server/auth";

export const metadata = {
  title: "İlanlarım | Plot Orbit",
};

export default async function ListingsPage() {
  const auth = await requireAuth();
  const result = await getListings(auth);

  // Convert Date to string for client components
  const listingsForClient = result.items.map(listing => ({
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  }));

  return (
    <Stack gap="lg">
      <Group gap="xs">
        <IconMapPin size={28} />
        <Title order={2}>İlanlarım</Title>
      </Group>
      <Text c="dimmed">
        Parsel ilanlarınızı yönetin ve video oluşturun.
      </Text>

      <ListingList initialListings={listingsForClient} />
    </Stack>
  );
}
