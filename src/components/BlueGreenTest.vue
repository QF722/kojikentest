<template>
  <div class="blue-green-test-wrapper">
    <div :style="containerStyle" class="blue-green-test-container">
      <div v-if="!showResults" class="blue-green-test-content">
        <transition name="fade-up" mode="out-in">
          <h1 v-if="showInitialMessage" key="initial" class="blue-green-test-title">
            <span class="background-white">  <i>Created by </i>Ryota  </span>
          </h1>
          <h1 v-else key="main" class="blue-green-test-title">
            <span class="background-white">Is <i>your</i> blue <i>actually</i> blue?</span>
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
          This is {{ leftButton }}
        </button>
        <button @click="reset" class="blue-green-test-button mid-reset-button grow-button">
          Reset
        </button>
        <button @click="selectColor(rightButton)" class="blue-green-test-button grow-button">
          This is {{ rightButton }}
        </button>
      </div>
      <div v-else class="blue-green-test-button-container two-buttons">
        <button
          @click="showAbout = true"
          class="blue-green-test-button final-reset-button grow-button"
        >
          About
        </button>
        <button @click="reset" class="blue-green-test-button final-reset-button grow-button">
          Reset
        </button>
      </div>
    </div>
    <div v-if="firstColorMislabeled" class="about-popup">
      <div class="about-content">
        <h2>Whoops!</h2>
        <p>
          The first color is always very green or very blue. If you mislabel the first color, you
          won't get an accurate result. This might indicate that you have a night filter or you made a mistake. Let's try again.
        </p>
        <button @click="reset()" class="reset-button reset-button">Reset</button>
      </div>
    </div>
    <div
      v-if="rounds == MAX_ROUNDS && (allSame == 'blue' || allSame == 'green')"
      class="about-popup"
    >
      <div class="about-content">
        <h2>Whoops!</h2>
        <p>
          You labeled all the colors as {{ allSame }}. We can't infer a boundary based on your
          responses. Try again?
        </p>
        <button @click="reset()" class="reset-button reset-button">Reset</button>
      </div>
    </div>
    <div v-if="showAbout" class="about-popup">
      <div class="about-content">
        <button @click="showAbout = false" class="close-button">&times;</button>
        <h2>About This Website</h2>
        <p>
          People have different names for the colors they see.
          <a href="https://en.wikipedia.org/wiki/Sapir%E2%80%93Whorf_hypothesis" target="_blank"
            >Language can affect how we memorize and name colors</a
          >. This is a color naming test designed to measure your personal blue-green boundary.
        </p>
       
        <p>
           
        </p>
        <h2>How it works</h2>
        <p>
          This test uses an algorithm called <a href="https://github.com/learn-co-students/dsc-2-21-12-PE-MAP-online-ds-pt-112618">MAP estimation.</a> This algorithm cleverly chooses the next colors to show you, 
          focusing on shades where you seem uncertain. To make the best results, it also randomly selects some colors and uses visual noise.
        </p>


           
        <h2>Who made this?</h2>
        <p>
          I'm Ryota Kawakami, a highschool student. I made this for my experiment about linguistic relativity
          using <a href="https://www.skillupai.com/blog/ai-knowledge/about-claude-3-5-sonnet/">Claude 3.5 Sonnet</a> and countless open source libraries from github. 
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
      return this.greenButtonRight ? 'green' : 'blue'
    },
    leftButton() {
      return this.greenButtonRight ? 'blue' : 'green'
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
        if (color === 'blue' && this.currentHue < 180) {
          this.firstColorMislabeled = true
        } else if (color === 'green' && this.currentHue > 180) {
          this.firstColorMislabeled = true
        }
        if (this.firstColorMislabeled) {
          return
        }
      }

      // Get the new probe value
      const { b, newProbe, polarity } = fitSigmoid(
        this.responses.map((r) => r.hue),
        this.responses.map((r) => r.response === 'blue'),
        this.polarity,
        0.4
      )
      this.polarity = polarity == 1 ? -1 : 1
      this.currentHue = newProbe
      this.rounds++
      if (this.rounds === MAX_ROUNDS) {
        if (
          this.responses.every((r) => r.response === 'blue') ||
          this.responses.every((r) => r.response === 'green')
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
  font-family: 'Cabin', sans-serif;
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
