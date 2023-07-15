<script setup lang="ts">
// Stores
import { useAlertStore } from '@/stores/alertStore'

// Components
import ErrorAlert from '@/components/TheErrors/ErrorAlert.vue'

// Stores
const { errorsList } = useAlertStore()

</script>

<template>
  <v-card class="the-errors">
    <div class="no-error" v-if="!errorsList.length">
      No Error
    </div>

    <div class="errors-list-ctn scrollable">
      <template v-for="(errorAlert) in errorsList" :key="errorAlert.id">
        <ErrorAlert class="error-alert-item" :error-alert="errorAlert" />
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

    .error-alert-item {
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
