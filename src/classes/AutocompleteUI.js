/**
 * AutocompleteUI - Manages autocomplete dropdowns and interaction
 * Provides visual suggestions as user types
 */

class AutocompleteUI {
  constructor() {
    this.activeDropdown = null;
    this.selectedIndex = -1;
    this.suggestions = [];
    this.currentInput = null;
    this.onSelectCallback = null;

    this.initAutocompleteListeners();
  }

  /**
   * Initialize autocomplete for all relevant fields
   */
  initAutocompleteListeners() {
    // Pick field
    const pickField = document.getElementById('pick');
    if (pickField) {
      pickField.addEventListener('input', (e) => this.handleInputChange(e, 'pick'));
      pickField.addEventListener('keydown', (e) => this.handleKeydown(e));
      pickField.addEventListener('blur', () => {
        setTimeout(() => this.closeDropdown(), 200);
      });
    }

    // Spread team field
    const spreadTeamField = document.getElementById('spreadTeam');
    if (spreadTeamField) {
      spreadTeamField.addEventListener('change', () => this.closeDropdown());
    }

    // Player name field
    const playerNameField = document.getElementById('playerName');
    if (playerNameField) {
      playerNameField.addEventListener('input', (e) => this.handleInputChange(e, 'playerName'));
      playerNameField.addEventListener('keydown', (e) => this.handleKeydown(e));
      playerNameField.addEventListener('blur', () => {
        setTimeout(() => this.closeDropdown(), 200);
      });
    }

    // Prop type field - show typical props
    const propTypeField = document.getElementById('propType');
    if (propTypeField) {
      propTypeField.addEventListener('focus', (e) => this.handlePropTypeClick(e));
      propTypeField.addEventListener('input', (e) => this.handleInputChange(e, 'propType'));
      propTypeField.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
  }

  /**
   * Handle input change and show suggestions
   */
  handleInputChange(e, fieldType) {
    const input = e.target.value.trim();
    this.currentInput = e.target;

    // Get sport and bet type for context
    const sport = document.getElementById('sport')?.value || '';
    const betType = document.getElementById('betType')?.value || '';

    let suggestions = [];

    // Get suggestions based on field type
    if (fieldType === 'pick') {
      suggestions = suggestionEngine.getSuggestionsForPick(input, sport, betType);
    } else if (fieldType === 'playerName') {
      suggestions = suggestionEngine.getPlayerSuggestions(input, sport);
    } else if (fieldType === 'propType') {
      const typicalProps = suggestionEngine.getTypicalProps(sport);
      if (input) {
        suggestions = typicalProps.filter(p =>
          p.toLowerCase().includes(input.toLowerCase())
        );
      } else {
        suggestions = typicalProps;
      }
    }

    this.showDropdown(suggestions, e.target, fieldType);
  }

  /**
   * Handle prop type click to show all available props
   */
  handlePropTypeClick(e) {
    if (e.target.value === '') {
      const sport = document.getElementById('sport')?.value || '';
      const suggestions = suggestionEngine.getTypicalProps(sport);
      this.showDropdown(suggestions, e.target, 'propType');
    }
  }

  /**
   * Handle keyboard navigation in dropdown
   */
  handleKeydown(e) {
    if (!this.activeDropdown || this.suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectNext();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.selectPrevious();
        break;

      case 'Enter':
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          this.selectItem(this.selectedIndex);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  /**
   * Show autocomplete dropdown with suggestions
   */
  showDropdown(suggestions, inputElement, fieldType) {
    this.suggestions = suggestions;

    // Close existing dropdown
    this.closeDropdown();

    if (suggestions.length === 0) {
      return;
    }

    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'autocomplete-dropdown';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1000';

    // Create suggestions list
    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = suggestion;
      item.dataset.index = index;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectItem(index);
      });

      item.addEventListener('mouseenter', () => {
        this.setSelectedItem(index);
      });

      dropdown.appendChild(item);
    });

    // Position dropdown below input
    const rect = inputElement.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;

    document.body.appendChild(dropdown);
    this.activeDropdown = dropdown;
    this.selectedIndex = -1;
  }

  /**
   * Close the autocomplete dropdown
   */
  closeDropdown() {
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
      this.selectedIndex = -1;
      this.suggestions = [];
    }
  }

  /**
   * Select next item in dropdown
   */
  selectNext() {
    this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
    this.setSelectedItem(this.selectedIndex);
  }

  /**
   * Select previous item in dropdown
   */
  selectPrevious() {
    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
    if (this.selectedIndex >= 0) {
      this.setSelectedItem(this.selectedIndex);
    }
  }

  /**
   * Set visual selection on an item
   */
  setSelectedItem(index) {
    // Clear previous selection
    const items = this.activeDropdown?.querySelectorAll('.autocomplete-item') || [];
    items.forEach(item => item.classList.remove('selected'));

    // Set new selection
    if (index >= 0 && index < items.length) {
      items[index].classList.add('selected');
      this.selectedIndex = index;
    }
  }

  /**
   * Select an item and populate the input
   */
  selectItem(index) {
    if (index < 0 || index >= this.suggestions.length) {
      return;
    }

    const suggestion = this.suggestions[index];
    if (this.currentInput) {
      this.currentInput.value = suggestion;
      this.currentInput.focus();

      // Trigger input event for form manager
      const event = new Event('input', { bubbles: true });
      this.currentInput.dispatchEvent(event);
    }

    this.closeDropdown();
  }
}

// Create CSS styles for autocomplete
const autocompleteSyles = `
.autocomplete-dropdown {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.autocomplete-item {
  padding: 10px 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-size: 13px;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
  background: rgba(0, 214, 143, 0.1);
  color: var(--primary);
  padding-left: 16px;
}
`;

// Inject autocomplete styles
const styleElement = document.createElement('style');
styleElement.textContent = autocompleteStyles;
document.head.appendChild(styleElement);

// Initialize autocomplete UI
let autocompleteUI;
document.addEventListener('DOMContentLoaded', () => {
  autocompleteUI = new AutocompleteUI();
});
