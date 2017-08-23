<template>
  <div id="app">
    <my-header></my-header>
    <router-view></router-view>
  </div>
</template>

<script>
    import MyHeader from './components/Header';

    export default {
        name: 'app',
        components: {
            MyHeader
        }
    }

</script>

<style src="vue-material/dist/vue-material.css"></style>
<style src="@/css/main.css"></style>
