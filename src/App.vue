<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <!-- First row: Title and controls -->
        <div class="header-top">
          <h1>IMTEC-MAIL Mail trace tool</h1>
          <div class="header-controls">
            <div class="systems-selector">
              <label class="system-option" v-for="system in availableSystems" :key="system.id">
                <input
                  type="checkbox"
                  v-model="selectedSystems"
                  :value="system.id"
                >
                <span class="system-label">{{ system.label }}</span>
              </label>
            </div>
            <div class="mode-switch">
              <label class="switch-label">
                <span class="mode-text">{{ isAdvancedMode ? 'Advanced Mode' : 'Basic Mode' }}</span>
                <div class="switch">
                  <input 
                    type="checkbox" 
                    v-model="isAdvancedMode"
                    :aria-label="isAdvancedMode ? 'Switch to Basic Mode' : 'Switch to Advanced Mode'"
                  >
                  <span class="slider"></span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Second row: Form -->
        <div class="header-form">
          <form @submit.prevent="handleSubmit" class="search-form">
            <div class="form-row">
              <!-- Show From and To only in Basic Mode -->
              <template v-if="!isAdvancedMode">
                <base-input
                  id="from"
                  v-model="formData.from"
                  label="From"
                  type="email"
                  placeholder="sender@example.com"
                  :validation-rules="{ required: false, email: true }"
                  @validation-error="handleValidationError"
                />

                <base-input
                  id="to"
                  v-model="formData.to"
                  label="To"
                  type="email"
                  placeholder="recipient@example.com"
                  :validation-rules="{ required: false, email: true }"
                  @validation-error="handleValidationError"
                />
              </template>

              <!-- Show Message-ID only in Advanced Mode -->
              <template v-else>
                <base-input
                  id="messageId"
                  v-model="formData.messageId"
                  label="Message-ID"
                  type="text"
                  placeholder="Enter Message ID"
                  :validation-rules="{ required: false }"
                  @validation-error="handleValidationError"
                />
              </template>

              <base-input
                id="startDate"
                v-model="formData.startDate"
                label="Start Date"
                type="date"
                :validation-rules="{
                  required: true,
                  minDate: minDate,
                  maxDate: today,
                  custom: validateStartDate
                }"
                @validation-error="handleValidationError"
              />

              <base-input
                id="endDate"
                v-model="formData.endDate"
                label="End Date"
                type="date"
                :validation-rules="{
                  required: true,
                  minDate: formData.startDate || minDate,
                  maxDate: maxDate,
                  custom: validateEndDate
                }"
                @validation-error="handleValidationError"
              />

              <div class="submit-group">
                <button 
                  type="submit" 
                  :disabled="isLoading || hasValidationErrors"
                  class="submit-button"
                >
                  <span v-if="isLoading" class="loader"></span>
                  <span v-else>Search</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="content-wrapper">
        <!-- Add two-column layout -->
        <div class="content-grid">
          <!-- Left column (75%) -->
          <div class="main-column">
            <!-- This will be for future content -->
            <div class="placeholder-content">
              <div class="results-header">
                <h3>Results</h3>
                <div class="filters">
                  <select 
                    v-model="filters.system" 
                    class="filter-select"
                    @change="applyFilters"
                  >
                    <option value="">All Systems</option>
                    <option 
                      v-for="system in availableSystemOptions" 
                      :key="system" 
                      :value="system"
                    >
                      {{ system }}
                    </option>
                  </select>

                  <select 
                    v-model="filters.status" 
                    class="filter-select"
                    @change="applyFilters"
                  >
                    <option value="">All Statuses</option>
                    <option 
                      v-for="status in availableStatusOptions" 
                      :key="status" 
                      :value="status"
                    >
                      {{ status }}
                    </option>
                  </select>

                  <select 
                    v-model="filters.route" 
                    class="filter-select"
                    @change="applyFilters"
                  >
                    <option value="">All Routes</option>
                    <option 
                      v-for="route in availableRouteOptions" 
                      :key="route" 
                      :value="route"
                    >
                      {{ route }}
                    </option>
                  </select>

                  <div class="filter-input">
                    <input 
                      type="text" 
                      v-model="filters.messageId" 
                      placeholder="Filter by Message ID"
                      @input="applyFilters"
                      class="message-id-filter"
                    >
                  </div>

                  <button 
                    class="clear-filters" 
                    @click="clearFilters"
                    v-if="hasActiveFilters"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              <!-- Add top pagination -->
              <div v-if="searchResults.length" class="pagination-controls top">
                <div class="rows-per-page">
                  <label>
                    Rows per page:
                    <select 
                      v-model="pagination.rowsPerPage"
                      @change="changeRowsPerPage"
                      class="rows-select"
                    >
                      <option 
                        v-for="option in pagination.rowsPerPageOptions" 
                        :key="option" 
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </label>
                </div>

                <div class="pagination-info">
                  {{ paginationInfo }}
                </div>

                <div class="pagination-buttons">
                  <button 
                    @click="changePage(1)" 
                    :disabled="pagination.currentPage === 1"
                    class="page-button"
                  >
                    ⟪
                  </button>
                  <button 
                    @click="changePage(pagination.currentPage - 1)" 
                    :disabled="pagination.currentPage === 1"
                    class="page-button"
                  >
                    ‹
                  </button>
                  
                  <span class="page-number">{{ pagination.currentPage }} / {{ totalPages }}</span>
                  
                  <button 
                    @click="changePage(pagination.currentPage + 1)" 
                    :disabled="pagination.currentPage === totalPages"
                    class="page-button"
                  >
                    ›
                  </button>
                  <button 
                    @click="changePage(totalPages)" 
                    :disabled="pagination.currentPage === totalPages"
                    class="page-button"
                  >
                    ⟫
                  </button>
                </div>
              </div>

              <div v-if="searchResults.length" class="results-table">
                <table>
                  <thead>
                    <tr>
                      <th @click="sortBy('system')" class="sortable" :class="{ active: sortConfig.key === 'system' }">
                        System
                        <span class="sort-indicator" v-if="sortConfig.key === 'system'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('received')" class="sortable" :class="{ active: sortConfig.key === 'received' }">
                        Received
                        <span class="sort-indicator" v-if="sortConfig.key === 'received'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('fromEnv')" class="sortable" :class="{ active: sortConfig.key === 'fromEnv' }">
                        From (Env)
                        <span class="sort-indicator" v-if="sortConfig.key === 'fromEnv'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('fromHdr')" class="sortable" :class="{ active: sortConfig.key === 'fromHdr' }">
                        From (Hdr)
                        <span class="sort-indicator" v-if="sortConfig.key === 'fromHdr'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('to')" class="sortable" :class="{ active: sortConfig.key === 'to' }">
                        To
                        <span class="sort-indicator" v-if="sortConfig.key === 'to'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('subject')" class="sortable" :class="{ active: sortConfig.key === 'subject' }">
                        Subject
                        <span class="sort-indicator" v-if="sortConfig.key === 'subject'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('attachments')" class="sortable" :class="{ active: sortConfig.key === 'attachments' }">
                        Attachments
                        <span class="sort-indicator" v-if="sortConfig.key === 'attachments'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('senderIP')" class="sortable" :class="{ active: sortConfig.key === 'senderIP' }">
                        Sender IP
                        <span class="sort-indicator" v-if="sortConfig.key === 'senderIP'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('route')" class="sortable" :class="{ active: sortConfig.key === 'route' }">
                        Route
                        <span class="sort-indicator" v-if="sortConfig.key === 'route'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('id')" class="sortable" :class="{ active: sortConfig.key === 'id' }">
                        ID
                        <span class="sort-indicator" v-if="sortConfig.key === 'id'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('sent')" class="sortable" :class="{ active: sortConfig.key === 'sent' }">
                        Sent
                        <span class="sort-indicator" v-if="sortConfig.key === 'sent'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th @click="sortBy('status')" class="sortable" :class="{ active: sortConfig.key === 'status' }">
                        Status
                        <span class="sort-indicator" v-if="sortConfig.key === 'status'">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                      <th class="details-column">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(email, index) in paginatedResults" :key="index">
                      <td>
                        <span class="system-badge" :class="email.system.toLowerCase()">
                          {{ email.system }}
                        </span>
                      </td>
                      <td>{{ email.received }}</td>
                      <td>{{ email.fromEnv }}</td>
                      <td>{{ email.fromHdr }}</td>
                      <td>{{ email.to }}</td>
                      <td>{{ email.subject }}</td>
                      <td>
                        <span class="attachment-icon" v-if="email.attachments">📎</span>
                      </td>
                      <td>{{ email.senderIP }}</td>
                      <td>{{ email.route }}</td>
                      <td>{{ email.id }}</td>
                      <td>{{ email.sent }}</td>
                      <td>
                        <span class="status-badge" :class="email.status.toLowerCase()">
                          {{ email.status }}
                        </span>
                      </td>
                      <td class="details-column">
                        <button 
                          class="details-button" 
                          @click="showDetails(email.id)"
                          title="Show more details"
                        >
                          <span class="details-icon">ℹ</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Add bottom pagination controls -->
                <div class="pagination-controls bottom">
                  <div class="rows-per-page">
                    <label>
                      Rows per page:
                      <select 
                        v-model="pagination.rowsPerPage"
                        @change="changeRowsPerPage"
                        class="rows-select"
                      >
                        <option 
                          v-for="option in pagination.rowsPerPageOptions" 
                          :key="option" 
                          :value="option"
                        >
                          {{ option }}
                        </option>
                      </select>
                    </label>
                  </div>

                  <div class="pagination-info">
                    {{ paginationInfo }}
                  </div>

                  <div class="pagination-buttons">
                    <button 
                      @click="changePage(1)" 
                      :disabled="pagination.currentPage === 1"
                      class="page-button"
                    >
                      ⟪
                    </button>
                    <button 
                      @click="changePage(pagination.currentPage - 1)" 
                      :disabled="pagination.currentPage === 1"
                      class="page-button"
                    >
                      ‹
                    </button>
                    
                    <span class="page-number">{{ pagination.currentPage }} / {{ totalPages }}</span>
                    
                    <button 
                      @click="changePage(pagination.currentPage + 1)" 
                      :disabled="pagination.currentPage === totalPages"
                      class="page-button"
                    >
                      ›
                    </button>
                    <button 
                      @click="changePage(totalPages)" 
                      :disabled="pagination.currentPage === totalPages"
                      class="page-button"
                    >
                      ⟫
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="no-results">
                No results found
              </div>
            </div>
          </div>

          <!-- Right column (25%) -->
          <div class="side-column">
            <!-- Request Preview -->
            <div class="json-preview">
              <h3>Request Preview</h3>
              <pre>{{ formattedPayload }}</pre>
            </div>

            <!-- Response Preview -->
            <div class="json-preview response-preview">
              <h3>Response Preview</h3>
              <div class="endpoint-info" :class="{ 'mock-warning': isMockEndpoint }">
                {{ endpointInfo }}
              </div>
              <pre>{{ formattedResponse }}</pre>
            </div>

            <div v-if="error" class="error-message" role="alert">
              {{ error }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="app-footer">
      <p>Developed by Dani for training purposes</p>
    </footer>

    <!-- Add the error modal -->
    <div v-if="modalError" class="error-modal" role="alert">
      {{ modalError }}
    </div>

    <!-- Add this modal component after the error modal -->
    <div v-if="showDetailsModal" class="details-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Message Details</h3>
          <button class="close-button" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body">
          <pre>{{ selectedMessageDetails }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseInput from './components/BaseInput.vue'
import { mockEmailData } from './mocks/emailData.js'
import { mockMessageDetails } from './mocks/messageDetails.js'

export default {
  name: 'App',
  components: {
    BaseInput
  },
  data() {
    const today = new Date().toISOString().split('T')[0]
    // Calculate yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    return {
      isAdvancedMode: false,
      isLoading: false,
      error: null,
      formErrors: [],
      emailPattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
      selectedSystems: ['seg', 'exchange'], // Default selected systems
      availableSystems: [
        { id: 'seg', label: 'SEG' },
        { id: 'encryption', label: 'Encryption Portal' },
        { id: 'exchange', label: 'Exchange' },
        { id: 'postfix', label: 'Postfix' }
      ],
      formData: {
        from: '',
        to: '',
        startDate: yesterdayStr,
        endDate: today,
        messageId: ''
      },
      isFormExpanded: true,
      today,
      modalError: null, // Add new data property for modal error
      modalErrorTimeout: null, // For managing the timeout
      searchResults: [], // Add this for storing results
      mockResponse: mockEmailData,
      sortConfig: {
        key: null,
        direction: 'asc'
      },
      pagination: {
        currentPage: 1,
        rowsPerPage: 5,
        rowsPerPageOptions: [5, 10, 25, 50, 100]
      },
      filters: {
        system: '',
        status: '',
        route: '',
        messageId: ''
      },
      showDetailsModal: false,
      selectedMessageId: null,
      selectedMessageDetails: null
    }
  },
  computed: {
    minDate() {
      const date = new Date()
      date.setDate(date.getDate() - 90)
      return date.toISOString().split('T')[0]
    },
    maxDate() {
      return new Date().toISOString().split('T')[0]
    },
    formattedPayload() {
      const payload = this.isAdvancedMode 
        ? {
            ...this.getBasicPayload(),
            messageId: this.formData.messageId,
            systems: this.selectedSystems
          }
        : {
            ...this.getBasicPayload(),
            systems: this.selectedSystems
          }
      return JSON.stringify(payload, null, 2)
    },
    formattedResponse() {
      if (this.error) {
        return JSON.stringify({
          error: true,
          message: this.error,
          timestamp: new Date().toISOString()
        }, null, 2)
      }
      
      if (!this.searchResults.length) return 'No response data'
      
      if (this.searchResults[0]?.error) {
        return JSON.stringify({
          error: true,
          message: this.searchResults[0].message,
          timestamp: this.searchResults[0].timestamp,
          requestPayload: this.searchResults[0].requestPayload
        }, null, 2)
      }
      
      const response = {
        data: [{
          trackedEmails: this.searchResults
        }]
      }
      return JSON.stringify(response, null, 2)
    },
    hasValidationErrors() {
      return this.formErrors.length > 0
    },
    apiEndpoint() {
      const endpoint = process.env.VUE_APP_API_ENDPOINT;
      if (!endpoint || endpoint === 'your_api_endpoint_here') {
        console.warn('API endpoint not configured. Please check .env file.');
        return null;
      }
      return endpoint;
    },
    messageDetailsEndpoint() {
      const endpoint = process.env.VUE_APP_MESSAGE_DETAILS_ENDPOINT;
      if (!endpoint || endpoint === 'your_message_details_endpoint_here') {
        console.warn('Message details endpoint not configured. Please check .env file.');
        return null;
      }
      return endpoint;
    },
    formSummary() {
      const parts = []
      
      if (this.formData.from || this.formData.to) {
        const fromTo = []
        if (this.formData.from) fromTo.push(`From: ${this.formData.from}`)
        if (this.formData.to) fromTo.push(`To: ${this.formData.to}`)
        parts.push(fromTo.join(', '))
      }

      if (this.formData.startDate && this.formData.endDate) {
        parts.push(`Date Range: ${this.formData.startDate} to ${this.formData.endDate}`)
      }

      if (this.isAdvancedMode && this.formData.messageId) {
        parts.push(`Message-ID: ${this.formData.messageId}`)
      }

      if (this.selectedSystems.length > 0) {
        const systemLabels = this.selectedSystems.map(id => 
          this.availableSystems.find(s => s.id === id)?.label
        ).filter(Boolean)
        parts.push(`Systems: ${systemLabels.join(', ')}`)
      }

      return parts.length > 0 
        ? parts.join(' | ') 
        : 'No criteria specified'
    },
    fromToDisabled() {
      return !!this.formData.messageId;
    },
    messageIdDisabled() {
      return !!(this.formData.from || this.formData.to);
    },
    sortedResults() {
      const results = [...this.filteredResults]
      if (!this.sortConfig.key) return results

      return results.sort((a, b) => {
        let aVal = a[this.sortConfig.key]
        let bVal = b[this.sortConfig.key]

        // Handle case-insensitive string comparison
        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()

        if (aVal < bVal) return this.sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return this.sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    },
    paginatedResults() {
      const start = (this.pagination.currentPage - 1) * this.pagination.rowsPerPage
      const end = start + this.pagination.rowsPerPage
      return this.sortedResults.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.sortedResults.length / this.pagination.rowsPerPage)
    },
    paginationInfo() {
      const start = (this.pagination.currentPage - 1) * this.pagination.rowsPerPage + 1
      const end = Math.min(start + this.pagination.rowsPerPage - 1, this.sortedResults.length)
      return `Showing ${start}-${end} of ${this.sortedResults.length} results`
    },
    hasActiveFilters() {
      return Object.values(this.filters).some(value => value !== '')
    },
    filteredResults() {
      return this.searchResults.filter(email => {
        const matchesSystem = !this.filters.system || email.system === this.filters.system
        const matchesStatus = !this.filters.status || email.status === this.filters.status
        const matchesRoute = !this.filters.route || email.route === this.filters.route
        const matchesMessageId = !this.filters.messageId || 
          email.id.toLowerCase().includes(this.filters.messageId.toLowerCase())

        return matchesSystem && matchesStatus && matchesRoute && matchesMessageId
      })
    },
    availableSystemOptions() {
      const currentResults = this.searchResults.filter(email => {
        // Apply all filters except system
        const matchesStatus = !this.filters.status || email.status === this.filters.status
        const matchesRoute = !this.filters.route || email.route === this.filters.route
        const matchesMessageId = !this.filters.messageId || 
          email.id.toLowerCase().includes(this.filters.messageId.toLowerCase())

        return matchesStatus && matchesRoute && matchesMessageId
      })
      const systems = new Set(currentResults.map(email => email.system))
      return [...systems].sort()
    },
    availableStatusOptions() {
      const currentResults = this.searchResults.filter(email => {
        // Apply all filters except status
        const matchesSystem = !this.filters.system || email.system === this.filters.system
        const matchesRoute = !this.filters.route || email.route === this.filters.route
        const matchesMessageId = !this.filters.messageId || 
          email.id.toLowerCase().includes(this.filters.messageId.toLowerCase())

        return matchesSystem && matchesRoute && matchesMessageId
      })
      const statuses = new Set(currentResults.map(email => email.status))
      return [...statuses].sort()
    },
    availableRouteOptions() {
      const currentResults = this.searchResults.filter(email => {
        // Apply all filters except route
        const matchesSystem = !this.filters.system || email.system === this.filters.system
        const matchesStatus = !this.filters.status || email.status === this.filters.status
        const matchesMessageId = !this.filters.messageId || 
          email.id.toLowerCase().includes(this.filters.messageId.toLowerCase())

        return matchesSystem && matchesStatus && matchesMessageId
      })
      const routes = new Set(currentResults.map(email => email.route))
      return [...routes].sort()
    },
    isMockEndpoint() {
      return !this.apiEndpoint || 
             this.apiEndpoint === 'your_api_endpoint_here' ||
             this.apiEndpoint.includes('your-actual-api-endpoin.com') ||
             this.apiEndpoint.includes('localhost');  // Add this check if you want localhost to use mock data
    },
    endpointInfo() {
      if (!this.apiEndpoint) {
        return 'Endpoint not defined, it will use mock data'
      }
      if (this.apiEndpoint.includes('localhost')) {
        return 'Using localhost endpoint, it will use mock data'
      }
      if (this.apiEndpoint === 'your_api_endpoint_here') {
        return 'Endpoint not configured, it will use mock data'
      }
      return `API Endpoint: ${this.apiEndpoint}`
    }
  },
  methods: {
    validateEndDate(value) {
      if (this.formData.startDate && value) {
        const startDate = new Date(this.formData.startDate)
        const endDate = new Date(value)
        if (endDate < startDate) {
          return 'End Date cannot be earlier than Start Date'
        }
      }
      return null
    },
    validateStartDate(value) {
      if (value) {
        const inputDate = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time part for accurate date comparison
        
        if (inputDate > today) {
          return 'Start Date cannot be in the future'
        }
      }
      return null
    },
    
    handleValidationError(fieldId, hasError, errorMessage) {
      if (hasError) {
        if (!this.formErrors.includes(fieldId)) {
          this.formErrors.push(fieldId)
        }
        // Show error in modal
        this.showModalError(errorMessage)
      } else {
        this.formErrors = this.formErrors.filter(id => id !== fieldId)
      }
    },

    showModalError(message) {
      // Clear any existing timeout
      if (this.modalErrorTimeout) {
        clearTimeout(this.modalErrorTimeout)
      }
      
      // Show new error
      this.modalError = message
      
      // Set timeout to clear error
      this.modalErrorTimeout = setTimeout(() => {
        this.modalError = null
      }, 3000)
    },

    async handleSubmit() {
      if (this.hasValidationErrors) {
        const firstErrorField = document.getElementById(this.formErrors[0])
        if (firstErrorField) {
          firstErrorField.focus()
        }
        return
      }

      this.error = null;
      this.isLoading = true;
      this.searchResults = [];
      
      try {
        if (this.isMockEndpoint) {
          // Use mock data when endpoint is not properly defined
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
          this.searchResults = this.mockResponse.data[0].trackedEmails;
        } else {
          const payload = this.isAdvancedMode 
            ? {
                ...this.getBasicPayload(),
                messageId: this.formData.messageId || '*',
                systems: this.selectedSystems
              }
            : {
                ...this.getBasicPayload(),
                systems: this.selectedSystems
              };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

          try {
            const response = await fetch(this.apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.searchResults = data.data[0].trackedEmails;
          } catch (error) {
            if (error.name === 'AbortError') {
              throw new Error('Request timeout after 15 seconds');
            }
            throw error;
          } finally {
            clearTimeout(timeoutId);
          }
        }
      } catch (error) {
        console.error('Error details:', error);
        this.error = `Error: ${error.message || 'An error occurred while fetching the data. Please try again.'}`;
        
        // Update response preview to show error
        this.searchResults = [{
          error: true,
          message: error.message || 'An error occurred while fetching the data',
          timestamp: new Date().toISOString(),
          requestPayload: this.formattedPayload
        }];
      } finally {
        this.isLoading = false;
      }
    },
    getBasicPayload() {
      return {
        from: this.formData.from || '*',
        to: this.formData.to || '*',
        startDate: this.formData.startDate,
        endDate: this.formData.endDate
      }
    },
    toggleForm() {
      this.isFormExpanded = !this.isFormExpanded
    },
    sortBy(key) {
      if (this.sortConfig.key === key) {
        // If already sorting by this key, toggle direction
        this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc'
      } else {
        // New sort key, set to ascending
        this.sortConfig.key = key
        this.sortConfig.direction = 'asc'
      }
    },
    changePage(page) {
      this.pagination.currentPage = page
    },
    changeRowsPerPage(event) {
      this.pagination.rowsPerPage = parseInt(event.target.value)
      this.pagination.currentPage = 1 // Reset to first page when changing rows per page
    },
    applyFilters() {
      this.pagination.currentPage = 1 // Reset to first page when filters change
    },
    clearFilters() {
      this.filters = {
        system: '',
        status: '',
        route: '',
        messageId: ''
      }
      this.applyFilters()
    },
    async showDetails(messageId) {
      this.selectedMessageId = messageId;
      this.showDetailsModal = true;
      
      try {
        if (this.isMockEndpoint) {
          await new Promise(resolve => setTimeout(resolve, 300));
          this.selectedMessageDetails = mockMessageDetails(messageId);
        } else {
          const response = await fetch(`${this.messageDetailsEndpoint}/${messageId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          this.selectedMessageDetails = await response.json();
        }
      } catch (error) {
        console.error('Error fetching message details:', error);
        this.selectedMessageDetails = {
          error: true,
          message: `Failed to load details for message ${messageId}: ${error.message}`
        };
      }
    },
    closeDetailsModal() {
      this.showDetailsModal = false;
      this.selectedMessageId = null;
      this.selectedMessageDetails = null;
    }
  },
  watch: {
    'formData.messageId': {
      handler(newValue) {
        if (newValue) {
          // Clear From and To fields when Message-ID is entered
          this.formData.from = '';
          this.formData.to = '';
          
          // Clear any validation errors for From and To
          this.formErrors = this.formErrors.filter(id => id !== 'from' && id !== 'to');
        }
      }
    },
    'formData.from': {
      handler(newValue) {
        if (newValue && this.formData.messageId) {
          // Clear Message-ID when From is entered
          this.formData.messageId = '';
          this.formErrors = this.formErrors.filter(id => id !== 'messageId');
        }
      }
    },
    'formData.to': {
      handler(newValue) {
        if (newValue && this.formData.messageId) {
          // Clear Message-ID when To is entered
          this.formData.messageId = '';
          this.formErrors = this.formErrors.filter(id => id !== 'messageId');
        }
      }
    },
    isAdvancedMode: {
      handler(newValue) {
        if (newValue) {
          // When switching to advanced mode
          this.formData.from = '*'
          this.formData.to = '*'
          this.formData.messageId = ''  // Clear message ID when switching to advanced mode
          // Clear any validation errors for these fields
          this.formErrors = this.formErrors.filter(id => id !== 'from' && id !== 'to')
        } else {
          // When switching back to basic mode
          this.formData.from = ''
          this.formData.to = ''
          this.formData.messageId = '*'  // Set message ID to wildcard in basic mode
          // Clear any validation errors
          this.formErrors = this.formErrors.filter(id => id !== 'messageId')
        }
      }
    },
    'sortedResults.length'() {
      // Reset to first page when results change
      this.pagination.currentPage = 1
    }
  },
  // Replace beforeDestroy with beforeUnmount
  beforeUnmount() {
    if (this.modalErrorTimeout) {
      clearTimeout(this.modalErrorTimeout)
    }
  }
}
</script>

<style>
:root {
  --primary-color: #2196F3;
  --primary-hover: #1976D2;
  --error-color: #f44336;
  --text-color: #2c3e50;
  --border-color: #ddd;
  --background-color: #f5f5f5;
  --card-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

#app {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  background-color: var(--background-color);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  box-shadow: var(--card-shadow);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--primary-color);
}

.main-content {
  position: relative;
  padding-top: 280px;
  min-height: calc(100vh - 280px);
  flex: 1;
}

.content-wrapper {
  max-width: none;
  margin: 0;
  padding: 0 1rem 0 2rem;
}

.form-container {
  background: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  margin-bottom: 2rem;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--border-color);
  background-color: #f8f9fa;
  transition: background-color 0.2s;
}

.form-header:hover {
  background-color: #f1f3f5;
}

.collapse-button {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text-color);
  transition: transform 0.3s ease;
}

.collapse-button.collapsed {
  transform: rotate(-180deg);
}

.collapsible-content {
  max-height: 1000px; /* Adjust based on your form's maximum height */
  transition: max-height 0.3s ease-in-out;
  overflow: hidden;
}

.collapsible-content:not(.expanded) {
  max-height: 0;
}

.section-title {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-color);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-form {
  padding: 0.5rem 0;
}

.search-form {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
}

.form-row > * {
  flex: 1;
  min-width: 0;
}

.submit-group {
  flex: 0 0 auto;
  width: auto;
  margin-bottom: 0.5rem;
}

.submit-button {
  height: 40px;
  padding: 0 1.5rem;
  white-space: nowrap;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  opacity: 0.7;
}

.mode-switch {
  display: flex;
  align-items: center;
}

.switch-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 500;
  cursor: pointer;
}

.mode-text {
  font-size: 0.875rem;
  color: var(--text-color);
}

.switch {
  position: relative;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.json-preview {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  font-size: 0.875rem;
  max-height: calc(100vh - 450px);
  overflow-y: auto;
}

.json-preview h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.json-preview pre {
  font-size: 0.75rem;
  line-height: 1.4;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

.error-message {
  background-color: var(--error-color);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  text-align: center;
  font-size: 0.875rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.systems-selector {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.system-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.system-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.system-label {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-summary {
  font-size: 0.875rem;
  color: var(--text-color);
  opacity: 0.8;
  font-weight: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .form-row {
    gap: 1.5rem;
  }

  .form-row > * {
    flex: 1 1 calc(33.333% - 1rem);
    min-width: 200px;
  }

  .submit-group {
    flex: 0 0 auto;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 300px;
  }

  .header-content {
    padding: 1rem;
  }

  .header-top {
    flex-direction: column;
    gap: 1rem;
  }

  .form-row > * {
    flex: 1 1 100%;
  }

  .submit-group {
    width: 100%;
  }

  .submit-button {
    width: 100%;
  }

  .content-wrapper {
    padding: 0 1rem;
  }

  .side-column {
    position: static;
    margin-top: 1rem;
  }

  .json-preview {
    max-height: none;
  }
}

/* Add these styles for disabled inputs */
.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Update form styles for inline labels */
.form-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  flex-wrap: nowrap;
  min-width: 250px;
}

.form-label {
  font-size: 0.875rem;
  margin: 0;
  white-space: nowrap;
  width: auto;
  flex: 0 0 auto;
}

.form-input {
  padding: 0.5rem;
  font-size: 0.875rem;
  height: 36px;
  flex: 1;
  min-width: 0;
}

/* Update header spacing */
.header-top {
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
}

/* Update main content padding */
.main-content {
  padding-top: 140px;
}

/* Update responsive styles */
@media (max-width: 1200px) {
  .form-group {
    min-width: 280px;
  }
}

@media (max-width: 768px) {
  .form-group {
    width: 100%;
  }

  .form-row {
    flex-direction: column;
    gap: 1rem;
  }

  .form-row > * {
    width: 100%;
  }
}

/* Add specific styles for date inputs */
.form-group[data-type="date"] {
  min-width: 200px; /* Smaller minimum width for date fields */
  max-width: 200px; /* Maximum width for date fields */
}

.form-group[data-type="date"] .form-input {
  width: 130px; /* Fixed width for date input */
  flex: none; /* Override flex: 1 */
}

/* Update email/text input styles to take remaining space */
.form-group[data-type="email"],
.form-group[data-type="text"] {
  flex: 1;
  min-width: 280px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  align-items: start;
}

.main-column {
  min-height: 200px; /* Temporary, remove when adding content */
}

.side-column {
  position: sticky;
  top: 400px;
  height: fit-content;
  margin-top: 4rem;
  margin-right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Add gap between previews */
}

.json-preview {
  max-height: calc((100vh - 500px) / 2); /* Split available space */
}

.response-preview {
  margin-top: 1rem;
}

.placeholder-content {
  margin-top: 4rem; /* Match the margin-top of side-column */
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
}

/* Update responsive styles */
@media (max-width: 768px) {
  .placeholder-content {
    margin-top: 1rem; /* Reduce margin on mobile */
  }
}

.error-modal {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--error-color);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  max-width: 90%;
  text-align: center;
  animation: modalEnter 0.4s ease-out, modalExit 0.4s ease-in 2.6s;
}

@keyframes modalEnter {
  0% {
    transform: translate(-50%, -100px);
    opacity: 0;
  }
  60% {
    transform: translate(-50%, 10px);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes modalExit {
  0% {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  60% {
    transform: translate(-50%, 10px);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -100px);
    opacity: 0;
  }
}

.results-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  white-space: nowrap;
}

tr:hover {
  background-color: #f8f9fa;
}

.system-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.75rem;
}

.system-badge.exchange {
  background-color: #e3f2fd;
  color: #1565c0;
}

.system-badge.mimecast {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.system-badge.echoworx {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.75rem;
}

.status-badge.delivered {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.held {
  background-color: #fff3e0;
  color: #e65100;
}

.status-badge.bounced {
  background-color: #ffebee;
  color: #c62828;
}

.attachment-icon {
  font-size: 1rem;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 1.5rem;
}

.sortable:hover {
  background-color: #edf2f7;
}

.sortable.active {
  background-color: #e2e8f0;
}

.sort-indicator {
  position: absolute;
  right: 0.5rem;
  color: var(--primary-color);
}

th.sortable::after {
  content: '↕';
  position: absolute;
  right: 0.5rem;
  opacity: 0.3;
}

th.sortable:hover::after {
  opacity: 0.7;
}

th.sortable.active::after {
  display: none;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background-color: #f8f9fa;
}

.rows-per-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.rows-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  font-size: 0.875rem;
}

.pagination-info {
  font-size: 0.875rem;
  color: #666;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-button {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-button:hover:not(:disabled) {
  background-color: #edf2f7;
}

.page-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  padding: 0 0.5rem;
  font-size: 0.875rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  font-size: 0.875rem;
  min-width: 120px;
}

.message-id-filter {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.875rem;
  width: 150px;
}

.clear-filters {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
  transition: all 0.2s;
}

.clear-filters:hover {
  background-color: #e9ecef;
}

@media (max-width: 1200px) {
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .filter-select,
  .message-id-filter {
    width: 100%;
    min-width: 0;
  }
}

.endpoint-info {
  font-size: 0.75rem;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
  border-radius: 4px;
  background-color: #e3f2fd;
  color: #1565c0;
}

.endpoint-info.mock-warning {
  background-color: #fff3e0;
  color: #e65100;
}

.app-footer {
  margin-top: 4rem;
  padding: 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: #666;
  border-top: 1px solid var(--border-color);
  background-color: #f8f9fa;
}

/* Add styles for top pagination */
.pagination-controls.top {
  border-top: none;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

/* Update responsive styles */
@media (max-width: 768px) {
  .pagination-controls.top {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .pagination-controls.top .pagination-buttons {
    justify-content: center;
  }

  .pagination-controls.top .rows-per-page {
    justify-content: center;
  }

  .pagination-controls.top .pagination-info {
    text-align: center;
  }
}

.details-column {
  width: 50px;
  text-align: center !important;
}

.details-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.details-button:hover {
  background-color: #e2e8f0;
}

.details-icon {
  font-size: 1rem;
  color: var(--primary-color);
}

.details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1rem;
}

.modal-body pre {
  white-space: pre-wrap;
  font-size: 0.875rem;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
  transition: color 0.2s;
}

.close-button:hover {
  color: #000;
}
</style>
