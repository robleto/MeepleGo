export const dynamic = 'force-dynamic'
export const revalidate = 0
import PageLayout from '@/components/PageLayout'
import Heading from '@/components/Heading'
import SchemaCheckClient from './schemaCheckClient'

export default function AwardsSchemaPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Heading as="h1" size="lg" soft>Awards Schema Check</Heading>
        <SchemaCheckClient />
        <p className="mt-4 text-sm text-gray-500">If needsAction = true, run the pending migration(s) shown earlier.</p>
      </div>
    </PageLayout>
  )
}