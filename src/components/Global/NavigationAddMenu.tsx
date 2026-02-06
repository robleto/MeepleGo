'use client'

import type React from 'react'
import { Button } from '../Elements/Button'
import { PlusIcon, PlayIcon, ListBulletIcon, CubeIcon } from '@heroicons/react/24/outline'

interface NavigationAddMenuProps {
  showAddMenu: boolean
  setShowAddMenu: React.Dispatch<React.SetStateAction<boolean>>
  addMenuRef: React.RefObject<HTMLDivElement>
  addButtonRef: React.RefObject<HTMLButtonElement>
  onLogPlay: () => void
  onCreateList: () => void
  onAddGame: () => void
}

export default function NavigationAddMenu({
  showAddMenu,
  setShowAddMenu,
  addMenuRef,
  addButtonRef,
  onLogPlay,
  onCreateList,
  onAddGame,
}: NavigationAddMenuProps) {
  return (
    <div className="relative flex items-center gap-2" ref={addMenuRef}>
      <Button
        ref={addButtonRef}
        onClick={() => setShowAddMenu((o) => !o)}
        variant="ghost"
        size="sm"
        shape="square"
        leftIcon={<PlusIcon className="w-5 h-5" />}
        aria-label="Add"
        aria-haspopup="menu"
        aria-expanded={showAddMenu}
      />
      {showAddMenu && (
        <div
          className="absolute top-0 z-50 p-2 mt-10 mr-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl right-full w-60 rounded-xl"
          role="menu"
        >
          <div className="text-[11px] uppercase tracking-wide font-semibold text-gray-500 dark:text-gray-400 px-2 pb-1">
            Quick Add
          </div>
          <button
            onClick={() => {
              setShowAddMenu(false)
              onLogPlay()
            }}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <PlayIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Log a Play
          </button>
          <button
            onClick={() => {
              setShowAddMenu(false)
              onCreateList()
            }}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ListBulletIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" /> New List
          </button>
          <button
            onClick={() => {
              setShowAddMenu(false)
              onAddGame()
            }}
            className="flex items-center w-full gap-3 px-3 py-2 text-sm transition rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <CubeIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Missing Game
          </button>
        </div>
      )}
    </div>
  )
}
