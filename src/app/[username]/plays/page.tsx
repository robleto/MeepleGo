import { redirect } from 'next/navigation'

interface Props {
  params: { username: string }
}

export default function UserPlaysPage({ params }: Props) {
  redirect(`/${params.username}/journal`)
}
