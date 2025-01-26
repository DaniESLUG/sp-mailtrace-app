<template>
  <div class="form-group" :data-type="type">
    <label :for="id" class="form-label">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      class="form-input"
      :class="{ 'error': showError }"
      v-bind="$attrs"
      :disabled="disabled"
      :title="disabled ? getDisabledMessage() : ''"
      ref="input"
    >
  </div>
</template>

<script>
export default {
  name: 'BaseInput',
  props: {
    id: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    validationRules: {
      type: Object,
      default: () => ({})
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'validation-error'],
  data() {
    return {
      touched: false,
      error: ''
    }
  },
  computed: {
    showError() {
      return this.touched && this.error
    },
    errorMessage() {
      return this.error
    },
    getDisabledMessage() {
      if (this.type === 'email') {
        return 'This field is disabled when Message-ID is provided';
      }
      return 'This field is disabled when From/To is provided';
    }
  },
  methods: {
    handleInput(event) {
      this.$emit('update:modelValue', event.target.value)
      this.validate(event.target.value)
    },
    handleBlur() {
      this.touched = true
      this.validate(this.modelValue)
    },
    handleFocus() {
      // Optional: Clear error on focus
      // this.error = ''
      // this.$emit('validation-error', this.id, false)
    },
    focus() {
      this.$refs.input.focus()
    },
    validate(value) {
      this.error = ''
      let hasError = false
      let errorMessage = ''
      
      if (this.validationRules.required && !value) {
        errorMessage = `${this.label} is required`
        this.error = errorMessage
        hasError = true
      } else if (this.validationRules.email && value) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(value)) {
          errorMessage = `Please enter a valid email address`
          this.error = errorMessage
          hasError = true
        }
      } else if (this.validationRules.minDate && value) {
        const minDate = new Date(this.validationRules.minDate)
        const inputDate = new Date(value)
        if (inputDate < minDate) {
          errorMessage = `Date cannot be earlier than ${this.validationRules.minDate}`
          this.error = errorMessage
          hasError = true
        }
      } else if (this.validationRules.maxDate && value) {
        const maxDate = new Date(this.validationRules.maxDate)
        const inputDate = new Date(value)
        if (inputDate > maxDate) {
          errorMessage = `Date cannot be later than ${this.validationRules.maxDate}`
          this.error = errorMessage
          hasError = true
        }
      }

      if (this.validationRules.custom) {
        const customError = this.validationRules.custom(value)
        if (customError) {
          errorMessage = customError
          this.error = errorMessage
          hasError = true
        }
      }

      this.$emit('validation-error', this.id, hasError, errorMessage)
    }
  },
  watch: {
    validationRules: {
      deep: true,
      handler() {
        this.validate(this.modelValue)
      }
    }
  }
}
</script>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.form-input.error {
  border-color: var(--error-color);
}

.form-input.error:focus {
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-input:disabled:hover {
  border-color: var(--border-color);
}
</style> 