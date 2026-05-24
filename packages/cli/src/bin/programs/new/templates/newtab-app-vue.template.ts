/**
 * Vue 3 single-file new tab component mirroring the React newtab-app.template.ts
 * showcase: a full-screen iframe pointing at the HexaJS docs.
 */
export const newtabAppVueTemplate = (): string => `<script setup lang="ts">
</script>

<template>
  <iframe
    src="https://hexajs.dev"
    style="width: 100vw; height: 100vh; border: none; display: block"
    title="HexaJS Documentation"
  />
</template>
`;
