<template>
  <div class="blue-green-test-wrapper">
    <div :style="containerStyle" class="blue-green-test-container">
      <div v-if="!showResults" class="blue-green-test-content">
        <transition name="fade-up" mode="out-in">
          <h1 v-if="showInitialMessage" key="initial" class="blue-green-test-title">
            <span class="background-white">  <i>Created by </i>りょうた  </span>
          </h1>
          <h1 v-else key="main" class="blue-green-test-title">
            <span class="background-white"> <i>あなたの青は本当に青ですか?</i> <i> </i> </span>
          </h1>
        </transition>
      </div>
      <div v-else class="blue-green-test-content blue-green-test-result-screen">
        <Results
          :binPosition="BIN_POSITION"
          :count="BIN_COUNT"
          :xCdf="X_CDF"
          :yCdf="Y_CDF"
          :userThreshold="finalHue"
        />
      </div>
      <div v-if="rounds < MAX_ROUNDS" class="blue-green-test-button-container three-buttons">
        <button @click="selectColor(leftButton)" class="blue-green-test-button grow-button">
          これは {{ leftButton }}
        </button>
        <button @click="reset" class="blue-green-test-button mid-reset-button grow-button">
          リセット
        </button>
        <button @click="selectColor(rightButton)" class="blue-green-test-button grow-button">
          これは {{ rightButton }}
        </button>
      </div>
      <div v-else class="blue-green-test-button-container two-buttons">
        <button
          @click="showAbout = true"
          class="blue-green-test-button final-reset-button grow-button"
        >
        このサイトついて
        </button>
        <button @click="reset" class="blue-green-test-button final-reset-button grow-button">
          リセット
        </button>
      </div>
    </div>
    <div v-if="firstColorMislabeled" class="about-popup">
      <div class="about-content">
        <h2>おっと！</h2>
        <p>
          最初の色は必ず非常に緑か非常に青である。最初の色が間違っていると
          正確な結果が得られません。これは、夜間モードを使っているか、間違えたことを示しているかもしれません。もう一度試してみましょう。
        </p>
        <button @click="reset()" class="reset-button reset-button">リセット</button>
      </div>
    </div>
    <div
      v-if="rounds == MAX_ROUNDS && (allSame == '青' || allSame == '緑')"
      class="about-popup"
    >
      <div class="about-content">
        <h2>おっと！</h2>
        <p>
          You labeled all the colors as {{ allSame }}. We can't infer a boundary based on your
          responses. Try again?
        </p>
        <button @click="reset()" class="reset-button reset-button">リセット</button>
      </div>
    </div>
    <div v-if="showAbout" class="about-popup">
      <div class="about-content">
        <button @click="showAbout = false" class="close-button">&times;</button>
        <h2>このウェブサイトについて</h2>
        <p>
          言語によって、色の名前は異なります。
          <a href="https://en.wikipedia.org/wiki/Sapir%E2%80%93Whorf_hypothesis" target="_blank"
            >言語は、色の記憶や名前の付け方に影響を与えます。</a
          > これは、あなたの青と緑の境界線を測定するためにデザインされたカラーネーミングテストです。
        </p>
       
        <p>
           
        </p>
        <h2> </h2>
        <p>
           
        </p>


           
        <h2> </h2>
        <p>
           
            
        </p>
        <h2> </h2>
        <p>
         
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MAX_ROUNDS, BIN_POSITION, BIN_COUNT, X_CDF, Y_CDF } from '@/config' // Adjust the import path as needed
</script>

<script>
import { MAX_ROUNDS, VERSION, BIN_POSITION, BIN_COUNT, X_CDF, Y_CDF } from '@/config'
import confetti from 'https://cdn.skypack.dev/canvas-confetti'
import Results from './Results.vue'
import { fitSigmoid } from '@/utils/glmUtils'

import maskImage from '@/assets/mask.png'

export default {
  components: {
    Results
  },
  data() {
    return {
      currentHue: Math.random() > 0.5 ? 150 : 210,
      showInitialMessage: true,
      polarity: 0,
      rounds: 0,
      finalHue: 0,
      responses: [],
      showMask: false,
      maskImageUrl: maskImage,
      showAbout: false,
      showDemo: false,
      greenButtonRight: Math.random() > 0.5,
      firstColorMislabeled: false,
      allSame: false,
      showResults: false,
      errorMessage: ''
    }
  },
  computed: {
    rightButton() {
      return this.greenButtonRight ? '緑です' : '青です'
    },
    leftButton() {
      return this.greenButtonRight ? '青です' : '緑です'
    },
    currentColor() {
      return `hsl(${this.currentHue}, 100%, 50%)`
    },
    bluerColor() {
      return `hsl(${this.finalHue + 5}, 100%, 50%)`
    },
    greenerColor() {
      return `hsl(${this.finalHue - 5}, 100%, 50%)`
    },
    containerStyle() {
      if (this.rounds === MAX_ROUNDS) {
        return {
          backgroundColor: 'white'
        }
      } else if (this.showMask) {
        return {
          backgroundColor: this.showMask ? 'transparent' : this.currentColor,
          backgroundImage: this.showMask ? `url(${this.maskImageUrl})` : 'none',
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto'
        }
      } else {
        return {
          backgroundColor: this.currentColor
        }
      }
    }
  },
  methods: {
    selectColor(color) {
      this.responses.push({ hue: this.currentHue, response: color })

      if (this.rounds === 0) {
        if (color === '青です' && this.currentHue < 180) {
          this.firstColorMislabeled = true
        } else if (color === '緑です' && this.currentHue > 180) {
          this.firstColorMislabeled = true
        }
        if (this.firstColorMislabeled) {
          return
        }
      }

      // Get the new probe value
      const { b, newProbe, polarity } = fitSigmoid(
        this.responses.map((r) => r.hue),
        this.responses.map((r) => r.response === '青です'),
        this.polarity,
        0.4
      )
      this.polarity = polarity == 1 ? -1 : 1
      this.currentHue = newProbe
      this.rounds++
      if (this.rounds === MAX_ROUNDS) {
        if (
          this.responses.every((r) => r.response === '青です') ||
          this.responses.every((r) => r.response === '緑です')
        ) {
          this.allSame = this.responses[0].response
          return
        }
        this.finalHue = 180 - b
        this.currentHue = this.finalHue
        this.showResults = true
        confetti()
      }
      this.showMask = true
      setTimeout(() => {
        this.showMask = false
      }, 200)
    },
    reset() {
      let currentHue = Math.random() > 0.5 ? 150 : 210
      if (this.firstColorMislabeled) {
        currentHue = this.currentHue == 210 ? 150 : 210
      }

      this.currentHue = currentHue
      this.rounds = 0
      this.finalHue = 0
      this.polarity = 0
      this.showInitialMessage = true
      this.responses = []
      this.showMask = false
      this.firstColorMislabeled = false
      this.allSame = false
      this.showResults = false

      setTimeout(() => {
        this.showInitialMessage = false
      }, 2000)
    }
  },
  mounted() {
    setTimeout(() => {
      this.showInitialMessage = false
    }, 2000)
  }
}
</script>

<style src="./BlueGreenTest.css" scoped />
<style scoped>
.color-chip-turquoise {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: turquoise;
  border: 2px solid black;
  border-radius: 0.2em;
  margin-bottom: -0.2em;
}

.color-chip-cyan {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: cyan;
  border: 2px solid black;
  border-radius: 0.2em;
  margin-bottom: -0.2em;
}

.about-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.about-content {
  background-color: white;
  color: rgb(0, 0, 0);
  padding: 2rem;
  border-radius: 8px;
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
  position: relative;
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 0.9rem;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

.about-content h2 {
  margin-top: 0;
  font-size: 1.2rem;
}

.about-content h3 {
  font-size: 1.2rem;
  margin-top: 1rem;
}

.about-content p {
  margin-bottom: 1rem;
}

/* Ensure text inputs match select styling */
input[type='text'].form-control {
  border: 2px solid #4a90e2;
}

/* Style for the submit button */
.reset-button {
  background-color: #4a90e2;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.reset-button:hover {
  background-color: #2a70c2;
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap');

body {
  font-family: 'Noto Sans JP', sans-serif !important;
}
</style>
