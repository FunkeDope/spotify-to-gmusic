<template>
<div class="header">
    <md-whiteframe>
        <md-toolbar>
            <h2 style="flex:1" class="md-title">Spotify to Google Play Music Converter</h2>
            <router-link tag="md-button" to="/login">{{email}}</router-link>
            <md-menu md-size="4" md-direction="bottom left">
              <md-button md-menu-trigger class="md-icon-button"><md-icon>menu</md-icon></md-button>

              <md-menu-content>
                <router-link tag="md-menu-item" to="/"><md-icon>home</md-icon><span>Home</span></router-link>
                <md-divider></md-divider>
                <router-link tag="md-menu-item" to="/login"><md-icon>supervisor_account</md-icon><span>Switch Account</span></router-link>
                <md-menu-item @click="signOut()"><md-icon>exit_to_app</md-icon><span>Sign Out</span></md-menu-item>
              </md-menu-content>
            </md-menu>
        </md-toolbar>
    </md-whiteframe>
    
    
</div>
</template>

<script>
    import router from '@/router';
    export default {
        name: 'myheader',
        methods: {
            signOut: function() {
                localStorage.removeItem('user');
                this.$root.$data.user = {};
                router.push('/login');
            }
        },
        computed: {
            email: function() {
                return this.$root.$data.user.email
            }
        }       
        
    }

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


</style>
