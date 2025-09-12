import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    // Focus on active component/story locations; exclude legacy `features` & `shared` empty placeholders
    "../src/components/Components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/components/Elements/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/components/Foundations/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/design-system/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-styling-webpack"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ]
};
export default config;