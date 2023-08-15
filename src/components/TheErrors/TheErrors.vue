<script setup lang="ts">
// Components
import ErrorItem from '@/components/TheErrors/ErrorItem.vue'
import { useErrorLogStore } from '@/stores/errorLogStore'
import { computed } from 'vue'

// Stores
const { errors, remove, removeAll } = useErrorLogStore()

const errorsList = computed(
  () => errors.value.map((e, index) => ({ id: index, error: e })),
)

</script>

<template>
  <v-card class="the-errors">
    <div class="no-error" v-if="!errors.length">
      No Error
    </div>

    <template v-else>
      <div class="actions">
        <v-btn
          color="secondary"
          @click="removeAll"
        >
          Remove all
        </v-btn>
      </div>

      <div class="errors-list-ctn scrollable">
        <ErrorItem
          v-for="error in errorsList.slice().reverse()"
          :key="`error-${error.id}-${Date.now()}`"
          class="error-item"
          :custom-error="error.error"
          @remove="remove(error.id)"
        />
      </div>
    </template>
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

  .actions {
    display: flex;
    justify-content: end;
    margin: 5px;
    padding-bottom: 5px;
    border-bottom: 1px solid $grey-8;
  }

  .errors-list-ctn {
    padding: 20px;
    display: flex;
    flex-direction: column;

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
