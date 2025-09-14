# Canonical Development Workflow

## 🚫 NEVER REINVENT THE WHEEL

### Before Creating ANY New Component Variant or Feature:

1. **ALWAYS START WITH STORYBOOK**
   ```bash
   npm run storybook
   # Navigate to http://localhost:6006
   ```

2. **Find the Existing Component**
   - Look for the component in Storybook sidebar
   - Examine ALL existing variants and states
   - Review the component's props and configurations
   - Test interactions (hover, click, etc.)

3. **Document What Exists**
   - What variants are available? (detailed, balanced, compact)
   - What viewModes are supported? (grid, list)
   - What interactions work? (modals, hover states, etc.)
   - What props control behavior?

4. **Only Then Consider Modifications**
   - Can existing props/variants achieve the goal?
   - Can a simple wrapper/container solve the layout need?
   - Is a new variant actually necessary?

### For Layout Changes (like horizontal scrolling):

✅ **CORRECT APPROACH:**
```tsx
// Use existing component with container
<div className="flex gap-4 overflow-x-auto">
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 w-40">
      <ExistingComponent 
        item={item}
        viewMode="grid" 
        variant="compact"
      />
    </div>
  ))}
</div>
```

❌ **WRONG APPROACH:**
```tsx
// Creating custom viewMode="horizontal"
if (viewMode === 'horizontal') {
  return <CustomImplementation />
}
```

### For Component Variations:

✅ **CORRECT APPROACH:**
1. Check Storybook for existing variants
2. If needed, add new variant to existing component
3. Update Storybook stories to document new variant
4. Test all existing functionality still works

❌ **WRONG APPROACH:**
1. Create entirely new component
2. Reimplement existing functionality
3. Miss interactive features like modals, hovers, etc.

## Component Reference Priority

1. **Storybook** - The canonical source of truth
2. **Component props/types** - See what's already configurable  
3. **Existing usage** - How it's used elsewhere in the app
4. **Last resort** - Create new variant with full feature parity

## Remember

- Storybook exists for a reason - USE IT
- Every component has been carefully designed with interactions
- Layout problems are usually container problems, not component problems
- When in doubt, check Storybook first, ask questions second, code third
