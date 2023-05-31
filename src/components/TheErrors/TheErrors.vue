<script setup lang="ts">
// Vendors Libs
import { computed } from 'vue'

// Stores
import { useErrorStore } from '@/stores/errorStore'

// Components
import ErrorItem from '@/components/TheErrors/ErrorItem.vue'

// Stores
const { errors } = useErrorStore()

const errorsIds = computed(() => Array.from(errors.value.keys()))

</script>

<template>
  <v-card class="the-errors">
    <div class="no-error" v-if="!errorsIds.length">
      No Error
    </div>

    <div class="errors-list-ctn">
      <template v-for="(errorId) in errorsIds" :key="errorId">
        <ErrorItem class="error-item" :error-id="errorId" />
      </template>
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
.the-errors {
  height: 100%;
  margin-right: 5px;
  padding-top: 0px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .errors-list-ctn {
    padding: 20px;

    .error-item {
      margin-bottom: 10px;
    }
  }
}

.no-error {
  height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: xxx-large;
    color: $grey-5;
}

.scrollable {
  @include w-scrollbar(auto, hidden);
}
</style>
