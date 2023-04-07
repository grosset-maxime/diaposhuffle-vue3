<script setup lang="ts">
// TODO: Enh: Show pin icon when mouse is moving, else hide them.

// Types
import { Position } from '@/interfaces/components/PinWrapper'

// Vendors Libs
import { computed } from 'vue'

// Props
interface Props {
  isPined?: boolean;
  iconPosition?: Position;
  iconTop?: number;
  iconLeft?: number;
}
const props = withDefaults(defineProps<Props>(), {
  isPined: false,
  iconPosition: Position.topRight,
  iconTop: 0,
  iconLeft: 0,
})

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'mouseover', event: MouseEvent): void;
  (e: 'mouseout', event: MouseEvent): void;
}>()

// Computeds
const positionClasses = computed(() => {
  const classes = []
  if (props.iconPosition.includes(Position.middle)) {
    classes.push('pos-center')
  }
  if (props.iconPosition.includes(Position.top)) {
    classes.push('pos-top')
  }
  if (props.iconPosition.includes(Position.bottom)) {
    classes.push('pos-bottom')
  }
  if (props.iconPosition.includes(Position.right)) {
    classes.push('pos-right')
  }
  if (props.iconPosition.includes(Position.left)) {
    classes.push('pos-left')
  }
  return classes
})
</script>

<template>
  <div
    :class="[
      'pin-wrapper',
      {
        pined: props.isPined,
      },
    ]"
    @mouseover="emit('mouseover', $event)"
    @mouseout="emit('mouseout', $event)"
  >
    <v-btn
      :class="['pin-icon', ...positionClasses]"
      :style="{
        top: props.iconTop,
        left: props.iconLeft,
      }"
      icon
      small
      @click="emit('click')"
    >
      <v-icon small class="icon">
        {{ props.isPined ? 'mdi-pin-outline' : 'mdi-pin-off-outline' }}
      </v-icon>
    </v-btn>
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.pin-wrapper {
  $pin-icon-size: 28px;

  &:hover {
    .pin-icon {
      display: block;
    }
  }

  &.pined {
    .pin-icon {
      display: block;
      transform: scale(0.7);
      color: $grey-6;

      &:hover {
        transform: scale(1);
        color: $grey-5;
      }
    }
  }

  .pin-icon {
    display: none;
    position: absolute;
    cursor: pointer;
    z-index: 1000;
    opacity: 0.6;

    &:hover {
      opacity: 1;
    }

    &.pos-center {
      left: 50%;
    }

    &.pos-top {
      top: math.div(-$pin-icon-size, 2);
    }

    &.pos-bottom {
      bottom: math.div(-$pin-icon-size, 2);
    }

    &.pos-right {
      right: math.div(-$pin-icon-size, 2);
    }

    &.pos-left {
      left: math.div(-$pin-icon-size, 2);
    }

    &.pos-top.pos-right .icon {
      transform: rotate(45deg);
    }

    &.pos-top.pos-left .icon {
      transform: rotate(-45deg);
    }

    &.pos-bottom.pos-left .icon {
      transform: rotate(225deg);
    }

    &.pos-bottom.pos-right .icon {
      transform: rotate(135deg);
    }

    &.pose .icon {
      transform: rotate(45deg);
      color: $grey-5;
    }
  }
}
</style>
