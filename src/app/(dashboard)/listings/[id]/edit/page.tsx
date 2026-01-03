import { notFound } from "next/navigation";
import { Stack, Title, Group } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { ListingForm } from "@/components/listings";
import { getListing } from "@/server/listings";
import { requireAuth } from "@/server/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const auth = await requireAuth();
  const listing = await getListing(auth, id);
  
  return {
    title: listing ? `${listing.title} Düzenle | Plot Orbit` : "İlan Bulunamadı",
  };
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const auth = await requireAuth();
  const listing = await getListing(auth, id);

  if (!listing) {
    notFound();
  }

  // Convert Date to string for client component
  const listingForClient = {
    ...listing,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    videos: listing.videos.map(v => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    })),
  };

  return (
    <Stack gap="lg" h="100%">
      <Group gap="xs">
        <IconEdit size={28} />
        <Title order={2}>İlan Düzenle</Title>
      </Group>

      <ListingForm listing={listingForClient} />
    </Stack>
  );
}
