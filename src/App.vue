<template>
  <div class="font-zen">
    <BlueGreenTest />
  </div>
</template>

<script>
import BlueGreenTest from './components/BlueGreenTest.vue'

export default {
  name: 'App',
  components: {
    BlueGreenTest
  }
}
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Zen Maru Gothic', sans-serif; /* fallback in case Tailwind misses */
}

#app {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
