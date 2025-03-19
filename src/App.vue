<template>
  <div id="app">
    <header class="app-header">
      <div class="header-content">
        <!-- First row: Title and controls -->
        <div class="header-top">
          <h1>IMTEC-MAIL Mail trace tool</h1>
          <div class="header-controls">
            <div class="systems-selector">
              <div v-for="system in availableSystems" 
                   :key="system.id" 
                   class="checkbox-wrapper">
                <input 
                  type="checkbox" 
                  :id="'system-' + system.id"
                  v-model="selectedSystems"
                  :value="system.id"
                  class="checkbox-input"
                >
                <label 
                  :for="'system-' + system.id"
                  class="checkbox-label"
                >
                  {{ system.label }}
                </label>
              </div>
            </div>
            <div class="mode-switch">
              <div class="switch-wrapper">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    v-model="isAdvancedMode"
                    id="mode-switch"
                  >
                  <span class="switch-slider"></span>
                </label>
                <span class="checkbox-label">
                  {{ isAdvancedMode ? 'Advanced Mode' : 'Basic Mode' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Second row: Form -->
        <div class="header-form">
          <form @submit.prevent="handleSubmit" class="search-form">
            <div class="form-row">
              <!-- Show From and To only in Basic Mode -->
              <template v-if="!isAdvancedMode">
                <div class="form-group">
                  <label for="from" class="form-label">From</label>
                  <input
                    id="from"
                    v-model="formData.from"
                    type="email"
                    placeholder="sender@example.com"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.includes('from') }"
                  >
                </div>

                <div class="form-group">
                  <label for="to" class="form-label">To</label>
                  <input
                    id="to"
                    v-model="formData.to"
                    type="email"
                    placeholder="recipient@example.com"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.includes('to') }"
                  >
                </div>
              </template>

              <!-- Show Message-ID only in Advanced Mode -->
              <template v-else>
                <div class="form-group">
                  <label for="messageId" class="form-label">Message-ID</label>
                  <input
                    id="messageId"
                    v-model="formData.messageId"
                    type="text"
                    placeholder="Enter Message ID"
                    class="form-control"
                    :class="{ 'is-invalid': formErrors.includes('messageId') }"
                  >
                </div>
              </template>

              <div class="form-group">
                <label for="startDate" class="form-label">Start Date</label>
                <input
                  id="startDate"
                  v-model="formData.startDate"
                  type="date"
                  :min="minDate"
                  :max="today"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.includes('startDate') }"
                >
              </div>

              <div class="form-group">
                <label for="endDate" class="form-label">End Date</label>
                <input
                  id="endDate"
                  v-model="formData.endDate"
                  type="date"
                  :min="formData.startDate || minDate"
                  :max="maxDate"
                  class="form-control"
                  :class="{ 'is-invalid': formErrors.includes('endDate') }"
                >
              </div>

              <div class="submit-group">
                <button
                  type="submit"
                  :disabled="isLoading || hasValidationErrors"
                  class="btn btn-primary"
                  @click="handleSubmit"
                >
                  <span v-if="isLoading" class="spinner-border"></span>
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
        <div class="content-grid">
          <div class="main-column">
            <div class="placeholder-content">
              <div class="results-header">
                <h3>Results</h3>
                <div class="filters">
                  <BFormSelect
                    v-model="filters.system"
                    :options="[{ value: '', text: 'All Systems' }, ...availableSystemOptions.map(system => ({ value: system, text: system }))]"
                    class="filter-select"
                    @change="applyFilters"
                  />

                  <BFormSelect
                    v-model="filters.status"
                    :options="[{ value: '', text: 'All Statuses' }, ...availableStatusOptions.map(status => ({ value: status, text: status }))]"
                    class="filter-select"
                    @change="applyFilters"
                  />

                  <BFormSelect
                    v-model="filters.route"
                    :options="[{ value: '', text: 'All Routes' }, ...availableRouteOptions.map(route => ({ value: route, text: route }))]"
                    class="filter-select"
                    @change="applyFilters"
                  />

                  <BFormInput
                    v-model="filters.messageId"
                    placeholder="Filter by Message ID"
                    @input="applyFilters"
                    class="message-id-filter"
                  />

                  <div class="column-selector">
                    <button 
                      class="btn btn-outline-secondary btn-sm"
                      @click="toggleColumnSelector"
                    >
                      Columns
                    </button>
                    <div v-if="showColumnSelector" class="column-dropdown">
                      <div class="column-header">
                        <label class="column-checkbox">
                          <input 
                            type="checkbox" 
                            :checked="allColumnsSelected"
                            @change="toggleAllColumns"
                          >
                          Select All
                        </label>
                      </div>
                      <div class="column-divider"></div>
                      <div class="column-list">
                        <label 
                          v-for="column in availableColumns"
                          :key="column.key"
                          class="column-checkbox"
                        >
                          <input 
                            type="checkbox"
                            :checked="visibleColumns.includes(column.key)"
                            :disabled="defaultColumns.includes(column.key)"
                            @change="toggleColumn(column.key)"
                          >
                          {{ column.label }}
                          <span 
                            v-if="defaultColumns.includes(column.key)"
                            class="required-badge"
                          >
                            Required
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <BButton
                    v-if="hasActiveFilters"
                    variant="outline-secondary"
                    @click="clearFilters"
                    class="clear-filters"
                  >
                    Clear Filters
                  </BButton>
                </div>
              </div>

              <!-- Add top pagination -->
              <div v-if="searchResults.length" class="pagination-controls top">
                <BFormGroup
                  label="Rows per page:"
                  label-for="rows-per-page"
                  label-cols="auto"
                  class="mb-0"
                >
                  <BFormSelect
                    id="rows-per-page"
                    v-model="pagination.rowsPerPage"
                    :options="pagination.rowsPerPageOptions.map(option => ({ value: option, text: option }))"
                    @change="changeRowsPerPage"
                    class="rows-select"
                  />
                </BFormGroup>

                <div class="pagination-info">
                  {{ paginationInfo }}
                </div>

                <div class="pagination-buttons">
                  <button 
                    @click="pagination.currentPage--" 
                    :disabled="pagination.currentPage === 1"
                    class="pagination-btn"
                  >
                    <span class="pagination-icon">←</span>
                  </button>
                  <span class="pagination-info">
                    Page {{ pagination.currentPage }} of {{ totalPages }}
                  </span>
                  <button 
                    @click="pagination.currentPage++" 
                    :disabled="pagination.currentPage === pagination.totalPages"
                    class="pagination-btn"
                  >
                    <span class="pagination-icon">→</span>
                  </button>
                </div>
              </div>

              <div v-if="searchResults.length" class="results-table">
                <table class="table">
                  <thead>
                    <tr>
                      <th v-for="column in availableColumns" 
                          :key="column.key"
                          v-show="visibleColumns.includes(column.key)"
                          @click="sortBy(column.key)"
                          :class="{ 
                            sortable: column.sortable, 
                            active: sortConfig.key === column.key,
                            [column.class]: column.class 
                          }"
                      >
                        {{ column.label }}
                        <span class="sort-indicator" v-if="sortConfig.key === column.key">
                          {{ sortConfig.direction === 'asc' ? '↑' : '↓' }}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(email, index) in paginatedResults" :key="index">
                      <td v-for="column in availableColumns" 
                          :key="column.key"
                          v-show="visibleColumns.includes(column.key)"
                          :class="column.class"
                      >
                        <template v-if="column.key === 'system'">
                          <span class="badge" :class="email.system.toLowerCase()">
                            {{ email.system }}
                          </span>
                        </template>
                        <template v-else-if="column.key === 'status'">
                          <span class="badge" :class="email.status.toLowerCase()">
                            {{ email.status }}
                          </span>
                        </template>
                        <template v-else-if="column.key === 'attachments'">
                          <span class="attachment-icon" v-if="email.attachments">📎</span>
                        </template>
                        <template v-else-if="column.key === 'details'">
                          <button 
                            class="btn btn-link" 
                            @click="showDetails(email.id)"
                            title="Show more details"
                          >
                            <span class="details-icon">ℹ</span>
                          </button>
                        </template>
                        <template v-else>
                          {{ email[column.key] }}
                        </template>
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
                      @click="pagination.currentPage--" 
                      :disabled="pagination.currentPage === 1"
                      class="pagination-btn"
                    >
                      <span class="pagination-icon">←</span>
                    </button>
                    <span class="pagination-info">
                      Page {{ pagination.currentPage }} of {{ totalPages }}
                    </span>
                    <button 
                      @click="pagination.currentPage++" 
                      :disabled="pagination.currentPage === pagination.totalPages"
                      class="pagination-btn"
                    >
                      <span class="pagination-icon">→</span>
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

          
        </div>
        <div class="side-column">
            <!-- Request Preview -->
            <div class="preview-column">
              <div class="preview-section">
                <div class="preview-header" @click="toggleRequestPreview">
                  <h3>Request Preview</h3>
                  <span class="toggle-icon">{{ isRequestPreviewOpen ? '▼' : '▶' }}</span>
                </div>
                <div class="json-preview request-preview" v-show="isRequestPreviewOpen">
                  <pre>{{ formattedPayload }}</pre>
                </div>
              </div>

              <div class="preview-section">
                <div class="preview-header" @click="toggleResponsePreview">
                  <h3>Response Preview</h3>
                  <span class="toggle-icon">{{ isResponsePreviewOpen ? '▼' : '▶' }}</span>
                </div>
                <div class="json-preview response-preview" v-show="isResponsePreviewOpen">
                  <div class="endpoint-info" :class="{ 'mock-warning': isMockEndpoint }">
                    {{ endpointInfo }}
                  </div>
                  <pre>{{ formattedResponse }}</pre>
                </div>
              </div>
            </div>

            <div v-if="error" class="error-message" role="alert">
              {{ error }}
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

    <!-- Replace the details modal with a custom modal -->
    <div v-if="showDetailsModal" class="modal-backdrop" @click="closeDetailsModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Message Details</h3>
          <button class="modal-close" @click="closeDetailsModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="message-details-content">
            <pre>{{ selectedMessageDetails }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mockEmailData } from './mocks/emailData.js'
import { mockMessageDetails } from './mocks/messageDetails.js'

export default {
  name: 'App',
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
      selectedMessageDetails: null,
      isRequestPreviewOpen: false,
      isResponsePreviewOpen: false,
      showColumnSelector: false,
      defaultColumns: ['system', 'received', 'fromEnv', 'to', 'subject', 'status', 'details'],
      visibleColumns: ['system', 'received', 'fromEnv', 'to', 'subject', 'status', 'details'],
      availableColumns: [
        { key: 'system', label: 'System', sortable: true },
        { key: 'received', label: 'Received', sortable: true },
        { key: 'fromEnv', label: 'From (Env)', sortable: true },
        { key: 'fromHdr', label: 'From (Hdr)', sortable: true },
        { key: 'to', label: 'To', sortable: true },
        { key: 'subject', label: 'Subject', sortable: true },
        { key: 'attachments', label: 'Attachments', sortable: true },
        { key: 'senderIP', label: 'Sender IP', sortable: true },
        { key: 'route', label: 'Route', sortable: true },
        { key: 'id', label: 'ID', sortable: true },
        { key: 'sent', label: 'Sent', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'details', label: 'Details', sortable: false, class: 'details-column' }
      ]
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
    },
    allColumnsSelected() {
      return this.visibleColumns.length === this.availableColumns.length
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

          const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          this.searchResults = data.data[0].trackedEmails;
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
        // Reset columns to default on new search
        this.visibleColumns = [...this.defaultColumns]
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
    },
    handleEscapeKey(event) {
      if (event.key === 'Escape' && this.showDetailsModal) {
        this.closeDetailsModal();
      }
    },
    toggleRequestPreview() {
      this.isRequestPreviewOpen = !this.isRequestPreviewOpen;
    },
    toggleResponsePreview() {
      this.isResponsePreviewOpen = !this.isResponsePreviewOpen;
    },
    toggleColumnSelector() {
      this.showColumnSelector = !this.showColumnSelector
    },
    toggleAllColumns() {
      if (this.allColumnsSelected) {
        this.visibleColumns = [...this.defaultColumns]
      } else {
        this.visibleColumns = this.availableColumns.map(col => col.key)
      }
    },
    toggleColumn(key) {
      if (this.visibleColumns.includes(key)) {
        this.visibleColumns = this.visibleColumns.filter(k => k !== key)
      } else {
        this.visibleColumns.push(key)
      }
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleEscapeKey);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleEscapeKey);
    if (this.modalErrorTimeout) {
      clearTimeout(this.modalErrorTimeout);
    }
  }
}
</script>

<style>
:root {
  --primary-color: #0d6efd;
  --primary-hover: #0b5ed7;
  --error-color: #dc3545;
  --text-color: #212529;
  --border-color: #dee2e6;
  --background-color: #f8f9fa;
  --card-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
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
  position: relative;
  width: 100%;
  z-index: 100;
  padding: 0.75rem 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--primary-color);
}

.main-content {
  position: relative;
  padding-top: 2rem;
  min-height: calc(100vh - 100px);
  flex: 1;
}

.content-wrapper {
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
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
  padding: 0.75rem 0;
  background-color: white;
  width: 100%;
}

.search-form {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.form-row > * {
  flex: 1;
  min-width: 180px;
}

.form-group {
  margin-bottom: 0.75rem;
  width: 100%;
}

.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: var(--text-color);
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.submit-group {
  display: flex;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}

.submit-button {
  height: 32px;
  padding: 0 1rem;
  white-space: nowrap;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
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
  gap: 0.5rem;
  margin-bottom: 0;
}

.form-check-input {
  margin-top: 0;
  cursor: pointer;
}

.form-check-label {
  cursor: pointer;
  user-select: none;
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
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin: 0.5rem 0;
}

.systems-selector {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  margin-right: 0.75rem;
}

.system-option {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
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
    padding-top: 1rem;
  }

  .header-content {
    padding: 0 1rem;
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
  margin-bottom: 1rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

/* Update input styles */
.form-control {
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

/* Update button styles */
.btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
  border-color: var(--primary-hover);
}

/* Update checkbox styles */
.form-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.form-check-input {
  margin-top: 0;
}

/* Update select styles */
.form-select {
  border-radius: 0.375rem;
  border: 1px solid var(--border-color);
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  background-color: white;
}

/* Update table styles */
.table {
  margin-bottom: 0;
}

.table th {
  background-color: var(--background-color);
  font-weight: 600;
  border-bottom: 2px solid var(--border-color);
}

.table td {
  vertical-align: middle;
}

/* Update badge styles */
.badge {
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 600;
  border-radius: 0.25rem;
}

/* Update dropdown styles */
.dropdown-menu {
  border: 1px solid var(--border-color);
  box-shadow: var(--card-shadow);
  padding: 0.5rem;
}

.dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Update pagination styles */
.pagination {
  margin-bottom: 0;
}

.page-link {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: var(--primary-color);
}

.page-item.active .page-link {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

/* Update modal styles */
.modal-content {
  border-radius: 0.5rem;
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  border-bottom: 1px solid var(--border-color);
  padding: 1rem;
}

.modal-body {
  padding: 1rem;
}

/* Update spinner styles */
.spinner-border {
  width: 1rem;
  height: 1rem;
  border-width: 0.15em;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .form-row > * {
    flex: 1 1 calc(50% - 0.5rem);
  }
}

@media (max-width: 768px) {
  .form-row > * {
    flex: 1 1 100%;
  }
  
  .header-content {
    padding: 0 1rem;
  }
  
  .header-top {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Custom utility classes */
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cursor-pointer {
  cursor: pointer;
}

/* Keep existing custom styles for specific components */
.system-badge,
.status-badge,
.attachment-icon,
.details-button,
.details-icon {
  /* Keep these styles as they are specific to your application */
}

/* Update preview section styles */
.preview-section {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  margin-bottom: 1rem;
}

.preview-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--background-color);
  border-radius: 0.5rem 0.5rem 0 0;
}

/* Keep the rest of your custom styles that are specific to your application */

.content-grid {
  display: grid;
  grid-template-columns: 75% 25%;
  gap: 2rem;
  margin-top: 2rem;
}

.main-column {
  background: white;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.side-column {
  background: white;
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  position: sticky;
  top: 2rem;
  height: fit-content;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .side-column {
    position: static;
    margin-top: 2rem;
  }
}

.message-details-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
}

.message-details-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.875rem;
  line-height: 1.5;
}

.modal-lg {
  max-width: 900px;
}

.modal-content {
  border-radius: 0.5rem;
  border: none;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.modal-header {
  border-bottom: 1px solid var(--border-color);
  padding: 1rem;
}

.modal-body {
  padding: 1rem;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1050;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1055;
  width: 90%;
  max-width: 800px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--text-color);
}

.modal-body {
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.message-details-content {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 1rem;
}

.message-details-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.875rem;
  line-height: 1.5;
  font-family: monospace;
}

/* Table styles */
.results-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.results-table th,
.results-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.results-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  cursor: pointer;
}

.results-table th:hover {
  background-color: #e9ecef;
}

.results-table tr:hover {
  background-color: #f8f9fa;
}

/* Badge styles */
.system-badge,
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.system-badge.seg { background-color: #e3f2fd; color: #1976d2; }
.system-badge.exchange { background-color: #f3e5f5; color: #7b1fa2; }
.system-badge.encryption { background-color: #e8f5e9; color: #388e3c; }
.system-badge.postfix { background-color: #fff3e0; color: #f57c00; }

.status-badge.delivered { background-color: #e8f5e9; color: #388e3c; }
.status-badge.failed { background-color: #ffebee; color: #d32f2f; }
.status-badge.pending { background-color: #fff3e0; color: #f57c00; }

/* Responsive adjustments */
@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }

  .form-row > * {
    flex: 1 1 100%;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>
