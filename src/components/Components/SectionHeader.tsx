import { type ReactNode } from 'react'
import Heading from '@/components/Components/Heading'

interface SectionHeaderProps {
  title: ReactNode
  rightSlot?: ReactNode
  containerClassName?: string
  titleClassName?: string
}

export default function SectionHeader({
  title,
  rightSlot,
  containerClassName = 'flex items-end justify-between mb-5',
  titleClassName = 'mb-1',
}: SectionHeaderProps) {
  return (
    <div className={containerClassName}>
      <Heading as="h2" variant="section" className={titleClassName}>
        {title}
      </Heading>
      {rightSlot}
    </div>
  )
}
