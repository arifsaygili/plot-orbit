import { Container } from "@mantine/core";
import { VideoDetail } from "@/components/videos";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Container size="lg" py="xl">
      <VideoDetail videoId={id} />
    </Container>
  );
}
