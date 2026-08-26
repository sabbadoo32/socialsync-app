import ComposeForm from "@/components/ComposeForm";

export default function ComposeEditPage({ params }: { params: { id: string } }) {
  return <ComposeForm id={params.id} />;
}
