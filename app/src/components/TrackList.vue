<template>
<md-layout md-column md-flex="40">
    <div class="tracklist-header">
        <div v-if="src === 'spotify'">
            <md-subheader v-if="library.info && library.tracks.length">
                {{library.info.name}} ({{library.tracks.length}} Tracks)        
            </md-subheader>
            <md-subheader v-if="library.info.description" v-html="library.info.description">
            </md-subheader>
        </div>
        <div v-if="src === 'google' && library.tracks.length">
            <form novalidate @submit.stop.prevent="submit">
                <md-input-container>
                    <label>Name</label>
                    <md-input @focus.native="$event.target.select()" v-on:change="updatePlInfo" v-model="info.name" name="pl-name"></md-input>
                </md-input-container> 
                <md-input-container>
                    <label>Description</label>
                    <md-textarea @focus.native="$event.target.select()" v-on:change="updatePlInfo" v-model="info.description" name="pl-desc"></md-textarea>
                </md-input-container>            
            </form>
        </div>
    </div>
   
    
    <md-list class="custom-list md-triple-line md-dense">
        <md-list-item v-for="(track, index) in library.tracks" :key="index">
            <md-avatar>
                <md-image :md-src="track.art" :alt="track.album"></md-image>
            </md-avatar>

            <div class="md-list-text-container">
                <span><strong>{{index + 1}}. {{track.song}}</strong></span>
                <span>{{track.artist}}</span>
                <p>{{track.album}}</p>
            </div>
            <md-divider class="md-inset"></md-divider>
        </md-list-item>
    </md-list>
</md-layout>

</template>

<script>
    export default {
        name: 'TrackList',
        props: ['src'],
        data() {
            return {
                info: {
                    name: undefined,
                    description: undefined
                }      
            }
        },
        methods: {
            updatePlInfo: function() {
                var vm = this;
            
                vm.$root.$data.google.info = {
                    name: vm.info.name,
                    description: vm.info.description
                };
            }  
        },
        computed: {
            library: function() {
                switch(this.src) {
                    case 'spotify':
                        return this.$root.$data.spotify;
                        break;
                    case 'google':
                        return this.$root.$data.google;
                        break;
                    break;
                }
            },
            plInfo: function() {
               return { 
                    name: this.$root.$data.spotify.info.name,
                    description: this.$root.$data.spotify.info.description
                }
            }            
        },
        updated() {
            if(!this.info.name) {
                this.info.name = this.$root.$data.spotify.info.name;
            }
            if(!this.info.description) {
                this.info.description = this.$root.$data.spotify.info.description;                
            }
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .tracklist-header {
        /*height: 250px;
        overflow: auto;*/
        flex: 1;
    };   
    form {
        padding: 0 16px;
    }

</style>
