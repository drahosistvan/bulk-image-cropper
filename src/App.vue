<template>
  <div class="min-h-full text-text">
    <div class="mx-auto py-6 px-6 w-[900px] h-[900px] box-border">
      <header class="mb-6">
        <h1 class="text-3xl font-semibold text-white">Image Trimmer</h1>
        <p class="text-subtext mt-1">Trim transparent/solid borders in bulk</p>
      </header>

      <section class="bg-card border border-border rounded-xl shadow-soft flex flex-col">
        <!-- Drag and drop area -->
        <div
            class="p-5 border-b border-border"
            :class="dragOver ? 'bg-[#0e1530]' : ''"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm text-subtext mb-2">Select a folder or drag & drop it here</p>
              <div class="flex items-center gap-2 min-w-0">
                <button
                    class="px-4 py-2 rounded-lg bg-primary hover:bg-primaryDark transition text-white shrink-0"
                    @click="chooseFolder"
                >
                  Choose Folder
                </button>
                <span
                    v-if="inputDir"
                    class="truncate text-sm text-text/90 max-w-[520px] inline-block align-bottom"
                    :title="inputDir"
                >
                  {{ inputDir }}
                </span>
              </div>
            </div>
            <div class="text-subtext text-sm shrink-0">
              Files found: <span class="text-white">{{ stats.total }}</span>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-white font-medium mb-3">Output mode</h3>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="overwrite" v-model="mode" class="accent-primary" />
                <span>Overwrite existing images</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="subfolder" v-model="mode" class="accent-primary" />
                <span>Save to subfolder (resized-{timestamp})</span>
              </label>
            </div>
          </div>

          <div>
            <h3 class="text-white font-medium mb-3">Performance</h3>
            <label class="block text-sm text-subtext mb-2">Concurrency: {{ concurrency }}</label>
            <input
                type="range"
                min="1" max="16" step="1"
                v-model.number="concurrency"
                class="w-full accent-accent"
            />
            <p class="text-xs text-subtext mt-1">Higher = faster, more CPU/RAM usage</p>

            <label class="block text-sm text-subtext mt-4 mb-2">Trim threshold (0–100)</label>
            <input
                type="number"
                min="0" max="100" step="1"
                v-model.number="threshold"
                class="w-28 bg-[#0e1530] border border-border rounded-lg px-2 py-1 text-white"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="p-5 border-t border-border flex items-center justify-between gap-4">
          <div class="text-sm text-subtext min-w-0" v-if="result && result.outputDir">
            <span class="mr-1">Output:</span>
            <span
                class="text-white inline-block align-bottom max-w-[560px] truncate"
                :title="result.outputDir"
            >
              {{ result.outputDir }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button
                class="px-4 py-2 rounded-lg bg-primary hover:bg-primaryDark transition text-white disabled:opacity-50"
                :disabled="!inputDir || working"
                @click="run"
            >
              {{ working ? 'Processing…' : 'Trim Images' }}
            </button>
            <button
                class="px-4 py-2 rounded-lg bg-[#0e1530] border border-border text-white hover:bg-[#111a36] transition disabled:opacity-50"
                :disabled="working"
                @click="reset"
            >
              Reset
            </button>
          </div>
        </div>

        <!-- Progress + Results -->
        <div class="px-5 pb-5 overflow-auto">
          <!-- Progress -->
          <div v-if="working || progress.total > 0" class="mt-4">
            <div class="flex justify-between text-sm text-subtext mb-2">
              <span>Progress</span>
              <span>{{ progress.done }} / {{ progress.total }}</span>
            </div>
            <div class="w-full h-3 rounded-full bg-[#0e1530] overflow-hidden border border-border">
              <div
                  class="h-full bg-accent transition-all"
                  :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <!-- Reserve space and truncate filename to prevent flicker -->
            <p class="text-xs text-subtext mt-2 h-4 leading-4">
              <template v-if="currentFile">
                Processing:
                <span
                    class="text-white inline-block align-bottom max-w-[720px] truncate"
                    :title="currentFile"
                >
                  {{ currentFile }}
                </span>
              </template>
            </p>
          </div>

          <!-- Results -->
          <div v-if="result" class="mt-6 bg-[#0e1530] border border-border rounded-xl p-4">
            <h4 class="text-white font-medium mb-2">Summary</h4>
            <ul class="text-sm text-subtext space-y-1">
              <li>Processed: <span class="text-white">{{ result.processed }}</span></li>
              <li>Skipped: <span class="text-white">{{ result.skipped }}</span></li>
            </ul>
            <div v-if="result.errors?.length" class="mt-3">
              <h5 class="text-white font-medium mb-1">Errors</h5>
              <ul class="text-xs max-h-40 overflow-auto space-y-1">
                <li v-for="(e, idx) in result.errors" :key="idx" class="text-red-300">
                  <span class="inline-block align-bottom max-w-[760px] truncate" :title="e.file">
                    {{ e.file }}
                  </span>
                  — {{ e.message }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer class="text-center text-xs text-subtext mt-4">
        Made with ❤️ by Istvan Drahos
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';

const inputDir = ref<string | null>(null);
const mode = ref<'overwrite' | 'subfolder'>('subfolder');
const concurrency = ref<number>(4);
const threshold = ref<number>(0);
const working = ref(false);
const result = ref<any>(null);

const dragOver = ref(false);
const progress = ref<{ total: number; done: number }>({ total: 0, done: 0 });
const currentFile = ref<string | null>(null);
const stats = ref<{ total: number }>({ total: 0 });

const progressPercent = computed(() => {
  if (progress.value.total === 0) return 0;
  return Math.min(100, Math.round((progress.value.done / progress.value.total) * 100));
});

function reset() {
  result.value = null;
  progress.value = { total: 0, done: 0 };
  currentFile.value = null;
  stats.value = { total: 0 };
}

async function chooseFolder() {
  const dir = await window.api.pickFolder();
  if (dir) {
    inputDir.value = dir;
    result.value = null;
    stats.value = { total: 0 };
  }
}

function onDragOver(e: DragEvent) {
  e.dataTransfer!.dropEffect = 'copy';
  dragOver.value = true;
}
function onDragLeave() {
  dragOver.value = false;
}
async function onDrop(e: DragEvent) {
  dragOver.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const firstPath = (files[0] as any).path as string;
    if (firstPath) {
      const isDir = !/\.[^\\/]+$/.test(firstPath);
      inputDir.value = isDir ? firstPath : firstPath.replace(/[/\\][^/\\]+$/, '');
      result.value = null;
      progress.value = { total: 0, done: 0 };
    }
  }
}

let offProgress: null | (() => void) = null;

onMounted(() => {
  offProgress = window.api.onProgress((p: { total: number; done: number; currentFile: string | null }) => {
    if (typeof p.total === 'number') progress.value.total = p.total;
    if (typeof p.done === 'number') progress.value.done = p.done;
    currentFile.value = p.currentFile || null;
    stats.value.total = progress.value.total;
  });
});

onBeforeUnmount(() => {
  if (offProgress) offProgress();
});

async function run() {
  if (!inputDir.value) return;
  working.value = true;
  result.value = null;
  progress.value = { total: 0, done: 0 };
  currentFile.value = null;

  try {
    const res = await window.api.trimImages({
      inputDir: inputDir.value,
      mode: mode.value,
      concurrency: concurrency.value,
      threshold: threshold.value
    });
    result.value = res;
  } catch (e: any) {
    result.value = { processed: 0, skipped: 0, errors: [{ file: '-', message: e?.message || String(e) }] };
  } finally {
    working.value = false;
  }
}
</script>

<style scoped>
/* No custom CSS required; Tailwind utilities handle styling. */
</style>
