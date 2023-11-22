<template>
  <article id="lyrics">
    <div class="content">
      <Magnifier class="magnifier" @in="zoomLevel++" @out="zoomLevel--" />
      <template v-if="song">
        <div v-show="song.lyrics">
          <div ref="lyricsContainer" class="lyrics-container">
            <div :class="`lrc-line lrc-line-${index} ${index === lrcLine && 'lrc-line-highlight' || ''}`" v-for="(line, index) in lyrics">
              {{ line.text }}
              <div v-if="index === lrcLine" ref="highlightLrcLine"></div>
            </div>
          </div>
        </div>
        <p v-if="song.id && !song.lyrics" class="none text-secondary">
          <template v-if="isAdmin">
            No lyrics found.
            <button class="text-highlight" type="button" @click.prevent="showEditSongForm">
              Click here
            </button>
            to add lyrics.
          </template>
          <span v-else>No lyrics available. Are you listening to Bach?</span>
        </p>
      </template>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, onMounted, ref, toRefs, watch } from 'vue'
import { eventBus, LyricsTracker } from '@/utils'
import { useAuthorization } from '@/composables'
import { preferenceStore as preferences } from '@/stores'

const lrcLine = ref(0);
const lrcTracker = new LyricsTracker();
const audioPlayer = document.getElementsByTagName('audio')[0];
const highlightLrcLine = ref<HTMLElement>();

const Magnifier = defineAsyncComponent(() => import('@/components/ui/Magnifier.vue'))

const props = defineProps<{ song: Song }>()
const { song } = toRefs(props)

const { isAdmin } = useAuthorization()

const lyricsContainer = ref<HTMLElement>()
const zoomLevel = ref(preferences.lyricsZoomLevel || 1)

const showEditSongForm = () => eventBus.emit('MODAL_SHOW_EDIT_SONG_FORM', song.value, 'lyrics')

const lyrics = computed(() => {
  lrcLine.value = 0;
  lrcTracker.setLyrics(song.value.lyrics);
  return lrcTracker.getLines();
})

const setFontSize = () => {
  if (lyricsContainer.value) {
    lyricsContainer.value.style.fontSize = `${1 + (zoomLevel.value - 1) * 0.2}rem`
  }
}

watch(lrcLine, () => {
  highlightLrcLine.value?.[0]?.scrollIntoView({
    block: 'center',
    behavior: 'smooth'
  });
});

watch(zoomLevel, level => {
  setFontSize()
  preferences.lyricsZoomLevel = level
})

onMounted(() => {
  setFontSize();
  audioPlayer.addEventListener('timeupdate', () => {
    const { index } = lrcTracker.getLineAtTime(audioPlayer.currentTime * 1000);
    lrcLine.value = index;
  });
})
</script>

<style lang="scss" scoped>
.content {
  position: relative;

  .magnifier {
    opacity: 0;
    position: sticky;
    top: 0;
    right: 0;
    display: flex;
    justify-content: end;

    @media (hover: none) {
      opacity: 1;
    }
  }

  &:hover .magnifier {
    opacity: .5;

    &:hover {
      opacity: 1;
    }
  }
}

.lrc-line {
  text-align: center;
  transition: all .3s;
  margin: 10px 0 10px 0;
}

.lrc-line-highlight {
  color: white;
  text-shadow: 0px 0px 20px white;
  transform: scale(1.1);
  margin: 20px 0 20px 0;
}

.lyrics-container {
  margin: calc(100vh - var(--footer-height)) 0 calc(100vh - var(--footer-height)) 0;
}
</style>
