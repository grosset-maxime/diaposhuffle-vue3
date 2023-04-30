<script setup lang="ts">
// TODO: Enh: Show pin icon when mouse is moving, else hide them.

// Types
import { Position } from '@/interfaces/components/PinWrapper'
import type { CSSProperties } from 'vue'

// Vendors Libs
import { computed } from 'vue'

// Props
interface Props {
  isPined?: boolean
  iconPosition?: Position
  iconTop?: number
  iconLeft?: number
  iconRight?: number
  iconBottom?: number
  showIcon?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  isPined: false,
  iconPosition: Position.topRight,
  iconTop: NaN,
  iconLeft: NaN,
  iconRight: NaN,
  iconBottom: NaN,
  showIcon: false,
})

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'mouseover', event: MouseEvent): void;
  (e: 'mouseout', event: MouseEvent): void;
}>()

// Computeds
const positionClasses = computed<Array<string>>(() => {
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

const positionStyles = computed<CSSProperties>(() => {
  const styles: CSSProperties = {}

  if (props.iconTop) {
    styles.top = `${props.iconTop}px`
  }
  if (props.iconBottom) {
    styles.bottom = `${props.iconBottom}px`
  }
  if (props.iconLeft) {
    styles.left = `${props.iconLeft}px`
  }
  if (props.iconRight) {
    styles.right = `${props.iconRight}px`
  }

  return styles
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
      v-show="showIcon"
      class="pin-icon"
      :class="positionClasses"
      :style="positionStyles"
      icon
      small
      @click="emit('click')"
      @keyup.prevent
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
      color: $grey-5;

      &:hover {
        transform: scale(1);
        color: $grey-4;
      }
    }
  }

  .pin-icon {
    display: none;
    position: absolute;
    cursor: pointer;
    z-index: 1000;
    opacity: 0.7;
    background: #{$grey-8 + '55'};

    &:hover {
      opacity: 1;
    }

    &.pos-center {
      left: 50%;
    }

    &.pos-top {
      top: -$pin-icon-size;
    }

    &.pos-bottom {
      bottom: -$pin-icon-size;
    }

    &.pos-right {
      right: -$pin-icon-size;
    }

    &.pos-left {
      left: -$pin-icon-size;
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
