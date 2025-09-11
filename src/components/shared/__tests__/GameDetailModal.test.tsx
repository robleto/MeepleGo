import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GameDetailModal from '../GameDetailModal'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } })
    }
  }
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test'
}))

describe('GameDetailModal Awards', () => {
  const mockGameWithDuplicateWinnerData = {
    id: '1',
    name: 'Test Game',
    year_published: 2023,
    honors: [
      {
        name: 'Spiel des Jahres',
        category: 'Winner',
        result_raw: 'Winner',
        year: 2023,
        source: 'bgg'
      },
      {
        name: 'Golden Geek Award',
        category: 'Board Game of the Year Winner',
        result_raw: '',
        year: 2023,
        source: 'bgg'
      },
      {
        name: 'Origins Award',
        category: '',
        result_raw: 'Winner - Best Strategy Game',
        year: 2022,
        source: 'bgg'
      }
    ]
  }

  it('should not display duplicate "Winner" text in awards', async () => {
    render(
      <GameDetailModal
        open={true}
        onClose={() => {}}
        game={mockGameWithDuplicateWinnerData}
      />
    )

    // Wait for component to render and navigate to awards section
    const awardsButton = await screen.findByText('Awards')
    awardsButton.click()

    // Check that "Winner" badge appears only once per award, not duplicated with category/result text
    const winnerBadges = screen.getAllByText('Winner')
    
    // Should have exactly 3 winner badges (one for each winning award)
    expect(winnerBadges).toHaveLength(3)
    
    // Verify the specific awards are present without duplicate winner text
    expect(screen.getByText('Spiel des Jahres')).toBeInTheDocument()
    expect(screen.getByText('Golden Geek Award')).toBeInTheDocument()
    expect(screen.getByText('Origins Award')).toBeInTheDocument()
    
    // Check that category/result text that contains "winner" is not displayed alongside winner badge
    expect(screen.queryByText('Board Game of the Year Winner')).not.toBeInTheDocument()
    expect(screen.queryByText('Winner - Best Strategy Game')).not.toBeInTheDocument()
  })

  it('should display non-winner categories and results normally', async () => {
    const gameWithNominations = {
      ...mockGameWithDuplicateWinnerData,
      honors: [
        {
          name: 'International Gamers Award',
          category: 'Nominee',
          result_raw: 'Nominated',
          year: 2023,
          source: 'bgg'
        },
        {
          name: 'Board Game Quest Award',
          category: 'Strategy Game Category',
          result_raw: 'Honorable Mention',
          year: 2023,
          source: 'bgg'
        }
      ]
    }

    render(
      <GameDetailModal
        open={true}
        onClose={() => {}}
        game={gameWithNominations}
      />
    )

    // Navigate to awards section
    const awardsButton = await screen.findByText('Awards')
    awardsButton.click()

    // Non-winner categories and results should be displayed normally
    expect(screen.getByText('Nominee')).toBeInTheDocument()
    expect(screen.getByText('Nominated')).toBeInTheDocument()
    expect(screen.getByText('Strategy Game Category')).toBeInTheDocument()
    expect(screen.getByText('Honorable Mention')).toBeInTheDocument()
    
    // No winner badges should appear for non-winners
    expect(screen.queryByText('Winner')).not.toBeInTheDocument()
  })
})
